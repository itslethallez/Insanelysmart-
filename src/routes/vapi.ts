import { Router } from "express";
import { getNextFreeSlots } from "../services/availability.js";
import { bookSlot, SlotUnavailableError } from "../services/booking.js";
import { upsertLeadByContact } from "../services/people.js";
import { saveMessage } from "../services/messages.js";
import { formatSlot } from "../services/aiReply.js";
import { sendSms } from "../services/sms.js";
import { TIMEZONE } from "../config/hours.js";

const DETAILS_REQUEST =
  "Thanks for booking with Insanely Smart! Could you reply with your company name and the address for the visit, so Mick knows exactly where to go?";

export const vapiRouter = Router();

type ParsedBooking = {
  toolCallId?: string;
  name?: string;
  contact?: string;
  slot?: string;
  notes?: string;
  industry?: string;
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
      industry: args.industry,
    };
  }

  return {
    name: body?.name,
    contact: body?.contact,
    slot: body?.slot,
    notes: body?.notes,
    industry: body?.industry,
  };
}

function jsonToolResult(toolCallId: string | undefined, payload: object) {
  return { results: [{ toolCallId: toolCallId ?? "test-call", result: JSON.stringify(payload) }] };
}

function confirmedResult(slotLabel: string) {
  return { status: "confirmed" as const, slot: slotLabel, message: `Booked for ${slotLabel}` };
}

function needsChoiceResult(availableSlots: string[]) {
  return { status: "needs_choice" as const, availableSlots, timezone: TIMEZONE };
}

function errorResult(error: string) {
  return { status: "error" as const, error };
}

/** Loose match so minor whitespace/casing differences from the caller's echoed slot still hit. */
function normalizeSlotLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

vapiRouter.post("/", async (req, res) => {
  console.log("POST /vapi/book raw body:", JSON.stringify(req.body));

  const parsed = parseVapiPayload(req.body);

  try {
    const contact = parsed.contact?.trim();

    if (!contact) {
      res
        .status(400)
        .json(
          jsonToolResult(
            parsed.toolCallId,
            errorResult("I couldn't catch a phone number to save your details — could you repeat it?"),
          ),
        );
      return;
    }

    const name = parsed.name?.trim() || contact;
    const industryTag = parsed.industry?.trim() || undefined;
    const person = await upsertLeadByContact(contact, { source: "voice", name, industryTag });

    await saveMessage(
      person.id,
      "inbound",
      `Voice call captured lead.${parsed.notes ? ` Notes: ${parsed.notes}` : ""}`,
    );

    const requestedLabel = parsed.slot?.trim();

    if (requestedLabel) {
      const candidates = await getNextFreeSlots(50);
      const target = normalizeSlotLabel(requestedLabel);
      const match = candidates.find((slot) => normalizeSlotLabel(formatSlot(slot)) === target);

      if (match) {
        try {
          await bookSlot(person.id, match, { source: "voice", notes: parsed.notes });
          const label = formatSlot(match);

          await saveMessage(person.id, "outbound", `Booked! ${label} (Adelaide time). Meeting confirmed.`);
          await sendSms(person.contact, DETAILS_REQUEST);
          await saveMessage(person.id, "outbound", DETAILS_REQUEST);

          res.json(jsonToolResult(parsed.toolCallId, confirmedResult(label)));
          return;
        } catch (err) {
          if (!(err instanceof SlotUnavailableError)) throw err;
          // slot got taken between matching and booking — fall through to fresh alternatives below
        }
      }
    }

    const freshSlots = await getNextFreeSlots(3);

    if (freshSlots.length === 0) {
      const message = "No appointments available this week";
      await saveMessage(person.id, "outbound", message);
      res.json(jsonToolResult(parsed.toolCallId, errorResult(message)));
      return;
    }

    const availableSlots = freshSlots.map((slot) => formatSlot(slot));
    await saveMessage(person.id, "outbound", `Offered slots: ${availableSlots.join(", ")}`);
    res.json(jsonToolResult(parsed.toolCallId, needsChoiceResult(availableSlots)));
  } catch (err) {
    console.error("POST /vapi/book error:", err);
    res
      .status(500)
      .json(
        jsonToolResult(parsed.toolCallId, errorResult("Something went wrong on our end. Please try again shortly.")),
      );
  }
});
