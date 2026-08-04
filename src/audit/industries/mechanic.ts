import type { Industry } from "../types.js";

export const mechanic: Industry = {
  key: "mechanic",
  name: "Mechanic",
  hasMissedWork: true,
  tasks: [
    {
      key: "answeringCalls", label: "Answering the phone and returning missed calls", recoveryPct: 0.45,
      nudge: "Businesses that don't answer every call are usually losing some of them to whoever picks up next. Worth a look even if it feels manageable.",
      system: "Missed-call text-back that never lets a job slip",
    },
    {
      key: "reminders", label: "Reminding customers when their car's due for a service", recoveryPct: 0.55,
      nudge: "Customers who aren't reminded often just don't come back, not because they left, because they forgot.",
      system: "Service reminders that go out without anyone chasing them",
    },
    {
      key: "booking", label: "Booking and rescheduling appointments", recoveryPct: 0.45,
      nudge: "Manual booking is where double-ups and no-shows usually creep in.",
      note: "Automated booking works within rules you set - e.g. if a service takes 2 hours, it books within that.",
      system: "Booking that runs itself around your calendar",
    },
    {
      key: "quotes", label: "Writing up and following up on quotes", recoveryPct: 0.40,
      nudge: "Quotes that don't get followed up tend to go quiet. Most jobs need more than one touch to close.",
      note: "We can't write the quote for you - but we can automate the sending, chasing, and follow-up around it.",
      system: "Quotes that keep following up until they close",
    },
    {
      key: "retyping", label: "Re-typing the same customer and vehicle details more than once", recoveryPct: 0.50,
      nudge: "Every re-type is a chance for something to end up wrong somewhere else in the system.",
      system: "One record that never needs re-typing",
    },
  ],
};
