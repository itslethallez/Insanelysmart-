import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { people, meetings } from "../db/schema.js";

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
      source: people.source,
      createdAt: people.createdAt,
      detailsCaptured: people.detailsCaptured,
    })
    .from(people)
    .orderBy(desc(people.createdAt))
    .limit(1);

  if (!person) {
    res.json({
      name: null,
      companyName: null,
      contact: null,
      source: null,
      createdAt: null,
      detailsCaptured: null,
      hasBooking: false,
      bookingStartsAt: null,
      bookingStatus: null,
    });
    return;
  }

  const [booking] = await db
    .select({
      startsAt: meetings.startsAt,
      status: meetings.status,
    })
    .from(meetings)
    .where(eq(meetings.personId, person.id))
    .orderBy(desc(meetings.createdAt))
    .limit(1);

  res.json({
    name: person.name,
    companyName: person.companyName,
    contact: person.contact,
    source: person.source,
    createdAt: person.createdAt,
    detailsCaptured: person.detailsCaptured,
    hasBooking: !!booking,
    bookingStartsAt: booking?.startsAt ?? null,
    bookingStatus: booking?.status ?? null,
  });
});
