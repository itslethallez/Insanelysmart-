/**
 * Mechanic AI Savings Calculator engine. Mechanic-only - the previous multi-industry
 * version (trades/accountant/allied health) has been retired; see git history if any
 * of that maths needs resurrecting for another industry later.
 */

/** Bumped whenever the maths changes, so a stored audit can be traced to the rules it was shown under. */
export const ENGINE_VERSION = 2;

/** Working weeks used for every annualised figure on this page. Not 52 - allows for holidays and downtime. */
export const WORKING_WEEKS = 48;

export const HOURLY_RATE_MIN = 20;
export const HOURLY_RATE_MAX = 400;
export const HOURLY_RATE_STEP = 5;
export const HOURLY_RATE_DEFAULT = 120;

export const WORKERS_MIN = 1;
export const WORKERS_MAX = 50;
export const WORKERS_DEFAULT = 3;

export const JOBS_PER_WEEK_MIN = 0;
export const JOBS_PER_WEEK_MAX = 300;
export const JOBS_PER_WEEK_DEFAULT = 45;

export const AVERAGE_INVOICE_MIN = 0;
export const AVERAGE_INVOICE_MAX = 5000;
export const AVERAGE_INVOICE_STEP = 10;
export const AVERAGE_INVOICE_DEFAULT = 320;

export const HOURS_MIN = 0.5;
export const HOURS_MAX = 40;
export const HOURS_STEP = 0.5;
export const HOURS_DEFAULT = 2;

export const MISSED_CALLS_MIN = 0;
export const MISSED_CALLS_MAX = 30;
export const MISSED_CALLS_STEP = 1;
export const MISSED_CALLS_DEFAULT = 3;

/** Fixed assumption behind Opportunity 3 (missed calls) - not asked as its own question. */
export const MISSED_CALL_CONVERSION_RATE = 0.3;

/**
 * Opportunity 1 (service reminders), only shown when the reminders task card is
 * answered "No". My own conservative estimate, not a cited stat.
 */
export const ACTIVE_CUSTOMER_MULTIPLIER = 1.2; // jobs/week -> estimated active customers
export const RETENTION_AT_RISK_FRACTION = 1 / 6; // ~16.7% of active customers assumed at risk without reminders
export const RETENTION_RECOVERY_PCT = 0.2; // conservative recovery of the at-risk group

/**
 * Opportunity 2 (quote follow-up), only shown when the reader spends time chasing
 * quotes. No dedicated "quotes issued per week" question - always estimated from
 * jobs/week, per the spec's own fallback.
 */
export const QUOTED_JOBS_MULTIPLIER = 1.2;
export const QUOTE_FOLLOWUP_RECOVERY_PCT = 0.1;

export type PlanKey = "starter" | "growth" | "pro" | "enterprise";

export type Plan = {
  key: PlanKey;
  name: string;
  /** Null for Enterprise - custom pricing, no fixed monthly figure to calculate payback against. */
  monthlyPrice: number | null;
};

export const PLANS: Plan[] = [
  { key: "starter", name: "Starter", monthlyPrice: 149 },
  { key: "growth", name: "Growth", monthlyPrice: 299 },
  { key: "pro", name: "Pro", monthlyPrice: 499 },
  { key: "enterprise", name: "Enterprise", monthlyPrice: null },
];

function planForWorkers(workers: number): Plan {
  if (workers >= 10) return PLANS[3];
  if (workers >= 5) return PLANS[2];
  if (workers >= 2) return PLANS[1];
  return PLANS[0];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export type LeadCapture = {
  fullName: string;
  mobile: string;
  companyName: string;
};

export type TaskHoursEntry = {
  key: string;
  /** Hours per week spent on this task. Card J (other) also carries a free-text note, kept separately. */
  hours: number;
};

export type AuditInputs = {
  lead: LeadCapture;
  hourlyRate: number;
  workers: number;
  jobsPerWeek: number;
  averageInvoice: number;
  /** Only the cards answered "Yes" - an absent key (e.g. "reminders") means "No". */
  taskHours: TaskHoursEntry[];
  otherAdminNote?: string;
  /** Always asked, regardless of whether the "returning missed calls" card was ticked. */
  missedCallsPerWeek: number;
};

export type TaskFigure = {
  key: string;
  hours: number;
  weeklyCost: number;
};

export type ReminderOpportunity = {
  activeCustomersEstimate: number;
  customersAtRisk: number;
  recoverableCustomers: number;
  annualOpportunity: number;
} | null;

export type QuoteFollowUpOpportunity = {
  quotedJobsPerWeekEstimate: number;
  annualOpportunity: number;
} | null;

export type MissedCallOpportunity = {
  missedCallsPerWeek: number;
  conversionRate: number;
  annualOpportunity: number;
};

export type RecommendedPlan = {
  plan: Plan;
  monthlyBenefit: number;
  weeklyBenefit: number;
  /** Null when the plan has no fixed monthly price (Enterprise) or benefit is zero. */
  paybackWeeks: number | null;
};

export type AuditFigures = {
  engineVersion: number;
  hourlyRate: number;
  workers: number;
  jobsPerWeek: number;
  averageInvoice: number;
  tasks: TaskFigure[];
  totalAdminHoursPerWeek: number;
  weeklyAdminCost: number;
  annualAdminCost: number;
  reminders: ReminderOpportunity;
  quoteFollowUp: QuoteFollowUpOpportunity;
  missedCalls: MissedCallOpportunity;
  totalAnnualRevenueOpportunity: number;
  totalAnnualBenefit: number;
  recommendedPlan: RecommendedPlan;
};

function computeReminderOpportunity(
  remindersTicked: boolean,
  jobsPerWeek: number,
  averageInvoice: number,
): ReminderOpportunity {
  if (remindersTicked) return null; // already sends reminders - no opportunity to show

  const activeCustomersEstimate = jobsPerWeek * WORKING_WEEKS * ACTIVE_CUSTOMER_MULTIPLIER;
  const customersAtRisk = activeCustomersEstimate * RETENTION_AT_RISK_FRACTION;
  const recoverableCustomers = customersAtRisk * RETENTION_RECOVERY_PCT;
  const annualOpportunity = recoverableCustomers * averageInvoice;

  return { activeCustomersEstimate, customersAtRisk, recoverableCustomers, annualOpportunity };
}

function computeQuoteFollowUpOpportunity(
  followingUpQuotesTicked: boolean,
  jobsPerWeek: number,
  averageInvoice: number,
): QuoteFollowUpOpportunity {
  if (!followingUpQuotesTicked) return null;

  const quotedJobsPerWeekEstimate = jobsPerWeek * QUOTED_JOBS_MULTIPLIER;
  const annualOpportunity = quotedJobsPerWeekEstimate * QUOTE_FOLLOWUP_RECOVERY_PCT * averageInvoice * WORKING_WEEKS;

  return { quotedJobsPerWeekEstimate, annualOpportunity };
}

function computeMissedCallOpportunity(missedCallsPerWeek: number, averageInvoice: number): MissedCallOpportunity {
  const calls = Math.max(missedCallsPerWeek, 0);
  const annualOpportunity = calls * MISSED_CALL_CONVERSION_RATE * averageInvoice * WORKING_WEEKS;
  return { missedCallsPerWeek: calls, conversionRate: MISSED_CALL_CONVERSION_RATE, annualOpportunity };
}

function computeRecommendedPlan(workers: number, totalAnnualBenefit: number): RecommendedPlan {
  const plan = planForWorkers(workers);
  const monthlyBenefit = totalAnnualBenefit / 12;
  const weeklyBenefit = monthlyBenefit / 4;
  const paybackWeeks =
    plan.monthlyPrice !== null && weeklyBenefit > 0
      ? Math.max(1, Math.ceil(plan.monthlyPrice / weeklyBenefit))
      : null;

  return { plan, monthlyBenefit, weeklyBenefit, paybackWeeks };
}

/**
 * Computes every figure the calculator shows from raw inputs. Always recomputed
 * server-side from the raw answers on save (never trusts client-submitted numbers) -
 * the client copy of this logic only drives the instant on-device reveal.
 */
export function calculateAuditFigures(inputs: AuditInputs): AuditFigures {
  const hourlyRate = clamp(inputs.hourlyRate, 0, HOURLY_RATE_MAX);
  const workers = clamp(inputs.workers, WORKERS_MIN, WORKERS_MAX);
  const jobsPerWeek = Math.max(inputs.jobsPerWeek, 0);
  const averageInvoice = Math.max(inputs.averageInvoice, 0);

  const tasks: TaskFigure[] = inputs.taskHours.map((entry) => {
    const hours = Math.max(entry.hours, 0);
    return { key: entry.key, hours, weeklyCost: hours * hourlyRate };
  });

  const totalAdminHoursPerWeek = tasks.reduce((sum, t) => sum + t.hours, 0);
  const weeklyAdminCost = tasks.reduce((sum, t) => sum + t.weeklyCost, 0);
  const annualAdminCost = weeklyAdminCost * WORKING_WEEKS;

  const taskKeys = new Set(inputs.taskHours.map((t) => t.key));
  const reminders = computeReminderOpportunity(taskKeys.has("reminders"), jobsPerWeek, averageInvoice);
  const quoteFollowUp = computeQuoteFollowUpOpportunity(taskKeys.has("followingUpQuotes"), jobsPerWeek, averageInvoice);
  const missedCalls = computeMissedCallOpportunity(inputs.missedCallsPerWeek, averageInvoice);

  const totalAnnualRevenueOpportunity =
    (reminders?.annualOpportunity ?? 0) + (quoteFollowUp?.annualOpportunity ?? 0) + missedCalls.annualOpportunity;
  const totalAnnualBenefit = annualAdminCost + totalAnnualRevenueOpportunity;

  return {
    engineVersion: ENGINE_VERSION,
    hourlyRate,
    workers,
    jobsPerWeek,
    averageInvoice,
    tasks,
    totalAdminHoursPerWeek,
    weeklyAdminCost,
    annualAdminCost,
    reminders,
    quoteFollowUp,
    missedCalls,
    totalAnnualRevenueOpportunity,
    totalAnnualBenefit,
    recommendedPlan: computeRecommendedPlan(workers, totalAnnualBenefit),
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
