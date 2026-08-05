import type { Industry } from "./types.js";
import { STYLES } from "./styles.js";
import {
  WORKING_WEEKS,
  RATE_MIN,
  RATE_MAX,
  RATE_STEP,
  RATE_DEFAULT,
  HOURS_MIN,
  HOURS_MAX,
  HOURS_STEP,
  HOURS_DEFAULT,
  TOTAL_HOURS_CAP,
  MISSED_CALLS_MIN,
  MISSED_CALLS_MAX,
  MISSED_CALLS_STEP,
  MISSED_CALLS_DEFAULT,
  CONVERSION_RATE_DEFAULT,
  JOB_VALUE_MIN,
  JOB_VALUE_MAX,
  JOB_VALUE_STEP,
  AVERAGE_JOB_VALUE_DEFAULT,
  BUSY_DAY_CALLS_MIN,
  BUSY_DAY_CALLS_MAX,
  BUSY_DAY_CALLS_STEP,
  BUSY_DAY_CALLS_DEFAULT,
  PAYBACK_FLOOR_WEEKS,
} from "./calculate.js";

/** Prevents the embedded JSON from breaking out of its <script> tag. */
function safeJsonForScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function renderAuditPage(industry: Industry, industries: Industry[]): string {
  // Same unset-is-off pattern as the person page's Charlie widget - no VAPI_* env vars means
  // the feature isn't configured yet in this environment.
  const vapiPublicKey = process.env.VAPI_PUBLIC_KEY;
  const vapiAssistantId = process.env.VAPI_ASSISTANT_ID;
  const vapi = vapiPublicKey && vapiAssistantId ? { publicKey: vapiPublicKey, assistantId: vapiAssistantId } : null;

  const config = {
    industries,
    defaultIndustryKey: industry.key,
    workingWeeks: WORKING_WEEKS,
    rate: { min: RATE_MIN, max: RATE_MAX, step: RATE_STEP, default: RATE_DEFAULT },
    hours: { min: HOURS_MIN, max: HOURS_MAX, step: HOURS_STEP, default: HOURS_DEFAULT },
    totalHoursCap: TOTAL_HOURS_CAP,
    missedCalls: { min: MISSED_CALLS_MIN, max: MISSED_CALLS_MAX, step: MISSED_CALLS_STEP, default: MISSED_CALLS_DEFAULT },
    jobValue: { min: JOB_VALUE_MIN, max: JOB_VALUE_MAX, step: JOB_VALUE_STEP, default: AVERAGE_JOB_VALUE_DEFAULT },
    busyDayCalls: { min: BUSY_DAY_CALLS_MIN, max: BUSY_DAY_CALLS_MAX, step: BUSY_DAY_CALLS_STEP, default: BUSY_DAY_CALLS_DEFAULT },
    missedWorkDefaults: {
      callsMissedPerWeek: MISSED_CALLS_DEFAULT,
      conversionRate: CONVERSION_RATE_DEFAULT,
      averageJobValue: AVERAGE_JOB_VALUE_DEFAULT,
    },
    paybackFloorWeeks: PAYBACK_FLOOR_WEEKS,
    vapi,
  };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Insanely Smart: find the hidden cost in your business</title>
<style>${STYLES}</style>
</head>
<body>
<div class="band top"><img src="/logo-transparent.webp" alt="Insanely Smart" class="logo" /></div>
<div class="hero-dark">
  <h1>What's the boring work costing you?</h1>
  <p class="sub">Pick your industry, tick what eats your time, see the number.</p>
</div>

<main class="container">
  <section class="step-card" id="step-industry">
    <p class="step-eyebrow">Step 1 - What kind of business?</p>
    <div class="pill-group" id="industry-pills"></div>
    <p class="trust-line">No email required &middot; Takes about 2 minutes &middot; Instant estimate on your phone</p>
    <p class="fine-print">Local Adelaide business owners only &middot; No spam &middot; No obligation</p>
  </section>

  <section class="step-card hidden" id="step-tasks">
    <p class="step-eyebrow">Step 2 - What's eating your time? Tick all that apply.</p>
    <div id="task-list"></div>
    <p class="clamp-note hidden" id="clamp-note"></p>
  </section>

  <section class="step-card hidden" id="step-scale">
    <p class="step-eyebrow">Step 3 - Roughly how bad is it?</p>
    <p class="sub">You're not paying to save money. You're paying to get this time back.</p>

    <div class="stat-row">
      <span>Hours a week on these, all up</span>
      <output id="hours-summary-output">0 hrs</output>
    </div>
    <p class="help">Across everyone who touches this work.</p>

    <hr class="rule-thin" />

    <label for="input-rate">What an hour of that time costs</label>
    <div class="slider-row">
      <input type="range" id="input-rate" />
      <output id="output-rate"></output>
    </div>
    <p class="help">Wage plus super and on-costs. Not just the take-home.</p>
  </section>

  <section class="hidden" id="step-results">
    <div class="bleed-card">
      <p class="bleed-eyebrow">What that's bleeding you a year</p>
      <div class="bleed-number" id="bleed-number">$0</div>
      <p class="bleed-caption">every year, on repeat work a system could do</p>
    </div>

    <div class="step-card" id="systems-block">
      <p class="step-eyebrow">What I'd put to work on it</p>
      <div id="systems-list"></div>
    </div>

    <div class="recovers-card">
      <p class="step-eyebrow">What a system recovers</p>
      <div class="recovers-number" id="recovers-number"></div>
      <p class="payback" id="recovers-payback"></p>
    </div>

    <p class="disclaimer">These are conservative estimates from what you've entered, meant to show the shape of the opportunity. Your real figures get measured, in writing, during the Proof of Value.</p>
  </section>

  <section class="step-card hidden" id="step-week">
    <p class="step-eyebrow">Step 4 - What's missed work costing you?</p>
    <p class="sub">A few quick questions about calls and jobs. Doesn't apply to your business? Skip it.</p>

    <label for="input-busy-calls">Calls on a busy day</label>
    <div class="slider-row">
      <input type="range" id="input-busy-calls" />
      <output id="output-busy-calls"></output>
    </div>

    <label for="input-missed-calls">Calls that go unanswered in a typical week</label>
    <div class="slider-row">
      <input type="range" id="input-missed-calls" />
      <output id="output-missed-calls"></output>
    </div>

    <label for="input-job-value">Average value of a job, dollars</label>
    <div class="slider-row">
      <input type="range" id="input-job-value" />
      <output id="output-job-value"></output>
    </div>

    <button type="button" class="btn-primary" id="btn-see-estimate">See my estimate</button>
    <button type="button" class="btn-secondary" id="btn-skip-week">This doesn't apply to me</button>
  </section>

  <div class="recovers-card hidden" id="missed-work-block">
    <p class="step-eyebrow">Possible missed-work and retention impact</p>
    <div class="recovers-number" id="missed-work-figure"></div>
    <p class="help">Based on calls you are missing and follow-up that is not happening. This is lost revenue, not saved time.</p>
  </div>

  <div class="info-box hidden" id="separate-estimates-note">
    <p>These are two different opportunity areas: time currently being spent, and possible revenue being missed. I measure the real combined impact during the Proof of Value.</p>
  </div>

  <section class="hidden" id="step-capture">
    <div class="cta-card">
      <h2>Want the real number?</h2>
      <p>That's the paid Proof of Value: I measure your actual setup and put it in writing. If it can't show savings worth what it costs, you don't pay for the build.</p>
      <button type="button" class="btn-primary" id="btn-get-pov">Book my free call</button>
      <button type="button" class="btn-secondary" id="btn-text-estimate">Text me this estimate</button>
    </div>

    <form id="capture-form" class="hidden">
      <h2>Where should I text your figures.</h2>
      <p class="sub">I will send a summary and a link you can keep and share.</p>

      <label for="input-firstname">Your first name</label>
      <input type="text" id="input-firstname" name="firstName" autocomplete="given-name" placeholder="e.g. Mick" required />

      <label for="input-mobile">Mobile number</label>
      <input type="tel" id="input-mobile" name="mobile" autocomplete="tel" inputmode="tel" required />
      <button type="submit" class="btn-primary" id="btn-submit">Send me my figures</button>
      <p class="form-error hidden" id="form-error"></p>
    </form>

    <div class="hidden" id="screen-thanks">
      <h2>Done.</h2>
      <p class="sub">Your figures are on the way. I will follow up about the Proof of Value.</p>
    </div>

    <div class="hidden" id="charlie-block">
      <h2>Talk it through with Charlie</h2>
      <p class="sub">He can walk you through what these numbers mean and lock in your free call right now.</p>
      <button type="button" class="btn-primary" id="btn-call-charlie"><span id="charlie-btn-label">Talk to Charlie</span></button>
      <p class="status" id="charlie-status"></p>
    </div>
  </section>

  <section class="hidden" id="step-book">
    <div id="book-form">
      <h2>Book my free call.</h2>
      <p class="sub">Pick a time for a free, no-obligation call - I will go through your figures and what's possible for your business.</p>

      <label for="input-business-name">Business name</label>
      <input type="text" id="input-business-name" name="businessName" autocomplete="organization" />

      <label>Pick a time</label>
      <div class="slot-list" id="slot-list"></div>
      <p class="form-error hidden" id="slot-error"></p>

      <button type="button" class="btn-primary" id="btn-book-slot" disabled>Book my free call</button>
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

  function byIndustryKey(key) {
    for (var i = 0; i < config.industries.length; i++) {
      if (config.industries[i].key === key) return config.industries[i];
    }
    return config.industries[0];
  }

  var state = {
    firstName: "",
    industry: byIndustryKey(config.defaultIndustryKey),
    rate: config.rate.default,
    taskHours: [], // ordered list of { key, hours }, selection order
    dismissedNudges: {}, // task key -> true, session-only, never persisted
    missedWork: {
      busyDayCalls: config.busyDayCalls.default, // context only - never read by computeFigures
      callsMissedPerWeek: config.missedWorkDefaults.callsMissedPerWeek,
      conversionRate: config.missedWorkDefaults.conversionRate, // fixed, not user-editable
      averageJobValue: config.missedWorkDefaults.averageJobValue
    },
    missedWorkSkipped: false, // true when Step 4 was explicitly skipped - its result block must not render at all
    figures: null,
    publicToken: null,
    ctaIntent: "text_estimate" // "pov" | "text_estimate" - set when a capture CTA is clicked
  };

  var industrySelected = false; // no pill reads as selected until the first tap

  // ---- Single-scroll reveal helpers ----
  // Sections stay in the DOM from load and unhide in place (never re-hide themselves once
  // shown) except when an industry change invalidates everything downstream of Step 2.
  var sections = {
    tasks: document.getElementById("step-tasks"),
    scale: document.getElementById("step-scale"),
    results: document.getElementById("step-results"),
    week: document.getElementById("step-week"),
    capture: document.getElementById("step-capture"),
    book: document.getElementById("step-book")
  };

  function revealEl(el) {
    if (el.classList.contains("hidden")) {
      el.classList.remove("hidden");
      window.requestAnimationFrame(function () {
        el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      });
    }
  }
  function reveal(name) { revealEl(sections[name]); }

  function resetDownstreamForIndustryChange() {
    ["scale", "results", "week", "capture", "book"].forEach(function (name) {
      sections[name].classList.add("hidden");
    });
    missedBlockEl.classList.add("hidden");
    separateEstimatesNoteEl.classList.add("hidden");
    captureFormEl.classList.add("hidden");
    document.getElementById("screen-thanks").classList.add("hidden");
    clampNoteEl.classList.add("hidden");
    state.figures = null;
  }

  function money(n) { return "$" + Math.round(n).toLocaleString("en-AU"); }
  function hrsPerWeek(n) { return (Math.round(n * 10) / 10) + " hrs/week"; }
  function hrsTotal(n) { return (Math.round(n * 10) / 10) + " hrs"; }
  function lowerFirst(s) { return s.length ? s.charAt(0).toLowerCase() + s.slice(1) : s; }

  // Mirrors src/audit/calculate.ts, for the instant on-device reveal only. POST /audit always
  // recomputes the authoritative figures server-side from the raw inputs.
  function taskBleed(hours, rate) { return hours * rate * config.workingWeeks; }
  function taskRecovered(bleed, pct) { return bleed * pct; }

  function computeFigures() {
    var rate = state.rate;
    var rawTotal = 0;
    state.taskHours.forEach(function (t) { rawTotal += t.hours; });
    var clamped = rawTotal > config.totalHoursCap;

    var tasksByKey = {};
    state.industry.tasks.forEach(function (t) { tasksByKey[t.key] = t; });

    var running = 0;
    var tasks = [];
    state.taskHours.forEach(function (entry) {
      var task = tasksByKey[entry.key];
      if (!task) return;
      var remaining = Math.max(config.totalHoursCap - running, 0);
      var hours = Math.min(entry.hours, remaining);
      running += hours;
      var bleed = taskBleed(hours, rate);
      var recovered = taskRecovered(bleed, task.recoveryPct);
      tasks.push({
        key: task.key,
        label: task.label,
        hours: hours,
        bleed: bleed,
        recovered: recovered,
        recoveredHoursAnnual: hours * config.workingWeeks * task.recoveryPct
      });
    });

    var totalBleed = 0, totalRecovered = 0, totalRecoveredHoursAnnual = 0;
    tasks.forEach(function (t) {
      totalBleed += t.bleed;
      totalRecovered += t.recovered;
      totalRecoveredHoursAnnual += t.recoveredHoursAnnual;
    });

    var payback = null;
    if (totalRecovered > 0 && tasks.length > 0) {
      var buildAnchor = tasks.length === 1 ? 1500 : 5000;
      var weeklyRecovery = totalRecovered / config.workingWeeks;
      payback = {
        buildAnchor: buildAnchor,
        weeksToPayback: Math.max(config.paybackFloorWeeks, Math.round(buildAnchor / weeklyRecovery))
      };
    }

    var missedWork = null;
    if (state.industry.hasMissedWork) {
      var mw = state.missedWork;
      missedWork = {
        missedAnnual: Math.max(mw.callsMissedPerWeek, 0) * config.workingWeeks * Math.min(Math.max(mw.conversionRate, 0), 1) * Math.max(mw.averageJobValue, 0)
      };
    }

    return {
      tasks: tasks,
      rawTotalHoursPerWeek: rawTotal,
      totalHoursPerWeek: running,
      clamped: clamped,
      totalBleed: totalBleed,
      totalRecovered: totalRecovered,
      totalRecoveredHoursAnnual: totalRecoveredHoursAnnual,
      payback: payback,
      missedWork: missedWork
    };
  }

  function animateCountUp(el, target, formatFn) {
    if (reducedMotion || target === 0) {
      el.textContent = formatFn(target);
      return;
    }
    var duration = 1000;
    var start = null;
    function step(timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatFn(target * eased);
      if (progress < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  // ---- Step 1: industry pills, persistent selection, reversible ----
  var industryPillsEl = document.getElementById("industry-pills");

  function renderIndustryPills() {
    industryPillsEl.innerHTML = "";
    config.industries.forEach(function (ind) {
      var pill = document.createElement("button");
      pill.type = "button";
      pill.className = "pill" + (industrySelected && state.industry.key === ind.key ? " selected" : "");
      pill.textContent = ind.name;
      pill.addEventListener("click", function () {
        var changed = !industrySelected || state.industry.key !== ind.key;
        industrySelected = true;
        state.industry = ind;
        renderIndustryPills();
        if (changed) {
          state.taskHours = [];
          state.missedWorkSkipped = false;
          resetDownstreamForIndustryChange();
        }
        renderTasks();
        reveal("tasks");
      });
      industryPillsEl.appendChild(pill);
    });
  }

  // ---- Step 2: task checklist ----
  var taskListEl = document.getElementById("task-list");
  var clampNoteEl = document.getElementById("clamp-note");

  function taskHoursIndex(key) {
    for (var i = 0; i < state.taskHours.length; i++) {
      if (state.taskHours[i].key === key) return i;
    }
    return -1;
  }

  function renderTasks() {
    taskListEl.innerHTML = "";
    state.industry.tasks.forEach(function (task) {
      var row = document.createElement("div");
      row.className = "task-row";

      var checkLabel = document.createElement("label");
      checkLabel.className = "task-check";
      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      var checkText = document.createElement("span");
      checkText.textContent = task.label;
      checkLabel.appendChild(checkbox);
      checkLabel.appendChild(checkText);

      var noteEl = null;
      if (task.note) {
        noteEl = document.createElement("p");
        noteEl.className = "task-note";
        noteEl.textContent = task.note;
      }

      var sliderWrap = document.createElement("div");
      sliderWrap.className = "task-slider";
      var sliderRow = document.createElement("div");
      sliderRow.className = "slider-row";
      var slider = document.createElement("input");
      slider.type = "range";
      slider.min = config.hours.min;
      slider.max = config.hours.max;
      slider.step = config.hours.step;
      slider.value = config.hours.default;
      var output = document.createElement("output");
      output.textContent = hrsPerWeek(config.hours.default);
      sliderRow.appendChild(slider);
      sliderRow.appendChild(output);
      sliderWrap.appendChild(sliderRow);

      var nudgeEl = null;
      if (task.nudge) {
        nudgeEl = document.createElement("div");
        nudgeEl.className = "task-nudge";
        var nudgeText = document.createElement("span");
        nudgeText.textContent = task.nudge;
        var nudgeDismiss = document.createElement("button");
        nudgeDismiss.type = "button";
        nudgeDismiss.className = "task-nudge-dismiss";
        nudgeDismiss.setAttribute("aria-label", "Dismiss");
        nudgeDismiss.textContent = "×";
        nudgeDismiss.addEventListener("click", function () {
          state.dismissedNudges[task.key] = true;
          nudgeEl.classList.add("hidden");
        });
        nudgeEl.appendChild(nudgeText);
        nudgeEl.appendChild(nudgeDismiss);
        if (state.dismissedNudges[task.key]) nudgeEl.classList.add("hidden");
      }

      checkbox.addEventListener("change", function () {
        row.classList.toggle("checked", checkbox.checked);
        if (checkbox.checked) {
          state.taskHours.push({ key: task.key, hours: Number(slider.value) });
        } else {
          var idx = taskHoursIndex(task.key);
          if (idx !== -1) state.taskHours.splice(idx, 1);
        }
        if (nudgeEl) nudgeEl.classList.toggle("hidden", checkbox.checked || !!state.dismissedNudges[task.key]);
        onScaleInputsChanged();
      });

      slider.addEventListener("input", function () {
        output.textContent = hrsPerWeek(Number(slider.value));
        var idx = taskHoursIndex(task.key);
        if (idx !== -1) state.taskHours[idx].hours = Number(slider.value);
        onScaleInputsChanged();
      });

      row.appendChild(checkLabel);
      if (noteEl) row.appendChild(noteEl);
      row.appendChild(sliderWrap);
      if (nudgeEl) row.appendChild(nudgeEl);
      taskListEl.appendChild(row);
    });
  }

  // ---- Step 3: hours summary (read-only, derived from Step 2) + rate slider ----
  var rateInput = document.getElementById("input-rate");
  var rateOutput = document.getElementById("output-rate");
  var hoursSummaryOutput = document.getElementById("hours-summary-output");

  rateInput.min = config.rate.min;
  rateInput.max = config.rate.max;
  rateInput.step = config.rate.step;
  rateInput.value = config.rate.default;

  function updateRateOutput() {
    rateOutput.textContent = money(Number(rateInput.value)) + "/hr";
  }
  rateInput.addEventListener("input", function () {
    state.rate = Number(rateInput.value);
    updateRateOutput();
    onScaleInputsChanged();
  });

  // Live recompute, fired on every tick/untick/hours-slider/rate-slider change once at least
  // one task is ticked. Unlocks Step 3, the results section and (if applicable) Step 4 together
  // on the first tick, then just keeps everything in sync from then on.
  function onScaleInputsChanged() {
    var raw = 0;
    state.taskHours.forEach(function (t) { raw += t.hours; });
    var over = raw > config.totalHoursCap;
    clampNoteEl.classList.toggle("hidden", !over);
    if (over) {
      clampNoteEl.textContent = "That is more than " + config.totalHoursCap + " hours a week across the jobs you have picked. I have capped the figures at " + config.totalHoursCap + " hours so the numbers stay realistic.";
    }
    hoursSummaryOutput.textContent = hrsTotal(Math.min(raw, config.totalHoursCap));

    if (state.taskHours.length === 0) return;

    // Unhide everything this unlocks in one batch, but only scroll to the earliest of them -
    // scrolling to each in turn would fight itself and yank the page straight to the bottom
    // on the very first tick. Industries without a missed-work module have no Step 4, so the
    // capture CTA unlocks here directly instead - otherwise it would never become reachable.
    var firstNewSection = null;
    function unhide(name) {
      var el = sections[name];
      if (el.classList.contains("hidden")) {
        el.classList.remove("hidden");
        if (!firstNewSection) firstNewSection = el;
      }
    }
    unhide("scale");
    unhide("results");
    if (state.industry.hasMissedWork) {
      unhide("week");
    } else {
      unhide("capture");
    }
    if (firstNewSection) {
      window.requestAnimationFrame(function () {
        firstNewSection.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      });
    }

    state.figures = computeFigures();
    renderResults();
  }

  // ---- Results: bleed-card, "what I'd put to work on it", recovers-card ----
  var bleedNumberEl = document.getElementById("bleed-number");
  var systemsListEl = document.getElementById("systems-list");
  var recoversNumberEl = document.getElementById("recovers-number");
  var recoversPaybackEl = document.getElementById("recovers-payback");

  function renderResults() {
    var f = state.figures;
    if (!f) return;

    // The bleed number gets the one deliberate reveal moment (count-up plus a scale-in) -
    // everything else here, including the system cards and the recovers total, is set
    // statically so it doesn't compete with it.
    bleedNumberEl.classList.remove("animate-in");
    if (!reducedMotion) {
      void bleedNumberEl.offsetWidth; // restart the CSS animation on repeat renders
      bleedNumberEl.classList.add("animate-in");
    }
    animateCountUp(bleedNumberEl, f.totalBleed, function (n) { return money(n); });

    var tasksByKey = {};
    state.industry.tasks.forEach(function (t) { tasksByKey[t.key] = t; });

    systemsListEl.innerHTML = "";
    f.tasks.forEach(function (t) {
      var taskDef = tasksByKey[t.key];
      if (!taskDef) return;

      var card = document.createElement("div");
      card.className = "system-card";

      var head = document.createElement("div");
      head.className = "system-card-head";
      var name = document.createElement("span");
      name.className = "system-card-name";
      name.textContent = taskDef.system || taskDef.label;
      var value = document.createElement("span");
      value.className = "system-card-value";
      value.textContent = money(t.recovered) + "/yr";
      head.appendChild(name);
      head.appendChild(value);

      var handles = document.createElement("p");
      handles.className = "system-card-handles";
      handles.textContent = "Handles: " + lowerFirst(taskDef.label);

      var removes = document.createElement("p");
      removes.className = "system-card-removes";
      removes.textContent = "Removes roughly " + Math.round(taskDef.recoveryPct * 100) + "% of that task's time";

      card.appendChild(head);
      card.appendChild(handles);
      card.appendChild(removes);
      systemsListEl.appendChild(card);
    });

    recoversNumberEl.textContent = money(f.totalRecovered) + " a year";
    recoversPaybackEl.textContent = f.payback
      ? "At this rate, it would take about " + f.payback.weeksToPayback + " weeks for the savings to cover a build. That's the same number the twelve-month guarantee gets checked against in the Proof of Value."
      : "";
  }

  // ---- Step 4: missed work, skippable ----
  var busyCallsInput = document.getElementById("input-busy-calls");
  var busyCallsOutput = document.getElementById("output-busy-calls");
  var weekMissedCallsInput = document.getElementById("input-missed-calls");
  var weekMissedCallsOutput = document.getElementById("output-missed-calls");
  var weekJobValueInput = document.getElementById("input-job-value");
  var weekJobValueOutput = document.getElementById("output-job-value");
  var btnSeeEstimate = document.getElementById("btn-see-estimate");
  var btnSkipWeek = document.getElementById("btn-skip-week");
  var missedBlockEl = document.getElementById("missed-work-block");
  var missedFigureEl = document.getElementById("missed-work-figure");
  var separateEstimatesNoteEl = document.getElementById("separate-estimates-note");

  busyCallsInput.min = config.busyDayCalls.min;
  busyCallsInput.max = config.busyDayCalls.max;
  busyCallsInput.step = config.busyDayCalls.step;
  busyCallsInput.value = config.busyDayCalls.default;
  busyCallsOutput.textContent = config.busyDayCalls.default + " calls";

  weekMissedCallsInput.min = config.missedCalls.min;
  weekMissedCallsInput.max = config.missedCalls.max;
  weekMissedCallsInput.step = config.missedCalls.step;
  weekMissedCallsInput.value = config.missedCalls.default;
  weekMissedCallsOutput.textContent = config.missedCalls.default + " calls";

  weekJobValueInput.min = config.jobValue.min;
  weekJobValueInput.max = config.jobValue.max;
  weekJobValueInput.step = config.jobValue.step;
  weekJobValueInput.value = config.jobValue.default;
  weekJobValueOutput.textContent = money(config.jobValue.default);

  busyCallsInput.addEventListener("input", function () {
    state.missedWork.busyDayCalls = Number(busyCallsInput.value);
    busyCallsOutput.textContent = busyCallsInput.value + " calls";
  });
  weekMissedCallsInput.addEventListener("input", function () {
    state.missedWork.callsMissedPerWeek = Number(weekMissedCallsInput.value);
    weekMissedCallsOutput.textContent = weekMissedCallsInput.value + " calls";
  });
  weekJobValueInput.addEventListener("input", function () {
    state.missedWork.averageJobValue = Number(weekJobValueInput.value);
    weekJobValueOutput.textContent = money(Number(weekJobValueInput.value));
  });

  function renderMissedWork() {
    var showMissedWork = !state.missedWorkSkipped && !!(state.figures && state.figures.missedWork);
    missedBlockEl.classList.toggle("hidden", !showMissedWork);
    separateEstimatesNoteEl.classList.toggle("hidden", !showMissedWork);
    if (showMissedWork) {
      missedFigureEl.textContent = money(state.figures.missedWork.missedAnnual) + " a year";
    }
  }

  btnSeeEstimate.addEventListener("click", function () {
    state.missedWorkSkipped = false;
    state.figures = computeFigures();
    renderMissedWork();
    reveal("capture");
  });

  btnSkipWeek.addEventListener("click", function () {
    state.missedWorkSkipped = true;
    missedBlockEl.classList.add("hidden");
    reveal("capture");
  });

  // Both lead to the same mobile-capture form first (a person record has to exist before a
  // slot can be booked against it) - ctaIntent decides what happens after capture succeeds.
  var captureFormEl = document.getElementById("capture-form");
  document.getElementById("btn-get-pov").addEventListener("click", function () {
    state.ctaIntent = "pov";
    revealEl(captureFormEl);
  });
  document.getElementById("btn-text-estimate").addEventListener("click", function () {
    state.ctaIntent = "text_estimate";
    revealEl(captureFormEl);
  });

  // ---- Capture ----
  var errorEl = document.getElementById("form-error");
  var submitBtn = document.getElementById("btn-submit");

  captureFormEl.addEventListener("submit", function (event) {
    event.preventDefault();
    errorEl.classList.add("hidden");

    var firstName = document.getElementById("input-firstname").value.trim();
    if (!firstName) {
      errorEl.textContent = "Please add your first name.";
      errorEl.classList.remove("hidden");
      return;
    }

    var mobile = document.getElementById("input-mobile").value.trim();
    if (!mobile) {
      errorEl.textContent = "Please add a mobile number.";
      errorEl.classList.remove("hidden");
      return;
    }

    state.firstName = firstName;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    fetch("/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: state.firstName,
        mobile: mobile,
        industryKey: state.industry.key,
        rate: state.rate,
        taskHours: state.taskHours,
        missedWork: state.industry.hasMissedWork ? state.missedWork : undefined
      })
    })
      .then(function (res) {
        if (!res.ok) throw new Error("save-failed");
        return res.json();
      })
      .then(function (data) {
        state.publicToken = data.publicToken;
        if (config.vapi) revealEl(document.getElementById("charlie-block"));
        if (state.ctaIntent === "pov") {
          reveal("book");
          initBookingScreen();
        } else {
          captureFormEl.classList.add("hidden");
          revealEl(document.getElementById("screen-thanks"));
        }
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send me my figures";
        errorEl.textContent = "Could not save that just now. Check your connection and try again.";
        errorEl.classList.remove("hidden");
      });
  });

  // ---- Post-capture: book the Proof of Value call (only reached via ctaIntent === "pov") ----
  var bookFormEl = document.getElementById("book-form");
  var slotListEl = document.getElementById("slot-list");
  var slotErrorEl = document.getElementById("slot-error");
  var bookErrorEl = document.getElementById("book-error");
  var btnBookSlot = document.getElementById("btn-book-slot");
  var businessNameInput = document.getElementById("input-business-name");
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
        businessName: businessNameInput.value.trim(),
        slotStart: selectedSlot.start,
        slotEnd: selectedSlot.end
      })
    })
      .then(function (res) {
        if (!res.ok) return res.json().then(function (body) { throw new Error(body.error || "book-failed"); });
        return res.json();
      })
      .then(function () {
        bookFormEl.classList.add("hidden");
        revealEl(document.getElementById("screen-booked"));
      })
      .catch(function (err) {
        btnBookSlot.disabled = false;
        btnBookSlot.textContent = "Book my free call";
        bookErrorEl.textContent = err.message === "That time was just taken. Pick another."
          ? err.message
          : "Could not book that time just now. Check your connection and try again.";
        bookErrorEl.classList.remove("hidden");
        if (err.message === "That time was just taken. Pick another.") initBookingScreen();
      });
  });

  // ---- Talk to Charlie (only rendered when VAPI_PUBLIC_KEY/VAPI_ASSISTANT_ID are configured;
  // built from the already-saved audit at submit time, not kept live while the form is filled
  // in - that's a later slice) ----
  var callBtn = document.getElementById("btn-call-charlie");
  if (callBtn && config.vapi) {
    (async function () {
      var Vapi = (await import("https://esm.sh/@vapi-ai/web@2.3.8")).default;
      var vapi = new Vapi(config.vapi.publicKey);
      var label = document.getElementById("charlie-btn-label");
      var status = document.getElementById("charlie-status");
      var live = false;

      callBtn.addEventListener("click", function () {
        if (!live) {
          var f = state.figures;
          vapi.start(config.vapi.assistantId, {
            variableValues: {
              firstName: state.firstName,
              industry: state.industry.name,
              tasks: f.tasks.map(function (t) { return t.label; }).join(", "),
              hoursPerYear: Math.round(f.totalRecoveredHoursAnnual),
              dollarsPerYear: Math.round(f.totalRecovered),
              publicToken: state.publicToken
            }
          });
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
        label.textContent = "Talk to Charlie";
        status.textContent = "Call ended.";
      });
      vapi.on("speech-start", function () { if (live) status.textContent = "Charlie is speaking..."; });
      vapi.on("speech-end", function () { if (live) status.textContent = "Listening..."; });
      vapi.on("error", function (e) {
        live = false;
        callBtn.classList.remove("live");
        label.textContent = "Talk to Charlie";
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

  renderIndustryPills();
  renderTasks();
  updateRateOutput();
})();
`;
