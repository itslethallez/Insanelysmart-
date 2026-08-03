import type { Industry } from "../types.js";

export const accountant: Industry = {
  key: "accountant",
  name: "Accountant and bookkeeper",
  hasMissedWork: false,
  tasks: [
    { key: "chasingDocuments", label: "Chasing clients for documents", recoveryPct: 0.55 },
    { key: "deadlineReminders", label: "Deadline and lodgement reminders", recoveryPct: 0.55 },
    { key: "dataEntry", label: "Data entry and document wrangling", recoveryPct: 0.50 },
    { key: "onboarding", label: "Onboarding new clients", recoveryPct: 0.40 },
    { key: "reports", label: "Building the same reports", recoveryPct: 0.50 },
  ],
};
