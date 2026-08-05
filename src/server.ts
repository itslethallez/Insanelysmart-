import express from "express";
import { smsRouter } from "./routes/sms.js";
import { vapiRouter } from "./routes/vapi.js";
import { latestRouter } from "./routes/latest.js";
import { auditRouter } from "./routes/audit.js";
import { pRouter } from "./routes/p.js";
import { sturtRouter } from "./routes/sturt.js";

export const app = express();

// So req.protocol reflects the real scheme (https) behind Vercel's proxy, not the internal
// http hop - the audit text-back needs a correct absolute URL for the /p/:public_token link.
app.set("trust proxy", true);

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/sms", smsRouter);
app.use("/vapi/book", vapiRouter);
app.use("/api/latest", latestRouter);
app.use("/audit", auditRouter);
app.use("/p", pRouter);
// Sturt Young Learners' hosted enquiry form - a client system sharing this deployment
// temporarily (separate Supabase project, see src/sturt/db.ts). Whoever splits it out into
// its own deployment later: this route, src/sturt/*, and the SYL_* env vars are everything
// that needs to move.
app.use("/sturt", sturtRouter);

export default app;
