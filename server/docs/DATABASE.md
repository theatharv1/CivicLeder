# Database (MySQL + Prisma)

Provider: `mysql` in `prisma/schema.prisma`.

## Core tables

| Table | Purpose |
| --- | --- |
| `case_id_counter` | Concurrency-safe MD-###### generator |
| `issue_categories` | Category shells |
| `issue_types` | Issue types per category |
| `emergency_contacts` | Delhi helplines |
| `emergency_rules` | Assessment questions / signals |
| `authorities` | Official bodies |
| `authority_channels` | Phone / website / portal channels |
| `routing_rules` | Likely authority mapping |
| `authority_services` | Filing services |
| `authority_service_fields` | Service form fields |
| `official_services` | Searchable official services |
| `citizen_rights` | Searchable rights text |
| `reports` | Internal MD cases |
| `report_locations` | Draft / report locations |
| `report_evidence` | Evidence metadata |
| `official_complaints` | User-recorded official filing notes |
| `case_updates` | Status messages |
| `community_tips` | Neighbour tips |
| `community_tip_votes` | One vote per device per tip |

## Case ID rule

`CaseService.nextCaseId()` increments `case_id_counter.value` inside a transaction and returns `MD-` + zero-padded 6 digits. Replaces Postgres `nextval('my_delhi_case_seq')`.

## Community tip rules

Same as legacy SQL:

- Title 8–120, body 20–800
- Device hash ≥ 16
- Blocked panic phrasing
- URL must be http(s) and `.gov.in` or app stores
- Submit → `needs_more_votes`
- No self-vote; unique `(tip_id, device_hash)`
- disagree ≥ 5 and agree ratio < 0.4 → `rejected`
- agree ≥ 5 and ratio ≥ 0.7 → `community_supported`
- `staff_reviewed` / `archived` frozen

## Seed

`npm run db:seed` loads Phase-1 core contacts, categories, DFS authority, sample fire issue types. Full category catalogs from legacy SQL can be imported later (see MIGRATION_FROM_SUPABASE.md). Offline fallbacks in the mobile app continue to cover gaps.
