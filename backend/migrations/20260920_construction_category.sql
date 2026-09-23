-- My Delhi — Construction category ONLY
-- Prefer AFTER Building COMPLETE (idempotent re-run OK).
-- Also runnable AFTER supabase/FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql even if
-- Building never completed — this file adds emergency_relevant at the TOP.
-- Does NOT delete Building / Fire Safety data.
-- Does NOT invent portals. My Delhi opens official URLs only — never submits.
-- MD-###### remains internal — never an official government reference.
-- NEVER route all Construction → MCD as automatic primary.

create extension if not exists "pgcrypto";

-- ============================================================================
-- 0a) Schema prerequisite — emergency_relevant (additive; safe if Building already added it)
-- ============================================================================
-- Without this, INSERT/COMMENT that list emergency_relevant fail with 42703 when
-- Building COMPLETE was skipped or half-applied.

alter table public.issue_types
  add column if not exists emergency_relevant boolean not null default false;

comment on column public.issue_types.emergency_relevant is
  'When true, prioritize emergency contacts (112/101/102) before complaint portals for this issue type.';

-- ============================================================================
-- 0) Ensure Construction category + sources for Construction authorities
-- ============================================================================

insert into public.issue_categories (slug, name, short_description, sort_order, active)
values (
  'construction',
  'Construction',
  'Construction, demolition or site concern (reported concern — not a legal finding)',
  3,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  sort_order = excluded.sort_order,
  active = true;

insert into public.sources (slug, name, organization, official_url, notes, last_verified_at, active)
values
  ('labour_delhi', 'Labour Department Delhi', 'GNCTD Labour',
   'https://labour.delhi.gov.in/',
   'Shramik Helpline 155214; HQ email labjlc2.delhi@nic.in on labour.delhi.gov.in contact pages.',
   current_date, true),
  ('delhi_traffic_police', 'Delhi Traffic Police', 'Delhi Police',
   'https://traffic.delhipolice.gov.in/',
   'Traffic helpline 1095 / 25844444 — traffic-management context only, not every road obstruction.',
   current_date, true),
  ('pwd_delhi', 'Public Works Department Delhi', 'PWD GNCTD',
   'https://www.pwddelhi.gov.in/',
   'PWD Sewa / helpdesk: toll-free 1908, complaint@pwddelhi.gov.in (verified on pwddelhi.gov.in).',
   current_date, true),
  ('dpcc', 'Delhi Pollution Control Committee', 'DPCC',
   'https://www.dpcc.delhigovt.nic.in/',
   'Green Delhi App/portal greendelhi.nic.in used for pollution complaints (DPCC / Environment).',
   current_date, true),
  ('green_delhi_app', 'Green Delhi App', 'DPCC / Department of Environment and Forests GNCTD',
   'https://greendelhi.nic.in/',
   'Official citizen portal/app for pollution-related complaints (air, dust, noise, etc.).',
   current_date, true),
  ('mcd_online', 'Municipal Corporation of Delhi', 'Municipal Corporation of Delhi',
   'https://mcdonline.nic.in/', 'Reuse Building-verified MCD sources.', current_date, true),
  ('ndmc', 'New Delhi Municipal Council', 'NDMC',
   'https://www.ndmc.gov.in/', 'Reuse Building-verified NDMC sources.', current_date, true),
  ('dda', 'Delhi Development Authority', 'DDA',
   'https://dda.gov.in/', 'Reuse Building-verified DDA sources.', current_date, true),
  ('delhi_fire_service', 'Delhi Fire Service', 'Government of NCT of Delhi',
   'https://dfs.delhi.gov.in/', 'Reuse Fire Control Room 101 — do not duplicate DFS authorities.', current_date, true)
on conflict (slug) do update set
  name = excluded.name,
  official_url = excluded.official_url,
  notes = excluded.notes,
  last_verified_at = excluded.last_verified_at,
  active = true;

-- ============================================================================
-- 1) Construction issue types (citizen-friendly; Possible… / Reported concern)
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
  ('construction_site_safety_concern',
   'Possible site safety concern',
   'Reported concern about overall safety at a construction site — not a legal finding',
   1, false),
  ('construction_dangerous_activity',
   'Possible dangerous activity on site',
   'Reported concern about activity that may put people at risk — call emergency services if anyone is in immediate danger',
   2, true),
  ('construction_falling_material_risk',
   'Possible falling-material risk',
   'Reported concern that material may fall from a site onto a public area',
   3, true),
  ('construction_unsafe_barrier',
   'Possible unsafe barrier or fencing',
   'Reported concern about site fencing / barriers that may not protect the public',
   4, false),
  ('construction_open_excavation',
   'Possible open excavation hazard',
   'Reported concern about an open excavation that may pose collapse or fall risk — emergency if anyone is trapped',
   5, true),
  ('construction_excavation_hazard',
   'Possible excavation collapse risk',
   'Reported concern about excavation walls or trench safety — call 112 if anyone may be trapped',
   6, true),
  ('construction_material_blocking_road',
   'Construction material may be blocking a road',
   'Reported concern that construction material may obstruct a roadway — jurisdiction needs confirmation',
   7, false),
  ('construction_material_blocking_footpath',
   'Construction material may be blocking a footpath',
   'Reported concern that construction material may obstruct a footpath',
   8, false),
  ('construction_public_access_blocked',
   'Possible blocked public access',
   'Reported concern that public access near a site may be blocked',
   9, false),
  ('construction_dust',
   'Possible construction dust concern',
   'Reported concern about dust from a construction site (possible air-quality impact)',
   10, false),
  ('construction_air_pollution',
   'Possible construction air-pollution concern',
   'Reported concern about air pollution linked to construction activity',
   11, false),
  ('construction_c_and_d_waste',
   'Possible C&D / construction waste concern',
   'Reported concern about construction and demolition (C&D) waste handling',
   12, false),
  ('construction_debris_dumping',
   'Possible debris / malba dumping',
   'Reported concern about debris or malba dumping near a construction site',
   13, false),
  ('construction_noise',
   'Possible construction noise concern',
   'Reported concern about noise from construction activity',
   14, false),
  ('construction_fire_risk',
   'Possible fire risk at a construction site',
   'Reported fire-risk concern at a construction site — call 101 / 112 if fire or immediate danger',
   15, true),
  ('construction_water_drainage_impact',
   'Possible water / drainage impact from construction',
   'Reported concern that construction may affect water or drainage — do not auto-assign DJB; confirm jurisdiction',
   16, false),
  ('construction_worker_safety',
   'Possible worker safety concern',
   'Reported concern about worker safety on a construction site — Labour Department may be relevant',
   17, false),
  ('construction_approval_concern',
   'Possible construction approval / permit concern',
   'Reported concern about whether construction has required approvals — not a legal finding; jurisdiction needs confirmation',
   18, false),
  ('construction_plan_deviation_concern',
   'Possible deviation from sanctioned plan',
   'Reported concern that work may differ from an approved plan — not a legal finding',
   19, false),
  ('construction_other',
   'Something else (construction)',
   'Other reported construction-site concern — jurisdiction still needs confirmation',
   20, false)
) as v(slug, name, short_description, sort_order, emergency_relevant)
where c.slug = 'construction'
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
-- 2) Construction emergency assessment + signals
-- ============================================================================

insert into public.emergency_rules
  (category_id, rule_kind, question_key, question_text, condition, emergency_level,
   explanation, sort_order, source_name, source_url, last_verified_at, active)
select c.id, 'assessment_question', v.question_key, v.question_text, 'yes_means_emergency', 'high',
  v.explanation, v.sort_order, 'My Delhi Construction safety guidance', null, current_date, true
from public.issue_categories c
cross join (values
  ('anyone_trapped',
   'Is anyone trapped in an excavation, under material, or unable to get out safely?',
   'People trapped or unable to exit safely need emergency response (112 / 101) before any civic complaint.',
   1),
  ('immediate_danger_people',
   'Is there an immediate danger to workers or the public?',
   'Immediate danger requires emergency services first. Do not enter an active construction site.',
   2),
  ('excavation_collapse_risk',
   'Is there a risk of excavation collapse or falling material right now?',
   'Collapse / falling-material risk: call 112 / 101. Stay clear of the site.',
   3),
  ('fire_or_smoke_now',
   'Is there fire, smoke, or an immediate fire risk on the site right now?',
   'Fire or immediate fire risk: call 101 / 112. Do not enter the site.',
   4),
  ('serious_injury_now',
   'Could the situation cause serious injury right now?',
   'Risk of serious injury right now is an emergency signal.',
   5)
) as v(question_key, question_text, explanation, sort_order)
where c.slug = 'construction'
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
  'Selected issue type is emergency-relevant for Construction',
  'user_selected_yes', 'high',
  'Call 112 / 101 first. Do not enter a construction site. Do not use normal complaint channels before emergency response.',
  t.sort_order, 'My Delhi Construction', current_date, true
from public.issue_categories c
join public.issue_types t on t.category_id = c.id
where c.slug = 'construction'
  and t.emergency_relevant = true
  and t.active = true
  and not exists (
    select 1 from public.emergency_rules r
    where r.category_id = c.id
      and r.issue_type_id = t.id
      and r.rule_kind = 'emergency_signal'
  );

-- ============================================================================
-- 3) Authorities — reuse existing; add Labour + Traffic if missing
-- ============================================================================

insert into public.authorities
  (slug, name, department, government, official_website, emergency_number, short_description,
   source_name, source_url, source_id, last_verified_at, verification_status, active)
select v.slug, v.name, v.department, v.government, v.official_website, v.emergency_number, v.short_description,
  s.name, s.official_url, s.id, current_date, 'verified', true
from (values
  ('labour_delhi', 'Labour Department (Delhi)', 'Labour Department', 'Government of NCT of Delhi',
   'https://labour.delhi.gov.in/', null,
   'May be relevant for reported worker-safety / labour-law concerns on construction sites — needs confirmation.'),
  ('delhi_traffic_police', 'Delhi Traffic Police', 'Delhi Traffic Police', 'Delhi Police',
   'https://traffic.delhipolice.gov.in/', null,
   'May be relevant when construction material affects traffic management — not the default for every road obstruction.')
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
  verification_status = 'verified',
  active = true;

-- Refresh PWD / DPCC website strings to verified current domains (no drop)
update public.authorities
set official_website = 'https://www.pwddelhi.gov.in/',
    short_description = 'May be relevant for PWD-maintained roads / public works near construction — not all roads. Jurisdiction needs confirmation.',
    last_verified_at = current_date,
    verification_status = 'verified'
where slug = 'pwd_delhi';

update public.authorities
set short_description = 'May be relevant for reported construction dust / air / noise pollution concerns — Green Delhi portal. Jurisdiction needs confirmation.',
    last_verified_at = current_date,
    verification_status = 'verified'
where slug = 'dpcc';

-- ============================================================================
-- 4) Channels — verified contacts only
-- ============================================================================

-- Labour: 155214 + labjlc2.delhi@nic.in (labour.delhi.gov.in contact pages)
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, email, whatsapp,
  action_url, tracking_url, instructions,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, v.channel_type, v.label, v.value, v.phone, v.email, null,
  null, null, v.instructions,
  s.name, s.official_url, s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'labour_delhi'
cross join (values
  ('phone', 'Shramik Helpline', '155214', '155214', null::text,
   'Shramik Helpline 155214 listed on labour.delhi.gov.in (Mon–Sat working hours). My Delhi does not submit.'),
  ('email', 'Labour HQ grievance email', 'labjlc2.delhi@nic.in', null, 'labjlc2.delhi@nic.in',
   'labjlc2.delhi@nic.in listed on labour.delhi.gov.in contact / grievance pages. Not a site-inspection booking link.'),
  ('website', 'Labour Department website', 'https://labour.delhi.gov.in/', null, null,
   'Official Labour Department website. Dedicated construction complaint deep-link not verified — action_url left NULL.')
) as v(channel_type, label, value, phone, email, instructions)
where a.slug = 'labour_delhi'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = v.channel_type and c.value = v.value
  );

-- PWD: 1908, complaint@pwddelhi.gov.in, Sewa hub (pwddelhi.gov.in/sewa + SubmitComplaint)
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, email, whatsapp,
  action_url, tracking_url, instructions,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, v.channel_type, v.label, v.value, v.phone, v.email, v.whatsapp,
  v.action_url, null, v.instructions,
  s.name, s.official_url, s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'pwd_delhi'
cross join (values
  ('phone', 'PWD Sewa toll-free', '1908', '1908', null::text, null::text,
   'https://www.pwddelhi.gov.in/sewa',
   'Toll-free 1908 listed on pwddelhi.gov.in Sewa / site chrome. My Delhi does not submit.'),
  ('email', 'PWD complaint email', 'complaint@pwddelhi.gov.in', null, 'complaint@pwddelhi.gov.in', null,
   null,
   'complaint@pwddelhi.gov.in listed on pwddelhi.gov.in Sewa and Help Desk pages.'),
  ('whatsapp', 'PWD Sewa WhatsApp chatbot', '8130188222', null, null, '8130188222',
   null,
   'WhatsApp chatbot 8130188222 listed on pwddelhi.gov.in Sewa page.'),
  ('website', 'PWD Delhi website', 'https://www.pwddelhi.gov.in/', null, null, null,
   'https://www.pwddelhi.gov.in/sewa',
   'Official PWD website. Sewa hub: /sewa. Submit complaint form also at pwdsewa.pwddelhi.gov.in. Tracking deep-link by reference not separately verified — left NULL.')
) as v(channel_type, label, value, phone, email, whatsapp, action_url, instructions)
where a.slug = 'pwd_delhi'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = v.channel_type and c.value = v.value
  );

update public.authority_channels ac
set action_url = 'https://www.pwddelhi.gov.in/sewa',
    phone = coalesce(ac.phone, '1908'),
    email = coalesce(ac.email, 'complaint@pwddelhi.gov.in'),
    instructions = 'PWD Sewa hub (pwddelhi.gov.in/sewa). Helpline 1908 / complaint@pwddelhi.gov.in. My Delhi opens only; does not submit. Tracking URL not verified.',
    last_verified_at = current_date,
    active = true
from public.authorities a
where ac.authority_id = a.id
  and a.slug = 'pwd_delhi'
  and ac.channel_type = 'website';

-- DPCC / Green Delhi (verified portal for pollution complaints)
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, email, whatsapp,
  action_url, tracking_url, instructions,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, v.channel_type, v.label, v.value, null, null, null,
  v.action_url, null, v.instructions,
  s.name, s.official_url, s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'green_delhi_app'
cross join (values
  ('website', 'DPCC / official environment site', 'https://www.dpcc.delhigovt.nic.in/',
   'https://greendelhi.nic.in/',
   'DPCC information site. Pollution complaints: Green Delhi portal greendelhi.nic.in (DPCC / Environment). My Delhi opens only; does not submit.'),
  ('portal', 'Green Delhi App / portal', 'https://greendelhi.nic.in/',
   'https://greendelhi.nic.in/',
   'Official Green Delhi login portal for pollution-related complaints (dust, air, noise, etc.). Tracking is inside the portal after login — no separate public tracking_url seeded.')
) as v(channel_type, label, value, action_url, instructions)
where a.slug = 'dpcc'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = v.channel_type and c.value = v.value
  );

update public.authority_channels ac
set action_url = coalesce(ac.action_url, 'https://greendelhi.nic.in/'),
    instructions = coalesce(ac.instructions,
      'Green Delhi portal (greendelhi.nic.in) for pollution complaints. My Delhi opens only; does not submit.'),
    last_verified_at = current_date,
    active = true
from public.authorities a
where ac.authority_id = a.id
  and a.slug = 'dpcc'
  and ac.channel_type = 'website';

-- Traffic Police: 1095 only (traffic-management context)
insert into public.authority_channels (
  authority_id, channel_type, label, value, phone, email, whatsapp,
  action_url, tracking_url, instructions,
  source_name, source_url, source_id, last_verified_at, active
)
select a.id, v.channel_type, v.label, v.value, v.phone, null, null,
  null, null, v.instructions,
  s.name, s.official_url, s.id, current_date, true
from public.authorities a
join public.sources s on s.slug = 'delhi_traffic_police'
cross join (values
  ('phone', 'Traffic helpline', '1095', '1095',
   'Traffic helpline 1095 listed by Delhi Police / Traffic Police. Use for traffic-management impacts — not every material obstruction. My Delhi does not submit.'),
  ('website', 'Delhi Traffic Police website', 'https://traffic.delhipolice.gov.in/', null,
   'Official Traffic Police site. Dedicated construction-obstruction web form not verified — action_url left NULL.')
) as v(channel_type, label, value, phone, instructions)
where a.slug = 'delhi_traffic_police'
  and not exists (
    select 1 from public.authority_channels c
    where c.authority_id = a.id and c.channel_type = v.channel_type and c.value = v.value
  );

-- ============================================================================
-- 5) Authority services (Construction-relevant; reuse DFS emergency; no invented tracking)
-- ============================================================================

insert into public.authority_services (
  authority_id, service_name, slug, description, service_type,
  official_url, filing_url, tracking_url, phone, integration_type,
  channel_id, source_id, last_verified_at, active
)
select a.id, v.service_name, v.slug, v.description, v.service_type,
  v.official_url, v.filing_url, null, v.phone, v.integration_type,
  (select c.id from public.authority_channels c
   where c.authority_id = a.id and c.channel_type = v.channel_type
   order by c.last_verified_at desc nulls last limit 1),
  s.id, current_date, true
from (values
  ('labour_delhi', 'labour_delhi', 'Labour Shramik Helpline / contact',
   'labour_construction_contact',
   'Call 155214 or email labjlc2.delhi@nic.in for reported worker-safety / labour concerns. My Delhi does not submit.',
   'information', 'https://labour.delhi.gov.in/', null, '155214', 'phone', 'phone'),
  ('pwd_delhi', 'pwd_delhi', 'PWD Sewa complaint',
   'pwd_sewa_complaint',
   'PWD Sewa hub for PWD-related complaints (roads / public works). Confirm the asset is PWD before filing. My Delhi opens only.',
   'complaint', 'https://www.pwddelhi.gov.in/', 'https://www.pwddelhi.gov.in/sewa', '1908', 'deep_link', 'website'),
  ('dpcc', 'green_delhi_app', 'Green Delhi pollution complaint',
   'dpcc_green_delhi_complaint',
   'Green Delhi portal for reported dust / air / noise pollution concerns. My Delhi opens only; does not submit.',
   'complaint', 'https://greendelhi.nic.in/', 'https://greendelhi.nic.in/', null, 'deep_link', 'portal'),
  ('delhi_traffic_police', 'delhi_traffic_police', 'Traffic helpline contact',
   'traffic_helpline_1095',
   'Call 1095 for traffic-management impacts. Not the default for every road obstruction. My Delhi does not submit.',
   'information', 'https://traffic.delhipolice.gov.in/', null, '1095', 'phone', 'phone')
) as v(auth_slug, source_slug, service_name, slug, description, service_type, official_url, filing_url, phone, integration_type, channel_type)
-- Alias required: never `join public.authorities on a.slug=...` (42P01 relation "a").
cross join public.authorities a
cross join public.sources s
where a.slug = v.auth_slug
  and s.slug = v.source_slug
  and not exists (
  select 1 from public.authority_services x
  where x.authority_id = a.id and x.slug = v.slug
);

-- Soft-deactivate information-only PWD website stub if a complaint Sewa service now exists
update public.authority_services svc
set active = false
from public.authorities a
where svc.authority_id = a.id
  and a.slug = 'pwd_delhi'
  and svc.slug = 'pwd_official_website'
  and exists (
    select 1 from public.authority_services x
    where x.authority_id = a.id and x.slug = 'pwd_sewa_complaint' and x.active = true
  );

-- ============================================================================
-- 6) Routing — ALL needs_confirmation / conditional; NEVER Construction → MCD primary
-- ============================================================================

-- Category-level candidates (property / issue context decides later)
insert into public.routing_rules
  (category_id, issue_type_id, authority_id, confidence, routing_mode, is_primary, notes,
   source_name, source_url, source_id, last_verified_at, active)
select c.id, null, a.id, 'needs_confirmation', 'needs_confirmation', false, v.notes,
  s.name, s.official_url, s.id, current_date, true
from public.issue_categories c
cross join (values
  ('mcd', 'mcd_online',
   'Jurisdiction needs confirmation. MCD is one possible municipal authority for some Construction concerns in MCD areas — NOT automatic for all Construction reports.'),
  ('ndmc', 'ndmc',
   'Jurisdiction needs confirmation. NDMC may apply only in NDMC area.'),
  ('dda', 'dda',
   'Jurisdiction needs confirmation. DDA may apply for some development / construction matters in DDA areas.'),
  ('pwd_delhi', 'pwd_delhi',
   'Conditional: PWD may apply when the road / public work is PWD-maintained — needs confirmation.'),
  ('dpcc', 'dpcc',
   'Conditional: DPCC / Green Delhi may apply for dust, air, or noise pollution concerns — needs confirmation.'),
  ('labour_delhi', 'labour_delhi',
   'Conditional: Labour Department may apply for reported worker-safety concerns — needs confirmation.'),
  ('delhi_fire_service', 'delhi_fire_service',
   'Conditional / emergency: Delhi Fire Service (101) for construction fire risk — reuse Fire Safety emergency path; not a civic-complaint default.'),
  ('delhi_traffic_police', 'delhi_traffic_police',
   'Conditional alternative only: traffic management when material affects traffic — not alone for every road obstruction.'),
  ('delhi_jal_board', 'delhi_jal_board',
   'Conditional alternative only for water/drainage impact — do NOT auto-assign DJB; needs confirmation alongside municipal/PWD.')
) as v(auth_slug, source_slug, notes)
cross join public.authorities a
cross join public.sources s
where a.slug = v.auth_slug
  and s.slug = v.source_slug
  and c.slug = 'construction'
  and not exists (
    select 1 from public.routing_rules r
    where r.category_id = c.id
      and r.authority_id = a.id
      and r.issue_type_id is null
  );

-- Issue-type hints (still needs_confirmation; never sole automatic primary)
insert into public.routing_rules
  (category_id, issue_type_id, authority_id, confidence, routing_mode, is_primary, notes,
   source_name, source_url, source_id, last_verified_at, active)
select c.id, t.id, a.id, 'needs_confirmation', 'conditional', false, v.notes,
  s.name, s.official_url, s.id, current_date, true
from public.issue_categories c
join public.issue_types t on t.category_id = c.id
cross join (values
  -- dust / air → DPCC primary-candidate + municipal alternatives
  ('construction_dust', 'dpcc', 'dpcc',
   'Dust concern: DPCC / Green Delhi is a candidate; municipal (MCD/NDMC) may also apply — needs confirmation.'),
  ('construction_dust', 'mcd', 'mcd_online',
   'Dust concern: municipal alternative (MCD areas) — needs confirmation.'),
  ('construction_dust', 'ndmc', 'ndmc',
   'Dust concern: municipal alternative (NDMC area) — needs confirmation.'),
  ('construction_air_pollution', 'dpcc', 'dpcc',
   'Air-pollution concern: DPCC / Green Delhi candidate + municipal alternatives — needs confirmation.'),
  ('construction_air_pollution', 'mcd', 'mcd_online',
   'Air-pollution concern: municipal alternative — needs confirmation.'),
  ('construction_noise', 'dpcc', 'dpcc',
   'Noise concern: Green Delhi / DPCC candidate — needs confirmation.'),
  -- C&D / debris → municipal + env alternative
  ('construction_c_and_d_waste', 'mcd', 'mcd_online',
   'C&D waste: municipal candidate (MCD) + env alternative — needs confirmation.'),
  ('construction_c_and_d_waste', 'ndmc', 'ndmc',
   'C&D waste: municipal candidate (NDMC) — needs confirmation.'),
  ('construction_c_and_d_waste', 'dpcc', 'dpcc',
   'C&D waste: environmental alternative (DPCC / Green Delhi) — needs confirmation.'),
  ('construction_debris_dumping', 'mcd', 'mcd_online',
   'Debris/malba: municipal candidate — needs confirmation.'),
  ('construction_debris_dumping', 'ndmc', 'ndmc',
   'Debris/malba: municipal candidate (NDMC) — needs confirmation.'),
  ('construction_debris_dumping', 'dpcc', 'dpcc',
   'Debris/malba: environmental alternative — needs confirmation.'),
  -- worker safety → Labour + municipal
  ('construction_worker_safety', 'labour_delhi', 'labour_delhi',
   'Worker safety: Labour Department primary-candidate (155214) + municipal alternative — needs confirmation.'),
  ('construction_worker_safety', 'mcd', 'mcd_online',
   'Worker safety: municipal alternative — needs confirmation.'),
  -- material blocking road → municipal + PWD + traffic as alternatives
  ('construction_material_blocking_road', 'mcd', 'mcd_online',
   'Material blocking road: municipal candidate — needs confirmation.'),
  ('construction_material_blocking_road', 'ndmc', 'ndmc',
   'Material blocking road: municipal candidate (NDMC) — needs confirmation.'),
  ('construction_material_blocking_road', 'pwd_delhi', 'pwd_delhi',
   'Material blocking road: PWD alternative if PWD road — needs confirmation.'),
  ('construction_material_blocking_road', 'delhi_traffic_police', 'delhi_traffic_police',
   'Material blocking road: Traffic Police alternative for traffic management — not alone.'),
  ('construction_material_blocking_footpath', 'mcd', 'mcd_online',
   'Footpath obstruction: municipal candidate — needs confirmation.'),
  ('construction_material_blocking_footpath', 'ndmc', 'ndmc',
   'Footpath obstruction: municipal candidate (NDMC) — needs confirmation.'),
  ('construction_material_blocking_footpath', 'pwd_delhi', 'pwd_delhi',
   'Footpath obstruction: PWD alternative if PWD asset — needs confirmation.'),
  -- fire → DFS emergency
  ('construction_fire_risk', 'delhi_fire_service', 'delhi_fire_service',
   'Fire risk: prioritize Call 101 / 112 (DFS emergency path). Civic complaint is secondary.'),
  -- water/drainage → municipal/PWD/DJB as needs_confirmation alternatives (no auto DJB)
  ('construction_water_drainage_impact', 'mcd', 'mcd_online',
   'Water/drainage impact: municipal alternative — do not auto DJB.'),
  ('construction_water_drainage_impact', 'pwd_delhi', 'pwd_delhi',
   'Water/drainage impact: PWD alternative — needs confirmation.'),
  ('construction_water_drainage_impact', 'delhi_jal_board', 'delhi_jal_board',
   'Water/drainage impact: DJB alternative only — needs confirmation; never auto-assigned.'),
  -- approval / plan deviation → like Building (MCD/NDMC/DDA by context)
  ('construction_approval_concern', 'mcd', 'mcd_online',
   'Approval concern: MCD candidate by property context — needs confirmation.'),
  ('construction_approval_concern', 'ndmc', 'ndmc',
   'Approval concern: NDMC candidate by property context — needs confirmation.'),
  ('construction_approval_concern', 'dda', 'dda',
   'Approval concern: DDA candidate by property context — needs confirmation.'),
  ('construction_plan_deviation_concern', 'mcd', 'mcd_online',
   'Plan deviation concern: MCD candidate by property context — needs confirmation.'),
  ('construction_plan_deviation_concern', 'ndmc', 'ndmc',
   'Plan deviation concern: NDMC candidate by property context — needs confirmation.'),
  ('construction_plan_deviation_concern', 'dda', 'dda',
   'Plan deviation concern: DDA candidate by property context — needs confirmation.')
) as v(issue_slug, auth_slug, source_slug, notes)
cross join public.authorities a
cross join public.sources s
where c.slug = 'construction'
  and t.slug = v.issue_slug
  and a.slug = v.auth_slug
  and s.slug = v.source_slug
  and not exists (
    select 1 from public.routing_rules r
    where r.category_id = c.id
      and r.issue_type_id = t.id
      and r.authority_id = a.id
  );

-- Hard rule: no Construction rule may be automatic primary / all→MCD
update public.routing_rules r
set is_primary = false,
    confidence = 'needs_confirmation',
    routing_mode = case
      when r.routing_mode in ('conditional', 'needs_confirmation') then r.routing_mode
      else 'needs_confirmation'
    end
from public.issue_categories c
where r.category_id = c.id
  and c.slug = 'construction'
  and r.active = true;

comment on column public.issue_types.emergency_relevant is
  'Building/Construction: collapse / fire / trapped / excavation hazard types — prioritize emergency contacts before complaint portals.';
