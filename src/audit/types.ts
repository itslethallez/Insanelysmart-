/**
 * One of the four fixed admin-time buckets on Screens B-E. `key` is stable across saved
 * records; never renumber, only append. Mechanic-only, not industry-specific.
 */
export type BucketKey = "phoneMessages" | "bookingsScheduling" | "quotesInvoices" | "recordsDataEntry";

export type AdminTimeBucket = {
  key: BucketKey;
  label: string;
  description: string;
};

export const ADMIN_TIME_BUCKETS: AdminTimeBucket[] = [
  { key: "phoneMessages", label: "Phone and messages", description: "Answering calls, ringing back, job updates" },
  { key: "bookingsScheduling", label: "Bookings and scheduling", description: "Diary, reschedules, availability" },
  { key: "quotesInvoices", label: "Quotes and invoices", description: "Writing, sending, chasing" },
  { key: "recordsDataEntry", label: "Records and data entry", description: "Customer details, vehicles, regos, history" },
];
