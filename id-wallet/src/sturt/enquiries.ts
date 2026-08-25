import { getSturtDb } from "./db.js";
import { sturtEnquiries } from "./schema.js";
import { sendSms } from "../services/sms.js";

export type NewEnquiry = {
  parentFirstName: string;
  parentLastName: string;
  /** Already normalized to +61XXXXXXXXX by the caller. */
  mobile: string;
  email: string;
  childFirstName?: string;
  childDob?: string;
  childDueDate?: string;
  daysNeeded?: string;
  preferredStart?: string;
  postcode?: string;
  hearAbout?: string;
};

export type SavedEnquiry = { id: string; createdAt: Date };

/** Saves a new enquiry. Always source: "website-form" - this page has no other entry point yet. */
export async function saveEnquiry(input: NewEnquiry): Promise<SavedEnquiry> {
  const [created] = await getSturtDb()
    .insert(sturtEnquiries)
    .values({ ...input, source: "website-form" })
    .returning({ id: sturtEnquiries.id, createdAt: sturtEnquiries.createdAt });
  return created;
}

/**
 * Sends the parent's confirmation text and a separate alert text to the operator number.
 * Failure-tolerant by design, same principle as the audit tool's text-back: the enquiry is
 * already saved by the time this runs, and a bounced text must never turn a captured lead
 * into a lost one - logged and swallowed, never thrown. Never logs child details; only the
 * parent's first name (already in the SMS body) and non-child fields.
 */
export async function sendEnquiryTexts(input: NewEnquiry): Promise<void> {
  const parentBody = `Hi ${input.parentFirstName}, thanks for your enquiry with Sturt Young Learners. We've got your details and someone will be in touch shortly to arrange a tour. If it's urgent, call us on 08 8296 9329.`;

  try {
    await sendSms(input.mobile, parentBody);
  } catch (err) {
    console.error("Sturt parent text-back failed:", err);
  }

  const alertNumber = process.env.SYL_ALERT_MOBILE;
  if (!alertNumber) {
    console.warn("SYL_ALERT_MOBILE is not set - skipping the operator alert text.");
    return;
  }

  const alertLines = [
    "New Sturt Young Learners enquiry:",
    `${input.parentFirstName} ${input.parentLastName}, ${input.mobile}`,
    input.childDob ? `Child DOB: ${input.childDob}` : input.childDueDate ? `Due date: ${input.childDueDate}` : null,
    input.preferredStart ? `Preferred start: ${input.preferredStart}` : null,
  ].filter((line): line is string => line !== null);

  try {
    await sendSms(alertNumber, alertLines.join("\n"));
  } catch (err) {
    console.error("Sturt operator alert text failed:", err);
  }
}
