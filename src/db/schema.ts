import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  uuid,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { AuditRecord } from "../audit/calculate.js";

export const sourceEnum = pgEnum("source", ["text", "voice", "web", "audit"]);
export const personStatusEnum = pgEnum("person_status", [
  "new",
  "booked",
  "closed",
]);
export const meetingStatusEnum = pgEnum("meeting_status", [
  "booked",
  "confirmed",
  "completed",
]);
export const messageDirectionEnum = pgEnum("message_direction", [
  "inbound",
  "outbound",
]);

export const people = pgTable("people", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  source: sourceEnum("source").notNull(),
  industryTag: text("industry_tag"),
  status: personStatusEnum("status").notNull().default("new"),
  companyName: text("company_name"),
  address: text("address"),
  detailsCaptured: boolean("details_captured").notNull().default(false),
  /** Raw band answers + computed figures from the savings audit (src/audit). Recomputable if the maths changes. */
  audit: jsonb("audit").$type<AuditRecord>(),
  auditCompletedAt: timestamp("audit_completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const meetings = pgTable("meetings", {
  id: uuid("id").defaultRandom().primaryKey(),
  personId: uuid("person_id")
    .notNull()
    .references(() => people.id),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  status: meetingStatusEnum("status").notNull().default("booked"),
  source: sourceEnum("source").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  personId: uuid("person_id")
    .notNull()
    .references(() => people.id),
  direction: messageDirectionEnum("direction").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;
export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
