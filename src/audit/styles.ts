/** Shared across every page rendered from src/audit (render.ts, renderPersonPage.ts) so the
 * white/black-band brand system stays in one place instead of drifting across hand-kept copies. */
export const STYLES = `
:root {
  --black:#000000;
  --white:#ffffff;
  --navy:#14213D;
  --body:#454D61;
  --magenta:#EC4899;
  --orange:#FB923C;
  --gradient: linear-gradient(90deg,#38BDF8,#A855F7,#EC4899,#FB923C);
  --line:#C4C8D0;
  --shadow-card: 0 1px 2px rgba(20,33,61,0.04), 0 4px 12px rgba(20,33,61,0.06);
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
  --space-5:20px; --space-6:24px; --space-8:32px; --space-12:48px;
}
* { box-sizing: border-box; }
html, body { margin:0; padding:0; }
body {
  background:var(--white);
  color:var(--body);
  font-family:'Liberation Sans', Arial, Helvetica, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.band { background:var(--black); color:var(--white); padding:18px 24px; text-align:center; font-weight:800; letter-spacing:0.14em; font-size:14px; text-transform:uppercase; }
.band.bottom { font-size:12px; letter-spacing:0; text-transform:none; font-weight:400; opacity:0.75; }
.logo { height:128px; width:auto; display:block; margin:0 auto; }

.hero-dark { background:var(--black); padding:var(--space-6) var(--space-6) var(--space-8); text-align:center; }
.hero-dark h1 { color:var(--white); margin:0 0 var(--space-3); }
.hero-dark p.sub { color:#C7CBD6; margin:0; }

.container { max-width:480px; margin:0 auto; padding:var(--space-8) var(--space-5) var(--space-12); }
.hidden { display:none !important; }

h1 { color:var(--navy); font-size:28px; font-weight:800; line-height:1.3; margin:0 0 var(--space-4); }
h2 { color:var(--navy); font-size:22px; font-weight:700; line-height:1.3; margin:var(--space-2) 0 var(--space-2); }
h2::after { content:""; display:block; width:48px; height:3px; margin-top:var(--space-2); background:var(--gradient); border-radius:2px; }
p.sub { font-size:16px; line-height:1.5; margin:0 0 var(--space-6); }
p.help { font-size:13px; color:var(--body); margin:0 0 var(--space-4); }

.rule { height:4px; border:none; border-radius:2px; background:var(--gradient); margin:var(--space-6) 0; }
.rule-thin { height:1px; border:none; background:var(--line); margin:var(--space-4) 0; }

label { display:block; font-size:14px; font-weight:600; color:var(--navy); margin:var(--space-4) 0 var(--space-2); }
input[type=text], input[type=tel], input[type=email], input[type=number], select {
  width:100%; padding:var(--space-4); border:2px solid var(--line); border-radius:12px; font-size:16px;
  min-height:52px; font-family:inherit; color:var(--navy); background:var(--white);
}
input:focus-visible, select:focus-visible, button:focus-visible, input[type=range]:focus-visible {
  outline:3px solid var(--magenta); outline-offset:2px;
}

.slider-row { display:flex; align-items:center; gap:var(--space-4); }
input[type=range] { flex:1; -webkit-appearance:none; appearance:none; height:8px; border-radius:4px; background:var(--gradient); }
input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:26px; height:26px; border-radius:50%; background:var(--white); border:3px solid var(--navy); cursor:pointer; }
input[type=range]::-moz-range-thumb { width:26px; height:26px; border-radius:50%; background:var(--white); border:3px solid var(--navy); cursor:pointer; }
output { min-width:76px; text-align:right; font-weight:700; color:var(--navy); font-size:16px; font-variant-numeric:tabular-nums; }

.stat-row { display:flex; justify-content:space-between; align-items:center; gap:var(--space-3); margin:var(--space-2) 0; }

.task-row { border:1px solid var(--line); border-radius:18px; padding:var(--space-5); margin:0 0 var(--space-4); box-shadow:var(--shadow-card); }
.task-row.checked { border-color:#A855F7; background:linear-gradient(135deg, #EFF6FF, #F5F0FF); }
.task-check { display:flex; align-items:center; gap:var(--space-3); cursor:pointer; }
.task-check input[type=checkbox] { width:22px; height:22px; flex:none; accent-color:var(--magenta); }
.task-check span { font-size:16px; font-weight:600; color:var(--navy); }
.task-slider { margin-top:var(--space-4); display:none; }
.task-row.checked .task-slider { display:block; }

.task-note { font-size:12px; line-height:1.5; color:var(--body); font-style:italic; margin:var(--space-2) 0 0 34px; }

.task-nudge {
  display:flex; align-items:flex-start; gap:var(--space-2); margin-top:var(--space-4); padding:var(--space-3) var(--space-3);
  border:1px solid var(--line); border-radius:12px; background:#FAFAFB;
}
.task-nudge span { flex:1; font-size:12px; line-height:1.5; color:var(--body); }
.task-nudge-dismiss {
  flex:none; border:none; background:none; color:var(--body); font-size:16px; line-height:1;
  cursor:pointer; padding:2px var(--space-1); opacity:0.6;
}
.task-nudge-dismiss:hover { opacity:1; }

.clamp-note { font-size:13px; color:var(--orange); font-weight:600; margin:var(--space-3) 0 0; }

.btn-primary {
  display:block; width:100%; padding:var(--space-4) var(--space-6); border:none; border-radius:999px;
  background:var(--gradient); color:var(--white); font-size:16px; font-weight:700;
  text-shadow:0 1px 2px rgba(0,0,0,0.25);
  cursor:pointer; min-height:56px; margin-top:var(--space-8);
}
.btn-primary:active { transform:scale(0.98); }
.btn-primary:disabled { opacity:0.45; cursor:not-allowed; }
.btn-primary.live { background:linear-gradient(90deg,#ef4444,#b91c1c); }

.btn-secondary {
  display:block; width:100%; padding:var(--space-4) var(--space-6); border:2px solid var(--navy); border-radius:999px;
  background:var(--white); color:var(--navy); font-size:16px; font-weight:700;
  cursor:pointer; min-height:52px; margin-top:var(--space-3);
}
.btn-secondary:active { transform:scale(0.98); }

@media (hover:hover) {
  .btn-primary:not(:disabled):hover { filter:brightness(1.05); }
  .btn-secondary:hover { border-color:var(--magenta); color:var(--magenta); }
  .cta-card .btn-secondary:hover { border-color:var(--gradient); color:var(--white); opacity:0.85; }
  .pill:hover { border-color:var(--navy); box-shadow:0 4px 16px rgba(20,33,61,0.1); }
  .slot-option:hover { border-color:var(--navy); }
}

.reveal-eyebrow { text-transform:uppercase; letter-spacing:0.08em; font-size:12px; color:var(--body); text-align:center; margin:0 0 var(--space-3); }
.reveal-hours { font-size:40px; font-weight:800; color:var(--navy); text-align:center; margin:0 0 var(--space-2); }
.reveal-dollars { font-size:18px; font-weight:600; color:var(--body); text-align:center; margin:0 0 var(--space-3); font-variant-numeric:tabular-nums; }

.payback { font-size:14px; color:var(--body); font-weight:600; text-align:center; margin:var(--space-4) 0 0; }

.result-card { border:1px solid var(--line); border-radius:18px; padding:var(--space-6); margin:0 0 var(--space-4); box-shadow:var(--shadow-card); }
.result-card label { margin-top:var(--space-3); }

.info-box { border:1px solid var(--line); border-radius:14px; padding:var(--space-4); margin:0 0 var(--space-4); background:#FAFAFB; box-shadow:var(--shadow-card); }
.info-box p { font-size:13px; line-height:1.6; color:var(--body); margin:0; }

.disclaimer { font-size:13px; color:var(--body); margin:var(--space-5) 0 0; }

.summary-card { border:1px solid var(--line); border-radius:18px; padding:var(--space-6); margin:0 0 var(--space-5); box-shadow:var(--shadow-card); }
.summary-card .reveal-hours { font-size:28px; margin:0 0 var(--space-2); }
.summary-card .reveal-dollars { font-size:16px; margin:0; }

.pov-block { border:2px solid #F3E8FF; border-radius:14px; padding:var(--space-5); margin:0 0 var(--space-6); box-shadow:var(--shadow-card); }
.pov-block p { font-size:14px; line-height:1.6; margin:0; }

.form-error { color:#B91C1C; font-size:14px; margin:var(--space-4) 0 0; }
.form-success { color:#15803D; font-size:14px; margin:var(--space-4) 0 0; font-weight:600; }

.status { font-size:13px; color:var(--body); text-align:center; margin:var(--space-4) 0 0; min-height:18px; }

/* Step cards - the generic white wrapper for every step on the single-scroll flow */
.step-card { border:1px solid var(--line); border-radius:18px; padding:var(--space-6); margin:0 0 var(--space-4); box-shadow:var(--shadow-card); }
.step-eyebrow { text-transform:uppercase; letter-spacing:0.08em; font-size:12px; font-weight:700; color:var(--body); margin:0 0 var(--space-4); text-align:center; }

.pill-group { display:flex; flex-wrap:wrap; gap:var(--space-3); }
.pill {
  padding:14px 22px; border:2px solid var(--line); border-radius:999px; background:var(--white);
  color:var(--navy); font-size:16px; font-weight:700; cursor:pointer; white-space:nowrap;
}
.pill.selected { border-color:transparent; background:var(--gradient); color:var(--white); text-shadow:0 1px 2px rgba(0,0,0,0.25); }
.pill:active { transform:scale(0.98); }

/* Bleed-card - the one bold moment on the page. Dollar figure is the hero number, carrying
   the brand gradient as text fill, the only place on the page the gradient is used this way. */
.bleed-card { background:var(--black); border-radius:20px; padding:var(--space-8) var(--space-6); margin:0 0 var(--space-4); text-align:center; }
.bleed-eyebrow { text-transform:uppercase; letter-spacing:0.08em; font-size:12px; font-weight:700; color:#9CA3AF; margin:0 0 var(--space-3); }
.bleed-number {
  display:table; margin:0 auto var(--space-2);
  font-size:52px; font-weight:800; line-height:1; letter-spacing:-0.02em;
  font-variant-numeric:tabular-nums;
  background:var(--gradient); -webkit-background-clip:text; background-clip:text;
  color:transparent; -webkit-text-fill-color:transparent;
}
@supports not (background-clip: text) {
  .bleed-number { color:var(--orange); }
}
.bleed-caption { font-size:14px; color:#C7CBD6; margin:0; }
@keyframes bleed-number-in {
  from { opacity:0; transform:scale(0.85); }
  to   { opacity:1; transform:scale(1); }
}
.bleed-number.animate-in { animation:bleed-number-in 480ms cubic-bezier(0.22,1,0.36,1); }
@media (prefers-reduced-motion: reduce) {
  .bleed-number.animate-in { animation:none; }
}

/* System recommendation cards - one per ticked task, shown under the bleed-card */
.system-card { border:1px solid var(--line); border-radius:16px; padding:var(--space-5); margin:0 0 var(--space-3); box-shadow:var(--shadow-card); }
.system-card:last-child { margin-bottom:0; }
.system-card-head { display:flex; justify-content:space-between; align-items:flex-start; gap:var(--space-3); }
.system-card-name { font-size:16px; font-weight:700; color:var(--navy); line-height:1.35; }
.system-card-value {
  flex:none; font-size:16px; font-weight:800; white-space:nowrap; font-variant-numeric:tabular-nums;
  background:var(--gradient); -webkit-background-clip:text; background-clip:text;
  color:transparent; -webkit-text-fill-color:transparent;
}
@supports not (background-clip: text) {
  .system-card-value { color:var(--magenta); }
}
.system-card-handles { font-size:14px; color:var(--body); margin:var(--space-2) 0 0; }
.system-card-removes { font-size:13px; color:var(--body); font-style:italic; margin:var(--space-1) 0 0; }

/* Recovers-card - the softer, secondary total. Also reused for the missed-work result block. */
.recovers-card {
  border-radius:18px; padding:var(--space-6); margin:0 0 var(--space-4); text-align:center;
  background:linear-gradient(135deg, #EFF6FF, #F5F0FF); box-shadow:var(--shadow-card);
}
.recovers-number { font-size:32px; font-weight:800; color:var(--navy); margin:0 0 var(--space-2); font-variant-numeric:tabular-nums; }

/* CTA card - black, leads into the capture form */
.cta-card { background:var(--black); border-radius:20px; padding:var(--space-8) var(--space-6); margin:0 0 var(--space-4); text-align:center; }
.cta-card h2 { color:var(--white); }
.cta-card h2::after { margin-left:auto; margin-right:auto; }
.cta-card p { color:#C7CBD6; font-size:15px; line-height:1.6; margin:0 0 var(--space-2); }
.cta-card .btn-secondary { background:transparent; border-color:var(--white); color:var(--white); }

.trust-line { font-size:13px; color:var(--body); text-align:center; margin:var(--space-4) 0 0; }

.fine-print { font-size:12px; color:var(--body); text-align:center; margin:var(--space-3) 0 0; }

.slot-list { display:flex; flex-direction:column; gap:var(--space-3); margin:var(--space-2) 0 0; }
.slot-option {
  padding:var(--space-4); border:2px solid var(--line); border-radius:12px; background:var(--white);
  color:var(--navy); font-size:16px; font-weight:600; text-align:left; cursor:pointer;
}
.slot-option.selected { border-color:var(--navy); background:var(--navy); color:var(--white); }

/* Wizard chrome - progress bar + one-question-per-screen navigation */
.progress-track { position:sticky; top:0; z-index:2; height:6px; background:var(--line); }
.progress-fill { height:100%; background:var(--gradient); transition:width 240ms ease; }
@media (prefers-reduced-motion: reduce) { .progress-fill { transition:none; } }
.wizard-screen { }
.back-link {
  display:inline-block; margin:0 0 var(--space-4); border:none; background:none; padding:0;
  color:var(--body); font-size:14px; font-weight:600; cursor:pointer;
}

.yesno-row { display:flex; gap:var(--space-3); margin:var(--space-4) 0 0; }
.yesno-btn {
  flex:1; padding:14px; border:2px solid var(--line); border-radius:12px; background:var(--white);
  color:var(--navy); font-size:16px; font-weight:700; cursor:pointer; min-height:52px;
}
.yesno-btn.selected { border-color:transparent; background:var(--gradient); color:var(--white); text-shadow:0 1px 2px rgba(0,0,0,0.25); }

/* Results tiles - three stacked headline numbers, then plan + payback */
.tile { border:1px solid var(--line); border-radius:16px; padding:var(--space-5); margin:0 0 var(--space-3); box-shadow:var(--shadow-card); }
.tile-label { font-size:13px; color:var(--body); margin:0 0 var(--space-2); }
.tile-value { font-size:28px; font-weight:800; color:var(--navy); font-variant-numeric:tabular-nums; margin:0; }
.tile.total { background:var(--black); border-color:var(--black); }
.tile.total .tile-label { color:#9CA3AF; }
.tile.total .tile-value {
  background:var(--gradient); -webkit-background-clip:text; background-clip:text;
  color:transparent; -webkit-text-fill-color:transparent; font-size:36px;
}
@supports not (background-clip: text) { .tile.total .tile-value { color:var(--orange); } }

.source-list { list-style:none; margin:var(--space-3) 0 0; padding:0; }
.source-list li { font-size:12px; color:var(--body); line-height:1.6; }

/* Dollar-prefixed number input, e.g. admin cost rate on the business screen */
.prefix-input { display:flex; align-items:center; border:2px solid var(--line); border-radius:12px; background:var(--white); min-height:52px; }
.prefix-input span { padding:0 0 0 var(--space-4); font-size:16px; font-weight:700; color:var(--navy); }
.prefix-input input { border:none; min-height:48px; }
.prefix-input:focus-within { outline:3px solid var(--magenta); outline-offset:2px; }

/* Secondary, conditional figure under the hard-cost headline */
.tile.secondary { background:var(--white); border:1px solid var(--line); box-shadow:none; }
.tile.secondary .tile-label { color:var(--body); }
.tile.secondary .tile-value { font-size:22px; color:var(--navy); background:none; -webkit-text-fill-color:initial; }

/* Live bleed counter pinned above the question card during the admin-time questions */
.live-bleed { position:sticky; top:6px; z-index:1; margin:0 0 var(--space-4); padding:var(--space-3) var(--space-5); border-radius:14px; background:var(--black); text-align:center; box-shadow:var(--shadow-card); }
.live-bleed-label { font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#9CA3AF; margin:0 0 2px; }
.live-bleed-value { font-size:24px; font-weight:800; font-variant-numeric:tabular-nums; background:var(--gradient); -webkit-background-clip:text; background-clip:text; color:transparent; -webkit-text-fill-color:transparent; }
@supports not (background-clip: text) { .live-bleed-value { color:var(--orange); } }

.cap-note { font-size:12px; color:var(--body); font-style:italic; margin:var(--space-2) 0 0; }

.charlie-intro { font-size:13px; color:#9CA3AF; margin:0 0 var(--space-4); font-style:italic; }

.door-row { display:flex; flex-direction:column; gap:var(--space-3); margin-top:var(--space-6); }
.door-card { border:2px solid var(--line); border-radius:16px; padding:var(--space-5); text-align:left; background:var(--white); cursor:pointer; }
.door-card h3 { color:var(--navy); font-size:16px; margin:0 0 4px; }
.door-card p { font-size:13px; color:var(--body); margin:0; }
.cta-card .door-card { background:transparent; border-color:rgba(255,255,255,0.35); }
.cta-card .door-card h3 { color:var(--white); }
.cta-card .door-card p { color:#C7CBD6; }
.cta-card .door-card:disabled { opacity:0.6; cursor:not-allowed; }
`;
