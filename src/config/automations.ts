import { FIRST_BUILD_PRICE } from "./pricing.js";
import type { CalculatorAnswers } from "../services/calculator.js";

export type AutomationId =
  | "missed-catch"
  | "quote-followup"
  | "booking-reminders"
  | "invoice-chase"
  | "review-ask"
  | "winback";

export const AUTOMATION_IDS: AutomationId[] = [
  "missed-catch",
  "quote-followup",
  "booking-reminders",
  "invoice-chase",
  "review-ask",
  "winback",
];

export function isAutomationId(value: string): value is AutomationId {
  return (AUTOMATION_IDS as string[]).includes(value);
}

export type Automation = {
  id: AutomationId;
  name: string;
  leak: string;
  leakHint: string;
  promise: string;
  why: string;
  buildPrice: number;
  daysToLive: string;
};

export const AUTOMATION_CATALOG: Record<AutomationId, Automation> = {
  "missed-catch": {
    id: "missed-catch",
    name: "Missed-call catch",
    leak: "Calls ring out / nobody answers",
    leakHint: "On a job, after hours, during a consult.",
    promise: "If nobody picks up, Charlie answers or a text goes out in seconds — with a link to book or leave the job details.",
    why: "The first automation on purpose. You feel it the same day. It is also what this iPad is about to do to you.",
    buildPrice: FIRST_BUILD_PRICE,
    daysToLive: "7–10 days",
  },
  "quote-followup": {
    id: "quote-followup",
    name: "Quote follow-up",
    leak: "Quotes sit with no follow-up",
    leakHint: "Sent, then forgotten in a spreadsheet.",
    promise: "Every quote that sits gets a polite chase, then a second one, then it stops. No spreadsheet, no 'I forgot'.",
    why: "Trades and professional shops leak finished quotes, not just missed calls.",
    buildPrice: FIRST_BUILD_PRICE,
    daysToLive: "7–10 days",
  },
  "booking-reminders": {
    id: "booking-reminders",
    name: "Booking + reminders",
    leak: "People no-show or forget bookings",
    leakHint: "Empty chairs. No day-before text.",
    promise: "Confirmations, day-before reminders, and a one-tap reschedule. Cuts no-shows without a receptionist glued to the phone.",
    why: "Clinics, beauty and anyone with a chair/time slot bleeds here.",
    buildPrice: FIRST_BUILD_PRICE,
    daysToLive: "7–10 days",
  },
  "invoice-chase": {
    id: "invoice-chase",
    name: "Invoice chase",
    leak: "Invoices sit unpaid",
    leakHint: "You chase the same five people by hand.",
    promise: "Friendly due-date reminders, then a firmer one. You still sound like yourselves. Cash comes in faster.",
    why: "Cheaper than a part-time bookkeeper chasing the same five invoices.",
    buildPrice: 790,
    daysToLive: "5–7 days",
  },
  "review-ask": {
    id: "review-ask",
    name: "Review ask",
    leak: "We don't ask for Google reviews",
    leakHint: "Happy customers leave, then forget.",
    promise: "After a job is done, a message asks for a Google review while they still remember you.",
    why: "Second-wave work. Do it once they trust the first automation.",
    buildPrice: 790,
    daysToLive: "3–5 days",
  },
  winback: {
    id: "winback",
    name: "Come-back / recall",
    leak: "Past customers go quiet",
    leakHint: "Six months later, nobody rings them.",
    promise: "Six-month, twelve-month or 'you haven't been in' messages, timed to how the business actually works.",
    why: "The quiet money. Best after the inbox and the phone are already handled.",
    buildPrice: FIRST_BUILD_PRICE,
    daysToLive: "7–10 days",
  },
};

export const PHONE_AUTOMATION_IDS: AutomationId[] = ["missed-catch"];
export const VOLUME_AUTOMATION_IDS: AutomationId[] = [
  "missed-catch",
  "quote-followup",
  "booking-reminders",
  "winback",
];
export const ADMIN_AUTOMATION_IDS: AutomationId[] = ["invoice-chase", "quote-followup", "review-ask"];

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
  if (answers.industry === "trades" || answers.industry === "beauty" || answers.industry === "clinic") {
    score += 8;
  }
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

export type RankedAutomation = Automation & { score: number; rank: number; picked: boolean };

export function rankAutomations(answers: CalculatorAnswers): RankedAutomation[] {
  const needed = new Set(answers.neededAutomations ?? []);
  const scored = AUTOMATION_IDS.map((id) => ({
    ...AUTOMATION_CATALOG[id],
    score: SCORERS[id](answers),
    picked: needed.size === 0 ? true : needed.has(id),
  }));
  const byScore = (a: { score: number }, b: { score: number }) => b.score - a.score;
  const picked = needed.size ? scored.filter((item) => item.picked).sort(byScore) : [];
  const rest = (needed.size ? scored.filter((item) => !item.picked) : scored).sort(byScore);
  return [...picked, ...rest].map((item, index) => ({ ...item, rank: index + 1 }));
}

/** The live SMS that *is* the automation, sent to the owner during the visit. */
export function automationDemoSms(id: AutomationId, companyName: string, url: string): string {
  switch (id) {
    case "missed-catch":
      return `Sorry we missed your call just now at ${companyName}. Tap here to leave the job details: ${url}`;
    case "quote-followup":
      return `${companyName} here — just checking you got the quote. Still want us to go ahead? ${url}`;
    case "booking-reminders":
      return `Reminder from ${companyName}: you're booked. Reply YES to confirm, or change it here: ${url}`;
    case "invoice-chase":
      return `Friendly reminder from ${companyName} — invoice is due. View it here: ${url}`;
    case "review-ask":
      return `Thanks for using ${companyName}. Got 30 seconds for a Google review? ${url}`;
    case "winback":
      return `It's been a while since we saw you at ${companyName}. Book back in: ${url}`;
  }
}

export function automationDemoTalk(id: AutomationId, companyName: string): string {
  switch (id) {
    case "missed-catch":
      return `This is missed-call catch, live. I'm about to text you the same way we'd text a ${companyName} customer who just rang out — with a link to leave the job. Your phone will buzz in a few seconds.`;
    case "quote-followup":
      return `This is quote follow-up, live. I'm sending you the chase a ${companyName} quote would get if it sat for a few days. That's the automation, on you, right now.`;
    case "booking-reminders":
      return `This is a booking reminder, live. I'm texting you the same confirmation a ${companyName} customer would get the day before they sit down.`;
    case "invoice-chase":
      return `This is invoice chase, live. I'm sending you the polite due-date reminder ${companyName} would send, instead of you chasing it by hand.`;
    case "review-ask":
      return `This is the review ask, live. I'm texting you the same 30-second Google-review message a finished ${companyName} job would trigger.`;
    case "winback":
      return `This is a come-back message, live. I'm sending you the 'it's been a while' text ${companyName} would send a quiet customer.`;
  }
}
