function isDryRun(): boolean {
  return process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
}

export type SendSmsResult = { sid: string; dryRun: boolean };

/** Sends an outbound SMS via Twilio's REST API, or logs it and no-ops when DRY_RUN is set. */
export async function sendSms(to: string, body: string): Promise<SendSmsResult> {
  if (isDryRun()) {
    console.log(`[DRY_RUN] Would send SMS to ${to}: ${body}`);
    return { sid: "dry-run", dryRun: true };
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
  return { sid: data.sid, dryRun: false };
}
