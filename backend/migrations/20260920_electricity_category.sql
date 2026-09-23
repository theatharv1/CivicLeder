-- My Delhi — Electricity category ONLY (+ generalized rights / knowledge / services / escalation)
-- Prefer AFTER Construction (idempotent re-run OK).
-- Also runnable AFTER supabase/FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql.
-- Does NOT delete Building / Construction / Fire Safety data.
-- Does NOT invent portals/phones. My Delhi opens official URLs only — never submits.
-- MD-###### remains internal — never an official government reference.
-- NEVER auto-assign DISCOM from GPS. NEVER show CGRF/Ombudsman as first step for ordinary outage.
-- Verified 2026-09-20 against official BRPL/BYPL/TPDDL/DERC/MoP/Play Store/App Store pages.

create extension if not exists "pgcrypto";

-- ============================================================================
-- 0) Schema prerequisites — MUST stay before any INSERT/COMMENT using these columns
-- ============================================================================

alter table public.issue_types
  add column if not exists emergency_relevant boolean not null default false;

comment on column public.issue_types.emergency_relevant is
  'When true, prioritize emergency contacts (112/101) and DISCOM emergency channels before normal complaint portals.';

-- Extend authority_channels for reason-specific routing (additive)
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
  'Reason-specific channel purpose: general_customer_care, no_supply, emergency, fire_shock, power_theft, streetlight, billing, metering, new_connection, grievance, cgrf, ombudsman, tracking, app, whatsapp, sms, email, web_portal, etc.';

-- Expand channel_type check (keep prior values + app/sms)
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

-- Optional draft hint column on reports (citizen-selected DISCOM — not GPS proof)
alter table public.reports
  add column if not exists electricity_provider_hint text;

comment on column public.reports.electricity_provider_hint is
  'Citizen-selected DISCOM hint: brpl|bypl|tpddl|ndmc|unknown — never inferred from GPS alone.';

-- ============================================================================
-- 0b) Generalized citizen_rights (reusable across categories)
-- ============================================================================

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
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'citizen_rights' and policyname = 'Public read citizen_rights'
  ) then
    create policy "Public read citizen_rights" on public.citizen_rights
      for select using (active = true);
  end if;
end $$;

-- ============================================================================
-- 0c) Generalized citizen_knowledge ("YOU MAY NOT KNOW THIS" cards)
-- ============================================================================

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
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'citizen_knowledge' and policyname = 'Public read citizen_knowledge'
  ) then
    create policy "Public read citizen_knowledge" on public.citizen_knowledge
      for select using (active = true);
  end if;
end $$;

-- ============================================================================
-- 0d) Generalized official_services (apps / portals discovery)
-- ============================================================================

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

-- FK from citizen_knowledge.official_service_id after official_services exists
do $$
begin
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
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'official_services' and policyname = 'Public read official_services'
  ) then
    create policy "Public read official_services" on public.official_services
      for select using (active = true);
  end if;
end $$;

-- ============================================================================
-- 0e) Escalation paths (never first step for ordinary no-supply)
-- ============================================================================

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
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'escalation_paths' and policyname = 'Public read escalation_paths'
  ) then
    create policy "Public read escalation_paths" on public.escalation_paths
      for select using (active = true);
  end if;
end $$;

-- ============================================================================
-- 1) Category + sources
-- ============================================================================

insert into public.issue_categories (slug, name, short_description, sort_order, active)
values (
  'electricity',
  'Electricity',
  'Power supply, metering, billing or electrical safety concern (reported concern — not a legal finding)',
  4,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  sort_order = excluded.sort_order,
  active = true;

insert into public.sources (slug, name, organization, official_url, notes, last_verified_at, active)
values
  ('brpl', 'BSES Rajdhani Power Limited', 'BRPL',
   'https://www.bsesdelhi.com/web/brpl',
   '19123; Emergency/Streetlight 011-49516707; WhatsApp 8800919123; email brpl.customercare@reliancegroupindia.com (verified on bsesdelhi.com 2026-09-20).',
   current_date, true),
  ('bypl', 'BSES Yamuna Power Limited', 'BYPL',
   'https://www.bsesdelhi.com/web/bypl',
   '19122; Streetlight Emergency 011-41999808; email bypl.customercare@reliancegroupindia.com (verified on bsesdelhi.com 2026-09-20).',
   current_date, true),
  ('tpddl', 'Tata Power-DDL', 'TPDDL',
   'https://www.tatapower-ddl.com/',
   '19124 / 1800-208-9124; customercare@tatapower-ddl.com (TPDDL Customer Charter / touchpoints).',
   current_date, true),
  ('ndmc', 'New Delhi Municipal Council', 'NDMC',
   'https://www.ndmc.gov.in/',
   'NDMC electricity is separate from BRPL/BYPL/TPDDL. No-current centres listed on ndmc.gov.in electricity pages. Do not invent a universal emergency number.',
   current_date, true),
  ('derc', 'Delhi Electricity Regulatory Commission', 'DERC',
   'https://www.derc.gov.in/',
   'Regulator — rights/knowledge/escalation context only; not first-line no-supply.',
   current_date, true),
  ('mop_consumer_rights', 'Ministry of Power — Electricity (Rights of Consumers) Rules', 'Ministry of Power, GoI',
   'https://powermin.gov.in/en/content/acts-and-notifications',
   'Electricity (Rights of Consumers) Rules, 2020 and Amendment Rules, 2024 (new connection timelines). Knowledge/rights source — not a complaint channel.',
   current_date, true)
on conflict (slug) do update set
  name = excluded.name,
  official_url = excluded.official_url,
  notes = excluded.notes,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ============================================================================
-- 2) Soft-deactivate prior Phase-2 electricity shell types (replaced by complete list)
-- ============================================================================

update public.issue_types t
set active = false
from public.issue_categories c
where t.category_id = c.id
  and c.slug = 'electricity'
  and t.slug in ('power_outage', 'exposed_wires', 'streetlight_outage');

-- ============================================================================
-- 3) Electricity issue types
-- ============================================================================

insert into public.issue_types (
  category_id, slug, name, short_description, sort_order,
  source_id, verification_status, emergency_relevant, active
)
select c.id, v.slug, v.name, v.short_description, v.sort_order,
  s.id, 'probable', v.emergency_relevant, true
from public.issue_categories c
join public.sources s on s.slug = 'derc'
cross join (values
  ('electricity_no_supply',
   'No electricity supply',
   'Reported concern that power supply is not available at a premises',
   1, false),
  ('electricity_area_outage',
   'Area power outage',
   'Reported concern about a wider area outage',
   2, false),
  ('electricity_scheduled_outage',
   'Scheduled outage concern',
   'Reported concern related to a scheduled outage',
   3, false),
  ('electricity_unscheduled_outage',
   'Unscheduled outage',
   'Reported concern about an unscheduled power interruption',
   4, false),
  ('electricity_low_voltage',
   'Low voltage concern',
   'Reported concern about low voltage supply',
   5, false),
  ('electricity_high_voltage',
   'High voltage concern',
   'Reported concern about high voltage — may be safety-related',
   6, true),
  ('electricity_voltage_fluctuation',
   'Voltage fluctuation',
   'Reported concern about fluctuating voltage',
   7, false),
  ('electricity_phase_problem',
   'Phase / phase-failure concern',
   'Reported concern about a phase problem at a premises',
   8, false),
  ('electricity_power_quality',
   'Power quality concern',
   'Reported concern about power quality',
   9, false),
  ('electricity_meter_not_working',
   'Meter not working',
   'Reported concern that a meter may not be working',
   10, false),
  ('electricity_meter_damaged',
   'Meter appears damaged',
   'Reported concern that a meter appears damaged',
   11, false),
  ('electricity_meter_burnt',
   'Meter appears burnt',
   'Reported concern that a meter appears burnt — safety first if sparking/fire',
   12, true),
  ('electricity_meter_stolen',
   'Meter reported stolen',
   'Reported concern that a meter may have been stolen',
   13, false),
  ('electricity_meter_sparking',
   'Meter sparking',
   'Reported meter sparking — treat as electrical safety emergency if immediate danger',
   14, true),
  ('electricity_meter_testing',
   'Request meter testing',
   'Reported request or concern about meter testing',
   15, false),
  ('electricity_meter_reading_dispute',
   'Meter reading dispute',
   'Reported concern about a meter reading',
   16, false),
  ('electricity_wrong_bill',
   'Wrong bill concern',
   'Reported concern that a bill may be incorrect',
   17, false),
  ('electricity_high_bill',
   'Unusually high bill',
   'Reported concern about an unexpectedly high bill',
   18, false),
  ('electricity_payment_not_reflected',
   'Payment not reflected',
   'Reported concern that a payment may not be showing on the account',
   19, false),
  ('electricity_duplicate_payment',
   'Duplicate payment concern',
   'Reported concern about a possible duplicate payment',
   20, false),
  ('electricity_billing_dispute',
   'Billing dispute',
   'Reported billing dispute — use billing / customer-care channels',
   21, false),
  ('electricity_connection_delay',
   'New connection delayed',
   'Reported concern that a new connection application may be delayed',
   22, false),
  ('electricity_new_connection',
   'New electricity connection',
   'Request or concern about applying for a new electricity connection',
   23, false),
  ('electricity_load_change',
   'Load change request',
   'Reported request or concern about changing sanctioned load',
   24, false),
  ('electricity_name_change',
   'Name change on connection',
   'Reported request or concern about changing name on a connection',
   25, false),
  ('electricity_reconnection',
   'Reconnection request',
   'Reported request or concern about reconnection of supply',
   26, false),
  ('electricity_disconnection',
   'Disconnection concern',
   'Reported concern about disconnection of supply',
   27, false),
  ('electricity_service_shift',
   'Service / meter shift',
   'Reported request or concern about shifting a service or meter',
   28, false),
  ('electricity_streetlight',
   'Streetlight outage',
   'Reported streetlight concern — authority depends on asset owner / DISCOM',
   29, false),
  ('electricity_power_theft_report',
   'Report suspected power theft',
   'Reported concern about possible power theft — use dedicated theft channel; do not confront anyone',
   30, false),
  ('electricity_safety_hazard',
   'Electrical safety hazard',
   'Reported electrical safety hazard — call emergency services if anyone is in immediate danger',
   31, true),
  ('electricity_live_wire',
   'Live / fallen wire',
   'Reported live or fallen wire — stay away; call 112 / 101 and DISCOM emergency if verified',
   32, true),
  ('electricity_pole_damage',
   'Damaged pole concern',
   'Reported concern about a damaged electricity pole',
   33, false),
  ('electricity_transformer_issue',
   'Transformer issue',
   'Reported concern about a transformer — emergency if fire/smoke/immediate danger',
   34, true),
  ('electricity_fire',
   'Electrical fire / smoke',
   'Reported electrical fire or smoke — call 101 / 112 first',
   35, true),
  ('electricity_solar_rooftop',
   'Rooftop solar / prosumer',
   'Reported request or concern about rooftop solar / net-metering',
   36, false),
  ('electricity_other',
   'Something else (electricity)',
   'Other reported electricity concern — DISCOM still needs confirmation',
   37, false)
) as v(slug, name, short_description, sort_order, emergency_relevant)
where c.slug = 'electricity'
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
  v.explanation, v.sort_order, 'My Delhi Electricity safety guidance', null, current_date, true
from public.issue_categories c
cross join (values
  ('live_wire_or_fallen_conductor',
   'Is there a live wire, fallen conductor, or exposed energized cable nearby?',
   'Stay away. Do not touch. Call 112 / 101 and the DISCOM emergency channel if verified.',
   1),
  ('electrical_fire_or_smoke',
   'Is there electrical fire, smoke, or burning smell from electrical equipment right now?',
   'Call 101 / 112 first. Do not attempt repairs.',
   2),
  ('electrocution_or_shock_risk',
   'Has anyone been shocked, or is there an immediate shock risk to people?',
   'Immediate shock risk is an emergency — call 112.',
   3),
  ('meter_sparking_now',
   'Is a meter or electrical panel sparking right now?',
   'Sparking with immediate danger: call 112 / 101 and DISCOM emergency if verified.',
   4),
  ('immediate_danger_people',
   'Is there an immediate danger to people from this electrical situation?',
   'Immediate danger requires emergency services before any normal complaint.',
   5)
) as v(question_key, question_text, explanation, sort_order)
where c.slug = 'electricity'
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
  'Selected issue type is emergency-relevant for Electricity',
  'user_selected_yes', 'high',
  'Call 112 / 101 first. Stay away from live wires and electrical fire. Use DISCOM emergency/fire-shock channel only if verified for your provider. Do not use normal billing/no-supply channels first.',
  t.sort_order, 'My Delhi Electricity', current_date, true
from public.issue_categories c
join public.issue_types t on t.category_id = c.id
where c.slug = 'electricity'
  and t.emergency_relevant = true
  and t.active = true
  and not exists (
    select 1 from public.emergency_rules r
    where r.category_id = c.id
      and r.issue_type_id = t.id
      and r.rule_kind = 'emergency_signal'
  );

-- ============================================================================
-- 5) Authorities (reuse / upsert DISCOMs + DERC)
-- ============================================================================

insert into public.authorities
  (slug, name, department, government, official_website, emergency_number, short_description,
   source_name, source_url, source_id, last_verified_at, verification_status, active)
select v.slug, v.name, v.department, v.government, v.website, v.emergency,
  v.short_description, s.name, s.official_url, s.id, current_date, 'verified', true
from (values
  ('brpl', 'BSES Rajdhani Power Limited (BRPL)', 'BRPL', 'Distribution licensee',
   'https://www.bsesdelhi.com/web/brpl', '011-49516707',
   'Distribution licensee for BRPL service areas (South & West Delhi). Service area needs confirmation — GPS does not prove DISCOM.',
   'brpl'),
  ('bypl', 'BSES Yamuna Power Limited (BYPL)', 'BYPL', 'Distribution licensee',
   'https://www.bsesdelhi.com/web/bypl', null,
   'Distribution licensee for BYPL service areas (East & Central Delhi). Service area needs confirmation — GPS does not prove DISCOM.',
   'bypl'),
  ('tpddl', 'Tata Power-DDL (TPDDL)', 'TPDDL', 'Distribution licensee',
   'https://www.tatapower-ddl.com/', '19124',
   'Distribution licensee for TPDDL service areas (North & North-West Delhi). Service area needs confirmation.',
   'tpddl'),
  ('ndmc', 'New Delhi Municipal Council (NDMC)', 'NDMC', 'Municipal / distribution',
   'https://www.ndmc.gov.in/', null,
   'NDMC-area electricity is separate from BRPL/BYPL/TPDDL. Use NDMC electricity / no-current centres — not a universal emergency number.',
   'ndmc'),
  ('derc', 'Delhi Electricity Regulatory Commission (DERC)', 'DERC', 'Regulator',
   'https://www.derc.gov.in/', null,
   'Regulator — consumer rights, standards, and escalation framework. Not first-line for no-supply complaints.',
   'derc')
) as v(slug, name, department, government, website, emergency, short_description, source_slug)
join public.sources s on s.slug = v.source_slug
on conflict (slug) do update set
  name = excluded.name,
  department = excluded.department,
  official_website = excluded.official_website,
  emergency_number = coalesce(excluded.emergency_number, public.authorities.emergency_number),
  short_description = excluded.short_description,
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  source_id = excluded.source_id,
  last_verified_at = excluded.last_verified_at,
  verification_status = excluded.verification_status,
  active = true;

-- ============================================================================
-- 6) Jurisdictions — service-area notes WITHOUT fake GIS polygons
-- ============================================================================

insert into public.jurisdictions
  (slug, name, region, jurisdiction_type, notes, source_id, last_verified_at, verification_status, active)
select v.slug, v.name, 'delhi', 'utility_area', v.notes, s.id, current_date, 'probable', true
from (values
  ('brpl_service_area', 'BRPL service area (needs confirmation)',
   'Candidate DISCOM: BRPL. Confirm from bill / CA number / official DISCOM materials. No GIS polygon seeded — GPS alone does not prove BRPL.',
   'brpl'),
  ('bypl_service_area', 'BYPL service area (needs confirmation)',
   'Candidate DISCOM: BYPL. Confirm from bill / CA number / official DISCOM materials. No GIS polygon seeded.',
   'bypl'),
  ('tpddl_service_area', 'TPDDL service area (needs confirmation)',
   'Candidate DISCOM: TPDDL. Confirm from bill / CA number / official DISCOM materials. No GIS polygon seeded.',
   'tpddl'),
  ('ndmc_electricity_area', 'NDMC electricity area (needs confirmation)',
   'Candidate: NDMC electricity. Distinct from BRPL/BYPL/TPDDL. Confirm from bill / NDMC area. No GIS polygon seeded.',
   'ndmc')
) as v(slug, name, notes, source_slug)
join public.sources s on s.slug = v.source_slug
on conflict (slug) do update set
  name = excluded.name,
  notes = excluded.notes,
  source_id = excluded.source_id,
  last_verified_at = excluded.last_verified_at,
  verification_status = excluded.verification_status,
  active = true;

-- ============================================================================
-- 7) Reason-specific channels (verified only)
-- ============================================================================

-- Helper pattern: upsert by authority + purpose + channel_type + value

-- BRPL general + no_supply + billing + metering (19123)
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, purpose, priority, availability,
  action_url, source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'phone', v.label, v.value, v.value, v.purpose, v.priority, '24x7',
  null, s.name, 'https://www.bsesdelhi.com/web/brpl/contact-points', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'brpl'
cross join (values
  ('BRPL 24x7 toll-free customer care', '19123', 'general_customer_care', 10),
  ('BRPL no-supply / complaints (19123)', '19123', 'no_supply', 10),
  ('BRPL billing / metering customer care', '19123', 'billing', 20),
  ('BRPL metering customer care', '19123', 'metering', 20),
  ('BRPL new connection customer care', '19123', 'new_connection', 30)
) as v(label, value, purpose, priority)
where a.slug = 'brpl'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = v.purpose and c.channel_type = 'phone' and c.value = v.value
  );

-- BRPL fire_shock / streetlight / emergency (011-49516707) — verified contact-points page
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, purpose, priority, availability,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'phone', v.label, '011-49516707', '011-49516707', v.purpose, 5, 'as_published',
  s.name, 'https://www.bsesdelhi.com/web/brpl/contact-points', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'brpl'
cross join (values
  ('BRPL Emergency / Streetlight', 'fire_shock'),
  ('BRPL Emergency / Streetlight', 'emergency'),
  ('BRPL Streetlight', 'streetlight')
) as v(label, purpose)
where a.slug = 'brpl'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = v.purpose and c.value = '011-49516707'
  );

-- BRPL email
insert into public.authority_channels (
  authority_id, channel_type, label, value, email, purpose, priority,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'email', 'BRPL customer care email',
  'brpl.customercare@reliancegroupindia.com',
  'brpl.customercare@reliancegroupindia.com',
  'email', 40,
  s.name, 'https://www.bsesdelhi.com/web/brpl/brpl-feedback', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'brpl'
where a.slug = 'brpl'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = 'email'
      and c.value = 'brpl.customercare@reliancegroupindia.com'
  );

-- BRPL WhatsApp (general business)
insert into public.authority_channels (
  authority_id, channel_type, label, value, whatsapp, purpose, priority,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'whatsapp', 'BRPL WhatsApp',
  '8800919123', '8800919123', 'whatsapp', 50,
  s.name, 'https://www.bsesdelhi.com/web/brpl/contact-points', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'brpl'
where a.slug = 'brpl'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = 'whatsapp' and c.value = '8800919123'
  );

-- BRPL power theft portal
insert into public.authority_channels (
  authority_id, channel_type, label, value, action_url, purpose, priority,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'portal', 'BRPL report power theft',
  'https://www.bsesdelhi.com/web/brpl/report-power-theft',
  'https://www.bsesdelhi.com/web/brpl/report-power-theft',
  'power_theft', 5,
  s.name, 'https://www.bsesdelhi.com/web/brpl/report-power-theft', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'brpl'
where a.slug = 'brpl'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = 'power_theft' and c.channel_type = 'portal'
  );

-- BRPL website
insert into public.authority_channels (
  authority_id, channel_type, label, value, action_url, purpose, priority,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'website', 'BRPL official website',
  'https://www.bsesdelhi.com/web/brpl',
  'https://www.bsesdelhi.com/web/brpl',
  'web_portal', 80,
  s.name, 'https://www.bsesdelhi.com/web/brpl', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'brpl'
where a.slug = 'brpl'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = 'website'
      and c.value = 'https://www.bsesdelhi.com/web/brpl'
  );

-- BYPL phones
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, purpose, priority, availability,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'phone', v.label, v.value, v.value, v.purpose, v.priority, '24x7',
  s.name, 'https://www.bsesdelhi.com/web/bypl/contact-points', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'bypl'
cross join (values
  ('BYPL 24x7 helpline', '19122', 'general_customer_care', 10),
  ('BYPL no-supply / complaints (19122)', '19122', 'no_supply', 10),
  ('BYPL billing customer care', '19122', 'billing', 20),
  ('BYPL metering customer care', '19122', 'metering', 20),
  ('BYPL new connection customer care', '19122', 'new_connection', 30)
) as v(label, value, purpose, priority)
where a.slug = 'bypl'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = v.purpose and c.value = v.value
  );

-- BYPL streetlight emergency only (NOT labeled fire/shock on current page)
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, purpose, priority,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'phone', 'BYPL Streetlight Emergency',
  '011-41999808', '011-41999808', 'streetlight', 5,
  s.name, 'https://www.bsesdelhi.com/web/bypl/contact-points', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'bypl'
where a.slug = 'bypl'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = 'streetlight' and c.value = '011-41999808'
  );

insert into public.authority_channels (
  authority_id, channel_type, label, value, email, purpose, priority,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'email', 'BYPL customer care email',
  'bypl.customercare@reliancegroupindia.com',
  'bypl.customercare@reliancegroupindia.com',
  'email', 40,
  s.name, 'https://www.bsesdelhi.com/web/bypl/bypl-feedback', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'bypl'
where a.slug = 'bypl'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = 'email'
      and c.value = 'bypl.customercare@reliancegroupindia.com'
  );

insert into public.authority_channels (
  authority_id, channel_type, label, value, action_url, purpose, priority,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'portal', 'BYPL report power theft',
  'https://www.bsesdelhi.com/web/bypl/report-power-theft',
  'https://www.bsesdelhi.com/web/bypl/report-power-theft',
  'power_theft', 5,
  s.name, 'https://www.bsesdelhi.com/web/bypl/report-power-theft', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'bypl'
where a.slug = 'bypl'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = 'power_theft' and c.channel_type = 'portal'
  );

insert into public.authority_channels (
  authority_id, channel_type, label, value, action_url, purpose, priority,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'website', 'BYPL official website',
  'https://www.bsesdelhi.com/web/bypl',
  'https://www.bsesdelhi.com/web/bypl',
  'web_portal', 80,
  s.name, 'https://www.bsesdelhi.com/web/bypl', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'bypl'
where a.slug = 'bypl'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = 'website'
      and c.value = 'https://www.bsesdelhi.com/web/bypl'
  );

-- TPDDL phones + email + portal + tracking
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, purpose, priority, availability,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'phone', v.label, v.value, v.value, v.purpose, v.priority, v.availability,
  s.name, 'https://www.tatapower-ddl.com/', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'tpddl'
cross join (values
  ('TPDDL Sampark Kendra 19124', '19124', 'general_customer_care', 10, '24x7'),
  ('TPDDL no-supply (19124)', '19124', 'no_supply', 10, '24x7'),
  ('TPDDL fire & safety (19124)', '19124', 'fire_shock', 5, '24x7'),
  ('TPDDL emergency (19124)', '19124', 'emergency', 5, '24x7'),
  ('TPDDL billing (19124)', '19124', 'billing', 20, '24x7'),
  ('TPDDL metering (19124)', '19124', 'metering', 20, '24x7'),
  ('TPDDL streetlight (19124)', '19124', 'streetlight', 20, '24x7'),
  ('TPDDL theft reporting (19124)', '19124', 'power_theft', 15, '24x7'),
  ('TPDDL new connection (19124)', '19124', 'new_connection', 30, '24x7'),
  ('TPDDL alternate helpline (outside Delhi / if 19124 unreachable)', '1800-208-9124', 'general_customer_care', 15, 'as_published')
) as v(label, value, purpose, priority, availability)
where a.slug = 'tpddl'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = v.purpose and c.value = v.value
  );

insert into public.authority_channels (
  authority_id, channel_type, label, value, email, purpose, priority,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'email', 'TPDDL customer care email',
  'customercare@tatapower-ddl.com',
  'customercare@tatapower-ddl.com',
  'email', 40,
  s.name, 'https://www.tatapower-ddl.com/contact-us/touchpoints/head-of-department-customer-services',
  s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'tpddl'
where a.slug = 'tpddl'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = 'email'
      and c.value = 'customercare@tatapower-ddl.com'
  );

insert into public.authority_channels (
  authority_id, channel_type, label, value, action_url, purpose, priority, requires_login,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'portal', 'TPDDL online request / complaint',
  'https://www.tatapower-ddl.com/customer/complaint/online-complaint.aspx',
  'https://www.tatapower-ddl.com/customer/complaint/online-complaint.aspx',
  'web_portal', 10, true,
  s.name, 'https://www.tatapower-ddl.com/customer/complaint/online-complaint.aspx',
  s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'tpddl'
where a.slug = 'tpddl'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = 'web_portal'
      and c.value like '%online-complaint%'
  );

insert into public.authority_channels (
  authority_id, channel_type, label, value, tracking_url, purpose, priority, requires_reference_number,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'portal', 'TPDDL complaint / request status',
  'https://www.tatapower-ddl.com/customer/complaint/view-current-status.aspx',
  'https://www.tatapower-ddl.com/customer/complaint/view-current-status.aspx',
  'tracking', 20, true,
  s.name, 'https://www.tatapower-ddl.com/customer/complaint/view-current-status.aspx',
  s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'tpddl'
where a.slug = 'tpddl'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = 'tracking'
  );

insert into public.authority_channels (
  authority_id, channel_type, label, value, action_url, purpose, priority,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'website', 'TPDDL official website',
  'https://www.tatapower-ddl.com/',
  'https://www.tatapower-ddl.com/',
  'web_portal', 80,
  s.name, 'https://www.tatapower-ddl.com/', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'tpddl'
where a.slug = 'tpddl'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = 'website'
      and c.value = 'https://www.tatapower-ddl.com/'
  );

-- NDMC: website + no-current centres page (no invented universal emergency; 19121 retained from prior seed if present)
insert into public.authority_channels (
  authority_id, channel_type, label, value, action_url, purpose, priority, geography,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'portal', 'NDMC No Current complaint centres (area-specific)',
  'https://www.ndmc.gov.in/departments/electricity_nocurrent_complaint.aspx',
  'https://www.ndmc.gov.in/departments/electricity_nocurrent_complaint.aspx',
  'no_supply', 10, 'ndmc_area',
  s.name, 'https://www.ndmc.gov.in/departments/electricity_nocurrent_complaint.aspx',
  s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'ndmc'
where a.slug = 'ndmc'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = 'no_supply'
      and c.value like '%electricity_nocurrent%'
  );

insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, purpose, priority, geography,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'phone', 'NDMC electricity helpline (prior verified seed — confirm NDMC area)',
  '19121', '19121', 'general_customer_care', 30, 'ndmc_area',
  s.name, 'https://www.ndmc.gov.in/', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'ndmc'
where a.slug = 'ndmc'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = 'general_customer_care' and c.value = '19121'
  );

insert into public.authority_channels (
  authority_id, channel_type, label, value, action_url, purpose, priority,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'website', 'NDMC official website',
  'https://www.ndmc.gov.in/',
  'https://www.ndmc.gov.in/',
  'web_portal', 80,
  s.name, 'https://www.ndmc.gov.in/', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'ndmc'
where a.slug = 'ndmc'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = 'website'
      and c.value = 'https://www.ndmc.gov.in/'
  );

-- DERC website (regulatory / knowledge only)
insert into public.authority_channels (
  authority_id, channel_type, label, value, action_url, purpose, priority,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'website', 'DERC official website',
  'https://www.derc.gov.in/',
  'https://www.derc.gov.in/',
  'grievance', 90,
  s.name, 'https://www.derc.gov.in/', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'derc'
where a.slug = 'derc'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = 'website'
  );

-- ============================================================================
-- 8) Official apps (Play Store / App Store only — no APKs)
-- ============================================================================

insert into public.official_services (
  slug, name, service_type, organization, authority_id, category_id,
  description, who_it_is_for, when_to_use, purpose, channel_type,
  official_url, play_store_url, app_store_url, requires_login,
  source_id, last_verified_at, active
)
select v.slug, v.name, 'app', v.org, a.id, c.id,
  v.description, v.who_for, v.when_use, 'app', 'app',
  v.website, v.play, v.ios, true,
  s.id, current_date, true
from public.issue_categories c
cross join (values
  ('brpl_power_app', 'BRPL Power App', 'brpl', 'BSES Rajdhani Power Limited',
   'Official BRPL consumer app for account, bills, complaints and e-services.',
   'BRPL consumers', 'When you need BRPL digital services via the official app',
   'https://www.bsesdelhi.com/web/brpl',
   'https://play.google.com/store/apps/details?id=com.bses.bsesapp',
   'https://apps.apple.com/in/app/brpl-power-app/id1198980319',
   'brpl'),
  ('bypl_connect_app', 'BYPL Connect', 'bypl', 'BSES Yamuna Power Limited',
   'Official BYPL consumer app for account and consumer services.',
   'BYPL consumers', 'When you need BYPL digital services via the official app',
   'https://www.bsesdelhi.com/web/bypl',
   'https://play.google.com/store/apps/details?id=com.bses.bypl.prod',
   'https://apps.apple.com/in/app/bypl-connect/id1524511018',
   'bypl'),
  ('my_tata_power_app', 'My Tata Power', 'tpddl', 'Tata Power / TPDDL',
   'Official Tata Power consumer app (My Tata Power) for account, bills and support.',
   'TPDDL / Tata Power consumers', 'When you need TPDDL digital services via the official app',
   'https://www.tatapower-ddl.com/',
   'https://play.google.com/store/apps/details?id=com.sew.tatapower',
   'https://apps.apple.com/in/app/my-tata-power-consumer-app/id1606674128',
   'tpddl')
) as v(slug, name, auth_slug, org, description, who_for, when_use, website, play, ios, source_slug)
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where c.slug = 'electricity'
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  play_store_url = excluded.play_store_url,
  app_store_url = excluded.app_store_url,
  official_url = excluded.official_url,
  source_id = excluded.source_id,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- Mirror app channels on authority_channels
insert into public.authority_channels (
  authority_id, channel_type, label, value, action_url, purpose, priority,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'app', os.name, coalesce(os.play_store_url, os.app_store_url),
  coalesce(os.play_store_url, os.app_store_url), 'app', 25,
  s.name, os.play_store_url, s.id, current_date, true
from public.official_services os
join public.authorities a on a.id = os.authority_id
join public.sources s on s.id = os.source_id
where os.slug in ('brpl_power_app', 'bypl_connect_app', 'my_tata_power_app')
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = 'app' and c.purpose = 'app'
      and c.label = os.name
  );

-- ============================================================================
-- 9) authority_services (complaint / emergency helpers)
-- ============================================================================

insert into public.authority_services (
  authority_id, slug, service_name, description, service_type,
  official_url, filing_url, tracking_url, phone, integration_type,
  source_id, last_verified_at, active
)
select a.id, v.slug, v.service_name, v.description, v.service_type,
  v.official_url, v.filing_url, v.tracking_url, v.phone, v.integration_type,
  s.id, current_date, true
from (values
  ('brpl', 'brpl_no_supply_helpline', 'BRPL no-supply / customer care',
   'Call 19123 for no-supply and related complaints. Confirm BRPL service area first. My Delhi does not submit complaints.',
   'complaint', 'https://www.bsesdelhi.com/web/brpl', null, null, '19123', 'phone', 'brpl'),
  ('brpl', 'brpl_fire_shock_emergency', 'BRPL Emergency / Streetlight',
   'Verified BRPL Emergency / Streetlight number 011-49516707. For life-threatening emergency also call 112 / 101.',
   'emergency', 'https://www.bsesdelhi.com/web/brpl/contact-points', null, null, '011-49516707', 'phone', 'brpl'),
  ('brpl', 'brpl_power_theft', 'BRPL report power theft',
   'Official BRPL power-theft reporting portal. Do not confront anyone. Opening the URL is not a filed complaint until you complete it on the official site.',
   'complaint', 'https://www.bsesdelhi.com/web/brpl/report-power-theft',
   'https://www.bsesdelhi.com/web/brpl/report-power-theft', null, null, 'deep_link', 'brpl'),
  ('bypl', 'bypl_no_supply_helpline', 'BYPL no-supply / customer care',
   'Call 19122 for no-supply and related complaints. Confirm BYPL service area first.',
   'complaint', 'https://www.bsesdelhi.com/web/bypl', null, null, '19122', 'phone', 'bypl'),
  ('bypl', 'bypl_power_theft', 'BYPL report power theft',
   'Official BYPL power-theft reporting portal. Do not confront anyone.',
   'complaint', 'https://www.bsesdelhi.com/web/bypl/report-power-theft',
   'https://www.bsesdelhi.com/web/bypl/report-power-theft', null, null, 'deep_link', 'bypl'),
  ('bypl', 'bypl_streetlight_emergency', 'BYPL Streetlight Emergency',
   'Verified BYPL Streetlight Emergency number 011-41999808. Separate fire/shock number not confirmed on current contact page.',
   'complaint', 'https://www.bsesdelhi.com/web/bypl/contact-points', null, null, '011-41999808', 'phone', 'bypl'),
  ('tpddl', 'tpddl_sampark_kendra', 'TPDDL Sampark Kendra',
   'Call 19124 (or 1800-208-9124 if unreachable / outside Delhi). Used for no-supply, billing, metering, streetlight, theft and related services.',
   'complaint', 'https://www.tatapower-ddl.com/', null, null, '19124', 'phone', 'tpddl'),
  ('tpddl', 'tpddl_online_complaint', 'TPDDL online request / complaint',
   'Official TPDDL request/complaint registration. Citizen files on the official site — My Delhi does not submit.',
   'complaint', 'https://www.tatapower-ddl.com/customer/complaint/online-complaint.aspx',
   'https://www.tatapower-ddl.com/customer/complaint/online-complaint.aspx',
   'https://www.tatapower-ddl.com/customer/complaint/view-current-status.aspx',
   '19124', 'deep_link', 'tpddl'),
  ('ndmc', 'ndmc_no_current_centres', 'NDMC No Current complaint centres',
   'Area-specific NDMC no-current centres. Open the official page to find the centre for your locality. No invented universal emergency number.',
   'complaint', 'https://www.ndmc.gov.in/departments/electricity_nocurrent_complaint.aspx',
   'https://www.ndmc.gov.in/departments/electricity_nocurrent_complaint.aspx',
   null, null, 'deep_link', 'ndmc')
) as v(auth_slug, slug, service_name, description, service_type, official_url, filing_url, tracking_url, phone, integration_type, source_slug)
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
on conflict (authority_id, slug) do update set
  service_name = excluded.service_name,
  description = excluded.description,
  service_type = excluded.service_type,
  official_url = excluded.official_url,
  filing_url = excluded.filing_url,
  tracking_url = excluded.tracking_url,
  phone = excluded.phone,
  integration_type = excluded.integration_type,
  source_id = excluded.source_id,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ============================================================================
-- 10) Routing — needs_confirmation / needs_service_area; never auto-primary DISCOM
-- ============================================================================

update public.routing_rules r
set confidence = 'needs_confirmation',
    routing_mode = 'needs_service_area',
    is_primary = false,
    notes = 'Electricity provider needs confirmation. GPS alone does not prove DISCOM. Confirm from bill / CA number / official materials.',
    last_verified_at = current_date
from public.issue_categories c, public.authorities a
where r.category_id = c.id
  and r.authority_id = a.id
  and c.slug = 'electricity'
  and a.slug in ('brpl', 'bypl', 'tpddl', 'ndmc')
  and r.issue_type_id is null;

insert into public.routing_rules
  (category_id, issue_type_id, authority_id, confidence, routing_mode, is_primary, notes,
   source_name, source_url, source_id, last_verified_at, active)
select c.id, null, a.id, 'needs_confirmation', 'needs_service_area', false, v.notes,
  s.name, s.official_url, s.id, current_date, true
from public.issue_categories c
cross join (values
  ('brpl', 'brpl', 'Candidate DISCOM: BRPL (19123). Confirm service area — do not auto-select.'),
  ('bypl', 'bypl', 'Candidate DISCOM: BYPL (19122). Confirm service area — do not auto-select.'),
  ('tpddl', 'tpddl', 'Candidate DISCOM: TPDDL (19124). Confirm service area — do not auto-select.'),
  ('ndmc', 'ndmc', 'Candidate: NDMC electricity. Distinct from BRPL/BYPL/TPDDL. Confirm NDMC area.'),
  ('derc', 'derc', 'Regulator only — rights / escalation knowledge. Not first-line no-supply.')
) as v(auth_slug, source_slug, notes)
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where c.slug = 'electricity'
  and not exists (
    select 1 from public.routing_rules r
    where r.category_id = c.id and r.authority_id = a.id and r.issue_type_id is null
  );

-- DERC routing: possible / conditional, never primary for ordinary complaints
update public.routing_rules r
set confidence = 'possible',
    routing_mode = 'conditional',
    is_primary = false,
    notes = 'DERC is the regulator — useful for rights and escalation knowledge, not first-line no-supply.',
    last_verified_at = current_date
from public.issue_categories c, public.authorities a
where r.category_id = c.id and r.authority_id = a.id
  and c.slug = 'electricity' and a.slug = 'derc' and r.issue_type_id is null;

-- ============================================================================
-- 11) Escalation paths (DISCOM → grievance → CGRF → Ombudsman). No CGRF phones invented.
-- ============================================================================

insert into public.escalation_paths (
  slug, authority_id, category_id, level_order, level_name, description,
  action_url, phone, conditions, source_id, last_verified_at, active
)
select v.slug, a.id, c.id, v.level_order, v.level_name, v.description,
  v.action_url, v.phone, v.conditions, s.id, current_date, true
from public.issue_categories c
cross join (values
  ('brpl_l1_complaint', 'brpl', 1, 'discom_complaint',
   'Register the concern with BRPL through 19123, official website/app, or email. Keep any official reference number.',
   'https://www.bsesdelhi.com/web/brpl', '19123',
   'Use first for ordinary no-supply / billing / metering concerns.', 'brpl'),
  ('brpl_l2_internal_grievance', 'brpl', 2, 'internal_grievance',
   'If the initial complaint is not resolved through normal customer care, use BRPL internal grievance redressal as published by BRPL / DERC framework.',
   'https://www.bsesdelhi.com/web/brpl', null,
   'Only after a normal DISCOM complaint pathway has been used where applicable.', 'brpl'),
  ('brpl_l3_cgrf', 'brpl', 3, 'cgrf',
   'Consumer Grievance Redressal Forum (CGRF) may become relevant when eligible grievances remain unresolved through the licensee process. Confirm current CGRF contact details from DERC / BRPL official materials — addresses not seeded as unverified.',
   'https://www.derc.gov.in/', null,
   'Not the first step for ordinary outage. Escalate only when conditions for CGRF apply.', 'derc'),
  ('brpl_l4_ombudsman', 'brpl', 4, 'ombudsman',
   'Electricity Ombudsman may be approached as a further escalation after CGRF where the framework allows. Confirm current contacts from DERC.',
   'https://www.derc.gov.in/', null,
   'After CGRF pathway where applicable — never first for ordinary no-supply.', 'derc'),
  ('bypl_l1_complaint', 'bypl', 1, 'discom_complaint',
   'Register with BYPL via 19122, official website/app, or email. Keep any official reference.',
   'https://www.bsesdelhi.com/web/bypl', '19122',
   'First step for ordinary BYPL consumer concerns.', 'bypl'),
  ('bypl_l2_internal_grievance', 'bypl', 2, 'internal_grievance',
   'Internal grievance redressal after normal customer-care channels.',
   'https://www.bsesdelhi.com/web/bypl', null,
   'After first complaint where applicable.', 'bypl'),
  ('bypl_l3_cgrf', 'bypl', 3, 'cgrf',
   'CGRF may apply for eligible unresolved grievances. Confirm current contacts from DERC / BYPL — not seeded as unverified addresses.',
   'https://www.derc.gov.in/', null,
   'Not first step for ordinary outage.', 'derc'),
  ('bypl_l4_ombudsman', 'bypl', 4, 'ombudsman',
   'Electricity Ombudsman further escalation after CGRF where applicable. Confirm via DERC.',
   'https://www.derc.gov.in/', null,
   'After CGRF where applicable.', 'derc'),
  ('tpddl_l1_complaint', 'tpddl', 1, 'discom_complaint',
   'Register via 19124, online request/complaint portal, or email. Keep the official request/complaint number.',
   'https://www.tatapower-ddl.com/customer/complaint/online-complaint.aspx', '19124',
   'First step for ordinary TPDDL concerns.', 'tpddl'),
  ('tpddl_l2_internal_grievance', 'tpddl', 2, 'internal_grievance',
   'TPDDL Internal Consumer Grievance Redressal Cell as referenced on the official complaint page.',
   'https://www.tatapower-ddl.com/customer/complaint/online-complaint.aspx', null,
   'After first complaint where applicable.', 'tpddl'),
  ('tpddl_l3_cgrf', 'tpddl', 3, 'cgrf',
   'CGRF may apply for eligible unresolved grievances. Confirm current contacts from DERC / TPDDL.',
   'https://www.derc.gov.in/', null,
   'Not first step for ordinary outage.', 'derc'),
  ('tpddl_l4_ombudsman', 'tpddl', 4, 'ombudsman',
   'Electricity Ombudsman further escalation after CGRF where applicable.',
   'https://www.derc.gov.in/', null,
   'After CGRF where applicable.', 'derc'),
  ('ndmc_l1_complaint', 'ndmc', 1, 'discom_complaint',
   'Use NDMC area no-current complaint centres / electricity channels. Confirm locality on the official NDMC page.',
   'https://www.ndmc.gov.in/departments/electricity_nocurrent_complaint.aspx', null,
   'First step for NDMC-area electricity concerns.', 'ndmc'),
  ('ndmc_l2_cgrf', 'ndmc', 2, 'cgrf',
   'NDMC Electricity Consumer Grievance Redressal Forum is referenced on NDMC electricity pages (Gole Market). Confirm current process on NDMC / DERC before approaching.',
   'https://www.ndmc.gov.in/departments/electricity_i_contacts.aspx', null,
   'Escalation only — not first for ordinary no-current.', 'ndmc'),
  ('ndmc_l3_ombudsman', 'ndmc', 3, 'ombudsman',
   'Electricity Ombudsman further escalation after CGRF where applicable. Confirm via DERC.',
   'https://www.derc.gov.in/', null,
   'After CGRF where applicable.', 'derc')
) as v(slug, auth_slug, level_order, level_name, description, action_url, phone, conditions, source_slug)
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where c.slug = 'electricity'
on conflict (slug) do update set
  description = excluded.description,
  action_url = excluded.action_url,
  phone = excluded.phone,
  conditions = excluded.conditions,
  level_order = excluded.level_order,
  source_id = excluded.source_id,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ============================================================================
-- 12) Citizen rights (soft language; 2024 connection timelines)
-- ============================================================================

insert into public.citizen_rights (
  slug, title, short_description, detailed_description, category_id, issue_type_id,
  right_type, who_can_use, when_it_applies, conditions, what_citizen_can_do,
  what_authority_must_do, time_limit, possible_remedy, possible_compensation,
  escalation_available, official_action_url, source_id, source_title, last_verified_at, active
)
select v.slug, v.title, v.short_description, v.detailed_description, c.id, t.id,
  v.right_type, v.who_can_use, v.when_it_applies, v.conditions, v.what_citizen_can_do,
  v.what_authority_must_do, v.time_limit, v.possible_remedy, v.possible_compensation,
  v.escalation_available, v.official_action_url, s.id, v.source_title, current_date, true
from public.issue_categories c
join public.sources s on s.slug = 'mop_consumer_rights'
cross join (values
  ('elec_right_know_rights', 'Know your electricity consumer rights',
   'Consumers have defined rights relating to electricity supply and service standards.',
   'The Electricity (Rights of Consumers) Rules, 2020 (as amended) set out consumer rights on connection, metering, billing, reliability, call centres, grievance redressal and related areas. Delhi consumers should also check DERC standards of performance. This is knowledge — not legal advice.',
   null::text, 'consumer_right', 'Electricity consumers',
   'When you receive or apply for electricity supply from a distribution licensee',
   'Subject to the Rules, applicable DERC regulations, and your DISCOM procedures',
   'Read official consumer-rights materials; use DISCOM customer care for service issues; escalate only through official grievance paths when eligible.',
   'Provide supply and services according to applicable rules and standards',
   null::text, 'Use official grievance / CGRF / Ombudsman paths where eligible',
   'May be eligible for compensation where applicable standards of performance are violated',
   true, 'https://powermin.gov.in/en/content/acts-and-notifications',
   'Ministry of Power — Acts and Notifications'),
  ('elec_right_new_connection_timeline', 'How long should a new electricity connection take?',
   'Rules prescribe maximum timelines for new connections, subject to conditions.',
   'Under the Electricity (Rights of Consumers) Amendment Rules, 2024, the Commission is to specify maximum timelines not exceeding: metropolitan areas 3 days; other municipal areas 7 days; rural areas 15 days; rural hilly terrain 30 days — after a complete application. If mains extension or a new substation is required, different outer limits apply. Delhi is a metropolitan area under the central Rules framework, but exact Delhi SOP/DERC application still needs confirmation — this is not an unconditional promise that every connection is released in 3 days.',
   'electricity_new_connection', 'service_timeline', 'Applicants for new connection / modification',
   'After submitting an application complete in all respects',
   'Subject to rules, local commission specifications, and infrastructure conditions',
   'Apply through your DISCOM official channel; keep application/reference; follow up using official status tools; escalate if timelines appear breached under applicable rules.',
   'Provide connection / modification within the applicable prescribed maximum, subject to conditions',
   'Metropolitan ≤3 days; other municipal ≤7; rural ≤15; rural hilly ≤30 (central Rules maximums — Delhi SOP may refine)',
   'Follow-up / grievance / possible compensation where SoP violated',
   'May be eligible where applicable standards are violated',
   true, 'https://powermin.gov.in/en/content/acts-and-notifications',
   'Electricity (Rights of Consumers) Amendment Rules, 2024'),
  ('elec_right_meter_defective', 'What can I do if my meter is defective?',
   'Consumers may request meter testing / related metering remedies under applicable rules.',
   'Consumer rules address metering, testing and replacement of defective meters. Use your DISCOM metering / customer-care channel. Do not tamper with the meter.',
   'electricity_meter_testing', 'metering', 'Consumers with a metering concern',
   'When a meter appears defective or readings are disputed',
   'Subject to DISCOM / DERC metering procedures',
   'Contact DISCOM metering/customer care; request testing through official process; keep bill/CA number and any reference.',
   'Attend to metering complaints under applicable standards',
   null, 'Meter testing / replacement where applicable',
   'May apply where SoP violated',
   true, 'https://www.derc.gov.in/',
   'Electricity (Rights of Consumers) Rules — metering'),
  ('elec_right_wrong_bill', 'What if my electricity bill is wrong?',
   'Billing disputes should go through DISCOM billing / customer-care channels.',
   'Consumer rules address billing and payment. Check reading, tariff, payments and arrears via official app/portal/customer care. Do not use emergency numbers for ordinary billing disputes.',
   'electricity_wrong_bill', 'billing', 'Consumers with a billing concern',
   'When a bill appears incorrect or unusually high',
   'Subject to DISCOM billing procedures and applicable regulations',
   'Contact DISCOM billing channel; keep bill PDF/screenshots and payment proof; escalate via grievance if unresolved.',
   'Address billing complaints under applicable standards',
   null, 'Bill correction / adjustment where applicable',
   'May apply where SoP violated',
   true, 'https://www.derc.gov.in/',
   'Electricity (Rights of Consumers) Rules — billing'),
  ('elec_right_unresolved_complaint', 'What if my complaint is not resolved?',
   'A formal escalation structure may be available after the licensee process.',
   'If an eligible grievance is not resolved through the distribution licensee normal complaint / internal grievance process, CGRF and then the Electricity Ombudsman may become relevant. Do not start with CGRF for an ordinary first outage report.',
   null, 'grievance', 'Consumers with an unresolved eligible grievance',
   'After using the appropriate DISCOM complaint pathway',
   'Eligibility and timelines depend on DERC / DISCOM grievance regulations',
   'Keep complaint reference; use internal grievance; then CGRF / Ombudsman only when conditions apply.',
   'Follow notified grievance redressal structure',
   null, 'Internal grievance → CGRF → Ombudsman where eligible',
   null, true, 'https://www.derc.gov.in/',
   'DERC / Electricity Act grievance framework'),
  ('elec_right_cgrf', 'When can I approach CGRF?',
   'CGRF is an escalation forum for eligible unresolved consumer grievances — not the first step for ordinary outages.',
   'Approach CGRF when your eligible grievance remains unresolved through the licensee complaint / internal grievance process, as per applicable regulations. Confirm current CGRF contacts from DERC / your DISCOM. My Delhi does not invent CGRF addresses.',
   null, 'escalation', 'Eligible electricity consumers',
   'When licensee grievance process has not resolved an eligible matter',
   'Subject to CGRF jurisdiction exclusions (e.g. certain assessment / theft matters under the Act)',
   'Confirm eligibility; use official CGRF process published by DERC / DISCOM; keep prior complaint references.',
   'Adjudicate eligible grievances as per framework',
   null, 'CGRF order / directions where applicable',
   null, true, 'https://www.derc.gov.in/',
   'DERC CGRF framework'),
  ('elec_right_ombudsman', 'When can I approach the Electricity Ombudsman?',
   'Ombudsman is a further escalation after CGRF where the framework allows.',
   'If you are not satisfied with a CGRF order (or as otherwise provided), the Electricity Ombudsman may be available. Confirm current contacts and process from DERC. Never use Ombudsman as the first step for no-supply.',
   null, 'escalation', 'Consumers after CGRF pathway where applicable',
   'After CGRF, subject to appeal/escalation rules',
   'Subject to Ombudsman regulations',
   'Confirm process on DERC; keep CGRF order and prior references.',
   'Decide appeals / representations as per framework',
   null, 'Ombudsman order where applicable',
   null, true, 'https://www.derc.gov.in/',
   'DERC Electricity Ombudsman framework'),
  ('elec_right_compensation', 'Can compensation apply when service standards are missed?',
   'You may be eligible for compensation where applicable standards of performance are violated — not automatic for every complaint.',
   'Consumer rules and DERC standards of performance provide compensation mechanisms for specified failures (e.g. connection timelines, reconnection, metering, outage restoration, voltage — as notified). Claiming usually requires a complaint/reference and following DISCOM / regulatory process. Do not treat this as a guarantee of payment.',
   null, 'compensation', 'Consumers where an applicable SoP was violated',
   'When a notified standard of performance appears breached',
   'Subject to notified standards, claim procedures, and exclusions',
   'Keep complaint/reference; ask DISCOM about compensation claim process; check DERC SoP.',
   'Pay compensation where rules require',
   null, 'Compensation claim where eligible',
   'May be eligible — not automatic',
   true, 'https://www.derc.gov.in/',
   'Rights of Consumers Rules + DERC SoP'),
  ('elec_right_dangerous_situation', 'What should I do during a dangerous electrical situation?',
   'Safety first: stay away; call 112 / 101; then DISCOM emergency if verified.',
   'For live wires, electrocution risk, electrical fire/smoke, or sparking with immediate danger: do not touch equipment; call 112 and/or 101; contact your DISCOM emergency / fire-shock channel only if verified. Do not fill long complaint forms before emergency response.',
   'electricity_live_wire', 'emergency_safety', 'Anyone near an electrical hazard',
   'Immediate danger from electricity',
   'Always prioritize personal safety',
   'Call 112/101; stay clear; then DISCOM emergency channel if verified for your provider.',
   'Emergency response by police/fire/DISCOM as applicable',
   null, 'Emergency response',
   null, false, 'https://112.gov.in/',
   'Emergency response 112 / Delhi Fire 101'),
  ('elec_right_power_theft_report', 'How do I report suspected electricity theft?',
   'Use the dedicated official theft-reporting channel — not billing/no-supply.',
   'Report suspected theft only through official DISCOM theft portals/helplines. Do not confront anyone. Do not take dangerous photographs. Some channels allow anonymous reporting.',
   'electricity_power_theft_report', 'reporting', 'Anyone reporting suspected theft',
   'When you suspect electricity theft',
   'Use only official channels; never confront suspects',
   'Open official theft portal or call the purpose-specific theft option where published; keep any reference if provided.',
   'Investigate as per law / licensee process',
   null, 'Official theft report',
   null, false, 'https://www.bsesdelhi.com/web/brpl/report-power-theft',
   'DISCOM official power-theft channels'),
  ('elec_right_suspicious_sms', 'How do I verify a suspicious electricity disconnection message?',
   'Do not click unknown payment links. Verify via official app/portal/customer care.',
   'Fraudulent SMS/calls may threaten disconnection. Verify dues and notices only through official DISCOM app, website, or verified customer-care numbers — never through links in suspicious messages.',
   'electricity_disconnection', 'consumer_protection', 'Consumers receiving threatening SMS/calls',
   'When a message looks suspicious',
   'Never share OTPs or pay via unknown links',
   'Ignore suspicious links; open official app/website yourself; call verified helpline; report fraud if needed.',
   'Publish official channels for verification',
   null, 'Verify via official channel',
   null, false, 'https://www.derc.gov.in/',
   'DISCOM official customer-care guidance'),
  ('elec_right_find_discom', 'How do I find which DISCOM serves my address?',
   'Confirm from your bill / CA number / official DISCOM materials — not from GPS guesswork.',
   'Delhi has BRPL, BYPL, TPDDL and NDMC electricity areas. My Delhi never claims GPS proves your DISCOM. Check the name on your electricity bill, CA/account number materials, or official DISCOM service information.',
   null, 'service_discovery', 'Anyone unsure of their DISCOM',
   'Before filing an electricity concern',
   'Do not rely on GPS alone',
   'Check bill header for BRPL/BYPL/TPDDL/NDMC; use official websites; select provider hint in the app.',
   'Publish service-area information',
   null, 'Correct DISCOM identification',
   null, false, 'https://www.derc.gov.in/',
   'DERC — Delhi distribution licensees'),
  ('elec_right_official_apps', 'What official electricity apps are available?',
   'BRPL Power App, BYPL Connect, and My Tata Power (official store links only).',
   'Use only official Play Store / App Store listings. Do not download APKs from third-party sites. NDMC may use NDMC digital channels for civic/electricity services — confirm on ndmc.gov.in.',
   null, 'service_discovery', 'DISCOM consumers',
   'When you want digital account / complaint services',
   'Official store links only',
   'Install from Play Store / App Store links shown by My Delhi for your confirmed DISCOM.',
   'Provide official apps',
   null, 'Official app access',
   null, false, 'https://play.google.com/store/apps/details?id=com.bses.bsesapp',
   'Official app store listings'),
  ('elec_right_track_complaint', 'How can I track my electricity complaint?',
   'Use the official reference from your DISCOM — MD-###### is not an official number.',
   'After you file on the official channel, ask for / save the DISCOM complaint or request number. TPDDL publishes an online status page. Other DISCOMs may track via app/call centre. Opening a URL in My Delhi does not mean a complaint is filed.',
   null, 'tracking', 'Consumers who filed officially',
   'After receiving an official reference',
   'Requires official DISCOM reference — not MD-######',
   'Save official number; use DISCOM app/portal/helpline status options.',
   'Provide status through official systems',
   null, 'Status via official reference',
   null, false, 'https://www.tatapower-ddl.com/customer/complaint/view-current-status.aspx',
   'DISCOM tracking channels'),
  ('elec_right_keep_proof', 'What should I keep as proof after making a complaint?',
   'Keep official references, bills, payment proof, and safe photos.',
   'Save the official complaint/request number, date/time, channel used, bill/CA number, payment screenshots, and any safe photos of meters/poles (never approach live wires). MD-###### is internal to My Delhi only.',
   null, 'evidence', 'Anyone who contacted a DISCOM',
   'After contacting an official channel',
   'Evidence is optional for My Delhi drafts but useful for official follow-up',
   'Store official reference and documents securely.',
   null, null, 'Stronger follow-up / escalation pack',
   null, true, 'https://www.derc.gov.in/',
   'My Delhi + DISCOM grievance practice')
) as v(slug, title, short_description, detailed_description, issue_slug, right_type, who_can_use,
       when_it_applies, conditions, what_citizen_can_do, what_authority_must_do, time_limit,
       possible_remedy, possible_compensation, escalation_available, official_action_url,
       source_title)
left join public.issue_types t on t.slug = v.issue_slug and t.category_id = c.id
where c.slug = 'electricity'
on conflict (slug) do update set
  title = excluded.title,
  short_description = excluded.short_description,
  detailed_description = excluded.detailed_description,
  right_type = excluded.right_type,
  who_can_use = excluded.who_can_use,
  when_it_applies = excluded.when_it_applies,
  conditions = excluded.conditions,
  what_citizen_can_do = excluded.what_citizen_can_do,
  what_authority_must_do = excluded.what_authority_must_do,
  time_limit = excluded.time_limit,
  possible_remedy = excluded.possible_remedy,
  possible_compensation = excluded.possible_compensation,
  escalation_available = excluded.escalation_available,
  official_action_url = excluded.official_action_url,
  source_id = excluded.source_id,
  source_title = excluded.source_title,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ============================================================================
-- 13) Citizen knowledge cards (YOU MAY NOT KNOW THIS)
-- ============================================================================

insert into public.citizen_knowledge (
  slug, title, what_people_often_miss, who_it_applies_to, when_it_applies,
  what_you_can_do, what_you_may_need, possible_remedy, category_id, issue_type_id,
  official_portal_url, tracking_method, source_id, source_title, last_verified_at, sort_order, active
)
select v.slug, v.title, v.miss, v.who, v.when_applies, v.can_do, v.need, v.remedy,
  c.id, t.id, v.portal, v.tracking, s.id, v.source_title, current_date, v.sort_order, true
from public.issue_categories c
cross join (values
  ('elec_know_compensation',
   'Compensation mechanisms may exist when standards are missed',
   'Electricity consumers may have access to compensation mechanisms when applicable service standards are not met — this is not automatic for every complaint.',
   'Consumers where a notified SoP may have been violated',
   'After a complaint/reference and when an applicable standard appears breached',
   'Keep your complaint/reference number and check your DISCOM / DERC compensation process.',
   'Official complaint reference, dates, bill/CA number',
   'Possible compensation claim where eligible',
   null::text, 'https://www.derc.gov.in/', 'DISCOM grievance + DERC SoP',
   'derc', 'DERC / Rights of Consumers Rules', 10),
  ('elec_know_reason_specific_channels',
   'Different problems may need different official channels',
   'Do not call the same general number for every electricity problem. Some providers have separate channels for theft, fire/safety, no-supply, streetlights, billing or other services.',
   'All electricity consumers',
   'Whenever contacting a DISCOM',
   'Use the reason-specific BEST action shown for your issue type.',
   'Confirmed DISCOM + issue type',
   'Faster correct routing',
   null, null, 'Purpose-specific channel',
   'derc', 'DISCOM contact pages', 20),
  ('elec_know_escalation_not_first',
   'CGRF is not the first step for ordinary outages',
   'Your electricity complaint is not necessarily the end of the process. If the appropriate complaint mechanism does not resolve an eligible grievance, a formal escalation structure may be available — but CGRF/Ombudsman are not first for ordinary no-supply.',
   'Consumers with unresolved eligible grievances',
   'After DISCOM complaint pathway',
   'See escalation steps only when the issue is unresolved or you intend to escalate.',
   'Prior complaint references',
   'Internal grievance → CGRF → Ombudsman',
   null, 'https://www.derc.gov.in/', 'Escalation after first complaint',
   'derc', 'DERC grievance framework', 30),
  ('elec_know_new_connection_delayed',
   'I applied for a new connection and it is delayed — what can I do?',
   'Central Rules prescribe maximum connection timelines subject to conditions. Delhi metropolitan application should be confirmed against DERC/DISCOM SOP — not promised unconditionally.',
   'New connection applicants',
   'When an application appears delayed beyond applicable timelines',
   'Follow up with DISCOM using official reference; review rights card on timelines; escalate if eligible.',
   'Application/reference number',
   'Follow-up / grievance / possible compensation',
   'electricity_connection_delay', null, 'DISCOM status tools',
   'mop_consumer_rights', 'Rights of Consumers Amendment Rules, 2024', 40),
  ('elec_know_gps_not_discom',
   'GPS does not prove your electricity provider',
   'My Delhi never claims that your phone GPS proves BRPL, BYPL, TPDDL or NDMC. Confirm from your bill or official materials.',
   'Anyone reporting an electricity concern',
   'Before choosing a DISCOM',
   'Use DISCOM hint chips and check your bill/CA number.',
   'Electricity bill',
   'Correct provider confirmation',
   null, null, 'Citizen confirmation',
   'derc', 'My Delhi DISCOM guidance', 50)
) as v(slug, title, miss, who, when_applies, can_do, need, remedy, issue_slug, portal, tracking, source_slug, source_title, sort_order)
join public.sources s on s.slug = v.source_slug
left join public.issue_types t on t.slug = v.issue_slug and t.category_id = c.id
where c.slug = 'electricity'
on conflict (slug) do update set
  title = excluded.title,
  what_people_often_miss = excluded.what_people_often_miss,
  who_it_applies_to = excluded.who_it_applies_to,
  when_it_applies = excluded.when_it_applies,
  what_you_can_do = excluded.what_you_can_do,
  what_you_may_need = excluded.what_you_may_need,
  possible_remedy = excluded.possible_remedy,
  official_portal_url = excluded.official_portal_url,
  tracking_method = excluded.tracking_method,
  source_id = excluded.source_id,
  source_title = excluded.source_title,
  last_verified_at = excluded.last_verified_at,
  sort_order = excluded.sort_order,
  active = true;

comment on table public.citizen_rights is
  'Generalized citizen rights cards (Electricity first; reusable for later categories). Soft language; not legal advice.';
comment on table public.citizen_knowledge is
  'Generalized "YOU MAY NOT KNOW THIS" / useful-to-know cards. Reusable across categories. No Railway data in this phase.';
comment on table public.official_services is
  'Generalized official apps/portals discovery. Store links only — never APK mirrors.';
comment on table public.escalation_paths is
  'Ordered escalation levels. Never present CGRF/Ombudsman as first step for ordinary no-supply.';
