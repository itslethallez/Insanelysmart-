// Re-exports the active SMS provider (Twilio or ClickSend, per SMS_PROVIDER) under the
// original import path, so existing callers (booking.ts, audit.ts, vapi.ts) don't change.
export { sendSms, type SendSmsResult } from "./sms/index.js";
