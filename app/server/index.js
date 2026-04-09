import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { attachRoutes } from './routes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/ }));
app.use(express.json({ limit: '1mb' }));

attachRoutes(app, { dataPath: join(__dirname, 'data.json') });

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
