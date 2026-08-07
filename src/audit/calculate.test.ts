import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateAuditFigures,
  WORKING_WEEKS,
  ACTIVE_CUSTOMER_MULTIPLIER,
  RETENTION_AT_RISK_FRACTION,
  RETENTION_RECOVERY_PCT,
  QUOTED_JOBS_MULTIPLIER,
  QUOTE_FOLLOWUP_RECOVERY_PCT,
  MISSED_CALL_CONVERSION_RATE,
  LEAK_CAP_FRACTION_OF_REVENUE,
  type AuditInputs,
} from "./calculate.js";

function inputs(overrides: Partial<AuditInputs> = {}): AuditInputs {
  return {
    lead: { fullName: "Jane Mechanic", mobile: "+61400000000", companyName: "Jane's Workshop" },
    hourlyRate: 85,
    adminCostRate: 40,
    workers: 3,
    jobsPerWeek: 45,
    averageInvoice: 320,
    taskHours: [],
    missedCallsPerWeek: 0,
    reminderConsistency: "yes",
    ...overrides,
  };
}

describe("calculateAuditFigures: admin cost", () => {
  test("hard cost values ticked task hours at the admin cost rate, not the charge-out rate", () => {
    const figures = calculateAuditFigures(
      inputs({
        taskHours: [
          { key: "answeringCalls", hours: 3 },
          { key: "dataEntry", hours: 2 },
        ],
        hourlyRate: 100,
        adminCostRate: 40,
      }),
    );

    assert.equal(figures.totalAdminHoursPerWeek, 5);
    assert.equal(figures.adminHoursPerYear, 5 * WORKING_WEEKS);
    assert.equal(figures.annualAdminCostHard, 5 * 40 * WORKING_WEEKS);
    assert.equal(figures.annualBillableValue, 5 * 100 * WORKING_WEEKS);
  });

  test("an untouched task never contributes - taskHours only lists what's actually ticked", () => {
    const figures = calculateAuditFigures(inputs({ taskHours: [] }));
    assert.equal(figures.totalAdminHoursPerWeek, 0);
    assert.equal(figures.annualAdminCostHard, 0);
    assert.equal(figures.annualBillableValue, 0);
  });
});

describe("calculateAuditFigures: reminders opportunity", () => {
  test("is null when reminders reach the customer (consistency = yes), regardless of the time question", () => {
    const figures = calculateAuditFigures(
      inputs({ reminderConsistency: "yes", taskHours: [{ key: "reminders", hours: 0 }] }),
    );
    assert.equal(figures.reminders, null);
  });

  test("a No on the time question alone never generates a reminders opportunity", () => {
    // reminders task left unticked (time question = No), but consistency = yes, so still null.
    const figures = calculateAuditFigures(inputs({ reminderConsistency: "yes", taskHours: [] }));
    assert.equal(figures.reminders, null);
  });

  test("matches the spec's worked formula when consistency is No", () => {
    const figures = calculateAuditFigures(
      inputs({ jobsPerWeek: 45, averageInvoice: 320, taskHours: [], reminderConsistency: "no" }),
    );

    const activeCustomersEstimate = 45 * WORKING_WEEKS * ACTIVE_CUSTOMER_MULTIPLIER;
    const customersAtRisk = activeCustomersEstimate * RETENTION_AT_RISK_FRACTION;
    const recoverableCustomers = customersAtRisk * RETENTION_RECOVERY_PCT;

    assert.ok(figures.reminders);
    assert.equal(figures.reminders?.activeCustomersEstimate, activeCustomersEstimate);
    assert.equal(figures.reminders?.customersAtRisk, customersAtRisk);
    assert.equal(figures.reminders?.recoverableCustomers, recoverableCustomers);
    assert.equal(figures.reminders?.annualOpportunity, recoverableCustomers * 320);
  });

  test("Not consistently also opens the opportunity card", () => {
    const figures = calculateAuditFigures(inputs({ reminderConsistency: "not_consistently" }));
    assert.ok(figures.reminders);
  });
});

describe("calculateAuditFigures: quote follow-up opportunity", () => {
  test("is null when the reader doesn't spend time chasing quotes", () => {
    const figures = calculateAuditFigures(inputs({ taskHours: [] }));
    assert.equal(figures.quoteFollowUp, null);
  });

  test("estimates quoted jobs at jobs/week x 1.2 when ticked, per the spec's fallback", () => {
    const figures = calculateAuditFigures(
      inputs({ jobsPerWeek: 45, averageInvoice: 320, taskHours: [{ key: "followingUpQuotes", hours: 2 }] }),
    );

    const quotedJobsPerWeekEstimate = 45 * QUOTED_JOBS_MULTIPLIER;
    assert.ok(figures.quoteFollowUp);
    assert.equal(figures.quoteFollowUp?.quotedJobsPerWeekEstimate, quotedJobsPerWeekEstimate);
    assert.equal(
      figures.quoteFollowUp?.annualOpportunity,
      quotedJobsPerWeekEstimate * QUOTE_FOLLOWUP_RECOVERY_PCT * 320 * WORKING_WEEKS,
    );
  });
});

describe("calculateAuditFigures: missed calls opportunity", () => {
  test("is always computed, regardless of whether the returning-missed-calls task is ticked", () => {
    const untouched = calculateAuditFigures(inputs({ missedCallsPerWeek: 5, averageInvoice: 320, taskHours: [] }));
    const ticked = calculateAuditFigures(
      inputs({
        missedCallsPerWeek: 5,
        averageInvoice: 320,
        taskHours: [{ key: "returningMissedCalls", hours: 3 }],
      }),
    );

    const expected = 5 * MISSED_CALL_CONVERSION_RATE * 320 * WORKING_WEEKS;
    assert.equal(untouched.missedCalls.annualOpportunity, expected);
    assert.equal(ticked.missedCalls.annualOpportunity, expected);
  });

  test("is zero, not null, when no calls are missed", () => {
    const figures = calculateAuditFigures(inputs({ missedCallsPerWeek: 0 }));
    assert.equal(figures.missedCalls.annualOpportunity, 0);
  });

  test("uses a 20% conversion rate", () => {
    assert.equal(MISSED_CALL_CONVERSION_RATE, 0.2);
  });
});

describe("calculateAuditFigures: one leak headline, no double-counting", () => {
  test("totalLeak is the sum of the named components, never combined with the hard admin cost", () => {
    const figures = calculateAuditFigures(
      inputs({
        taskHours: [
          { key: "answeringCalls", hours: 2 },
          { key: "reminders", hours: 1 },
        ],
        reminderConsistency: "yes", // reaches the customer, so no reminders opportunity
        missedCallsPerWeek: 0,
      }),
    );

    assert.equal(figures.reminders, null);
    assert.equal(figures.totalLeak, figures.missedCalls.annualOpportunity);
    assert.notEqual(figures.totalLeak, figures.annualAdminCostHard + figures.missedCalls.annualOpportunity);
  });

  test("components visibly add up to the leak headline when uncapped", () => {
    // Quote follow-up alone lands at exactly QUOTED_JOBS_MULTIPLIER x QUOTE_FOLLOWUP_RECOVERY_PCT
    // (12%) of estimated revenue regardless of scale, so it's left off here to test a case
    // that's genuinely under the cap rather than sitting right on its boundary.
    const figures = calculateAuditFigures(
      inputs({
        jobsPerWeek: 45,
        averageInvoice: 320,
        reminderConsistency: "no",
        taskHours: [],
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
    // Tiny turnover, big reported missed-call volume - the raw leak blows past 12% of revenue.
    const figures = calculateAuditFigures(
      inputs({
        jobsPerWeek: 1,
        averageInvoice: 50,
        reminderConsistency: "no",
        missedCallsPerWeek: 30,
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
  test("matches the spec's worked example: $18,000/yr hard cost, Growth plan, 1 week", () => {
    // $18,000/yr is $1,500/mo is $375/wk; Growth is $299/mo; ceil(299/375) = 1.
    const figures = calculateAuditFigures(
      inputs({
        workers: 2, // Growth
        adminCostRate: 100,
        taskHours: [{ key: "dataEntry", hours: 18000 / WORKING_WEEKS / 100 }],
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
        taskHours: [{ key: "dataEntry", hours: 1 }], // small benefit, so payback takes several weeks
        jobsPerWeek: 0,
        missedCallsPerWeek: 0,
      }),
    );
    assert.ok(figures.recommendedPlan.paybackWeeks !== null);
    assert.ok(Number.isInteger(figures.recommendedPlan.paybackWeeks));
  });
});
