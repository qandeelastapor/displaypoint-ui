/* ═══════════════ S2 LOCATIONS SCREEN ═══════════════
   One-shot flow: flat DP list (single DP or location-scoped).
   Business flow: expandable accordion of locations → DPs inside.
   The old city-capsule tabs and search popup are no longer used for
   picking locations in business — they are hidden in favor of the
   accordion below. */

/* Default slot auto-applied when a DP is checked in the business flow
   so the user never has to open the slot modal just to "have" a slot.
   They can tap the DP to open the modal if they want to change / add
   more. The date aligns with the prototype's "today" so the busy-slot
   demo data keeps working. */
const BIZ_DEFAULT_SLOT_HOUR = 11;
const BIZ_DEFAULT_SLOT_IDX = 0;
const BIZ_DEFAULT_SLOT_DATE = "2026-03-18";

/* How many location groups to show per "page" for business +
   location-level one-shot browse list (infinite scroll loads the next
   chunk after a short fake loading state). */
const LOC_BROWSE_PAGE = 3;

let _locScrollObs = null;
let _locLoadingMore = false;
let _locLoadMoreTimer = null;

function disconnectLocScrollObserver() {
  if (_locScrollObs) {
    _locScrollObs.disconnect();
    _locScrollObs = null;
  }
}

function teardownLocInfiniteScroll() {
  disconnectLocScrollObserver();
  if (_locLoadMoreTimer) {
    clearTimeout(_locLoadMoreTimer);
    _locLoadMoreTimer = null;
  }
  _locLoadingMore = false;
  const ld = document.getElementById("locBrowseLoading");
  if (ld) ld.style.display = "none";
}

function _triggerLocLoadMoreFake() {
  if (_locLoadingMore) return;
  const matched = _citiesMatchingSearch();
  const lim = S.locBrowseLimit || LOC_BROWSE_PAGE;
  if (matched.length <= lim) return;
  _locLoadingMore = true;
  const loading = document.getElementById("locBrowseLoading");
  if (loading) loading.style.display = "flex";
  const fakeMs = 1520 + Math.floor(Math.random() * 380);
  if (_locLoadMoreTimer) clearTimeout(_locLoadMoreTimer);
  _locLoadMoreTimer = setTimeout(() => {
    _locLoadMoreTimer = null;
    const m = _citiesMatchingSearch();
    const l = S.locBrowseLimit || LOC_BROWSE_PAGE;
    if (m.length <= l) {
      _locLoadingMore = false;
      if (loading) loading.style.display = "none";
      return;
    }
    S.locBrowseLimit = l + LOC_BROWSE_PAGE;
    _locLoadingMore = false;
    if (loading) loading.style.display = "none";
    renderDPList();
  }, fakeMs);
}

function setupLocInfiniteScroll() {
  disconnectLocScrollObserver();
  if (!_locFlowIsAccordion()) return;
  const matched = _citiesMatchingSearch();
  const lim = S.locBrowseLimit || LOC_BROWSE_PAGE;
  if (matched.length <= lim) return;
  const root = document.querySelector("#viewWizard .body");
  const sentinel = document.getElementById("locScrollSentinel");
  if (!root || !sentinel) return;
  _locScrollObs = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return;
      const m = _citiesMatchingSearch();
      const l = S.locBrowseLimit || LOC_BROWSE_PAGE;
      if (m.length <= l || _locLoadingMore) return;
      _triggerLocLoadMoreFake();
    },
    { root, rootMargin: "120px 0px 0px 0px", threshold: 0 },
  );
  _locScrollObs.observe(sentinel);
}

function _locFlowIsAccordion() {
  return S.flow === "business" || (S.flow === "oneshot" && !S.oneShotDP);
}

function _hideLocBrowseChrome() {
  teardownLocInfiniteScroll();
  const tools = document.getElementById("locBrowseTools");
  const loadWrap = document.getElementById("locLoadMoreWrap");
  const pan = document.getElementById("locSelectedPanel");
  if (tools) tools.style.display = "none";
  if (loadWrap) loadWrap.style.display = "none";
  if (pan) {
    pan.innerHTML = "";
    pan.style.display = "none";
  }
}

function syncLocBrowseChrome() {
  const tools = document.getElementById("locBrowseTools");
  if (!tools) return;
  tools.style.display = "flex";
  const inp = document.getElementById("locSearchInput");
  if (inp && !inp.dataset.locBound) {
    inp.dataset.locBound = "1";
    inp.addEventListener("input", () => {
      S.locSearchQuery = inp.value;
      S.locBrowseLimit = LOC_BROWSE_PAGE;
      renderDPList();
    });
  }
  if (inp && document.activeElement !== inp) inp.value = S.locSearchQuery || "";
}

function _citiesMatchingSearch() {
  const q = (S.locSearchQuery || "").trim().toLowerCase();
  return ALL_CITIES.filter((city) => {
    const dps = ALL_DPS.filter((d) => d.city === city.id);
    if (!dps.length) return false;
    if (!q) return true;
    if (city.name.toLowerCase().includes(q)) return true;
    if (city.region.toLowerCase().includes(q)) return true;
    return dps.some(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.type && d.type.toLowerCase().includes(q)),
    );
  });
}

function renderLocSelectedPanel() {
  const host = document.getElementById("locSelectedPanel");
  if (!host) return;
  if (!_locFlowIsAccordion()) {
    host.innerHTML = "";
    host.style.display = "none";
    return;
  }
  host.style.display = "";
  const citiesWithSel = ALL_CITIES.filter((c) =>
    ALL_DPS.some((d) => d.city === c.id && S.checked.has(d.id)),
  );
  const nDp = S.checked.size;
  const open = S.locSelectedOpen !== false;
  let body = "";
  if (!nDp) {
    body = `<div class="loc-selected-empty">No display points selected yet. Expand a location below and tick the screens you want.</div>`;
  } else {
    body = citiesWithSel
      .map((city) => {
        const dps = ALL_DPS.filter(
          (d) => d.city === city.id && S.checked.has(d.id),
        );
        if (!dps.length) return "";
        return `<div class="loc-sel-city">
          <div class="loc-sel-city-hd"><span>${city.name}</span><span class="loc-sel-city-badge">${dps.length}</span></div>
          <div class="loc-sel-city-dps">${dps.map((dp) => dpCardHTML(dp)).join("")}</div>
        </div>`;
      })
      .join("");
  }
  host.innerHTML = `
    <div class="loc-selected-inner${open ? " open" : ""}">
      <button type="button" class="loc-selected-hdr" onclick="toggleLocSelectedPanel()">
        <div class="loc-selected-hdr-l">
          <div class="loc-selected-hdr-ic"><i class="fas fa-layer-group"></i></div>
          <div class="loc-selected-hdr-txt">
            <div class="loc-selected-title">Selected locations</div>
            <div class="loc-selected-meta">${citiesWithSel.length} location${citiesWithSel.length !== 1 ? "s" : ""} · ${nDp} display${nDp !== 1 ? "s" : ""}</div>
          </div>
        </div>
        <i class="fas fa-chevron-down loc-selected-chev" aria-hidden="true"></i>
      </button>
      <div class="loc-selected-body">${body}</div>
    </div>`;
}

function toggleLocSelectedPanel() {
  S.locSelectedOpen = !S.locSelectedOpen;
  renderLocSelectedPanel();
}

function _bizDefaultSlot() {
  return {
    time: SLOT_LIST[BIZ_DEFAULT_SLOT_IDX],
    date: BIZ_DEFAULT_SLOT_DATE,
    hour: BIZ_DEFAULT_SLOT_HOUR,
  };
}

function renderLocTabs() {
  const scroll = document.getElementById("locTabsScroll");
  const headerRow = scroll.parentElement; // .loc-header-row
  scroll.innerHTML = "";
  /* The header row (capsule tabs + "+") is only useful for legacy
     flat-list flows. Both one-shot and business now hide it:
       - one-shot: single DP / location-scoped list
       - business: new expandable accordion below replaces it */
  if (S.flow === "oneshot" || S.flow === "business") {
    headerRow.style.display = "none";
    return;
  }
  headerRow.style.display = "";
  const bookedCnt = S.checked.size;
  const st = document.createElement("div");
  st.className =
    "loc-tab sel-tab" + (S.cityFilter === "selected" ? " on" : "");
  st.innerHTML =
    "Selected" +
    (bookedCnt > 0 ? ` <span class="bcnt">${bookedCnt}</span>` : "");
  st.onclick = () => {
    S.cityFilter = "selected";
    renderLocTabs();
    renderDPList();
  };
  scroll.appendChild(st);
  S.activeCities.forEach((cid) => {
    const city = ALL_CITIES.find((c) => c.id === cid);
    if (!city) return;
    const cnt = ALL_DPS.filter(
      (d) => d.city === cid && S.checked.has(d.id),
    ).length;
    const t = document.createElement("div");
    t.className = "loc-tab" + (S.cityFilter === cid ? " on" : "");
    t.dataset.city = cid;
    t.innerHTML =
      city.name +
      (cnt > 0 ? ` <span class="bcnt">${cnt}</span>` : "") +
      ` <div class="loc-tab-info"><i class="fas fa-info-circle"></i></div>`;
    t.onclick = () => {
      S.cityFilter = cid;
      renderLocTabs();
      renderDPList();
    };
    scroll.appendChild(t);
  });
}
function renderDPListSkel() {
  document.getElementById("dpList").innerHTML = [1, 2, 3]
    .map(() => `<div class="skel skel-card"></div>`)
    .join("");
}
function renderDPList() {
  const list = document.getElementById("dpList");
  /* Business + location-level one-shot — accordion, search, selected
     strip, load-more on the browse list. */
  if (S.flow === "business") {
    syncLocBrowseChrome();
    renderLocSelectedPanel();
    renderLocAccordion(list);
    _syncLocLoadMoreVisibility();
    _finishLocInfiniteScrollSetup();
    return;
  }
  if (S.flow === "oneshot" && !S.oneShotDP) {
    syncLocBrowseChrome();
    renderLocSelectedPanel();
    renderLocAccordion(list);
    _syncLocLoadMoreVisibility();
    _finishLocInfiniteScrollSetup();
    return;
  }
  _hideLocBrowseChrome();
  let dps;
  if (S.flow === "oneshot" && S.oneShotDP) {
    /* One-shot (single DP from a DP tap on the dashboard): render
       only that DP — no multi-DP management. */
    dps = [S.oneShotDP];
  } else if (S.cityFilter === "selected") {
    dps = ALL_DPS.filter((d) => S.checked.has(d.id));
    if (!dps.length) {
      list.innerHTML = `<div style="text-align:center;padding:36px 20px;color:var(--muted);font-size:13px"><i class="fas fa-map-marker-alt" style="display:block;font-size:28px;margin-bottom:10px;opacity:.25"></i>No display points selected yet.<br>Tap + in the header to add one, or return to the dashboard.</div>`;
      return;
    }
  } else {
    dps = ALL_DPS.filter((d) => d.city === S.cityFilter);
  }
  list.innerHTML = dps.map((dp) => dpCardHTML(dp)).join("");
}

function _syncLocLoadMoreVisibility() {
  const loadWrap = document.getElementById("locLoadMoreWrap");
  const loading = document.getElementById("locBrowseLoading");
  if (!loadWrap || !_locFlowIsAccordion()) {
    if (loadWrap) loadWrap.style.display = "none";
    teardownLocInfiniteScroll();
    return;
  }
  const matched = _citiesMatchingSearch();
  const lim = S.locBrowseLimit || LOC_BROWSE_PAGE;
  if (matched.length <= lim) {
    loadWrap.style.display = "none";
    teardownLocInfiniteScroll();
    return;
  }
  loadWrap.style.display = "block";
  if (loading && !_locLoadingMore) loading.style.display = "none";
}

function _finishLocInfiniteScrollSetup() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => setupLocInfiniteScroll());
  });
}

/* Render a single DP card — reused between flat list and accordion. */
function dpCardHTML(dp) {
  const chips = S.slots[dp.id] || [];
  const isChecked = S.checked.has(dp.id);
  const chipsHTML = buildDPChipsHTML(dp.id, chips);
  return `<div class="dp-card ${isChecked ? "booked" : ""}" id="dpcard-${dp.id}">
<div class="dp-top">
  <div class="dp-checkbox ${isChecked ? "on" : ""}" onclick="toggleCheck('${dp.id}',event)"></div>
  <div class="dp-icon"><i class="fas fa-tv"></i></div>
  <div class="dp-info"><div class="dp-name">${dp.name}</div><div class="dp-meta">${dp.type} · ${dp.cityName}</div></div>
  <div class="dp-actions">
    <button class="dp-clear-btn" ${isChecked ? "" : 'style="display:none"'} onclick="clearDP('${dp.id}',event)"><i class="fas fa-trash-alt"></i></button>
    <div class="dp-info-capsule"><i class="fas fa-info-circle"></i></div>
  </div>
</div>
${chipsHTML}
    </div>`;
}

/* Expandable / collapsible location accordion (business flow).
   One group per city; tapping the header toggles expansion. DPs inside
   use the same card markup as the flat list, so all existing click /
   checkbox handlers keep working. */
function renderLocAccordion(listEl) {
  if (!(S.expandedLocs instanceof Set)) {
    S.expandedLocs = new Set();
  }
  /* On first render, auto-expand the first city that has any DPs (or
     any city that already has checked DPs, so the user sees their
     selections immediately). */
  if (!S._locAccInited) {
    ALL_CITIES.forEach((c) => {
      const anyChecked = ALL_DPS.some(
        (d) => d.city === c.id && S.checked.has(d.id),
      );
      if (anyChecked) S.expandedLocs.add(c.id);
    });
    if (!S.expandedLocs.size) {
      const first = ALL_CITIES.find((c) =>
        ALL_DPS.some((d) => d.city === c.id),
      );
      if (first) S.expandedLocs.add(first.id);
    }
    S._locAccInited = true;
  }

  const matched = _citiesMatchingSearch();
  const lim = S.locBrowseLimit || LOC_BROWSE_PAGE;
  const visibleCities = matched.slice(0, lim);

  let html = `
    <div class="loc-browse-label">
      <span>All locations</span>
      <span class="loc-browse-count">${visibleCities.length} / ${matched.length}</span>
    </div>`;

  html += visibleCities
    .map((city) => {
      const dps = ALL_DPS.filter((d) => d.city === city.id);
      if (!dps.length) return "";
      const booked = dps.filter((d) => S.checked.has(d.id)).length;
      const open = S.expandedLocs.has(city.id);
      const idx = ALL_CITIES.indexOf(city) + 1;
      return `
      <div class="loc-acc-group${open ? " open" : ""}${booked ? " has-booked" : ""}" data-city="${city.id}">
        <div class="loc-acc-hdr" onclick="toggleLocGroup('${city.id}')">
          <div class="loc-acc-idx">${idx}</div>
          <div class="loc-acc-name">
            <div class="loc-acc-name-main">${city.name}</div>
            <div class="loc-acc-name-sub">${city.region} · ${dps.length} DP${dps.length !== 1 ? "s" : ""}</div>
          </div>
          ${booked ? `<div class="loc-acc-bcnt">${booked}</div>` : ""}
          <i class="fas fa-chevron-down loc-acc-chev"></i>
        </div>
        <div class="loc-acc-body">
          ${dps.map((dp) => dpCardHTML(dp)).join("")}
        </div>
      </div>`;
    })
    .join("");

  if (!visibleCities.length) {
    html += `<div class="loc-search-empty"><i class="fas fa-search"></i>No locations match your search.</div>`;
  }

  listEl.innerHTML = html;
}

function toggleLocGroup(cityId) {
  if (!(S.expandedLocs instanceof Set)) S.expandedLocs = new Set();
  if (S.expandedLocs.has(cityId)) S.expandedLocs.delete(cityId);
  else S.expandedLocs.add(cityId);
  renderDPList();
}

function buildDPChipsHTML(dpId, chips) {
  if (!chips.length)
    return `<div class="dp-empty"><i class="fas fa-clock" style="font-size:10px"></i>No slots — <span style="color:var(--blue);cursor:pointer;font-weight:600;margin-left:3px" onclick="openSlotModal('${dpId}')">tap to book</span></div>`;
  const groups = {};
  chips.forEach((ch) => {
    const key = (ch.hour || 11) + "|" + (ch.date || "unknown");
    if (!groups[key])
      groups[key] = { hour: ch.hour || 11, dates: new Set(), slots: [] };
    groups[key].dates.add(ch.date);
    groups[key].slots.push(ch.time);
  });
  const dateRanges = getDPDateRanges(chips);
  let html = '<div class="dp-chips">';
  if (dateRanges.length) {
    dateRanges.forEach((r) => {
      html += `<div class="dp-range-chip"><i class="fas fa-calendar"></i>${r.label}</div>`;
    });
    const uniqueHours = [...new Set(chips.map((c) => c.hour || 11))].sort(
      (a, b) => a - b,
    );
    uniqueHours.forEach((h) => {
      const slotCount = chips.filter((c) => (c.hour || 11) === h).length;
      const perDay = [
        ...new Set(
          chips.filter((c) => (c.hour || 11) === h).map((c) => c.time),
        ),
      ].length;
      html += `<div class="dp-range-chip"><i class="fas fa-clock"></i>${String(h).padStart(2, "0")}:00 · ${perDay} slot${perDay > 1 ? "s" : ""}</div>`;
    });
  }
  html += `<div class="dp-add-inline" onclick="openSlotModal('${dpId}')"><i class="fas fa-plus" style="font-size:10px"></i> Add</div>`;
  html += "</div>";
  return html;
}

function getDPDateRanges(chips) {
  const dates = [...new Set(chips.map((c) => c.date))].sort();
  if (!dates.length) return [];
  if (dates.length === 1) return [{ label: fmtDateShort(dates[0]) }];
  return [
    {
      label:
        fmtDateShort(dates[0]) +
        " → " +
        fmtDateShort(dates[dates.length - 1]),
    },
  ];
}
function fmtDateShort(ds) {
  const d = new Date(ds + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function toggleCheck(dpId, e) {
  e.stopPropagation();
  /* Single-DP one-shot: locked — there is only one DP from the
     dashboard tap. To switch DP the user returns to the dashboard. */
  if (S.flow === "oneshot" && S.oneShotDP) return;
  if (S.checked.has(dpId)) {
    S.checked.delete(dpId);
  } else {
    S.checked.add(dpId);
    /* Auto-slot rules on new checks so the user isn't stuck with a
       "no slots" card after selecting:
         - business: always add a default biz slot.
         - one-shot 'first': add a first-available slot (same as the
           bulk action from the dashboard).
         - one-shot 'manual': leave empty (user picks via modal). */
    if (S.flow === "business") {
      if (!S.slots[dpId] || !S.slots[dpId].length) {
        S.slots[dpId] = [_bizDefaultSlot()];
      }
    } else if (
      S.flow === "oneshot" &&
      S.oneShotMode === "first" &&
      (!S.slots[dpId] || !S.slots[dpId].length)
    ) {
      const firstFree =
        typeof _firstFreeSlot === "function" ? _firstFreeSlot() : null;
      if (firstFree) {
        S.slots[dpId] = [
          { time: firstFree, date: ONE_SHOT_TODAY, hour: 11 },
        ];
      }
    }
  }
  renderLocTabs();
  renderDPList();
}
function clearDP(dpId, e) {
  e.stopPropagation();
  if (S.flow === "oneshot" && S.oneShotDP) {
    /* Single-DP one-shot: keep the DP but empty its slots so the
       user can re-book. */
    S.slots[dpId] = [];
    renderDPList();
    return;
  }
  delete S.slots[dpId];
  S.checked.delete(dpId);
  renderLocTabs();
  renderDPList();
  toast("Display point cleared");
}
function removeChip(dpId, idx, e) {
  e.stopPropagation();
  S.slots[dpId].splice(idx, 1);
  if (!S.slots[dpId].length) delete S.slots[dpId];
  renderLocTabs();
  renderDPList();
}
