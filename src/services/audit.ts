import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { people, type Person } from "../db/schema.js";
import {
  calculateAuditFigures,
  WORKING_WEEKS,
  type AuditInputs,
  type AuditRecord,
  type PortalFollowUp,
  type OutcomeValue,
} from "../audit/calculate.js";
import { getIndustry } from "../audit/industries/index.js";
import { sendSms } from "./sms.js";
import { saveMessage } from "./messages.js";
import { DEFAULT_TENANT_ID } from "../config/tenant.js";
import { bookSlot, SlotUnavailableError } from "./booking.js";
import type { Slot } from "./availability.js";

export type SaveAuditParams = {
  firstName: string;
  mobile: string;
  inputs: AuditInputs;
};

/**
 * Saves a completed audit, upserting the person by (contact, tenant_id). Figures are always
 * recomputed here from the raw inputs, never trusted from the client, so what's stored is
 * reproducible from the maths in calculate.ts. `source` is only set to "audit" for a brand
 * new person - an existing voice/text/web lead keeps its original source on update.
 */
export async function saveAuditResult(params: SaveAuditParams): Promise<Person> {
  const figures = calculateAuditFigures(params.inputs);

  // Temporary verification aid for the SMS bleed-figure fix - prints the exact working behind
  // the numbers that go in the text-back, so it can be checked by hand against a submission.
  console.log("Audit figures worked out:", {
    industryKey: params.inputs.industryKey,
    rate: figures.rate,
    workingWeeks: WORKING_WEEKS,
    totalHoursPerWeek: figures.totalHoursPerWeek,
    bleedHoursAnnual: Math.round(figures.totalHoursPerWeek * WORKING_WEEKS),
    totalBleed: Math.round(figures.totalBleed),
    totalRecovered: Math.round(figures.totalRecovered),
    perTask: figures.tasks.map((t) => ({
      label: t.label,
      hours: t.hours,
      bleed: Math.round(t.bleed),
      recovered: Math.round(t.recovered),
    })),
  });

  const record: AuditRecord = {
    engineVersion: figures.engineVersion,
    inputs: params.inputs,
    figures,
  };

  const [existing] = await db
    .select()
    .from(people)
    .where(and(eq(people.contact, params.mobile), eq(people.tenantId, DEFAULT_TENANT_ID)))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(people)
      .set({
        name: params.firstName,
        audit: record,
        auditCompletedAt: new Date(),
      })
      .where(eq(people.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(people)
    .values({
      name: params.firstName,
      contact: params.mobile,
      source: "audit",
      status: "new",
      tenantId: DEFAULT_TENANT_ID,
      audit: record,
      auditCompletedAt: new Date(),
    })
    .returning();
  return created;
}

// Uses the bleed figures (what it's costing them), matching the black card's own wording -
// not the recovered figures (what a system would save), which is a different number entirely.
function oneLineSummary(record: AuditRecord): string {
  const industry = getIndustry(record.inputs.industryKey);
  const hours = Math.round(record.figures.totalHoursPerWeek * WORKING_WEEKS);
  const dollars = Math.round(record.figures.totalBleed).toLocaleString("en-AU");
  return `For ${industry.name.toLowerCase()} work like this, that's about ${hours} hours a year, worth roughly $${dollars} at your cost of time.`;
}

/**
 * Sends the text-back after a successful audit save. Failure-tolerant on purpose: the audit
 * is already saved by the time this runs, and a Twilio error must never turn a captured lead
 * into a lost one - it's logged (both to the console and as a message row) and swallowed, not
 * thrown, so the caller can still return success regardless of how the send went.
 */
export async function sendAuditTextBack(person: Person, publicUrl: string): Promise<void> {
  if (!person.audit) return;

  const firstName = person.name.split(" ")[0] || person.name;
  const body = `Hi ${firstName}, it's Mick from Insanely Smart. ${oneLineSummary(person.audit)} See your figures any time: ${publicUrl}`;

  try {
    await sendSms(person.contact, body);
    await saveMessage(person.id, "outbound", body);
  } catch (err) {
    console.error("Audit text-back failed:", err);
    await saveMessage(person.id, "outbound", `[SEND FAILED] ${body}`).catch((logErr) => {
      console.error("Also failed to log the failed text-back:", logErr);
    });
  }
}

const POV_ACCEPTED_SMS =
  "Thanks for chatting with Charlie! I will be in touch shortly to lock in your free call.";

export type RecordOutcomeResult = { ok: true } | { ok: false; error: "not_found" };

/**
 * Records the set_outcome tool's result on the person's audit record, keyed by public_token
 * (the only identifier Vapi's server-side webhook has for this call). On pov_accepted, sends
 * the confirmation text - failure-tolerant, same principle as sendAuditTextBack: a bounced SMS
 * must never turn a real caller decision into an error response back to Vapi.
 */
export async function recordCallOutcome(
  publicToken: string,
  outcome: OutcomeValue,
): Promise<RecordOutcomeResult> {
  const person = await getPersonByPublicToken(publicToken);
  if (!person) return { ok: false, error: "not_found" };

  const nextAudit: AuditRecord | null = person.audit
    ? { ...person.audit, outcome: { value: outcome, recordedAt: new Date().toISOString() } }
    : null;

  if (nextAudit) {
    await db.update(people).set({ audit: nextAudit }).where(eq(people.id, person.id));
  }

  if (outcome === "pov_accepted") {
    try {
      await sendSms(person.contact, POV_ACCEPTED_SMS);
      await saveMessage(person.id, "outbound", POV_ACCEPTED_SMS);
    } catch (err) {
      console.error("pov_accepted confirmation text failed:", err);
      await saveMessage(person.id, "outbound", `[SEND FAILED] ${POV_ACCEPTED_SMS}`).catch((logErr) => {
        console.error("Also failed to log the failed confirmation text:", logErr);
      });
    }
  }

  return { ok: true };
}

export type BookPovCallResult =
  | { ok: true }
  | { ok: false; error: "not_found" | "slot_unavailable" };

/**
 * Locks a real slot (the same collision-checked booking transaction the voice/SMS flow uses)
 * for the Proof of Value callback, keyed by public_token - the audit tool's Screen 5. Reuses
 * bookSlot's existing confirmation text (source: "web"), so no separate SMS logic is needed
 * here. businessName, if given, is saved onto the person's record alongside the booking.
 */
export async function bookProofOfValueCall(
  publicToken: string,
  slot: Slot,
  businessName?: string,
): Promise<BookPovCallResult> {
  const person = await getPersonByPublicToken(publicToken);
  if (!person) return { ok: false, error: "not_found" };

  if (businessName) {
    await db.update(people).set({ companyName: businessName }).where(eq(people.id, person.id));
  }

  try {
    await bookSlot(person.id, slot, {
      source: "web",
      notes: "Proof of Value callback, booked via the audit tool",
    });
  } catch (err) {
    if (err instanceof SlotUnavailableError) return { ok: false, error: "slot_unavailable" };
    throw err;
  }

  return { ok: true };
}

/** Looks up a person by their permanent page token, scoped to the tenant. Null if not found. */
export async function getPersonByPublicToken(publicToken: string): Promise<Person | null> {
  const [person] = await db
    .select()
    .from(people)
    .where(and(eq(people.publicToken, publicToken), eq(people.tenantId, DEFAULT_TENANT_ID)))
    .limit(1);
  return person ?? null;
}

export type FollowUpUpdate = {
  companyName?: string;
  address?: string;
  email?: string;
  preferredTimes?: string;
};

/**
 * Saves the details submitted on the person's permanent page (GET /p/:public_token). Resets
 * status to "new" so a do-next item exists even if this person had already moved along the
 * pipeline - submitting fresh details is a real signal someone should follow up.
 */
export async function saveFollowUp(personId: string, update: FollowUpUpdate): Promise<Person> {
  const [existing] = await db.select().from(people).where(eq(people.id, personId)).limit(1);
  if (!existing) {
    throw new Error(`saveFollowUp: no person with id ${personId}`);
  }

  const portalFollowUp: PortalFollowUp = {
    ...(existing.audit?.portalFollowUp ?? {}),
    ...(update.email !== undefined ? { email: update.email } : {}),
    ...(update.preferredTimes !== undefined ? { preferredTimes: update.preferredTimes } : {}),
  };

  const nextAudit: AuditRecord | null = existing.audit
    ? { ...existing.audit, portalFollowUp }
    : null;

  const [updated] = await db
    .update(people)
    .set({
      status: "new",
      ...(update.companyName !== undefined ? { companyName: update.companyName } : {}),
      ...(update.address !== undefined ? { address: update.address } : {}),
      ...(nextAudit ? { audit: nextAudit } : {}),
    })
    .where(eq(people.id, personId))
    .returning();

  return updated;
}
