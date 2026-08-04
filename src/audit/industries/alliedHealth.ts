import type { Industry } from "../types.js";

export const alliedHealth: Industry = {
  key: "alliedHealth",
  name: "Allied health",
  hasMissedWork: true,
  tasks: [
    {
      key: "reminders", label: "Appointment reminders and no-shows", recoveryPct: 0.55,
      nudge: "No-shows are one of the most fixable costs in a clinic, and one of the easiest to ignore because they don't feel urgent.",
    },
    {
      key: "booking", label: "Booking and rescheduling", recoveryPct: 0.45,
      nudge: "Manual rescheduling is where double-bookings usually happen.",
    },
    {
      key: "recalls", label: "Recalls and follow-up appointments", recoveryPct: 0.55,
      nudge: "Patients who aren't recalled often just don't come back, quietly, without ever deciding to leave.",
    },
    {
      key: "intake", label: "New patient intake forms", recoveryPct: 0.45,
      nudge: "Paper intake is the first delay a new patient experiences.",
    },
    {
      key: "retyping", label: "Re-typing patient and billing details", recoveryPct: 0.50,
      nudge: "Every hand-typed record is a chance for something to not match across systems.",
    },
  ],
};
