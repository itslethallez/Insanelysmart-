import { speak, stopSpeaking, unlockSpeech } from "./charlie.js";

const money = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

const state = {
  mute: new URLSearchParams(location.search).has("quiet"),
  config: null,
  answers: {},
  step: 0,
  proof: null,
  url: null,
  error: "",
  busy: false,
  paymentPath: "invoice",
  screen: "attract",
  caption: "",
};

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function route() {
  const path = location.pathname.replace(/\/+$/, "") || "/";
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "playbook") return { name: "playbook" };
  if (parts[0] === "calculator") return { name: "calculator" };
  if (parts[0] === "value" && parts[1]) return { name: "value", id: parts[1] };
  if (parts[0] === "value") return { name: "value" };
  return { name: "demo" };
}

function go(path, replace = false) {
  if (replace) history.replaceState({}, "", path);
  else history.pushState({}, "", path);
  boot();
}

function topbar(extra = "") {
  return `
    <div class="topbar">
      <a class="mark" href="/" data-nav="/"><span class="mark-orb"></span> Insanely Smart</a>
      <div style="display:flex;gap:8px;align-items:center">
        ${extra}
        <button class="ghost" data-mute aria-pressed="${state.mute}">${state.mute ? "Captions only" : "Charlie on"}</button>
      </div>
    </div>
  `;
}

function say(text) {
  state.caption = text;
  speak(text, { mute: state.mute });
}

async function loadConfig() {
  if (state.config) return state.config;
  const res = await fetch("/api/demo/config");
  if (!res.ok) throw new Error("Could not load the visit.");
  state.config = await res.json();
  return state.config;
}

function questions() {
  return state.config.questions;
}

function currentQuestion() {
  return questions()[state.step];
}

function jobChoices() {
  const industry = state.answers.industry || "other";
  return state.config.jobValueByIndustry[industry] ?? state.config.jobValueByIndustry.other;
}

function renderAttract() {
  state.screen = "attract";
  return `
    <div class="shell">
      ${topbar(`<a class="ghost" href="/playbook" data-nav="/playbook">Playbook</a>`)}
      <section class="hero">
        <p class="kicker">Adelaide · two minutes</p>
        <h1>We’ll show you what this place is leaking.</h1>
        <p class="lede">Hand them the iPad. Charlie asks a few numbers, does the sums from published sources, then texts a proof of value before they sit back down.</p>
        <div class="actions">
          <button class="primary" data-start>Talk to Charlie</button>
        </div>
      </section>
    </div>
  `;
}

function renderIntro() {
  return `
    <div class="shell">
      ${topbar()}
      <div class="charlie-row">
        <div class="orb talking" aria-hidden="true"></div>
        <div class="caption"><small>Charlie</small>${esc(state.caption)}</div>
      </div>
      <h2>Two minutes. Then you get the numbers.</h2>
      <p class="lede">I’ll ask what this business actually does, how the phone is handled, and what a job is worth. While we talk I’ll build a proof of value in the background. At the end I’ll text you the link — that’s the product, live.</p>
      <div class="actions">
        <button class="primary" data-begin>I’m in</button>
      </div>
    </div>
  `;
}

function renderQuestion() {
  const q = currentQuestion();
  const total = questions().length;
  const pct = Math.round((state.step / total) * 100);
  const choices = q.id === "averageJobValue" ? jobChoices() : q.choices;
  const value = state.answers[q.id] ?? "";

  let body = "";
  if (q.kind === "chips") {
    body = `<div class="chips">
      ${choices
        .map(
          (choice) => `
        <button class="chip ${String(value) === String(choice.value) ? "picked" : ""}" data-choice="${esc(choice.value)}">
          <strong>${esc(choice.label)}</strong>
          ${choice.hint ? `<span>${esc(choice.hint)}</span>` : ""}
        </button>`,
        )
        .join("")}
    </div>`;
  } else {
    body = `<input class="field" data-field autocomplete="off" inputmode="${q.kind === "tel" ? "tel" : "text"}" placeholder="${esc(q.placeholder || "")}" value="${esc(value)}" />`;
  }

  return `
    <div class="shell">
      ${topbar()}
      <div class="progress"><span style="width:${pct}%"></span></div>
      <div class="charlie-row">
        <div class="orb talking" aria-hidden="true"></div>
        <div class="caption"><small>Charlie · ${state.step + 1} of ${total}</small>${esc(state.caption || q.charlie)}</div>
      </div>
      <p class="prompt">${esc(q.prompt)}</p>
      ${body}
      ${state.error ? `<p class="error">${esc(state.error)}</p>` : ""}
      <div class="nav-row">
        <button class="secondary" data-back ${state.step === 0 ? "disabled" : ""}>Back</button>
        <button class="primary" data-next>Continue</button>
      </div>
    </div>
  `;
}

function renderWorking() {
  return `
    <div class="shell">
      ${topbar()}
      <div class="charlie-row">
        <div class="orb talking" aria-hidden="true"></div>
        <div class="caption"><small>Charlie</small>${esc(state.caption)}</div>
      </div>
      <h2>Working out the proof of value.</h2>
      <ul class="checklist">
        <li class="done"><span class="dot"></span> Fair Work Clerks Award Level 2 — $29.45/hr</li>
        <li class="done"><span class="dot"></span> ATO Super Guarantee — 12%</li>
        <li class="done"><span class="dot"></span> 48-week year from the Airtasker founder survey</li>
        <li class="done"><span class="dot"></span> Missed work at a conservative 1-in-5 conversion</li>
        <li class="done"><span class="dot"></span> Ranking automations for this shop</li>
      </ul>
    </div>
  `;
}

function sourceList(ids) {
  const refs = state.config?.references ?? [];
  return `<div class="sources">${ids
    .map((id) => {
      const ref = refs.find((item) => item.id === id);
      if (!ref) return "";
      return `<a href="${esc(ref.url)}" target="_blank" rel="noreferrer">${esc(ref.publisher)} — ${esc(ref.title)}</a>`;
    })
    .join("")}</div>`;
}

function renderResults() {
  const result = state.proof.result;
  const first = result.firstAutomation;
  const rest = result.ranking.slice(1, 4);
  return `
    <div class="shell">
      ${topbar()}
      <div class="charlie-row">
        <div class="orb" aria-hidden="true"></div>
        <div class="caption"><small>Charlie</small>${esc(state.caption)}</div>
      </div>
      <div class="results-grid">
        <div class="ticket">
          <p class="eyebrow">Proof of value · ${esc(result.answers.companyName)}</p>
          <p class="money">${money.format(result.totalAnnual)}<small>a year, using your numbers and published rates — not a guess</small></p>
          <div class="split">
            <article>
              <h3>Admin labour</h3>
              <p>${money.format(result.adminAnnual)}</p>
            </article>
            <article>
              <h3>Missed work</h3>
              <p>${money.format(result.missedRevenueAnnual)}</p>
            </article>
          </div>
          <p class="formula">${esc(result.lineItems[0].formula)}</p>
          <p class="formula">${esc(result.lineItems[1].formula)}</p>
        </div>
        <div class="stack">
          <article class="card">
            <p class="kicker">Do this first</p>
            <h3>${esc(first.name)} · ${money.format(first.buildPrice)}</h3>
            <p>${esc(first.promise)}</p>
            <p class="fine">${esc(first.why)} Live in ${esc(first.daysToLive)}.</p>
          </article>
          <article class="card">
            <p class="kicker">${esc(result.care.name)} care · ${esc(result.care.people)}</p>
            <h3>${money.format(result.care.monthly)} a month</h3>
            <p>Year one, GST included: ${money.format(result.yearOne.total)} (${money.format(result.yearOne.build)} build + ${money.format(result.yearOne.care)} care). Payback around ${result.paybackWeeks ? `${Math.max(1, Math.round(result.paybackWeeks))} weeks` : "n/a"} if these leaks are real.</p>
            <p class="fine">If this is a company on the 25% base-rate tax, the ${money.format(first.buildPrice)} build is roughly ${money.format(result.afterTaxBuild.netCash)} after GST credits and tax. That’s an illustration — not advice. ATO links below.</p>
          </article>
        </div>
      </div>
      <div class="stack" style="margin-top:18px">
        ${rest
          .map(
            (item) => `
          <article class="card rank">
            <div class="rank-n">${item.rank}</div>
            <div>
              <h3>${esc(item.name)} · ${money.format(item.buildPrice)}</h3>
              <p>${esc(item.promise)}</p>
            </div>
          </article>`,
          )
          .join("")}
      </div>
      <div class="card" style="margin-top:18px">
        <h3>Where the sums come from</h3>
        ${sourceList(result.sourceIds)}
      </div>
      ${state.error ? `<p class="error">${esc(state.error)}</p>` : ""}
      <div class="actions">
        <button class="primary" data-send ${state.busy ? "disabled" : ""}>Text me the proof</button>
        <button class="secondary" data-lock-open>Lock in a build</button>
      </div>
      <p class="fine">The text is the demo: an automatic message, with your numbers, while you’re still holding the iPad.</p>
      <div id="lock-sheet"></div>
    </div>
  `;
}

function renderLockSheet() {
  const paths = state.config.paymentPaths;
  return `
    <div class="card" style="margin-top:16px">
      <h3>How do you want to do this?</h3>
      <div class="paths">
        ${paths
          .map(
            (path) => `
          <button class="path" data-path="${path.id}" aria-pressed="${state.paymentPath === path.id}">
            <strong>${esc(path.label)}</strong>
            <p class="fine">${esc(path.blurb)}</p>
          </button>`,
          )
          .join("")}
      </div>
      <div class="actions">
        <button class="primary" data-lock ${state.busy ? "disabled" : ""}>Lock it in</button>
      </div>
    </div>
  `;
}

function renderDone(kind) {
  const title = kind === "locked" ? "Locked in." : "Sent.";
  const copy =
    kind === "locked"
      ? "Mick has the job. You’ll get a confirmation text, and the proof of value stays on that link."
      : "Check your messages. Open the link — that’s your copy of the numbers, the sources, and the first build.";
  return `
    <div class="shell">
      ${topbar()}
      <p class="kicker">${kind === "locked" ? "Build" : "Proof of value"}</p>
      <h1>${title}</h1>
      <p class="lede">${esc(copy)}</p>
      ${state.url ? `<p><a href="${esc(state.url)}">${esc(state.url)}</a></p>` : ""}
      <div class="actions">
        <a class="primary" href="${esc(state.url || "/")}" ${state.url ? "" : "data-nav='/'"}>Open the proof</a>
        <button class="secondary" data-reset>Another visit</button>
      </div>
    </div>
  `;
}

function renderValue(proof) {
  if (!proof) {
    return `<div class="shell">${topbar()}<h2>Looking for that proof…</h2><p class="lede">${esc(state.error || "Open the link from Charlie’s text.")}</p></div>`;
  }
  state.proof = proof;
  state.config = state.config || { references: proof.result ? [] : [] };
  const result = proof.result;
  return `
    <div class="shell">
      ${topbar()}
      <p class="kicker">Proof of value</p>
      <h1>${esc(result.answers.companyName)}</h1>
      <p class="lede">Prepared for ${esc(result.answers.contactName)} · ${new Date(proof.createdAt).toLocaleString("en-AU", { timeZone: "Australia/Adelaide" })}</p>
      <div class="ticket" style="margin-top:24px">
        <p class="eyebrow">Annual leak</p>
        <p class="money">${money.format(result.totalAnnual)}<small>${esc(result.lineItems[0].label)} + ${esc(result.lineItems[1].label)}</small></p>
        <div class="split">
          <article><h3>Admin</h3><p>${money.format(result.adminAnnual)}</p></article>
          <article><h3>Missed work</h3><p>${money.format(result.missedRevenueAnnual)}</p></article>
        </div>
        <p class="formula">${esc(result.lineItems[0].formula)}</p>
        <p class="formula">${esc(result.lineItems[1].formula)}</p>
      </div>
      <div class="stack">
        ${result.ranking
          .slice(0, 5)
          .map(
            (item) => `
          <article class="card rank">
            <div class="rank-n">${item.rank}</div>
            <div>
              <h3>${esc(item.name)} · ${money.format(item.buildPrice)}</h3>
              <p>${esc(item.promise)}</p>
            </div>
          </article>`,
          )
          .join("")}
      </div>
      <article class="card">
        <h3>${esc(result.care.name)} care · ${money.format(result.care.monthly)}/mo</h3>
        <p>First year, GST included: ${money.format(result.yearOne.total)}. One automation first. Then we earn the next one.</p>
      </article>
      <article class="card">
        <h3>Sources</h3>
        ${sourceList(result.sourceIds)}
      </article>
    </div>
  `;
}

function renderPlaybook() {
  return `
    <div class="shell playbook">
      ${topbar(`<a class="ghost" href="/calculator" data-nav="/calculator">Calculator</a>`)}
      <p class="kicker">Mick’s playbook</p>
      <h1>The plan.</h1>
      <p class="lede">The idea is right. Don’t sell “AI”. Sell a two-minute visit that proves the leak, then one working automation. Everything else is trust.</p>

      <h2>What I think</h2>
      <p>The gap is real. Big vendors want enterprise. Template tools dump a login on a busy owner and leave them to it. Adelaide is full of 1–19 person shops who would buy if someone just made it work. ASBFEO (ABS data) counted <strong>118,344 small businesses in Greater Adelaide</strong> at 30 June 2023. You do not need much of that to have a company.</p>
      <p>The iPad motion is the product. You are not pitching automation. You are doing it in front of them: Charlie talks, the sums are sourced, a text arrives. That is the close.</p>
      <p>The risk is over-claiming. Keep the calculator conservative and cited. If they feel sold, you lose the room. If they feel shown, you get a first build.</p>

      <h2>Who to walk into first</h2>
      <ul>
        <li><strong>Trades</strong> — high job value, owner on the tools, phone rings out. Best unit economics.</li>
        <li><strong>Clinics and beauty</strong> — bookings, no-shows, recalls. Second.</li>
        <li><strong>Professional services</strong> — quote follow-up. Third.</li>
        <li><strong>Skip cafes early</strong> unless they have a real average booking. A $12 coffee cannot pay for a $1,490 build.</li>
      </ul>

      <h2>The two-minute visit</h2>
      <ol>
        <li>“Have you got two minutes? I’ll show you what admin and missed calls are costing this place.”</li>
        <li>iPad unlocked on this page. They tap. You shut up.</li>
        <li>Charlie asks. You only jump in if they stall on a number.</li>
        <li>When the proof hits their phone, say: “That’s us. One automation, working, on your actual situation.”</li>
        <li>Lock one build. Not a package. Not a roadmap.</li>
      </ol>

      <h2>How we charge — and why people will still pay</h2>
      <p>They are not buying software. They are buying a job done once, then a caretaker so it does not die.</p>
      <ul>
        <li><strong>First build ${money.format(state.config.firstBuildPrice)}</strong> GST included. One automation, install notes, we help if they get stuck. Priced under two weeks of a clerk on the Fair Work award.</li>
        <li><strong>Studio $149 / Crew $279 / Company $459</strong> a month by headcount. That is Charlie, SMS, hosting, watching it, a small tweak. Not a hostage fee — without this, template tools rot.</li>
        <li><strong>If they will not pay a lump sum:</strong> split the build into three, or start care today and invoice the build after they have seen it live. Do not give the build away. That trains the wrong customer.</li>
        <li><strong>Tax:</strong> this is a business expense. Software subscriptions are generally deductible in the year (ATO digital product expenses). A custom build can be capital — tell them to ask their accountant. We are not tax advisers. If they are a company on the 25% base-rate, show the after-tax illustration on the proof. GST credits apply if they are registered.</li>
      </ul>
      <p>Year one for a 1–5 person shop is ${money.format(state.config.firstBuildPrice + 149 * 12)}. Against even a modest leak, that looks cheap. Against a receptionist, it looks obvious.</p>

      <h2>Land, then expand</h2>
      <p>Priority list is on the proof, in order. You only sell number one. When that has been boringly reliable for a month, number two is an easy yes. That is the business.</p>

      <h2>Calculator rules</h2>
      <ul>
        <li>Their numbers for volume, unanswered share, job value, admin hours.</li>
        <li>Our rates only from reference sites: Fair Work $29.45, ATO 12% super, 48-week year from Airtasker, conservative 1-in-5 conversion (shown as an assumption, tied to speed-to-lead research from MIT/InsideSales and HBR).</li>
        <li>If they do not know admin hours, use Airtasker’s 2.7 + 2.2.</li>
        <li>Never invent a conversion for their industry. Let them see the 20% lever.</li>
      </ul>

      <h2>What not to do</h2>
      <ul>
        <li>Do not stay for twenty minutes. The iPad is the meeting.</li>
        <li>Do not demo a dashboard. Demo the text.</li>
        <li>Do not discount care. If they cannot pay $149, they will not maintain anything.</li>
        <li>Do not build five automations in week one. You will miss, and trust dies.</li>
      </ul>

      <div class="actions">
        <button class="primary" data-start>Start a live visit</button>
        <button class="secondary" data-rehearse>Rehearse a tradie</button>
      </div>
    </div>
  `;
}

function renderCalculator() {
  const c = state.config;
  return `
    <div class="shell playbook">
      ${topbar()}
      <p class="kicker">Standalone</p>
      <h1>Calculator</h1>
      <p class="lede">Same engine as the iPad. Your inputs, published rates. Nothing is estimated except the 1-in-5 conversion, which is labelled.</p>
      <form class="stack" data-calc-form>
        <input class="field" name="contactName" placeholder="Name" required />
        <input class="field" name="companyName" placeholder="Business" required />
        <select class="field" name="industry">${c.questions.find((q) => q.id === "industry").choices.map((choice) => `<option value="${choice.value}">${esc(choice.label)}</option>`).join("")}</select>
        <select class="field" name="teamSize">${c.questions.find((q) => q.id === "teamSize").choices.map((choice) => `<option value="${choice.value}">${esc(choice.label)}</option>`).join("")}</select>
        <select class="field" name="phoneHandler">${c.questions.find((q) => q.id === "phoneHandler").choices.map((choice) => `<option value="${choice.value}">${esc(choice.label)}</option>`).join("")}</select>
        <input class="field" name="weeklyEnquiries" type="number" min="1" value="25" />
        <select class="field" name="unansweredRate">
          <option value="0.1">10% unanswered</option>
          <option value="0.25" selected>25%</option>
          <option value="0.5">50%</option>
          <option value="0.7">70%</option>
        </select>
        <input class="field" name="averageJobValue" type="number" min="1" value="850" />
        <input class="field" name="adminHoursPerWeek" type="number" min="0" step="0.1" value="8" />
        <button class="primary" type="submit">Run the sums</button>
      </form>
      <div id="calc-out"></div>
    </div>
  `;
}

function paint(html) {
  document.getElementById("app").innerHTML = html;
}

function bindDemo() {
  document.querySelector("[data-mute]")?.addEventListener("click", () => {
    state.mute = !state.mute;
    if (state.mute) stopSpeaking();
    boot();
  });

  document.querySelectorAll("[data-nav]").forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      go(el.getAttribute("data-nav"));
    });
  });

  document.querySelector("[data-start]")?.addEventListener("click", () => {
    unlockSpeech();
    state.screen = "intro";
    state.caption =
      "G’day — I’m Charlie. Mick’s handing you this so I can do the talking. Two minutes. I’ll ask a few numbers, then I’ll show you what admin and missed messages are costing this business. While we talk I’m also putting together a proof of value you can keep.";
    say(state.caption);
    paint(renderIntro());
    bindDemo();
  });

  document.querySelector("[data-begin]")?.addEventListener("click", () => {
    state.screen = "ask";
    state.step = 0;
    const q = currentQuestion();
    state.caption = q.charlie;
    say(`${q.prompt} ${q.charlie}`);
    paint(renderQuestion());
    bindDemo();
    document.querySelector("[data-field]")?.focus();
  });

  document.querySelector("[data-rehearse]")?.addEventListener("click", async () => {
    unlockSpeech();
    state.answers = {
      contactName: "Sam",
      companyName: "Ridgeline Roofing",
      industry: "trades",
      teamSize: "1-5",
      phoneHandler: "rings-out",
      weeklyEnquiries: 30,
      unansweredRate: 0.5,
      averageJobValue: 850,
      adminHoursPerWeek: 8,
      mobile: "0412 345 678",
    };
    await runWorking();
  });

  document.querySelectorAll("[data-choice]").forEach((el) => {
    el.addEventListener("click", () => {
      const q = currentQuestion();
      let value = el.getAttribute("data-choice");
      if (q.id === "weeklyEnquiries" || q.id === "averageJobValue" || q.id === "adminHoursPerWeek" || q.id === "unansweredRate") {
        value = Number(value);
      }
      state.answers[q.id] = value;
      state.error = "";
      advance();
    });
  });

  document.querySelector("[data-next]")?.addEventListener("click", () => {
    const q = currentQuestion();
    const field = document.querySelector("[data-field]");
    if (field) {
      const value = field.value.trim();
      if (!value) {
        state.error = "Need this one to keep the sums honest.";
        paint(renderQuestion());
        bindDemo();
        return;
      }
      state.answers[q.id] = value;
    } else if (state.answers[q.id] == null) {
      state.error = "Pick one.";
      paint(renderQuestion());
      bindDemo();
      return;
    }
    state.error = "";
    advance();
  });

  document.querySelector("[data-back]")?.addEventListener("click", () => {
    if (state.step === 0) return;
    state.step -= 1;
    const q = currentQuestion();
    state.caption = q.charlie;
    paint(renderQuestion());
    bindDemo();
  });

  document.querySelector("[data-send]")?.addEventListener("click", sendProof);
  document.querySelector("[data-lock-open]")?.addEventListener("click", () => {
    const sheet = document.getElementById("lock-sheet");
    if (sheet) {
      sheet.innerHTML = renderLockSheet();
      bindLock();
    }
  });
  document.querySelector("[data-reset]")?.addEventListener("click", () => {
    stopSpeaking();
    state.answers = {};
    state.proof = null;
    state.step = 0;
    state.screen = "attract";
    state.error = "";
    go("/", true);
  });

  document.querySelector("[data-calc-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const data = Object.fromEntries(new FormData(form).entries());
    data.weeklyEnquiries = Number(data.weeklyEnquiries);
    data.unansweredRate = Number(data.unansweredRate);
    data.averageJobValue = Number(data.averageJobValue);
    data.adminHoursPerWeek = Number(data.adminHoursPerWeek);
    const res = await fetch("/api/demo/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    const out = document.getElementById("calc-out");
    if (!res.ok) {
      out.innerHTML = `<p class="error">${esc(json.error)}</p>`;
      return;
    }
    state.proof = { result: json, createdAt: new Date().toISOString(), answers: json.answers };
    out.innerHTML = `
      <div class="ticket" style="margin-top:18px">
        <p class="money">${money.format(json.totalAnnual)}</p>
        <p class="formula">${esc(json.lineItems[0].formula)}</p>
        <p class="formula">${esc(json.lineItems[1].formula)}</p>
      </div>
      <p>First automation: <strong>${esc(json.firstAutomation.name)}</strong> · ${esc(json.care.name)} care ${money.format(json.care.monthly)}/mo</p>
    `;
  });
}

function bindLock() {
  document.querySelectorAll("[data-path]").forEach((el) => {
    el.addEventListener("click", () => {
      state.paymentPath = el.getAttribute("data-path");
      const sheet = document.getElementById("lock-sheet");
      if (sheet) {
        sheet.innerHTML = renderLockSheet();
        bindLock();
      }
    });
  });
  document.querySelector("[data-lock]")?.addEventListener("click", lockIn);
}

async function advance() {
  if (state.step >= questions().length - 1) {
    await runWorking();
    return;
  }
  state.step += 1;
  const q = currentQuestion();
  state.caption = q.charlie;
  say(`${q.prompt} ${q.charlie}`);
  paint(renderQuestion());
  bindDemo();
  document.querySelector("[data-field]")?.focus();
}

async function runWorking() {
  state.screen = "working";
  state.caption =
    "Give me a second. I’m costing your admin on the Fair Work clerks award plus super, then the missed work at a conservative one in five. I’ll also rank what to build first.";
  say(state.caption);
  paint(renderWorking());
  bindDemo();
  try {
    const res = await fetch("/api/demo/proofs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state.answers),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Could not build the proof.");
    state.proof = json.proof;
    state.url = json.url;
    state.screen = "results";
    state.caption = `${state.proof.result.answers.companyName} is looking at ${money.format(state.proof.result.totalAnnual)} a year. That’s admin at the award rate, plus missed jobs if even one in five of the unanswered enquiries would have become work. First thing I’d build is ${state.proof.result.firstAutomation.name}. I’m sending the proof to your phone next.`;
    say(state.caption);
    paint(renderResults());
    bindDemo();
  } catch (err) {
    state.error = err.message;
    state.screen = "ask";
    paint(renderQuestion());
    bindDemo();
  }
}

async function sendProof() {
  if (!state.proof) return;
  state.busy = true;
  state.error = "";
  paint(renderResults());
  bindDemo();
  try {
    const res = await fetch(`/api/demo/proofs/${state.proof.id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: state.answers.mobile }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Text did not send.");
    state.url = json.url;
    state.busy = false;
    state.screen = "sent";
    state.caption = json.dryRun
      ? "In demo mode I log the text instead of sending it. The proof link is ready."
      : "Sent. That’s the automation, on your phone, just now.";
    say(state.caption);
    paint(renderDone("sent"));
    bindDemo();
  } catch (err) {
    state.busy = false;
    state.error = err.message;
    paint(renderResults());
    bindDemo();
  }
}

async function lockIn() {
  if (!state.proof) return;
  state.busy = true;
  try {
    const res = await fetch(`/api/demo/proofs/${state.proof.id}/lock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentPath: state.paymentPath,
        contactName: state.answers.contactName,
        mobile: state.answers.mobile,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Could not lock it in.");
    state.url = json.url;
    state.busy = false;
    state.screen = "locked";
    state.caption = "Locked in. Mick will take it from here. You still have the proof on your phone.";
    say(state.caption);
    paint(renderDone("locked"));
    bindDemo();
  } catch (err) {
    state.busy = false;
    state.error = err.message;
    paint(renderResults());
    bindDemo();
    const sheet = document.getElementById("lock-sheet");
    if (sheet) {
      sheet.innerHTML = renderLockSheet();
      bindLock();
    }
  }
}

async function boot() {
  const current = route();
  try {
    await loadConfig();
  } catch (err) {
    paint(`<div class="shell"><h2>Can’t load the visit.</h2><p>${esc(err.message)}</p></div>`);
    return;
  }

  if (current.name === "playbook") {
    stopSpeaking();
    paint(renderPlaybook());
    bindDemo();
    return;
  }
  if (current.name === "calculator") {
    stopSpeaking();
    paint(renderCalculator());
    bindDemo();
    return;
  }
  if (current.name === "value") {
    stopSpeaking();
    if (!current.id) {
      paint(renderValue(null));
      bindDemo();
      return;
    }
    paint(renderValue(state.proof && state.proof.id === current.id ? state.proof : null));
    bindDemo();
    const res = await fetch(`/api/demo/proofs/${current.id}`);
    const json = await res.json();
    if (!res.ok) {
      state.error = json.error;
      paint(renderValue(null));
      bindDemo();
      return;
    }
    state.proof = json.proof;
    state.url = json.url;
    if (!state.config.references) {
      const cfg = await loadConfig();
      state.config = cfg;
    }
    paint(renderValue(json.proof));
    bindDemo();
    return;
  }

  if (state.screen === "results" && state.proof) {
    paint(renderResults());
    bindDemo();
    return;
  }
  if (state.screen === "sent") {
    paint(renderDone("sent"));
    bindDemo();
    return;
  }
  if (state.screen === "locked") {
    paint(renderDone("locked"));
    bindDemo();
    return;
  }
  paint(renderAttract());
  bindDemo();
}

window.addEventListener("popstate", boot);
boot();
