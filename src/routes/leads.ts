import { Router } from "express";
import { db } from "../db/index.js";
import { people } from "../db/schema.js";

export const leadsRouter = Router();

const VALID_SOURCES = ["voice", "savings_tool", "website", "manual"] as const;

leadsRouter.post("/", async (req, res) => {
  const { name, contact, source, industry, notes } = req.body ?? {};

  const missing = ["name", "contact", "source"].filter((field) => !req.body?.[field]);
  if (missing.length > 0) {
    res.status(400).json({ error: `Missing required field(s): ${missing.join(", ")}` });
    return;
  }

  if (!VALID_SOURCES.includes(source)) {
    res.status(400).json({ error: `source must be one of: ${VALID_SOURCES.join(", ")}` });
    return;
  }

  const [created] = await db
    .insert(people)
    .values({ name, contact, source, industry: industry ?? null, notes: notes ?? null })
    .returning();

  res.status(201).json(created);
});
