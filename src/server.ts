import path from "node:path";
import express from "express";
import { smsRouter } from "./routes/sms.js";
import { vapiRouter } from "./routes/vapi.js";
import { latestRouter } from "./routes/latest.js";
import { auditRouter } from "./routes/audit.js";
import { renderAuditPage } from "./audit/render.js";
import { pRouter } from "./routes/p.js";
import { sturtRouter } from "./routes/sturt.js";
import { demoRouter } from "./routes/demo.js";
import { VISIT_HTML } from "./visitHtml.js";

export const app = express();

const publicDir = path.resolve(process.cwd(), "public");

function sendVisit(_req: express.Request, res: express.Response) {
  res.type("html").send(VISIT_HTML);
}

// So req.protocol reflects the real scheme (https) behind Vercel's proxy, not the internal
// http hop - the audit text-back needs a correct absolute URL for the /p/:public_token link.
app.set("trust proxy", true);

app.use(express.static(publicDir, { index: false }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// The workshop calculator stays the front door of this deployment.
app.get("/", (_req, res) => {
  res.type("html").send(renderAuditPage());
});

app.use("/sms", smsRouter);
app.use("/vapi/book", vapiRouter);
app.use("/api/latest", latestRouter);
app.use("/api/demo", demoRouter);
app.use("/audit", auditRouter);
app.use("/p", pRouter);
// Sturt Young Learners' hosted enquiry form - a client system sharing this deployment
// temporarily (separate Supabase project, see src/sturt/db.ts). Whoever splits it out into
// its own deployment later: this route, src/sturt/*, and the SYL_* env vars are everything
// that needs to move.
app.use("/sturt", sturtRouter);

app.get("/visit", sendVisit);
app.get("/playbook", sendVisit);
app.get("/calculator", sendVisit);
app.get("/value", sendVisit);
app.get("/value/:id", sendVisit);

export default app;
