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

.container { max-width:480px; margin:0 auto; padding:var(--space-8) var(--space-5) var(--space-12); }
.hidden { display:none !important; }

h1 { color:var(--navy); font-size:28px; font-weight:800; line-height:1.3; margin:0 0 var(--space-4); }
h2 { color:var(--navy); font-size:22px; font-weight:700; line-height:1.3; margin:var(--space-2) 0 var(--space-2); }
h2::after { content:""; display:block; width:48px; height:3px; margin-top:var(--space-2); background:var(--gradient); border-radius:2px; }
p.sub { font-size:16px; line-height:1.5; margin:0 0 var(--space-6); }
p.help { font-size:13px; color:var(--body); margin:0 0 var(--space-4); }

.rule { height:4px; border:none; border-radius:2px; background:var(--gradient); margin:var(--space-6) 0; }

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

.task-row { border:1px solid var(--line); border-radius:18px; padding:var(--space-5); margin:0 0 var(--space-4); box-shadow:var(--shadow-card); }
.task-row.checked { border-color:var(--magenta); }
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
  .industry-tile:hover { border-color:var(--navy); box-shadow:0 4px 16px rgba(20,33,61,0.1); }
  .slot-option:hover { border-color:var(--navy); }
}

.reveal-eyebrow { text-transform:uppercase; letter-spacing:0.08em; font-size:12px; color:var(--body); text-align:center; margin:0 0 var(--space-3); }
.reveal-hours { font-size:40px; font-weight:800; color:var(--navy); text-align:center; margin:0 0 var(--space-2); }
.reveal-dollars { font-size:18px; font-weight:600; color:var(--body); text-align:center; margin:0 0 var(--space-3); font-variant-numeric:tabular-nums; }

.reveal-hero-lead { font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:var(--body); text-align:center; margin:0 0 var(--space-1); }
.reveal-hero-number {
  display:table; margin:0 auto var(--space-1);
  font-size:64px; font-weight:800; line-height:1; letter-spacing:-0.02em;
  font-variant-numeric:tabular-nums;
  background:var(--gradient); -webkit-background-clip:text; background-clip:text;
  color:transparent; -webkit-text-fill-color:transparent;
}
@supports not (background-clip: text) {
  .reveal-hero-number { color:var(--navy); }
}
.reveal-hero-unit { font-size:14px; font-weight:600; color:var(--navy); text-align:center; margin:0 0 var(--space-4); }
@keyframes reveal-hero-in {
  from { opacity:0; transform:scale(0.85); }
  to   { opacity:1; transform:scale(1); }
}
.reveal-hero-number.animate-in { animation:reveal-hero-in 480ms cubic-bezier(0.22,1,0.36,1); }
@media (prefers-reduced-motion: reduce) {
  .reveal-hero-number.animate-in { animation:none; }
}

.line-items { list-style:none; padding:0; margin:var(--space-4) 0 0; }
.line-items li { display:flex; justify-content:space-between; gap:var(--space-3); padding:var(--space-3) 0; border-bottom:1px solid #F0F0F0; font-size:14px; }
.line-items li span:first-child { color:var(--body); }
.line-items li span:last-child { color:var(--navy); font-weight:700; text-align:right; font-variant-numeric:tabular-nums; }

.payback { font-size:14px; color:var(--body); font-weight:600; text-align:center; margin:var(--space-4) 0 0; }

.result-card { border:1px solid var(--line); border-radius:18px; padding:var(--space-6); margin:0 0 var(--space-4); box-shadow:var(--shadow-card); }
.result-card label { margin-top:var(--space-3); }
.upside-figure { font-size:40px; font-weight:800; color:var(--navy); text-align:center; margin:0 0 var(--space-3); font-variant-numeric:tabular-nums; }

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

.start-card { border:1px solid var(--line); border-radius:20px; padding:var(--space-8) var(--space-6); box-shadow:var(--shadow-card); }
.start-card h1, .start-card p.sub { text-align:center; }
.start-card .sub-bold { font-weight:700; color:var(--navy); }

.eyebrow-badge {
  display:table; margin:0 auto var(--space-4); padding:var(--space-2) var(--space-4); border-radius:999px;
  background:#EEF4FF; color:var(--navy); font-size:12px; font-weight:700;
  text-transform:uppercase; letter-spacing:0.06em; text-align:center;
}

.industry-tiles { display:grid; grid-template-columns:1fr 1fr; gap:var(--space-3); margin:var(--space-5) 0; }
.industry-tile {
  padding:var(--space-6) var(--space-4); border:2px solid var(--line); border-radius:16px; background:var(--white);
  color:var(--navy); font-size:16px; font-weight:700; cursor:pointer; text-align:center;
  min-height:84px; display:flex; align-items:center; justify-content:center;
  box-shadow:var(--shadow-card);
}
.industry-tile:active { transform:scale(0.98); }

.framing-line { font-size:16px; font-style:italic; color:var(--body); text-align:center; margin:0 0 var(--space-6); line-height:1.5; }

.trust-line { font-size:13px; color:var(--body); text-align:center; margin:var(--space-4) 0 0; }

.fine-print { font-size:12px; color:var(--body); text-align:center; margin:var(--space-3) 0 0; }

.slot-list { display:flex; flex-direction:column; gap:var(--space-3); margin:var(--space-2) 0 0; }
.slot-option {
  padding:var(--space-4); border:2px solid var(--line); border-radius:12px; background:var(--white);
  color:var(--navy); font-size:16px; font-weight:600; text-align:left; cursor:pointer;
}
.slot-option.selected { border-color:var(--navy); background:var(--navy); color:var(--white); }
`;
