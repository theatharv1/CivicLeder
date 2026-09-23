-- My Delhi — Water & Drainage category ONLY
-- Prefer AFTER Electricity (idempotent re-run OK).
-- Also runnable AFTER supabase/FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql.
-- Does NOT delete Building / Construction / Electricity / Fire Safety data.
-- Does NOT invent portals/phones. My Delhi opens official URLs only — never submits.
-- MD-###### remains internal — never an official government reference.
-- NEVER auto-assign all water → DJB. NEVER determine authority from GPS alone.
-- Verified 2026-09-20 against DJB ContactUs.pdf, mcdonline.nic.in, ndmc.gov.in, ifc.delhi.gov.in.

create extension if not exists "pgcrypto";

-- ============================================================================
-- 0) Schema prerequisites — MUST stay before any INSERT/COMMENT using these columns
-- ============================================================================

alter table public.issue_types
  add column if not exists emergency_relevant boolean not null default false;

comment on column public.issue_types.emergency_relevant is
  'When true, prioritize emergency contacts (112/101/102) and flood/water hazard channels before normal complaint portals.';

-- Extend authority_channels for reason-specific routing (additive; safe if Electricity already ran)
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
  'Reason-specific channel purpose: water_supply, sewerage, billing, meter, water_quality, connection, waterlogging, flood_control, emergency, grievance, tracking, app, web_portal, etc.';

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

-- Optional draft hint column on reports (citizen-selected water jurisdiction — not GPS proof)
alter table public.reports
  add column if not exists water_jurisdiction_hint text;

comment on column public.reports.water_jurisdiction_hint is
  'Citizen-selected water/drainage jurisdiction hint: djb|mcd|ndmc|ifc_flood|unknown — never inferred from GPS alone.';

-- Ensure generalized rights / knowledge / services / escalation tables exist (no-op if Electricity ran)
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
  'water_drainage',
  'Water & Drainage',
  'Water supply, sewerage, drainage, waterlogging and related civic concerns',
  5,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  sort_order = excluded.sort_order,
  active = true;

insert into public.sources (slug, name, organization, official_url, notes, last_verified_at, active)
values
  ('delhi_jal_board', 'Delhi Jal Board', 'Delhi Jal Board, GNCTD',
   'https://djb.gov.in/',
   'Customer care 1916: Water/Sewer option 1; Billing option 3. Billing grievances direct line 011-66587300. ContactUs.pdf lists ZRO/area contacts — do NOT hardcode every ZRO into UI. tracking_url for water/sewer web track NOT verified (track via 1916 + SMS ref). Verified 2026-09-20.',
   current_date, true),
  ('mcd_online', 'Municipal Corporation of Delhi', 'Municipal Corporation of Delhi',
   'https://mcdonline.nic.in/',
   'Citizen Call Center 155305; MCD311 app; email mcd-ithelpdesk@mcd.nic.in listed on mcdonline.nic.in/portal/feedback. Use for municipal drainage/waterlogging where relevant — not all water → DJB.',
   current_date, true),
  ('ndmc', 'New Delhi Municipal Council', 'NDMC',
   'https://www.ndmc.gov.in/',
   'NDMC water supply control room (Kali Bari) numbers are geography-specific. Sewerage contacts are area-specific — NO fake universal NDMC sewer number. Civic helpline 1533 on complaints.aspx.',
   current_date, true),
  ('irrigation_flood_control', 'Irrigation & Flood Control Department', 'I&FC GNCTD',
   'https://ifc.delhi.gov.in/',
   'Waterlogging helpline (toll-free) 1800-11-0093 listed on ifc.delhi.gov.in organizational-setup. Flood control rooms page: https://ifc.delhi.gov.in/ifc/flood-control-rooms. NOT for every blocked drain. 1077 not confirmed in this pass — left unverified.',
   current_date, true),
  ('pwd_delhi', 'Public Works Department Delhi', 'PWD GNCTD',
   'https://pwd.delhi.gov.in/',
   'PWD assets / roads only when relevant — conditional for waterlogging on PWD roads.',
   current_date, true),
  ('dda', 'Delhi Development Authority', 'DDA',
   'https://dda.gov.in/',
   'DDA areas only when relevant — conditional alternative for drainage/waterlogging.',
   current_date, true),
  ('delhi_cantonment', 'Delhi Cantonment Board', 'Delhi Cantonment Board',
   'https://delhi.cantt.gov.in/',
   'Cantonment limits only — conditional.',
   current_date, true)
on conflict (slug) do update set
  name = excluded.name,
  organization = excluded.organization,
  official_url = excluded.official_url,
  notes = excluded.notes,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ============================================================================
-- 2) Soft-deactivate conflicting old Phase-2 water shells (do not delete)
-- ============================================================================

update public.issue_types t
set active = false
from public.issue_categories c
where t.category_id = c.id
  and c.slug = 'water_drainage'
  and t.slug in ('water_supply_disruption', 'water_contamination_concern');

-- ============================================================================
-- 3) Water & Drainage issue types
-- ============================================================================

insert into public.issue_types (
  category_id, slug, name, short_description, sort_order,
  source_id, verification_status, emergency_relevant, active
)
select c.id, v.slug, v.name, v.short_description, v.sort_order,
  s.id, 'probable', v.emergency_relevant, true
from public.issue_categories c
join public.sources s on s.slug = 'delhi_jal_board'
cross join (values
  ('water_no_supply',
   'No water supply',
   'Reported concern that water supply is not available',
   1, false),
  ('water_low_pressure',
   'Low water pressure',
   'Reported concern about low water pressure',
   2, false),
  ('water_irregular_supply',
   'Irregular water supply',
   'Reported concern about irregular water supply',
   3, false),
  ('water_supply_timing',
   'Water supply timing concern',
   'Reported concern about water supply timing',
   4, false),
  ('water_contaminated',
   'Contaminated water concern',
   'Reported concern about water quality or contamination — not a medical diagnosis',
   5, false),
  ('water_bad_smell_or_taste',
   'Unusual smell or taste',
   'Reported unusual smell or taste in water — not a medical diagnosis',
   6, false),
  ('water_discolored',
   'Discoloured water',
   'Reported concern that water appears discoloured',
   7, false),
  ('water_leakage',
   'Water leakage',
   'Reported water leakage (authority depends on asset)',
   8, false),
  ('water_main_line_leakage',
   'Main line leakage',
   'Reported concern about a main water-line leakage',
   9, false),
  ('water_pipe_damage',
   'Damaged water pipe',
   'Reported concern about a damaged water pipe',
   10, false),
  ('water_valve_issue',
   'Water valve issue',
   'Reported concern about a water valve',
   11, false),
  ('water_booster_pump_issue',
   'Booster pump issue',
   'Reported concern about a booster pump',
   12, false),
  ('water_meter_not_working',
   'Meter not working',
   'Reported concern that a water meter may not be working',
   13, false),
  ('water_meter_damaged',
   'Meter appears damaged',
   'Reported concern that a water meter appears damaged',
   14, false),
  ('water_meter_leakage',
   'Meter leakage',
   'Reported leakage at or near a water meter',
   15, false),
  ('water_meter_reading_issue',
   'Meter reading issue',
   'Reported concern about a water meter reading',
   16, false),
  ('water_meter_testing',
   'Request meter testing',
   'Reported request or concern about water meter testing',
   17, false),
  ('water_new_connection',
   'New water connection',
   'Request or concern about a new water connection',
   18, false),
  ('water_connection_delay',
   'Connection delay',
   'Reported concern that a water connection application may be delayed',
   19, false),
  ('water_disconnection',
   'Disconnection concern',
   'Reported concern about water disconnection',
   20, false),
  ('water_reconnection',
   'Reconnection request',
   'Reported request or concern about reconnection',
   21, false),
  ('water_name_change',
   'Name change on connection',
   'Reported request or concern about name change on a water connection',
   22, false),
  ('water_connection_service_issue',
   'Connection / service issue',
   'Reported water connection or service concern',
   23, false),
  ('water_wrong_bill',
   'Wrong bill concern',
   'Reported concern that a water bill may be incorrect',
   24, false),
  ('water_high_bill',
   'Unusually high bill',
   'Reported concern about an unexpectedly high water bill',
   25, false),
  ('water_payment_not_reflected',
   'Payment not reflected',
   'Reported concern that a payment may not be showing',
   26, false),
  ('water_billing_dispute',
   'Billing dispute',
   'Reported water billing dispute — use billing channels',
   27, false),
  ('water_bill_other',
   'Other billing concern',
   'Other reported water billing concern',
   28, false),
  ('sewer_choked',
   'Sewer choked',
   'Reported concern that a sewer may be choked',
   29, false),
  ('sewer_overflow',
   'Sewer overflow',
   'Reported sewer overflow — may be a public-health/safety concern',
   30, false),
  ('sewer_blockage',
   'Sewer blockage',
   'Reported sewer blockage',
   31, false),
  ('sewer_line_damage',
   'Sewer line damage',
   'Reported concern about sewer line damage',
   32, false),
  ('sewer_manhole_overflow',
   'Manhole overflow',
   'Reported overflow from a sewer manhole',
   33, false),
  ('sewer_manhole_damaged',
   'Damaged manhole',
   'Reported concern about a damaged sewer manhole',
   34, false),
  ('sewer_open_manhole',
   'Open manhole',
   'Reported open sewer manhole — stay away; emergency if immediate danger',
   35, true),
  ('sewer_bad_odour',
   'Sewer bad odour',
   'Reported sewer-related odour concern',
   36, false),
  ('sewer_backflow',
   'Sewer backflow',
   'Reported sewer backflow concern',
   37, false),
  ('sewer_connection_issue',
   'Sewer connection issue',
   'Reported sewer connection concern',
   38, false),
  ('drain_choked',
   'Drain choked',
   'Reported choked drain (municipal / drain-maintaining authority may apply)',
   39, false),
  ('drain_overflow',
   'Drain overflow',
   'Reported drain overflow',
   40, false),
  ('drain_blocked',
   'Blocked drain',
   'Reported blocked drain',
   41, false),
  ('drain_damaged',
   'Damaged drain',
   'Reported damaged drain',
   42, false),
  ('drain_desilting_concern',
   'Desilting concern',
   'Reported concern about drain desilting',
   43, false),
  ('drain_missing',
   'Missing drain',
   'Reported concern about a missing drain',
   44, false),
  ('drain_cover_missing',
   'Missing drain cover',
   'Reported missing drain cover — stay away if opening is exposed',
   45, false),
  ('drain_open',
   'Open drain hazard',
   'Reported open drain — stay away; emergency if immediate danger',
   46, false),
  ('waterlogging',
   'Waterlogging',
   'Water collecting on road or public area — not automatically DJB',
   47, false),
  ('waterlogging_after_rain',
   'Waterlogging after rain',
   'Reported waterlogging after rain',
   48, false),
  ('repeated_waterlogging',
   'Repeated waterlogging',
   'Reported repeated waterlogging at a location',
   49, false),
  ('storm_water_drain_issue',
   'Storm water drain issue',
   'Reported storm-water drain concern',
   50, false),
  ('roadside_drain_issue',
   'Roadside drain issue',
   'Reported roadside drain concern',
   51, false),
  ('flooding',
   'Flooding',
   'Rapidly rising or dangerous water — emergency guidance first',
   52, true),
  ('flash_flood_or_rapid_water_rise',
   'Flash flood / rapid rise',
   'Rapid water rise — emergency services first',
   53, true),
  ('waterlogging_with_traffic_hazard',
   'Waterlogging with traffic hazard',
   'Waterlogging creating traffic/safety hazard',
   54, true),
  -- Labels below contain the English word "property" ONLY inside quoted strings.
  -- Never run this VALUES fragment alone (would cause 42P01 relation "property").
  ('waterlogging_entering_property',
   'Water entering property',
   'Waterlogging entering a property — assess safety first',
   55, false),
  ('drain_overflow_entering_property',
   'Drain overflow into property',
   'Drain overflow entering a property',
   56, false),
  ('dangerous_open_manhole',
   'Dangerous open manhole',
   'Open manhole with immediate danger — stay away; call emergency',
   57, true),
  ('sewer_exposure_hazard',
   'Sewer exposure hazard',
   'Sewer overflow/exposure creating immediate risk — stay away',
   58, true),
  ('water_drainage_other',
   'Something else (water & drainage)',
   'Other reported water/drainage concern — authority still needs confirmation',
   59, false)
) as v(slug, name, short_description, sort_order, emergency_relevant)
where c.slug = 'water_drainage'
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
  v.explanation, v.sort_order, 'My Delhi Water & Drainage safety guidance', null, current_date, true
from public.issue_categories c
cross join (values
  ('rapid_flood_or_trapped',
   'Is water rising rapidly, or is anyone trapped in floodwater / unable to get out safely?',
   'Call 112 / 101 / 102 first. Do not enter floodwater. Then use I&FC waterlogging helpline if verified and safe.',
   1),
  ('open_manhole_under_water',
   'Is there an open manhole, or a manhole / opening hidden under water?',
   'Stay away. Do not approach. Call 112 if anyone may fall in or is in immediate danger. Then notify municipal / utility channel when safe.',
   2),
  ('water_near_electrical',
   'Is water near exposed electrical equipment, live wires, or sparking?',
   'Electrical + water hazard: call 112 / 101 first. Do not touch. Do not enter the water.',
   3),
  ('sewer_immediate_exposure',
   'Is there sewer overflow creating immediate exposure risk to people right now?',
   'Stay away from sewer water. Call 112 if anyone is in immediate danger. Then use the verified utility/municipal channel when safe.',
   4),
  ('immediate_danger_people_water',
   'Is there an immediate danger to people from this water / drainage situation?',
   'Immediate danger requires emergency services before any normal civic complaint.',
   5)
) as v(question_key, question_text, explanation, sort_order)
where c.slug = 'water_drainage'
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
  'Selected issue type is emergency-relevant for Water & Drainage',
  'user_selected_yes', 'high',
  'Call 112 / 101 / 102 first if anyone is in danger. Do not enter floodwater or approach open manholes. Use I&FC waterlogging helpline (1800-11-0093) for flooding/waterlogging emergencies when verified. Do not use ordinary billing/supply channels first.',
  t.sort_order, 'My Delhi Water & Drainage', current_date, true
from public.issue_categories c
join public.issue_types t on t.category_id = c.id
where c.slug = 'water_drainage'
  and t.emergency_relevant = true
  and t.active = true
  and not exists (
    select 1 from public.emergency_rules r
    where r.category_id = c.id
      and r.issue_type_id = t.id
      and r.rule_kind = 'emergency_signal'
  );

-- ============================================================================
-- 5) Authorities (reuse / upsert — never create water_authorities)
-- ============================================================================

insert into public.authorities
  (slug, name, department, government, official_website, emergency_number, short_description,
   source_name, source_url, source_id, last_verified_at, verification_status, active)
select v.slug, v.name, v.department, v.government, v.website, v.emergency,
  v.short_description, s.name, s.official_url, s.id, current_date, 'verified', true
from (values
  ('delhi_jal_board', 'Delhi Jal Board (DJB)', 'Delhi Jal Board', 'Government of NCT of Delhi',
   'https://djb.gov.in/', '1916',
   'Likely for water supply / sewerage / billing in DJB service areas — needs confirmation. Not for every drain or road waterlogging. GPS does not prove DJB.',
   'delhi_jal_board'),
  ('mcd', 'Municipal Corporation of Delhi (MCD)', 'Municipal Corporation of Delhi', 'MCD',
   'https://mcdonline.nic.in/', null,
   'Candidate for municipal drainage / waterlogging / public-space concerns in MCD areas. Not automatic for all water issues.',
   'mcd_online'),
  ('ndmc', 'New Delhi Municipal Council (NDMC)', 'NDMC', 'Municipal',
   'https://www.ndmc.gov.in/', null,
   'Candidate only in NDMC area. Water control room and sewerage contacts are area/service specific — confirm NDMC jurisdiction.',
   'ndmc'),
  ('irrigation_flood_control', 'Irrigation & Flood Control Department (I&FC)', 'I&FC GNCTD', 'Government of NCT of Delhi',
   'https://ifc.delhi.gov.in/', '1800-11-0093',
   'Likely for flooding / major waterlogging / flood-control context — not every blocked drain. Confirm relevance.',
   'irrigation_flood_control'),
  ('pwd_delhi', 'Public Works Department (PWD)', 'PWD GNCTD', 'Government of NCT of Delhi',
   'https://pwd.delhi.gov.in/', null,
   'Conditional: PWD roads / assets only — needs confirmation.',
   'pwd_delhi'),
  ('dda', 'Delhi Development Authority (DDA)', 'DDA', 'DDA',
   'https://dda.gov.in/', null,
   'Conditional: DDA areas / assets only — needs confirmation.',
   'dda'),
  ('delhi_cantonment', 'Delhi Cantonment Board', 'Delhi Cantonment Board', 'Delhi Cantonment Board',
   'https://delhi.cantt.gov.in/', null,
   'Conditional: Cantonment limits only — needs confirmation.',
   'delhi_cantonment')
) as v(slug, name, department, government, website, emergency, short_description, source_slug)
join public.sources s on s.slug = v.source_slug
on conflict (slug) do update set
  name = excluded.name,
  department = excluded.department,
  official_website = excluded.official_website,
  emergency_number = coalesce(excluded.emergency_number, public.authorities.emergency_number),
  short_description = case
    when public.authorities.slug in ('delhi_jal_board', 'irrigation_flood_control')
      then excluded.short_description
    else coalesce(public.authorities.short_description, excluded.short_description)
  end,
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  source_id = excluded.source_id,
  last_verified_at = excluded.last_verified_at,
  verification_status = excluded.verification_status,
  active = true;

-- Refresh DJB website to djb.gov.in without touching Building/Electricity-specific fields on shared authorities beyond notes above
update public.authorities
set official_website = 'https://djb.gov.in/',
    last_verified_at = current_date
where slug = 'delhi_jal_board';

-- ============================================================================
-- 6) Reason-specific channels (verified only; purpose required)
-- ============================================================================

-- DJB 1916 — water / sewer / billing / meter / quality / connection / tracking-by-phone
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, purpose, priority, availability,
  tracking_url, instructions, source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'phone', v.label, '1916', '1916', v.purpose, v.priority, 'as_published',
  null,
  v.instructions,
  s.name, 'https://djb.gov.in/StaticContent/ContactUs.pdf', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'delhi_jal_board'
cross join (values
  ('DJB water / sewer (1916 option 1)', 'water_supply', 10,
   'Call 1916 and select water/sewer option. My Delhi does not submit. Keep any SMS complaint reference DJB sends.'),
  ('DJB sewerage (1916 option 1)', 'sewerage', 10,
   'Call 1916 and select water/sewer option. Confirm DJB service area. My Delhi does not submit.'),
  ('DJB billing (1916 option 3)', 'billing', 10,
   'Call 1916 option 3 for billing. Area ZRO contacts are in ContactUs.pdf — confirm area; do not assume.'),
  ('DJB meter / connection (1916)', 'meter', 20,
   'Call 1916 for meter/connection concerns. Confirm DJB area.'),
  ('DJB water quality (1916)', 'water_quality', 15,
   'Call 1916 for water-quality concerns. Soft guidance only — not a medical diagnosis. Avoid drinking if you suspect a problem until you obtain appropriate official/qualified guidance.'),
  ('DJB connection / service (1916)', 'connection', 20,
   'Call 1916 for connection/service concerns. Confirm DJB area.'),
  ('DJB general customer care (1916)', 'general_customer_care', 30,
   'General DJB customer care via 1916. Confirm service area.'),
  ('DJB track via 1916 + SMS reference', 'tracking', 40,
   'Official materials instruct tracking water/sewer complaints by calling 1916 with the SMS complaint reference. No separate verified web tracking URL seeded.')
) as v(label, purpose, priority, instructions)
where a.slug = 'delhi_jal_board'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = v.purpose and c.value = '1916'
  );

-- DJB billing direct line (verified ContactUs.pdf)
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, purpose, priority,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'phone', 'DJB billing grievances direct line',
  '011-66587300', '011-66587300', 'billing', 15,
  s.name, 'https://djb.gov.in/StaticContent/ContactUs.pdf', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'delhi_jal_board'
where a.slug = 'delhi_jal_board'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = 'billing' and c.value = '011-66587300'
  );

-- DJB alternate toll-free (already may exist without purpose — add purpose row if missing)
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, purpose, priority,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'phone', 'DJB toll-free alternate',
  '1800117118', '1800117118', 'general_customer_care', 35,
  s.name, 'https://djb.gov.in/', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'delhi_jal_board'
where a.slug = 'delhi_jal_board'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = 'general_customer_care' and c.value = '1800117118'
  );

-- DJB website / portal (no invented RMS track URL)
insert into public.authority_channels (
  authority_id, channel_type, label, value, action_url, purpose, priority,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'website', 'DJB official website',
  'https://djb.gov.in/', 'https://djb.gov.in/', 'web_portal', 80,
  s.name, 'https://djb.gov.in/', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'delhi_jal_board'
where a.slug = 'delhi_jal_board'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = 'website' and c.value = 'https://djb.gov.in/'
  );

insert into public.authority_channels (
  authority_id, channel_type, label, value, action_url, purpose, priority,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'portal', 'DJB Contact Us (ZRO / area contacts PDF)',
  'https://djb.gov.in/StaticContent/ContactUs.pdf',
  'https://djb.gov.in/StaticContent/ContactUs.pdf',
  'grievance', 50,
  s.name, 'https://djb.gov.in/StaticContent/ContactUs.pdf', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'delhi_jal_board'
where a.slug = 'delhi_jal_board'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.value = 'https://djb.gov.in/StaticContent/ContactUs.pdf'
  );

-- MCD waterlogging / drainage channels (reuse 155305 + MCD311 with purpose)
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, purpose, priority,
  action_url, instructions, source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'phone', v.label, '155305', '155305', v.purpose, v.priority,
  null, v.instructions, s.name, 'https://mcdonline.nic.in/portal/feedback', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'mcd_online'
cross join (values
  ('MCD Citizen Call Center (drainage / waterlogging)', 'waterlogging', 10,
   'Call 155305 for municipal drainage/waterlogging where MCD may apply. Confirm MCD area. Not automatic for all water issues.'),
  ('MCD Citizen Call Center (drains)', 'general_customer_care', 20,
   'Call 155305. Confirm municipal jurisdiction.'),
  ('MCD Citizen Call Center (open manhole / civic)', 'emergency', 15,
   'If immediate danger: call 112 first. Then 155305 for municipal civic reporting when safe.')
) as v(label, purpose, priority, instructions)
where a.slug = 'mcd'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = v.purpose and c.value = '155305'
      and c.label = v.label
  );

-- Ensure MCD311 app channel with purpose for waterlogging
insert into public.authority_channels (
  authority_id, channel_type, label, value, action_url, purpose, priority,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'app', 'MCD311 (official app listed on mcdonline.nic.in)',
  'MCD311', null, 'app', 25,
  s.name, 'https://mcdonline.nic.in/portal/feedback', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'mcd_online'
where a.slug = 'mcd'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = 'app' and c.value = 'MCD311'
  );

-- NDMC Kali Bari water supply control (geography-specific — NOT universal sewer)
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, purpose, priority, geography, availability,
  instructions, source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'phone', v.label, v.value, v.value, v.purpose, v.priority, 'ndmc_kali_bari', '24x7',
  'NDMC Water Supply Control Room, Kali Bari Marg — NDMC area only. Confirm NDMC jurisdiction. My Delhi does not submit.',
  s.name, 'https://www.ndmc.gov.in/departments/civil_i.aspx', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'ndmc'
cross join (values
  ('NDMC Kali Bari water control (23743642)', '011-23743642', 'water_supply', 10),
  ('NDMC Kali Bari water control (23360683)', '011-23360683', 'water_supply', 11),
  ('NDMC Kali Bari water control (23747566)', '011-23747566', 'water_supply', 12),
  ('NDMC Kali Bari water control (23747568)', '011-23747568', 'water_supply', 13),
  ('NDMC Kali Bari water quality (23743642)', '011-23743642', 'water_quality', 15),
  ('NDMC Kali Bari meter / leakage (23743642)', '011-23743642', 'meter', 20)
) as v(label, value, purpose, priority)
where a.slug = 'ndmc'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = v.purpose and c.value = v.value
  );

-- NDMC sewerage: official FAQ page only (area-specific centres — NO fake universal number)
insert into public.authority_channels (
  authority_id, channel_type, label, value, action_url, purpose, priority, geography,
  instructions, source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'portal', 'NDMC sewerage FAQs / area service centres',
  'https://www.ndmc.gov.in/faq/sewerage_faqs.aspx',
  'https://www.ndmc.gov.in/faq/sewerage_faqs.aspx',
  'sewerage', 10, 'ndmc_area',
  'NDMC sewerage choke-up contacts are area-specific on the official FAQ page. Do not invent a universal NDMC sewer number. Confirm NDMC area.',
  s.name, 'https://www.ndmc.gov.in/faq/sewerage_faqs.aspx', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'ndmc'
where a.slug = 'ndmc'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = 'sewerage'
      and c.value like '%sewerage_faqs%'
  );

-- NDMC civil complaints / water FAQs hub
insert into public.authority_channels (
  authority_id, channel_type, label, value, action_url, purpose, priority, geography,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'portal', 'NDMC civil / water supply information',
  'https://www.ndmc.gov.in/Departments/civil_complaints.aspx',
  'https://www.ndmc.gov.in/Departments/civil_complaints.aspx',
  'web_portal', 30, 'ndmc_area',
  s.name, 'https://www.ndmc.gov.in/Departments/civil_complaints.aspx', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'ndmc'
where a.slug = 'ndmc'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.value like '%civil_complaints%'
  );

-- I&FC waterlogging / flood control
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, purpose, priority, availability,
  action_url, instructions, source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'phone', v.label, v.value, v.value, v.purpose, v.priority, 'as_published',
  'https://ifc.delhi.gov.in/ifc/flood-control-rooms',
  v.instructions,
  s.name, 'https://ifc.delhi.gov.in/ifc/organizational-setup', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'irrigation_flood_control'
cross join (values
  ('I&FC / Delhi waterlogging helpline (toll-free)', '1800-11-0093', 'waterlogging', 5,
   'Official waterlogging helpline listed on I&FC pages. For flooding/waterlogging — not every blocked drain. If life danger: call 112 first.'),
  ('I&FC waterlogging helpline', '1800-11-0093', 'flood_control', 5,
   'Use for flood-control / major waterlogging context. Confirm relevance.'),
  ('I&FC waterlogging helpline (emergency context)', '1800-11-0093', 'emergency', 8,
   'After calling 112/101/102 if needed. Flood/waterlogging civic channel.'),
  ('Central Flood Control Room', '011-21210867', 'flood_control', 10,
   'Central Flood Control Room number listed on I&FC organizational-setup page.')
) as v(label, value, purpose, priority, instructions)
where a.slug = 'irrigation_flood_control'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.purpose = v.purpose and c.value = v.value
  );

insert into public.authority_channels (
  authority_id, channel_type, label, value, action_url, purpose, priority,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'website', 'I&FC flood control rooms (official page)',
  'https://ifc.delhi.gov.in/ifc/flood-control-rooms',
  'https://ifc.delhi.gov.in/ifc/flood-control-rooms',
  'flood_control', 20,
  s.name, 'https://ifc.delhi.gov.in/ifc/flood-control-rooms', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'irrigation_flood_control'
where a.slug = 'irrigation_flood_control'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.value = 'https://ifc.delhi.gov.in/ifc/flood-control-rooms'
  );

insert into public.authority_channels (
  authority_id, channel_type, label, value, action_url, purpose, priority,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, 'website', 'I&FC official website',
  'https://ifc.delhi.gov.in/',
  'https://ifc.delhi.gov.in/',
  'web_portal', 80,
  s.name, 'https://ifc.delhi.gov.in/', s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'irrigation_flood_control'
where a.slug = 'irrigation_flood_control'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = 'website' and c.value = 'https://ifc.delhi.gov.in/'
  );

-- ============================================================================
-- 7) Authority services (filing assistant) — verified only; tracking_url NULL where unverified
-- ============================================================================

insert into public.authority_services (
  authority_id, service_name, slug, description, service_type,
  official_url, filing_url, tracking_url, phone, integration_type,
  source_id, last_verified_at, active
)
select a.id, v.service_name, v.slug, v.description, v.service_type,
  v.official_url, v.filing_url, null, v.phone, v.integration_type,
  s.id, current_date, true
from (values
  ('delhi_jal_board', 'delhi_jal_board',
   'DJB water / sewer (Call 1916)', 'djb_water_supply_1916',
   'Call 1916 option 1 for water/sewer. Confirm DJB area. My Delhi does not submit. Track via 1916 + SMS ref — no verified web tracking URL.',
   'complaint', 'https://djb.gov.in/', null, '1916', 'phone'),
  ('delhi_jal_board', 'delhi_jal_board',
   'DJB billing (1916 option 3)', 'djb_billing_1916',
   'Call 1916 option 3 for billing. Direct line 011-66587300 also listed on ContactUs.pdf. Confirm DJB account/area.',
   'complaint', 'https://djb.gov.in/StaticContent/ContactUs.pdf', null, '1916', 'phone'),
  ('irrigation_flood_control', 'irrigation_flood_control',
   'I&FC waterlogging helpline', 'ifc_waterlogging_helpline',
   'Toll-free waterlogging helpline 1800-11-0093. For flooding/waterlogging — not every blocked drain. Call 112 first if life danger.',
   'emergency', 'https://ifc.delhi.gov.in/ifc/flood-control-rooms', null, '1800-11-0093', 'phone'),
  ('irrigation_flood_control', 'irrigation_flood_control',
   'I&FC flood control rooms page', 'ifc_flood_control_rooms',
   'Official flood-control rooms information page. Opens official channel only.',
   'information', 'https://ifc.delhi.gov.in/ifc/flood-control-rooms',
   'https://ifc.delhi.gov.in/ifc/flood-control-rooms', null, 'deep_link')
) as v(auth_slug, source_slug, service_name, slug, description, service_type, official_url, filing_url, phone, integration_type)
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where not exists (
  select 1 from public.authority_services x
  where x.authority_id = a.id and x.slug = v.slug
);

-- Update existing djb_water_sewer_complaint official_url to djb.gov.in if present
update public.authority_services svc
set official_url = 'https://djb.gov.in/',
    phone = coalesce(svc.phone, '1916'),
    last_verified_at = current_date,
    tracking_url = null
from public.authorities a
where svc.authority_id = a.id
  and a.slug = 'delhi_jal_board'
  and svc.slug = 'djb_water_sewer_complaint';

-- ============================================================================
-- 8) Routing rules — ALL needs_confirmation / conditional; never auto DJB
-- ============================================================================

-- Soft-deactivate old category-level water→DJB primary-style rules if any claimed certainty
update public.routing_rules r
set confidence = 'needs_confirmation',
    routing_mode = 'needs_confirmation',
    is_primary = false,
    notes = coalesce(r.notes, '') || ' [Water phase: needs confirmation — never auto DJB]'
from public.issue_categories c
where r.category_id = c.id
  and c.slug = 'water_drainage'
  and r.active = true
  and (r.is_primary = true or r.confidence = 'likely' or r.routing_mode = 'likely');

-- Category-level candidates
insert into public.routing_rules (
  category_id, authority_id, source_id, confidence, routing_mode, is_primary, notes, active
)
select c.id, a.id, s.id, 'needs_confirmation', 'needs_confirmation', false, v.notes, true
from public.issue_categories c
cross join (values
  ('delhi_jal_board', 'delhi_jal_board',
   'Candidate for water supply / sewerage / billing in DJB areas — needs confirmation. Not for every drain or road waterlogging.'),
  ('mcd', 'mcd_online',
   'Candidate for municipal drainage / waterlogging / open manhole in MCD areas — needs confirmation.'),
  ('ndmc', 'ndmc',
   'Candidate only in NDMC area — water/sewer channels are area-specific.'),
  ('irrigation_flood_control', 'irrigation_flood_control',
   'Candidate for flooding / major waterlogging / flood-control — not every blocked drain.'),
  ('pwd_delhi', 'pwd_delhi',
   'Conditional alternative for PWD road / asset waterlogging — needs confirmation.'),
  ('dda', 'dda',
   'Conditional alternative for DDA areas — needs confirmation.'),
  ('delhi_cantonment', 'delhi_cantonment',
   'Conditional alternative inside Cantonment limits — needs confirmation.')
) as v(auth_slug, source_slug, notes)
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where c.slug = 'water_drainage'
  and not exists (
    select 1 from public.routing_rules r
    where r.category_id = c.id and r.authority_id = a.id and r.issue_type_id is null and r.active = true
  );

-- Issue-type routing examples (Part 7) — all needs_confirmation
insert into public.routing_rules (
  category_id, issue_type_id, authority_id, source_id,
  confidence, routing_mode, is_primary, notes, active
)
select c.id, t.id, a.id, s.id,
  'needs_confirmation', 'needs_confirmation', false, v.notes, true
from public.issue_categories c
cross join (values
  -- NO WATER SUPPLY → DJB unless NDMC
  ('water_no_supply', 'delhi_jal_board', 'delhi_jal_board',
   'No supply: likely DJB in DJB areas — unless NDMC jurisdiction. Needs confirmation.'),
  ('water_no_supply', 'ndmc', 'ndmc',
   'No supply: NDMC alternative only in NDMC area (Kali Bari control room). Needs confirmation.'),
  ('water_low_pressure', 'delhi_jal_board', 'delhi_jal_board',
   'Low pressure: likely DJB if DJB area — needs confirmation.'),
  ('water_low_pressure', 'ndmc', 'ndmc',
   'Low pressure: NDMC alternative if NDMC area.'),
  -- BILLING
  ('water_wrong_bill', 'delhi_jal_board', 'delhi_jal_board',
   'Billing: DJB billing channel (1916 option 3) if DJB account — needs confirmation.'),
  ('water_wrong_bill', 'ndmc', 'ndmc',
   'Billing: NDMC alternative if NDMC water account — needs confirmation.'),
  ('water_high_bill', 'delhi_jal_board', 'delhi_jal_board',
   'High bill: DJB billing channels if DJB — needs confirmation.'),
  ('water_billing_dispute', 'delhi_jal_board', 'delhi_jal_board',
   'Billing dispute: DJB billing — needs confirmation.'),
  -- SEWER
  ('sewer_choked', 'delhi_jal_board', 'delhi_jal_board',
   'Sewer choke: likely DJB if DJB sewer — needs confirmation.'),
  ('sewer_choked', 'ndmc', 'ndmc',
   'Sewer choke: NDMC if NDMC area — use area-specific sewerage contacts (FAQ). No universal NDMC sewer number.'),
  ('sewer_overflow', 'delhi_jal_board', 'delhi_jal_board',
   'Sewer overflow: DJB/NDMC depending jurisdiction. Escalate to emergency if immediate exposure risk.'),
  ('sewer_overflow', 'ndmc', 'ndmc',
   'Sewer overflow: NDMC area alternative — area-specific channels.'),
  -- OPEN MANHOLE → municipal
  ('sewer_open_manhole', 'mcd', 'mcd_online',
   'Open manhole: likely civic/municipal (MCD) depending location. Emergency if immediate danger.'),
  ('sewer_open_manhole', 'ndmc', 'ndmc',
   'Open manhole: NDMC if NDMC area.'),
  ('dangerous_open_manhole', 'mcd', 'mcd_online',
   'Dangerous open manhole: emergency first (112); then municipal channel when safe.'),
  ('dangerous_open_manhole', 'ndmc', 'ndmc',
   'Dangerous open manhole: NDMC area alternative after emergency.'),
  -- STREET DRAIN → municipal / asset owner — NOT auto DJB
  ('drain_choked', 'mcd', 'mcd_online',
   'Street drain choked: municipal/drain-maintaining authority — not automatic DJB.'),
  ('drain_choked', 'pwd_delhi', 'pwd_delhi',
   'Drain choked: PWD alternative if PWD asset/road.'),
  ('drain_blocked', 'mcd', 'mcd_online',
   'Blocked drain: municipal candidate — needs confirmation.'),
  ('drain_blocked', 'ndmc', 'ndmc',
   'Blocked drain: NDMC if NDMC area.'),
  -- ROAD WATERLOGGING → NOT auto DJB
  ('waterlogging', 'mcd', 'mcd_online',
   'Road waterlogging: do NOT auto-route to DJB. May involve MCD / PWD / I&FC / NDMC / DDA.'),
  ('waterlogging', 'irrigation_flood_control', 'irrigation_flood_control',
   'Waterlogging: I&FC helpline may apply for waterlogging/flood context — not every puddle.'),
  ('waterlogging', 'pwd_delhi', 'pwd_delhi',
   'Waterlogging: PWD alternative if PWD road.'),
  ('waterlogging', 'ndmc', 'ndmc',
   'Waterlogging: NDMC if NDMC area.'),
  ('waterlogging_after_rain', 'mcd', 'mcd_online',
   'Waterlogging after rain: municipal / I&FC candidates — not auto DJB.'),
  ('waterlogging_after_rain', 'irrigation_flood_control', 'irrigation_flood_control',
   'Waterlogging after rain: I&FC waterlogging helpline may apply.'),
  -- MAJOR FLOODING → emergency + I&FC
  ('flooding', 'irrigation_flood_control', 'irrigation_flood_control',
   'Flooding: emergency/disaster guidance first (112/101/102), then I&FC flood channels. Do not wait on normal complaint routing.'),
  ('flash_flood_or_rapid_water_rise', 'irrigation_flood_control', 'irrigation_flood_control',
   'Flash flood: emergency first, then I&FC.'),
  ('waterlogging_with_traffic_hazard', 'irrigation_flood_control', 'irrigation_flood_control',
   'Waterlogging with traffic hazard: safety first; I&FC / municipal as applicable.'),
  ('waterlogging_with_traffic_hazard', 'mcd', 'mcd_online',
   'Traffic hazard waterlogging: municipal alternative.'),
  -- WATER ENTERING HOME
  ('waterlogging_entering_property', 'mcd', 'mcd_online',
   'Water entering property: assess immediate safety first; then municipal/utility as applicable.'),
  ('waterlogging_entering_property', 'delhi_jal_board', 'delhi_jal_board',
   'Water entering property: DJB only if DJB asset/sewer/supply related — needs confirmation.'),
  -- CONTAMINATED WATER → utility + soft guidance
  ('water_contaminated', 'delhi_jal_board', 'delhi_jal_board',
   'Contaminated water concern: water utility (DJB/NDMC). Soft guidance only — not a medical diagnosis.'),
  ('water_contaminated', 'ndmc', 'ndmc',
   'Contaminated water: NDMC Kali Bari / water FAQs if NDMC area.'),
  ('water_bad_smell_or_taste', 'delhi_jal_board', 'delhi_jal_board',
   'Smell/taste concern: utility channel — not a medical claim.'),
  ('water_discolored', 'delhi_jal_board', 'delhi_jal_board',
   'Discoloured water: utility channel — needs confirmation.'),
  ('sewer_exposure_hazard', 'delhi_jal_board', 'delhi_jal_board',
   'Sewer exposure hazard: emergency if immediate danger; then utility/municipal.'),
  ('sewer_exposure_hazard', 'mcd', 'mcd_online',
   'Sewer exposure: municipal alternative depending location.')
) as v(issue_slug, auth_slug, source_slug, notes)
join public.issue_types t on t.category_id = c.id and t.slug = v.issue_slug and t.active = true
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where c.slug = 'water_drainage'
  and not exists (
    select 1 from public.routing_rules r
    where r.category_id = c.id
      and r.issue_type_id = t.id
      and r.authority_id = a.id
      and r.active = true
  );

-- ============================================================================
-- 9) Citizen rights (timelines only if verified — else see official service standard)
-- ============================================================================

insert into public.citizen_rights (
  slug, title, short_description, detailed_description, category_id, right_type,
  who_can_use, when_it_applies, conditions, what_citizen_can_do, what_authority_must_do,
  time_limit, possible_remedy, escalation_available, official_action_url,
  source_id, source_title, last_verified_at, active
)
select v.slug, v.title, v.short_description, v.detailed_description, c.id, v.right_type,
  v.who_can_use, v.when_it_applies, v.conditions, v.what_citizen_can_do, v.what_authority_must_do,
  v.time_limit, v.possible_remedy, v.escalation_available, v.official_action_url,
  s.id, v.source_title, current_date, true
from public.issue_categories c
cross join (values
  ('water_access_applicable_services',
   'Access applicable water / sewerage services',
   'Citizens may contact the relevant water utility or municipal body for water supply, sewerage and related services in their jurisdiction.',
   'My Delhi guides you to verified official channels. The correct authority depends on location and asset. This is not a legal finding and not a guarantee of service.',
   'service_access', 'Residents / consumers in Delhi',
   'When you have a water supply, sewerage, metering or billing concern',
   'Jurisdiction and service area must be confirmed. Not all water issues are DJB.',
   'Use the official phone/portal/app for your likely authority. Keep any official reference you receive.',
   'See the current official service standard for the relevant utility or municipal body.',
   'See the current official service standard.',
   'Official complaint/reference via the authority channel; escalation only if unresolved through the applicable process',
   true, 'https://djb.gov.in/',
   'delhi_jal_board', 'Delhi Jal Board / municipal official channels'),
  ('water_no_supply_what_to_do',
   'What to do when water supply is not received',
   'Contact the verified water utility channel for your area (DJB 1916 or NDMC Kali Bari control if NDMC).',
   'Confirm whether you are in DJB or NDMC (or other) service area from your bill / connection papers. GPS alone does not prove the utility. Soft guidance only.',
   'guidance', 'Water consumers',
   'When supply is not available at a premises',
   'Confirm jurisdiction before assuming DJB.',
   'Call the verified utility number; note any SMS reference; track via the official method (e.g. 1916 + SMS ref for DJB).',
   'See the current official service standard.',
   'See the current official service standard.',
   'Official reference from the utility',
   true, 'https://djb.gov.in/',
   'delhi_jal_board', 'DJB ContactUs.pdf / NDMC civil pages'),
  ('water_defective_meter',
   'What to do about a defective meter concern',
   'Report meter concerns through the verified utility meter/connection channel for your jurisdiction.',
   'NDMC and DJB document meter-related processes on official pages. Timelines vary — see the current official service standard. Not a legal claim.',
   'guidance', 'Metered water consumers',
   'When a meter appears defective or not working',
   'Confirm utility jurisdiction.',
   'Contact the official utility channel; keep connection/meter identifiers from your bill.',
   'See the current official service standard.',
   'See the current official service standard.',
   'Utility action / testing as per official process',
   true, 'https://www.ndmc.gov.in/faq/water_supply_faqs.aspx',
   'ndmc', 'NDMC water supply FAQs / DJB 1916'),
  ('water_wrong_billing',
   'What to do about wrong billing',
   'Use the official billing channel (DJB: 1916 option 3 / billing direct line; NDMC: NDMC billing contacts if NDMC).',
   'Do not invent refund guarantees. Keep bill copies and any official reference.',
   'guidance', 'Water consumers with bills',
   'When a bill appears incorrect or disputed',
   'Confirm which utility issued the bill.',
   'Call or open the official billing channel; escalate only through documented grievance paths if unresolved.',
   'See the current official service standard.',
   'See the current official service standard.',
   'Billing correction / grievance process as published by the utility',
   true, 'https://djb.gov.in/StaticContent/ContactUs.pdf',
   'delhi_jal_board', 'DJB ContactUs.pdf'),
  ('water_contaminated_guidance',
   'What to do about a contaminated water concern',
   'Contact the water utility. Soft guidance: if you suspect a water-quality problem, avoid drinking it until you obtain appropriate guidance from the relevant official/qualified source.',
   'My Delhi does not diagnose whether water is medically unsafe and makes no medical claims.',
   'safety_guidance', 'Anyone with a water-quality concern',
   'When water appears contaminated, discoloured, or has unusual smell/taste',
   'Not a medical diagnosis.',
   'Contact DJB 1916 or NDMC water control if NDMC; seek official/qualified guidance before drinking.',
   'See the current official service standard.',
   'See the current official service standard.',
   'Utility investigation as per official process',
   true, 'https://djb.gov.in/',
   'delhi_jal_board', 'DJB / NDMC water channels'),
  ('water_sewer_unresolved',
   'What to do when a sewerage complaint is not resolved',
   'Keep your official reference and use the utility/municipal grievance path. Escalation is not the first step for an ordinary choke.',
   'Confirm jurisdiction. NDMC sewerage contacts are area-specific.',
   'escalation_guidance', 'Citizens with an official sewerage complaint reference',
   'When a sewerage complaint remains unresolved after using the official channel',
   'You should already have used the first-line official channel.',
   'Re-contact the official channel with your reference; then use documented escalation if available.',
   'See the current official service standard.',
   'See the current official service standard.',
   'Grievance escalation as published',
   true, 'https://djb.gov.in/',
   'delhi_jal_board', 'DJB / NDMC official process'),
  ('water_civic_unresolved',
   'What to do when a civic drainage complaint is not resolved',
   'For municipal drainage/waterlogging, keep MCD311 / 155305 or NDMC references and follow official tracking.',
   'Road waterlogging is not automatically DJB.',
   'escalation_guidance', 'Citizens with municipal drainage complaints',
   'When a civic drainage/waterlogging complaint is unresolved',
   'Confirm the asset owner / municipal body.',
   'Track via the official channel; escalate only through documented paths.',
   'See the current official service standard.',
   'See the current official service standard.',
   'Municipal grievance process',
   true, 'https://mcdonline.nic.in/portal/feedback',
   'mcd_online', 'MCD feedback / NDMC complaints'),
  ('water_escalate_grievance',
   'How to escalate a water / drainage grievance',
   'Escalation follows the authority''s published grievance path after first-line contact — not the first step for ordinary outages or small blockages.',
   'DJB ContactUs.pdf lists area ZRO contacts for billing. Flood emergencies use 112 + I&FC helpline first.',
   'escalation', 'Citizens with unresolved official complaints',
   'After first-line official contact did not resolve an eligible grievance',
   'Do not skip emergency services when life is at risk.',
   'Use the verified escalation channel for your authority; keep official references.',
   'See the current official service standard.',
   'See the current official service standard.',
   'Published escalation / ZRO / grievance channels',
   true, 'https://djb.gov.in/StaticContent/ContactUs.pdf',
   'delhi_jal_board', 'DJB ContactUs.pdf / municipal grievance hubs')
) as v(slug, title, short_description, detailed_description, right_type, who_can_use, when_it_applies, conditions, what_citizen_can_do, what_authority_must_do, time_limit, possible_remedy, escalation_available, official_action_url, source_slug, source_title)
join public.sources s on s.slug = v.source_slug
where c.slug = 'water_drainage'
on conflict (slug) do update set
  title = excluded.title,
  short_description = excluded.short_description,
  detailed_description = excluded.detailed_description,
  category_id = excluded.category_id,
  time_limit = excluded.time_limit,
  official_action_url = excluded.official_action_url,
  source_id = excluded.source_id,
  source_title = excluded.source_title,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ============================================================================
-- 10) Citizen knowledge ("YOU MAY NOT KNOW THIS")
-- ============================================================================

insert into public.citizen_knowledge (
  slug, title, what_people_often_miss, who_it_applies_to, when_it_applies,
  what_you_can_do, what_you_may_need, category_id, official_portal_url,
  tracking_method, source_id, source_title, last_verified_at, sort_order, active
)
select v.slug, v.title, v.miss, v.who, v.when_applies, v.cando, v.need, c.id, v.url,
  v.tracking, s.id, v.source_title, current_date, v.sort_order, true
from public.issue_categories c
cross join (values
  ('water_find_correct_authority',
   'How to find the correct water authority',
   'Not every water issue goes to DJB. Supply/sewer/billing often involve DJB or NDMC; drains and road waterlogging often involve municipal / PWD / I&FC.',
   'Anyone reporting water or drainage concerns in Delhi',
   'Before contacting an authority',
   'Check your water bill / connection papers for the utility name. For drains and road waterlogging, consider municipal and I&FC channels. GPS alone does not prove jurisdiction.',
   'Bill, connection ID, location notes',
   'https://djb.gov.in/', null,
   'delhi_jal_board', 'DJB / MCD / NDMC / I&FC official pages', 10),
  ('water_find_djb_zro',
   'How to find your DJB area / ZRO',
   'DJB ContactUs.pdf lists ZRO / area contacts for billing and related issues. My Delhi does not hardcode every ZRO into the UI.',
   'DJB consumers',
   'When you need an area-specific DJB contact',
   'Open the official ContactUs.pdf and locate your area / ZRO. Prefer 1916 for water/sewer/billing first-line contact.',
   'Your locality name / bill',
   'https://djb.gov.in/StaticContent/ContactUs.pdf', null,
   'delhi_jal_board', 'DJB ContactUs.pdf', 20),
  ('water_info_before_reporting',
   'What information to keep before reporting a water issue',
   'Official channels may ask for address, landmark, phone (for SMS reference), and bill/connection identifiers.',
   'Anyone contacting DJB / NDMC / MCD',
   'Before calling or filing',
   'Prepare a short description, location, and your contact number. Evidence is optional and should never put you in danger.',
   'Address, landmark, phone, bill/CA if any',
   'https://djb.gov.in/', 'DJB: track via 1916 + SMS reference when provided',
   'delhi_jal_board', 'DJB / MCD official materials', 30),
  ('water_unresolved_complaint',
   'What to do if your water complaint is not resolved',
   'Keep the official reference. Re-contact the same official channel before jumping to escalation.',
   'Citizens with an official water complaint reference',
   'When first-line contact did not resolve the issue',
   'Call 1916 (DJB) or your NDMC control room with the reference. Escalation is not first for ordinary outages.',
   'Official SMS / reference number',
   'https://djb.gov.in/', '1916 + SMS reference (DJB water/sewer)',
   'delhi_jal_board', 'DJB official process', 40),
  ('water_sewer_unresolved_knowledge',
   'What to do if a sewer complaint is not resolved',
   'NDMC sewerage contacts are area-specific — there is no single universal NDMC sewer number.',
   'Citizens with sewerage concerns',
   'When a sewer complaint remains open',
   'Use the official FAQ/area centre list for NDMC, or 1916 for DJB sewer, with your reference.',
   'Official reference; area name',
   'https://www.ndmc.gov.in/faq/sewerage_faqs.aspx', null,
   'ndmc', 'NDMC sewerage FAQs / DJB 1916', 50),
  ('water_when_waterlogging_emergency',
   'When waterlogging should be treated as an emergency',
   'Rapid rise, people trapped, water near electricity, or open manholes under water are emergencies — call 112/101/102 first.',
   'Anyone facing flooding or hazardous waterlogging',
   'When immediate danger may be present',
   'Call emergency services. Do not enter floodwater. Then use I&FC helpline 1800-11-0093 when safe.',
   'None required to call 112',
   'https://ifc.delhi.gov.in/ifc/flood-control-rooms', null,
   'irrigation_flood_control', 'I&FC flood / waterlogging pages', 60),
  ('water_report_open_manhole',
   'How to report a flooded / open manhole',
   'Stay away. Do not approach openings under water. Emergency first if someone may fall in.',
   'Anyone who observes an open or flooded manhole',
   'When a manhole is open or hidden under water',
   'Call 112 if immediate danger. Then contact municipal (MCD 155305 / MCD311) or NDMC channels for your area when safe. Evidence is optional.',
   'Location description; do not enter the hazard',
   'https://mcdonline.nic.in/portal/feedback', null,
   'mcd_online', 'MCD / emergency 112', 70),
  ('water_keep_official_reference',
   'How to keep your official complaint reference',
   'My Delhi case IDs (MD-######) are not official government references. Save the number the authority gives you.',
   'Anyone who contacted an official channel',
   'After using an official phone/app/portal',
   'Enter the official reference in My Delhi as "recorded by you". Track only through the official method.',
   'SMS / portal reference from the authority',
   'https://djb.gov.in/', 'DJB: 1916 + SMS ref; MCD311 track link if applicable',
   'delhi_jal_board', 'My Delhi product principle + DJB materials', 80),
  ('water_channel_by_issue',
   'Which official channel to use for water vs sewer vs waterlogging',
   'Water supply/billing → utility (DJB/NDMC). Sewer → utility (area-specific for NDMC). Road waterlogging → municipal / I&FC / PWD — not automatic DJB.',
   'All Water & Drainage reporters',
   'When choosing who to call',
   'Match the issue type to the purpose-specific channel on Step 7. Confirmation may still be required.',
   'Issue type + location context',
   'https://ifc.delhi.gov.in/', null,
   'irrigation_flood_control', 'DJB / MCD / NDMC / I&FC', 90)
) as v(slug, title, miss, who, when_applies, cando, need, url, tracking, source_slug, source_title, sort_order)
join public.sources s on s.slug = v.source_slug
where c.slug = 'water_drainage'
on conflict (slug) do update set
  title = excluded.title,
  what_people_often_miss = excluded.what_people_often_miss,
  what_you_can_do = excluded.what_you_can_do,
  category_id = excluded.category_id,
  official_portal_url = excluded.official_portal_url,
  source_id = excluded.source_id,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ============================================================================
-- 11) Official services / apps (only verified useful connections)
-- ============================================================================

insert into public.official_services (
  slug, name, service_type, organization, authority_id, category_id,
  description, who_it_is_for, when_to_use, purpose, channel_type,
  official_url, phone, tracking_url, requires_login, requires_otp, requires_reference,
  jurisdiction, source_id, last_verified_at, active
)
select v.slug, v.name, v.service_type, v.organization, a.id, c.id,
  v.description, v.who, v.when_use, v.purpose, v.channel_type,
  v.official_url, v.phone, null, false, false, false,
  v.jurisdiction, s.id, current_date, true
from public.issue_categories c
cross join (values
  ('djb_official_portal', 'Delhi Jal Board official website', 'portal', 'Delhi Jal Board',
   'delhi_jal_board', 'Official DJB homepage and services entry. Opens official channel only — My Delhi does not submit.',
   'DJB-area consumers', 'Water supply, sewerage, billing, connection concerns in DJB areas',
   'web_portal', 'website', 'https://djb.gov.in/', '1916', 'djb_areas_needs_confirmation'),
  ('djb_contact_us_pdf', 'DJB Contact Us / ZRO contacts (PDF)', 'document', 'Delhi Jal Board',
   'delhi_jal_board', 'Official ContactUs.pdf with customer care 1916 and area ZRO contacts. Do not invent tracking URLs.',
   'DJB consumers needing area contacts', 'When area/ZRO contact is needed after confirming DJB',
   'grievance', 'website', 'https://djb.gov.in/StaticContent/ContactUs.pdf', '1916', 'djb_areas_needs_confirmation'),
  ('mcd311_water_drainage', 'MCD311 / Citizen Call Center', 'app', 'Municipal Corporation of Delhi',
   'mcd', 'Official MCD311 app and 155305 listed on mcdonline feedback page. Useful for municipal drainage/waterlogging — confirm MCD area.',
   'Residents in MCD areas', 'Municipal drainage, waterlogging, open manhole civic reports',
   'app', 'app', 'https://mcdonline.nic.in/portal/feedback', '155305', 'mcd_areas_needs_confirmation'),
  ('ndmc_water_services', 'NDMC water / civil complaint information', 'portal', 'NDMC',
   'ndmc', 'NDMC civil complaints and water supply control information. Kali Bari numbers are NDMC-area specific. Sewerage is area-specific.',
   'Residents in NDMC area', 'NDMC water supply / civil concerns',
   'web_portal', 'website', 'https://www.ndmc.gov.in/Departments/civil_complaints.aspx', '1533', 'ndmc_area_only'),
  ('ndmc_sewerage_faqs', 'NDMC sewerage FAQs (area centres)', 'portal', 'NDMC',
   'ndmc', 'Official sewerage FAQ listing area service centres — no universal sewer number.',
   'NDMC-area residents with sewerage concerns', 'Sewer choke / overflow in NDMC area',
   'sewerage', 'website', 'https://www.ndmc.gov.in/faq/sewerage_faqs.aspx', null, 'ndmc_area_only'),
  ('ifc_flood_channels', 'I&FC flood control / waterlogging channels', 'helpline', 'Irrigation & Flood Control Department',
   'irrigation_flood_control', 'Official waterlogging helpline 1800-11-0093 and flood-control rooms page. Not for every blocked drain.',
   'Anyone facing flooding or major waterlogging', 'Flooding / waterlogging emergencies after calling 112 if needed',
   'flood_control', 'phone', 'https://ifc.delhi.gov.in/ifc/flood-control-rooms', '1800-11-0093', 'delhi_flood_waterlogging')
) as v(slug, name, service_type, organization, auth_slug, description, who, when_use, purpose, channel_type, official_url, phone, jurisdiction)
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = case v.auth_slug
  when 'delhi_jal_board' then 'delhi_jal_board'
  when 'mcd' then 'mcd_online'
  when 'ndmc' then 'ndmc'
  when 'irrigation_flood_control' then 'irrigation_flood_control'
end
where c.slug = 'water_drainage'
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  official_url = excluded.official_url,
  phone = excluded.phone,
  authority_id = excluded.authority_id,
  category_id = excluded.category_id,
  source_id = excluded.source_id,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ============================================================================
-- 12) Escalation paths (not first for ordinary outage)
-- ============================================================================

insert into public.escalation_paths (
  slug, authority_id, category_id, level_order, level_name, description,
  action_url, phone, conditions, source_id, last_verified_at, active
)
select v.slug, a.id, c.id, v.level_order, v.level_name, v.description,
  v.action_url, v.phone, v.conditions, s.id, current_date, true
from public.issue_categories c
cross join (values
  ('djb_l1_1916', 'delhi_jal_board', 1, 'First-line customer care (1916)',
   'Call 1916 for water/sewer/billing. Keep SMS reference. Not skipped for ordinary issues.',
   'https://djb.gov.in/', '1916',
   'First step for ordinary DJB water/sewer/billing concerns after confirming DJB area.',
   'delhi_jal_board'),
  ('djb_l2_zro_contacts', 'delhi_jal_board', 2, 'Area / ZRO contacts (ContactUs.pdf)',
   'Official ContactUs.pdf lists ZRO/area contacts (especially billing). Use after first-line 1916 when area contact is needed — not first for ordinary outage.',
   'https://djb.gov.in/StaticContent/ContactUs.pdf', null,
   'Escalation / area contact after first-line channel. Do not hardcode every ZRO into the app UI.',
   'delhi_jal_board'),
  ('mcd_l1_155305', 'mcd', 1, 'MCD Citizen Call Center / MCD311',
   'First-line municipal channel for drainage/waterlogging in MCD areas.',
   'https://mcdonline.nic.in/portal/feedback', '155305',
   'First step for municipal drainage/waterlogging — confirm MCD area.',
   'mcd_online'),
  ('ifc_l1_helpline', 'irrigation_flood_control', 1, 'Waterlogging / flood helpline',
   'Toll-free 1800-11-0093. After emergency 112/101/102 when life danger.',
   'https://ifc.delhi.gov.in/ifc/flood-control-rooms', '1800-11-0093',
   'For flooding/waterlogging — not every blocked drain. Emergency services first if needed.',
   'irrigation_flood_control')
) as v(slug, auth_slug, level_order, level_name, description, action_url, phone, conditions, source_slug)
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where c.slug = 'water_drainage'
on conflict (slug) do update set
  description = excluded.description,
  action_url = excluded.action_url,
  phone = excluded.phone,
  conditions = excluded.conditions,
  source_id = excluded.source_id,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ============================================================================
-- 13) Compact validation summary (select for operator)
-- ============================================================================

-- End of Water & Drainage migration.
-- Validation queries (run manually in SQL Editor after apply):
-- select slug, name from public.issue_categories where slug = 'water_drainage';
-- select count(*) from public.issue_types where category_id = (select id from public.issue_categories where slug = 'water_drainage') and active;
-- select a.slug from public.authorities a where a.slug in ('delhi_jal_board','mcd','ndmc','irrigation_flood_control','pwd_delhi','dda','delhi_cantonment');
