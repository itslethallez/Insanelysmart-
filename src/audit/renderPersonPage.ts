import type { Person } from "../db/schema.js";
import { STYLES } from "./styles.js";
import { cleanText } from "./textClean.js";

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
  const firstName = cleanText(person.name.split(" ")[0] || person.name);
  const hardCostDollars = record ? Math.round(record.figures.annualAdminCostHard).toLocaleString("en-AU") : "0";
  const leakDollars = record ? Math.round(record.figures.totalLeak).toLocaleString("en-AU") : "0";
  const portalFollowUp = record?.portalFollowUp;

  const config = { personId: person.id, publicToken: person.publicToken };

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

  <div class="info-box">
    <p>These are estimates based on the figures you entered. They have not been measured. A Business Blueprint is where I come to your workshop, measure the real numbers, and put them in writing with a guarantee attached: if the build does not save you at least what it costs, you do not pay for it. From $300, credited in full toward your build.</p>
  </div>

  ${record
    ? `<p class="sub">Here is a reminder of what I found for your workshop.</p>
  <div class="summary-card">
    <p class="reveal-eyebrow">What this is costing you</p>
    <div class="reveal-hours">$${hardCostDollars} a year</div>
    <div class="reveal-dollars">in admin time, at what you pay for it</div>
  </div>
  <div class="summary-card">
    <p class="reveal-eyebrow">Estimated revenue at risk</p>
    <div class="reveal-hours">$${leakDollars} a year</div>
    <div class="reveal-dollars">from missed follow-up</div>
  </div>`
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
})();
`;
