-- =============================================================================
-- My Delhi — APPLY ALL CIVIC (Phase 1 + Phase 2)
-- Paste this ENTIRE file once into Supabase Dashboard → SQL Editor → Run.
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT / guarded policies.
-- Does NOT drop tables or destroy existing data.
--
-- Why: Phase 2 alone fails with "relation emergency_contacts does not exist"
-- if Phase 1 was never applied. This file runs Phase 1 first, then Phase 2.
-- =============================================================================

-- ===================== PHASE 1: emergency + fire safety foundation =====================

-- My Delhi — Report emergency foundation + Fire Safety seed
-- Apply in Supabase SQL Editor. Does not drop existing tables.

create extension if not exists "pgcrypto";

-- 1) Categories (shells for all; fire_safety fully seeded below)
create table if not exists public.issue_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 2) Issue types
create table if not exists public.issue_types (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.issue_categories(id) on delete cascade,
  slug text not null unique,
  name text not null,
  short_description text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists issue_types_category_idx on public.issue_types(category_id);

-- 3) Emergency contacts (Delhi)
create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  region text not null default 'delhi',
  number text not null,
  label text not null,
  description text,
  sort_order int not null default 0,
  source_name text,
  source_url text,
  last_verified_at date,
  active boolean not null default true,
  unique (region, number)
);

-- 4) Emergency rules / assessment questions
-- rule_kind: 'assessment_question' | 'emergency_signal'
create table if not exists public.emergency_rules (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.issue_categories(id) on delete cascade,
  issue_type_id uuid references public.issue_types(id) on delete cascade,
  rule_kind text not null check (rule_kind in ('assessment_question', 'emergency_signal')),
  question_key text not null,
  question_text text not null,
  condition text,
  emergency_level text not null default 'high'
    check (emergency_level in ('high', 'medium', 'low')),
  explanation text,
  sort_order int not null default 0,
  source_name text,
  source_url text,
  last_verified_at date,
  active boolean not null default true
);

create index if not exists emergency_rules_category_idx on public.emergency_rules(category_id);
create index if not exists emergency_rules_kind_idx on public.emergency_rules(rule_kind);

-- 5) Authorities
create table if not exists public.authorities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  department text,
  government text,
  official_website text,
  emergency_number text,
  source_name text,
  source_url text,
  last_verified_at date,
  active boolean not null default true
);

-- 6) Authority channels (official portals — only when verified)
create table if not exists public.authority_channels (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid not null references public.authorities(id) on delete cascade,
  channel_type text not null check (channel_type in ('phone', 'website', 'portal', 'email', 'other')),
  label text,
  value text,
  source_name text,
  source_url text,
  last_verified_at date,
  active boolean not null default true
);

-- 7) Routing rules (likely authority — not a certainty claim)
create table if not exists public.routing_rules (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.issue_categories(id) on delete cascade,
  issue_type_id uuid references public.issue_types(id) on delete cascade,
  authority_id uuid not null references public.authorities(id) on delete cascade,
  confidence text not null default 'likely' check (confidence in ('likely', 'possible')),
  notes text,
  source_name text,
  source_url text,
  last_verified_at date,
  active boolean not null default true
);

-- ---------- SEED: categories (shells) ----------
insert into public.issue_categories (slug, name, short_description, sort_order)
values
  ('building', 'Building', 'Possible building or property issue', 1),
  ('fire_safety', 'Fire Safety', 'Fire risk, blocked exit or safety concern', 2),
  ('construction', 'Construction', 'Construction, demolition or site concern', 3),
  ('electricity', 'Electricity', 'Exposed wires, unsafe connection or electrical issue', 4),
  ('water_drainage', 'Water & Drainage', 'Leakage, flooding, drainage or water issue', 5),
  ('waste_garbage', 'Waste & Garbage', 'Garbage, dumping or waste-management issue', 6),
  ('roads_public_spaces', 'Roads & Public Spaces', 'Road, footpath, streetlight or public-space issue', 7),
  ('environment', 'Environment', 'Pollution or environmental concern', 8),
  ('something_else', 'Something Else', 'I don’t see my issue', 9)
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  sort_order = excluded.sort_order,
  active = true;

-- ---------- SEED: Delhi emergency contacts ----------
insert into public.emergency_contacts
  (region, number, label, description, sort_order, source_name, source_url, last_verified_at)
values
  ('delhi', '112', 'All Emergencies', 'National emergency response support system', 1,
   '112 India', 'https://112.gov.in/', current_date),
  ('delhi', '101', 'Fire', 'Delhi Fire Service / Fire Control Room', 2,
   'Delhi Fire Service', 'https://dfs.delhi.gov.in/', current_date),
  ('delhi', '102', 'Ambulance', 'Ambulance emergency service', 3,
   'District Magistrate New Delhi — Helpline', 'https://dmnewdelhi.delhi.gov.in/helpline/', current_date)
on conflict (region, number) do update set
  label = excluded.label,
  description = excluded.description,
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ---------- SEED: Delhi Fire Service authority ----------
insert into public.authorities
  (slug, name, department, government, official_website, emergency_number, source_name, source_url, last_verified_at)
values
  ('delhi_fire_service', 'Delhi Fire Service', 'Delhi Fire Service',
   'Government of NCT of Delhi', 'https://dfs.delhi.gov.in/', '101',
   'Delhi Fire Service', 'https://dfs.delhi.gov.in/', current_date)
on conflict (slug) do update set
  name = excluded.name,
  official_website = excluded.official_website,
  emergency_number = excluded.emergency_number,
  source_url = excluded.source_url,
  last_verified_at = excluded.last_verified_at,
  active = true;

insert into public.authority_channels (authority_id, channel_type, label, value, source_name, source_url, last_verified_at)
select a.id, 'phone', 'Fire Control Room', '101', 'Delhi Fire Service', 'https://dfs.delhi.gov.in/', current_date
from public.authorities a
where a.slug = 'delhi_fire_service'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = 'phone' and c.value = '101'
  );

insert into public.authority_channels (authority_id, channel_type, label, value, source_name, source_url, last_verified_at)
select a.id, 'website', 'Official website', 'https://dfs.delhi.gov.in/', 'Delhi Fire Service', 'https://dfs.delhi.gov.in/', current_date
from public.authorities a
where a.slug = 'delhi_fire_service'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = 'website'
  );

-- ---------- SEED: Fire Safety issue types ----------
insert into public.issue_types (category_id, slug, name, short_description, sort_order)
select c.id, v.slug, v.name, v.short_description, v.sort_order
from public.issue_categories c
cross join (values
  ('blocked_emergency_exit', 'Blocked emergency exit', 'An emergency exit appears blocked or inaccessible', 1),
  ('missing_fire_extinguisher', 'Missing fire extinguisher', 'Required fire extinguisher appears missing', 2),
  ('non_functional_fire_extinguisher', 'Non-functional fire extinguisher', 'Fire extinguisher appears damaged or unusable', 3),
  ('unsafe_fire_exit', 'Unsafe fire exit', 'Fire exit appears unsafe or poorly marked', 4),
  ('fire_hazard', 'Fire hazard', 'A condition that may create a fire risk', 5),
  ('flammable_material_storage', 'Flammable material storage', 'Unsafe storage of flammable materials', 6),
  ('fire_safety_violation', 'Fire safety violation', 'Possible fire safety rule or compliance concern', 7),
  ('construction_site_fire_safety', 'Construction site fire safety', 'Fire safety concern at a construction site', 8),
  ('smoke_or_fire', 'Smoke or fire', 'Visible smoke or fire', 9),
  ('gas_leak', 'Gas leak', 'Suspected gas leak', 10),
  ('electrical_fire_risk', 'Electrical fire risk', 'Electrical condition that may cause a fire', 11),
  ('other_fire_safety_concern', 'Other fire safety concern', 'Another fire safety issue not listed above', 12)
) as v(slug, name, short_description, sort_order)
where c.slug = 'fire_safety'
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  sort_order = excluded.sort_order,
  active = true;

-- ---------- SEED: Fire Safety assessment questions (Not sure flow) ----------
insert into public.emergency_rules
  (category_id, rule_kind, question_key, question_text, condition, emergency_level, explanation, sort_order, source_name, source_url, last_verified_at)
select c.id, 'assessment_question', v.question_key, v.question_text, v.condition, 'high', v.explanation, v.sort_order,
  'Delhi Fire Service / 112 India', 'https://dfs.delhi.gov.in/', current_date
from public.issue_categories c
cross join (values
  ('anyone_trapped', 'Is anyone trapped or unable to get out safely?', 'yes_means_emergency',
   'People unable to exit safely may need immediate emergency response.', 1),
  ('active_fire_smoke_gas', 'Is there active fire, smoke, or a gas leak?', 'yes_means_emergency',
   'Active fire, smoke or gas leak can escalate quickly.', 2),
  ('immediate_danger_people', 'Is there an immediate danger to people?', 'yes_means_emergency',
   'Immediate danger to people requires emergency services.', 3),
  ('serious_injury_now', 'Could the situation cause serious injury right now?', 'yes_means_emergency',
   'Risk of serious injury right now is an emergency signal.', 4),
  ('collapse_or_structural', 'Is there a risk of building collapse or major structural failure?', 'yes_means_emergency',
   'Collapse risk requires immediate emergency response.', 5)
) as v(question_key, question_text, condition, explanation, sort_order)
where c.slug = 'fire_safety'
  and not exists (
    select 1 from public.emergency_rules r
    where r.category_id = c.id and r.rule_kind = 'assessment_question' and r.question_key = v.question_key
  );

-- ---------- SEED: Fire Safety emergency signals ----------
insert into public.emergency_rules
  (category_id, issue_type_id, rule_kind, question_key, question_text, condition, emergency_level, explanation, sort_order, source_name, source_url, last_verified_at)
select c.id, t.id, 'emergency_signal', v.question_key, v.question_text, 'user_selected_yes', 'high', v.explanation, v.sort_order,
  'Delhi Fire Service / 112 India', 'https://dfs.delhi.gov.in/', current_date
from public.issue_categories c
cross join (values
  ('smoke_or_fire', 'active_fire_or_flames', 'Active fire or visible flames', 'Call emergency services immediately for active fire.', 1),
  ('smoke_or_fire', 'heavy_smoke_danger', 'Heavy smoke with immediate danger', 'Heavy smoke with danger to people needs emergency response.', 2),
  ('gas_leak', 'gas_leak_immediate', 'Gas leak with immediate danger', 'Gas leaks can cause fire or explosion risk.', 3),
  ('other_fire_safety_concern', 'people_trapped', 'People trapped', 'Trapped people require emergency services.', 4),
  ('other_fire_safety_concern', 'collapse_risk', 'Building collapse risk', 'Collapse risk is an emergency.', 5),
  ('electrical_fire_risk', 'high_voltage_exposure', 'Dangerous high-voltage electrical exposure', 'High-voltage exposure can be life-threatening.', 6)
) as v(issue_slug, question_key, question_text, explanation, sort_order)
join public.issue_types t on t.category_id = c.id and t.slug = v.issue_slug
where c.slug = 'fire_safety'
  and not exists (
    select 1 from public.emergency_rules r
    where r.issue_type_id = t.id and r.rule_kind = 'emergency_signal' and r.question_key = v.question_key
  );

-- ---------- SEED: Likely routing (Fire Safety → Delhi Fire Service) ----------
insert into public.routing_rules (category_id, authority_id, confidence, notes, source_name, source_url, last_verified_at)
select c.id, a.id, 'likely',
  'Likely authority for many fire-safety concerns in Delhi. Exact jurisdiction can depend on location and property type.',
  'Delhi Fire Service', 'https://dfs.delhi.gov.in/', current_date
from public.issue_categories c
join public.authorities a on a.slug = 'delhi_fire_service'
where c.slug = 'fire_safety'
  and not exists (
    select 1 from public.routing_rules r
    where r.category_id = c.id and r.authority_id = a.id and r.issue_type_id is null
  );

-- Public read for citizen app (safe reference data only)
alter table public.issue_categories enable row level security;
alter table public.issue_types enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.emergency_rules enable row level security;
alter table public.authorities enable row level security;
alter table public.authority_channels enable row level security;
alter table public.routing_rules enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'issue_categories' and policyname = 'Public read issue_categories') then
    create policy "Public read issue_categories" on public.issue_categories for select using (active = true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'issue_types' and policyname = 'Public read issue_types') then
    create policy "Public read issue_types" on public.issue_types for select using (active = true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'emergency_contacts' and policyname = 'Public read emergency_contacts') then
    create policy "Public read emergency_contacts" on public.emergency_contacts for select using (active = true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'emergency_rules' and policyname = 'Public read emergency_rules') then
    create policy "Public read emergency_rules" on public.emergency_rules for select using (active = true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'authorities' and policyname = 'Public read authorities') then
    create policy "Public read authorities" on public.authorities for select using (active = true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'authority_channels' and policyname = 'Public read authority_channels') then
    create policy "Public read authority_channels" on public.authority_channels for select using (active = true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'routing_rules' and policyname = 'Public read routing_rules') then
    create policy "Public read routing_rules" on public.routing_rules for select using (active = true);
  end if;
end $$;


-- ===================== PHASE 2: civic foundation + evidence/location/case =====================

-- My Delhi — Report flow Phase 2: civic foundation + evidence/location/case tables
-- Apply after 20260920_report_emergency_fire_safety.sql. Does not drop existing tables.
-- Prefer paste-once: supabase/APPLY_ALL_CIVIC.sql (Phase 1 + Phase 2). See APPLY_INSTRUCTIONS.md.
-- ONLY verified seeds with source_id + last_verified_at. No fake GIS polygons.
-- My Delhi does NOT submit government complaints.

create extension if not exists "pgcrypto";

-- ========== 1) sources (provenance for verified civic data) ==========
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  organization text,
  official_url text not null,
  notes text,
  last_verified_at date not null default current_date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ========== 2) jurisdictions (no fake polygons) ==========
create table if not exists public.jurisdictions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  region text not null default 'delhi',
  jurisdiction_type text not null default 'city'
    check (jurisdiction_type in ('city', 'municipal', 'utility_area', 'other')),
  notes text,
  source_id uuid references public.sources(id),
  last_verified_at date,
  verification_status text not null default 'verified'
    check (verification_status in ('verified', 'probable', 'unknown', 'verification_required')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ========== 3) Extend existing reference tables with source_id where missing ==========
alter table public.emergency_contacts
  add column if not exists source_id uuid references public.sources(id);

alter table public.authorities
  add column if not exists source_id uuid references public.sources(id),
  add column if not exists short_description text,
  add column if not exists verification_status text default 'verified'
    check (verification_status in ('verified', 'probable', 'unknown', 'verification_required'));

alter table public.authority_channels
  add column if not exists source_id uuid references public.sources(id);

alter table public.routing_rules
  add column if not exists source_id uuid references public.sources(id),
  add column if not exists routing_mode text default 'conditional'
    check (routing_mode in ('likely', 'conditional', 'needs_service_area', 'manual')),
  add column if not exists is_primary boolean not null default false;

alter table public.issue_types
  add column if not exists source_id uuid references public.sources(id),
  add column if not exists verification_status text default 'verified'
    check (verification_status in ('verified', 'probable', 'unknown', 'verification_required'));

-- ========== 4) reports (internal My Delhi cases — NOT government complaints) ==========
-- CREATE TABLE IF NOT EXISTS is a no-op when an incomplete table already exists
-- (e.g. from a failed prior run). Always ADD COLUMN IF NOT EXISTS afterward.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  case_id text,
  category_slug text,
  issue_type_slug text,
  emergency_result text,
  user_status text not null default 'draft'
    check (user_status in (
      'draft', 'guided', 'filed_by_user', 'reference_recorded', 'closed_by_user'
    )),
  selected_authority_slug text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reports
  add column if not exists case_id text,
  add column if not exists category_slug text,
  add column if not exists issue_type_slug text,
  add column if not exists emergency_result text,
  add column if not exists user_status text default 'draft',
  add column if not exists selected_authority_slug text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- Sequence helper for MD-###### internal IDs (before backfill / indexes)
create sequence if not exists public.my_delhi_case_seq start 1;

-- Backfill + enforce NOT NULL / unique on case_id (safe for empty or legacy rows)
update public.reports
set case_id = 'MD-' || lpad(nextval('public.my_delhi_case_seq')::text, 6, '0')
where case_id is null;

alter table public.reports alter column case_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.reports'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) ilike '%(case_id)%'
  ) and not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'reports'
      and indexdef ilike '%unique%' and indexdef ilike '%(case_id)%'
  ) then
    alter table public.reports add constraint reports_case_id_key unique (case_id);
  end if;
end $$;

create index if not exists reports_case_id_idx on public.reports(case_id);
create index if not exists reports_created_at_idx on public.reports(created_at desc);

create or replace function public.next_my_delhi_case_id()
returns text
language plpgsql
as $$
declare
  n bigint;
begin
  n := nextval('public.my_delhi_case_seq');
  return 'MD-' || lpad(n::text, 6, '0');
end;
$$;

-- ========== 5) report_evidence ==========
create table if not exists public.report_evidence (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete cascade,
  draft_key text,
  media_type text,
  storage_path text,
  local_uri text,
  mime_type text,
  file_size_bytes bigint,
  duration_seconds numeric,
  width int,
  height int,
  location_on_media boolean not null default false,
  latitude double precision,
  longitude double precision,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.report_evidence
  add column if not exists report_id uuid,
  add column if not exists draft_key text,
  add column if not exists media_type text,
  add column if not exists storage_path text,
  add column if not exists local_uri text,
  add column if not exists mime_type text,
  add column if not exists file_size_bytes bigint,
  add column if not exists duration_seconds numeric,
  add column if not exists width int,
  add column if not exists height int,
  add column if not exists location_on_media boolean default false,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists sort_order int default 0,
  add column if not exists created_at timestamptz default now();

create index if not exists report_evidence_report_idx on public.report_evidence(report_id);
create index if not exists report_evidence_draft_idx on public.report_evidence(draft_key);

-- ========== 6) report_locations ==========
create table if not exists public.report_locations (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete cascade,
  draft_key text,
  latitude double precision,
  longitude double precision,
  address_text text,
  landmark text,
  accuracy_meters double precision,
  jurisdiction_status text not null default 'unknown'
    check (jurisdiction_status in ('unknown', 'probable', 'verified')),
  jurisdiction_id uuid references public.jurisdictions(id),
  add_location_on_photo boolean not null default true,
  source text default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.report_locations
  add column if not exists report_id uuid,
  add column if not exists draft_key text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists address_text text,
  add column if not exists landmark text,
  add column if not exists accuracy_meters double precision,
  add column if not exists jurisdiction_status text default 'unknown',
  add column if not exists jurisdiction_id uuid,
  add column if not exists add_location_on_photo boolean default true,
  add column if not exists source text default 'user',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create index if not exists report_locations_report_idx on public.report_locations(report_id);

-- ========== 7) report_authorities (user-selected / suggested) ==========
create table if not exists public.report_authorities (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete cascade,
  draft_key text,
  authority_id uuid references public.authorities(id),
  authority_slug text,
  role text not null default 'suggested'
    check (role in ('primary_suggested', 'alternative', 'user_selected')),
  confidence text check (confidence in ('likely', 'possible')),
  needs_confirmation boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.report_authorities
  add column if not exists report_id uuid,
  add column if not exists draft_key text,
  add column if not exists authority_id uuid,
  add column if not exists authority_slug text,
  add column if not exists role text default 'suggested',
  add column if not exists confidence text,
  add column if not exists needs_confirmation boolean default true,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now();

-- ========== 8) official_complaints (user-recorded official refs only) ==========
create table if not exists public.official_complaints (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete cascade,
  authority_id uuid references public.authorities(id),
  authority_slug text,
  channel_type text,
  channel_value text,
  official_reference text,
  has_official_reference boolean,
  filed_by_user_at timestamptz,
  user_notes text,
  -- Explicit: My Delhi never generates government complaint IDs
  recorded_by text not null default 'user',
  created_at timestamptz not null default now()
);

alter table public.official_complaints
  add column if not exists report_id uuid,
  add column if not exists authority_id uuid,
  add column if not exists authority_slug text,
  add column if not exists channel_type text,
  add column if not exists channel_value text,
  add column if not exists official_reference text,
  add column if not exists has_official_reference boolean,
  add column if not exists filed_by_user_at timestamptz,
  add column if not exists user_notes text,
  add column if not exists recorded_by text default 'user',
  add column if not exists created_at timestamptz default now();

-- ========== 9) case_updates (user-recorded status only) ==========
create table if not exists public.case_updates (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete cascade,
  status text,
  message text,
  recorded_by text not null default 'user',
  created_at timestamptz not null default now()
);

alter table public.case_updates
  add column if not exists report_id uuid,
  add column if not exists status text,
  add column if not exists message text,
  add column if not exists recorded_by text default 'user',
  add column if not exists created_at timestamptz default now();

create index if not exists case_updates_report_idx on public.case_updates(report_id);

-- ========== SEED: sources ==========
insert into public.sources (slug, name, organization, official_url, notes, last_verified_at)
values
  ('112_india', '112 India', 'National Emergency Response Support System',
   'https://112.gov.in/', 'National emergency number 112', current_date),
  ('delhi_fire_service', 'Delhi Fire Service', 'Government of NCT of Delhi',
   'https://dfs.delhi.gov.in/', 'Fire Control Room 101', current_date),
  ('dm_new_delhi_helpline', 'DM New Delhi Helpline', 'District Magistrate New Delhi',
   'https://dmnewdelhi.delhi.gov.in/helpline/', 'Lists ambulance 102 among helplines', current_date),
  ('delhi_jal_board', 'Delhi Jal Board', 'Delhi Jal Board, GNCTD',
   'https://delhijalboard.delhi.gov.in/jalboard/contact-us',
   'Official contact lists 1916 / 1800117118', current_date),
  ('mcd_online', 'Municipal Corporation of Delhi', 'Municipal Corporation of Delhi',
   'https://mcdonline.nic.in/portal/officialLink',
   'Official links: Helpline 155305, MCD311 app', current_date),
  ('brpl', 'BSES Rajdhani Power Limited', 'BRPL',
   'https://www.bsesdelhi.com/web/brpl/contact-points',
   'Helpline 19123 — service-area dependent', current_date),
  ('bypl', 'BSES Yamuna Power Limited', 'BYPL',
   'https://www.bsesdelhi.com/',
   'Helpline 19122 — service-area dependent', current_date),
  ('tpddl', 'Tata Power-DDL', 'TPDDL',
   'https://www.tatapower-ddl.com/contact-us/touchpoints/locate-us',
   'Helpline 19124 — service-area dependent', current_date),
  ('ndmc', 'New Delhi Municipal Council', 'NDMC',
   'https://www.ndmc.gov.in/',
   'Electricity helpline 19121 listed in DISCOM public materials; NDMC website', current_date),
  ('dpcc', 'Delhi Pollution Control Committee', 'DPCC',
   'https://www.dpcc.delhigovt.nic.in/',
   'State pollution control functions for NCT of Delhi', current_date),
  ('pwd_delhi', 'Public Works Department Delhi', 'PWD GNCTD',
   'https://pwd.delhi.gov.in/',
   'PWD assets only — not all roads', current_date),
  ('delhi_police', 'Delhi Police', 'Delhi Police',
   'https://delhipolice.gov.in/',
   'Law and order / immediate danger; emergency via 100/112', current_date)
on conflict (slug) do update set
  name = excluded.name,
  official_url = excluded.official_url,
  notes = excluded.notes,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ========== SEED: jurisdiction (city-level only, no polygons) ==========
insert into public.jurisdictions (slug, name, region, jurisdiction_type, notes, source_id, last_verified_at, verification_status)
select 'nct_delhi', 'National Capital Territory of Delhi', 'delhi', 'city',
  'City-level scope only. Exact municipal/utility jurisdiction requires location and service area — not claimed here.',
  s.id, current_date, 'verified'
from public.sources s where s.slug = '112_india'
on conflict (slug) do update set
  notes = excluded.notes,
  last_verified_at = excluded.last_verified_at,
  verification_status = excluded.verification_status,
  active = true;

-- ========== Link existing emergency contacts to sources ==========
update public.emergency_contacts ec
set source_id = s.id, last_verified_at = current_date
from public.sources s
where ec.region = 'delhi' and (
  (ec.number = '112' and s.slug = '112_india') or
  (ec.number = '101' and s.slug = 'delhi_fire_service') or
  (ec.number = '102' and s.slug = 'dm_new_delhi_helpline')
);

-- Ensure 101 label remains Fire (never Police)
update public.emergency_contacts
set label = 'Fire',
    description = 'Delhi Fire Service / Fire Control Room'
where region = 'delhi' and number = '101';

-- Soften fire issue-type wording (reported concern, not asserted violation)
update public.issue_types
set name = 'Fire safety compliance concern',
    short_description = 'Possible fire safety rule or compliance concern (reported concern — not a legal determination)'
where slug = 'fire_safety_violation';

update public.issue_types
set short_description = 'An emergency exit appears blocked or inaccessible (reported concern)'
where slug = 'blocked_emergency_exit';

-- ========== SEED: authorities (verified only) ==========
insert into public.authorities
  (slug, name, department, government, official_website, emergency_number, short_description,
   source_name, source_url, source_id, last_verified_at, verification_status)
select v.slug, v.name, v.department, v.government, v.official_website, v.emergency_number, v.short_description,
  s.name, s.official_url, s.id, current_date, 'verified'
from (values
  ('delhi_fire_service', 'Delhi Fire Services', 'Delhi Fire Service', 'Government of NCT of Delhi',
   'https://dfs.delhi.gov.in/', '101',
   'Handles fire safety, fire hazards, emergency response and fire safety compliance.'),
  ('delhi_jal_board', 'Delhi Jal Board', 'Delhi Jal Board', 'Government of NCT of Delhi',
   'https://delhijalboard.delhi.gov.in/', null,
   'Water supply, sewerage and related complaints in DJB service areas.'),
  ('mcd', 'Municipal Corporation of Delhi (MCD)', 'Municipal Corporation of Delhi', 'MCD',
   'https://mcdonline.nic.in/', null,
   'Municipal civic services; complaint channels include helpline 155305 and MCD311.'),
  ('pwd_delhi', 'Public Works Department (PWD)', 'Public Works Department', 'Government of NCT of Delhi',
   'https://pwd.delhi.gov.in/', null,
   'May be relevant for PWD-maintained public buildings and government infrastructure — not all roads.'),
  ('delhi_police', 'Delhi Police', 'Delhi Police', 'Government of NCT of Delhi',
   'https://delhipolice.gov.in/', '100',
   'For immediate danger, law and order issues, or if the situation requires police assistance.'),
  ('brpl', 'BSES Rajdhani Power Limited (BRPL)', 'BRPL', 'Distribution licensee',
   'https://www.bsesdelhi.com/web/brpl', '19123',
   'Electricity distribution — South/West Delhi service area. Do not auto-route by category alone.'),
  ('bypl', 'BSES Yamuna Power Limited (BYPL)', 'BYPL', 'Distribution licensee',
   'https://www.bsesdelhi.com/', '19122',
   'Electricity distribution — East/Central Delhi service area. Do not auto-route by category alone.'),
  ('tpddl', 'Tata Power-DDL (TPDDL)', 'TPDDL', 'Distribution licensee',
   'https://www.tatapower-ddl.com/', '19124',
   'Electricity distribution — North/Northwest Delhi service area. Do not auto-route by category alone.'),
  ('ndmc', 'New Delhi Municipal Council (NDMC)', 'NDMC', 'NDMC',
   'https://www.ndmc.gov.in/', '19121',
   'NDMC area civic/electricity services. Jurisdiction is area-specific.'),
  ('dpcc', 'Delhi Pollution Control Committee (DPCC)', 'DPCC', 'Government of NCT of Delhi',
   'https://www.dpcc.delhigovt.nic.in/', null,
   'Pollution control and environmental regulation in NCT of Delhi.')
) as v(slug, name, department, government, official_website, emergency_number, short_description)
join public.sources s on s.slug = case
  when v.slug = 'delhi_fire_service' then 'delhi_fire_service'
  when v.slug = 'delhi_jal_board' then 'delhi_jal_board'
  when v.slug = 'mcd' then 'mcd_online'
  when v.slug = 'pwd_delhi' then 'pwd_delhi'
  when v.slug = 'delhi_police' then 'delhi_police'
  when v.slug = 'brpl' then 'brpl'
  when v.slug = 'bypl' then 'bypl'
  when v.slug = 'tpddl' then 'tpddl'
  when v.slug = 'ndmc' then 'ndmc'
  when v.slug = 'dpcc' then 'dpcc'
end
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  official_website = excluded.official_website,
  emergency_number = excluded.emergency_number,
  source_id = excluded.source_id,
  source_url = excluded.source_url,
  last_verified_at = excluded.last_verified_at,
  verification_status = excluded.verification_status,
  active = true;

-- ========== SEED: authority channels (verified phones/websites only; NO fake complaint portals) ==========
-- DFS phone + website already seeded in Phase 1; refresh source_id
update public.authority_channels ac
set source_id = s.id, last_verified_at = current_date
from public.authorities a, public.sources s
where ac.authority_id = a.id and a.slug = 'delhi_fire_service' and s.slug = 'delhi_fire_service';

-- DJB
insert into public.authority_channels (authority_id, channel_type, label, value, source_name, source_url, source_id, last_verified_at)
select a.id, v.channel_type, v.label, v.value, s.name, s.official_url, s.id, current_date
from public.authorities a
join public.sources s on s.slug = 'delhi_jal_board'
cross join (values
  ('phone', 'Customer Care (Toll Free)', '1916'),
  ('phone', 'Toll Free', '1800117118'),
  ('website', 'Official website', 'https://delhijalboard.delhi.gov.in/')
) as v(channel_type, label, value)
where a.slug = 'delhi_jal_board'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = v.channel_type and c.value = v.value
  );

-- MCD (helpline + official site; no invented portal URL beyond verified nic.in)
insert into public.authority_channels (authority_id, channel_type, label, value, source_name, source_url, source_id, last_verified_at)
select a.id, v.channel_type, v.label, v.value, s.name, s.official_url, s.id, current_date
from public.authorities a
join public.sources s on s.slug = 'mcd_online'
cross join (values
  ('phone', 'Citizen Call Center', '155305'),
  ('website', 'MCD Online', 'https://mcdonline.nic.in/'),
  ('other', 'MCD311 mobile app', 'MCD311 (official MCD app listed on mcdonline.nic.in)')
) as v(channel_type, label, value)
where a.slug = 'mcd'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = v.channel_type and c.value = v.value
  );

-- Electricity licensees (helplines only; routing needs service area)
insert into public.authority_channels (authority_id, channel_type, label, value, source_name, source_url, source_id, last_verified_at)
select a.id, 'phone', v.label, v.value, s.name, s.official_url, s.id, current_date
from (values
  ('brpl', 'brpl', '24x7 Toll Free', '19123'),
  ('bypl', 'bypl', '24x7 Toll Free', '19122'),
  ('tpddl', 'tpddl', '24x7 Sampark Kendra', '19124'),
  ('ndmc', 'ndmc', 'Electricity helpline', '19121')
) as v(auth_slug, source_slug, label, value)
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where not exists (
  select 1 from public.authority_channels c
  where c.authority_id = a.id and c.channel_type = 'phone' and c.value = v.value
);

insert into public.authority_channels (authority_id, channel_type, label, value, source_name, source_url, source_id, last_verified_at)
select a.id, 'website', 'Official website', a.official_website, s.name, s.official_url, s.id, current_date
from public.authorities a
join public.sources s on s.slug = case a.slug
  when 'brpl' then 'brpl' when 'bypl' then 'bypl' when 'tpddl' then 'tpddl' when 'ndmc' then 'ndmc'
end
where a.slug in ('brpl', 'bypl', 'tpddl', 'ndmc')
  and a.official_website is not null
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = 'website'
  );

-- DPCC website
insert into public.authority_channels (authority_id, channel_type, label, value, source_name, source_url, source_id, last_verified_at)
select a.id, 'website', 'Official website', 'https://www.dpcc.delhigovt.nic.in/', s.name, s.official_url, s.id, current_date
from public.authorities a
join public.sources s on s.slug = 'dpcc'
where a.slug = 'dpcc'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = 'website'
  );

-- PWD website
insert into public.authority_channels (authority_id, channel_type, label, value, source_name, source_url, source_id, last_verified_at)
select a.id, 'website', 'Official website', 'https://pwd.delhi.gov.in/', s.name, s.official_url, s.id, current_date
from public.authorities a
join public.sources s on s.slug = 'pwd_delhi'
where a.slug = 'pwd_delhi'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = 'website'
  );

-- Delhi Police website + emergency note (100)
insert into public.authority_channels (authority_id, channel_type, label, value, source_name, source_url, source_id, last_verified_at)
select a.id, v.channel_type, v.label, v.value, s.name, s.official_url, s.id, current_date
from public.authorities a
join public.sources s on s.slug = 'delhi_police'
cross join (values
  ('phone', 'Police emergency', '100'),
  ('website', 'Official website', 'https://delhipolice.gov.in/')
) as v(channel_type, label, value)
where a.slug = 'delhi_police'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = v.channel_type and c.value = v.value
  );

-- ========== SEED: limited issue types (source-backed shells only where appropriate) ==========
-- Water (DJB-related concerns — conditional routing only)
insert into public.issue_types (category_id, slug, name, short_description, sort_order, source_id, verification_status)
select c.id, v.slug, v.name, v.short_description, v.sort_order, s.id, 'verified'
from public.issue_categories c
join public.sources s on s.slug = 'delhi_jal_board'
cross join (values
  ('water_supply_disruption', 'Water supply disruption', 'Reported water supply disruption or non-availability (DJB service areas)', 1),
  ('water_leakage', 'Water leakage', 'Reported water leakage (may involve DJB depending on asset)', 2),
  ('sewer_overflow', 'Sewer overflow', 'Reported sewer overflow or blockage (may involve DJB)', 3),
  ('water_contamination_concern', 'Water contamination concern', 'Reported concern about water quality/contamination', 4)
) as v(slug, name, short_description, sort_order)
where c.slug = 'water_drainage'
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  source_id = excluded.source_id,
  verification_status = excluded.verification_status,
  active = true;

-- Waste (MCD-related civic complaints — conditional)
insert into public.issue_types (category_id, slug, name, short_description, sort_order, source_id, verification_status)
select c.id, v.slug, v.name, v.short_description, v.sort_order, s.id, 'verified'
from public.issue_categories c
join public.sources s on s.slug = 'mcd_online'
cross join (values
  ('garbage_dumping', 'Garbage dumping', 'Reported garbage dumping or unclean spot (may involve MCD)', 1),
  ('overflowing_bin', 'Overflowing bin', 'Reported overflowing waste bin (may involve MCD)', 2)
) as v(slug, name, short_description, sort_order)
where c.slug = 'waste_garbage'
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  source_id = excluded.source_id,
  verification_status = excluded.verification_status,
  active = true;

-- Electricity (types only — NO category-level auto-routing)
insert into public.issue_types (category_id, slug, name, short_description, sort_order, source_id, verification_status)
select c.id, v.slug, v.name, v.short_description, v.sort_order, null, 'verification_required'
from public.issue_categories c
cross join (values
  ('power_outage', 'Power outage', 'Reported power outage — requires correct distribution licensee for the service area', 1),
  ('exposed_wires', 'Exposed wires', 'Reported exposed or unsafe electrical wires — may also be emergency', 2),
  ('streetlight_outage', 'Streetlight outage', 'Reported streetlight outage — authority depends on asset owner/service area', 3)
) as v(slug, name, short_description, sort_order)
where c.slug = 'electricity'
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  verification_status = excluded.verification_status,
  active = true;

-- Roads: types with explicit note that NOT all roads are PWD
insert into public.issue_types (category_id, slug, name, short_description, sort_order, source_id, verification_status)
select c.id, v.slug, v.name, v.short_description, v.sort_order, null, 'verification_required'
from public.issue_categories c
cross join (values
  ('road_damage', 'Road damage', 'Reported road damage — authority depends on road ownership (not automatically PWD)', 1),
  ('footpath_damage', 'Footpath damage', 'Reported footpath damage — authority depends on location/ownership', 2)
) as v(slug, name, short_description, sort_order)
where c.slug in ('roads_public_spaces', 'roads_public')
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  verification_status = excluded.verification_status,
  active = true;

-- Environment (DPCC)
insert into public.issue_types (category_id, slug, name, short_description, sort_order, source_id, verification_status)
select c.id, v.slug, v.name, v.short_description, v.sort_order, s.id, 'verified'
from public.issue_categories c
join public.sources s on s.slug = 'dpcc'
cross join (values
  ('air_pollution_concern', 'Air pollution concern', 'Reported air pollution concern (may involve DPCC / related agencies)', 1),
  ('noise_pollution_concern', 'Noise pollution concern', 'Reported noise pollution concern (authority may vary)', 2),
  ('water_pollution_concern', 'Water pollution concern', 'Reported water pollution concern (may involve DPCC / related agencies)', 3)
) as v(slug, name, short_description, sort_order)
where c.slug = 'environment'
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  source_id = excluded.source_id,
  verification_status = excluded.verification_status,
  active = true;

-- ========== SEED: routing rules ==========
-- Fire Safety → DFS (likely / primary). Exact jurisdiction can still need confirmation.
-- Upgrade Phase 1 rule if present; otherwise insert.
update public.routing_rules r
set confidence = 'likely',
    routing_mode = 'likely',
    is_primary = true,
    notes = 'Likely authority for many fire-safety concerns in Delhi. Exact jurisdiction can depend on location and property type. Needs confirmation.',
    last_verified_at = current_date,
    source_id = s.id,
    source_name = s.name,
    source_url = s.official_url
from public.issue_categories c,
     public.authorities a,
     public.sources s
where r.category_id = c.id
  and r.authority_id = a.id
  and c.slug = 'fire_safety'
  and a.slug = 'delhi_fire_service'
  and r.issue_type_id is null
  and s.slug = 'delhi_fire_service';

insert into public.routing_rules
  (category_id, issue_type_id, authority_id, confidence, routing_mode, is_primary, notes, source_name, source_url, source_id, last_verified_at)
select c.id, null, a.id, 'likely', 'likely', true,
  'Likely authority for many fire-safety concerns in Delhi. Exact jurisdiction can depend on location and property type. Needs confirmation.',
  s.name, s.official_url, s.id, current_date
from public.issue_categories c
join public.authorities a on a.slug = 'delhi_fire_service'
join public.sources s on s.slug = 'delhi_fire_service'
where c.slug = 'fire_safety'
  and not exists (
    select 1 from public.routing_rules r
    where r.category_id = c.id and r.authority_id = a.id and r.issue_type_id is null
  );

-- Fire Safety alternatives (conditional only — not claimed as primary)
insert into public.routing_rules
  (category_id, issue_type_id, authority_id, confidence, routing_mode, is_primary, notes, source_name, source_url, source_id, last_verified_at)
select c.id, null, a.id, 'possible', 'conditional', false, v.notes, s.name, s.official_url, s.id, current_date
from public.issue_categories c
cross join (values
  ('mcd', 'mcd_online', 'May be involved if the issue is related to building safety or building concerns — not all building matters are MCD.'),
  ('pwd_delhi', 'pwd_delhi', 'May be relevant for public buildings and government infrastructure maintained by PWD — not all sites.'),
  ('delhi_police', 'delhi_police', 'For immediate danger, law and order, or if police assistance is required. Prefer 112/100 in emergencies.')
) as v(auth_slug, source_slug, notes)
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where c.slug = 'fire_safety'
  and not exists (
    select 1 from public.routing_rules r
    where r.category_id = c.id and r.authority_id = a.id and r.issue_type_id is null and r.is_primary = false
  );

-- Water → DJB conditional (not automatic certainty)
insert into public.routing_rules
  (category_id, issue_type_id, authority_id, confidence, routing_mode, is_primary, notes, source_name, source_url, source_id, last_verified_at)
select c.id, null, a.id, 'possible', 'conditional', true,
  'Conditional: water/sewer issues may fall under DJB depending on asset and service area. Needs confirmation.',
  s.name, s.official_url, s.id, current_date
from public.issue_categories c
join public.authorities a on a.slug = 'delhi_jal_board'
join public.sources s on s.slug = 'delhi_jal_board'
where c.slug = 'water_drainage'
  and not exists (
    select 1 from public.routing_rules r
    where r.category_id = c.id and r.authority_id = a.id and r.issue_type_id is null
  );

-- Waste → MCD conditional
insert into public.routing_rules
  (category_id, issue_type_id, authority_id, confidence, routing_mode, is_primary, notes, source_name, source_url, source_id, last_verified_at)
select c.id, null, a.id, 'possible', 'conditional', true,
  'Conditional: many waste/garbage civic complaints may go to MCD (155305 / MCD311). Not all locations/assets.',
  s.name, s.official_url, s.id, current_date
from public.issue_categories c
join public.authorities a on a.slug = 'mcd'
join public.sources s on s.slug = 'mcd_online'
where c.slug = 'waste_garbage'
  and not exists (
    select 1 from public.routing_rules r
    where r.category_id = c.id and r.authority_id = a.id and r.issue_type_id is null
  );

-- Environment → DPCC conditional
insert into public.routing_rules
  (category_id, issue_type_id, authority_id, confidence, routing_mode, is_primary, notes, source_name, source_url, source_id, last_verified_at)
select c.id, null, a.id, 'possible', 'conditional', true,
  'Conditional: pollution concerns may involve DPCC. Other agencies may also apply depending on the issue.',
  s.name, s.official_url, s.id, current_date
from public.issue_categories c
join public.authorities a on a.slug = 'dpcc'
join public.sources s on s.slug = 'dpcc'
where c.slug = 'environment'
  and not exists (
    select 1 from public.routing_rules r
    where r.category_id = c.id and r.authority_id = a.id and r.issue_type_id is null
  );

-- Electricity: NO category-level auto-routing — mark needs_service_area rows for each licensee
insert into public.routing_rules
  (category_id, issue_type_id, authority_id, confidence, routing_mode, is_primary, notes, source_name, source_url, source_id, last_verified_at)
select c.id, null, a.id, 'possible', 'needs_service_area', false, v.notes, s.name, s.official_url, s.id, current_date
from public.issue_categories c
cross join (values
  ('brpl', 'brpl', 'BRPL (19123) — only if location is in BRPL service area. Do not auto-select by category.'),
  ('bypl', 'bypl', 'BYPL (19122) — only if location is in BYPL service area. Do not auto-select by category.'),
  ('tpddl', 'tpddl', 'TPDDL (19124) — only if location is in TPDDL service area. Do not auto-select by category.'),
  ('ndmc', 'ndmc', 'NDMC (19121) — only if location is in NDMC area. Do not auto-select by category.')
) as v(auth_slug, source_slug, notes)
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where c.slug = 'electricity'
  and not exists (
    select 1 from public.routing_rules r
    where r.category_id = c.id and r.authority_id = a.id and r.issue_type_id is null
  );

-- Roads: PWD as conditional only — explicitly NOT all roads
insert into public.routing_rules
  (category_id, issue_type_id, authority_id, confidence, routing_mode, is_primary, notes, source_name, source_url, source_id, last_verified_at)
select c.id, null, a.id, 'possible', 'conditional', false,
  'Conditional only: PWD may apply for PWD-maintained assets. Do NOT route all road issues to PWD.',
  s.name, s.official_url, s.id, current_date
from public.issue_categories c
join public.authorities a on a.slug = 'pwd_delhi'
join public.sources s on s.slug = 'pwd_delhi'
where c.slug in ('roads_public_spaces', 'roads_public')
  and not exists (
    select 1 from public.routing_rules r
    where r.category_id = c.id and r.authority_id = a.id and r.issue_type_id is null
  );

-- Building: MCD conditional only — NOT all building issues
insert into public.routing_rules
  (category_id, issue_type_id, authority_id, confidence, routing_mode, is_primary, notes, source_name, source_url, source_id, last_verified_at)
select c.id, null, a.id, 'possible', 'conditional', false,
  'Conditional only: some building concerns may involve MCD. Do NOT route all building issues to MCD.',
  s.name, s.official_url, s.id, current_date
from public.issue_categories c
join public.authorities a on a.slug = 'mcd'
join public.sources s on s.slug = 'mcd_online'
where c.slug = 'building'
  and not exists (
    select 1 from public.routing_rules r
    where r.category_id = c.id and r.authority_id = a.id and r.issue_type_id is null
  );

-- ========== RLS ==========
alter table public.sources enable row level security;
alter table public.jurisdictions enable row level security;
alter table public.reports enable row level security;
alter table public.report_evidence enable row level security;
alter table public.report_locations enable row level security;
alter table public.report_authorities enable row level security;
alter table public.official_complaints enable row level security;
alter table public.case_updates enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'sources' and policyname = 'Public read sources') then
    create policy "Public read sources" on public.sources for select using (active = true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'jurisdictions' and policyname = 'Public read jurisdictions') then
    create policy "Public read jurisdictions" on public.jurisdictions for select using (active = true);
  end if;
  -- Citizen writes: allow insert/select for report tables from anon for MVP local drafts.
  -- Tighten with auth when user accounts ship. No service-role keys in the app.
  if not exists (select 1 from pg_policies where tablename = 'reports' and policyname = 'Anon insert reports') then
    create policy "Anon insert reports" on public.reports for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'reports' and policyname = 'Anon select reports') then
    create policy "Anon select reports" on public.reports for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'reports' and policyname = 'Anon update reports') then
    create policy "Anon update reports" on public.reports for update using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'report_evidence' and policyname = 'Anon insert report_evidence') then
    create policy "Anon insert report_evidence" on public.report_evidence for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'report_evidence' and policyname = 'Anon select report_evidence') then
    create policy "Anon select report_evidence" on public.report_evidence for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'report_locations' and policyname = 'Anon insert report_locations') then
    create policy "Anon insert report_locations" on public.report_locations for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'report_locations' and policyname = 'Anon select report_locations') then
    create policy "Anon select report_locations" on public.report_locations for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'report_locations' and policyname = 'Anon update report_locations') then
    create policy "Anon update report_locations" on public.report_locations for update using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'report_authorities' and policyname = 'Anon insert report_authorities') then
    create policy "Anon insert report_authorities" on public.report_authorities for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'report_authorities' and policyname = 'Anon select report_authorities') then
    create policy "Anon select report_authorities" on public.report_authorities for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'official_complaints' and policyname = 'Anon insert official_complaints') then
    create policy "Anon insert official_complaints" on public.official_complaints for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'official_complaints' and policyname = 'Anon select official_complaints') then
    create policy "Anon select official_complaints" on public.official_complaints for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'case_updates' and policyname = 'Anon insert case_updates') then
    create policy "Anon insert case_updates" on public.case_updates for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'case_updates' and policyname = 'Anon select case_updates') then
    create policy "Anon select case_updates" on public.case_updates for select using (true);
  end if;
end $$;

-- ========== Storage bucket note (manual) ==========
-- Create a PRIVATE bucket named "report-evidence" in Supabase Dashboard → Storage.
-- Do NOT enable public write. Use anon policies only for authenticated paths when auth lands.
-- Suggested policies (apply in Dashboard or SQL after bucket exists):
--   insert/select for authenticated users on folder {user_id}/* only.
-- Until auth: app keeps local URIs in draft and uploads when Supabase is configured;
-- failed uploads remain as local draft evidence metadata.
comment on table public.report_evidence is
  'Evidence metadata. Files belong in private Storage bucket report-evidence. My Delhi does not submit to government.';

comment on table public.reports is
  'Internal My Delhi cases (MD-######). Not government complaints. Users file on official channels.';

comment on column public.official_complaints.official_reference is
  'User-entered official reference only. Never invent government complaint IDs.';
