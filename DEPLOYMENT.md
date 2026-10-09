# CivicLeder — Deployment Guide

Production guide for shipping CivicLeder: mobile app, independent API, MySQL, and marketing website.

Repository: https://github.com/theatharv1/CivicLeder

---

## 1. Architecture

```
Expo / React Native (CivicLeder)
            │
            │  HTTPS  EXPO_PUBLIC_API_URL
            ▼
   server/  (Node.js + Express + TypeScript + Prisma)
            │
            ├── MySQL 8
            └── Local file storage (uploads/report-evidence/)

website/  → static host (marketing + privacy policy)
```

Supabase is **not** used at runtime. Legacy Postgres SQL under `backend/` is reference-only.

---

## 2. Tech stack

| Layer | Technology |
| --- | --- |
| Mobile | Expo ~57, React Native 0.86, React 19, TypeScript |
| Navigation | React Navigation (native stack + custom tabs) |
| On-device data | AsyncStorage 2.2.0 (alerts, local tips/cases, guest profile) |
| API | Node.js, Express, TypeScript, Zod |
| ORM / DB | Prisma → **MySQL 8** |
| Evidence files | Local filesystem via storage abstraction (`server/uploads/`) |
| Website | Static HTML/CSS in `website/` |
| Store builds | EAS Build (`eas.json`) |
| Source | GitHub |

**App identity**

| Item | Value |
| --- | --- |
| Display name | CivicLeder |
| Slug | `civicleader` |
| iOS bundle id | `com.civicleader.app` |
| Android package | `com.civicleader.app` |
| URL scheme | `civicleader` |
| Support email (copy) | `civicleder@gmail.com` |

---

## 3. Repository layout

| Path | Role in production |
| --- | --- |
| `App.tsx`, `src/`, `assets/` | Mobile app |
| `server/` | **Runtime** API (deploy this) |
| `backend/` | Legacy Supabase/Postgres SQL — **do not** paste into MySQL as-is |
| `website/` | Public site + `privacy.html` |
| `app.json` | Expo name, icons, permissions, bundle ids |
| `eas.json` | Android/iOS build & submit profiles |
| `.env` / `server/.env` | Secrets — **never commit** |
| `DEPLOYMENT.md` | This guide |
| `MIGRATION_REPORT.md` | Supabase → MySQL migration notes |

---

## 4. Packages and tools

### Mobile (`package.json`)

**Runtime:** `expo`, `react`, `react-native`, `@react-navigation/native`, `@react-navigation/native-stack`, `@react-native-async-storage/async-storage@2.2.0`, `expo-clipboard`, `expo-file-system`, `expo-image-picker`, `expo-location`, `expo-status-bar`, `lucide-react-native`, `react-native-gesture-handler`, `react-native-safe-area-context`, `react-native-screens`, `react-native-svg`, `react-native-url-polyfill`

**Dev:** `typescript`, `@types/react`

**Scripts:** `npm start` · `npm run android` · `npm run ios`

### API (`server/package.json`)

**Runtime:** `express`, `cors`, `helmet`, `morgan`, `zod`, `multer`, `@prisma/client`, `dotenv`, `uuid`

**Dev:** `typescript`, `tsx`, `prisma`, `@types/*`

**Scripts:** `npm run dev` · `npm run build` · `npm start` · `npm run db:migrate` · `npm run db:seed`

### Tools to install

| Tool | Purpose |
| --- | --- |
| Node.js 20+ | App + API |
| MySQL 8 | Production database |
| Git | Source |
| EAS CLI (`npm i -g eas-cli`) | Store builds |
| Expo account | Linked to EAS project |
| Google Play Console | Android release |
| Apple Developer (optional) | iOS release |
| Static host | Vercel / Netlify / nginx for `website/` |
| Process manager | `systemd`, PM2, or Docker for `server/` |

---

## 5. Where data lives

| Data | Where |
| --- | --- |
| Public alerts, tip votes (local), My Cases notes, guest profile, device id | Phone (AsyncStorage) |
| Guides, contacts, routing, cloud tips, reports, complaints | MySQL via API |
| Evidence files | Server disk under `STORAGE_PATH/report-evidence/` |
| Source code | GitHub only — no user secrets |

**Delete my data** (About screen) clears on-device storage only. Cloud rows for that device are not auto-wiped until you add that API.

**Offline:** If `EXPO_PUBLIC_API_URL` is missing or the API fails, the app keeps using in-app fallbacks.

---

## 6. Production environment variables

### Mobile (root `.env` or EAS secrets)

```bash
EXPO_PUBLIC_API_URL=https://api.YOUR_DOMAIN.com/api/v1
```

Only this value is required in the app. Never put MySQL passwords or storage credentials in the mobile binary.

### API (`server/.env`)

```bash
PORT=3000
NODE_ENV=production

DATABASE_URL="mysql://USER:STRONG_PASSWORD@DB_HOST:3306/civicleader"

STORAGE_DRIVER=local
STORAGE_PATH=/var/civicleader/uploads

CORS_ORIGINS=https://civicleader.app,https://www.civicleader.app
```

Rules:

- Use a strong DB password; restrict DB network access.
- Do not use `CORS_ORIGINS=*` in production.
- Keep `STORAGE_PATH` outside any public web root.
- Never commit `.env`.

Templates: `.env.example`, `server/.env.example`.

---

## 7. Production changes before go-live

### 7.1 MySQL

```sql
CREATE DATABASE civicleader CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'civicleader'@'%' IDENTIFIED BY 'STRONG_PASSWORD';
GRANT ALL ON civicleader.* TO 'civicleader'@'%';
FLUSH PRIVILEGES;
```

Then on the API host:

```bash
cd server
cp .env.example .env   # edit for production
npm ci
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run build
NODE_ENV=production node dist/server.js
```

Confirm: `GET https://api.YOUR_DOMAIN.com/health` → `{ "status": "ok" }`.

Import remaining catalog rows from legacy SQL / seed later if needed (see `server/docs/MIGRATION_FROM_SUPABASE.md`). Offline fallbacks cover gaps until then.

### 7.2 API hosting

- Terminate TLS (nginx, Caddy, cloud load balancer).
- Reverse-proxy to `PORT` (e.g. 3000).
- Run under systemd/PM2; restart on crash.
- Disk space for `STORAGE_PATH`; backups for MySQL + uploads.
- Firewall: only 443 public; MySQL not public if avoidable.

### 7.3 Website

1. Deploy `website/` as static files.
2. Point domain (e.g. `civicleader.app`) at the host.
3. Verify `https://YOUR_DOMAIN/privacy.html`.
4. Use that privacy URL in Play / App Store listings.
5. Add real store download links when builds are live.
6. Ensure `civicleder@gmail.com` works.

### 7.4 App / store

| Item | Action |
| --- | --- |
| `expo.version` in `app.json` | Bump each release |
| Android `versionCode` | Increment every Play upload |
| EAS env | Set production `EXPO_PUBLIC_API_URL` |
| Privacy URL | Live HTTPS policy page |
| Listing copy | Guide only — not a government filing app |
| Signing | EAS-managed or release keystore (never commit). Local Gradle **must** have `android/keystore.properties` — release no longer falls back to debug. Legacy `ecoaadat-release.keystore` / alias is fine; do not regenerate a new upload key. |
| Permissions | Match camera / photos / location-when-in-use only. No background location, contacts, or overlay. After changing `app.json` `blockedPermissions`, run `npx expo prebuild --clean` (or EAS) so native manifests refresh. |
| Privacy / listing | Website must not claim SafeWalk, My Circle, or contacts. Public brand spelling: **CivicLeder**; package ID stays `com.civicleader.app`. |

### 7.5 Product limits to decide before scale

| Topic | Current behavior | Production decision |
| --- | --- | --- |
| Public alerts | Device-local only | Keep, or add shared MySQL feed |
| Username / password | On-device only | Keep, or add real server auth |
| Delete my data | Phone only | Also delete server rows if accounts exist |

---

## 8. Deploy steps

### A. API + MySQL

1. Provision MySQL 8 and create DB/user.
2. Deploy `server/` code to the API host.
3. Set production `server/.env`.
4. `npm ci && npx prisma generate && npx prisma migrate deploy && npm run db:seed && npm run build`
5. Start process; check `/health`.
6. Put HTTPS in front of the API.

### B. Website

Deploy `website/` to static hosting; confirm privacy URL.

### C. Android (EAS)

```bash
npm i -g eas-cli
eas login
cd /path/to/CivicLeder
# Ensure EXPO_PUBLIC_API_URL is set for production builds
eas build --platform android --profile production
eas submit --platform android --profile production
```

| Profile | Output | Use |
| --- | --- | --- |
| `development` | Dev client APK | Internal |
| `preview` | Internal APK | QA |
| `production` | Play App Bundle (AAB) | Store |
| Submit `production` | Play track `internal`, draft | First uploads |

### D. iOS (when ready)

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

Needs Apple Developer Program and App Store Connect for `com.civicleader.app`.

---

## 9. Local development (quick)

```bash
# API
cd server && cp .env.example .env && npm install
npx prisma db push && npm run db:seed && npm run dev

# App (another terminal)
cd .. && cp .env.example .env
# EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
# On a phone use http://YOUR_LAN_IP:3000/api/v1
npm install && npm start

# Website preview
npx serve website
```

---

## 10. Pre-launch checklist

- [ ] MySQL production DB created and reachable only by API
- [ ] `prisma migrate deploy` + `db:seed` succeeded
- [ ] `GET /health` returns ok over HTTPS
- [ ] Evidence upload works; files land under `STORAGE_PATH`
- [ ] `EXPO_PUBLIC_API_URL` set for EAS production
- [ ] Website live; privacy URL works
- [ ] Play / App Store privacy field uses that URL
- [ ] Version / `versionCode` bumped
- [ ] Release signing configured
- [ ] Listing states: not a government department; does not file for you
- [ ] CORS origins locked down
- [ ] No `.env`, keystores, or DB passwords in git
- [ ] Backups scheduled for MySQL + uploads

---

## 11. Operator docs

| Doc | Contents |
| --- | --- |
| `server/README.md` | API install, scripts, storage |
| `server/docs/API.md` | Endpoint reference |
| `server/docs/DATABASE.md` | Tables and business rules |
| `server/docs/MIGRATION_FROM_SUPABASE.md` | Postgres → MySQL notes |
| `MIGRATION_REPORT.md` | What changed in the migration |
| `backend/APPLY_INSTRUCTIONS.md` | Legacy SQL only (reference) |

---

## 12. Support

Privacy / product contact (as on the site): [civicleder@gmail.com](mailto:civicleder@gmail.com)
