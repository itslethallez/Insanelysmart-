import assert from "node:assert/strict";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  VISIT_APP_JS,
  VISIT_CHARLIE_JS,
  VISIT_PUBLIC_FILES,
  VISIT_STYLES,
} from "../visitAssets.js";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

describe("visit assets on Vercel", () => {
  it("loads css and js from public/ so the tracer can pack them", () => {
    assert.match(VISIT_STYLES, /\.topbar/);
    assert.match(VISIT_APP_JS, /\/api\/demo\/config/);
    assert.match(VISIT_CHARLIE_JS, /export function speak/);
    assert.equal(VISIT_PUBLIC_FILES.length, 5);
  });

  it("keeps an id-wallet tree in case Vercel Root Directory is still set to that", () => {
    const nested = path.join(repoRoot, "id-wallet");
    assert.equal(readFileSync(path.join(nested, "package.json"), "utf8"), readFileSync(path.join(repoRoot, "package.json"), "utf8"));
    assert.equal(readFileSync(path.join(nested, "vercel.json"), "utf8"), readFileSync(path.join(repoRoot, "vercel.json"), "utf8"));
    assert.equal(
      realpathSync(path.join(nested, "src")),
      realpathSync(path.join(repoRoot, "src")),
    );
    assert.ok(existsSync(path.join(nested, "api/index.ts")));
  });
});
