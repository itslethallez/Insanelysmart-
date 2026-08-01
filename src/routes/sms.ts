import { Router } from "express";
import { getNextFreeSlots } from "../services/availability.js";
import { generateSmsReply, formatSlot } from "../services/aiReply.js";
import { upsertLeadByContact } from "../services/people.js";
import { saveMessage } from "../services/messages.js";
import { confirmMeetingForPerson } from "../services/booking.js";

export const smsRouter = Router();

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function twiml(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
}

const AFFIRMATIVE_WORDS = ["yes", "yep", "yeah", "yup", "confirm", "confirmed", "sure", "ok", "okay"];

/** True if the message's first word is a plain affirmative (e.g. "yes", "yep!", "confirm please"). */
function isAffirmative(body: string): boolean {
  const normalized = body.trim().toLowerCase().replace(/[^a-z\s]/g, "");
  const firstWord = normalized.split(/\s+/)[0] ?? "";
  return AFFIRMATIVE_WORDS.includes(firstWord);
}

smsRouter.post("/", async (req, res) => {
  const from = String(req.body.From ?? "").trim();
  const body = String(req.body.Body ?? "").trim();

  if (!from) {
    res.status(400).type("text/xml").send(twiml("Sorry, I couldn't read that message."));
    return;
  }

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
      res.type("text/xml").send(twiml(reply));
      return;
    }
  }

  const slots = await getNextFreeSlots(3);
  const reply = await generateSmsReply(body, slots);

  await saveMessage(person.id, "outbound", reply);

  res.type("text/xml").send(twiml(reply));
});
