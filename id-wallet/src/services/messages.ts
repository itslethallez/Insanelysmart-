import { db } from "../db/index.js";
import { messages } from "../db/schema.js";

export async function saveMessage(
  personId: string,
  direction: "inbound" | "outbound",
  body: string,
): Promise<void> {
  await db.insert(messages).values({ personId, direction, body });
}
