import { Router } from "express";
import { getNextFreeSlots } from "../services/availability.js";
import { generateSmsReply } from "../services/aiReply.js";
import { upsertLeadByContact } from "../services/people.js";
import { saveMessage } from "../services/messages.js";

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

smsRouter.post("/", async (req, res) => {
  const from = String(req.body.From ?? "").trim();
  const body = String(req.body.Body ?? "").trim();

  if (!from) {
    res.status(400).type("text/xml").send(twiml("Sorry, I couldn't read that message."));
    return;
  }

  const person = await upsertLeadByContact(from);
  await saveMessage(person.id, "inbound", body);

  const slots = await getNextFreeSlots(3);
  const reply = await generateSmsReply(body, slots);

  await saveMessage(person.id, "outbound", reply);

  res.type("text/xml").send(twiml(reply));
});
