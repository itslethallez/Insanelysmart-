/**
 * Deliberately self-contained: no import from src/audit/styles.ts or any other Insanely
 * Smart-branded module. This page has to read as sturtyounglearners.com.au, not as a page
 * from the tool that's hosting it - Mick's name and branding appear nowhere here.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

:root {
  --navy:#1F2668;
  --pink:#D81B7D;
  --orange:#F28C2B;
  --aqua:#20B8D4;
  --yellow:#F3C623;
  --bg:#F3F3F5;
  --white:#ffffff;
  --line:#E3E3EA;
  --error:#B3261E;
}
* { box-sizing:border-box; }
html, body { margin:0; padding:0; }
body {
  background:var(--bg);
  color:var(--navy);
  font-family:'Poppins', -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height:1.5;
  -webkit-font-smoothing:antialiased;
}
.container { max-width:520px; margin:0 auto; padding:48px 24px 0; }
.hidden { display:none !important; }

.brand-header { text-align:center; margin-bottom:40px; }
.brand-logo { max-width:260px; width:100%; height:auto; display:block; margin:0 auto 12px; }
.brand-meta { font-size:16px; color:var(--navy); opacity:0.75; margin:0; }

h1 {
  font-size:34px; font-weight:700; letter-spacing:-0.02em; color:var(--navy);
  text-align:center; margin:0 0 14px; line-height:1.25;
}
p.sub { font-size:18px; text-align:center; margin:0 0 40px; color:var(--navy); opacity:0.8; }

.card {
  background:var(--white); border-radius:28px;
  padding:32px 24px; box-shadow:0 8px 24px rgba(31,38,104,0.08);
}

.field-group { margin:0 0 20px; }
.field-group:last-child { margin-bottom:0; }
label { display:block; font-size:16px; font-weight:600; color:var(--navy); margin:0 0 7px; }
label .optional { font-weight:400; opacity:0.65; text-transform:none; letter-spacing:0; }
input[type=text], input[type=tel], input[type=email], input[type=date], input[type=month], select {
  width:100%; padding:13px 14px; border:1.5px solid var(--line); border-radius:14px; font-size:16px;
  min-height:48px; font-family:inherit; color:var(--navy); background:var(--white);
}
input:focus-visible, select:focus-visible, button:focus-visible {
  outline:2.5px solid var(--aqua); outline-offset:1px;
}
.checkbox-row { display:flex; align-items:center; gap:8px; margin-top:8px; }
.checkbox-row input[type=checkbox] { width:18px; height:18px; accent-color:var(--pink); }
.checkbox-row label { margin:0; font-weight:600; font-size:15px; }

.section-divider { border:none; border-top:1.5px solid var(--line); margin:28px 0; }
.section-label { font-size:13px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:var(--orange); margin:0 0 16px; }

.consent-line { font-size:15px; color:var(--navy); opacity:0.8; text-align:center; margin:26px 0 16px; }

.btn-primary {
  display:block; width:100%; border:none; border-radius:999px;
  padding:18px 36px; font-family:inherit; font-size:20px; font-weight:600;
  background:var(--pink); color:var(--white);
  box-shadow:0 4px 10px rgba(216,27,125,0.25);
  cursor:pointer; min-height:48px;
}
.btn-primary:active { transform:scale(0.99); }
.btn-primary:disabled { opacity:0.5; cursor:not-allowed; box-shadow:none; }
@media (hover:hover) {
  .btn-primary:not(:disabled):hover { background:#C4166F; }
}

.form-error { color:var(--error); font-size:14px; margin:14px 0 0; text-align:center; }

.confirm-card { text-align:center; }
.confirm-card h2 { font-size:28px; font-weight:700; color:var(--navy); margin:0 0 12px; }
.confirm-card p { font-size:18px; color:var(--navy); opacity:0.8; margin:0; }

footer.site-footer {
  background:var(--navy); color:var(--white); padding:64px 24px; text-align:center;
  margin-top:48px; font-size:15px;
}
footer.site-footer p { margin:0; color:rgba(255,255,255,0.8); }
`;

/** Prevents the embedded JSON from breaking out of its <script> tag. */
function safeJsonForScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function renderSturtEnquiryPage(): string {
  const config = {};

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Enquire - Sturt Young Learners</title>
<style>${STYLES}</style>
</head>
<body>
<main class="container">
  <div class="brand-header">
    <img src="/sturt-logo.svg" alt="Sturt Young Learners" class="brand-logo" />
    <p class="brand-meta">151 Sturt Road, Dover Gardens SA 5048 &middot; 08 8296 9329</p>
  </div>

  <h1>Enquire about a place for your child</h1>
  <p class="sub">Tell us a little about your family and we'll be in touch to arrange a tour.</p>

  <div class="card" id="enquiry-card">
    <form id="enquiry-form">
      <div class="field-group">
        <label for="input-parent-first">Parent first name</label>
        <input type="text" id="input-parent-first" name="parentFirstName" autocomplete="given-name" required />
      </div>
      <div class="field-group">
        <label for="input-parent-last">Parent last name</label>
        <input type="text" id="input-parent-last" name="parentLastName" autocomplete="family-name" required />
      </div>
      <div class="field-group">
        <label for="input-mobile">Mobile number</label>
        <input type="tel" id="input-mobile" name="mobile" autocomplete="tel" inputmode="tel" placeholder="04XX XXX XXX" required />
      </div>
      <div class="field-group">
        <label for="input-email">Email</label>
        <input type="email" id="input-email" name="email" autocomplete="email" required />
      </div>

      <hr class="section-divider" />
      <p class="section-label">About your child (optional)</p>

      <div class="field-group">
        <label for="input-child-first">Child's first name <span class="optional">(optional)</span></label>
        <input type="text" id="input-child-first" name="childFirstName" autocomplete="off" />
      </div>
      <div class="field-group">
        <label for="input-child-dob" id="label-child-date">Child's date of birth <span class="optional">(optional)</span></label>
        <input type="date" id="input-child-dob" name="childDob" />
        <div class="checkbox-row">
          <input type="checkbox" id="input-not-born-yet" name="notBornYet" />
          <label for="input-not-born-yet">Not born yet</label>
        </div>
      </div>
      <div class="field-group">
        <label for="input-days-needed">Days needed <span class="optional">(optional)</span></label>
        <select id="input-days-needed" name="daysNeeded">
          <option value="">Not sure yet</option>
          <option value="1 day/week">1 day/week</option>
          <option value="2 days/week">2 days/week</option>
          <option value="3 days/week">3 days/week</option>
          <option value="4 days/week">4 days/week</option>
          <option value="Full time (5 days)">Full time (5 days)</option>
        </select>
      </div>
      <div class="field-group">
        <label for="input-preferred-start">Preferred start date <span class="optional">(optional, month is fine)</span></label>
        <input type="month" id="input-preferred-start" name="preferredStart" />
      </div>
      <div class="field-group">
        <label for="input-postcode">Postcode <span class="optional">(optional)</span></label>
        <input type="text" id="input-postcode" name="postcode" inputmode="numeric" autocomplete="postal-code" />
      </div>
      <div class="field-group">
        <label for="input-hear-about">How did you hear about us? <span class="optional">(optional)</span></label>
        <input type="text" id="input-hear-about" name="hearAbout" autocomplete="off" />
      </div>

      <p class="consent-line">We'll text you straight away to confirm we've got this.</p>
      <button type="submit" class="btn-primary" id="btn-submit">Send my enquiry</button>
      <p class="form-error hidden" id="form-error"></p>
    </form>

    <div class="hidden confirm-card" id="confirm-card">
      <h2>Thanks, we've got it.</h2>
      <p>You'll get a text shortly confirming your enquiry. We'll be in touch soon to arrange a tour.</p>
    </div>
  </div>

</main>

<footer class="site-footer">
  <p>Sturt Young Learners &middot; 151 Sturt Road, Dover Gardens SA 5048 &middot; 08 8296 9329</p>
</footer>

<script>window.__STURT_CONFIG__ = ${safeJsonForScript(config)};</script>
<script>${CLIENT_SCRIPT}</script>
</body>
</html>`;
}

const CLIENT_SCRIPT = `
(function () {
  "use strict";

  var dobInput = document.getElementById("input-child-dob");
  var dobLabel = document.getElementById("label-child-date");
  var notBornYetCheckbox = document.getElementById("input-not-born-yet");

  notBornYetCheckbox.addEventListener("change", function () {
    if (notBornYetCheckbox.checked) {
      dobLabel.firstChild.textContent = "Expected due date ";
      dobInput.setAttribute("name", "childDueDate");
    } else {
      dobLabel.firstChild.textContent = "Child's date of birth ";
      dobInput.setAttribute("name", "childDob");
    }
  });

  var form = document.getElementById("enquiry-form");
  var errorEl = document.getElementById("form-error");
  var submitBtn = document.getElementById("btn-submit");
  var confirmCard = document.getElementById("confirm-card");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    errorEl.classList.add("hidden");

    var parentFirstName = document.getElementById("input-parent-first").value.trim();
    var parentLastName = document.getElementById("input-parent-last").value.trim();
    var mobile = document.getElementById("input-mobile").value.trim();
    var email = document.getElementById("input-email").value.trim();

    if (!parentFirstName || !parentLastName || !mobile || !email) {
      errorEl.textContent = "Please fill in your name, mobile number and email.";
      errorEl.classList.remove("hidden");
      return;
    }

    var payload = {
      parentFirstName: parentFirstName,
      parentLastName: parentLastName,
      mobile: mobile,
      email: email,
      childFirstName: document.getElementById("input-child-first").value.trim() || undefined,
      daysNeeded: document.getElementById("input-days-needed").value || undefined,
      preferredStart: document.getElementById("input-preferred-start").value || undefined,
      postcode: document.getElementById("input-postcode").value.trim() || undefined,
      hearAbout: document.getElementById("input-hear-about").value.trim() || undefined
    };

    var dobValue = dobInput.value || undefined;
    if (dobValue) {
      if (notBornYetCheckbox.checked) {
        payload.childDueDate = dobValue;
      } else {
        payload.childDob = dobValue;
      }
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    fetch("/sturt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) return res.json().then(function (body) { throw new Error(body.error || "save-failed"); });
        return res.json();
      })
      .then(function () {
        submitBtn.textContent = "Sent";
        form.classList.add("hidden");
        confirmCard.classList.remove("hidden");
      })
      .catch(function (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send my enquiry";
        errorEl.textContent = err.message && err.message !== "save-failed"
          ? err.message
          : "Could not send that just now. Check your connection and try again.";
        errorEl.classList.remove("hidden");
      });
  });
})();
`;
