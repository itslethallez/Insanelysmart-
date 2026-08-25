import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { smsRouter } from "./routes/sms.js";
import { vapiRouter } from "./routes/vapi.js";
import { latestRouter } from "./routes/latest.js";
import { demoRouter } from "./routes/demo.js";

function resolvePublicDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(process.cwd(), "public"),
    path.resolve(here, "../public"),
    path.resolve(here, "../../public"),
  ];
  return candidates.find((dir) => fs.existsSync(path.join(dir, "index.html"))) ?? candidates[0];
}

const publicDir = resolvePublicDir();

export const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/sms", smsRouter);
app.use("/vapi/book", vapiRouter);
app.use("/api/latest", latestRouter);
app.use("/api/demo", demoRouter);

app.use(express.static(publicDir, { index: false, extensions: ["html"] }));

app.get(["/", "/playbook", "/calculator", "/value", "/value/:id"], (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

export default app;
