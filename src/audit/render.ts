import { STYLES } from "./styles.js";
import { ADMIN_TIME_BUCKETS } from "./types.js";
import {
  WORKING_WEEKS,
  HOURLY_RATE_MIN,
  HOURLY_RATE_MAX,
  HOURLY_RATE_STEP,
  HOURLY_RATE_DEFAULT,
  ADMIN_COST_RATE_MIN,
  ADMIN_COST_RATE_MAX,
  ADMIN_COST_RATE_STEP,
  ADMIN_COST_RATE_DEFAULT,
  WORKERS_MIN,
  WORKERS_MAX,
  WORKERS_DEFAULT,
  JOBS_PER_WEEK_MIN,
  JOBS_PER_WEEK_MAX,
  JOBS_PER_WEEK_DEFAULT,
  AVERAGE_INVOICE_MIN,
  AVERAGE_INVOICE_MAX,
  AVERAGE_INVOICE_STEP,
  AVERAGE_INVOICE_DEFAULT,
  HOURS_MIN,
  HOURS_MAX,
  HOURS_STEP,
  HOURS_DEFAULT,
  MISSED_CALLS_MIN,
  MISSED_CALLS_MAX,
  MISSED_CALLS_STEP,
  MISSED_CALLS_DEFAULT,
  NEW_CALLER_PCT_MIN,
  NEW_CALLER_PCT_MAX,
  NEW_CALLER_PCT_STEP,
  NEW_CALLER_PCT_DEFAULT,
  MISSED_CALL_NEW_CALLER_LOSS_RATE,
  QUOTES_PER_WEEK_MIN,
  QUOTES_PER_WEEK_MAX,
  QUOTES_PER_WEEK_STEP,
  QUOTES_PER_WEEK_DEFAULT,
  QUOTE_QUIET_PCT_MIN,
  QUOTE_QUIET_PCT_MAX,
  QUOTE_QUIET_PCT_STEP,
  QUOTE_QUIET_PCT_DEFAULT,
  QUOTE_RECOVERY_RATE,
  ACTIVE_CUSTOMERS_MIN,
  ACTIVE_CUSTOMERS_MAX,
  ACTIVE_CUSTOMERS_STEP,
  ACTIVE_CUSTOMERS_DEFAULT,
  REMINDER_REPEAT_RATE,
  LEAK_CAP_FRACTION_OF_REVENUE,
  PLANS,
} from "./calculate.js";

/** Prevents the embedded JSON from breaking out of its <script> tag. */
function safeJsonForScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * These source names come from a plan document handed over for this rebuild - real
 * organisations, but nobody here has independently verified the exact study or that a
 * dereferenceable URL exists for each one. Shown as plain text, not links, until real URLs
 * are supplied - inventing a clickable citation would be worse than not having one.
 */
const SOURCES = [
  "Xtime service reminder retention study",
  "Australian Automotive Aftermarket Association workshop benchmarks",
  "Automotive customer communication retention research",
  "Follow-up sales benchmark research",
];

export function renderAuditPage(): string {
  const config = {
    workingWeeks: WORKING_WEEKS,
    hourlyRate: { min: HOURLY_RATE_MIN, max: HOURLY_RATE_MAX, step: HOURLY_RATE_STEP, default: HOURLY_RATE_DEFAULT },
    adminCostRate: { min: ADMIN_COST_RATE_MIN, max: ADMIN_COST_RATE_MAX, step: ADMIN_COST_RATE_STEP, default: ADMIN_COST_RATE_DEFAULT },
    workers: { min: WORKERS_MIN, max: WORKERS_MAX, default: WORKERS_DEFAULT },
    jobsPerWeek: { min: JOBS_PER_WEEK_MIN, max: JOBS_PER_WEEK_MAX, default: JOBS_PER_WEEK_DEFAULT },
    averageInvoice: { min: AVERAGE_INVOICE_MIN, max: AVERAGE_INVOICE_MAX, step: AVERAGE_INVOICE_STEP, default: AVERAGE_INVOICE_DEFAULT },
    hours: { min: HOURS_MIN, max: HOURS_MAX, step: HOURS_STEP, default: HOURS_DEFAULT },
    missedCalls: { min: MISSED_CALLS_MIN, max: MISSED_CALLS_MAX, step: MISSED_CALLS_STEP, default: MISSED_CALLS_DEFAULT },
    newCallerPct: { min: NEW_CALLER_PCT_MIN, max: NEW_CALLER_PCT_MAX, step: NEW_CALLER_PCT_STEP, default: NEW_CALLER_PCT_DEFAULT },
    missedCallNewCallerLossRate: MISSED_CALL_NEW_CALLER_LOSS_RATE,
    quotesPerWeek: { min: QUOTES_PER_WEEK_MIN, max: QUOTES_PER_WEEK_MAX, step: QUOTES_PER_WEEK_STEP, default: QUOTES_PER_WEEK_DEFAULT },
    quietPct: { min: QUOTE_QUIET_PCT_MIN, max: QUOTE_QUIET_PCT_MAX, step: QUOTE_QUIET_PCT_STEP, default: QUOTE_QUIET_PCT_DEFAULT },
    quoteRecoveryRate: QUOTE_RECOVERY_RATE,
    activeCustomers: { min: ACTIVE_CUSTOMERS_MIN, max: ACTIVE_CUSTOMERS_MAX, step: ACTIVE_CUSTOMERS_STEP, default: ACTIVE_CUSTOMERS_DEFAULT },
    reminderRepeatRate: REMINDER_REPEAT_RATE,
    leakCapFractionOfRevenue: LEAK_CAP_FRACTION_OF_REVENUE,
    plans: PLANS,
    buckets: ADMIN_TIME_BUCKETS,
    sources: SOURCES,
  };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Mechanic AI Savings Calculator | Insanely Smart</title>
<style>${STYLES}</style>
</head>
<body>
<div class="progress-track"><div class="progress-fill" id="progress-fill" style="width:0%"></div></div>
<div class="band top"><img src="/logo-transparent.webp" alt="Insanely Smart" class="logo" /></div>
<div class="hero-dark">
  <h1>Put a number on the boring work.</h1>
  <p class="sub">A few practical questions, about two minutes, a real number at the end.</p>
</div>

<main class="container">

  <section class="step-card wizard-screen" id="screen-lead">
    <p class="step-eyebrow">Your details</p>
    <p class="sub">I save and text your figures so you can return to them later. Your details also let Charlie use your real workshop numbers if you choose to talk it through.</p>
    <label for="input-fullname">Full name</label>
    <input type="text" id="input-fullname" autocomplete="name" required />
    <label for="input-mobile">Mobile number</label>
    <input type="tel" id="input-mobile" autocomplete="tel" inputmode="tel" required />
    <label for="input-company">Workshop/company name</label>
    <input type="text" id="input-company" autocomplete="organization" required />
    <button type="button" class="btn-primary" id="btn-lead-continue" disabled>Continue</button>
    <p class="form-error hidden" id="lead-error"></p>
  </section>

  <section class="step-card wizard-screen hidden" id="screen-snapshot">
    <button type="button" class="back-link" data-back>&lt; Back</button>
    <p class="step-eyebrow">Your business</p>

    <label for="input-hourly-rate">What do you charge per hour?</label>
    <input type="number" id="input-hourly-rate" inputmode="decimal" min="0" />

    <label for="input-admin-cost-rate">Roughly what do you pay the person doing this admin, per hour?</label>
    <div class="prefix-input"><span>$</span><input type="number" id="input-admin-cost-rate" inputmode="decimal" min="0" /></div>

    <label for="input-workers">How many workers/mechanics do you have?</label>
    <input type="number" id="input-workers" inputmode="numeric" min="1" />

    <label for="input-jobs-week">How many jobs do you complete per week?</label>
    <input type="number" id="input-jobs-week" inputmode="numeric" min="0" />

    <label for="input-avg-invoice">What is the average invoice value per job?</label>
    <input type="number" id="input-avg-invoice" inputmode="decimal" min="0" />

    <button type="button" class="btn-primary" id="btn-snapshot-continue">Continue</button>
    <p class="form-error hidden" id="snapshot-error"></p>
  </section>

  <section class="step-card wizard-screen hidden" id="screen-anchor">
    <button type="button" class="back-link" data-back>&lt; Back</button>
    <p class="step-eyebrow">Admin time</p>
    <h2>Across everyone in the business, roughly how many hours a week go on office and admin work?</h2>
    <div class="slider-row">
      <input type="range" id="input-anchor-hours" min="0" max="40" step="0.5" value="0" />
      <output id="output-anchor-hours">0 hrs</output>
    </div>
    <button type="button" class="btn-primary" id="btn-anchor-continue">Next</button>
  </section>

  <div class="live-bleed hidden" id="live-bleed">
    <p class="live-bleed-label">Estimated yearly cost so far</p>
    <p class="live-bleed-value" id="live-bleed-value">$0</p>
  </div>

  <div id="bucket-screens"></div>

  <section class="step-card wizard-screen hidden" id="screen-leaks">
    <button type="button" class="back-link" data-back>&lt; Back</button>
    <p class="step-eyebrow">Where work slips through</p>
    <h2>A few quick questions about follow-up</h2>

    <label for="input-missed-calls">Missed calls in a typical week</label>
    <div class="slider-row">
      <input type="range" id="input-missed-calls" min="0" max="30" step="1" value="0" />
      <output id="output-missed-calls">0 calls</output>
    </div>

    <label for="input-new-caller-pct">Of the calls you miss, roughly how many are new customers rather than existing ones?</label>
    <div class="slider-row">
      <input type="range" id="input-new-caller-pct" min="0" max="100" step="5" value="30" />
      <output id="output-new-caller-pct">30%</output>
    </div>

    <label>Do customers get a service or rego reminder?</label>
    <div class="pill-group" id="reminder-consistency-pills"></div>

    <label for="input-active-customers">Roughly how many active customers are on your books?</label>
    <div class="slider-row">
      <input type="range" id="input-active-customers" min="0" max="2000" step="10" value="0" />
      <output id="output-active-customers">0</output>
    </div>

    <label for="input-quotes-per-week">Quotes sent per week</label>
    <div class="slider-row">
      <input type="range" id="input-quotes-per-week" min="0" max="100" step="1" value="0" />
      <output id="output-quotes-per-week">0</output>
    </div>

    <label for="input-quiet-pct">Roughly what portion go quiet without an answer?</label>
    <div class="slider-row">
      <input type="range" id="input-quiet-pct" min="0" max="100" step="5" value="0" />
      <output id="output-quiet-pct">0%</output>
    </div>

    <button type="button" class="btn-primary" id="btn-leaks-continue" disabled>Next</button>
  </section>

  <section class="step-card wizard-screen hidden" id="screen-other">
    <button type="button" class="back-link" data-back>&lt; Back</button>
    <p class="step-eyebrow">Almost done</p>
    <h2>Anything else eating your week?</h2>
    <label for="input-other-note">Optional</label>
    <input type="text" id="input-other-note" />
    <button type="button" class="btn-primary" id="btn-other-continue">Next</button>
  </section>

  <section class="wizard-screen hidden" id="screen-results">
    <div id="results-loading">
      <p class="sub" style="text-align:center;">Working out your numbers...</p>
    </div>
    <div class="hidden" id="results-content">
      <p class="sub" id="results-intro">In about two minutes I have estimated how much time and money is being absorbed by admin work in your business.</p>

      <!-- B1: the certainty. One black band, two figures, nothing on the page larger than this. -->
      <section class="certainty-band">
        <h1>Right now, admin is costing you.</h1>
        <div class="certainty-figures">
          <div class="certainty-figure">
            <p class="certainty-value" id="certainty-hours">0 hours</p>
            <p class="certainty-label">a year</p>
          </div>
          <div class="certainty-figure">
            <p class="certainty-value" id="certainty-cost">$0</p>
            <p class="certainty-label">a year, hard cost</p>
          </div>
        </div>
        <div class="certainty-rule"></div>
      </section>

      <!-- B2: the upside. Small, clearly secondary, never added to the certainty figures. -->
      <div class="upside-card">
        <p class="upside-line">If that time went to billable work, up to <strong id="upside-value">$0</strong> a year.</p>
        <p class="upside-caption">That only lands if you have the work to fill it.</p>
      </div>

      <!-- B3: the looser money. Quieter than B1, one card, one small table, one caveat line. -->
      <section class="looser-money-band">
        <p class="looser-money-intro">This next part is less certain. It is what is likely slipping past you, based on typical patterns. I do not add it to the number above.</p>
        <div class="leak-table-card">
          <table class="leak-table" id="leak-table">
            <tbody id="leak-table-body"></tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td id="leak-table-total">$0</td>
              </tr>
            </tfoot>
          </table>
          <p class="cap-note hidden" id="leak-cap-note">Capped at a conservative ceiling based on your turnover.</p>
          <p class="help" style="margin:var(--space-3) 0 0;">Conservative estimate based on typical workshop patterns.</p>
        </div>
      </section>

      <button type="button" class="btn-primary" id="btn-charlie-summary">See Charlie's Summary</button>
      <p class="help">Charlie will explain the time that can be freed up, describe payback, and recommend one process change at a time.</p>
      <p class="form-error hidden" id="save-error"></p>

      <!-- B7: every assumption, with its value. -->
      <div class="info-box">
        <details>
          <summary><strong>How these numbers are worked out</strong></summary>
          <p class="help" id="methodology-summary"></p>
          <ul class="source-list" id="assumptions-list"></ul>
        </details>
      </div>
      <p class="disclaimer">This is an indicative estimate based on the figures you entered and conservative industry assumptions, not a guarantee. Actual results depend on your offer, capacity, and follow-up process.</p>
    </div>
  </section>

  <section class="wizard-screen hidden" id="screen-charlie">
    <div class="cta-card">
      <h2>Charlie's Summary</h2>
      <p class="charlie-intro">Charlie is the assistant I built to do this job. He runs on the same system I would build for you.</p>
      <p id="charlie-summary"></p>
      <div class="door-row">
        <button type="button" class="door-card" id="btn-door-book">
          <h3>Book a 15 minute chat with Mick</h3>
          <p>Free, no obligation. I talk you through what to fix first.</p>
        </button>
        <button type="button" class="door-card" id="btn-door-text">
          <h3>Text me my figures</h3>
          <p>I will text a link to your written summary.</p>
        </button>
      </div>
      <p class="status" id="door-text-status"></p>
    </div>
  </section>

  <section class="wizard-screen hidden" id="screen-book">
    <div id="book-form">
      <h2>Book a 15 minute chat with Mick</h2>
      <p class="sub">A short, practical conversation about reducing admin hours and keeping more customers.</p>
      <div class="pov-block">
        <p>In this chat, I'll:</p>
        <p>Show you where your admin hours can be cut back safely. Walk through the risks of missed follow-ups and repeat work. Explain how much time and revenue can realistically be recovered. Recommend one simple process change to start with, no overwhelm.</p>
      </div>
      <p class="help">No pressure, no obligation. Just a clear look at how to reduce admin and protect customer flow.</p>

      <label>Pick a time for your free chat</label>
      <div class="slot-list" id="slot-list"></div>
      <p class="form-error hidden" id="slot-error"></p>

      <button type="button" class="btn-primary" id="btn-book-slot" disabled>Book my free chat</button>
      <p class="form-error hidden" id="book-error"></p>
      <p class="fine-print">A small change can save hours every week. Let's talk through the quickest win for your workshop.</p>
    </div>

    <div class="hidden" id="screen-booked">
      <h2>Booked.</h2>
      <p class="sub">You will get a confirmation text within a few minutes. Reply YES to lock it in.</p>
    </div>
  </section>

</main>

<div class="band bottom">Insanely Smart. Adelaide, South Australia.</div>

<script>window.__AUDIT_CONFIG__ = ${safeJsonForScript(config)};</script>
<script>${CLIENT_SCRIPT}</script>
</body>
</html>`;
}

const CLIENT_SCRIPT = `
(function () {
  "use strict";
  var config = window.__AUDIT_CONFIG__;
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var state = {
    lead: { fullName: "", mobile: "", companyName: "" },
    hourlyRate: config.hourlyRate.default,
    adminCostRate: config.adminCostRate.default,
    workers: config.workers.default,
    jobsPerWeek: config.jobsPerWeek.default,
    averageInvoice: config.averageInvoice.default,
    anchorHours: 0,
    buckets: {}, // key -> hours, one entry per config.buckets, all start at 0
    otherAdminNote: "",
    missedCallsPerWeek: config.missedCalls.default,
    newCallerPct: config.newCallerPct.default,
    reminderConsistency: null,
    activeCustomers: config.activeCustomers.default,
    quotesPerWeek: config.quotesPerWeek.default,
    quietPct: config.quietPct.default,
    publicToken: null,
    savePromise: null,
    figures: null
  };
  config.buckets.forEach(function (b) { state.buckets[b.key] = 0; });

  function sumBuckets() {
    var total = 0;
    config.buckets.forEach(function (b) { total += (state.buckets[b.key] || 0); });
    return total;
  }

  function money(n) { return "$" + Math.round(n).toLocaleString("en-AU"); }

  // ---- Strips em dashes, en dashes and arrows from any generated text, matching textClean.ts
  // server-side. Dashes read as commas, arrows read as full stops. Bracket character classes
  // are used instead of \s / \. escapes - this function's source lives inside render.ts's own
  // template literal, where a backslash escape not recognised by the outer TS parser is
  // silently dropped before it ever reaches the browser. ----
  function cleanText(input) {
    return String(input)
      .replace(/[–—]/g, ",")
      .replace(/-{1,2}>|<-{1,2}|[←-⇿➔➡⟵⟶]/g, ".")
      .replace(/ *, *,+/g, ",")
      .replace(/, *[.]/g, ".")
      .replace(/[.] *[.]/g, ".")
      .replace(/ {2,}/g, " ")
      .replace(/^ +| +$/g, "");
  }

  // ---- Wizard navigation: one screen visible at a time, progress bar reflects position ----
  var progressFillEl = document.getElementById("progress-fill");
  var screenIds = ["screen-lead", "screen-snapshot", "screen-anchor"]
    .concat(config.buckets.map(function (b) { return "screen-bucket-" + b.key; }))
    .concat(["screen-leaks", "screen-other", "screen-results", "screen-charlie", "screen-book"]);
  var screenIndex = 0;
  // Live bleed runs from the first bucket question (Screen B) through the last bucket
  // question (Screen E) - it only ever tracks the hard admin cost (Part A5), which is built
  // from the buckets alone, so it has nothing left to react to once Screen F (leaks) starts.
  var firstBleedScreenIndex = screenIds.indexOf("screen-bucket-" + config.buckets[0].key);
  var lastBleedScreenIndex = screenIds.indexOf("screen-bucket-" + config.buckets[config.buckets.length - 1].key);
  var liveBleedEl = document.getElementById("live-bleed");

  function showScreen(index) {
    screenIds.forEach(function (id, i) {
      document.getElementById(id).classList.toggle("hidden", i !== index);
    });
    screenIndex = index;
    liveBleedEl.classList.toggle("hidden", index < firstBleedScreenIndex || index > lastBleedScreenIndex);
    var pct = (index / (screenIds.length - 1)) * 100;
    progressFillEl.style.width = pct + "%";
    if (!reducedMotion) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo(0, 0);
    }
  }

  function goNext() { showScreen(Math.min(screenIndex + 1, screenIds.length - 1)); }
  function goBack() { showScreen(Math.max(screenIndex - 1, 0)); }

  Array.prototype.forEach.call(document.querySelectorAll("[data-back]"), function (btn) {
    btn.addEventListener("click", goBack);
  });

  // ---- Screen: lead capture ----
  var fullNameInput = document.getElementById("input-fullname");
  var mobileInput = document.getElementById("input-mobile");
  var companyInput = document.getElementById("input-company");
  var btnLeadContinue = document.getElementById("btn-lead-continue");
  var leadErrorEl = document.getElementById("lead-error");

  function updateLeadContinueEnabled() {
    btnLeadContinue.disabled = !(fullNameInput.value.trim() && mobileInput.value.trim() && companyInput.value.trim());
  }
  [fullNameInput, mobileInput, companyInput].forEach(function (el) {
    el.addEventListener("input", updateLeadContinueEnabled);
  });

  btnLeadContinue.addEventListener("click", function () {
    state.lead.fullName = fullNameInput.value.trim();
    state.lead.mobile = mobileInput.value.trim();
    state.lead.companyName = companyInput.value.trim();
    leadErrorEl.classList.add("hidden");

    // Submitted immediately, but not blocking - a slow network shouldn't stall the calculator
    // over a background save. The final POST /audit at the results screen is the one that
    // must succeed for a complete record; this is just an early, best-effort capture.
    fetch("/audit/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead: state.lead })
    })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) { if (data && data.publicToken) state.publicToken = data.publicToken; })
      .catch(function (err) { console.error("Lead capture save failed:", err); });

    goNext();
  });

  // ---- Screen: business snapshot ----
  var hourlyRateInput = document.getElementById("input-hourly-rate");
  var adminCostRateInput = document.getElementById("input-admin-cost-rate");
  var workersInput = document.getElementById("input-workers");
  var jobsWeekInput = document.getElementById("input-jobs-week");
  var avgInvoiceInput = document.getElementById("input-avg-invoice");
  var snapshotErrorEl = document.getElementById("snapshot-error");

  hourlyRateInput.value = config.hourlyRate.default;
  adminCostRateInput.value = config.adminCostRate.default;
  workersInput.value = config.workers.default;
  jobsWeekInput.value = config.jobsPerWeek.default;
  avgInvoiceInput.value = config.averageInvoice.default;

  document.getElementById("btn-snapshot-continue").addEventListener("click", function () {
    var hourlyRate = Number(hourlyRateInput.value);
    var adminCostRate = Number(adminCostRateInput.value);
    var workers = Number(workersInput.value);
    var jobsPerWeek = Number(jobsWeekInput.value);
    var averageInvoice = Number(avgInvoiceInput.value);

    if (!isFinite(hourlyRate) || !isFinite(adminCostRate) || !isFinite(workers) || !isFinite(jobsPerWeek) || !isFinite(averageInvoice) ||
        hourlyRate < 0 || adminCostRate < 0 || workers < 1 || jobsPerWeek < 0 || averageInvoice < 0) {
      snapshotErrorEl.textContent = "Please fill in every field with a valid number.";
      snapshotErrorEl.classList.remove("hidden");
      return;
    }
    snapshotErrorEl.classList.add("hidden");
    state.hourlyRate = hourlyRate;
    state.adminCostRate = adminCostRate;
    state.workers = workers;
    state.jobsPerWeek = jobsPerWeek;
    state.averageInvoice = averageInvoice;
    goNext();
  });

  var liveBleedValueEl = document.getElementById("live-bleed-value");

  // Part A5: the hard admin cost and the revenue at risk are never summed, so the live
  // ticker only ever tracks the hard cost - it never blends the two kinds of money.
  function updateLiveBleed() {
    var f = computeFigures();
    liveBleedValueEl.textContent = money(f.annualAdminCostHard);
  }

  function roundHrs(n) { return Math.round(n * 10) / 10; }

  // ---- Screen A: anchor hours - a single, whole-business estimate. Never used in any
  // calculation itself; it's the sanity ceiling the four buckets below are checked against. ----
  var anchorSlider = document.getElementById("input-anchor-hours");
  var anchorOutput = document.getElementById("output-anchor-hours");
  anchorSlider.addEventListener("input", function () {
    anchorOutput.textContent = anchorSlider.value + " hrs";
  });
  document.getElementById("btn-anchor-continue").addEventListener("click", function () {
    state.anchorHours = Number(anchorSlider.value);
    refreshBucketScreens();
    goNext();
  });

  // ---- Screens B-E: the four fixed admin-time buckets, the sole source of labour hours. ----
  var bucketScreensEl = document.getElementById("bucket-screens");
  var bucketScreenRefs = [];

  function refreshBucketScreens() {
    var sum = sumBuckets();
    var overLimit = sum > state.anchorHours;
    bucketScreenRefs.forEach(function (ref) {
      ref.anchorEl.textContent = roundHrs(state.anchorHours) + " hrs";
      ref.sumEl.textContent = roundHrs(sum) + " hrs";
      ref.warningEl.classList.toggle("hidden", !overLimit);
      ref.nextBtn.disabled = overLimit;
    });
  }

  config.buckets.forEach(function (bucket) {
    var section = document.createElement("section");
    section.className = "step-card wizard-screen hidden";
    section.id = "screen-bucket-" + bucket.key;

    var back = document.createElement("button");
    back.type = "button";
    back.className = "back-link";
    back.textContent = "< Back";
    back.addEventListener("click", goBack);
    section.appendChild(back);

    var eyebrow = document.createElement("p");
    eyebrow.className = "step-eyebrow";
    eyebrow.textContent = "Admin time";
    section.appendChild(eyebrow);

    var question = document.createElement("h2");
    question.textContent = bucket.label;
    section.appendChild(question);

    var desc = document.createElement("p");
    desc.className = "sub";
    desc.textContent = bucket.description;
    section.appendChild(desc);

    var hoursLabel = document.createElement("label");
    hoursLabel.textContent = "Hours per week";
    section.appendChild(hoursLabel);
    var sliderRow = document.createElement("div");
    sliderRow.className = "slider-row";
    var hoursSlider = document.createElement("input");
    hoursSlider.type = "range";
    hoursSlider.min = config.hours.min;
    hoursSlider.max = config.hours.max;
    hoursSlider.step = config.hours.step;
    hoursSlider.value = 0;
    var hoursOutput = document.createElement("output");
    hoursOutput.textContent = "0 hrs";
    sliderRow.appendChild(hoursSlider);
    sliderRow.appendChild(hoursOutput);
    section.appendChild(sliderRow);

    var compare = document.createElement("div");
    compare.className = "anchor-compare";
    compare.innerHTML =
      "<p>Your total estimate: <strong class='anchor-value'>0 hrs</strong></p>" +
      "<p>Buckets so far: <strong class='sum-value'>0 hrs</strong></p>";
    section.appendChild(compare);
    var anchorEl = compare.querySelector(".anchor-value");
    var sumEl = compare.querySelector(".sum-value");

    var warningEl = document.createElement("p");
    warningEl.className = "form-error hidden";
    warningEl.textContent = "That is more than the total you gave me. Tighten it up or raise the total.";
    section.appendChild(warningEl);

    var nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "btn-primary";
    nextBtn.textContent = "Next";
    section.appendChild(nextBtn);

    bucketScreenRefs.push({ key: bucket.key, anchorEl: anchorEl, sumEl: sumEl, warningEl: warningEl, nextBtn: nextBtn });

    hoursSlider.addEventListener("input", function () {
      hoursOutput.textContent = hoursSlider.value + " hrs";
      state.buckets[bucket.key] = Number(hoursSlider.value);
      refreshBucketScreens();
      updateLiveBleed();
    });

    nextBtn.addEventListener("click", goNext);

    bucketScreensEl.appendChild(section);
  });
  refreshBucketScreens();

  // ---- Screen F: leaks, all on one page, no hours sliders. Labour cost above never shares
  // an input with what's answered here (Part A5). ----
  var missedCallsSlider = document.getElementById("input-missed-calls");
  var missedCallsOutput = document.getElementById("output-missed-calls");
  var newCallerPctSlider = document.getElementById("input-new-caller-pct");
  var newCallerPctOutput = document.getElementById("output-new-caller-pct");
  var activeCustomersSlider = document.getElementById("input-active-customers");
  var activeCustomersOutput = document.getElementById("output-active-customers");
  var quotesPerWeekSlider = document.getElementById("input-quotes-per-week");
  var quotesPerWeekOutput = document.getElementById("output-quotes-per-week");
  var quietPctSlider = document.getElementById("input-quiet-pct");
  var quietPctOutput = document.getElementById("output-quiet-pct");
  var btnLeaksContinue = document.getElementById("btn-leaks-continue");

  missedCallsSlider.addEventListener("input", function () {
    missedCallsOutput.textContent = missedCallsSlider.value + " calls";
    state.missedCallsPerWeek = Number(missedCallsSlider.value);
  });
  newCallerPctSlider.addEventListener("input", function () {
    newCallerPctOutput.textContent = newCallerPctSlider.value + "%";
    state.newCallerPct = Number(newCallerPctSlider.value);
  });
  activeCustomersSlider.addEventListener("input", function () {
    activeCustomersOutput.textContent = activeCustomersSlider.value;
    state.activeCustomers = Number(activeCustomersSlider.value);
  });
  quotesPerWeekSlider.addEventListener("input", function () {
    quotesPerWeekOutput.textContent = quotesPerWeekSlider.value;
    state.quotesPerWeek = Number(quotesPerWeekSlider.value);
  });
  quietPctSlider.addEventListener("input", function () {
    quietPctOutput.textContent = quietPctSlider.value + "%";
    state.quietPct = Number(quietPctSlider.value);
  });

  function updateLeaksContinueEnabled() {
    btnLeaksContinue.disabled = !state.reminderConsistency;
  }

  var reminderPillsContainer = document.getElementById("reminder-consistency-pills");
  var reminderPillButtons = [];
  [
    { value: "yes", label: "Yes" },
    { value: "not_consistently", label: "Not consistently" },
    { value: "no", label: "No" }
  ].forEach(function (opt) {
    var pillBtn = document.createElement("button");
    pillBtn.type = "button";
    pillBtn.className = "pill";
    pillBtn.textContent = opt.label;
    pillBtn.addEventListener("click", function () {
      reminderPillButtons.forEach(function (b) { b.classList.toggle("selected", b === pillBtn); });
      state.reminderConsistency = opt.value;
      updateLeaksContinueEnabled();
    });
    reminderPillButtons.push(pillBtn);
    reminderPillsContainer.appendChild(pillBtn);
  });

  btnLeaksContinue.addEventListener("click", goNext);

  // ---- Screen G: free text, optional, never contributes hours. ----
  var otherNoteInput = document.getElementById("input-other-note");
  document.getElementById("btn-other-continue").addEventListener("click", function () {
    state.otherAdminNote = otherNoteInput.value.trim();
    goNext();
    runCalculation();
  });

  // ---- Client-side mirror of calculate.ts, for the instant results reveal and the live bleed
  // counter only. POST /audit always recomputes the authoritative figures server-side from the
  // raw inputs. ----
  function computeFigures() {
    var buckets = config.buckets.map(function (b) {
      var hours = state.buckets[b.key] || 0;
      return { key: b.key, label: b.label, hours: hours, weeklyCost: hours * state.adminCostRate };
    });

    var totalAdminHoursPerWeek = sumBuckets();
    var adminHoursPerYear = totalAdminHoursPerWeek * config.workingWeeks;
    var annualAdminCostHard = totalAdminHoursPerWeek * state.adminCostRate * config.workingWeeks;
    var annualBillableValue = totalAdminHoursPerWeek * state.hourlyRate * config.workingWeeks;

    // Leak revenue is built from Screen F's answers only - never a bucket, never anchorHours,
    // and (Part A5) never summed with the hard admin cost above.

    // A4: reminders, grounded in the actual size of the customer book. Nothing shown if the
    // book is empty or reminders already reach the customer.
    var reminders = null;
    if (state.reminderConsistency === "no" || state.reminderConsistency === "not_consistently") {
      if (state.activeCustomers > 0) {
        var missedRepeatJobsPerYear = state.activeCustomers * config.reminderRepeatRate;
        reminders = {
          activeCustomers: state.activeCustomers,
          missedRepeatJobsPerYear: missedRepeatJobsPerYear,
          annualOpportunity: missedRepeatJobsPerYear * state.averageInvoice
        };
      }
    }

    // A3: quotes, grounded in what's actually entered. Nothing shown if no quotes are sent.
    var quoteFollowUp = null;
    if (state.quotesPerWeek > 0) {
      var quiet = state.quietPct / 100;
      var recoveredJobsPerYear = state.quotesPerWeek * quiet * config.workingWeeks * config.quoteRecoveryRate;
      quoteFollowUp = {
        quotesPerWeek: state.quotesPerWeek,
        quietPct: state.quietPct,
        recoveredJobsPerYear: recoveredJobsPerYear,
        annualOpportunity: recoveredJobsPerYear * state.averageInvoice
      };
    }

    // A2: missed calls, split into new-caller share (entered) x a fixed loss rate.
    var newCallerFraction = state.newCallerPct / 100;
    var lostJobsPerYear = state.missedCallsPerWeek * config.workingWeeks * newCallerFraction * config.missedCallNewCallerLossRate;
    var missedCalls = {
      missedCallsPerWeek: state.missedCallsPerWeek,
      newCallerPct: state.newCallerPct,
      lossRate: config.missedCallNewCallerLossRate,
      lostJobsPerYear: lostJobsPerYear,
      annualOpportunity: lostJobsPerYear * state.averageInvoice
    };

    // One leak headline, built from named, non-duplicated components.
    var rawLeak = (reminders ? reminders.annualOpportunity : 0) +
      (quoteFollowUp ? quoteFollowUp.annualOpportunity : 0) +
      missedCalls.annualOpportunity;
    var annualRevenueEstimate = state.jobsPerWeek * state.averageInvoice * config.workingWeeks;
    var leakCap = annualRevenueEstimate * config.leakCapFractionOfRevenue;
    // A1: epsilon guards against floating-point summation noise reporting a cap that didn't
    // really bind - the caption must never say "capped" when the total is just the raw sum.
    var leakCapApplied = leakCap > 0 && (rawLeak - leakCap) > 0.5;
    var leakScale = (leakCapApplied && rawLeak > 0) ? (leakCap / rawLeak) : 1;
    var totalLeak = leakCapApplied ? leakCap : rawLeak;

    if (reminders) reminders.annualOpportunity = reminders.annualOpportunity * leakScale;
    if (quoteFollowUp) quoteFollowUp.annualOpportunity = quoteFollowUp.annualOpportunity * leakScale;
    missedCalls.annualOpportunity = missedCalls.annualOpportunity * leakScale;

    var plan = config.plans[0];
    for (var i = config.plans.length - 1; i >= 0; i--) {
      var thresholds = { starter: 1, growth: 2, pro: 5, enterprise: 10 };
      if (state.workers >= thresholds[config.plans[i].key]) { plan = config.plans[i]; break; }
    }
    var monthlyBenefit = annualAdminCostHard / 12;
    var weeklyBenefit = monthlyBenefit / 4;
    var paybackWeeks = (plan.monthlyPrice !== null && weeklyBenefit > 0)
      ? Math.max(1, Math.ceil(plan.monthlyPrice / weeklyBenefit))
      : null;

    return {
      buckets: buckets,
      totalAdminHoursPerWeek: totalAdminHoursPerWeek,
      adminHoursPerYear: adminHoursPerYear,
      annualAdminCostHard: annualAdminCostHard,
      annualBillableValue: annualBillableValue,
      reminders: reminders,
      quoteFollowUp: quoteFollowUp,
      missedCalls: missedCalls,
      annualRevenueEstimate: annualRevenueEstimate,
      totalLeak: totalLeak,
      leakCapApplied: leakCapApplied,
      recommendedPlan: { plan: plan, monthlyBenefit: monthlyBenefit, weeklyBenefit: weeklyBenefit, paybackWeeks: paybackWeeks }
    };
  }

  function renderResults() {
    var f = state.figures;
    var annualHours = Math.round(f.adminHoursPerYear);
    var weeklyHoursRounded = Math.round(f.totalAdminHoursPerWeek);

    // B1: the certainty. Two figures only, nothing else on the page larger than these.
    document.getElementById("certainty-hours").textContent = annualHours.toLocaleString("en-AU") + " hours";
    document.getElementById("certainty-cost").textContent = money(f.annualAdminCostHard);

    // B2: the upside. Small, secondary, never added to the certainty figures above.
    document.getElementById("upside-value").textContent = money(f.annualBillableValue);

    // B3: the looser money. One card, one small table, one caption for the whole table -
    // Part A5 means this total is never shown next to or combined with the certainty figures.
    var leakRows = "";
    if (f.reminders) {
      leakRows += "<tr><td>Service reminders not sent consistently</td><td>" + money(f.reminders.annualOpportunity) + "</td></tr>";
    }
    if (f.quoteFollowUp) {
      leakRows += "<tr><td>Quotes that go quiet</td><td>" + money(f.quoteFollowUp.annualOpportunity) + "</td></tr>";
    }
    leakRows += "<tr><td>Missed calls not returned</td><td>" + money(f.missedCalls.annualOpportunity) + "</td></tr>";
    leakRows += "<tr class='leak-caption-row'><td colspan='2'>Assumes " + Math.round(f.missedCalls.newCallerPct) +
      "% of missed calls are new customers, and " + Math.round(f.missedCalls.lossRate * 100) + "% of those would have booked.</td></tr>";
    document.getElementById("leak-table-body").innerHTML = leakRows;
    document.getElementById("leak-table-total").textContent = money(f.totalLeak);
    // A1: only render the "capped" caption when the cap actually binds - never on floating-point noise alone.
    document.getElementById("leak-cap-note").classList.toggle("hidden", !f.leakCapApplied);

    var bucketMath = f.buckets.filter(function (b) { return b.hours > 0; }).map(function (bucket) {
      var annualCost = bucket.hours * state.adminCostRate * config.workingWeeks;
      return bucket.label + ": " + Math.round(bucket.hours) + " hrs/week x $" + Math.round(state.adminCostRate) + " x " + config.workingWeeks + " weeks = " + money(annualCost) + " a year.";
    }).join(" ");
    document.getElementById("methodology-summary").textContent = cleanText(
      (bucketMath || "No admin hours were entered.") +
      " The hard-cost figure above and the revenue-at-risk figure below are never added together."
    );

    // B7: every assumption, with its value.
    var assumptions = "";
    assumptions += "<li>" + config.workingWeeks + " working weeks a year allows for annual leave, personal leave, and public holidays under the National Employment Standards. Source: Fair Work Ombudsman.</li>";
    assumptions += "<li>Of the calls you miss, " + Math.round(f.missedCalls.newCallerPct) + "% are assumed to be new customers, based on what you entered.</li>";
    assumptions += "<li>" + Math.round(f.missedCalls.lossRate * 100) + "% of those new-caller missed calls are assumed to become a job. My own conservative estimate, even a new caller often rings back.</li>";
    assumptions += "<li>" + Math.round(config.quoteRecoveryRate * 100) + "% of quotes that go quiet are assumed to be recoverable with follow-up. My own conservative estimate.</li>";
    assumptions += "<li>" + Math.round(config.reminderRepeatRate * 100) + "% of active customers are assumed to be lost repeat business without consistent reminders. My own conservative estimate.</li>";
    assumptions += "<li>Admin hours are valued at $" + Math.round(state.adminCostRate) + " an hour, what you told me you pay for that time.</li>";
    assumptions += "<li>The revenue-at-risk total is capped at " + Math.round(config.leakCapFractionOfRevenue * 100) + "% of your estimated annual turnover (jobs per week times average invoice times " + config.workingWeeks + " weeks), so the figure never exceeds a sensible ceiling.</li>";
    document.getElementById("assumptions-list").innerHTML = assumptions;

    document.getElementById("charlie-summary").textContent = cleanText(
      "Hi " + (state.lead.fullName.split(" ")[0] || state.lead.fullName) + ", thanks for sharing your workshop details. " +
      "Your workshop is spending around " + weeklyHoursRounded + " hours a week on admin. Over a year, that adds up to " +
      annualHours.toLocaleString("en-AU") + " hours, worth around " + money(f.annualAdminCostHard) +
      " a year at what you pay for that time. If that time was filled with billable work instead, it could be worth up to " +
      money(f.annualBillableValue) + " a year. I also estimate up to " + money(f.totalLeak) +
      " a year at risk from missed follow-up, though that part is less certain. These are conservative indicators, not guaranteed losses. " +
      "I will walk you through the highest-priority fix and the quickest payback path, one step at a time."
    );

    document.getElementById("results-loading").classList.add("hidden");
    document.getElementById("results-content").classList.remove("hidden");
  }

  function runCalculation() {
    state.figures = computeFigures();
    renderResults();

    var saveErrorEl = document.getElementById("save-error");
    state.savePromise = fetch("/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead: state.lead,
        hourlyRate: state.hourlyRate,
        adminCostRate: state.adminCostRate,
        workers: state.workers,
        jobsPerWeek: state.jobsPerWeek,
        averageInvoice: state.averageInvoice,
        anchorHours: state.anchorHours,
        buckets: state.buckets,
        otherAdminNote: state.otherAdminNote || undefined,
        missedCallsPerWeek: state.missedCallsPerWeek,
        newCallerPct: state.newCallerPct,
        reminderConsistency: state.reminderConsistency || "yes",
        activeCustomers: state.activeCustomers,
        quotesPerWeek: state.quotesPerWeek,
        quietPct: state.quietPct
      })
    })
      .then(function (res) {
        if (!res.ok) throw new Error("save-failed");
        return res.json();
      })
      .then(function (data) {
        state.publicToken = data.publicToken;
        return data.publicToken;
      })
      .catch(function (err) {
        console.error("Final audit save failed:", err);
        saveErrorEl.textContent = "Your estimate is shown above, but I could not save it just now. Booking below will retry.";
        saveErrorEl.classList.remove("hidden");
        throw err;
      });
  }

  // ---- Booking: "Book a 15-minute AI workshop review" ----
  var slotListEl = document.getElementById("slot-list");
  var slotErrorEl = document.getElementById("slot-error");
  var bookErrorEl = document.getElementById("book-error");
  var btnBookSlot = document.getElementById("btn-book-slot");
  var selectedSlot = null;

  function addSlotOption(slot, label) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slot-option";
    btn.textContent = label;
    btn.addEventListener("click", function () {
      selectedSlot = slot;
      Array.prototype.forEach.call(slotListEl.querySelectorAll(".slot-option"), function (child) {
        child.classList.toggle("selected", child === btn);
      });
      btnBookSlot.disabled = false;
    });
    slotListEl.appendChild(btn);
    return btn;
  }

  function initBookingScreen() {
    selectedSlot = null;
    btnBookSlot.disabled = true;
    bookErrorEl.classList.add("hidden");
    slotErrorEl.classList.add("hidden");
    slotListEl.innerHTML = "Loading times...";

    fetch("/audit/slots")
      .then(function (res) {
        if (!res.ok) throw new Error("slots-failed");
        return res.json();
      })
      .then(function (data) {
        slotListEl.innerHTML = "";
        if (data.asap) addSlotOption(data.asap, "Earliest available: " + data.asap.label);
        if (data.tomorrowMorning) addSlotOption(data.tomorrowMorning, "Tomorrow morning: " + data.tomorrowMorning.label);
        if (data.tomorrowAfternoon) addSlotOption(data.tomorrowAfternoon, "Tomorrow afternoon: " + data.tomorrowAfternoon.label);

        var moreBtn = document.createElement("button");
        moreBtn.type = "button";
        moreBtn.className = "slot-option";
        moreBtn.textContent = "None of these suit, show me later days";
        moreBtn.addEventListener("click", function () {
          moreBtn.disabled = true;
          moreBtn.textContent = "Loading more times...";
          fetch("/audit/slots/more")
            .then(function (res) {
              if (!res.ok) throw new Error("more-slots-failed");
              return res.json();
            })
            .then(function (moreData) {
              moreBtn.remove();
              if (!moreData.slots || moreData.slots.length === 0) {
                slotErrorEl.textContent = "No times are open right now. I will call you to arrange a time.";
                slotErrorEl.classList.remove("hidden");
                return;
              }
              moreData.slots.forEach(function (slot) { addSlotOption(slot, slot.label); });
            })
            .catch(function () {
              moreBtn.disabled = false;
              moreBtn.textContent = "None of these suit, show me later days";
              slotErrorEl.textContent = "Could not load more available times. Check your connection and try again.";
              slotErrorEl.classList.remove("hidden");
            });
        });
        slotListEl.appendChild(moreBtn);
      })
      .catch(function () {
        slotListEl.innerHTML = "";
        slotErrorEl.textContent = "Could not load available times. Check your connection and try again.";
        slotErrorEl.classList.remove("hidden");
      });
  }

  // ---- The close: two equal doors, neither a dead end. Both rely on the person record
  // saved by runCalculation() at the results screen, before either door is shown. ----
  document.getElementById("btn-door-book").addEventListener("click", function () {
    showScreen(screenIds.indexOf("screen-book"));
    (state.savePromise || Promise.resolve()).catch(function () {}).then(initBookingScreen);
  });

  var btnDoorText = document.getElementById("btn-door-text");
  var doorTextStatusEl = document.getElementById("door-text-status");
  btnDoorText.addEventListener("click", function () {
    btnDoorText.disabled = true;
    doorTextStatusEl.textContent = "Sending...";

    (state.savePromise || Promise.resolve())
      .catch(function () {})
      .then(function () {
        if (!state.publicToken) throw new Error("no-public-token");
        return fetch("/audit/text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicToken: state.publicToken })
        });
      })
      .then(function (res) {
        if (!res.ok) throw new Error("text-failed");
        doorTextStatusEl.textContent = "Sent. Check your phone.";
      })
      .catch(function () {
        btnDoorText.disabled = false;
        doorTextStatusEl.textContent = "Could not send that just now. Check your connection and try again.";
      });
  });

  document.getElementById("btn-charlie-summary").addEventListener("click", function () {
    showScreen(screenIds.indexOf("screen-charlie"));
  });

  btnBookSlot.addEventListener("click", function () {
    if (!selectedSlot) return;
    bookErrorEl.classList.add("hidden");
    btnBookSlot.disabled = true;
    btnBookSlot.textContent = "Booking...";

    fetch("/audit/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicToken: state.publicToken,
        businessName: state.lead.companyName,
        slotStart: selectedSlot.start,
        slotEnd: selectedSlot.end
      })
    })
      .then(function (res) {
        if (!res.ok) return res.json().then(function (body) { throw new Error(body.error || "book-failed"); });
        return res.json();
      })
      .then(function () {
        document.getElementById("book-form").classList.add("hidden");
        document.getElementById("screen-booked").classList.remove("hidden");
      })
      .catch(function (err) {
        btnBookSlot.disabled = false;
        btnBookSlot.textContent = "Book my free chat";
        bookErrorEl.textContent = err.message === "That time was just taken. Pick another."
          ? err.message
          : "Could not book that time just now. Check your connection and try again.";
        bookErrorEl.classList.remove("hidden");
        if (err.message === "That time was just taken. Pick another.") initBookingScreen();
      });
  });

  showScreen(0);
})();
`;
