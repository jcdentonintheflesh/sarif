# Sarif

Personal travel intelligence dashboard. Track US presence limits, Schengen days, points & miles, and award availability — all local, all yours.

![Sarif dashboard](screenshots/sarif-overview.png)

## What it does

- **US Presence Tracker** — Rolling 180-day and 365-day counters, IRS Substantial Presence Test (3-year weighted formula), recommended exit dates
- **Schengen Tracker** — 90/180-day rolling window with visual warnings
- **Trip Planner** — Simulate future trips against both US and Schengen limits before you book
- **Award Search** — Live award availability via [seats.aero](https://seats.aero) across 30+ loyalty programs
- **Points & Miles** — Track balances, transfer partners, and pre-built redemption sweet spots
- **Cash Prices** — Business/PE price lookups via Sky Scrapper + economy baseline via Travelpayouts

All data stays on your machine. No accounts, no cloud, no sync.

## Quickstart

```bash
git clone https://github.com/jcdentonintheflesh/sarif.git
cd sarif/app
npm install
cp src/data/travelHistory.example.js src/data/travelHistory.js
cp .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Add `?demo` to the URL to explore with sample data.

## API keys (optional)

The app works without any API keys — award search and live prices just won't be active.

| Key | What it powers | Where to get it | Cost |
|-----|---------------|-----------------|------|
| `SEATS_API_KEY` | Award search | [seats.aero](https://seats.aero) | ~$20/mo |
| `RAPIDAPI_KEY` | Business/PE cash prices | [rapidapi.com](https://rapidapi.com) → "sky-scrapper" | Free (100 calls/mo) |
| `TRAVELPAYOUTS_TOKEN` | Economy cash baseline | [travelpayouts.com](https://www.travelpayouts.com/developers/api) | Free |

Add keys to `.env`, then start the backend:

```bash
npm run dev:all    # frontend + backend
```

## Your data

Edit `src/data/travelHistory.js` with your own:
- US entry/exit dates (get yours from [i94.cbp.dhs.gov](https://i94.cbp.dhs.gov))
- Schengen stays
- Points balances and programs
- Routes, pricing tiers, and redemption strategies

This file is gitignored — it never gets committed.

See `travelHistory.example.js` for the full schema with comments.

## Stack

React 19 · Vite · Tailwind CSS · Recharts · Express (API proxy) · localStorage

## License

[MIT](LICENSE)

---

Built by [@vxdenton](https://x.com/vxdenton)
