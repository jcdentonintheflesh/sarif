import { X } from 'lucide-react';

const ALL_ITEMS = [
  { id: 'trips',    tab: 'trips',    label: 'Add trips',             hideFor: ['us', 'both'] },
  { id: 'schengen', tab: 'schengen', label: 'Schengen stays',        hideFor: ['eu', 'both'] },
  { id: 'points',   tab: 'points',   label: 'Set up points',         hideFor: [] },
  { id: 'search',   tab: 'search',   label: 'Search award flights',  hideFor: [] },
];

export default function OnboardingBanner({ onNavigate, onDismiss, citizenship = 'neither' }) {
  const items = ALL_ITEMS.filter(item => !item.hideFor.includes(citizenship));

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 px-5 py-4 flex items-center gap-3 flex-wrap">
      <span className="text-sm font-medium text-slate-200 mr-1">Get started:</span>
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.tab)}
          className="text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg px-3 py-1.5 transition-colors"
        >
          {item.label}
        </button>
      ))}
      <button
        onClick={onDismiss}
        className="ml-auto text-slate-500 hover:text-slate-300 transition-colors"
        title="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
