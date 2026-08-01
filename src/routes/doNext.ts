import { Router } from "express";
import { getDoNext } from "../services/doNext.js";

export const doNextRouter = Router();

doNextRouter.get("/", async (_req, res) => {
  const items = await getDoNext();
  res.json(items);
});
