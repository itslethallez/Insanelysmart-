import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateAuditFigures,
  WORKING_WEEKS,
  MISSED_CALL_NEW_CALLER_LOSS_RATE,
  QUOTE_RECOVERY_RATE,
  REMINDER_REPEAT_RATE,
  LEAK_CAP_FRACTION_OF_REVENUE,
  type AuditInputs,
  type AdminTimeBuckets,
} from "./calculate.js";

const EMPTY_BUCKETS: AdminTimeBuckets = {
  phoneMessages: 0,
  bookingsScheduling: 0,
  quotesInvoices: 0,
  recordsDataEntry: 0,
};

function inputs(overrides: Partial<AuditInputs> = {}): AuditInputs {
  return {
    lead: { fullName: "Jane Mechanic", mobile: "+61400000000", companyName: "Jane's Workshop" },
    hourlyRate: 85,
    adminCostRate: 40,
    workers: 3,
    jobsPerWeek: 45,
    averageInvoice: 320,
    anchorHours: 40,
    buckets: EMPTY_BUCKETS,
    missedCallsPerWeek: 0,
    newCallerPct: 30,
    reminderConsistency: "yes",
    activeCustomers: 0,
    quotesPerWeek: 0,
    quietPct: 0,
    ...overrides,
  };
}

describe("calculateAuditFigures: labour cost comes from buckets only", () => {
  test("hard cost values the sum of the four buckets at the admin cost rate, not the charge-out rate", () => {
    const figures = calculateAuditFigures(
      inputs({
        buckets: { phoneMessages: 3, bookingsScheduling: 0, quotesInvoices: 0, recordsDataEntry: 2 },
        hourlyRate: 100,
        adminCostRate: 40,
      }),
    );

    assert.equal(figures.totalAdminHoursPerWeek, 5);
    assert.equal(figures.adminHoursPerYear, 5 * WORKING_WEEKS);
    assert.equal(figures.annualAdminCostHard, 5 * 40 * WORKING_WEEKS);
    assert.equal(figures.annualBillableValue, 5 * 100 * WORKING_WEEKS);
  });

  test("anchorHours never affects labour cost, no matter what it's set to", () => {
    const withLowAnchor = calculateAuditFigures(
      inputs({ anchorHours: 1, buckets: { phoneMessages: 10, bookingsScheduling: 0, quotesInvoices: 0, recordsDataEntry: 0 } }),
    );
    const withHighAnchor = calculateAuditFigures(
      inputs({ anchorHours: 40, buckets: { phoneMessages: 10, bookingsScheduling: 0, quotesInvoices: 0, recordsDataEntry: 0 } }),
    );
    assert.equal(withLowAnchor.annualAdminCostHard, withHighAnchor.annualAdminCostHard);
  });

  test("leak answers never affect labour cost (Part A5)", () => {
    const noLeaks = calculateAuditFigures(inputs({ reminderConsistency: "yes", missedCallsPerWeek: 0, quotesPerWeek: 0 }));
    const allLeaks = calculateAuditFigures(
      inputs({ reminderConsistency: "no", activeCustomers: 500, missedCallsPerWeek: 20, quotesPerWeek: 10, quietPct: 50 }),
    );
    assert.equal(noLeaks.annualAdminCostHard, allLeaks.annualAdminCostHard);
  });
});

describe("A1: cap caption only fires when the cap actually binds", () => {
  test("leakCapApplied is false, and totalLeak equals the raw sum, when nothing is close to the cap", () => {
    const figures = calculateAuditFigures(
      inputs({ jobsPerWeek: 45, averageInvoice: 320, missedCallsPerWeek: 1, newCallerPct: 30 }),
    );
    assert.equal(figures.leakCapApplied, false);
    const expected = figures.missedCalls.annualOpportunity;
    assert.ok(Math.abs(figures.totalLeak - expected) < 0.01);
  });

  test("a leak within half a dollar of the cap does not count as capped (floating-point tolerance)", () => {
    // Construct a case where the raw leak lands a whisker above the cap due to float arithmetic,
    // not a real overage - the epsilon must absorb it.
    const jobsPerWeek = 10;
    const averageInvoice = 316.23; // deliberately awkward decimal
    const cap = jobsPerWeek * averageInvoice * WORKING_WEEKS * LEAK_CAP_FRACTION_OF_REVENUE;
    // Pick missedCallsPerWeek so the raw leak lands extremely close to (but not meaningfully over) the cap.
    const targetAnnualOpportunity = cap; // aim exactly at the cap
    const lossPerCall = WORKING_WEEKS * 0.3 * MISSED_CALL_NEW_CALLER_LOSS_RATE * averageInvoice;
    const missedCallsPerWeek = targetAnnualOpportunity / lossPerCall;

    const figures = calculateAuditFigures(
      inputs({ jobsPerWeek, averageInvoice, missedCallsPerWeek, newCallerPct: 30 }),
    );
    assert.equal(figures.leakCapApplied, false);
  });

  test("caps for real when the raw leak genuinely exceeds the cap", () => {
    const figures = calculateAuditFigures(
      inputs({ jobsPerWeek: 1, averageInvoice: 50, missedCallsPerWeek: 30, newCallerPct: 100 }),
    );
    assert.equal(figures.leakCapApplied, true);
  });
});

describe("A2: missed calls, new-caller share x fixed loss rate", () => {
  test("matches the worked formula: calls x weeks x newCallerPct x 15%", () => {
    const figures = calculateAuditFigures(
      inputs({ missedCallsPerWeek: 7, newCallerPct: 30, averageInvoice: 377 }),
    );
    const lostJobsPerYear = 7 * WORKING_WEEKS * 0.3 * MISSED_CALL_NEW_CALLER_LOSS_RATE;
    assert.ok(Math.abs(figures.missedCalls.lostJobsPerYear - lostJobsPerYear) < 0.001);
    assert.ok(Math.abs(figures.missedCalls.annualOpportunity - lostJobsPerYear * 377) < 0.01);
    assert.equal(figures.missedCalls.lossRate, MISSED_CALL_NEW_CALLER_LOSS_RATE);
  });

  test("is zero, not null, when no calls are missed", () => {
    const figures = calculateAuditFigures(inputs({ missedCallsPerWeek: 0 }));
    assert.equal(figures.missedCalls.annualOpportunity, 0);
  });

  test("uses a 15% loss rate", () => {
    assert.equal(MISSED_CALL_NEW_CALLER_LOSS_RATE, 0.15);
  });
});

describe("A3: quotes, grounded in quotes sent and quiet percentage", () => {
  test("is null when quotes sent is 0, regardless of quietPct", () => {
    const figures = calculateAuditFigures(inputs({ quotesPerWeek: 0, quietPct: 80 }));
    assert.equal(figures.quoteFollowUp, null);
  });

  test("matches the worked formula: quotes x quietPct x 46 x 10%", () => {
    const figures = calculateAuditFigures(inputs({ quotesPerWeek: 12, quietPct: 50, averageInvoice: 377 }));
    const recoveredJobsPerYear = 12 * 0.5 * WORKING_WEEKS * QUOTE_RECOVERY_RATE;
    assert.ok(figures.quoteFollowUp);
    assert.ok(Math.abs(figures.quoteFollowUp!.recoveredJobsPerYear - recoveredJobsPerYear) < 0.001);
    assert.ok(Math.abs(figures.quoteFollowUp!.annualOpportunity - recoveredJobsPerYear * 377) < 0.01);
  });

  test("uses a 10% recovery rate", () => {
    assert.equal(QUOTE_RECOVERY_RATE, 0.1);
  });
});

describe("A4: reminders, grounded in active customers", () => {
  test("is null when reminders reach the customer, regardless of active customers", () => {
    const figures = calculateAuditFigures(inputs({ reminderConsistency: "yes", activeCustomers: 400 }));
    assert.equal(figures.reminders, null);
  });

  test("is null when active customers is 0, regardless of the reminder answer", () => {
    const figures = calculateAuditFigures(inputs({ reminderConsistency: "no", activeCustomers: 0 }));
    assert.equal(figures.reminders, null);
  });

  test("matches the worked formula: activeCustomers x 5% when both conditions are met", () => {
    const figures = calculateAuditFigures(inputs({ reminderConsistency: "no", activeCustomers: 400, averageInvoice: 377 }));
    const missedRepeatJobsPerYear = 400 * REMINDER_REPEAT_RATE;
    assert.ok(figures.reminders);
    assert.ok(Math.abs(figures.reminders!.missedRepeatJobsPerYear - missedRepeatJobsPerYear) < 0.001);
    assert.ok(Math.abs(figures.reminders!.annualOpportunity - missedRepeatJobsPerYear * 377) < 0.01);
  });

  test("Not consistently also opens the card, given active customers > 0", () => {
    const figures = calculateAuditFigures(inputs({ reminderConsistency: "not_consistently", activeCustomers: 100 }));
    assert.ok(figures.reminders);
  });

  test("uses a 5% repeat rate", () => {
    assert.equal(REMINDER_REPEAT_RATE, 0.05);
  });
});

describe("A5: hard cost and revenue at risk are never summed", () => {
  test("totalLeak never includes annualAdminCostHard", () => {
    const figures = calculateAuditFigures(
      inputs({
        buckets: { phoneMessages: 14, bookingsScheduling: 0, quotesInvoices: 0, recordsDataEntry: 0 },
        missedCallsPerWeek: 7,
        newCallerPct: 30,
      }),
    );
    assert.ok(figures.annualAdminCostHard > 0);
    assert.notEqual(figures.totalLeak, figures.annualAdminCostHard + figures.missedCalls.annualOpportunity);
    assert.equal(figures.totalLeak, figures.missedCalls.annualOpportunity);
  });

  test("components visibly add up to the leak headline when uncapped", () => {
    const figures = calculateAuditFigures(
      inputs({
        jobsPerWeek: 45,
        averageInvoice: 320,
        reminderConsistency: "no",
        activeCustomers: 100,
        quotesPerWeek: 3,
        quietPct: 20,
        missedCallsPerWeek: 1,
      }),
    );
    const sum =
      (figures.reminders?.annualOpportunity ?? 0) +
      (figures.quoteFollowUp?.annualOpportunity ?? 0) +
      figures.missedCalls.annualOpportunity;
    assert.ok(Math.abs(sum - figures.totalLeak) < 0.01);
    assert.equal(figures.leakCapApplied, false);
  });

  test("caps the leak at 12% of estimated annual revenue and scales components to still sum to it", () => {
    const figures = calculateAuditFigures(
      inputs({
        jobsPerWeek: 1,
        averageInvoice: 50,
        reminderConsistency: "no",
        activeCustomers: 2000,
        missedCallsPerWeek: 30,
        newCallerPct: 100,
      }),
    );

    const annualRevenueEstimate = 1 * 50 * WORKING_WEEKS;
    const expectedCap = annualRevenueEstimate * LEAK_CAP_FRACTION_OF_REVENUE;

    assert.equal(figures.leakCapApplied, true);
    assert.ok(Math.abs(figures.totalLeak - expectedCap) < 0.01);
    const sum = (figures.reminders?.annualOpportunity ?? 0) + figures.missedCalls.annualOpportunity;
    assert.ok(Math.abs(sum - figures.totalLeak) < 0.01);
  });
});

describe("calculateAuditFigures: recommended plan", () => {
  test("1 worker recommends Starter", () => {
    assert.equal(calculateAuditFigures(inputs({ workers: 1 })).recommendedPlan.plan.key, "starter");
  });
  test("2-4 workers recommends Growth", () => {
    assert.equal(calculateAuditFigures(inputs({ workers: 2 })).recommendedPlan.plan.key, "growth");
    assert.equal(calculateAuditFigures(inputs({ workers: 4 })).recommendedPlan.plan.key, "growth");
  });
  test("5-9 workers recommends Pro", () => {
    assert.equal(calculateAuditFigures(inputs({ workers: 5 })).recommendedPlan.plan.key, "pro");
    assert.equal(calculateAuditFigures(inputs({ workers: 9 })).recommendedPlan.plan.key, "pro");
  });
  test("10+ workers recommends Enterprise, with no fixed payback", () => {
    const figures = calculateAuditFigures(inputs({ workers: 10 }));
    assert.equal(figures.recommendedPlan.plan.key, "enterprise");
    assert.equal(figures.recommendedPlan.plan.monthlyPrice, null);
    assert.equal(figures.recommendedPlan.paybackWeeks, null);
  });
});

describe("calculateAuditFigures: payback", () => {
  test("matches the spec's worked example: $18,000/yr hard cost, Growth plan -> 1 week", () => {
    // $18,000/yr is $1,500/mo is $375/wk; Growth is $299/mo; ceil(299/375) = 1.
    const figures = calculateAuditFigures(
      inputs({
        workers: 2, // Growth
        adminCostRate: 100,
        buckets: { phoneMessages: 18000 / WORKING_WEEKS / 100, bookingsScheduling: 0, quotesInvoices: 0, recordsDataEntry: 0 },
        jobsPerWeek: 0,
        missedCallsPerWeek: 0,
      }),
    );

    assert.equal(figures.recommendedPlan.plan.key, "growth");
    assert.ok(Math.abs(figures.annualAdminCostHard - 18000) < 1);
    assert.equal(figures.recommendedPlan.monthlyBenefit, figures.annualAdminCostHard / 12);
    assert.equal(figures.recommendedPlan.weeklyBenefit, figures.recommendedPlan.monthlyBenefit / 4);
    assert.equal(figures.recommendedPlan.paybackWeeks, 1);
  });

  test("payback is rounded up to the nearest whole week", () => {
    const figures = calculateAuditFigures(
      inputs({
        workers: 1, // Starter, $149/mo
        adminCostRate: 50,
        buckets: { phoneMessages: 1, bookingsScheduling: 0, quotesInvoices: 0, recordsDataEntry: 0 }, // small benefit
        jobsPerWeek: 0,
        missedCallsPerWeek: 0,
      }),
    );
    assert.ok(figures.recommendedPlan.paybackWeeks !== null);
    assert.ok(Number.isInteger(figures.recommendedPlan.paybackWeeks));
  });
});
