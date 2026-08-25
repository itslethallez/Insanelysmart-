import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AWARD_HOURLY,
  DEFAULT_CONVERSION_RATE,
  SUPER_GUARANTEE,
  WEEKS_PER_YEAR,
  adminAnnualCost,
  calculate,
  loadedHourlyRate,
  missedEnquiriesAnnual,
  missedRevenueAnnual,
  type CalculatorAnswers,
} from "./calculator.js";
import { normaliseAuMobile } from "../lib/phone.js";
import { parseAnswers } from "../lib/parseAnswers.js";
import { FIRST_BUILD_PRICE } from "../config/pricing.js";
import { createProof, decodeProofId, encodeProofId, getProof } from "./proofStore.js";

const fixture: CalculatorAnswers = {
  contactName: "Sam",
  companyName: "Ridgeline Roofing",
  industry: "trades",
  teamSize: "1-5",
  phoneHandler: "rings-out",
  weeklyEnquiries: 30,
  unansweredRate: 0.5,
  averageJobValue: 850,
  adminHoursPerWeek: 8,
};

describe("calculator", () => {
  it("loads the Fair Work hourly rate with 12% super", () => {
    assert.equal(loadedHourlyRate(), AWARD_HOURLY * (1 + SUPER_GUARANTEE));
    assert.equal(loadedHourlyRate(), 32.984);
  });

  it("costs admin time from the award rate, super, and a 48-week year", () => {
    assert.equal(adminAnnualCost(8), 8 * 32.984 * 48);
    assert.equal(adminAnnualCost(8), 12665.856);
  });

  it("counts missed enquiries from the owner's numbers", () => {
    assert.equal(missedEnquiriesAnnual(30, 0.5), 30 * 0.5 * WEEKS_PER_YEAR);
    assert.equal(missedEnquiriesAnnual(30, 0.5), 720);
  });

  it("applies the conservative 1-in-5 conversion to missed work", () => {
    assert.equal(missedRevenueAnnual(30, 0.5, 850), 720 * DEFAULT_CONVERSION_RATE * 850);
    assert.equal(missedRevenueAnnual(30, 0.5, 850), 122400);
  });

  it("adds admin and missed work, ranks missed-call first for a tradie who rings out", () => {
    const result = calculate(fixture);
    assert.equal(result.adminAnnual, 12665.856);
    assert.equal(result.missedRevenueAnnual, 122400);
    assert.equal(result.totalAnnual, 135065.856);
    assert.equal(result.firstAutomation.id, "missed-catch");
    assert.equal(result.care.monthly, 149);
    assert.equal(result.yearOne.build, FIRST_BUILD_PRICE);
    assert.equal(result.yearOne.care, 149 * 12);
    assert.equal(result.yearOne.total, FIRST_BUILD_PRICE + 149 * 12);
    assert.ok(result.paybackWeeks !== null && result.paybackWeeks < 4);
    assert.ok(result.sourceIds.includes("fairwork-ma000002"));
    assert.ok(result.sourceIds.includes("mit-insidesales-2007"));
  });

  it("ranks booking reminders first for a clinic with a receptionist", () => {
    const result = calculate({
      ...fixture,
      industry: "clinic",
      phoneHandler: "receptionist",
      unansweredRate: 0.1,
      averageJobValue: 160,
      weeklyEnquiries: 15,
      adminHoursPerWeek: 5,
    });
    assert.equal(result.firstAutomation.id, "booking-reminders");
  });

  it("puts the automations they picked first, even if another scores higher", () => {
    const result = calculate({
      ...fixture,
      neededAutomations: ["invoice-chase", "quote-followup"],
    });
    assert.equal(result.firstAutomation.id, "quote-followup");
    assert.deepEqual(
      result.needed.map((item) => item.id),
      ["quote-followup", "invoice-chase"],
    );
    assert.equal(result.later[0]?.id, "missed-catch");
    assert.equal(result.lineItems.some((item) => item.id === "missed"), true);
    assert.equal(result.lineItems.some((item) => item.id === "admin"), true);
  });

  it("only costs admin when they said invoices/quotes/reviews are the leak", () => {
    const result = calculate({
      ...fixture,
      neededAutomations: ["invoice-chase"],
    });
    assert.equal(result.firstAutomation.id, "invoice-chase");
    assert.equal(result.missedRevenueAnnual, 0);
    assert.equal(result.adminAnnual, 12665.856);
    assert.equal(result.totalAnnual, 12665.856);
    assert.equal(result.lineItems.length, 1);
  });
});

describe("parseAnswers", () => {
  it("fills Airtasker default admin hours when missing", () => {
    const parsed = parseAnswers({ ...fixture, adminHoursPerWeek: undefined });
    assert.equal(parsed.adminHoursPerWeek, 4.9);
  });

  it("rejects an unanswered rate over 100%", () => {
    assert.throws(() => parseAnswers({ ...fixture, unansweredRate: 1.4 }), /Unanswered rate/);
  });

  it("accepts a needs-first payload and defaults the numbers they were not asked", () => {
    const parsed = parseAnswers({
      contactName: "Sam",
      companyName: "Ridgeline Roofing",
      industry: "trades",
      teamSize: "1-5",
      neededAutomations: ["invoice-chase"],
    });
    assert.deepEqual(parsed.neededAutomations, ["invoice-chase"]);
    assert.equal(parsed.phoneHandler, "whoever");
    assert.equal(parsed.weeklyEnquiries, 0);
    assert.equal(parsed.adminHoursPerWeek, 4.9);
  });
});

describe("normaliseAuMobile", () => {
  it("accepts local and +61 mobiles", () => {
    assert.equal(normaliseAuMobile("0412 345 678"), "+61412345678");
    assert.equal(normaliseAuMobile("+61 412 345 678"), "+61412345678");
    assert.equal(normaliseAuMobile("61412345678"), "+61412345678");
    assert.equal(normaliseAuMobile("1234"), null);
  });
});

describe("proofStore", () => {
  it("round-trips answers through a URL-safe id with no disk", async () => {
    const id = encodeProofId(fixture);
    assert.equal(decodeProofId("nope"), null);
    assert.equal(decodeProofId(id)?.companyName, "Ridgeline Roofing");
    const created = await createProof(fixture);
    const loaded = await getProof(created.id);
    assert.equal(loaded?.result.totalAnnual, calculate(fixture).totalAnnual);
    assert.match(created.id, /^[A-Za-z0-9_-]+$/);
  });
});

describe("visit question order", () => {
  it("asks leak first, then only the numbers that leak needs", async () => {
    const { visitQuestionIds } = await import("../config/questions.js");
    assert.deepEqual(visitQuestionIds([]), [
      "contactName",
      "companyName",
      "industry",
      "neededAutomations",
      "teamSize",
    ]);
    assert.deepEqual(visitQuestionIds(["missed-catch"]), [
      "contactName",
      "companyName",
      "industry",
      "neededAutomations",
      "teamSize",
      "phoneHandler",
      "weeklyEnquiries",
      "unansweredRate",
      "averageJobValue",
    ]);
    assert.deepEqual(visitQuestionIds(["invoice-chase"]), [
      "contactName",
      "companyName",
      "industry",
      "neededAutomations",
      "teamSize",
      "adminHoursPerWeek",
    ]);
  });
});

describe("automation demo text", () => {
  it("sends a missed-call catch as a missed-call text, not a brochure", async () => {
    const { automationDemoSms } = await import("../config/automations.js");
    const body = automationDemoSms("missed-catch", "Ridgeline Roofing", "https://example.test/value/abc");
    assert.match(body, /missed your call/i);
    assert.match(body, /Ridgeline Roofing/);
    assert.match(body, /example\.test\/value\/abc/);
  });
});
