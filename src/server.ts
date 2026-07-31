import express from "express";
import { smsRouter } from "./routes/sms.js";

export const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/sms", smsRouter);
