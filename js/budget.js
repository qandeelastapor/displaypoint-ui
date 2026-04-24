/* ═══════════════ BUDGET CAMPAIGN OVERFLOW POPUP ═══════════════
   Shown from the Business slot modal when the user tries to save more
   cost than their chosen token budget. Lets them remove individual
   slots (or auto-trim) until the plan fits. */

function openBudgetOverPopup({ planned, rate, alreadyCost, budget }) {
  /* We keep a mutable working copy of the planned entries so remove
     operations in the popup don't mutate the underlying modal state
     until the user confirms. */
  S.bizBudgetOverflow = {
    entries: planned.map((e) => ({ ...e })),
    rate,
    alreadyCost,
    budget,
  };
  renderBudgetOver();
  document.getElementById("budgetOverBackdrop").classList.add("on");
  document.getElementById("budgetOverModal").classList.add("on");
}

function closeBudgetOver() {
  document.getElementById("budgetOverBackdrop").classList.remove("on");
  document.getElementById("budgetOverModal").classList.remove("on");
  S.bizBudgetOverflow = null;
}

function renderBudgetOver() {
  const ctx = S.bizBudgetOverflow;
  if (!ctx) return;
  const totalCost = ctx.entries.length * ctx.rate + ctx.alreadyCost;
  const over = totalCost - ctx.budget;
  const fits = over <= 0;

  document.getElementById("budgetOverSub").innerHTML = fits
    ? `All good — your plan now fits inside <strong>${ctx.budget}</strong> tokens.`
    : `Your plan is <strong>${over}</strong> token${over !== 1 ? "s" : ""} over budget. ` +
      `Remove slots below to continue.`;

  document.getElementById("budgetOverStats").innerHTML = `
    <div class="budget-over-stat">
      <div class="budget-over-stat-val">${ctx.budget}</div>
      <div class="budget-over-stat-lbl">Budget</div>
    </div>
    <div class="budget-over-stat">
      <div class="budget-over-stat-val${fits ? "" : " over"}">${totalCost}</div>
      <div class="budget-over-stat-lbl">Planned</div>
    </div>
    <div class="budget-over-stat">
      <div class="budget-over-stat-val${fits ? "" : " over"}">${fits ? 0 : over}</div>
      <div class="budget-over-stat-lbl">Over</div>
    </div>`;

  /* List entries, flag the ones currently over budget (those past the
     point where the running total exceeds the cap). */
  let running = ctx.alreadyCost;
  const rows = ctx.entries.map((e, i) => {
    running += ctx.rate;
    const isOver = running > ctx.budget;
    return `
      <div class="budget-over-row${isOver ? " over" : ""}">
        <div class="budget-over-row-time">
          <i class="fas fa-clock" style="font-size:10px;color:var(--muted);margin-right:6px"></i>
          ${fmtDateShort(e.date)} · ${e.slotTime}
        </div>
        <div class="budget-over-row-cost">${ctx.rate} tk</div>
        <button class="budget-over-row-rm" onclick="removeBudgetEntry(${i})" title="Remove slot">
          <i class="fas fa-xmark"></i>
        </button>
      </div>`;
  });
  document.getElementById("budgetOverList").innerHTML = rows.join("") ||
    `<div style="padding:14px;text-align:center;color:var(--muted);font-size:12px">No slots left to remove.</div>`;

  const btn = document.getElementById("budgetOverTrimBtn");
  if (fits) {
    btn.textContent = "Save plan";
    btn.onclick = commitBudgetTrim;
    btn.disabled = false;
  } else {
    btn.textContent = "Auto-trim to fit";
    btn.onclick = trimBudgetAuto;
    btn.disabled = ctx.entries.length === 0;
  }
}

function removeBudgetEntry(idx) {
  const ctx = S.bizBudgetOverflow;
  if (!ctx) return;
  ctx.entries.splice(idx, 1);
  renderBudgetOver();
}

/* Drop entries from the end (latest dates first in the list order) until
   the plan fits the budget. */
function trimBudgetAuto() {
  const ctx = S.bizBudgetOverflow;
  if (!ctx) return;
  while (
    ctx.entries.length &&
    ctx.entries.length * ctx.rate + ctx.alreadyCost > ctx.budget
  ) {
    ctx.entries.pop();
  }
  renderBudgetOver();
}

/* User accepted the trimmed plan — save the trimmed entry list
   directly to S.slots and close the modal. We bypass the regular biz
   save path because the manual-mode grid may no longer match the
   trimmed plan (e.g. unevenly trimmed across dates). */
function commitBudgetTrim() {
  const ctx = S.bizBudgetOverflow;
  if (!ctx) return;
  const entries = ctx.entries;
  closeBudgetOver();
  _saveBizAfterTrim(entries);
}

/* Directly push a given list of entries into S.slots for the current
   biz DP, bypassing the manual/auto generators. Used after budget trim
   or after automatic-mode trims. */
function _saveBizAfterTrim(entries) {
  if (!S.bizDP) return;
  if (!S.slots[S.bizDP.id]) S.slots[S.bizDP.id] = [];
  let booked = 0;
  entries.forEach((e) => {
    if (
      !S.slots[S.bizDP.id].find(
        (x) =>
          x.time === e.slotTime && x.date === e.date && x.hour === e.hour,
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
  toast(
    `${booked} slot${booked !== 1 ? "s" : ""} saved (trimmed to fit budget)`,
  );
}
