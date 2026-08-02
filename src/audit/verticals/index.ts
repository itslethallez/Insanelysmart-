import type { Vertical } from "../types.js";
import { mechanic } from "./mechanic.js";

export const DEFAULT_VERTICAL_KEY = "mechanic";

const verticals: Record<string, Vertical> = {
  mechanic,
};

/** Looks up a vertical by key, falling back to the default when unknown or missing. */
export function getVertical(key?: string): Vertical {
  if (key && verticals[key]) return verticals[key];
  return verticals[DEFAULT_VERTICAL_KEY];
}
