import type { Request } from "express";
import {
  DEFAULT_ADMIN_HOURS,
  type CalculatorAnswers,
  type Industry,
  type PhoneHandler,
  type TeamBand,
} from "../services/calculator.js";
import { isIndustry, isPhoneHandler, isTeamBand } from "../lib/phone.js";

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

export function parseAnswers(body: unknown): CalculatorAnswers {
  if (!body || typeof body !== "object") throw new AnswersError("Missing answers.");
  const raw = body as Record<string, unknown>;

  const contactName = asString(raw.contactName);
  const companyName = asString(raw.companyName);
  const industryRaw = asString(raw.industry);
  const teamSizeRaw = asString(raw.teamSize);
  const phoneHandlerRaw = asString(raw.phoneHandler);
  const weeklyEnquiries = asNumber(raw.weeklyEnquiries);
  const unansweredRate = asNumber(raw.unansweredRate);
  const averageJobValue = asNumber(raw.averageJobValue);
  let adminHoursPerWeek = asNumber(raw.adminHoursPerWeek);
  const mobile = asString(raw.mobile) || undefined;

  if (!contactName) throw new AnswersError("Need a name.");
  if (!companyName) throw new AnswersError("Need a business name.");
  if (!isIndustry(industryRaw)) throw new AnswersError("Pick an industry.");
  if (!isTeamBand(teamSizeRaw)) throw new AnswersError("Pick a team size.");
  if (!isPhoneHandler(phoneHandlerRaw)) throw new AnswersError("Pick who answers the phone.");
  if (weeklyEnquiries === null || weeklyEnquiries <= 0) throw new AnswersError("Need weekly enquiries.");
  if (unansweredRate === null || unansweredRate < 0 || unansweredRate > 1) {
    throw new AnswersError("Unanswered rate must be between 0 and 1.");
  }
  if (averageJobValue === null || averageJobValue <= 0) throw new AnswersError("Need an average job value.");
  if (adminHoursPerWeek === null || adminHoursPerWeek < 0) adminHoursPerWeek = DEFAULT_ADMIN_HOURS;

  return {
    contactName,
    companyName,
    industry: industryRaw as Industry,
    teamSize: teamSizeRaw as TeamBand,
    phoneHandler: phoneHandlerRaw as PhoneHandler,
    weeklyEnquiries,
    unansweredRate,
    averageJobValue,
    adminHoursPerWeek,
    mobile,
  };
}

export function requestBase(req: Request): { host?: string; proto?: string } {
  const host = req.get("x-forwarded-host") || req.get("host") || undefined;
  const proto = (req.get("x-forwarded-proto") || req.protocol || "https").split(",")[0];
  return { host, proto };
}
