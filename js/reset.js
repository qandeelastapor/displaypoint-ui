/* ═══════════════ RESET ═══════════════
   Called after a successful "Done" step. Returns the app to the
   Dashboard with a clean slate and keeps the user logged in. */
function resetAll() {
  S.step = 1;
  S.flow = null;
  S.oneShotDP = null;
  S.oneShotLoc = null;
  S.oneShotMode = null;
  S.pendingChoice = null;
  S.osQuickCtx = null;
  S.bizCampaignType = null;
  S.bizBudget = null;
  S.bizBudgetCurrency = "tokens";
  S.bizBudgetDisplay = null;
  S.bizBudgetOverflow = null;
  S.expandedLocs = new Set();
  S._locAccInited = false;
  S.locSearchQuery = "";
  S.locBrowseLimit = 3;
  S.locSelectedOpen = true;
  S.slots = {};
  S.checked = new Set();
  S.selSlots = [];
  S.rangeA = null;
  S.rangeB = null;
  S.cityFilter = "selected";
  S.isVideo = true;
  S.isImage = false;
  S.mediaPickSource = "gallery";
  S.loopOn = false;
  S.media = { label: "Video AD", icon: "fa-video" };

  /* Reset format screen UI — Video is the default selection. */
  const mcs = document.querySelectorAll("#s1 .mc");
  mcs.forEach((c) => c.classList.remove("on"));
  if (mcs[0]) mcs[0].classList.add("on");
  const vo = document.getElementById("videoOpts");
  if (vo) vo.classList.add("show");
  const io = document.getElementById("imageOpts");
  if (io) io.classList.remove("show");
  const lt = document.getElementById("loopToggle");
  if (lt) lt.classList.remove("on");
  if (typeof removeVideo === "function") removeVideo();
  if (typeof removeImage === "function") removeImage();
  if (typeof setMediaPickSource === "function") setMediaPickSource("gallery");

  const ob = document.getElementById("osQuickBackdrop");
  const os = document.getElementById("osQuickSheet");
  if (ob) ob.classList.remove("on");
  if (os) os.classList.remove("on");

  if (typeof teardownLocInfiniteScroll === "function") {
    teardownLocInfiniteScroll();
  }

  goView("dashboard");
}
