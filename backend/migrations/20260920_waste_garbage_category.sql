-- My Delhi — Waste & Garbage category ONLY
-- Prefer AFTER Water & Drainage (idempotent re-run OK).
-- Also runnable AFTER supabase/FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql.
-- Does NOT delete Building / Construction / Electricity / Water & Drainage / Fire Safety data.
-- Does NOT invent portals/phones. My Delhi opens official URLs only — never submits.
-- MD-###### remains internal — never an official government reference.
-- NEVER auto-assign all waste → MCD or all → DPCC. NEVER determine authority from GPS alone.
-- Burning fire emergency → 112/101 first. DPCC burning WhatsApp only for leaf/garbage burning purpose.
-- Verified 2026-09-20: mcdonline.nic.in/portal/feedback; NDMC complaints (prior); Green Delhi;
-- DPCC functions page text (WhatsApp 9717593574 for leave/garbage burning — live fetch 500, snippet reconfirmed);
-- PIB SWM Rules 2026; DCB website only (waste phones NULL).

create extension if not exists "pgcrypto";

-- ============================================================================
-- 0) Schema prerequisites — MUST stay before any INSERT/COMMENT using these columns
-- ============================================================================

alter table public.issue_types
  add column if not exists emergency_relevant boolean not null default false;

comment on column public.issue_types.emergency_relevant is
  'When true, prioritize emergency contacts (112/101) and hazard channels before normal complaint portals.';

-- Extend authority_channels for reason-specific routing (additive; safe if prior categories ran)
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
  'Reason-specific channel purpose: garbage_collection, missed_collection, dumping, littering, burning, plastic_waste, cd_waste, hazardous_waste, biomedical_waste, e_waste, public_health, emergency, grievance, tracking, app, whatsapp, phone, email, web_portal, etc.';

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

-- Optional draft hint column on reports (citizen-selected waste jurisdiction — not GPS proof)
alter table public.reports
  add column if not exists waste_jurisdiction_hint text;

comment on column public.reports.waste_jurisdiction_hint is
  'Citizen-selected waste jurisdiction hint: mcd|ndmc|cantonment|dpcc_env|unknown — never inferred from GPS alone.';

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
  'waste_garbage',
  'Waste & Garbage',
  'Garbage collection, dumping, burning, segregation and related waste concerns',
  6,
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
   'Citizen Call Center 155305; MCD311 app; email mcd-ithelpdesk@mcd.nic.in on mcdonline.nic.in/portal/feedback. Use for MSW/collection/dumping/malba where MCD may apply — not all waste → MCD.',
   current_date, true),
  ('ndmc', 'New Delhi Municipal Council', 'NDMC',
   'https://www.ndmc.gov.in/',
   'Civic helpline 1533; WhatsApp 8588887773; care@ndmc.gov.in on complaints.aspx. Sanitation area contacts are geography-specific — NOT universal officer numbers.',
   current_date, true),
  ('delhi_cantonment', 'Delhi Cantonment Board', 'Delhi Cantonment Board',
   'https://delhi.cantt.gov.in/',
   'Cantonment limits only. Waste-specific complaint phones/portals not verified this pass — website only.',
   current_date, true),
  ('dpcc', 'Delhi Pollution Control Committee', 'DPCC',
   'https://www.dpcc.delhigovt.nic.in/',
   'Solid waste / plastic / C&D / hazardous / biomedical regulatory pages. Not a municipal collection desk. Not all waste → DPCC.',
   current_date, true),
  ('green_delhi_app', 'Green Delhi App', 'DPCC / Department of Environment and Forests GNCTD',
   'https://greendelhi.nic.in/',
   'Official Green Delhi portal for pollution-related complaints (including garbage burning in DPCC public materials). Tracking inside portal after login — no separate public tracking_url.',
   current_date, true),
  ('cpcb_waste_rules', 'CPCB Waste Management Rules', 'Central Pollution Control Board',
   'https://cpcb.nic.in/rules-7/',
   'Knowledge/rights: SWM Rules 2026 notified (PIB; in force from 2026-04-01). DPCC solid-waste page may still list 2016 materials — do not invent penalties.',
   current_date, true)
on conflict (slug) do update set
  name = excluded.name,
  organization = excluded.organization,
  official_url = excluded.official_url,
  notes = excluded.notes,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ============================================================================
-- 2) Soft-deactivate conflicting old Phase-2 waste shells (do not delete)
-- ============================================================================

-- Keep garbage_dumping / overflowing_bin but refresh via upsert below.
-- Soft-deactivate any old category-level certainty that all waste → MCD.
update public.routing_rules r
set confidence = 'needs_confirmation',
    routing_mode = 'needs_confirmation',
    is_primary = false,
    notes = coalesce(r.notes, '') || ' [Waste phase: needs confirmation — never auto MCD/DPCC]',
    active = true
from public.issue_categories c
where r.category_id = c.id
  and c.slug = 'waste_garbage'
  and r.active = true
  and (r.is_primary = true or r.confidence = 'likely' or r.routing_mode = 'likely');

-- ============================================================================
-- 3) Waste & Garbage issue types
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
  -- Collection
  ('missed_garbage_collection',
   'Missed garbage collection',
   'Reported concern that scheduled garbage collection was missed',
   1, false),
  ('irregular_garbage_collection',
   'Irregular garbage collection',
   'Reported concern about irregular garbage collection',
   2, false),
  ('overflowing_bin',
   'Overflowing bin',
   'Reported overflowing waste bin — may create a sanitation concern',
   3, false),
  ('garbage_not_collected',
   'Garbage not collected',
   'Reported concern that garbage was not collected from a location',
   4, false),
  ('community_bin_issue',
   'Community bin issue',
   'Reported concern about a community / dhalao / public bin',
   5, false),
  ('door_to_door_collection_issue',
   'Door-to-door collection issue',
   'Reported concern about door-to-door waste collection',
   6, false),
  -- Segregation
  ('waste_segregation_not_followed',
   'Segregation not followed',
   'Reported concern that waste segregation at source may not be followed',
   7, false),
  ('mixed_waste_concern',
   'Mixed waste concern',
   'Reported concern about mixed / unsegregated waste',
   8, false),
  ('wet_dry_segregation_concern',
   'Wet / dry segregation concern',
   'Reported concern about wet and dry waste segregation',
   9, false),
  -- Dumping & littering
  ('garbage_dumping',
   'Garbage dumping',
   'Reported garbage dumping or unclean spot (authority needs confirmation)',
   10, false),
  ('open_garbage_dump',
   'Open garbage dump',
   'Reported open garbage dump — may create a sanitation concern',
   11, false),
  ('littering_public_place',
   'Littering in public place',
   'Reported littering in a public place',
   12, false),
  -- Burning
  ('garbage_burning',
   'Garbage burning',
   'Reported garbage / open waste burning — municipal and/or DPCC burning channels; fire → 112/101 first',
   13, false),
  ('leaf_burning',
   'Leaf burning',
   'Reported leaf / garden-waste burning — DPCC burning channel if verified; fire → 112/101 first',
   14, false),
  ('large_waste_burning_fire',
   'Large waste burning / fire',
   'Large burning or fire involving waste — call 112/101 first; do not approach',
   15, true),
  ('waste_fire_hazard',
   'Waste fire hazard',
   'Reported fire hazard involving waste — emergency services first',
   16, true),
  -- Plastic
  ('plastic_waste_dumping',
   'Plastic waste dumping',
   'Reported plastic waste dumping (municipal dumping + DPCC compliance alternative)',
   17, false),
  ('plastic_littering',
   'Plastic littering',
   'Reported plastic littering in a public place',
   18, false),
  ('plastic_waste_compliance_concern',
   'Plastic waste compliance concern',
   'Reported plastic-waste rule / compliance concern — DPCC may apply; not automatic municipal collection',
   19, false),
  -- C&D / malba
  ('malba_dumping',
   'Malba / debris dumping',
   'Reported malba or construction debris dumping (municipal dumping + DPCC C&D alternative)',
   20, false),
  ('cd_waste_dumping',
   'C&D waste dumping',
   'Reported construction & demolition waste dumping — authority needs confirmation',
   21, false),
  ('cd_waste_roadside',
   'C&D waste on roadside',
   'Reported C&D waste left on road or public area',
   22, false),
  -- E-waste
  ('e_waste_dumping',
   'E-waste dumping',
   'Reported e-waste dumping — not auto municipal collection; use authorized / DPCC routes when verified',
   23, false),
  ('e_waste_disposal_concern',
   'E-waste disposal concern',
   'Reported e-waste disposal concern — authorized channel only when verified',
   24, false),
  -- Hazardous / biomedical
  ('hazardous_waste_concern',
   'Hazardous waste concern',
   'Reported hazardous-waste concern — do not approach; DPCC/authorized routes only when verified',
   25, false),
  ('biomedical_waste_concern',
   'Biomedical waste concern',
   'Reported biomedical-waste concern — do not approach; authorized routes only when verified',
   26, false),
  ('sharps_exposure_hazard',
   'Sharps / needle exposure hazard',
   'Reported sharps or needle exposure hazard — stay away; emergency if someone is injured',
   27, true),
  -- Bulk
  ('bulk_waste_not_collected',
   'Bulk waste not collected',
   'Reported concern that bulk waste was not collected',
   28, false),
  ('bulk_waste_dumping',
   'Bulk waste dumping',
   'Reported bulk waste dumping',
   29, false),
  -- Facility
  ('dhalao_facility_concern',
   'Dhalao / facility concern',
   'Reported concern about a dhalao or waste facility',
   30, false),
  ('waste_processing_facility_concern',
   'Waste processing facility concern',
   'Reported concern about a waste processing facility — regulatory channel may differ from collection',
   31, false),
  -- Public health (soft language — no disease diagnosis)
  ('sanitation_public_health_concern',
   'Sanitation / public-health concern',
   'Reported sanitation concern that may create a public-health risk — not a medical diagnosis',
   32, false),
  ('stagnant_waste_odour_concern',
   'Stagnant waste / odour concern',
   'Reported stagnant waste or strong odour — may create a sanitation concern',
   33, false),
  ('dead_animal_removal',
   'Dead animal removal',
   'Reported need for dead-animal removal (municipal channel where applicable)',
   34, false),
  -- Other
  ('waste_garbage_other',
   'Something else (waste & garbage)',
   'Other reported waste/garbage concern — authority still needs confirmation',
   35, false)
) as v(slug, name, short_description, sort_order, emergency_relevant)
where c.slug = 'waste_garbage'
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  sort_order = excluded.sort_order,
  source_id = excluded.source_id,
  verification_status = excluded.verification_status,
  emergency_relevant = excluded.emergency_relevant,
  active = true,
  category_id = excluded.category_id;

-- ============================================================================
-- 4) Emergency assessment questions + signals
-- ============================================================================

insert into public.emergency_rules
  (category_id, rule_kind, question_key, question_text, condition, emergency_level,
   explanation, sort_order, source_name, source_url, last_verified_at, active)
select c.id, 'assessment_question', v.question_key, v.question_text, 'yes_means_emergency', 'high',
  v.explanation, v.sort_order, 'My Delhi Waste & Garbage safety guidance', null, current_date, true
from public.issue_categories c
cross join (values
  ('active_waste_fire',
   'Is there an active fire, large burning pile, or spreading flames involving waste right now?',
   'Call 112 / 101 first. Do not approach the fire. Municipal / DPCC burning channels are secondary after emergency response.',
   1),
  ('people_near_burning',
   'Is anyone trapped, injured, or in immediate danger near burning waste or smoke?',
   'Call 112 / 101 first. Stay clear of smoke and flames.',
   2),
  ('sharps_or_hazardous_exposure',
   'Are there needles, sharps, or materials that may be hazardous with people at immediate risk of contact?',
   'Stay away. Do not touch. Call 112 if someone is injured. Do not use ordinary garbage-collection channels first.',
   3),
  ('immediate_danger_waste',
   'Is there an immediate danger to people from this waste situation (fire, toxic smoke, collapse of piled waste, etc.)?',
   'Immediate danger requires emergency services before any normal civic waste complaint.',
   4)
) as v(question_key, question_text, explanation, sort_order)
where c.slug = 'waste_garbage'
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
  'Selected issue type is emergency-relevant for Waste & Garbage',
  'user_selected_yes', 'high',
  'Call 112 / 101 first if there is fire or immediate danger. Do not approach fire, hazardous, or biomedical waste. DPCC burning WhatsApp / Green Delhi are for burning/pollution reporting after safety — not a substitute for fire emergency.',
  t.sort_order, 'My Delhi Waste & Garbage', current_date, true
from public.issue_categories c
join public.issue_types t on t.category_id = c.id
where c.slug = 'waste_garbage'
  and t.emergency_relevant = true
  and t.active = true
  and not exists (
    select 1 from public.emergency_rules r
    where r.category_id = c.id
      and r.issue_type_id = t.id
      and r.rule_kind = 'emergency_signal'
  );

-- ============================================================================
-- 5) Authorities (reuse / upsert — never create waste_authorities)
-- ============================================================================

insert into public.authorities
  (slug, name, department, government, official_website, emergency_number, short_description,
   source_name, source_url, source_id, last_verified_at, verification_status, active)
select v.slug, v.name, v.department, v.government, v.website, v.emergency,
  v.short_description, s.name, s.official_url, s.id, current_date, 'verified', true
from (values
  ('mcd', 'Municipal Corporation of Delhi (MCD)', 'Municipal Corporation of Delhi', 'MCD',
   'https://mcdonline.nic.in/', null,
   'Candidate for MSW collection, bin overflow, dumping, littering, malba in MCD areas. Not automatic for all waste. GPS does not prove MCD.',
   'mcd_online'),
  ('ndmc', 'New Delhi Municipal Council (NDMC)', 'NDMC', 'Municipal',
   'https://www.ndmc.gov.in/', null,
   'Candidate only in NDMC area for sanitation / garbage. Area officer numbers are not universal. Confirm NDMC jurisdiction.',
   'ndmc'),
  ('delhi_cantonment', 'Delhi Cantonment Board', 'Delhi Cantonment Board', 'Delhi Cantonment Board',
   'https://delhi.cantt.gov.in/', null,
   'Conditional: Cantonment limits only. Waste complaint phones/portals not verified this pass.',
   'delhi_cantonment'),
  ('dpcc', 'Delhi Pollution Control Committee (DPCC)', 'DPCC', 'Government of NCT of Delhi',
   'https://www.dpcc.delhigovt.nic.in/', null,
   'Candidate for burning / plastic compliance / C&D regulatory / hazardous / biomedical / e-waste regulatory concerns — not municipal door-to-door collection. Not all waste → DPCC.',
   'dpcc')
) as v(slug, name, department, government, website, emergency, short_description, source_slug)
join public.sources s on s.slug = v.source_slug
on conflict (slug) do update set
  name = excluded.name,
  department = excluded.department,
  official_website = excluded.official_website,
  short_description = case
    when public.authorities.slug = 'dpcc'
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
-- 6) Reason-specific channels (verified only; purpose required)
-- ============================================================================

-- MCD: collection / dumping / littering / burning (municipal) / C&D dumping / public health / app / tracking
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, purpose, priority,
  action_url, tracking_url, instructions, source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'phone', v.label, '155305', '155305', v.purpose, v.priority,
  null, null, v.instructions, s.name, 'https://mcdonline.nic.in/portal/feedback', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'mcd_online'
cross join (values
  ('MCD Citizen Call Center (garbage collection)', 'garbage_collection', 10,
   'Call 155305 for municipal garbage collection concerns where MCD may apply. Confirm MCD area. My Delhi does not submit.'),
  ('MCD Citizen Call Center (missed collection)', 'missed_collection', 10,
   'Call 155305 for missed / irregular collection in MCD areas. Confirm jurisdiction.'),
  ('MCD Citizen Call Center (dumping)', 'dumping', 10,
   'Call 155305 for garbage dumping / open dump in MCD areas. Confirm MCD area.'),
  ('MCD Citizen Call Center (littering)', 'littering', 15,
   'Call 155305 for littering in MCD public areas. Confirm jurisdiction.'),
  ('MCD Citizen Call Center (burning — municipal)', 'burning', 20,
   'If active fire: call 112/101 first. Then 155305 for municipal burning/dumping reporting when safe. DPCC burning WhatsApp / Green Delhi may also apply.'),
  ('MCD Citizen Call Center (plastic dumping)', 'plastic_waste', 15,
   'Call 155305 for plastic dumping/littering in MCD areas. Plastic compliance may also involve DPCC.'),
  ('MCD Citizen Call Center (malba / C&D dumping)', 'cd_waste', 15,
   'Call 155305 for malba / C&D dumping in MCD areas. DPCC may apply for C&D regulatory concerns.'),
  ('MCD Citizen Call Center (sanitation / public health)', 'public_health', 20,
   'Call 155305 for sanitation concerns that may create a public-health risk. Soft guidance only — not a medical diagnosis.'),
  ('MCD Citizen Call Center (general)', 'grievance', 30,
   'Call 155305 (listed on mcdonline feedback). Confirm MCD area.'),
  ('MCD Citizen Call Center (after emergency)', 'emergency', 25,
   'If fire or immediate danger: call 112/101 first. Then 155305 for municipal civic reporting when safe.')
) as v(label, purpose, priority, instructions)
where a.slug = 'mcd'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = v.purpose and c.value = '155305'
      and c.label = v.label
  );

insert into public.authority_channels (
  authority_id, channel_type, label, value, email, purpose, priority,
  instructions, source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'email', 'MCD IT helpdesk email (feedback page)',
  'mcd-ithelpdesk@mcd.nic.in', 'mcd-ithelpdesk@mcd.nic.in', 'email', 40,
  'Email listed on mcdonline.nic.in/portal/feedback. Not labeled as a dedicated sanitation department email.',
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
  'MCD311 named on mcdonline.nic.in/portal/feedback. Create/track links from the same official feedback page. My Delhi opens only; does not submit.',
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
  'Linked from mcdonline.nic.in/portal/feedback "Click here for Complaint". Confirm MCD area. My Delhi does not submit.',
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
  'Official issuedetail link from mcdonline feedback page. Do not invent extra query params. MD-###### is not an MCD reference.',
  s.name, 'https://mcdonline.nic.in/portal/feedback', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'mcd_online'
where a.slug = 'mcd'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = 'tracking'
      and c.value like '%mcd.everythingcivic.com/citizen/issuedetail%'
  );

insert into public.authority_channels (
  authority_id, channel_type, label, value, action_url, purpose, priority,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'website', 'MCD Online feedback',
  'https://mcdonline.nic.in/portal/feedback',
  'https://mcdonline.nic.in/portal/feedback',
  'web_portal', 80,
  s.name, 'https://mcdonline.nic.in/portal/feedback', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'mcd_online'
where a.slug = 'mcd'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.value = 'https://mcdonline.nic.in/portal/feedback'
  );

-- NDMC: 1533 / WhatsApp / care email / complaints hub — purpose-specific; no invented area officer phones
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, email, whatsapp, purpose, priority, geography,
  action_url, instructions, source_name, source_url, source_id, last_verified_at, active
)
select a.id, v.channel_type, v.label, v.value, v.phone, v.email, v.whatsapp, v.purpose, v.priority, 'ndmc_area',
  v.action_url, v.instructions, s.name, 'https://www.ndmc.gov.in/complaints.aspx', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'ndmc'
cross join (values
  ('phone', 'NDMC helpline 1533 (garbage / sanitation)', '1533', '1533', null::text, null::text,
   'garbage_collection', 10, 'https://www.ndmc.gov.in/complaints.aspx',
   '1533 listed on ndmc.gov.in/complaints.aspx. NDMC area only. Area sanitation officer numbers are not universal.'),
  ('phone', 'NDMC helpline 1533 (missed collection)', '1533', '1533', null, null,
   'missed_collection', 10, 'https://www.ndmc.gov.in/complaints.aspx',
   'Call 1533 for missed collection in NDMC area. Confirm NDMC jurisdiction.'),
  ('phone', 'NDMC helpline 1533 (dumping)', '1533', '1533', null, null,
   'dumping', 10, 'https://www.ndmc.gov.in/complaints.aspx',
   'Call 1533 for dumping/littering in NDMC area.'),
  ('phone', 'NDMC helpline 1533 (littering)', '1533', '1533', null, null,
   'littering', 15, 'https://www.ndmc.gov.in/complaints.aspx',
   'Call 1533 for littering in NDMC area.'),
  ('phone', 'NDMC helpline 1533 (burning — municipal)', '1533', '1533', null, null,
   'burning', 20, 'https://www.ndmc.gov.in/complaints.aspx',
   'If active fire: 112/101 first. Then 1533 for NDMC municipal reporting when safe.'),
  ('phone', 'NDMC helpline 1533 (public health / sanitation)', '1533', '1533', null, null,
   'public_health', 20, 'https://www.ndmc.gov.in/complaints.aspx',
   'Call 1533. Soft sanitation language only — not a medical diagnosis. Confirm NDMC area.'),
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
   'Official NDMC complaints hub / NDMC 311 app guidance. Dedicated track-by-reference URL not verified — left NULL.'),
  ('portal', 'NDMC public health / sanitation department page',
   'https://www.ndmc.gov.in/departments/public_health_sanitation.aspx', null, null, null,
   'public_health', 40, 'https://www.ndmc.gov.in/departments/public_health_sanitation.aspx',
   'Official sanitation department page. Area contacts on that page are geography-specific — do not treat as universal officer numbers.')
) as v(channel_type, label, value, phone, email, whatsapp, purpose, priority, action_url, instructions)
where a.slug = 'ndmc'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = v.purpose and c.value = v.value
      and c.label = v.label
  );

-- DCB: website only for waste (phones/portals NULL this pass)
insert into public.authority_channels (
  authority_id, channel_type, label, value, action_url, purpose, priority, geography,
  instructions, source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'website', 'Delhi Cantonment Board website',
  'https://delhi.cantt.gov.in/',
  'https://delhi.cantt.gov.in/',
  'web_portal', 50, 'cantonment_only',
  'Cantonment limits only. Waste-specific complaint phone / portal not verified this pass — open official website. My Delhi does not submit.',
  s.name, 'https://delhi.cantt.gov.in/', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'delhi_cantonment'
where a.slug = 'delhi_cantonment'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = 'web_portal'
      and c.value = 'https://delhi.cantt.gov.in/'
  );

-- DPCC: Green Delhi (burning / plastic compliance / C&D regulatory) + burning WhatsApp (purpose=burning only)
insert into public.authority_channels (
  authority_id, channel_type, label, value, whatsapp, purpose, priority,
  action_url, tracking_url, instructions, source_name, source_url, source_id, last_verified_at, active
)
select a.id, v.channel_type, v.label, v.value, v.whatsapp, v.purpose, v.priority,
  v.action_url, null, v.instructions, s.name, s.official_url, s.id, current_date, true
from public.authorities a
cross join (values
  ('whatsapp', 'DPCC leave/garbage burning WhatsApp', '9717593574', '9717593574',
   'burning', 10,
   null::text,
   'Listed on DPCC functions page for leave/garbage burning complaints (photo/video). NOT a universal waste number. If fire: call 112/101 first. Live page returned HTTP 500 during 2026-09-20 audit; text reconfirmed via official-page snippet. Prefer Green Delhi for tracked pollution complaints when available.',
   'dpcc'),
  ('portal', 'Green Delhi (pollution / burning complaints)', 'https://greendelhi.nic.in/', null,
   'burning', 5,
   'https://greendelhi.nic.in/',
   'Official Green Delhi portal for pollution-related complaints including garbage burning (DPCC public materials). Tracking inside portal after login — no separate public tracking_url. If fire: 112/101 first.',
   'green_delhi_app'),
  ('portal', 'Green Delhi (plastic / env compliance)', 'https://greendelhi.nic.in/', null,
   'plastic_waste', 20,
   'https://greendelhi.nic.in/',
   'Use for plastic/environment compliance concerns via Green Delhi. Municipal dumping may still use MCD/NDMC. Not all plastic → DPCC only.',
   'green_delhi_app'),
  ('portal', 'Green Delhi (C&D / env alternative)', 'https://greendelhi.nic.in/', null,
   'cd_waste', 20,
   'https://greendelhi.nic.in/',
   'Environmental / pollution alternative for C&D concerns. Municipal dumping still uses MCD/NDMC where applicable.',
   'green_delhi_app'),
  ('website', 'DPCC solid waste management page', 'https://www.dpcc.delhigovt.nic.in/solidwastemanagement', null,
   'web_portal', 40,
   'https://www.dpcc.delhigovt.nic.in/solidwastemanagement',
   'DPCC solid-waste information page (may still reference SWM Rules 2016 documents). Knowledge/regulatory — not a municipal collection desk.',
   'dpcc'),
  ('website', 'DPCC official website', 'https://www.dpcc.delhigovt.nic.in/', null,
   'web_portal', 80,
   'https://www.dpcc.delhigovt.nic.in/',
   'DPCC information site. Hazardous / biomedical / e-waste citizen complaint portals not separately verified this pass — do not invent.',
   'dpcc')
) as v(channel_type, label, value, whatsapp, purpose, priority, action_url, instructions, source_slug)
join public.sources s on s.slug = v.source_slug
where a.slug = 'dpcc'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = v.purpose and c.value = v.value
      and c.channel_type = v.channel_type
  );

-- Explicit: do NOT seed fake hazardous/biomedical/e-waste citizen portals
-- (leave purpose channels NULL beyond DPCC website / Green Delhi where applicable)

-- ============================================================================
-- 7) Authority services (filing assistant) — verified only
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
   'MCD311 / Citizen Call Center (waste)', 'mcd311_waste_garbage',
   '155305 and MCD311 from mcdonline feedback. Use for MSW/collection/dumping/malba where MCD may apply. My Delhi does not submit.',
   'complaint',
   'https://mcdonline.nic.in/portal/feedback',
   'https://mcd.everythingcivic.com/citizen/createissue?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120',
   'https://mcd.everythingcivic.com/citizen/issuedetail?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120',
   '155305', 'phone'),
  ('ndmc', 'ndmc',
   'NDMC complaints / 1533 (waste)', 'ndmc_waste_complaints',
   '1533, WhatsApp 8588887773, care@ndmc.gov.in on complaints.aspx. NDMC area only. Tracking URL not verified.',
   'complaint',
   'https://www.ndmc.gov.in/complaints.aspx',
   'https://www.ndmc.gov.in/complaints.aspx',
   null,
   '1533', 'phone'),
  ('dpcc', 'green_delhi_app',
   'Green Delhi / DPCC burning & pollution', 'dpcc_green_delhi_waste_burning',
   'Green Delhi portal for pollution/burning complaints. If fire: 112/101 first. DPCC burning WhatsApp 9717593574 is purpose=burning only — not universal waste.',
   'complaint',
   'https://greendelhi.nic.in/',
   'https://greendelhi.nic.in/',
   null,
   null, 'deep_link'),
  ('delhi_cantonment', 'delhi_cantonment',
   'Delhi Cantonment Board website (waste)', 'dcb_waste_website',
   'Cantonment limits only. Waste complaint phone/portal not verified — opens official website only.',
   'information',
   'https://delhi.cantt.gov.in/',
   null,
   null,
   null, 'deep_link')
) as v(auth_slug, source_slug, service_name, slug, description, service_type, official_url, filing_url, tracking_url, phone, integration_type)
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where not exists (
  select 1 from public.authority_services x
  where x.authority_id = a.id and x.slug = v.slug
);

-- ============================================================================
-- 8) Routing rules — ALL needs_confirmation / conditional; never auto MCD or DPCC
-- ============================================================================

insert into public.routing_rules (
  category_id, authority_id, source_id, confidence, routing_mode, is_primary, notes, active
)
select c.id, a.id, s.id, 'needs_confirmation', 'needs_confirmation', false, v.notes, true
from public.issue_categories c
cross join (values
  ('mcd', 'mcd_online',
   'Candidate for MSW collection / dumping / littering / malba in MCD areas — needs confirmation. Not all waste → MCD.'),
  ('ndmc', 'ndmc',
   'Candidate only in NDMC area for sanitation / garbage — needs confirmation.'),
  ('delhi_cantonment', 'delhi_cantonment',
   'Conditional alternative inside Cantonment limits — needs confirmation.'),
  ('dpcc', 'dpcc',
   'Candidate for burning / plastic compliance / C&D regulatory / hazardous / biomedical / e-waste — not municipal collection. Not all waste → DPCC.')
) as v(auth_slug, source_slug, notes)
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where c.slug = 'waste_garbage'
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
  -- Missed collection / bin overflow → municipal by jurisdiction
  ('missed_garbage_collection', 'mcd', 'mcd_online',
   'Missed collection: MCD candidate if MCD area — needs confirmation.'),
  ('missed_garbage_collection', 'ndmc', 'ndmc',
   'Missed collection: NDMC alternative if NDMC area.'),
  ('missed_garbage_collection', 'delhi_cantonment', 'delhi_cantonment',
   'Missed collection: Cantonment only if inside Cantonment limits.'),
  ('overflowing_bin', 'mcd', 'mcd_online',
   'Overflowing bin: MCD candidate if MCD area — needs confirmation.'),
  ('overflowing_bin', 'ndmc', 'ndmc',
   'Overflowing bin: NDMC if NDMC area.'),
  ('overflowing_bin', 'delhi_cantonment', 'delhi_cantonment',
   'Overflowing bin: Cantonment if Cantonment limits.'),
  ('garbage_not_collected', 'mcd', 'mcd_online',
   'Not collected: municipal MCD candidate — needs confirmation.'),
  ('garbage_not_collected', 'ndmc', 'ndmc',
   'Not collected: NDMC if NDMC area.'),
  ('irregular_garbage_collection', 'mcd', 'mcd_online',
   'Irregular collection: MCD candidate — needs confirmation.'),
  ('irregular_garbage_collection', 'ndmc', 'ndmc',
   'Irregular collection: NDMC if NDMC area.'),
  -- Dumping / littering → municipal
  ('garbage_dumping', 'mcd', 'mcd_online',
   'Dumping: MCD candidate if MCD area — needs confirmation.'),
  ('garbage_dumping', 'ndmc', 'ndmc',
   'Dumping: NDMC if NDMC area.'),
  ('open_garbage_dump', 'mcd', 'mcd_online',
   'Open dump: MCD candidate — needs confirmation.'),
  ('open_garbage_dump', 'ndmc', 'ndmc',
   'Open dump: NDMC if NDMC area.'),
  ('littering_public_place', 'mcd', 'mcd_online',
   'Littering: MCD candidate — needs confirmation.'),
  ('littering_public_place', 'ndmc', 'ndmc',
   'Littering: NDMC if NDMC area.'),
  -- Burning → municipal + DPCC burning
  ('garbage_burning', 'mcd', 'mcd_online',
   'Burning: municipal MCD candidate + DPCC burning channel. Fire → 112/101 first.'),
  ('garbage_burning', 'ndmc', 'ndmc',
   'Burning: NDMC municipal if NDMC area. Fire → 112/101 first.'),
  ('garbage_burning', 'dpcc', 'dpcc',
   'Burning: DPCC Green Delhi / burning WhatsApp (purpose=burning). Fire → 112/101 first.'),
  ('leaf_burning', 'mcd', 'mcd_online',
   'Leaf burning: municipal candidate + DPCC burning. Fire → 112/101 first.'),
  ('leaf_burning', 'dpcc', 'dpcc',
   'Leaf burning: DPCC burning WhatsApp / Green Delhi. Fire → 112/101 first.'),
  ('large_waste_burning_fire', 'dpcc', 'dpcc',
   'Large burning/fire: emergency 112/101 first; DPCC burning secondary.'),
  ('large_waste_burning_fire', 'mcd', 'mcd_online',
   'Large burning/fire: emergency first; municipal secondary when safe.'),
  ('waste_fire_hazard', 'dpcc', 'dpcc',
   'Fire hazard: 112/101 first; DPCC burning secondary.'),
  -- Plastic dumping → municipal; compliance → DPCC
  ('plastic_waste_dumping', 'mcd', 'mcd_online',
   'Plastic dumping: municipal MCD candidate — needs confirmation.'),
  ('plastic_waste_dumping', 'ndmc', 'ndmc',
   'Plastic dumping: NDMC if NDMC area.'),
  ('plastic_waste_dumping', 'dpcc', 'dpcc',
   'Plastic: DPCC/Green Delhi compliance alternative — needs confirmation.'),
  ('plastic_littering', 'mcd', 'mcd_online',
   'Plastic littering: municipal candidate — needs confirmation.'),
  ('plastic_littering', 'ndmc', 'ndmc',
   'Plastic littering: NDMC if NDMC area.'),
  ('plastic_waste_compliance_concern', 'dpcc', 'dpcc',
   'Plastic compliance: DPCC/Green Delhi — not automatic municipal collection.'),
  -- C&D → municipal dumping + DPCC regulatory
  ('malba_dumping', 'mcd', 'mcd_online',
   'Malba dumping: municipal MCD candidate — needs confirmation.'),
  ('malba_dumping', 'ndmc', 'ndmc',
   'Malba dumping: NDMC if NDMC area.'),
  ('malba_dumping', 'dpcc', 'dpcc',
   'Malba/C&D: DPCC/Green Delhi regulatory alternative — needs confirmation.'),
  ('cd_waste_dumping', 'mcd', 'mcd_online',
   'C&D dumping: municipal candidate — needs confirmation.'),
  ('cd_waste_dumping', 'ndmc', 'ndmc',
   'C&D dumping: NDMC if NDMC area.'),
  ('cd_waste_dumping', 'dpcc', 'dpcc',
   'C&D dumping: DPCC regulatory alternative — needs confirmation.'),
  ('cd_waste_roadside', 'mcd', 'mcd_online',
   'C&D roadside: municipal candidate — needs confirmation.'),
  ('cd_waste_roadside', 'dpcc', 'dpcc',
   'C&D roadside: DPCC alternative — needs confirmation.'),
  -- E-waste / hazardous / biomedical → NOT auto MCD
  ('e_waste_dumping', 'dpcc', 'dpcc',
   'E-waste: DPCC/authorized routes only when verified — NOT auto MCD collection.'),
  ('e_waste_disposal_concern', 'dpcc', 'dpcc',
   'E-waste disposal: DPCC information / authorized routes when verified — not municipal door-to-door.'),
  ('hazardous_waste_concern', 'dpcc', 'dpcc',
   'Hazardous waste: DPCC/authorized only when verified. Do not approach. Not auto MCD.'),
  ('biomedical_waste_concern', 'dpcc', 'dpcc',
   'Biomedical waste: authorized/DPCC routes only when verified. Do not approach. Not auto MCD.'),
  ('sharps_exposure_hazard', 'dpcc', 'dpcc',
   'Sharps hazard: stay away; 112 if injured. DPCC/authorized secondary — not ordinary collection.'),
  -- Bulk / facility / public health
  ('bulk_waste_not_collected', 'mcd', 'mcd_online',
   'Bulk waste: municipal MCD candidate — needs confirmation.'),
  ('bulk_waste_not_collected', 'ndmc', 'ndmc',
   'Bulk waste: NDMC if NDMC area.'),
  ('bulk_waste_dumping', 'mcd', 'mcd_online',
   'Bulk dumping: municipal candidate — needs confirmation.'),
  ('dhalao_facility_concern', 'mcd', 'mcd_online',
   'Dhalao: municipal MCD candidate — needs confirmation.'),
  ('dhalao_facility_concern', 'ndmc', 'ndmc',
   'Dhalao: NDMC if NDMC area.'),
  ('waste_processing_facility_concern', 'dpcc', 'dpcc',
   'Processing facility: DPCC regulatory candidate — needs confirmation.'),
  ('waste_processing_facility_concern', 'mcd', 'mcd_online',
   'Processing facility: municipal alternative if municipal facility — needs confirmation.'),
  ('sanitation_public_health_concern', 'mcd', 'mcd_online',
   'Sanitation concern: municipal candidate — needs confirmation. Not a diagnosis.'),
  ('sanitation_public_health_concern', 'ndmc', 'ndmc',
   'Sanitation concern: NDMC if NDMC area.'),
  ('stagnant_waste_odour_concern', 'mcd', 'mcd_online',
   'Odour/stagnant waste: municipal candidate — needs confirmation.'),
  ('dead_animal_removal', 'mcd', 'mcd_online',
   'Dead animal: municipal MCD candidate — needs confirmation.'),
  ('dead_animal_removal', 'ndmc', 'ndmc',
   'Dead animal: NDMC if NDMC area.'),
  -- Segregation — municipal
  ('waste_segregation_not_followed', 'mcd', 'mcd_online',
   'Segregation concern: municipal candidate — needs confirmation.'),
  ('waste_segregation_not_followed', 'ndmc', 'ndmc',
   'Segregation concern: NDMC if NDMC area.'),
  ('mixed_waste_concern', 'mcd', 'mcd_online',
   'Mixed waste: municipal candidate — needs confirmation.'),
  ('wet_dry_segregation_concern', 'mcd', 'mcd_online',
   'Wet/dry segregation: municipal candidate — needs confirmation.'),
  -- Other
  ('waste_garbage_other', 'mcd', 'mcd_online',
   'Other waste concern: MCD candidate only if MCD area — needs confirmation.'),
  ('waste_garbage_other', 'ndmc', 'ndmc',
   'Other waste concern: NDMC if NDMC area.'),
  ('waste_garbage_other', 'dpcc', 'dpcc',
   'Other waste concern: DPCC only if environmental/regulatory — needs confirmation.')
) as v(issue_slug, auth_slug, source_slug, notes)
join public.issue_types t on t.slug = v.issue_slug
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where c.slug = 'waste_garbage'
  and t.category_id = c.id
  and not exists (
    select 1 from public.routing_rules r
    where r.category_id = c.id
      and r.issue_type_id = t.id
      and r.authority_id = a.id
      and r.active = true
  );

-- ============================================================================
-- 9) Citizen rights (no invented penalties / timelines)
-- ============================================================================

insert into public.citizen_rights (
  slug, title, short_description, detailed_description, category_id,
  right_type, who_can_use, when_it_applies, conditions,
  what_citizen_can_do, what_authority_must_do, time_limit, possible_remedy,
  possible_compensation, escalation_available, official_action_url,
  source_id, source_title, last_verified_at, active
)
select v.slug, v.title, v.short_description, v.detailed_description, c.id,
  v.right_type, v.who_can_use, v.when_it_applies, v.conditions,
  v.what_citizen_can_do, v.what_authority_must_do, v.time_limit, v.possible_remedy,
  null, v.escalation_available, v.official_action_url,
  s.id, v.source_title, current_date, true
from public.issue_categories c
cross join (values
  ('waste_report_collection',
   'Report missed collection or overflowing bins',
   'Citizens can report missed garbage collection or overflowing bins to the municipal body for their area.',
   'Use MCD311 / 155305 in MCD areas, or NDMC 1533 / complaints hub in NDMC areas. Confirm jurisdiction. My Delhi does not submit. MD-###### is not an official reference.',
   'service_access', 'Residents / occupants in Delhi municipal areas',
   'When collection appears missed or bins overflow',
   'Authority depends on municipal jurisdiction (MCD / NDMC / Cantonment). GPS alone does not prove authority.',
   'Call or open the official municipal channel for your area; keep any official reference you receive.',
   'Municipal bodies publish citizen complaint channels for sanitation/MSW where applicable.',
   'See current official service standard — not invented here.',
   'Official complaint reference from the authority channel',
   true,
   'https://mcdonline.nic.in/portal/feedback',
   'mcd_online', 'MCD feedback / NDMC complaints'),
  ('waste_segregation_responsibility',
   'Segregation at source (SWM Rules 2026)',
   'Solid Waste Management Rules, 2026 (notified; in force from 1 April 2026) emphasize segregation at source.',
   'PIB notes four-stream segregation (wet, dry, sanitary, special-care). Exact local bye-law duties vary. This is knowledge — not a finding that any person violated the rules. No invented fine amounts.',
   'knowledge', 'Waste generators as defined under applicable rules',
   'When handling household / bulk solid waste',
   'Confirm current local body guidance. DPCC pages may still list 2016 materials alongside the 2026 central rules.',
   'Follow local segregation guidance; report collection/segregation concerns via official municipal channels.',
   'Local bodies and pollution-control committees have roles under the Rules — see official texts.',
   null,
   null,
   false,
   'https://cpcb.nic.in/rules-7/',
   'cpcb_waste_rules', 'CPCB rules / PIB SWM Rules 2026'),
  ('waste_burning_report',
   'Report leaf / garbage burning',
   'Citizens can report leaf or garbage burning via DPCC burning WhatsApp (purpose-specific) and/or Green Delhi, and via municipal channels.',
   'If there is an active fire or immediate danger, call 112 / 101 first. Burning reporting channels are not a substitute for fire emergency response.',
   'service_access', 'Anyone observing leaf/garbage burning in Delhi',
   'When leaf or garbage burning is observed (and after emergency response if fire)',
   'WhatsApp 9717593574 is for leave/garbage burning complaints per DPCC functions-page text — not a universal waste helpline.',
   'After safety: use Green Delhi and/or DPCC burning WhatsApp; also municipal 155305/1533 where relevant.',
   'DPCC / Environment and municipal bodies publish burning/pollution complaint channels.',
   null,
   'Portal / WhatsApp acknowledgement if provided by the authority',
   true,
   'https://greendelhi.nic.in/',
   'green_delhi_app', 'Green Delhi / DPCC burning'),
  ('waste_keep_official_reference',
   'Keep the official complaint reference',
   'Save the reference number the authority gives you. MD-###### is only your My Delhi case ID.',
   'Status in My Delhi is "recorded by you" unless an official API exists. Track via MCD311 issuedetail (MCD) or inside Green Delhi after login. NDMC track-by-reference URL not verified.',
   'knowledge', 'Anyone who files with an official channel',
   'After receiving an official reference',
   'Do not treat My Delhi case IDs as government references.',
   'Copy the official reference into My Delhi if you want; track on the official channel.',
   null,
   null,
   null,
   false,
   'https://mcdonline.nic.in/portal/feedback',
   'mcd_online', 'MCD feedback / Green Delhi')
) as v(slug, title, short_description, detailed_description, right_type, who_can_use, when_it_applies, conditions, what_citizen_can_do, what_authority_must_do, time_limit, possible_remedy, escalation_available, official_action_url, source_slug, source_title)
join public.sources s on s.slug = v.source_slug
where c.slug = 'waste_garbage'
on conflict (slug) do update set
  title = excluded.title,
  short_description = excluded.short_description,
  detailed_description = excluded.detailed_description,
  category_id = excluded.category_id,
  official_action_url = excluded.official_action_url,
  source_id = excluded.source_id,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ============================================================================
-- 10) Citizen knowledge
-- ============================================================================

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
  ('waste_not_all_mcd',
   'Not all waste goes to MCD',
   'Missed collection often involves the municipal body for your area (MCD / NDMC / Cantonment). Burning, plastic compliance, hazardous and biomedical waste may involve DPCC — not auto MCD.',
   'Anyone reporting waste in Delhi',
   'Before choosing an authority',
   'Use jurisdiction chips and purpose-specific BEST action. GPS alone does not prove authority.',
   'Your bill / area knowledge / official map if any — never invent GPS→authority',
   'Correct official channel for the issue type',
   'https://mcdonline.nic.in/portal/feedback',
   'Official channel reference',
   'mcd_online', 'MCD / NDMC / DPCC', 10),
  ('waste_burning_not_collection',
   'Burning is not a normal collection complaint',
   'Leaf/garbage burning uses DPCC burning WhatsApp / Green Delhi (and municipal channels). Active fire → 112/101 first. Do not treat burning as "missed collection".',
   'Anyone observing burning',
   'When waste is being burned',
   'Call 112/101 if fire/danger. Then Green Delhi or DPCC burning WhatsApp when safe.',
   'Photo/video + location if safe to capture — evidence optional',
   'Official burning/pollution complaint acknowledgement',
   'https://greendelhi.nic.in/',
   'Green Delhi portal / WhatsApp reply if any',
   'green_delhi_app', 'Green Delhi / DPCC', 20),
  ('waste_cd_separate',
   'C&D / malba is separate from household garbage',
   'Malba and C&D dumping may involve municipal dumping channels and DPCC C&D regulatory routes. Do not assume household MSW collection handles C&D.',
   'Anyone observing malba / C&D dumping',
   'When C&D waste is dumped',
   'Report via municipal channel for dumping; consider Green Delhi / DPCC for regulatory concerns.',
   'Location description; photos if safe',
   'Official municipal / DPCC reference',
   'https://mcdonline.nic.in/portal/feedback',
   'MCD311 issuedetail or Green Delhi login',
   'mcd_online', 'MCD / DPCC', 30),
  ('waste_ewaste_haz_not_mcd',
   'E-waste / hazardous / biomedical are not auto MCD',
   'These streams need authorized / DPCC routes when verified. My Delhi does not invent citizen portals. Do not approach hazardous or biomedical waste.',
   'Anyone observing e-waste / hazardous / biomedical concerns',
   'When specialized waste is involved',
   'Stay away. Use DPCC information pages / Green Delhi when relevant. Seek authorized handlers — do not invent contacts.',
   'Do not handle materials yourself',
   null,
   'https://www.dpcc.delhigovt.nic.in/',
   null,
   'dpcc', 'DPCC', 40),
  ('waste_segregation_handover',
   'Segregation and handover',
   'Segregation at source and proper handover to the collection system matter under SWM Rules 2026. Local practice varies. No invented penalties here.',
   'Household and bulk waste generators',
   'When preparing waste for collection',
   'Follow local segregation guidance; report collection failures via official municipal channels.',
   'Local body segregation guidance',
   null,
   'https://cpcb.nic.in/rules-7/',
   null,
   'cpcb_waste_rules', 'CPCB / SWM Rules 2026', 50),
  ('waste_md_not_official',
   'MD-###### is not an official reference',
   'My Delhi does not submit complaints. Keep the reference the authority gives you (MCD311 / Green Delhi / call centre).',
   'All My Delhi users',
   'After preparing a filing pack',
   'Open the official channel; save the official reference separately.',
   'Official reference from authority',
   null,
   'https://mcdonline.nic.in/portal/feedback',
   'MCD311 issuedetail / Green Delhi',
   'mcd_online', 'My Delhi guidance', 60)
) as v(slug, title, what_people_often_miss, who_it_applies_to, when_it_applies, what_you_can_do, what_you_may_need, possible_remedy, official_portal_url, tracking_method, source_slug, source_title, sort_order)
join public.sources s on s.slug = v.source_slug
where c.slug = 'waste_garbage'
on conflict (slug) do update set
  title = excluded.title,
  what_people_often_miss = excluded.what_people_often_miss,
  what_you_can_do = excluded.what_you_can_do,
  category_id = excluded.category_id,
  official_portal_url = excluded.official_portal_url,
  source_id = excluded.source_id,
  last_verified_at = excluded.last_verified_at,
  sort_order = excluded.sort_order,
  active = true;

-- ============================================================================
-- 11) Official services discovery
-- ============================================================================

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
  ('mcd311_waste_garbage', 'MCD311 / Citizen Call Center', 'app', 'Municipal Corporation of Delhi',
   'mcd', 'Official MCD311 app and 155305 on mcdonline feedback. Useful for MSW/collection/dumping/malba — confirm MCD area.',
   'Residents in MCD areas', 'Missed collection, dumping, littering, malba',
   'app', 'app', 'https://mcdonline.nic.in/portal/feedback', '155305', null, null,
   'https://mcd.everythingcivic.com/citizen/issuedetail?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120',
   'mcd_areas_needs_confirmation', 'mcd_online'),
  ('ndmc_waste_complaints', 'NDMC complaints / 1533', 'portal', 'NDMC',
   'ndmc', '1533, WhatsApp 8588887773, care@ndmc.gov.in on complaints.aspx. NDMC area only. Area sanitation phones not universal.',
   'Residents in NDMC area', 'Sanitation / garbage in NDMC area',
   'web_portal', 'website', 'https://www.ndmc.gov.in/complaints.aspx', '1533', 'care@ndmc.gov.in', '8588887773',
   null, 'ndmc_area_only', 'ndmc'),
  ('dpcc_burning_whatsapp', 'DPCC leave/garbage burning WhatsApp', 'whatsapp', 'DPCC',
   'dpcc', 'WhatsApp 9717593574 for leave/garbage burning (DPCC functions-page text). NOT universal waste. Fire → 112/101 first.',
   'Anyone reporting leaf/garbage burning', 'Leaf or garbage burning after safety',
   'burning', 'whatsapp', 'https://www.dpcc.delhigovt.nic.in/', null, null, '9717593574',
   null, 'delhi_burning_only', 'dpcc'),
  ('green_delhi_waste', 'Green Delhi App / portal', 'app', 'DPCC / Environment',
   'dpcc', 'Official Green Delhi portal for pollution-related complaints including garbage burning. Tracking inside portal after login.',
   'Anyone reporting pollution / burning', 'Burning, plastic/env, C&D pollution concerns',
   'burning', 'website', 'https://greendelhi.nic.in/', null, null, null,
   null, 'delhi_env', 'green_delhi_app')
) as v(slug, name, service_type, organization, auth_slug, description, who_it_is_for, when_to_use, purpose, channel_type, official_url, phone, email, whatsapp, tracking_url, jurisdiction, source_slug)
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where c.slug = 'waste_garbage'
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  official_url = excluded.official_url,
  phone = excluded.phone,
  email = excluded.email,
  whatsapp = excluded.whatsapp,
  tracking_url = excluded.tracking_url,
  purpose = excluded.purpose,
  authority_id = excluded.authority_id,
  category_id = excluded.category_id,
  source_id = excluded.source_id,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ============================================================================
-- 12) Escalation (verified only)
-- ============================================================================

insert into public.escalation_paths (
  slug, authority_id, category_id, level_order, level_name, description,
  action_url, phone, email, conditions, source_id, last_verified_at, active
)
select v.slug, a.id, c.id, v.level_order, v.level_name, v.description,
  v.action_url, v.phone, v.email, v.conditions, s.id, current_date, true
from public.issue_categories c
cross join (values
  ('mcd_waste_l1_155305', 'mcd', 1, 'MCD Citizen Call Center / MCD311',
   'Start with 155305 or MCD311 for municipal waste concerns in MCD areas. Confirm jurisdiction.',
   'https://mcdonline.nic.in/portal/feedback', '155305', null,
   'MCD area only; not automatic for all waste',
   'mcd_online'),
  ('ndmc_waste_l1_1533', 'ndmc', 1, 'NDMC helpline / complaints hub',
   'Start with 1533 or ndmc.gov.in/complaints.aspx in NDMC area.',
   'https://www.ndmc.gov.in/complaints.aspx', '1533', 'care@ndmc.gov.in',
   'NDMC area only',
   'ndmc'),
  ('dpcc_waste_l1_green_delhi', 'dpcc', 1, 'Green Delhi / DPCC burning channel',
   'For burning / pollution: Green Delhi portal; DPCC WhatsApp only for leave/garbage burning purpose. Fire → 112/101 first.',
   'https://greendelhi.nic.in/', null, null,
   'Environmental / burning — not municipal collection',
   'green_delhi_app')
) as v(slug, auth_slug, level_order, level_name, description, action_url, phone, email, conditions, source_slug)
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where c.slug = 'waste_garbage'
on conflict (slug) do update set
  description = excluded.description,
  action_url = excluded.action_url,
  phone = excluded.phone,
  email = excluded.email,
  category_id = excluded.category_id,
  source_id = excluded.source_id,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ============================================================================
-- Sanity notes (comments for operators)
-- ============================================================================
-- select slug, emergency_relevant from public.issue_types
--   where category_id = (select id from public.issue_categories where slug = 'waste_garbage') and active;
-- select a.slug, c.purpose, c.channel_type, c.label, c.value
--   from public.authority_channels c join public.authorities a on a.id = c.authority_id
--   where a.slug in ('mcd','ndmc','dpcc','delhi_cantonment') and c.active;
