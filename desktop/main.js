const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Load .env — from extraResources when packaged, from ../app/.env when running locally
const envPath = app.isPackaged
  ? path.join(process.resourcesPath, '.env')
  : path.join(__dirname, '..', 'app', '.env');
require('dotenv').config({ path: envPath });

const IS_DEV = process.env.ELECTRON_DEV === '1';
// Use a different default port than the web dev server (3001) to avoid conflicts
let API_PORT = parseInt(process.env.PORT || '3456', 10);
const MAX_PORT_RETRIES = 5;
let portRetries = 0;

let mainWindow = null;

// ── Express API server (runs in-process for production, separate for dev) ────

function startServer() {
  return new Promise((resolve, reject) => {
    const express = require('express');
    const cors = require('cors');
    const server = express();

    server.use(cors({ origin: /localhost:\d+/ }));
    server.use(express.json());

    // ── Seats.aero proxy ──────────────────────────────────────────────────
    const searchCache = new Map();
    const CACHE_TTL = 10 * 60 * 1000;
    const CACHE_MAX = 200;

    server.get('/api/seats/search', async (req, res) => {
      const KEY = req.headers['x-seats-key'] || process.env.SEATS_API_KEY;
      const query = new URLSearchParams(req.query);
      query.set('take', '300');
      const cacheKey = query.toString();

      const cached = searchCache.get(cacheKey);
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return res.json({ data: cached.data, cached: true });
      }

      try {
        const url = `https://seats.aero/partnerapi/search?${cacheKey}`;
        const r = await fetch(url, { headers: { 'Partner-Authorization': KEY } });
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

    server.get('/api/seats/*splat', async (req, res) => {
      const splatPath = req.path.replace('/api/seats', '');
      const query = new URLSearchParams(req.query).toString();
      const url = `https://seats.aero/partnerapi${splatPath}${query ? '?' + query : ''}`;
      try {
        const r = await fetch(url, {
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

    // ── Travelpayouts cash prices ─────────────────────────────────────────
    server.get('/api/cash', async (req, res) => {
      const TOKEN = req.headers['x-travelpayouts-key'] || process.env.TRAVELPAYOUTS_TOKEN;
      if (!TOKEN) return res.status(503).json({ error: true, message: 'TRAVELPAYOUTS_TOKEN not set' });

      const { origin, destination } = req.query;
      if (!origin || !destination) return res.status(400).json({ error: true, message: 'origin and destination required' });

      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const months = [
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`,
      ];

      try {
        const results = await Promise.all(months.map(async month => {
          const url = new URL('https://api.travelpayouts.com/aviasales/v3/prices_for_dates');
          url.searchParams.set('origin', origin);
          url.searchParams.set('destination', destination);
          url.searchParams.set('departure_at', month);
          url.searchParams.set('one_way', 'true');
          url.searchParams.set('currency', 'usd');
          url.searchParams.set('sorting', 'price');
          url.searchParams.set('limit', '5');
          url.searchParams.set('token', TOKEN);
          const r = await fetch(url.toString());
          const data = await r.json();
          return data.data || [];
        }));

        const all = results.flat();
        if (!all.length) return res.json({ prices: [] });

        const prices = all.map(f => ({
          price: Math.round(f.price),
          currency: 'USD',
          date: f.departure_at?.slice(0, 10),
          stops: f.number_of_changes || 0,
          airlines: [f.airline].filter(Boolean),
        })).sort((a, b) => a.price - b.price).slice(0, 5);

        return res.json({ prices, note: 'economy fares — use as cash baseline' });
      } catch (e) {
        return res.status(500).json({ error: true, message: e.message });
      }
    });

    // ── Sky Scrapper business/PE prices ───────────────────────────────────
    const airportEntityCache = {};

    async function getAirportEntity(iata, key) {
      if (airportEntityCache[iata]) return airportEntityCache[iata];
      const r = await fetch(`https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchAirport?query=${iata}&locale=en-US`, {
        headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': 'sky-scrapper.p.rapidapi.com' },
      });
      const data = await r.json();
      const entity = data.data?.find(a => a.skyId === iata)
        || data.data?.find(a => a.presentation?.subtitle?.includes('Airport'))
        || data.data?.[0];
      if (entity) airportEntityCache[iata] = entity;
      return entity || null;
    }

    server.get('/api/cashbiz', async (req, res) => {
      const KEY = req.headers['x-rapidapi-key'] || process.env.RAPIDAPI_KEY;
      if (!KEY) return res.status(503).json({ error: true, message: 'RAPIDAPI_KEY not set' });

      const { origin, destination, date, cabin = 'J' } = req.query;
      if (!origin || !destination) return res.status(400).json({ error: true, message: 'origin and destination required' });

      const cabinMap = { J: 'business', W: 'premium_economy', Y: 'economy', F: 'first' };
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
          url.searchParams.set('originSkyId', origEntity.skyId);
          url.searchParams.set('destinationSkyId', destEntity.skyId);
          url.searchParams.set('originEntityId', origEntity.entityId);
          url.searchParams.set('destinationEntityId', destEntity.entityId);
          url.searchParams.set('date', searchDate);
          url.searchParams.set('cabinClass', cabinClass);
          url.searchParams.set('adults', '1');
          url.searchParams.set('currency', 'USD');
          url.searchParams.set('market', 'en-US');
          url.searchParams.set('countryCode', 'US');
          const r = await fetch(url.toString(), {
            headers: { 'X-RapidAPI-Key': KEY, 'X-RapidAPI-Host': 'sky-scrapper.p.rapidapi.com' },
          });
          const data = await r.json();
          return (data.data?.itineraries || []).slice(0, 3).map(it => ({
            price: Math.round(it.price?.raw || 0),
            currency: 'USD',
            date: searchDate,
            stops: it.legs?.[0]?.stopCount || 0,
            airlines: (it.legs?.[0]?.carriers?.marketing || []).map(c => c.name),
            duration: it.legs?.[0]?.durationInMinutes ? Math.round(it.legs[0].durationInMinutes / 60) + 'h' : null,
          })).filter(p => p.price > 0);
        }));

        const seen = new Set();
        const prices = results.flat()
          .filter(p => { const k = `${p.date}-${p.airlines[0]}-${p.price}`; if (seen.has(k)) return false; seen.add(k); return true; })
          .sort((a, b) => a.price - b.price)
          .slice(0, 6);

        return res.json({ prices });
      } catch (e) {
        return res.status(500).json({ error: true, message: e.message });
      }
    });

    // ── Serve built frontend in production ────────────────────────────────
    if (!IS_DEV) {
      // When packaged, dist lives in extraResources; when running unpackaged, it's ../app/dist
      const distPath = app.isPackaged
        ? path.join(process.resourcesPath, 'app-dist')
        : path.join(__dirname, '..', 'app', 'dist');
      server.use(express.static(distPath));
      // SPA fallback — serve index.html for all non-API routes
      server.get('*splat', (req, res) => {
        if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'not found' });
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    const listener = server.listen(API_PORT, '127.0.0.1', () => {
      console.log(`[Sarif] API server on http://127.0.0.1:${API_PORT}`);
      resolve(listener);
    });

    listener.on('error', (err) => {
      if (err.code === 'EADDRINUSE' && portRetries < MAX_PORT_RETRIES) {
        portRetries++;
        API_PORT += 1;
        console.log(`[Sarif] Port ${API_PORT - 1} in use — trying ${API_PORT}`);
        resolve(startServer());
      } else {
        reject(err);
      }
    });
  });
}

// ── Window ───────────────────────────────────────────────────────────────────

function createWindow() {
  const loadURL = IS_DEV
    ? 'http://localhost:5173'           // Vite dev server
    : `http://127.0.0.1:${API_PORT}`;  // Built files served by Express

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'Sarif',
    show: false,                        // don't show until content loads
    backgroundColor: '#0f172a',         // slate-900, matches app bg
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Show window only after page finishes loading
  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.loadURL(loadURL).catch(err => {
    console.error('[Sarif] Failed to load:', err.message);
  });

  // Open external links in default browser, not Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Auto-update ──────────────────────────────────────────────────────────────

function setupAutoUpdate() {
  if (IS_DEV || !app.isPackaged) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    const ver = String(info.version).replace(/[^a-zA-Z0-9.\-]/g, '');
    console.log(`[Sarif] Update available: v${ver}`);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log(`[Sarif] Update downloaded: v${info.version}`);
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update ready',
      message: `Sarif v${info.version} has been downloaded.`,
      detail: 'Restart now to apply the update. Your data is safe.',
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.on('error', (err) => {
    console.log('[Sarif] Update check failed:', err.message);
  });

  autoUpdater.checkForUpdates();
}

// ── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  await startServer();
  createWindow();
  setupAutoUpdate();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

