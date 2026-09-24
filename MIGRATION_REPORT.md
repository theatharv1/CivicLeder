# MIGRATION_REPORT — CivicLeder Supabase → MySQL backend

## 1. Supabase dependencies found (runtime)

- `src/lib/supabase.ts` (removed)
- `src/lib/reportCase.ts`, `myCases.ts`, `reportEvidence.ts`, `communityTips.ts`
- `src/lib/reportEmergency.ts`, `reportRouting.ts`, `authorityServices.ts`, `globalSearch.ts`
- `src/screens/report/ReportStep5Screen.tsx`
- `@supabase/supabase-js` in root `package.json` (removed)
- Env: `EXPO_PUBLIC_SUPABASE_*` (replaced by `EXPO_PUBLIC_API_URL`)

RPCs: `next_my_delhi_case_id`, `submit_community_tip`, `vote_community_tip` (+ internal `community_tip_recompute_status`).

## 2. Mobile files changed

- Added `src/lib/apiClient.ts`
- Updated: `reportCase.ts`, `myCases.ts`, `reportEvidence.ts`, `communityTips.ts`, `reportEmergency.ts`, `reportRouting.ts`, `authorityServices.ts`, `globalSearch.ts`, `ReportStep5Screen.tsx`
- Deleted: `src/lib/supabase.ts`
- Uninstalled `@supabase/supabase-js`

## 3. Backend modules created (`server/`)

- Express app (`src/app.ts`, `src/server.ts`)
- Config, middleware, routes, services, storage abstraction
- Prisma MySQL schema + seed
- Docs: README, API, DATABASE, MIGRATION_FROM_SUPABASE

## 4. API endpoints

See `server/docs/API.md` — health, emergency, categories, routing, authorities, search, cases, reports, community tips, evidence.

## 5. Database tables

See `server/docs/DATABASE.md` and `server/prisma/schema.prisma`.

## 6. RPC / business rules migrated

- Case ID counter transaction → `CaseService.nextCaseId`
- Community tip submit/vote/recompute → `CommunityTipService`
- Report upsert / complaints / updates / locations / evidence meta → `ReportService`

## 7. Storage

`LocalStorageProvider` under `uploads/report-evidence/`. Abstracted for future S3.

## 8. Environment variables

**Mobile:** `EXPO_PUBLIC_API_URL`  
**Server:** `PORT`, `DATABASE_URL`, `STORAGE_DRIVER`, `STORAGE_PATH`, `CORS_ORIGINS`

## 9. Tests executed

- `npx prisma generate` — OK
- `npm run typecheck` in `server/` — OK
- Mobile `tsc` — run after this report
- Live MySQL migrate/seed/HTTP tests — **pending** (no MySQL/Docker on this machine)

## 10. Unresolved / follow-ups

- Run MySQL migrate + seed on a machine with MySQL 8
- Import remaining catalog rows from `backend/migrations/*.sql`
- Expand `report_locations` columns if full address breakdown must persist server-side
- Align `authority_services` column names with full filing-assistant SQL if seed import requires exact parity
- Add automated integration tests once MySQL is available
- Update root `DEPLOYMENT.md` to point at `server/` instead of Supabase runtime

## 11. Intentional behavior differences

- Offline fallbacks unchanged when API URL unset or request fails
- Local profile/auth unchanged
- Public alerts remain device-local
- Seed is Phase-1 core only; richer catalogs still served from mobile fallbacks until imported
