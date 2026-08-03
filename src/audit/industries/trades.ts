import type { Industry } from "../types.js";

export const trades: Industry = {
  key: "trades",
  name: "Trades and installation",
  hasMissedWork: true,
  tasks: [
    { key: "answeringCalls", label: "Answering calls on the tools", recoveryPct: 0.45 },
    { key: "quotes", label: "Quoting and chasing quotes", recoveryPct: 0.40 },
    { key: "scheduling", label: "Scheduling crews and jobs", recoveryPct: 0.40 },
    { key: "purchaseOrders", label: "Purchase orders and job paperwork", recoveryPct: 0.50 },
    { key: "compliance", label: "Safety and compliance paperwork", recoveryPct: 0.40 },
    { key: "invoicing", label: "Invoicing and chasing payment", recoveryPct: 0.50 },
  ],
};
