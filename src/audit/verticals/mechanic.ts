import type { Vertical } from "../types.js";

export const mechanic: Vertical = {
  key: "mechanic",
  name: "Mechanic",
  questions: [
    {
      id: "callsPerDay",
      label: "How many calls does your shop get a day?",
      bands: [
        { label: "0-10", value: 5 },
        { label: "10-25", value: 17.5 },
        { label: "25-50", value: 37.5 },
        { label: "50+", value: 50 },
      ],
    },
    {
      id: "missedCallsPerDay",
      label: "How many of those calls go unanswered a day?",
      bands: [
        { label: "None", value: 0 },
        { label: "1-3", value: 2 },
        { label: "3-6", value: 4.5 },
        { label: "6+", value: 6 },
      ],
    },
    {
      id: "bookingMinutes",
      label: "How long to take and enter one booking?",
      help: "From answering the phone to it being written down or entered somewhere.",
      bands: [
        { label: "Under 5 min", value: 2.5 },
        { label: "5-10 min", value: 7.5 },
        { label: "10-20 min", value: 15 },
        { label: "20+ min", value: 20 },
      ],
    },
    {
      id: "reminderHoursPerWeek",
      label: "Hours a week sending reminders?",
      help: "Calling or texting customers ahead of their booking.",
      bands: [
        { label: "Under 1 hr", value: 0.5 },
        { label: "1-3 hrs", value: 2 },
        { label: "3-6 hrs", value: 4.5 },
        { label: "6+ hrs", value: 6 },
      ],
    },
    {
      id: "approvalHoursPerWeek",
      label: "Hours a week chasing quote approvals?",
      help: "Calling or texting customers to approve extra work before you start.",
      bands: [
        { label: "Under 1 hr", value: 0.5 },
        { label: "1-3 hrs", value: 2 },
        { label: "3-6 hrs", value: 4.5 },
        { label: "6+ hrs", value: 6 },
      ],
    },
    {
      id: "peopleCount",
      label: "How many people handle this admin?",
      bands: [
        { label: "1", value: 1 },
        { label: "2", value: 2 },
        { label: "3", value: 3 },
        { label: "4+", value: 4 },
      ],
    },
    {
      id: "hourlyCost",
      label: "What does that person cost an hour, including on-costs?",
      bands: [
        { label: "Under $35", value: 17.5 },
        { label: "$35-50", value: 42.5 },
        { label: "$50-70", value: 60 },
        { label: "$70+", value: 70 },
      ],
    },
    {
      id: "averageJobValue",
      label: "What's an average booked job worth?",
      bands: [
        { label: "Under $250", value: 125 },
        { label: "$250-600", value: 425 },
        { label: "$600-1500", value: 1050 },
        { label: "$1500+", value: 1500 },
      ],
    },
  ],
};
