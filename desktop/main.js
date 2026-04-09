const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// In dev mode, load .env from the app folder for convenience
// In production, API keys come from the UI (localStorage → HTTP headers), not .env
if (!app.isPackaged) {
  require('dotenv').config({ path: path.join(__dirname, '..', 'app', '.env') });
}

const IS_DEV = process.env.ELECTRON_DEV === '1';
// Use a different default port than the web dev server (3001) to avoid conflicts
let API_PORT = parseInt(process.env.PORT || '3456', 10);
const MAX_PORT_RETRIES = 5;
let portRetries = 0;

let mainWindow = null;

// ── User data path (survives app updates) ───────────────────────────────────
// Production: ~/Library/Application Support/Sarif/sarif-data.json (macOS)
// Dev: project root
const DATA_PATH = app.isPackaged
  ? path.join(app.getPath('userData'), 'sarif-data.json')
  : path.join(__dirname, '..', 'sarif-data.json');

// ── Express API server (shared routes from app/server/routes.js) ────────────

function startServer() {
  return new Promise(async (resolve, reject) => {
    const express = require('express');
    const cors = require('cors');

    // Dynamic import for the ESM shared routes module
    const routesPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app-server', 'routes.js')
      : path.join(__dirname, '..', 'app', 'server', 'routes.js');
    const { attachRoutes } = await import(routesPath);

    const server = express();

    server.use(cors({ origin: /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/ }));
    server.use(express.json({ limit: '1mb' }));

    attachRoutes(server, { dataPath: DATA_PATH });

    // ── Serve built frontend in production ──────────────────────────────
    if (!IS_DEV) {
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

  // Open external links in default browser, not Electron — restrict to http(s) only
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
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
