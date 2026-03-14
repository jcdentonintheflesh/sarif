import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { computedTrips } from '../utils/calculations';
import { Plus, X, Trash2 } from 'lucide-react';

export default function TripHistory({ trips, onAdd, onRemove, onClear, homeAirport, zone = 'US' }) {
  const [showForm,    setShowForm]    = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [form, setForm] = useState({
    arrival:   '',
    departure: '',
    entryPort: homeAirport || '',
    zone,
  });

  const computed = computedTrips(trips);

  function handleSubmit(e) {
    e.preventDefault();
    onAdd({ ...form, departure: form.departure || null });
    setForm({ arrival: '', departure: '', entryPort: homeAirport || '', zone });
    setShowForm(false);
  }

  function handleClear() {
    if (confirmClear) {
      onClear();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">
          {zone === 'Schengen' ? 'Schengen Trip History' : 'US Trip History'}
        </h3>
        <div className="flex items-center gap-2">
          {trips.length > 0 && onClear && (
            confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">Clear all {trips.length} trips?</span>
                <button
                  onClick={handleClear}
                  className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                >
                  Yes, clear
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-red-400 transition-colors"
                title="Clear all trips"
              >
                <Trash2 size={12} />
                Clear all
              </button>
            )
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={13} />
            Add Trip
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/5 rounded-xl p-4 space-y-3 border border-white/10">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Arrival date *</label>
              <input
                type="date" required
                value={form.arrival}
                onChange={e => setForm(f => ({ ...f, arrival: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors duration-150"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Departure date (blank = still there)</label>
              <input
                type="date"
                value={form.departure}
                onChange={e => setForm(f => ({ ...f, departure: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors duration-150"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Entry port</label>
              <input
                type="text"
                value={form.entryPort}
                placeholder={homeAirport || 'JFK, MIA, etc.'}
                onChange={e => setForm(f => ({ ...f, entryPort: e.target.value.toUpperCase() }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white font-mono uppercase placeholder:normal-case placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors duration-150"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Zone</label>
              <select
                value={form.zone}
                onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors duration-150"
              >
                <option value="US">US</option>
                <option value="Schengen">Schengen</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg transition-colors">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-4 py-2 rounded-lg transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {trips.length === 0 ? (
        <div className="text-center py-10 space-y-3">
          <p className="text-sm text-slate-500">No trips recorded yet.</p>
          <p className="text-xs text-slate-600">
            {zone === 'US'
              ? <>Add your US entry/exit dates from your <a href="https://i94.cbp.dhs.gov" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">I-94 history</a>.</>
              : 'Add your Schengen stays to track the 90/180-day limit.'
            }
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-white/5">
                <th className="text-left pb-2 pr-4">Arrival</th>
                <th className="text-left pb-2 pr-4">Departure</th>
                <th className="text-left pb-2 pr-4">Duration</th>
                <th className="text-left pb-2 pr-4">Port</th>
                <th className="text-left pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {computed.map((trip, i) => (
                <tr key={i} className={`${trip.isActive ? 'bg-blue-500/10' : ''} hover:bg-white/5 transition-colors`}>
                  <td className="py-2.5 pr-4 font-mono text-slate-300 text-xs">
                    {format(parseISO(trip.arrival), 'MMM d, yyyy')}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-slate-300 text-xs">
                    {trip.isActive ? (
                      <span className="text-blue-400 font-semibold">Here now ●</span>
                    ) : (
                      format(parseISO(trip.departure), 'MMM d, yyyy')
                    )}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className={`text-xs font-semibold ${trip.durationDays > 60 ? 'text-red-400' : trip.durationDays > 45 ? 'text-yellow-400' : 'text-slate-300'}`}>
                      {trip.durationDays}d
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-slate-500 font-mono">
                    {trip.entryPort || homeAirport || '—'}
                  </td>
                  <td className="py-2.5">
                    <button
                      onClick={() => onRemove(trips.length - 1 - i)}
                      className="text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
