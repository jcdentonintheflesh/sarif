import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { attachRoutes } from './routes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IS_PROD = process.env.NODE_ENV === 'production';

const app  = express();
const PORT = process.env.PORT || 3001;
const BIND = IS_PROD ? '0.0.0.0' : '127.0.0.1';

// In production (Docker), data lives in a mounted volume at /app/data
const dataDir = IS_PROD ? '/app/data' : __dirname;

app.use(cors({ origin: process.env.CORS_ORIGIN || /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/ }));
app.use(express.json({ limit: '1mb' }));

attachRoutes(app, {
  dataPath: join(dataDir, 'data.json'),
  keysPath: join(dataDir, 'keys.json'),
});

// In production, serve the built frontend
if (IS_PROD) {
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*splat', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'not found' });
    res.sendFile(join(distPath, 'index.html'));
  });
}

const server = app.listen(PORT, BIND, () => {
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
