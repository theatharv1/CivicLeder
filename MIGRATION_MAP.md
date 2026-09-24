# CivicLeder — Supabase → MySQL Migration Map

Created before implementation. Architecture change only; functional parity required.

## Target architecture

```
Expo / React Native
        │ HTTPS REST /api/v1
        ▼
   server/  (Node + Express + TypeScript + Prisma)
        │
        ▼
      MySQL
        +
   Local filesystem storage (uploads/report-evidence/)
```

**Layout decision:** New API lives in **`server/`**. Existing `backend/` SQL stays as **legacy Supabase/Postgres reference** (not deleted). Prompt suggested nesting under `backend/`; that folder is already SQL-oriented, so `server/` avoids mixing runtimes.

## Supabase runtime touchpoints (mobile)

| File | Operations |
| --- | --- |
| `src/lib/supabase.ts` | Client + env |
| `src/lib/reportCase.ts` | RPC `next_my_delhi_case_id`; upsert `reports`; insert `official_complaints`, `case_updates` |
| `src/lib/myCases.ts` | select `reports`, `official_complaints` |
| `src/lib/reportEvidence.ts` | Storage bucket `report-evidence` upload |
| `src/lib/communityTips.ts` | select `community_tips`; RPC `submit_community_tip`, `vote_community_tip` |
| `src/lib/reportEmergency.ts` | `emergency_contacts`, `issue_categories`, `emergency_rules`, `issue_types` |
| `src/lib/reportRouting.ts` | `issue_categories`, `routing_rules`, `authority_channels` |
| `src/lib/authorityServices.ts` | `authorities`, `authority_services`, `authority_service_fields` |
| `src/lib/globalSearch.ts` | `issue_types`, `official_services`, `citizen_rights` |
| `src/screens/report/ReportStep5Screen.tsx` | insert `report_locations` |

**Local-only (keep):** `publicAlerts.ts`, `localAuth.ts`, `userData.ts`, ProfileContext, offline fallbacks in `src/data/*`.

## RPCs → backend services

| RPC | Service |
| --- | --- |
| `next_my_delhi_case_id` | `CaseService.nextCaseId()` — MySQL counter table + transaction |
| `submit_community_tip` | `CommunityTipService.submit()` |
| `vote_community_tip` | `CommunityTipService.vote()` (transaction) |
| `community_tip_recompute_status` | Internal helper in CommunityTipService |

## Planned API surface (`/api/v1`)

- `GET /health` (also `/health` at root)
- Emergency / categories / issue-types / routing / authorities / authority-services
- `GET /search?q=`
- Reports: create/upsert, location, complaints, case updates, get by case ids
- Community tips: list, submit, vote
- Evidence: multipart upload → local storage

## Env

Mobile: `EXPO_PUBLIC_API_URL` only.  
Server: `DATABASE_URL`, `PORT`, `STORAGE_DRIVER`, `STORAGE_PATH`, `CORS_ORIGINS`.

## Offline parity

Every former `supabaseConfigured` gate becomes `apiConfigured` (API URL set). On failure, existing fallbacks remain.
