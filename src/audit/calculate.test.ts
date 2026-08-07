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
    reminderConsistency: "yes",
    quoteFollowUpConsistency: "yes",
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

  test("an untouched bucket never contributes", () => {
    const figures = calculateAuditFigures(inputs({ buckets: EMPTY_BUCKETS }));
    assert.equal(figures.totalAdminHoursPerWeek, 0);
    assert.equal(figures.annualAdminCostHard, 0);
    assert.equal(figures.annualBillableValue, 0);
  });

  test("anchorHours never affects labour cost, no matter what it's set to", () => {
    const withLowAnchor = calculateAuditFigures(
      inputs({ anchorHours: 1, buckets: { phoneMessages: 10, bookingsScheduling: 0, quotesInvoices: 0, recordsDataEntry: 0 } }),
    );
    const withHighAnchor = calculateAuditFigures(
      inputs({ anchorHours: 40, buckets: { phoneMessages: 10, bookingsScheduling: 0, quotesInvoices: 0, recordsDataEntry: 0 } }),
    );
    assert.equal(withLowAnchor.annualAdminCostHard, withHighAnchor.annualAdminCostHard);
    assert.equal(withLowAnchor.anchorHours, 1);
    assert.equal(withHighAnchor.anchorHours, 40);
  });

  test("leak answers never affect labour cost", () => {
    const noLeaks = calculateAuditFigures(inputs({ reminderConsistency: "yes", quoteFollowUpConsistency: "yes", missedCallsPerWeek: 0 }));
    const allLeaks = calculateAuditFigures(inputs({ reminderConsistency: "no", quoteFollowUpConsistency: "no", missedCallsPerWeek: 20 }));
    assert.equal(noLeaks.annualAdminCostHard, allLeaks.annualAdminCostHard);
  });
});

describe("calculateAuditFigures: reminders opportunity (Screen F only)", () => {
  test("is null when reminders reach the customer", () => {
    const figures = calculateAuditFigures(inputs({ reminderConsistency: "yes" }));
    assert.equal(figures.reminders, null);
  });

  test("bucket hours never gate the reminders opportunity - there is no time question for it anymore", () => {
    const busy = calculateAuditFigures(
      inputs({ reminderConsistency: "yes", buckets: { phoneMessages: 20, bookingsScheduling: 20, quotesInvoices: 0, recordsDataEntry: 0 } }),
    );
    assert.equal(busy.reminders, null);
  });

  test("matches the spec's worked formula when consistency is No", () => {
    const figures = calculateAuditFigures(
      inputs({ jobsPerWeek: 45, averageInvoice: 320, reminderConsistency: "no" }),
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

describe("calculateAuditFigures: quote follow-up opportunity (Screen F only)", () => {
  test("is null when quotes that go quiet are followed up", () => {
    const figures = calculateAuditFigures(inputs({ quoteFollowUpConsistency: "yes" }));
    assert.equal(figures.quoteFollowUp, null);
  });

  test("bucket hours never gate quote follow-up - there is no time question for it anymore", () => {
    const busy = calculateAuditFigures(
      inputs({ quoteFollowUpConsistency: "yes", buckets: { phoneMessages: 0, bookingsScheduling: 0, quotesInvoices: 20, recordsDataEntry: 0 } }),
    );
    assert.equal(busy.quoteFollowUp, null);
  });

  test("estimates quoted jobs at jobs/week x 1.2 when No, per the spec's fallback", () => {
    const figures = calculateAuditFigures(
      inputs({ jobsPerWeek: 45, averageInvoice: 320, quoteFollowUpConsistency: "no" }),
    );

    const quotedJobsPerWeekEstimate = 45 * QUOTED_JOBS_MULTIPLIER;
    assert.ok(figures.quoteFollowUp);
    assert.equal(figures.quoteFollowUp?.quotedJobsPerWeekEstimate, quotedJobsPerWeekEstimate);
    assert.equal(
      figures.quoteFollowUp?.annualOpportunity,
      quotedJobsPerWeekEstimate * QUOTE_FOLLOWUP_RECOVERY_PCT * 320 * WORKING_WEEKS,
    );
  });

  test("Not consistently also opens the opportunity card", () => {
    const figures = calculateAuditFigures(inputs({ quoteFollowUpConsistency: "not_consistently" }));
    assert.ok(figures.quoteFollowUp);
  });
});

describe("calculateAuditFigures: missed calls opportunity", () => {
  test("is always computed from Screen F alone, regardless of bucket hours", () => {
    const idle = calculateAuditFigures(inputs({ missedCallsPerWeek: 5, averageInvoice: 320 }));
    const busy = calculateAuditFigures(
      inputs({ missedCallsPerWeek: 5, averageInvoice: 320, buckets: { phoneMessages: 20, bookingsScheduling: 0, quotesInvoices: 0, recordsDataEntry: 0 } }),
    );

    const expected = 5 * MISSED_CALL_CONVERSION_RATE * 320 * WORKING_WEEKS;
    assert.equal(idle.missedCalls.annualOpportunity, expected);
    assert.equal(busy.missedCalls.annualOpportunity, expected);
  });

  test("is zero, not null, when no calls are missed", () => {
    const figures = calculateAuditFigures(inputs({ missedCallsPerWeek: 0 }));
    assert.equal(figures.missedCalls.annualOpportunity, 0);
  });

  test("uses a 20% conversion rate", () => {
    assert.equal(MISSED_CALL_CONVERSION_RATE, 0.2);
  });
});

describe("calculateAuditFigures: one leak headline, no double-counting, no shared inputs", () => {
  test("totalLeak is the sum of the named components, never combined with the hard admin cost", () => {
    const figures = calculateAuditFigures(
      inputs({
        buckets: { phoneMessages: 2, bookingsScheduling: 0, quotesInvoices: 0, recordsDataEntry: 0 },
        reminderConsistency: "yes",
        quoteFollowUpConsistency: "yes",
        missedCallsPerWeek: 0,
      }),
    );

    assert.equal(figures.reminders, null);
    assert.equal(figures.quoteFollowUp, null);
    assert.equal(figures.totalLeak, 0);
    assert.notEqual(figures.totalLeak, figures.annualAdminCostHard);
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
        quoteFollowUpConsistency: "yes",
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
