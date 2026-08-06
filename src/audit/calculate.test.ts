import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { calculateAuditFigures, WORKING_WEEKS, type AuditInputs } from "./calculate.js";

function inputs(overrides: Partial<AuditInputs> = {}): AuditInputs {
  return {
    lead: { fullName: "Jane Mechanic", phoneNumber: "+61400000000", companyName: "Jane's Workshop" },
    hourlyRate: 85,
    workerCount: 3,
    jobsPerWeek: 45,
    averageJobValue: 320,
    taskHours: [],
    ...overrides,
  };
}

describe("calculateAuditFigures: the spec's own worked example", () => {
  test("matches exactly: 11.5 admin hours/week at $120/hr", () => {
    const figures = calculateAuditFigures(
      inputs({
        hourlyRate: 120,
        taskHours: [
          { key: "phoneCalls", hours: 2 },
          { key: "missedCalls", hours: 1 },
          { key: "bookingManagement", hours: 4 },
          { key: "quoteWriting", hours: 1.5 },
          { key: "quoteFollowUp", hours: 1 },
          { key: "otherAdmin", hours: 2 },
        ],
      }),
    );

    assert.equal(figures.totalAdminHoursPerWeek, 11.5);
    assert.equal(figures.weeklyAdminCost, 1380);
    assert.equal(figures.annualAdminCost, 66240);
    assert.equal(figures.annualAdminHours, 552);
  });
});

describe("calculateAuditFigures: business profile derived values", () => {
  test("weeklyRevenue and annualRevenue use jobsPerWeek x averageJobValue x 48", () => {
    const figures = calculateAuditFigures(inputs({ jobsPerWeek: 45, averageJobValue: 320 }));
    assert.equal(figures.weeklyRevenue, 45 * 320);
    assert.equal(figures.annualRevenue, 45 * 320 * WORKING_WEEKS);
  });
});

describe("calculateAuditFigures: task breakdown", () => {
  test("lists all ten tasks in fixed order, zero hours for anything not ticked", () => {
    const figures = calculateAuditFigures(inputs({ taskHours: [{ key: "phoneCalls", hours: 3 }] }));

    assert.equal(figures.taskBreakdown.length, 10);
    assert.equal(figures.taskBreakdown[0].task, "Phone calls");
    assert.equal(figures.taskBreakdown[0].hours, 3);
    assert.equal(figures.taskBreakdown[0].weeklyCost, 3 * figures.hourlyRate);
    figures.taskBreakdown.slice(1).forEach((t) => {
      assert.equal(t.hours, 0);
      assert.equal(t.weeklyCost, 0);
    });
  });

  test("never double-counts - totalAdminHoursPerWeek is exactly the sum of taskBreakdown hours", () => {
    const figures = calculateAuditFigures(
      inputs({
        taskHours: [
          { key: "phoneCalls", hours: 2 },
          { key: "dataEntry", hours: 3 },
        ],
      }),
    );
    const sum = figures.taskBreakdown.reduce((total, t) => total + t.hours, 0);
    assert.equal(figures.totalAdminHoursPerWeek, sum);
  });
});

describe("calculateAuditFigures: opportunity flags", () => {
  test("serviceReminders flag is true only when that task is left unticked - no dollar figure attached", () => {
    const unticked = calculateAuditFigures(inputs({ taskHours: [] }));
    const ticked = calculateAuditFigures(inputs({ taskHours: [{ key: "serviceReminders", hours: 1 }] }));

    assert.equal(unticked.opportunityFlags.serviceReminders, true);
    assert.equal(ticked.opportunityFlags.serviceReminders, false);
    // No dollar-figure field exists anywhere on AuditFigures for this - just the boolean.
    assert.ok(!("reminderOpportunityValue" in unticked));
  });

  test("quoteFollowUp flag is true only when that task is left unticked", () => {
    const unticked = calculateAuditFigures(inputs({ taskHours: [] }));
    const ticked = calculateAuditFigures(inputs({ taskHours: [{ key: "quoteFollowUp", hours: 1 }] }));

    assert.equal(unticked.opportunityFlags.quoteFollowUp, true);
    assert.equal(ticked.opportunityFlags.quoteFollowUp, false);
  });

  test("flags never affect totalAdminHoursPerWeek, weeklyAdminCost, or annualAdminCost", () => {
    const withFlags = calculateAuditFigures(inputs({ taskHours: [] }));
    const withoutFlags = calculateAuditFigures(
      inputs({ taskHours: [{ key: "serviceReminders", hours: 1 }, { key: "quoteFollowUp", hours: 1 }] }),
    );
    // Only the two ticked tasks' own hours should differ - not some hidden opportunity dollar figure.
    assert.equal(withFlags.totalAdminHoursPerWeek, 0);
    assert.equal(withoutFlags.totalAdminHoursPerWeek, 2);
    assert.equal(withoutFlags.weeklyAdminCost, 2 * withoutFlags.hourlyRate);
  });
});

describe("calculateAuditFigures: missed calls is a plain admin task, not a revenue estimate", () => {
  test("missedCalls behaves exactly like any other task - hours x rate, nothing else", () => {
    const figures = calculateAuditFigures(inputs({ hourlyRate: 100, taskHours: [{ key: "missedCalls", hours: 4 }] }));
    const missedCallsEntry = figures.taskBreakdown.find((t) => t.task === "Missed calls");
    assert.ok(missedCallsEntry);
    assert.equal(missedCallsEntry?.hours, 4);
    assert.equal(missedCallsEntry?.weeklyCost, 400);
    // No conversion-rate or revenue-loss figure exists anywhere for missed calls.
    assert.ok(!("missedCallRevenue" in figures));
  });
});

describe("calculateAuditFigures: Charlie summary", () => {
  test("names the top 3 tasks by hours, descending, and includes the cost figures", () => {
    const figures = calculateAuditFigures(
      inputs({
        hourlyRate: 100,
        taskHours: [
          { key: "phoneCalls", hours: 1 },
          { key: "bookingManagement", hours: 5 },
          { key: "dataEntry", hours: 3 },
          { key: "invoicingAndPayments", hours: 2 },
        ],
      }),
    );

    assert.match(figures.charlieSummary, /booking management/i);
    assert.match(figures.charlieSummary, /data entry/i);
    assert.match(figures.charlieSummary, /invoicing and payments/i);
    assert.doesNotMatch(figures.charlieSummary, /phone calls/i); // 4th place, not in the top 3
    assert.match(figures.charlieSummary, new RegExp(String(figures.totalAdminHoursPerWeek)));
    assert.match(figures.charlieSummary, new RegExp(String(figures.annualAdminHours)));
  });

  test("mentions opportunities only when at least one flag is set", () => {
    const bothAutomated = calculateAuditFigures(
      inputs({ taskHours: [{ key: "serviceReminders", hours: 1 }, { key: "quoteFollowUp", hours: 1 }] }),
    );
    const oneMissing = calculateAuditFigures(inputs({ taskHours: [{ key: "serviceReminders", hours: 1 }] }));

    assert.doesNotMatch(bothAutomated.charlieSummary, /service reminders or quote follow-up/i);
    assert.match(oneMissing.charlieSummary, /service reminders or quote follow-up/i);
  });

  test("never names specific software or implementation details", () => {
    const figures = calculateAuditFigures(inputs({ taskHours: [{ key: "phoneCalls", hours: 2 }] }));
    assert.doesNotMatch(figures.charlieSummary, /insanely smart|\bAI\b|software|platform|\btool\b/i);
  });
});
