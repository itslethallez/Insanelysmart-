/**
 * Mechanic AI Savings Calculator engine, built exactly to the "Build specification" this
 * app is implementing: factual, calculation-based only. No revenue-loss estimates, no
 * product recommendations, no dollar figures attached to the opportunity flags - see the
 * "Important constraints" section of that spec.
 */
import { TASK_CARDS } from "./types.js";

/** Bumped whenever the maths changes, so a stored audit can be traced to the rules it was shown under. */
export const ENGINE_VERSION = 3;

/** Working weeks used for every annualised figure on this page. Not 52 - allows for holidays and downtime. */
export const WORKING_WEEKS = 48;

export const HOURLY_RATE_MIN = 20;
export const HOURLY_RATE_MAX = 400;
export const HOURLY_RATE_STEP = 5;
export const HOURLY_RATE_DEFAULT = 120;

export const WORKER_COUNT_MIN = 1;
export const WORKER_COUNT_MAX = 50;
export const WORKER_COUNT_DEFAULT = 3;

export const JOBS_PER_WEEK_MIN = 0;
export const JOBS_PER_WEEK_MAX = 300;
export const JOBS_PER_WEEK_DEFAULT = 45;

export const AVERAGE_JOB_VALUE_MIN = 0;
export const AVERAGE_JOB_VALUE_MAX = 5000;
export const AVERAGE_JOB_VALUE_STEP = 10;
export const AVERAGE_JOB_VALUE_DEFAULT = 320;

export const HOURS_MIN = 0;
export const HOURS_MAX = 40;
export const HOURS_STEP = 0.5;
export const HOURS_DEFAULT = 2;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export type LeadCapture = {
  fullName: string;
  phoneNumber: string;
  companyName: string;
};

export type TaskHoursEntry = {
  key: string;
  /** Hours per week spent on this task. Only present for tasks answered enabled = true. */
  hours: number;
};

export type AuditInputs = {
  lead: LeadCapture;
  hourlyRate: number;
  workerCount: number;
  jobsPerWeek: number;
  averageJobValue: number;
  /** Only the tasks answered enabled = true - an absent key means enabled = false, hoursPerWeek = 0. */
  taskHours: TaskHoursEntry[];
};

export type TaskBreakdownEntry = {
  task: string;
  hours: number;
  weeklyCost: number;
};

export type OpportunityFlags = {
  serviceReminders: boolean;
  quoteFollowUp: boolean;
};

export type AuditFigures = {
  engineVersion: number;
  hourlyRate: number;
  workerCount: number;
  jobsPerWeek: number;
  averageJobValue: number;
  weeklyRevenue: number;
  annualRevenue: number;
  totalAdminHoursPerWeek: number;
  annualAdminHours: number;
  weeklyAdminCost: number;
  annualAdminCost: number;
  taskBreakdown: TaskBreakdownEntry[];
  opportunityFlags: OpportunityFlags;
  charlieSummary: string;
};

const OPPORTUNITY_MESSAGES = {
  serviceReminders:
    "Automated service reminders have been associated with improved return-booking behaviour in service businesses. This may represent a potential retention opportunity for your workshop.",
  quoteFollowUp:
    "Consistent quote follow-up can improve response and booking rates. This may represent a potential conversion opportunity.",
};

function formatTaskList(labels: string[]): string {
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return labels[0] + " and " + labels[1];
  return labels.slice(0, -1).join(", ") + ", and " + labels[labels.length - 1];
}

/**
 * Top 3 tasks by hours (hours > 0 only), a plain-language stats recap, and a closing
 * mention of the opportunity flags if either is set - never mentions software or specific
 * implementation details, per the spec.
 */
function generateCharlieSummary(
  taskBreakdown: TaskBreakdownEntry[],
  totalAdminHoursPerWeek: number,
  annualAdminHours: number,
  weeklyAdminCost: number,
  annualAdminCost: number,
  opportunityFlags: OpportunityFlags,
): string {
  const topTasks = taskBreakdown
    .filter((t) => t.hours > 0)
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 3)
    .map((t) => t.task.toLowerCase());

  const sentences: string[] = [];

  if (topTasks.length > 0) {
    sentences.push(`Based on your answers, the largest admin time drains are ${formatTaskList(topTasks)}.`);
  }

  sentences.push(
    `You are currently spending approximately ${totalAdminHoursPerWeek} hours per week on admin tasks, which is around ${annualAdminHours} hours per year.`,
  );
  sentences.push(
    `At your labour rate, that is costing approximately $${Math.round(weeklyAdminCost).toLocaleString("en-AU")} per week or $${Math.round(annualAdminCost).toLocaleString("en-AU")} per year.`,
  );

  if (opportunityFlags.serviceReminders || opportunityFlags.quoteFollowUp) {
    sentences.push(
      "There may also be additional opportunities in areas such as service reminders or quote follow-up if those processes are not currently automated.",
    );
  }

  return sentences.join(" ");
}

/**
 * Computes every figure the calculator shows from raw inputs. Always recomputed
 * server-side from the raw answers on save (never trusts client-submitted numbers) -
 * the client copy of this logic only drives the instant on-device reveal.
 */
export function calculateAuditFigures(inputs: AuditInputs): AuditFigures {
  const hourlyRate = Math.max(inputs.hourlyRate, 0);
  const workerCount = clamp(inputs.workerCount, WORKER_COUNT_MIN, WORKER_COUNT_MAX);
  const jobsPerWeek = Math.max(inputs.jobsPerWeek, 0);
  const averageJobValue = Math.max(inputs.averageJobValue, 0);

  const weeklyRevenue = jobsPerWeek * averageJobValue;
  const annualRevenue = weeklyRevenue * WORKING_WEEKS;

  const hoursByKey = new Map(inputs.taskHours.map((t) => [t.key, Math.max(t.hours, 0)]));

  const taskBreakdown: TaskBreakdownEntry[] = TASK_CARDS.map((card) => {
    const hours = hoursByKey.get(card.key) ?? 0;
    return { task: card.label, hours, weeklyCost: hours * hourlyRate };
  });

  const totalAdminHoursPerWeek = taskBreakdown.reduce((sum, t) => sum + t.hours, 0);
  const weeklyAdminCost = totalAdminHoursPerWeek * hourlyRate;
  const annualAdminCost = weeklyAdminCost * WORKING_WEEKS;
  const annualAdminHours = totalAdminHoursPerWeek * WORKING_WEEKS;

  const opportunityFlags: OpportunityFlags = {
    serviceReminders: !hoursByKey.has("serviceReminders"),
    quoteFollowUp: !hoursByKey.has("quoteFollowUp"),
  };

  const charlieSummary = generateCharlieSummary(
    taskBreakdown,
    totalAdminHoursPerWeek,
    annualAdminHours,
    weeklyAdminCost,
    annualAdminCost,
    opportunityFlags,
  );

  return {
    engineVersion: ENGINE_VERSION,
    hourlyRate,
    workerCount,
    jobsPerWeek,
    averageJobValue,
    weeklyRevenue,
    annualRevenue,
    totalAdminHoursPerWeek,
    annualAdminHours,
    weeklyAdminCost,
    annualAdminCost,
    taskBreakdown,
    opportunityFlags,
    charlieSummary,
  };
}

export const OPPORTUNITY_MESSAGE_TEXT = OPPORTUNITY_MESSAGES;

/** Extra details captured on the person's permanent page (GET /p/:public_token), kept here rather
 * than as new columns since there's no reporting need for them yet - see routes/p.ts. */
export type PortalFollowUp = {
  email?: string;
  preferredTimes?: string;
};

/** The set_outcome tool's allowed values - see the Vapi "set_outcome" function tool. */
export const OUTCOME_VALUES = [
  "pov_accepted",
  "pov_thinking",
  "pov_declined",
  "not_a_lead",
  "do_not_contact",
] as const;
export type OutcomeValue = (typeof OUTCOME_VALUES)[number];

export type CallOutcome = {
  value: OutcomeValue;
  recordedAt: string;
};

/** What's stored on `people.audit`. Raw inputs are kept so an old audit can be recomputed if the maths changes. */
export type AuditRecord = {
  engineVersion: number;
  inputs: AuditInputs;
  figures: AuditFigures;
  portalFollowUp?: PortalFollowUp;
  outcome?: CallOutcome;
};
