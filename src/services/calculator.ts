import { REFERENCES } from "../config/references.js";
import { carePlanForTeam, FIRST_BUILD_PRICE, illustrativeAfterTaxCost, yearOneCash } from "../config/pricing.js";
import {
  ADMIN_AUTOMATION_IDS,
  VOLUME_AUTOMATION_IDS,
  rankAutomations,
  type AutomationId,
  type RankedAutomation,
} from "../config/automations.js";

export type Industry =
  | "trades"
  | "clinic"
  | "beauty"
  | "professional"
  | "hospitality"
  | "retail"
  | "other";

export type TeamBand = "1-5" | "6-10" | "11+";
export type PhoneHandler = "owner" | "receptionist" | "whoever" | "rings-out";

export type CalculatorAnswers = {
  contactName: string;
  companyName: string;
  industry: Industry;
  teamSize: TeamBand;
  phoneHandler: PhoneHandler;
  weeklyEnquiries: number;
  unansweredRate: number;
  averageJobValue: number;
  adminHoursPerWeek: number;
  mobile?: string;
  /** Owner-picked leaks. When set, ranking puts these first and the calculator only costs those leaks. */
  neededAutomations?: AutomationId[];
};

export type CalculatorOptions = {
  /** Share of missed enquiries assumed to become a paid job if they had been answered in time. */
  conversionRate?: number;
};

export type LineItem = {
  id: string;
  label: string;
  amount: number;
  formula: string;
  sourceIds: string[];
};

export type CalculatorResult = {
  answers: CalculatorAnswers;
  weeksPerYear: number;
  awardHourly: number;
  superGuarantee: number;
  loadedHourly: number;
  conversionRate: number;
  adminAnnual: number;
  missedEnquiriesAnnual: number;
  missedJobsAnnual: number;
  missedRevenueAnnual: number;
  totalAnnual: number;
  lineItems: LineItem[];
  ranking: RankedAutomation[];
  needed: RankedAutomation[];
  later: RankedAutomation[];
  firstAutomation: RankedAutomation;
  care: ReturnType<typeof carePlanForTeam>;
  yearOne: ReturnType<typeof yearOneCash>;
  paybackWeeks: number | null;
  afterTaxBuild: ReturnType<typeof illustrativeAfterTaxCost>;
  sourceIds: string[];
};

/** Fair Work MA000002 Level 2 year 1, from 1 July 2026. */
export const AWARD_HOURLY = 29.45;

/** ATO Super Guarantee, current rate. */
export const SUPER_GUARANTEE = 0.12;

/**
 * Working weeks. Airtasker's founder survey annualised on 48.84 weeks
 * (respondents' own leave). We use 48 so we do not pretend every week is a trading week.
 */
export const WEEKS_PER_YEAR = 48;

/** Conservative 1-in-5. Shown on screen as an assumption, not as a measured conversion for this business. */
export const DEFAULT_CONVERSION_RATE = 0.2;

/** Airtasker: 2.7 admin + 2.2 accounting hours / week, if the owner does not know. */
export const DEFAULT_ADMIN_HOURS = 4.9;

export function loadedHourlyRate(awardHourly = AWARD_HOURLY, superGuarantee = SUPER_GUARANTEE): number {
  return awardHourly * (1 + superGuarantee);
}

export function adminAnnualCost(
  hoursPerWeek: number,
  weeks = WEEKS_PER_YEAR,
  awardHourly = AWARD_HOURLY,
  superGuarantee = SUPER_GUARANTEE,
): number {
  return hoursPerWeek * loadedHourlyRate(awardHourly, superGuarantee) * weeks;
}

export function missedEnquiriesAnnual(
  weeklyEnquiries: number,
  unansweredRate: number,
  weeks = WEEKS_PER_YEAR,
): number {
  return weeklyEnquiries * unansweredRate * weeks;
}

export function missedRevenueAnnual(
  weeklyEnquiries: number,
  unansweredRate: number,
  averageJobValue: number,
  conversionRate = DEFAULT_CONVERSION_RATE,
  weeks = WEEKS_PER_YEAR,
): number {
  return missedEnquiriesAnnual(weeklyEnquiries, unansweredRate, weeks) * conversionRate * averageJobValue;
}

function countsLeak(answers: CalculatorAnswers, ids: AutomationId[]): boolean {
  const needed = answers.neededAutomations;
  if (!needed?.length) return true;
  return needed.some((id) => ids.includes(id));
}

export function calculate(answers: CalculatorAnswers, options: CalculatorOptions = {}): CalculatorResult {
  const conversionRate = options.conversionRate ?? DEFAULT_CONVERSION_RATE;
  const loadedHourly = loadedHourlyRate();
  const countAdmin = countsLeak(answers, ADMIN_AUTOMATION_IDS);
  const countMissed = countsLeak(answers, VOLUME_AUTOMATION_IDS);
  const adminAnnual = countAdmin ? adminAnnualCost(answers.adminHoursPerWeek) : 0;
  const missedEnquiries = countMissed
    ? missedEnquiriesAnnual(answers.weeklyEnquiries, answers.unansweredRate)
    : 0;
  const missedJobs = missedEnquiries * conversionRate;
  const missedRevenue = countMissed ? missedJobs * answers.averageJobValue : 0;
  const totalAnnual = adminAnnual + missedRevenue;

  const lineItems: LineItem[] = [];
  if (countAdmin) {
    lineItems.push({
      id: "admin",
      label: "Admin labour you are already paying for (or doing yourself)",
      amount: adminAnnual,
      formula: `${answers.adminHoursPerWeek} hrs/week × $${AWARD_HOURLY.toFixed(2)} Clerks Award L2 × ${(SUPER_GUARANTEE * 100).toFixed(0)}% super × ${WEEKS_PER_YEAR} weeks`,
      sourceIds: [REFERENCES.clerksAward.id, REFERENCES.superGuarantee.id, REFERENCES.airtaskerFounderTax.id],
    });
  }
  if (countMissed) {
    lineItems.push({
      id: "missed",
      label: "Work that never arrives because nobody answers in time",
      amount: missedRevenue,
      formula: `${answers.weeklyEnquiries} enquiries/week × ${(answers.unansweredRate * 100).toFixed(0)}% unanswered × ${WEEKS_PER_YEAR} weeks × ${(conversionRate * 100).toFixed(0)}% become a job × $${answers.averageJobValue.toLocaleString("en-AU")} average job`,
      sourceIds: [REFERENCES.mitLeadResponse.id, REFERENCES.hbrLeads.id, REFERENCES.airtaskerFounderTax.id],
    });
  }

  const ranking = rankAutomations(answers);
  const needed = ranking.filter((item) => item.picked);
  const later = ranking.filter((item) => !item.picked);
  const firstAutomation = needed[0] ?? ranking[0];
  const care = carePlanForTeam(answers.teamSize);
  const yearOne = yearOneCash(answers.teamSize, firstAutomation.buildPrice);
  const weeklyOpportunity = totalAnnual / WEEKS_PER_YEAR;
  const paybackWeeks = weeklyOpportunity > 0 ? yearOne.total / weeklyOpportunity : null;

  return {
    answers,
    weeksPerYear: WEEKS_PER_YEAR,
    awardHourly: AWARD_HOURLY,
    superGuarantee: SUPER_GUARANTEE,
    loadedHourly,
    conversionRate,
    adminAnnual,
    missedEnquiriesAnnual: missedEnquiries,
    missedJobsAnnual: missedJobs,
    missedRevenueAnnual: missedRevenue,
    totalAnnual,
    lineItems,
    ranking,
    needed,
    later,
    firstAutomation,
    care,
    yearOne,
    paybackWeeks,
    afterTaxBuild: illustrativeAfterTaxCost(firstAutomation.buildPrice),
    sourceIds: [
      REFERENCES.clerksAward.id,
      REFERENCES.superGuarantee.id,
      REFERENCES.airtaskerFounderTax.id,
      REFERENCES.mitLeadResponse.id,
      REFERENCES.hbrLeads.id,
      REFERENCES.atoDeductions.id,
      REFERENCES.atoDigital.id,
      REFERENCES.asbfeoSa.id,
    ],
  };
}

export function roundMoney(amount: number): number {
  return Math.round(amount);
}
