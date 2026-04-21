// Shared API routes — used by both the web dev server and Electron app.
// Call attachRoutes(expressApp, { dataPath }) to mount all endpoints.

import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';

const MAX_TRIPS     = 500;
const MAX_POINTS    = 50;
const MAX_DESTS     = 100;
const VALID_CITIZENSHIP = new Set(['us', 'eu', 'both', 'neither']);

function sanitizeString(val, maxLen = 100) {
  if (typeof val !== 'string') return '';
  return val.slice(0, maxLen).replace(/[^\w\s\-.,/()]/g, '');
}

function isValidTrip(t) {
  if (!t || typeof t !== 'object') return false;
  if (typeof t.arrival !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(t.arrival)) return false;
  if (t.departure !== null && t.departure !== undefined) {
    if (typeof t.departure !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(t.departure)) return false;
  }
  return true;
}

function isValidPoint(p) {
  if (!p || typeof p !== 'object') return false;
  if (typeof p.program !== 'string' || p.program.length > 100) return false;
  if (p.balance !== null && p.balance !== undefined && typeof p.balance !== 'number') return false;
  return true;
}

export function attachRoutes(app, { dataPath, keysPath }) {

  // ── User data persistence ──────────────────────────────────────────────────

  function readData() {
    if (!existsSync(dataPath)) return null;
    try { return JSON.parse(readFileSync(dataPath, 'utf-8')); }
    catch { return null; }
  }

  function writeData(data) {
    // Atomic write: write to temp file then rename (prevents corruption on crash)
    const tmp = dataPath + '.tmp';
    writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    renameSync(tmp, dataPath);
  }

  app.get('/api/data', (_req, res) => {
    const data = readData();
    if (!data) return res.status(404).json({ error: true, message: 'No saved data' });
    res.json(data);
  });

  app.put('/api/data', (req, res) => {
    const { usTrips, schengenTrips, points, userDestinations, homeAirport, citizenship } = req.body;
    if (!Array.isArray(usTrips) || !Array.isArray(schengenTrips) || !Array.isArray(points)) {
      return res.status(400).json({ error: true, message: 'Invalid data shape' });
    }
    if (usTrips.length > MAX_TRIPS || schengenTrips.length > MAX_TRIPS) {
      return res.status(400).json({ error: true, message: 'Too many trips' });
    }
    if (points.length > MAX_POINTS) {
      return res.status(400).json({ error: true, message: 'Too many points programs' });
    }
    if (!usTrips.every(isValidTrip) || !schengenTrips.every(isValidTrip)) {
      return res.status(400).json({ error: true, message: 'Invalid trip format' });
    }
    if (!points.every(isValidPoint)) {
      return res.status(400).json({ error: true, message: 'Invalid points format' });
    }
    const destArr = Array.isArray(userDestinations) ? userDestinations.slice(0, MAX_DESTS) : [];
    const data = {
      usTrips, schengenTrips, points,
      userDestinations: destArr,
      homeAirport: sanitizeString(homeAirport, 10),
      citizenship: VALID_CITIZENSHIP.has(citizenship) ? citizenship : 'neither',
      updatedAt: new Date().toISOString(),
    };
    try {
      writeData(data);
      res.json({ ok: true });
    } catch (e) {
      console.error('[PUT /api/data]', e.message);
      res.status(500).json({ error: true, message: 'Failed to save data' });
    }
  });

  // ── API key persistence (separate file — never included in exports/backups) ─
  // Skip when keysPath is null (Electron registers its own encrypted key endpoints)

  if (keysPath) {
    const VALID_KEY_NAMES = new Set(['SEATS_API_KEY', 'RAPIDAPI_KEY', 'TRAVELPAYOUTS_TOKEN']);

    function readKeys() {
      if (!existsSync(keysPath)) return null;
      try { return JSON.parse(readFileSync(keysPath, 'utf-8')); }
      catch { return null; }
    }

    function writeKeys(keys) {
      const tmp = keysPath + '.tmp';
      writeFileSync(tmp, JSON.stringify(keys, null, 2), 'utf-8');
      renameSync(tmp, keysPath);
    }

    app.get('/api/keys', (_req, res) => {
      const keys = readKeys();
      if (!keys) return res.status(404).json({ error: true, message: 'No saved keys' });
      const masked = {};
      for (const [k, v] of Object.entries(keys)) {
        if (VALID_KEY_NAMES.has(k) && typeof v === 'string' && v.length > 0) {
          masked[k] = v.slice(0, 4) + '…' + v.slice(-4);
        }
      }
      res.json({ keys: masked });
    });

    app.get('/api/keys/restore', (_req, res) => {
      const keys = readKeys();
      if (!keys) return res.status(404).json({ error: true, message: 'No saved keys' });
      res.json({ keys });
    });

    app.put('/api/keys', (req, res) => {
      const incoming = req.body.keys;
      if (!incoming || typeof incoming !== 'object') {
        return res.status(400).json({ error: true, message: 'Invalid keys format' });
      }
      const clean = {};
      for (const name of VALID_KEY_NAMES) {
        if (typeof incoming[name] === 'string' && incoming[name].length > 0 && incoming[name].length < 200) {
          clean[name] = incoming[name];
        }
      }
      try {
        writeKeys(clean);
        res.json({ ok: true });
      } catch (e) {
        console.error('[PUT /api/keys]', e.message);
        res.status(500).json({ error: true, message: 'Failed to save keys' });
      }
    });
  }

  // ── Seats.aero proxy ───────────────────────────────────────────────────────

  const searchCache = new Map();
  const CACHE_TTL   = 10 * 60 * 1000;
  const CACHE_MAX   = 200;

  app.get('/api/seats/search', async (req, res) => {
    const KEY   = req.headers['x-seats-key'] || process.env.SEATS_API_KEY;
    const query = new URLSearchParams(req.query);
    query.set('take', '300');
    // Strip malformed date params before they hit Seats.aero
    const isDate = v => /^\d{4}-\d{2}-\d{2}$/.test(v);
    if (query.has('start_date') && !isDate(query.get('start_date'))) query.delete('start_date');
    if (query.has('end_date')   && !isDate(query.get('end_date')))   query.delete('end_date');
    const cacheKey = query.toString();

    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return res.json({ data: cached.data, cached: true });
    }

    try {
      const url  = `https://seats.aero/partnerapi/search?${cacheKey}`;
      const r    = await fetch(url, { headers: { 'Partner-Authorization': KEY } });
      const text = await r.text();
      if (!r.ok) {
        console.error(`[seats/search] ${r.status}: ${text.slice(0, 200)}`);
        return res.status(r.status >= 400 && r.status < 500 ? 400 : 502).json({ error: true, message: 'Award search failed — check your API key and search parameters' });
      }
      const data = JSON.parse(text);
      if (data.error) {
        console.error(`[seats/search] API error: ${data.message}`);
        return res.status(400).json({ error: true, message: 'No award availability found for this route' });
      }
      const result = data.data || [];
      if (searchCache.size >= CACHE_MAX) searchCache.delete(searchCache.keys().next().value);
      searchCache.set(cacheKey, { data: result, ts: Date.now() });
      res.json({ data: result });
    } catch (e) {
      console.error('[seats/search]', e.message);
      res.status(500).json({ error: true, message: 'Award search unavailable' });
    }
  });

  app.get('/api/seats/*splat', async (req, res) => {
    const splatPath = req.path.replace('/api/seats', '').replace(/[^a-zA-Z0-9\-_/]/g, '');
    const query = new URLSearchParams(req.query).toString();
    const url   = `https://seats.aero/partnerapi${splatPath}${query ? '?' + query : ''}`;
    try {
      const r    = await fetch(url, {
        headers: { 'Partner-Authorization': req.headers['x-seats-key'] || process.env.SEATS_API_KEY },
      });
      const text = await r.text();
      if (!r.ok) throw new Error(`Seats.aero ${r.status}: ${text.slice(0, 120)}`);
      const data = JSON.parse(text);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: true, message: e.message });
    }
  });

  // ── Travelpayouts cash prices ──────────────────────────────────────────────

  app.get('/api/cash', async (req, res) => {
    const TOKEN = req.headers['x-travelpayouts-key'] || process.env.TRAVELPAYOUTS_TOKEN;
    if (!TOKEN) {
      return res.status(503).json({ error: true, message: 'TRAVELPAYOUTS_TOKEN not set in .env' });
    }

    const { origin, destination } = req.query;
    if (!origin || !destination) {
      return res.status(400).json({ error: true, message: 'origin and destination required' });
    }

    const now       = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const months    = [
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`,
    ];

    try {
      const results = await Promise.all(months.map(async month => {
        const url = new URL('https://api.travelpayouts.com/aviasales/v3/prices_for_dates');
        url.searchParams.set('origin',       origin);
        url.searchParams.set('destination',  destination);
        url.searchParams.set('departure_at', month);
        url.searchParams.set('one_way',      'true');
        url.searchParams.set('currency',     'usd');
        url.searchParams.set('sorting',      'price');
        url.searchParams.set('limit',        '5');
        url.searchParams.set('token',        TOKEN);

        const r = await fetch(url.toString());
        const data = await r.json();
        return data.data || [];
      }));

      const all = results.flat();
      if (!all.length) return res.json({ prices: [] });

      const prices = all.map(f => ({
        price:    Math.round(f.price),
        currency: 'USD',
        date:     f.departure_at?.slice(0, 10),
        stops:    f.number_of_changes || 0,
        airlines: [f.airline].filter(Boolean),
      })).sort((a, b) => a.price - b.price).slice(0, 5);

      return res.json({ prices, note: 'economy fares — use as cash baseline' });
    } catch (e) {
      console.error('[/api/cash]', e.message, e.stack);
      return res.status(500).json({ error: true, message: e.message });
    }
  });

  // ── Sky Scrapper (Skyscanner) — business/premium cash prices ───────────────

  const airportEntityCache = {};

  async function getAirportEntity(iata, key) {
    if (airportEntityCache[iata]) return airportEntityCache[iata];
    const r    = await fetch(`https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchAirport?query=${iata}&locale=en-US`, {
      headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': 'sky-scrapper.p.rapidapi.com' },
    });
    const data = await r.json();
    const entity = data.data?.find(a => a.skyId === iata)
      || data.data?.find(a => a.presentation?.subtitle?.includes('Airport'))
      || data.data?.[0];
    if (entity) airportEntityCache[iata] = entity;
    return entity || null;
  }

  app.get('/api/cashbiz', async (req, res) => {
    const KEY = req.headers['x-rapidapi-key'] || process.env.RAPIDAPI_KEY;
    if (!KEY) return res.status(503).json({ error: true, message: 'RAPIDAPI_KEY not set — sign up free at rapidapi.com and subscribe to sky-scrapper' });

    const { origin, destination, date, cabin = 'J' } = req.query;
    if (!origin || !destination) return res.status(400).json({ error: true, message: 'origin and destination required' });

    const cabinMap   = { J: 'business', W: 'premium_economy', Y: 'economy', F: 'first' };
    const cabinClass = cabinMap[cabin] || 'business';

    const searchDates = date
      ? [0, 14, 28].map(offset => new Date(new Date(date).getTime() + offset * 86400000).toISOString().slice(0, 10))
      : [21, 45, 75, 105].map(d => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10));

    try {
      const [origEntity, destEntity] = await Promise.all([
        getAirportEntity(origin, KEY),
        getAirportEntity(destination, KEY),
      ]);
      if (!origEntity || !destEntity) return res.json({ prices: [] });

      const results = await Promise.all(searchDates.map(async searchDate => {
        const url = new URL('https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchFlights');
        url.searchParams.set('originSkyId',         origEntity.skyId);
        url.searchParams.set('destinationSkyId',    destEntity.skyId);
        url.searchParams.set('originEntityId',      origEntity.entityId);
        url.searchParams.set('destinationEntityId', destEntity.entityId);
        url.searchParams.set('date',                searchDate);
        url.searchParams.set('cabinClass',          cabinClass);
        url.searchParams.set('adults',              '1');
        url.searchParams.set('currency',            'USD');
        url.searchParams.set('market',              'en-US');
        url.searchParams.set('countryCode',         'US');
        const r    = await fetch(url.toString(), {
          headers: { 'X-RapidAPI-Key': KEY, 'X-RapidAPI-Host': 'sky-scrapper.p.rapidapi.com' },
        });
        const data = await r.json();
        return (data.data?.itineraries || []).slice(0, 3).map(it => ({
          price:    Math.round(it.price?.raw || 0),
          currency: 'USD',
          date:     searchDate,
          stops:    it.legs?.[0]?.stopCount || 0,
          airlines: (it.legs?.[0]?.carriers?.marketing || []).map(c => c.name),
          duration: it.legs?.[0]?.durationInMinutes ? Math.round(it.legs[0].durationInMinutes / 60) + 'h' : null,
        })).filter(p => p.price > 0);
      }));

      const seen  = new Set();
      const prices = results.flat()
        .filter(p => { const k = `${p.date}-${p.airlines[0]}-${p.price}`; if (seen.has(k)) return false; seen.add(k); return true; })
        .sort((a, b) => a.price - b.price)
        .slice(0, 6);

      return res.json({ prices });
    } catch (e) {
      console.error('[/api/cashbiz]', e.message);
      return res.status(500).json({ error: true, message: e.message });
    }
  });
}
