/**
 * One admin task card on Step 3. Fixed list, not industry-specific - this calculator is
 * mechanic-only. `key` is stable across saved records; never renumber, only append.
 */
export type TaskCard = {
  key: string;
  /** The Yes/No question shown on the card. */
  question: string;
  /** True for Card J, the only free-text one - hours still apply. */
  freeText?: boolean;
};

export const TASK_CARDS: TaskCard[] = [
  { key: "answeringCalls", question: "Do you spend time answering incoming calls?" },
  { key: "returningMissedCalls", question: "Do you spend time calling customers back after missed calls?" },
  { key: "managingBookings", question: "Do you spend time juggling bookings, reschedules, and workshop availability?" },
  { key: "reminders", question: "Do you manually send service, rego, or maintenance reminders to customers?" },
  { key: "writingQuotes", question: "Do you spend time preparing quotes and estimates?" },
  { key: "followingUpQuotes", question: "Do you spend time chasing customers who haven't accepted a quote?" },
  { key: "customerUpdates", question: "Do you spend time texting or calling customers with job updates?" },
  { key: "invoicing", question: "Do you spend time sending invoices and chasing unpaid invoices?" },
  { key: "dataEntry", question: "Do you spend time entering customer names, vehicle details, registrations, or service history into systems?" },
  { key: "other", question: "Any other admin work that eats into your week?", freeText: true },
];
