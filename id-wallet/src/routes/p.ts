import { Router } from "express";
import { getPersonByPublicToken, saveFollowUp } from "../services/audit.js";
import { renderPersonPage, renderPersonNotFoundPage } from "../audit/renderPersonPage.js";

export const pRouter = Router();

pRouter.get("/:publicToken", async (req, res) => {
  const person = await getPersonByPublicToken(req.params.publicToken);
  if (!person) {
    res.status(404).type("html").send(renderPersonNotFoundPage());
    return;
  }
  res.type("html").send(renderPersonPage(person));
});

pRouter.post("/:publicToken", async (req, res) => {
  const person = await getPersonByPublicToken(req.params.publicToken);
  if (!person) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const companyName = typeof req.body?.companyName === "string" ? req.body.companyName.trim() : undefined;
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : undefined;
  const address = typeof req.body?.address === "string" ? req.body.address.trim() : undefined;
  const preferredTimes = typeof req.body?.preferredTimes === "string" ? req.body.preferredTimes.trim() : undefined;

  try {
    await saveFollowUp(person.id, { companyName, email, address, preferredTimes });
    res.json({ ok: true });
  } catch (err) {
    console.error("POST /p/:publicToken error:", err);
    res.status(500).json({ error: "Something went wrong saving that. Please try again shortly." });
  }
});
