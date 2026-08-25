import { FIRST_BUILD_PRICE } from "./pricing.js";
import type { CalculatorAnswers } from "../services/calculator.js";

export type AutomationId =
  | "missed-catch"
  | "quote-followup"
  | "booking-reminders"
  | "invoice-chase"
  | "review-ask"
  | "winback";

export type Automation = {
  id: AutomationId;
  name: string;
  promise: string;
  why: string;
  buildPrice: number;
  daysToLive: string;
};

export const AUTOMATION_CATALOG: Record<AutomationId, Automation> = {
  "missed-catch": {
    id: "missed-catch",
    name: "Missed-call catch",
    promise: "If nobody picks up, Charlie answers or a text goes out in seconds — with a link to book or leave the job details.",
    why: "The first automation on purpose. You feel it the same day. It is also what this iPad just did to you.",
    buildPrice: FIRST_BUILD_PRICE,
    daysToLive: "7–10 days",
  },
  "quote-followup": {
    id: "quote-followup",
    name: "Quote follow-up",
    promise: "Every quote that sits gets a polite chase, then a second one, then it stops. No spreadsheet, no 'I forgot'.",
    why: "Trades and professional shops leak finished quotes, not just missed calls.",
    buildPrice: FIRST_BUILD_PRICE,
    daysToLive: "7–10 days",
  },
  "booking-reminders": {
    id: "booking-reminders",
    name: "Booking + reminders",
    promise: "Confirmations, day-before reminders, and a one-tap reschedule. Cuts no-shows without a receptionist glued to the phone.",
    why: "Clinics, beauty and anyone with a chair/time slot bleeds here.",
    buildPrice: FIRST_BUILD_PRICE,
    daysToLive: "7–10 days",
  },
  "invoice-chase": {
    id: "invoice-chase",
    name: "Invoice chase",
    promise: "Friendly due-date reminders, then a firmer one. You still sound like yourselves. Cash comes in faster.",
    why: "Cheaper than a part-time bookkeeper chasing the same five invoices.",
    buildPrice: 790,
    daysToLive: "5–7 days",
  },
  "review-ask": {
    id: "review-ask",
    name: "Review ask",
    promise: "After a job is done, a message asks for a Google review while they still remember you.",
    why: "Second-wave work. Do it once they trust the first automation.",
    buildPrice: 790,
    daysToLive: "3–5 days",
  },
  winback: {
    id: "winback",
    name: "Come-back / recall",
    promise: "Six-month, twelve-month or 'you haven't been in' messages, timed to how the business actually works.",
    why: "The quiet money. Best after the inbox and the phone are already handled.",
    buildPrice: FIRST_BUILD_PRICE,
    daysToLive: "7–10 days",
  },
};

function scoreMissedCatch(answers: CalculatorAnswers): number {
  let score = answers.unansweredRate * 40;
  if (answers.phoneHandler === "rings-out") score += 20;
  if (answers.phoneHandler === "owner") score += 10;
  if (answers.industry === "trades" || answers.industry === "professional") score += 8;
  if (answers.weeklyEnquiries >= 20) score += 6;
  return score;
}

function scoreQuoteFollowup(answers: CalculatorAnswers): number {
  let score = answers.adminHoursPerWeek * 1.4;
  if (answers.industry === "trades" || answers.industry === "professional") score += 18;
  if (answers.averageJobValue >= 500) score += 8;
  return score;
}

function scoreBooking(answers: CalculatorAnswers): number {
  let score = 4;
  if (answers.industry === "clinic" || answers.industry === "beauty") score += 28;
  if (answers.industry === "hospitality") score += 12;
  if (answers.adminHoursPerWeek >= 6) score += 6;
  return score;
}

function scoreInvoice(answers: CalculatorAnswers): number {
  return answers.adminHoursPerWeek * 1.2 + (answers.teamSize === "1-5" ? 8 : 4);
}

function scoreReview(answers: CalculatorAnswers): number {
  let score = 6;
  if (answers.industry === "trades" || answers.industry === "beauty" || answers.industry === "clinic") score += 8;
  return score;
}

function scoreWinback(answers: CalculatorAnswers): number {
  let score = 5;
  if (answers.industry === "clinic" || answers.industry === "beauty" || answers.industry === "retail") score += 10;
  return score;
}

const SCORERS: Record<AutomationId, (answers: CalculatorAnswers) => number> = {
  "missed-catch": scoreMissedCatch,
  "quote-followup": scoreQuoteFollowup,
  "booking-reminders": scoreBooking,
  "invoice-chase": scoreInvoice,
  "review-ask": scoreReview,
  winback: scoreWinback,
};

export type RankedAutomation = Automation & { score: number; rank: number };

export function rankAutomations(answers: CalculatorAnswers): RankedAutomation[] {
  return (Object.keys(AUTOMATION_CATALOG) as AutomationId[])
    .map((id) => ({ ...AUTOMATION_CATALOG[id], score: SCORERS[id](answers) }))
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}
