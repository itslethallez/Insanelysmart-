import type { Person } from "../db/schema.js";
import { STYLES } from "./styles.js";

function safeJsonForScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderPersonNotFoundPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Insanely Smart</title>
<style>${STYLES}</style>
</head>
<body>
<div class="band top"><img src="/logo-transparent.webp" alt="Insanely Smart" class="logo" /></div>
<main class="container">
  <h1>I could not find that page.</h1>
  <p class="sub">The link may be out of date. Get in touch and I will sort it out.</p>
</main>
</body>
</html>`;
}

export function renderPersonPage(person: Person): string {
  const record = person.audit;
  const firstName = person.name.split(" ")[0] || person.name;
  const dollars = record ? Math.round(record.figures.annualAdminCost).toLocaleString("en-AU") : "0";
  const portalFollowUp = record?.portalFollowUp;

  // Charlie only makes sense once there's a real audit record to hand him as context - without
  // one there's nothing meaningful to pass as variableValues, and no VAPI_* env vars means the
  // feature isn't configured yet in this environment (matches SMS_PROVIDER's unset-is-off pattern).
  const vapiPublicKey = process.env.VAPI_PUBLIC_KEY;
  const vapiAssistantId = process.env.VAPI_ASSISTANT_ID;
  const charlie =
    record && vapiPublicKey && vapiAssistantId
      ? {
          publicKey: vapiPublicKey,
          assistantId: vapiAssistantId,
          variableValues: {
            firstName,
            totalAdminHoursPerWeek: record.figures.totalAdminHoursPerWeek,
            annualAdminHours: record.figures.annualAdminHours,
            weeklyAdminCost: Math.round(record.figures.weeklyAdminCost),
            annualAdminCost: Math.round(record.figures.annualAdminCost),
            publicToken: person.publicToken,
          },
        }
      : null;

  const config = { personId: person.id, publicToken: person.publicToken, charlie };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${escapeHtml(firstName)}, your figures, Insanely Smart</title>
<style>${STYLES}</style>
</head>
<body>
<div class="band top"><img src="/logo-transparent.webp" alt="Insanely Smart" class="logo" /></div>

<main class="container">
  <h1>Hi ${escapeHtml(firstName)}.</h1>

  ${record
    ? `<p class="sub">Here is a reminder of what I found for your workshop.</p>
  <div class="summary-card">
    <p class="reveal-eyebrow">What admin time is costing you</p>
    <div class="reveal-hours">$${dollars} a year</div>
    <div class="reveal-dollars">on admin tasks, at your labour rate</div>
  </div>
  ${charlie
    ? `<button type="button" class="btn-primary" id="btn-call-charlie"><span id="charlie-btn-label">Talk to Charlie about this</span></button>
  <p class="status" id="charlie-status"></p>`
    : ""
  }`
    : `<p class="sub">Your figures are not saved on this page yet.</p>`
  }

  <hr class="rule" />

  <div class="pov-block">
    <h2>About the AI workshop review</h2>
    <p>A free, 15-minute call where I go through your figures and what's possible for your workshop - no cost, no obligation.</p>
  </div>

  <h2>Tell me a bit more</h2>
  <p class="sub">This helps me prepare for our call.</p>

  <form id="followup-form">
    <label for="input-company">Company name</label>
    <input type="text" id="input-company" name="companyName" value="${escapeHtml(person.companyName ?? "")}" />

    <label for="input-email">Email</label>
    <input type="email" id="input-email" name="email" value="${escapeHtml(portalFollowUp?.email ?? "")}" />

    <label for="input-address">Address</label>
    <input type="text" id="input-address" name="address" value="${escapeHtml(person.address ?? "")}" />

    <label for="input-preferred-times">Preferred days or times for a call</label>
    <input type="text" id="input-preferred-times" name="preferredTimes" value="${escapeHtml(portalFollowUp?.preferredTimes ?? "")}" />

    <button type="submit" class="btn-primary" id="btn-save">Save my details</button>
    <p class="form-error hidden" id="form-error"></p>
    <p class="form-success hidden" id="form-success">Saved. Thanks.</p>
  </form>
</main>

<div class="band bottom">Insanely Smart. Adelaide, South Australia.</div>

<script>window.__PAGE_CONFIG__ = ${safeJsonForScript(config)};</script>
<script>${CLIENT_SCRIPT}</script>
</body>
</html>`;
}

const CLIENT_SCRIPT = `
(function () {
  "use strict";
  var config = window.__PAGE_CONFIG__;
  var form = document.getElementById("followup-form");
  var errorEl = document.getElementById("form-error");
  var successEl = document.getElementById("form-success");
  var btn = document.getElementById("btn-save");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    errorEl.classList.add("hidden");
    successEl.classList.add("hidden");
    btn.disabled = true;
    btn.textContent = "Saving...";

    fetch("/p/" + config.publicToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: document.getElementById("input-company").value.trim(),
        email: document.getElementById("input-email").value.trim(),
        address: document.getElementById("input-address").value.trim(),
        preferredTimes: document.getElementById("input-preferred-times").value.trim()
      })
    })
      .then(function (res) {
        if (!res.ok) throw new Error("save-failed");
        btn.disabled = false;
        btn.textContent = "Save my details";
        successEl.classList.remove("hidden");
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = "Save my details";
        errorEl.textContent = "Could not save that just now. Check your connection and try again.";
        errorEl.classList.remove("hidden");
      });
  });

  // ---- Talk to Charlie (only rendered when VAPI_PUBLIC_KEY/VAPI_ASSISTANT_ID are configured
  // and there's a real audit record to hand him as context) ----
  var callBtn = document.getElementById("btn-call-charlie");
  if (callBtn && config.charlie) {
    (async function () {
      var Vapi = (await import("https://esm.sh/@vapi-ai/web@2.3.8")).default;
      var vapi = new Vapi(config.charlie.publicKey);
      var label = document.getElementById("charlie-btn-label");
      var status = document.getElementById("charlie-status");
      var live = false;

      callBtn.addEventListener("click", function () {
        if (!live) {
          vapi.start(config.charlie.assistantId, { variableValues: config.charlie.variableValues });
          status.textContent = "Connecting...";
        } else {
          vapi.stop();
        }
      });

      vapi.on("call-start", function () {
        live = true;
        callBtn.classList.add("live");
        label.textContent = "End call";
        status.textContent = "Connected. Say hello to Charlie.";
      });
      vapi.on("call-end", function () {
        live = false;
        callBtn.classList.remove("live");
        label.textContent = "Talk to Charlie about this";
        status.textContent = "Call ended.";
      });
      vapi.on("speech-start", function () { if (live) status.textContent = "Charlie is speaking..."; });
      vapi.on("speech-end", function () { if (live) status.textContent = "Listening..."; });
      vapi.on("error", function (e) {
        live = false;
        callBtn.classList.remove("live");
        label.textContent = "Talk to Charlie about this";
        status.textContent = "Something went wrong. Tap to try again.";
        console.error(e);
      });

      // Purely cosmetic - set_outcome is an async server-side tool (Vapi calls POST /audit/outcome
      // directly), so this never fulfils the tool call. It only lets the UI react a beat sooner
      // than waiting for call-end.
      vapi.on("message", function (message) {
        if (
          message &&
          message.type === "tool-calls" &&
          Array.isArray(message.toolCallList) &&
          message.toolCallList.some(function (c) { return c.function && c.function.name === "set_outcome"; })
        ) {
          status.textContent = "Got it - wrapping up...";
        }
      });
    })();
  }
})();
`;
