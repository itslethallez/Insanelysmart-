import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { meetings, people } from "../db/schema.js";

export type DoNextLead = {
  type: "lead";
  action: "reply";
  personId: string;
  name: string;
  contact: string;
  source: "voice" | "savings_tool" | "website" | "manual";
  industry: string | null;
  createdAt: Date;
};

export type DoNextMeeting = {
  type: "meeting";
  action: "confirm";
  meetingId: string;
  personId: string;
  personName: string;
  personContact: string;
  scheduledFor: Date | null;
  notes: string | null;
  createdAt: Date;
};

export type DoNextItem = DoNextLead | DoNextMeeting;

export async function getDoNext(): Promise<DoNextItem[]> {
  const newPeople = await db
    .select({
      personId: people.id,
      name: people.name,
      contact: people.contact,
      source: people.source,
      industry: people.industry,
      createdAt: people.createdAt,
    })
    .from(people)
    .where(eq(people.status, "new"));

  const leads: DoNextLead[] = newPeople.map((row) => ({
    type: "lead",
    action: "reply",
    ...row,
  }));

  const requestedMeetings = await db
    .select({
      meetingId: meetings.id,
      personId: meetings.personId,
      personName: people.name,
      personContact: people.contact,
      scheduledFor: meetings.scheduledFor,
      notes: meetings.notes,
      createdAt: meetings.createdAt,
    })
    .from(meetings)
    .innerJoin(people, eq(meetings.personId, people.id))
    .where(eq(meetings.status, "requested"));

  const meetingItems: DoNextMeeting[] = requestedMeetings.map((row) => ({
    type: "meeting",
    action: "confirm",
    ...row,
  }));

  return [...leads, ...meetingItems].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}
