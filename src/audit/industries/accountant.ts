import type { Industry } from "../types.js";

export const accountant: Industry = {
  key: "accountant",
  name: "Accountant and bookkeeper",
  hasMissedWork: false,
  tasks: [
    {
      key: "chasingDocuments", label: "Chasing clients for documents", recoveryPct: 0.55,
      nudge: "Late documents are usually the single biggest thing pushing deadlines to the wire.",
    },
    {
      key: "deadlineReminders", label: "Deadline and lodgement reminders", recoveryPct: 0.55,
      nudge: "A missed lodgement date costs more than the time it would've taken to remind someone.",
    },
    {
      key: "dataEntry", label: "Data entry and document wrangling", recoveryPct: 0.50,
      nudge: "Manual entry is where small errors compound into big ones.",
    },
    {
      key: "onboarding", label: "Onboarding new clients", recoveryPct: 0.40,
      nudge: "A clunky first impression is a common reason clients don't stay past year one.",
    },
    {
      key: "reports", label: "Building the same reports", recoveryPct: 0.50,
      nudge: "Reports built from scratch each time are hours that never show up as a line item.",
    },
  ],
};
