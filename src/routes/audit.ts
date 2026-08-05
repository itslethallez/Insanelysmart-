import { Router } from "express";
import { renderAuditPage } from "../audit/render.js";
import { getIndustry, listIndustries } from "../audit/industries/index.js";
import { saveAuditResult, sendAuditTextBack, recordCallOutcome, bookProofOfValueCall } from "../services/audit.js";
import { OUTCOME_VALUES, type AuditInputs, type MissedWorkInputs, type OutcomeValue, type TaskHoursEntry } from "../audit/calculate.js";
import { getCuratedAuditSlots, getLaterAuditSlots, type Slot } from "../services/availability.js";
import { formatSlot } from "../services/aiReply.js";

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
  const customersApproxRaw = req.body?.customersApprox;
  const customersApprox =
    customersApproxRaw === undefined || customersApproxRaw === null
      ? undefined
      : typeof customersApproxRaw === "number" && Number.isFinite(customersApproxRaw)
        ? customersApproxRaw
        : null;

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
  if (customersApprox === null) {
    res.status(400).json({ error: "customersApprox, if present, must be a number" });
    return;
  }

  const inputs: AuditInputs = {
    industryKey: getIndustry(industryKey).key,
    rate,
    taskHours,
    missedWork: missedWork ?? undefined,
    customersApprox,
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

type ParsedOutcomeCall = {
  toolCallId?: string;
  publicToken?: string;
  outcome?: string;
};

/** Same Vapi tool-call wrapping as /vapi/book (message.toolCalls[].function.arguments, JSON string
 * or object) - set_outcome is configured as an async tool, so this response isn't waited on by the
 * model, but the shape stays consistent with the one other Vapi webhook this app already has. */
function parseSetOutcomeCall(body: any): ParsedOutcomeCall {
  const toolCalls = body?.message?.toolCalls;

  if (Array.isArray(toolCalls) && toolCalls.length > 0) {
    const call = toolCalls[0];
    let args = call?.function?.arguments;

    if (typeof args === "string") {
      try {
        args = JSON.parse(args);
      } catch {
        args = {};
      }
    }

    args ??= {};

    return { toolCallId: call?.id, publicToken: args.public_token, outcome: args.outcome };
  }

  return { publicToken: body?.public_token, outcome: body?.outcome };
}

function outcomeToolResult(toolCallId: string | undefined, result: string) {
  return { results: [{ toolCallId: toolCallId ?? "test-call", result }] };
}

function isOutcomeValue(value: string | undefined): value is OutcomeValue {
  return typeof value === "string" && (OUTCOME_VALUES as readonly string[]).includes(value);
}

auditRouter.post("/outcome", async (req, res) => {
  const parsed = parseSetOutcomeCall(req.body);
  const publicToken = parsed.publicToken?.trim();

  if (!publicToken) {
    res.status(400).json(outcomeToolResult(parsed.toolCallId, "Missing public_token."));
    return;
  }
  if (!isOutcomeValue(parsed.outcome)) {
    res
      .status(400)
      .json(
        outcomeToolResult(
          parsed.toolCallId,
          `outcome must be one of: ${OUTCOME_VALUES.join(", ")}`,
        ),
      );
    return;
  }

  try {
    const result = await recordCallOutcome(publicToken, parsed.outcome);
    if (!result.ok) {
      res.status(404).json(outcomeToolResult(parsed.toolCallId, "No person found for that public_token."));
      return;
    }
    res.json(outcomeToolResult(parsed.toolCallId, "Outcome recorded."));
  } catch (err) {
    console.error("POST /audit/outcome error:", err);
    res.status(500).json(outcomeToolResult(parsed.toolCallId, "Something went wrong recording that outcome."));
  }
});

function slotDto(slot: Slot) {
  return { start: slot.start.toISOString(), end: slot.end.toISOString(), label: formatSlot(slot) };
}

/** Curated three-option picker (ASAP today, tomorrow morning, tomorrow afternoon) for the
 * free-call booking step - same collision-checked generator the voice/SMS booking flow uses,
 * so it can never offer a time that's actually unavailable. */
auditRouter.get("/slots", async (_req, res) => {
  try {
    const curated = await getCuratedAuditSlots();
    res.json({
      asap: curated.asap ? slotDto(curated.asap) : null,
      tomorrowMorning: curated.tomorrowMorning ? slotDto(curated.tomorrowMorning) : null,
      tomorrowAfternoon: curated.tomorrowAfternoon ? slotDto(curated.tomorrowAfternoon) : null,
    });
  } catch (err) {
    console.error("GET /audit/slots error:", err);
    res.status(500).json({ error: "Could not load available times. Please try again shortly." });
  }
});

/** "None of these suit me" expansion - the next handful of openings starting two days out. */
auditRouter.get("/slots/more", async (_req, res) => {
  try {
    const slots = await getLaterAuditSlots();
    res.json({ slots: slots.map(slotDto) });
  } catch (err) {
    console.error("GET /audit/slots/more error:", err);
    res.status(500).json({ error: "Could not load more available times. Please try again shortly." });
  }
});

auditRouter.post("/book", async (req, res) => {
  const publicToken = String(req.body?.publicToken ?? "").trim();
  const businessName = typeof req.body?.businessName === "string" ? req.body.businessName.trim() : undefined;
  const start = new Date(req.body?.slotStart);
  const end = new Date(req.body?.slotEnd);

  if (!publicToken) {
    res.status(400).json({ error: "publicToken is required" });
    return;
  }
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    res.status(400).json({ error: "slotStart and slotEnd must be valid dates" });
    return;
  }

  try {
    const result = await bookProofOfValueCall(publicToken, { start, end }, businessName || undefined);
    if (!result.ok) {
      if (result.error === "not_found") {
        res.status(404).json({ error: "No person found for that link." });
        return;
      }
      res.status(409).json({ error: "That time was just taken. Pick another." });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("POST /audit/book error:", err);
    res.status(500).json({ error: "Something went wrong booking that time. Please try again shortly." });
  }
});
