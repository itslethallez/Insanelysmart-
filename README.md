# Insanely Smart — backend spine

Thin-first slice: Express + TypeScript, Drizzle ORM over Postgres, Anthropic for the text-back brain.

Tables: `people`, `meetings`, `messages`. No auth, no frontend, no Twilio account wiring yet — the `/sms`
endpoint is built to be hit with a simulated POST so you can see the whole loop before buying a number.

## Setup (PowerShell)

Run each line separately — do not chain with `&&`.

```powershell
pnpm install
Copy-Item .env.example .env
notepad .env
```

Fill in `.env` with your real `DATABASE_URL` (Neon, Supabase, etc. — any standard Postgres connection
string works) and `ANTHROPIC_API_KEY`.

**Before going live, personalize `src/config/brief.ts`** — it's the brief the model gets on every
inbound text (who you are, what Insanely Smart does). It ships with a placeholder.

## Migrate

```powershell
pnpm db:push
```

This applies the schema (`people`, `meetings`, `messages` — three enums, two FKs) directly to your
database. Migration SQL files also live under `drizzle/` if you'd rather run them by hand (e.g. pasted
into the Supabase SQL Editor).

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

Twilio webhooks POST `application/x-www-form-urlencoded` with (at least) `From` and `Body` fields. With
the dev server running in one window, run this in another:

```powershell
curl.exe -X POST http://localhost:3000/sms `
  -H "Content-Type: application/x-www-form-urlencoded" `
  --data-urlencode "From=+61400111222" `
  --data-urlencode "Body=Hi, do you have anything free this week?"
```

You should get back a TwiML response, e.g.:

```xml
<?xml version="1.0" encoding="UTF-8"?><Response><Message>...reply text...</Message></Response>
```

That single call: upserts `+61400111222` into `people` as a `text` lead, saves the inbound message, asks
Claude for a reply (with 2-3 open slots offered), saves the reply, and returns it as TwiML. Run
`pnpm do-next` again afterward and the new lead should show up.

## Test /vapi/book with a fake Vapi tool call

`POST /vapi/book` is the endpoint a Vapi custom tool calls mid-call to save a caller into the planner.
Vapi wraps a tool call as `message.toolCalls[].function.arguments` (arguments may arrive as a JSON
string); the endpoint parses that defensively, with a flat top-level-fields fallback for easy testing.
It always replies in Vapi's tool-result shape: `{"results":[{"toolCallId": "...", "result": "..."}]}`.

With the dev server running, save each payload to a file first (avoids PowerShell's JSON-quoting pain),
then POST it:

**Example 1 — no slot given (captures the lead, offers open times):**

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
{"results":[{"toolCallId":"call_1","result":"Here are the next available times (Adelaide time): 1. ..., 2. ..., 3. ..."}]}
```

**Example 2 — a specific slot given (books the meeting):**

First grab a real upcoming free slot's `start` timestamp (Vapi would get this from an earlier
availability-lookup tool call in the same flow — not built yet):

```powershell
pnpm print-slots 1
```

Copy the `start` value from that output into the JSON below, then run:

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
            "name": "Alex Voice",
            "contact": "+61400333444",
            "slot": "PASTE_START_TIMESTAMP_HERE",
            "notes": "Wants the first available slot"
          }
        }
      }
    ]
  }
}
'@ | Set-Content vapi-withslot.json

curl.exe -X POST http://localhost:3000/vapi/book -H "Content-Type: application/json" --data "@vapi-withslot.json"
```

You should get back a booking confirmation:

```json
{"results":[{"toolCallId":"call_2","result":"Booked! ... (Adelaide time). Meeting confirmed."}]}
```

Run `pnpm do-next` afterward — the no-slot caller shows up as a new `voice` lead, and the with-slot caller
shows up as a booked meeting with `source: "voice"`. If the pasted timestamp doesn't match a currently
free slot (e.g. it's now in the past, or already taken), the endpoint falls back to offering alternatives
instead of erroring.

**Wiring it live later:** once a Vapi assistant exists, this endpoint's URL (e.g.
`https://<your-deployed-host>/vapi/book`) goes into the custom tool's **Server URL** field on the tool's
config page in the Vapi dashboard, so Vapi calls it as the tool's webhook during a live call.

## Project layout

```
src/
  config/hours.ts       working hours (Mon-Fri, 9-5, Australia/Adelaide, 30-min slots)
  config/brief.ts        the brief given to Claude on every /sms reply — personalize this
  db/schema.ts            people, meetings, messages
  lib/timezone.ts          DST-aware zoned time conversion (no added dependency)
  services/availability.ts  getNextFreeSlots(n)
  services/booking.ts        bookSlot(personId, slot) — serializable tx, guards double-booking
  services/doNext.ts          getDoNext() — new leads + upcoming booked meetings, ranked
  services/people.ts           upsertLeadByContact(contact, { source, name })
  services/messages.ts          saveMessage(personId, direction, body)
  services/aiReply.ts            generateSmsReply(body, slots) via Anthropic; formatSlot(slot)
  routes/sms.ts                  POST /sms
  routes/vapi.ts                  POST /vapi/book — voice-to-planner link for Vapi tool calls
  scripts/                        do-next / print-slots / book-test-slot CLI helpers
```

## Not built (later slices)

Jobs, payments, reviews, referrals, client-side app, website, Twilio account/number wiring, Clerk auth,
frontend.
