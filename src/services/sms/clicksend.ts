import type { InboundSms, SendSmsResult, SmsProvider } from "./types.js";
import { isDryRun } from "./types.js";

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

/**
 * Field names per ClickSend's inbound SMS record shape (message_id, from, to, body,
 * timestamp, custom_string) - confirmed against their docs, but NOT yet confirmed against a
 * live webhook delivery. ClickSend's inbound delivery mode (plain POST/form vs JSON) is a
 * per-number dashboard setting, not fixed - Express already parses either encoding into the
 * same req.body shape (see server.ts's urlencoded + json middleware), so this one parser
 * covers both without caring which mode is configured. Still needs a real test-send against
 * the actual account before this goes near production - see the provider swap plan.
 */
function parseInbound(body: unknown): InboundSms | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  const from = firstString(b.from, b.From);
  if (!from) return null;
  return { from, body: firstString(b.body, b.Body, b.message) ?? "" };
}

async function sendSms(to: string, body: string): Promise<SendSmsResult> {
  if (isDryRun()) {
    console.log(`[DRY_RUN] Would send SMS via ClickSend to ${to}: ${body}`);
    return { id: "dry-run", dryRun: true };
  }

  const username = process.env.CLICKSEND_USERNAME;
  const apiKey = process.env.CLICKSEND_API_KEY;
  const from = process.env.CLICKSEND_FROM_NUMBER;

  if (!username || !apiKey) {
    throw new Error("Missing ClickSend credentials (CLICKSEND_USERNAME / CLICKSEND_API_KEY).");
  }

  const response = await fetch("https://rest.clicksend.com/v3/sms/send", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${apiKey}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          source: "insanely-smart",
          to,
          body,
          ...(from ? { from } : {}),
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`ClickSend send failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    response_code?: string;
    data?: { messages?: Array<{ status?: string; message_id?: string }> };
  };
  const message = data.data?.messages?.[0];

  if (data.response_code !== "SUCCESS" || !message || message.status === "FAILED") {
    throw new Error(`ClickSend send failed: ${JSON.stringify(data)}`);
  }

  return { id: message.message_id ?? "unknown", dryRun: false };
}

export const clicksendProvider: SmsProvider = { parseInbound, sendSms };
