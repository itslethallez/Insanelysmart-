import type { Person } from "../db/schema.js";
import { getIndustry } from "./industries/index.js";
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
  <h1>We could not find that page.</h1>
  <p class="sub">The link may be out of date. Get in touch and we will sort it out.</p>
</main>
</body>
</html>`;
}

export function renderPersonPage(person: Person): string {
  const record = person.audit;
  const firstName = person.name.split(" ")[0] || person.name;
  const industry = record ? getIndustry(record.inputs.industryKey) : null;
  const hours = record ? Math.round(record.figures.totalRecoveredHoursAnnual) : 0;
  const dollars = record ? Math.round(record.figures.totalRecovered).toLocaleString("en-AU") : "0";
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

  ${record && industry
    ? `<p class="sub">Here is a reminder of what we found for your ${escapeHtml(industry.name.toLowerCase())} business.</p>
  <div class="summary-card">
    <p class="reveal-eyebrow">What this is costing you</p>
    <div class="reveal-hours">That's about ${hours} hours a year</div>
    <div class="reveal-dollars">worth roughly $${dollars} at your cost of time</div>
  </div>`
    : `<p class="sub">Your figures are not saved on this page yet.</p>`
  }

  <hr class="rule" />

  <div class="pov-block">
    <h2>About the Proof of Value</h2>
    <p>The Proof of Value is a short, paid build that shows exactly what a system saves in your business, in writing, before you commit to anything bigger. From $300, credited in full toward the build. If it does not save at least what it costs, you do not pay for it.</p>
  </div>

  <h2>Tell us a bit more</h2>
  <p class="sub">This helps us prepare your Proof of Value.</p>

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
