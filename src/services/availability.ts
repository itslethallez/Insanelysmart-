import { gt } from "drizzle-orm";
import { db } from "../db/index.js";
import { meetings } from "../db/schema.js";
import {
  END_HOUR,
  SLOT_MINUTES,
  START_HOUR,
  TIMEZONE,
  WORK_DAYS,
} from "../config/hours.js";
import { getZonedParts, zonedTimeToUtc } from "../lib/timezone.js";

export type Slot = { start: Date; end: Date };

const MAX_DAYS_LOOKAHEAD = 60;
const MAX_CANDIDATES_CHECKED = 500;

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function addCalendarDay(year: number, month: number, day: number): { year: number; month: number; day: number } {
  // Anchor at noon so a +/-1hr DST shift never rolls the result onto the wrong calendar day.
  const noonUtc = zonedTimeToUtc(year, month, day, 12, 0, TIMEZONE);
  const nextNoonUtc = addMinutes(noonUtc, 24 * 60);
  const parts = getZonedParts(nextNoonUtc, TIMEZONE);
  return { year: parts.year, month: parts.month, day: parts.day };
}

/** Yields working-hours slot candidates (Mon-Fri, 9-5 Adelaide, 30-min) at or after `from`. */
function* candidateSlots(from: Date): Generator<Slot> {
  let { year, month, day } = getZonedParts(from, TIMEZONE);

  for (let daysChecked = 0; daysChecked < MAX_DAYS_LOOKAHEAD; daysChecked++) {
    const weekday = getZonedParts(zonedTimeToUtc(year, month, day, 12, 0, TIMEZONE), TIMEZONE).weekday;

    if (WORK_DAYS.includes(weekday)) {
      for (
        let minutesFromMidnight = START_HOUR * 60;
        minutesFromMidnight < END_HOUR * 60;
        minutesFromMidnight += SLOT_MINUTES
      ) {
        const hour = Math.floor(minutesFromMidnight / 60);
        const minute = minutesFromMidnight % 60;
        const start = zonedTimeToUtc(year, month, day, hour, minute, TIMEZONE);
        if (start.getTime() >= from.getTime()) {
          yield { start, end: addMinutes(start, SLOT_MINUTES) };
        }
      }
    }

    ({ year, month, day } = addCalendarDay(year, month, day));
  }
}

function overlaps(a: Slot, b: { startsAt: Date; endsAt: Date }): boolean {
  return a.start < b.endsAt && b.startsAt < a.end;
}

/** Returns the next `n` free slots, generated from working hours and filtered against existing meetings. */
export async function getNextFreeSlots(n: number, from: Date = new Date()): Promise<Slot[]> {
  const existing = await db
    .select({ startsAt: meetings.startsAt, endsAt: meetings.endsAt })
    .from(meetings)
    .where(gt(meetings.endsAt, from));

  const results: Slot[] = [];
  let checked = 0;

  for (const candidate of candidateSlots(from)) {
    if (results.length >= n || checked >= MAX_CANDIDATES_CHECKED) break;
    checked++;
    if (!existing.some((meeting) => overlaps(candidate, meeting))) {
      results.push(candidate);
    }
  }

  return results;
}
