import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { people, type Person } from "../db/schema.js";
import {
  calculateAuditFigures,
  type AuditInputs,
  type AuditRecord,
  type PortalFollowUp,
  type OutcomeValue,
} from "../audit/calculate.js";
import { getIndustry } from "../audit/industries/index.js";
import { sendSms } from "./sms.js";
import { saveMessage } from "./messages.js";
import { DEFAULT_TENANT_ID } from "../config/tenant.js";

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

function oneLineSummary(record: AuditRecord): string {
  const industry = getIndustry(record.inputs.industryKey);
  const hours = Math.round(record.figures.totalRecoveredHoursAnnual);
  const dollars = Math.round(record.figures.totalRecovered).toLocaleString("en-AU");
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
  const body = `Hi ${firstName}. ${oneLineSummary(person.audit)} See your figures any time: ${publicUrl}`;

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
  "Thanks for chatting with Charlie! Mick will be in touch shortly to lock in your Proof of Value.";

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
