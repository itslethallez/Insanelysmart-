import type { Industry } from "../types.js";

export const mechanic: Industry = {
  key: "mechanic",
  name: "Mechanic",
  hasMissedWork: true,
  tasks: [
    { key: "answeringCalls", label: "Answering the phone and missed calls", recoveryPct: 0.45 },
    { key: "reminders", label: "Service and rego reminders", recoveryPct: 0.55 },
    { key: "booking", label: "Booking and rescheduling", recoveryPct: 0.45 },
    { key: "quotes", label: "Writing up and chasing quotes", recoveryPct: 0.40 },
    { key: "retyping", label: "Re-typing job and customer details", recoveryPct: 0.50 },
  ],
};
