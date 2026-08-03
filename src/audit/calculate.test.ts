import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateAuditFigures,
  HOURS_MAX,
  RATE_MAX,
  PAYBACK_FLOOR_WEEKS,
  TOTAL_HOURS_CAP,
  type AuditInputs,
} from "./calculate.js";

function inputs(overrides: Partial<AuditInputs> = {}): AuditInputs {
  return {
    industryKey: "mechanic",
    rate: 55,
    taskHours: [],
    ...overrides,
  };
}

describe("calculateAuditFigures: adding a task always increases totals", () => {
  test("bleed and recovery strictly increase when a second task is added, well under the cap", () => {
    const one = calculateAuditFigures(
      inputs({ taskHours: [{ key: "answeringCalls", hours: 3 }] }),
    );
    const two = calculateAuditFigures(
      inputs({
        taskHours: [
          { key: "answeringCalls", hours: 3 },
          { key: "reminders", hours: 3 },
        ],
      }),
    );

    assert.ok(two.totalBleed > one.totalBleed, "totalBleed should increase");
    assert.ok(two.totalRecovered > one.totalRecovered, "totalRecovered should increase");
  });

  test("adding a low-recovery-percentage task still never decreases either total", () => {
    // quotes has the lowest recoveryPct (0.40) of the mechanic tasks - this is the exact
    // shape of the old bug: a low-percentage task must never pull the total down.
    const before = calculateAuditFigures(
      inputs({
        taskHours: [
          { key: "answeringCalls", hours: 5 },
          { key: "reminders", hours: 5 },
        ],
      }),
    );
    const after = calculateAuditFigures(
      inputs({
        taskHours: [
          { key: "answeringCalls", hours: 5 },
          { key: "reminders", hours: 5 },
          { key: "quotes", hours: 1 },
        ],
      }),
    );

    assert.ok(after.totalBleed > before.totalBleed);
    assert.ok(after.totalRecovered > before.totalRecovered);
  });
});

describe("calculateAuditFigures: 60-hour cap", () => {
  test("total hours never exceeds the cap even when raw slider hours would", () => {
    const figures = calculateAuditFigures(
      inputs({
        taskHours: [
          { key: "answeringCalls", hours: HOURS_MAX },
          { key: "reminders", hours: HOURS_MAX },
          { key: "booking", hours: HOURS_MAX },
          { key: "quotes", hours: HOURS_MAX },
          { key: "retyping", hours: HOURS_MAX },
        ],
      }),
    );

    assert.equal(figures.rawTotalHoursPerWeek, HOURS_MAX * 5);
    assert.equal(figures.totalHoursPerWeek, TOTAL_HOURS_CAP);
    assert.equal(figures.clamped, true);
  });

  test("a task added once the cap is already reached does not reduce earlier tasks' totals", () => {
    // First three tasks alone exactly hit the 60-hour cap (20 + 20 + 20).
    const atCap = calculateAuditFigures(
      inputs({
        taskHours: [
          { key: "answeringCalls", hours: HOURS_MAX },
          { key: "reminders", hours: HOURS_MAX },
          { key: "booking", hours: HOURS_MAX },
        ],
      }),
    );
    assert.equal(atCap.clamped, false, "exactly at the cap is not over it");

    const withExtra = calculateAuditFigures(
      inputs({
        taskHours: [
          { key: "answeringCalls", hours: HOURS_MAX },
          { key: "reminders", hours: HOURS_MAX },
          { key: "booking", hours: HOURS_MAX },
          { key: "quotes", hours: HOURS_MAX },
        ],
      }),
    );

    assert.equal(withExtra.clamped, true);
    // The fourth task gets zero remaining budget, so totals are unchanged, not decreased.
    assert.equal(withExtra.totalBleed, atCap.totalBleed);
    assert.equal(withExtra.totalRecovered, atCap.totalRecovered);
    assert.equal(withExtra.totalHoursPerWeek, TOTAL_HOURS_CAP);
  });

  test("tasks chosen earlier keep their full hours regardless of what's chosen later", () => {
    const figures = calculateAuditFigures(
      inputs({
        taskHours: [
          { key: "answeringCalls", hours: 10 },
          { key: "reminders", hours: HOURS_MAX },
          { key: "booking", hours: HOURS_MAX },
          { key: "quotes", hours: HOURS_MAX },
        ],
      }),
    );
    const firstTask = figures.tasks.find((t) => t.key === "answeringCalls");
    assert.equal(firstTask?.hours, 10, "first-chosen task keeps its full requested hours");
  });
});

describe("calculateAuditFigures: payback floor", () => {
  test("payback is never shown as less than 4 weeks even for a very fast recovery", () => {
    const figures = calculateAuditFigures(
      inputs({
        rate: RATE_MAX,
        taskHours: [{ key: "answeringCalls", hours: HOURS_MAX }],
      }),
    );

    assert.ok(figures.payback);
    assert.equal(figures.payback?.weeksToPayback, PAYBACK_FLOOR_WEEKS);
  });

  test("payback is null when nothing is chosen yet", () => {
    const figures = calculateAuditFigures(inputs({ taskHours: [] }));
    assert.equal(figures.payback, null);
  });

  test("build anchor is 1500 for one task and 5000 for more than one", () => {
    const oneTask = calculateAuditFigures(
      inputs({ taskHours: [{ key: "answeringCalls", hours: 3 }] }),
    );
    const twoTasks = calculateAuditFigures(
      inputs({
        taskHours: [
          { key: "answeringCalls", hours: 3 },
          { key: "reminders", hours: 3 },
        ],
      }),
    );

    assert.equal(oneTask.payback?.buildAnchor, 1500);
    assert.equal(twoTasks.payback?.buildAnchor, 5000);
  });
});

describe("calculateAuditFigures: missed work stays separate from time bleed", () => {
  test("missedWork.missedAnnual is never folded into totalBleed or totalRecovered", () => {
    const withoutMissedWork = calculateAuditFigures(
      inputs({ taskHours: [{ key: "answeringCalls", hours: 5 }] }),
    );
    const withMissedWork = calculateAuditFigures(
      inputs({
        taskHours: [{ key: "answeringCalls", hours: 5 }],
        missedWork: { callsMissedPerWeek: 3, conversionRate: 0.3, averageJobValue: 400 },
      }),
    );

    assert.equal(withMissedWork.totalBleed, withoutMissedWork.totalBleed);
    assert.equal(withMissedWork.totalRecovered, withoutMissedWork.totalRecovered);
    assert.ok(withMissedWork.missedWork);
    assert.equal(withMissedWork.missedWork?.missedAnnual, 3 * 46 * 0.3 * 400);
  });

  test("missedWork is null when no missed-work inputs are given", () => {
    const figures = calculateAuditFigures(
      inputs({ taskHours: [{ key: "answeringCalls", hours: 5 }] }),
    );
    assert.equal(figures.missedWork, null);
  });
});
