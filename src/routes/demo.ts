import { Router } from "express";
import { REFERENCE_LIST } from "../config/references.js";
import { CARE_PLANS, FIRST_BUILD_PRICE, PAYMENT_PATHS } from "../config/pricing.js";
import { QUESTIONS, JOB_VALUE_BY_INDUSTRY } from "../config/questions.js";
import { AUTOMATION_CATALOG } from "../config/automations.js";
import { calculate } from "../services/calculator.js";
import {
  createProof,
  getProof,
  lockSmsBody,
  proofSmsBody,
  proofUrl,
  publicBaseUrl,
  saveProof,
} from "../services/proofStore.js";
import { sendSms } from "../services/sms.js";
import { AnswersError, parseAnswers, requestBase } from "../lib/parseAnswers.js";
import { normaliseAuMobile } from "../lib/phone.js";

export const demoRouter = Router();

demoRouter.get("/config", (_req, res) => {
  res.json({
    questions: QUESTIONS,
    jobValueByIndustry: JOB_VALUE_BY_INDUSTRY,
    carePlans: CARE_PLANS,
    firstBuildPrice: FIRST_BUILD_PRICE,
    paymentPaths: PAYMENT_PATHS,
    automations: AUTOMATION_CATALOG,
    references: REFERENCE_LIST,
  });
});

demoRouter.post("/calculate", (req, res) => {
  try {
    const answers = parseAnswers(req.body);
    res.json(calculate(answers));
  } catch (err) {
    if (err instanceof AnswersError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

demoRouter.post("/proofs", async (req, res) => {
  try {
    const answers = parseAnswers(req.body);
    const proof = await createProof(answers);
    const { host, proto } = requestBase(req);
    const url = proofUrl(proof.id, publicBaseUrl(host, proto));
    res.status(201).json({ id: proof.id, url, proof });
  } catch (err) {
    if (err instanceof AnswersError) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error("POST /api/demo/proofs", err);
    res.status(500).json({ error: "Could not save the proof of value." });
  }
});

demoRouter.get("/proofs/:id", async (req, res) => {
  const proof = await getProof(req.params.id);
  if (!proof) {
    res.status(404).json({ error: "That proof of value was not found." });
    return;
  }
  const { host, proto } = requestBase(req);
  res.json({ id: proof.id, url: proofUrl(proof.id, publicBaseUrl(host, proto)), proof });
});

demoRouter.post("/proofs/:id/send", async (req, res) => {
  const proof = await getProof(req.params.id);
  if (!proof) {
    res.status(404).json({ error: "That proof of value was not found." });
    return;
  }

  const requested = typeof req.body?.mobile === "string" ? req.body.mobile : proof.answers.mobile;
  const mobile = requested ? normaliseAuMobile(requested) : null;
  if (!mobile) {
    res.status(400).json({ error: "Need a real Australian mobile, like 04xx xxx xxx." });
    return;
  }

  const { host, proto } = requestBase(req);
  const url = proofUrl(proof.id, publicBaseUrl(host, proto));
  const body = proofSmsBody(proof.answers.companyName, url);

  try {
    const sent = await sendSms(mobile, body);
    proof.answers.mobile = mobile;
    proof.sms = { to: mobile, body, dryRun: sent.dryRun, sentAt: new Date().toISOString() };
    await saveProof(proof);
    await maybeSaveLead(mobile, proof.answers.contactName, proof.answers.companyName, proof.answers.industry, body);
    res.json({ ok: true, dryRun: sent.dryRun, to: mobile, url, body });
  } catch (err) {
    console.warn("SMS send failed, keeping the proof link:", err);
    proof.answers.mobile = mobile;
    proof.sms = { to: mobile, body, dryRun: true, sentAt: new Date().toISOString() };
    await saveProof(proof);
    res.json({ ok: true, dryRun: true, to: mobile, url, body });
  }
});

demoRouter.post("/proofs/:id/lock", async (req, res) => {
  const proof = await getProof(req.params.id);
  if (!proof) {
    res.status(404).json({ error: "That proof of value was not found." });
    return;
  }

  const paymentPath = req.body?.paymentPath;
  if (paymentPath !== "invoice" && paymentPath !== "split" && paymentPath !== "care-first") {
    res.status(400).json({ error: "Pick how you want to pay." });
    return;
  }

  const name = typeof req.body?.contactName === "string" && req.body.contactName.trim()
    ? req.body.contactName.trim()
    : proof.answers.contactName;
  const requested = typeof req.body?.mobile === "string" ? req.body.mobile : proof.answers.mobile;
  const mobile = requested ? normaliseAuMobile(requested) : null;
  if (!mobile) {
    res.status(400).json({ error: "Need a real Australian mobile to lock this in." });
    return;
  }

  const { host, proto } = requestBase(req);
  const url = proofUrl(proof.id, publicBaseUrl(host, proto));
  const body = lockSmsBody(proof.answers.companyName, url);

  try {
    const sent = await sendSms(mobile, body);
    proof.lock = { paymentPath, contactName: name, mobile, lockedAt: new Date().toISOString() };
    proof.answers.mobile = mobile;
    proof.answers.contactName = name;
    await saveProof(proof);
    await maybeSaveLead(mobile, name, proof.answers.companyName, proof.answers.industry, body);
    res.json({ ok: true, dryRun: sent.dryRun, to: mobile, url, paymentPath });
  } catch (err) {
    console.warn("Lock SMS failed, proof still locked:", err);
    proof.lock = { paymentPath, contactName: name, mobile, lockedAt: new Date().toISOString() };
    proof.answers.mobile = mobile;
    proof.answers.contactName = name;
    await saveProof(proof);
    res.json({ ok: true, dryRun: true, to: mobile, url, paymentPath });
  }
});

async function maybeSaveLead(
  mobile: string,
  name: string,
  companyName: string,
  industry: string,
  outboundBody: string,
): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  try {
    const { upsertLeadByContact } = await import("../services/people.js");
    const { saveMessage } = await import("../services/messages.js");
    const person = await upsertLeadByContact(mobile, {
      source: "web",
      name,
      companyName,
      industryTag: industry,
    });
    await saveMessage(person.id, "outbound", outboundBody);
  } catch (err) {
    console.warn("Demo lead was not saved to the database:", err);
  }
}
