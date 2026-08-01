# Insanely Smart — backend spine

Thin-first slice: Express + TypeScript, Drizzle ORM over Postgres.

Tables: `people`, `meetings`. No auth, no frontend.

## Setup (PowerShell)

Run each line separately — do not chain with `&&`.

```powershell
pnpm install
Copy-Item .env.example .env
notepad .env
```

Fill in `.env` with your real `DATABASE_URL` (Neon, Supabase, etc. — any standard Postgres connection
string works) and `ANTHROPIC_API_KEY` (not used by this slice yet, but part of the stack).

## Migrate

```powershell
pnpm db:generate
pnpm db:push
```

`db:generate` writes SQL under `drizzle/` from `src/db/schema.ts`. `db:push` applies it to the database
in `DATABASE_URL`. If your database already has an older version of these tables (different enum values
or columns), `db:push` will interactively ask whether each difference is a rename or a create/drop —
answer create/drop, not rename, since this schema replaced an earlier prototype and isn't meant to
preserve those old rows.

If you'd rather apply it by hand (e.g. pasting into the Supabase SQL Editor), the exact SQL is in
`drizzle/0000_chief_supernaut.sql`.

## Run

```powershell
pnpm dev
```

Server listens on `http://localhost:3000` (or `$env:PORT` if set).

```powershell
curl.exe http://localhost:3000/health
```

## Test end-to-end

**curl:**

```powershell
curl.exe -X POST http://localhost:3000/api/leads `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Jo Smith\",\"contact\":\"jo@example.com\",\"source\":\"savings_tool\",\"industry\":\"retail\",\"notes\":\"tasks: payroll, invoicing; bleed: $4200/mo\"}'

curl.exe http://localhost:3000/api/do-next
```

**PowerShell native (`Invoke-RestMethod`):**

```powershell
$lead = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/leads `
  -ContentType "application/json" `
  -Body (@{ name = "Jo Smith"; contact = "jo@example.com"; source = "savings_tool"; industry = "retail"; notes = "tasks: payroll, invoicing; bleed: `$4200/mo" } | ConvertTo-Json)
$lead

Invoke-RestMethod -Uri http://localhost:3000/api/do-next
```

`POST /api/leads` inserts the person and returns the created row (or 400 with an error message if
`name`/`contact`/`source` are missing, or `source` isn't a valid enum value). `GET /api/do-next` should
then show that lead in the list, tagged `"type": "lead"` and `"action": "reply"`, newest first.

## Project layout

```
src/
  db/schema.ts        people, meetings — two tables, three enums
  db/index.ts           Drizzle client wired to DATABASE_URL
  services/doNext.ts      getDoNext() — new people + requested meetings, newest-first, tagged
                           with type ('lead'|'meeting') and action ('reply'|'confirm')
  routes/leads.ts           POST /api/leads — validates required fields, inserts a person, returns it
  routes/doNext.ts           GET /api/do-next — returns getDoNext() as JSON
  server.ts                   Express app: express.json(), /health, mounts the two routers above
  index.ts                     entry point — loads .env, starts the HTTP server
drizzle/               generated migration SQL (from db:generate)
drizzle.config.ts     drizzle-kit config — points at src/db/schema.ts, reads DATABASE_URL
```

## Not built (later slices)

Availability/booking logic, SMS/voice webhook handling, Anthropic-generated replies, message history,
jobs, payments, reviews, referrals, client-side app, website, auth.
