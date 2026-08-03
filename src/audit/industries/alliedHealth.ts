import type { Industry } from "../types.js";

export const alliedHealth: Industry = {
  key: "alliedHealth",
  name: "Allied health",
  hasMissedWork: true,
  tasks: [
    { key: "reminders", label: "Appointment reminders and no-shows", recoveryPct: 0.55 },
    { key: "booking", label: "Booking and rescheduling", recoveryPct: 0.45 },
    { key: "recalls", label: "Recalls and follow-up appointments", recoveryPct: 0.55 },
    { key: "intake", label: "New patient intake forms", recoveryPct: 0.45 },
    { key: "retyping", label: "Re-typing patient and billing details", recoveryPct: 0.50 },
  ],
};
