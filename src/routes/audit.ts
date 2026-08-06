import { Router } from "express";
import { renderAuditPage } from "../audit/render.js";
import { saveLeadCapture, saveAuditResult, sendAuditTextBack, recordCallOutcome, bookProofOfValueCall } from "../services/audit.js";
import { OUTCOME_VALUES, type AuditInputs, type LeadCapture, type OutcomeValue, type TaskHoursEntry } from "../audit/calculate.js";
import { getCuratedAuditSlots, getLaterAuditSlots, type Slot } from "../services/availability.js";
import { formatSlot } from "../services/aiReply.js";

export const auditRouter = Router();

auditRouter.get("/", (_req, res) => {
  res.type("html").send(renderAuditPage());
});

function parseLead(raw: unknown): LeadCapture | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  const fullName = typeof obj.fullName === "string" ? obj.fullName.trim() : "";
  const phoneNumber = typeof obj.phoneNumber === "string" ? obj.phoneNumber.trim() : "";
  const companyName = typeof obj.companyName === "string" ? obj.companyName.trim() : "";
  if (!fullName || !phoneNumber || !companyName) return null;
  return { fullName, phoneNumber, companyName };
}

/** Step 1 - lead details submitted immediately, before any calculation has run. */
auditRouter.post("/lead", async (req, res) => {
  const lead = parseLead(req.body?.lead);
  if (!lead) {
    res.status(400).json({ error: "fullName, phoneNumber and companyName are required" });
    return;
  }

  try {
    const person = await saveLeadCapture(lead);
    res.json({ ok: true, publicToken: person.publicToken });
  } catch (err) {
    console.error("POST /audit/lead error:", err);
    res.status(500).json({ error: "Something went wrong saving your details. Please try again shortly." });
  }
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

function numberField(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

auditRouter.post("/", async (req, res) => {
  const lead = parseLead(req.body?.lead);
  const hourlyRate = numberField(req.body?.hourlyRate);
  const workerCount = numberField(req.body?.workerCount);
  const jobsPerWeek = numberField(req.body?.jobsPerWeek);
  const averageJobValue = numberField(req.body?.averageJobValue);
  const taskHours = parseTaskHours(req.body?.taskHours);

  if (!lead) {
    res.status(400).json({ error: "fullName, phoneNumber and companyName are required" });
    return;
  }
  if (hourlyRate === null || workerCount === null || jobsPerWeek === null || averageJobValue === null) {
    res.status(400).json({ error: "hourlyRate, workerCount, jobsPerWeek and averageJobValue must all be numbers" });
    return;
  }
  if (taskHours === null) {
    res.status(400).json({ error: "taskHours must be an array of {key, hours}" });
    return;
  }

  const inputs: AuditInputs = {
    lead,
    hourlyRate,
    workerCount,
    jobsPerWeek,
    averageJobValue,
    taskHours,
  };

  try {
    const person = await saveAuditResult({ inputs });
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
 * "Book a workshop review" step - same collision-checked generator the voice/SMS booking
 * flow uses, so it can never offer a time that's actually unavailable. */
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
