/* ═══════════════ S3 REVIEW ═══════════════
   Phase-2 layout per proposed flow.xlsx:
     - Campaign Summary (ad format + display/slot/token counts)
     - Logging section (visible only when not authenticated)
     - Payment section (balance vs required; inline buy options)
     - Collapsible "Booked Locations / Slots Detail"
   Bottom main button is "Continue to Debit Tokens" and is disabled
   until the user is authed AND has enough tokens. */

function buildReview() {
  const booked = ALL_DPS.filter((d) => S.checked.has(d.id));
  const totalSlots = booked.reduce(
    (a, d) => a + (S.slots[d.id] || []).length,
    0,
  );
  const totalTokens = booked.reduce(
    (a, dp) => a + (S.slots[dp.id] || []).length * dp.tokensPerSlot,
    0,
  );
  const hasTokens = totalTokens > 0 && S.tokenBalance >= totalTokens;
  const insufficient = totalTokens > 0 && S.tokenBalance < totalTokens;

  /* Ad preview */
  const thumb = document.getElementById("rvAdThumb");
  const sub = document.getElementById("rvAdSub");
  document.getElementById("rvName").textContent = S.media.label;
  if (S.media.label === "Video AD") {
    thumb.className = "rv-ad-thumb video-thumb";
    thumb.innerHTML = `<i class="fas fa-play" style="color:#fff;font-size:20px"></i>`;
    sub.textContent = S.vidDur
      ? `${S.vidDur}s · ${S.loopOn ? "Loop on" : "Loop off"}`
      : "No video uploaded";
  } else if (S.media.label === "Image AD") {
    thumb.className = "rv-ad-thumb";
    thumb.innerHTML = `<i class="fas fa-image" style="color:var(--blue)"></i>`;
    sub.textContent = "Visual display ad";
  } else if (S.media.label === "Text AD") {
    thumb.className = "rv-ad-thumb";
    thumb.style.background = "var(--ink)";
    thumb.innerHTML = `<span style="color:#fff;font-size:11px;font-weight:700;padding:4px;text-align:center;line-height:1.2">Aa</span>`;
    sub.textContent = "Text-based message";
  } else {
    thumb.className = "rv-ad-thumb";
    thumb.innerHTML = `<i class="fas fa-th-large" style="color:var(--blue)"></i>`;
    sub.textContent = "Pre-designed template";
  }

  /* Stats */
  document.getElementById("rvDPs").textContent = booked.length;
  document.getElementById("rvSlots").textContent = totalSlots;
  document.getElementById("rvTokens").textContent =
    totalTokens.toLocaleString();

  /* Logging (shown only when not authed) */
  const loggingEl = document.getElementById("rvLogging");
  loggingEl.style.display = S.authed ? "none" : "";

  /* Payment section — hidden entirely until the user is authenticated.
     Rationale: nothing in here (balance line, Buy Package / Buy Tokens /
     Coupon) is actionable without an account, so we keep Review clean
     and surface Login/Register first. Once authed, payment shows and
     the buy-options only appear when the balance is insufficient. */
  const paySec = document.getElementById("rvPayment");
  const payLine = document.getElementById("rvPayLine");
  const payOpts = document.getElementById("rvPayOpts");
  if (!S.authed) {
    paySec.style.display = "none";
  } else {
    paySec.style.display = "";
    payLine.classList.remove("insufficient", "sufficient");
    if (!totalTokens) {
      payLine.innerHTML =
        "No slots booked yet — add slots to calculate cost.";
    } else if (insufficient) {
      payLine.innerHTML =
        `This campaign needs <strong>${totalTokens.toLocaleString()}</strong> tokens. ` +
        `You have <strong>${S.tokenBalance.toLocaleString()}</strong>. ` +
        `Top up with <strong>${(totalTokens - S.tokenBalance).toLocaleString()}</strong> more.`;
      payLine.classList.add("insufficient");
    } else {
      payLine.innerHTML =
        `This campaign needs <strong>${totalTokens.toLocaleString()}</strong> tokens. ` +
        `You have <strong>${S.tokenBalance.toLocaleString()}</strong>. ` +
        `Enough to proceed.`;
      payLine.classList.add("sufficient");
    }
    /* Show buy options only when the user needs more tokens. */
    payOpts.style.display = insufficient ? "flex" : "none";
  }

  /* Booked locations rows (inside the collapsible) */
  const rows = document.getElementById("rvRows");
  if (!booked.length) {
    rows.innerHTML = `<div style="padding:14px;font-size:13px;color:var(--muted)">No display points selected.</div>`;
  } else {
    rows.innerHTML = booked
      .map((dp) => {
        const slotCount = (S.slots[dp.id] || []).length;
        const dpReq = slotCount * dp.tokensPerSlot;
        const tokLabel =
          dpReq === 1 ? "1 token" : `${dpReq.toLocaleString()} tokens`;
        return `<div class="rv-row"><div class="rv-dp-icon"><i class="fas fa-tv"></i></div><div style="flex:1;min-width:0">
<div class="rv-dp-head"><div class="rv-dp-name">${dp.name}</div><div class="rv-dp-tok-req">${tokLabel}</div></div><div class="rv-dp-sub">${dp.cityName} · ${dp.tokensPerSlot} token/slot · ${slotCount} slot${slotCount !== 1 ? "s" : ""}</div>
<div class="rv-chips">${slotCount ? (S.slots[dp.id] || []).map((s) => `<div class="rv-chip">${s.time}</div>`).join("") : `<div style="font-size:11px;color:var(--muted);font-style:italic">No slots booked</div>`}</div>
    </div></div>`;
      })
      .join("");
  }

  /* Sync main button — "Continue to Debit Tokens", disabled when
     gates fail. Clicking while enabled proceeds to Payment (step 4). */
  if (S.step === 3) {
    const btn = document.getElementById("mainBtn");
    btn.style.display = "block";
    btn.textContent = "Continue to Debit Tokens";
    btn.disabled = !(S.authed && hasTokens && booked.length);
  }
}

function toggleReviewDetails() {
  const hd = document.querySelector("#s3 .rv-collapse-hd");
  const body = document.getElementById("rvCollapseBody");
  const open = !body.classList.contains("open");
  body.classList.toggle("open", open);
  hd.classList.toggle("open", open);
}

/* Called by the inline Login/Register buttons on the Review step.
   Routes to the auth screen and preselects the tab the user tapped. */
function goFromReviewToAuth(tab) {
  goToAuth("review");
  setTimeout(() => switchAuthTab(tab || "login"), 30);
}
