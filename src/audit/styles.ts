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

.container { max-width:480px; margin:0 auto; padding:32px 20px 56px; }
.hidden { display:none !important; }

h1 { color:var(--navy); font-size:26px; line-height:1.3; margin:0 0 14px; }
h2 { color:var(--navy); font-size:22px; line-height:1.3; margin:8px 0 6px; }
h2::after { content:""; display:block; width:48px; height:3px; margin-top:10px; background:var(--gradient); border-radius:2px; }
h3 { color:var(--navy); font-size:15px; margin:0 0 6px; }
h3::after { content:""; display:block; width:36px; height:3px; margin-top:8px; background:var(--gradient); border-radius:2px; }
p.sub { font-size:16px; line-height:1.5; margin:0 0 28px; }
p.help { font-size:13px; color:var(--body); margin:0 0 14px; }

.rule { height:4px; border:none; border-radius:2px; background:var(--gradient); margin:22px 0; }

label { display:block; font-size:14px; font-weight:600; color:var(--navy); margin:18px 0 6px; }
input[type=text], input[type=tel], input[type=email], input[type=number], select {
  width:100%; padding:16px; border:2px solid var(--line); border-radius:12px; font-size:16px;
  min-height:52px; font-family:inherit; color:var(--navy); background:var(--white);
}
input:focus-visible, select:focus-visible, button:focus-visible, input[type=range]:focus-visible {
  outline:3px solid var(--magenta); outline-offset:2px;
}

.slider-row { display:flex; align-items:center; gap:14px; }
input[type=range] { flex:1; -webkit-appearance:none; appearance:none; height:8px; border-radius:4px; background:var(--gradient); }
input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:26px; height:26px; border-radius:50%; background:var(--white); border:3px solid var(--navy); cursor:pointer; }
input[type=range]::-moz-range-thumb { width:26px; height:26px; border-radius:50%; background:var(--white); border:3px solid var(--navy); cursor:pointer; }
output { min-width:76px; text-align:right; font-weight:700; color:var(--navy); font-size:16px; }

.task-row { border:1px solid var(--line); border-radius:18px; padding:20px; margin:0 0 14px; box-shadow:0 1px 3px rgba(20,33,61,0.06); }
.task-row.checked { border-color:var(--magenta); }
.task-check { display:flex; align-items:center; gap:12px; cursor:pointer; }
.task-check input[type=checkbox] { width:22px; height:22px; flex:none; accent-color:var(--magenta); }
.task-check span { font-size:16px; font-weight:600; color:var(--navy); }
.task-slider { margin-top:14px; display:none; }
.task-row.checked .task-slider { display:block; }

.task-note { font-size:12px; line-height:1.5; color:var(--body); font-style:italic; margin:8px 0 0 34px; }

.task-nudge {
  display:flex; align-items:flex-start; gap:8px; margin-top:12px; padding:10px 12px;
  border:1px solid var(--line); border-radius:12px; background:#FAFAFB;
}
.task-nudge span { flex:1; font-size:12px; line-height:1.5; color:var(--body); }
.task-nudge-dismiss {
  flex:none; border:none; background:none; color:var(--body); font-size:16px; line-height:1;
  cursor:pointer; padding:2px 4px; opacity:0.6;
}
.task-nudge-dismiss:hover { opacity:1; }

.clamp-note { font-size:13px; color:var(--orange); font-weight:600; margin:10px 0 0; }

.btn-primary {
  display:block; width:100%; padding:18px 20px; border:none; border-radius:999px;
  background:var(--gradient); color:var(--white); font-size:17px; font-weight:700;
  text-shadow:0 1px 2px rgba(0,0,0,0.25);
  cursor:pointer; min-height:56px; margin-top:28px;
}
.btn-primary:active { transform:scale(0.98); }
.btn-primary:disabled { opacity:0.45; cursor:not-allowed; }
.btn-primary.live { background:linear-gradient(90deg,#ef4444,#b91c1c); }

.btn-secondary {
  display:block; width:100%; padding:16px 20px; border:2px solid var(--navy); border-radius:999px;
  background:var(--white); color:var(--navy); font-size:16px; font-weight:700;
  cursor:pointer; min-height:52px; margin-top:12px;
}
.btn-secondary:active { transform:scale(0.98); }

.reveal-eyebrow { text-transform:uppercase; letter-spacing:0.08em; font-size:12px; color:var(--body); text-align:center; margin:0 0 10px; }
.reveal-hours { font-size:40px; font-weight:800; color:var(--navy); text-align:center; margin:0 0 6px; }
.reveal-dollars { font-size:18px; font-weight:600; color:var(--body); text-align:center; margin:0 0 12px; }

.line-items { list-style:none; padding:0; margin:16px 0 0; }
.line-items li { display:flex; justify-content:space-between; gap:12px; padding:12px 0; border-bottom:1px solid #F0F0F0; font-size:15px; }
.line-items li span:first-child { color:var(--body); }
.line-items li span:last-child { color:var(--navy); font-weight:700; text-align:right; }

.payback { font-size:14px; color:var(--body); font-weight:600; text-align:center; margin:16px 0 0; }

.result-card { border:1px solid var(--line); border-radius:18px; padding:24px; margin:0 0 16px; box-shadow:0 1px 3px rgba(20,33,61,0.06); }
.result-card label { margin-top:12px; }
.upside-figure { font-size:40px; font-weight:800; color:var(--navy); text-align:center; margin:0 0 12px; }

.info-box { border:1px solid var(--line); border-radius:14px; padding:16px 18px; margin:0 0 16px; background:#FAFAFB; }
.info-box p { font-size:13px; line-height:1.6; color:var(--body); margin:0; }

.disclaimer { font-size:13px; color:var(--body); margin:20px 0 0; }

.summary-card { border:1px solid var(--line); border-radius:18px; padding:24px; margin:0 0 20px; box-shadow:0 1px 3px rgba(20,33,61,0.06); }
.summary-card .reveal-hours { font-size:28px; margin:0 0 6px; }
.summary-card .reveal-dollars { font-size:16px; margin:0; }

.pov-block { border:2px solid #F3E8FF; border-radius:14px; padding:20px; margin:0 0 28px; }
.pov-block p { font-size:14px; line-height:1.6; margin:0; }

.form-error { color:#B91C1C; font-size:14px; margin:14px 0 0; }
.form-success { color:#15803D; font-size:14px; margin:14px 0 0; font-weight:600; }

.status { font-size:13px; color:var(--body); text-align:center; margin:14px 0 0; min-height:18px; }

.start-card { border:1px solid var(--line); border-radius:20px; padding:28px 22px; box-shadow:0 1px 3px rgba(20,33,61,0.06); }
.start-card h1, .start-card p.sub { text-align:center; }
.start-card .sub-bold { font-weight:700; color:var(--navy); }

.eyebrow-badge {
  display:table; margin:0 auto 16px; padding:6px 16px; border-radius:999px;
  background:#EEF4FF; color:var(--navy); font-size:12px; font-weight:700;
  text-transform:uppercase; letter-spacing:0.06em; text-align:center;
}

.industry-tiles { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:20px 0; }
.industry-tile {
  padding:24px 12px; border:2px solid var(--line); border-radius:16px; background:var(--white);
  color:var(--navy); font-size:16px; font-weight:700; cursor:pointer; text-align:center;
  min-height:84px; display:flex; align-items:center; justify-content:center;
  box-shadow:0 1px 3px rgba(20,33,61,0.06);
}
.industry-tile:active { transform:scale(0.98); }

.framing-line { font-size:15px; font-style:italic; color:var(--body); text-align:center; margin:0 0 24px; line-height:1.5; }

.trust-line { font-size:13px; color:var(--body); text-align:center; margin:18px 0 0; }

.fine-print { font-size:12px; color:var(--body); text-align:center; margin:10px 0 0; }

.slot-list { display:flex; flex-direction:column; gap:10px; margin:8px 0 0; }
.slot-option {
  padding:14px 16px; border:2px solid var(--line); border-radius:12px; background:var(--white);
  color:var(--navy); font-size:15px; font-weight:600; text-align:left; cursor:pointer;
}
.slot-option.selected { border-color:var(--navy); background:var(--navy); color:var(--white); }
`;
