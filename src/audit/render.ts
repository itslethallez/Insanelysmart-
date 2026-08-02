import type { Vertical } from "./types.js";

/** Prevents the embedded vertical JSON from breaking out of its <script> tag. */
function safeJsonForScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function renderAuditPage(vertical: Vertical): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Find the hidden cost in your business — Insanely Smart</title>
<style>${STYLES}</style>
</head>
<body>
<div class="band top"><span class="wordmark">INSANELY <span class="accent">SMART</span></span></div>

<main class="container">
  <section id="screen-hook">
    <h1>Find the hidden cost in your business.</h1>
    <p class="sub">Answer eight quick questions. See what repetitive work is costing you each week.</p>
    <button type="button" class="btn-primary" id="btn-start">Start the audit, about two minutes</button>
  </section>

  <section id="screen-questions" class="hidden">
    <div class="dots" id="q-dots"></div>
    <button type="button" class="btn-back" id="btn-back">&larr; Back</button>
    <h2 id="q-label"></h2>
    <p class="help" id="q-help"></p>
    <div id="q-options"></div>
  </section>

  <section id="screen-reveal" class="hidden">
    <p class="reveal-eyebrow">The hidden cost, most weeks</p>
    <div class="reveal-figure" id="reveal-figure">$0</div>
    <p class="reveal-caption">in repetitive admin, every week</p>
    <hr class="rule" />
    <ul class="line-items" id="reveal-line-items"></ul>
    <div class="upside-block">
      <h3>Possible upside, not counted above</h3>
      <div class="upside-figure" id="reveal-upside-figure">$0</div>
      <p class="upside-note" id="reveal-upside-note"></p>
    </div>
    <button type="button" class="btn-primary" id="btn-reveal-continue">See what this means</button>
  </section>

  <section id="screen-next" class="hidden">
    <p class="reveal-eyebrow">Your weekly hard cost</p>
    <div class="restated-figure" id="next-hardcost"></div>
    <p class="next-recoverable" id="next-recoverable"></p>
    <hr class="rule" />
    <div class="pov-block">
      <h3>The Proof of Value</h3>
      <p class="pov-price" id="pov-price">From $300, credited in full toward the build.</p>
      <p class="guarantee">If the build doesn't save at least what it costs, you don't pay for it.</p>
      <p class="payback" id="next-payback"></p>
    </div>
    <form id="lead-form">
      <label for="input-name">Your name</label>
      <input type="text" id="input-name" name="name" autocomplete="name" required />
      <label for="input-mobile">Mobile number</label>
      <input type="tel" id="input-mobile" name="mobile" autocomplete="tel" inputmode="tel" required />
      <button type="submit" class="btn-primary" id="btn-submit">Send me my figures</button>
      <p class="form-error hidden" id="form-error"></p>
    </form>
    <div class="hidden" id="screen-thanks">
      <h2>Done.</h2>
      <p class="sub">Your figures are saved. Mick will follow up with your Proof of Value.</p>
    </div>
  </section>
</main>

<div class="band bottom">Insanely Smart &middot; Adelaide</div>

<script>window.__VERTICAL__ = ${safeJsonForScript(vertical)};</script>
<script>${CLIENT_SCRIPT}</script>
</body>
</html>`;
}

const STYLES = `
:root {
  --black:#000000;
  --white:#ffffff;
  --navy:#14213D;
  --body:#454D61;
  --magenta:#DB2777;
  --orange:#FB923C;
  --gradient: linear-gradient(90deg,#38BDF8,#A855F7,#EC4899,#FB923C);
}
* { box-sizing: border-box; }
html, body { margin:0; padding:0; }
body {
  background:var(--white);
  color:var(--body);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.band { background:var(--black); color:var(--white); padding:18px 24px; text-align:center; }
.band.bottom { font-size:12px; opacity:0.7; }
.wordmark { font-weight:800; letter-spacing:0.16em; font-size:14px; text-transform:uppercase; }
.wordmark .accent { background:var(--gradient); -webkit-background-clip:text; background-clip:text; color:transparent; }

.container { max-width:480px; margin:0 auto; padding:32px 20px 56px; }
.hidden { display:none !important; }

h1 { color:var(--navy); font-size:26px; line-height:1.3; margin:0 0 14px; }
h2 { color:var(--navy); font-size:22px; line-height:1.3; margin:8px 0 6px; }
h3 { margin:0; }
p.sub { font-size:16px; line-height:1.5; margin:0 0 32px; }
p.help { font-size:14px; color:var(--body); margin:0 0 20px; }

.rule { height:4px; border:none; border-radius:2px; background:var(--gradient); margin:24px 0; }

.btn-primary {
  display:block; width:100%; padding:18px 20px; border:none; border-radius:12px;
  background:var(--navy); color:var(--white); font-size:17px; font-weight:700;
  cursor:pointer; min-height:56px;
}
.btn-primary:active { transform:scale(0.98); }
.btn-primary:focus-visible { outline:3px solid var(--magenta); outline-offset:2px; }
.btn-primary:disabled { opacity:0.6; }

.btn-back {
  background:none; border:none; color:var(--body); font-size:15px; padding:8px 0 20px;
  cursor:pointer; display:block;
}
.btn-back:focus-visible { outline:3px solid var(--magenta); outline-offset:2px; }

.dots { display:flex; gap:8px; justify-content:center; margin:0 0 24px; }
.dot { width:10px; height:10px; border-radius:50%; background:#E5E7EB; }
.dot.filled { background-image:var(--gradient); }
.dot.current { outline:2px solid var(--magenta); outline-offset:2px; }

.band-option {
  display:block; width:100%; text-align:left; padding:18px 20px; margin-bottom:12px;
  border:2px solid #E5E7EB; border-radius:12px; background:var(--white); color:var(--navy);
  font-size:17px; font-weight:600; cursor:pointer; min-height:56px;
}
.band-option:hover, .band-option:focus-visible { border-color:var(--magenta); }
.band-option:focus-visible { outline:3px solid var(--magenta); outline-offset:2px; }
.band-option:active { background:#FDF2F8; }

.reveal-eyebrow { text-transform:uppercase; letter-spacing:0.08em; font-size:12px; color:var(--body); text-align:center; margin:0 0 8px; }
.reveal-figure { font-size:44px; font-weight:800; color:var(--navy); text-align:center; margin:0 0 4px; }
.reveal-caption { text-align:center; color:var(--body); margin:0; }

.line-items { list-style:none; padding:0; margin:0; }
.line-items li { display:flex; justify-content:space-between; gap:12px; padding:12px 0; border-bottom:1px solid #F0F0F0; font-size:15px; }
.line-items li span:first-child { color:var(--body); }
.line-items li span:last-child { color:var(--navy); font-weight:700; }

.upside-block { border-radius:14px; padding:18px; background:#FFF7ED; margin-top:12px; }
.upside-block h3 { color:var(--orange); font-size:13px; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px; }
.upside-figure { font-size:24px; font-weight:800; color:var(--navy); }
.upside-note { font-size:13px; color:var(--body); margin:8px 0 0; }

.restated-figure { font-size:34px; font-weight:800; color:var(--navy); text-align:center; margin:4px 0; }
.next-recoverable { text-align:center; font-size:15px; margin:0 0 8px; }

.pov-block { border:2px solid #F3E8FF; border-radius:14px; padding:20px; margin:20px 0; }
.pov-price { font-size:18px; font-weight:800; color:var(--magenta); margin:0 0 10px; }
.guarantee { font-size:14px; margin:0 0 14px; }
.payback { font-size:15px; color:var(--navy); font-weight:700; margin:0; }

label { display:block; font-size:14px; font-weight:600; color:var(--navy); margin:0 0 6px; }
input[type=text], input[type=tel] {
  width:100%; padding:16px; border:2px solid #E5E7EB; border-radius:12px; font-size:16px;
  margin:0 0 16px; min-height:52px;
}
input:focus-visible { outline:3px solid var(--magenta); outline-offset:1px; border-color:var(--magenta); }

.form-error { color:#B91C1C; font-size:14px; margin:0 0 14px; }
`;

const CLIENT_SCRIPT = `
(function () {
  "use strict";
  var vertical = window.__VERTICAL__;
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var state = { screen: "hook", questionIndex: 0, answers: {}, figures: null };

  var screens = {
    hook: document.getElementById("screen-hook"),
    questions: document.getElementById("screen-questions"),
    reveal: document.getElementById("screen-reveal"),
    next: document.getElementById("screen-next")
  };

  function showScreen(name) {
    state.screen = name;
    Object.keys(screens).forEach(function (key) {
      screens[key].classList.toggle("hidden", key !== name);
    });
  }

  // Mirrors src/audit/calculate.ts. The server recomputes authoritative
  // figures from the submitted raw answers on save; this copy only drives
  // the instant on-device reveal.
  var ASSUMED_CONVERSION_RATE = 0.3;
  var RECOVERY_RATE_LOW = 0.6;
  var RECOVERY_RATE_HIGH = 0.8;
  var SYSTEM_COST = 5000;

  function round10(amount) { return Math.round(amount / 10) * 10; }

  function computeFigures(answers) {
    var answeredCallsPerDay = Math.max(answers.callsPerDay - answers.missedCallsPerDay, 0);
    var bookingHours = (answeredCallsPerDay * answers.bookingMinutes) / 60 * 5;
    var adminHours = bookingHours + answers.reminderHoursPerWeek + answers.approvalHoursPerWeek;
    var hardCostWeeklyExact = adminHours * answers.hourlyCost;
    var missedRevenueWeekly = round10(answers.missedCallsPerDay * 5 * ASSUMED_CONVERSION_RATE * answers.averageJobValue);

    var recoverableWeekly = {
      low: round10(hardCostWeeklyExact * RECOVERY_RATE_LOW),
      high: round10(hardCostWeeklyExact * RECOVERY_RATE_HIGH)
    };

    var paybackWeeks = null;
    if (hardCostWeeklyExact > 0) {
      paybackWeeks = {
        low: Math.round(SYSTEM_COST / (hardCostWeeklyExact * RECOVERY_RATE_HIGH)),
        high: Math.round(SYSTEM_COST / (hardCostWeeklyExact * RECOVERY_RATE_LOW))
      };
    }

    return {
      bookingHours: bookingHours,
      reminderHours: answers.reminderHoursPerWeek,
      approvalHours: answers.approvalHoursPerWeek,
      adminHours: adminHours,
      hourlyCost: answers.hourlyCost,
      hardCostWeekly: round10(hardCostWeeklyExact),
      recoverableWeekly: recoverableWeekly,
      missedRevenueWeekly: missedRevenueWeekly,
      paybackWeeks: paybackWeeks
    };
  }

  function money(n) { return "$" + Math.round(n).toLocaleString("en-AU"); }
  function moneyRange(range) { return money(range.low) + "\\u2013" + money(range.high); }
  function hrs(n) { return (Math.round(n * 10) / 10) + " hrs/week"; }

  // ---- Screen 1: hook ----
  document.getElementById("btn-start").addEventListener("click", function () {
    state.questionIndex = 0;
    showScreen("questions");
    renderQuestion();
  });

  // ---- Screen 2: questions ----
  var dotsEl = document.getElementById("q-dots");
  var labelEl = document.getElementById("q-label");
  var helpEl = document.getElementById("q-help");
  var optionsEl = document.getElementById("q-options");

  document.getElementById("btn-back").addEventListener("click", function () {
    if (state.questionIndex === 0) {
      showScreen("hook");
      return;
    }
    state.questionIndex -= 1;
    renderQuestion();
  });

  function renderDots() {
    dotsEl.innerHTML = "";
    vertical.questions.forEach(function (_q, i) {
      var dot = document.createElement("span");
      dot.className = "dot" + (i < state.questionIndex ? " filled" : "") + (i === state.questionIndex ? " current" : "");
      dotsEl.appendChild(dot);
    });
  }

  function renderQuestion() {
    var question = vertical.questions[state.questionIndex];
    renderDots();
    labelEl.textContent = question.label;
    helpEl.textContent = question.help || "";
    helpEl.classList.toggle("hidden", !question.help);
    optionsEl.innerHTML = "";
    question.bands.forEach(function (band) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "band-option";
      btn.textContent = band.label;
      btn.addEventListener("click", function () { selectBand(question.id, band.value); });
      optionsEl.appendChild(btn);
    });
  }

  function selectBand(questionId, value) {
    state.answers[questionId] = value;
    if (state.questionIndex < vertical.questions.length - 1) {
      state.questionIndex += 1;
      renderQuestion();
    } else {
      state.figures = computeFigures(state.answers);
      showScreen("reveal");
      renderReveal();
    }
  }

  // ---- Screen 3: reveal ----
  var figureEl = document.getElementById("reveal-figure");
  var lineItemsEl = document.getElementById("reveal-line-items");
  var upsideFigureEl = document.getElementById("reveal-upside-figure");
  var upsideNoteEl = document.getElementById("reveal-upside-note");

  function animateCountUp(el, target, formatFn) {
    if (reducedMotion || target === 0) {
      el.textContent = formatFn(target);
      return;
    }
    var duration = 1200;
    var start = null;
    function step(timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out
      el.textContent = formatFn(Math.round(target * eased));
      if (progress < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  function renderReveal() {
    var f = state.figures;
    animateCountUp(figureEl, f.hardCostWeekly, function (n) { return money(n); });

    lineItemsEl.innerHTML = "";
    var items = [
      ["Taking bookings", f.bookingHours],
      ["Sending reminders", f.reminderHours],
      ["Chasing quote approvals", f.approvalHours]
    ];
    items.forEach(function (item) {
      var li = document.createElement("li");
      var label = document.createElement("span");
      label.textContent = item[0];
      var value = document.createElement("span");
      value.textContent = hrs(item[1]);
      li.appendChild(label);
      li.appendChild(value);
      lineItemsEl.appendChild(li);
    });
    var totalLi = document.createElement("li");
    var totalLabel = document.createElement("span");
    totalLabel.textContent = "Total, at " + money(f.hourlyCost) + "/hr";
    var totalValue = document.createElement("span");
    totalValue.textContent = hrs(f.adminHours);
    totalLi.appendChild(totalLabel);
    totalLi.appendChild(totalValue);
    lineItemsEl.appendChild(totalLi);

    upsideFigureEl.textContent = money(f.missedRevenueWeekly) + " a week";
    upsideNoteEl.textContent = "Assumes about 3 in 10 missed calls would have become a booking at your average job value. Not counted in the hard cost above.";
  }

  document.getElementById("btn-reveal-continue").addEventListener("click", function () {
    showScreen("next");
    renderNext();
  });

  // ---- Screen 4: next step ----
  var nextHardcostEl = document.getElementById("next-hardcost");
  var nextRecoverableEl = document.getElementById("next-recoverable");
  var nextPaybackEl = document.getElementById("next-payback");

  function renderNext() {
    var f = state.figures;
    nextHardcostEl.textContent = money(f.hardCostWeekly) + " a week";
    nextRecoverableEl.textContent = "A system realistically recovers " + moneyRange(f.recoverableWeekly) + " a week of that.";
    nextPaybackEl.textContent = f.paybackWeeks
      ? "Payback in about " + f.paybackWeeks.low + " to " + f.paybackWeeks.high + " weeks."
      : "";
  }

  // ---- Submit ----
  var form = document.getElementById("lead-form");
  var errorEl = document.getElementById("form-error");
  var submitBtn = document.getElementById("btn-submit");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    errorEl.classList.add("hidden");

    var name = document.getElementById("input-name").value.trim();
    var mobile = document.getElementById("input-mobile").value.trim();

    if (!name || !mobile) {
      errorEl.textContent = "Please add your name and mobile number.";
      errorEl.classList.remove("hidden");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    fetch("/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name,
        mobile: mobile,
        vertical: vertical.key,
        answers: state.answers
      })
    })
      .then(function (res) {
        if (!res.ok) throw new Error("save-failed");
        form.classList.add("hidden");
        document.getElementById("screen-thanks").classList.remove("hidden");
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send me my figures";
        errorEl.textContent = "Couldn't save that just now. Check your connection and try again.";
        errorEl.classList.remove("hidden");
      });
  });
})();
`;
