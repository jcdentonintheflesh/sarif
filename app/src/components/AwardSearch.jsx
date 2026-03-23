import { useState, useEffect } from 'react';
import { Search, ExternalLink, Zap, DollarSign, RefreshCw, ArrowLeftRight, Calendar, Plus, X } from 'lucide-react';
import apiFetch from '../utils/apiFetch';

const PROGRAMS = {
  flyingblue:     { name: 'Flying Blue',          transferFrom: ['Amex MR', 'Chase UR'], bookUrl: 'https://www.flyingblue.com' },
  aeroplan:       { name: 'Aeroplan',              transferFrom: ['Amex MR', 'Chase UR'], bookUrl: 'https://aeroplan.com' },
  aircanada:      { name: 'Aeroplan',              transferFrom: ['Amex MR', 'Chase UR'], bookUrl: 'https://aeroplan.com' },
  united:         { name: 'United MileagePlus',    transferFrom: ['Chase UR'],            bookUrl: 'https://www.united.com' },
  lifemiles:      { name: 'Avianca LifeMiles',     transferFrom: ['Amex MR', 'Chase UR'], bookUrl: 'https://www.lifemiles.com' },
  delta:          { name: 'Delta SkyMiles',        transferFrom: ['Amex MR'],             bookUrl: 'https://www.delta.com' },
  american:       { name: 'AAdvantage',            transferFrom: [],                      bookUrl: 'https://www.aa.com' },
  british:        { name: 'British Avios',         transferFrom: ['Amex MR', 'Chase UR'], bookUrl: 'https://www.britishairways.com' },
  virginatlantic: { name: 'Virgin Atlantic',       transferFrom: ['Amex MR', 'Chase UR'], bookUrl: 'https://www.virginatlantic.com' },
  virgin:         { name: 'Virgin Atlantic',       transferFrom: ['Amex MR', 'Chase UR'], bookUrl: 'https://www.virginatlantic.com' },
  emirates:       { name: 'Emirates Skywards',     transferFrom: ['Amex MR', 'Chase UR'], bookUrl: 'https://www.emirates.com' },
  turkish:        { name: 'Turkish Miles&Smiles',  transferFrom: [],                      bookUrl: 'https://www.turkishairlines.com' },
  lufthansa:      { name: 'Lufthansa Miles&More',  transferFrom: ['Amex MR'],             bookUrl: 'https://www.miles-and-more.com' },
  singapore:      { name: 'Singapore KrisFlyer',   transferFrom: ['Amex MR', 'Chase UR'], bookUrl: 'https://www.singaporeair.com' },
  alaska:         { name: 'Alaska Mileage Plan',   transferFrom: [],                      bookUrl: 'https://www.alaskaair.com' },
  cathay:         { name: 'Asia Miles (Cathay)',   transferFrom: ['Amex MR', 'Chase UR'], bookUrl: 'https://www.cathaypacific.com' },
  smiles:         { name: 'GOL Smiles',            transferFrom: ['Amex MR'],             bookUrl: 'https://www.smiles.com.br' },
  eurobonus:      { name: 'SAS EuroBonus',         transferFrom: ['Amex MR'],             bookUrl: 'https://www.flysas.com' },
  iberia:         { name: 'Iberia Avios',          transferFrom: ['Amex MR', 'Chase UR'], bookUrl: 'https://www.iberia.com' },
  airindia:       { name: 'Air India Flying Returns', transferFrom: ['Amex MR'],           bookUrl: 'https://www.airindia.com/flying-returns' },
  jetblue:        { name: 'JetBlue TrueBlue',      transferFrom: ['Amex MR', 'Chase UR'], bookUrl: 'https://www.jetblue.com/trueblue' },
  finnair:        { name: 'Finnair Plus',           transferFrom: ['Amex MR'],             bookUrl: 'https://www.finnair.com/finnairplus' },
  etihad:         { name: 'Etihad Guest',           transferFrom: ['Amex MR'],             bookUrl: 'https://www.etihad.com/etihadguest' },
  velocity:       { name: 'Virgin Australia Velocity', transferFrom: [],                   bookUrl: 'https://www.virginaustralia.com/velocity' },
  copa:           { name: 'Copa ConnectMiles',      transferFrom: [],                      bookUrl: 'https://www.copaair.com/connectmiles' },
  azul:           { name: 'Azul TudoAzul',          transferFrom: ['Amex MR'],             bookUrl: 'https://www.voeazul.com.br/tudoazul' },
};

// IATA carrier code → readable name
const CARRIERS = {
  // Europe
  AF: 'Air France', KL: 'KLM', OS: 'Austrian', LH: 'Lufthansa', LX: 'Swiss',
  SN: 'Brussels Airlines', AY: 'Finnair', SK: 'SAS', LO: 'LOT Polish',
  TP: 'TAP Portugal', IB: 'Iberia', VY: 'Vueling', VS: 'Virgin Atlantic',
  BA: 'British Airways', FR: 'Ryanair', U2: 'easyJet', W6: 'Wizz Air',
  CL: 'Lufthansa CityLine', EN: 'Air Dolomiti', EW: 'Eurowings', DE: 'Condor',
  BT: 'Air Baltic', WK: 'Edelweiss', '2L': 'Helvetic', LG: 'Luxair',
  PC: 'Pegasus', A3: 'Aegean', OA: 'Olympic', PS: 'UIA', RO: 'TAROM',
  '4U': 'Germanwings', X3: 'TUI fly', TF: 'Braathens',
  // North America
  AC: 'Air Canada', UA: 'United', DL: 'Delta', AA: 'American', B6: 'JetBlue',
  WN: 'Southwest', AS: 'Alaska', WS: 'WestJet', NK: 'Spirit', F9: 'Frontier',
  Z0: 'Norse Atlantic', LY: 'El Al',
  // Middle East & Africa
  TK: 'Turkish', EK: 'Emirates', EY: 'Etihad', QR: 'Qatar',
  SV: 'Saudi', GF: 'Gulf Air', WY: 'Oman Air', ME: 'MEA',
  RJ: 'Royal Jordanian', MS: 'EgyptAir', ET: 'Ethiopian', KQ: 'Kenya',
  // Asia Pacific
  SQ: 'Singapore', NH: 'ANA', JL: 'Japan', CX: 'Cathay',
  KE: 'Korean Air', OZ: 'Asiana', TG: 'Thai', GA: 'Garuda',
  MH: 'Malaysia', CI: 'China Airlines', CA: 'Air China',
  CZ: 'China Southern', MU: 'China Eastern', AI: 'Air India',
  VN: 'Vietnam', BR: 'EVA Air', '5J': 'Cebu Pacific',
  // Latin America
  AV: 'Avianca', LA: 'LATAM', G3: 'Gol', AR: 'Aerolíneas', CM: 'Copa',
  AM: 'Aeromexico', Y4: 'Volaris',
};

// Returns array of { code, name } objects
function parseAirlines(raw) {
  if (!raw) return [];
  return raw.split(',').map(code => {
    const trimmed = code.trim();
    return { code: trimmed, name: CARRIERS[trimmed] || trimmed };
  });
}

function AirlineBadges({ raw }) {
  const airlines = parseAirlines(raw);
  if (!airlines.length) return <span className="text-slate-600">—</span>;
  return (
    <div className="flex gap-1 flex-wrap">
      {airlines.map((a, i) => (
        <span key={i} title={a.name}
          className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-xs">
          <span className="font-mono font-semibold text-slate-300">{a.code}</span>
          {CARRIERS[a.code] && <span className="text-slate-500">{a.name}</span>}
        </span>
      ))}
    </div>
  );
}

const CABINS = [
  { key: 'J', label: 'Business' },
  { key: 'W', label: 'Premium Eco' },
  { key: 'Y', label: 'Economy' },
  { key: 'F', label: 'First' },
];

// Maps user-facing program names to seats.aero source keys
const PROGRAM_KEY_MAP = {
  'United MileagePlus':        'united',
  'Delta SkyMiles':            'delta',
  'American AAdvantage':       'american',
  'British Airways Avios':     'british',
  'Aeroplan':                  'aeroplan',
  'Air Canada Aeroplan':       'aeroplan',
  'Flying Blue':               'flyingblue',
  'Virgin Atlantic':           'virginatlantic',
  'Virgin Atlantic Flying Club': 'virginatlantic',
  'Emirates Skywards':         'emirates',
  'Singapore KrisFlyer':       'singapore',
  'Turkish Miles&Smiles':      'turkish',
  'Avianca LifeMiles':         'lifemiles',
  'Alaska Mileage Plan':       'alaska',
  'Iberia Avios':              'iberia',
  'Finnair Plus':              'finnair',
  'Etihad Guest':              'etihad',
};

// Transferable currencies → seats.aero program keys
const TRANSFER_TO_KEYS = {
  'Amex Membership Rewards': ['flyingblue','aeroplan','lifemiles','british','virginatlantic','emirates','singapore','delta','lufthansa','etihad','finnair','iberia','jetblue','airindia','azul','eurobonus'],
  'Chase Ultimate Rewards':  ['flyingblue','aeroplan','united','british','virginatlantic','emirates','singapore','iberia','jetblue'],
  'Citi ThankYou Points':    ['flyingblue','aeroplan','lifemiles','turkish','singapore','jetblue','cathay'],
  'Capital One Miles':       ['flyingblue','aeroplan','turkish','singapore','british','finnair','cathay','lifemiles','eurobonus'],
  'Bilt Rewards':            ['flyingblue','aeroplan','united','british','virginatlantic','emirates','singapore','alaska','iberia'],
};

function bookLink(source, orig, dest) {
  switch (source) {
    case 'united':         return `https://www.united.com/en/us/flights/book/options?f=${orig}&t=${dest}&tripType=oneWay&cabinType=business`;
    case 'flyingblue':     return 'https://www.airfrance.com/';
    case 'aeroplan':
    case 'aircanada':      return 'https://aeroplan.com/';
    case 'lifemiles':      return 'https://www.lifemiles.com/';
    case 'virginatlantic':
    case 'virgin':         return 'https://www.virginatlantic.com/';
    case 'british':        return 'https://www.britishairways.com/';
    case 'lufthansa':      return 'https://www.miles-and-more.com/';
    case 'delta':          return 'https://www.delta.com/';
    case 'american':       return 'https://www.aa.com/';
    case 'turkish':        return 'https://www.turkishairlines.com/';
    case 'emirates':       return 'https://www.emirates.com/';
    case 'singapore':      return 'https://www.singaporeair.com/';
    case 'eurobonus':      return 'https://www.flysas.com/';
    default:               return PROGRAMS[source]?.bookUrl || '#';
  }
}

function fmt(miles) {
  if (!miles || miles === 0) return null;
  return (miles / 1000).toFixed(1).replace('.0', '') + 'k';
}

function fmtDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtTaxes(raw) {
  if (!raw) return null;
  return '$' + Math.round(raw / 100);
}

function cppColor(cpp) {
  if (cpp >= 8) return { text: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30', label: 'Excellent' };
  if (cpp >= 6) return { text: 'text-blue-400',    bg: 'bg-blue-500/15 border-blue-500/30',       label: 'Good' };
  if (cpp >= 4) return { text: 'text-yellow-400',  bg: 'bg-yellow-500/15 border-yellow-500/30',   label: 'OK' };
  return          { text: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/30',       label: 'Poor — consider cash' };
}

function CabinFareRow({ label, prices, loading, highlight }) {
  const noKey = prices === null && !loading;
  return (
    <div>
      <div className="text-xs mb-2 flex items-center gap-1.5 flex-wrap">
        <span className={highlight ? 'text-slate-300 font-medium' : 'text-slate-500'}>{label}</span>
        {loading && <span className="flex items-center gap-1 text-slate-600"><RefreshCw size={12} className="animate-spin" /> fetching...</span>}
        {prices !== null && !loading && <span className="text-slate-600">· Sky Scrapper</span>}
        {noKey && <span className="text-slate-600">· add RAPIDAPI_KEY in Settings</span>}
      </div>
      {prices?.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {prices.map((p, i) => (
            <div key={i} className={`rounded-xl border px-3 py-2 ${i === 0 && highlight ? 'border-emerald-500/40 bg-emerald-500/8' : 'border-white/10 bg-white/3'}`}>
              <div className="text-lg font-semibold font-mono text-white">${p.price.toLocaleString()}</div>
              <div className="text-xs text-slate-500">
                {p.date ? fmtDate(p.date) : '—'}
                {p.stops === 0 ? <span className="ml-1 text-emerald-400">direct</span> : <span className="ml-1">{p.stops} stop{p.stops > 1 ? 's' : ''}</span>}
              </div>
              {p.airlines?.length > 0 && <div className="text-xs text-slate-600">{p.airlines.slice(0, 2).join(', ')}</div>}
            </div>
          ))}
        </div>
      )}
      {prices !== null && prices.length === 0 && !loading && (
        <p className="text-xs text-slate-600">No {label} fares found</p>
      )}
    </div>
  );
}

// Reusable results section (used for both outbound and return)
function ResultsSection({ available, cabin, origin, destination, cashPrice, programFilter, sortBy, onHubSearch, usableKeys }) {
  const filtered = available.filter(r =>
    programFilter === 'all' || r.Source === programFilter
  );

  const sorted = [...filtered].sort((a, b) =>
    sortBy === 'price'
      ? a[`${cabin}MileageCostRaw`] - b[`${cabin}MileageCostRaw`]
      : new Date(a.Date) - new Date(b.Date)
  );

  const bestByProgram = {};
  available.forEach(r => {
    const cost = r[`${cabin}MileageCostRaw`];
    if (!bestByProgram[r.Source] || cost < bestByProgram[r.Source].cost) {
      bestByProgram[r.Source] = { cost, date: r.Date, seats: r[`${cabin}RemainingSeatsRaw`], taxes: r[`${cabin}TotalTaxesRaw`] };
    }
  });

  const cheapestMiles = available.length ? Math.min(...available.map(r => r[`${cabin}MileageCostRaw`])) : null;

  if (Object.keys(bestByProgram).length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-2 text-center">
        <div className="text-slate-400 text-sm">No {CABINS.find(c => c.key === cabin)?.label} availability — {origin} → {destination}</div>
        <div className="text-slate-600 text-xs">Try a different cabin, adjust the date range, or uncheck the transferable filter.</div>
        <div className="text-xs text-slate-600 pt-1">
          Some regional airports aren't indexed by Seats.aero. Try searching via a major hub (VIE, FRA, IST, LHR) and book the full itinerary on the program's website.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary cards */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-slate-300">
            {CABINS.find(c => c.key === cabin)?.label} · {origin} → {destination}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{available.length} dates</span>
            <a href={`https://www.skyscanner.com/transport/flights/${origin}/${destination}/`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition-colors">
              Skyscanner <ExternalLink size={10} />
            </a>
            <a href={`https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition-colors">
              Google Flights <ExternalLink size={10} />
            </a>
          </div>
        </div>
        {!cashPrice && (
          <div className="text-xs text-amber-400/80 bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2">
            Enter a cash price above to see ¢/pt value
          </div>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {Object.entries(bestByProgram).sort((a, b) => a[1].cost - b[1].cost).map(([source, info]) => {
            const prog           = PROGRAMS[source];
            const isTransferable = prog?.transferFrom?.length > 0;
            const isCheapest     = info.cost === cheapestMiles;
            const canUse         = usableKeys?.has(source);
            return (
              <div key={source} className={`rounded-xl border p-3 space-y-1.5 ${
                isCheapest ? 'border-emerald-500/40 bg-emerald-500/8' : canUse ? 'border-blue-500/25 bg-blue-500/5' : isTransferable ? 'border-white/10 bg-white/5' : 'border-white/5 bg-white/3'
              }`}>
                <div className="flex items-center gap-1.5">
                  {isCheapest && <Zap size={10} className="text-emerald-400 shrink-0" />}
                  {canUse && !isCheapest && <Zap size={10} className="text-blue-400 shrink-0" />}
                  <div className="text-xs text-slate-300 font-medium truncate">{prog?.name || source}</div>
                </div>
                <div className="text-xl font-semibold font-mono text-white">{fmt(info.cost)}</div>
                <div className="text-xs text-slate-500">
                  from {fmtDate(info.date)}
                  {info.seats > 0 && <span> · {info.seats} seats</span>}
                </div>
                {info.taxes > 0 && <div className="text-xs text-slate-500">+{fmtTaxes(info.taxes)} taxes</div>}
                {canUse && <div className="text-xs text-blue-400">You have points for this</div>}
                {!canUse && isTransferable && <div className="text-xs text-emerald-400">{prog.transferFrom.join(' · ')}</div>}
                {cashPrice > 0 && info.cost > 0 && (() => {
                  const cpp = (parseFloat(cashPrice) / info.cost * 100).toFixed(1);
                  const style = cppColor(parseFloat(cpp));
                  return (
                    <div className={`text-xs px-2 py-1 rounded-lg border font-semibold ${style.bg} ${style.text}`}>
                      {cpp}¢/pt · {style.label}
                    </div>
                  );
                })()}
                <a href={bookLink(source, origin, destination)} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 rounded-md px-2.5 py-1 transition-colors whitespace-nowrap">
                  View availability <ExternalLink size={9} />
                </a>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-600">Taxes shown are base only — verify fuel surcharges on the airline site before transferring points.</p>
      </div>

      {/* Full table */}
      {sorted.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-white/5 bg-white/3">
                  <th className="text-left px-5 py-2.5 font-medium">Date</th>
                  <th className="text-left px-3 py-2.5 font-medium">Program</th>
                  <th className="text-left px-3 py-2.5 font-medium">Miles</th>
                  <th className="text-left px-3 py-2.5 font-medium">Taxes</th>
                  <th className="text-left px-3 py-2.5 font-medium">Seats</th>
                  <th className="text-left px-3 py-2.5 font-medium">Airlines</th>
                  <th className="text-left px-3 py-2.5 font-medium">Transfer from</th>
                  {cashPrice > 0 && <th className="text-left px-3 py-2.5 font-medium">¢/pt</th>}
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sorted.map((r, i) => {
                  const prog     = PROGRAMS[r.Source];
                  const miles    = r[`${cabin}MileageCostRaw`];
                  const taxes    = r[`${cabin}TotalTaxesRaw`];
                  const seats    = r[`${cabin}RemainingSeatsRaw`];
                  const airlinesRaw = r[`${cabin}Airlines`];
                  const isDirect = r[`${cabin}Direct`];
                  const isCheap  = miles === cheapestMiles;
                  return (
                    <tr key={i} className={`hover:bg-white/5 transition-colors ${isCheap ? 'bg-emerald-500/5' : ''}`}>
                      <td className="px-5 py-2.5 text-xs font-mono text-slate-300 whitespace-nowrap">
                        {fmtDate(r.Date)}
                        {isDirect && <span className="ml-2 text-emerald-400">direct</span>}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-300">{prog?.name || r.Source}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`font-mono font-semibold ${isCheap ? 'text-emerald-400' : 'text-white'}`}>{fmt(miles)}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-400">{fmtTaxes(taxes) || '—'}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-400">{seats || '—'}</td>
                      <td className="px-3 py-2.5"><AirlineBadges raw={airlinesRaw} /></td>
                      <td className="px-3 py-2.5 text-xs text-emerald-400">
                        {prog?.transferFrom?.length ? prog.transferFrom.join(' · ') : <span className="text-slate-600">—</span>}
                      </td>
                      {cashPrice > 0 && (
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {miles > 0 ? (() => {
                            const cpp = (parseFloat(cashPrice) / miles * 100).toFixed(1);
                            const style = cppColor(parseFloat(cpp));
                            return <span className={`text-xs font-semibold ${style.text}`}>{cpp}¢</span>;
                          })() : <span className="text-slate-600">—</span>}
                        </td>
                      )}
                      <td className="px-3 py-2.5">
                        <a href={bookLink(r.Source, origin, destination)} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 rounded-md px-2 py-0.5 transition-colors whitespace-nowrap">
                          Book <ExternalLink size={9} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Popular international destinations to seed quick routes for any home airport
const SEED_DESTINATIONS = ['LHR', 'CDG', 'NRT', 'AMS', 'DXB'];

function loadSavedRoutes(home) {
  try {
    const raw = localStorage.getItem('sarif_quick_routes');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  // First run: seed with popular routes from user's home airport
  if (home) return SEED_DESTINATIONS.filter(d => d !== home).map(d => ({ from: home, to: d }));
  return [];
}

export default function AwardSearch({ homeAirport = 'JFK', points = [], destinations = {} }) {
  const [savedRoutes, setSavedRoutes] = useState(() => loadSavedRoutes(homeAirport));
  const [addingRoute, setAddingRoute] = useState(false);
  const [newRouteDest, setNewRouteDest] = useState('');

  // Persist routes to localStorage
  useEffect(() => {
    localStorage.setItem('sarif_quick_routes', JSON.stringify(savedRoutes));
  }, [savedRoutes]);

  // Re-seed if home airport changes and no saved routes exist
  useEffect(() => {
    if (homeAirport && savedRoutes.length === 0) {
      setSavedRoutes(SEED_DESTINATIONS.map(d => ({ from: homeAirport, to: d })));
    }
  }, [homeAirport]);

  function addRoute(dest) {
    const d = (dest || newRouteDest).trim().toUpperCase();
    if (!d || d.length < 3) return;
    const from = origin || homeAirport;
    if (from === d) return; // no self-routes
    if (savedRoutes.some(r => r.from === from && r.to === d)) return; // no dupes
    setSavedRoutes(prev => [...prev, { from, to: d }]);
    setNewRouteDest('');
    setAddingRoute(false);
  }

  function removeRoute(idx) {
    setSavedRoutes(prev => prev.filter((_, i) => i !== idx));
  }

  // Figure out which seats.aero program keys the user can use
  const usableKeys = new Set();
  (points || []).forEach(p => {
    if (PROGRAM_KEY_MAP[p.program]) usableKeys.add(PROGRAM_KEY_MAP[p.program]);
    if (TRANSFER_TO_KEYS[p.program]) TRANSFER_TO_KEYS[p.program].forEach(k => usableKeys.add(k));
  });

  const firstDest = savedRoutes[0]?.to || 'LHR';
  const [origin,          setOrigin]          = useState(homeAirport || 'JFK');
  const [destination,     setDestination]     = useState(firstDest);
  const [cabin,           setCabin]           = useState('J');
  const [isRoundTrip,     setIsRoundTrip]     = useState(false);
  const [dateFrom,        setDateFrom]        = useState('');
  const [dateTo,          setDateTo]          = useState('');

  const [loading,         setLoading]         = useState(false);
  const [results,         setResults]         = useState(null);
  const [error,           setError]           = useState(null);

  const [retLoading,      setRetLoading]      = useState(false);
  const [retResults,      setRetResults]      = useState(null);

  const [onlyTransferable, setOnlyTransferable] = useState(true);
  const [programFilter,   setProgramFilter]   = useState('all');
  const [sortBy,          setSortBy]          = useState('price');

  // Economy cash prices (Travelpayouts)
  const [cashPrice,       setCashPrice]       = useState('');
  const [cashPrices,      setCashPrices]      = useState(null);
  const [cashLoading,     setCashLoading]     = useState(false);

  // Business cash prices (Sky Scrapper via RapidAPI)
  const [cashBizPrices,   setCashBizPrices]   = useState(null);
  const [cashBizLoading,  setCashBizLoading]  = useState(false);
  // Premium economy cash prices
  const [cashPEPrices,    setCashPEPrices]    = useState(null);
  const [cashPELoading,   setCashPELoading]   = useState(false);

  const [serverDown, setServerDown] = useState(false);

  async function fetchCashPrices(o, d, cab) {
    setCashLoading(true);
    setCashPrices(null);
    try {
      const res  = await apiFetch(`/api/cash?origin=${o}&destination=${d}&cabin=${cab}`);
      const data = await res.json();
      setServerDown(false);
      if (data.error) { setCashPrices([]); return; }
      const prices = data.prices || [];
      setCashPrices(prices);
      if (prices.length > 0 && cab === 'Y') {
        setCashPrice(p => p || String(prices[0].price));
      }
    } catch { setCashPrices([]); setServerDown(true); }
    finally  { setCashLoading(false); }
  }

  async function fetchCashBizPrices(o, d, cab, setLoading, setPrices) {
    setLoading(true);
    setPrices(null);
    try {
      const dateParam = dateFrom ? `&date=${dateFrom}` : '';
      const res  = await apiFetch(`/api/cashbiz?origin=${o}&destination=${d}&cabin=${cab}${dateParam}`);
      const data = await res.json();
      setServerDown(false);
      if (data.error) { setPrices([]); return; }
      setPrices(data.prices || []);
    } catch { setPrices([]); setServerDown(true); }
    finally  { setLoading(false); }
  }

  async function search(orig, dest) {
    const o = (orig || origin).toUpperCase();
    const d = (dest || destination).toUpperCase();
    if (!o || !d) return;

    setLoading(true);
    setError(null);
    setResults(null);
    setRetResults(null);
    setCashPrice('');
    setCashPrices(null);
    setCashBizPrices(null);
    setCashPEPrices(null);
    setProgramFilter('all');

    fetchCashPrices(o, d, cabin);
    fetchCashBizPrices(o, d, 'J', setCashBizLoading, setCashBizPrices);
    fetchCashBizPrices(o, d, 'W', setCashPELoading, setCashPEPrices);

    const dateParams = [
      dateFrom ? `&start_date=${dateFrom}` : '',
      dateTo   ? `&end_date=${dateTo}`     : '',
    ].join('');

    try {
      const fetches = [
        apiFetch(`/api/seats/search?origin_airport=${o}&destination_airport=${d}${dateParams}`).then(async r => { const t = await r.text(); try { return JSON.parse(t); } catch { throw new Error(t.slice(0, 120)); } }),
        isRoundTrip
          ? apiFetch(`/api/seats/search?origin_airport=${d}&destination_airport=${o}${dateParams}`).then(async r => { const t = await r.text(); try { return JSON.parse(t); } catch { throw new Error(t.slice(0, 120)); } })
          : Promise.resolve(null),
      ];
      const [outData, retData] = await Promise.all(fetches);

      if (outData.error) throw new Error(outData.message);
      setResults(outData.data || []);

      if (retData) {
        setRetResults(retData.error ? [] : (retData.data || []));
      }
    } catch (e) {
      setError(e.message || 'Search failed — check that the dev server is running');
    } finally {
      setLoading(false);
      setRetLoading(false);
    }
  }

  function filterResults(allResults) {
    return (allResults || []).filter(r => {
      const avail = r[`${cabin}Available`];
      const cost  = r[`${cabin}MileageCostRaw`];
      if (!avail || !cost) return false;
      if (onlyTransferable && !PROGRAMS[r.Source]?.transferFrom?.length) return false;
      if (dateFrom && r.Date < dateFrom) return false;
      if (dateTo   && r.Date > dateTo)   return false;
      return true;
    });
  }

  const available    = filterResults(results);
  const retAvailable = filterResults(retResults);
  const programsPresent = [...new Set((results || []).map(r => r.Source).concat((retResults || []).map(r => r.Source)))];

  const cabinLabel = CABINS.find(c => c.key === cabin)?.label || cabin;
  const hasCashData = cashPrices !== null || cashBizPrices !== null || cashPEPrices !== null;

  return (
    <div className="space-y-4">

      {/* ── Search form ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">

        {/* Section A: Route & Search */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-base font-semibold text-white">
              Award Search <span className="text-xs font-normal text-slate-500 ml-1">powered by Seats.aero</span>
            </h3>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsRoundTrip(false)}
                className={`text-xs px-3 py-1.5 rounded-l-lg border transition-colors ${
                  !isRoundTrip ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                }`}>
                One way
              </button>
              <button onClick={() => setIsRoundTrip(true)}
                className={`text-xs px-3 py-1.5 rounded-r-lg border-t border-b border-r transition-colors flex items-center gap-1 ${
                  isRoundTrip ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                }`}>
                <ArrowLeftRight size={11} /> Round trip
              </button>
            </div>
          </div>

          {/* Saved routes */}
          <div className="flex gap-1.5 flex-wrap items-center">
            {savedRoutes.map((r, i) => (
              <div key={i} className="group relative">
                <button
                  onClick={() => { setOrigin(r.from); setDestination(r.to); }}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors font-mono pr-6 ${
                    origin === r.from && destination === r.to
                      ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                  }`}>
                  {r.from} → {r.to}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); removeRoute(i); }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                  title="Remove route">
                  <X size={10} />
                </button>
              </div>
            ))}
            {addingRoute ? (
              <form onSubmit={(e) => { e.preventDefault(); addRoute(); }} className="flex items-center gap-1">
                <span className="text-xs text-slate-500 font-mono">{origin} →</span>
                <input
                  autoFocus
                  value={newRouteDest}
                  onChange={e => setNewRouteDest(e.target.value.toUpperCase())}
                  placeholder="LHR"
                  maxLength={4}
                  className="w-16 bg-slate-800 border border-blue-500/40 rounded px-2 py-0.5 text-xs text-white font-mono uppercase focus:outline-none"
                />
                <button type="submit" className="text-blue-400 hover:text-blue-300 text-xs">add</button>
                <button type="button" onClick={() => setAddingRoute(false)} className="text-slate-600 hover:text-slate-400 text-xs">cancel</button>
              </form>
            ) : (
              <button
                onClick={() => setAddingRoute(true)}
                className="text-xs px-2 py-1 rounded-lg border border-dashed border-white/10 text-slate-600 hover:text-slate-300 hover:border-white/20 transition-colors flex items-center gap-1">
                <Plus size={10} /> route
              </button>
            )}
          </div>

          {/* Route + cabin + search */}
          <div className="flex gap-3 flex-wrap items-end">
            <div>
              <label className="text-xs text-slate-500 block mb-1">From</label>
              <input value={origin} onChange={e => setOrigin(e.target.value.toUpperCase())} maxLength={4}
                className="w-20 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:border-blue-500 transition-colors duration-150" />
            </div>
            <button onClick={() => { setOrigin(destination); setDestination(origin); }}
              className="mb-0.5 text-slate-500 hover:text-blue-400 transition-colors"
              title="Swap">
              <ArrowLeftRight size={15} />
            </button>
            <div>
              <label className="text-xs text-slate-500 block mb-1">To</label>
              <input value={destination} onChange={e => setDestination(e.target.value.toUpperCase())} maxLength={4}
                className="w-20 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:border-blue-500 transition-colors duration-150" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Cabin</label>
              <div className="flex gap-1">
                {CABINS.map(c => (
                  <button key={c.key} onClick={() => setCabin(c.key)}
                    className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                      cabin === c.key ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => search()} disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              <Search size={14} />
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* Section B: Filters & Analysis */}
        <div className="p-5 space-y-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Filters & Analysis</p>

          {/* Date filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <Calendar size={13} className="text-slate-500 shrink-0" />
            <div>
              <label className="text-xs text-slate-500 block mb-1">Depart after</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors duration-150" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Depart before</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors duration-150" />
            </div>
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="text-xs text-slate-500 hover:text-slate-300 mt-4 transition-colors">
                clear
              </button>
            )}
            <span className="text-xs text-slate-600 mt-4">Filters cached results — no re-search needed</span>
          </div>

          {/* Transferable + program filter + sort + cash price */}
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="transferable" checked={onlyTransferable}
                onChange={e => setOnlyTransferable(e.target.checked)}
                className="rounded accent-blue-500" />
              <label htmlFor="transferable" className="text-xs text-slate-400 cursor-pointer">
                Transferable only (Amex MR / Chase UR)
              </label>
            </div>

            {results !== null && programsPresent.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500">Program:</span>
                {['all', ...programsPresent].map(s => (
                  <button key={s} onClick={() => setProgramFilter(s)}
                    className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                      programFilter === s ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
                    }`}>
                    {s === 'all' ? 'All' : (PROGRAMS[s]?.name || s)}
                  </button>
                ))}
                <span className="text-xs text-slate-600 mx-1">·</span>
                <span className="text-xs text-slate-500">Sort:</span>
                {['price', 'date'].map(s => (
                  <button key={s} onClick={() => setSortBy(s)}
                    className={`text-xs px-2 py-0.5 rounded transition-colors ${sortBy === s ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <DollarSign size={13} className="text-slate-500 shrink-0" />
              <div>
                <label className="text-xs text-slate-500 block mb-0.5">
                  Cash price — {cabinLabel} (for ¢/pt)
                  {(cashBizLoading || cashPELoading) && <span className="ml-1 text-slate-600"><RefreshCw size={10} className="inline animate-spin" /> fetching...</span>}
                  {cabin === 'Y' && cashPrices?.length > 0 && !cashLoading && <span className="ml-1 text-emerald-400/70">· auto from Travelpayouts</span>}
                </label>
                <input type="number" value={cashPrice} onChange={e => setCashPrice(e.target.value)}
                  placeholder="e.g. 2800"
                  className="w-28 bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors duration-150" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
      )}

      {loading && (
        <div className="rounded-xl border border-white/5 bg-white/3 p-8 text-center text-slate-500 text-sm">
          Searching {isRoundTrip ? 'both directions' : 'across all programs'}...
        </div>
      )}

      {/* ── Server-down warning ──────────────────────────────────────────── */}
      {serverDown && !loading && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-start gap-2.5 text-sm">
          <span className="text-amber-400 mt-0.5 shrink-0">&#9888;</span>
          <div>
            <span className="text-amber-300 font-medium">API server not reachable</span>
            <span className="text-amber-400/70"> — cash prices unavailable. Make sure you started with </span>
            <code className="text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded text-xs">npm run dev</code>
            <span className="text-amber-400/70"> which runs both the frontend and the API server.</span>
          </div>
        </div>
      )}

      {/* ── Cash fares card — only render once data resolves ─────────────── */}
      {hasCashData && !loading && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <DollarSign size={13} className="text-slate-400" />
              <span className="text-sm font-semibold text-slate-300">Cash fares — {origin} → {destination}</span>
            </div>
            <a href={`https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Google Flights <ExternalLink size={10} />
            </a>
          </div>

          {/* Business prices */}
          <CabinFareRow
            label="Business"
            prices={cashBizPrices}
            loading={cashBizLoading}
            highlight={cabin === 'J'}
          />

          {/* Premium Economy prices */}
          {cashPELoading && (
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              Premium Eco <RefreshCw size={12} className="animate-spin" />
            </div>
          )}
          {cashPEPrices !== null && !cashPELoading && cashPEPrices.length > 0 && (
            <CabinFareRow label="Premium Eco" prices={cashPEPrices} loading={false} highlight={cabin === 'W'} />
          )}
          {cashPEPrices !== null && !cashPELoading && cashPEPrices.length === 0 && (
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              Premium Eco · no data from Sky Scrapper ·
              <a href={`https://www.google.com/travel/flights?q=premium+economy+flights+from+${origin}+to+${destination}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors">
                search Google Flights <ExternalLink size={10} />
              </a>
            </div>
          )}

          {/* Economy prices */}
          <div>
            <div className="text-xs text-slate-500 mb-2 flex items-center gap-1.5 flex-wrap">
              <span className={cabin === 'Y' ? 'text-slate-300 font-medium' : ''}>Economy</span>
              {cashLoading && <span className="flex items-center gap-1 text-slate-600"><RefreshCw size={12} className="animate-spin" /> fetching...</span>}
              {cashPrices !== null && !cashLoading && <span className="text-slate-600">· Travelpayouts</span>}
            </div>
            {cashPrices?.length > 0 && !cashLoading && (
              <div className="flex items-start gap-1.5 bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2 mb-2">
                <span className="text-amber-400 text-xs shrink-0 mt-0.5">⚠</span>
                <p className="text-xs text-amber-400/80">
                  Travelpayouts prices are often pre-tax estimates or cached — verify on Google Flights before using for ¢/pt.
                </p>
              </div>
            )}
            {cashPrices?.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {cashPrices.map((p, i) => {
                  const gflUrl = `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}${p.date ? '+on+' + p.date : ''}`;
                  return (
                    <a key={i} href={gflUrl} target="_blank" rel="noopener noreferrer"
                      className={`rounded-xl border px-3 py-2 block hover:border-blue-500/40 transition-colors ${i === 0 && cabin === 'Y' ? 'border-emerald-500/40 bg-emerald-500/8' : 'border-white/10 bg-white/3'}`}>
                      <div className="text-base font-semibold font-mono text-white">${p.price}</div>
                      <div className="text-xs text-slate-500">
                        {p.date ? fmtDate(p.date) : '—'}
                        {p.stops === 0 && <span className="ml-1 text-emerald-400">direct</span>}
                        {p.stops > 0 && <span className="ml-1">{p.stops} stop{p.stops > 1 ? 's' : ''}</span>}
                      </div>
                      {p.airlines?.length > 0 && <div className="text-xs text-slate-600">{p.airlines.join(', ')}</div>}
                    </a>
                  );
                })}
              </div>
            )}
            {cashPrices !== null && cashPrices.length === 0 && !cashLoading && (
              <p className="text-xs text-slate-600">No economy data for this route</p>
            )}
          </div>
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {results !== null && !loading && (
        <div className="space-y-6">
          {/* Outbound */}
          <div>
            {isRoundTrip && (
              <div className="flex items-center gap-2 mb-3">
                <div className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Outbound</div>
                <div className="text-xs text-slate-600 font-mono">{origin} → {destination}</div>
              </div>
            )}
            <ResultsSection
              available={available}
              cabin={cabin}
              origin={origin}
              destination={destination}
              cashPrice={cashPrice}
              programFilter={programFilter}
              sortBy={sortBy}
              usableKeys={usableKeys}
              onHubSearch={(from, to) => { setOrigin(from); setDestination(to); search(from, to); }}
            />
          </div>

          {/* Return */}
          {isRoundTrip && retResults !== null && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="text-xs font-semibold text-violet-400 uppercase tracking-wide">Return</div>
                <div className="text-xs text-slate-600 font-mono">{destination} → {origin}</div>
                {retLoading && <RefreshCw size={12} className="text-slate-500 animate-spin" />}
              </div>
              <ResultsSection
                available={retAvailable}
                cabin={cabin}
                origin={destination}
                destination={origin}
                cashPrice={cashPrice}
                programFilter={programFilter}
                sortBy={sortBy}
                usableKeys={usableKeys}
                onHubSearch={(from, to) => { setOrigin(from); setDestination(to); search(from, to); }}
              />
            </div>
          )}

          {/* Round trip summary */}
          {isRoundTrip && available.length > 0 && retAvailable.length > 0 && (() => {
            const bestOut = Math.min(...available.map(r => r[`${cabin}MileageCostRaw`]));
            const bestRet = Math.min(...retAvailable.map(r => r[`${cabin}MileageCostRaw`]));
            const total   = bestOut + bestRet;
            return (
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="text-sm text-slate-300">
                  <span className="font-semibold text-white">Round trip total</span>
                  <span className="text-slate-500 ml-2 text-xs">{origin} ↔ {destination} · {cabinLabel} · best available</span>
                </div>
                <div className="text-2xl font-semibold font-mono text-white">
                  {fmt(total)}
                  <span className="text-sm text-slate-400 ml-1">miles</span>
                </div>
                <div className="text-xs text-slate-500">
                  {fmt(bestOut)} out + {fmt(bestRet)} return
                  {cashPrice > 0 && (() => {
                    const cpp = (parseFloat(cashPrice) * 2 / total * 100).toFixed(1);
                    const style = cppColor(parseFloat(cpp));
                    return <span className={`ml-2 font-semibold ${style.text}`}>{cpp}¢/pt round trip</span>;
                  })()}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
