/* ════════════════════════════════════════════
   CONFLICT RESOLUTION MODAL
════════════════════════════════════════════ */

function openConflictModal() {
  renderConflictList();
  document.getElementById("conflictModal").classList.add("open");
}
function closeConflictModal() {
  document.getElementById("conflictModal").classList.remove("open");
}

function renderConflictList() {
  const list = document.getElementById("conflictList");
  const active = S.bizConflicts.filter(
    (_, i) => !S.bizRemovedConflicts.has(i),
  );
  const label = document.getElementById("conflictCountLabel");
  label.textContent = `${active.length} conflict${active.length !== 1 ? "s" : ""}`;

  if (!active.length) {
    list.innerHTML = `<div style="text-align:center;padding:40px 20px">
<div style="font-size:36px;margin-bottom:12px">&#10003;</div>
<div style="font-size:15px;font-weight:700;color:var(--ink);margin-bottom:4px">All conflicts resolved!</div>
<div style="font-size:12px;color:var(--muted)">Tap "Confirm & Book" to proceed</div>
    </div>`;
    return;
  }

  list.innerHTML = S.bizConflicts
    .map((c, i) => {
      if (S.bizRemovedConflicts.has(i)) return "";
      const resolved = S.bizResolved[i];
      const slots = genSlotsForHour(c.hour);
      return `<div class="conflict-item">
<div class="ci-head">
  <i class="fas fa-exclamation-triangle" style="color:var(--orange);font-size:12px"></i>
  <div class="ci-date">${fmtDateNice(c.date)}</div>
  <div class="ci-badge">${String(c.hour).padStart(2, "0")}:00</div>
</div>
<div class="ci-slots">
  <div class="ci-slot${resolved ? " resolved" : ""}">
    <span>${c.slotTime}</span>
    ${resolved ? `<span class="ci-arrow">→</span><span class="ci-new">${resolved.newSlotTime}</span>` : '<span style="font-size:9px;opacity:.7">busy</span>'}
  </div>
</div>
<div class="ci-actions">
  <div class="ci-resolve-btn" onclick="openResolvePopup(${i})">${resolved ? "Change" : "Resolve"}</div>
  <div class="ci-remove-btn" onclick="removeSingleConflict(${i})"><i class="fas fa-trash-alt" style="font-size:10px"></i></div>
</div>
    </div>`;
    })
    .join("");
}

function removeAllConflicts() {
  S.bizConflicts.forEach((_, i) => S.bizRemovedConflicts.add(i));
  renderConflictList();
  toast("All conflicts removed");
}

function removeSingleConflict(i) {
  S.bizRemovedConflicts.add(i);
  renderConflictList();
}

/* ── RESOLVE POPUP (grid design) ── */
function openResolvePopup(conflictIdx) {
  S.bizResolveTarget = conflictIdx;
  S.bizResolvePicked = null;
  const c = S.bizConflicts[conflictIdx];
  const slots = genSlotsForHour(c.hour);
  const busyForDate =
    BIZ_BUSY[c.date] && BIZ_BUSY[c.date][c.hour]
      ? BIZ_BUSY[c.date][c.hour]
      : [];
  const hh = String(c.hour).padStart(2, "0");

  const overlay = document.getElementById("resolveOverlay");
  let gridHTML = "";
  slots.forEach((slot, idx) => {
    const isBusy = busyForDate.includes(idx);
    const isConflict = idx === c.slotIdx;
    let cls = "rp-cell";
    if (isConflict) cls += " rp-conflict";
    else if (isBusy) cls += " rp-busy";
    const clickable = !isBusy && !isConflict;
    gridHTML += `<div class="${cls}" id="rpc-${idx}" ${clickable ? `onclick="pickResolveSlot(${idx},'${slot}')"` : ""}>${slot.replace("-", "<br>")}</div>`;
  });

  overlay.innerHTML = `<div class="resolve-overlay" onclick="closeResolvePopup(event)">
    <div class="resolve-popup" onclick="event.stopPropagation()">
<div class="rp-hd">
  <div class="rp-title">Resolve: ${c.slotTime}</div>
  <div class="rp-close" onclick="closeResolvePopup()"><i class="fas fa-times"></i></div>
</div>
<div class="rp-warn"><i class="fas fa-exclamation-circle"></i>"${c.slotTime}" on ${fmtDateNice(c.date)} is taken. Pick an alternative slot.</div>
<div class="rp-grid-wrap"><div class="rp-grid">${gridHTML}</div></div>
<div class="rp-foot">
  <div class="rp-remove-btn" onclick="resolveRemoveSlot(${conflictIdx})"><i class="fas fa-trash-alt" style="font-size:11px"></i> Remove Slot</div>
  <div class="rp-confirm-btn" id="rpConfirmBtn" onclick="resolveConfirmAlt(${conflictIdx})">Confirm Alternative</div>
</div>
    </div>
  </div>`;
  overlay.style.display = "block";
}

function pickResolveSlot(idx, slotTime) {
  const slots = genSlotsForHour(S.bizConflicts[S.bizResolveTarget].hour);
  document
    .querySelectorAll(".rp-cell.rp-picked")
    .forEach((el) => el.classList.remove("rp-picked"));
  document.getElementById("rpc-" + idx).classList.add("rp-picked");
  S.bizResolvePicked = { idx, slotTime };
  const btn = document.getElementById("rpConfirmBtn");
  btn.classList.add("active");
}

function resolveConfirmAlt(conflictIdx) {
  if (!S.bizResolvePicked) return;
  S.bizResolved[conflictIdx] = {
    newSlotIdx: S.bizResolvePicked.idx,
    newSlotTime: S.bizResolvePicked.slotTime,
  };
  S.bizResolvePicked = null;
  closeResolvePopup();
  renderConflictList();
  toast("Slot resolved");
}

function resolveRemoveSlot(conflictIdx) {
  S.bizRemovedConflicts.add(conflictIdx);
  closeResolvePopup();
  renderConflictList();
  toast("Conflict slot removed");
}

function closeResolvePopup(e) {
  if (e && e.target && e.target !== e.currentTarget) return;
  document.getElementById("resolveOverlay").style.display = "none";
  document.getElementById("resolveOverlay").innerHTML = "";
}

/* ── CONFIRM & BOOK after conflict resolution ── */
function confirmConflictResolution() {
  if (!S.bizDP) return;
  let booked = 0;
  if (!S.slots[S.bizDP.id]) S.slots[S.bizDP.id] = [];

  getPlannedEntries().forEach((e) => {
    const conflictIdx = S.bizConflicts.findIndex(
      (c) =>
        c.date === e.date &&
        c.slotIdx === e.slotIdx &&
        c.hour === e.hour,
    );

    if (conflictIdx >= 0) {
      if (S.bizRemovedConflicts.has(conflictIdx)) return;
      const resolved = S.bizResolved[conflictIdx];
      if (resolved) {
        const newSlot = resolved.newSlotTime;
        if (
          !S.slots[S.bizDP.id].find(
            (x) =>
              x.time === newSlot &&
              x.date === e.date &&
              x.hour === e.hour,
          )
        ) {
          S.slots[S.bizDP.id].push({
            time: newSlot,
            date: e.date,
            hour: e.hour,
          });
          booked++;
        }
      }
      return;
    }

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
  closeConflictModal();
  closeBizSlotModal();
  renderLocTabs();
  renderDPList();
  toast(`${booked} slot${booked !== 1 ? "s" : ""} scheduled`);
}

