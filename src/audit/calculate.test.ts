import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateBookingHours,
  calculateAdminHours,
  calculateHardCostWeekly,
  calculateRecoverableRange,
  calculateMissedRevenueWeekly,
  calculatePaybackWeeksRange,
  calculateAuditFigures,
  roundToNearest10,
  type AuditAnswers,
} from "./calculate.js";

// Hand-worked example (25-50 calls/day, 1-3 missed/day, 10-20 min/booking,
// 3-6 hrs/wk reminders, 1-3 hrs/wk approvals, $50-70/hr, $600-1500 avg job):
//   bookingHours  = (37.5 - 2) * 15 / 60 * 5 = 44.375
//   adminHours    = 44.375 + 4.5 + 2         = 50.875
//   hardCostWeekly = 50.875 * 60             = 3052.5   -> rounds to 3050
//   recoverable    = 3052.5 * [0.6, 0.8]     = [1831.5, 2442]  -> [1830, 2440]
//   missedRevenue  = 2 * 5 * 0.3 * 1050      = 3150
//   payback        = 5000 / (3052.5 * [0.8, 0.6]) = [2.05, 2.73] weeks -> [2, 3]
const HAND_WORKED_ANSWERS: AuditAnswers = {
  callsPerDay: 37.5,
  missedCallsPerDay: 2,
  bookingMinutes: 15,
  reminderHoursPerWeek: 4.5,
  approvalHoursPerWeek: 2,
  peopleCount: 2,
  hourlyCost: 60,
  averageJobValue: 1050,
};

describe("roundToNearest10", () => {
  it("rounds to the nearest $10", () => {
    assert.equal(roundToNearest10(3052.5), 3050);
    assert.equal(roundToNearest10(1831.5), 1830);
    assert.equal(roundToNearest10(2442), 2440);
    assert.equal(roundToNearest10(4), 0);
    assert.equal(roundToNearest10(5), 10);
  });
});

describe("calculateBookingHours", () => {
  it("counts only answered calls, five days a week", () => {
    assert.equal(calculateBookingHours(37.5, 2, 15), 44.375);
  });

  it("never goes negative when missed calls exceed calls", () => {
    assert.equal(calculateBookingHours(5, 10, 10), 0);
  });
});

describe("calculateAdminHours", () => {
  it("sums booking, reminder and approval hours, no headcount multiplier", () => {
    assert.equal(calculateAdminHours(44.375, 4.5, 2), 50.875);
  });
});

describe("calculateHardCostWeekly", () => {
  it("multiplies admin hours by hourly cost", () => {
    assert.equal(calculateHardCostWeekly(50.875, 60), 3052.5);
  });
});

describe("calculateRecoverableRange", () => {
  it("returns a conservative 60%-80% range, rounded to the nearest $10", () => {
    assert.deepEqual(calculateRecoverableRange(3052.5), { low: 1830, high: 2440 });
  });

  it("never claims the full hard cost", () => {
    const { high } = calculateRecoverableRange(1000);
    assert.ok(high < 1000);
  });
});

describe("calculateMissedRevenueWeekly", () => {
  it("applies the assumed conversion rate to missed calls, kept separate from hard cost", () => {
    assert.equal(calculateMissedRevenueWeekly(2, 1050), 3150);
  });

  it("accepts an override conversion rate for testing the assumption", () => {
    assert.equal(calculateMissedRevenueWeekly(2, 1050, 0.5), 5250);
  });
});

describe("calculatePaybackWeeksRange", () => {
  it("returns a whole-week range from the 80% and 60% recovery ends", () => {
    assert.deepEqual(calculatePaybackWeeksRange(3052.5), { low: 2, high: 3 });
  });

  it("returns null when there is no hard cost to recover against", () => {
    assert.equal(calculatePaybackWeeksRange(0), null);
  });
});

describe("calculateAuditFigures", () => {
  it("matches the hand-worked example end to end", () => {
    const figures = calculateAuditFigures(HAND_WORKED_ANSWERS);
    assert.equal(figures.bookingHours, 44.375);
    assert.equal(figures.adminHours, 50.875);
    assert.equal(figures.hardCostWeekly, 3050);
    assert.deepEqual(figures.recoverableWeekly, { low: 1830, high: 2440 });
    assert.equal(figures.missedRevenueWeekly, 3150);
    assert.deepEqual(figures.paybackWeeks, { low: 2, high: 3 });
  });

  it("stores peopleCount without letting it affect the maths", () => {
    const base = calculateAuditFigures(HAND_WORKED_ANSWERS);
    const withMorePeople = calculateAuditFigures({ ...HAND_WORKED_ANSWERS, peopleCount: 4 });
    assert.deepEqual(withMorePeople, base);
  });
});
