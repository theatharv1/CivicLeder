# CivicLeder

Citizen guide for Delhi. Know the problem, find the right office, act yourself.

## Layout

| Path | What it is |
| --- | --- |
| `/` (App.tsx, src/, …) | Mobile app (Expo / React Native) |
| `backend/` | Supabase SQL, migrations, verification notes |
| `website/` | Public site and privacy policy |

## Run the app

```bash
npm install
npm start
```

## Website

```bash
npx serve website
```

Or open `website/index.html` in a browser.

- Home: `website/index.html`
- Privacy: `website/privacy.html`

## Brand

- Name: CivicLeder
- Tagline: Know · Act · A Better City
- Support: civicleder@gmail.com

## Backend

- **Runtime API:** `server/` (Node + Express + Prisma + MySQL). See `server/README.md`.
- **Legacy Supabase SQL (reference only):** `backend/` — see `backend/APPLY_INSTRUCTIONS.md`.

## Deploy

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) and [`MIGRATION_REPORT.md`](./MIGRATION_REPORT.md).

Mobile env:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
```
