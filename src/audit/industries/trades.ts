import type { Industry } from "../types.js";

export const trades: Industry = {
  key: "trades",
  name: "Trades and installation",
  hasMissedWork: true,
  tasks: [
    {
      key: "answeringCalls", label: "Answering calls on the tools", recoveryPct: 0.45,
      nudge: "Missed calls while you're on site are calls someone else answers first.",
    },
    {
      key: "quotes", label: "Quoting and chasing quotes", recoveryPct: 0.40,
      nudge: "The business that follows up fastest usually wins the job, not the best quote.",
    },
    {
      key: "scheduling", label: "Scheduling crews and jobs", recoveryPct: 0.40,
      nudge: "Manual scheduling is where clashes and no-shows usually start.",
    },
    {
      key: "purchaseOrders", label: "Purchase orders and job paperwork", recoveryPct: 0.50,
      nudge: "Jobs that start without a PO are the ones that get chased for payment later.",
    },
    {
      key: "compliance", label: "Safety and compliance paperwork", recoveryPct: 0.40,
      nudge: "Paper trails are the first thing that falls behind when things get busy.",
    },
    {
      key: "invoicing", label: "Invoicing and chasing payment", recoveryPct: 0.50,
      nudge: "Late invoices are the quiet reason cash flow gets tight.",
    },
  ],
};
