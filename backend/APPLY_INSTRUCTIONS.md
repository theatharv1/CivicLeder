# Apply civic SQL in Supabase (one paste)

## Why you saw `relation "public.emergency_contacts" does not exist`

Phase 2 **alters** tables created in Phase 1 (`emergency_contacts`, `authorities`, etc.).  
If you only ran Phase 2, those tables do not exist yet → error `42P01`.

## Why you saw `column "case_id" does not exist` (42703)

A **partial prior run** created `public.reports` (or related tables) **without** `case_id`.  
`CREATE TABLE IF NOT EXISTS` then skips, but later SQL (index / unique / comments) still references `case_id` → fails.

### Fix now (half-applied DB)

1. Open **Supabase Dashboard** → **SQL Editor** → **New query**
2. Paste entire file: `backend/FIX_CASE_ID.sql` → **Run**
3. Confirm success: result shows `case_id` column + a sample `MD-######` id
4. Paste entire file: `backend/APPLY_ALL_CIVIC.sql` → **Run** again (safe / idempotent)

You do **not** need to drop tables.

## Why you saw `column "emergency_relevant" does not exist` (42703)

`issue_types.emergency_relevant` is **not** in base Phase 1 schema. Building COMPLETE adds it; Construction and diagnostics assume it. If Building was skipped or half-applied, INSERT / COMMENT / `SELECT t.emergency_relevant` fail.

**Repair order (do this before Construction / Electricity / Water / Waste):**

1. `DIAGNOSTIC_issue_types_columns.sql`
2. `FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql` (recreated if deleted — additive `ADD COLUMN IF NOT EXISTS` only)
3. `DIAGNOSTIC_issue_types_columns.sql` again (`emergency_relevant_exists = true`)
4. Optional: `DIAGNOSTIC_repair_status.sql` (category + count snapshot)
5. Re-run `migrations/20260920_building_category_complete.sql` from disk (idempotent) **or skip** if Building already OK
6. `DIAGNOSTIC_building_routing.sql`
7. `migrations/20260920_construction_category.sql`
8. Optional Construction verification SELECTs (below)

Full write-up: `FIX_SCHEMA_MISMATCH.md`.

## Why you saw `relation "property"` / `relation "My"` (42P01)

English words from seed labels / headers were executed **outside** quotes or `--` comments (usually a **partial paste** or stale SQL Editor buffer). On disk, `property` and `My Delhi` are only in strings/comments.

**Do not** re-run the full Water/Waste migration blindly.  
**Do not** create tables named `property` or `My`.

**Repair order:**

1. `FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql`
2. `DIAGNOSTIC_repair_status.sql`
3. Re-copy the **entire** migration from disk into a **fresh** SQL Editor tab only if the category is still incomplete

Details: `FIX_SQL_PROPERTY_AND_MY_ERRORS.md`.

## Why you saw `relation "a" does not exist` (42P01) on Building routing

A join used `a.slug` without aliasing `public.authorities a`.  
Fixed in repo — see `FIX_BUILDING_SQL_CATALOG_JOIN.md` and `FIX_SCHEMA_MISMATCH.md`.  
**Re-paste the fixed file from disk** (do not keep an old SQL Editor buffer).
## Exact order (fresh / normal apply)

1. Open **Supabase Dashboard** → your project → **SQL Editor** → **New query**
2. Open this file on disk: `backend/APPLY_ALL_CIVIC.sql`
3. Copy **everything** → paste into the SQL Editor → click **Run**
4. Confirm success (no red error). Optional check:

```sql
select count(*) from public.emergency_contacts;
select count(*) from public.sources;
select column_name from information_schema.columns
  where table_schema = 'public' and table_name = 'reports' and column_name = 'case_id';
```

5. **Then** run the filing-assistant migration: paste entire  
   `backend/migrations/20260920_authority_filing_assistant.sql` → **Run**
6. **Then** run Fire Safety location + DFS URL patch: paste entire  
   `backend/migrations/20260920_fire_safety_location_dfs_url.sql` → **Run**
7. **Then** run Authority Registry Phase 1 + Building Phase 2 shell: paste entire  
   `backend/migrations/20260920_authority_registry_phase1.sql` → **Run**
8. **Then** run Building category COMPLETE: paste entire  
   `backend/migrations/20260920_building_category_complete.sql` → **Run**
9. **Diagnostic (read-only):** paste entire  
   `backend/DIAGNOSTIC_building_routing.sql` → **Run**  
   Expect: Building category exists; ~19 active issue types; authorities `mcd`/`ndmc`/`dda`/`delhi_cantonment`; routing rules all `needs_confirmation` / not auto-primary.
10. **Then** run Construction category: paste entire  
    `backend/migrations/20260920_construction_category.sql` → **Run**
11. Optional check after step 10:

```sql
select slug, name, emergency_relevant, active
from public.issue_types
where category_id = (select id from public.issue_categories where slug = 'construction')
order by sort_order;

select c.slug as category, a.slug as authority, r.confidence, r.routing_mode, r.is_primary, r.issue_type_id is null as category_level
from public.routing_rules r
join public.issue_categories c on c.id = r.category_id
join public.authorities a on a.id = r.authority_id
where c.slug = 'construction' and r.active = true
order by category_level desc, a.slug;
```

12. **Then** run Electricity category (+ generalized rights/knowledge/services/escalation): paste entire  
    `backend/migrations/20260920_electricity_category.sql` → **Run**  
    If you see `emergency_relevant` 42703 first: run `FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql`, then re-run Electricity.
13. Optional check after step 12:

```sql
select slug, name, emergency_relevant, active
from public.issue_types
where category_id = (select id from public.issue_categories where slug = 'electricity')
  and active = true
order by sort_order;

select purpose, channel_type, label, value
from public.authority_channels c
join public.authorities a on a.id = c.authority_id
where a.slug in ('brpl','bypl','tpddl','ndmc') and c.active = true
order by a.slug, c.priority, c.purpose;

select count(*) from public.citizen_rights where active = true;
select count(*) from public.citizen_knowledge where active = true;
select slug, name from public.official_services where active = true;
```

14. **Then** run Water & Drainage category: paste entire  
    `backend/migrations/20260920_water_drainage_category.sql` → **Run**  
    If you see `emergency_relevant` 42703 first: run `FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql`, then re-run Water.
15. Optional check after step 14:

```sql
select slug, name, emergency_relevant, active
from public.issue_types
where category_id = (select id from public.issue_categories where slug = 'water_drainage')
  and active = true
order by sort_order;

select a.slug as authority, c.purpose, c.channel_type, c.label, c.value
from public.authority_channels c
join public.authorities a on a.id = c.authority_id
where a.slug in ('delhi_jal_board','mcd','ndmc','irrigation_flood_control')
  and c.active = true
order by a.slug, c.priority, c.purpose;

select count(*) filter (where c.slug = 'water_drainage') as water_routing
from public.routing_rules r
join public.issue_categories c on c.id = r.category_id
where r.active = true;

select slug from public.citizen_rights where slug like 'water_%' and active;
select slug from public.official_services where slug like 'djb_%' or slug like 'ifc_%' or slug like 'mcd311_%' or slug like 'ndmc_%';
```

16. **Then** run Waste & Garbage category: paste entire  
    `backend/migrations/20260920_waste_garbage_category.sql` → **Run**  
    If you see `emergency_relevant` 42703 first: run `FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql`, then re-run Waste.
17. Optional check after step 16:

```sql
select slug, name, emergency_relevant, active
from public.issue_types
where category_id = (select id from public.issue_categories where slug = 'waste_garbage')
  and active = true
order by sort_order;

select a.slug as authority, c.purpose, c.channel_type, c.label, c.value
from public.authority_channels c
join public.authorities a on a.id = c.authority_id
where a.slug in ('mcd','ndmc','dpcc','delhi_cantonment')
  and c.active = true
order by a.slug, c.priority, c.purpose;

select count(*) filter (where c.slug = 'waste_garbage') as waste_routing
from public.routing_rules r
join public.issue_categories c on c.id = r.category_id
where r.active = true;

select slug from public.citizen_rights where slug like 'waste_%' and active;
select slug from public.official_services where slug like '%waste%' or slug like 'dpcc_burning%' or slug like 'green_delhi_waste%';
```

18. **Then** run Roads & Public Spaces category: paste entire  
    `backend/migrations/20260920_roads_public_spaces_category.sql` → **Run**  
    If you see `emergency_relevant` 42703 first: run `FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql`, then re-run Roads.  
    **Paste from disk only** — do not retype SQL (avoids `property` / `My` 42P01 from prose).
19. Optional check after step 18:

```sql
select slug, name, emergency_relevant, active
from public.issue_types
where category_id = (select id from public.issue_categories where slug = 'roads_public_spaces')
  and active = true
order by sort_order;

select a.slug as authority, c.purpose, c.channel_type, c.label, c.value
from public.authority_channels c
join public.authorities a on a.id = c.authority_id
where a.slug in ('mcd','pwd_delhi','ndmc','dda','delhi_traffic_police','delhi_cantonment','irrigation_flood_control')
  and c.active = true
order by a.slug, c.priority, c.purpose;

select count(*) filter (where c.slug = 'roads_public_spaces') as roads_routing
from public.routing_rules r
join public.issue_categories c on c.id = r.category_id
where r.active = true;

select slug from public.citizen_rights where slug like 'roads_%' and active;
select slug from public.official_services where slug like '%roads%' or slug like 'pwd_sewa%' or slug like 'traffic_citizen%';
```

20. **Then** run Environment category: paste entire  
    `backend/migrations/20260920_environment_category.sql` → **Run**  
    If you see `emergency_relevant` 42703 first: run `FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql`, then re-run Environment.  
    **Paste from disk only** — do not retype SQL (avoids `property` / `My` 42P01 from prose).  
    Does **not** send noise to DPCC homepage — uses NGMS + 155271. Trees/wildlife → Forest grievance / Green Helpline.
21. Optional check after step 20:

```sql
select slug, name, emergency_relevant, active
from public.issue_types
where category_id = (select id from public.issue_categories where slug = 'environment')
  and active = true
order by sort_order;

select a.slug as authority, c.purpose, c.channel_type, c.label, c.value
from public.authority_channels c
join public.authorities a on a.id = c.authority_id
where a.slug in ('dpcc','environment_dept_delhi','delhi_forest','delhi_traffic_police','mcd','ndmc','dda')
  and c.active = true
  and (c.purpose like '%noise%' or c.purpose like '%air%' or c.purpose like '%tree%'
       or c.purpose like '%wildlife%' or c.purpose like '%pollution%' or c.purpose in ('grievance','tracking','app','web_portal'))
order by a.slug, c.priority, c.purpose;

select slug, official_url, tracking_url, play_store_url, app_store_url
from public.official_services
where slug like '%noise%' or slug like '%green_delhi%' or slug like '%forest%' or slug like '%jan_sunwai%'
  and active = true;
```

You do **not** need to run the separate Phase 1 / Phase 2 migration files after `APPLY_ALL_CIVIC.sql`.  
`APPLY_ALL_CIVIC.sql` already runs Phase 1 then Phase 2. Safe to re-run.

### Schema-mismatch repair (emergency_relevant / relation "a" / property / My)

1. `DIAGNOSTIC_issue_types_columns.sql`
2. `FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql`
3. `DIAGNOSTIC_issue_types_columns.sql` again
4. `DIAGNOSTIC_repair_status.sql`
5. If `property` / `My` 42P01: see `FIX_SQL_PROPERTY_AND_MY_ERRORS.md` — do **not** blind re-run full Water/Waste/Roads/Environment
6. `DIAGNOSTIC_building_routing.sql` → re-run **`20260920_building_category_complete.sql`** from disk (idempotent) if Building incomplete → **`20260920_construction_category.sql`**

Full order if repairing from scratch: `FIX_CASE_ID.sql` → `APPLY_ALL_CIVIC.sql` → `20260920_authority_filing_assistant.sql` → `20260920_fire_safety_location_dfs_url.sql` → `20260920_authority_registry_phase1.sql` → **`FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql` (if needed)** → **`20260920_building_category_complete.sql`** → diagnostic → **`20260920_construction_category.sql`** → **`20260920_electricity_category.sql`** → **`20260920_water_drainage_category.sql`** → **`20260920_waste_garbage_category.sql`** → **`20260920_roads_public_spaces_category.sql`** → **`20260920_environment_category.sql`**.
## After SQL: Storage bucket (manual)

Create private bucket `report-evidence` — see `STORAGE_REPORT_EVIDENCE.md`.

## After Storage: device testing

Run the app on a **real phone** with Expo Go (simulator lacks reliable camera / dialer):

1. Camera / photo / video on Report evidence step  
2. Location / GPS permission and pin  
3. Tap-to-call emergency numbers (opens phone dialer)
4. Building flow: Step 6 shows “Jurisdiction needs confirmation” + property chips (MCD/NDMC/DDA/Cantonment/Not sure) — no auto-MCD
5. Building emergency YES → Call 112 / 101 before complaint
6. Building plan/approval issue → approval portal only (not dangerous-building complaint)
7. Construction flow: Step 2 typed issues; Step 3 emergency for fire/excavation; Step 6 context chips (MCD/NDMC/DDA/PWD road/Not sure); never auto-MCD
8. Construction fire → Call 101; worker safety → Labour 155214 / email
9. Electricity flow: Step 2 typed issues + rights teaser; Step 3 electrical emergency (112/101); Step 6 DISCOM chips (BRPL/BYPL/TPDDL/NDMC/Not sure) — never GPS→DISCOM; Step 7 reason-specific BEST action (no CGRF first for ordinary outage)
10. Water & Drainage flow: Step 2 groups (Supply/Sewerage/Drainage/Waterlogging/Flooding/Billing/Meter/Quality/Other); Step 3 flood/open-manhole emergency (112/101/102 + I&FC 1800-11-0093); Step 6 chips (DJB/MCD/NDMC/I&FC flood/Not sure) — never all water→DJB; Step 7 purpose-specific BEST action; tracking via 1916+SMS (no invented web track URL)
11. Waste & Garbage flow: Step 2 groups (Collection/Dumping/Burning/Segregation/C&D/Plastic/E-Waste/Hazardous/Other); Step 3 burning/fire emergency (112/101 first; DPCC burning WhatsApp / Green Delhi secondary); Step 6 chips (MCD/NDMC/Cantonment/DPCC env/Not sure) — never all waste→MCD or all→DPCC; Step 7 purpose-specific BEST action; MCD311 track URL only where verified; NDMC/Green Delhi track-by-ref NULL
12. Roads & Public Spaces flow: Step 2 groups (Road Damage/Footpath/Signs & Signals/Traffic/Streetlights/Parks/Bridges/Road Work/Accessibility/Other); Step 3 emergency for collapse/open manhole/live wire/flood/dangerous signal (112/101 first; Traffic 1095 secondary for signals); Step 6 chips (MCD/PWD/NDMC/DDA/Traffic Police/Not sure) + optional asset chips (road/footpath/park/bridge/other) — never all roads→PWD or MCD; never Traffic for every pothole; streetlight prefers Electricity DISCOM architecture; road waterlogging cross-refs I&FC; Step 7 purpose-specific BEST action; PWD Sewa CheckComplaintStatus tracking where verified; NDMC/DDA/Traffic track-by-ref NULL
13. Environment flow: Step 2 groups (Air/Noise/Water pollution env/Soil/Trees/Wildlife/Hazards/Other); Step 3 emergency for chemical/fire/falling tree/wildlife danger (112/101 first); Step 6 chips (DPCC/Green Delhi/Forest/Municipal/Not sure) — never all environment→DPCC; noise → NGMS + 155271 (not DPCC homepage); trees/wildlife → Forest grievance / 1800-11-8600; air/general pollution → Green Delhi App; CM Jan Sunwai last resort only; Step 7 OPEN OFFICIAL COMPLAINT prefers action_url; Track/Call/App hide when empty
14. Fire Safety still opens DFS complaint URL / Call 101
15. “I don’t see my issue” recovery (separate from category Other) — Home / Step 1 entry → recovery screen (search + civic/rights/services/emergency/follow-up/CM Jan Sunwai)

## Related files

| File | Purpose |
|------|---------|
| `APPLY_ALL_CIVIC.sql` | **Paste this once** (Phase 1 + 2) |
| `FIX_CASE_ID.sql` | **If case_id error** — repair incomplete `reports`, then re-run apply-all |
| `FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql` | **If emergency_relevant 42703** — additive column before Building/Construction/Electricity/Water/Waste/Roads |
| `DIAGNOSTIC_issue_types_columns.sql` | Read-only `issue_types` column inventory |
| `DIAGNOSTIC_repair_status.sql` | Read-only repair snapshot (column + categories + counts + sample authorities) |
| `FIX_SQL_PROPERTY_AND_MY_ERRORS.md` | `relation "property"` / `relation "My"` causes — do not blind re-run full migrations |
| `FIX_SCHEMA_MISMATCH.md` | emergency_relevant + relation `"a"` causes and run order |
| `FIX_BUILDING_SQL_CATALOG_JOIN.md` | Building SQL fixes (`name=oid` + `relation "a"`) |
| `DIAGNOSTIC_building_routing.sql` | Read-only Building health check |
| `DIAGNOSTIC_authority_services_service_type.sql` | Read-only service_type CHECK defs |
| `migrations/20260920_authority_filing_assistant.sql` | **After apply-all** — authority services, fields, official_complaints extensions |
| `migrations/20260920_fire_safety_location_dfs_url.sql` | Current vs incident location columns + DFS `filing_url` |
| `migrations/20260920_authority_registry_phase1.sql` | **After DFS URL** — sources registry, channel fields, Building seeds shell |
| `migrations/20260920_building_category_complete.sql` | **Building COMPLETE** — issue types, MCD311/NDMC/DDA/Cantonment services, approval vs complaint, emergency flags |
| `migrations/20260920_construction_category.sql` | **Construction ONLY** — issue types, Labour/PWD/DPCC/Traffic channels, conditional routing |
| `migrations/20260920_electricity_category.sql` | **Electricity ONLY** — issue types, reason-specific DISCOM channels, citizen_rights / citizen_knowledge / official_services / escalation_paths |
| `migrations/20260920_water_drainage_category.sql` | **Water & Drainage ONLY** — issue types, DJB/MCD/NDMC/I&FC purpose channels, rights/knowledge/services/escalation; never auto DJB |
| `migrations/20260920_waste_garbage_category.sql` | **Waste & Garbage ONLY** — issue types, MCD/NDMC/DCB/DPCC purpose channels, rights/knowledge/services/escalation; never auto MCD/DPCC |
| `migrations/20260920_roads_public_spaces_category.sql` | **Roads & Public Spaces ONLY** — issue types, MCD/PWD/NDMC/DDA/Traffic/I&FC purpose channels, rights/knowledge/services/escalation; never auto PWD/MCD; streetlight reuses Electricity |
| `UNVERIFIED.md` | Gaps left null / verification required (no invented portals) |
| `migrations/20260920_report_emergency_fire_safety.sql` | Phase 1 only (already inside apply-all) |
| `migrations/20260920_report_flow_phase2_civic.sql` | Phase 2 only (already inside apply-all) |
| `STORAGE_REPORT_EVIDENCE.md` | Private Storage bucket + policies |
