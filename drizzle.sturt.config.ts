import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Separate config for the Sturt Young Learners database - a different Supabase project from
// the one drizzle.config.ts points at. Keeps `pnpm db:generate`/`db:push` (audit tables) and
// `pnpm db:sturt:generate`/`db:sturt:push` (sturt_enquiries) from ever touching each other.
if (!process.env.SYL_MIGRATION_DATABASE_URL) {
  throw new Error("SYL_MIGRATION_DATABASE_URL is not set");
}

export default defineConfig({
  schema: "./src/sturt/schema.ts",
  out: "./drizzle-sturt",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.SYL_MIGRATION_DATABASE_URL,
  },
});
