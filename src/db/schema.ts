import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  uuid,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { DEFAULT_TENANT_ID } from "../config/tenant.js";
import type { AuditRecord } from "../audit/calculate.js";

export const sourceEnum = pgEnum("source", ["text", "voice", "web", "audit"]);
export const personStatusEnum = pgEnum("person_status", [
  "new",
  "booked",
  "closed",
]);
export const personTypeEnum = pgEnum("person_type", [
  "lead",
  "client",
  "supplier",
  "other",
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

export const people = pgTable(
  "people",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    contact: text("contact").notNull(),
    source: sourceEnum("source").notNull(),
    industryTag: text("industry_tag"),
    status: personStatusEnum("status").notNull().default("new"),
    personType: personTypeEnum("person_type").notNull().default("lead"),
    companyName: text("company_name"),
    address: text("address"),
    detailsCaptured: boolean("details_captured").notNull().default(false),
    // See src/config/tenant.ts for why this has a default today and when to remove it.
    tenantId: uuid("tenant_id").notNull().default(DEFAULT_TENANT_ID),
    /** Raw inputs + computed figures from the savings audit (src/audit). Recomputable if the maths changes. */
    audit: jsonb("audit").$type<AuditRecord>(),
    auditCompletedAt: timestamp("audit_completed_at", { withTimezone: true }),
    /** Permanent per-person page token (GET /p/:public_token). Never regenerated once issued. */
    publicToken: uuid("public_token").notNull().unique().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("people_tenant_id_idx").on(table.tenantId)],
);

export const meetings = pgTable(
  "meetings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    personId: uuid("person_id")
      .notNull()
      .references(() => people.id),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: meetingStatusEnum("status").notNull().default("booked"),
    source: sourceEnum("source").notNull(),
    notes: text("notes"),
    // See src/config/tenant.ts for why this has a default today and when to remove it.
    tenantId: uuid("tenant_id").notNull().default(DEFAULT_TENANT_ID),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("meetings_tenant_id_idx").on(table.tenantId)],
);

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
