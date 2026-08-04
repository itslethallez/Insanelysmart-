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
  MISSED_CALLS_DEFAULT,
  CONVERSION_RATE_DEFAULT,
  AVERAGE_JOB_VALUE_DEFAULT,
  PAYBACK_FLOOR_WEEKS,
} from "./calculate.js";

/** Prevents the embedded JSON from breaking out of its <script> tag. */
function safeJsonForScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function renderAuditPage(industry: Industry, industries: Industry[]): string {
  const config = {
    industries,
    defaultIndustryKey: industry.key,
    workingWeeks: WORKING_WEEKS,
    rate: { min: RATE_MIN, max: RATE_MAX, step: RATE_STEP, default: RATE_DEFAULT },
    hours: { min: HOURS_MIN, max: HOURS_MAX, step: HOURS_STEP, default: HOURS_DEFAULT },
    totalHoursCap: TOTAL_HOURS_CAP,
    missedWorkDefaults: {
      callsMissedPerWeek: MISSED_CALLS_DEFAULT,
      conversionRate: CONVERSION_RATE_DEFAULT,
      averageJobValue: AVERAGE_JOB_VALUE_DEFAULT,
    },
    paybackFloorWeeks: PAYBACK_FLOOR_WEEKS,
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

<main class="container">
  <section id="screen-start">
    <div class="start-card">
      <p class="eyebrow-badge">2-minute check</p>
      <h1>How much is admin costing your business each year?</h1>
      <p class="sub">Missed calls, manual bookings, reminders, and paperwork quietly cost many Adelaide businesses thousands every year.</p>
      <p class="sub sub-bold">Answer a few quick questions and I'll estimate the annual cost in under 2 minutes.</p>

      <label for="input-firstname">Your first name</label>
      <input type="text" id="input-firstname" name="firstName" autocomplete="given-name" placeholder="e.g. Mick" />

      <label>Your industry</label>
      <div class="industry-tabs" id="industry-tabs"></div>

      <button type="button" class="btn-primary" id="btn-start" disabled>Check my business</button>

      <p class="trust-line">No email required &middot; Takes about 2 minutes &middot; Instant estimate on your phone</p>

      <p class="fine-print">Local Adelaide business owners only &middot; No spam &middot; No obligation</p>
    </div>
  </section>

  <section id="screen-tasks" class="hidden">
    <h2>What eats your week.</h2>
    <p class="sub">Tick anything that applies, then set the hours it takes.</p>

    <label for="input-rate">Your fully loaded cost per hour, wage plus super plus on-costs</label>
    <div class="slider-row">
      <input type="range" id="input-rate" />
      <output id="output-rate"></output>
    </div>

    <div id="task-list"></div>

    <p class="clamp-note hidden" id="clamp-note"></p>

    <button type="button" class="btn-primary" id="btn-see-numbers" disabled>See my numbers</button>
  </section>

  <section id="screen-reveal" class="hidden">
    <h2>Based on what you entered</h2>

    <div class="result-card">
      <p class="reveal-eyebrow">Admin time currently spent</p>
      <div class="reveal-hours" id="reveal-hours"></div>
      <div class="reveal-dollars" id="reveal-dollars"></div>
      <ul class="line-items" id="reveal-line-items"></ul>
      <p class="payback" id="reveal-payback"></p>
    </div>

    <div id="missed-work-block" class="result-card hidden">
      <p class="reveal-eyebrow">Possible missed-work &amp; retention impact</p>
      <div class="upside-figure" id="missed-work-figure"></div>
      <p class="help">Based on calls you are missing and follow-up that is not happening. This is lost revenue, not saved time.</p>

      <label for="input-missed-calls">Calls missed per week</label>
      <input type="number" id="input-missed-calls" min="0" step="1" />

      <label for="input-conversion">Share of those that would have become a booking, percent</label>
      <input type="number" id="input-conversion" min="0" max="100" step="1" />

      <label for="input-job-value">Average job value, dollars</label>
      <input type="number" id="input-job-value" min="0" step="10" />
    </div>

    <div class="info-box" id="separate-estimates-note">
      <p>These are two different opportunity areas: time currently being spent, and possible revenue being missed. We measure the real combined impact during the Proof of Value.</p>
    </div>

    <p class="disclaimer">These are estimates. Your exact figures come in writing during the Proof of Value.</p>

    <button type="button" class="btn-primary" id="btn-get-pov">Get my 20-minute Proof of Value</button>
    <button type="button" class="btn-secondary" id="btn-text-estimate">Text me this estimate</button>
  </section>

  <section id="screen-capture" class="hidden">
    <h2>Where should we text your figures.</h2>
    <p class="sub">We will send a summary and a link you can keep and share.</p>

    <form id="capture-form">
      <label for="input-mobile">Mobile number</label>
      <input type="tel" id="input-mobile" name="mobile" autocomplete="tel" inputmode="tel" required />
      <button type="submit" class="btn-primary" id="btn-submit">Send me my figures</button>
      <p class="form-error hidden" id="form-error"></p>
    </form>

    <div class="hidden" id="screen-thanks">
      <h2>Done.</h2>
      <p class="sub">Your figures are on the way. Mick will follow up about the Proof of Value.</p>
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
      callsMissedPerWeek: config.missedWorkDefaults.callsMissedPerWeek,
      conversionRate: config.missedWorkDefaults.conversionRate,
      averageJobValue: config.missedWorkDefaults.averageJobValue
    },
    figures: null,
    publicToken: null
  };

  var screens = {
    start: document.getElementById("screen-start"),
    tasks: document.getElementById("screen-tasks"),
    reveal: document.getElementById("screen-reveal"),
    capture: document.getElementById("screen-capture")
  };

  function showScreen(name) {
    Object.keys(screens).forEach(function (key) {
      screens[key].classList.toggle("hidden", key !== name);
    });
  }

  function money(n) { return "$" + Math.round(n).toLocaleString("en-AU"); }
  function hrsPerWeek(n) { return (Math.round(n * 10) / 10) + " hrs/week"; }

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

  // ---- Screen 1: name + industry ----
  var firstNameInput = document.getElementById("input-firstname");
  var industryTabsEl = document.getElementById("industry-tabs");
  var btnStart = document.getElementById("btn-start");

  function renderIndustryTabs() {
    industryTabsEl.innerHTML = "";
    config.industries.forEach(function (ind) {
      var tab = document.createElement("button");
      tab.type = "button";
      tab.className = "industry-tab" + (ind.key === state.industry.key ? " selected" : "");
      tab.textContent = ind.name;
      tab.addEventListener("click", function () {
        if (state.industry.key === ind.key) return;
        state.industry = ind;
        state.taskHours = [];
        renderIndustryTabs();
      });
      industryTabsEl.appendChild(tab);
    });
  }
  renderIndustryTabs();

  function updateStartButton() {
    btnStart.disabled = firstNameInput.value.trim().length === 0;
  }
  firstNameInput.addEventListener("input", updateStartButton);
  updateStartButton();

  btnStart.addEventListener("click", function () {
    state.firstName = firstNameInput.value.trim();
    showScreen("tasks");
    renderTasks();
  });

  // ---- Screen 2: tasks + rate ----
  var rateInput = document.getElementById("input-rate");
  var rateOutput = document.getElementById("output-rate");
  var taskListEl = document.getElementById("task-list");
  var clampNoteEl = document.getElementById("clamp-note");
  var btnSeeNumbers = document.getElementById("btn-see-numbers");

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
    updateTaskSummary();
  });

  function taskHoursIndex(key) {
    for (var i = 0; i < state.taskHours.length; i++) {
      if (state.taskHours[i].key === key) return i;
    }
    return -1;
  }

  function updateTaskSummary() {
    var raw = 0;
    state.taskHours.forEach(function (t) { raw += t.hours; });
    var over = raw > config.totalHoursCap;
    clampNoteEl.classList.toggle("hidden", !over);
    if (over) {
      clampNoteEl.textContent = "That is more than " + config.totalHoursCap + " hours a week across the jobs you have picked. We have capped the figures at " + config.totalHoursCap + " hours so the numbers stay realistic.";
    }
    btnSeeNumbers.disabled = state.taskHours.length === 0;
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
        updateTaskSummary();
      });

      slider.addEventListener("input", function () {
        output.textContent = hrsPerWeek(Number(slider.value));
        var idx = taskHoursIndex(task.key);
        if (idx !== -1) state.taskHours[idx].hours = Number(slider.value);
        updateTaskSummary();
      });

      row.appendChild(checkLabel);
      row.appendChild(sliderWrap);
      if (nudgeEl) row.appendChild(nudgeEl);
      taskListEl.appendChild(row);
    });
    updateRateOutput();
    updateTaskSummary();
  }

  btnSeeNumbers.addEventListener("click", function () {
    state.figures = computeFigures();
    showScreen("reveal");
    renderReveal();
  });

  // ---- Screen 3: reveal ----
  var hoursEl = document.getElementById("reveal-hours");
  var dollarsEl = document.getElementById("reveal-dollars");
  var lineItemsEl = document.getElementById("reveal-line-items");
  var paybackEl = document.getElementById("reveal-payback");
  var missedBlockEl = document.getElementById("missed-work-block");
  var separateEstimatesNoteEl = document.getElementById("separate-estimates-note");
  var missedCallsInput = document.getElementById("input-missed-calls");
  var conversionInput = document.getElementById("input-conversion");
  var jobValueInput = document.getElementById("input-job-value");
  var missedFigureEl = document.getElementById("missed-work-figure");

  missedCallsInput.value = config.missedWorkDefaults.callsMissedPerWeek;
  conversionInput.value = Math.round(config.missedWorkDefaults.conversionRate * 100);
  jobValueInput.value = config.missedWorkDefaults.averageJobValue;

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

  function renderReveal() {
    var f = state.figures;
    var annualHours = f.totalHoursPerWeek * config.workingWeeks;

    animateCountUp(hoursEl, annualHours, function (n) {
      return "That's about " + Math.round(n) + " hours a year";
    });
    animateCountUp(dollarsEl, f.totalBleed, function (n) {
      return "costing you roughly " + money(n) + " a year";
    });

    lineItemsEl.innerHTML = "";
    f.tasks.forEach(function (t) {
      var li = document.createElement("li");
      var label = document.createElement("span");
      label.textContent = t.label + ", " + hrsPerWeek(t.hours);
      var value = document.createElement("span");
      value.textContent = money(t.bleed) + "/yr";
      li.appendChild(label);
      li.appendChild(value);
      lineItemsEl.appendChild(li);
    });

    paybackEl.textContent = f.payback
      ? "Payback on a build starts around " + f.payback.weeksToPayback + " weeks. Your exact figure comes in the Proof of Value."
      : "";

    missedBlockEl.classList.toggle("hidden", !state.industry.hasMissedWork);
    separateEstimatesNoteEl.classList.toggle("hidden", !state.industry.hasMissedWork);
    if (state.industry.hasMissedWork) renderMissedWork();
  }

  function renderMissedWork() {
    state.missedWork.callsMissedPerWeek = Number(missedCallsInput.value) || 0;
    state.missedWork.conversionRate = (Number(conversionInput.value) || 0) / 100;
    state.missedWork.averageJobValue = Number(jobValueInput.value) || 0;
    state.figures = computeFigures();
    var mw = state.figures.missedWork;
    missedFigureEl.textContent = mw ? money(mw.missedAnnual) + " a year" : money(0) + " a year";
  }

  [missedCallsInput, conversionInput, jobValueInput].forEach(function (input) {
    input.addEventListener("input", renderMissedWork);
  });

  // Both lead to the same mobile-capture step for now - there is no separate booking flow
  // yet (Screen 5, not built). Revisit once that exists.
  document.getElementById("btn-get-pov").addEventListener("click", function () {
    showScreen("capture");
  });
  document.getElementById("btn-text-estimate").addEventListener("click", function () {
    showScreen("capture");
  });

  // ---- Screen 4: capture ----
  var form = document.getElementById("capture-form");
  var errorEl = document.getElementById("form-error");
  var submitBtn = document.getElementById("btn-submit");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    errorEl.classList.add("hidden");

    var mobile = document.getElementById("input-mobile").value.trim();
    if (!mobile) {
      errorEl.textContent = "Please add a mobile number.";
      errorEl.classList.remove("hidden");
      return;
    }

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
      .then(function () {
        form.classList.add("hidden");
        document.getElementById("screen-thanks").classList.remove("hidden");
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send me my figures";
        errorEl.textContent = "Could not save that just now. Check your connection and try again.";
        errorEl.classList.remove("hidden");
      });
  });
})();
`;
