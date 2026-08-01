import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "../db/index.js";
import { meetings, people, type Meeting } from "../db/schema.js";
import type { Slot } from "./availability.js";

export class SlotUnavailableError extends Error {
  constructor(message = "That slot is no longer available.") {
    super(message);
    this.name = "SlotUnavailableError";
  }
}

function isSerializationFailure(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "40001"
  );
}

export async function bookSlot(
  personId: string,
  slot: Slot,
  options: { source: "text" | "voice" | "web"; notes?: string },
): Promise<Meeting> {
  try {
    return await db.transaction(
      async (tx) => {
        const colliding = await tx
          .select({ id: meetings.id })
          .from(meetings)
          .where(and(lt(meetings.startsAt, slot.end), gt(meetings.endsAt, slot.start)))
          .limit(1);

        if (colliding.length > 0) {
          throw new SlotUnavailableError();
        }

        const [meeting] = await tx
          .insert(meetings)
          .values({
            personId,
            startsAt: slot.start,
            endsAt: slot.end,
            status: "booked",
            source: options.source,
            notes: options.notes,
          })
          .returning();

        await tx.update(people).set({ status: "booked" }).where(eq(people.id, personId));

        return meeting;
      },
      { isolationLevel: "serializable" },
    );
  } catch (err) {
    if (err instanceof SlotUnavailableError) throw err;
    if (isSerializationFailure(err)) throw new SlotUnavailableError();
    throw err;
  }
}
