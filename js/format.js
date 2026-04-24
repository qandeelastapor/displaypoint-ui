/* ═══════════════ S1 FORMAT ═══════════════
   User-type (Individual/Business) is no longer chosen here — it is
   inferred from the dashboard entry point (tap DP card = oneshot,
   CTA button = business). The toggle now lives only on the Register
   screen. Legacy setUserType() is kept as a thin alias so any lingering
   call sites do not throw.

   Video / Image: user picks Gallery vs Camera, then the upload zone
   opens the matching native file picker (camera uses capture=). */

function setMediaPickSource(src) {
  if (src !== "camera" && src !== "gallery") return;
  S.mediaPickSource = src;
  document.querySelectorAll("#s1 .fmt-src-opt").forEach((btn) => {
    btn.classList.toggle("on", btn.dataset.src === src);
  });
  updateFmtUploadHints();
}

function updateFmtUploadHints() {
  const vidSub = document.getElementById("vidUploadSub");
  if (vidSub) {
    const from = S.mediaPickSource === "camera" ? "camera" : "photo library";
    vidSub.textContent = `MP4, MOV · Max 500MB · opens ${from}`;
  }
}

function openVideoPicker() {
  const id = S.mediaPickSource === "camera" ? "vidFileCam" : "vidFileGal";
  const el = document.getElementById(id);
  if (el) el.click();
}

function onVideoFileChosen(ev) {
  const inp = ev.target;
  const f = inp.files && inp.files[0];
  if (!f) return;
  const nameEl = document.getElementById("vidFileName");
  if (nameEl) nameEl.textContent = f.name;
  const uz = document.getElementById("vidUploadZone");
  const pr = document.getElementById("vidPreview");
  if (uz) uz.style.display = "none";
  if (pr) pr.style.display = "flex";
  const db = document.getElementById("durBadge");
  if (db) db.textContent = "30s";
  S.vidDur = 30;
  inp.value = "";
}

function removeVideo() {
  const uz = document.getElementById("vidUploadZone");
  const pr = document.getElementById("vidPreview");
  if (uz) uz.style.display = "flex";
  if (pr) pr.style.display = "none";
  const db = document.getElementById("durBadge");
  if (db) db.textContent = "—";
  S.vidDur = 0;
  const g = document.getElementById("vidFileGal");
  const c = document.getElementById("vidFileCam");
  if (g) g.value = "";
  if (c) c.value = "";
}

/** @deprecated Use openVideoPicker — kept for any stale onclick refs */
function handleVideoUpload() {
  openVideoPicker();
}

function openImagePicker() {
  const id = S.mediaPickSource === "camera" ? "imgFileCam" : "imgFileGal";
  const el = document.getElementById(id);
  if (el) el.click();
}

function onImageFileChosen(ev) {
  const inp = ev.target;
  const f = inp.files && inp.files[0];
  if (!f) return;
  const nameEl = document.getElementById("imgFileName");
  const meta = document.getElementById("imgFileMeta");
  if (nameEl) nameEl.textContent = f.name;
  if (meta) {
    const mb = (f.size / (1024 * 1024)).toFixed(2);
    meta.textContent =
      mb === "0.00" ? `${(f.size / 1024).toFixed(0)} KB` : `${mb} MB`;
  }
  const uz = document.getElementById("imgUploadZone");
  const pr = document.getElementById("imgPreview");
  if (uz) uz.style.display = "none";
  if (pr) pr.style.display = "flex";
  inp.value = "";
}

function removeImage() {
  const uz = document.getElementById("imgUploadZone");
  const pr = document.getElementById("imgPreview");
  if (uz) uz.style.display = "flex";
  if (pr) pr.style.display = "none";
  const g = document.getElementById("imgFileGal");
  const c = document.getElementById("imgFileCam");
  if (g) g.value = "";
  if (c) c.value = "";
}

function pickMedia(el, label, icon) {
  document
    .querySelectorAll("#s1 .mc")
    .forEach((c) => c.classList.remove("on"));
  el.classList.add("on");
  S.media = { label, icon };
  S.isVideo = label === "Video AD";
  S.isImage = label === "Image AD";
  const vo = document.getElementById("videoOpts");
  const io = document.getElementById("imageOpts");
  if (vo) vo.classList.toggle("show", S.isVideo);
  if (io) io.classList.toggle("show", S.isImage);
  if (label !== "Image AD") removeImage();
  if (label !== "Video AD") removeVideo();
  updateRangeTabVis();
  updateFmtUploadHints();
}
function toggleLoop() {
  S.loopOn = !S.loopOn;
  document.getElementById("loopToggle").classList.toggle("on", S.loopOn);
  document.getElementById("loopSub").textContent = S.loopOn
    ? "Video continues across slots seamlessly"
    : "Video restarts at each slot independently";
  updateRangeTabVis();
}
function updateRangeTabVis() {
  /* Range mode is only meaningful for Business/Customized flow + video loop.
     In oneshot it must stay hidden. */
  const show = S.flow !== "oneshot" && S.isVideo && S.loopOn;
  const rt = document.getElementById("rangeTab");
  if (rt) rt.style.display = show ? "" : "none";
  const modeTabs = document.querySelector(".slot-mode-tabs");
  if (modeTabs) modeTabs.style.display = show ? "flex" : "none";
  if (!show && S.slotMode === "range") setSlotMode("multi");
}
function setUserType(type) {
  /* Legacy entry point — now only used by the Register screen. */
  S.userType = type;
  if (typeof setRegType === "function") setRegType(type);
}
