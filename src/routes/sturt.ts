import { Router } from "express";
import { renderSturtEnquiryPage } from "../sturt/render.js";
import { saveEnquiry, sendEnquiryTexts } from "../sturt/enquiries.js";
import { isValidEmail, normalizeAuMobile } from "../sturt/validate.js";

export const sturtRouter = Router();

sturtRouter.get("/", (_req, res) => {
  res.type("html").send(renderSturtEnquiryPage());
});

function stringOrUndefined(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

sturtRouter.post("/", async (req, res) => {
  const parentFirstName = stringOrUndefined(req.body?.parentFirstName);
  const parentLastName = stringOrUndefined(req.body?.parentLastName);
  const rawMobile = stringOrUndefined(req.body?.mobile);
  const email = stringOrUndefined(req.body?.email);

  if (!parentFirstName || !parentLastName || !rawMobile || !email) {
    res.status(400).json({ error: "Parent name, mobile number and email are required." });
    return;
  }

  const mobile = normalizeAuMobile(rawMobile);
  if (!mobile) {
    res.status(400).json({ error: "That doesn't look like a valid Australian mobile number." });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ error: "That doesn't look like a valid email address." });
    return;
  }

  const childDob = stringOrUndefined(req.body?.childDob);
  const childDueDate = stringOrUndefined(req.body?.childDueDate);

  const enquiry = {
    parentFirstName,
    parentLastName,
    mobile,
    email,
    childFirstName: stringOrUndefined(req.body?.childFirstName),
    childDob,
    childDueDate,
    daysNeeded: stringOrUndefined(req.body?.daysNeeded),
    preferredStart: stringOrUndefined(req.body?.preferredStart),
    postcode: stringOrUndefined(req.body?.postcode),
    hearAbout: stringOrUndefined(req.body?.hearAbout),
  };

  try {
    const saved = await saveEnquiry(enquiry);
    console.log("Sturt enquiry saved:", { id: saved.id, createdAt: saved.createdAt, source: "website-form" });

    await sendEnquiryTexts(enquiry);

    res.json({ ok: true });
  } catch (err) {
    console.error("POST /sturt error:", err);
    res.status(500).json({ error: "Something went wrong saving that. Please try again shortly." });
  }
});
