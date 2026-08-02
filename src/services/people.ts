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
  industryTag?: string;
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

  const { source = "text", name = contact, companyName, address, detailsCaptured, industryTag } = options;

  const [created] = await db
    .insert(people)
    .values({ name, contact, source, status: "new", companyName, address, detailsCaptured, industryTag })
    .returning();

  return created;
}

/** Stores a raw reply as the person's address/details text (Option A: no structured parsing) and marks details_captured. */
export async function saveLeadDetails(personId: string, details: string): Promise<Person> {
  const [updated] = await db
    .update(people)
    .set({ address: details, detailsCaptured: true })
    .where(eq(people.id, personId))
    .returning();

  return updated;
}
