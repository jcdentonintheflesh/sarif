import { useState } from 'react';
import { Plane, X, Flag, Globe2, Shield, Fingerprint, Download, Upload, Key, ExternalLink } from 'lucide-react';

const API_KEY_FIELDS = [
  { key: 'SEATS_API_KEY',       label: 'Seats.aero',     placeholder: 'Partner API key', link: 'https://seats.aero', note: 'Award search ($9.99/mo)' },
  { key: 'RAPIDAPI_KEY',        label: 'RapidAPI',        placeholder: 'API key',         link: 'https://rapidapi.com/apiheya/api/sky-scrapper', note: 'Business/PE cash prices (free tier)' },
  { key: 'TRAVELPAYOUTS_TOKEN', label: 'Travelpayouts',   placeholder: 'API token',       link: 'https://www.travelpayouts.com/developers/api', note: 'Economy cash prices (free)' },
];

function loadApiKeys() {
  try {
    return JSON.parse(localStorage.getItem('sarif_api_keys') || '{}');
  } catch { return {}; }
}

export default function SetupModal({
  onComplete, isSampleData, hasFileData, onExport, onImport, onClose,
  isSettings, currentAirport, currentCitizenship,
}) {
  const [airport, setAirport]         = useState(isSettings ? (currentAirport || '') : '');
  const [clearData, setClearData]     = useState(true);
  const [citizenship, setCitizenship] = useState(isSettings ? (currentCitizenship || 'neither') : 'neither');
  const [error, setError]             = useState('');
  const [apiKeys, setApiKeys]         = useState(loadApiKeys);
  const [importError, setImportError] = useState('');

  function validate(val) {
    return /^[A-Za-z]{3,4}$/.test(val.trim());
  }

  function handleSubmit(e) {
    e.preventDefault();
    const code = airport.trim().toUpperCase();
    if (code && !validate(code)) {
      setError('Enter a 3-letter IATA code (e.g. JFK, LHR, DXB)');
      return;
    }
    // Save API keys along with the rest
    localStorage.setItem('sarif_api_keys', JSON.stringify(apiKeys));
    if (isSettings) {
      onComplete({ homeAirport: code || null, clearData: false, citizenship });
    } else {
      if (!code) {
        setError('Enter a 3-letter IATA code (e.g. JFK, LHR, DXB)');
        return;
      }
      onComplete({ homeAirport: code, clearData, citizenship });
    }
  }

  function handleSkip() {
    onComplete({ homeAirport: null, clearData: false, citizenship });
  }

  async function handleImport(file) {
    setImportError('');
    const err = await onImport(file);
    if (err) setImportError(err);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1117] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="border-b border-white/8 px-6 py-5 flex items-center gap-3 shrink-0">
          <svg width="22" height="22" viewBox="0 0 26 26" fill="none">
            <polygon points="13,1.5 23.5,7.5 23.5,19.5 13,25.5 2.5,19.5 2.5,7.5"
              stroke="#3b82f6" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
            <polygon points="13,6 19.5,9.5 19.5,17.5 13,21 6.5,17.5 6.5,9.5"
              fill="#3b82f6" fillOpacity="0.1"/>
            <circle cx="13" cy="13.5" r="2.5" fill="#3b82f6"/>
          </svg>
          <span style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', letterSpacing: '0.25em', fontWeight: 600, fontSize: '15px', color: 'white' }}>
            <span style={{ color: '#60a5fa', fontWeight: 800, fontSize: '17px', letterSpacing: '0.25em' }}>S</span>ARIF
          </span>
          {isSettings && (
            <button
              onClick={onClose}
              className="ml-auto text-slate-500 hover:text-slate-300 transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6 overflow-y-auto">

          {/* Sample data notice */}
          {isSampleData && !isSettings && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-amber-400">You're viewing sample data</p>
              <p className="text-xs text-amber-300/70">
                The trip history, points balances, and routes shown are examples.
                Set up your home airport to personalise Sarif for your travel patterns.
              </p>
            </div>
          )}

          {/* Home airport */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200 block">
              Home airport
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Plane size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={airport}
                  onChange={e => { setAirport(e.target.value.toUpperCase()); setError(''); }}
                  placeholder="e.g. JFK, LHR, DXB"
                  maxLength={4}
                  autoFocus={!isSettings}
                  className="w-full bg-slate-800/60 border border-slate-600 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white font-mono uppercase placeholder:normal-case placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <p className="text-xs text-slate-500">
              3-letter IATA code for the airport you usually fly from.
            </p>
          </div>

          {/* Citizenship */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200 block">Citizenship</label>
            <p className="text-xs text-slate-500">Helps tailor which limits apply to you.</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 'us',      icon: Flag,        color: 'text-blue-400',    label: 'US citizen',      sub: '' },
                { val: 'eu',      icon: Globe2,      color: 'text-emerald-400', label: 'EU / Schengen',   sub: '' },
                { val: 'both',    icon: Shield,      color: 'text-purple-400',  label: 'Both',            sub: 'No entry limits' },
                { val: 'neither', icon: Fingerprint,  color: 'text-slate-400',   label: 'Neither',         sub: 'All limits apply' },
              ].map(({ val, icon: Icon, color, label, sub }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCitizenship(val)}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    citizenship === val
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 bg-white/3 hover:border-slate-500'
                  }`}
                >
                  <Icon size={14} className={`shrink-0 ${citizenship === val ? 'text-blue-400' : color}`} />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-slate-200">{label}</span>
                    {sub && <span className="text-xs text-slate-500">{sub}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Trip history option — first-time setup only */}
          {isSampleData && !isSettings && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200 block">Trip history</label>
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="radio"
                      name="clearData"
                      checked={clearData}
                      onChange={() => setClearData(true)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${clearData ? 'border-blue-500 bg-blue-500' : 'border-slate-600 bg-transparent group-hover:border-slate-400'}`}>
                      {clearData && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-200">Start fresh</p>
                    <p className="text-xs text-slate-500">Clear sample trips — enter your own US and Schengen history</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="radio"
                      name="clearData"
                      checked={!clearData}
                      onChange={() => setClearData(false)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${!clearData ? 'border-blue-500 bg-blue-500' : 'border-slate-600 bg-transparent group-hover:border-slate-400'}`}>
                      {!clearData && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-200">Keep sample data</p>
                    <p className="text-xs text-slate-500">Explore the app first, clear later from the settings icon</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Restore from file — first-time setup only */}
          {hasFileData && !isSettings && (
            <button
              type="button"
              onClick={() => onComplete({ homeAirport: null, clearData: false, citizenship, restoreData: true })}
              className="w-full rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-left transition-colors hover:bg-emerald-500/15"
            >
              <span className="text-xs font-semibold text-emerald-400">Restore trip data from file</span>
              <p className="text-xs text-emerald-300/60 mt-0.5">Re-import trips from your travelHistory.js data file</p>
            </button>
          )}

          {/* API Keys — always visible */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Key size={13} className="text-slate-400" />
              <label className="text-sm font-medium text-slate-200">API keys</label>
              <span className="text-xs text-slate-600">optional</span>
            </div>
            <p className="text-xs text-slate-500">Enables award search and live cash prices. Stored locally on your device.</p>
            <div className="space-y-2">
              {API_KEY_FIELDS.map(({ key, label, placeholder, link, note }) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{label}</span>
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-blue-400 transition-colors">
                      <ExternalLink size={10} />
                    </a>
                    <span className="text-xs text-slate-600">{note}</span>
                  </div>
                  <input
                    type="password"
                    value={apiKeys[key] || ''}
                    placeholder={placeholder}
                    onChange={e => setApiKeys(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Export / Import — settings only */}
          {isSettings && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200 block">Your data</label>
              <p className="text-xs text-slate-500">Export a backup to keep your data safe, or import from another device.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onExport}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-white/3 hover:border-slate-500 px-3 py-2.5 transition-colors"
                >
                  <Download size={13} className="text-blue-400" />
                  <span className="text-xs font-medium text-slate-200">Export backup</span>
                </button>
                <label className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-white/3 hover:border-slate-500 px-3 py-2.5 transition-colors cursor-pointer">
                  <Upload size={13} className="text-emerald-400" />
                  <span className="text-xs font-medium text-slate-200">Import backup</span>
                  <input
                    type="file"
                    accept=".json"
                    className="sr-only"
                    onChange={e => { if (e.target.files[0]) handleImport(e.target.files[0]); }}
                  />
                </label>
              </div>
              {importError && <p className="text-xs text-red-400">{importError}</p>}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              {isSettings ? 'Save' : 'Get started'}
            </button>
            {!isSettings && (
              <button
                type="button"
                onClick={handleSkip}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors px-2"
              >
                Skip for now
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
