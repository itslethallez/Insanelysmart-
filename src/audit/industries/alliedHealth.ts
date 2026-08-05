import type { Industry } from "../types.js";

export const alliedHealth: Industry = {
  key: "alliedHealth",
  name: "Allied health",
  hasMissedWork: true,
  tasks: [
    {
      key: "reminders", label: "Reminding patients about upcoming appointments", recoveryPct: 0.55,
      nudge: "No-shows are one of the most fixable costs in a clinic, and one of the easiest to ignore because they don't feel urgent.",
      system: "Appointment reminders that cut no-shows without anyone dialling",
    },
    {
      key: "booking", label: "Booking and rescheduling appointments", recoveryPct: 0.45,
      nudge: "Manual rescheduling is where double-bookings usually happen.",
      note: "Automated booking works within rules you set - e.g. session length and practitioner availability.",
      system: "Booking that runs itself around your rules",
    },
    {
      key: "recalls", label: "Recalling patients who are due for a follow-up", recoveryPct: 0.55,
      nudge: "Patients who aren't recalled often just don't come back, quietly, without ever deciding to leave.",
      system: "Recall reminders that bring patients back automatically",
    },
    {
      key: "intake", label: "Getting new patients to fill out intake forms", recoveryPct: 0.45,
      nudge: "Paper intake is the first delay a new patient experiences.",
      system: "Intake forms patients fill out before they arrive",
    },
    {
      key: "retyping", label: "Re-typing the same patient and billing details more than once", recoveryPct: 0.50,
      nudge: "Every hand-typed record is a chance for something to not match across systems.",
      system: "One patient record that never needs re-typing",
    },
  ],
};
