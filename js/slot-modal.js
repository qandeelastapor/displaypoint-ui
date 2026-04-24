/* ═══════════════ INDIVIDUAL SLOT MODAL ═══════════════
   Route based on S.flow:
     - 'business' uses the multi-recurrence biz modal (Daily/Weekly/Monthly
       + Manual/Automatic + conflict resolution).
     - 'oneshot' uses THIS individual modal, but restricted per the xlsx:
       date defaults to today, range mode is hidden, no hour cycling UX
       difference, user may swap to a single alternate date. */
function _slotListForModal() {
  return S.flow === "oneshot" ? genSlotsForHour(S.sheetHour) : SLOT_LIST;
}

function openSlotModal(dpId) {
  if (S.flow === "business") {
    openBizSlotModal(dpId);
    return;
  }
  const dp = ALL_DPS.find((d) => d.id === dpId);
  S.sheetDP = dp;
  S.selSlots = [];
  S.rangeA = null;
  S.rangeB = null;
  const isOneShot = S.flow === "oneshot";
  if (isOneShot) {
    const chips = S.slots[dpId] || [];
    const first = chips[0];
    S.sheetDate = (first && first.date) || ONE_SHOT_TODAY;
    const p = S.sheetDate.split("-").map(Number);
    S.calMonth = new Date(p[0], p[1] - 1, 1);
    S.sheetHour =
      first && Number.isFinite(first.hour) ? first.hour : S.sheetHour || 11;
  }
  document.getElementById("smTitle").textContent = dp.name;
  /* Range mode exists only for video-loop campaigns, which is a
     customized/business feature. Always hidden in one-shot. */
  const allowRange = !isOneShot && S.isVideo && S.loopOn;
  document.getElementById("rangeTab").style.display = allowRange ? "" : "none";
  document.querySelector(".slot-mode-tabs").style.display = allowRange
    ? "flex"
    : "none";
  /* Collapse the calendar for one-shot: users see only the date chip +
     hours/slots. Tapping the chip reveals the calendar. In every other
     flow the calendar is visible as before. */
  toggleOneShotCal(!isOneShot);
  setSlotMode("multi");
  renderCal();
  renderSlots();
  document.getElementById("slotModal").classList.add("open");
}

/* Show or hide the full calendar for the one-shot variant of the
   individual slot modal. When `showCal` is false (default one-shot
   opening) we hide the grid and show a compact "Today" chip instead. */
function toggleOneShotCal(showCal) {
  const chip = document.getElementById("osDateChip");
  const wrap = document.getElementById("calWrap");
  if (!chip || !wrap) return;
  const isOneShot = S.flow === "oneshot";
  if (!isOneShot) {
    chip.style.display = "none";
    wrap.style.display = "";
    return;
  }
  if (showCal) {
    chip.style.display = "none";
    wrap.style.display = "";
  } else {
    chip.style.display = "flex";
    wrap.style.display = "none";
    const val = document.getElementById("osDateChipVal");
    if (val) {
      val.textContent =
        S.sheetDate === ONE_SHOT_TODAY
          ? `Today · ${fmtDateNice(S.sheetDate)}`
          : fmtDateNice(S.sheetDate);
    }
  }
}
function closeSlotModal() {
  document.getElementById("slotModal").classList.remove("open");
}
function renderCal() {
  const m = S.calMonth;
  document.getElementById("calMonth").textContent =
    `${MONTHS_FULL[m.getMonth()]} ${m.getFullYear()}`;
  const grid = document.getElementById("calGrid");
  grid.innerHTML = DAYS_SHORT.map(
    (d) => `<div class="cal-dn">${d}</div>`,
  ).join("");
  const first = new Date(m.getFullYear(), m.getMonth(), 1).getDay();
  const total = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const prevTotal = new Date(m.getFullYear(), m.getMonth(), 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = first - 1; i >= 0; i--)
    grid.innerHTML += `<div class="cal-d other">${prevTotal - i}</div>`;
  for (let d = 1; d <= total; d++) {
    const dt = new Date(m.getFullYear(), m.getMonth(), d);
    const ds = fmtDate(dt);
    const isPast = dt < today;
    const isSel = S.sheetDate === ds;
    let cls = "cal-d";
    if (isPast) cls += " past";
    else if (isSel) cls += " sel";
    else if (dt.getTime() === today.getTime()) cls += " today";
    grid.innerHTML += `<div class="${cls}" onclick="${isPast ? "" : "selDate('" + ds + "')"}">${d}</div>`;
  }
  const used = first + total;
  const rem = used % 7 === 0 ? 0 : 7 - (used % 7);
  for (let i = 1; i <= rem; i++)
    grid.innerHTML += `<div class="cal-d other">${i}</div>`;
  document.getElementById("hourLabel").textContent = `${S.sheetHour} hrs`;
}
function chMonth(dir) {
  S.calMonth = new Date(
    S.calMonth.getFullYear(),
    S.calMonth.getMonth() + dir,
    1,
  );
  renderCal();
}
function selDate(ds) {
  S.sheetDate = ds;
  S.selSlots = [];
  S.rangeA = null;
  S.rangeB = null;
  renderCal();
  renderSlots();
}
function cycleHour() {
  S.sheetHour = (S.sheetHour % 23) + 1;
  document.getElementById("hourLabel").textContent = `${S.sheetHour} hrs`;
  S.selSlots = [];
  S.rangeA = null;
  S.rangeB = null;
  renderSlots();
}
function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtDateNice(ds) {
  const d = new Date(ds + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function setSlotMode(mode) {
  S.slotMode = mode;
  S.selSlots = [];
  S.rangeA = null;
  S.rangeB = null;
  document
    .querySelectorAll(".smt")
    .forEach((t) => t.classList.toggle("on", t.dataset.mode === mode));
  document.getElementById("rangeHint").style.display =
    mode === "range" ? "flex" : "none";
  document.getElementById("slotsHdrSub").textContent =
    mode === "multi"
      ? "Tap to select multiple"
      : "Tap first slot, then last slot";
  updateSaveBtn();
  renderSlots();
}
function renderSlots() {
  const grid = document.getElementById("slotsGrid");
  const busy = BUSY_SLOTS[S.sheetDate] || [];
  let rangeLo = -1,
    rangeHi = -1;
  if (S.slotMode === "range" && S.rangeA !== null && S.rangeB !== null) {
    rangeLo = Math.min(S.rangeA, S.rangeB);
    rangeHi = Math.max(S.rangeA, S.rangeB);
  }
  grid.innerHTML = "";
  const slotList = _slotListForModal();
  slotList.forEach((slot, idx) => {
    const isBusy = busy.includes(slot);
    let cls = "si";
    if (isBusy) cls += " busy";
    else if (S.slotMode === "multi" && S.selSlots.includes(idx))
      cls += " sel";
    else if (S.slotMode === "range") {
      if (S.rangeA !== null && S.rangeB === null && S.rangeA === idx)
        cls += " range-start-only";
      else if (rangeLo >= 0) {
        if (idx === rangeLo || idx === rangeHi) cls += " range-end";
        else if (idx > rangeLo && idx < rangeHi) cls += " range-mid";
      }
    }
    const div = document.createElement("div");
    div.className = cls;
    div.innerHTML = slot.replace("-", "<br>");
    if (!isBusy) div.onclick = () => handleSlotClick(idx);
    grid.appendChild(div);
  });
  updateSaveBtn();
}
function handleSlotClick(idx) {
  if (S.slotMode === "multi") {
    const pos = S.selSlots.indexOf(idx);
    if (pos > -1) S.selSlots.splice(pos, 1);
    else S.selSlots.push(idx);
  } else if (S.slotMode === "range") {
    if (S.rangeA === null) {
      S.rangeA = idx;
      S.rangeB = null;
    } else if (S.rangeB === null) {
      S.rangeB = idx;
    } else {
      S.rangeA = idx;
      S.rangeB = null;
    }
  }
  renderSlots();
}
function updateSaveBtn() {
  const btn = document.getElementById("saveSlotBtn");
  let count = 0;
  if (S.slotMode === "multi") count = S.selSlots.length;
  else if (
    S.slotMode === "range" &&
    S.rangeA !== null &&
    S.rangeB !== null
  )
    count = Math.abs(S.rangeB - S.rangeA) + 1;
  if (count > 0) {
    btn.disabled = false;
    btn.textContent = `Save ${count} Slot${count > 1 ? "s" : ""}`;
  } else {
    btn.disabled = true;
    btn.textContent =
      count === 0 && S.slotMode === "range" && S.rangeA !== null
        ? "Now tap end slot"
        : "Select slots first";
  }
}
function saveSlot() {
  if (!S.sheetDP) return;
  let indices = [];
  if (S.slotMode === "multi") indices = [...S.selSlots];
  else if (
    S.slotMode === "range" &&
    S.rangeA !== null &&
    S.rangeB !== null
  ) {
    const lo = Math.min(S.rangeA, S.rangeB),
      hi = Math.max(S.rangeA, S.rangeB);
    for (let i = lo; i <= hi; i++) indices.push(i);
  }
  if (!indices.length) return;
  if (!S.slots[S.sheetDP.id]) S.slots[S.sheetDP.id] = [];
  const slotList = _slotListForModal();
  indices.forEach((i) => {
    const slot = slotList[i];
    if (
      !S.slots[S.sheetDP.id].find(
        (x) => x.time === slot && x.date === S.sheetDate,
      )
    )
      S.slots[S.sheetDP.id].push({
        time: slot,
        date: S.sheetDate,
        hour: S.sheetHour,
      });
  });
  closeSlotModal();
  S.checked.add(S.sheetDP.id);
  renderLocTabs();
  renderDPList();
  toast(`${indices.length} slot${indices.length > 1 ? "s" : ""} saved`);
}

