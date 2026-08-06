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
  type AuditInputs,
} from "./calculate.js";

function inputs(overrides: Partial<AuditInputs> = {}): AuditInputs {
  return {
    lead: { fullName: "Jane Mechanic", mobile: "+61400000000", companyName: "Jane's Workshop" },
    hourlyRate: 85,
    workers: 3,
    jobsPerWeek: 45,
    averageInvoice: 320,
    taskHours: [],
    missedCallsPerWeek: 0,
    ...overrides,
  };
}

describe("calculateAuditFigures: admin cost", () => {
  test("weekly and annual admin cost sum ticked task hours at the hourly rate", () => {
    const figures = calculateAuditFigures(
      inputs({
        taskHours: [
          { key: "answeringCalls", hours: 3 },
          { key: "dataEntry", hours: 2 },
        ],
        hourlyRate: 100,
      }),
    );

    assert.equal(figures.totalAdminHoursPerWeek, 5);
    assert.equal(figures.weeklyAdminCost, 500);
    assert.equal(figures.annualAdminCost, 500 * WORKING_WEEKS);
  });

  test("an untouched task never contributes - taskHours only lists what's actually ticked", () => {
    const figures = calculateAuditFigures(inputs({ taskHours: [] }));
    assert.equal(figures.totalAdminHoursPerWeek, 0);
    assert.equal(figures.weeklyAdminCost, 0);
    assert.equal(figures.annualAdminCost, 0);
  });
});

describe("calculateAuditFigures: reminders opportunity (Opportunity 1)", () => {
  test("is null when the reminders task is ticked (already sends reminders)", () => {
    const figures = calculateAuditFigures(
      inputs({ taskHours: [{ key: "reminders", hours: 1 }] }),
    );
    assert.equal(figures.reminders, null);
  });

  test("matches the spec's worked formula when reminders is left unticked", () => {
    const figures = calculateAuditFigures(inputs({ jobsPerWeek: 45, averageInvoice: 320, taskHours: [] }));

    const activeCustomersEstimate = 45 * WORKING_WEEKS * ACTIVE_CUSTOMER_MULTIPLIER;
    const customersAtRisk = activeCustomersEstimate * RETENTION_AT_RISK_FRACTION;
    const recoverableCustomers = customersAtRisk * RETENTION_RECOVERY_PCT;

    assert.ok(figures.reminders);
    assert.equal(figures.reminders?.activeCustomersEstimate, activeCustomersEstimate);
    assert.equal(figures.reminders?.customersAtRisk, customersAtRisk);
    assert.equal(figures.reminders?.recoverableCustomers, recoverableCustomers);
    assert.equal(figures.reminders?.annualOpportunity, recoverableCustomers * 320);
    // Sanity check against the spec's own illustrative numbers (45 jobs/week, $320/job):
    // active ~2,592, at risk ~432, recoverable ~86 - within a rounding tolerance of the example.
    assert.ok(Math.abs(activeCustomersEstimate - 2592) < 1);
    assert.ok(Math.abs(customersAtRisk - 432) < 1);
    assert.ok(Math.abs(recoverableCustomers - 86.4) < 0.1);
  });
});

describe("calculateAuditFigures: quote follow-up opportunity (Opportunity 2)", () => {
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

describe("calculateAuditFigures: missed calls opportunity (Opportunity 3)", () => {
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
});

describe("calculateAuditFigures: totals", () => {
  test("total annual benefit is admin cost plus only the eligible opportunities", () => {
    const figures = calculateAuditFigures(
      inputs({
        taskHours: [
          { key: "answeringCalls", hours: 2 },
          { key: "reminders", hours: 1 }, // ticked -> no reminders opportunity
        ],
        missedCallsPerWeek: 0, // no missed-call opportunity either
      }),
    );

    assert.equal(figures.reminders, null);
    assert.equal(figures.totalAnnualRevenueOpportunity, figures.missedCalls.annualOpportunity);
    assert.equal(figures.totalAnnualBenefit, figures.annualAdminCost + figures.totalAnnualRevenueOpportunity);
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
  test("matches the spec's worked example: $18,000/yr benefit, Growth plan -> 1 week", () => {
    // $18,000/yr -> $1,500/mo -> $375/wk; Growth is $299/mo; ceil(299/375) = 1.
    // Reverse-engineer inputs that produce totalAnnualBenefit close to $18,000 isn't the point
    // here - test the payback formula directly against the same numbers the spec worked through.
    const figures = calculateAuditFigures(
      inputs({
        workers: 2, // Growth
        hourlyRate: 100,
        taskHours: [{ key: "dataEntry", hours: 18000 / WORKING_WEEKS / 100 }],
        jobsPerWeek: 0,
        missedCallsPerWeek: 0,
      }),
    );

    assert.equal(figures.recommendedPlan.plan.key, "growth");
    assert.ok(Math.abs(figures.totalAnnualBenefit - 18000) < 1);
    assert.equal(figures.recommendedPlan.monthlyBenefit, figures.totalAnnualBenefit / 12);
    assert.equal(figures.recommendedPlan.weeklyBenefit, figures.recommendedPlan.monthlyBenefit / 4);
    assert.equal(figures.recommendedPlan.paybackWeeks, 1);
  });

  test("payback is rounded up to the nearest whole week", () => {
    const figures = calculateAuditFigures(
      inputs({
        workers: 1, // Starter, $149/mo
        hourlyRate: 50,
        taskHours: [{ key: "dataEntry", hours: 1 }], // small benefit -> payback takes several weeks
        jobsPerWeek: 0,
        missedCallsPerWeek: 0,
      }),
    );
    assert.ok(figures.recommendedPlan.paybackWeeks !== null);
    assert.ok(Number.isInteger(figures.recommendedPlan.paybackWeeks));
  });
});
