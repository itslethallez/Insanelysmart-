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
  services/people.ts           upsertLeadByContact(contact)
  services/messages.ts          saveMessage(personId, direction, body)
  services/aiReply.ts            generateSmsReply(body, slots) via Anthropic
  routes/sms.ts                  POST /sms
  scripts/                        do-next / print-slots / book-test-slot CLI helpers
```

## Not built (later slices)

Jobs, payments, reviews, referrals, client-side app, website, Twilio account/number wiring, Clerk auth,
frontend.
