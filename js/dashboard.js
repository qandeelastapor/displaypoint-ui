/* ═══════════════ DASHBOARD-1 (entry screen) ═══════════════
   Tap targets on the dashboard:
     • Location header → bulk choice for ALL DPs in that location
         (First Available Slot = pre-book first free slot today on
          every DP in the location, Manual Time = pick per DP)
     • Individual DP row  → single-DP choice (same two options)
   Bottom sheet shows the title/context of whatever was tapped and
   routes the chosen action via S.pendingChoice. */

/* Today for the prototype — aligned with BUSY_SLOTS seed data. */
const ONE_SHOT_TODAY = "2026-03-18";

function getNearestLocations() {
  const ids = [];
  for (const c of ALL_CITIES) {
    if (ids.length >= 3) break;
    if (ALL_DPS.some((d) => d.city === c.id)) ids.push(c.id);
  }
  return ids
    .map((id) => ALL_CITIES.find((c) => c.id === id))
    .filter(Boolean);
}

function renderDashboard() {
  renderDashTutorial();
  renderDashLocs();
}

/* ── Tutorial slider ────────────────────────────────────────────
   Horizontal swipe/scroll carousel of how-to slides. Each slide has
   its own accent color, icon, and short description. Dots below
   sync with the visible slide via scroll position. */
const TUTORIAL_SLIDES = [
  {
    icon: "fa-location-dot",
    title: "1. Pick a Location",
    body: "Tap any nearby location or display point to start a One Shot campaign.",
    bg1: "#eef3ff",
    bg2: "#dbeafe",
    accent: "#2355e0",
  },
  {
    icon: "fa-bolt",
    title: "2. Choose a Slot",
    body: "Take the first available slot instantly or hand-pick your time.",
    bg1: "#fef3c7",
    bg2: "#fde68a",
    accent: "#d97706",
  },
  {
    icon: "fa-photo-film",
    title: "3. Upload Your Ad",
    body: "Add a video, image, text, or pick a ready-made template.",
    bg1: "#ecfdf5",
    bg2: "#d1fae5",
    accent: "#059669",
  },
  {
    icon: "fa-receipt",
    title: "4. Review & Pay",
    body: "Confirm the campaign, log in, and debit tokens securely.",
    bg1: "#fdf2f8",
    bg2: "#fbcfe8",
    accent: "#db2777",
  },
  {
    icon: "fa-circle-check",
    title: "5. Go Live",
    body: "Your ad rolls out across the booked display points. Done!",
    bg1: "#eef2ff",
    bg2: "#e0e7ff",
    accent: "#6366f1",
  },
];

/* Auto-advance timer — cleared whenever we re-render or leave the view. */
let _tutAutoTimer = null;
const TUTORIAL_AUTO_MS = 2500;

function renderDashTutorial() {
  const track = document.getElementById("dashTutTrack");
  const dots = document.getElementById("dashTutDots");
  if (!track || !dots) return;
  track.innerHTML = TUTORIAL_SLIDES.map(
    (s, i) => `
      <div class="dash-tut-slide" data-idx="${i}" style="background:linear-gradient(135deg, ${s.bg1} 0%, ${s.bg2} 100%)">
        <div class="dash-tut-slide-ic" style="color:${s.accent}">
          <i class="fas ${s.icon}"></i>
        </div>
        <div class="dash-tut-slide-body">
          <div class="dash-tut-slide-title" style="color:${s.accent}">${s.title}</div>
          <div class="dash-tut-slide-sub">${s.body}</div>
        </div>
      </div>`,
  ).join("");
  dots.innerHTML = TUTORIAL_SLIDES.map(
    (_, i) => `<div class="dash-tut-dot${i === 0 ? " on" : ""}" data-idx="${i}" onclick="scrollTutorialTo(${i}, true)"></div>`,
  ).join("");

  const syncDot = () => {
    const i = Math.round(track.scrollLeft / track.clientWidth);
    dots.querySelectorAll(".dash-tut-dot").forEach((d, idx) => {
      d.classList.toggle("on", idx === i);
    });
  };
  track.onscroll = syncDot;

  /* Pause auto-advance while the user is touching / mousing the slider,
     resume shortly after they let go. */
  const pause = () => stopTutorialAuto();
  const resume = () => startTutorialAuto();
  track.ontouchstart = pause;
  track.ontouchend = () => setTimeout(resume, 2500);
  track.onmouseenter = pause;
  track.onmouseleave = resume;

  startTutorialAuto();
}

function startTutorialAuto() {
  stopTutorialAuto();
  _tutAutoTimer = setInterval(() => {
    const track = document.getElementById("dashTutTrack");
    /* Stop auto-advance if the dashboard view is not on screen — no
       point animating a hidden carousel. */
    if (!track || S.view !== "dashboard") {
      stopTutorialAuto();
      return;
    }
    const cur = Math.round(track.scrollLeft / track.clientWidth);
    const next = (cur + 1) % TUTORIAL_SLIDES.length;
    track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
  }, TUTORIAL_AUTO_MS);
}

function stopTutorialAuto() {
  if (_tutAutoTimer) {
    clearInterval(_tutAutoTimer);
    _tutAutoTimer = null;
  }
}

function scrollTutorialTo(i, userInitiated) {
  const track = document.getElementById("dashTutTrack");
  if (!track) return;
  track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
  if (userInitiated) {
    /* Brief pause after a manual tap so the user can read that slide. */
    stopTutorialAuto();
    setTimeout(startTutorialAuto, 4000);
  }
}

function renderDashLocs() {
  const host = document.getElementById("dashLocs");
  const locs = getNearestLocations();
  host.innerHTML = locs
    .map((city, i) => {
      const dps = ALL_DPS.filter((d) => d.city === city.id).slice(0, 4);
      const rows = dps
        .map(
          (dp) => `
          <div class="dash-dp-row" onclick="openDPChoice('${dp.id}')">
            <div class="dash-dp-row-ic"><i class="fas fa-tv"></i></div>
            <div class="dash-dp-row-body">
              <div class="dash-dp-row-name">${dp.name}</div>
              <div class="dash-dp-row-meta">${dp.type}</div>
            </div>
            <div class="dash-dp-row-rate">${dp.tokensPerSlot} tk/slot</div>
            <div
              class="dash-dp-row-info"
              onclick="event.stopPropagation();toast('${dp.name} — ${dp.type}, ${dp.tokensPerSlot} tokens per slot')"
            >
              <i class="fas fa-info"></i>
            </div>
          </div>`,
        )
        .join("");
      return `
        <div class="dash-loc-group">
          <div class="dash-loc-hdr" onclick="openLocationChoice('${city.id}')">
            <div class="dash-loc-idx">${i + 1}</div>
            <div class="dash-loc-name">${city.name}</div>
            <div class="dash-loc-distance">
              <i class="fas fa-location-dot"></i>${((i + 1) * 1.2).toFixed(
                1,
              )} km
            </div>
            <div
              class="dash-loc-info"
              onclick="event.stopPropagation();toast('${city.name} — ${city.region}')"
            >
              <i class="fas fa-info"></i>
            </div>
            <i class="fas fa-chevron-right dash-loc-go"></i>
          </div>
          ${rows}
        </div>`;
    })
    .join("");
}

/* ── Choice bottom sheet ─────────────────────────────────────────
   Used for both single-DP and whole-location taps. S.pendingChoice
   tracks which kind is pending so the two action buttons know what
   to do on confirm. */

function openLocationChoice(cityId) {
  const city = ALL_CITIES.find((c) => c.id === cityId);
  if (!city) return;
  const dps = ALL_DPS.filter((d) => d.city === cityId);
  if (!dps.length) return;
  S.pendingChoice = { type: "loc", cityId };
  document.getElementById("dpChoiceTitle").textContent = city.name;
  document.getElementById("dpChoiceSub").textContent =
    `${dps.length} display point${dps.length > 1 ? "s" : ""} · ${city.region}`;
  _openChoiceSheet();
}

function openDPChoice(dpId) {
  const dp = ALL_DPS.find((d) => d.id === dpId);
  if (!dp) return;
  S.pendingChoice = { type: "dp", dpId };
  document.getElementById("dpChoiceTitle").textContent = dp.name;
  document.getElementById("dpChoiceSub").textContent =
    `${dp.type} · ${dp.cityName} · ${dp.tokensPerSlot} tokens/slot`;
  _openChoiceSheet();
}

function _openChoiceSheet() {
  document.getElementById("dpChoiceBackdrop").classList.add("on");
  document.getElementById("dpChoiceSheet").classList.add("on");
}

function closeDPChoice() {
  document.getElementById("dpChoiceBackdrop").classList.remove("on");
  document.getElementById("dpChoiceSheet").classList.remove("on");
}

function chooseFirstAvailable() {
  const ctx = S.pendingChoice;
  closeDPChoice();
  if (!ctx) return;
  if (ctx.type === "dp") {
    startOneShotForDP(ctx.dpId, { autoOpenModal: false });
  } else if (ctx.type === "loc") {
    startOneShotForLocation(ctx.cityId, { mode: "first" });
  }
}

function chooseManualSelection() {
  const ctx = S.pendingChoice;
  closeDPChoice();
  if (!ctx) return;
  /* One compact sheet: one date + one hour → first free 20s block in
     that hour is saved as a slot (not the full slot grid). */
  S.osQuickCtx = ctx;
  openOneShotQuickTimeModal();
}

/* ── Flow launchers ─────────────────────────────────────────────── */

/* Pick the first slot that is not busy on ONE_SHOT_TODAY. */
function _firstFreeSlot() {
  const busy = BUSY_SLOTS[ONE_SHOT_TODAY] || [];
  return SLOT_LIST.find((s) => !busy.includes(s));
}

/* First free micro-slot within a given calendar hour (uses BUSY_SLOTS). */
function _firstSlotInHour(dateStr, hour) {
  const slots = genSlotsForHour(hour);
  const busy = BUSY_SLOTS[dateStr] || [];
  return slots.find((s) => !busy.includes(s)) || slots[0];
}

function _hideOsQuickSheet() {
  const b = document.getElementById("osQuickBackdrop");
  const s = document.getElementById("osQuickSheet");
  if (b) b.classList.remove("on");
  if (s) s.classList.remove("on");
}

function openOneShotQuickTimeModal() {
  const ctx = S.osQuickCtx;
  if (!ctx) return;
  const sel = document.getElementById("osQuickHour");
  if (sel && !sel.children.length) {
    for (let h = 6; h <= 22; h++) {
      const o = document.createElement("option");
      o.value = String(h);
      o.textContent = `${String(h).padStart(2, "0")}:00`;
      sel.appendChild(o);
    }
  }
  const title = document.getElementById("osQuickTitle");
  const sub = document.getElementById("osQuickSub");
  const dateInp = document.getElementById("osQuickDate");
  if (ctx.type === "dp") {
    const dp = ALL_DPS.find((d) => d.id === ctx.dpId);
    if (title) title.textContent = "Pick date & hour";
    if (sub)
      sub.textContent = dp
        ? `${dp.name} · one slot in the hour you choose`
        : "";
  } else {
    const city = ALL_CITIES.find((c) => c.id === ctx.cityId);
    if (title) title.textContent = "Pick date & hour";
    if (sub)
      sub.textContent = city
        ? `${city.name} · every display point gets the same hour`
        : "";
  }
  if (dateInp) {
    dateInp.value = ONE_SHOT_TODAY;
    dateInp.min = "2026-03-01";
    dateInp.max = "2026-04-30";
  }
  if (sel) sel.value = "11";
  document.getElementById("osQuickBackdrop").classList.add("on");
  document.getElementById("osQuickSheet").classList.add("on");
}

function cancelOneShotQuickTime() {
  _hideOsQuickSheet();
  S.osQuickCtx = null;
}

function confirmOneShotQuickTime() {
  const ctx = S.osQuickCtx;
  if (!ctx) return;
  const dateStr = document.getElementById("osQuickDate").value;
  const hour = parseInt(document.getElementById("osQuickHour").value, 10);
  if (!dateStr || !Number.isFinite(hour)) {
    toast("Pick a date and hour");
    return;
  }
  const timeStr = _firstSlotInHour(dateStr, hour);
  const slotObj = { time: timeStr, date: dateStr, hour };
  _hideOsQuickSheet();
  S.osQuickCtx = null;
  if (ctx.type === "dp") {
    const dp = ALL_DPS.find((d) => d.id === ctx.dpId);
    if (!dp) return;
    S.flow = "oneshot";
    S.oneShotDP = dp;
    S.oneShotLoc = null;
    S.oneShotMode = "manual";
    S.checked = new Set([ctx.dpId]);
    S.slots = { [ctx.dpId]: [slotObj] };
    S.cityFilter = "selected";
    S.locSearchQuery = "";
    S.locBrowseLimit = 3;
    S.locSelectedOpen = true;
    goView("wizard");
    goStep(1);
    toast("Time applied — use Add on the card for more slots if needed");
    return;
  }
  if (ctx.type === "loc") {
    const dps = ALL_DPS.filter((d) => d.city === ctx.cityId);
    if (!dps.length) return;
    S.flow = "oneshot";
    S.oneShotDP = null;
    S.oneShotLoc = ctx.cityId;
    S.oneShotMode = "manual";
    S.slots = {};
    dps.forEach((dp) => {
      S.slots[dp.id] = [
        { time: slotObj.time, date: slotObj.date, hour: slotObj.hour },
      ];
    });
    S.checked = new Set(dps.map((d) => d.id));
    S.cityFilter = "selected";
    S.expandedLocs = new Set([ctx.cityId]);
    S._locAccInited = true;
    S.locSearchQuery = "";
    S.locBrowseLimit = 3;
    S.locSelectedOpen = true;
    goView("wizard");
    goStep(1);
    toast(
      `${dps.length} display point${dps.length > 1 ? "s" : ""} · ` +
        `${String(hour).padStart(2, "0")}:00 on ${dateStr}`,
    );
  }
}

/* Single-DP One Shot (from tapping an individual DP row). */
function startOneShotForDP(dpId, opts) {
  opts = opts || {};
  const dp = ALL_DPS.find((d) => d.id === dpId);
  if (!dp) return;
  S.flow = "oneshot";
  S.oneShotDP = dp;
  S.locSearchQuery = "";
  S.locBrowseLimit = 3;
  S.locSelectedOpen = true;
  S.checked = new Set([dpId]);
  S.slots = {};
  if (!opts.autoOpenModal) {
    const firstFree = _firstFreeSlot();
    S.slots[dpId] = firstFree
      ? [{ time: firstFree, date: ONE_SHOT_TODAY, hour: 11 }]
      : [];
  } else {
    S.slots[dpId] = [];
  }
  S.cityFilter = "selected";
  goView("wizard");
  goStep(1);
  if (opts.autoOpenModal) {
    setTimeout(() => openSlotModal(dpId), 120);
  }
}

/* Location-level One Shot. Both entry points take the user to the
   locations accordion (the same expandable list used in business) so
   they see every city, with the tapped city auto-expanded and all of
   its DPs checked. The difference is only the initial slot state:
     - mode: 'first'  → each checked DP gets one auto-booked slot for
                        the first available time today.
     - mode: 'manual' → (dashboard entry only) quick date+hour sheet
                        applies one slot per DP; see confirmOneShotQuickTime.
                        This function's manual branch still supports an
                        empty selection if called directly.
   Either way, users can uncheck DPs, check DPs in other cities, etc.
   New checks in 'first' mode auto-add a default slot to match the
   initial behavior; in 'manual' mode they stay empty. */
function startOneShotForLocation(cityId, opts) {
  opts = opts || {};
  const dps = ALL_DPS.filter((d) => d.city === cityId);
  if (!dps.length) return;
  const mode = opts.mode === "manual" ? "manual" : "first";
  S.flow = "oneshot";
  S.oneShotDP = null;
  S.oneShotLoc = cityId;
  S.oneShotMode = mode;
  S.slots = {};
  if (mode === "first") {
    /* First Available: every DP in the tapped city is pre-checked and
       pre-booked on the first free slot today. */
    S.checked = new Set(dps.map((d) => d.id));
    const firstFree = _firstFreeSlot();
    if (firstFree) {
      dps.forEach((dp) => {
        S.slots[dp.id] = [
          { time: firstFree, date: ONE_SHOT_TODAY, hour: 11 },
        ];
      });
    }
  } else {
    /* Manual: fresh list — nothing pre-checked, no slots. The user
       browses the accordion and picks DPs / slots themselves, just
       like the business flow. */
    S.checked = new Set();
  }
  S.cityFilter = "selected";
  /* Auto-expand the tapped city so users land in context, even in
     manual mode. Other cities stay collapsed. */
  S.expandedLocs = new Set([cityId]);
  S._locAccInited = true;
  S.locSearchQuery = "";
  S.locBrowseLimit = 3;
  S.locSelectedOpen = true;
  goView("wizard");
  goStep(1);
  if (mode === "first") {
    toast(
      `${dps.length} display point${dps.length > 1 ? "s" : ""} booked for ` +
        `first available slot`,
    );
  } else {
    toast(`Tap any display point to pick slots`);
  }
}

/* Legacy alias (older code paths). Routes to single-DP variant. */
function startOneShot(dpId, opts) {
  startOneShotForDP(dpId, opts);
}

/* Dashboard → Business CTA.
   Instead of jumping straight into the wizard we now ask the user
   whether this is a "Normal" or "Budget" campaign. For budget, we then
   prompt for the token ceiling. The actual wizard is launched from
   `launchBusinessCampaign()` once the type is resolved. */
function startBusinessCampaign() {
  openBizTypeChoice();
}

function openBizTypeChoice() {
  document.getElementById("bizTypeBackdrop").classList.add("on");
  document.getElementById("bizTypeSheet").classList.add("on");
}
function closeBizTypeChoice() {
  document.getElementById("bizTypeBackdrop").classList.remove("on");
  document.getElementById("bizTypeSheet").classList.remove("on");
}

function chooseBizType(type) {
  closeBizTypeChoice();
  if (type === "budget") {
    setTimeout(openBizBudgetInput, 120);
  } else {
    launchBusinessCampaign("normal", null);
  }
}

/* Budget sheet supports two currencies:
     - 'tokens' (default) — raw token budget, used directly for caps.
     - 'eur'            — euros, converted to tokens at EUR_PER_TOKEN.
   Internally S.bizBudget is always stored in tokens so the rest of the
   app stays currency-agnostic. */
const EUR_PER_TOKEN = 0.1; /* €0.10 per token → €1 = 10 tokens */
const BUDGET_QUICK = {
  tokens: [50, 100, 250, 500],
  eur: [10, 25, 50, 100],
};
let _budgetCcy = "tokens";

function openBizBudgetInput() {
  document.getElementById("bizBudgetBackdrop").classList.add("on");
  document.getElementById("bizBudgetSheet").classList.add("on");
  _budgetCcy = "tokens";
  setBudgetCurrency("tokens", { preserveValue: false });
  const input = document.getElementById("bizBudgetInput");
  if (input) {
    input.value = "";
    setTimeout(() => input.focus(), 180);
  }
  renderBudgetEquiv();
}
function closeBizBudgetInput() {
  document.getElementById("bizBudgetBackdrop").classList.remove("on");
  document.getElementById("bizBudgetSheet").classList.remove("on");
}

function setBudgetCurrency(ccy, opts) {
  opts = opts || {};
  _budgetCcy = ccy;
  document.querySelectorAll("#budgetCcyTabs .budget-ccy-tab").forEach((t) => {
    t.classList.toggle("on", t.dataset.ccy === ccy);
  });
  const icon = document.getElementById("bizBudgetIcon");
  const unit = document.getElementById("bizBudgetUnit");
  const input = document.getElementById("bizBudgetInput");
  if (ccy === "eur") {
    if (icon) icon.className = "fas fa-euro-sign";
    if (unit) unit.textContent = "euros";
    if (input) input.placeholder = "Enter euros";
  } else {
    if (icon) icon.className = "fas fa-coins";
    if (unit) unit.textContent = "tokens";
    if (input) input.placeholder = "Enter tokens";
  }
  if (!opts.preserveValue && input) input.value = "";
  renderBudgetQuick();
  renderBudgetEquiv();
}

function renderBudgetQuick() {
  const row = document.getElementById("bizBudgetQuickRow");
  if (!row) return;
  const list = BUDGET_QUICK[_budgetCcy] || [];
  const sym = _budgetCcy === "eur" ? "€" : "";
  const unit = _budgetCcy === "eur" ? "" : " tk";
  row.innerHTML = list
    .map(
      (n) =>
        `<div class="budget-quick" onclick="setBudgetQuick(${n})">${sym}${n}${unit}</div>`,
    )
    .join("");
}

function setBudgetQuick(n) {
  const input = document.getElementById("bizBudgetInput");
  if (input) input.value = String(n);
  renderBudgetEquiv();
}

/* Show the token-equivalent of an entered euro amount (or vice versa).
   Gives the user confidence that €25 == 250 tokens. */
function renderBudgetEquiv() {
  const el = document.getElementById("bizBudgetEquiv");
  if (!el) return;
  const raw = document.getElementById("bizBudgetInput").value;
  const n = parseFloat(raw);
  if (!raw || isNaN(n) || n <= 0) {
    el.style.display = "none";
    el.textContent = "";
    return;
  }
  if (_budgetCcy === "eur") {
    const tokens = Math.floor(n / EUR_PER_TOKEN);
    el.innerHTML = `≈ <strong>${tokens.toLocaleString()}</strong> tokens`;
  } else {
    const eur = (n * EUR_PER_TOKEN).toFixed(2);
    el.innerHTML = `≈ <strong>€${eur}</strong>`;
  }
  el.style.display = "block";
}

function confirmBizBudget() {
  const raw = document.getElementById("bizBudgetInput").value;
  const n = parseFloat(raw);
  if (!raw || isNaN(n) || n <= 0) {
    toast(
      _budgetCcy === "eur"
        ? "Enter a valid euro budget"
        : "Enter a valid token budget",
    );
    return;
  }
  /* Always normalize to tokens before handing off to the wizard. */
  const tokens =
    _budgetCcy === "eur" ? Math.max(1, Math.floor(n / EUR_PER_TOKEN)) : Math.floor(n);
  closeBizBudgetInput();
  launchBusinessCampaign("budget", tokens, {
    displayCurrency: _budgetCcy,
    displayAmount: n,
  });
}

function launchBusinessCampaign(type, budget, meta) {
  meta = meta || {};
  S.flow = "business";
  S.bizCampaignType = type;
  S.bizBudget = budget;
  /* Remember how the user expressed the budget so we can echo it back
     in matching units (e.g. "Budget: €25 (250 tokens)"). */
  S.bizBudgetCurrency = meta.displayCurrency || "tokens";
  S.bizBudgetDisplay = meta.displayAmount != null ? meta.displayAmount : budget;
  S.oneShotDP = null;
  S.oneShotLoc = null;
  S.checked = new Set();
  S.slots = {};
  S.cityFilter = "selected";
  /* Reset the locations accordion so it auto-expands the first city
     with any selection (none yet) on first render. */
  S.expandedLocs = new Set();
  S._locAccInited = false;
  S.locSearchQuery = "";
  S.locBrowseLimit = 3;
  S.locSelectedOpen = true;
  goView("wizard");
  goStep(1);
  if (type === "budget") {
    const pretty =
      S.bizBudgetCurrency === "eur"
        ? `€${S.bizBudgetDisplay} (${budget} tokens)`
        : `${budget} tokens`;
    toast(`Budget set: ${pretty}`);
  }
}

function dashOpenPackages() {
  openPackagesModal();
}
