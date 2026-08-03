import express from "express";
import { smsRouter } from "./routes/sms.js";
import { vapiRouter } from "./routes/vapi.js";
import { latestRouter } from "./routes/latest.js";
import { auditRouter } from "./routes/audit.js";
import { pRouter } from "./routes/p.js";

export const app = express();

// So req.protocol reflects the real scheme (https) behind Vercel's proxy, not the internal
// http hop - the audit text-back needs a correct absolute URL for the /p/:public_token link.
app.set("trust proxy", true);

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

export default app;
