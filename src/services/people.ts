import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { people, type Person } from "../db/schema.js";

/** Finds an existing person by contact, or creates a new 'text' lead. */
export async function upsertLeadByContact(contact: string): Promise<Person> {
  const [existing] = await db
    .select()
    .from(people)
    .where(eq(people.contact, contact))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(people)
    .values({ name: contact, contact, source: "text", status: "new" })
    .returning();

  return created;
}
