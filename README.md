# CruPoint — Field Manager

Pesticide application tracking & DPR compliance for landscape crews.
Built with React + Express + PostgreSQL.

---

## Quick Start (5 steps)

### 1. Install PostgreSQL

Download and install **Postgres.app** from https://postgresapp.com
- Drag it to Applications, open it, click "Initialize"
- It runs in your menu bar — just leave it running

Or if you have Homebrew:
```
brew install postgresql@16
brew services start postgresql@16
```

### 2. Clone and install dependencies

```
cd crupoint
npm install
```

### 3. Create your .env file

```
cp .env.example .env
```

Edit `.env` if your PostgreSQL uses a password. The defaults work
with a fresh Postgres.app install (user: postgres, no password).

### 4. Set up the database

```
npm run db:setup
```

This creates the `crupoint` database, all tables, and seeds it
with default equipment, chemicals, and a test vehicle.

**Default test vehicle:** Truck 1, PIN: `1234`

### 5. Start the app

```
npm run dev
```

This starts both the API server (port 3001) and the React app (port 5173).
Open **http://localhost:5173** in your browser.

---

## Testing on iPad

Your iPad and computer must be on the same WiFi network.

1. Find your computer's local IP: `ifconfig | grep "inet 192"`
2. On the iPad, open Safari and go to `http://192.168.x.x:5173`
3. To install as an app: tap Share → "Add to Home Screen"

---

## Project Structure

```
crupoint/
├── .env                    ← Your environment variables (not in git)
├── .env.example            ← Template
├── server/
│   ├── index.js            ← Express API server
│   ├── db.js               ← PostgreSQL connection
│   ├── schema.sql          ← Database tables & seed data
│   └── setupDb.js          ← Database setup script
├── src/
│   ├── App.jsx             ← Main app (login, routing, header)
│   ├── config.js           ← ★ App name, colors, shared styles
│   ├── main.jsx            ← React entry point
│   ├── components/
│   │   ├── Sidebar.jsx     ← Navigation drawer
│   │   ├── WindCompass.jsx  ← SVG wind compass
│   │   └── PdfExport.js    ← PDF generation
│   ├── lib/
│   │   ├── api.js          ← All backend API calls
│   │   └── weather.js      ← Weather API + simulated fallback
│   └── pages/
│       └── SprayTracker.jsx ← New Log, History, SDS Library
├── public/
│   └── manifest.json       ← PWA config for iPad install
└── index.html
```

---

## Renaming the App

All branding comes from two places:

1. **`.env`** — Change `VITE_APP_NAME` and `VITE_APP_TAGLINE`
2. **`public/manifest.json`** — Change `name` and `short_name`

Every component reads from `src/config.js` which pulls from `.env`.
No need to find-and-replace across files.

---

## Weather API (optional)

By default, weather is simulated for testing. To use real weather:

1. Sign up at https://openweathermap.org (free tier)
2. Get your API key
3. Add to `.env`: `VITE_WEATHER_API_KEY=your_key_here`
4. Restart the dev server

The app uses GPS + the API to fetch live temp, humidity, wind, and conditions.

---

## Adding Vehicles

Connect to the database and insert vehicles:

```sql
-- Connect: psql crupoint

-- The PIN must be a bcrypt hash. Use the setup script pattern
-- or this Node one-liner:
-- node -e "require('bcryptjs').hash('5678',10).then(console.log)"

INSERT INTO vehicles (name, pin_hash, crew_name)
VALUES ('Van 2', '$2a$10$your_hash_here', 'Crew B');
```

---

## Adding Chemicals / Equipment

For now, insert directly into the database:

```sql
INSERT INTO chemicals (name, type, epa, active_ingredient, signal_word)
VALUES ('New Product', 'Herbicide', '12345-67', 'Active 25%', 'CAUTION');

INSERT INTO equipment (name, type)
VALUES ('New Sprayer', 'Backpack');
```

Phase 2 will add an admin dashboard for managing these without SQL.

---

## Troubleshooting

**"Cannot Connect to Database"**
→ Make sure PostgreSQL is running (check Postgres.app in menu bar)
→ Run `npm run db:setup` if you haven't yet

**"Vehicle not found" on login**
→ Run `npm run db:setup` to create the default test vehicle

**Weather shows "simulated"**
→ This is normal without an API key. Add one to `.env` for real data.

**Can't access from iPad**
→ Check both devices are on the same WiFi
→ Try your computer's IP (not localhost)
→ Check firewall isn't blocking port 5173

---

## Next Steps (Phase 2+)

- [ ] Admin dashboard (manage chemicals, equipment, vehicles via web UI)
- [ ] Real weather API integration
- [ ] Offline support (service worker + sync queue)
- [ ] Monthly PUR report generation
- [ ] Route management module
- [ ] Property tracking module
