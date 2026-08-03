import type { InboundSms, SendSmsResult, SmsProvider } from "./types.js";
import { twilioProvider } from "./twilio.js";
import { clicksendProvider } from "./clicksend.js";

export type { InboundSms, SendSmsResult, SmsProvider } from "./types.js";

function selectProvider(): SmsProvider {
  const requested = (process.env.SMS_PROVIDER ?? "twilio").trim().toLowerCase();
  if (requested === "clicksend") return clicksendProvider;
  if (requested !== "twilio") {
    console.warn(`Unknown SMS_PROVIDER "${requested}" - defaulting to twilio.`);
  }
  return twilioProvider;
}

export const activeSmsProvider: SmsProvider = selectProvider();

export function parseInbound(body: unknown): InboundSms | null {
  return activeSmsProvider.parseInbound(body);
}

export function sendSms(to: string, body: string): Promise<SendSmsResult> {
  return activeSmsProvider.sendSms(to, body);
}
