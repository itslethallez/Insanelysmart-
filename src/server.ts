import express from "express";
import { smsRouter } from "./routes/sms.js";
import { vapiRouter } from "./routes/vapi.js";
import { latestRouter } from "./routes/latest.js";
import { auditRouter } from "./routes/audit.js";

export const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/sms", smsRouter);
app.use("/vapi/book", vapiRouter);
app.use("/api/latest", latestRouter);
app.use("/audit", auditRouter);

export default app;
