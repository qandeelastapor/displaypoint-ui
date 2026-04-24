/* ═══════════════ VIEW SWITCHER ═══════════════
   The phone shell hosts three sibling views:
     - #viewDashboard : landing / home (DASHBOARD-2)
     - #viewAuth      : login + register
     - #viewWizard    : the 5-step campaign wizard
   Only one view is visible at a time. goView() handles the swap so
   any screen can navigate to another without polluting step logic. */
function goView(name) {
  S.view = name;
  ["Dashboard", "Auth", "Wizard"].forEach((v) => {
    const el = document.getElementById("view" + v);
    if (el) el.classList.toggle("on", v.toLowerCase() === name);
  });
  if (name === "dashboard") renderDashboard();
  else if (typeof stopTutorialAuto === "function") stopTutorialAuto();
  if (name === "auth") renderAuthScreen();
}
