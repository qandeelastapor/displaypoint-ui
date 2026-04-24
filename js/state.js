/* ═══════════════ STATE ═══════════════ */
const S = {
  /* view layer: 'dashboard' | 'auth' | 'wizard' */
  view: "dashboard",
  /* wizard flow variant: null | 'oneshot' | 'business'
     Inferred from the dashboard entry point (tap DP card = oneshot,
     tap 'Dedicated Business Campaign' CTA = business). Replaces the
     legacy userType toggle on Format step. */
  flow: null,
  oneShotDP: null,
  oneShotLoc: null,
  /* When a one-shot flow is initiated from a location header, this
     remembers which of the two dashboard options was chosen:
       'first'  — auto-book the first-available slot on every checked DP
       'manual' — leave DPs checked but slotless; user picks per DP */
  oneShotMode: null,
  pendingChoice: null,
  /* Dashboard one-shot "Manual time" quick picker context */
  osQuickCtx: null,
  authed: false,
  authReturnTo: null,
  step: 1,
  /* legacy userType kept only for the Register screen's Individual/Business
     segmented control; no longer drives wizard routing. */
  userType: "individual",
  /* Video is the default ad format per product spec. */
  media: { label: "Video AD", icon: "fa-video" },
  isVideo: true,
  isImage: false,
  /* Format step: where to pick video/image from — 'gallery' | 'camera'. */
  mediaPickSource: "gallery",
  loopOn: false,
  vidDur: 30,
  activeCities: ["lhr", "skt", "isl"],
  cityFilter: "selected",
  slots: {},
  checked: new Set(),
  sheetDP: null,
  sheetDate: "2026-03-18",
  sheetHour: 11,
  slotMode: "multi",
  selSlots: [],
  rangeA: null,
  rangeB: null,
  calMonth: new Date(2026, 2, 1),
  bizDP: null,
  bizHour: 11,
  bizHourDDOpen: false,
  bizRecur: "daily",
  bizStartDate: null,
  bizEndDate: null,
  bizCalMonth: new Date(2026, 2, 1),
  bizCalPickingEnd: false,
  bizSelSlots: [],
  bizWeekdays: new Set([1]),
  bizMonthDays: new Set(),
  bizSlotMode: "manual",
  bizAutoIntervalMin: 20,
  bizAutoCount: 5,
  bizAutoAssignments: [],
  bizConflicts: [],
  bizResolved: {},
  bizRemovedConflicts: new Set(),
  bizResolveTarget: null,
  bizResolvePicked: null,
  /* Business campaign type chosen on the dashboard before the wizard
     opens. 'normal' = standard flow. 'budget' = cost-capped flow where
     the user enters a token budget and the slot modals refuse to save
     anything that would exceed it. null until chosen. */
  bizCampaignType: null,
  bizBudget: null,
  /* How the user expressed the budget — 'tokens' or 'eur'. The numeric
     budget above is always stored in tokens; these two fields let the
     UI echo it back in the unit the user actually typed in. */
  bizBudgetCurrency: "tokens",
  bizBudgetDisplay: null,
  /* Expansion state for the business locations accordion. Tracked as a
     Set of city ids. _locAccInited flags the first-render auto-expand
     so re-renders don't keep resetting the user's toggles. */
  expandedLocs: new Set(),
  _locAccInited: false,
  /* Locations step (business + location-level one-shot): search, browse
     pagination, collapsible "selected" strip. */
  locSearchQuery: "",
  locBrowseLimit: 3,
  locSelectedOpen: true,
  /* When the biz slot modal tries to save more cost than the budget,
     we stash the full planned entry list here so the overflow popup
     can trim it interactively. */
  bizBudgetOverflow: null,
  tokenBalance: 50,
};

/* ── PACKAGE DATA ── */
const PACKAGES = [
  {
    id: 1,
    name: "Basic",
    tokens: 150,
    price: "30",
    description: "$9/mo",
  },
  {
    id: 2,
    name: "Super",
    tokens: 250,
    price: "40",
    description: "$19/mo",
  },
  {
    id: 3,
    name: "Classic",
    tokens: 350,
    price: "60",
    description: "$29/mo",
  },
  {
    id: 4,
    name: "Enterprise",
    tokens: 450,
    price: "80",
    description: "$39/mo",
  },
];

/* ── BUSINESS PACKAGES (10% discount) ── */
const BUSINESS_PACKAGES = [
  {
    id: 5,
    name: "Business S",
    tokens: 1000,
    price: "225",
    description: "Bulk Discount",
  },
  {
    id: 6,
    name: "Business M",
    tokens: 5000,
    price: "1125",
    description: "Bulk Discount",
  },
  {
    id: 7,
    name: "Business L",
    tokens: 10000,
    price: "2250",
    description: "Bulk Discount",
  },
];

const MONTHS_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const BIZ_YEAR = 2026;
const CURRENT_MONTH_IDX = 2;
