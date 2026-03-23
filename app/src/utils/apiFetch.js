// Wraps fetch for /api/ calls — attaches user API keys from localStorage as headers.
// Server reads these headers first, falls back to .env values.

export default function apiFetch(url, options = {}) {
  const keys = {};
  try {
    const stored = localStorage.getItem('sarif_api_keys');
    if (stored) Object.assign(keys, JSON.parse(stored));
  } catch { /* ignore */ }

  const headers = { ...(options.headers || {}) };
  if (keys.SEATS_API_KEY)       headers['x-seats-key']        = keys.SEATS_API_KEY;
  if (keys.RAPIDAPI_KEY)        headers['x-rapidapi-key']     = keys.RAPIDAPI_KEY;
  if (keys.TRAVELPAYOUTS_TOKEN) headers['x-travelpayouts-key'] = keys.TRAVELPAYOUTS_TOKEN;

  return fetch(url, { ...options, headers });
}
