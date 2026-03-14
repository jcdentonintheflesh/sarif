// ─────────────────────────────────────────────────────────────────────────────
// SARIF — Example Data File
// ─────────────────────────────────────────────────────────────────────────────
// Copy this file to travelHistory.js and replace with your own data.
// travelHistory.js is gitignored — your travel history never leaves your machine.
//
// arrival:   date you entered the country (YYYY-MM-DD)
// departure: date you left (YYYY-MM-DD), or null if you're currently there
// ─────────────────────────────────────────────────────────────────────────────

// ── US ENTRY/EXIT HISTORY ────────────────────────────────────────────────────
// Add all your US entries from CBP travel records.
// Request your I-94 history at: https://i94.cbp.dhs.gov
export const US_TRIPS = [
  { arrival: "2023-01-10", departure: "2023-02-14" },
  { arrival: "2023-05-01", departure: "2023-05-20" },
  { arrival: "2023-08-15", departure: "2023-09-10" },
  { arrival: "2023-11-22", departure: "2024-01-08" },
  { arrival: "2024-03-05", departure: "2024-04-20" },
  { arrival: "2024-07-01", departure: "2024-08-15" },
  { arrival: "2024-10-10", departure: "2024-11-25" },
  { arrival: "2025-01-15", departure: "2025-03-01" },
  { arrival: "2025-05-20", departure: "2025-07-05" },
  { arrival: "2025-09-10", departure: "2025-10-20" },
  { arrival: "2025-12-20", departure: "2026-01-05" },
  { arrival: "2026-02-20", departure: null }, // currently in US
];

// ── SCHENGEN STAYS ───────────────────────────────────────────────────────────
// Track your time inside the Schengen Area (90/180-day rule).
// Schengen = most of EU (not Ireland, not Romania/Bulgaria/Croatia yet).
// Note: some countries outside the EU are Schengen (e.g. Switzerland, Norway).
export const SCHENGEN_TRIPS = [
  { arrival: "2023-03-01", departure: "2023-04-20", entryPort: "AMS", zone: "Schengen" },
  { arrival: "2023-06-10", departure: "2023-07-30", entryPort: "CDG", zone: "Schengen" },
  { arrival: "2024-05-15", departure: "2024-06-25", entryPort: "FRA", zone: "Schengen" },
  { arrival: "2025-08-01", departure: "2025-09-05", entryPort: "BCN", zone: "Schengen" },
  { arrival: "2026-01-08", departure: "2026-02-16", entryPort: "CDG", zone: "Schengen" },
];

// ── POINTS & MILES BALANCES ──────────────────────────────────────────────────
// Update these manually whenever your balances change.
// type: "miles" | "points"
// alliance: "Star Alliance" | "SkyTeam" | "Oneworld" | "Transferable" | "none"
export const POINTS = [
  { program: "Amex Membership Rewards", balance: 85000,  type: "points", alliance: "Transferable",  color: "#60a5fa" },
  { program: "Chase Ultimate Rewards",  balance: 72000,  type: "points", alliance: "Transferable",  color: "#34d399" },
  { program: "United MileagePlus",      balance: 45000,  type: "miles",  alliance: "Star Alliance", color: "#a78bfa" },
  { program: "Delta SkyMiles",          balance: 28000,  type: "miles",  alliance: "SkyTeam",       color: "#f472b6" },
  { program: "Aeroplan",                balance: 15000,  type: "points", alliance: "Star Alliance", color: "#fb923c" },
];

// ── TRANSFER PARTNERS ────────────────────────────────────────────────────────
// Which programs your transferable points can move to (1:1 unless noted).
export const TRANSFER_PARTNERS = {
  "Amex Membership Rewards": [
    "Air Canada Aeroplan", "Flying Blue (AF/KLM)", "Avianca LifeMiles",
    "British Airways Avios", "Singapore KrisFlyer", "ANA Mileage Club",
    "Virgin Atlantic", "Emirates Skywards", "Delta SkyMiles",
  ],
  "Chase Ultimate Rewards": [
    "Air Canada Aeroplan", "Flying Blue (AF/KLM)", "United MileagePlus",
    "British Airways Avios", "Singapore KrisFlyer", "Virgin Atlantic",
    "Emirates Skywards", "Iberia Plus",
  ],
};

// ── YOUR DESTINATIONS ────────────────────────────────────────────────────────
// Set your home airport and regular/bucket-list destinations.
// key format: "ORIGIN-DESTINATION" — used to match ROUTE_PRICING below.
// airports: IATA code(s) for the destination city.
// tags: ["your routes"] for regular trips, ["bucket list"] for aspirational.
// dealAlert: freeform tip text shown in the UI.

const HOME = "JFK"; // ← change this to your home airport IATA code

export const DESTINATIONS = {
  [`${HOME}-LHR`]: {
    label: "London",
    sublabel: "Heathrow",
    airports: "LHR / LGW",
    tags: ["your routes"],
    dealAlert: "British Airways runs flash sales on the JFK-LHR route 3–4x per year. Avios redemptions via British Airways or Iberia can be sweet spots — check both for the same flight as pricing differs.",
  },
  [`${HOME}-AMS`]: {
    label: "Amsterdam",
    sublabel: "Schiphol",
    airports: "AMS",
    tags: ["your routes"],
    dealAlert: "Flying Blue Promo Awards on the 1st of each month — KLM and Air France both on the same program. Sometimes 20–30% off business.",
  },
  [`${HOME}-NRT`]: {
    label: "Tokyo",
    sublabel: "Narita / Haneda",
    airports: "NRT / HND",
    tags: ["bucket list"],
    dealAlert: "Virgin Atlantic Flying Club on ANA business class (The Room on 777s) is one of the best sweet spots in points — ~60k one-way. ANA award space releases ~2 weeks before departure, not far in advance.",
  },
  [`${HOME}-DXB`]: {
    label: "Dubai",
    sublabel: "International",
    airports: "DXB",
    tags: ["bucket list"],
    dealAlert: "Emirates Skywards (transfers from Amex MR + Chase UR). Emirates First Class is expensive but legendary. Also check Aeroplan on Emirates — often prices lower than Skywards itself.",
  },
  [`${HOME}-BKK`]: {
    label: "Bangkok",
    sublabel: "Suvarnabhumi",
    airports: "BKK",
    tags: ["bucket list"],
    dealAlert: "Star Alliance redemptions via Aeroplan or United MileagePlus. EVA Air has excellent award availability out of the US. Flying Blue on Thai Airways is also an option.",
  },
  [`${HOME}-VIE`]: {
    label: "Vienna",
    sublabel: "International",
    airports: "VIE",
    tags: ["bucket list"],
    dealAlert: "Vienna is a great Star Alliance hub — Austrian Airlines (Star Alliance) is the main carrier. Aeroplan and United MileagePlus often price VIE well. Good as a positioning city for onward Eastern Europe travel.",
  },
};

// ── USER-MANAGED DESTINATIONS ────────────────────────────────────────────────
// These can be added/removed from the UI. Pre-populate with one example.
export const DEFAULT_USER_DESTINATIONS = [
  {
    key: `${HOME}-SIN`,
    label: "Singapore",
    sublabel: "Changi",
    airports: "SIN",
    tags: ["bucket list"],
    dealAlert: "Singapore KrisFlyer (transfers from Amex MR + Chase UR) for Singapore Airlines business class — one of the best products in the air. Star Alliance partner awards also bookable via Aeroplan.",
  },
];

// ── ROUTE PRICING ─────────────────────────────────────────────────────────────
// Manual price tiers per route — update these when you research a route.
// monthlyTiers: one value per month (Jan–Dec): 'low' | 'medium' | 'high' | 'peak'
// cashByTier: typical price ranges (USD) for premium economy (pe) and business (biz)
export const ROUTE_PRICING = {
  [`${HOME}-LHR`]: {
    monthlyTiers: ['low','low','medium','medium','high','high','peak','peak','medium','low','low','high'],
    cashByTier: {
      low:    { pe: [700,  1100],  biz: [2200, 3500] },
      medium: { pe: [1000, 1500],  biz: [3000, 4500] },
      high:   { pe: [1400, 2000],  biz: [4000, 6000] },
      peak:   { pe: [1800, 2600],  biz: [5000, 8000] },
    },
    bestDays: ['Tue', 'Wed'],
    worstDays: ['Fri', 'Sun'],
    bookingWindow: { cash: '4–8 weeks out.', award: '6–11 months out for peak. Partner awards via Aeroplan.' },
    peakNote: 'Jul–Aug peak. Jan–Feb and Oct–Nov are the sweet spots.',
  },
  [`${HOME}-AMS`]: {
    monthlyTiers: ['low','low','medium','medium','high','high','peak','peak','medium','low','low','high'],
    cashByTier: {
      low:    { pe: [800,  1250],  biz: [2400, 3600] },
      medium: { pe: [1050, 1550],  biz: [3000, 4600] },
      high:   { pe: [1400, 2000],  biz: [4000, 5800] },
      peak:   { pe: [1800, 2600],  biz: [4800, 7500] },
    },
    bestDays: ['Tue', 'Wed'],
    worstDays: ['Fri', 'Sun'],
    bookingWindow: { cash: '4–8 weeks out.', award: 'Flying Blue Promo Awards on 1st of month.' },
    peakNote: 'Oct–Nov best value. Jul–Aug peak.',
  },
  [`${HOME}-NRT`]: {
    monthlyTiers: ['medium','low','medium','medium','high','high','peak','peak','medium','low','medium','high'],
    cashByTier: {
      low:    { pe: [1200, 1800],  biz: [4000, 6000]  },
      medium: { pe: [1600, 2400],  biz: [5000, 8000]  },
      high:   { pe: [2200, 3200],  biz: [6500, 10000] },
      peak:   { pe: [2800, 4000],  biz: [8000, 14000] },
    },
    bestDays: ['Tue', 'Wed', 'Thu'],
    worstDays: ['Fri', 'Sun'],
    bookingWindow: { cash: 'Book 3–6 months out.', award: 'ANA space releases ~2 weeks before departure via Virgin Atlantic.' },
    peakNote: 'Cherry blossom (late Mar–Apr) and Golden Week (late Apr–May) are brutal. Feb and Oct are sweet spots.',
  },
};

// ── LIVE DEALS ────────────────────────────────────────────────────────────────
// Update these manually when you spot deals. Set expires to null for evergreen tips.
// severity: 'hot' | 'good' | 'info'
export const LIVE_DEALS = [
  {
    id: "example-deal-1",
    severity: "info",
    title: "Flying Blue Promo Awards — Check on the 1st",
    body: "Air France/KLM's Flying Blue program releases discounted 'Promo Awards' on the 1st of every month. Business class to Europe from the US sometimes drops 25–35%. Set a reminder.",
    action: "flyingblue.com → Spend Miles → Award flights",
    actionLink: "https://www.flyingblue.com",
    expires: null,
    routes: [],
  },
  {
    id: "example-deal-2",
    severity: "info",
    title: "ANA Award Space: Book 2 Weeks Out, Not Far Ahead",
    body: "ANA releases partner award space ~14–21 days before departure, not at the 11-month mark. Virgin Atlantic Flying Club on ANA business (~60k one-way) is one of the best sweet spots in points. Check weekly from T-21 days.",
    action: "virginatlantic.com/flying-club",
    actionLink: "https://www.virginatlantic.com/flying-club",
    expires: null,
    routes: [],
  },
];

// ── UPGRADE SYSTEMS ───────────────────────────────────────────────────────────
// Bid/miles upgrade info per airline. Add your airlines here.
export const UPGRADE_SYSTEMS = {
  british: {
    airline: "British Airways",
    name: "Upgrade Bid",
    type: "bid",
    summary: "Bid-based upgrade offered after booking. Confirmed 48–72h before departure.",
    details: [
      "Available on long-haul flights. Offered by email after booking.",
      "Bid within a suggested range. Acceptance not guaranteed.",
      "Can also upgrade using Avios points if you have enough.",
    ],
    link: "https://www.britishairways.com",
  },
  airfrance: {
    airline: "Air France / KLM",
    name: "Upgrade Bid + Miles Upgrade",
    type: "bid+miles",
    summary: "Two options: bid cash for upgrade, or use Flying Blue miles.",
    details: [
      "Bid upgrade: offered after booking. Confirmed 48h before departure.",
      "Miles upgrade: Economy→PE ~15–25k miles, PE→Business ~30–50k miles.",
      "Works on both Air France and KLM via Flying Blue.",
    ],
    link: "https://www.flyingblue.com",
  },
};

// ── AIRLINE IDENTITY ──────────────────────────────────────────────────────────
export const AIRLINES = {
  austrian:     { name: "Austrian Airlines",code: "OS", alliance: "Star Alliance", color: "#c8102e" },
  british:      { name: "British Airways",  code: "BA", alliance: "Oneworld",      color: "#075aaa" },
  airfrance:    { name: "Air France",       code: "AF", alliance: "SkyTeam",       color: "#002157" },
  klm:          { name: "KLM",             code: "KL", alliance: "SkyTeam",       color: "#00a1de" },
  united:       { name: "United Airlines", code: "UA", alliance: "Star Alliance", color: "#005daa" },
  ana:          { name: "ANA",             code: "NH", alliance: "Star Alliance", color: "#1a3f6f" },
  emirates:     { name: "Emirates",        code: "EK", alliance: "none",          color: "#c8102e" },
  singapore:    { name: "Singapore Air",   code: "SQ", alliance: "Star Alliance", color: "#1c3d7a" },
  turkish:      { name: "Turkish Airlines",code: "TK", alliance: "Star Alliance", color: "#c8102e" },
};

// ── REDEMPTION SWEET SPOTS ────────────────────────────────────────────────────
// Pre-built award booking strategies for your routes.
// destinationKey must match a key in DESTINATIONS above.
// airlineKeys must match keys in AIRLINES above.
export const REDEMPTION_SWEET_SPOTS = [
  {
    destinationKey: `${HOME}-LHR`,
    pricingKey:     `${HOME}-LHR`,
    route:          "JFK → LHR",
    cabin:          "Business",
    airlineKeys:    ["british"],
    program:        "British Airways Avios",
    programType:    "points",
    miles:          50000,
    milesType:      "one-way",
    transferFrom:   ["Amex MR", "Chase UR"],
    notes:          "Off-peak Avios to LHR in business. Fuel surcharges apply on BA metal — consider partner airlines (Iberia, Finnair) on same route for no-surcharge alternatives.",
    upgradeSystem:  null,
    bookingSteps: [
      "Search britishairways.com → Book a trip → Use Avios.",
      "Transfer Amex MR or Chase UR → Avios at 1:1 after confirming space.",
      "Note: BA charges fuel surcharges. Check Iberia for same-route Avios awards without surcharges.",
    ],
    cashLink:  "https://www.britishairways.com",
    awardLink: "https://www.britishairways.com",
    stale: false,
    lastVerified: "2026-01-01",
  },
  {
    destinationKey: `${HOME}-NRT`,
    pricingKey:     `${HOME}-NRT`,
    route:          "JFK → NRT / HND",
    cabin:          "Business",
    airlineKeys:    ["ana"],
    program:        "Virgin Atlantic Flying Club",
    programType:    "points",
    miles:          60000,
    milesType:      "one-way",
    transferFrom:   ["Amex MR", "Chase UR"],
    notes:          "ANA business class (The Room on 777s) is world-class. 60k one-way. Award space releases ~2 weeks before departure — this is a last-minute play.",
    upgradeSystem:  null,
    bookingSteps: [
      "ANA award space via Virgin Atlantic opens ~14–21 days before departure. Check weekly from T-21.",
      "When space appears, call Virgin Atlantic Flying Club — cannot book ANA awards online.",
      "Transfer Amex MR or Chase UR → Virgin Atlantic at 1:1 (instant). Then call to book.",
      "~60,000 miles OW + ~$100–150 taxes. Round trip ~95,000 miles.",
    ],
    cashLink:  "https://www.ana.co.jp/en/us/",
    awardLink: "https://www.virginatlantic.com/flying-club",
    stale: false,
    lastVerified: "2026-01-01",
  },
];
