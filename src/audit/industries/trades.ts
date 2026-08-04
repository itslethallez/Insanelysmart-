import type { Industry } from "../types.js";

export const trades: Industry = {
  key: "trades",
  name: "Trades and installation",
  hasMissedWork: true,
  tasks: [
    {
      key: "answeringCalls", label: "Answering calls while you're out on the tools", recoveryPct: 0.45,
      nudge: "Missed calls while you're on site are calls someone else answers first.",
    },
    {
      key: "quotes", label: "Writing up and following up on quotes", recoveryPct: 0.40,
      nudge: "The business that follows up fastest usually wins the job, not the best quote.",
      note: "We can't write the quote for you - but we can automate the sending, chasing, and follow-up around it.",
    },
    {
      key: "scheduling", label: "Scheduling crews and jobs so nothing double-books", recoveryPct: 0.40,
      nudge: "Manual scheduling is where clashes and no-shows usually start.",
      note: "Automated scheduling works within rules you set - e.g. crew size, job length, and travel time between sites.",
    },
    {
      key: "purchaseOrders", label: "Raising purchase orders and job paperwork before work starts", recoveryPct: 0.50,
      nudge: "Jobs that start without a PO are the ones that get chased for payment later.",
    },
    {
      key: "compliance", label: "Filling out safety and compliance paperwork for each job", recoveryPct: 0.40,
      nudge: "Paper trails are the first thing that falls behind when things get busy.",
    },
    {
      key: "invoicing", label: "Invoicing jobs and chasing overdue payment", recoveryPct: 0.50,
      nudge: "Late invoices are the quiet reason cash flow gets tight.",
    },
  ],
};
