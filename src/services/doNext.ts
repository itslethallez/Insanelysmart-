import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "../db/index.js";
import { meetings, people } from "../db/schema.js";

export type DoNextLead = {
  kind: "lead";
  personId: string;
  name: string;
  contact: string;
  source: "text" | "voice" | "web";
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
    })
    .from(meetings)
    .innerJoin(people, eq(meetings.personId, people.id))
    .where(and(eq(meetings.status, "booked"), gt(meetings.startsAt, new Date())))
    .orderBy(desc(meetings.createdAt));

  const meetingItems: DoNextMeeting[] = upcomingMeetings.map((row) => ({
    kind: "meeting",
    ...row,
  }));

  return [...leads, ...meetingItems];
}
