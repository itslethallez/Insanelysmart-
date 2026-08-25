import type { Industry, PhoneHandler, TeamBand } from "../services/calculator.js";

export type Choice = { value: string; label: string; hint?: string };

export type Question = {
  id: string;
  prompt: string;
  charlie: string;
  kind: "text" | "tel" | "chips" | "money";
  placeholder?: string;
  choices?: Choice[];
  optional?: boolean;
};

export const INDUSTRY_CHOICES: Choice[] = [
  { value: "trades", label: "Trades", hint: "Plumber, sparky, builder, roofer…" },
  { value: "clinic", label: "Clinic / health" },
  { value: "beauty", label: "Beauty / personal care" },
  { value: "professional", label: "Professional services", hint: "Accountant, lawyer, consultant…" },
  { value: "hospitality", label: "Cafe / hospitality" },
  { value: "retail", label: "Retail" },
  { value: "other", label: "Something else" },
];

export const TEAM_CHOICES: Choice[] = [
  { value: "1-5", label: "1–5 people" },
  { value: "6-10", label: "6–10 people" },
  { value: "11+", label: "11 or more" },
];

export const PHONE_CHOICES: Choice[] = [
  { value: "owner", label: "I pick it up" },
  { value: "receptionist", label: "Someone on the desk" },
  { value: "whoever", label: "Whoever is free" },
  { value: "rings-out", label: "It often rings out" },
];

export const ENQUIRY_CHOICES: Choice[] = [
  { value: "8", label: "About 8 a week" },
  { value: "15", label: "About 15" },
  { value: "25", label: "About 25" },
  { value: "40", label: "40+" },
];

export const UNANSWERED_CHOICES: Choice[] = [
  { value: "0.1", label: "Almost none", hint: "We still count 10% — nobody bats 100%." },
  { value: "0.25", label: "About a quarter" },
  { value: "0.5", label: "About half" },
  { value: "0.7", label: "Most of them" },
];

export const ADMIN_CHOICES: Choice[] = [
  { value: "3", label: "A couple of hours" },
  { value: "5", label: "About 5" },
  { value: "8", label: "About 8" },
  { value: "12", label: "12 or more" },
];

export const JOB_VALUE_BY_INDUSTRY: Record<Industry, Choice[]> = {
  trades: [
    { value: "450", label: "$450" },
    { value: "850", label: "$850" },
    { value: "1500", label: "$1,500" },
    { value: "3500", label: "$3,500+" },
  ],
  clinic: [
    { value: "90", label: "$90" },
    { value: "160", label: "$160" },
    { value: "280", label: "$280" },
    { value: "500", label: "$500+" },
  ],
  beauty: [
    { value: "70", label: "$70" },
    { value: "140", label: "$140" },
    { value: "220", label: "$220" },
    { value: "400", label: "$400+" },
  ],
  professional: [
    { value: "400", label: "$400" },
    { value: "1200", label: "$1,200" },
    { value: "2500", label: "$2,500" },
    { value: "5000", label: "$5,000+" },
  ],
  hospitality: [
    { value: "25", label: "$25" },
    { value: "45", label: "$45" },
    { value: "80", label: "$80" },
    { value: "150", label: "$150+" },
  ],
  retail: [
    { value: "40", label: "$40" },
    { value: "85", label: "$85" },
    { value: "160", label: "$160" },
    { value: "300", label: "$300+" },
  ],
  other: [
    { value: "120", label: "$120" },
    { value: "250", label: "$250" },
    { value: "600", label: "$600" },
    { value: "1500", label: "$1,500+" },
  ],
};

export const QUESTIONS: Question[] = [
  {
    id: "contactName",
    prompt: "What's your name?",
    charlie: "Just your first name is fine.",
    kind: "text",
    placeholder: "First name",
  },
  {
    id: "companyName",
    prompt: "And the business?",
    charlie: "The name on the door, or the name people search.",
    kind: "text",
    placeholder: "Business name",
  },
  {
    id: "industry",
    prompt: "What kind of work is this?",
    charlie: "Tap the closest. I'll use it to rank the automations, not to invent your prices.",
    kind: "chips",
    choices: INDUSTRY_CHOICES,
  },
  {
    id: "teamSize",
    prompt: "How many people work here?",
    charlie: "Count everyone, including you. This picks the care package.",
    kind: "chips",
    choices: TEAM_CHOICES,
  },
  {
    id: "phoneHandler",
    prompt: "Who actually picks up the phone when it rings?",
    charlie: "Be honest. Most owners say 'me' and then admit it rings out on a job.",
    kind: "chips",
    choices: PHONE_CHOICES,
  },
  {
    id: "weeklyEnquiries",
    prompt: "Roughly how many people try to reach you in a week?",
    charlie: "Calls, DMs, web forms — people wanting a job or a booking. Closest number is fine.",
    kind: "chips",
    choices: ENQUIRY_CHOICES,
  },
  {
    id: "unansweredRate",
    prompt: "How many of those don't get a real answer straight away?",
    charlie: "After hours, on a job, during a consult, sitting on voicemail. That's the leak.",
    kind: "chips",
    choices: UNANSWERED_CHOICES,
  },
  {
    id: "averageJobValue",
    prompt: "What's a normal job or booking worth?",
    charlie: "Average, not your best week. I'll only multiply numbers you just gave me.",
    kind: "chips",
  },
  {
    id: "adminHoursPerWeek",
    prompt: "Hours a week on quotes, invoices, reminders, chasing, booking?",
    charlie: "If you're not sure I'll use the Airtasker founder survey — 2.7 hours admin plus 2.2 hours accounting.",
    kind: "chips",
    choices: ADMIN_CHOICES,
  },
  {
    id: "mobile",
    prompt: "Where should I send the proof of value?",
    charlie: "Your mobile. I'll text you a link before you hand the iPad back — that's the demo.",
    kind: "tel",
    placeholder: "04xx xxx xxx",
  },
];

export const TEAM_BANDS: TeamBand[] = ["1-5", "6-10", "11+"];
export const PHONE_HANDLERS: PhoneHandler[] = ["owner", "receptionist", "whoever", "rings-out"];
export const INDUSTRIES: Industry[] = [
  "trades",
  "clinic",
  "beauty",
  "professional",
  "hospitality",
  "retail",
  "other",
];
