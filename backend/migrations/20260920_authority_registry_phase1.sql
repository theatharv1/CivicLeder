-- My Delhi — Official Authority Database expansion
-- Phase 1: registry structure (sources + channel fields)
-- Phase 2: Building category ONLY (issue types, authorities, channels, routing)
-- Run AFTER: APPLY_ALL_CIVIC.sql → authority_filing_assistant → fire_safety_location_dfs_url
-- Does NOT redesign UI. Does NOT invent portals/phones. Does NOT claim My Delhi submits.
-- Does NOT break DFS filing_url = https://dfs.delhi.gov.in/dfs/complaint-and-grievances or 101.
-- Construction / Electricity / Water / Waste / Roads / Environment / Something Else = NEXT PHASES.

create extension if not exists "pgcrypto";

-- ============================================================================
-- PHASE 1 — Structure
-- ============================================================================

-- ---------- 1) Sources registry (extend; do not duplicate DFS/MCD/etc.) ----------
insert into public.sources (slug, name, organization, official_url, notes, last_verified_at, active)
values
  ('mcd_online', 'Municipal Corporation of Delhi', 'Municipal Corporation of Delhi',
   'https://mcdonline.nic.in/',
   'Citizen Call Center 155305; MCD311 app; email mcd-ithelpdesk@mcd.nic.in listed in official MCD materials.',
   current_date, true),
  ('ndmc', 'New Delhi Municipal Council', 'NDMC',
   'https://www.ndmc.gov.in/',
   'Civic helpline 1533; care@ndmc.gov.in; WhatsApp 8588887773 (user-provided official public contacts). Electricity 19121 remains separate.',
   current_date, true),
  ('dda', 'Delhi Development Authority', 'DDA',
   'https://dda.gov.in/',
   'Toll-free 1800110332; dirsagr@dda.org.in — Building jurisdiction may apply in DDA areas.',
   current_date, true),
  ('delhi_cantonment', 'Delhi Cantonment Board', 'Delhi Cantonment Board',
   'https://delhi.cantt.gov.in/',
   'Phones 25693837 / 25695450; email ceodelhicantt@gmail.com per user-provided official public contacts (gmail noted).',
   current_date, true),
  ('pwd_delhi', 'Public Works Department Delhi', 'PWD GNCTD',
   'https://pwd.delhi.gov.in/',
   'PWD assets only — future phases.', current_date, true),
  ('delhi_jal_board', 'Delhi Jal Board', 'Delhi Jal Board, GNCTD',
   'https://delhijalboard.delhi.gov.in/',
   'Future Water phase.', current_date, true),
  ('brpl', 'BSES Rajdhani Power Limited', 'BRPL',
   'https://www.bsesdelhi.com/web/brpl',
   'Future Electricity phase — service-area dependent.', current_date, true),
  ('bypl', 'BSES Yamuna Power Limited', 'BYPL',
   'https://www.bsesdelhi.com/',
   'Future Electricity phase — service-area dependent.', current_date, true),
  ('tpddl', 'Tata Power-DDL', 'TPDDL',
   'https://www.tatapower-ddl.com/',
   'Future Electricity phase — service-area dependent.', current_date, true),
  ('derc', 'Delhi Electricity Regulatory Commission', 'DERC',
   'https://www.derc.gov.in/',
   'Source shell for future Electricity / regulatory routing — not Building.', current_date, true),
  ('delhi_traffic_police', 'Delhi Traffic Police', 'Delhi Police',
   'https://delhitrafficpolice.nic.in/',
   'Source shell for future Roads / traffic phases.', current_date, true),
  ('labour_delhi', 'Labour Department Delhi', 'GNCTD Labour',
   'https://labour.delhi.gov.in/',
   'Source shell for future Construction / labour phases.', current_date, true),
  ('dpcc', 'Delhi Pollution Control Committee', 'DPCC',
   'https://www.dpcc.delhigovt.nic.in/',
   'Future Environment phase.', current_date, true),
  ('irrigation_flood_control', 'Irrigation & Flood Control Department', 'I&FC GNCTD',
   'https://irrigation.delhi.gov.in/',
   'Source shell for future Water / drainage phases.', current_date, true),
  ('pgms_delhi', 'Public Grievance Monitoring System', 'GNCTD PGMS',
   'https://pgms.delhi.gov.in/',
   'Source shell for future cross-cutting grievance routing — not auto-assigned.', current_date, true),
  ('cm_jan_sunwai', 'CM Jan Sunwai / Delhi Government portal', 'GNCTD',
   'https://delhi.gov.in/',
   'Source shell — dedicated Jan Sunwai deep-link not verified in this migration; official delhi.gov.in only.',
   current_date, true),
  ('delhi_fire_service', 'Delhi Fire Service', 'Government of NCT of Delhi',
   'https://dfs.delhi.gov.in/',
   'Existing — do not duplicate. Filing: /dfs/complaint-and-grievances; emergency 101.',
   current_date, true)
on conflict (slug) do update set
  name = excluded.name,
  organization = excluded.organization,
  official_url = excluded.official_url,
  notes = excluded.notes,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ---------- 2) Extend authority_channels (add missing columns only) ----------
alter table public.authority_channels
  add column if not exists action_url text,
  add column if not exists tracking_url text,
  add column if not exists email text,
  add column if not exists whatsapp text,
  add column if not exists phone text,
  add column if not exists requires_login boolean not null default false,
  add column if not exists requires_otp boolean not null default false,
  add column if not exists requires_captcha boolean not null default false,
  add column if not exists instructions text;

-- Expand channel_type to include whatsapp (keep existing values)
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
      'phone', 'website', 'portal', 'email', 'whatsapp', 'other'
    ));
end $$;

-- Backfill phone/email from value where typed
update public.authority_channels
set phone = value
where channel_type = 'phone' and (phone is null or phone = '') and value is not null;

update public.authority_channels
set email = value
where channel_type = 'email' and (email is null or email = '') and value is not null;

-- ---------- 3) authority_services may hang off a channel ----------
alter table public.authority_services
  add column if not exists channel_id uuid references public.authority_channels(id) on delete set null;

create index if not exists authority_services_channel_idx
  on public.authority_services(channel_id);

-- ---------- 4) Routing: allow needs_confirmation confidence + mode ----------
do $$
declare r record;
begin
  for r in (
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'routing_rules'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%confidence%'
  ) loop
    execute format('alter table public.routing_rules drop constraint %I', r.conname);
  end loop;
  alter table public.routing_rules
    add constraint routing_rules_confidence_check
    check (confidence in ('likely', 'possible', 'needs_confirmation'));
end $$;

do $$
declare r record;
begin
  for r in (
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'routing_rules'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%routing_mode%'
  ) loop
    execute format('alter table public.routing_rules drop constraint %I', r.conname);
  end loop;
  alter table public.routing_rules
    add constraint routing_rules_routing_mode_check
    check (routing_mode in (
      'likely', 'conditional', 'needs_confirmation', 'needs_service_area', 'manual'
    ));
end $$;

-- ---------- 5) Harden: do not alter DFS complaint filing_url / 101 ----------
-- Explicit no-op guard comment: DFS rows are left untouched by Building seeds below.

-- ============================================================================
-- PHASE 2 — Building ONLY
-- ============================================================================

-- ---------- Building issue types (reported-concern wording) ----------
insert into public.issue_types (
  category_id, slug, name, short_description, sort_order, source_id, verification_status, active
)
select c.id, v.slug, v.name, v.short_description, v.sort_order, s.id, v.verification_status, true
from public.issue_categories c
join public.sources s on s.slug = 'mcd_online'
cross join (values
  ('unsafe_structure',
   'Unsafe structure',
   'Reported concern about an unsafe structure (not a legal determination)',
   1, 'probable'),
  ('building_safety_concern',
   'Building safety concern',
   'Reported building safety concern — jurisdiction depends on location',
   2, 'probable'),
  ('suspected_unauthorized_construction',
   'Suspected unauthorized construction',
   'Reported concern about possible unauthorized construction (reported concern — not a finding)',
   3, 'probable'),
  ('building_plan_concern',
   'Building plan concern',
   'Reported concern related to building plans / approvals — authority depends on jurisdiction',
   4, 'probable'),
  ('encroachment_related',
   'Encroachment-related concern',
   'Reported encroachment-related concern — municipal/authority depends on location',
   5, 'probable'),
  ('structural_concern',
   'Structural concern',
   'Reported structural concern (not an engineering verdict)',
   6, 'probable'),
  ('blocked_access',
   'Blocked access',
   'Reported blocked access related to a building or property',
   7, 'probable'),
  ('building_permit_related',
   'Building permit-related concern',
   'Reported concern related to building permits — confirm correct authority for the area',
   8, 'probable')
) as v(slug, name, short_description, sort_order, verification_status)
where c.slug = 'building'
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  sort_order = excluded.sort_order,
  source_id = excluded.source_id,
  verification_status = excluded.verification_status,
  active = true;

-- ---------- Authorities: DDA + Cantonment (new); refresh MCD/NDMC descriptions ----------
insert into public.authorities
  (slug, name, department, government, official_website, emergency_number, short_description,
   source_name, source_url, source_id, last_verified_at, verification_status, active)
select v.slug, v.name, v.department, v.government, v.official_website, v.emergency_number, v.short_description,
  s.name, s.official_url, s.id, current_date, 'verified', true
from (values
  ('dda', 'Delhi Development Authority (DDA)', 'Delhi Development Authority', 'DDA',
   'https://dda.gov.in/', null,
   'Likely authority for some building / development concerns in DDA areas — jurisdiction needs confirmation.'),
  ('delhi_cantonment', 'Delhi Cantonment Board', 'Delhi Cantonment Board', 'Delhi Cantonment Board',
   'https://delhi.cantt.gov.in/', null,
   'Likely authority for building / civic concerns inside Delhi Cantonment — jurisdiction needs confirmation.')
) as v(slug, name, department, government, official_website, emergency_number, short_description)
join public.sources s on s.slug = v.slug
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  official_website = excluded.official_website,
  source_id = excluded.source_id,
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  last_verified_at = excluded.last_verified_at,
  verification_status = excluded.verification_status,
  active = true;

-- Refresh MCD / NDMC short descriptions for Building context (do not change DFS)
update public.authorities a
set short_description = 'Municipal civic authority for many MCD areas. Building issues are NOT automatically MCD — jurisdiction needs confirmation.',
    last_verified_at = current_date
from public.sources s
where a.slug = 'mcd' and s.slug = 'mcd_online';

update public.authorities a
set short_description = 'Civic authority for NDMC area. Building issues apply only where NDMC has jurisdiction — needs confirmation. (Electricity helpline 19121 is separate.)',
    last_verified_at = current_date
from public.sources s
where a.slug = 'ndmc' and s.slug = 'ndmc';

-- ---------- Channels: Building authorities (verified contacts only; action_url/tracking_url NULL) ----------
-- MCD: 155305, mcd-ithelpdesk@mcd.nic.in, MCD311, https://mcdonline.nic.in/
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, email, whatsapp,
  action_url, tracking_url, instructions,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, v.channel_type, v.label, v.value, v.phone, v.email, v.whatsapp,
  null, null, v.instructions,
  s.name, s.official_url, s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'mcd_online'
cross join (values
  ('phone', 'Citizen Call Center', '155305', '155305', null, null,
   'Call 155305. My Delhi does not submit complaints.'),
  ('email', 'IT Helpdesk email', 'mcd-ithelpdesk@mcd.nic.in', null, 'mcd-ithelpdesk@mcd.nic.in', null,
   'Email listed for MCD IT/helpdesk contact. Not a verified complaint-intake deep-link.'),
  ('website', 'MCD Online', 'https://mcdonline.nic.in/', null, null, null,
   'Official website. Dedicated complaint action_url not re-verified in this Building migration — left NULL.'),
  ('other', 'MCD311 mobile app', 'MCD311', null, null, null,
   'Official MCD311 app listed on mcdonline.nic.in. Install from official store listings.')
) as v(channel_type, label, value, phone, email, whatsapp, instructions)
where a.slug = 'mcd'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = v.channel_type and c.value = v.value
  );

-- Ensure action_url/tracking_url stay NULL on Building contact rows we just care about
update public.authority_channels ac
set action_url = null,
    tracking_url = null,
    last_verified_at = current_date
from public.authorities a
where ac.authority_id = a.id
  and a.slug = 'mcd'
  and ac.channel_type in ('phone', 'email', 'website', 'other')
  and ac.value in ('155305', 'mcd-ithelpdesk@mcd.nic.in', 'https://mcdonline.nic.in/', 'MCD311');

-- NDMC: 1533, care@ndmc.gov.in, WhatsApp 8588887773, https://www.ndmc.gov.in/
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, email, whatsapp,
  action_url, tracking_url, instructions,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, v.channel_type, v.label, v.value, v.phone, v.email, v.whatsapp,
  null, null, v.instructions,
  s.name, s.official_url, s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'ndmc'
cross join (values
  ('phone', 'NDMC civic helpline', '1533', '1533', null, null,
   'Civic helpline 1533. Distinct from electricity helpline 19121.'),
  ('email', 'NDMC care email', 'care@ndmc.gov.in', null, 'care@ndmc.gov.in', null,
   'Official care email from NDMC public contact materials.'),
  ('whatsapp', 'NDMC WhatsApp', '8588887773', null, null, '8588887773',
   'WhatsApp number from NDMC public contact materials. Open via WhatsApp app.'),
  ('website', 'NDMC website', 'https://www.ndmc.gov.in/', null, null, null,
   'Official website. Complaint action_url not verified — left NULL.')
) as v(channel_type, label, value, phone, email, whatsapp, instructions)
where a.slug = 'ndmc'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = v.channel_type and c.value = v.value
  );

-- DDA: 1800110332, dirsagr@dda.org.in, https://dda.gov.in/
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, email, whatsapp,
  action_url, tracking_url, instructions,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, v.channel_type, v.label, v.value, v.phone, v.email, v.whatsapp,
  null, null, v.instructions,
  s.name, s.official_url, s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'dda'
cross join (values
  ('phone', 'DDA toll-free', '1800110332', '1800110332', null, null,
   'Toll-free contact. My Delhi does not submit complaints.'),
  ('email', 'DDA email', 'dirsagr@dda.org.in', null, 'dirsagr@dda.org.in', null,
   'Email from DDA public contact materials.'),
  ('website', 'DDA website', 'https://dda.gov.in/', null, null, null,
   'Official website. Complaint action_url / tracking_url not verified — left NULL.')
) as v(channel_type, label, value, phone, email, whatsapp, instructions)
where a.slug = 'dda'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = v.channel_type and c.value = v.value
  );

-- Delhi Cantonment Board
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, email, whatsapp,
  action_url, tracking_url, instructions,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, v.channel_type, v.label, v.value, v.phone, v.email, v.whatsapp,
  null, null, v.instructions,
  s.name, s.official_url, s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'delhi_cantonment'
cross join (values
  ('phone', 'Cantonment Board phone', '25693837', '25693837', null, null,
   'Phone from Delhi Cantonment Board public contacts (user-provided seed).'),
  ('phone', 'Cantonment Board phone (alt)', '25695450', '25695450', null, null,
   'Alternate phone from Delhi Cantonment Board public contacts (user-provided seed).'),
  ('email', 'CEO Delhi Cantt email', 'ceodelhicantt@gmail.com', null, 'ceodelhicantt@gmail.com', null,
   'Public contact email from user-provided official list; gmail domain noted (not .gov.in).'),
  ('website', 'Delhi Cantonment Board website', 'https://delhi.cantt.gov.in/', null, null, null,
   'Official website. Complaint action_url / tracking_url not verified — left NULL.')
) as v(channel_type, label, value, phone, email, whatsapp, instructions)
where a.slug = 'delhi_cantonment'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = v.channel_type and c.value = v.value
  );

-- ---------- Building contact services (no invented filing/tracking URLs) ----------
insert into public.authority_services (
  authority_id, service_name, slug, description, service_type,
  official_url, filing_url, tracking_url, phone, integration_type,
  channel_id, source_id, last_verified_at, active
)
select a.id,
  v.service_name,
  v.slug,
  v.description,
  'information',
  v.official_url,
  null,
  null,
  v.phone,
  v.integration_type,
  (
    select c.id from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = 'website'
    order by c.last_verified_at desc nulls last
    limit 1
  ),
  s.id,
  current_date,
  true
from (values
  ('mcd', 'mcd_online', 'MCD building / civic contact', 'mcd_building_contact',
   'Helpline 155305, email, MCD311, and mcdonline.nic.in. No verified Building-specific complaint action_url seeded. My Delhi does not submit.',
   'https://mcdonline.nic.in/', '155305', 'phone'),
  ('ndmc', 'ndmc', 'NDMC building / civic contact', 'ndmc_building_contact',
   'Helpline 1533, care@ndmc.gov.in, WhatsApp, ndmc.gov.in. No verified Building complaint action_url. Jurisdiction is NDMC-area only.',
   'https://www.ndmc.gov.in/', '1533', 'phone'),
  ('dda', 'dda', 'DDA contact', 'dda_building_contact',
   'Toll-free 1800110332 and dirsagr@dda.org.in. No verified complaint action_url / tracking_url.',
   'https://dda.gov.in/', '1800110332', 'phone'),
  ('delhi_cantonment', 'delhi_cantonment', 'Delhi Cantonment Board contact', 'delhi_cantonment_building_contact',
   'Phones and email from Cantonment public contacts. Website delhi.cantt.gov.in. No verified complaint action_url.',
   'https://delhi.cantt.gov.in/', '25693837', 'phone')
) as v(auth_slug, source_slug, service_name, slug, description, official_url, phone, integration_type)
-- Alias required: never `join public.authorities on a.slug=...` (42P01 relation "a").
cross join public.authorities a
cross join public.sources s
where a.slug = v.auth_slug
  and s.slug = v.source_slug
  and not exists (
  select 1 from public.authority_services x
  where x.authority_id = a.id and x.slug = v.slug
);

-- ---------- Building routing: NEVER auto-assign all → MCD ----------
-- Upsert-style: update any existing Building category rules for these authorities
-- Alias fix: never `join public.authorities on a.slug=...` (missing alias → 42P01 relation "a").
update public.routing_rules r
set confidence = 'needs_confirmation',
    routing_mode = 'needs_confirmation',
    is_primary = false,
    active = true,
    notes = case a.slug
      when 'mcd' then 'Jurisdiction needs confirmation. MCD is one possible municipal authority for Building concerns in MCD areas — NOT automatic for all Building reports.'
      when 'ndmc' then 'Jurisdiction needs confirmation. NDMC may apply only in NDMC area.'
      when 'dda' then 'Jurisdiction needs confirmation. DDA may apply for some development / building matters in DDA areas.'
      when 'delhi_cantonment' then 'Jurisdiction needs confirmation. Delhi Cantonment Board may apply inside Cantonment limits.'
      else r.notes
    end,
    last_verified_at = current_date,
    source_id = s.id,
    source_name = s.name,
    source_url = s.official_url
from public.issue_categories c,
     public.authorities a,
     public.sources s
where r.category_id = c.id
  and r.authority_id = a.id
  and c.slug = 'building'
  and a.slug in ('mcd', 'ndmc', 'dda', 'delhi_cantonment')
  and s.slug = case a.slug
    when 'mcd' then 'mcd_online'
    when 'ndmc' then 'ndmc'
    when 'dda' then 'dda'
    when 'delhi_cantonment' then 'delhi_cantonment'
  end
  and r.issue_type_id is null;

insert into public.routing_rules
  (category_id, issue_type_id, authority_id, confidence, routing_mode, is_primary, notes,
   source_name, source_url, source_id, last_verified_at, active)
select c.id, null, a.id, 'needs_confirmation', 'needs_confirmation', false, v.notes,
  s.name, s.official_url, s.id, current_date, true
from public.issue_categories c
cross join (values
  ('mcd', 'mcd_online',
   'Jurisdiction needs confirmation. MCD is one possible municipal authority for Building concerns in MCD areas — NOT automatic for all Building reports.'),
  ('ndmc', 'ndmc',
   'Jurisdiction needs confirmation. NDMC may apply only in NDMC area.'),
  ('dda', 'dda',
   'Jurisdiction needs confirmation. DDA may apply for some development / building matters in DDA areas.'),
  ('delhi_cantonment', 'delhi_cantonment',
   'Jurisdiction needs confirmation. Delhi Cantonment Board may apply inside Cantonment limits.')
) as v(auth_slug, source_slug, notes)
cross join public.authorities a
cross join public.sources s
where a.slug = v.auth_slug
  and s.slug = v.source_slug
  and c.slug = 'building'
  and not exists (
    select 1 from public.routing_rules r
    where r.category_id = c.id
      and r.authority_id = a.id
      and r.issue_type_id is null
  );

comment on column public.authority_channels.action_url is
  'Verified complaint/grievance entry URL only. NULL if not verified. My Delhi opens; does not submit.';
comment on column public.authority_channels.tracking_url is
  'Verified official tracking URL only. NULL if not verified. Never invent query params.';
comment on column public.authority_services.channel_id is
  'Optional link from a service to a specific authority_channels row.';
