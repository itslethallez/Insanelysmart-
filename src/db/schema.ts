import {
  pgEnum,
  pgTable,
  uuid,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const sourceEnum = pgEnum("source", [
  "voice",
  "savings_tool",
  "website",
  "manual",
]);
export const personStatusEnum = pgEnum("person_status", [
  "new",
  "contacted",
  "booked",
  "won",
  "lost",
]);
export const meetingStatusEnum = pgEnum("meeting_status", [
  "requested",
  "confirmed",
  "done",
  "cancelled",
]);

export const people = pgTable("people", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  source: sourceEnum("source").notNull(),
  industry: text("industry"),
  status: personStatusEnum("status").notNull().default("new"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const meetings = pgTable("meetings", {
  id: uuid("id").defaultRandom().primaryKey(),
  personId: uuid("person_id")
    .notNull()
    .references(() => people.id),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  status: meetingStatusEnum("status").notNull().default("requested"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;
export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;
