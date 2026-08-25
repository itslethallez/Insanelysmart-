import { REFERENCES } from "./references.js";

export type TeamBand = "1-5" | "6-10" | "11+";

export type CarePlan = {
  id: TeamBand;
  name: string;
  people: string;
  monthly: number;
  includes: string[];
};

export type PaymentPath = {
  id: "invoice" | "split" | "care-first";
  label: string;
  blurb: string;
};

/** All customer-facing prices are GST-inclusive Australian dollars. */
export const GST_RATE = 0.1;

export const FIRST_BUILD_PRICE = 1490;

export const CARE_PLANS: CarePlan[] = [
  {
    id: "1-5",
    name: "Studio",
    people: "1–5 people",
    monthly: 149,
    includes: [
      "Charlie, SMS and hosting for the live automations",
      "Watching it, fixing it if it breaks",
      "A 14-day hand-hold after the first install",
      "One small tweak a month",
    ],
  },
  {
    id: "6-10",
    name: "Crew",
    people: "6–10 people",
    monthly: 279,
    includes: [
      "Everything in Studio",
      "Higher message and call volume",
      "A monthly 'what should we automate next' note",
    ],
  },
  {
    id: "11+",
    name: "Company",
    people: "11 or more people",
    monthly: 459,
    includes: [
      "Everything in Crew",
      "Priority help when something is on fire",
      "Room for more than one live automation",
    ],
  },
];

export const PAYMENT_PATHS: PaymentPath[] = [
  {
    id: "invoice",
    label: "Pay the build",
    blurb: `One invoice for $${FIRST_BUILD_PRICE.toLocaleString("en-AU")} (GST included). Business expense — see the ATO links. Care starts when it goes live.`,
  },
  {
    id: "split",
    label: "Split the build",
    blurb: `Three invoices of $${Math.round(FIRST_BUILD_PRICE / 3).toLocaleString("en-AU")}. Same build, smaller bites. Care still monthly.`,
  },
  {
    id: "care-first",
    label: "Start on care",
    blurb: "Pay this month's care today. We build the first automation this week and invoice the build after you have seen it working.",
  },
];

export function carePlanForTeam(teamSize: TeamBand): CarePlan {
  const plan = CARE_PLANS.find((item) => item.id === teamSize);
  if (!plan) throw new Error(`No care plan for team size ${teamSize}`);
  return plan;
}

export function yearOneCash(teamSize: TeamBand, buildPrice = FIRST_BUILD_PRICE): {
  build: number;
  care: number;
  total: number;
  gst: number;
  exGst: number;
} {
  const care = carePlanForTeam(teamSize).monthly * 12;
  const total = buildPrice + care;
  const exGst = Math.round(total / (1 + GST_RATE) * 100) / 100;
  const gst = Math.round((total - exGst) * 100) / 100;
  return { build: buildPrice, care, total, gst, exGst };
}

/** Illustrative only — not tax advice. Uses the 25% base-rate company tax. */
export function illustrativeAfterTaxCost(gstInclusive: number, companyTaxRate = 0.25): {
  gstInclusive: number;
  exGst: number;
  gstCredit: number;
  taxDeductionBenefit: number;
  netCash: number;
  companyTaxRate: number;
  sourceIds: string[];
} {
  const exGst = Math.round((gstInclusive / (1 + GST_RATE)) * 100) / 100;
  const gstCredit = Math.round((gstInclusive - exGst) * 100) / 100;
  const taxDeductionBenefit = Math.round(exGst * companyTaxRate * 100) / 100;
  return {
    gstInclusive,
    exGst,
    gstCredit,
    taxDeductionBenefit,
    netCash: Math.round((gstInclusive - gstCredit - taxDeductionBenefit) * 100) / 100,
    companyTaxRate,
    sourceIds: [REFERENCES.atoDeductions.id, REFERENCES.atoDigital.id, REFERENCES.atoCompanyTax.id],
  };
}
