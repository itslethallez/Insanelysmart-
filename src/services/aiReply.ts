import { Anthropic } from "@anthropic-ai/sdk";
import { BUSINESS_BRIEF } from "../config/brief.js";
import { TIMEZONE } from "../config/hours.js";
import type { Slot } from "./availability.js";

const anthropic = new Anthropic();
const MODEL = "claude-sonnet-5";

export function formatSlot(slot: Slot): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(slot.start);
}

export async function generateSmsReply(inboundBody: string, slots: Slot[]): Promise<string> {
  const slotsText =
    slots.length > 0
      ? slots.map((slot, i) => `${i + 1}. ${formatSlot(slot)}`).join("\n")
      : "No open times in the next couple of months — apologise and say you'll follow up.";

  const system = `${BUSINESS_BRIEF}\n\nAvailable times to offer (Adelaide time):\n${slotsText}`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 300,
    system,
    messages: [{ role: "user", content: inboundBody || "(empty message)" }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text.trim() || "Thanks for reaching out — I'll get back to you shortly.";
}
