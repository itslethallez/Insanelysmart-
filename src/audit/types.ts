/**
 * One admin task on Step 3. Fixed list and order, mechanic-only - `key` and `label` are
 * stable across saved records; never renumber, only append. `label` is the exact display
 * name used in taskBreakdown and the results screen (matches the build spec's own examples,
 * e.g. "Phone calls", "Missed calls").
 */
export type TaskCard = {
  key: string;
  label: string;
  question: string;
};

export const TASK_CARDS: TaskCard[] = [
  { key: "phoneCalls", label: "Phone calls", question: "Do you spend time answering phone calls?" },
  { key: "missedCalls", label: "Missed calls", question: "Do you spend time dealing with missed calls?" },
  { key: "bookingManagement", label: "Booking management", question: "Do you spend time managing bookings and rescheduling?" },
  { key: "serviceReminders", label: "Service reminders", question: "Do you send service reminders to customers?" },
  { key: "quoteWriting", label: "Quote writing", question: "Do you spend time writing quotes?" },
  { key: "quoteFollowUp", label: "Quote follow-up", question: "Do you spend time following up on quotes?" },
  { key: "customerUpdates", label: "Customer updates", question: "Do you spend time sending customers job updates?" },
  { key: "invoicingAndPayments", label: "Invoicing and payments", question: "Do you spend time on invoicing and chasing payments?" },
  { key: "dataEntry", label: "Data entry", question: "Do you spend time on data entry?" },
  { key: "otherAdmin", label: "Other admin", question: "Do you spend time on any other admin tasks?" },
];
