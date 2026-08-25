import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { people, meetings } from "../db/schema.js";
import { formatSlot } from "../services/aiReply.js";

export const latestRouter = Router();

latestRouter.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

latestRouter.get("/", async (_req, res) => {
  const [person] = await db
    .select({
      id: people.id,
      name: people.name,
      companyName: people.companyName,
      contact: people.contact,
      industryTag: people.industryTag,
      source: people.source,
      createdAt: people.createdAt,
      detailsCaptured: people.detailsCaptured,
    })
    .from(people)
    .orderBy(desc(people.createdAt))
    .limit(1);

  if (!person) {
    res.json({
      person: null,
      booking: { hasBooking: false, slot: null, status: null },
      detailsCaptured: null,
      awaitingDetails: false,
    });
    return;
  }

  const [meeting] = await db
    .select({
      startsAt: meetings.startsAt,
      endsAt: meetings.endsAt,
      status: meetings.status,
    })
    .from(meetings)
    .where(eq(meetings.personId, person.id))
    .orderBy(desc(meetings.createdAt))
    .limit(1);

  const hasBooking = !!meeting;

  res.json({
    person: {
      name: person.name,
      companyName: person.companyName,
      contact: person.contact,
      industryTag: person.industryTag,
      source: person.source,
      createdAt: person.createdAt,
    },
    booking: {
      hasBooking,
      slot: meeting ? formatSlot({ start: meeting.startsAt, end: meeting.endsAt }) : null,
      status: meeting?.status ?? null,
    },
    detailsCaptured: person.detailsCaptured,
    awaitingDetails: hasBooking && !person.detailsCaptured,
  });
});
