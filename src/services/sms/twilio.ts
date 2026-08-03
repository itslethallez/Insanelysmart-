import type { InboundSms, SendSmsResult, SmsProvider } from "./types.js";
import { isDryRun } from "./types.js";

function parseInbound(body: unknown): InboundSms | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  const from = typeof b.From === "string" ? b.From.trim() : "";
  if (!from) return null;
  return { from, body: typeof b.Body === "string" ? b.Body.trim() : "" };
}

/** Sends via Twilio's REST API - unchanged from the pre-refactor implementation, just moved here. */
async function sendSms(to: string, body: string): Promise<SendSmsResult> {
  if (isDryRun()) {
    console.log(`[DRY_RUN] Would send SMS to ${to}: ${body}`);
    return { id: "dry-run", dryRun: true };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !from) {
    throw new Error(
      "Missing Twilio credentials (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER).",
    );
  }

  const params = new URLSearchParams({ To: to, From: from, Body: body });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Twilio send failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { sid: string };
  return { id: data.sid, dryRun: false };
}

export const twilioProvider: SmsProvider = { parseInbound, sendSms };
