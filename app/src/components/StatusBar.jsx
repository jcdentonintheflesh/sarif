import { rollingWindowStatus, currentStay, recommendedExitDate, substantialPresenceTest } from '../utils/calculations';
import { format, addDays } from 'date-fns';
import { AlertTriangle, CheckCircle, MapPin } from 'lucide-react';

function WindowBar({ label, sublabel, win, urgent }) {
  const overLimit = win.days >= win.limitDays;
  const nearLimit = win.pct >= 80;
  const statusColor = overLimit ? 'text-red-400' : nearLimit ? 'text-yellow-400' : 'text-emerald-400';
  const barColor = overLimit ? 'bg-red-500' : nearLimit ? 'bg-yellow-500' : 'bg-emerald-500';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <div>
          <span className="text-slate-300 font-medium">{label}</span>
          {sublabel && <span className="text-slate-500 text-xs ml-2">{sublabel}</span>}
        </div>
        <span className={`font-mono font-semibold ${statusColor}`}>
          {win.days} <span className="text-slate-500 font-normal">/ {win.limitDays} days</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(100, win.pct)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{format(win.windowStart, 'MMM d, yyyy')}</span>
        <span className={win.remaining <= 0 ? 'text-red-400' : win.remaining <= 15 ? 'text-yellow-400' : 'text-slate-400'}>
          {win.remaining > 0 ? `${win.remaining} days remaining` : 'AT LIMIT'}
        </span>
        <span>{format(win.windowEnd, 'MMM d, yyyy')}</span>
      </div>
      {win.safeEntry && (
        <div className="text-xs text-amber-400 bg-amber-500/10 rounded-lg px-3 py-1.5 border border-amber-500/20">
          ⚠ At limit. Safe to re-enter after {format(win.safeEntry, 'MMM d, yyyy')}.
        </div>
      )}
    </div>
  );
}

export default function StatusBar({ trips }) {
  const win180 = rollingWindowStatus(trips, 180, 90);
  const win365 = rollingWindowStatus(trips, 365, 183);
  const stay   = currentStay(trips);
  const exit   = recommendedExitDate(trips);
  const spt    = substantialPresenceTest(trips);

  const inUS = !!stay;
  const anyUrgent = inUS && (win180.pct >= 80 || win365.pct >= 80);
  const borderColor = !inUS ? 'border-white/10' : win180.pct >= 90 ? 'border-red-500/30' : win180.pct >= 70 ? 'border-yellow-500/30' : 'border-emerald-500/30';

  return (
    <div className={`rounded-2xl border ${borderColor} bg-white/5 backdrop-blur p-4 space-y-3`}>
      {/* Header + stats row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-slate-400" />
          <span className="text-base font-semibold text-white">US Presence Tracker</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">VWP / ESTA / B1-B2</span>
        </div>
        {anyUrgent ? (
          <div className="flex items-center gap-1.5 text-yellow-400 text-sm">
            <AlertTriangle size={14} />
            <span>Plan exit soon</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
            <CheckCircle size={14} />
            <span>OK</span>
          </div>
        )}
      </div>

      {/* Compact stats strip */}
      <div className="flex items-center gap-4 text-xs">
        {stay ? (
          <span className="text-slate-400">
            Current stay: <span className="text-white font-semibold font-mono">{stay.days}d</span>
            <span className="text-slate-600 ml-1">since {format(new Date(stay.arrival), 'MMM d')}</span>
          </span>
        ) : (
          <span className="text-slate-500">Not in US</span>
        )}
        <span className="text-slate-700">·</span>
        {inUS ? (
          <span className="text-slate-400">
            Exit by: <span className="text-white font-semibold">{exit.daysLeft <= 0 ? 'Now' : format(exit.date, 'MMM d')}</span>
          </span>
        ) : (
          <span className="text-slate-400">
            Safe to enter: <span className="text-emerald-400 font-semibold">{win180.remaining > 0 ? `${win180.remaining}d left` : 'wait'}</span>
          </span>
        )}
        <span className="text-slate-700">·</span>
        <span className="text-slate-400">
          180d left: <span className={`font-semibold font-mono ${win180.remaining <= 0 ? 'text-red-400' : win180.remaining <= 15 ? 'text-yellow-400' : 'text-emerald-400'}`}>
            {win180.remaining <= 0 ? '0' : win180.remaining}d
          </span>
        </span>
      </div>

      {/* 180-day window */}
      <WindowBar
        label="Rolling 180 days"
        sublabel="max 90"
        win={win180}
      />

      {/* 365-day window */}
      <WindowBar
        label="Rolling 365 days"
        sublabel="max 183 (<50%)"
        win={win365}
      />

      {/* Substantial Presence Test — compact */}
      <div className="border-t border-white/5 pt-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-300">Substantial Presence Test</span>
            <span className="text-xs text-slate-500">IRS tax residency</span>
          </div>
          <div className={`text-sm font-mono font-semibold ${spt.triggers ? 'text-red-400' : spt.score >= 150 ? 'text-yellow-400' : 'text-emerald-400'}`}>
            {spt.score} <span className="text-slate-500 font-normal text-xs">/ 183</span>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-white/10">
          <div className={`h-1.5 rounded-full transition-all ${spt.triggers ? 'bg-red-500' : spt.score >= 150 ? 'bg-yellow-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(100, (spt.score / 183) * 100)}%` }} />
        </div>
        <div className="flex gap-3 text-xs text-slate-500">
          <span><span className="text-slate-300 font-mono">{spt.cy}d</span>×1 ({spt.year})</span>
          <span>+</span>
          <span><span className="text-slate-300 font-mono">{spt.py}d</span>×⅓={spt.pyContrib.toFixed(0)} ({spt.year - 1})</span>
          <span>+</span>
          <span><span className="text-slate-300 font-mono">{spt.ppy}d</span>×⅙={spt.ppyContrib.toFixed(0)} ({spt.year - 2})</span>
        </div>
        {spt.triggers && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            ⚠ SPT triggered — consult a tax advisor. File Form 8840 (Closer Connection) immediately.
          </div>
        )}
        {!spt.triggers && spt.score >= 100 && (
          <div className="text-xs text-slate-500">
            File <span className="text-slate-300">Form 8840</span> (Closer Connection Exception) annually as a precaution.
          </div>
        )}
      </div>
    </div>
  );
}
