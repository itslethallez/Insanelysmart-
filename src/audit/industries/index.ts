import type { Industry } from "../types.js";
import { mechanic } from "./mechanic.js";
import { trades } from "./trades.js";
import { accountant } from "./accountant.js";
import { alliedHealth } from "./alliedHealth.js";

export const DEFAULT_INDUSTRY_KEY = "mechanic";

const industries: Record<string, Industry> = {
  mechanic,
  trades,
  accountant,
  alliedHealth,
};

/** Looks up an industry by key, falling back to the default when unknown or missing. */
export function getIndustry(key?: string): Industry {
  if (key && industries[key]) return industries[key];
  return industries[DEFAULT_INDUSTRY_KEY];
}

export function listIndustries(): Industry[] {
  return Object.values(industries);
}
