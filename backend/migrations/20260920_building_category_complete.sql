-- My Delhi — Building category COMPLETE
-- Run AFTER: APPLY_ALL_CIVIC → authority_filing_assistant → fire_safety_location_dfs_url
--            → authority_registry_phase1
-- If live DB already failed with 42703 emergency_relevant: run
--   supabase/FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql first (see FIX_SCHEMA_MISMATCH.md).
-- Building ONLY. Does not invent portals. Does not break DFS / Fire Safety.
-- My Delhi opens official URLs only — does not submit complaints.
-- MD-###### remains internal — never an official reference.

create extension if not exists "pgcrypto";

-- ============================================================================
-- 1) Schema extensions — MUST stay before any INSERT/COMMENT using emergency_relevant
-- ============================================================================

alter table public.issue_types
  add column if not exists emergency_relevant boolean not null default false;

comment on column public.issue_types.emergency_relevant is
  'When true, Building flow treats selection as emergency-relevant (collapse / trapped) — prioritize 112/101 before citizen complaint channels.';

-- Allow approval-only services (plan portals — never default for dangerous-building complaints).
-- Catalog join MUST use nsp.oid = rel.relnamespace (nsp.nspname is name; relnamespace is oid).
-- Additive only: document current check defs; extend with 'approval' if missing; never drop
-- without recreating the full prior set + approval. Does not DROP TABLE/COLUMN or Fire Safety data.
do $$
declare
  r record;
  needs_approval boolean := true;
  found_any boolean := false;
begin
  -- Document current allowed service_type values (for operators / SQL Editor Notices)
  for r in (
    select con.conname, pg_get_constraintdef(con.oid) as def
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'authority_services'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%service_type%'
  ) loop
    found_any := true;
    raise notice 'Current authority_services.service_type constraint %: %', r.conname, r.def;
    -- Prior filing_assistant set: emergency, complaint, grievance, tracking, information, other
    if r.def ilike '%''approval''%' or r.def ilike '%approval%' then
      needs_approval := false;
    end if;
  end loop;

  if not found_any then
    raise notice 'No service_type check constraint found; adding full Building-safe set including approval.';
  end if;

  if needs_approval then
    for r in (
      select con.conname
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
      where nsp.nspname = 'public'
        and rel.relname = 'authority_services'
        and con.contype = 'c'
        and pg_get_constraintdef(con.oid) ilike '%service_type%'
    ) loop
      execute format('alter table public.authority_services drop constraint %I', r.conname);
    end loop;
    -- Recreate with ALL prior values + approval (additive extension for Building plan portals)
    alter table public.authority_services
      add constraint authority_services_service_type_check
      check (service_type in (
        'emergency', 'complaint', 'grievance', 'tracking', 'information', 'approval', 'other'
      ));
    raise notice 'Extended authority_services.service_type check to include approval (kept prior values).';
  else
    raise notice 'authority_services.service_type already allows approval; no constraint change.';
  end if;
end $$;

-- ============================================================================
-- 2) Building issue types (citizen-friendly; reported-concern wording)
-- ============================================================================

-- Deactivate prior Phase-2 Building slugs replaced by this complete list
update public.issue_types t
set active = false
from public.issue_categories c
where t.category_id = c.id
  and c.slug = 'building'
  and t.slug in (
    'unsafe_structure',
    'building_safety_concern',
    'suspected_unauthorized_construction',
    'building_plan_concern',
    'encroachment_related',
    'structural_concern',
    'blocked_access',
    'building_permit_related'
  );

insert into public.issue_types (
  category_id, slug, name, short_description, sort_order,
  source_id, verification_status, emergency_relevant, active
)
select c.id, v.slug, v.name, v.short_description, v.sort_order,
  s.id, 'probable', v.emergency_relevant, true
from public.issue_categories c
join public.sources s on s.slug = 'mcd_online'
cross join (values
  ('building_structural_damage',
   'Building appears damaged',
   'Reported concern about possible structural damage (not an engineering verdict)',
   1, false),
  ('building_serious_cracks',
   'Serious cracks visible',
   'Reported concern about serious cracks that may need official attention',
   2, false),
  ('building_dangerous_condition',
   'Building appears unsafe',
   'Reported concern that a building may be in a dangerous condition — not a legal finding',
   3, true),
  ('building_dilapidated_structure',
   'Dilapidated / poorly maintained structure',
   'Reported concern about a possible dilapidated structure',
   4, false),
  ('building_collapse',
   'Possible building collapse',
   'Reported concern that a building may have collapsed or is collapsing — call emergency services first',
   5, true),
  ('building_collapse_risk',
   'Building / structure may collapse',
   'Reported concern about possible collapse risk — prioritize emergency numbers if anyone is in danger',
   6, true),
  ('building_unauthorized_construction_concern',
   'Construction that may not have required approval',
   'Reported concern about possible unauthorized construction (reported concern — not a finding)',
   7, false),
  ('building_deviation_from_sanctioned_plan',
   'Construction that may not match the approved plan',
   'Reported concern that work may differ from a sanctioned plan — jurisdiction needs confirmation',
   8, false),
  ('building_unauthorized_addition',
   'Possible unauthorized addition',
   'Reported concern about a possible unauthorized addition to a building',
   9, false),
  ('building_unauthorized_alteration',
   'Possible unauthorized alteration',
   'Reported concern about a possible unauthorized alteration',
   10, false),
  ('building_extra_floor_concern',
   'Possible extra floor / height concern',
   'Reported concern about a possible extra floor or height-related issue',
   11, false),
  ('building_building_plan_concern',
   'Building plan / approval issue',
   'Seeking building-plan or approval information — use approval portal when relevant, not dangerous-building complaint flow',
   12, false),
  ('building_completion_occupancy_concern',
   'Completion / occupancy certificate concern',
   'Reported concern related to completion or occupancy documentation — confirm correct authority',
   13, false),
  ('building_use_misuse_concern',
   'Building use / misuse concern',
   'Reported concern about how a building may be used — not a legal determination',
   14, false),
  ('building_boundary_structure_concern',
   'Building or structure may extend into a public space',
   'Reported boundary / encroachment-related concern — municipal authority depends on location',
   15, false),
  ('building_abandoned_structure',
   'Abandoned structure concern',
   'Reported concern about a possible abandoned structure',
   16, false),
  ('building_heritage_damage',
   'Heritage building concern',
   'Reported concern about possible damage or risk to a heritage structure',
   17, false),
  ('building_public_safety_concern',
   'Public safety concern near a building',
   'Reported public-safety concern related to a building or structure',
   18, true),
  ('building_other',
   'Something else (building)',
   'Other reported building concern — jurisdiction still needs confirmation',
   19, false)
) as v(slug, name, short_description, sort_order, emergency_relevant)
where c.slug = 'building'
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
-- 3) Building emergency assessment (reuse emergency_rules pattern from Fire)
-- ============================================================================

insert into public.emergency_rules
  (category_id, rule_kind, question_key, question_text, condition, emergency_level,
   explanation, sort_order, source_name, source_url, last_verified_at, active)
select c.id, 'assessment_question', v.question_key, v.question_text, 'yes_means_emergency', 'high',
  v.explanation, v.sort_order, 'My Delhi Building safety guidance', null, current_date, true
from public.issue_categories c
cross join (values
  ('anyone_trapped',
   'Is anyone trapped or unable to get out safely?',
   'People unable to exit safely may need immediate emergency response (112 / 101).',
   1),
  ('immediate_danger_people',
   'Is there an immediate danger to people?',
   'Immediate danger to people requires emergency services before any civic complaint.',
   2),
  ('collapse_or_structural',
   'Is there a risk of building collapse or major structural failure?',
   'Collapse risk requires calling emergency services first — do not enter an unsafe building.',
   3),
  ('serious_injury_now',
   'Could the situation cause serious injury right now?',
   'Risk of serious injury right now is an emergency signal.',
   4)
) as v(question_key, question_text, explanation, sort_order)
where c.slug = 'building'
  and not exists (
    select 1 from public.emergency_rules r
    where r.category_id = c.id
      and r.rule_kind = 'assessment_question'
      and r.question_key = v.question_key
  );

-- Emergency signals for collapse / trapped issue types
insert into public.emergency_rules
  (category_id, issue_type_id, rule_kind, question_key, question_text, condition,
   emergency_level, explanation, sort_order, source_name, last_verified_at, active)
select c.id, t.id, 'emergency_signal', t.slug,
  'Selected issue type is emergency-relevant for Building',
  'user_selected_yes', 'high',
  'Call 112 / 101 first. Do not use normal complaint channels before emergency response.',
  t.sort_order, 'My Delhi Building', current_date, true
from public.issue_categories c
join public.issue_types t on t.category_id = c.id
where c.slug = 'building'
  and t.emergency_relevant = true
  and t.active = true
  and not exists (
    select 1 from public.emergency_rules r
    where r.category_id = c.id
      and r.issue_type_id = t.id
      and r.rule_kind = 'emergency_signal'
  );

-- ============================================================================
-- 4) Refresh authority descriptions (Building context; do not touch DFS)
-- ============================================================================

update public.authorities
set short_description = 'Likely municipal authority for many MCD areas. Building issues are NOT automatically MCD — jurisdiction needs confirmation.',
    last_verified_at = current_date,
    verification_status = 'verified'
where slug = 'mcd';

update public.authorities
set short_description = 'Likely civic authority for NDMC area only. EBR handles unauthorized-construction concerns via NDMC 311 / official channels — needs confirmation. (Electricity 19121 is separate.)',
    last_verified_at = current_date,
    verification_status = 'verified'
where slug = 'ndmc';

update public.authorities
set short_description = 'Likely authority for some development / building concerns on DDA land or DDA processes — jurisdiction needs confirmation.',
    last_verified_at = current_date,
    verification_status = 'verified',
    official_website = 'https://dda.gov.in/'
where slug = 'dda';

update public.authorities
set short_description = 'Likely authority for building / civic concerns inside Delhi Cantonment — jurisdiction needs confirmation.',
    last_verified_at = current_date,
    verification_status = 'verified',
    official_website = 'https://delhi.cantt.gov.in/'
where slug = 'delhi_cantonment';

-- Ensure DDA / Cantonment rows exist (idempotent with phase1)
insert into public.authorities
  (slug, name, department, government, official_website, emergency_number, short_description,
   source_name, source_url, source_id, last_verified_at, verification_status, active)
select v.slug, v.name, v.department, v.government, v.official_website, null, v.short_description,
  s.name, s.official_url, s.id, current_date, 'verified', true
from (values
  ('dda', 'Delhi Development Authority (DDA)', 'Delhi Development Authority', 'DDA',
   'https://dda.gov.in/',
   'Likely authority for some development / building concerns on DDA land or DDA processes — jurisdiction needs confirmation.'),
  ('delhi_cantonment', 'Delhi Cantonment Board', 'Delhi Cantonment Board', 'Delhi Cantonment Board',
   'https://delhi.cantt.gov.in/',
   'Likely authority for building / civic concerns inside Delhi Cantonment — jurisdiction needs confirmation.')
) as v(slug, name, department, government, official_website, short_description)
join public.sources s on s.slug = v.slug
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  official_website = excluded.official_website,
  source_id = excluded.source_id,
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  last_verified_at = excluded.last_verified_at,
  verification_status = 'verified',
  active = true;

-- ============================================================================
-- 5) Channels — verified contacts + action/tracking only when found on official pages
-- ============================================================================

-- MCD311 create + track URLs linked from https://mcdonline.nic.in/portal/feedback
-- (official MCD site → MCD311 / everythingcivic citizen createissue + issuedetail)
update public.authority_channels ac
set action_url = 'https://mcd.everythingcivic.com/citizen/createissue?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120',
    tracking_url = 'https://mcd.everythingcivic.com/citizen/issuedetail?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120',
    instructions = 'MCD311 complaint / track links as listed under “If Any Complaint” on mcdonline.nic.in/portal/feedback. My Delhi opens only; does not submit. Call 155305 or email mcd-ithelpdesk@mcd.nic.in also listed there.',
    phone = coalesce(ac.phone, '155305'),
    last_verified_at = current_date,
    active = true
from public.authorities a
where ac.authority_id = a.id
  and a.slug = 'mcd'
  and ac.channel_type = 'website'
  and ac.value = 'https://mcdonline.nic.in/';

-- Ensure MCD phone / email / MCD311 app / website rows
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, email, whatsapp,
  action_url, tracking_url, instructions,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, v.channel_type, v.label, v.value, v.phone, v.email, v.whatsapp,
  v.action_url, v.tracking_url, v.instructions,
  s.name, s.official_url, s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'mcd_online'
cross join (values
  ('phone', 'Citizen Call Center', '155305', '155305', null::text, null::text,
   null::text, null::text,
   'Call 155305 (listed on mcdonline.nic.in). My Delhi does not submit complaints.'),
  ('email', 'MCD IT / helpdesk email', 'mcd-ithelpdesk@mcd.nic.in', null, 'mcd-ithelpdesk@mcd.nic.in', null,
   null, null,
   'Email listed on mcdonline.nic.in feedback page for complaints/help. Not a Building-Department-specific email.'),
  ('website', 'MCD Online', 'https://mcdonline.nic.in/', null, null, null,
   'https://mcd.everythingcivic.com/citizen/createissue?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120',
   'https://mcd.everythingcivic.com/citizen/issuedetail?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120',
   'Official website. MCD311 create/track URLs from portal/feedback “Click here for Complaint” / issuedetail.'),
  ('other', 'MCD311 mobile app', 'MCD311', null, null, null,
   null, null,
   'Official MCD311 app named on mcdonline.nic.in. Install from official store listings.')
) as v(channel_type, label, value, phone, email, whatsapp, action_url, tracking_url, instructions)
where a.slug = 'mcd'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = v.channel_type and c.value = v.value
  );

-- NDMC: complaints hub + contacts (verified on ndmc.gov.in/complaints.aspx)
update public.authority_channels ac
set action_url = 'https://www.ndmc.gov.in/complaints.aspx',
    tracking_url = null,
    instructions = 'Official NDMC Complaints page (1533, WhatsApp 8588887773, NDMC 311 app). Dedicated web filing deep-link beyond this page not verified — tracking_url left NULL. My Delhi does not submit.',
    last_verified_at = current_date,
    active = true
from public.authorities a
where ac.authority_id = a.id
  and a.slug = 'ndmc'
  and ac.channel_type = 'website'
  and ac.value = 'https://www.ndmc.gov.in/';

insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, email, whatsapp,
  action_url, tracking_url, instructions,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, v.channel_type, v.label, v.value, v.phone, v.email, v.whatsapp,
  v.action_url, null, v.instructions,
  s.name, s.official_url, s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'ndmc'
cross join (values
  ('phone', 'NDMC civic helpline', '1533', '1533', null::text, null::text, null::text,
   'Civic helpline 1533 on ndmc.gov.in/complaints.aspx. Distinct from electricity 19121.'),
  ('email', 'NDMC care email', 'care@ndmc.gov.in', null, 'care@ndmc.gov.in', null, null,
   'care@ndmc.gov.in listed on NDMC site (mailto). Not a Building-Department-specific email.'),
  ('whatsapp', 'NDMC WhatsApp', '8588887773', null, null, '8588887773', null,
   'WhatsApp @ 858 888 7773 listed on ndmc.gov.in/complaints.aspx.'),
  ('website', 'NDMC website', 'https://www.ndmc.gov.in/', null, null, null,
   'https://www.ndmc.gov.in/complaints.aspx',
   'Official website. Complaint hub: /complaints.aspx. NDMC 311 app for lodging complaints.')
) as v(channel_type, label, value, phone, email, whatsapp, action_url, instructions)
where a.slug = 'ndmc'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = v.channel_type and c.value = v.value
  );

-- DDA contacts + grievance hub action on website channel
update public.authority_channels ac
set action_url = 'https://dda.gov.in/grievance',
    tracking_url = null,
    instructions = 'DDA Grievance hub (STF, Grievance Portal, DDA 311 app, Samasya Nidaan). Specific service filing_urls live on authority_services. Tracking deep-link not separately verified — left NULL.',
    last_verified_at = current_date,
    active = true
from public.authorities a
where ac.authority_id = a.id
  and a.slug = 'dda'
  and ac.channel_type = 'website'
  and ac.value = 'https://dda.gov.in/';

insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, email, whatsapp,
  action_url, tracking_url, instructions,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, v.channel_type, v.label, v.value, v.phone, v.email, null,
  v.action_url, null, v.instructions,
  s.name, s.official_url, s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'dda'
cross join (values
  ('phone', 'DDA toll-free', '1800110332', '1800110332', null::text,
   null::text,
   'Helpline 1800110332 listed on dda.gov.in contact page.'),
  ('email', 'DDA Grievance Redressal email', 'dirsagr@dda.org.in', null, 'dirsagr@dda.org.in',
   null,
   'dirsagr@dda.org.in listed for Grievance Redressal (SA&GR) on DDA contact page.'),
  ('website', 'DDA website', 'https://dda.gov.in/', null, null,
   'https://dda.gov.in/grievance',
   'Official website. Grievance hub: /grievance.')
) as v(channel_type, label, value, phone, email, action_url, instructions)
where a.slug = 'dda'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = v.channel_type and c.value = v.value
  );

-- Cantonment: website + phones + email only — no invented complaint URL
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, email, whatsapp,
  action_url, tracking_url, instructions,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, v.channel_type, v.label, v.value, v.phone, v.email, null,
  null, null, v.instructions,
  s.name, s.official_url, s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'delhi_cantonment'
cross join (values
  ('phone', 'Cantonment Board phone', '25693837', '25693837', null::text,
   'Phone from Delhi Cantonment Board public contacts. Complaint portal URL not verified — left NULL.'),
  ('phone', 'Cantonment Board phone (alt)', '25695450', '25695450', null,
   'Alternate phone from Delhi Cantonment Board public contacts.'),
  ('email', 'CEO Delhi Cantt email', 'ceodelhicantt@gmail.com', null, 'ceodelhicantt@gmail.com',
   'Public contact email; gmail domain noted (not .gov.in). No verified complaint portal.'),
  ('website', 'Delhi Cantonment Board website', 'https://delhi.cantt.gov.in/', null, null,
   'Official website. Complaint action_url / tracking_url not verified — left NULL.')
) as v(channel_type, label, value, phone, email, instructions)
where a.slug = 'delhi_cantonment'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = v.channel_type and c.value = v.value
  );

-- Explicitly keep Cantonment action/tracking NULL
update public.authority_channels ac
set action_url = null,
    tracking_url = null,
    last_verified_at = current_date
from public.authorities a
where ac.authority_id = a.id
  and a.slug = 'delhi_cantonment';

-- ============================================================================
-- 6) Authority services — complaint vs approval separation
-- ============================================================================

-- MCD311 complaint service (verified create + track from official feedback page)
insert into public.authority_services (
  authority_id, service_name, slug, description, service_type,
  official_url, filing_url, tracking_url, phone, integration_type,
  channel_id, source_id, last_verified_at, active
)
select a.id,
  'MCD311 complaint',
  'mcd_311_complaint',
  'Citizen complaint via MCD311 (createissue link from mcdonline.nic.in/portal/feedback). Use for reported building concerns in MCD areas — NOT for building-plan applications. My Delhi does not submit.',
  'complaint',
  'https://mcdonline.nic.in/',
  'https://mcd.everythingcivic.com/citizen/createissue?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120',
  'https://mcd.everythingcivic.com/citizen/issuedetail?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120',
  '155305',
  'deep_link',
  (select c.id from public.authority_channels c
   where c.authority_id = a.id and c.channel_type = 'website'
   order by c.last_verified_at desc nulls last limit 1),
  s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'mcd_online'
where a.slug = 'mcd'
  and not exists (
    select 1 from public.authority_services x
    where x.authority_id = a.id and x.slug = 'mcd_311_complaint'
  );

update public.authority_services svc
set service_name = 'MCD311 complaint',
    description = 'Citizen complaint via MCD311 (createissue link from mcdonline.nic.in/portal/feedback). Use for reported building concerns in MCD areas — NOT for building-plan applications. My Delhi does not submit.',
    service_type = 'complaint',
    official_url = 'https://mcdonline.nic.in/',
    filing_url = 'https://mcd.everythingcivic.com/citizen/createissue?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120',
    tracking_url = 'https://mcd.everythingcivic.com/citizen/issuedetail?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120',
    phone = '155305',
    last_verified_at = current_date,
    active = true
from public.authorities a
where svc.authority_id = a.id
  and a.slug = 'mcd'
  and svc.slug in ('mcd_311_complaint', 'mcd_building_contact', 'mcd_civic_complaint');

-- Prefer mcd_311_complaint; keep building_contact as information fallback without filing if civic deep-link wrong context
update public.authority_services svc
set service_name = 'MCD building / civic contact',
    description = 'Helpline 155305, email, MCD311, and mcdonline.nic.in. Prefer mcd_311_complaint for filing. My Delhi does not submit.',
    service_type = 'information',
    filing_url = null,
    tracking_url = null,
    phone = '155305',
    official_url = 'https://mcdonline.nic.in/',
    last_verified_at = current_date,
    active = true
from public.authorities a
where svc.authority_id = a.id and a.slug = 'mcd' and svc.slug = 'mcd_building_contact';

-- MCD Online Building Plan / Town Planning (approval ONLY)
insert into public.authority_services (
  authority_id, service_name, slug, description, service_type,
  official_url, filing_url, tracking_url, phone, integration_type,
  source_id, last_verified_at, active
)
select a.id,
  'MCD Online Building Plan Approval (EODB)',
  'mcd_building_plan_approval',
  'Approval-only: Online Building Plan / Town Planning under Ease of Doing Business (eodb.mcd.gov.in; also tpobps on mcdonline.nic.in). Do NOT use for dangerous-building citizen complaints.',
  'approval',
  'https://eodb.mcd.gov.in/',
  'https://eodb.mcd.gov.in/',
  null,
  null,
  'deep_link',
  s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'mcd_online'
where a.slug = 'mcd'
  and not exists (
    select 1 from public.authority_services x
    where x.authority_id = a.id and x.slug = 'mcd_building_plan_approval'
  );

-- NDMC complaint / EBR via NDMC311 hub
insert into public.authority_services (
  authority_id, service_name, slug, description, service_type,
  official_url, filing_url, tracking_url, phone, integration_type,
  source_id, last_verified_at, active
)
select a.id,
  'NDMC complaint / NDMC 311',
  'ndmc_311_complaint',
  'Official complaints hub (ndmc.gov.in/complaints.aspx). NDMC EBR receives unauthorized-construction concerns via NDMC 311 app, written complaints, and official grievance channels. Phone 1533 / WhatsApp / care@ndmc.gov.in. My Delhi does not submit. Tracking URL not verified.',
  'complaint',
  'https://www.ndmc.gov.in/complaints.aspx',
  'https://www.ndmc.gov.in/complaints.aspx',
  null,
  '1533',
  'deep_link',
  s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'ndmc'
where a.slug = 'ndmc'
  and not exists (
    select 1 from public.authority_services x
    where x.authority_id = a.id and x.slug = 'ndmc_311_complaint'
  );

update public.authority_services svc
set service_name = 'NDMC building / civic contact',
    description = 'Helpline 1533, care@ndmc.gov.in, WhatsApp, ndmc.gov.in. Prefer ndmc_311_complaint for citizen concerns. Jurisdiction is NDMC-area only.',
    service_type = 'information',
    filing_url = null,
    tracking_url = null,
    phone = '1533',
    official_url = 'https://www.ndmc.gov.in/',
    last_verified_at = current_date,
    active = true
from public.authorities a
where svc.authority_id = a.id and a.slug = 'ndmc' and svc.slug = 'ndmc_building_contact';

-- NDMC Online Building Plan Approval (approval ONLY) — linked from NDMC site
insert into public.authority_services (
  authority_id, service_name, slug, description, service_type,
  official_url, filing_url, tracking_url, phone, integration_type,
  source_id, last_verified_at, active
)
select a.id,
  'NDMC Online Building Plan Approval',
  'ndmc_building_plan_approval',
  'Approval-only portal (bap.ndmc.gov.in/bpamsclient/) linked from NDMC Online Services as Online Building Approval. Do NOT use as default complaint channel for dangerous buildings or unauthorized-construction reports.',
  'approval',
  'https://bap.ndmc.gov.in/bpamsclient/',
  'https://bap.ndmc.gov.in/bpamsclient/',
  null,
  null,
  'deep_link',
  s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'ndmc'
where a.slug = 'ndmc'
  and not exists (
    select 1 from public.authority_services x
    where x.authority_id = a.id and x.slug = 'ndmc_building_plan_approval'
  );

-- DDA separate services
insert into public.authority_services (
  authority_id, service_name, slug, description, service_type,
  official_url, filing_url, tracking_url, phone, integration_type,
  source_id, last_verified_at, active
)
select a.id, v.service_name, v.slug, v.description, v.service_type,
  v.official_url, v.filing_url, null, v.phone, 'deep_link',
  s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'dda'
cross join (values
  ('DDA Grievance hub', 'dda_grievance',
   'DDA Grievance page listing STF, Grievance Portal, DDA 311 app, Samasya Nidaan. My Delhi opens only; does not submit.',
   'grievance', 'https://dda.gov.in/grievance', 'https://dda.gov.in/grievance', '1800110332'),
  ('DDA Grievance Portal (DDA 311 web)', 'dda_311_grievance',
   'Grievance Portal linked from dda.gov.in/grievance (dda.everythingcivic.com/login). Separate from Online Building Permit.',
   'grievance', 'https://dda.gov.in/grievance', 'https://dda.everythingcivic.com/login', '1800110332'),
  ('Online Samasya Nidaan Sewa', 'dda_samasya_nidaan',
   'Online Samasya Nidaan Sewa linked from DDA Grievance / Online Public Services.',
   'grievance', 'https://dda.gov.in/grievance', 'https://dda.org.in/sns', '1800110332'),
  ('Special Task Force (STF)', 'dda_stf',
   'STF complaint registration linked from dda.gov.in/grievance and special-task-force pages.',
   'complaint', 'https://dda.gov.in/special-task-force', 'https://stf.dda.org.in/', '1800110332'),
  ('Online Encroachment Complaint', 'dda_encroachment',
   'Online Encroachment Complaint Registration System linked from DDA Online Public Services.',
   'complaint', 'https://dda.gov.in/online-public-services', 'http://ddaservices.dda.org.in/encroach/', '1800110332'),
  ('DDA Online Building Permit', 'dda_building_plan_approval',
   'Approval-only: Online Building Permit linked from DDA Online Public Services. Do NOT use for dangerous-building citizen complaints.',
   'approval', 'https://dda.gov.in/online-public-services', 'https://obps.dda.org.in/BPAMSClient/default.aspx', null)
) as v(service_name, slug, description, service_type, official_url, filing_url, phone)
where a.slug = 'dda'
  and not exists (
    select 1 from public.authority_services x
    where x.authority_id = a.id and x.slug = v.slug
  );

update public.authority_services svc
set service_name = 'DDA contact',
    description = 'Toll-free 1800110332 and dirsagr@dda.org.in. Prefer specific grievance/STF/encroachment services for filing. Online Building Permit is approval-only.',
    service_type = 'information',
    filing_url = null,
    tracking_url = null,
    phone = '1800110332',
    official_url = 'https://dda.gov.in/',
    last_verified_at = current_date,
    active = true
from public.authorities a
where svc.authority_id = a.id and a.slug = 'dda' and svc.slug = 'dda_building_contact';

-- Cantonment contact only
insert into public.authority_services (
  authority_id, service_name, slug, description, service_type,
  official_url, filing_url, tracking_url, phone, integration_type,
  source_id, last_verified_at, active
)
select a.id,
  'Delhi Cantonment Board contact',
  'delhi_cantonment_building_contact',
  'Phones and email from Cantonment public contacts. Website delhi.cantt.gov.in. No verified complaint action_url — do not invent a portal.',
  'information',
  'https://delhi.cantt.gov.in/',
  null,
  null,
  '25693837',
  'phone',
  s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'delhi_cantonment'
where a.slug = 'delhi_cantonment'
  and not exists (
    select 1 from public.authority_services x
    where x.authority_id = a.id and x.slug = 'delhi_cantonment_building_contact'
  );

-- ============================================================================
-- 7) Building routing — needs_confirmation; never all-building → MCD primary
-- ============================================================================

-- Alias fix: never write `join public.authorities on a.slug=...` (missing alias →
-- ERROR 42P01: relation "a" does not exist). Prefer comma / cross join so `a` is explicit.
update public.routing_rules r
set confidence = 'needs_confirmation',
    routing_mode = 'needs_confirmation',
    is_primary = false,
    active = true,
    notes = case a.slug
      when 'mcd' then 'Jurisdiction needs confirmation. MCD is one possible municipal authority for Building concerns in MCD areas — NOT automatic for all Building reports.'
      when 'ndmc' then 'Jurisdiction needs confirmation. NDMC / EBR may apply only in NDMC area (e.g. possible unauthorized construction).'
      when 'dda' then 'Jurisdiction needs confirmation. DDA may apply for some development / building / encroachment matters in DDA areas.'
      when 'delhi_cantonment' then 'Jurisdiction needs confirmation. Delhi Cantonment Board may apply inside Cantonment limits.'
      else r.notes
    end,
    last_verified_at = current_date
from public.issue_categories c,
     public.authorities a
where r.category_id = c.id
  and r.authority_id = a.id
  and c.slug = 'building'
  and a.slug in ('mcd', 'ndmc', 'dda', 'delhi_cantonment')
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
   'Jurisdiction needs confirmation. NDMC / EBR may apply only in NDMC area.'),
  ('dda', 'dda',
   'Jurisdiction needs confirmation. DDA may apply for some development / building / encroachment matters in DDA areas.'),
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

-- Soft-disable any Building rule that still marks MCD (or others) as automatic primary
update public.routing_rules r
set is_primary = false,
    confidence = 'needs_confirmation',
    routing_mode = 'needs_confirmation'
from public.issue_categories c
where r.category_id = c.id
  and c.slug = 'building'
  and r.active = true;

comment on column public.issue_types.emergency_relevant is
  'Building: collapse / trapped / immediate danger types — prioritize emergency contacts before complaint portals.';
