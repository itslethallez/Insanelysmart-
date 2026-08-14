/**
 * Mechanic AI Savings Calculator engine. Mechanic-only - the previous multi-industry
 * version (trades/accountant/allied health) has been retired; see git history if any
 * of that maths needs resurrecting for another industry later.
 */

/** Bumped whenever the maths changes, so a stored audit can be traced to the rules it was shown under. */
export const ENGINE_VERSION = 4;

/** Working weeks used for every annualised figure on this page. Not 52 - allows for holidays and downtime. */
export const WORKING_WEEKS = 46;

export const HOURLY_RATE_MIN = 20;
export const HOURLY_RATE_MAX = 400;
export const HOURLY_RATE_STEP = 5;
export const HOURLY_RATE_DEFAULT = 120;

/** What the owner pays the person doing the admin - the rate the hard cost figure is built from, never the charge-out rate. */
export const ADMIN_COST_RATE_MIN = 15;
export const ADMIN_COST_RATE_MAX = 200;
export const ADMIN_COST_RATE_STEP = 5;
export const ADMIN_COST_RATE_DEFAULT = 40;

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

// Shared by the anchor slider (Screen A) and all four bucket sliders (Screens B-E). Min is 0,
// not 0.5 - every slider must be able to sit at zero so its starting value is a real zero, not
// silently clamped up to a nonzero minimum by the browser's native range-input behaviour.
export const HOURS_MIN = 0;
export const HOURS_MAX = 40;
export const HOURS_STEP = 0.5;
/** Every hours slider starts at zero - the user must move it, nothing is silently counted. */
export const HOURS_DEFAULT = 0;

export const MISSED_CALLS_MIN = 0;
export const MISSED_CALLS_MAX = 30;
export const MISSED_CALLS_STEP = 1;
export const MISSED_CALLS_DEFAULT = 0;

/**
 * Missed-call leak, split into two inspectable steps rather than one flat conversion rate:
 * what share of the missed calls were new customers (entered), and what share of those would
 * have become a job (fixed, conservative - even a new caller often rings back).
 */
export const NEW_CALLER_PCT_MIN = 0;
export const NEW_CALLER_PCT_MAX = 100;
export const NEW_CALLER_PCT_STEP = 5;
export const NEW_CALLER_PCT_DEFAULT = 30;
export const MISSED_CALL_NEW_CALLER_LOSS_RATE = 0.15;

/**
 * Quote leak, grounded in what's actually entered - quotes sent per week and roughly what
 * portion go quiet - rather than inferred from a Yes/No answer.
 */
export const QUOTES_PER_WEEK_MIN = 0;
export const QUOTES_PER_WEEK_MAX = 100;
export const QUOTES_PER_WEEK_STEP = 1;
export const QUOTES_PER_WEEK_DEFAULT = 0;
export const QUOTE_QUIET_PCT_MIN = 0;
export const QUOTE_QUIET_PCT_MAX = 100;
export const QUOTE_QUIET_PCT_STEP = 5;
export const QUOTE_QUIET_PCT_DEFAULT = 0;
export const QUOTE_RECOVERY_RATE = 0.1;

/**
 * Reminder leak, grounded in the actual size of the customer book rather than derived from
 * jobs/week. Only shown when reminders aren't sent consistently AND there's a real book to
 * lose repeat business from.
 */
export const ACTIVE_CUSTOMERS_MIN = 0;
export const ACTIVE_CUSTOMERS_MAX = 2000;
export const ACTIVE_CUSTOMERS_STEP = 10;
export const ACTIVE_CUSTOMERS_DEFAULT = 0;
export const REMINDER_REPEAT_RATE = 0.05;

/** A leak total above this share of estimated annual revenue gets capped - no figure should look like a joke to a sensible owner. */
export const LEAK_CAP_FRACTION_OF_REVENUE = 0.12;
/** Tolerance against floating-point summation noise - a leak a fraction of a cent over the cap must not read as "capped". */
const LEAK_CAP_EPSILON = 0.5;

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

/**
 * Hours per week in each of the four fixed admin-time buckets (Screens B-E). This is the
 * only input labour cost is built from - never anchorHours, never any leak answer.
 */
export type AdminTimeBuckets = {
  phoneMessages: number;
  bookingsScheduling: number;
  quotesInvoices: number;
  recordsDataEntry: number;
};

/** A three-way consistency answer. Currently only used for the reminders leak question. */
export const CONSISTENCY_VALUES = ["yes", "no", "not_consistently"] as const;
export type ConsistencyAnswer = (typeof CONSISTENCY_VALUES)[number];

export type AuditInputs = {
  lead: LeadCapture;
  hourlyRate: number;
  /** What the owner pays the person doing the admin - the hard-cost headline is built from this, never hourlyRate. */
  adminCostRate: number;
  workers: number;
  jobsPerWeek: number;
  averageInvoice: number;
  /** Screen A's own single-slider estimate - a sanity ceiling for the buckets, never used in any dollar calculation. */
  anchorHours: number;
  /** Screens B-E - the sole source of labour hours and labour cost. */
  buckets: AdminTimeBuckets;
  /** Screen G - descriptive only, never contributes hours. */
  otherAdminNote?: string;
  /** Screen F - always asked, independent of every bucket. */
  missedCallsPerWeek: number;
  /** Screen F - of the missed calls, roughly what share are new customers rather than existing ones. */
  newCallerPct: number;
  /** Screen F - do customers actually get a reminder at all. */
  reminderConsistency: ConsistencyAnswer;
  /** Screen F - roughly how many active customers are on the books. */
  activeCustomers: number;
  /** Screen F - quotes sent per week. */
  quotesPerWeek: number;
  /** Screen F - roughly what portion of quotes go quiet without an answer. */
  quietPct: number;
};

export type BucketFigure = {
  key: keyof AdminTimeBuckets;
  hours: number;
  weeklyCost: number;
};

export type ReminderOpportunity = {
  activeCustomers: number;
  missedRepeatJobsPerYear: number;
  annualOpportunity: number;
} | null;

export type QuoteFollowUpOpportunity = {
  quotesPerWeek: number;
  quietPct: number;
  recoveredJobsPerYear: number;
  annualOpportunity: number;
} | null;

export type MissedCallOpportunity = {
  missedCallsPerWeek: number;
  newCallerPct: number;
  lossRate: number;
  lostJobsPerYear: number;
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
  adminCostRate: number;
  workers: number;
  jobsPerWeek: number;
  averageInvoice: number;
  /** Screen A's estimate, carried through for display only - never part of any calculation. */
  anchorHours: number;
  buckets: BucketFigure[];
  totalAdminHoursPerWeek: number;
  adminHoursPerYear: number;
  /** Headline hard cost - admin hours valued at what the owner actually pays for that time, never the charge-out rate. Part A5: never summed with totalLeak. */
  annualAdminCostHard: number;
  /** Secondary, conditional figure - what those hours would be worth if redirected into billable work. Only lands if there's work to fill it. */
  annualBillableValue: number;
  reminders: ReminderOpportunity;
  quoteFollowUp: QuoteFollowUpOpportunity;
  missedCalls: MissedCallOpportunity;
  /** Estimated annual turnover (jobs/week x average invoice x working weeks) - the base the leak cap is measured against. */
  annualRevenueEstimate: number;
  /** The single leak headline - reminders + quote follow-up + missed calls, capped at LEAK_CAP_FRACTION_OF_REVENUE of annualRevenueEstimate. Part A5: never summed with annualAdminCostHard. */
  totalLeak: number;
  /** True only when totalLeak was actually scaled down to stay under the cap - never true from floating-point noise alone. */
  leakCapApplied: boolean;
  recommendedPlan: RecommendedPlan;
};

function computeReminderOpportunity(
  reminderConsistency: ConsistencyAnswer,
  activeCustomers: number,
  averageInvoice: number,
): ReminderOpportunity {
  if (reminderConsistency === "yes") return null; // reminders reach the customer - no opportunity to show
  const customers = Math.max(activeCustomers, 0);
  if (customers <= 0) return null; // nothing to ground the estimate in - don't show a card built on nothing

  const missedRepeatJobsPerYear = customers * REMINDER_REPEAT_RATE;
  const annualOpportunity = missedRepeatJobsPerYear * averageInvoice;

  return { activeCustomers: customers, missedRepeatJobsPerYear, annualOpportunity };
}

function computeQuoteFollowUpOpportunity(
  quotesPerWeek: number,
  quietPct: number,
  averageInvoice: number,
): QuoteFollowUpOpportunity {
  const quotes = Math.max(quotesPerWeek, 0);
  if (quotes <= 0) return null; // nothing to ground the estimate in - don't show a card built on nothing

  const quiet = clamp(quietPct, 0, 100) / 100;
  const recoveredJobsPerYear = quotes * quiet * WORKING_WEEKS * QUOTE_RECOVERY_RATE;
  const annualOpportunity = recoveredJobsPerYear * averageInvoice;

  return { quotesPerWeek: quotes, quietPct: clamp(quietPct, 0, 100), recoveredJobsPerYear, annualOpportunity };
}

function computeMissedCallOpportunity(
  missedCallsPerWeek: number,
  newCallerPct: number,
  averageInvoice: number,
): MissedCallOpportunity {
  const calls = Math.max(missedCallsPerWeek, 0);
  const newCallerFraction = clamp(newCallerPct, 0, 100) / 100;
  const lostJobsPerYear = calls * WORKING_WEEKS * newCallerFraction * MISSED_CALL_NEW_CALLER_LOSS_RATE;
  const annualOpportunity = lostJobsPerYear * averageInvoice;

  return {
    missedCallsPerWeek: calls,
    newCallerPct: clamp(newCallerPct, 0, 100),
    lossRate: MISSED_CALL_NEW_CALLER_LOSS_RATE,
    lostJobsPerYear,
    annualOpportunity,
  };
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
  const adminCostRate = clamp(inputs.adminCostRate, 0, ADMIN_COST_RATE_MAX);
  const workers = clamp(inputs.workers, WORKERS_MIN, WORKERS_MAX);
  const jobsPerWeek = Math.max(inputs.jobsPerWeek, 0);
  const averageInvoice = Math.max(inputs.averageInvoice, 0);
  const anchorHours = Math.max(inputs.anchorHours, 0);

  // Labour cost is built from these four buckets only - never anchorHours, never a leak answer.
  const bucketKeys: (keyof AdminTimeBuckets)[] = [
    "phoneMessages",
    "bookingsScheduling",
    "quotesInvoices",
    "recordsDataEntry",
  ];
  const buckets: BucketFigure[] = bucketKeys.map((key) => {
    const hours = Math.max(inputs.buckets[key] ?? 0, 0);
    return { key, hours, weeklyCost: hours * adminCostRate };
  });

  const totalAdminHoursPerWeek = buckets.reduce((sum, b) => sum + b.hours, 0);
  const adminHoursPerYear = totalAdminHoursPerWeek * WORKING_WEEKS;
  const annualAdminCostHard = totalAdminHoursPerWeek * adminCostRate * WORKING_WEEKS;
  const annualBillableValue = totalAdminHoursPerWeek * hourlyRate * WORKING_WEEKS;

  // Leak revenue is built from Screen F's answers only - never a bucket, never anchorHours.
  const reminders = computeReminderOpportunity(inputs.reminderConsistency, inputs.activeCustomers, averageInvoice);
  const quoteFollowUp = computeQuoteFollowUpOpportunity(inputs.quotesPerWeek, inputs.quietPct, averageInvoice);
  const missedCalls = computeMissedCallOpportunity(inputs.missedCallsPerWeek, inputs.newCallerPct, averageInvoice);

  // One leak headline, built from named, non-duplicated components - never shown as a
  // second, differently-labelled sum of the same figures, and never summed with the hard
  // admin cost (Part A5).
  const rawLeak = (reminders?.annualOpportunity ?? 0) + (quoteFollowUp?.annualOpportunity ?? 0) + missedCalls.annualOpportunity;
  const annualRevenueEstimate = jobsPerWeek * averageInvoice * WORKING_WEEKS;
  const leakCap = annualRevenueEstimate * LEAK_CAP_FRACTION_OF_REVENUE;
  // Epsilon guards against floating-point summation noise reporting a cap that didn't really bind.
  const leakCapApplied = leakCap > 0 && rawLeak - leakCap > LEAK_CAP_EPSILON;
  const leakScale = leakCapApplied && rawLeak > 0 ? leakCap / rawLeak : 1;
  const totalLeak = leakCapApplied ? leakCap : rawLeak;

  const scaledReminders: ReminderOpportunity = reminders
    ? { ...reminders, annualOpportunity: reminders.annualOpportunity * leakScale }
    : null;
  const scaledQuoteFollowUp: QuoteFollowUpOpportunity = quoteFollowUp
    ? { ...quoteFollowUp, annualOpportunity: quoteFollowUp.annualOpportunity * leakScale }
    : null;
  const scaledMissedCalls: MissedCallOpportunity = {
    ...missedCalls,
    annualOpportunity: missedCalls.annualOpportunity * leakScale,
  };

  return {
    engineVersion: ENGINE_VERSION,
    hourlyRate,
    adminCostRate,
    workers,
    jobsPerWeek,
    averageInvoice,
    anchorHours,
    buckets,
    totalAdminHoursPerWeek,
    adminHoursPerYear,
    annualAdminCostHard,
    annualBillableValue,
    reminders: scaledReminders,
    quoteFollowUp: scaledQuoteFollowUp,
    missedCalls: scaledMissedCalls,
    annualRevenueEstimate,
    totalLeak,
    leakCapApplied,
    recommendedPlan: computeRecommendedPlan(workers, annualAdminCostHard),
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
