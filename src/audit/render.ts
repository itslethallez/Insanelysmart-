import { STYLES } from "./styles.js";
import { TASK_CARDS } from "./types.js";
import {
  WORKING_WEEKS,
  HOURLY_RATE_MIN,
  HOURLY_RATE_MAX,
  HOURLY_RATE_STEP,
  HOURLY_RATE_DEFAULT,
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
  MISSED_CALL_CONVERSION_RATE,
  ACTIVE_CUSTOMER_MULTIPLIER,
  RETENTION_AT_RISK_FRACTION,
  RETENTION_RECOVERY_PCT,
  QUOTED_JOBS_MULTIPLIER,
  QUOTE_FOLLOWUP_RECOVERY_PCT,
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
    workers: { min: WORKERS_MIN, max: WORKERS_MAX, default: WORKERS_DEFAULT },
    jobsPerWeek: { min: JOBS_PER_WEEK_MIN, max: JOBS_PER_WEEK_MAX, default: JOBS_PER_WEEK_DEFAULT },
    averageInvoice: { min: AVERAGE_INVOICE_MIN, max: AVERAGE_INVOICE_MAX, step: AVERAGE_INVOICE_STEP, default: AVERAGE_INVOICE_DEFAULT },
    hours: { min: HOURS_MIN, max: HOURS_MAX, step: HOURS_STEP, default: HOURS_DEFAULT },
    missedCalls: { min: MISSED_CALLS_MIN, max: MISSED_CALLS_MAX, step: MISSED_CALLS_STEP, default: MISSED_CALLS_DEFAULT },
    missedCallConversionRate: MISSED_CALL_CONVERSION_RATE,
    activeCustomerMultiplier: ACTIVE_CUSTOMER_MULTIPLIER,
    retentionAtRiskFraction: RETENTION_AT_RISK_FRACTION,
    retentionRecoveryPct: RETENTION_RECOVERY_PCT,
    quotedJobsMultiplier: QUOTED_JOBS_MULTIPLIER,
    quoteFollowUpRecoveryPct: QUOTE_FOLLOWUP_RECOVERY_PCT,
    plans: PLANS,
    taskCards: TASK_CARDS,
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
  <h1>See what admin and missed follow-up cost your workshop.</h1>
  <p class="sub">A few practical questions, about two minutes, a real number at the end.</p>
</div>

<main class="container">

  <section class="step-card wizard-screen" id="screen-lead">
    <p class="step-eyebrow">Your details</p>
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

    <label for="input-workers">How many workers/mechanics do you have?</label>
    <input type="number" id="input-workers" inputmode="numeric" min="1" />

    <label for="input-jobs-week">How many jobs do you complete per week?</label>
    <input type="number" id="input-jobs-week" inputmode="numeric" min="0" />

    <label for="input-avg-invoice">What is the average invoice value per job?</label>
    <input type="number" id="input-avg-invoice" inputmode="decimal" min="0" />

    <button type="button" class="btn-primary" id="btn-snapshot-continue">Continue</button>
    <p class="form-error hidden" id="snapshot-error"></p>
  </section>

  <div id="task-screens"></div>

  <section class="wizard-screen hidden" id="screen-results">
    <div id="results-loading">
      <p class="sub" style="text-align:center;">Working out your numbers...</p>
    </div>
    <div class="hidden" id="results-content">
      <div class="bleed-card">
        <p class="bleed-eyebrow">Annual impact</p>
        <div class="bleed-number" id="headline-number">$0</div>
        <p class="bleed-caption" id="headline-caption">a year to admin time and missed follow-up</p>
      </div>

      <div class="tile"><p class="tile-label">Admin cost</p><p class="tile-value" id="tile-admin">$0/yr</p></div>
      <div class="tile"><p class="tile-label">Revenue opportunity</p><p class="tile-value" id="tile-opportunity">$0/yr</p></div>
      <div class="tile total"><p class="tile-label">Total annual benefit</p><p class="tile-value" id="tile-total">$0/yr</p></div>

      <div class="result-card" id="plan-card">
        <p class="step-eyebrow">Recommended plan</p>
        <h2 id="plan-name"></h2>
        <p class="payback" id="plan-payback"></p>
      </div>

      <button type="button" class="btn-primary" id="btn-book-review">Book a 15-minute AI workshop review</button>
      <p class="form-error hidden" id="save-error"></p>

      <div class="info-box">
        <p><strong>Sources</strong></p>
        <ul class="source-list" id="source-list"></ul>
      </div>
      <p class="disclaimer">This is an indicative estimate based on the figures you entered and conservative industry assumptions, not a guarantee. Actual results depend on your offer, capacity, and follow-up process.</p>
    </div>
  </section>

  <section class="wizard-screen hidden" id="screen-book">
    <div id="book-form">
      <h2>Book a 15-minute AI workshop review</h2>
      <p class="sub">Pick a time - free, no obligation.</p>

      <label>Pick a time</label>
      <div class="slot-list" id="slot-list"></div>
      <p class="form-error hidden" id="slot-error"></p>

      <button type="button" class="btn-primary" id="btn-book-slot" disabled>Book my review</button>
      <p class="form-error hidden" id="book-error"></p>
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
    workers: config.workers.default,
    jobsPerWeek: config.jobsPerWeek.default,
    averageInvoice: config.averageInvoice.default,
    taskAnswers: {}, // key -> { yes: bool, hours: number }
    otherAdminNote: "",
    missedCallsPerWeek: config.missedCalls.default,
    publicToken: null,
    savePromise: null,
    figures: null
  };

  function money(n) { return "$" + Math.round(n).toLocaleString("en-AU"); }

  // ---- Wizard navigation: one screen visible at a time, progress bar reflects position ----
  var progressFillEl = document.getElementById("progress-fill");
  var screenIds = ["screen-lead", "screen-snapshot"]
    .concat(config.taskCards.map(function (c) { return "screen-task-" + c.key; }))
    .concat(["screen-results"]);
  var screenIndex = 0;

  function showScreen(index) {
    screenIds.forEach(function (id, i) {
      document.getElementById(id).classList.toggle("hidden", i !== index);
    });
    screenIndex = index;
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
  var workersInput = document.getElementById("input-workers");
  var jobsWeekInput = document.getElementById("input-jobs-week");
  var avgInvoiceInput = document.getElementById("input-avg-invoice");
  var snapshotErrorEl = document.getElementById("snapshot-error");

  hourlyRateInput.value = config.hourlyRate.default;
  workersInput.value = config.workers.default;
  jobsWeekInput.value = config.jobsPerWeek.default;
  avgInvoiceInput.value = config.averageInvoice.default;

  document.getElementById("btn-snapshot-continue").addEventListener("click", function () {
    var hourlyRate = Number(hourlyRateInput.value);
    var workers = Number(workersInput.value);
    var jobsPerWeek = Number(jobsWeekInput.value);
    var averageInvoice = Number(avgInvoiceInput.value);

    if (!isFinite(hourlyRate) || !isFinite(workers) || !isFinite(jobsPerWeek) || !isFinite(averageInvoice) ||
        hourlyRate < 0 || workers < 1 || jobsPerWeek < 0 || averageInvoice < 0) {
      snapshotErrorEl.textContent = "Please fill in every field with a valid number.";
      snapshotErrorEl.classList.remove("hidden");
      return;
    }
    snapshotErrorEl.classList.add("hidden");
    state.hourlyRate = hourlyRate;
    state.workers = workers;
    state.jobsPerWeek = jobsPerWeek;
    state.averageInvoice = averageInvoice;
    goNext();
  });

  // ---- Task card screens, built from config.taskCards ----
  var taskScreensEl = document.getElementById("task-screens");

  config.taskCards.forEach(function (card) {
    var section = document.createElement("section");
    section.className = "step-card wizard-screen hidden";
    section.id = "screen-task-" + card.key;

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
    question.textContent = card.question;
    section.appendChild(question);

    var yesBtn, noBtn, hoursWrap, hoursSlider, hoursOutput, textInput;

    if (card.freeText) {
      var textLabel = document.createElement("label");
      textLabel.textContent = "What else eats into your week? (optional)";
      section.appendChild(textLabel);
      textInput = document.createElement("input");
      textInput.type = "text";
      section.appendChild(textInput);
    } else {
      var yesnoRow = document.createElement("div");
      yesnoRow.className = "yesno-row";
      yesBtn = document.createElement("button");
      yesBtn.type = "button";
      yesBtn.className = "yesno-btn";
      yesBtn.textContent = "Yes";
      noBtn = document.createElement("button");
      noBtn.type = "button";
      noBtn.className = "yesno-btn";
      noBtn.textContent = "No";
      yesnoRow.appendChild(yesBtn);
      yesnoRow.appendChild(noBtn);
      section.appendChild(yesnoRow);
    }

    hoursWrap = document.createElement("div");
    hoursWrap.className = card.freeText ? "" : "hidden";
    hoursWrap.style.marginTop = "16px";
    var hoursLabel = document.createElement("label");
    hoursLabel.textContent = "Hours per week";
    hoursWrap.appendChild(hoursLabel);
    var sliderRow = document.createElement("div");
    sliderRow.className = "slider-row";
    hoursSlider = document.createElement("input");
    hoursSlider.type = "range";
    // The free-text card starts at 0 - it's optional, and clicking through without touching
    // it must not silently count hours the reader never actually confirmed. The Yes/No cards
    // only reveal their slider after "Yes", so their default reflects a real answer instead.
    var startingHours = card.freeText ? 0 : config.hours.default;
    hoursSlider.min = card.freeText ? 0 : config.hours.min;
    hoursSlider.max = config.hours.max;
    hoursSlider.step = config.hours.step;
    hoursSlider.value = startingHours;
    hoursOutput = document.createElement("output");
    hoursOutput.textContent = startingHours + " hrs";
    sliderRow.appendChild(hoursSlider);
    sliderRow.appendChild(hoursOutput);
    hoursWrap.appendChild(sliderRow);
    section.appendChild(hoursWrap);

    hoursSlider.addEventListener("input", function () {
      hoursOutput.textContent = hoursSlider.value + " hrs";
    });

    // Card B (returning missed calls) also asks how many calls are missed a week,
    // regardless of the Yes/No answer - feeds Opportunity 3, asked here once, not repeated.
    var missedCallsSlider = null;
    if (card.key === "returningMissedCalls") {
      var missedWrap = document.createElement("div");
      missedWrap.style.marginTop = "16px";
      var missedLabel = document.createElement("label");
      missedLabel.textContent = "About how many calls do you miss in a typical week?";
      missedWrap.appendChild(missedLabel);
      var missedRow = document.createElement("div");
      missedRow.className = "slider-row";
      missedCallsSlider = document.createElement("input");
      missedCallsSlider.type = "range";
      missedCallsSlider.min = config.missedCalls.min;
      missedCallsSlider.max = config.missedCalls.max;
      missedCallsSlider.step = config.missedCalls.step;
      missedCallsSlider.value = config.missedCalls.default;
      var missedOutput = document.createElement("output");
      missedOutput.textContent = config.missedCalls.default + " calls";
      missedRow.appendChild(missedCallsSlider);
      missedRow.appendChild(missedOutput);
      missedWrap.appendChild(missedRow);
      section.appendChild(missedWrap);
      missedCallsSlider.addEventListener("input", function () {
        missedOutput.textContent = missedCallsSlider.value + " calls";
        state.missedCallsPerWeek = Number(missedCallsSlider.value);
      });
      state.missedCallsPerWeek = config.missedCalls.default;
    }

    var nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "btn-primary";
    nextBtn.textContent = "Next";
    nextBtn.disabled = !card.freeText; // Yes/No cards require a choice; free-text card is optional
    section.appendChild(nextBtn);

    if (!card.freeText) {
      function selectYesNo(isYes) {
        yesBtn.classList.toggle("selected", isYes);
        noBtn.classList.toggle("selected", !isYes);
        hoursWrap.classList.toggle("hidden", !isYes);
        nextBtn.disabled = false;
        state.taskAnswers[card.key] = { yes: isYes, hours: isYes ? Number(hoursSlider.value) : 0 };
      }
      yesBtn.addEventListener("click", function () { selectYesNo(true); });
      noBtn.addEventListener("click", function () { selectYesNo(false); });
      hoursSlider.addEventListener("input", function () {
        if (state.taskAnswers[card.key]) state.taskAnswers[card.key].hours = Number(hoursSlider.value);
      });
    }

    nextBtn.addEventListener("click", function () {
      if (card.freeText) {
        state.otherAdminNote = textInput.value.trim();
        var hours = Number(hoursSlider.value);
        if (hours > 0) state.taskAnswers[card.key] = { yes: true, hours: hours };
      }
      if (screenIndex >= screenIds.length - 2) {
        goNext();
        runCalculation();
      } else {
        goNext();
      }
    });

    taskScreensEl.appendChild(section);
  });

  // ---- Client-side mirror of calculate.ts, for the instant results reveal only. POST /audit
  // always recomputes the authoritative figures server-side from the raw inputs. ----
  function computeFigures() {
    var taskHours = [];
    Object.keys(state.taskAnswers).forEach(function (key) {
      var a = state.taskAnswers[key];
      if (a.yes && a.hours > 0) taskHours.push({ key: key, hours: a.hours });
    });

    var totalAdminHoursPerWeek = 0;
    taskHours.forEach(function (t) { totalAdminHoursPerWeek += t.hours; });
    var weeklyAdminCost = totalAdminHoursPerWeek * state.hourlyRate;
    var annualAdminCost = weeklyAdminCost * config.workingWeeks;

    var remindersTicked = !!(state.taskAnswers.reminders && state.taskAnswers.reminders.yes);
    var reminders = null;
    if (!remindersTicked) {
      var activeCustomersEstimate = state.jobsPerWeek * config.workingWeeks * config.activeCustomerMultiplier;
      var customersAtRisk = activeCustomersEstimate * config.retentionAtRiskFraction;
      var recoverableCustomers = customersAtRisk * config.retentionRecoveryPct;
      reminders = {
        activeCustomersEstimate: activeCustomersEstimate,
        customersAtRisk: customersAtRisk,
        recoverableCustomers: recoverableCustomers,
        annualOpportunity: recoverableCustomers * state.averageInvoice
      };
    }

    var followingUpQuotesTicked = !!(state.taskAnswers.followingUpQuotes && state.taskAnswers.followingUpQuotes.yes);
    var quoteFollowUp = null;
    if (followingUpQuotesTicked) {
      var quotedJobsPerWeekEstimate = state.jobsPerWeek * config.quotedJobsMultiplier;
      quoteFollowUp = {
        quotedJobsPerWeekEstimate: quotedJobsPerWeekEstimate,
        annualOpportunity: quotedJobsPerWeekEstimate * config.quoteFollowUpRecoveryPct * state.averageInvoice * config.workingWeeks
      };
    }

    var missedCalls = {
      missedCallsPerWeek: state.missedCallsPerWeek,
      conversionRate: config.missedCallConversionRate,
      annualOpportunity: state.missedCallsPerWeek * config.missedCallConversionRate * state.averageInvoice * config.workingWeeks
    };

    var totalAnnualRevenueOpportunity =
      (reminders ? reminders.annualOpportunity : 0) +
      (quoteFollowUp ? quoteFollowUp.annualOpportunity : 0) +
      missedCalls.annualOpportunity;
    var totalAnnualBenefit = annualAdminCost + totalAnnualRevenueOpportunity;

    var plan = config.plans[0];
    for (var i = config.plans.length - 1; i >= 0; i--) {
      var thresholds = { starter: 1, growth: 2, pro: 5, enterprise: 10 };
      if (state.workers >= thresholds[config.plans[i].key]) { plan = config.plans[i]; break; }
    }
    var monthlyBenefit = totalAnnualBenefit / 12;
    var weeklyBenefit = monthlyBenefit / 4;
    var paybackWeeks = (plan.monthlyPrice !== null && weeklyBenefit > 0)
      ? Math.max(1, Math.ceil(plan.monthlyPrice / weeklyBenefit))
      : null;

    return {
      tasks: taskHours,
      totalAdminHoursPerWeek: totalAdminHoursPerWeek,
      weeklyAdminCost: weeklyAdminCost,
      annualAdminCost: annualAdminCost,
      reminders: reminders,
      quoteFollowUp: quoteFollowUp,
      missedCalls: missedCalls,
      totalAnnualRevenueOpportunity: totalAnnualRevenueOpportunity,
      totalAnnualBenefit: totalAnnualBenefit,
      recommendedPlan: { plan: plan, monthlyBenefit: monthlyBenefit, weeklyBenefit: weeklyBenefit, paybackWeeks: paybackWeeks }
    };
  }

  function renderResults() {
    var f = state.figures;
    document.getElementById("headline-number").textContent = money(f.totalAnnualBenefit);
    document.getElementById("tile-admin").textContent = money(f.annualAdminCost) + "/yr";
    document.getElementById("tile-opportunity").textContent = money(f.totalAnnualRevenueOpportunity) + "/yr";
    document.getElementById("tile-total").textContent = money(f.totalAnnualBenefit) + "/yr";
    document.getElementById("plan-name").textContent = f.recommendedPlan.plan.name +
      (f.recommendedPlan.plan.monthlyPrice !== null ? " - " + money(f.recommendedPlan.plan.monthlyPrice) + "/month" : " - custom pricing");
    document.getElementById("plan-payback").textContent = f.recommendedPlan.paybackWeeks !== null
      ? "Pays for itself in about " + f.recommendedPlan.paybackWeeks + (f.recommendedPlan.paybackWeeks === 1 ? " week." : " weeks.")
      : "Get in touch for a payback estimate on this plan.";

    var sourceListEl = document.getElementById("source-list");
    sourceListEl.innerHTML = "";
    config.sources.forEach(function (s) {
      var li = document.createElement("li");
      li.textContent = s;
      sourceListEl.appendChild(li);
    });

    document.getElementById("results-loading").classList.add("hidden");
    document.getElementById("results-content").classList.remove("hidden");
  }

  function runCalculation() {
    state.figures = computeFigures();
    renderResults();

    var taskHoursPayload = [];
    Object.keys(state.taskAnswers).forEach(function (key) {
      var a = state.taskAnswers[key];
      if (a.yes && a.hours > 0) taskHoursPayload.push({ key: key, hours: a.hours });
    });

    var saveErrorEl = document.getElementById("save-error");
    state.savePromise = fetch("/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead: state.lead,
        hourlyRate: state.hourlyRate,
        workers: state.workers,
        jobsPerWeek: state.jobsPerWeek,
        averageInvoice: state.averageInvoice,
        taskHours: taskHoursPayload,
        otherAdminNote: state.otherAdminNote || undefined,
        missedCallsPerWeek: state.missedCallsPerWeek
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
        if (data.asap) addSlotOption(data.asap, "ASAP: " + data.asap.label);
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

  document.getElementById("btn-book-review").addEventListener("click", function () {
    document.getElementById("screen-results").classList.add("hidden");
    document.getElementById("screen-book").classList.remove("hidden");
    (state.savePromise || Promise.resolve()).catch(function () {}).then(initBookingScreen);
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
        btnBookSlot.textContent = "Book my review";
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
