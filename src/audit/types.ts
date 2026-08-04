/**
 * A single piece of repetitive work within an industry, with the fraction of it
 * a system realistically removes. Percentages are fixed per task, not user input -
 * they're what makes the maths defensible in front of an accountant.
 */
export type Task = {
  key: string;
  label: string;
  /** Fraction of taskBleed a system realistically recovers, e.g. 0.45. */
  recoveryPct: number;
  /**
   * Shown under this task's row on Screen 2 whenever it's left unticked - a qualitative
   * reason to reconsider, never a number. Never read by calculate.ts and never appears
   * on the results screen; purely a Screen 2 cross-sell nudge.
   */
  nudge?: string;
  /**
   * Always-visible capability-honesty note under this task's row on Screen 2, regardless
   * of ticked state - sets expectations about what automation can/can't do for this task.
   * Never read by calculate.ts, never appears on the results screen.
   */
  note?: string;
};

export type Industry = {
  key: string;
  name: string;
  tasks: Task[];
  /** Whether the missed-work (lost revenue) module applies to this industry. */
  hasMissedWork: boolean;
};
