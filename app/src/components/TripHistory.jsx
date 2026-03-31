import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { computedTrips } from '../utils/calculations';
import { Plus, X, Trash2, Pencil, Check } from 'lucide-react';

export default function TripHistory({
  trips, onAdd, onRemove, onUpdate, onClear, homeAirport, zone = 'US',
  // Combined mode props (Trip History tab showing both zones)
  combined = false, schengenTrips, onAddSchengen, onRemoveSchengen, onUpdateSchengen, onClearSchengen,
}) {
  const [showForm,    setShowForm]    = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [editingIdx,  setEditingIdx]  = useState(null); // index into allTrips
  const [editForm,    setEditForm]    = useState({});
  const defaultZone = combined ? 'US' : zone;
  const [form, setForm] = useState({
    arrival:   '',
    departure: '',
    entryPort: homeAirport || '',
    zone: defaultZone,
  });

  // In combined mode, merge both arrays with source tags for routing removes
  const allTrips = combined
    ? [
        ...trips.map((t, i) => ({ ...t, _zone: 'US', _idx: i })),
        ...(schengenTrips || []).map((t, i) => ({ ...t, _zone: 'Schengen', _idx: i })),
      ]
    : trips.map((t, i) => ({ ...t, _zone: zone, _idx: i }));

  const computed = computedTrips(allTrips);
  const totalTrips = allTrips.length;

  function handleSubmit(e) {
    e.preventDefault();
    if (form.departure && form.departure < form.arrival) return;
    const tripData = { ...form, departure: form.departure || null };
    if (combined && form.zone === 'Schengen') {
      onAddSchengen(tripData);
    } else {
      onAdd(tripData);
    }
    setForm({ arrival: '', departure: '', entryPort: homeAirport || '', zone: defaultZone });
    setShowForm(false);
  }

  function handleRemove(trip) {
    if (combined) {
      if (trip._zone === 'Schengen') onRemoveSchengen(trip._idx);
      else onRemove(trip._idx);
    } else {
      onRemove(trip._idx);
    }
  }

  function startEdit(trip, displayIdx) {
    setEditingIdx(displayIdx);
    setEditForm({
      arrival: trip.arrival,
      departure: trip.departure || '',
      entryPort: trip.entryPort || '',
    });
  }

  function saveEdit(trip) {
    const data = {
      arrival: editForm.arrival,
      departure: editForm.departure || null,
      entryPort: editForm.entryPort,
    };
    if (combined) {
      if (trip._zone === 'Schengen') onUpdateSchengen(trip._idx, data);
      else onUpdate(trip._idx, data);
    } else {
      onUpdate(trip._idx, data);
    }
    setEditingIdx(null);
  }

  function handleClear() {
    if (confirmClear) {
      onClear();
      if (combined && onClearSchengen) onClearSchengen();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  }

  const title = combined ? 'Trip History' : (zone === 'Schengen' ? 'Schengen Trip History' : 'US Trip History');

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <div className="flex items-center gap-2">
          {totalTrips > 0 && onClear && (
            confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">Clear all {totalTrips} trips?</span>
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
                min={form.arrival || undefined}
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
            {combined ? (
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
            ) : (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Zone</label>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-400">
                  {zone === 'Schengen' ? 'Schengen' : 'US'}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg transition-colors">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-4 py-2 rounded-lg transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {totalTrips === 0 ? (
        <div className="text-center py-10 space-y-3">
          <p className="text-sm text-slate-500">No trips recorded yet.</p>
          <p className="text-xs text-slate-600">
            {combined
              ? 'Add your US and Schengen trips to start tracking stay limits.'
              : zone === 'US'
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
                {combined && <th className="text-left pb-2 pr-4">Zone</th>}
                <th className="text-left pb-2 pr-4">Port</th>
                <th className="text-left pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {computed.map((trip, i) => (
                editingIdx === i ? (
                  <tr key={i} className="bg-blue-500/5">
                    <td className="py-2 pr-2">
                      <input
                        type="date"
                        value={editForm.arrival}
                        onChange={e => setEditForm(f => ({ ...f, arrival: e.target.value }))}
                        className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-blue-500 w-full"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="date"
                        value={editForm.departure}
                        min={editForm.arrival || undefined}
                        onChange={e => setEditForm(f => ({ ...f, departure: e.target.value }))}
                        placeholder="Still there"
                        className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-blue-500 w-full"
                      />
                    </td>
                    <td className="py-2 pr-2 text-xs text-slate-500">—</td>
                    {combined && (
                      <td className="py-2 pr-2">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          trip._zone === 'Schengen'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-blue-500/15 text-blue-400'
                        }`}>
                          {trip._zone}
                        </span>
                      </td>
                    )}
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={editForm.entryPort}
                        onChange={e => setEditForm(f => ({ ...f, entryPort: e.target.value.toUpperCase() }))}
                        className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white font-mono uppercase focus:outline-none focus:border-blue-500 w-20"
                      />
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => saveEdit(trip)}
                          className="text-emerald-400 hover:text-emerald-300 transition-colors"
                          title="Save"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingIdx(null)}
                          className="text-slate-500 hover:text-slate-300 transition-colors"
                          title="Cancel"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
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
                    {combined && (
                      <td className="py-2.5 pr-4">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          trip._zone === 'Schengen'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-blue-500/15 text-blue-400'
                        }`}>
                          {trip._zone}
                        </span>
                      </td>
                    )}
                    <td className="py-2.5 pr-4 text-xs text-slate-500 font-mono">
                      {trip.entryPort || homeAirport || '—'}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => startEdit(trip, i)}
                          className="text-slate-600 hover:text-blue-400 transition-colors"
                          title="Edit trip"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleRemove(trip)}
                          className="text-slate-600 hover:text-red-400 transition-colors"
                          title="Delete trip"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
