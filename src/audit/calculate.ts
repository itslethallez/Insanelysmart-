import type { AuditQuestionId } from "./types.js";

export type AuditAnswers = Record<AuditQuestionId, number>;

export type Range = { low: number; high: number };

export type AuditFigures = {
  bookingHours: number;
  reminderHours: number;
  approvalHours: number;
  adminHours: number;
  /** Weekly hard cost of the admin, rounded to the nearest $10. */
  hardCostWeekly: number;
  /** What a system conservatively recovers, rounded to the nearest $10. */
  recoverableWeekly: Range;
  /** Possible upside from missed calls, kept separate from the hard cost. Rounded to the nearest $10. */
  missedRevenueWeekly: number;
  /** Weeks to pay back the $5,000 build, rounded to whole weeks. Null when there's no cost to recover against. */
  paybackWeeks: Range | null;
};

/**
 * Share of missed calls that would have become a booking. An assumption, not a
 * measurement — shown on screen as such, since it's the figure most likely to
 * be challenged.
 */
export const ASSUMED_CONVERSION_RATE = 0.3;

/** Conservative range for how much of the admin hours a system actually removes. */
export const RECOVERY_RATE_LOW = 0.6;
export const RECOVERY_RATE_HIGH = 0.8;

/** The Proof of Value build cost used to work out the payback window. */
export const SYSTEM_COST = 5000;

export function roundToNearest10(amount: number): number {
  return Math.round(amount / 10) * 10;
}

/** Hours a week spent taking and entering bookings for calls that were actually answered. */
export function calculateBookingHours(
  callsPerDay: number,
  missedCallsPerDay: number,
  bookingMinutes: number,
): number {
  const answeredCallsPerDay = Math.max(callsPerDay - missedCallsPerDay, 0);
  return (answeredCallsPerDay * bookingMinutes) / 60 * 5;
}

/**
 * Total weekly admin hours. Headcount is deliberately not a multiplier here —
 * it tells us how the work is spread, not that it happens more than once.
 */
export function calculateAdminHours(
  bookingHours: number,
  reminderHoursPerWeek: number,
  approvalHoursPerWeek: number,
): number {
  return bookingHours + reminderHoursPerWeek + approvalHoursPerWeek;
}

export function calculateHardCostWeekly(adminHours: number, hourlyCost: number): number {
  return adminHours * hourlyCost;
}

/** Conservative recovery range (60%-80% of the hard cost), never the full figure. */
export function calculateRecoverableRange(hardCostWeekly: number): Range {
  return {
    low: roundToNearest10(hardCostWeekly * RECOVERY_RATE_LOW),
    high: roundToNearest10(hardCostWeekly * RECOVERY_RATE_HIGH),
  };
}

/** Possible upside from missed calls converting into bookings. Kept separate from the hard cost. */
export function calculateMissedRevenueWeekly(
  missedCallsPerDay: number,
  averageJobValue: number,
  conversionRate: number = ASSUMED_CONVERSION_RATE,
): number {
  return roundToNearest10(missedCallsPerDay * 5 * conversionRate * averageJobValue);
}

/** Weeks to pay back the system cost, as a range across the recovery band. Null if there's no cost to recover. */
export function calculatePaybackWeeksRange(hardCostWeekly: number): Range | null {
  if (hardCostWeekly <= 0) return null;

  const fastWeeks = SYSTEM_COST / (hardCostWeekly * RECOVERY_RATE_HIGH);
  const slowWeeks = SYSTEM_COST / (hardCostWeekly * RECOVERY_RATE_LOW);

  return {
    low: Math.round(fastWeeks),
    high: Math.round(slowWeeks),
  };
}

/**
 * What's stored on `people.audit`: the vertical key, the raw band values the
 * person picked, and the figures computed from them. Keeping the raw answers
 * lets old audits be recomputed if the maths changes later instead of lost.
 */
export type AuditRecord = {
  vertical: string;
  answers: AuditAnswers;
  figures: AuditFigures;
};

export function calculateAuditFigures(answers: AuditAnswers): AuditFigures {
  const bookingHours = calculateBookingHours(
    answers.callsPerDay,
    answers.missedCallsPerDay,
    answers.bookingMinutes,
  );
  const adminHours = calculateAdminHours(
    bookingHours,
    answers.reminderHoursPerWeek,
    answers.approvalHoursPerWeek,
  );
  const hardCostWeeklyExact = calculateHardCostWeekly(adminHours, answers.hourlyCost);

  return {
    bookingHours,
    reminderHours: answers.reminderHoursPerWeek,
    approvalHours: answers.approvalHoursPerWeek,
    adminHours,
    hardCostWeekly: roundToNearest10(hardCostWeeklyExact),
    recoverableWeekly: calculateRecoverableRange(hardCostWeeklyExact),
    missedRevenueWeekly: calculateMissedRevenueWeekly(
      answers.missedCallsPerDay,
      answers.averageJobValue,
    ),
    paybackWeeks: calculatePaybackWeeksRange(hardCostWeeklyExact),
  };
}
