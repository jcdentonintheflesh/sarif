import { useState, useEffect } from 'react';
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
import AwardSearch from './components/AwardSearch';
import TripPlanner from './components/TripPlanner';
import SetupModal from './components/SetupModal';
import OnboardingBanner from './components/OnboardingBanner';
import { Plane, BarChart2, CreditCard, Globe, Search, ChevronRight, Settings } from 'lucide-react';

const TABS = [
  { id: 'overview',  label: 'Overview',        icon: BarChart2  },
  { id: 'search',    label: 'Award Search',     icon: Search     },
  { id: 'trips',     label: 'Trips',             icon: Plane      },
  { id: 'schengen',  label: 'Schengen',         icon: Globe      },
  { id: 'points',    label: 'Points',            icon: CreditCard },
];

// Tabs to hide per citizenship value
const HIDDEN_TABS = {
  us:      ['trips'],                // US citizens have no US stay limits
  eu:      ['schengen'],             // EU citizens have no Schengen limits
  both:    ['trips', 'schengen'],    // Citizen of both — no limits at all
  neither: [],                       // All limits apply
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
  const [activeTab,        setActiveTab]        = useState('overview');
  const [homeAirport,      setHomeAirport]      = useState(() => DEMO_MODE ? 'JFK' : (localStorage.getItem('sarif_home') || ''));
  const [citizenship,      setCitizenship]      = useState(() => DEMO_MODE ? 'neither' : (localStorage.getItem('sarif_citizenship') || 'neither'));
  const [setupDone,        setSetupDone]        = useState(() => DEMO_MODE ? false : !!localStorage.getItem('sarif_setup_done'));
  const [showSetup,        setShowSetup]        = useState(false);
  // Existing users who already finished setup shouldn't see the onboarding banner
  const [onboardingDismissed, setOnboardingDismissed] = useState(() =>
    DEMO_MODE || !!localStorage.getItem('sarif_onboarding_dismissed') || !!localStorage.getItem('sarif_setup_done')
  );

  const hiddenTabIds = HIDDEN_TABS[citizenship] || [];
  const visibleTabs = TABS.filter(t => !hiddenTabIds.includes(t.id));
  const showUsTracking = !hiddenTabIds.includes('trips');
  const showSchengen   = !hiddenTabIds.includes('schengen');

  // Redirect to overview if current tab is hidden after citizenship change
  useEffect(() => {
    if (hiddenTabIds.includes(activeTab)) setActiveTab('overview');
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

  useEffect(() => { if (!DEMO_MODE) localStorage.setItem('usTrips',          JSON.stringify(usTrips));          }, [usTrips]);
  useEffect(() => { if (!DEMO_MODE) localStorage.setItem('schengenTrips',    JSON.stringify(schengenTrips));    }, [schengenTrips]);
  useEffect(() => { if (!DEMO_MODE) localStorage.setItem('points',           JSON.stringify(points));           }, [points]);
  useEffect(() => { if (!DEMO_MODE) localStorage.setItem('userDestinations', JSON.stringify(userDestinations)); }, [userDestinations]);

  function addUsTrip(trip)            { setUsTrips(p => [...p, trip]); }
  function removeUsTrip(i)            { setUsTrips(p => p.filter((_, idx) => idx !== i)); }
  function clearUsTrips()             { setUsTrips([]); }
  function addSchengenTrip(trip)      { setSchengenTrips(p => [...p, trip]); }
  function removeSchengenTrip(i)      { setSchengenTrips(p => p.filter((_, idx) => idx !== i)); }
  function clearSchengenTrips()       { setSchengenTrips([]); }
  function updatePoints(i, bal)       { setPoints(p => p.map((pt, idx) => idx === i ? { ...pt, balance: bal } : pt)); }
  function addUserDest(dest)          { setUserDestinations(p => [...p, dest]); }
  function removeUserDest(key)        { setUserDestinations(p => p.filter(d => d.key !== key)); }
  function addPoint(program)          { setPoints(p => [...p, program]); }
  function removePoint(i)             { setPoints(p => p.filter((_, idx) => idx !== i)); }

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
  }

  const isSampleData = usTrips === US_TRIPS ||
    (usTrips.length > 0 && usTrips[0]?.arrival === US_TRIPS[0]?.arrival);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">

      {/* Setup modal — first run or manually opened */}
      {(!setupDone || showSetup) && (
        <SetupModal
          isSampleData={isSampleData}
          hasFileData={!!userData}
          onComplete={handleSetupComplete}
        />
      )}

      {/* Demo mode banner */}
      {DEMO_MODE && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2 text-center">
          <span className="text-xs text-amber-400 font-medium">Demo mode — sample data, changes not saved. </span>
          <a href="/" className="text-xs text-amber-300 hover:text-white underline transition-colors">Exit demo</a>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="130" height="28" viewBox="0 0 130 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Hex mark */}
              <polygon points="13,1.5 23.5,7.5 23.5,19.5 13,25.5 2.5,19.5 2.5,7.5"
                stroke="#3b82f6" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
              <polygon points="13,6 19.5,9.5 19.5,17.5 13,21 6.5,17.5 6.5,9.5"
                fill="#3b82f6" fillOpacity="0.1"/>
              <line x1="2.5" y1="7.5" x2="23.5" y2="19.5" stroke="#3b82f6" strokeWidth="0.75" opacity="0.35"/>
              <line x1="23.5" y1="7.5" x2="2.5" y2="19.5" stroke="#3b82f6" strokeWidth="0.75" opacity="0.35"/>
              <circle cx="13" cy="13.5" r="2.5" fill="#3b82f6"/>
              {/* Vertical rule */}
              <line x1="34" y1="5" x2="34" y2="23" stroke="white" strokeWidth="0.75" opacity="0.1"/>
              {/* Wordmark */}
              <text x="42" y="19"
                fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
                fontSize="14" fontWeight="600" letterSpacing="4" fill="white">
                <tspan fill="#60a5fa" fontWeight="800" fontSize="17" dy="1">S</tspan><tspan dy="-1">ARIF</tspan>
              </text>
            </svg>
            <span className="text-xs text-slate-600 font-medium tracking-widest uppercase hidden sm:block">Travel Intelligence</span>
          </div>
          <div className="flex items-center gap-3">
            {homeAirport && (
              <span className="text-xs font-mono text-slate-500 bg-white/5 border border-white/8 px-2.5 py-1 rounded-lg">
                {homeAirport}
              </span>
            )}
            <span className="text-xs text-slate-600">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <button
              onClick={() => setShowSetup(true)}
              title="Setup & settings"
              className="text-slate-600 hover:text-slate-300 transition-colors"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/5 px-6">
        <div className="max-w-7xl mx-auto flex gap-1">
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-white bg-white/5 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}>
                <Icon size={14} />
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {showUsTracking && <YearlyChart trips={usTrips} />}
              {showSchengen && <SchengenTracker trips={schengenTrips} onAdd={addSchengenTrip} citizenship={citizenship} />}
            </div>
            <TripPlanner usTrips={usTrips} schengenTrips={schengenTrips} citizenship={citizenship} />
            {/* Compact points summary */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Points & Miles</h3>
                <button onClick={() => setActiveTab('points')}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Full breakdown <ChevronRight size={12} />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {points.map((p, i) => (
                  <div key={i} className="rounded-xl bg-white/5 border border-white/8 p-3 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="text-xs text-slate-400 truncate">{p.program}</span>
                    </div>
                    <div className="text-lg font-semibold font-mono text-white">
                      {p.balance != null ? (p.balance >= 1000 ? (p.balance / 1000).toFixed(0) + 'k' : p.balance) : '—'}
                    </div>
                    <div className="h-1 rounded-full bg-white/10">
                      <div className="h-1 rounded-full" style={{ backgroundColor: p.color, width: p.balance ? `${Math.min(100, (p.balance / 200000) * 100)}%` : '0%', opacity: 0.7 }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-600 border-t border-white/5 pt-3">
                {points.reduce((s, p) => s + (p.balance || 0), 0).toLocaleString()} total points
              </p>
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
      <div className="border-t border-white/5 px-6 py-4 mt-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs text-slate-600">
          <span>Built by</span>
          <a href="https://x.com/vxdenton" target="_blank" rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-300 transition-colors">
            @vxdenton
          </a>
        </div>
      </div>
    </div>
  );
}
