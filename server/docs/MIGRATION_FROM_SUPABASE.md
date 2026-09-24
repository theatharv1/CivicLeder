# Migration from Supabase (PostgreSQL) → MySQL API

## What changed

| Before | After |
| --- | --- |
| Mobile → Supabase JS client | Mobile → REST `EXPO_PUBLIC_API_URL` |
| Postgres + RLS | MySQL via Prisma (no RLS; validation in services) |
| Storage bucket `report-evidence` | Local filesystem `uploads/report-evidence` (S3-ready abstraction) |
| RPCs in Postgres | Express services |

## Legacy files

Keep `/backend/*.sql` and docs as historical reference. Do not delete.

## Reference vs user data

**Reference (seed / import):** categories, issue types, emergency contacts/rules, authorities, channels, routing, services, official_services, citizen_rights.

**User-generated:** reports, locations, evidence metadata + files, official_complaints, case_updates, community_tips, community_tip_votes.

## Future data migration (do not run destructively now)

1. Export Postgres tables as CSV/JSON.
2. Map UUID text columns 1:1.
3. Timestamps: `timestamptz` → MySQL `DateTime` (UTC).
4. JSON/jsonb → MySQL `JSON` where used.
5. Rebuild `case_id_counter.value` to `MAX(numeric part of case_id)`.
6. Copy Storage objects into `uploads/report-evidence/` preserving `{draftKey}/{id}.{ext}`.
7. Re-test tip vote uniqueness and case ID uniqueness.

## Intentional differences

- No Postgres RLS (API is the gate).
- Authority services schema is simplified vs full filing-assistant SQL; offline fallbacks remain for parity when DB rows are missing.
- Location extras (building/street/postal) not all columns yet — core lat/lng/address/landmark preserved via API.
- Full historical seed of every category migration is not auto-imported; Phase-1 seed + mobile fallbacks cover UX until a full import job is run.
