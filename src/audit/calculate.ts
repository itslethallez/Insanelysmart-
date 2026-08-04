import { getIndustry } from "./industries/index.js";
import type { Industry } from "./types.js";

/** Bumped whenever the maths changes, so a stored audit can be traced to the rules it was shown under. */
export const ENGINE_VERSION = 1;

/** Australian working weeks: 52 minus leave and public holidays. Not 52. */
export const WORKING_WEEKS = 46;

export const RATE_MIN = 35;
export const RATE_MAX = 150;
export const RATE_STEP = 5;
export const RATE_DEFAULT = 55;

export const HOURS_MIN = 0.5;
export const HOURS_MAX = 20;
export const HOURS_STEP = 0.5;
export const HOURS_DEFAULT = 3;

/** Hard cap on total chosen hours per week. Protects against a fat-fingered slider producing an inflated figure. */
export const TOTAL_HOURS_CAP = 60;

export const MISSED_CALLS_MIN = 0;
export const MISSED_CALLS_MAX = 30;
export const MISSED_CALLS_STEP = 1;
export const MISSED_CALLS_DEFAULT = 3;

/**
 * Not asked as its own question on Screen 3 - kept as a fixed assumption behind the
 * scenes so the missed-work formula still has something to multiply by.
 */
export const CONVERSION_RATE_DEFAULT = 0.3;

export const JOB_VALUE_MIN = 50;
export const JOB_VALUE_MAX = 2000;
export const JOB_VALUE_STEP = 50;
export const AVERAGE_JOB_VALUE_DEFAULT = 400;

/**
 * Screen 3's "calls on a busy day" slider - captured as context only. Not read anywhere
 * in this file; it never multiplies into missedWork or any other figure.
 */
export const BUSY_DAY_CALLS_MIN = 5;
export const BUSY_DAY_CALLS_MAX = 100;
export const BUSY_DAY_CALLS_STEP = 5;
export const BUSY_DAY_CALLS_DEFAULT = 30;

/** Minimum weeks shown for payback. "Pays for itself in 1 week" reads as a scam. */
export const PAYBACK_FLOOR_WEEKS = 4;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Annual dollar cost of one task at the given weekly hours and rate. */
export function taskBleed(hours: number, rate: number): number {
  return hours * rate * WORKING_WEEKS;
}

/** Annual dollar amount a system recovers from one task's bleed. */
export function taskRecovered(bleed: number, recoveryPct: number): number {
  return bleed * recoveryPct;
}

export type TaskHoursEntry = {
  key: string;
  /** Hours per week spent on this task, straight off the slider. */
  hours: number;
};

export type MissedWorkInputs = {
  callsMissedPerWeek: number;
  conversionRate: number;
  averageJobValue: number;
};

export type MissedWorkFigures = MissedWorkInputs & {
  /** Lost revenue, not saved time. Never added into the time-bleed headline. */
  missedAnnual: number;
};

export type AuditInputs = {
  industryKey: string;
  rate: number;
  /**
   * Order matters: this is selection order, not industry declaration order. When the
   * 60-hour cap is hit, a task keeps its full hours up to whatever room is left at the
   * point it appears in this list - so tasks chosen earlier are never reduced by tasks
   * chosen later. That's what keeps "add a task" always non-decreasing, cap or no cap.
   */
  taskHours: TaskHoursEntry[];
  missedWork?: MissedWorkInputs;
};

export type TaskFigure = {
  key: string;
  label: string;
  recoveryPct: number;
  /** Hours per week actually used in the maths, after the 60-hour cap. */
  hours: number;
  bleed: number;
  recovered: number;
  recoveredHoursAnnual: number;
};

export type PaybackFigures = {
  buildAnchor: number;
  weeksToPayback: number;
} | null;

export type AuditFigures = {
  engineVersion: number;
  industryKey: string;
  rate: number;
  tasks: TaskFigure[];
  /** Sum of raw slider hours before the cap is applied. Used for the clamp note. */
  rawTotalHoursPerWeek: number;
  /** Sum of hours actually used in the maths, always <= TOTAL_HOURS_CAP. */
  totalHoursPerWeek: number;
  clamped: boolean;
  totalBleed: number;
  totalRecovered: number;
  /** Hours a year a system actually frees up - lead with this before the dollar figure. */
  totalRecoveredHoursAnnual: number;
  payback: PaybackFigures;
  missedWork: MissedWorkFigures | null;
};

function computeMissedWork(inputs: MissedWorkInputs): MissedWorkFigures {
  const callsMissedPerWeek = Math.max(inputs.callsMissedPerWeek, 0);
  const conversionRate = clamp(inputs.conversionRate, 0, 1);
  const averageJobValue = Math.max(inputs.averageJobValue, 0);
  const missedAnnual = callsMissedPerWeek * WORKING_WEEKS * conversionRate * averageJobValue;
  return { callsMissedPerWeek, conversionRate, averageJobValue, missedAnnual };
}

function computePayback(totalRecovered: number, chosenTaskCount: number): PaybackFigures {
  if (totalRecovered <= 0 || chosenTaskCount === 0) return null;

  const buildAnchor = chosenTaskCount === 1 ? 1500 : 5000;
  const weeklyRecovery = totalRecovered / WORKING_WEEKS;
  const weeksToPayback = Math.max(PAYBACK_FLOOR_WEEKS, Math.round(buildAnchor / weeklyRecovery));

  return { buildAnchor, weeksToPayback };
}

/**
 * Computes every figure the audit shows from raw inputs. Always recomputed server-side
 * from the raw answers on save (never trusts client-submitted numbers) - the client copy
 * of this logic only drives the instant on-device reveal.
 */
export function calculateAuditFigures(inputs: AuditInputs): AuditFigures {
  const industry: Industry = getIndustry(inputs.industryKey);
  const tasksByKey = new Map(industry.tasks.map((t) => [t.key, t]));
  const rate = clamp(inputs.rate, RATE_MIN, RATE_MAX);

  const rawTotalHoursPerWeek = inputs.taskHours.reduce(
    (sum, entry) => sum + clamp(entry.hours, 0, HOURS_MAX),
    0,
  );
  const clamped = rawTotalHoursPerWeek > TOTAL_HOURS_CAP;

  const tasks: TaskFigure[] = [];
  let runningHours = 0;

  for (const entry of inputs.taskHours) {
    const task = tasksByKey.get(entry.key);
    if (!task) continue; // ignore unknown/stale task keys defensively

    const rawHours = clamp(entry.hours, 0, HOURS_MAX);
    const remaining = Math.max(TOTAL_HOURS_CAP - runningHours, 0);
    const hours = Math.min(rawHours, remaining);
    runningHours += hours;

    const bleed = taskBleed(hours, rate);
    const recovered = taskRecovered(bleed, task.recoveryPct);

    tasks.push({
      key: task.key,
      label: task.label,
      recoveryPct: task.recoveryPct,
      hours,
      bleed,
      recovered,
      recoveredHoursAnnual: hours * WORKING_WEEKS * task.recoveryPct,
    });
  }

  const totalHoursPerWeek = tasks.reduce((sum, t) => sum + t.hours, 0);
  const totalBleed = tasks.reduce((sum, t) => sum + t.bleed, 0);
  const totalRecovered = tasks.reduce((sum, t) => sum + t.recovered, 0);
  const totalRecoveredHoursAnnual = tasks.reduce((sum, t) => sum + t.recoveredHoursAnnual, 0);

  return {
    engineVersion: ENGINE_VERSION,
    industryKey: industry.key,
    rate,
    tasks,
    rawTotalHoursPerWeek,
    totalHoursPerWeek,
    clamped,
    totalBleed,
    totalRecovered,
    totalRecoveredHoursAnnual,
    payback: computePayback(totalRecovered, tasks.length),
    missedWork: inputs.missedWork ? computeMissedWork(inputs.missedWork) : null,
  };
}

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
