import "dotenv/config";
import { getDoNext } from "../services/doNext.js";

const items = await getDoNext();
console.log(JSON.stringify(items, null, 2));
process.exit(0);
