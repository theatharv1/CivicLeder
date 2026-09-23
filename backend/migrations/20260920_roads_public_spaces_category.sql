-- My Delhi — Roads & Public Spaces category ONLY
-- Prefer AFTER Waste & Garbage (idempotent re-run OK).
-- Also runnable AFTER supabase/FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql.
-- Does NOT delete Building / Construction / Electricity / Water / Waste / Fire Safety data.
-- Does NOT invent portals/phones. My Delhi opens official URLs only — never submits.
-- MD-###### remains internal — never an official government reference.
-- NEVER auto-assign all roads → PWD or MCD. NEVER Traffic Police for every pothole.
-- Road waterlogging → prefer I&FC / municipal / water — NOT auto PWD.
-- Streetlight: do NOT duplicate DISCOM phones; reuse Electricity streetlight architecture.
-- Verified 2026-09-20:
--   MCD feedback (prior): 155305, MCD311; live fetch timed out — retained prior seed.
--   NDMC complaints (prior): 1533, WhatsApp 8588887773, care@; Civil-I roads/parks/FOB/bus shelters confirmed via search snippet.
--   Traffic Police contact-us: 1095, 011-25844444, grievance.traffic@delhipolice.gov.in (live fetch OK).
--   PWD: pwddelhi.gov.in chrome shows 1908; Sewa lists 1908 / WhatsApp 8130188222 / complaint@pwddelhi.gov.in;
--        Sewa portal also lists complaint@pwddelhi.com — seeded .gov.in; .com noted in UNVERIFIED.
--   DDA grievance channels already seeded (reuse). DCB website only this pass (phones NULL for roads).

create extension if not exists "pgcrypto";

-- ============================================================================
-- 0) Schema prerequisites — MUST stay before any INSERT/COMMENT using these columns
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
  add column if not exists service_id uuid references public.authority_services(id) on delete set null;

comment on column public.authority_channels.purpose is
  'Reason-specific channel purpose: pothole, road_damage, footpath, park, street_furniture, road_signage, traffic_signal, traffic_obstruction, encroachment, public_space, bridge, underpass, bus_shelter, road_cut, waterlogging, streetlight, emergency, grievance, tracking, app, phone, email, whatsapp, web_portal, etc.';

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
create index if not exists authority_channels_issue_type_idx
  on public.authority_channels(issue_type_id) where active = true;

-- Optional draft hint columns (citizen-selected — not GPS proof)
alter table public.reports
  add column if not exists roads_jurisdiction_hint text,
  add column if not exists roads_asset_hint text;

comment on column public.reports.roads_jurisdiction_hint is
  'Citizen-selected roads jurisdiction hint: mcd|pwd|ndmc|dda|traffic_police|unknown — never inferred from GPS alone.';
comment on column public.reports.roads_asset_hint is
  'Citizen-selected asset hint: road|footpath|park|bridge|other — optional context only.';

-- Ensure generalized rights / knowledge / services / escalation tables exist
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
create index if not exists citizen_rights_category_idx
  on public.citizen_rights(category_id) where active = true;
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
create index if not exists citizen_knowledge_category_idx
  on public.citizen_knowledge(category_id) where active = true;
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
create index if not exists official_services_authority_idx
  on public.official_services(authority_id) where active = true;
create index if not exists official_services_purpose_idx
  on public.official_services(purpose) where active = true;
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
create index if not exists escalation_paths_authority_idx
  on public.escalation_paths(authority_id, level_order) where active = true;
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
  'roads_public_spaces',
  'Roads & Public Spaces',
  'Road, footpath, streetlight or public-space issue',
  7,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  sort_order = excluded.sort_order,
  active = true;

insert into public.sources (slug, name, organization, official_url, notes, last_verified_at, active)
values
  ('mcd_online', 'Municipal Corporation of Delhi', 'Municipal Corporation of Delhi',
   'https://mcdonline.nic.in/',
   'Citizen Call Center 155305; MCD311 app; email mcd-ithelpdesk@mcd.nic.in on mcdonline.nic.in/portal/feedback. Roads/parks where MCD may apply — not all roads → MCD.',
   current_date, true),
  ('ndmc', 'New Delhi Municipal Council', 'NDMC',
   'https://www.ndmc.gov.in/',
   'Civic helpline 1533; WhatsApp 8588887773; care@ndmc.gov.in on complaints.aspx. Civil-I: roads, footpaths, parks, FOB, bus-Q shelters in NDMC area only.',
   current_date, true),
  ('pwd_delhi', 'Public Works Department Delhi', 'PWD GNCTD',
   'https://www.pwddelhi.gov.in/',
   'PWD Sewa: toll-free 1908, WhatsApp 8130188222, complaint@pwddelhi.gov.in on /sewa. PWD assets only — not all roads.',
   current_date, true),
  ('dda', 'Delhi Development Authority', 'DDA',
   'https://dda.gov.in/',
   'Grievance hub / helpline already seeded for Building. Parks/roads only when DDA context.',
   current_date, true),
  ('delhi_traffic_police', 'Delhi Traffic Police', 'Delhi Police',
   'https://traffic.delhipolice.gov.in/',
   'Contact-us: 1095 / 011-25844444; grievance.traffic@delhipolice.gov.in. Traffic management / signals / obstruction — not every pothole.',
   current_date, true),
  ('delhi_cantonment', 'Delhi Cantonment Board', 'Delhi Cantonment Board',
   'https://delhi.cantt.gov.in/',
   'Cantonment limits only. Road/park complaint phones not re-verified this pass — website only.',
   current_date, true),
  ('irrigation_flood_control', 'Irrigation & Flood Control Department', 'I&FC GNCTD',
   'https://ifc.delhi.gov.in/',
   'Waterlogging helpline 1800-11-0093. Cross-ref for road waterlogging — not automatic road owner.',
   current_date, true)
on conflict (slug) do update set
  name = excluded.name,
  organization = excluded.organization,
  official_url = excluded.official_url,
  notes = excluded.notes,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ============================================================================
-- 2) Soft-deactivate old all-roads → PWD primary / certainty rules
-- ============================================================================

update public.routing_rules r
set confidence = 'needs_confirmation',
    routing_mode = 'needs_confirmation',
    is_primary = false,
    notes = coalesce(r.notes, '') || ' [Roads phase: needs confirmation — never auto PWD/MCD]',
    active = true
from public.issue_categories c,
     public.authorities a
where r.category_id = c.id
  and r.authority_id = a.id
  and c.slug in ('roads_public_spaces', 'roads_public')
  and r.active = true
  and a.slug = 'pwd_delhi'
  and (r.is_primary = true or r.confidence = 'likely' or r.routing_mode = 'likely');

update public.routing_rules r
set confidence = 'needs_confirmation',
    routing_mode = 'needs_confirmation',
    is_primary = false,
    notes = coalesce(r.notes, '') || ' [Roads phase: needs confirmation — never auto PWD/MCD]',
    active = true
from public.issue_categories c
where r.category_id = c.id
  and c.slug in ('roads_public_spaces', 'roads_public')
  and r.active = true
  and r.issue_type_id is null
  and (r.is_primary = true or r.confidence = 'likely' or r.routing_mode = 'likely');

-- ============================================================================
-- 3) Issue types (soft language; emergency_relevant where appropriate)
-- ============================================================================

insert into public.issue_types (
  category_id, slug, name, short_description, sort_order,
  source_id, verification_status, emergency_relevant, active
)
select c.id, v.slug, v.name, v.short_description, v.sort_order,
  s.id, 'probable', v.emergency_relevant, true
from public.issue_categories c
join public.sources s on s.slug = 'mcd_online'
cross join (values
  -- Road surface
  ('pothole', 'Pothole', 'Reported pothole — authority depends on road ownership (not automatically MCD or PWD)', 1, false),
  ('road_damage', 'Road damage', 'Reported road damage — authority depends on road ownership (not automatically PWD)', 2, false),
  ('road_crack', 'Road crack / surface concern', 'Reported road crack or surface concern', 3, false),
  ('road_collapse', 'Road collapse / sinkhole concern', 'Reported road collapse or sinkhole — may be an emergency', 4, true),
  ('road_uneven_surface', 'Uneven road surface', 'Reported uneven road surface', 5, false),
  ('road_shoulder_damage', 'Road shoulder damage', 'Reported road shoulder damage', 6, false),
  -- Footpath
  ('footpath_damage', 'Footpath damage', 'Reported footpath damage — authority depends on location/ownership', 10, false),
  ('footpath_missing', 'Missing footpath', 'Reported missing footpath concern', 11, false),
  ('footpath_encroachment', 'Footpath encroachment concern', 'Reported footpath encroachment concern — soft language only', 12, false),
  ('footpath_accessibility_barrier', 'Footpath accessibility barrier', 'Reported accessibility barrier on a footpath', 13, false),
  -- Drainage on road (sparing; waterlogging cross-ref — not auto PWD)
  ('road_waterlogging', 'Waterlogging on road', 'Reported waterlogging on a road — prefer drainage / I&FC routing; not automatic road owner', 20, false),
  ('open_manhole_in_traffic', 'Open manhole in traffic', 'Reported open manhole or uncovered pit near traffic — may be an emergency', 21, true),
  -- Streetlight (link to Electricity architecture — do not invent DISCOM numbers here)
  ('roads_streetlight_outage', 'Streetlight outage (roads context)', 'Reported streetlight concern — often DISCOM/asset owner; reuse Electricity streetlight channels', 25, false),
  -- Signs / signals
  ('road_sign_missing', 'Road sign missing', 'Reported missing road sign', 30, false),
  ('road_sign_damaged', 'Road sign damaged', 'Reported damaged road sign', 31, false),
  ('road_marking_faded', 'Road marking faded', 'Reported faded road marking', 32, false),
  ('traffic_signal_not_working', 'Traffic signal not working', 'Reported traffic signal not working — Traffic Police may apply; civic if maintenance', 33, false),
  ('traffic_signal_dangerous_failure', 'Dangerous traffic signal failure', 'Reported signal failure at a dangerous junction — may be an emergency', 34, true),
  ('traffic_signal_timing_concern', 'Traffic signal timing concern', 'Reported traffic signal timing concern', 35, false),
  -- Traffic / obstruction
  ('illegal_parking', 'Illegal parking concern', 'Reported illegal parking concern — Traffic Police may apply', 40, false),
  ('traffic_obstruction', 'Traffic obstruction', 'Reported traffic obstruction — Traffic Police may apply; civic if maintenance', 41, false),
  ('unauthorized_encroachment_road', 'Road encroachment concern', 'Reported road encroachment concern — soft language only; needs confirmation', 42, false),
  ('vendor_encroachment_road', 'Vendor encroachment concern', 'Reported vendor encroachment on road/footpath — soft language only', 43, false),
  -- Parks / public space / furniture
  ('park_maintenance_concern', 'Park maintenance concern', 'Reported park maintenance concern — MCD/NDMC/DDA/DCB by context', 50, false),
  ('park_damage', 'Park damage', 'Reported park damage', 51, false),
  ('public_space_unclean', 'Public space unclean', 'Reported unclean public space', 52, false),
  ('playground_equipment_concern', 'Playground equipment concern', 'Reported playground equipment concern', 53, false),
  ('street_furniture_damaged', 'Street furniture damaged', 'Reported damaged street furniture', 54, false),
  ('bench_damaged', 'Bench damaged', 'Reported damaged public bench', 55, false),
  ('bus_shelter_damage', 'Bus shelter damage', 'Reported bus shelter damage — operator varies; do not invent; NDMC Civil-I in NDMC area', 56, false),
  -- Bridges / underpasses
  ('bridge_damage', 'Bridge damage', 'Reported bridge damage — ownership needs confirmation', 60, false),
  ('bridge_structural_danger', 'Bridge structural danger', 'Reported bridge structural danger — may be an emergency', 61, true),
  ('underpass_damage', 'Underpass damage', 'Reported underpass damage', 62, false),
  ('fob_damage', 'Foot over bridge damage', 'Reported FOB damage', 63, false),
  ('subway_damage', 'Subway / pedestrian subway damage', 'Reported pedestrian subway damage', 64, false),
  -- Road work
  ('road_cut_not_restored', 'Road cut not restored', 'Reported road cut not restored — road owner needs confirmation', 70, false),
  ('ongoing_road_work_hazard', 'Ongoing road work hazard', 'Reported hazard related to ongoing road work', 71, false),
  ('incomplete_road_repair', 'Incomplete road repair', 'Reported incomplete road repair', 72, false),
  -- Accessibility
  ('accessibility_ramp_missing', 'Accessibility ramp missing', 'Reported missing accessibility ramp', 80, false),
  ('accessibility_barrier_public_space', 'Accessibility barrier in public space', 'Reported accessibility barrier in a public space', 81, false),
  -- Cross-hazard
  ('live_wire_on_road', 'Live wire on road', 'Reported live/fallen wire on road — emergency first; prefer Electricity channels', 90, true),
  ('road_flood_hazard', 'Road flood hazard', 'Reported flooding on road with immediate danger — emergency first; prefer Water / I&FC', 91, true),
  -- Other
  ('roads_public_spaces_other', 'Other roads / public-space concern', 'Reported roads or public-space concern not listed above', 99, false)
) as v(slug, name, short_description, sort_order, emergency_relevant)
where c.slug = 'roads_public_spaces'
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  short_description = excluded.short_description,
  sort_order = excluded.sort_order,
  source_id = excluded.source_id,
  verification_status = excluded.verification_status,
  emergency_relevant = excluded.emergency_relevant,
  active = true;

-- ============================================================================
-- 4) Emergency assessment questions
-- ============================================================================

insert into public.emergency_rules (
  category_id, rule_kind, question_key, question_text, sort_order, explanation, active
)
select c.id, 'assessment_question', v.question_key, v.question_text, v.sort_order, v.explanation, true
from public.issue_categories c
cross join (values
  ('road_collapse_or_sinkhole',
   'Is there a road collapse, sinkhole, or large open void in the roadway right now?',
   1,
   'Call 112 first. Do not stand in traffic or approach the collapse.'),
  ('open_manhole_traffic',
   'Is there an open manhole or uncovered pit in the path of traffic or pedestrians with immediate danger?',
   2,
   'Call 112 first. Do not approach the manhole. Stay clear of traffic.'),
  ('live_wire_or_flood_road',
   'Is there a live/fallen wire on the road, or flooding that puts people at immediate risk?',
   3,
   'Call 112 / 101 first. Do not approach wires or enter floodwater.'),
  ('dangerous_signal_or_bridge',
   'Is a traffic signal failed at a dangerous junction, or is a bridge/FOB structurally unsafe with people at risk right now?',
   4,
   'Call 112 first. Traffic Police 1095 may help for signal/traffic management after emergency response.')
) as v(question_key, question_text, sort_order, explanation)
where c.slug = 'roads_public_spaces'
  and not exists (
    select 1 from public.emergency_rules er
    where er.category_id = c.id and er.question_key = v.question_key and er.rule_kind = 'assessment_question'
  );

-- ============================================================================
-- 5) Authorities upsert (reuse existing; refresh roads notes)
-- ============================================================================

insert into public.authorities (
  slug, name, department, government, official_website, short_description,
  source_name, source_url, source_id, last_verified_at, verification_status, active
)
select v.slug, v.name, v.department, v.government, v.official_website, v.short_description,
  s.name, s.official_url, s.id, current_date, 'probable', true
from (values
  ('mcd', 'Municipal Corporation of Delhi (MCD)', 'MCD', 'Municipal Corporation of Delhi',
   'https://mcdonline.nic.in/',
   'Candidate for MCD roads, footpaths, parks, street furniture — needs confirmation. Not all roads → MCD.',
   'mcd_online'),
  ('ndmc', 'New Delhi Municipal Council (NDMC)', 'NDMC', 'NDMC',
   'https://www.ndmc.gov.in/',
   'Candidate only in NDMC area for roads, parks, FOB, bus shelters (Civil-I) — needs confirmation.',
   'ndmc'),
  ('pwd_delhi', 'Public Works Department (PWD)', 'PWD GNCTD', 'Government of NCT of Delhi',
   'https://www.pwddelhi.gov.in/',
   'Candidate only for PWD-maintained roads / FOBs / streetlights — needs confirmation. Never all roads → PWD.',
   'pwd_delhi'),
  ('dda', 'Delhi Development Authority (DDA)', 'DDA', 'DDA',
   'https://dda.gov.in/',
   'Conditional: DDA parks / roads only when DDA context — needs confirmation.',
   'dda'),
  ('delhi_traffic_police', 'Delhi Traffic Police', 'Delhi Traffic Police', 'Delhi Police',
   'https://traffic.delhipolice.gov.in/',
   'Candidate for signals, illegal parking, traffic obstruction — NOT every pothole.',
   'delhi_traffic_police'),
  ('delhi_cantonment', 'Delhi Cantonment Board', 'Delhi Cantonment Board', 'Delhi Cantonment Board',
   'https://delhi.cantt.gov.in/',
   'Conditional: Cantonment limits only — needs confirmation.',
   'delhi_cantonment'),
  ('irrigation_flood_control', 'Irrigation & Flood Control (I&FC)', 'I&FC GNCTD', 'Government of NCT of Delhi',
   'https://ifc.delhi.gov.in/',
   'Cross-ref for road waterlogging / flood — not automatic road owner.',
   'irrigation_flood_control')
) as v(slug, name, department, government, official_website, short_description, source_slug)
join public.sources s on s.slug = v.source_slug
on conflict (slug) do update set
  name = excluded.name,
  department = excluded.department,
  official_website = excluded.official_website,
  short_description = case
    when public.authorities.slug in ('pwd_delhi', 'delhi_traffic_police', 'irrigation_flood_control')
      then excluded.short_description
    else coalesce(public.authorities.short_description, excluded.short_description)
  end,
  source_name = coalesce(excluded.source_name, public.authorities.source_name),
  source_url = coalesce(excluded.source_url, public.authorities.source_url),
  source_id = coalesce(excluded.source_id, public.authorities.source_id),
  last_verified_at = excluded.last_verified_at,
  verification_status = excluded.verification_status,
  active = true;

update public.authorities
set official_website = 'https://www.pwddelhi.gov.in/',
    last_verified_at = current_date
where slug = 'pwd_delhi';

-- ============================================================================
-- 6) Purpose-specific channels (verified only)
-- ============================================================================

-- MCD purpose phones
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, purpose, priority,
  instructions, source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'phone', v.label, '155305', '155305', v.purpose, v.priority,
  v.instructions, s.name, 'https://mcdonline.nic.in/portal/feedback', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'mcd_online'
cross join (values
  ('MCD Citizen Call Center (pothole)', 'pothole', 10,
   'Call 155305 for potholes where MCD may apply. Confirm MCD area. Not all roads → MCD. My Delhi does not submit.'),
  ('MCD Citizen Call Center (road damage)', 'road_damage', 10,
   'Call 155305 for road damage in MCD areas. Confirm ownership.'),
  ('MCD Citizen Call Center (footpath)', 'footpath', 10,
   'Call 155305 for footpath concerns in MCD areas.'),
  ('MCD Citizen Call Center (park)', 'park', 10,
   'Call 155305 for park concerns in MCD areas.'),
  ('MCD Citizen Call Center (street furniture)', 'street_furniture', 15,
   'Call 155305 for street furniture in MCD areas.'),
  ('MCD Citizen Call Center (road signage)', 'road_signage', 15,
   'Call 155305 for civic road signage in MCD areas. Traffic signals may involve Traffic Police.'),
  ('MCD Citizen Call Center (public space)', 'public_space', 15,
   'Call 155305 for public-space concerns in MCD areas.'),
  ('MCD Citizen Call Center (encroachment)', 'encroachment', 20,
   'Call 155305 for encroachment concerns in MCD areas. Soft language only — not a legal finding.'),
  ('MCD Citizen Call Center (road cut)', 'road_cut', 15,
   'Call 155305 when the road owner may be MCD. Confirm ownership.'),
  ('MCD Citizen Call Center (bridge)', 'bridge', 20,
   'Call 155305 if the bridge/FOB may be MCD-maintained. Confirm ownership.'),
  ('MCD Citizen Call Center (waterlogging — municipal)', 'waterlogging', 20,
   'Municipal drainage candidate for road waterlogging. Prefer I&FC for flood context. Not automatic PWD.'),
  ('MCD Citizen Call Center (after emergency)', 'emergency', 25,
   'If collapse / open manhole / immediate danger: call 112 first. Then 155305 when safe.'),
  ('MCD Citizen Call Center (grievance)', 'grievance', 30,
   'Call 155305 (mcdonline feedback). Confirm MCD area.')
) as v(label, purpose, priority, instructions)
where a.slug = 'mcd'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = v.purpose and c.value = '155305'
      and c.label = v.label
  );

-- Ensure MCD311 / email / feedback exist (idempotent; may already exist from Waste)
insert into public.authority_channels (
  authority_id, channel_type, label, value, email, purpose, priority,
  instructions, source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'email', 'MCD IT helpdesk email (feedback page)',
  'mcd-ithelpdesk@mcd.nic.in', 'mcd-ithelpdesk@mcd.nic.in', 'email', 40,
  'Email listed on mcdonline.nic.in/portal/feedback.',
  s.name, 'https://mcdonline.nic.in/portal/feedback', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'mcd_online'
where a.slug = 'mcd'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = 'email' and c.value = 'mcd-ithelpdesk@mcd.nic.in'
  );

insert into public.authority_channels (
  authority_id, channel_type, label, value, action_url, tracking_url, purpose, priority,
  instructions, source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'app', 'MCD311 (official app listed on mcdonline.nic.in)',
  'MCD311',
  'https://mcd.everythingcivic.com/citizen/createissue?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120',
  'https://mcd.everythingcivic.com/citizen/issuedetail?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120',
  'app', 25,
  'MCD311 named on mcdonline.nic.in/portal/feedback. My Delhi opens only; does not submit.',
  s.name, 'https://mcdonline.nic.in/portal/feedback', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'mcd_online'
where a.slug = 'mcd'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = 'app' and c.value = 'MCD311'
  );

insert into public.authority_channels (
  authority_id, channel_type, label, value, action_url, tracking_url, purpose, priority,
  instructions, source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'portal', 'MCD311 create complaint (from feedback page)',
  'https://mcd.everythingcivic.com/citizen/createissue?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120',
  'https://mcd.everythingcivic.com/citizen/createissue?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120',
  'https://mcd.everythingcivic.com/citizen/issuedetail?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120',
  'web_portal', 30,
  'Linked from mcdonline.nic.in/portal/feedback. Confirm MCD area. My Delhi does not submit.',
  s.name, 'https://mcdonline.nic.in/portal/feedback', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'mcd_online'
where a.slug = 'mcd'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = 'web_portal'
      and c.value like '%mcd.everythingcivic.com/citizen/createissue%'
  );

insert into public.authority_channels (
  authority_id, channel_type, label, value, action_url, tracking_url, purpose, priority,
  instructions, source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'portal', 'MCD311 track complaint (issuedetail)',
  'https://mcd.everythingcivic.com/citizen/issuedetail?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120',
  'https://mcd.everythingcivic.com/citizen/issuedetail?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120',
  'https://mcd.everythingcivic.com/citizen/issuedetail?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120',
  'tracking', 35,
  'Official issuedetail link from mcdonline feedback. Do not invent extra query params. MD-###### is not an MCD reference.',
  s.name, 'https://mcdonline.nic.in/portal/feedback', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'mcd_online'
where a.slug = 'mcd'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = 'tracking'
      and c.value like '%mcd.everythingcivic.com/citizen/issuedetail%'
  );

-- PWD Sewa channels (re-verified 2026-09-20)
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, email, whatsapp, purpose, priority,
  action_url, tracking_url, instructions, source_name, source_url, source_id, last_verified_at, active
)
select a.id, v.channel_type, v.label, v.value, v.phone, v.email, v.whatsapp, v.purpose, v.priority,
  v.action_url, v.tracking_url, v.instructions, s.name, 'https://www.pwddelhi.gov.in/sewa', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'pwd_delhi'
cross join (values
  ('phone', 'PWD Sewa helpline 1908 (pothole)', '1908', '1908', null::text, null::text,
   'pothole', 10, null::text, null::text,
   'Toll-free 1908 on pwddelhi.gov.in. Confirm the asset is PWD — not all roads. My Delhi does not submit.'),
  ('phone', 'PWD Sewa helpline 1908 (road damage)', '1908', '1908', null, null,
   'road_damage', 10, null, null,
   'Call 1908 for PWD-maintained road damage. Confirm ownership.'),
  ('phone', 'PWD Sewa helpline 1908 (footpath)', '1908', '1908', null, null,
   'footpath', 15, null, null,
   'Call 1908 if the footpath may be PWD. Confirm ownership.'),
  ('phone', 'PWD Sewa helpline 1908 (bridge / FOB)', '1908', '1908', null, null,
   'bridge', 10, null, null,
   'Call 1908 for PWD bridges / FOBs. Confirm ownership.'),
  ('phone', 'PWD Sewa helpline 1908 (underpass)', '1908', '1908', null, null,
   'underpass', 15, null, null,
   'Call 1908 for PWD underpasses. Confirm ownership.'),
  ('phone', 'PWD Sewa helpline 1908 (road cut)', '1908', '1908', null, null,
   'road_cut', 15, null, null,
   'Call 1908 when the road owner may be PWD. Confirm ownership.'),
  ('phone', 'PWD Sewa helpline 1908 (streetlight — PWD asset)', '1908', '1908', null, null,
   'streetlight', 20, null, null,
   'PWD site lists streetlight maintenance. Many streetlights are DISCOM — reuse Electricity streetlight channels when DISCOM applies. Confirm asset owner.'),
  ('phone', 'PWD Sewa helpline 1908 (grievance)', '1908', '1908', null, null,
   'grievance', 30, null, null,
   'General PWD Sewa helpline 1908. Confirm PWD asset.'),
  ('phone', 'PWD Sewa helpline 1908 (after emergency)', '1908', '1908', null, null,
   'emergency', 25, null, null,
   'If collapse / immediate danger: call 112 first. Then 1908 for PWD assets when safe.'),
  ('email', 'PWD complaint email', 'complaint@pwddelhi.gov.in', null, 'complaint@pwddelhi.gov.in', null,
   'email', 35, null, null,
   'complaint@pwddelhi.gov.in listed on pwddelhi.gov.in Sewa / Help Desk. Sewa portal also shows complaint@pwddelhi.com — see UNVERIFIED.'),
  ('whatsapp', 'PWD Sewa WhatsApp chatbot', '8130188222', null, null, '8130188222',
   'whatsapp', 25, null, null,
   'WhatsApp chatbot 8130188222 listed on pwddelhi.gov.in Sewa page.'),
  ('portal', 'PWD Sewa hub', 'https://www.pwddelhi.gov.in/sewa', null, null, null,
   'web_portal', 20, 'https://www.pwddelhi.gov.in/sewa', null,
   'Official PWD Sewa hub. Confirm PWD asset. My Delhi does not submit.'),
  ('portal', 'PWD Sewa submit complaint', 'https://pwdsewa.pwddelhi.gov.in/Home/SubmitComplaint/', null, null, null,
   'web_portal', 22, 'https://pwdsewa.pwddelhi.gov.in/Home/SubmitComplaint/', null,
   'PWD Sewa online submit form. Confirm PWD asset. My Delhi opens only.'),
  ('portal', 'PWD Sewa check complaint status', 'https://pwdsewa.pwddelhi.gov.in/Home/CheckComplaintStatus', null, null, null,
   'tracking', 30, 'https://pwdsewa.pwddelhi.gov.in/Home/CheckComplaintStatus',
   'https://pwdsewa.pwddelhi.gov.in/Home/CheckComplaintStatus',
   'Official status page (search by mobile / email / complaint number). Do not invent query params. MD-###### is not a PWD reference.'),
  ('app', 'PWD SEWA App', 'PWD SEWA', null, null, null,
   'app', 28, 'https://www.pwddelhi.gov.in/sewa', null,
   'PWD SEWA app linked from pwddelhi.gov.in homepage chrome. Store deep-links not separately verified — open Sewa hub.')
) as v(channel_type, label, value, phone, email, whatsapp, purpose, priority, action_url, tracking_url, instructions)
where a.slug = 'pwd_delhi'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = v.purpose and c.value = v.value
      and c.label = v.label
  );

-- NDMC purpose channels
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, email, whatsapp, purpose, priority, geography,
  action_url, instructions, source_name, source_url, source_id, last_verified_at, active
)
select a.id, v.channel_type, v.label, v.value, v.phone, v.email, v.whatsapp, v.purpose, v.priority, 'ndmc_area',
  v.action_url, v.instructions, s.name, 'https://www.ndmc.gov.in/complaints.aspx', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'ndmc'
cross join (values
  ('phone', 'NDMC helpline 1533 (pothole)', '1533', '1533', null::text, null::text,
   'pothole', 10, 'https://www.ndmc.gov.in/complaints.aspx',
   '1533 on ndmc.gov.in/complaints.aspx. NDMC area only. Confirm jurisdiction.'),
  ('phone', 'NDMC helpline 1533 (road damage)', '1533', '1533', null, null,
   'road_damage', 10, 'https://www.ndmc.gov.in/complaints.aspx',
   'Call 1533 for NDMC-area road damage. Confirm NDMC area.'),
  ('phone', 'NDMC helpline 1533 (footpath)', '1533', '1533', null, null,
   'footpath', 10, 'https://www.ndmc.gov.in/complaints.aspx',
   'Call 1533 for footpath concerns in NDMC area.'),
  ('phone', 'NDMC helpline 1533 (park)', '1533', '1533', null, null,
   'park', 10, 'https://www.ndmc.gov.in/complaints.aspx',
   'Call 1533 for parks in NDMC area (Civil-I).'),
  ('phone', 'NDMC helpline 1533 (street furniture)', '1533', '1533', null, null,
   'street_furniture', 15, 'https://www.ndmc.gov.in/complaints.aspx',
   'Call 1533 for street furniture in NDMC area.'),
  ('phone', 'NDMC helpline 1533 (bus shelter — NDMC area)', '1533', '1533', null, null,
   'bus_shelter', 15, 'https://www.ndmc.gov.in/complaints.aspx',
   'Civil-I lists Bus-Q-Shelters in NDMC area. Do not invent a city-wide bus-shelter operator. Confirm NDMC area.'),
  ('phone', 'NDMC helpline 1533 (bridge / FOB)', '1533', '1533', null, null,
   'bridge', 15, 'https://www.ndmc.gov.in/complaints.aspx',
   'Civil-I covers FOB / underpasses in NDMC area. Confirm ownership.'),
  ('phone', 'NDMC helpline 1533 (road signage)', '1533', '1533', null, null,
   'road_signage', 15, 'https://www.ndmc.gov.in/complaints.aspx',
   'Call 1533 for civic road signage in NDMC area. Traffic signals may involve Traffic Police.'),
  ('phone', 'NDMC helpline 1533 (road cut)', '1533', '1533', null, null,
   'road_cut', 15, 'https://www.ndmc.gov.in/complaints.aspx',
   'Call 1533 when the road owner may be NDMC. Confirm ownership.'),
  ('phone', 'NDMC helpline 1533 (grievance)', '1533', '1533', null, null,
   'grievance', 30, 'https://www.ndmc.gov.in/complaints.aspx',
   'General NDMC civic helpline 1533. Confirm NDMC area.'),
  ('whatsapp', 'NDMC WhatsApp (complaints.aspx)', '8588887773', null, null, '8588887773',
   'whatsapp', 25, 'https://www.ndmc.gov.in/complaints.aspx',
   'WhatsApp 8588887773 listed on ndmc.gov.in/complaints.aspx. NDMC area only.'),
  ('email', 'NDMC care email', 'care@ndmc.gov.in', null, 'care@ndmc.gov.in', null,
   'email', 35, 'https://www.ndmc.gov.in/complaints.aspx',
   'care@ndmc.gov.in listed on ndmc.gov.in/complaints.aspx.'),
  ('portal', 'NDMC complaints hub', 'https://www.ndmc.gov.in/complaints.aspx', null, null, null,
   'web_portal', 30, 'https://www.ndmc.gov.in/complaints.aspx',
   'Official NDMC complaints hub. Dedicated track-by-reference URL not verified — left NULL.'),
  ('website', 'NDMC Civil-I (roads / parks / FOB / bus shelters)',
   'https://www.ndmc.gov.in/departments/civil_i.aspx', null, null, null,
   'web_portal', 40, 'https://www.ndmc.gov.in/departments/civil_i.aspx',
   'Official Civil-I page: roads, footpaths, parks, FOB, Bus-Q-Shelters in NDMC area. Area division contacts not copied as universal numbers.')
) as v(channel_type, label, value, phone, email, whatsapp, purpose, priority, action_url, instructions)
where a.slug = 'ndmc'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = v.purpose and c.value = v.value
      and c.label = v.label
  );

-- DDA (reuse grievance; purpose for park/road)
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, email, purpose, priority,
  action_url, instructions, source_name, source_url, source_id, last_verified_at, active
)
select a.id, v.channel_type, v.label, v.value, v.phone, v.email, v.purpose, v.priority,
  v.action_url, v.instructions, s.name, 'https://dda.gov.in/grievance', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'dda'
cross join (values
  ('phone', 'DDA helpline (park / public space)', '1800110332', '1800110332', null::text,
   'park', 10, null::text,
   'DDA helpline for DDA parks / public spaces only. Confirm DDA context.'),
  ('phone', 'DDA helpline (road — DDA context)', '1800110332', '1800110332', null,
   'road_damage', 20, null,
   'Only when DDA road context. Confirm ownership.'),
  ('phone', 'DDA helpline (grievance)', '1800110332', '1800110332', null,
   'grievance', 30, null,
   'Toll-free 1800110332 listed on DDA contact / grievance materials.'),
  ('email', 'DDA Grievance Redressal email', 'dirsagr@dda.org.in', null, 'dirsagr@dda.org.in',
   'email', 35, null,
   'dirsagr@dda.org.in listed for Grievance Redressal on DDA contact page.'),
  ('portal', 'DDA grievance hub', 'https://dda.gov.in/grievance', null, null,
   'web_portal', 20, 'https://dda.gov.in/grievance',
   'Official DDA grievance hub. Dedicated tracking URL with reference query not verified — left NULL.')
) as v(channel_type, label, value, phone, email, purpose, priority, action_url, instructions)
where a.slug = 'dda'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = v.purpose and c.value = v.value
      and c.label = v.label
  );

-- Traffic Police (signals / obstruction — not every pothole)
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, email, purpose, priority,
  action_url, instructions, source_name, source_url, source_id, last_verified_at, active
)
select a.id, v.channel_type, v.label, v.value, v.phone, v.email, v.purpose, v.priority,
  v.action_url, v.instructions, s.name, 'https://traffic.delhipolice.gov.in/en/contact-us', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'delhi_traffic_police'
cross join (values
  ('phone', 'Traffic helpline 1095 (signal)', '1095', '1095', null::text,
   'traffic_signal', 5, null::text,
   '1095 listed on traffic.delhipolice.gov.in/en/contact-us. For signal / traffic management — not every pothole.'),
  ('phone', 'Traffic helpline 1095 (obstruction)', '1095', '1095', null,
   'traffic_obstruction', 5, null,
   'Use for traffic obstruction / illegal parking context. Civic maintenance may also apply.'),
  ('phone', 'Traffic control room 011-25844444', '011-25844444', '011-25844444', null,
   'phone', 15, null,
   '011-25844444 listed with 1095 on Traffic Police contact-us page.'),
  ('phone', 'Traffic helpline 1095 (emergency context)', '1095', '1095', null,
   'emergency', 10, null,
   'After calling 112 if life danger. For dangerous signal / traffic hazard management.'),
  ('email', 'Traffic grievance email', 'grievance.traffic@delhipolice.gov.in', null, 'grievance.traffic@delhipolice.gov.in',
   'email', 25, null,
   'grievance.traffic@delhipolice.gov.in listed on Traffic Police contact-us.'),
  ('website', 'Traffic Police contact us', 'https://traffic.delhipolice.gov.in/en/contact-us', null, null,
   'web_portal', 30, 'https://traffic.delhipolice.gov.in/en/contact-us',
   'Official contact page. Dedicated online complaint form deep-link not verified this pass — left NULL beyond contact page.')
) as v(channel_type, label, value, phone, email, purpose, priority, action_url, instructions)
where a.slug = 'delhi_traffic_police'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = v.purpose and c.value = v.value
      and c.label = v.label
  );

-- DCB website only
insert into public.authority_channels (
  authority_id, channel_type, label, value, action_url, purpose, priority, geography,
  instructions, source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'website', 'Delhi Cantonment Board website',
  'https://delhi.cantt.gov.in/',
  'https://delhi.cantt.gov.in/',
  'web_portal', 50, 'cantonment_only',
  'Cantonment limits only. Road/park complaint phone not re-verified this pass — open official website. My Delhi does not submit.',
  s.name, 'https://delhi.cantt.gov.in/', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'delhi_cantonment'
where a.slug = 'delhi_cantonment'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = 'web_portal'
      and c.value = 'https://delhi.cantt.gov.in/'
  );

-- I&FC waterlogging cross-ref (reuse number; purpose for roads)
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, purpose, priority,
  instructions, source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'phone', 'I&FC waterlogging helpline (road waterlogging cross-ref)',
  '1800-11-0093', '1800-11-0093', 'waterlogging', 5,
  'For road waterlogging / flood context — not the automatic road owner. Prefer Water & Drainage flow when flooding is primary. If life danger: 112 first.',
  s.name, 'https://ifc.delhi.gov.in/ifc/organizational-setup', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'irrigation_flood_control'
where a.slug = 'irrigation_flood_control'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = 'waterlogging' and c.value = '1800-11-0093'
      and c.label = 'I&FC waterlogging helpline (road waterlogging cross-ref)'
  );

-- Explicit: do NOT seed invented bus-shelter operators outside NDMC Civil-I context
-- Explicit: do NOT duplicate DISCOM streetlight phones (Electricity category owns those)

-- ============================================================================
-- 7) Authority services + official_services
-- ============================================================================

insert into public.authority_services (
  authority_id, service_name, slug, description, service_type,
  official_url, filing_url, tracking_url, phone, integration_type,
  source_id, last_verified_at, active
)
select a.id, v.service_name, v.slug, v.description, v.service_type,
  v.official_url, v.filing_url, v.tracking_url, v.phone, v.integration_type,
  s.id, current_date, true
from (values
  ('mcd', 'mcd_online',
   'MCD311 / Citizen Call Center (roads & parks)', 'mcd311_roads_public_spaces',
   '155305 and MCD311 from mcdonline feedback. Confirm MCD area for roads/footpaths/parks. My Delhi does not submit.',
   'complaint',
   'https://mcdonline.nic.in/portal/feedback',
   'https://mcd.everythingcivic.com/citizen/createissue?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120',
   'https://mcd.everythingcivic.com/citizen/issuedetail?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120',
   '155305', 'phone'),
  ('pwd_delhi', 'pwd_delhi',
   'PWD Sewa (roads / public works)', 'pwd_sewa_roads',
   'Toll-free 1908, WhatsApp 8130188222, complaint@pwddelhi.gov.in. Confirm PWD asset. My Delhi does not submit.',
   'complaint',
   'https://www.pwddelhi.gov.in/sewa',
   'https://pwdsewa.pwddelhi.gov.in/Home/SubmitComplaint/',
   'https://pwdsewa.pwddelhi.gov.in/Home/CheckComplaintStatus',
   '1908', 'phone'),
  ('ndmc', 'ndmc',
   'NDMC complaints / 1533 (roads & parks)', 'ndmc_roads_complaints',
   '1533, WhatsApp 8588887773, care@ndmc.gov.in. Civil-I roads/parks/FOB/bus shelters in NDMC area. Tracking URL not verified.',
   'complaint',
   'https://www.ndmc.gov.in/complaints.aspx',
   'https://www.ndmc.gov.in/complaints.aspx',
   null,
   '1533', 'phone'),
  ('dda', 'dda',
   'DDA grievance (parks / roads — DDA context)', 'dda_roads_parks_grievance',
   '1800110332 and dirsagr@dda.org.in via dda.gov.in/grievance. Only when DDA context.',
   'grievance',
   'https://dda.gov.in/grievance',
   'https://dda.gov.in/grievance',
   null,
   '1800110332', 'phone'),
  ('delhi_traffic_police', 'delhi_traffic_police',
   'Delhi Traffic Police citizen contact', 'traffic_citizen_services_roads',
   '1095 / 011-25844444 and grievance.traffic@delhipolice.gov.in. For signals / obstruction / parking — not every pothole.',
   'complaint',
   'https://traffic.delhipolice.gov.in/en/contact-us',
   'https://traffic.delhipolice.gov.in/en/contact-us',
   null,
   '1095', 'phone'),
  ('delhi_cantonment', 'delhi_cantonment',
   'Delhi Cantonment Board website (roads)', 'dcb_roads_website',
   'Cantonment limits only. Road/park phone not re-verified — website only.',
   'information',
   'https://delhi.cantt.gov.in/',
   null,
   null,
   null, 'deep_link'),
  ('irrigation_flood_control', 'irrigation_flood_control',
   'I&FC waterlogging helpline (road waterlogging cross-ref)', 'ifc_road_waterlogging_crossref',
   '1800-11-0093 for waterlogging/flood context — not automatic road owner.',
   'complaint',
   'https://ifc.delhi.gov.in/ifc/organizational-setup',
   null,
   null,
   '1800-11-0093', 'phone')
) as v(auth_slug, source_slug, service_name, slug, description, service_type, official_url, filing_url, tracking_url, phone, integration_type)
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where not exists (
  select 1 from public.authority_services x
  where x.authority_id = a.id and x.slug = v.slug
);

insert into public.official_services (
  slug, name, service_type, organization, authority_id, category_id,
  description, who_it_is_for, when_to_use, purpose, channel_type,
  official_url, phone, email, whatsapp, tracking_url, jurisdiction,
  source_id, last_verified_at, active
)
select v.slug, v.name, v.service_type, v.organization, a.id, c.id,
  v.description, v.who_it_is_for, v.when_to_use, v.purpose, v.channel_type,
  v.official_url, v.phone, v.email, v.whatsapp, v.tracking_url, v.jurisdiction,
  s.id, current_date, true
from public.issue_categories c
cross join (values
  ('mcd311_roads', 'MCD311 (roads & parks)', 'complaint', 'Municipal Corporation of Delhi',
   'mcd', 'mcd_online',
   'Official MCD311 / 155305 for municipal roads/parks where MCD may apply.',
   'Residents in MCD areas', 'Potholes, footpaths, parks in MCD areas — confirm ownership',
   'web_portal', 'app',
   'https://mcdonline.nic.in/portal/feedback', '155305', null, null,
   'https://mcd.everythingcivic.com/citizen/issuedetail?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120',
   'mcd_area'),
  ('ndmc311_roads', 'NDMC 1533 / complaints (roads & parks)', 'complaint', 'NDMC',
   'ndmc', 'ndmc',
   'NDMC civic helpline and complaints hub for NDMC-area roads/parks/FOB/bus shelters.',
   'Residents in NDMC area', 'Roads, parks, FOB, bus shelters in NDMC area',
   'phone', 'phone',
   'https://www.ndmc.gov.in/complaints.aspx', '1533', 'care@ndmc.gov.in', '8588887773',
   null, 'ndmc_area'),
  ('pwd_sewa_official', 'PWD Sewa', 'complaint', 'PWD GNCTD',
   'pwd_delhi', 'pwd_delhi',
   'PWD Sewa for PWD-maintained roads and public works. Confirm PWD asset.',
   'Anyone reporting a PWD asset concern', 'PWD roads / FOBs / streetlights — confirm ownership',
   'web_portal', 'phone',
   'https://www.pwddelhi.gov.in/sewa', '1908', 'complaint@pwddelhi.gov.in', '8130188222',
   'https://pwdsewa.pwddelhi.gov.in/Home/CheckComplaintStatus', 'pwd_assets'),
  ('traffic_citizen_services', 'Delhi Traffic Police citizen contact', 'complaint', 'Delhi Traffic Police',
   'delhi_traffic_police', 'delhi_traffic_police',
   '1095 / contact-us for traffic signals, obstruction, illegal parking — not every pothole.',
   'Anyone with a traffic-management concern', 'Signals, obstruction, illegal parking',
   'traffic_signal', 'phone',
   'https://traffic.delhipolice.gov.in/en/contact-us', '1095', 'grievance.traffic@delhipolice.gov.in', null,
   null, 'delhi')
) as v(slug, name, service_type, organization, auth_slug, source_slug, description, who_it_is_for, when_to_use, purpose, channel_type, official_url, phone, email, whatsapp, tracking_url, jurisdiction)
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where c.slug = 'roads_public_spaces'
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  official_url = excluded.official_url,
  phone = excluded.phone,
  email = excluded.email,
  whatsapp = excluded.whatsapp,
  tracking_url = excluded.tracking_url,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ============================================================================
-- 8) Routing — ALL needs_confirmation
-- ============================================================================

insert into public.routing_rules (
  category_id, authority_id, source_id, confidence, routing_mode, is_primary, notes, active
)
select c.id, a.id, s.id, 'needs_confirmation', 'needs_confirmation', false, v.notes, true
from public.issue_categories c
cross join (values
  ('mcd', 'mcd_online',
   'Candidate for MCD roads / footpaths / parks — needs confirmation. Not all roads → MCD.'),
  ('pwd_delhi', 'pwd_delhi',
   'Candidate only for PWD-maintained assets — needs confirmation. Never all roads → PWD.'),
  ('ndmc', 'ndmc',
   'Candidate only in NDMC area — needs confirmation.'),
  ('dda', 'dda',
   'Conditional: DDA parks / roads only when DDA context.'),
  ('delhi_traffic_police', 'delhi_traffic_police',
   'Candidate for signals / obstruction / parking — NOT every pothole.'),
  ('delhi_cantonment', 'delhi_cantonment',
   'Conditional alternative inside Cantonment limits.'),
  ('irrigation_flood_control', 'irrigation_flood_control',
   'Cross-ref for road waterlogging / flood — not automatic road owner.')
) as v(auth_slug, source_slug, notes)
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where c.slug = 'roads_public_spaces'
  and not exists (
    select 1 from public.routing_rules r
    where r.category_id = c.id and r.authority_id = a.id and r.issue_type_id is null and r.active = true
  );

insert into public.routing_rules (
  category_id, issue_type_id, authority_id, source_id,
  confidence, routing_mode, is_primary, notes, active
)
select c.id, t.id, a.id, s.id,
  'needs_confirmation', 'needs_confirmation', false, v.notes, true
from public.issue_categories c
cross join (values
  -- Pothole / road damage → MCD / PWD / NDMC / DDA / DCB
  ('pothole', 'mcd', 'mcd_online', 'Pothole: MCD candidate if MCD road — needs confirmation.'),
  ('pothole', 'pwd_delhi', 'pwd_delhi', 'Pothole: PWD alternative if PWD road — needs confirmation.'),
  ('pothole', 'ndmc', 'ndmc', 'Pothole: NDMC if NDMC area.'),
  ('pothole', 'dda', 'dda', 'Pothole: DDA only if DDA road context.'),
  ('pothole', 'delhi_cantonment', 'delhi_cantonment', 'Pothole: Cantonment if Cantonment limits.'),
  ('road_damage', 'mcd', 'mcd_online', 'Road damage: MCD candidate — needs confirmation.'),
  ('road_damage', 'pwd_delhi', 'pwd_delhi', 'Road damage: PWD alternative — needs confirmation.'),
  ('road_damage', 'ndmc', 'ndmc', 'Road damage: NDMC if NDMC area.'),
  ('road_damage', 'dda', 'dda', 'Road damage: DDA if DDA context.'),
  ('road_crack', 'mcd', 'mcd_online', 'Road crack: civic owner candidate — needs confirmation.'),
  ('road_crack', 'pwd_delhi', 'pwd_delhi', 'Road crack: PWD alternative — needs confirmation.'),
  ('road_collapse', 'mcd', 'mcd_online', 'Road collapse: emergency 112 first; municipal secondary when safe.'),
  ('road_collapse', 'pwd_delhi', 'pwd_delhi', 'Road collapse: emergency first; PWD if PWD asset.'),
  -- Footpath → civic owner
  ('footpath_damage', 'mcd', 'mcd_online', 'Footpath: MCD candidate — needs confirmation.'),
  ('footpath_damage', 'ndmc', 'ndmc', 'Footpath: NDMC if NDMC area.'),
  ('footpath_damage', 'pwd_delhi', 'pwd_delhi', 'Footpath: PWD if PWD asset.'),
  ('footpath_damage', 'dda', 'dda', 'Footpath: DDA if DDA context.'),
  ('footpath_missing', 'mcd', 'mcd_online', 'Missing footpath: civic owner — needs confirmation.'),
  ('footpath_encroachment', 'mcd', 'mcd_online', 'Footpath encroachment: municipal candidate — needs confirmation.'),
  ('footpath_encroachment', 'ndmc', 'ndmc', 'Footpath encroachment: NDMC if NDMC area.'),
  -- Traffic signal / parking / obstruction → Traffic Police (+ civic if maintenance)
  ('traffic_signal_not_working', 'delhi_traffic_police', 'delhi_traffic_police',
   'Traffic signal: Traffic Police candidate. Civic may apply for maintenance ownership.'),
  ('traffic_signal_not_working', 'pwd_delhi', 'pwd_delhi',
   'Traffic signal maintenance: PWD alternative if PWD asset — needs confirmation.'),
  ('traffic_signal_not_working', 'mcd', 'mcd_online',
   'Traffic signal: municipal alternative if civic asset — needs confirmation.'),
  ('traffic_signal_dangerous_failure', 'delhi_traffic_police', 'delhi_traffic_police',
   'Dangerous signal failure: 112 first; then Traffic Police 1095.'),
  ('illegal_parking', 'delhi_traffic_police', 'delhi_traffic_police',
   'Illegal parking: Traffic Police candidate — needs confirmation.'),
  ('traffic_obstruction', 'delhi_traffic_police', 'delhi_traffic_police',
   'Traffic obstruction: Traffic Police candidate. Civic if maintenance.'),
  ('traffic_obstruction', 'mcd', 'mcd_online',
   'Traffic obstruction: municipal alternative if civic maintenance — needs confirmation.'),
  ('unauthorized_encroachment_road', 'mcd', 'mcd_online',
   'Encroachment: municipal candidate — needs confirmation. Soft language only.'),
  ('unauthorized_encroachment_road', 'delhi_traffic_police', 'delhi_traffic_police',
   'Encroachment with traffic impact: Traffic Police alternative.'),
  -- Park → MCD/NDMC/DDA/DCB
  ('park_maintenance_concern', 'mcd', 'mcd_online', 'Park: MCD candidate — needs confirmation.'),
  ('park_maintenance_concern', 'ndmc', 'ndmc', 'Park: NDMC if NDMC area.'),
  ('park_maintenance_concern', 'dda', 'dda', 'Park: DDA if DDA park context.'),
  ('park_maintenance_concern', 'delhi_cantonment', 'delhi_cantonment', 'Park: Cantonment if Cantonment limits.'),
  ('park_damage', 'mcd', 'mcd_online', 'Park damage: MCD candidate — needs confirmation.'),
  ('park_damage', 'ndmc', 'ndmc', 'Park damage: NDMC if NDMC area.'),
  ('park_damage', 'dda', 'dda', 'Park damage: DDA if DDA context.'),
  ('bus_shelter_damage', 'ndmc', 'ndmc',
   'Bus shelter: NDMC Civil-I in NDMC area only. Do not invent city-wide operator. Needs confirmation.'),
  ('bus_shelter_damage', 'mcd', 'mcd_online',
   'Bus shelter: municipal alternative only if MCD context verified — needs confirmation. Do not invent operator.'),
  -- Open manhole → safety + municipal/utility
  ('open_manhole_in_traffic', 'mcd', 'mcd_online',
   'Open manhole: 112 first; then municipal candidate — needs confirmation.'),
  ('open_manhole_in_traffic', 'ndmc', 'ndmc',
   'Open manhole: 112 first; NDMC if NDMC area.'),
  -- Road waterlogging → I&FC / municipal / water — NOT auto PWD
  ('road_waterlogging', 'irrigation_flood_control', 'irrigation_flood_control',
   'Road waterlogging: I&FC helpline may apply — not automatic road owner / PWD.'),
  ('road_waterlogging', 'mcd', 'mcd_online',
   'Road waterlogging: municipal drainage candidate — needs confirmation.'),
  ('road_waterlogging', 'ndmc', 'ndmc',
   'Road waterlogging: NDMC if NDMC area.'),
  ('road_waterlogging', 'pwd_delhi', 'pwd_delhi',
   'Road waterlogging: PWD only if PWD road asset confirmed — never auto-primary.'),
  -- Road cut not restored → road owner + needs_confirmation
  ('road_cut_not_restored', 'mcd', 'mcd_online',
   'Road cut not restored: road owner candidate (MCD) — needs confirmation.'),
  ('road_cut_not_restored', 'pwd_delhi', 'pwd_delhi',
   'Road cut not restored: PWD if PWD road — needs confirmation.'),
  ('road_cut_not_restored', 'ndmc', 'ndmc',
   'Road cut not restored: NDMC if NDMC area.'),
  -- Streetlight → note Electricity; light civic/PWD candidates only
  ('roads_streetlight_outage', 'pwd_delhi', 'pwd_delhi',
   'Streetlight: PWD if PWD asset. Prefer Electricity DISCOM streetlight channels when DISCOM applies — do not duplicate DISCOM phones here.'),
  ('roads_streetlight_outage', 'mcd', 'mcd_online',
   'Streetlight: municipal candidate only if civic asset — needs confirmation. Prefer Electricity flow for DISCOM streetlights.'),
  ('roads_streetlight_outage', 'ndmc', 'ndmc',
   'Streetlight: NDMC electricity/civic if NDMC area — prefer Electricity NDMC channels when applicable.'),
  -- Bridges
  ('bridge_damage', 'pwd_delhi', 'pwd_delhi', 'Bridge: PWD candidate if PWD asset — needs confirmation.'),
  ('bridge_damage', 'mcd', 'mcd_online', 'Bridge: MCD alternative — needs confirmation.'),
  ('bridge_damage', 'ndmc', 'ndmc', 'Bridge/FOB: NDMC Civil-I if NDMC area.'),
  ('bridge_structural_danger', 'pwd_delhi', 'pwd_delhi', 'Bridge danger: 112 first; then PWD if PWD asset.'),
  ('fob_damage', 'pwd_delhi', 'pwd_delhi', 'FOB: PWD candidate — needs confirmation.'),
  ('fob_damage', 'ndmc', 'ndmc', 'FOB: NDMC Civil-I if NDMC area.'),
  ('underpass_damage', 'pwd_delhi', 'pwd_delhi', 'Underpass: PWD candidate — needs confirmation.'),
  ('underpass_damage', 'ndmc', 'ndmc', 'Underpass: NDMC if NDMC area.'),
  -- Live wire / flood cross-hazard
  ('live_wire_on_road', 'pwd_delhi', 'pwd_delhi',
   'Live wire: 112/101 first. Prefer Electricity DISCOM emergency. Civic secondary only.'),
  ('road_flood_hazard', 'irrigation_flood_control', 'irrigation_flood_control',
   'Road flood: 112 first; I&FC waterlogging helpline — prefer Water & Drainage flow.')
) as v(issue_slug, auth_slug, source_slug, notes)
join public.issue_types t on t.slug = v.issue_slug
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where c.slug = 'roads_public_spaces'
  and t.category_id = c.id
  and not exists (
    select 1 from public.routing_rules r
    where r.category_id = c.id and r.issue_type_id = t.id and r.authority_id = a.id and r.active = true
  );

-- ============================================================================
-- 9) Citizen rights + knowledge
-- ============================================================================

insert into public.citizen_rights (
  slug, title, short_description, detailed_description, category_id,
  right_type, who_can_use, when_it_applies, conditions,
  what_citizen_can_do, what_authority_must_do, time_limit,
  possible_remedy, possible_compensation, escalation_available,
  official_action_url, source_id, source_title, last_verified_at, active
)
select v.slug, v.title, v.short_description, v.detailed_description, c.id,
  v.right_type, v.who_can_use, v.when_it_applies, v.conditions,
  v.what_citizen_can_do, v.what_authority_must_do, v.time_limit,
  v.possible_remedy, null, false,
  v.official_action_url, s.id, v.source_title, current_date, true
from public.issue_categories c
cross join (values
  ('roads_report_pothole_correct_owner',
   'Report a pothole to the correct road owner',
   'A pothole is not always MCD or PWD.',
   'Road ownership in Delhi may be MCD, PWD, NDMC, DDA or Cantonment. GPS alone does not prove ownership. My Delhi helps open official channels — it does not submit.',
   'civic_reporting', 'Anyone reporting a road surface concern', 'When reporting a pothole or road damage',
   'Confirm likely ownership using local knowledge / official maps when available — never invent jurisdiction from GPS.',
   'Use MCD311 / 155305, PWD Sewa 1908, NDMC 1533, or DDA grievance as appropriate after confirmation.',
   'Follow the authority''s own service standard — My Delhi does not invent repair timelines.',
   'See current official service standard — not invented here.',
   'Official complaint reference from the authority (not MD-######).',
   'https://mcdonline.nic.in/portal/feedback', 'mcd_online', 'MCD Online feedback'),
  ('roads_traffic_vs_maintenance',
   'Distinguish traffic management from road maintenance',
   'Traffic Police is not for every pothole.',
   'Delhi Traffic Police (1095) handles traffic management, signals and obstruction. Road/footpath repair usually goes to the civic road owner.',
   'guidance', 'Anyone reporting a roads concern', 'When choosing between Traffic Police and civic channels',
   'Use Traffic Police for signals / illegal parking / obstruction; use civic owner for potholes / footpaths / parks.',
   'Call 1095 or use Traffic contact-us for traffic issues; use MCD/PWD/NDMC/DDA for maintenance.',
   null, null, null,
   'https://traffic.delhipolice.gov.in/en/contact-us', 'delhi_traffic_police', 'Delhi Traffic Police contact'),
  ('roads_keep_official_reference',
   'Keep the official reference number',
   'MD-###### is not an official government reference.',
   'Save the reference the authority gives you (MCD311 / PWD Sewa / NDMC / Traffic). Track only via official status pages.',
   'tracking', 'Anyone who filed via an official channel', 'After filing with an authority',
   'Do not treat My Delhi case IDs as government references.',
   'Copy the official reference into My Delhi for your records. Track via MCD311 issuedetail or PWD Sewa CheckComplaintStatus when applicable.',
   null, null, 'Official status page using the authority''s reference',
   'https://pwdsewa.pwddelhi.gov.in/Home/CheckComplaintStatus', 'pwd_delhi', 'PWD Sewa status'),
  ('roads_manual_location',
   'Describe incident location carefully',
   'Current GPS is not the same as incident location.',
   'Evidence and location are optional. Prefer landmark / road name / locality. GPS alone does not assign authority.',
   'guidance', 'Anyone preparing a roads report', 'When preparing location details',
   'Do not stand in traffic or approach open manholes to capture evidence.',
   'Enter landmark and address manually if needed. Skip evidence if unsafe.',
   null, null, null,
   'https://www.pwddelhi.gov.in/sewa', 'pwd_delhi', 'PWD Sewa')
) as v(slug, title, short_description, detailed_description, right_type, who_can_use, when_it_applies, conditions, what_citizen_can_do, what_authority_must_do, time_limit, possible_remedy, official_action_url, source_slug, source_title)
join public.sources s on s.slug = v.source_slug
where c.slug = 'roads_public_spaces'
on conflict (slug) do update set
  title = excluded.title,
  short_description = excluded.short_description,
  detailed_description = excluded.detailed_description,
  category_id = excluded.category_id,
  last_verified_at = excluded.last_verified_at,
  active = true;

insert into public.citizen_knowledge (
  slug, title, what_people_often_miss, who_it_applies_to, when_it_applies,
  what_you_can_do, what_you_may_need, possible_remedy,
  category_id, official_portal_url, tracking_method,
  source_id, source_title, last_verified_at, sort_order, active
)
select v.slug, v.title, v.what_people_often_miss, v.who_it_applies_to, v.when_it_applies,
  v.what_you_can_do, v.what_you_may_need, v.possible_remedy,
  c.id, v.official_portal_url, v.tracking_method,
  s.id, v.source_title, current_date, v.sort_order, true
from public.issue_categories c
cross join (values
  ('roads_pothole_not_always_mcd',
   'A pothole is not always MCD',
   'People often assume every pothole goes to MCD or PWD.',
   'Anyone reporting road damage',
   'Before choosing an authority',
   'Use jurisdiction chips (MCD / PWD / NDMC / DDA / Traffic Police / Not sure). Confirm ownership when possible.',
   'Landmark, road name, photos (optional, only if safe)',
   'Official complaint with the correct road owner',
   'https://mcdonline.nic.in/portal/feedback', 'Authority reference via MCD311 / PWD Sewa / NDMC',
   'mcd_online', 'MCD Online feedback', 10),
  ('roads_traffic_vs_maintenance',
   'Traffic Police vs road maintenance',
   'Traffic Police is not the default for every pothole.',
   'Anyone choosing between 1095 and civic helplines',
   'When the issue is signal / parking / obstruction vs surface repair',
   'Use 1095 for traffic management; use civic owner for potholes and footpaths.',
   'Clear description of whether the issue is traffic or maintenance',
   null,
   'https://traffic.delhipolice.gov.in/en/contact-us', null,
   'delhi_traffic_police', 'Delhi Traffic Police contact', 20),
  ('roads_waterlogging_crossref',
   'Water on the road is often drainage',
   'Road waterlogging is not automatic PWD.',
   'Anyone reporting water on a road',
   'When flooding / drainage is the main problem',
   'Prefer I&FC 1800-11-0093 / municipal drainage / Water & Drainage category. Do not auto-pick PWD.',
   'Location after rain; whether people are at risk',
   null,
   'https://ifc.delhi.gov.in/ifc/organizational-setup', null,
   'irrigation_flood_control', 'I&FC', 30),
  ('roads_streetlight_reuse_electricity',
   'Streetlights often follow electricity',
   'Many streetlights are DISCOM-maintained.',
   'Anyone reporting a streetlight outage',
   'When the asset owner is unclear',
   'Prefer Electricity category DISCOM streetlight channels when DISCOM applies. PWD Sewa 1908 only if PWD streetlight asset.',
   'DISCOM name from bill if known',
   null,
   'https://www.pwddelhi.gov.in/sewa', null,
   'pwd_delhi', 'PWD Sewa', 40),
  ('roads_keep_reference_manual_location',
   'Keep official reference; enter location carefully',
   'MD-###### is internal only. Current GPS ≠ incident location.',
   'Anyone preparing or tracking a roads report',
   'After opening an official channel',
   'Save the authority''s reference. Enter landmark manually. Skip unsafe evidence.',
   'Official reference number',
   'Track via official status page only',
   'https://pwdsewa.pwddelhi.gov.in/Home/CheckComplaintStatus',
   'PWD Sewa CheckComplaintStatus or MCD311 issuedetail',
   'pwd_delhi', 'PWD Sewa status', 50)
) as v(slug, title, what_people_often_miss, who_it_applies_to, when_it_applies, what_you_can_do, what_you_may_need, possible_remedy, official_portal_url, tracking_method, source_slug, source_title, sort_order)
join public.sources s on s.slug = v.source_slug
where c.slug = 'roads_public_spaces'
on conflict (slug) do update set
  title = excluded.title,
  what_people_often_miss = excluded.what_people_often_miss,
  what_you_can_do = excluded.what_you_can_do,
  category_id = excluded.category_id,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- Escalation: only verified contact pages (no invented timelines)
insert into public.escalation_paths (
  slug, authority_id, category_id, level_order, level_name, description,
  action_url, phone, email, conditions, source_id, last_verified_at, active
)
select v.slug, a.id, c.id, v.level_order, v.level_name, v.description,
  v.action_url, v.phone, v.email, v.conditions, s.id, current_date, true
from public.issue_categories c
cross join (values
  ('roads_mcd_first_line', 'mcd', 'mcd_online', 1, 'MCD311 / 155305',
   'First-line municipal channel for MCD-area roads/parks.',
   'https://mcdonline.nic.in/portal/feedback', '155305', null,
   'Confirm MCD area / ownership first.'),
  ('roads_pwd_sewa_first_line', 'pwd_delhi', 'pwd_delhi', 1, 'PWD Sewa 1908',
   'First-line for confirmed PWD assets.',
   'https://www.pwddelhi.gov.in/sewa', '1908', 'complaint@pwddelhi.gov.in',
   'Confirm the asset is PWD before escalating here.'),
  ('roads_ndmc_first_line', 'ndmc', 'ndmc', 1, 'NDMC 1533 / complaints',
   'First-line for NDMC-area roads/parks.',
   'https://www.ndmc.gov.in/complaints.aspx', '1533', 'care@ndmc.gov.in',
   'Confirm NDMC area.'),
  ('roads_traffic_first_line', 'delhi_traffic_police', 'delhi_traffic_police', 1, 'Traffic helpline 1095',
   'First-line for traffic signals / obstruction / illegal parking.',
   'https://traffic.delhipolice.gov.in/en/contact-us', '1095', 'grievance.traffic@delhipolice.gov.in',
   'Not for every pothole. Use civic owner for maintenance.')
) as v(slug, auth_slug, source_slug, level_order, level_name, description, action_url, phone, email, conditions)
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where c.slug = 'roads_public_spaces'
on conflict (slug) do update set
  description = excluded.description,
  action_url = excluded.action_url,
  phone = excluded.phone,
  email = excluded.email,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ============================================================================
-- Optional smoke checks (commented)
-- ============================================================================
-- select slug, name, emergency_relevant, active
-- from public.issue_types
-- where category_id = (select id from public.issue_categories where slug = 'roads_public_spaces')
--   and active = true
-- order by sort_order;
--
-- select a.slug as authority, c.purpose, c.channel_type, c.label, c.value
-- from public.authority_channels c
-- join public.authorities a on a.id = c.authority_id
-- where a.slug in ('mcd','pwd_delhi','ndmc','dda','delhi_traffic_police','delhi_cantonment','irrigation_flood_control')
--   and c.active = true
-- order by a.slug, c.priority, c.purpose;
--
-- select count(*) filter (where c.slug = 'roads_public_spaces') as roads_routing
-- from public.routing_rules r
-- join public.issue_categories c on c.id = r.category_id
-- where r.active = true;
