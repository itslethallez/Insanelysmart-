/**
 * Canonical question ids. Every vertical's questions must use these ids so that
 * calculate.ts and the UI never need to change when a new vertical is added —
 * only the labels, help text and band wording differ per trade.
 */
export type AuditQuestionId =
  | "callsPerDay"
  | "missedCallsPerDay"
  | "bookingMinutes"
  | "reminderHoursPerWeek"
  | "approvalHoursPerWeek"
  | "peopleCount"
  | "hourlyCost"
  | "averageJobValue";

export type Band = {
  /** Shown to the user, e.g. "10-25". */
  label: string;
  /** Mid-point of the band used in the maths (top band uses its floor). */
  value: number;
};

export type Question = {
  id: AuditQuestionId;
  label: string;
  help?: string;
  bands: Band[];
};

export type Vertical = {
  key: string;
  name: string;
  questions: Question[];
};
