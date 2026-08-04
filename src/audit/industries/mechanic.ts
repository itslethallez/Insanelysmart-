import type { Industry } from "../types.js";

export const mechanic: Industry = {
  key: "mechanic",
  name: "Mechanic",
  hasMissedWork: true,
  tasks: [
    {
      key: "answeringCalls", label: "Answering the phone and missed calls", recoveryPct: 0.45,
      nudge: "Businesses that don't answer every call are usually losing some of them to whoever picks up next. Worth a look even if it feels manageable.",
    },
    {
      key: "reminders", label: "Service and rego reminders", recoveryPct: 0.55,
      nudge: "Customers who aren't reminded often just don't come back, not because they left, because they forgot.",
    },
    {
      key: "booking", label: "Booking and rescheduling", recoveryPct: 0.45,
      nudge: "Manual booking is where double-ups and no-shows usually creep in.",
    },
    {
      key: "quotes", label: "Writing up and chasing quotes", recoveryPct: 0.40,
      nudge: "Quotes that don't get followed up tend to go quiet. Most jobs need more than one touch to close.",
    },
    {
      key: "retyping", label: "Re-typing job and customer details", recoveryPct: 0.50,
      nudge: "Every re-type is a chance for something to end up wrong somewhere else in the system.",
    },
  ],
};
