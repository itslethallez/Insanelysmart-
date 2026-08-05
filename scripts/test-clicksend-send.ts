/**
 * One-off script to fire a real ClickSend SMS outside the app/DB, to confirm the send path
 * works against a live account before trusting it in the audit text-back flow. Not wired into
 * package.json - run directly with tsx. Requires DRY_RUN=false and real ClickSend creds in env.
 *
 * Usage: CLICKSEND_USERNAME=... CLICKSEND_API_KEY=... CLICKSEND_FROM_NUMBER=... DRY_RUN=false \
 *   pnpm exec tsx scripts/test-clicksend-send.ts <to-number> ["message text"]
 */
import { clicksendProvider } from "../src/services/sms/clicksend.js";
import { isDryRun } from "../src/services/sms/types.js";

const to = process.argv[2];
const body = process.argv[3] ?? "InsanelySmart ClickSend test send - if you got this, outbound works.";

if (!to) {
  console.error("Usage: tsx scripts/test-clicksend-send.ts <to-number> [\"message\"]");
  process.exit(1);
}

if (isDryRun()) {
  console.error("DRY_RUN is true (or unset) - set DRY_RUN=false to actually send.");
  process.exit(1);
}

const result = await clicksendProvider.sendSms(to, body);
console.log("Send result:", result);
