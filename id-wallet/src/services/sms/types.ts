export type InboundSms = { from: string; body: string };
export type SendSmsResult = { id: string; dryRun: boolean };

export interface SmsProvider {
  /** Reads { from, body } out of an already-parsed webhook body. Null if it doesn't look like this provider's shape. */
  parseInbound(body: unknown): InboundSms | null;
  sendSms(to: string, body: string): Promise<SendSmsResult>;
}

export function isDryRun(): boolean {
  return process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
}
