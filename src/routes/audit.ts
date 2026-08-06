import { Router } from "express";
import { getIndustry } from "../audit/industries/index.js";
import { saveAuditResult, sendAuditTextBack, recordCallOutcome, bookProofOfValueCall } from "../services/audit.js";
import { OUTCOME_VALUES, type AuditInputs, type MissedWorkInputs, type OutcomeValue, type TaskHoursEntry } from "../audit/calculate.js";
import { getCuratedAuditSlots, getLaterAuditSlots, type Slot } from "../services/availability.js";
import { formatSlot } from "../services/aiReply.js";
import { sendSms } from "../services/sms/index.js";

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
    input[type=number], input[type=tel], select { width:100%; min-height:48px; margin-top:8px; padding:12px; border:2px solid var(--line); border-radius:11px; color:var(--navy); font:inherit; font-size:16px; background:#fff; }
    input:focus-visible, select:focus-visible { outline:3px solid #ec4899; outline-offset:2px; }
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
    .industry-defaults { margin-top:18px; padding:18px; border:1px solid var(--line); border-radius:14px; background:var(--soft); }
    .industry-defaults h3 { margin:0 0 10px; color:var(--navy); font-size:15px; }
    .default-list { display:grid; grid-template-columns:1fr auto; gap:9px 16px; margin:0; font-size:13px; }
    .default-list dt { color:var(--body); } .default-list dd { margin:0; color:var(--navy); font-weight:800; }
    .text-button { padding:0; border:0; background:none; color:#7c3aed; font:inherit; font-size:13px; font-weight:700; text-decoration:underline; cursor:pointer; }
    .cta-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:24px; }
    .button { min-height:52px; padding:12px 16px; border:0; border-radius:999px; background:var(--gradient); color:#fff; font:inherit; font-weight:800; cursor:pointer; }
    .button.secondary { border:2px solid var(--navy); background:#fff; color:var(--navy); }
    .demo-status { min-height:18px; margin:10px 0 0; font-size:12px; text-align:center; }
    .formula { padding:12px 0; border-top:1px solid #e8e9ed; font-size:12px; line-height:1.5; }
    .formula code { color:var(--navy); font-family:ui-monospace,SFMono-Regular,Consolas,monospace; font-weight:700; }
    .example { margin-top:20px; padding:16px; border-radius:14px; background:linear-gradient(135deg,#eff6ff,#f5f0ff); font-size:13px; line-height:1.5; }
    .modal { position:fixed; inset:0; z-index:5; display:none; align-items:center; justify-content:center; padding:20px; background:rgba(0,0,0,.52); }
    .modal.open { display:flex; } .modal-card { width:min(100%,620px); max-height:90vh; overflow:auto; padding:28px; border-radius:20px; background:#fff; box-shadow:0 20px 60px rgba(0,0,0,.25); }
    .modal-head { display:flex; justify-content:space-between; gap:20px; align-items:flex-start; } .modal h2 { margin:0; color:var(--navy); font-size:23px; } .close { border:0; background:none; color:var(--navy); font-size:28px; cursor:pointer; }
    .source-list { margin:18px 0 0; padding-left:20px; } .source-list li { margin:10px 0; font-size:14px; line-height:1.4; } .source-list a { color:#7c3aed; }
    .pricing-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:20px; } .price-plan { padding:16px; border:1px solid var(--line); border-radius:14px; } .price-plan.featured { border:2px solid #a855f7; } .price-plan h3 { margin:0; color:var(--navy); } .price-plan p { margin:8px 0; font-size:13px; line-height:1.4; } .price-plan strong { color:var(--navy); font-size:20px; }
    @media (max-width:760px) { .logo { height:74px; } .hero { padding:32px 20px 38px; } main { width:min(100% - 24px, 1060px); padding-top:28px; } .calculator { grid-template-columns:1fr; } .results { position:static; order:-1; } .panel { padding:22px; } .field-grid, .field-grid.two, .pricing-grid { grid-template-columns:1fr; } .cta-row { grid-template-columns:1fr; } }
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
          <h2>Industry defaults</h2>
          <p>These conservative mechanic benchmarks are fixed for this estimate.</p>
          <div class="industry-defaults">
            <h3>Mechanic <span style="font-weight:400;color:var(--body)">Industry Default</span></h3>
            <dl class="default-list">
              <dt>Inbound calls missed</dt><dd>20%</dd><dt>Follow-up within 1 hour</dt><dd>40%</dd><dt>Late or no follow-up</dt><dd>5%</dd><dt>Quotes not followed up</dt><dd>50%</dd><dt>Quote conversion uplift</dt><dd>+15 pts</dd><dt>Appointment no-show rate</dt><dd>8%</dd><dt>No-show reduction with reminders</dt><dd>50%</dd>
            </dl>
            <button class="text-button" type="button" id="why-defaults">Why these defaults? View sources</button>
          </div>
        </section>
        <section class="section">
          <h2>Demo and pricing</h2>
          <p>Select the plan you are considering. Pricing stays read-only; the modal shows its prefilled net-profit calculation.</p>
          <div class="field-grid two">
            <label>Phone number for demo (optional)<input id="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="e.g. 0400 000 000"></label>
            <label>Plan interest<select id="planSelect"><option value="starter">Starter — $299 setup / $79 per month</option><option value="growth">Growth — $599 setup / $249 per month</option><option value="pro">Pro — $1,499 setup / $599 per month</option></select></label>
          </div>
          <p class="help">The demo sends an SMS summary when your live SMS provider is configured.</p>
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
          <div class="metric"><span>Monthly profit, selected plan</span><strong id="profit">$0</strong></div>
          <div class="metric"><span>Selected-plan setup payback</span><strong id="payback">-</strong></div>
        </div>
        <div class="breakdown">
          <h3>Formula breakdown</h3>
          <div class="formula"><code>revenue_per_job = hourly_rate · job_hours</code> <span id="revenuePerJob"></span></div>
          <div class="formula"><code>missed_calls_jobs = jobs_per_week · missed_call_pct</code> <span id="missedCallsJobs"></span></div>
          <div class="formula"><code>recovered_jobs = missed_calls_jobs · (conv_1hr − conv_late)</code> <span id="recoveredJobs"></span></div>
          <div class="breakdown-row"><span>weekly_recovered_rev</span><strong id="calls">$0/wk</strong></div>
          <div class="breakdown-row"><span>weekly_quotes_rev</span><strong id="quotes">$0/wk</strong></div>
          <div class="breakdown-row"><span>no_show_savings</span><strong id="noShows">$0/wk</strong></div>
          <div class="formula"><code>total_weekly_uplift = weekly_recovered_rev + weekly_quotes_rev + no_show_savings</code></div>
          <div class="formula"><code>monthly_uplift = total_weekly_uplift · 4.333; annual_uplift = total_weekly_uplift · 52</code></div>
          <p class="payback" id="paybackNote">Enter your figures to see the expected payback period.</p>
          <div class="example"><strong>Default example:</strong> At $85/hr, 2 hours per job and 10 jobs a week, a typical job is worth <span id="defaultExample"></span>.</div>
          <div class="cta-row"><button class="button secondary" type="button" id="run-demo">Run 60s demo</button><button class="button" type="button" id="get-pricing">Get pricing</button></div>
          <p class="demo-status" id="demo-status"></p>
          <div class="formula"><code>Demo status</code> <span id="portalUrl">No demo requested</span></div>
        </div>
      </aside>
    </div>
    <p class="note">This calculator is an indicative estimate, not a guarantee. It applies your selected conversion and margin assumptions to the supplied weekly workload; actual results depend on your offer, capacity, and follow-up process.</p>
  </main>
  <footer class="band bottom">Insanely Smart. Adelaide, South Australia.</footer>
  <div class="modal" id="defaults-modal" role="dialog" aria-modal="true" aria-labelledby="sources-title">
    <div class="modal-card"><div class="modal-head"><h2 id="sources-title">Why these defaults?</h2><button class="close" type="button" data-close="defaults-modal" aria-label="Close">×</button></div><p class="help">The calculator uses conservative planning assumptions. These sources explain why timely lead response, systematic follow-up, and reminders matter; they do not guarantee an individual result.</p><ol class="source-list"><li><a href="https://hbr.org/2011/03/the-short-life-of-online-sales-leads" target="_blank" rel="noreferrer">Harvard Business Review — The Short Life of Online Sales Leads</a></li><li><a href="https://www.insidesales.com/response-time-matters/" target="_blank" rel="noreferrer">InsideSales — Response Time Matters</a></li><li><a href="https://www.gong.io/blog/sales-follow-up-statistics/" target="_blank" rel="noreferrer">Gong — Sales follow-up statistics</a></li><li><a href="https://www.servicetitan.com/blog/appointment-reminder" target="_blank" rel="noreferrer">ServiceTitan — Appointment reminders</a></li><li><a href="https://squareup.com/au/en/townsquare/reduce-no-shows" target="_blank" rel="noreferrer">Square Australia — Reducing no-shows</a></li></ol></div>
  </div>
  <div class="modal" id="pricing-modal" role="dialog" aria-modal="true" aria-labelledby="pricing-title">
    <div class="modal-card"><div class="modal-head"><h2 id="pricing-title">Choose the system that fits</h2><button class="close" type="button" data-close="pricing-modal" aria-label="Close">×</button></div><p class="help">Net profit uses your calculated monthly uplift × 60% gross margin, less the plan's monthly price.</p><div class="pricing-grid"><div class="price-plan"><h3>Starter</h3><p>Sole trader / small workshop</p><strong>$79/mo</strong><p>$299 one-time setup</p><p>Estimated net profit: <strong id="starterNet">$0</strong></p><p id="starterPayback"></p></div><div class="price-plan featured"><h3>Growth</h3><p>Growing shop, 10–40 jobs/week</p><strong>$249/mo</strong><p>$599 one-time setup</p><p>Estimated net profit: <strong id="growthNet">$0</strong></p><p id="growthPayback"></p></div><div class="price-plan"><h3>Pro</h3><p>Multi-site or high volume</p><strong>$599/mo</strong><p>$1,499 one-time setup</p><p>Estimated net profit: <strong id="proNet">$0</strong></p><p id="proPayback"></p></div></div></div>
  </div>
  <script>
    (function () {
      var ids = ["hourly","jobHours","jobsWeek","quotesWeek"];
      var defaults = { missedPct:.2, convFast:.4, convLate:.05, quotesNotFollow:.5, quoteUplift:.15, noShow:.08, noShowReduction:.5, margin:.6 };
      var plans = { starter:{ monthly:79, setup:299 }, growth:{ monthly:249, setup:599 }, pro:{ monthly:599, setup:1499 } };
      var byId = function (id) { return document.getElementById(id); };
      var number = function (id) { return Math.max(0, Number(byId(id).value) || 0); };
      var money = function (value) { return "$" + Math.round(value).toLocaleString("en-AU"); };
      var count = function (value) { return (Math.round(value * 100) / 100).toLocaleString("en-AU"); };
      function planResult(key, monthlyUplift) {
        var plan = plans[key];
        var profit = monthlyUplift * defaults.margin - plan.monthly;
        var payback = profit > 0 ? Math.max(1, Math.round(plan.setup / profit * 30)) : null;
        byId(key + "Net").textContent = money(Math.max(0, profit)) + "/mo";
        byId(key + "Payback").textContent = payback === null ? "No payback at this estimate" : "Payback: about " + payback + " days";
        return { profit:profit, payback:payback };
      }
      function selectedPlanResult(monthlyUplift) {
        var key = byId("planSelect").value;
        var plan = plans[key];
        var profit = monthlyUplift * defaults.margin - plan.monthly;
        var payback = profit > 0 ? Math.max(1, Math.round(plan.setup / profit * 30)) : null;
        return { key:key, plan:plan, profit:profit, payback:payback };
      }
      function calculate() {
        var hourly = number("hourly");
        var jobHours = number("jobHours");
        var jobsWeek = number("jobsWeek");
        var revenuePerJob = hourly * jobHours;
        var missedRate = defaults.missedPct;
        var fastConversion = defaults.convFast;
        var lateConversion = defaults.convLate;
        var quotesWeek = number("quotesWeek");
        var missedCallsJobs = jobsWeek * missedRate;
        var recoveredJobs = missedCallsJobs * (fastConversion - lateConversion);
        var missedCallRevenue = recoveredJobs * revenuePerJob;
        var quoteRevenue = quotesWeek * defaults.quotesNotFollow * defaults.quoteUplift * revenuePerJob;
        var noShowRevenue = jobsWeek * defaults.noShow * defaults.noShowReduction * revenuePerJob;
        var weekly = missedCallRevenue + quoteRevenue + noShowRevenue;
        var monthly = weekly * 4.333;
        var annual = weekly * 52;
        var starter = planResult("starter", monthly);
        planResult("growth", monthly);
        planResult("pro", monthly);
        var selected = selectedPlanResult(monthly);
        byId("weekly").textContent = money(weekly);
        byId("monthly").textContent = money(monthly);
        byId("annual").textContent = money(annual);
        byId("profit").textContent = money(Math.max(0, selected.profit));
        byId("payback").textContent = selected.payback === null ? "—" : selected.payback + " days";
        byId("revenuePerJob").textContent = "= " + money(revenuePerJob) + " (" + money(hourly) + " × " + count(jobHours) + " hrs)";
        byId("missedCallsJobs").textContent = "= " + count(missedCallsJobs) + " (" + count(jobsWeek) + " × 20%)";
        byId("recoveredJobs").textContent = "= " + count(recoveredJobs) + " (" + count(missedCallsJobs) + " × (40% − 5%))";
        byId("calls").textContent = money(missedCallRevenue) + "/wk";
        byId("quotes").textContent = money(quoteRevenue) + "/wk";
        byId("noShows").textContent = money(noShowRevenue) + "/wk";
        byId("defaultExample").textContent = money(85 * 2);
        byId("paybackNote").textContent = selected.payback === null ? "The selected plan's monthly price exceeds estimated monthly gross profit." : "The selected " + selected.key + " plan's " + money(selected.plan.setup) + " setup pays back in about " + selected.payback + " days.";
      }
      ["defaults-modal","pricing-modal"].forEach(function (id) {
        byId(id).addEventListener("click", function (event) { if (event.target === byId(id)) byId(id).classList.remove("open"); });
      });
      byId("why-defaults").addEventListener("click", function () { byId("defaults-modal").classList.add("open"); });
      byId("get-pricing").addEventListener("click", function () { byId("pricing-modal").classList.add("open"); });
      document.querySelectorAll("[data-close]").forEach(function (button) { button.addEventListener("click", function () { byId(button.getAttribute("data-close")).classList.remove("open"); }); });
      byId("run-demo").addEventListener("click", function () {
        var phone = byId("phone").value.trim();
        var status = byId("demo-status");
        if (!phone) { status.textContent = "Add a phone number to run the SMS demo."; return; }
        status.textContent = "Starting your demo...";
        byId("portalUrl").textContent = "Sending demo SMS...";
        fetch("/audit/demo", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ phone:phone, annualUplift:byId("annual").textContent }) })
          .then(function (response) { return response.ok ? response.json() : response.json().then(function (body) { throw new Error(body.error); }); })
          .then(function (data) { status.textContent = data.dryRun ? "Demo prepared in dry-run mode." : "Your 60-second demo is on its way."; byId("portalUrl").textContent = data.dryRun ? "Demo SMS prepared (dry run)" : "Demo SMS queued"; })
          .catch(function (error) { status.textContent = error.message || "Could not start the demo. Please try again."; byId("portalUrl").textContent = "Demo could not be started"; });
      });
      ids.forEach(function (id) { byId(id).addEventListener("input", calculate); });
      byId("planSelect").addEventListener("change", calculate);
      calculate();
    }());
  </script>
</body>
</html>`);
});

auditRouter.post("/demo", async (req, res) => {
  const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
  const annualUplift = typeof req.body?.annualUplift === "string" ? req.body.annualUplift.trim() : "";

  if (!/^[+()\s\d-]{8,25}$/.test(phone)) {
    res.status(400).json({ error: "Enter a valid phone number to run the demo." });
    return;
  }

  try {
    const result = await sendSms(
      phone,
      `Insanely Smart demo: your estimated annual automation uplift is ${annualUplift || "available in your calculator"}. Reply to this text and we'll show you how the 60-second workflow works.`,
    );
    res.json({ ok: true, dryRun: result.dryRun });
  } catch (error) {
    console.error("POST /audit/demo error:", error);
    res.status(502).json({ error: "The demo SMS could not be sent right now. Please try again shortly." });
  }
});

function parseTaskHours(raw: unknown): TaskHoursEntry[] | null {
  if (!Array.isArray(raw)) return null;
  const entries: TaskHoursEntry[] = [];
  for (const item of raw) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as Record<string, unknown>).key !== "string" ||
      typeof (item as Record<string, unknown>).hours !== "number" ||
      !Number.isFinite((item as Record<string, unknown>).hours as number)
    ) {
      return null;
    }
    entries.push({
      key: (item as Record<string, unknown>).key as string,
      hours: (item as Record<string, unknown>).hours as number,
    });
  }
  return entries;
}

function parseMissedWork(raw: unknown): MissedWorkInputs | null | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const { callsMissedPerWeek, conversionRate, averageJobValue } = obj;
  if (
    typeof callsMissedPerWeek !== "number" ||
    typeof conversionRate !== "number" ||
    typeof averageJobValue !== "number" ||
    !Number.isFinite(callsMissedPerWeek) ||
    !Number.isFinite(conversionRate) ||
    !Number.isFinite(averageJobValue)
  ) {
    return null;
  }
  return { callsMissedPerWeek, conversionRate, averageJobValue };
}

auditRouter.post("/", async (req, res) => {
  const firstName = String(req.body?.firstName ?? "").trim();
  const mobile = String(req.body?.mobile ?? "").trim();
  const industryKey = typeof req.body?.industryKey === "string" ? req.body.industryKey : undefined;
  const rate = req.body?.rate;
  const taskHours = parseTaskHours(req.body?.taskHours);
  const missedWork = parseMissedWork(req.body?.missedWork);
  const customersApproxRaw = req.body?.customersApprox;
  const customersApprox =
    customersApproxRaw === undefined || customersApproxRaw === null
      ? undefined
      : typeof customersApproxRaw === "number" && Number.isFinite(customersApproxRaw)
        ? customersApproxRaw
        : null;

  if (!firstName || !mobile) {
    res.status(400).json({ error: "firstName and mobile are required" });
    return;
  }
  if (typeof rate !== "number" || !Number.isFinite(rate)) {
    res.status(400).json({ error: "rate must be a number" });
    return;
  }
  if (taskHours === null) {
    res.status(400).json({ error: "taskHours must be an array of {key, hours}" });
    return;
  }
  if (missedWork === null) {
    res.status(400).json({ error: "missedWork, if present, must have callsMissedPerWeek, conversionRate and averageJobValue" });
    return;
  }
  if (customersApprox === null) {
    res.status(400).json({ error: "customersApprox, if present, must be a number" });
    return;
  }

  const inputs: AuditInputs = {
    industryKey: getIndustry(industryKey).key,
    rate,
    taskHours,
    missedWork: missedWork ?? undefined,
    customersApprox,
  };

  try {
    const person = await saveAuditResult({ firstName, mobile, inputs });
    const publicUrl = `${req.protocol}://${req.get("host")}/p/${person.publicToken}`;

    // Failure-tolerant by design (see sendAuditTextBack) - the audit is already saved, so a
    // Twilio error here must never turn this into an error response.
    await sendAuditTextBack(person, publicUrl);

    res.json({ ok: true, publicToken: person.publicToken });
  } catch (err) {
    console.error("POST /audit error:", err);
    res.status(500).json({ error: "Something went wrong saving your figures. Please try again shortly." });
  }
});

type ParsedOutcomeCall = {
  toolCallId?: string;
  publicToken?: string;
  outcome?: string;
};

/** Same Vapi tool-call wrapping as /vapi/book (message.toolCalls[].function.arguments, JSON string
 * or object) - set_outcome is configured as an async tool, so this response isn't waited on by the
 * model, but the shape stays consistent with the one other Vapi webhook this app already has. */
function parseSetOutcomeCall(body: any): ParsedOutcomeCall {
  const toolCalls = body?.message?.toolCalls;

  if (Array.isArray(toolCalls) && toolCalls.length > 0) {
    const call = toolCalls[0];
    let args = call?.function?.arguments;

    if (typeof args === "string") {
      try {
        args = JSON.parse(args);
      } catch {
        args = {};
      }
    }

    args ??= {};

    return { toolCallId: call?.id, publicToken: args.public_token, outcome: args.outcome };
  }

  return { publicToken: body?.public_token, outcome: body?.outcome };
}

function outcomeToolResult(toolCallId: string | undefined, result: string) {
  return { results: [{ toolCallId: toolCallId ?? "test-call", result }] };
}

function isOutcomeValue(value: string | undefined): value is OutcomeValue {
  return typeof value === "string" && (OUTCOME_VALUES as readonly string[]).includes(value);
}

auditRouter.post("/outcome", async (req, res) => {
  const parsed = parseSetOutcomeCall(req.body);
  const publicToken = parsed.publicToken?.trim();

  if (!publicToken) {
    res.status(400).json(outcomeToolResult(parsed.toolCallId, "Missing public_token."));
    return;
  }
  if (!isOutcomeValue(parsed.outcome)) {
    res
      .status(400)
      .json(
        outcomeToolResult(
          parsed.toolCallId,
          `outcome must be one of: ${OUTCOME_VALUES.join(", ")}`,
        ),
      );
    return;
  }

  try {
    const result = await recordCallOutcome(publicToken, parsed.outcome);
    if (!result.ok) {
      res.status(404).json(outcomeToolResult(parsed.toolCallId, "No person found for that public_token."));
      return;
    }
    res.json(outcomeToolResult(parsed.toolCallId, "Outcome recorded."));
  } catch (err) {
    console.error("POST /audit/outcome error:", err);
    res.status(500).json(outcomeToolResult(parsed.toolCallId, "Something went wrong recording that outcome."));
  }
});

function slotDto(slot: Slot) {
  return { start: slot.start.toISOString(), end: slot.end.toISOString(), label: formatSlot(slot) };
}

/** Curated three-option picker (ASAP today, tomorrow morning, tomorrow afternoon) for the
 * free-call booking step - same collision-checked generator the voice/SMS booking flow uses,
 * so it can never offer a time that's actually unavailable. */
auditRouter.get("/slots", async (_req, res) => {
  try {
    const curated = await getCuratedAuditSlots();
    res.json({
      asap: curated.asap ? slotDto(curated.asap) : null,
      tomorrowMorning: curated.tomorrowMorning ? slotDto(curated.tomorrowMorning) : null,
      tomorrowAfternoon: curated.tomorrowAfternoon ? slotDto(curated.tomorrowAfternoon) : null,
    });
  } catch (err) {
    console.error("GET /audit/slots error:", err);
    res.status(500).json({ error: "Could not load available times. Please try again shortly." });
  }
});

/** "None of these suit me" expansion - the next handful of openings starting two days out. */
auditRouter.get("/slots/more", async (_req, res) => {
  try {
    const slots = await getLaterAuditSlots();
    res.json({ slots: slots.map(slotDto) });
  } catch (err) {
    console.error("GET /audit/slots/more error:", err);
    res.status(500).json({ error: "Could not load more available times. Please try again shortly." });
  }
});

auditRouter.post("/book", async (req, res) => {
  const publicToken = String(req.body?.publicToken ?? "").trim();
  const businessName = typeof req.body?.businessName === "string" ? req.body.businessName.trim() : undefined;
  const start = new Date(req.body?.slotStart);
  const end = new Date(req.body?.slotEnd);

  if (!publicToken) {
    res.status(400).json({ error: "publicToken is required" });
    return;
  }
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    res.status(400).json({ error: "slotStart and slotEnd must be valid dates" });
    return;
  }

  try {
    const result = await bookProofOfValueCall(publicToken, { start, end }, businessName || undefined);
    if (!result.ok) {
      if (result.error === "not_found") {
        res.status(404).json({ error: "No person found for that link." });
        return;
      }
      res.status(409).json({ error: "That time was just taken. Pick another." });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("POST /audit/book error:", err);
    res.status(500).json({ error: "Something went wrong booking that time. Please try again shortly." });
  }
});
