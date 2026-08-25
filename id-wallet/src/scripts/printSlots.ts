import "dotenv/config";
import { getNextFreeSlots } from "../services/availability.js";

const count = Number(process.argv[2] ?? 5);
const slots = await getNextFreeSlots(count);
console.log(JSON.stringify(slots, null, 2));
process.exit(0);
