-- Environment category ONLY (idempotent)
-- Prefer AFTER Roads & Public Spaces. Also runnable AFTER FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql.
-- Does NOT delete Building / Construction / Electricity / Water / Waste / Roads / Fire Safety data.
-- Does NOT invent portals/phones. Opens official URLs only — never submits.
-- NEVER auto-assign all environment to DPCC. Noise uses NGMS + 155271 (not DPCC homepage).
-- Trees/wildlife use Forest grievance / Green Helpline. Air/general pollution uses Green Delhi App.
-- Cross-route: garbage collection → Waste; household water/sewer → Water; construction dust may → Construction.
-- Verified 2026-09-20: ngms.delhi.gov.in + CitizenStatus; 155271; grievance.eforest.delhi.gov.in;
-- Green Helpline 1800-11-8600; ghl Status; Green Delhi Play com.green_delhi_teste / iOS 1586987377;
-- greendelhi.nic.in; environment.delhi.gov.in; cmjansunwai.delhi.gov.in; DPCC burning WhatsApp prior seed.

create extension if not exists "pgcrypto";

-- ============================================================================
-- 0) Schema prerequisites
-- ============================================================================

alter table public.issue_types
  add column if not exists emergency_relevant boolean not null default false;

comment on column public.issue_types.emergency_relevant is
  'When true, prioritize emergency contacts (112/101) and hazard channels before normal complaint portals.';

alter table public.authority_channels
  add column if not exists purpose text,
  add column if not exists issue_type_id uuid references public.issue_types(id) on delete set null,
  add column if not exists geography text,
  add column if not exists priority int not null default 100,
  add column if not exists availability text,
  add column if not exists operating_hours text,
  add column if not exists requires_ca_number boolean not null default false,
  add column if not exists requires_reference_number boolean not null default false,
  add column if not exists service_id uuid references public.authority_services(id) on delete set null,
  add column if not exists action_url text,
  add column if not exists tracking_url text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists whatsapp text,
  add column if not exists instructions text,
  add column if not exists source_id uuid references public.sources(id) on delete set null;

alter table public.authorities
  add column if not exists short_description text,
  add column if not exists source_id uuid references public.sources(id) on delete set null,
  add column if not exists verification_status text;

alter table public.routing_rules
  add column if not exists routing_mode text,
  add column if not exists is_primary boolean not null default false,
  add column if not exists source_id uuid references public.sources(id) on delete set null;

comment on column public.authority_channels.purpose is
  'Reason-specific channel purpose: noise_pollution, air_pollution, water_pollution, soil_pollution, trees_forest, wildlife, burning, emergency, grievance, tracking, app, phone, email, web_portal, etc.';

do $$
declare r record;
begin
  for r in (
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'authority_channels'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%channel_type%'
  ) loop
    execute format('alter table public.authority_channels drop constraint %I', r.conname);
  end loop;
  alter table public.authority_channels
    add constraint authority_channels_channel_type_check
    check (channel_type in (
      'phone', 'website', 'portal', 'email', 'whatsapp', 'sms', 'app', 'other'
    ));
end $$;

create index if not exists authority_channels_purpose_idx
  on public.authority_channels(purpose) where active = true;

alter table public.reports
  add column if not exists environment_jurisdiction_hint text;

comment on column public.reports.environment_jurisdiction_hint is
  'Citizen-selected environment jurisdiction hint: dpcc|green_delhi|forest|municipal|unknown — never inferred from GPS alone.';

-- Ensure generalized tables exist (no-op if prior categories created them)
create table if not exists public.citizen_rights (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  short_description text,
  detailed_description text,
  category_id uuid references public.issue_categories(id) on delete set null,
  issue_type_id uuid references public.issue_types(id) on delete set null,
  right_type text,
  who_can_use text,
  when_it_applies text,
  conditions text,
  what_citizen_can_do text,
  what_authority_must_do text,
  time_limit text,
  possible_remedy text,
  possible_compensation text,
  escalation_available boolean not null default false,
  official_action_url text,
  source_id uuid references public.sources(id) on delete set null,
  source_title text,
  last_verified_at date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.citizen_rights enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'citizen_rights' and policyname = 'Public read citizen_rights') then
    create policy "Public read citizen_rights" on public.citizen_rights for select using (active = true);
  end if;
end $$;

create table if not exists public.citizen_knowledge (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  what_people_often_miss text,
  who_it_applies_to text,
  when_it_applies text,
  what_you_can_do text,
  what_you_may_need text,
  possible_remedy text,
  category_id uuid references public.issue_categories(id) on delete set null,
  issue_type_id uuid references public.issue_types(id) on delete set null,
  official_channel_id uuid references public.authority_channels(id) on delete set null,
  official_service_id uuid,
  official_portal_url text,
  tracking_method text,
  source_id uuid references public.sources(id) on delete set null,
  source_title text,
  last_verified_at date,
  sort_order int not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.citizen_knowledge enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'citizen_knowledge' and policyname = 'Public read citizen_knowledge') then
    create policy "Public read citizen_knowledge" on public.citizen_knowledge for select using (active = true);
  end if;
end $$;

create table if not exists public.official_services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  service_type text,
  organization text,
  authority_id uuid references public.authorities(id) on delete set null,
  category_id uuid references public.issue_categories(id) on delete set null,
  issue_type_id uuid references public.issue_types(id) on delete set null,
  description text,
  who_it_is_for text,
  when_to_use text,
  purpose text,
  channel_type text,
  official_url text,
  app_store_url text,
  play_store_url text,
  phone text,
  email text,
  whatsapp text,
  sms text,
  tracking_url text,
  requires_login boolean not null default false,
  requires_otp boolean not null default false,
  requires_reference boolean not null default false,
  jurisdiction text,
  source_id uuid references public.sources(id) on delete set null,
  last_verified_at date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'citizen_knowledge_official_service_id_fkey'
      and table_name = 'citizen_knowledge'
  ) then
    alter table public.citizen_knowledge
      add constraint citizen_knowledge_official_service_id_fkey
      foreign key (official_service_id) references public.official_services(id) on delete set null;
  end if;
end $$;
alter table public.official_services enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'official_services' and policyname = 'Public read official_services') then
    create policy "Public read official_services" on public.official_services for select using (active = true);
  end if;
end $$;

create table if not exists public.escalation_paths (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  authority_id uuid references public.authorities(id) on delete cascade,
  category_id uuid references public.issue_categories(id) on delete set null,
  level_order int not null default 1,
  level_name text not null,
  description text,
  action_url text,
  phone text,
  email text,
  conditions text,
  source_id uuid references public.sources(id) on delete set null,
  last_verified_at date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.escalation_paths enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'escalation_paths' and policyname = 'Public read escalation_paths') then
    create policy "Public read escalation_paths" on public.escalation_paths for select using (active = true);
  end if;
end $$;

-- ============================================================================
-- 1) Category + sources
-- ============================================================================

insert into public.issue_categories (slug, name, short_description, sort_order, active)
values (
  'environment',
  'Environment',
  'Pollution, trees, wildlife and environmental hazard concerns',
  8,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  sort_order = excluded.sort_order,
  active = true;

insert into public.sources (slug, name, organization, official_url, notes, last_verified_at, active)
values
  ('ngms_delhi', 'NGMS Noise Pollution', 'GNCTD / Delhi Police',
   'https://ngms.delhi.gov.in/',
   'Noise complaint portal + CitizenStatus tracking. Helpline 155271. Prefer over DPCC homepage for noise.',
   current_date, true),
  ('green_delhi_app', 'Green Delhi App', 'DPCC / Department of Environment',
   'https://greendelhi.nic.in/',
   'Pollution complaints. Play com.green_delhi_teste; iOS 1586987377. Tracking after login — no separate public tracking_url.',
   current_date, true),
  ('delhi_forest', 'Forest and Wildlife Department Delhi', 'Forest and Wildlife Department GNCTD',
   'https://forest.delhi.gov.in/',
   'Grievance portal grievance.eforest.delhi.gov.in; Green Helpline 1800-11-8600; Status ghl.eforest.delhi.gov.in/Status.aspx. Not every park → Forest.',
   current_date, true),
  ('environment_dept_delhi', 'Department of Environment GNCTD', 'Department of Environment',
   'https://environment.delhi.gov.in/',
   'Reference / policy. Prefer NGMS / Green Delhi / Forest for specialized filing.',
   current_date, true),
  ('dpcc', 'Delhi Pollution Control Committee', 'DPCC',
   'https://www.dpcc.delhigovt.nic.in/',
   'Regulatory / air / industrial / some env water. Not first for ordinary noise. Not all environment → DPCC.',
   current_date, true),
  ('cm_jan_sunwai', 'CM Jan Sunwai', 'GNCTD',
   'https://cmjansunwai.delhi.gov.in/',
   'General grievance fallback. Use AFTER specialized channels when they exist. Tracker: /ComplaintTracker.',
   current_date, true),
  ('mcd_online', 'Municipal Corporation of Delhi', 'Municipal Corporation of Delhi',
   'https://mcdonline.nic.in/',
   'Reuse for municipal land/park alternatives in Environment — not auto pollution routing.',
   current_date, true),
  ('ndmc', 'New Delhi Municipal Council', 'NDMC',
   'https://www.ndmc.gov.in/',
   'Reuse for NDMC land/park alternatives in Environment.',
   current_date, true),
  ('dda', 'Delhi Development Authority', 'DDA',
   'https://dda.gov.in/',
   'Reuse for DDA land/park alternatives in Environment.',
   current_date, true),
  ('delhi_traffic_police', 'Delhi Traffic Police', 'Delhi Police',
   'https://traffic.delhipolice.gov.in/',
   'Vehicle/traffic noise alternative only — prefer NGMS first.',
   current_date, true)
on conflict (slug) do update set
  name = excluded.name,
  organization = excluded.organization,
  official_url = excluded.official_url,
  notes = excluded.notes,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ============================================================================
-- 2) Soft-deactivate old Phase-2 all-environment → DPCC certainty
-- ============================================================================

update public.routing_rules r
set confidence = 'needs_confirmation',
    routing_mode = 'needs_confirmation',
    is_primary = false,
    notes = coalesce(r.notes, '') || ' [Environment 2026-09-20: demoted auto-DPCC certainty]'
from public.issue_categories c
where r.category_id = c.id
  and c.slug = 'environment'
  and r.active = true
  and (r.confidence in ('likely', 'high', 'certain') or r.is_primary = true);

-- ============================================================================
-- 3) Issue types (soft language; emergency_relevant on hazards)
-- ============================================================================

insert into public.issue_types (
  category_id, slug, name, short_description, sort_order,
  source_id, verification_status, emergency_relevant, active
)
select c.id, v.slug, v.name, v.short_description, v.sort_order,
  s.id, 'probable', v.emergency_relevant, true
from public.issue_categories c
cross join public.sources s
cross join (
  values
  ('air_pollution_concern', 'Air pollution concern', 'Reported smoke, dust or air-quality concern', 10, false),
  ('dust_pollution_concern', 'Dust pollution concern', 'Reported dust pollution concern', 11, false),
  ('smoke_emission_concern', 'Smoke emission concern', 'Reported smoke emission concern', 12, false),
  ('noise_pollution_concern', 'Noise pollution concern', 'Reported loud music, DJ, generator or noise concern', 20, false),
  ('water_pollution_env_concern', 'Water pollution (environment)', 'Reported polluted water body or industrial discharge (env context — not household supply/sewer)', 30, false),
  ('polluted_water_body', 'Polluted water body', 'Reported pollution in a lake, drain outfall or water body', 31, false),
  ('industrial_discharge_water', 'Industrial discharge (water)', 'Reported industrial discharge into water (env context)', 32, false),
  ('soil_pollution_concern', 'Soil / land pollution concern', 'Reported soil contamination or polluted land concern', 40, false),
  ('tree_cutting_damage', 'Tree cutting or damage', 'Reported tree cutting, damage or forest-tree concern', 50, false),
  ('tree_pruning_concern', 'Tree pruning / obstruction concern', 'Reported tree pruning or obstruction concern (may involve Forest or land owner)', 51, false),
  ('falling_tree_hazard', 'Falling tree hazard', 'Tree falling or about to fall with people or traffic at risk', 52, true),
  ('wildlife_concern', 'Wildlife concern', 'Reported wildlife sighting, conflict or offence concern', 60, false),
  ('wildlife_danger', 'Wildlife danger', 'Wildlife posing immediate danger to people', 61, true),
  ('chemical_spill_hazard', 'Chemical spill / toxic release', 'Reported chemical spill or toxic release with people at risk', 70, true),
  ('env_fire_hazard', 'Environmental fire hazard', 'Fire or toxic smoke from an environmental source', 71, true),
  ('environment_other', 'Other environment concern', 'Other environmental concern not listed above', 90, false)
) as v(slug, name, short_description, sort_order, emergency_relevant)
where c.slug = 'environment'
  and s.slug = 'environment_dept_delhi'
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  sort_order = excluded.sort_order,
  emergency_relevant = excluded.emergency_relevant,
  verification_status = excluded.verification_status,
  active = true,
  category_id = excluded.category_id;

-- Soft-deactivate obsolete phase-2 water_pollution_concern if it duplicates env water
-- Keep air_pollution_concern / noise_pollution_concern (refreshed above).
-- If old slug water_pollution_concern exists under environment, leave active but prefer env slug in app groups.

-- ============================================================================
-- 4) Emergency assessment questions + signals
-- ============================================================================

insert into public.emergency_rules
  (category_id, rule_kind, question_key, question_text, condition, emergency_level,
   explanation, sort_order, source_name, source_url, last_verified_at, active)
select c.id, 'assessment_question', v.question_key, v.question_text, 'yes_means_emergency', 'high',
  v.explanation, v.sort_order, 'Environment safety guidance', null, current_date, true
from public.issue_categories c
cross join (values
  ('chemical_or_toxic_release',
   'Is there a chemical spill, toxic release, or strong chemical smell with people at immediate risk right now?',
   'Call 112 / 101 first. Stay upwind. Environment portals are secondary after emergency response.',
   1),
  ('env_fire_or_smoke_danger',
   'Is there an active fire, spreading flames, or heavy toxic smoke from an environmental source right now?',
   'Call 112 / 101 first. Do not approach the fire or smoke.',
   2),
  ('falling_tree_or_wildlife_danger',
   'Is a tree falling / about to fall onto people or traffic, or is wildlife posing immediate danger to people?',
   'Call 112 if people are at risk. Then Forest Green Helpline for tree/wildlife follow-up where applicable.',
   3),
  ('immediate_env_danger',
   'Is there any other immediate danger to people from this environmental situation?',
   'Immediate danger requires emergency services before any normal environment complaint.',
   4)
) as v(question_key, question_text, explanation, sort_order)
where c.slug = 'environment'
  and not exists (
    select 1 from public.emergency_rules r
    where r.category_id = c.id
      and r.rule_kind = 'assessment_question'
      and r.question_key = v.question_key
  );

insert into public.emergency_rules
  (category_id, issue_type_id, rule_kind, question_key, question_text, condition,
   emergency_level, explanation, sort_order, source_name, last_verified_at, active)
select c.id, t.id, 'emergency_signal', t.slug,
  'Selected issue type is emergency-relevant for Environment',
  'user_selected_yes', 'high',
  'Call 112 / 101 first if chemical spill, fire, falling tree, or wildlife poses immediate danger. Specialized portals are secondary after emergency response.',
  t.sort_order, 'Environment safety guidance', current_date, true
from public.issue_categories c
join public.issue_types t on t.category_id = c.id
where c.slug = 'environment'
  and t.emergency_relevant = true
  and t.active = true
  and not exists (
    select 1 from public.emergency_rules r
    where r.category_id = c.id
      and r.issue_type_id = t.id
      and r.rule_kind = 'emergency_signal'
  );

-- ============================================================================
-- 5) Authorities upsert (reuse existing; never create environment_authorities)
-- ============================================================================

insert into public.authorities
  (slug, name, department, government, official_website, emergency_number, short_description,
   source_name, source_url, source_id, last_verified_at, verification_status, active)
select v.slug, v.name, v.department, v.government, v.website, v.emergency,
  v.short_description, s.name, s.official_url, s.id, current_date, 'verified', true
from (values
  ('ngms_noise', 'NGMS — Noise Pollution Grievance', 'GNCTD / Delhi Police', 'Government of NCT of Delhi',
   'https://ngms.delhi.gov.in/', null,
   'Primary channel for noise pollution. Portal + 155271. Not DPCC homepage.',
   'ngms_delhi'),
  ('delhi_forest', 'Forest and Wildlife Department (Delhi)', 'Forest and Wildlife Department', 'Government of NCT of Delhi',
   'https://forest.delhi.gov.in/', null,
   'Trees, forest offences, wildlife. Not every municipal park → Forest.',
   'delhi_forest'),
  ('environment_dept_delhi', 'Department of Environment (GNCTD)', 'Department of Environment', 'Government of NCT of Delhi',
   'https://environment.delhi.gov.in/', null,
   'Reference / policy. Prefer specialized filing channels first.',
   'environment_dept_delhi'),
  ('dpcc', 'Delhi Pollution Control Committee (DPCC)', 'DPCC', 'Government of NCT of Delhi',
   'https://www.dpcc.delhigovt.nic.in/', null,
   'Air / industrial / some env water. Not first for ordinary noise. Not all environment → DPCC.',
   'dpcc'),
  ('delhi_traffic_police', 'Delhi Traffic Police', 'Delhi Traffic Police', 'Delhi Police',
   'https://traffic.delhipolice.gov.in/', null,
   'Conditional alternative for vehicle/traffic noise only — prefer NGMS / 155271 first.',
   'delhi_traffic_police'),
  ('mcd', 'Municipal Corporation of Delhi (MCD)', 'Municipal Corporation of Delhi', 'MCD',
   'https://mcdonline.nic.in/', null,
   'Municipal land/park alternative — not auto for pollution.',
   'mcd_online'),
  ('ndmc', 'New Delhi Municipal Council (NDMC)', 'NDMC', 'Municipal',
   'https://www.ndmc.gov.in/', null,
   'NDMC area land/park alternative — not auto for pollution.',
   'ndmc'),
  ('dda', 'Delhi Development Authority (DDA)', 'DDA', 'DDA',
   'https://dda.gov.in/', null,
   'DDA land/park alternative — not auto for pollution or every tree.',
   'dda')
) as v(slug, name, department, government, website, emergency, short_description, source_slug)
join public.sources s on s.slug = v.source_slug
on conflict (slug) do update set
  name = excluded.name,
  department = excluded.department,
  official_website = excluded.official_website,
  short_description = case
    when public.authorities.slug in ('ngms_noise', 'delhi_forest', 'environment_dept_delhi')
      then excluded.short_description
    else coalesce(public.authorities.short_description, excluded.short_description)
  end,
  source_name = coalesce(excluded.source_name, public.authorities.source_name),
  source_url = coalesce(excluded.source_url, public.authorities.source_url),
  source_id = coalesce(excluded.source_id, public.authorities.source_id),
  last_verified_at = excluded.last_verified_at,
  verification_status = excluded.verification_status,
  active = true;

-- ============================================================================
-- 6) Purpose-specific channels
-- ============================================================================

-- NGMS noise
insert into public.authority_channels (
  authority_id, channel_type, label, value, purpose, priority,
  action_url, tracking_url, phone, source_name, source_url, last_verified_at, active
)
select a.id, v.channel_type, v.label, v.value, v.purpose, v.priority,
  v.action_url, v.tracking_url, v.phone, 'NGMS Delhi', 'https://ngms.delhi.gov.in/', current_date, true
from public.authorities a
cross join (
  values
  ('portal', 'NGMS noise complaint', 'https://ngms.delhi.gov.in/', 'noise_pollution', 10,
   'https://ngms.delhi.gov.in/', 'https://ngms.delhi.gov.in/AuPages/CitizenStatus.aspx', null),
  ('phone', 'Noise pollution helpline 155271', '155271', 'noise_pollution', 20,
   null, null, '155271'),
  ('portal', 'NGMS complaint status', 'https://ngms.delhi.gov.in/AuPages/CitizenStatus.aspx', 'tracking', 30,
   'https://ngms.delhi.gov.in/AuPages/CitizenStatus.aspx', 'https://ngms.delhi.gov.in/AuPages/CitizenStatus.aspx', null),
  ('phone', 'Noise helpline (after emergency)', '155271', 'emergency', 40,
   null, null, '155271')
) as v(channel_type, label, value, purpose, priority, action_url, tracking_url, phone)
where a.slug = 'ngms_noise'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = v.channel_type and c.purpose = v.purpose and c.value = v.value
  );

-- Forest
insert into public.authority_channels (
  authority_id, channel_type, label, value, purpose, priority,
  action_url, tracking_url, phone, source_name, source_url, last_verified_at, active
)
select a.id, v.channel_type, v.label, v.value, v.purpose, v.priority,
  v.action_url, v.tracking_url, v.phone, 'Forest Department Delhi', 'https://forest.delhi.gov.in/', current_date, true
from public.authorities a
cross join (
  values
  ('portal', 'e-Forest grievance (trees)', 'https://grievance.eforest.delhi.gov.in/', 'trees_forest', 10,
   'https://grievance.eforest.delhi.gov.in/', 'https://ghl.eforest.delhi.gov.in/Status.aspx', null),
  ('portal', 'e-Forest grievance (wildlife)', 'https://grievance.eforest.delhi.gov.in/', 'wildlife', 10,
   'https://grievance.eforest.delhi.gov.in/', 'https://ghl.eforest.delhi.gov.in/Status.aspx', null),
  ('phone', 'Forest Green Helpline', '1800118600', 'trees_forest', 20,
   null, null, '1800118600'),
  ('phone', 'Forest Green Helpline (wildlife)', '1800118600', 'wildlife', 20,
   null, null, '1800118600'),
  ('portal', 'Green Helpline status', 'https://ghl.eforest.delhi.gov.in/Status.aspx', 'tracking', 30,
   'https://ghl.eforest.delhi.gov.in/Status.aspx', 'https://ghl.eforest.delhi.gov.in/Status.aspx', null),
  ('portal', 'Forest grievance (after emergency)', 'https://grievance.eforest.delhi.gov.in/', 'emergency', 40,
   'https://grievance.eforest.delhi.gov.in/', null, null),
  ('website', 'Forest Department website', 'https://forest.delhi.gov.in/', 'web_portal', 90,
   'https://forest.delhi.gov.in/', null, null)
) as v(channel_type, label, value, purpose, priority, action_url, tracking_url, phone)
where a.slug = 'delhi_forest'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = v.channel_type and c.purpose = v.purpose and c.value = v.value
  );

-- DPCC / Green Delhi (not noise)
insert into public.authority_channels (
  authority_id, channel_type, label, value, purpose, priority,
  action_url, tracking_url, phone, whatsapp, source_name, source_url, last_verified_at, active
)
select a.id, v.channel_type, v.label, v.value, v.purpose, v.priority,
  v.action_url, v.tracking_url, v.phone, v.whatsapp, 'Green Delhi / DPCC', 'https://greendelhi.nic.in/', current_date, true
from public.authorities a
cross join (
  values
  ('portal', 'Green Delhi (air / pollution)', 'https://greendelhi.nic.in/', 'air_pollution', 10,
   'https://greendelhi.nic.in/', null, null, null),
  ('portal', 'Green Delhi (water pollution env)', 'https://greendelhi.nic.in/', 'water_pollution', 10,
   'https://greendelhi.nic.in/', null, null, null),
  ('portal', 'Green Delhi (soil / land)', 'https://greendelhi.nic.in/', 'soil_pollution', 10,
   'https://greendelhi.nic.in/', null, null, null),
  ('portal', 'Green Delhi (burning — after 112/101 if fire)', 'https://greendelhi.nic.in/', 'burning', 15,
   'https://greendelhi.nic.in/', null, null, null),
  ('whatsapp', 'DPCC leave/garbage burning WhatsApp', '9717593574', 'burning', 20,
   null, null, null, '9717593574'),
  ('app', 'Green Delhi App', 'Green Delhi App', 'app', 25,
   'https://play.google.com/store/apps/details?id=com.green_delhi_teste', null, null, null),
  ('portal', 'Green Delhi (after emergency)', 'https://greendelhi.nic.in/', 'emergency', 40,
   'https://greendelhi.nic.in/', null, null, null),
  ('portal', 'Green Delhi (general env grievance)', 'https://greendelhi.nic.in/', 'grievance', 50,
   'https://greendelhi.nic.in/', null, null, null),
  ('website', 'DPCC official website', 'https://www.dpcc.delhigovt.nic.in/', 'web_portal', 90,
   'https://www.dpcc.delhigovt.nic.in/', null, null, null)
) as v(channel_type, label, value, purpose, priority, action_url, tracking_url, phone, whatsapp)
where a.slug = 'dpcc'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = v.channel_type and c.purpose = v.purpose and c.value = v.value
  );

-- Environment dept (homepage reference only)
insert into public.authority_channels (
  authority_id, channel_type, label, value, purpose, priority,
  action_url, source_name, source_url, last_verified_at, active
)
select a.id, 'website', 'Environment Department website', 'https://environment.delhi.gov.in/', 'web_portal', 90,
  'https://environment.delhi.gov.in/', 'Environment Department', 'https://environment.delhi.gov.in/', current_date, true
from public.authorities a
where a.slug = 'environment_dept_delhi'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = 'web_portal' and c.value = 'https://environment.delhi.gov.in/'
  );

-- Traffic (vehicle noise alternative only)
insert into public.authority_channels (
  authority_id, channel_type, label, value, purpose, priority,
  phone, source_name, source_url, last_verified_at, active
)
select a.id, 'phone', 'Traffic helpline 1095 (vehicle noise alternative)', '1095', 'noise_pollution', 80,
  '1095', 'Delhi Traffic Police', 'https://traffic.delhipolice.gov.in/', current_date, true
from public.authorities a
where a.slug = 'delhi_traffic_police'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = 'noise_pollution' and c.value = '1095'
  );

-- Municipal alternatives (grievance only — not pollution auto)
insert into public.authority_channels (
  authority_id, channel_type, label, value, purpose, priority,
  action_url, phone, source_name, source_url, last_verified_at, active
)
select a.id, v.channel_type, v.label, v.value, 'grievance', 70,
  v.action_url, v.phone, v.source_name, v.source_url, current_date, true
from public.authorities a
join (
  values
  ('mcd', 'phone', 'MCD Citizen Call Center (env municipal alternative)', '155305',
   'https://mcdonline.nic.in/portal/feedback', '155305', 'MCD Online', 'https://mcdonline.nic.in/portal/feedback'),
  ('ndmc', 'phone', 'NDMC helpline 1533 (env municipal alternative)', '1533',
   'https://www.ndmc.gov.in/complaints.aspx', '1533', 'NDMC', 'https://www.ndmc.gov.in/complaints.aspx'),
  ('dda', 'portal', 'DDA grievance hub (env land alternative)', 'https://dda.gov.in/grievance',
   'https://dda.gov.in/grievance', null, 'DDA', 'https://dda.gov.in/grievance')
) as v(auth_slug, channel_type, label, value, action_url, phone, source_name, source_url)
  on a.slug = v.auth_slug
where not exists (
  select 1 from public.authority_channels c
  where c.authority_id = a.id and c.purpose = 'grievance' and c.value = v.value
);

-- ============================================================================
-- 7) Authority services + official_services
-- ============================================================================

insert into public.authority_services (
  authority_id, slug, service_name, description, service_type,
  official_url, filing_url, tracking_url, phone, integration_type,
  source_id, last_verified_at, active
)
select a.id, v.slug, v.service_name, v.description, v.service_type,
  v.official_url, v.filing_url, v.tracking_url, v.phone, v.integration_type,
  s.id, current_date, true
from (
  values
  ('ngms_noise', 'ngms_noise_complaint', 'NGMS — Noise Pollution Complaint',
   'Official Delhi noise grievance portal. Prefer over DPCC homepage for noise.',
   'complaint', 'https://ngms.delhi.gov.in/', 'https://ngms.delhi.gov.in/',
   'https://ngms.delhi.gov.in/AuPages/CitizenStatus.aspx', '155271', 'deep_link', 'ngms_delhi'),
  ('delhi_forest', 'forest_grievance_env', 'e-Forest grievance / Green Helpline',
   'Tree/wildlife grievances. Helpline 1800-11-8600. Status page verified.',
   'complaint', 'https://grievance.eforest.delhi.gov.in/', 'https://grievance.eforest.delhi.gov.in/',
   'https://ghl.eforest.delhi.gov.in/Status.aspx', '1800118600', 'deep_link', 'delhi_forest'),
  ('dpcc', 'green_delhi_app_env', 'Green Delhi App',
   'Official Green Delhi App for pollution. Play com.green_delhi_teste; iOS 1586987377.',
   'complaint', 'https://greendelhi.nic.in/',
   'https://play.google.com/store/apps/details?id=com.green_delhi_teste',
   null, null, 'deep_link', 'green_delhi_app'),
  ('dpcc', 'green_delhi_portal_env', 'Green Delhi portal',
   'greendelhi.nic.in pollution complaints. Tracking after login.',
   'complaint', 'https://greendelhi.nic.in/', 'https://greendelhi.nic.in/',
   null, null, 'deep_link', 'green_delhi_app'),
  ('environment_dept_delhi', 'environment_dept_info', 'Environment Department (information)',
   'Reference website. Prefer specialized filing channels.',
   'information', 'https://environment.delhi.gov.in/', null, null, null, 'deep_link', 'environment_dept_delhi')
) as v(auth_slug, slug, service_name, description, service_type, official_url, filing_url, tracking_url, phone, integration_type, source_slug)
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where not exists (
  select 1 from public.authority_services x where x.slug = v.slug
);

insert into public.official_services (
  slug, name, service_type, organization, authority_id, category_id,
  description, who_it_is_for, when_to_use, purpose, channel_type,
  official_url, tracking_url, play_store_url, app_store_url, phone,
  requires_login, requires_otp, source_id, last_verified_at, active
)
select v.slug, v.name, v.service_type, v.organization, a.id, c.id,
  v.description, v.who_it_is_for, v.when_to_use, v.purpose, v.channel_type,
  v.official_url, v.tracking_url, v.play_store_url, v.app_store_url, v.phone,
  v.requires_login, v.requires_otp, s.id, current_date, true
from public.issue_categories c
cross join (
  values
  ('ngms_noise', 'NGMS — Noise Pollution', 'complaint', 'GNCTD / Delhi Police', 'ngms_noise',
   'File and track noise pollution complaints', 'Delhi residents with noise concerns',
   'When noise is the issue — not DPCC homepage first', 'noise_pollution', 'portal',
   'https://ngms.delhi.gov.in/', 'https://ngms.delhi.gov.in/AuPages/CitizenStatus.aspx',
   null, null, '155271', true, true, 'ngms_delhi'),
  ('green_delhi_app_official', 'Green Delhi App', 'complaint', 'DPCC', 'dpcc',
   'Report pollution via official Green Delhi App', 'Delhi residents with pollution concerns',
   'Air / general pollution complaints', 'air_pollution', 'app',
   'https://greendelhi.nic.in/', null,
   'https://play.google.com/store/apps/details?id=com.green_delhi_teste',
   'https://apps.apple.com/app/id1586987377', null, true, true, 'green_delhi_app'),
  ('forest_grievance_official', 'e-Forest Grievance', 'complaint', 'Forest and Wildlife Department', 'delhi_forest',
   'Tree cutting/damage and wildlife grievances', 'Citizens reporting tree or wildlife concerns',
   'Trees / forest / wildlife — not every municipal park', 'trees_forest', 'portal',
   'https://grievance.eforest.delhi.gov.in/', 'https://ghl.eforest.delhi.gov.in/Status.aspx',
   null, null, '1800118600', false, false, 'delhi_forest'),
  ('cm_jan_sunwai_official', 'CM Jan Sunwai', 'grievance', 'GNCTD', null,
   'General grievance portal — use after specialized channels when they exist',
   'Citizens with unresolved or unmatched grievances',
   'Fallback when no specialized channel fits', 'general_grievance', 'portal',
   'https://cmjansunwai.delhi.gov.in/', 'https://cmjansunwai.delhi.gov.in/ComplaintTracker',
   null, null, null, true, true, 'cm_jan_sunwai')
) as v(slug, name, service_type, organization, auth_slug, description, who_it_is_for, when_to_use, purpose, channel_type,
        official_url, tracking_url, play_store_url, app_store_url, phone, requires_login, requires_otp, source_slug)
left join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where c.slug = 'environment'
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  official_url = excluded.official_url,
  tracking_url = excluded.tracking_url,
  play_store_url = excluded.play_store_url,
  app_store_url = excluded.app_store_url,
  phone = excluded.phone,
  purpose = excluded.purpose,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ============================================================================
-- 8) Routing (all needs_confirmation)
-- ============================================================================

-- Category-level candidates
insert into public.routing_rules (
  category_id, issue_type_id, authority_id, confidence, routing_mode, is_primary,
  notes, source_name, source_url, source_id, last_verified_at, active
)
select c.id, null, a.id, 'needs_confirmation', 'needs_confirmation', false,
  v.notes, s.name, s.official_url, s.id, current_date, true
from public.issue_categories c
join (
  values
  ('ngms_noise', 'ngms_delhi', 'Noise candidate — NGMS / 155271. Not DPCC homepage.'),
  ('dpcc', 'dpcc', 'Air / industrial / some env water candidate. Never all environment → DPCC.'),
  ('delhi_forest', 'delhi_forest', 'Trees / wildlife candidate. Not every park → Forest.'),
  ('environment_dept_delhi', 'environment_dept_delhi', 'Reference / escalation context.'),
  ('delhi_traffic_police', 'ngms_delhi', 'Vehicle/traffic noise alternative only.'),
  ('mcd', 'mcd_online', 'Municipal land/park alternative — needs confirmation.'),
  ('ndmc', 'ndmc', 'NDMC area alternative — needs confirmation.'),
  ('dda', 'dda', 'DDA land/park alternative — needs confirmation.')
) as v(auth_slug, source_slug, notes) on true
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where c.slug = 'environment'
  and not exists (
    select 1 from public.routing_rules r
    where r.category_id = c.id and r.authority_id = a.id and r.issue_type_id is null
  );

-- Issue-type level routing
insert into public.routing_rules (
  category_id, issue_type_id, authority_id, confidence, routing_mode, is_primary,
  notes, source_name, source_url, source_id, last_verified_at, active
)
select c.id, t.id, a.id, 'needs_confirmation', 'needs_confirmation', false,
  v.notes, s.name, s.official_url, s.id, current_date, true
from public.issue_categories c
join public.issue_types t on t.category_id = c.id
join (
  values
  ('noise_pollution_concern', 'ngms_noise', 'ngms_delhi', 'Noise → NGMS / 155271 first.'),
  ('air_pollution_concern', 'dpcc', 'green_delhi_app', 'Air → Green Delhi / DPCC — needs confirmation.'),
  ('dust_pollution_concern', 'dpcc', 'green_delhi_app', 'Dust → Green Delhi / DPCC — needs confirmation.'),
  ('smoke_emission_concern', 'dpcc', 'green_delhi_app', 'Smoke → Green Delhi / DPCC — needs confirmation.'),
  ('water_pollution_env_concern', 'dpcc', 'dpcc', 'Env water pollution — not household DJB supply. Needs confirmation.'),
  ('polluted_water_body', 'dpcc', 'dpcc', 'Polluted water body — needs confirmation.'),
  ('industrial_discharge_water', 'dpcc', 'dpcc', 'Industrial discharge — needs confirmation.'),
  ('soil_pollution_concern', 'dpcc', 'dpcc', 'Soil/land — needs confirmation.'),
  ('tree_cutting_damage', 'delhi_forest', 'delhi_forest', 'Tree cutting/damage → Forest — needs confirmation.'),
  ('tree_pruning_concern', 'delhi_forest', 'delhi_forest', 'Tree pruning may involve Forest or land owner.'),
  ('falling_tree_hazard', 'delhi_forest', 'delhi_forest', 'Falling tree — 112 first if people at risk; then Forest.'),
  ('wildlife_concern', 'delhi_forest', 'delhi_forest', 'Wildlife → Forest — needs confirmation.'),
  ('wildlife_danger', 'delhi_forest', 'delhi_forest', 'Wildlife danger — 112 first if people at risk; then Forest.'),
  ('chemical_spill_hazard', 'dpcc', 'dpcc', 'Chemical spill — 112/101 first; then DPCC/Green Delhi.'),
  ('env_fire_hazard', 'dpcc', 'dpcc', 'Env fire — 112/101 first; then Green Delhi / DPCC burning.'),
  ('environment_other', 'environment_dept_delhi', 'environment_dept_delhi', 'Other env — confirm specialized channel first.')
) as v(issue_slug, auth_slug, source_slug, notes)
  on t.slug = v.issue_slug
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where c.slug = 'environment'
  and not exists (
    select 1 from public.routing_rules r
    where r.category_id = c.id and r.issue_type_id = t.id and r.authority_id = a.id
  );

-- ============================================================================
-- 9) Citizen rights
-- ============================================================================

insert into public.citizen_rights (
  slug, title, short_description, detailed_description, category_id,
  right_type, who_can_use, when_it_applies, what_citizen_can_do,
  escalation_available, official_action_url, source_id, source_title, last_verified_at, active
)
select v.slug, v.title, v.short_description, v.detailed_description, c.id,
  v.right_type, v.who_can_use, v.when_it_applies, v.what_citizen_can_do,
  v.escalation_available, v.official_action_url, s.id, v.source_title, current_date, true
from public.issue_categories c
cross join (
  values
  ('env_noise_complaint_right', 'Report noise pollution',
   'You can report noise via NGMS or 155271',
   'Delhi provides NGMS (ngms.delhi.gov.in) and helpline 155271 for noise pollution complaints. Prefer these over the DPCC homepage for ordinary noise.',
   'complaint_access', 'Delhi residents and affected persons', 'When noise exceeds reasonable limits or violates noise rules',
   'File on NGMS or call 155271. Keep any reference / SMS. Track via NGMS Citizen Status.',
   true, 'https://ngms.delhi.gov.in/', 'ngms_delhi', 'NGMS Delhi'),
  ('env_pollution_complaint_right', 'Report pollution via Green Delhi',
   'You can report pollution through Green Delhi App / portal',
   'Green Delhi App and greendelhi.nic.in accept pollution complaints. Tracking is inside the app/portal after login.',
   'complaint_access', 'Delhi residents', 'When reporting air or related pollution',
   'Install Green Delhi App or open greendelhi.nic.in. Save the official reference.',
   true, 'https://greendelhi.nic.in/', 'green_delhi_app', 'Green Delhi'),
  ('env_tree_wildlife_right', 'Report tree / wildlife concerns',
   'You can report tree cutting/damage and wildlife via Forest channels',
   'Use grievance.eforest.delhi.gov.in and Green Helpline 1800-11-8600. Not every municipal park is a Forest case.',
   'complaint_access', 'Delhi residents', 'Tree cutting, damage, forest or wildlife concerns',
   'Open e-Forest grievance or call 1800-11-8600. Track via Green Helpline Status when you have a reference.',
   true, 'https://grievance.eforest.delhi.gov.in/', 'delhi_forest', 'Forest Department'),
  ('env_keep_reference', 'Keep official references',
   'Save the number the authority gives you',
   'MD-###### is only an internal case ID. Official references come from NGMS, Forest, Green Delhi, or other official channels.',
   'record_keeping', 'All users', 'After filing on an official channel',
   'Copy the official reference into your records. Track only on the official channel.',
   false, null, 'cm_jan_sunwai', 'Product principle + official portals')
) as v(slug, title, short_description, detailed_description, right_type, who_can_use, when_it_applies, what_citizen_can_do, escalation_available, official_action_url, source_slug, source_title)
join public.sources s on s.slug = v.source_slug
where c.slug = 'environment'
on conflict (slug) do update set
  title = excluded.title,
  short_description = excluded.short_description,
  detailed_description = excluded.detailed_description,
  official_action_url = excluded.official_action_url,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ============================================================================
-- 10) Citizen knowledge
-- ============================================================================

insert into public.citizen_knowledge (
  slug, title, what_people_often_miss, who_it_applies_to, when_it_applies,
  what_you_can_do, what_you_may_need, category_id, official_portal_url,
  tracking_method, source_id, source_title, last_verified_at, sort_order, active
)
select v.slug, v.title, v.what_people_often_miss, v.who_it_applies_to, v.when_it_applies,
  v.what_you_can_do, v.what_you_may_need, c.id, v.official_portal_url,
  v.tracking_method, s.id, v.source_title, current_date, v.sort_order, true
from public.issue_categories c
cross join (
  values
  ('env_not_all_dpcc', 'Not all environment → DPCC',
   'People often open the DPCC homepage for every pollution or noise issue.',
   'Anyone filing an environment concern',
   'Before choosing where to complain',
   'Noise → NGMS / 155271. Trees/wildlife → Forest. Air/general pollution → Green Delhi. DPCC where regulatory fit is clear.',
   'Issue type + approximate location (not GPS proof of authority)',
   'https://ngms.delhi.gov.in/', 'Specialized portal or helpline', 'ngms_delhi', 'NGMS / Forest / Green Delhi', 10),
  ('env_noise_ngms', 'How to file a noise complaint',
   'Noise is often sent to the wrong homepage.',
   'People affected by loud music, DJ, generators, etc.',
   'When noise is the primary issue',
   'Open ngms.delhi.gov.in (OTP login) or call 155271. Track on Citizen Status.',
   'Mobile number for OTP; location of noise; description',
   'https://ngms.delhi.gov.in/', 'NGMS Citizen Status page', 'ngms_delhi', 'NGMS Delhi', 20),
  ('env_trees_forest', 'Trees and wildlife channels',
   'Not every park tree is a Forest Department case.',
   'People reporting tree cutting/damage or wildlife',
   'When trees or wildlife are involved',
   'Use e-Forest grievance and 1800-11-8600. Municipal parks may need MCD/NDMC/DDA instead.',
   'Location; photos if safe; description',
   'https://grievance.eforest.delhi.gov.in/', 'Green Helpline Status', 'delhi_forest', 'Forest Department', 30),
  ('env_cross_route', 'Wrong category? Cross-route',
   'Garbage collection, household water/sewer, and some construction dust belong in other categories.',
   'Anyone unsure which category fits',
   'When the issue looks like waste, water, or construction',
   'Use Waste & Garbage, Water & Drainage, or Construction when those fit better. Environment is for pollution/trees/wildlife/hazards.',
   'A short description of what you observed',
   null, null, 'environment_dept_delhi', 'Category guidance', 40),
  ('env_tracking', 'How tracking works',
   'Opening a URL in the app does not mean a complaint is filed.',
   'Anyone who filed on an official channel',
   'After filing',
   'Use NGMS Citizen Status, Forest Status, or Green Delhi in-app tracking. Keep the official reference.',
   'Official reference / complaint number',
   'https://ngms.delhi.gov.in/AuPages/CitizenStatus.aspx', 'Official status pages only', 'ngms_delhi', 'Official portals', 50)
) as v(slug, title, what_people_often_miss, who_it_applies_to, when_it_applies, what_you_can_do, what_you_may_need, official_portal_url, tracking_method, source_slug, source_title, sort_order)
join public.sources s on s.slug = v.source_slug
where c.slug = 'environment'
on conflict (slug) do update set
  title = excluded.title,
  what_people_often_miss = excluded.what_people_often_miss,
  what_you_can_do = excluded.what_you_can_do,
  official_portal_url = excluded.official_portal_url,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ============================================================================
-- 11) Escalation paths (specialized first → CM Jan Sunwai last)
-- ============================================================================

insert into public.escalation_paths (
  slug, authority_id, category_id, level_order, level_name, description,
  action_url, phone, conditions, source_id, last_verified_at, active
)
select v.slug, a.id, c.id, v.level_order, v.level_name, v.description,
  v.action_url, v.phone, v.conditions, s.id, current_date, true
from public.issue_categories c
join (
  values
  ('env_esc_ngms', 'ngms_noise', 1, 'NGMS / noise helpline',
   'First line for noise: NGMS portal or 155271.',
   'https://ngms.delhi.gov.in/', '155271', 'Noise pollution issues', 'ngms_delhi'),
  ('env_esc_green_delhi', 'dpcc', 1, 'Green Delhi / DPCC',
   'First line for air / general pollution: Green Delhi App or portal.',
   'https://greendelhi.nic.in/', null, 'Air / pollution (not ordinary noise)', 'green_delhi_app'),
  ('env_esc_forest', 'delhi_forest', 1, 'Forest grievance / helpline',
   'First line for trees / wildlife: e-Forest grievance or 1800-11-8600.',
   'https://grievance.eforest.delhi.gov.in/', '1800118600', 'Tree / wildlife / forest', 'delhi_forest'),
  ('env_esc_cm_jan_sunwai', 'environment_dept_delhi', 9, 'CM Jan Sunwai (fallback)',
   'General grievance portal — use after specialized channels when they exist or when none fit.',
   'https://cmjansunwai.delhi.gov.in/', null,
   'No specialized channel fits, or prior specialized filing unresolved', 'cm_jan_sunwai')
) as v(slug, auth_slug, level_order, level_name, description, action_url, phone, conditions, source_slug)
  on true
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where c.slug = 'environment'
on conflict (slug) do update set
  level_order = excluded.level_order,
  level_name = excluded.level_name,
  description = excluded.description,
  action_url = excluded.action_url,
  phone = excluded.phone,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ============================================================================
-- Smoke checks (commented)
-- ============================================================================
-- select slug, name, emergency_relevant, active from public.issue_types
-- where category_id = (select id from public.issue_categories where slug = 'environment') order by sort_order;
-- select a.slug, c.purpose, c.channel_type, c.label, c.value
-- from public.authority_channels c join public.authorities a on a.id = c.authority_id
-- where a.slug in ('ngms_noise','delhi_forest','dpcc') and c.active order by a.slug, c.priority;
