import type { Request } from "express";
import {
  DEFAULT_ADMIN_HOURS,
  type CalculatorAnswers,
  type Industry,
  type PhoneHandler,
  type TeamBand,
} from "../services/calculator.js";
import { isIndustry, isPhoneHandler, isTeamBand } from "../lib/phone.js";
import {
  ADMIN_AUTOMATION_IDS,
  VOLUME_AUTOMATION_IDS,
  isAutomationId,
  type AutomationId,
} from "../config/automations.js";

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export class AnswersError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnswersError";
  }
}

export function parseNeededAutomations(value: unknown): AutomationId[] | undefined {
  if (value == null || value === "") return undefined;
  const list = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];
  const valid = list
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(isAutomationId);
  return valid.length ? valid : undefined;
}

export function parseAnswers(body: unknown): CalculatorAnswers {
  if (!body || typeof body !== "object") throw new AnswersError("Missing answers.");
  const raw = body as Record<string, unknown>;

  const contactName = asString(raw.contactName);
  const companyName = asString(raw.companyName);
  const industryRaw = asString(raw.industry);
  const teamSizeRaw = asString(raw.teamSize);
  const phoneHandlerRaw = asString(raw.phoneHandler);
  const weeklyRaw = asNumber(raw.weeklyEnquiries);
  const unansweredRaw = asNumber(raw.unansweredRate);
  const jobRaw = asNumber(raw.averageJobValue);
  const adminRaw = asNumber(raw.adminHoursPerWeek);
  const mobile = asString(raw.mobile) || undefined;
  const neededAutomations = parseNeededAutomations(raw.neededAutomations);
  const adaptive = Boolean(neededAutomations?.length);
  const needsVolume = !adaptive || neededAutomations!.some((id) => VOLUME_AUTOMATION_IDS.includes(id));
  const needsAdmin = !adaptive || neededAutomations!.some((id) => ADMIN_AUTOMATION_IDS.includes(id));

  if (!contactName) throw new AnswersError("Need a name.");
  if (!companyName) throw new AnswersError("Need a business name.");
  if (!isIndustry(industryRaw)) throw new AnswersError("Pick an industry.");
  if (!isTeamBand(teamSizeRaw)) throw new AnswersError("Pick a team size.");

  const phoneHandler: PhoneHandler | null = isPhoneHandler(phoneHandlerRaw)
    ? phoneHandlerRaw
    : adaptive
      ? "whoever"
      : null;
  if (!phoneHandler) throw new AnswersError("Pick who answers the phone.");

  let weeklyEnquiries = weeklyRaw;
  if (weeklyEnquiries === null || weeklyEnquiries <= 0) {
    if (!adaptive) throw new AnswersError("Need weekly enquiries.");
    weeklyEnquiries = needsVolume ? 15 : 0;
  }

  let unansweredRate = unansweredRaw;
  if (unansweredRate === null) {
    if (!adaptive) throw new AnswersError("Unanswered rate must be between 0 and 1.");
    unansweredRate = needsVolume ? 0.25 : 0;
  }
  if (unansweredRate < 0 || unansweredRate > 1) {
    throw new AnswersError("Unanswered rate must be between 0 and 1.");
  }

  let averageJobValue = jobRaw;
  if (averageJobValue === null || averageJobValue <= 0) {
    if (!adaptive) throw new AnswersError("Need an average job value.");
    averageJobValue = needsVolume ? 250 : 0;
  }

  const adminHoursPerWeek =
    adminRaw === null || adminRaw < 0 ? (needsAdmin ? DEFAULT_ADMIN_HOURS : 0) : adminRaw;

  return {
    contactName,
    companyName,
    industry: industryRaw as Industry,
    teamSize: teamSizeRaw as TeamBand,
    phoneHandler,
    weeklyEnquiries,
    unansweredRate,
    averageJobValue,
    adminHoursPerWeek,
    mobile,
    neededAutomations,
  };
}

export function requestBase(req: Request): { host?: string; proto?: string } {
  const host = req.get("x-forwarded-host") || req.get("host") || undefined;
  const proto = (req.get("x-forwarded-proto") || req.protocol || "https").split(",")[0];
  return { host, proto };
}
