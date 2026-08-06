import { STYLES } from "./styles.js";
import { TASK_CARDS } from "./types.js";
import {
  HOURLY_RATE_MIN,
  HOURLY_RATE_MAX,
  HOURLY_RATE_STEP,
  HOURLY_RATE_DEFAULT,
  WORKER_COUNT_MIN,
  WORKER_COUNT_MAX,
  WORKER_COUNT_DEFAULT,
  JOBS_PER_WEEK_MIN,
  JOBS_PER_WEEK_MAX,
  JOBS_PER_WEEK_DEFAULT,
  AVERAGE_JOB_VALUE_MIN,
  AVERAGE_JOB_VALUE_MAX,
  AVERAGE_JOB_VALUE_STEP,
  AVERAGE_JOB_VALUE_DEFAULT,
  HOURS_MIN,
  HOURS_MAX,
  HOURS_STEP,
  HOURS_DEFAULT,
  OPPORTUNITY_MESSAGE_TEXT,
} from "./calculate.js";

/** Prevents the embedded JSON from breaking out of its <script> tag. */
function safeJsonForScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function renderAuditPage(): string {
  const config = {
    hourlyRate: { min: HOURLY_RATE_MIN, max: HOURLY_RATE_MAX, step: HOURLY_RATE_STEP, default: HOURLY_RATE_DEFAULT },
    workerCount: { min: WORKER_COUNT_MIN, max: WORKER_COUNT_MAX, default: WORKER_COUNT_DEFAULT },
    jobsPerWeek: { min: JOBS_PER_WEEK_MIN, max: JOBS_PER_WEEK_MAX, default: JOBS_PER_WEEK_DEFAULT },
    averageJobValue: { min: AVERAGE_JOB_VALUE_MIN, max: AVERAGE_JOB_VALUE_MAX, step: AVERAGE_JOB_VALUE_STEP, default: AVERAGE_JOB_VALUE_DEFAULT },
    hours: { min: HOURS_MIN, max: HOURS_MAX, step: HOURS_STEP, default: HOURS_DEFAULT },
    taskCards: TASK_CARDS,
    opportunityMessages: OPPORTUNITY_MESSAGE_TEXT,
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
  <h1>See what admin time costs your workshop.</h1>
  <p class="sub">A few practical questions, about two minutes, a factual result at the end.</p>
</div>

<main class="container">

  <section class="step-card wizard-screen" id="screen-lead">
    <p class="step-eyebrow">Your details</p>
    <label for="input-fullname">Full name</label>
    <input type="text" id="input-fullname" autocomplete="name" required />
    <label for="input-phone">Phone number</label>
    <input type="tel" id="input-phone" autocomplete="tel" inputmode="tel" required />
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

    <label for="input-worker-count">How many workers/mechanics do you have?</label>
    <input type="number" id="input-worker-count" inputmode="numeric" min="1" />

    <label for="input-jobs-week">How many jobs do you complete per week?</label>
    <input type="number" id="input-jobs-week" inputmode="numeric" min="0" />

    <label for="input-avg-job-value">What is the average job value?</label>
    <input type="number" id="input-avg-job-value" inputmode="decimal" min="0" />

    <button type="button" class="btn-primary" id="btn-snapshot-continue">Continue</button>
    <p class="form-error hidden" id="snapshot-error"></p>
  </section>

  <div id="task-screens"></div>

  <section class="wizard-screen hidden" id="screen-results">
    <div id="results-loading">
      <p class="sub" style="text-align:center;">Working out your numbers...</p>
    </div>
    <div class="hidden" id="results-content">

      <!-- Display order below follows the build spec exactly: total hours/week, annual hours,
           weekly cost, annual cost, task breakdown, opportunity flags, summary, CTA. -->
      <div class="tile"><p class="tile-label">Total admin hours per week</p><p class="tile-value" id="tile-weekly-hours">0 hrs</p></div>
      <div class="tile"><p class="tile-label">Annual admin hours</p><p class="tile-value" id="tile-annual-hours">0 hrs</p></div>
      <div class="tile"><p class="tile-label">Weekly admin cost</p><p class="tile-value" id="tile-weekly-cost">$0</p></div>

      <div class="bleed-card">
        <p class="bleed-eyebrow">Annual admin cost</p>
        <div class="bleed-number" id="tile-annual-cost">$0</div>
        <p class="bleed-caption" id="tile-annual-hours-caption"></p>
      </div>

      <div class="result-card" id="breakdown-card">
        <p class="step-eyebrow">Task-by-task breakdown</p>
        <div id="task-breakdown-list"></div>
      </div>

      <div id="opportunity-flags"></div>

      <div class="result-card" id="charlie-card">
        <p class="step-eyebrow">Summary</p>
        <p class="sub" id="charlie-summary" style="margin-bottom:0;"></p>
      </div>

      <button type="button" class="btn-primary" id="btn-book-review">Book a workshop review</button>
      <p class="form-error hidden" id="save-error"></p>
    </div>
  </section>

  <section class="wizard-screen hidden" id="screen-book">
    <div id="book-form">
      <h2>Book a workshop review</h2>
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
    lead: { fullName: "", phoneNumber: "", companyName: "" },
    hourlyRate: config.hourlyRate.default,
    workerCount: config.workerCount.default,
    jobsPerWeek: config.jobsPerWeek.default,
    averageJobValue: config.averageJobValue.default,
    taskAnswers: {}, // key -> { enabled: bool, hours: number }
    publicToken: null,
    savePromise: null,
    figures: null
  };

  function money(n) { return "$" + Math.round(n).toLocaleString("en-AU"); }
  function hrs(n) { return (Math.round(n * 10) / 10) + " hrs"; }

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
  var phoneInput = document.getElementById("input-phone");
  var companyInput = document.getElementById("input-company");
  var btnLeadContinue = document.getElementById("btn-lead-continue");

  function updateLeadContinueEnabled() {
    btnLeadContinue.disabled = !(fullNameInput.value.trim() && phoneInput.value.trim() && companyInput.value.trim());
  }
  [fullNameInput, phoneInput, companyInput].forEach(function (el) {
    el.addEventListener("input", updateLeadContinueEnabled);
  });

  btnLeadContinue.addEventListener("click", function () {
    state.lead.fullName = fullNameInput.value.trim();
    state.lead.phoneNumber = phoneInput.value.trim();
    state.lead.companyName = companyInput.value.trim();

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
  var workerCountInput = document.getElementById("input-worker-count");
  var jobsWeekInput = document.getElementById("input-jobs-week");
  var avgJobValueInput = document.getElementById("input-avg-job-value");
  var snapshotErrorEl = document.getElementById("snapshot-error");

  hourlyRateInput.value = config.hourlyRate.default;
  workerCountInput.value = config.workerCount.default;
  jobsWeekInput.value = config.jobsPerWeek.default;
  avgJobValueInput.value = config.averageJobValue.default;

  document.getElementById("btn-snapshot-continue").addEventListener("click", function () {
    var hourlyRate = Number(hourlyRateInput.value);
    var workerCount = Number(workerCountInput.value);
    var jobsPerWeek = Number(jobsWeekInput.value);
    var averageJobValue = Number(avgJobValueInput.value);

    if (!isFinite(hourlyRate) || !isFinite(workerCount) || !isFinite(jobsPerWeek) || !isFinite(averageJobValue) ||
        hourlyRate < 0 || workerCount < 1 || jobsPerWeek < 0 || averageJobValue < 0) {
      snapshotErrorEl.textContent = "Please fill in every field with a valid number.";
      snapshotErrorEl.classList.remove("hidden");
      return;
    }
    snapshotErrorEl.classList.add("hidden");
    state.hourlyRate = hourlyRate;
    state.workerCount = workerCount;
    state.jobsPerWeek = jobsPerWeek;
    state.averageJobValue = averageJobValue;
    goNext();
  });

  // ---- Task card screens, built from config.taskCards - uniform enabled/hours pattern for all ten ----
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
    eyebrow.textContent = "Admin tasks";
    section.appendChild(eyebrow);

    var question = document.createElement("h2");
    question.textContent = card.question;
    section.appendChild(question);

    var yesnoRow = document.createElement("div");
    yesnoRow.className = "yesno-row";
    var yesBtn = document.createElement("button");
    yesBtn.type = "button";
    yesBtn.className = "yesno-btn";
    yesBtn.textContent = "Yes";
    var noBtn = document.createElement("button");
    noBtn.type = "button";
    noBtn.className = "yesno-btn";
    noBtn.textContent = "No";
    yesnoRow.appendChild(yesBtn);
    yesnoRow.appendChild(noBtn);
    section.appendChild(yesnoRow);

    var hoursWrap = document.createElement("div");
    hoursWrap.className = "hidden";
    hoursWrap.style.marginTop = "16px";
    var hoursLabel = document.createElement("label");
    hoursLabel.textContent = "Hours per week";
    hoursWrap.appendChild(hoursLabel);
    var sliderRow = document.createElement("div");
    sliderRow.className = "slider-row";
    var hoursSlider = document.createElement("input");
    hoursSlider.type = "range";
    hoursSlider.min = config.hours.min;
    hoursSlider.max = config.hours.max;
    hoursSlider.step = config.hours.step;
    hoursSlider.value = config.hours.default;
    var hoursOutput = document.createElement("output");
    hoursOutput.textContent = hrs(config.hours.default);
    sliderRow.appendChild(hoursSlider);
    sliderRow.appendChild(hoursOutput);
    hoursWrap.appendChild(sliderRow);
    section.appendChild(hoursWrap);

    var nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "btn-primary";
    nextBtn.textContent = "Next";
    nextBtn.disabled = true; // requires an explicit Yes/No choice
    section.appendChild(nextBtn);

    function selectEnabled(isEnabled) {
      yesBtn.classList.toggle("selected", isEnabled);
      noBtn.classList.toggle("selected", !isEnabled);
      hoursWrap.classList.toggle("hidden", !isEnabled);
      nextBtn.disabled = false;
      state.taskAnswers[card.key] = { enabled: isEnabled, hours: isEnabled ? Number(hoursSlider.value) : 0 };
    }
    yesBtn.addEventListener("click", function () { selectEnabled(true); });
    noBtn.addEventListener("click", function () { selectEnabled(false); });
    hoursSlider.addEventListener("input", function () {
      hoursOutput.textContent = hrs(Number(hoursSlider.value));
      if (state.taskAnswers[card.key]) state.taskAnswers[card.key].hours = Number(hoursSlider.value);
    });

    nextBtn.addEventListener("click", function () {
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
    var taskBreakdown = config.taskCards.map(function (card) {
      var a = state.taskAnswers[card.key];
      var h = (a && a.enabled) ? a.hours : 0;
      return { key: card.key, task: card.label, hours: h, weeklyCost: h * state.hourlyRate };
    });

    var totalAdminHoursPerWeek = 0;
    taskBreakdown.forEach(function (t) { totalAdminHoursPerWeek += t.hours; });
    var weeklyAdminCost = totalAdminHoursPerWeek * state.hourlyRate;
    var annualAdminCost = weeklyAdminCost * 48;
    var annualAdminHours = totalAdminHoursPerWeek * 48;

    var opportunityFlags = {
      serviceReminders: !(state.taskAnswers.serviceReminders && state.taskAnswers.serviceReminders.enabled),
      quoteFollowUp: !(state.taskAnswers.quoteFollowUp && state.taskAnswers.quoteFollowUp.enabled)
    };

    var topTasks = taskBreakdown
      .filter(function (t) { return t.hours > 0; })
      .sort(function (a, b) { return b.hours - a.hours; })
      .slice(0, 3)
      .map(function (t) { return t.task.toLowerCase(); });

    function formatTaskList(labels) {
      if (labels.length === 0) return "";
      if (labels.length === 1) return labels[0];
      if (labels.length === 2) return labels[0] + " and " + labels[1];
      return labels.slice(0, -1).join(", ") + ", and " + labels[labels.length - 1];
    }

    var sentences = [];
    if (topTasks.length > 0) {
      sentences.push("Based on your answers, the largest admin time drains are " + formatTaskList(topTasks) + ".");
    }
    sentences.push("You are currently spending approximately " + totalAdminHoursPerWeek + " hours per week on admin tasks, which is around " + annualAdminHours + " hours per year.");
    sentences.push("At your labour rate, that is costing approximately " + money(weeklyAdminCost) + " per week or " + money(annualAdminCost) + " per year.");
    if (opportunityFlags.serviceReminders || opportunityFlags.quoteFollowUp) {
      sentences.push("There may also be additional opportunities in areas such as service reminders or quote follow-up if those processes are not currently automated.");
    }

    return {
      taskBreakdown: taskBreakdown,
      totalAdminHoursPerWeek: totalAdminHoursPerWeek,
      annualAdminHours: annualAdminHours,
      weeklyAdminCost: weeklyAdminCost,
      annualAdminCost: annualAdminCost,
      opportunityFlags: opportunityFlags,
      charlieSummary: sentences.join(" ")
    };
  }

  function renderResults() {
    var f = state.figures;

    document.getElementById("tile-annual-cost").classList.remove("animate-in");
    if (!reducedMotion) {
      void document.getElementById("tile-annual-cost").offsetWidth;
      document.getElementById("tile-annual-cost").classList.add("animate-in");
    }
    document.getElementById("tile-annual-cost").textContent = money(f.annualAdminCost);
    document.getElementById("tile-annual-hours-caption").textContent = "a year, on admin tasks";

    document.getElementById("tile-weekly-hours").textContent = hrs(f.totalAdminHoursPerWeek);
    document.getElementById("tile-annual-hours").textContent = hrs(f.annualAdminHours);
    document.getElementById("tile-weekly-cost").textContent = money(f.weeklyAdminCost);

    var listEl = document.getElementById("task-breakdown-list");
    listEl.innerHTML = "";
    f.taskBreakdown.forEach(function (t) {
      var row = document.createElement("div");
      row.className = "stat-row";
      var label = document.createElement("span");
      label.textContent = t.task;
      var value = document.createElement("span");
      value.textContent = hrs(t.hours) + " / " + money(t.weeklyCost) + " wk";
      row.appendChild(label);
      row.appendChild(value);
      listEl.appendChild(row);
    });

    var flagsEl = document.getElementById("opportunity-flags");
    flagsEl.innerHTML = "";
    if (f.opportunityFlags.serviceReminders) {
      var box1 = document.createElement("div");
      box1.className = "info-box";
      var p1 = document.createElement("p");
      p1.textContent = config.opportunityMessages.serviceReminders;
      box1.appendChild(p1);
      flagsEl.appendChild(box1);
    }
    if (f.opportunityFlags.quoteFollowUp) {
      var box2 = document.createElement("div");
      box2.className = "info-box";
      var p2 = document.createElement("p");
      p2.textContent = config.opportunityMessages.quoteFollowUp;
      box2.appendChild(p2);
      flagsEl.appendChild(box2);
    }

    document.getElementById("charlie-summary").textContent = f.charlieSummary;

    document.getElementById("results-loading").classList.add("hidden");
    document.getElementById("results-content").classList.remove("hidden");
  }

  function runCalculation() {
    state.figures = computeFigures();
    renderResults();

    var taskHoursPayload = [];
    Object.keys(state.taskAnswers).forEach(function (key) {
      var a = state.taskAnswers[key];
      if (a.enabled && a.hours > 0) taskHoursPayload.push({ key: key, hours: a.hours });
    });

    var saveErrorEl = document.getElementById("save-error");
    state.savePromise = fetch("/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead: state.lead,
        hourlyRate: state.hourlyRate,
        workerCount: state.workerCount,
        jobsPerWeek: state.jobsPerWeek,
        averageJobValue: state.averageJobValue,
        taskHours: taskHoursPayload
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
        saveErrorEl.textContent = "Your results are shown above, but I could not save them just now. Booking below will retry.";
        saveErrorEl.classList.remove("hidden");
        throw err;
      });
  }

  // ---- Booking: "Book a workshop review" ----
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
