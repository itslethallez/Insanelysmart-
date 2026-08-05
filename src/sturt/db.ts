import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

// Deliberately a second, independent client - never import the audit tool's db (src/db/index.ts)
// from here. This is a different Supabase project so a credential handover to the centre later
// is just handing over env vars, not extracting rows out of shared infrastructure.
type SturtDb = ReturnType<typeof drizzle<typeof schema>>;
let cached: SturtDb | null = null;

/**
 * Lazily connects on first real use, not at import time - a missing SYL_DATABASE_URL must
 * only break /sturt requests, never the rest of the server. The audit tool has to keep
 * running even before this feature's env vars are set.
 */
export function getSturtDb(): SturtDb {
  if (!cached) {
    const connectionString = process.env.SYL_DATABASE_URL;
    if (!connectionString) {
      throw new Error("SYL_DATABASE_URL is not set");
    }
    const pool = new Pool({ connectionString });
    cached = drizzle(pool, { schema });
  }
  return cached;
}
