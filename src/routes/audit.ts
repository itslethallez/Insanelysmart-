import { Router } from "express";

export const auditRouter = Router();

auditRouter.get("/", (_req, res) => {
  res.type("html").send(String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Automation ROI Calculator | Insanely Smart</title>
  <style>
    :root { --black:#000; --white:#fff; --navy:#14213d; --body:#454d61; --line:#c4c8d0; --soft:#f7f8fb; --gradient:linear-gradient(90deg,#38bdf8,#a855f7,#ec4899,#fb923c); --shadow:0 4px 18px rgba(20,33,61,.08); }
    * { box-sizing:border-box; }
    html { scroll-behavior:smooth; }
    body { margin:0; background:var(--white); color:var(--body); font-family:Arial,Helvetica,sans-serif; -webkit-font-smoothing:antialiased; }
    .band { background:var(--black); text-align:center; padding:16px 24px; }
    .logo { display:block; width:auto; height:92px; margin:auto; }
    .hero { padding:42px 24px 48px; text-align:center; background:var(--black); color:var(--white); }
    .eyebrow { margin:0 0 12px; color:#c7cbd6; font-size:12px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }
    h1 { max-width:780px; margin:0 auto 14px; font-size:clamp(32px,6vw,52px); line-height:1.05; letter-spacing:-.035em; }
    .hero p { max-width:600px; margin:0 auto; color:#c7cbd6; font-size:17px; line-height:1.55; }
    main { width:min(100% - 32px, 1060px); margin:0 auto; padding:40px 0 64px; }
    .intro { max-width:680px; margin:0 auto 30px; text-align:center; }
    .intro h2 { color:var(--navy); margin:0 0 10px; font-size:26px; }
    .intro p { margin:0; font-size:16px; line-height:1.55; }
    .calculator { display:grid; grid-template-columns:minmax(0,1.15fr) minmax(300px,.85fr); align-items:start; gap:24px; }
    .panel, .results { border:1px solid var(--line); border-radius:20px; background:var(--white); box-shadow:var(--shadow); }
    .panel { padding:28px; }
    .section + .section { margin-top:28px; padding-top:28px; border-top:1px solid var(--line); }
    .section h2 { color:var(--navy); margin:0 0 8px; font-size:20px; }
    .section h2::after { content:""; display:block; width:46px; height:3px; margin-top:9px; border-radius:2px; background:var(--gradient); }
    .section > p { margin:0 0 18px; font-size:14px; line-height:1.5; }
    .field-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }
    .field-grid.two { grid-template-columns:repeat(2,minmax(0,1fr)); }
    label { display:block; color:var(--navy); font-size:13px; font-weight:700; line-height:1.35; }
    input[type=number] { width:100%; min-height:48px; margin-top:8px; padding:12px; border:2px solid var(--line); border-radius:11px; color:var(--navy); font:inherit; font-size:16px; }
    input:focus-visible { outline:3px solid #ec4899; outline-offset:2px; }
    .range-field { margin-top:18px; }
    .range-head { display:flex; justify-content:space-between; align-items:center; gap:12px; }
    output { color:var(--navy); font-size:15px; font-weight:800; font-variant-numeric:tabular-nums; white-space:nowrap; }
    input[type=range] { width:100%; height:8px; margin:13px 0 0; appearance:none; border-radius:99px; background:var(--gradient); cursor:pointer; }
    input[type=range]::-webkit-slider-thumb { width:24px; height:24px; appearance:none; border:3px solid var(--navy); border-radius:50%; background:var(--white); }
    input[type=range]::-moz-range-thumb { width:20px; height:20px; border:3px solid var(--navy); border-radius:50%; background:var(--white); }
    .help { margin:7px 0 0; font-size:12px; line-height:1.45; }
    .results { position:sticky; top:18px; overflow:hidden; }
    .result-top { padding:28px; color:var(--white); text-align:center; background:var(--black); }
    .result-top .eyebrow { color:#c7cbd6; }
    .result-number { margin:0; font-size:clamp(44px,6vw,62px); font-weight:800; line-height:1; letter-spacing:-.045em; font-variant-numeric:tabular-nums; background:var(--gradient); -webkit-background-clip:text; background-clip:text; color:transparent; }
    .result-top p:last-child { margin:12px 0 0; color:#c7cbd6; font-size:14px; line-height:1.45; }
    .metric-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:1px; background:var(--line); border-top:1px solid var(--line); }
    .metric { min-height:112px; padding:20px; background:var(--white); }
    .metric span { display:block; font-size:12px; line-height:1.35; }
    .metric strong { display:block; margin-top:8px; color:var(--navy); font-size:23px; font-variant-numeric:tabular-nums; }
    .breakdown { padding:22px 28px 28px; }
    .breakdown h3 { margin:0 0 12px; color:var(--navy); font-size:15px; }
    .breakdown-row { display:flex; justify-content:space-between; gap:14px; padding:10px 0; border-top:1px solid #e8e9ed; font-size:13px; }
    .breakdown-row strong { color:var(--navy); white-space:nowrap; font-variant-numeric:tabular-nums; }
    .payback { margin:18px 0 0; padding:14px; border-radius:12px; background:linear-gradient(135deg,#eff6ff,#f5f0ff); color:var(--navy); font-size:14px; font-weight:700; text-align:center; }
    .note { margin:20px auto 0; max-width:720px; color:var(--body); font-size:12px; line-height:1.55; text-align:center; }
    .band.bottom { padding:17px 24px; color:#c7cbd6; font-size:12px; }
    @media (max-width:760px) { .logo { height:74px; } .hero { padding:32px 20px 38px; } main { width:min(100% - 24px, 1060px); padding-top:28px; } .calculator { grid-template-columns:1fr; } .results { position:static; order:-1; } .panel { padding:22px; } .field-grid, .field-grid.two { grid-template-columns:1fr; } }
    @media (prefers-reduced-motion:reduce) { html { scroll-behavior:auto; } }
  </style>
</head>
<body>
  <header>
    <div class="band"><img class="logo" src="https://insanelysmart-insanelysmart.vercel.app/logo-transparent.webp" alt="Insanely Smart"></div>
    <div class="hero">
      <p class="eyebrow">Automation ROI calculator</p>
      <h1>See what manual follow-up is costing your business.</h1>
      <p>Use a few practical assumptions to estimate the revenue and profit a reliable automation system could recover.</p>
    </div>
  </header>
  <main>
    <div class="intro">
      <h2>A conservative estimate, in real numbers.</h2>
      <p>Adjust the figures to match your business. Your estimate updates as you go.</p>
    </div>
    <div class="calculator">
      <form class="panel" id="calculator" onsubmit="return false">
        <section class="section">
          <h2>Your work</h2>
          <p>Set the value of a typical completed job and how much work moves through the business.</p>
          <div class="field-grid">
            <label>Average hourly labour rate (AUD)<input id="hourly" type="number" value="85" min="10" step="1"></label>
            <label>Average job duration (hours)<input id="jobHours" type="number" value="2" min="0.25" step="0.25"></label>
            <label>Jobs per week<input id="jobsWeek" type="number" value="10" min="1" step="1"></label>
          </div>
        </section>
        <section class="section">
          <h2>Missed calls</h2>
          <p>Estimate the opportunity when enquiries receive a prompt response instead of a late one.</p>
          <div class="range-field"><div class="range-head"><label for="missedPct">Inbound calls missed</label><output id="missedPctOut"></output></div><input id="missedPct" type="range" min="0" max="80" value="20"></div>
          <div class="range-field"><div class="range-head"><label for="convFast">Conversion when followed up within an hour</label><output id="convFastOut"></output></div><input id="convFast" type="range" min="0" max="100" value="40"></div>
          <div class="range-field"><div class="range-head"><label for="convLate">Conversion when followed up late or not at all</label><output id="convLateOut"></output></div><input id="convLate" type="range" min="0" max="100" value="5"></div>
        </section>
        <section class="section">
          <h2>Quotes and appointments</h2>
          <p>Include the follow-up and reminder gaps that stop good work from becoming booked work.</p>
          <div class="field-grid two">
            <label>Quotes issued per week<input id="quotesWeek" type="number" value="5" min="0" step="1"></label>
            <label>One-time setup fee (AUD)<input id="setupFee" type="number" value="299" min="0" step="1"></label>
          </div>
          <div class="range-field"><div class="range-head"><label for="quotesNotFollow">Quotes not currently followed up</label><output id="quotesNotFollowOut"></output></div><input id="quotesNotFollow" type="range" min="0" max="100" value="50"></div>
          <div class="range-field"><div class="range-head"><label for="quoteUplift">Conversion uplift from automated quote follow-up</label><output id="quoteUpliftOut"></output></div><input id="quoteUplift" type="range" min="0" max="50" value="15"></div>
          <div class="range-field"><div class="range-head"><label for="noShow">Appointment no-show rate</label><output id="noShowOut"></output></div><input id="noShow" type="range" min="0" max="50" value="8"></div>
          <div class="range-field"><div class="range-head"><label for="noShowReduction">No-show reduction with reminders</label><output id="noShowReductionOut"></output></div><input id="noShowReduction" type="range" min="0" max="100" value="50"></div>
        </section>
        <section class="section">
          <h2>System costs</h2>
          <p>Payback uses estimated gross profit after the monthly subscription.</p>
          <div class="field-grid two">
            <label>Monthly subscription (AUD)<input id="monthlyFee" type="number" value="79" min="0" step="1"></label>
            <div class="range-field" style="margin-top:0"><div class="range-head"><label for="margin">Gross margin on recovered revenue</label><output id="marginOut"></output></div><input id="margin" type="range" min="10" max="100" value="60"></div>
          </div>
        </section>
      </form>
      <aside class="results" aria-live="polite">
        <div class="result-top">
          <p class="eyebrow">Estimated annual recovered revenue</p>
          <p class="result-number" id="annual">$0</p>
          <p>From faster call responses, quote follow-up, and appointment reminders.</p>
        </div>
        <div class="metric-grid">
          <div class="metric"><span>Weekly recovered revenue</span><strong id="weekly">$0</strong></div>
          <div class="metric"><span>Monthly recovered revenue</span><strong id="monthly">$0</strong></div>
          <div class="metric"><span>Recovered gross profit / month</span><strong id="profit">$0</strong></div>
          <div class="metric"><span>Setup payback</span><strong id="payback">-</strong></div>
        </div>
        <div class="breakdown">
          <h3>Where the estimate comes from</h3>
          <div class="breakdown-row"><span>Fast missed-call follow-up</span><strong id="calls">$0/wk</strong></div>
          <div class="breakdown-row"><span>Automated quote follow-up</span><strong id="quotes">$0/wk</strong></div>
          <div class="breakdown-row"><span>Fewer appointment no-shows</span><strong id="noShows">$0/wk</strong></div>
          <p class="payback" id="paybackNote">Enter your figures to see the expected payback period.</p>
        </div>
      </aside>
    </div>
    <p class="note">This calculator is an indicative estimate, not a guarantee. It applies your selected conversion and margin assumptions to the supplied weekly workload; actual results depend on your offer, capacity, and follow-up process.</p>
  </main>
  <footer class="band bottom">Insanely Smart. Adelaide, South Australia.</footer>
  <script>
    (function () {
      var ids = ["hourly","jobHours","jobsWeek","missedPct","convFast","convLate","quotesWeek","quotesNotFollow","quoteUplift","noShow","noShowReduction","setupFee","monthlyFee","margin"];
      var sliderOutputs = { missedPct:"%", convFast:"%", convLate:"%", quotesNotFollow:"%", quoteUplift:" percentage points", noShow:"%", noShowReduction:"%", margin:"%" };
      var byId = function (id) { return document.getElementById(id); };
      var number = function (id) { return Math.max(0, Number(byId(id).value) || 0); };
      var money = function (value) { return "$" + Math.round(value).toLocaleString("en-AU"); };
      function calculate() {
        var hourly = number("hourly");
        var jobHours = number("jobHours");
        var jobsWeek = number("jobsWeek");
        var revenuePerJob = hourly * jobHours;
        var missedRate = number("missedPct") / 100;
        var fastConversion = number("convFast") / 100;
        var lateConversion = number("convLate") / 100;
        var quotesWeek = number("quotesWeek");
        var quotesNotFollowed = number("quotesNotFollow") / 100;
        var quoteUplift = number("quoteUplift") / 100;
        var noShowRate = number("noShow") / 100;
        var noShowReduction = number("noShowReduction") / 100;
        var monthlyFee = number("monthlyFee");
        var margin = number("margin") / 100;
        var missedCallRevenue = jobsWeek * missedRate * Math.max(0, fastConversion - lateConversion) * revenuePerJob;
        var quoteRevenue = quotesWeek * quotesNotFollowed * quoteUplift * revenuePerJob;
        var noShowRevenue = jobsWeek * noShowRate * noShowReduction * revenuePerJob;
        var weekly = missedCallRevenue + quoteRevenue + noShowRevenue;
        var monthly = weekly * 4.333;
        var annual = weekly * 52;
        var monthlyProfit = monthly * margin - monthlyFee;
        var setupFee = number("setupFee");
        var days = monthlyProfit > 0 ? Math.max(1, Math.round(setupFee / monthlyProfit * 30)) : null;
        byId("weekly").textContent = money(weekly);
        byId("monthly").textContent = money(monthly);
        byId("annual").textContent = money(annual);
        byId("profit").textContent = money(Math.max(0, monthlyProfit));
        byId("payback").textContent = days === null ? "-" : days + " days";
        byId("calls").textContent = money(missedCallRevenue) + "/wk";
        byId("quotes").textContent = money(quoteRevenue) + "/wk";
        byId("noShows").textContent = money(noShowRevenue) + "/wk";
        byId("paybackNote").textContent = days === null ? "The selected subscription exceeds estimated monthly gross profit." : "Your " + money(setupFee) + " setup fee pays back in about " + days + " days.";
      }
      Object.keys(sliderOutputs).forEach(function (id) {
        var updateOutput = function () { byId(id + "Out").textContent = byId(id).value + sliderOutputs[id]; };
        byId(id).addEventListener("input", updateOutput);
        updateOutput();
      });
      ids.forEach(function (id) { byId(id).addEventListener("input", calculate); });
      calculate();
    }());
  </script>
</body>
</html>`);
});
