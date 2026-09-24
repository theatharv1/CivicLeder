# CivicLeder — Deployment Guide

Citizen guide for Delhi (Expo / React Native). This document covers the tech stack, packages, tools, production changes, and how to ship the app, website, and Supabase backend.

Repository: https://github.com/theatharv1/CivicLeder

---

## 1. Tech stack

| Layer | Technology |
| --- | --- |
| Mobile app | Expo ~57, React Native 0.86, React 19, TypeScript |
| Navigation | React Navigation (native stack + custom tab bar) |
| Local data | AsyncStorage 2.2.0 (alerts, tips, cases, local profile) |
| Cloud data (optional) | Supabase (Postgres + Storage) via `@supabase/supabase-js` |
| Icons | lucide-react-native |
| Device APIs | expo-location, expo-image-picker, expo-clipboard, expo-file-system |
| Marketing site | Static HTML/CSS in `website/` |
| Native builds | EAS Build (`eas.json`) — Android AAB/APK |
| Source control | GitHub |

**App identity**

- Display name: CivicLeder  
- Slug: `civicleader`  
- iOS bundle id: `com.civicleader.app`  
- Android package: `com.civicleader.app`  
- URL scheme: `civicleader`  
- Support contact (copy): `hello@civicleader.app`

---

## 2. Repository layout

| Path | What it is |
| --- | --- |
| `/` (`App.tsx`, `src/`, `assets/`) | Mobile app |
| `backend/` | Supabase SQL, migrations, verification notes |
| `website/` | Public site + privacy policy |
| `app.json` | Expo config (icons, permissions, bundle ids) |
| `eas.json` | EAS build / submit profiles |
| `.env` | Local secrets only — **never commit** |

---

## 3. Packages

From `package.json`:

### Runtime

- `expo` (~57)
- `react` (19.2.x), `react-native` (0.86.x)
- `@react-navigation/native`, `@react-navigation/native-stack`
- `@react-native-async-storage/async-storage` **2.2.0** (required for Expo Go compatibility)
- `@supabase/supabase-js`, `react-native-url-polyfill`
- `expo-clipboard`, `expo-file-system`, `expo-image-picker`, `expo-location`, `expo-status-bar`
- `react-native-gesture-handler`, `react-native-safe-area-context`, `react-native-screens`, `react-native-svg`
- `lucide-react-native`

### Dev

- `typescript`, `@types/react`

### Scripts

```bash
npm start          # Expo Go / Metro (port 8081)
npm run android    # expo run:android
npm run ios        # Expo Go on iOS
npm run web        # Expo web (optional; marketing site is website/)
```

---

## 4. Tools to install

| Tool | Why |
| --- | --- |
| Node.js 20+ and npm | Install deps, run Metro |
| Git | Source control |
| Expo (`npx expo`) | Local development |
| EAS CLI (`npm i -g eas-cli`) | Production Android/iOS builds |
| Expo / EAS account | Linked to the project for builds |
| Supabase project | Cloud DB + Storage for guides/reports |
| Google Play Console | Android store release |
| Apple Developer + App Store Connect | iOS store release (when ready) |
| Static host (Vercel, Netlify, GitHub Pages, etc.) | Deploy `website/` |

Optional local website preview:

```bash
npx serve website
```

---

## 5. Where data lives

### On the phone (AsyncStorage)

Always used, even without Supabase:

- Public alerts and “I see this too” votes  
- Community tips / tip votes (offline fallback)  
- My Cases personal notes  
- Anonymous device id  
- Optional username + password profile (password stored hashed, local only)

**Delete my data** (About screen) clears these keys on that device.

### In Supabase (when env is set)

- Civic guides, contacts, routing tables  
- Report / case rows (`reports`, `official_complaints`, …)  
- Evidence files in private bucket `report-evidence`

### Important product limits today

| Feature | Production meaning |
| --- | --- |
| Public alerts | **Device-local only** — not a shared city feed until you add a cloud table |
| Username / password | **On-device only** — not Supabase Auth; does not sync across phones |
| GitHub | Source code only — no user data |

---

## 6. Production changes you must make

## Backend (production)

Use the independent API in `server/` with MySQL — see `server/README.md`.

Mobile env (only):

```bash
EXPO_PUBLIC_API_URL=https://your-api.example.com/api/v1
```

Do **not** put MySQL credentials or storage secrets in the mobile app.

Legacy `backend/*.sql` files are historical Supabase/Postgres reference only.

### 6.2 Supabase (production project)

Prefer a **dedicated production** project (not the same as casual/dev).

1. Open Supabase Dashboard → SQL Editor.  
2. Apply SQL in the order documented in `backend/APPLY_INSTRUCTIONS.md`.  
   Typical starting point for a fresh project:
   - `backend/APPLY_ALL_CIVIC.sql`
   - then migrations under `backend/migrations/` (filing assistant, fire safety URL, authority registry, category completes, community contributions, etc.)  
3. Create Storage bucket **`report-evidence`** (private).  
4. Add Storage policies for anon upload/read as described in `backend/STORAGE_REPORT_EVIDENCE.md`.  
5. Before wide launch, review **RLS** and tighten anon policies.  
6. Re-check seeded contacts against verification notes in `backend/`.

Repair scripts (`FIX_*.sql`, diagnostics) exist if a past partial apply left the schema inconsistent — see `APPLY_INSTRUCTIONS.md`.

### 6.3 App / store identity

Update before each public release:

| Item | Current / note | Action |
| --- | --- | --- |
| `expo.version` in `app.json` | `1.0.0` | Bump for each store release |
| Android `versionCode` | `1` | Increment on every Play upload |
| Support email | `hello@civicleader.app` | Use an inbox you control |
| Privacy policy URL | `website/privacy.html` | Host it; paste the **live HTTPS URL** into Play / App Store |
| Store listing copy | — | State clearly: guide only, not a government filing app |
| Permissions (camera, photos, location) | Declared in `app.json` plugins | Keep store privacy answers aligned with real use |

Android signing: use a release keystore (EAS can manage credentials). Keystores and `credentials.json` are gitignored — do not commit them.

### 6.4 Website

1. Deploy the contents of `website/` as static files.  
2. Point your domain (e.g. `civicleader.app`) at that host.  
3. Confirm:
   - `https://your-domain/` → home  
   - `https://your-domain/privacy.html` → privacy  
4. When store builds exist, add real download links on the home page.  
5. Keep privacy contact email accurate.

Example (Vercel): create a project with **Root Directory** = `website`, framework = Other / static, then deploy.

### 6.5 Security and product decisions before scale

| Topic | Recommended production change |
| --- | --- |
| Shared public alerts | Add a Supabase table + RLS; update `src/lib/publicAlerts.ts` so posts sync across users |
| Real accounts | Replace local auth (`src/lib/localAuth.ts`) with Supabase Auth |
| Delete my data | Also delete that user’s cloud rows when cloud identity exists |
| Distribution | Ship store / APK builds; do not rely on Expo Go for end users |

---

## 7. Deploy step by step

### 7.1 Local development check

```bash
git clone https://github.com/theatharv1/CivicLeder.git
cd CivicLeder
npm install
# create .env with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npm start
```

Website preview:

```bash
npx serve website
```

### 7.2 Backend (once per environment)

1. Create / open production Supabase project.  
2. Run SQL per `backend/APPLY_INSTRUCTIONS.md`.  
3. Create `report-evidence` bucket + policies (`backend/STORAGE_REPORT_EVIDENCE.md`).  
4. Copy project URL + anon key into app env / EAS.

### 7.3 Website

Deploy `website/` to your static host and verify privacy URL over HTTPS.

### 7.4 Android (EAS)

`eas.json` profiles:

| Profile | Output | Use |
| --- | --- | --- |
| `development` | Internal APK + dev client | Internal testing |
| `preview` | Internal APK | Stakeholder testing |
| `production` | App Bundle (AAB) | Play Store |
| `submit.production` | Play track `internal`, status `draft` | First uploads |

```bash
npm i -g eas-cli
eas login
cd /path/to/CivicLeder
eas build:configure    # once, if project not linked
eas build --platform android --profile production
eas submit --platform android --profile production
```

### 7.5 iOS (when ready)

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

Requires Apple Developer Program, App Store Connect app record for `com.civicleader.app`, and privacy answers matching the live privacy policy.

---

## 8. Pre-launch checklist

- [ ] Production Supabase project created  
- [ ] SQL applied successfully (no red errors)  
- [ ] `report-evidence` bucket exists and policies work from a test device  
- [ ] `EXPO_PUBLIC_SUPABASE_*` set for EAS production builds  
- [ ] `website/` live with working privacy page  
- [ ] Play / App Store privacy URL points to that page  
- [ ] Version / `versionCode` bumped  
- [ ] Release signing credentials configured in EAS  
- [ ] Listing copy: “not a government department; does not file for you”  
- [ ] Decision documented: keep alerts local **or** ship shared cloud alerts  
- [ ] Decision documented: keep local profiles **or** move to Supabase Auth  
- [ ] `.env`, keystores, and service-role keys are **not** in git  

---

## 9. Quick reference — operator files

| File | Purpose |
| --- | --- |
| `README.md` | Project overview and local run |
| `DEPLOYMENT.md` | This guide |
| `backend/APPLY_INSTRUCTIONS.md` | Exact SQL apply order and repairs |
| `backend/STORAGE_REPORT_EVIDENCE.md` | Evidence bucket setup |
| `app.json` | Expo app metadata and permissions |
| `eas.json` | Build and submit profiles |
| `website/privacy.html` | Privacy policy for stores and users |

---

## 10. Support

Privacy / product contact (as stated in the site): [hello@civicleader.app](mailto:hello@civicleader.app)
