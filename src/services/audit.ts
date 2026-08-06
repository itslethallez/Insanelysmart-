import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { people, type Person } from "../db/schema.js";
import {
  calculateAuditFigures,
  type AuditInputs,
  type AuditRecord,
  type LeadCapture,
  type PortalFollowUp,
  type OutcomeValue,
} from "../audit/calculate.js";
import { sendSms } from "./sms.js";
import { saveMessage } from "./messages.js";
import { DEFAULT_TENANT_ID } from "../config/tenant.js";
import { bookSlot, SlotUnavailableError } from "./booking.js";
import type { Slot } from "./availability.js";

/**
 * Upserts a person from Step 1's lead capture alone, before any calculation has run -
 * "Lead details submitted immediately on Step 1" in the spec. `audit` stays null until
 * saveAuditResult runs at the end; a person who never finishes the calculator still leaves
 * a real, contactable lead behind instead of nothing.
 */
export async function saveLeadCapture(lead: LeadCapture): Promise<Person> {
  const [existing] = await db
    .select()
    .from(people)
    .where(and(eq(people.contact, lead.mobile), eq(people.tenantId, DEFAULT_TENANT_ID)))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(people)
      .set({ name: lead.fullName, companyName: lead.companyName || existing.companyName })
      .where(eq(people.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(people)
    .values({
      name: lead.fullName,
      contact: lead.mobile,
      companyName: lead.companyName || undefined,
      source: "audit",
      status: "new",
      tenantId: DEFAULT_TENANT_ID,
    })
    .returning();
  return created;
}

export type SaveAuditParams = {
  inputs: AuditInputs;
};

/**
 * Saves a completed audit, upserting the person by (contact, tenant_id) - the same person
 * row saveLeadCapture created at Step 1, now filled in with the full figures. Figures are
 * always recomputed here from the raw inputs, never trusted from the client, so what's
 * stored is reproducible from the maths in calculate.ts.
 */
export async function saveAuditResult(params: SaveAuditParams): Promise<Person> {
  const figures = calculateAuditFigures(params.inputs);

  // Verification aid: prints the exact working behind the numbers that go in the text-back,
  // so it can be checked by hand against a submission.
  console.log("Audit figures worked out:", {
    hourlyRate: figures.hourlyRate,
    workers: figures.workers,
    jobsPerWeek: figures.jobsPerWeek,
    averageInvoice: figures.averageInvoice,
    totalAdminHoursPerWeek: figures.totalAdminHoursPerWeek,
    annualAdminCost: Math.round(figures.annualAdminCost),
    reminders: figures.reminders
      ? { annualOpportunity: Math.round(figures.reminders.annualOpportunity) }
      : null,
    quoteFollowUp: figures.quoteFollowUp
      ? { annualOpportunity: Math.round(figures.quoteFollowUp.annualOpportunity) }
      : null,
    missedCalls: { annualOpportunity: Math.round(figures.missedCalls.annualOpportunity) },
    totalAnnualBenefit: Math.round(figures.totalAnnualBenefit),
    recommendedPlan: figures.recommendedPlan.plan.name,
  });

  const record: AuditRecord = {
    engineVersion: figures.engineVersion,
    inputs: params.inputs,
    figures,
  };

  const [existing] = await db
    .select()
    .from(people)
    .where(and(eq(people.contact, params.inputs.lead.mobile), eq(people.tenantId, DEFAULT_TENANT_ID)))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(people)
      .set({
        name: params.inputs.lead.fullName,
        companyName: params.inputs.lead.companyName || existing.companyName,
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
      name: params.inputs.lead.fullName,
      contact: params.inputs.lead.mobile,
      companyName: params.inputs.lead.companyName || undefined,
      source: "audit",
      status: "new",
      tenantId: DEFAULT_TENANT_ID,
      audit: record,
      auditCompletedAt: new Date(),
    })
    .returning();
  return created;
}

// Uses the total annual benefit (admin cost + revenue opportunities) - the same figure the
// results screen leads with.
function oneLineSummary(record: AuditRecord): string {
  const dollars = Math.round(record.figures.totalAnnualBenefit).toLocaleString("en-AU");
  return `Your workshop could be losing roughly $${dollars} a year to admin time and missed follow-up.`;
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
 * for the AI workshop review call, keyed by public_token - the calculator's results screen. Reuses
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
      notes: "AI workshop review, booked via the audit calculator",
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
