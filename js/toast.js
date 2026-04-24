/* ═══════════════ TOAST ═══════════════ */
function toast(msg) {
  const t = document.getElementById("toast");
  document.getElementById("toastTxt").textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

