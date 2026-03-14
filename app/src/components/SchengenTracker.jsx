import { rollingWindowStatus } from '../utils/calculations';
import { format } from 'date-fns';
import { Info, Globe, Plus, AlertTriangle } from 'lucide-react';

export default function SchengenTracker({ trips, onAdd, citizenship = 'neither' }) {
  const win = rollingWindowStatus(trips);
  const statusColor = win.pct >= 90 ? 'text-red-400' : win.pct >= 70 ? 'text-yellow-400' : 'text-emerald-400';
  const barColor = win.pct >= 90 ? 'bg-red-500' : win.pct >= 70 ? 'bg-yellow-500' : 'bg-emerald-500';
  const isEmpty = trips.length === 0;
  const isEuCitizen = citizenship === 'eu' || citizenship === 'both';
  const activeTrip = trips.find(t => !t.departure);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Schengen Zone</h3>
        <span className="text-xs text-slate-500">90/180 day rule</span>
      </div>

      {/* EU citizen override */}
      {isEuCitizen && (
        <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 px-4 py-3">
          <p className="text-xs text-emerald-400 font-medium">EU / Schengen citizen — no 90/180 limit applies to you</p>
          <p className="text-xs text-emerald-300/60 mt-0.5">You can still track your stays for reference below.</p>
        </div>
      )}

      {/* Active stay pill */}
      {activeTrip && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-xs text-emerald-300 font-medium">Currently in Schengen</span>
          <span className="text-xs text-slate-500">
            since {format(new Date(activeTrip.arrival), 'MMM d, yyyy')} · {
              Math.floor((new Date() - new Date(activeTrip.arrival)) / 86400000)
            }d so far
          </span>
        </div>
      )}

      {isEmpty ? (
        <div className="text-center py-8 space-y-3">
          <Globe size={28} className="mx-auto text-slate-600" />
          <div className="text-sm font-medium text-slate-400">No Schengen stays recorded</div>
          <p className="text-xs text-slate-600 max-w-xs mx-auto">
            Add your EU/Schengen stays to track the 90/180-day limit.
          </p>
          {onAdd && (
            <button onClick={() => {
              const arrival = prompt('Arrival date (YYYY-MM-DD):');
              const departure = prompt('Departure date (YYYY-MM-DD, blank = still there):');
              if (arrival) onAdd({ arrival, departure: departure || null, entryPort: 'SCH', zone: 'Schengen' });
            }}
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-1.5 rounded-lg transition-colors">
              <Plus size={12} /> Add your first trip
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">180-day window</span>
            <span className={`font-mono font-semibold ${isEuCitizen ? 'text-slate-500' : statusColor}`}>
              {win.days} <span className="text-slate-500">/ 90 days</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/10">
            <div className={`h-2 rounded-full transition-all ${isEuCitizen ? 'bg-slate-600' : barColor}`} style={{ width: `${Math.min(100, win.pct)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>{format(win.windowStart, 'MMM d')}</span>
            <span>{win.remaining > 0 ? `${win.remaining} days left` : 'AT LIMIT'}</span>
            <span>{format(win.windowEnd, 'MMM d')}</span>
          </div>
          {/* Safe re-entry date */}
          {win.safeEntry && !isEuCitizen && (
            <div className="flex items-center gap-2 mt-1 rounded-lg bg-red-500/8 border border-red-500/20 px-3 py-2">
              <AlertTriangle size={12} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-300">
                At limit — earliest safe re-entry: <strong>{format(win.safeEntry, 'MMM d, yyyy')}</strong>
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-start gap-2 bg-white/3 rounded-lg p-3 space-y-1">
        <Info size={13} className="text-slate-500 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="text-xs text-slate-500">
            Schengen = Austria, Belgium, Croatia, Czechia, Denmark, Estonia, Finland, France, Germany,
            Greece, Hungary, Iceland, Italy, Latvia, Liechtenstein, Lithuania, Luxembourg, Malta,
            Netherlands, Norway, Poland, Portugal, Slovakia, Slovenia, Spain, Sweden, Switzerland.
          </p>
          <p className="text-xs text-slate-600">
            <strong className="text-slate-500">Not Schengen:</strong> UK, Ireland, Romania, Bulgaria, Cyprus, Montenegro, Serbia, Albania, Kosovo, N. Macedonia, Bosnia.
          </p>
          <p className="text-xs text-slate-600 pt-0.5">
            EES (EU Entry/Exit System) launches 2026 — will track this digitally at borders.
          </p>
        </div>
      </div>
    </div>
  );
}
