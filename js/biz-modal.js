/* ════════════════════════════════════════════
   BUSINESS SLOT MODAL — COMPLETE REWORK
════════════════════════════════════════════ */

function openBizSlotModal(dpId) {
  const dp = ALL_DPS.find((d) => d.id === dpId);
  S.bizDP = dp;
  /* Pre-select the first slot in the default hour so the grid never
     looks empty on open — the user can add/remove from there. */
  S.bizSelSlots = [0];
  S.bizRecur = "daily";
  S.bizHour = 11;
  S.bizHourDDOpen = false;
  S.bizStartDate = null;
  S.bizEndDate = null;
  S.bizCalMonth = new Date(2026, 2, 1);
  S.bizCalPickingEnd = false;
  S.bizWeekdays = new Set([1]);
  S.bizMonthDays = new Set();
  S.bizSlotMode = "manual";
  S.bizAutoIntervalMin = 20;
  S.bizAutoCount = 5;
  S.bizAutoAssignments = [];
  S.bizConflicts = [];
  S.bizResolved = {};
  S.bizRemovedConflicts = new Set();
  document.getElementById("bizSmTitle").textContent = dp.name;
  document
    .querySelectorAll("#bizRecurTabs .rt")
    .forEach((t) =>
      t.classList.toggle("on", t.dataset.recur === "daily"),
    );
  document.querySelectorAll("#bizSlotModeTabs .rt").forEach((t) =>
    t.classList.toggle("on", t.dataset.mode === "manual"),
  );
  document.getElementById("bizManualBlock").style.display = "";
  document.getElementById("bizAutoBlock").style.display = "none";
  document.getElementById("bizAutoInterval").value = "20";
  document.getElementById("bizAutoCountSel").value = "5";
  document.getElementById("bizHourLabel").textContent =
    `${String(S.bizHour).padStart(2, "0")}:00`;
  document.getElementById("bizHourDDPanel").style.display = "none";
  renderBizScheduleFields();
  renderBizSlots();
  updateBizSummary();
  document.getElementById("bizSlotModal").classList.add("open");
}
function closeBizSlotModal() {
  document.getElementById("bizSlotModal").classList.remove("open");
}

function setRecur(r) {
  S.bizRecur = r;
  S.bizStartDate = null;
  S.bizEndDate = null;
  S.bizCalPickingEnd = false;
  S.bizCalMonth = new Date(2026, 2, 1);
  S.bizMonthDays = new Set();
  S.bizWeekdays = new Set([1]);
  document
    .querySelectorAll("#bizRecurTabs .rt")
    .forEach((t) => t.classList.toggle("on", t.dataset.recur === r));
  renderBizScheduleFields();
  updateBizSummary();
}

/* ── HOUR DROPDOWN ── */
function toggleBizHourDD() {
  S.bizHourDDOpen = !S.bizHourDDOpen;
  const panel = document.getElementById("bizHourDDPanel");
  const chevron = document.getElementById("bizHourChevron");
  if (S.bizHourDDOpen) {
    panel.style.display = "block";
    chevron.style.transform = "rotate(180deg)";
    renderBizHourDD();
  } else {
    panel.style.display = "none";
    chevron.style.transform = "";
  }
}
function renderBizHourDD() {
  const panel = document.getElementById("bizHourDDPanel");
  let html = "";
  for (let h = 0; h < 24; h++) {
    const hh = String(h).padStart(2, "0");
    const isSel = S.bizHour === h;
    html += `<div class="hour-dd-item${isSel ? " on" : ""}" onclick="pickBizHour(${h})">
<span>${hh}:00 — ${hh}:59</span>
<span class="hdi-slots">15 slots</span>
    </div>`;
  }
  panel.innerHTML = html;
  const selItem = panel.querySelector(".on");
  if (selItem)
    selItem.scrollIntoView({ block: "center", behavior: "instant" });
}
function pickBizHour(h) {
  S.bizHour = h;
  S.bizHourDDOpen = false;
  document.getElementById("bizHourLabel").textContent =
    `${String(h).padStart(2, "0")}:00`;
  document.getElementById("bizHourDDPanel").style.display = "none";
  document.getElementById("bizHourChevron").style.transform = "";
  renderBizSlots();
  updateBizSummary();
}

/* ── SCHEDULE FIELDS ── */
function renderBizScheduleFields() {
  const wrap = document.getElementById("bizScheduleFields");
  if (S.bizRecur === "monthly") {
    wrap.innerHTML = renderMonthlyFieldsHTML();
  } else if (S.bizRecur === "weekly") {
    wrap.innerHTML = `
<div class="lbl" style="margin-bottom:8px">Date Range</div>
${renderRangeCalHTML()}
<div class="lbl" style="margin-bottom:8px">Days of Week <span style="font-size:9px;color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0">(select multiple)</span></div>
<div class="weekday-row" id="wdRow">
  ${["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => `<div class="wd-btn${S.bizWeekdays.has(i) ? " on" : ""}" onclick="toggleWeekday(${i})">${d}</div>`).join("")}
</div>`;
  } else {
    wrap.innerHTML = `
<div class="lbl" style="margin-bottom:8px">Date Range</div>
${renderRangeCalHTML()}`;
  }
  if (S.bizSlotMode === "automatic") {
    rebuildBizAutoAssignments();
  }
}

/* ── SINGLE RANGE CALENDAR (for daily + weekly) ── */
function renderRangeCalHTML() {
  const m = S.bizCalMonth;
  const first = new Date(m.getFullYear(), m.getMonth(), 1).getDay();
  const total = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const prevTotal = new Date(m.getFullYear(), m.getMonth(), 0).getDate();
  const today = new Date(2026, 2, 19);
  today.setHours(0, 0, 0, 0);
  const startDt = S.bizStartDate
    ? new Date(S.bizStartDate + "T00:00:00")
    : null;
  const endDt = S.bizEndDate
    ? new Date(S.bizEndDate + "T00:00:00")
    : null;

  let html = `<div class="start-cal-wrap" style="margin-bottom:14px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
<div style="display:flex;align-items:center;gap:5px;flex:1">
  <div style="width:10px;height:10px;border-radius:50%;background:var(--blue)"></div>
  <span style="font-size:11px;font-weight:600;color:var(--ink)">${S.bizStartDate ? fmtDateShort(S.bizStartDate) : "Start"}</span>
</div>
<i class="fas fa-arrow-right" style="color:var(--muted);font-size:10px"></i>
<div style="display:flex;align-items:center;gap:5px;flex:1;justify-content:flex-end">
  <div style="width:10px;height:10px;border-radius:50%;background:var(--green)"></div>
  <span style="font-size:11px;font-weight:600;color:var(--ink)">${S.bizEndDate ? fmtDateShort(S.bizEndDate) : "End"}</span>
</div>
    </div>
    <div class="cal-nav">
<div class="cal-nav-btn" onclick="bizCalChMonth(-1)"><i class="fas fa-chevron-left"></i></div>
<div class="cal-month">${MONTHS_FULL[m.getMonth()]} ${m.getFullYear()}</div>
<div class="cal-nav-btn" onclick="bizCalChMonth(1)"><i class="fas fa-chevron-right"></i></div>
    </div>
    <div class="cal-grid">${DAYS_SHORT.map((d) => `<div class="cal-dn">${d}</div>`).join("")}`;

  for (let i = first - 1; i >= 0; i--)
    html += `<div class="cal-d other">${prevTotal - i}</div>`;
  for (let d = 1; d <= total; d++) {
    const dt = new Date(m.getFullYear(), m.getMonth(), d);
    const ds = fmtDate(dt);
    const isPast = dt < today;
    let cls = "cal-d";
    if (isPast) {
      cls += " past";
    } else if (S.bizStartDate === ds && S.bizEndDate === ds) {
      cls += " sel range-only";
    } else if (S.bizStartDate === ds) {
      cls += " range-start";
    } else if (S.bizEndDate === ds) {
      cls += " range-end";
    } else if (startDt && endDt && dt > startDt && dt < endDt) {
      cls += " in-range";
    } else if (dt.getTime() === today.getTime()) {
      cls += " today";
    }
    html += `<div class="${cls}" onclick="${isPast ? "" : "pickBizRangeDate('" + ds + "')"}">${d}</div>`;
  }
  const used = first + total;
  const rem = used % 7 === 0 ? 0 : 7 - (used % 7);
  for (let i = 1; i <= rem; i++)
    html += `<div class="cal-d other">${i}</div>`;
  html += `</div></div>`;
  return html;
}

function bizCalChMonth(dir) {
  S.bizCalMonth = new Date(
    S.bizCalMonth.getFullYear(),
    S.bizCalMonth.getMonth() + dir,
    1,
  );
  renderBizScheduleFields();
}
function pickBizRangeDate(ds) {
  if (
    !S.bizStartDate ||
    S.bizEndDate ||
    (S.bizStartDate && ds <= S.bizStartDate)
  ) {
    S.bizStartDate = ds;
    S.bizEndDate = null;
  } else {
    S.bizEndDate = ds;
  }
  renderBizScheduleFields();
  updateBizSummary();
}

/* ── WEEKDAY MULTI-SELECT ── */
function toggleWeekday(i) {
  if (S.bizWeekdays.has(i)) S.bizWeekdays.delete(i);
  else S.bizWeekdays.add(i);
  if (!S.bizWeekdays.size) S.bizWeekdays.add(i);
  document
    .querySelectorAll(".wd-btn")
    .forEach((b, idx) =>
      b.classList.toggle("on", S.bizWeekdays.has(idx)),
    );
  if (S.bizSlotMode === "automatic") {
    rebuildBizAutoAssignments();
  }
  updateBizSummary();
}

/* ── MONTHLY FIELDS: multi-day picker 1-29, auto 12 months ── */
function renderMonthlyFieldsHTML() {
  let dayGridHTML = '<div class="dom-grid">';
  for (let d = 1; d <= 29; d++) {
    const isSel = S.bizMonthDays.has(d);
    dayGridHTML += `<div class="dom-cell${isSel ? " sel" : ""}" onclick="toggleMonthDay(${d})">${d}</div>`;
  }
  dayGridHTML += "</div>";

  const selectedDays = [...S.bizMonthDays].sort((a, b) => a - b);
  const dates = genRecurDates("monthly");
  const monthSpan = `${MONTHS_SHORT[CURRENT_MONTH_IDX]} ${BIZ_YEAR} → ${MONTHS_SHORT[(CURRENT_MONTH_IDX + 11) % 12]} ${CURRENT_MONTH_IDX + 11 > 11 ? BIZ_YEAR + 1 : BIZ_YEAR}`;

  const previewHTML = dates.length
    ? `
    <div style="background:var(--blue-lt);border:1.5px solid #BFDBFE;border-radius:13px;padding:12px 14px;margin-bottom:14px">
<div style="font-size:12px;font-weight:700;color:var(--blue);margin-bottom:4px;display:flex;align-items:center;gap:6px">
  <i class="fas fa-calendar-alt"></i> ${dates.length} dates across 12 months
</div>
<div style="font-size:11px;color:var(--muted)">${monthSpan}</div>
    </div>`
    : "";

  return `
    <div class="lbl" style="margin-bottom:8px">Days of Month <span style="font-size:9px;color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0">(select multiple)</span></div>
    ${dayGridHTML}
    <div style="font-size:11px;color:var(--muted);margin-bottom:14px;margin-top:2px">Auto-repeats for 12 months from ${MONTHS_SHORT[CURRENT_MONTH_IDX]} ${BIZ_YEAR}${selectedDays.length ? " · Selected: " + selectedDays.join(", ") : ""}</div>
    ${previewHTML}`;
}

function toggleMonthDay(d) {
  if (S.bizMonthDays.has(d)) S.bizMonthDays.delete(d);
  else S.bizMonthDays.add(d);
  renderBizScheduleFields();
  updateBizSummary();
}

/* ── BIZ SLOT GRID (no busy marking) ── */
function renderBizSlots() {
  const grid = document.getElementById("bizSlotsGrid");
  grid.innerHTML = "";
  const slots = genSlotsForHour(S.bizHour);
  slots.forEach((slot, idx) => {
    const isSel = S.bizSelSlots.includes(idx);
    const div = document.createElement("div");
    div.className = "si" + (isSel ? " sel" : "");
    div.innerHTML = slot.replace("-", "<br>");
    div.onclick = () => {
      toggleBizSlot(idx);
    };
    grid.appendChild(div);
  });
  updateBizSummary();
}
function toggleBizSlot(idx) {
  const pos = S.bizSelSlots.indexOf(idx);
  if (pos > -1) S.bizSelSlots.splice(pos, 1);
  else S.bizSelSlots.push(idx);
  renderBizSlots();
}

function setBizSlotMode(mode) {
  S.bizSlotMode = mode;
  document.querySelectorAll("#bizSlotModeTabs .rt").forEach((t) =>
    t.classList.toggle("on", t.dataset.mode === mode),
  );
  const manualEl = document.getElementById("bizManualBlock");
  const autoEl = document.getElementById("bizAutoBlock");
  if (mode === "manual") {
    manualEl.style.display = "";
    autoEl.style.display = "none";
    renderBizSlots();
  } else {
    const iv = parseInt(
      document.getElementById("bizAutoInterval").value,
      10,
    );
    const cv = parseInt(
      document.getElementById("bizAutoCountSel").value,
      10,
    );
    S.bizAutoIntervalMin = isNaN(iv) ? 20 : iv;
    S.bizAutoCount = isNaN(cv) ? 5 : cv;
    manualEl.style.display = "none";
    autoEl.style.display = "";
    rebuildBizAutoAssignments();
  }
  updateBizSummary();
}

function onBizAutoIntervalChange() {
  const v = parseInt(document.getElementById("bizAutoInterval").value, 10);
  S.bizAutoIntervalMin = isNaN(v) ? 20 : v;
  rebuildBizAutoAssignments();
  updateBizSummary();
}

function onBizAutoCountChange() {
  const v = parseInt(document.getElementById("bizAutoCountSel").value, 10);
  S.bizAutoCount = isNaN(v) ? 5 : v;
  rebuildBizAutoAssignments();
  updateBizSummary();
}

function rebuildBizAutoAssignments() {
  S.bizAutoAssignments = [];
  if (S.bizSlotMode !== "automatic") return;
  const dates = genRecurDates(S.bizRecur);
  if (!dates.length) return;
  const interval = S.bizAutoIntervalMin;
  const count = Math.max(1, S.bizAutoCount);
  const dayStartMin = 8 * 60;
  const dayEndMin = 20 * 60;
  const seen = new Set();
  dates.forEach((ds) => {
    for (let i = 0; i < count; i++) {
      let m = dayStartMin + i * interval;
      if (m > dayEndMin) m = dayEndMin;
      const H = Math.floor(m / 60);
      const M = m % 60;
      const slots = genSlotsForHour(H);
      const slotIdx = Math.min(
        14,
        Math.max(0, Math.round((M * 15) / 60)),
      );
      const key = `${ds}-${H}-${slotIdx}`;
      if (seen.has(key)) continue;
      seen.add(key);
      S.bizAutoAssignments.push({
        date: ds,
        hour: H,
        slotIdx,
        slotTime: slots[slotIdx],
      });
    }
  });
}

function getManualPlannedEntries() {
  const dates = genRecurDates(S.bizRecur);
  const slots = genSlotsForHour(S.bizHour);
  const entries = [];
  dates.forEach((ds) => {
    S.bizSelSlots.forEach((idx) => {
      entries.push({
        date: ds,
        hour: S.bizHour,
        slotIdx: idx,
        slotTime: slots[idx],
      });
    });
  });
  return entries;
}

function getPlannedEntries() {
  if (S.bizSlotMode === "automatic") return [...S.bizAutoAssignments];
  return getManualPlannedEntries();
}

/* ── DATE GENERATION ── */
function genRecurDates(type) {
  const dates = [];
  if (type === "daily") {
    if (!S.bizStartDate || !S.bizEndDate) return dates;
    const start = new Date(S.bizStartDate + "T00:00:00");
    const end = new Date(S.bizEndDate + "T00:00:00");
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1))
      dates.push(fmtDate(new Date(d)));
  } else if (type === "weekly") {
    if (!S.bizStartDate || !S.bizEndDate) return dates;
    const start = new Date(S.bizStartDate + "T00:00:00");
    const end = new Date(S.bizEndDate + "T00:00:00");
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (S.bizWeekdays.has(d.getDay())) dates.push(fmtDate(new Date(d)));
    }
  } else if (type === "monthly") {
    if (!S.bizMonthDays.size) return dates;
    const sortedDays = [...S.bizMonthDays].sort((a, b) => a - b);
    for (let mi = 0; mi < 12; mi++) {
      const monthIdx = (CURRENT_MONTH_IDX + mi) % 12;
      const year = BIZ_YEAR + Math.floor((CURRENT_MONTH_IDX + mi) / 12);
      const maxDay = new Date(year, monthIdx + 1, 0).getDate();
      sortedDays.forEach((day) => {
        if (day <= maxDay)
          dates.push(
            `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
          );
      });
    }
  }
  return dates;
}

/* ── UPDATE BUTTON ── */
function updateBizSummary() {
  const saveBtn = document.getElementById("bizSaveBtn");
  const dates = genRecurDates(S.bizRecur);
  let ready = false;
  let label = "";

  if (S.bizSlotMode === "automatic") {
    ready = S.bizAutoAssignments.length > 0;
    label = `${S.bizAutoAssignments.length} automatic slot${S.bizAutoAssignments.length !== 1 ? "s" : ""}`;
  } else {
    const slotCount = S.bizSelSlots.length;
    ready = slotCount > 0 && dates.length > 0;
    label = `${slotCount} slot${slotCount > 1 ? "s" : ""} × ${dates.length} date${dates.length > 1 ? "s" : ""}`;
  }

  if (ready) {
    saveBtn.disabled = false;
    saveBtn.textContent = `Review & Confirm — ${label}`;
  } else {
    saveBtn.disabled = true;
    if (S.bizSlotMode === "automatic") {
      if (S.bizRecur === "monthly" && !S.bizMonthDays.size)
        saveBtn.textContent = "Pick days of month first";
      else if (!dates.length)
        saveBtn.textContent = "Set your schedule first";
      else saveBtn.textContent = "Adjust interval or count";
    } else {
      if (!S.bizSelSlots.length)
        saveBtn.textContent = "Select slots first";
      else if (S.bizRecur === "monthly" && !S.bizMonthDays.size)
        saveBtn.textContent = "Pick days of month first";
      else saveBtn.textContent = "Set your date range first";
    }
  }
}

/* ── CONFLICT DETECTION ── */
function detectBizConflicts() {
  const entries = getPlannedEntries();
  const conflicts = [];
  const pushConflict = (e) => {
    if (
      conflicts.some(
        (c) =>
          c.date === e.date &&
          c.hour === e.hour &&
          c.slotIdx === e.slotIdx,
      )
    )
      return;
    conflicts.push({
      date: e.date,
      slotIdx: e.slotIdx,
      slotTime: e.slotTime,
      hour: e.hour,
    });
  };

  entries.forEach((e) => {
    const busyForDate =
      BIZ_BUSY[e.date] && BIZ_BUSY[e.date][e.hour]
        ? BIZ_BUSY[e.date][e.hour]
        : [];
    if (busyForDate.includes(e.slotIdx)) pushConflict(e);
  });

  /* Demo: more than 5 planned slots → force conflicts from 6th onward (client showcase) */
  if (entries.length > 5) {
    entries.slice(5).forEach((e) => pushConflict(e));
  }

  return conflicts;
}

/* ── CHECK & SAVE (opens conflict screen if needed) ── */
function bizCheckAndSave() {
  /* Budget gate — if this is a Budget Campaign and the planned cost of
     this DP's entries + everything already booked exceeds the cap,
     show the overflow popup first so the user can trim slots. */
  if (S.bizCampaignType === "budget" && S.bizBudget > 0 && S.bizDP) {
    const planned = getPlannedEntries();
    const rate = S.bizDP.tokensPerSlot;
    const plannedCost = planned.length * rate;
    const alreadyCost = _bookedCostExcluding(S.bizDP.id);
    const total = plannedCost + alreadyCost;
    if (total > S.bizBudget) {
      openBudgetOverPopup({
        planned,
        rate,
        alreadyCost,
        budget: S.bizBudget,
      });
      return;
    }
  }

  const conflicts = detectBizConflicts();
  if (conflicts.length > 0) {
    S.bizConflicts = conflicts;
    S.bizResolved = {};
    S.bizRemovedConflicts = new Set();
    openConflictModal();
  } else {
    saveBizSlotDirect();
  }
}

/* Sum of cost for everything in S.slots except a given DP (used for the
   budget check so we can include already-booked DPs in the total). */
function _bookedCostExcluding(dpId) {
  let sum = 0;
  Object.keys(S.slots || {}).forEach((id) => {
    if (id === dpId) return;
    const dp = ALL_DPS.find((d) => d.id === id);
    if (!dp) return;
    sum += (S.slots[id] || []).length * dp.tokensPerSlot;
  });
  return sum;
}

function saveBizSlotDirect() {
  if (!S.bizDP) return;
  let booked = 0;
  if (!S.slots[S.bizDP.id]) S.slots[S.bizDP.id] = [];

  getPlannedEntries().forEach((e) => {
    if (
      !S.slots[S.bizDP.id].find(
        (x) =>
          x.time === e.slotTime &&
          x.date === e.date &&
          x.hour === e.hour,
      )
    ) {
      S.slots[S.bizDP.id].push({
        time: e.slotTime,
        date: e.date,
        hour: e.hour,
      });
      booked++;
    }
  });
  S.checked.add(S.bizDP.id);
  closeBizSlotModal();
  renderLocTabs();
  renderDPList();
  toast(`${booked} slot${booked !== 1 ? "s" : ""} scheduled`);
}

