# Insanely Smart — backend spine

Thin-first slice: Express + TypeScript, Drizzle ORM over Postgres, Anthropic for the text-back brain.

Tables: `people`, `meetings`, `messages`. No auth, no frontend, no live Twilio account wired up yet — the
`/sms` and `/vapi/book` endpoints are built to be hit with a simulated POST, and outbound SMS runs in
`DRY_RUN` mode (logged, not sent) so you can see the whole loop before buying a Twilio number.

## Setup (PowerShell)

Run each line separately — do not chain with `&&`.

```powershell
pnpm install
Copy-Item .env.example .env
notepad .env
```

Fill in `.env` with your real `DATABASE_URL` (Supabase, etc. — any standard Postgres connection string
works), `MIGRATION_DATABASE_URL`, and `ANTHROPIC_API_KEY`. Leave `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`
/ `TWILIO_FROM_NUMBER` unset and keep `DRY_RUN=true` to test outbound SMS with no Twilio account — it'll be
logged to the console instead of sent.

**Before going live, personalize `src/config/brief.ts`** — it's the brief the model gets on every
inbound text (who you are, what Insanely Smart does). It ships with a placeholder.

## Migrate

Once migration SQL files exist under `drizzle/` (generated via `pnpm db:generate`), apply them with:

```powershell
pnpm db:migrate
```

`db:migrate` runs each pending file under `drizzle/` in order and records what it applied, so the
database and the migration history in `drizzle/meta/` stay in sync — this matters the moment a second
migration (e.g. `0005`) is generated later, since it needs to know `0004` already ran.

`pnpm db:push` still exists for quick ad hoc schema syncing (it diffs `schema.ts` directly against the
live database and applies whatever's needed), but it does not read or record migration files, so it
should not be used once real migration files exist — use `db:migrate` instead, or the history and the
database will disagree.

`db:generate`, `db:push`, and `db:migrate` all connect via `MIGRATION_DATABASE_URL`, not `DATABASE_URL`
— the app's transaction-pooler connection (port 6543) doesn't support the session-level features DDL
needs. `MIGRATION_DATABASE_URL` should be the same Supabase project's session pooler (port 5432)
instead. See `.env.example` for the exact difference.

## Run

```powershell
pnpm dev
```

Server listens on `http://localhost:3000` (or `$env:PORT` if set). Check it's up:

```powershell
curl.exe http://localhost:3000/health
```

## Try the do-next list, free slots, and a test booking

```powershell
pnpm do-next
pnpm print-slots 5
pnpm book-test-slot <a-person-id-from-do-next-output>
```

## Test /sms with a fake Twilio payload

`/sms` works the same way regardless of which SMS provider is active (`SMS_PROVIDER`, see below):
parses the inbound webhook, runs the lead-capture/confirm/AI-reply logic (unchanged), saves the reply,
sends it via the active provider, and always responds `{"ok": true}` - the reply text no longer comes
back in the HTTP response body (that was Twilio-specific TwiML; sending is now a separate step from
receiving the webhook for both providers). Check the reply itself via `pnpm do-next` or your `DRY_RUN`
console log.

Twilio webhooks POST `application/x-www-form-urlencoded` with (at least) `From` and `Body` fields. With
the dev server running in one window, run this in another:

```powershell
curl.exe -X POST http://localhost:3000/sms `
  -H "Content-Type: application/x-www-form-urlencoded" `
  --data-urlencode "From=+61400111222" `
  --data-urlencode "Body=Hi, do you have anything free this week?"
```

You should get back `{"ok":true}`, and with `DRY_RUN=true` the console will log the reply that would
have been sent (e.g. `[DRY_RUN] Would send SMS to +61400111222: ...`).

That single call: upserts `+61400111222` into `people` as a `text` lead, saves the inbound message, asks
Claude for a reply (with 2-3 open slots offered), saves the reply, and sends it via the active SMS
provider. Run `pnpm do-next` again afterward and the new lead should show up.

## SMS providers: Twilio and ClickSend

`SMS_PROVIDER` picks which one is active - `twilio` (default, unchanged behavior) or `clicksend`. Both
implement the same interface (`src/services/sms/types.ts`): `parseInbound(body)` reads `{ from, body }`
out of the webhook's already-parsed request body, `sendSms(to, body)` sends the reply. `src/routes/sms.ts`
doesn't know or care which one is active.

```powershell
$env:SMS_PROVIDER = "clicksend"
pnpm dev
```

ClickSend needs `CLICKSEND_USERNAME` and `CLICKSEND_API_KEY` (dashboard > API Credentials, not your
ClickSend login password) to actually send - with `DRY_RUN=true` it logs instead, same as Twilio.
`CLICKSEND_FROM_NUMBER` may or may not be required depending on whether your account uses a shared or
dedicated number - confirm against your own account.

**Testing the ClickSend inbound path before it goes near production:** ClickSend's dashboard has a
"Create Test Inbound SMS" feature (`POST /v3/sms/inbound`) that fires a real webhook at a URL you give
it - point it at a local tunnel (ngrok or similar) in front of `pnpm dev` to exercise the real inbound
parsing path end to end, the same way the curl command above exercises Twilio's shape. This also settles
one thing that isn't fixed by ClickSend's docs alone: inbound delivery format (`POST` form-encoded,
`GET` query params, or `JSON`) is a per-number dashboard setting. `parseInbound` for ClickSend reads
plain field names (`from`, `body`) that work either way Express parses the body, but confirm your
number's actual delivery mode is one you expect before relying on it.

### Cutover sequence (manual, not automated)

1. Set `SMS_PROVIDER=clicksend` in Vercel's environment variables, redeploy.
2. In the ClickSend dashboard, point the inbound webhook for your ClickSend number at the live `/sms`
   endpoint (same URL Twilio's webhook uses - the route path doesn't change).
3. Text the ClickSend number from your own phone. Confirm the AI reply arrives as a real SMS and the
   lead/message rows save correctly - same bar as the original Twilio go-live test.
4. Only once that's confirmed working for real, stop pointing anything at the Twilio number.
5. Don't cancel the Twilio number. Leave the `TWILIO_*` variables set in Vercel and `SMS_PROVIDER`
   flippable back to `twilio` with a redeploy, as a dead fallback for at least a week in case ClickSend
   has an issue under real volume.

## Test /vapi/book with a fake Vapi tool call

`POST /vapi/book` is the endpoint a Vapi custom tool calls mid-call to save a caller into the planner.
Vapi wraps a tool call as `message.toolCalls[].function.arguments` (arguments may arrive as a JSON
string); the endpoint parses that defensively, with a flat top-level-fields fallback for easy testing.

It always replies in Vapi's tool-result shape — `{"results":[{"toolCallId": "...", "result": "..."}]}` —
where `result` is a **JSON string** of one of three shapes, so Charlie can branch on `status`:

- `{"status":"confirmed","slot":"Mon, 3 Aug, 11:30 am","message":"Booked for Mon, 3 Aug, 11:30 am"}`
- `{"status":"needs_choice","availableSlots":["Mon, 3 Aug, 11:00 am", "..."],"timezone":"Australia/Adelaide"}`
- `{"status":"error","error":"No appointments available this week"}`

Charlie speaks slot times in plain English, not ISO timestamps, so slot matching works entirely on the
same human-readable format the availability function already produces (via the shared `formatSlot`
helper) — send back exactly one of the strings from a previous `needs_choice` response's `availableSlots`
and it'll match. Optionally pass an `industry` field too (stored to the person's `industry_tag`).

With the dev server running, save each payload to a file first (avoids PowerShell's JSON-quoting pain),
then POST it:

**Example 1 — no slot given → `needs_choice`:**

```powershell
@'
{
  "message": {
    "toolCalls": [
      {
        "id": "call_1",
        "type": "function",
        "function": {
          "name": "book_meeting",
          "arguments": {
            "name": "Jamie Voice",
            "contact": "+61400222333",
            "industry": "Roofing",
            "notes": "Called in asking about pricing"
          }
        }
      }
    ]
  }
}
'@ | Set-Content vapi-noslot.json

curl.exe -X POST http://localhost:3000/vapi/book -H "Content-Type: application/json" --data "@vapi-noslot.json"
```

You should get back something like:

```json
{"results":[{"toolCallId":"call_1","result":"{\"status\":\"needs_choice\",\"availableSlots\":[\"Mon, 3 Aug, 11:00 am\",\"Mon, 3 Aug, 11:30 am\",\"Mon, 3 Aug, 12:00 pm\"],\"timezone\":\"Australia/Adelaide\"}"}]}
```

**Example 2 — echo back one of those exact slot strings → `confirmed`:**

```powershell
@'
{
  "message": {
    "toolCalls": [
      {
        "id": "call_2",
        "type": "function",
        "function": {
          "name": "book_meeting",
          "arguments": {
            "name": "Jamie Voice",
            "contact": "+61400222333",
            "slot": "PASTE_ONE_OF_THE_availableSlots_STRINGS_HERE",
            "industry": "Roofing"
          }
        }
      }
    ]
  }
}
'@ | Set-Content vapi-withslot.json

curl.exe -X POST http://localhost:3000/vapi/book -H "Content-Type: application/json" --data "@vapi-withslot.json"
```

You should get back:

```json
{"results":[{"toolCallId":"call_2","result":"{\"status\":\"confirmed\",\"slot\":\"Mon, 3 Aug, 11:00 am\",\"message\":\"Booked for Mon, 3 Aug, 11:00 am\"}"}]}
```

**Example 3 — a `slot` that doesn't match real availability (e.g. `"Next Thursday at 3pm"`) or is
missing/already taken** falls back to `needs_choice` with fresh real slots instead of erroring — this is
what lets Charlie recover mid-call without any date-parsing. A missing `contact`, or an unhandled server
error, comes back as the `error` shape instead.

Run `pnpm do-next` afterward — the confirmed caller shows up as a booked meeting with `source: "voice"`.

**Wiring it live later:** once a Vapi assistant exists, this endpoint's URL (e.g.
`https://<your-deployed-host>/vapi/book`) goes into the custom tool's **Server URL** field on the tool's
config page in the Vapi dashboard, so Vapi calls it as the tool's webhook during a live call.

## Test the auto-confirm loop (dry run, no Twilio credit needed)

Once a meeting is booked (via `/vapi/book` above, or eventually `/sms`), `bookSlot` texts the person the
slot and asks them to reply YES — with `DRY_RUN=true` in `.env`, that SMS is logged to the console instead
of sent, and recorded as an outbound message. The meeting sits as `booked` (unconfirmed) until they reply.

**1. Book a slot** (same as the `/vapi/book` example above — get real slot strings from a no-slot call
first, then echo one back in `vapi-withslot.json`):

```powershell
curl.exe -X POST http://localhost:3000/vapi/book -H "Content-Type: application/json" --data "@vapi-withslot.json"
```

In the server console (where `pnpm dev` is running) you should see something like:

```
[DRY_RUN] Would send SMS to +61400333444: Hi! I've got you booked for Mon, 3 Aug, 9:00 am (Adelaide time). Reply YES to confirm.
```

**2. Reply YES from that same number** — this hits the existing `/sms` endpoint, which now checks for a
`booked` meeting on an affirmative reply before falling back to its normal AI-reply behaviour:

```powershell
curl.exe -X POST http://localhost:3000/sms `
  -H "Content-Type: application/x-www-form-urlencoded" `
  --data-urlencode "From=+61400333444" `
  --data-urlencode "Body=Yes"
```

You should get back:

```xml
<?xml version="1.0" encoding="UTF-8"?><Response><Message>You're confirmed for Mon, 3 Aug, 9:00 am (Adelaide time). See you then!</Message></Response>
```

**3. Check `do-next`** — the meeting now shows `"needsNudge": false` (settled). Any other `booked` meeting
that hasn't been confirmed yet shows `"needsNudge": true`, and both are listed with the nudge-needing ones
ranked first:

```powershell
pnpm do-next
```

Anyone texting in normally (no matching `booked` meeting, or a non-affirmative message) still gets the
regular lead-capture/AI-reply flow untouched — only a `yes`/`yep`/`confirm`/etc. reply from someone with an
unconfirmed booking gets intercepted.

## Test the text-capture flow (company name/address for Mick)

Charlie (the voice agent) books the visit but doesn't ask for company name or address by voice — after a
booking, the system texts the person asking for those details, and their reply is stored as-is (no
parsing into separate fields — reliability over structure) for Mick to read.

**1. Book a slot via `/vapi/book`** (same as earlier examples — echo back a real slot string from a
no-slot call). With `DRY_RUN=true`, check the server console for **two** dry-run SMS lines: the existing
"reply YES to confirm" proposal, and the new detail request:

```
[DRY_RUN] Would send SMS to +61400333222: Hi! I've got you booked for ...
[DRY_RUN] Would send SMS to +61400333222: Thanks for booking with Insanely Smart! Could you reply with your company name and the address for the visit, so Mick knows exactly where to go?
```

**2. Reply with their company name and address** (any free-text works — it's stored verbatim):

```powershell
curl.exe -X POST http://localhost:3000/sms `
  -H "Content-Type: application/x-www-form-urlencoded" `
  --data-urlencode "From=+61400333222" `
  --data-urlencode "Body=Ridgeline Roofing, 42 Example St, Adelaide SA 5000"
```

You should get back:

```xml
<?xml version="1.0" encoding="UTF-8"?><Response><Message>Thanks! I've passed your company name and address on to Mick.</Message></Response>
```

**3. Confirm it saved** — check `pnpm do-next`; that meeting now shows `"awaitingDetails": false`. (Any
`yes`/`yep`/etc. reply is still handled by the confirm flow above first — it won't be swallowed as address
text — and once details are captured, further messages fall back to the normal AI-reply flow instead of
re-capturing.)

```powershell
pnpm do-next
```

## Test GET /api/latest (for a live demo page)

Read-only endpoint that returns the most recent lead/booking (same underlying data `do-next` uses) as
nested JSON, with CORS enabled so a browser page on another domain can poll it. Doesn't touch `/sms`,
`/vapi/book`, `/health`, or any booking/do-next logic.

```powershell
curl.exe http://localhost:3000/api/latest
```

Example output (person with a confirmed booking, details not yet received):

```json
{"person":{"name":"Alastair Test","companyName":null,"contact":"+61400555222","industryTag":"Electrician","source":"voice","createdAt":"2026-08-02T02:09:29.831Z"},"booking":{"hasBooking":true,"slot":"Mon, 3 Aug, 12:30 pm","status":"booked"},"detailsCaptured":false,"awaitingDetails":true}
```

`booking.slot` is the same human-readable format `formatSlot` produces everywhere else in the app (not an
ISO timestamp). If the most recent person has no booking yet, `booking.hasBooking` is `false` and
`booking.slot`/`booking.status` are `null`, and `awaitingDetails` is `false` (nothing to await yet). If
there's no data at all, `person` is `null` and everything else is `null`/`false`.

## Project layout

```
src/
  config/hours.ts       working hours (Mon-Fri, 9-5, Australia/Adelaide, 30-min slots)
  config/brief.ts        the brief given to Claude on every /sms reply — personalize this
  db/schema.ts            people, meetings, messages
  lib/timezone.ts          DST-aware zoned time conversion (no added dependency)
  services/availability.ts  getNextFreeSlots(n)
  services/booking.ts        bookSlot(personId, slot) / confirmMeetingForPerson(personId) — serializable tx
  services/doNext.ts          getDoNext() — new leads + upcoming booked/confirmed meetings, ranked
  services/people.ts           upsertLeadByContact(contact, { source, name }) / saveLeadDetails(personId, text)
  services/messages.ts          saveMessage(personId, direction, body)
  services/aiReply.ts            generateSmsReply(body, slots) via Anthropic; formatSlot(slot)
  services/sms.ts                 re-exports the active provider's sendSms (see services/sms/)
  services/sms/types.ts            SmsProvider interface: parseInbound(body), sendSms(to, body)
  services/sms/twilio.ts            Twilio REST API + TwiML-webhook field parsing
  services/sms/clicksend.ts          ClickSend REST API + JSON-webhook field parsing
  services/sms/index.ts              picks the active provider from SMS_PROVIDER, DRY_RUN-aware either way
  routes/sms.ts                  POST /sms — also handles YES-confirm replies and company/address capture
  routes/vapi.ts                  POST /vapi/book — voice-to-planner link; confirmed/needs_choice/error JSON shapes
  routes/latest.ts                 GET /api/latest — read-only, CORS-enabled, for a live demo page to poll
  scripts/                        do-next / print-slots / book-test-slot CLI helpers
api/index.ts                       Vercel serverless entry — re-exports the Express app, no logic changes
vercel.json                        rewrites every path to api/index so Express does its own routing
```

## Deploying to Vercel

The Express app runs as a single Vercel serverless function. `api/index.ts` just re-exports the existing
`app` from `src/server.ts` (same object `pnpm dev` uses locally) — no route or business logic changed.
`vercel.json` rewrites every incoming path to that one function, so Express's own router still handles
`/health`, `/sms`, and `/vapi/book` exactly as it does locally. Local dev (`pnpm dev`, which calls
`app.listen(...)` in `src/index.ts`) is untouched and keeps working the same way.

**Environment variables to set in the Vercel dashboard** (Project → Settings → Environment Variables),
mirroring your local `.env`:

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | your real Supabase pooler connection string | same one you use locally |
| `ANTHROPIC_API_KEY` | your Anthropic key | same one you use locally |
| `DRY_RUN` | `true` | **keep this `true` for now** — demo mode, no real SMS sent, matches everything already verified |

`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` are **not needed yet** — leave them
unset in Vercel. They only matter once `DRY_RUN` is switched off for a live number; add them there when
that day comes. `PORT` is not needed on Vercel either (serverless functions don't bind a port; that's only
for local `pnpm dev`).

`SMS_PROVIDER` defaults to `twilio` when unset, so leaving it out of Vercel changes nothing. See "SMS
providers: Twilio and ClickSend" above for the ClickSend variables and the cutover sequence for actually
switching providers in production.

This repo pins `"engines": { "node": "22.x" }` in `package.json` so Vercel picks a supported Node runtime
matching what's been tested locally — check Project Settings → General → Node.js Version matches if you
ever see a build-time Node mismatch warning.

**To deploy (when you're ready — not done automatically):**

*Dashboard:* Import the GitHub repo at [vercel.com/new](https://vercel.com/new), leave the framework
preset on "Other" (no special build command needed — Vercel auto-detects `api/index.ts`), add the three
environment variables above, then deploy.

*CLI:*
```powershell
npm install -g vercel
vercel login
vercel
```
Follow the prompts to link the project, then set the env vars either via the dashboard or:
```powershell
vercel env add DATABASE_URL
vercel env add ANTHROPIC_API_KEY
vercel env add DRY_RUN
```
Then `vercel --prod` to ship it. `vercel dev` also works locally first if you want to smoke-test the
serverless entry point before pushing a real deploy.

## Not built (later slices)

Jobs, payments, reviews, referrals, client-side app, website, Twilio account/number wiring, Clerk auth,
frontend.
