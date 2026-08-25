import { date, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Lives in a separate Supabase project from the Insanely Smart audit tool (see db.ts) -
 * this stores a real childcare centre's enquiries, including children's names and dates of
 * birth, so it needs to be a clean credential handover if Sturt Young Learners takes the
 * system over later, not a migration out of shared infrastructure.
 *
 * Deliberately minimal: no tour slots, no waitlist status, no admin fields. Add those only
 * when the centre actually asks for them.
 */
export const sturtEnquiries = pgTable("sturt_enquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  parentFirstName: text("parent_first_name").notNull(),
  parentLastName: text("parent_last_name").notNull(),
  /** Normalized to +61XXXXXXXXX before it ever reaches this table. */
  mobile: text("mobile").notNull(),
  email: text("email").notNull(),
  childFirstName: text("child_first_name"),
  /** Set when the child is already born - mutually exclusive with childDueDate. */
  childDob: date("child_dob"),
  /** Set when "not born yet" was ticked - mutually exclusive with childDob. */
  childDueDate: date("child_due_date"),
  /** Free text, e.g. "3 days" or "Full time" - deliberately not an enum, this is a thin slice. */
  daysNeeded: text("days_needed"),
  /** Month + year precision only, stored as "YYYY-MM". */
  preferredStart: text("preferred_start"),
  postcode: text("postcode"),
  hearAbout: text("hear_about"),
  source: text("source").notNull().default("website-form"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
