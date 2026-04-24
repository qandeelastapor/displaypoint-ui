/* ═══════════════ LOC POPUP ═══════════════ */
function openLocPopup() {
  document.getElementById("locSearchInput").value = "";
  filterLocPopup();
  document.getElementById("locPopup").classList.add("open");
}
function closeLocPopup() {
  document.getElementById("locPopup").classList.remove("open");
}
function filterLocPopup() {
  const q = document.getElementById("locSearchInput").value.toLowerCase();
  const filtered = ALL_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q),
  );
  document.getElementById("locPopupList").innerHTML = filtered
    .slice(0, 6)
    .map((c) => {
      const added = S.activeCities.includes(c.id);
      return `<div class="lp-item" onclick="addCity('${c.id}')">
<div class="lp-item-check ${added ? "" : "empty"}">${added ? '<i class="fas fa-check"></i>' : ""}</div>
<div class="lp-item-icon"><i class="fas fa-city"></i></div>
<div style="flex:1;min-width:0"><div class="lp-item-name">${c.name}</div><div class="lp-item-sub">${c.region}</div></div>
<div class="lp-item-info" onclick="event.stopPropagation()"><i class="fas fa-info-circle"></i></div>
    </div>`;
    })
    .join("");
}
function addCity(cid) {
  if (!S.activeCities.includes(cid)) S.activeCities.push(cid);
  S.cityFilter = cid;
  closeLocPopup();
  renderLocTabs();
  renderDPList();
  toast(ALL_CITIES.find((c) => c.id === cid).name + " added");
}

