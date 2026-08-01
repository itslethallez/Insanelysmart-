import { Router } from "express";
import { getNextFreeSlots, type Slot } from "../services/availability.js";
import { bookSlot, SlotUnavailableError } from "../services/booking.js";
import { upsertLeadByContact } from "../services/people.js";
import { saveMessage } from "../services/messages.js";
import { formatSlot } from "../services/aiReply.js";
import { sendSms } from "../services/sms.js";

const DETAILS_REQUEST =
  "Thanks for booking with Insanely Smart! Could you reply with your company name and the address for the visit, so Mick knows exactly where to go?";

export const vapiRouter = Router();

type ParsedBooking = {
  toolCallId?: string;
  name?: string;
  contact?: string;
  slot?: string;
  notes?: string;
};

/** Vapi wraps tool calls as message.toolCalls[].function.arguments (arguments may be a JSON string). Falls back to flat top-level fields for direct testing. */
function parseVapiPayload(body: any): ParsedBooking {
  const toolCalls = body?.message?.toolCalls;

  if (Array.isArray(toolCalls) && toolCalls.length > 0) {
    const call = toolCalls[0];
    let args = call?.function?.arguments;

    if (typeof args === "string") {
      try {
        args = JSON.parse(args);
      } catch {
        args = {};
      }
    }

    args ??= {};

    return {
      toolCallId: call?.id,
      name: args.name,
      contact: args.contact,
      slot: args.slot,
      notes: args.notes,
    };
  }

  return {
    name: body?.name,
    contact: body?.contact,
    slot: body?.slot,
    notes: body?.notes,
  };
}

function toolResult(toolCallId: string | undefined, result: string) {
  return { results: [{ toolCallId: toolCallId ?? "test-call", result }] };
}

function formatOfferedSlots(slots: Slot[]): string {
  if (slots.length === 0) {
    return "I don't see any open times right now — I'll have someone follow up.";
  }
  const listed = slots.map((slot, i) => `${i + 1}. ${formatSlot(slot)}`).join(", ");
  return `Here are the next available times (Adelaide time): ${listed}.`;
}

vapiRouter.post("/", async (req, res) => {
  console.log("POST /vapi/book raw body:", JSON.stringify(req.body));

  const parsed = parseVapiPayload(req.body);
  const contact = parsed.contact?.trim();

  if (!contact) {
    res
      .status(400)
      .json(
        toolResult(
          parsed.toolCallId,
          "I couldn't catch a phone number to save your details — could you repeat it?",
        ),
      );
    return;
  }

  const name = parsed.name?.trim() || contact;
  const person = await upsertLeadByContact(contact, { source: "voice", name });

  await saveMessage(
    person.id,
    "inbound",
    `Voice call captured lead.${parsed.notes ? ` Notes: ${parsed.notes}` : ""}`,
  );

  const requestedStart = parsed.slot ? new Date(parsed.slot) : null;
  const hasValidRequestedStart = requestedStart !== null && !Number.isNaN(requestedStart.getTime());

  const freeSlots = await getNextFreeSlots(hasValidRequestedStart ? 50 : 3);

  if (hasValidRequestedStart) {
    const match = freeSlots.find((slot) => slot.start.getTime() === requestedStart!.getTime());

    if (match) {
      try {
        const meeting = await bookSlot(person.id, match, { source: "voice", notes: parsed.notes });
        const confirmation = `Booked! ${formatSlot(match)} (Adelaide time). Meeting confirmed.`;
        await saveMessage(person.id, "outbound", confirmation);

        await sendSms(person.contact, DETAILS_REQUEST);
        await saveMessage(person.id, "outbound", DETAILS_REQUEST);

        res.json(toolResult(parsed.toolCallId, confirmation));
        return;
      } catch (err) {
        if (!(err instanceof SlotUnavailableError)) throw err;
        // fall through to offering alternatives below
      }
    }
  }

  const offered = freeSlots.slice(0, 3);
  const message = hasValidRequestedStart
    ? `That time isn't available. ${formatOfferedSlots(offered)}`
    : formatOfferedSlots(offered);

  await saveMessage(person.id, "outbound", message);
  res.json(toolResult(parsed.toolCallId, message));
});
