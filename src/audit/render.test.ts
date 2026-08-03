import { test } from "node:test";
import assert from "node:assert/strict";
import { renderAuditPage } from "./render.js";
import { listIndustries } from "./industries/index.js";

const FORBIDDEN_PATTERNS: [name: string, pattern: RegExp][] = [
  ["em dash", /—/],
  ["en dash", /–/],
  ["right arrow", /→|&rarr;|&#8594;/],
  ["left arrow", /←|&larr;|&#8592;/],
];

test("rendered audit page contains no em-dashes, en-dashes or arrows, for every industry", () => {
  const industries = listIndustries();
  assert.ok(industries.length > 0, "expected at least one industry to test against");

  for (const industry of industries) {
    const html = renderAuditPage(industry, industries);
    for (const [name, pattern] of FORBIDDEN_PATTERNS) {
      assert.doesNotMatch(html, pattern, `${industry.key}: page contains a ${name}`);
    }
  }
});
