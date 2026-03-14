import { useState } from 'react';
import { TRANSFER_PARTNERS } from '../data/travelHistory';
import { Edit2, Check, ExternalLink, X, Plus, ArrowRight } from 'lucide-react';

const PALETTE = ['#60a5fa','#34d399','#a78bfa','#f472b6','#fb923c','#facc15','#38bdf8','#4ade80','#f87171','#c084fc'];

const COMMON_PROGRAMS = [
  { name: 'Amex Membership Rewards', type: 'points', alliance: 'Transferable' },
  { name: 'Chase Ultimate Rewards',  type: 'points', alliance: 'Transferable' },
  { name: 'Citi ThankYou Points',    type: 'points', alliance: 'Transferable' },
  { name: 'Capital One Miles',       type: 'points', alliance: 'Transferable' },
  { name: 'Bilt Rewards',            type: 'points', alliance: 'Transferable' },
  { name: 'United MileagePlus',      type: 'miles',  alliance: 'Star Alliance' },
  { name: 'Delta SkyMiles',          type: 'miles',  alliance: 'SkyTeam' },
  { name: 'American AAdvantage',     type: 'miles',  alliance: 'Oneworld' },
  { name: 'British Airways Avios',   type: 'miles',  alliance: 'Oneworld' },
  { name: 'Aeroplan',                type: 'miles',  alliance: 'Star Alliance' },
  { name: 'Flying Blue',             type: 'miles',  alliance: 'SkyTeam' },
  { name: 'Virgin Atlantic',         type: 'miles',  alliance: 'none' },
  { name: 'Emirates Skywards',       type: 'miles',  alliance: 'none' },
  { name: 'Singapore KrisFlyer',     type: 'miles',  alliance: 'Star Alliance' },
  { name: 'Turkish Miles&Smiles',    type: 'miles',  alliance: 'Star Alliance' },
  { name: 'Avianca LifeMiles',       type: 'miles',  alliance: 'Star Alliance' },
  { name: 'Alaska Mileage Plan',     type: 'miles',  alliance: 'Oneworld' },
  { name: 'Iberia Avios',            type: 'miles',  alliance: 'Oneworld' },
  { name: 'Finnair Plus',            type: 'miles',  alliance: 'Oneworld' },
  { name: 'Etihad Guest',            type: 'miles',  alliance: 'none' },
];

const ALLIANCE_COLORS = {
  'Star Alliance': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'SkyTeam':       'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'Oneworld':      'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Transferable':  'text-violet-400 bg-violet-500/10 border-violet-500/20',
  'none':          'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

function AddProgramForm({ existing, onAdd, onCancel }) {
  const usedColors = existing.map(p => p.color);
  const nextColor = PALETTE.find(c => !usedColors.includes(c)) || PALETTE[existing.length % PALETTE.length];
  const [name, setName]       = useState('');
  const [custom, setCustom]   = useState(false);
  const [balance, setBalance] = useState('');
  const [color, setColor]     = useState(nextColor);

  function handleSelect(e) {
    const val = e.target.value;
    if (val === '__custom__') { setCustom(true); setName(''); }
    else { setCustom(false); setName(val); }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const prog = COMMON_PROGRAMS.find(p => p.name === name) || { type: 'points', alliance: 'none' };
    onAdd({ program: name.trim(), balance: parseInt(balance) || 0, type: prog.type, alliance: prog.alliance, color });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Program *</label>
          {custom ? (
            <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Program name" required
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
          ) : (
            <select onChange={handleSelect} defaultValue=""
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
              <option value="" disabled>Select a program…</option>
              {COMMON_PROGRAMS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              <option value="__custom__">Other (type your own)</option>
            </select>
          )}
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Current balance</label>
          <input type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0" min="0"
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1.5">Color</label>
        <div className="flex gap-2 flex-wrap">
          {PALETTE.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg transition-colors">Add program</button>
        <button type="button" onClick={onCancel} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-4 py-2 rounded-lg transition-colors">Cancel</button>
      </div>
    </form>
  );
}

export default function PointsOverview({ points, onUpdate, onAddPoint, onRemovePoint }) {
  const [editing, setEditing]               = useState(null);
  const [editVal, setEditVal]               = useState('');
  const [showAddProgram, setShowAddProgram] = useState(false);

  function startEdit(idx, cur) { setEditing(idx); setEditVal(cur ?? ''); }
  function saveEdit(idx) { onUpdate(idx, parseInt(editVal) || 0); setEditing(null); }

  const total = points.reduce((s, p) => s + (p.balance || 0), 0);

  // Find which of the user's programs are transferable currencies
  const transferable = points.filter(p => TRANSFER_PARTNERS[p.program]);
  const airline = points.filter(p => !TRANSFER_PARTNERS[p.program]);

  return (
    <div className="space-y-5">

      {/* ── Points & Miles ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold text-white">Points & Miles</h3>
          <span className="text-xs text-slate-500">{total.toLocaleString()} total</span>
        </div>
        <div className="space-y-3">
          {points.map((p, i) => (
            <div key={i} className="flex items-center gap-3 group">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-slate-300">{p.program}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${ALLIANCE_COLORS[p.alliance] || ALLIANCE_COLORS['none']}`}>
                    {p.alliance}
                  </span>
                </div>
                <div className="h-1 mt-1 rounded-full bg-white/10">
                  <div className="h-1 rounded-full" style={{ backgroundColor: p.color, width: p.balance ? `${Math.min(100,(p.balance/200000)*100)}%` : '0%', opacity: 0.7 }} />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {editing === i ? (
                  <>
                    <input type="number" value={editVal} onChange={e => setEditVal(e.target.value)} autoFocus
                      onKeyDown={e => e.key === 'Enter' && saveEdit(i)}
                      className="w-24 bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-blue-500" />
                    <button onClick={() => saveEdit(i)} className="text-emerald-400"><Check size={13} /></button>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-mono font-semibold text-white">{p.balance != null ? p.balance.toLocaleString() : '—'}</span>
                    <button onClick={() => startEdit(i, p.balance)} className="text-slate-600 hover:text-slate-400"><Edit2 size={11} /></button>
                  </>
                )}
                {onRemovePoint && (
                  <button onClick={() => onRemovePoint(i)}
                    className="text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ml-1"
                    title="Remove program">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {showAddProgram ? (
          <AddProgramForm
            existing={points}
            onAdd={(prog) => { onAddPoint(prog); setShowAddProgram(false); }}
            onCancel={() => setShowAddProgram(false)}
          />
        ) : (
          <button onClick={() => setShowAddProgram(true)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors border-t border-white/5 pt-3 w-full">
            <Plus size={13} />
            Add program
          </button>
        )}
      </div>

      {/* ── Transfer Partners ──────────────────────────────────────────── */}
      {transferable.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h3 className="text-base font-semibold text-white">Transfer Partners</h3>
          <p className="text-xs text-slate-500">Your transferable currencies and where they can go (1:1 unless noted).</p>

          <div className="space-y-4">
            {transferable.map((p, i) => {
              const partners = TRANSFER_PARTNERS[p.program] || [];
              if (partners.length === 0) return null;
              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-sm font-medium text-slate-200">{p.program}</span>
                    <span className="text-xs font-mono text-slate-500">{p.balance?.toLocaleString() || 0} pts</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap pl-4">
                    {partners.map(partner => (
                      <span key={partner}
                        className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/8 text-slate-400">
                        {partner}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-600 border-t border-white/5 pt-3">
            Edit transfer partner mappings in <code className="text-slate-400">travelHistory.js</code> → <code className="text-slate-400">TRANSFER_PARTNERS</code>
          </p>
        </div>
      )}

      {/* ── Airline Programs ───────────────────────────────────────────── */}
      {airline.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
          <h3 className="text-base font-semibold text-white">Airline Programs</h3>
          <p className="text-xs text-slate-500">Direct earn programs — miles from flying, not transferable from credit cards.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {airline.map((p, i) => (
              <div key={i} className="rounded-xl bg-white/5 border border-white/8 p-3 space-y-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-xs text-slate-300 font-medium truncate">{p.program}</span>
                </div>
                <div className="text-lg font-semibold font-mono text-white">
                  {p.balance != null ? (p.balance >= 1000 ? (p.balance / 1000).toFixed(0) + 'k' : p.balance) : '—'}
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded border inline-block ${ALLIANCE_COLORS[p.alliance] || ALLIANCE_COLORS['none']}`}>
                  {p.alliance}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick tips ─────────────────────────────────────────────────── */}
      {total >= 50000 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-2">
          <h3 className="text-sm font-semibold text-slate-300">Tips</h3>
          <ul className="space-y-1.5 text-xs text-slate-500">
            <li>Transferable points (Amex MR, Chase UR) are most valuable for business class awards — typically 5–10¢/pt vs 1¢/pt for statement credits.</li>
            <li>Always confirm award space on the airline site before transferring points — transfers are usually instant but irreversible.</li>
            <li>Use the <span className="text-slate-300">Award Search</span> tab to find live availability across 30+ programs at once.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
