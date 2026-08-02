import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { people, type Person } from "../db/schema.js";
import { calculateAuditFigures, type AuditAnswers, type AuditRecord } from "../audit/calculate.js";

/**
 * Saves a completed audit, upserting the person by mobile. Figures are computed
 * here from the raw answers (not trusted from the client) so what's stored is
 * always reproducible from the maths in calculate.ts.
 */
export async function saveAuditResult(
  name: string,
  mobile: string,
  vertical: string,
  answers: AuditAnswers,
): Promise<Person> {
  const figures = calculateAuditFigures(answers);
  const record: AuditRecord = { vertical, answers, figures };

  const [existing] = await db.select().from(people).where(eq(people.contact, mobile)).limit(1);

  const values = {
    name,
    contact: mobile,
    source: "audit" as const,
    status: "new" as const,
    audit: record,
    auditCompletedAt: new Date(),
  };

  if (existing) {
    const [updated] = await db
      .update(people)
      .set(values)
      .where(eq(people.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db.insert(people).values(values).returning();
  return created;
}
