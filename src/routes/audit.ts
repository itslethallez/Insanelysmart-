import { Router } from "express";
import { renderAuditPage } from "../audit/render.js";
import { getIndustry, listIndustries } from "../audit/industries/index.js";
import { saveAuditResult, sendAuditTextBack } from "../services/audit.js";
import type { AuditInputs, MissedWorkInputs, TaskHoursEntry } from "../audit/calculate.js";

export const auditRouter = Router();

auditRouter.get("/", (req, res) => {
  const industry = getIndustry(typeof req.query.industry === "string" ? req.query.industry : undefined);
  res.type("html").send(renderAuditPage(industry, listIndustries()));
});

function parseTaskHours(raw: unknown): TaskHoursEntry[] | null {
  if (!Array.isArray(raw)) return null;
  const entries: TaskHoursEntry[] = [];
  for (const item of raw) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as Record<string, unknown>).key !== "string" ||
      typeof (item as Record<string, unknown>).hours !== "number" ||
      !Number.isFinite((item as Record<string, unknown>).hours as number)
    ) {
      return null;
    }
    entries.push({
      key: (item as Record<string, unknown>).key as string,
      hours: (item as Record<string, unknown>).hours as number,
    });
  }
  return entries;
}

function parseMissedWork(raw: unknown): MissedWorkInputs | null | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const { callsMissedPerWeek, conversionRate, averageJobValue } = obj;
  if (
    typeof callsMissedPerWeek !== "number" ||
    typeof conversionRate !== "number" ||
    typeof averageJobValue !== "number" ||
    !Number.isFinite(callsMissedPerWeek) ||
    !Number.isFinite(conversionRate) ||
    !Number.isFinite(averageJobValue)
  ) {
    return null;
  }
  return { callsMissedPerWeek, conversionRate, averageJobValue };
}

auditRouter.post("/", async (req, res) => {
  const firstName = String(req.body?.firstName ?? "").trim();
  const mobile = String(req.body?.mobile ?? "").trim();
  const industryKey = typeof req.body?.industryKey === "string" ? req.body.industryKey : undefined;
  const rate = req.body?.rate;
  const taskHours = parseTaskHours(req.body?.taskHours);
  const missedWork = parseMissedWork(req.body?.missedWork);

  if (!firstName || !mobile) {
    res.status(400).json({ error: "firstName and mobile are required" });
    return;
  }
  if (typeof rate !== "number" || !Number.isFinite(rate)) {
    res.status(400).json({ error: "rate must be a number" });
    return;
  }
  if (taskHours === null) {
    res.status(400).json({ error: "taskHours must be an array of {key, hours}" });
    return;
  }
  if (missedWork === null) {
    res.status(400).json({ error: "missedWork, if present, must have callsMissedPerWeek, conversionRate and averageJobValue" });
    return;
  }

  const inputs: AuditInputs = {
    industryKey: getIndustry(industryKey).key,
    rate,
    taskHours,
    missedWork: missedWork ?? undefined,
  };

  try {
    const person = await saveAuditResult({ firstName, mobile, inputs });
    const publicUrl = `${req.protocol}://${req.get("host")}/p/${person.publicToken}`;

    // Failure-tolerant by design (see sendAuditTextBack) - the audit is already saved, so a
    // Twilio error here must never turn this into an error response.
    await sendAuditTextBack(person, publicUrl);

    res.json({ ok: true, publicToken: person.publicToken });
  } catch (err) {
    console.error("POST /audit error:", err);
    res.status(500).json({ error: "Something went wrong saving your figures. Please try again shortly." });
  }
});
