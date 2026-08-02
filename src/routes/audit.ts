import { Router } from "express";
import { renderAuditPage } from "../audit/render.js";
import { getVertical } from "../audit/verticals/index.js";
import { saveAuditResult } from "../services/audit.js";
import type { AuditAnswers } from "../audit/calculate.js";

export const auditRouter = Router();

auditRouter.get("/", (req, res) => {
  const vertical = getVertical(typeof req.query.v === "string" ? req.query.v : undefined);
  res.type("html").send(renderAuditPage(vertical));
});

auditRouter.post("/", async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  const mobile = String(req.body?.mobile ?? "").trim();
  const verticalKey = typeof req.body?.vertical === "string" ? req.body.vertical : undefined;
  const rawAnswers = req.body?.answers;

  if (!name || !mobile) {
    res.status(400).json({ error: "name and mobile are required" });
    return;
  }

  const vertical = getVertical(verticalKey);

  if (typeof rawAnswers !== "object" || rawAnswers === null) {
    res.status(400).json({ error: "answers are required" });
    return;
  }

  const answers = {} as AuditAnswers;
  for (const question of vertical.questions) {
    const value = (rawAnswers as Record<string, unknown>)[question.id];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      res.status(400).json({ error: `missing or invalid answer for ${question.id}` });
      return;
    }
    answers[question.id] = value;
  }

  try {
    const person = await saveAuditResult(name, mobile, vertical.key, answers);
    res.json({ ok: true, personId: person.id });
  } catch (err) {
    console.error("POST /audit error:", err);
    res.status(500).json({ error: "Something went wrong saving your figures. Please try again shortly." });
  }
});
