<p align="center">
  <img src="app/public/sarif.svg" width="48" alt="Sarif" />
</p>

<h1 align="center">Sarif</h1>

<p align="center">
  Travel intelligence dashboard for frequent flyers and digital nomads.
  <br>Award search, points tracking, US and Schengen stay counters. Runs locally.
</p>

<p align="center">
  <a href="https://github.com/jcdentonintheflesh/sarif/releases/latest"><strong>Download the desktop app</strong></a>
  &nbsp;·&nbsp;
  <a href="#run-from-source">Run from source</a>
</p>

---

## Desktop app (recommended)

The easiest way to use Sarif. One file, no terminal, no setup.

1. Go to [**Releases**](https://github.com/jcdentonintheflesh/sarif/releases/latest)
2. Download **Sarif-x.x.x-arm64.dmg** (macOS Apple Silicon) <!-- Windows .exe coming soon -->
3. Open the .dmg, drag Sarif to Applications, launch it

That's it. The app runs entirely on your machine — no account, no cloud, no tracking.

> **Note:** macOS may show a security warning since the app isn't notarized. Right-click the app → Open → Open to bypass it. This is normal for open-source apps distributed outside the App Store.

## Your data

All your trips, points, and settings are stored **locally** on your device (in your browser's localStorage for the web version, or the app's own storage for the desktop version).

**Your data survives:** app restarts, computer reboots, updates.

**Your data does NOT sync** between the desktop app and the browser version — they use separate storage.

**Back up your data:** Open Settings (gear icon) → **Export backup** to download a JSON file with everything. Use **Import backup** to restore it on any device or after a fresh install.

**What can delete your data:**
- Clicking "Start fresh" in Settings
- Clearing your browser data (web version only)
- Uninstalling the app without exporting first

## Run from source

If you prefer running from source or want to contribute:

```bash
git clone https://github.com/jcdentonintheflesh/sarif.git
cd sarif/app
npm install
cp .env.example .env
npm run dev
```

Open [localhost:5173](http://localhost:5173). The app will walk you through setup. Append `?demo` to the URL to explore with sample data first.

No Git? Click the green **Code** button → **Download ZIP**, unzip, and run the same commands from `cd sarif/app`.

## API keys (optional)

Works without any API keys. Award search and live prices turn on once you add them.

| Key | What it powers | Where to get it | Cost |
|-----|---------------|-----------------|------|
| `SEATS_API_KEY` | Award search | [seats.aero](https://seats.aero) | $9.99/mo |
| `RAPIDAPI_KEY` | Business/PE cash prices | [Sky Scrapper on RapidAPI](https://rapidapi.com/apiheya/api/sky-scrapper) | Free (100 req/mo) or $8.99/mo (10k req) |
| `TRAVELPAYOUTS_TOKEN` | Economy cash baseline | [travelpayouts.com](https://www.travelpayouts.com/developers/api) | Free |

**Desktop app:** Create a file called `.env` in the `app/` folder with your keys (copy `.env.example` as a template). The desktop app reads keys from this file.

**Web/source version:** Add keys to `.env` and restart `npm run dev`.

## Overview

![Sarif dashboard](screenshots/sarif-overview.png)

**Award Search** pulls live award availability from [seats.aero](https://seats.aero), which aggregates availability across 30+ airline loyalty programs (United, Aeroplan, Flying Blue, etc.) into one API. Sarif shows these results alongside cash prices from [Sky Scrapper](https://rapidapi.com/apiheya/api/sky-scrapper) (business/premium economy) and [Travelpayouts](https://www.travelpayouts.com/developers/api) (economy), so you can compare points vs. dollars on the same screen.

**Points & Miles** tracks balances across all your programs and shows which transferable currencies (Amex MR, Chase UR, etc.) can move where.

**US Presence Tracker** counts rolling 180-day and 365-day totals, runs the IRS Substantial Presence Test (the 3-year weighted formula), and suggests exit dates so you don't accidentally trigger tax residency.

**Schengen Tracker** does the same for the 90/180-day Schengen rule.

**Trip Planner** lets you simulate future trips against both US and Schengen limits before you book anything.

![Award Search](screenshots/sarif-search.png)

## Stack

React 19, Vite, Tailwind CSS, Recharts, Express (API proxy), Electron (desktop), localStorage

## License

[MIT](LICENSE)

---

Built by [@vxdenton](https://x.com/vxdenton)
