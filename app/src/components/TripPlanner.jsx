import { useState } from 'react';
import { parseISO, differenceInDays, subDays, format, startOfYear } from 'date-fns';
import { CalendarDays, AlertTriangle, CheckCircle, Plus, X, Info, ArrowRight } from 'lucide-react';
import { daysInWindow } from '../utils/calculations';

function calcStats(usTrips, schTrips, refDate) {
  const ref = refDate;
  return {
    us365:  daysInWindow(usTrips,  subDays(ref, 365),    ref),
    us180:  daysInWindow(usTrips,  subDays(ref, 180),    ref),
    usYear: daysInWindow(usTrips,  startOfYear(ref),     ref),
    sch:    daysInWindow(schTrips, subDays(ref, 180),    ref),
    year:   ref.getFullYear(),
  };
}

function StatusPill({ days, limit, warn }) {
  if (days >= limit)  return <span className="flex items-center gap-1 text-xs text-red-400 font-semibold"><AlertTriangle size={10} /> Over limit</span>;
  if (days >= warn)   return <span className="flex items-center gap-1 text-xs text-amber-400"><AlertTriangle size={10} /> Approaching</span>;
  return <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle size={10} /> OK</span>;
}

function WindowRow({ label, current, projected, limit, warn, showProjected }) {
  const days   = showProjected ? projected : current;
  const added  = projected - current;
  const pctCur = Math.min(100, (current  / limit) * 100);
  const pctAdd = Math.min(100 - pctCur, Math.max(0, (added / limit) * 100));
  const color  = days >= limit ? 'bg-red-500' : days >= warn ? 'bg-amber-500' : 'bg-blue-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-400 truncate">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
          {showProjected && added > 0 && (
            <span className="text-xs text-slate-500 font-mono">
              {current}d <span className="text-amber-400">+{added}</span>
            </span>
          )}
          <span className="text-xs font-mono font-semibold text-white">
            {days}<span className="text-slate-500 font-normal">/{limit}d</span>
          </span>
          <StatusPill days={days} limit={limit} warn={warn} />
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden flex">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pctCur}%` }} />
        {showProjected && added > 0 && (
          <div className={`h-full ${color} opacity-35 transition-all`} style={{ width: `${pctAdd}%` }} />
        )}
      </div>
    </div>
  );
}

let _id = 0;
function newTrip(zone = 'US') { return { id: ++_id, arrival: '', departure: '', zone }; }

export default function TripPlanner({ usTrips, schengenTrips, citizenship }) {
  const today            = new Date();
  const todayStr         = format(today, 'yyyy-MM-dd');
  const activeTrip       = usTrips.find(t => !t.departure);       // currently in US?
  const activeSchTrip    = schengenTrips.find(t => !t.departure); // currently in Schengen?

  const [currentDep,    setCurrentDep]    = useState('');  // planned departure of active US stay
  const [currentSchDep, setCurrentSchDep] = useState('');  // planned departure of active Schengen stay
  const [planned,    setPlanned]    = useState([newTrip('US')]);

  function addTrip()                { setPlanned(p => [...p, newTrip()]); }
  function removeTrip(id)           { setPlanned(p => p.filter(t => t.id !== id)); }
  function update(id, field, val)   { setPlanned(p => p.map(t => t.id === id ? { ...t, [field]: val } : t)); }

  // Build effective trip lists
  const effectiveUs  = usTrips.map(t =>
    (!t.departure && currentDep) ? { ...t, departure: currentDep } : t
  );
  const effectiveSch = schengenTrips.map(t =>
    (!t.departure && currentSchDep) ? { ...t, departure: currentSchDep } : t
  );
  const validPlanned = planned.filter(t => t.arrival && t.departure && t.arrival <= t.departure);
  const allUs  = [...effectiveUs,  ...validPlanned.filter(t => t.zone === 'US')];
  const allSch = [...effectiveSch, ...validPlanned.filter(t => t.zone === 'Schengen')];

  // Reference date: latest departure across all planned trips
  const allDeps = [
    ...(currentDep    ? [currentDep]    : []),
    ...(currentSchDep ? [currentSchDep] : []),
    ...validPlanned.map(t => t.departure),
  ].sort();
  const refDate    = allDeps.length ? parseISO(allDeps[allDeps.length - 1]) : today;
  const hasPlanned = validPlanned.length > 0 || (activeTrip && currentDep) || (activeSchTrip && currentSchDep);

  const current   = calcStats(usTrips, effectiveSch, today);
  const projected = calcStats(allUs, allSch, refDate);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-5">
      <div className="flex items-center gap-2">
        <CalendarDays size={15} className="text-blue-400 shrink-0" />
        <h3 className="text-base font-semibold text-white">Trip Planner</h3>
        <span className="text-xs text-slate-500">plan ahead · see limit impact</span>
      </div>

      {/* Step 1: current departure if in US */}
      {activeTrip && (
        <div className="rounded-xl bg-blue-500/8 border border-blue-500/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-sm text-blue-300 font-medium">
              You're currently in the US
            </span>
            <span className="text-xs text-slate-500">
              since {format(parseISO(activeTrip.arrival), 'MMM d, yyyy')}
              {' '}({differenceInDays(today, parseISO(activeTrip.arrival))}d so far)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400 shrink-0">When are you leaving?</label>
            <input type="date" value={currentDep} min={todayStr}
              onChange={e => setCurrentDep(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" />
            {currentDep && (
              <span className="text-xs text-slate-500">
                {differenceInDays(parseISO(currentDep), today)}d from now
              </span>
            )}
          </div>
        </div>
      )}

      {/* Active Schengen stay */}
      {activeSchTrip && (
        <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-emerald-300 font-medium">
              You're currently in the Schengen zone
            </span>
            <span className="text-xs text-slate-500">
              since {format(parseISO(activeSchTrip.arrival), 'MMM d, yyyy')}
              {' '}({differenceInDays(today, parseISO(activeSchTrip.arrival))}d so far)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400 shrink-0">When are you leaving?</label>
            <input type="date" value={currentSchDep} min={todayStr}
              onChange={e => setCurrentSchDep(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors" />
            {currentSchDep && (
              <span className="text-xs text-slate-500">
                {differenceInDays(parseISO(currentSchDep), today)}d from now
              </span>
            )}
          </div>
        </div>
      )}

      {/* Step 2: planned future trips */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">
            {activeTrip ? 'Future trips' : 'Plan trips'}
          </span>
          <button onClick={addTrip}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg transition-colors">
            <Plus size={11} /> Add trip
          </button>
        </div>

        {planned.map((trip, i) => (
          <div key={trip.id} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 items-end">
            <span className="text-xs text-slate-600 pb-2.5">#{i + 1}</span>
            <div>
              {i === 0 && <label className="text-xs text-slate-500 block mb-1">Arrival</label>}
              <input type="date" value={trip.arrival}
                min={i === 0 && currentDep ? currentDep : (i > 0 && planned[i-1].departure) ? planned[i-1].departure : todayStr}
                onChange={e => update(trip.id, 'arrival', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div>
              {i === 0 && <label className="text-xs text-slate-500 block mb-1">Departure</label>}
              <input type="date" value={trip.departure} min={trip.arrival || todayStr}
                onChange={e => update(trip.id, 'departure', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div>
              {i === 0 && <label className="text-xs text-slate-500 block mb-1">Zone</label>}
              <select value={trip.zone} onChange={e => update(trip.id, 'zone', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors">
                <option value="US">🇺🇸 US</option>
                <option value="Schengen">🇪🇺 Schengen</option>
              </select>
            </div>
            <button onClick={() => removeTrip(trip.id)}
              className="text-slate-600 hover:text-red-400 transition-colors pb-1">
              <X size={13} />
            </button>
          </div>
        ))}

        {/* Trip duration pills */}
        {validPlanned.length > 0 && (
          <div className="flex gap-2 flex-wrap pt-1">
            {validPlanned.map((t, i) => {
              const d = differenceInDays(parseISO(t.departure), parseISO(t.arrival));
              return (
                <span key={t.id} className={`text-xs px-2 py-0.5 rounded-md border font-mono ${
                  t.zone === 'US' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                  #{i+1} {t.zone === 'US' ? '🇺🇸' : '🇪🇺'} {format(parseISO(t.arrival), 'MMM d')}–{format(parseISO(t.departure), 'MMM d')} · {d}d
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="rounded-xl bg-white/3 border border-white/5 p-4 space-y-4">
        {hasPlanned && (
          <div className="flex items-center gap-2 text-xs text-slate-500 pb-1">
            <span>Today</span>
            <ArrowRight size={11} />
            <span className="text-slate-300">After all trips · as of {format(refDate, 'MMM d, yyyy')}</span>
          </div>
        )}

        {/* US */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-slate-400">🇺🇸 United States</span>
          <WindowRow label="Last 365 days"
            current={current.us365} projected={projected.us365}
            limit={180} warn={150} showProjected={hasPlanned} />
          <WindowRow label="Last 180 days"
            current={current.us180} projected={projected.us180}
            limit={90} warn={75} showProjected={hasPlanned} />
          <WindowRow label={`${current.year} calendar year`}
            current={current.usYear} projected={projected.usYear}
            limit={180} warn={150} showProjected={hasPlanned} />
        </div>

        <div className="border-t border-white/5" />

        {/* Schengen */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-slate-400">🇪🇺 Schengen</span>
          <WindowRow label="Rolling 180-day window"
            current={current.sch} projected={projected.sch}
            limit={90} warn={75} showProjected={hasPlanned} />
          {hasPlanned && projected.sch < 90 && (
            <p className="text-xs text-slate-600">
              <span className="text-slate-400">{90 - projected.sch} days</span> remaining after all planned trips
            </p>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2">
        <Info size={11} className="text-slate-600 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-600">
          US has no hard limit but &gt;180d/yr raises immigration flags · 183+d risks tax residency ·
          Bars show current (solid) + planned additions (faded)
        </p>
      </div>
    </div>
  );
}
