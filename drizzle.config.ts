import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.MIGRATION_DATABASE_URL) {
  throw new Error("MIGRATION_DATABASE_URL is not set");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.MIGRATION_DATABASE_URL,
  },
});
