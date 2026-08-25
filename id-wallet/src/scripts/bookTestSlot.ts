import "dotenv/config";
import { getNextFreeSlots } from "../services/availability.js";
import { bookSlot } from "../services/booking.js";

const personId = process.argv[2];
if (!personId) {
  console.error("Usage: pnpm book-test-slot <person_id>");
  process.exit(1);
}

const [slot] = await getNextFreeSlots(1);
if (!slot) {
  console.error("No free slots found.");
  process.exit(1);
}

const meeting = await bookSlot(personId, slot, { source: "text" });
console.log(JSON.stringify(meeting, null, 2));
process.exit(0);
