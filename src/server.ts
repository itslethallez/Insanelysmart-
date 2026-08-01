import express from "express";
import { leadsRouter } from "./routes/leads.js";
import { doNextRouter } from "./routes/doNext.js";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/leads", leadsRouter);
app.use("/api/do-next", doNextRouter);
