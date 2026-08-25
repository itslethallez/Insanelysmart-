import { and, desc, eq, gt, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { meetings, people } from "../db/schema.js";

export type DoNextLead = {
  kind: "lead";
  personId: string;
  name: string;
  contact: string;
  source: "text" | "voice" | "web" | "audit";
  industryTag: string | null;
  createdAt: Date;
};

export type DoNextMeeting = {
  kind: "meeting";
  meetingId: string;
  personId: string;
  personName: string;
  personContact: string;
  startsAt: Date;
  endsAt: Date;
  notes: string | null;
  createdAt: Date;
  /** true for a 'booked' meeting still awaiting the caller's confirmation reply; false once 'confirmed' (settled). */
  needsNudge: boolean;
  /** true until the person has replied with their company name/address for Mick. */
  awaitingDetails: boolean;
};

export type DoNextItem = DoNextLead | DoNextMeeting;

export async function getDoNext(): Promise<DoNextItem[]> {
  const newLeads = await db
    .select({
      personId: people.id,
      name: people.name,
      contact: people.contact,
      source: people.source,
      industryTag: people.industryTag,
      createdAt: people.createdAt,
    })
    .from(people)
    .where(eq(people.status, "new"))
    .orderBy(desc(people.createdAt));

  const leads: DoNextLead[] = newLeads.map((row) => ({
    kind: "lead",
    ...row,
  }));

  const upcomingMeetings = await db
    .select({
      meetingId: meetings.id,
      personId: meetings.personId,
      personName: people.name,
      personContact: people.contact,
      startsAt: meetings.startsAt,
      endsAt: meetings.endsAt,
      notes: meetings.notes,
      createdAt: meetings.createdAt,
      status: meetings.status,
      detailsCaptured: people.detailsCaptured,
    })
    .from(meetings)
    .innerJoin(people, eq(meetings.personId, people.id))
    .where(and(inArray(meetings.status, ["booked", "confirmed"]), gt(meetings.startsAt, new Date())))
    .orderBy(desc(meetings.createdAt));

  const meetingItems: DoNextMeeting[] = upcomingMeetings
    .map(({ status, detailsCaptured, ...row }) => ({
      kind: "meeting" as const,
      ...row,
      needsNudge: status === "booked",
      awaitingDetails: !detailsCaptured,
    }))
    .sort((a, b) => Number(b.needsNudge) - Number(a.needsNudge));

  return [...leads, ...meetingItems];
}
