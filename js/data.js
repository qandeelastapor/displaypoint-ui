/* ═══════════════ MOCK DATA ═══════════════ */
const ALL_CITIES = [
  { id: "lhr", name: "Lahore", region: "Punjab, PK" },
  { id: "skt", name: "Sialkot", region: "Punjab, PK" },
  { id: "isl", name: "Islamabad", region: "Capital, PK" },
  { id: "khi", name: "Karachi", region: "Sindh, PK" },
  { id: "psh", name: "Peshawar", region: "KPK, PK" },
  { id: "mlt", name: "Multan", region: "Punjab, PK" },
];
const ALL_DPS = [
  {
    id: "lhr-mm",
    city: "lhr",
    cityName: "Lahore",
    name: "Main Mall Display",
    type: "Mall Screen",
    screens: 2,
    tokensPerSlot: 5,
  },
  {
    id: "lhr-gb",
    city: "lhr",
    cityName: "Lahore",
    name: "Gulberg Digital",
    type: "Outdoor LED",
    screens: 1,
    tokensPerSlot: 3,
  },
  {
    id: "lhr-lb",
    city: "lhr",
    cityName: "Lahore",
    name: "Liberty Chowk",
    type: "Junction Board",
    screens: 3,
    tokensPerSlot: 7,
  },
  {
    id: "skt-ch",
    city: "skt",
    cityName: "Sialkot",
    name: "Chamber Digital",
    type: "Indoor Screen",
    screens: 1,
    tokensPerSlot: 2,
  },
  {
    id: "skt-ar",
    city: "skt",
    cityName: "Sialkot",
    name: "Airport Road LED",
    type: "Highway LED",
    screens: 2,
    tokensPerSlot: 4,
  },
  {
    id: "isl-bl",
    city: "isl",
    cityName: "Islamabad",
    name: "Blue Area Screen",
    type: "Commercial",
    screens: 4,
    tokensPerSlot: 8,
  },
  {
    id: "isl-f7",
    city: "isl",
    cityName: "Islamabad",
    name: "F-7 Markaz",
    type: "Outdoor LED",
    screens: 2,
    tokensPerSlot: 4,
  },
  {
    id: "khi-cl",
    city: "khi",
    cityName: "Karachi",
    name: "Clifton Sea View",
    type: "Outdoor LED",
    screens: 3,
    tokensPerSlot: 6,
  },
  {
    id: "khi-sa",
    city: "khi",
    cityName: "Karachi",
    name: "Saddar Junction",
    type: "Junction Board",
    screens: 2,
    tokensPerSlot: 4,
  },
  {
    id: "khi-dk",
    city: "khi",
    cityName: "Karachi",
    name: "DHA Phase 6 LED",
    type: "Outdoor LED",
    screens: 2,
    tokensPerSlot: 5,
  },
  {
    id: "psh-qb",
    city: "psh",
    cityName: "Peshawar",
    name: "Qissa Khwani Bazar",
    type: "Junction Board",
    screens: 2,
    tokensPerSlot: 3,
  },
  {
    id: "psh-hp",
    city: "psh",
    cityName: "Peshawar",
    name: "Hayatabad Plaza",
    type: "Mall Screen",
    screens: 1,
    tokensPerSlot: 2,
  },
  {
    id: "psh-ur",
    city: "psh",
    cityName: "Peshawar",
    name: "University Road LED",
    type: "Highway LED",
    screens: 3,
    tokensPerSlot: 5,
  },
  {
    id: "mlt-ch",
    city: "mlt",
    cityName: "Multan",
    name: "Chungi No.9 Screen",
    type: "Outdoor LED",
    screens: 2,
    tokensPerSlot: 3,
  },
  {
    id: "mlt-hb",
    city: "mlt",
    cityName: "Multan",
    name: "Hussain Agahi LED",
    type: "Junction Board",
    screens: 1,
    tokensPerSlot: 2,
  },
  {
    id: "mlt-bz",
    city: "mlt",
    cityName: "Multan",
    name: "Bahawalpur Road",
    type: "Highway LED",
    screens: 2,
    tokensPerSlot: 4,
  },
];

function genSlotsForHour(h) {
  const slots = [];
  const hh = String(h).padStart(2, "0");
  for (let i = 0; i < 15; i++) {
    const ts = i * 20;
    const te = (i + 1) * 20;
    const sm = Math.floor(ts / 60),
      ss = ts % 60,
      em = Math.floor(te / 60),
      es = te % 60;
    slots.push(
      `${hh}:${String(sm).padStart(2, "0")}:${String(ss).padStart(2, "0")}-${hh}:${String(em).padStart(2, "0")}:${String(es).padStart(2, "0")}`,
    );
  }
  return slots;
}

const SLOT_LIST = genSlotsForHour(11);

const BUSY_SLOTS = {
  "2026-03-18": [
    "11:00:40-11:01:00",
    "11:02:00-11:02:20",
    "11:03:40-11:04:00",
  ],
  "2026-03-19": ["11:00:20-11:00:40", "11:01:20-11:01:40"],
  "2026-03-21": ["11:02:00-11:02:20", "11:03:00-11:03:20"],
  "2026-03-22": ["11:01:00-11:01:20"],
};

const BIZ_BUSY = {};
(function () {
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const dates = [
    "2026-03-20",
    "2026-03-21",
    "2026-03-22",
    "2026-03-25",
    "2026-03-26",
    "2026-03-27",
    "2026-03-28",
    "2026-04-01",
    "2026-04-05",
    "2026-04-10",
    "2026-04-15",
  ];
  dates.forEach((ds) => {
    BIZ_BUSY[ds] = {};
    hours.forEach((h) => {
      const busy = [];
      if (Math.random() < 0.4) {
        const count = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < count; i++) {
          const idx = Math.floor(Math.random() * 15);
          if (!busy.includes(idx)) busy.push(idx);
        }
      }
      if (busy.length) BIZ_BUSY[ds][h] = busy;
    });
  });
})();
