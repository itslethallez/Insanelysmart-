import { Router } from "express";
import { getNextFreeSlots } from "../services/availability.js";
import { generateSmsReply, formatSlot } from "../services/aiReply.js";
import { upsertLeadByContact, saveLeadDetails } from "../services/people.js";
import { saveMessage } from "../services/messages.js";
import { confirmMeetingForPerson } from "../services/booking.js";
import { parseInbound, sendSms } from "../services/sms/index.js";

export const smsRouter = Router();

const AFFIRMATIVE_WORDS = ["yes", "yep", "yeah", "yup", "confirm", "confirmed", "sure", "ok", "okay"];

/** True if the message's first word is a plain affirmative (e.g. "yes", "yep!", "confirm please"). */
function isAffirmative(body: string): boolean {
  const normalized = body.trim().toLowerCase().replace(/[^a-z\s]/g, "");
  const firstWord = normalized.split(/\s+/)[0] ?? "";
  return AFFIRMATIVE_WORDS.includes(firstWord);
}

/**
 * Sends the reply and never lets a send failure look like a webhook failure. The inbound
 * message and the reply text are already saved by the time this runs - same principle as the
 * audit text-back: a bounced send must never lose a captured message. Sending is now a
 * separate step from receiving the webhook for both providers (Twilio's TwiML-in-response
 * shortcut and ClickSend's send-is-a-separate-call model are unified onto this one shape),
 * so a send failure and a webhook failure are genuinely independent events now.
 */
async function replySafely(personId: string, to: string, body: string): Promise<void> {
  try {
    await sendSms(to, body);
  } catch (err) {
    console.error("SMS reply send failed:", err);
    await saveMessage(personId, "outbound", `[SEND FAILED] ${body}`).catch((logErr) => {
      console.error("Also failed to log the failed SMS send:", logErr);
    });
  }
}

smsRouter.post("/", async (req, res) => {
  const inbound = parseInbound(req.body);

  if (!inbound) {
    res.status(400).json({ error: "Could not read that message." });
    return;
  }

  const { from, body } = inbound;

  const person = await upsertLeadByContact(from);
  await saveMessage(person.id, "inbound", body);

  if (isAffirmative(body)) {
    const confirmed = await confirmMeetingForPerson(person.id);
    if (confirmed) {
      const reply = `You're confirmed for ${formatSlot({
        start: confirmed.startsAt,
        end: confirmed.endsAt,
      })} (Adelaide time). See you then!`;
      await saveMessage(person.id, "outbound", reply);
      await replySafely(person.id, from, reply);
      res.json({ ok: true });
      return;
    }
  }

  if (!person.detailsCaptured && person.status === "booked") {
    await saveLeadDetails(person.id, body);
    const reply = "Thanks! I've passed your company name and address on to Mick.";
    await saveMessage(person.id, "outbound", reply);
    await replySafely(person.id, from, reply);
    res.json({ ok: true });
    return;
  }

  const slots = await getNextFreeSlots(3);
  const reply = await generateSmsReply(body, slots);

  await saveMessage(person.id, "outbound", reply);
  await replySafely(person.id, from, reply);

  res.json({ ok: true });
});
