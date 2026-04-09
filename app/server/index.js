import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, 'data.json');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/ }));
app.use(express.json({ limit: '1mb' }));

// ── User data persistence ────────────────────────────────────────────────────

function readData() {
  if (!existsSync(DATA_PATH)) return null;
  try { return JSON.parse(readFileSync(DATA_PATH, 'utf-8')); }
  catch { return null; }
}

function writeData(data) {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
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
  const data = {
    usTrips, schengenTrips, points,
    userDestinations: userDestinations || [],
    homeAirport: homeAirport || '',
    citizenship: citizenship || 'neither',
    updatedAt: new Date().toISOString(),
  };
  try {
    writeData(data);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: true, message: e.message });
  }
});

// ── Seats.aero proxy ─────────────────────────────────────────────────────────

const searchCache = new Map(); // key → { data, ts }
const CACHE_TTL   = 10 * 60 * 1000; // 10 minutes
const CACHE_MAX   = 200;

app.get('/api/seats/search', async (req, res) => {
  const KEY   = req.headers['x-seats-key'] || process.env.SEATS_API_KEY;
  const query = new URLSearchParams(req.query);
  query.set('take', '300');
  const cacheKey = query.toString();

  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return res.json({ data: cached.data, cached: true });
  }

  try {
    const url  = `https://seats.aero/partnerapi/search?${cacheKey}`;
    const r    = await fetch(url, { headers: { 'Partner-Authorization': KEY } });
    const text = await r.text();
    if (!r.ok) throw new Error(`Seats.aero ${r.status}: ${text.slice(0, 120)}`);
    const data = JSON.parse(text);
    if (data.error) throw new Error(data.message || 'Seats.aero error');
    const result = data.data || [];
    if (searchCache.size >= CACHE_MAX) searchCache.delete(searchCache.keys().next().value);
    searchCache.set(cacheKey, { data: result, ts: Date.now() });
    res.json({ data: result });
  } catch (e) {
    res.status(500).json({ error: true, message: e.message });
  }
});

// Generic proxy for all other Seats.aero endpoints
app.get('/api/seats/*splat', async (req, res) => {
  const path  = req.path.replace('/api/seats', '');
  const query = new URLSearchParams(req.query).toString();
  const url   = `https://seats.aero/partnerapi${path}${query ? '?' + query : ''}`;
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

// ── Travelpayouts cash prices ─────────────────────────────────────────────────
// Note: Travelpayouts data covers economy fares; useful as a cash price baseline

app.get('/api/cash', async (req, res) => {
  const TOKEN = req.headers['x-travelpayouts-key'] || process.env.TRAVELPAYOUTS_TOKEN;
  if (!TOKEN) {
    return res.status(503).json({ error: true, message: 'TRAVELPAYOUTS_TOKEN not set in .env' });
  }

  const { origin, destination } = req.query;
  if (!origin || !destination) {
    return res.status(400).json({ error: true, message: 'origin and destination required' });
  }

  // Search this month and next month to get a good range of prices
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

// ── Sky Scrapper (Skyscanner) — business/premium cash prices ─────────────────
// Free tier: 100 calls/month — sign up at rapidapi.com, subscribe to "sky-scrapper"

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
  console.log(`[entity] ${iata} →`, entity ? `${entity.skyId} / ${entity.entityId} / ${entity.presentation?.title}` : 'NOT FOUND');
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

  // Search across 4 dates for a realistic price range.
  // If user picked a date, search that date + 2 nearby dates (Sky Scrapper often has no data for a single specific future date).
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

    // Dedupe by date+airline+price, sort cheapest first, cap at 6
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

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`Travel agent API running on http://localhost:${PORT}`);
  if (!process.env.TRAVELPAYOUTS_TOKEN) {
    console.log('  ⚠ TRAVELPAYOUTS_TOKEN not set — cash prices disabled');
  }
  if (!process.env.SEATS_API_KEY) {
    console.log('  ⚠ SEATS_API_KEY not set — award search disabled');
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  ✖ Port ${PORT} is already in use — another instance may be running.`);
    console.error(`    Fix: set PORT=<number> in .env (e.g. PORT=3002) and restart.\n`);
    process.exit(1);
  }
  throw err;
});
