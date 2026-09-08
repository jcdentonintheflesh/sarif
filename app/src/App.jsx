import { useState, useEffect, useRef, useCallback } from 'react';
import * as exampleData from './data/travelHistory.example';

// Optional user data file — if it doesn't exist, start empty.
// travelHistory.js is gitignored and never required; users manage data through the app UI.
const userDataModules = import.meta.glob('./data/travelHistory.js', { eager: true });
const userData = userDataModules['./data/travelHistory.js'] || null;

const EMPTY_DATA = { US_TRIPS: [], SCHENGEN_TRIPS: [], POINTS: [], DEFAULT_USER_DESTINATIONS: [], DESTINATIONS: {} };
const DEMO_MODE = new URLSearchParams(window.location.search).has('demo');
const { US_TRIPS, SCHENGEN_TRIPS, POINTS, DEFAULT_USER_DESTINATIONS, DESTINATIONS } =
  DEMO_MODE ? exampleData : (userData || EMPTY_DATA);
import StatusBar from './components/StatusBar';
import YearlyChart from './components/YearlyChart';
import TripHistory from './components/TripHistory';
import PointsOverview from './components/PointsOverview';
import SchengenTracker from './components/SchengenTracker';
import ZoneTracker from './components/ZoneTracker';
import AwardSearch from './components/AwardSearch';
import TripPlanner from './components/TripPlanner';
import SetupModal from './components/SetupModal';
import OnboardingBanner from './components/OnboardingBanner';
import { Plane, BarChart2, CreditCard, Globe, Search, ChevronRight, Settings, Shield, Flag, Fingerprint, Globe2, MessageSquare, Star } from 'lucide-react';
import { rollingWindowStatus, substantialPresenceTest } from './utils/calculations';
import CountUp from './components/CountUp';

const GITHUB_REPO = 'https://github.com/jcdentonintheflesh/sarif';

// Terminal status ribbon: shared status coding + readout cell.
function limitStatus(days, limit) {
  const remaining = limit - days;
  if (remaining <= 0) return { cls: 'glow-alert', glyph: '▲', word: 'AT LIMIT' };
  if (remaining <= 15) return { cls: 'glow-warn', glyph: '▲', word: `${remaining}D LEFT` };
  return { cls: 'glow-ok', glyph: '●', word: 'OK' };
}

function RibbonCell({ label, num, suffix, value, status }) {
  return (
    <div className="flex items-baseline gap-2.5 px-4 py-2.5 whitespace-nowrap shrink-0">
      <span className="font-display font-medium text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <span className={`stat text-sm font-semibold ${status.cls}`}>
        {num != null ? <><CountUp value={num} />{suffix}</> : value}
      </span>
      {status.word && <span className={`font-display font-medium text-[10px] uppercase tracking-[0.1em] ${status.cls}`}>{status.glyph} {status.word}</span>}
    </div>
  );
}

const TABS = [
  { id: 'overview',  label: 'Overview',        icon: BarChart2  },
  { id: 'search',    label: 'Award Search',     icon: Search     },
  { id: 'trips',     label: 'Trips',             icon: Plane      },
  { id: 'schengen',  label: 'Schengen',         icon: Globe      },
  { id: 'points',    label: 'Points',            icon: CreditCard },
];

// Which tabs to hide based on citizenship:
// US citizens don't need the US trip tracker (no ESTA/B2 limits)
// EU citizens don't need Schengen tracker (no 90/180 limits)
// Dual citizens need neither tracker
const HIDDEN_TABS = {
  us:      ['trips'],
  eu:      ['schengen'],
  both:    ['trips', 'schengen'],
  neither: [],
};

const CITIZENSHIP_BADGES = {
  us:      { label: 'US',      icon: Flag,        color: 'text-blue-400' },
  eu:      { label: 'EU',      icon: Globe2,      color: 'text-emerald-400' },
  both:    { label: 'Dual',    icon: Shield,      color: 'text-purple-400' },
  neither: { label: 'Visitor', icon: Fingerprint,  color: 'text-slate-400' },
};

function loadState(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

export default function App() {
  const [usTrips,          setUsTrips]          = useState(() => DEMO_MODE ? US_TRIPS          : loadState('usTrips',          US_TRIPS));
  const [schengenTrips,    setSchengenTrips]    = useState(() => DEMO_MODE ? SCHENGEN_TRIPS    : loadState('schengenTrips',    SCHENGEN_TRIPS));
  const [points,           setPoints]           = useState(() => DEMO_MODE ? POINTS            : loadState('points',           POINTS));
  const [userDestinations, setUserDestinations] = useState(() => DEMO_MODE ? DEFAULT_USER_DESTINATIONS : loadState('userDestinations', DEFAULT_USER_DESTINATIONS));
  const [customZones,      setCustomZones]      = useState(() => DEMO_MODE ? [] : loadState('customZones', []));
  const [activeTab,        setActiveTab]        = useState('overview');
  const [homeAirport,      setHomeAirport]      = useState(() => DEMO_MODE ? 'JFK' : (localStorage.getItem('sarif_home') || ''));
  const [citizenship,      setCitizenship]      = useState(() => DEMO_MODE ? 'neither' : (localStorage.getItem('sarif_citizenship') || 'neither'));
  const [setupDone,        setSetupDone]        = useState(() => DEMO_MODE ? false : !!localStorage.getItem('sarif_setup_done'));
  const [showSetup,        setShowSetup]        = useState(false);
  // Existing users who already finished setup shouldn't see the onboarding banner
  const [onboardingDismissed, setOnboardingDismissed] = useState(() =>
    DEMO_MODE || !!localStorage.getItem('sarif_onboarding_dismissed') || !!localStorage.getItem('sarif_setup_done')
  );

  // Citizenship controls both tab visibility and tracking widgets
  const hiddenTabs = HIDDEN_TABS[citizenship] || [];
  const visibleTabs = TABS.filter(t => !hiddenTabs.includes(t.id));
  const showUsTracking = citizenship !== 'us' && citizenship !== 'both';
  const showSchengenTracking = citizenship !== 'eu' && citizenship !== 'both';

  // Terminal status ribbon metrics (same calc utils as the detail cards).
  const usStatus = rollingWindowStatus(usTrips, 180, 90);
  const spt = substantialPresenceTest(usTrips);
  const schStatus = rollingWindowStatus(schengenTrips, 180, 90);
  const totalPts = points.reduce((s, p) => s + (p.balance || 0), 0);
  const fmtPts = totalPts >= 1000 ? (totalPts / 1000).toFixed(0) + 'k' : String(totalPts);
  const sptStatus = spt.triggers
    ? { cls: 'glow-alert', glyph: '▲', word: 'TRIGGERED' }
    : spt.score >= 150
      ? { cls: 'glow-warn', glyph: '▲', word: 'WATCH' }
      : { cls: 'glow-ok', glyph: '●', word: 'OK' };

  // Redirect to overview if the current tab gets hidden after a citizenship change
  useEffect(() => {
    if (hiddenTabs.includes(activeTab)) setActiveTab('overview');
  }, [citizenship]);

  // One-time migration: move misrouted trips to the correct array.
  // Old bug: Trip History tab always added to usTrips regardless of zone dropdown.
  useEffect(() => {
    if (DEMO_MODE || localStorage.getItem('sarif_trips_migrated')) return;
    const misroutedSchengen = usTrips.filter(t => t.zone === 'Schengen');
    const misroutedUs = schengenTrips.filter(t => t.zone === 'US');
    if (misroutedSchengen.length || misroutedUs.length) {
      setUsTrips(prev => [...prev.filter(t => t.zone !== 'Schengen'), ...misroutedUs]);
      setSchengenTrips(prev => [...prev.filter(t => t.zone !== 'US'), ...misroutedSchengen]);
    }
    localStorage.setItem('sarif_trips_migrated', '1');
  }, []);

  // ── Server-side persistence ──────────────────────────────────────────────
  const saveTimer = useRef(null);
  const initialLoad = useRef(true);

  // Load from server on mount (server is source of truth)
  useEffect(() => {
    if (DEMO_MODE) return;
    fetch('/api/data').then(r => r.ok ? r.json() : null).then(data => {
      if (!data) return; // no server data yet — keep file/localStorage seed
      if (Array.isArray(data.usTrips))          setUsTrips(data.usTrips);
      if (Array.isArray(data.schengenTrips))    setSchengenTrips(data.schengenTrips);
      if (Array.isArray(data.points))           setPoints(data.points);
      if (Array.isArray(data.userDestinations)) setUserDestinations(data.userDestinations);
      if (Array.isArray(data.customZones))      setCustomZones(data.customZones);
      if (data.homeAirport) { setHomeAirport(data.homeAirport); localStorage.setItem('sarif_home', data.homeAirport); }
      if (data.citizenship) { setCitizenship(data.citizenship); localStorage.setItem('sarif_citizenship', data.citizenship); }
    }).catch(() => { /* server unreachable — use local seed */ })
      .finally(() => { initialLoad.current = false; });
    // Restore API keys from server (server is source of truth)
    fetch('/api/keys/restore').then(r => r.ok ? r.json() : null).then(data => {
      if (data?.keys) localStorage.setItem('sarif_api_keys', JSON.stringify(data.keys));
    }).catch(() => {});
  }, []);

  // Persist to server + localStorage on every change (debounced)
  const persistToServer = useCallback((us, sch, pts, dests, zones) => {
    if (DEMO_MODE) return;
    // Always update localStorage immediately
    localStorage.setItem('usTrips',          JSON.stringify(us));
    localStorage.setItem('schengenTrips',    JSON.stringify(sch));
    localStorage.setItem('points',           JSON.stringify(pts));
    localStorage.setItem('userDestinations', JSON.stringify(dests));
    localStorage.setItem('customZones',      JSON.stringify(zones));
    // Debounce server writes
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch('/api/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usTrips: us, schengenTrips: sch, points: pts, userDestinations: dests,
          customZones: zones, homeAirport, citizenship,
        }),
      }).catch(() => { /* server down — localStorage still has the data */ });
    }, 500);
  }, [homeAirport, citizenship]);

  useEffect(() => {
    if (initialLoad.current) return; // don't write back the initial seed
    persistToServer(usTrips, schengenTrips, points, userDestinations, customZones);
  }, [usTrips, schengenTrips, points, userDestinations, customZones, persistToServer]);

  function addUsTrip(trip)            { setUsTrips(p => [...p, trip]); }
  function removeUsTrip(i)            { setUsTrips(p => p.filter((_, idx) => idx !== i)); }
  function updateUsTrip(i, data)      { setUsTrips(p => p.map((t, idx) => idx === i ? { ...t, ...data } : t)); }
  function clearUsTrips()             { setUsTrips([]); }
  function addSchengenTrip(trip)      { setSchengenTrips(p => [...p, trip]); }
  function removeSchengenTrip(i)      { setSchengenTrips(p => p.filter((_, idx) => idx !== i)); }
  function updateSchengenTrip(i, data){ setSchengenTrips(p => p.map((t, idx) => idx === i ? { ...t, ...data } : t)); }
  function clearSchengenTrips()       { setSchengenTrips([]); }
  function updatePoints(i, bal)       { setPoints(p => p.map((pt, idx) => idx === i ? { ...pt, balance: bal } : pt)); }
  function addUserDest(dest)          { setUserDestinations(p => [...p, dest]); }
  function removeUserDest(key)        { setUserDestinations(p => p.filter(d => d.key !== key)); }
  function addPoint(program)          { setPoints(p => [...p, program]); }
  function removePoint(i)             { setPoints(p => p.filter((_, idx) => idx !== i)); }

  // Custom zone helpers — each zone: { label, trips: [], windowDays, limitDays }
  function addCustomZone(label, windowDays = 180, limitDays = 90) {
    setCustomZones(p => [...p, { label, trips: [], windowDays, limitDays }]);
  }
  function removeCustomZone(i) { setCustomZones(p => p.filter((_, idx) => idx !== i)); }
  function addCustomZoneTrip(zoneIdx, trip) {
    setCustomZones(p => p.map((z, i) => i === zoneIdx ? { ...z, trips: [...z.trips, trip] } : z));
  }
  function removeCustomZoneTrip(zoneIdx, tripIdx) {
    setCustomZones(p => p.map((z, i) => i === zoneIdx ? { ...z, trips: z.trips.filter((_, ti) => ti !== tripIdx) } : z));
  }
  function updateCustomZoneTrip(zoneIdx, tripIdx, data) {
    setCustomZones(p => p.map((z, i) => i === zoneIdx ? { ...z, trips: z.trips.map((t, ti) => ti === tripIdx ? { ...t, ...data } : t) } : z));
  }

  function exportData() {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      usTrips, schengenTrips, points, userDestinations,
      homeAirport, citizenship,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sarif-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data.version || typeof data !== 'object') {
            resolve('Not a valid Sarif backup file.');
            return;
          }
          if (Array.isArray(data.usTrips))          setUsTrips(data.usTrips);
          if (Array.isArray(data.schengenTrips))    setSchengenTrips(data.schengenTrips);
          if (Array.isArray(data.points))           setPoints(data.points);
          if (Array.isArray(data.userDestinations)) setUserDestinations(data.userDestinations);
          if (data.homeAirport && typeof data.homeAirport === 'string') {
            setHomeAirport(data.homeAirport);
            localStorage.setItem('sarif_home', data.homeAirport);
          }
          if (data.citizenship && typeof data.citizenship === 'string') {
            setCitizenship(data.citizenship);
            localStorage.setItem('sarif_citizenship', data.citizenship);
          }
          if (data.apiKeys && typeof data.apiKeys === 'object') {
            localStorage.setItem('sarif_api_keys', JSON.stringify(data.apiKeys));
          }
          setShowSetup(false);
          resolve(null);
        } catch {
          resolve('Could not read file. Make sure it\'s a Sarif backup JSON.');
        }
      };
      reader.onerror = () => resolve('Failed to read file.');
      reader.readAsText(file);
    });
  }

  function handleSetupComplete({ homeAirport: ap, clearData, citizenship: ct, restoreData }) {
    if (ct) {
      setCitizenship(ct);
      localStorage.setItem('sarif_citizenship', ct);
    }
    if (ap) {
      setHomeAirport(ap);
      localStorage.setItem('sarif_home', ap);
      // Seed the origins list with the home airport if it's not already there
      try {
        const existing = JSON.parse(localStorage.getItem('origins')) || [];
        if (!existing.includes(ap)) {
          localStorage.setItem('origins', JSON.stringify([ap, ...existing]));
          localStorage.setItem('selectedOrigin', ap);
        }
      } catch { /* ignore */ }
    }
    if (clearData) {
      setUsTrips([]);
      setSchengenTrips([]);
    }
    if (restoreData && userData) {
      setUsTrips(userData.US_TRIPS || []);
      setSchengenTrips(userData.SCHENGEN_TRIPS || []);
    }
    localStorage.setItem('sarif_setup_done', '1');
    setSetupDone(true);
    setShowSetup(false);
    // Show onboarding banner after first setup (not after re-opening settings)
    if (!localStorage.getItem('sarif_onboarding_dismissed')) {
      setOnboardingDismissed(false);
    }
    // Persist settings to server
    if (!DEMO_MODE) {
      setTimeout(() => persistToServer(usTrips, schengenTrips, points, userDestinations), 100);
    }
  }

  const isSampleData = usTrips === US_TRIPS ||
    (usTrips.length > 0 && usTrips[0]?.arrival === US_TRIPS[0]?.arrival);

  return (
    <div className="min-h-screen text-slate-200">

      {/* Setup modal — first run or manually opened */}
      {(!setupDone || showSetup) && (
        <SetupModal
          isSampleData={isSampleData}
          hasFileData={!!userData}
          onComplete={handleSetupComplete}
          onExport={exportData}
          onImport={importData}
          onClose={() => setShowSetup(false)}
          isSettings={setupDone}
          currentAirport={homeAirport}
          currentCitizenship={citizenship}
        />
      )}

      {/* Demo mode banner */}
      {DEMO_MODE && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2 text-center">
          <span className="text-xs text-amber-400 font-medium">Demo mode — sample data, changes not saved. </span>
          <a href="/" className="text-xs text-amber-300 hover:text-white underline transition-colors">Exit demo</a>
        </div>
      )}

      {/* Command bar */}
      <div className="border-b border-line px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg width="26" height="28" viewBox="0 0 26 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <polygon points="13,1.5 23.5,7.5 23.5,19.5 13,25.5 2.5,19.5 2.5,7.5"
                stroke="#2f97d8" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
              <polygon points="13,6 19.5,9.5 19.5,17.5 13,21 6.5,17.5 6.5,9.5"
                fill="#2f97d8" fillOpacity="0.1"/>
              <circle cx="13" cy="13.5" r="2.4" fill="#82c8f0"/>
            </svg>
            <div className="flex items-center gap-2.5">
              <span className="font-display text-lg font-semibold tracking-[0.2em] text-white leading-none">SARIF</span>
              <span className="hidden sm:block h-3.5 w-px bg-white/[0.14]"></span>
              <span className="hidden sm:block font-display font-medium text-[10px] uppercase tracking-[0.2em] text-slate-500">Travel Intelligence</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 font-display font-medium text-[10px] uppercase tracking-[0.16em] text-slate-500">
              <span className="live-dot"></span> Live
            </span>
            {homeAirport && (
              <span className="surface-2 font-mono text-[11px] tracking-wide text-slate-300 px-2.5 py-1">
                {homeAirport}
              </span>
            )}
            {(() => {
              const badge = CITIZENSHIP_BADGES[citizenship] || CITIZENSHIP_BADGES.neither;
              const Icon = badge.icon;
              return (
                <span className={`surface-2 flex items-center gap-1.5 text-xs font-medium ${badge.color} px-2.5 py-1`}>
                  <Icon size={11} />
                  {badge.label}
                </span>
              );
            })()}
            <span className="hidden md:block font-mono text-xs text-slate-500 tabular-nums">
              {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <button
              onClick={() => setShowSetup(true)}
              title="Setup & settings"
              className="text-slate-500 hover:text-blue-400 transition-colors ml-1"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Live status ribbon */}
      {(usTrips.length > 0 || schengenTrips.length > 0 || points.length > 0) && (
        <div className="border-b border-line px-6 bg-white/[0.015]">
          <div className="max-w-7xl mx-auto flex items-stretch divide-x divide-white/[0.07] overflow-x-auto no-scrollbar">
            {showUsTracking && <RibbonCell label="US 180d" num={usStatus.days} suffix={`/${usStatus.limitDays}`} status={limitStatus(usStatus.days, usStatus.limitDays)} />}
            {showUsTracking && <RibbonCell label="SPT · IRS" num={spt.score} suffix="/183" status={sptStatus} />}
            {showSchengenTracking && <RibbonCell label="Schengen" num={schStatus.days} suffix={`/${schStatus.limitDays}`} status={limitStatus(schStatus.days, schStatus.limitDays)} />}
            <RibbonCell label="Points" value={fmtPts} status={{ cls: 'text-blue-400', glyph: '', word: '' }} />
          </div>
        </div>
      )}

      {/* Nav */}
      <div className="border-b border-line px-6">
        <div className="max-w-7xl mx-auto flex gap-0.5 overflow-x-auto no-scrollbar">
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px font-display font-medium text-xs uppercase tracking-[0.13em] whitespace-nowrap transition-colors focus:outline-none ${
                  active
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}>
                <Icon size={13} className={active ? 'text-blue-400' : ''} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Onboarding banner */}
        {setupDone && !onboardingDismissed && !DEMO_MODE && (
          <div className="mb-5">
            <OnboardingBanner
              citizenship={citizenship}
              onNavigate={setActiveTab}
              onDismiss={() => {
                setOnboardingDismissed(true);
                localStorage.setItem('sarif_onboarding_dismissed', '1');
              }}
            />
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-5">
            {showUsTracking && <StatusBar trips={usTrips} />}
            {(showUsTracking || showSchengenTracking) && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {showUsTracking && <YearlyChart trips={usTrips} />}
                {showSchengenTracking && <SchengenTracker trips={schengenTrips} onAdd={addSchengenTrip} citizenship={citizenship} />}
              </div>
            )}
            {/* Custom zone trackers */}
            {customZones.length > 0 && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {customZones.map((zone, i) => (
                  <ZoneTracker
                    key={zone.label}
                    label={zone.label}
                    trips={zone.trips}
                    windowDays={zone.windowDays || 180}
                    limitDays={zone.limitDays || 90}
                    onAdd={(trip) => addCustomZoneTrip(i, trip)}
                  />
                ))}
              </div>
            )}
            <TripPlanner usTrips={usTrips} schengenTrips={schengenTrips} citizenship={citizenship} />
            {/* Compact points summary */}
            <div className="surface p-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="section-title">Points &amp; Miles</span>
                <button onClick={() => setActiveTab('points')}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors shrink-0">
                  Full breakdown <ChevronRight size={12} />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {points.map((p, i) => (
                  <div key={i} className="surface-2 px-4 py-3.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="text-[11px] text-slate-500 truncate">{p.program}</span>
                    </div>
                    <div className="stat text-2xl font-semibold text-white leading-none">
                      {p.balance != null ? (p.balance >= 1000 ? (p.balance / 1000).toFixed(0) + 'k' : p.balance) : '—'}
                    </div>
                  </div>
                ))}
              </div>
              <div className="divider pt-3 flex items-center justify-between text-xs">
                <span className="text-slate-500">Total</span>
                <span className="stat text-slate-300">
                  {points.reduce((s, p) => s + (p.balance || 0), 0).toLocaleString()} pts
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <AwardSearch homeAirport={homeAirport} points={points} destinations={{ ...DESTINATIONS, ...Object.fromEntries(userDestinations.map(d => [d.key, d])) }} />
        )}

        {activeTab === 'trips' && (
          <TripHistory
            trips={usTrips}
            schengenTrips={schengenTrips}
            onAdd={addUsTrip}
            onAddSchengen={addSchengenTrip}
            onRemove={removeUsTrip}
            onRemoveSchengen={removeSchengenTrip}
            onUpdate={updateUsTrip}
            onUpdateSchengen={updateSchengenTrip}
            onClear={clearUsTrips}
            onClearSchengen={clearSchengenTrips}
            homeAirport={homeAirport}
            combined
          />
        )}

        {activeTab === 'schengen' && (
          <div className="space-y-5">
            <SchengenTracker trips={schengenTrips} onAdd={addSchengenTrip} citizenship={citizenship} />
            <TripHistory
              trips={schengenTrips}
              onAdd={addSchengenTrip}
              onRemove={removeSchengenTrip}
              onUpdate={updateSchengenTrip}
              onClear={clearSchengenTrips}
              homeAirport={homeAirport}
              zone="Schengen"
            />
          </div>
        )}

        {activeTab === 'points' && (
          <PointsOverview
            points={points}
            onUpdate={updatePoints}
            onAddPoint={addPoint}
            onRemovePoint={removePoint}
          />
        )}

      </div>

      {/* Footer */}
      <div className="border-t border-line px-6 py-5 mt-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 text-xs text-slate-600 flex-wrap">
          <span className="flex items-center gap-1">
            Built by
            <a href="https://x.com/vxdenton" target="_blank" rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-300 transition-colors">
              @vxdenton
            </a>
          </span>
          <span className="text-slate-700">·</span>
          <a href={`${GITHUB_REPO}/discussions`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors">
            <MessageSquare size={11} /> Feedback &amp; Q&amp;A
          </a>
          <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors">
            <Star size={11} /> Star on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
