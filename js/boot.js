/* ═══════════════ BOOT ═══════════════
   Phase 2: app starts on the Dashboard. The legacy demo-seed that
   pre-booked every DP with a first-available slot is removed — slots
   are now only added deliberately by the user through the flows. */
function boot() {
  S.slots = {};
  S.checked = new Set();
  S.cityFilter = "selected";
  goView("dashboard");
}
