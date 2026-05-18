import { rollingWindowStatus } from '../utils/calculations';
import { format } from 'date-fns';
import { Globe, Plus, AlertTriangle } from 'lucide-react';

export default function ZoneTracker({ label, trips, onAdd, windowDays = 180, limitDays = 90, color = 'emerald', info }) {
  const win = rollingWindowStatus(trips, windowDays, limitDays);
  const statusColor = win.pct >= 90 ? 'text-red-400' : win.pct >= 70 ? 'text-yellow-400' : `text-${color}-400`;
  const barColor = win.pct >= 90 ? 'bg-red-500' : win.pct >= 70 ? 'bg-yellow-500' : `bg-${color}-500`;
  const isEmpty = trips.length === 0;
  const activeTrip = trips.find(t => !t.departure);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">{label}</h3>
        <span className="text-xs text-slate-500">{limitDays}/{windowDays} day rule</span>
      </div>

      {activeTrip && (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full bg-${color}-400 animate-pulse shrink-0`} />
          <span className={`text-xs text-${color}-300 font-medium`}>Currently in {label}</span>
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
          <div className="text-sm font-medium text-slate-400">No {label} stays recorded</div>
          {onAdd && (
            <button onClick={() => {
              const arrival = prompt('Arrival date (YYYY-MM-DD):');
              const departure = prompt('Departure date (YYYY-MM-DD, blank = still there):');
              if (arrival) onAdd({ arrival, departure: departure || null, zone: label });
            }}
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-1.5 rounded-lg transition-colors">
              <Plus size={12} /> Add your first trip
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">{windowDays}-day window</span>
            <span className={`font-mono font-semibold ${statusColor}`}>
              {win.days} <span className="text-slate-500">/ {limitDays} days</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/10">
            <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(100, win.pct)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>{format(win.windowStart, 'MMM d')}</span>
            <span>{win.remaining > 0 ? `${win.remaining} days left` : 'AT LIMIT'}</span>
            <span>{format(win.windowEnd, 'MMM d')}</span>
          </div>
          {win.safeEntry && (
            <div className="flex items-center gap-2 mt-1 rounded-lg bg-red-500/8 border border-red-500/20 px-3 py-2">
              <AlertTriangle size={12} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-300">
                At limit — earliest safe re-entry: <strong>{format(win.safeEntry, 'MMM d, yyyy')}</strong>
              </p>
            </div>
          )}
        </div>
      )}

      {info && (
        <p className="text-xs text-slate-600">{info}</p>
      )}
    </div>
  );
}
