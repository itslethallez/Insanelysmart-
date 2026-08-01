import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { people, type Person } from "../db/schema.js";

type LeadSource = "text" | "voice" | "web";

type UpsertLeadOptions = {
  source?: LeadSource;
  name?: string;
  companyName?: string;
  address?: string;
  detailsCaptured?: boolean;
};

/** Finds an existing person by contact, or creates a new lead (defaults to a 'text' lead). */
export async function upsertLeadByContact(
  contact: string,
  options: UpsertLeadOptions = {},
): Promise<Person> {
  const [existing] = await db
    .select()
    .from(people)
    .where(eq(people.contact, contact))
    .limit(1);

  if (existing) return existing;

  const { source = "text", name = contact, companyName, address, detailsCaptured } = options;

  const [created] = await db
    .insert(people)
    .values({ name, contact, source, status: "new", companyName, address, detailsCaptured })
    .returning();

  return created;
}
