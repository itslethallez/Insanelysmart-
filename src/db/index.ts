import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let cached: Db | undefined;

function createDb(): Db {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  return drizzle(new Pool({ connectionString }), { schema });
}

/** Lazy so the iPad demo can boot without Postgres. Booking/SMS routes still need DATABASE_URL. */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    cached ??= createDb();
    const value = Reflect.get(cached, prop, receiver);
    return typeof value === "function" ? value.bind(cached) : value;
  },
});
