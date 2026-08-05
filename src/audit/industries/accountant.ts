import type { Industry } from "../types.js";

export const accountant: Industry = {
  key: "accountant",
  name: "Accountant and bookkeeper",
  hasMissedWork: false,
  tasks: [
    {
      key: "chasingDocuments", label: "Chasing clients for the documents you need to do their job", recoveryPct: 0.55,
      nudge: "Late documents are usually the single biggest thing pushing deadlines to the wire.",
      system: "Document requests that chase themselves",
    },
    {
      key: "deadlineReminders", label: "Reminding clients a lodgement deadline is coming up", recoveryPct: 0.55,
      nudge: "A missed lodgement date costs more than the time it would've taken to remind someone.",
      system: "Lodgement reminders that go out before you have to think about it",
    },
    {
      key: "dataEntry", label: "Manually entering data from documents clients send in", recoveryPct: 0.50,
      nudge: "Manual entry is where small errors compound into big ones.",
      system: "Data entry that pulls straight from what clients send",
    },
    {
      key: "onboarding", label: "Onboarding new clients and setting up their file", recoveryPct: 0.40,
      nudge: "A clunky first impression is a common reason clients don't stay past year one.",
      system: "Self-serve onboarding that collects everything",
    },
    {
      key: "reports", label: "Building the same reports from scratch each time", recoveryPct: 0.50,
      nudge: "Reports built from scratch each time are hours that never show up as a line item.",
      system: "Reports that generate and send themselves",
    },
  ],
};
