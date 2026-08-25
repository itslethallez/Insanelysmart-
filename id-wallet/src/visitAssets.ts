import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Static visit files are read with literal `import.meta.url` paths so Vercel's
 * Node file tracer packs them into the serverless function. `express.static`
 * plus `includeFiles` is how these 404 on Vercel or fail the Git deploy.
 */
export const VISIT_STYLES = readFileSync(
  fileURLToPath(new URL("../public/assets/styles.css", import.meta.url)),
  "utf8",
);
export const VISIT_APP_JS = readFileSync(
  fileURLToPath(new URL("../public/assets/app.js", import.meta.url)),
  "utf8",
);
export const VISIT_CHARLIE_JS = readFileSync(
  fileURLToPath(new URL("../public/assets/charlie.js", import.meta.url)),
  "utf8",
);
export const VISIT_MANIFEST = readFileSync(
  fileURLToPath(new URL("../public/manifest.json", import.meta.url)),
  "utf8",
);
export const VISIT_FAVICON = readFileSync(
  fileURLToPath(new URL("../public/favicon.svg", import.meta.url)),
  "utf8",
);

export const VISIT_PUBLIC_FILES: ReadonlyArray<{
  url: string;
  type: string;
  body: string;
}> = [
  { url: "/assets/styles.css", type: "text/css; charset=utf-8", body: VISIT_STYLES },
  { url: "/assets/app.js", type: "text/javascript; charset=utf-8", body: VISIT_APP_JS },
  { url: "/assets/charlie.js", type: "text/javascript; charset=utf-8", body: VISIT_CHARLIE_JS },
  { url: "/manifest.json", type: "application/manifest+json", body: VISIT_MANIFEST },
  { url: "/favicon.svg", type: "image/svg+xml; charset=utf-8", body: VISIT_FAVICON },
];
