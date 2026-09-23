-- My Delhi: Authority Filing Assistant + Case Tracking Companion
-- Run AFTER APPLY_ALL_CIVIC.sql (and FIX_CASE_ID.sql if needed).
-- Seeds ONLY verified official channels. No fake portals / auto-submit APIs.
-- MD-###### remains an INTERNAL My Delhi case id — never an official reference.

-- ========== 1) authority_services ==========
create table if not exists public.authority_services (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid not null references public.authorities(id) on delete cascade,
  service_name text not null,
  slug text not null,
  description text,
  service_type text not null default 'complaint'
    check (service_type in (
      'emergency', 'complaint', 'grievance', 'tracking', 'information', 'other'
    )),
  official_url text,
  filing_url text,
  tracking_url text,
  phone text,
  integration_type text not null default 'deep_link'
    check (integration_type in ('deep_link', 'phone', 'none', 'manual')),
  active boolean not null default true,
  source_id uuid references public.sources(id),
  last_verified_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (authority_id, slug)
);

alter table public.authority_services
  add column if not exists authority_id uuid,
  add column if not exists service_name text,
  add column if not exists slug text,
  add column if not exists description text,
  add column if not exists service_type text,
  add column if not exists official_url text,
  add column if not exists filing_url text,
  add column if not exists tracking_url text,
  add column if not exists phone text,
  add column if not exists integration_type text default 'deep_link',
  add column if not exists active boolean default true,
  add column if not exists source_id uuid,
  add column if not exists last_verified_at date,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create index if not exists authority_services_authority_idx
  on public.authority_services(authority_id);
create index if not exists authority_services_slug_idx
  on public.authority_services(slug);

-- ========== 2) authority_service_fields ==========
create table if not exists public.authority_service_fields (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.authority_services(id) on delete cascade,
  field_key text not null,
  label text not null,
  description text,
  field_type text not null default 'text'
    check (field_type in (
      'text', 'phone', 'address', 'landmark', 'long_text', 'photo', 'other'
    )),
  requiredness text not null default 'recommended'
    check (requiredness in ('required', 'recommended', 'may_be_requested')),
  sort_order int not null default 0,
  source_id uuid references public.sources(id),
  last_verified_at date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (service_id, field_key)
);

alter table public.authority_service_fields
  add column if not exists service_id uuid,
  add column if not exists field_key text,
  add column if not exists label text,
  add column if not exists description text,
  add column if not exists field_type text default 'text',
  add column if not exists requiredness text default 'recommended',
  add column if not exists sort_order int default 0,
  add column if not exists source_id uuid,
  add column if not exists last_verified_at date,
  add column if not exists active boolean default true,
  add column if not exists created_at timestamptz default now();

create index if not exists authority_service_fields_service_idx
  on public.authority_service_fields(service_id);

-- ========== 3) Extend official_complaints ==========
alter table public.official_complaints
  add column if not exists service_id uuid references public.authority_services(id),
  add column if not exists official_submission_url text,
  add column if not exists official_tracking_url text,
  add column if not exists user_confirmed_filed boolean,
  add column if not exists official_filed_on date;

-- channel_type already exists from Phase 2; ensure present
alter table public.official_complaints
  add column if not exists channel_type text;

comment on column public.official_complaints.official_reference is
  'User-entered reference from the authority only. Never equal to My Delhi MD-######.';
comment on column public.official_complaints.user_confirmed_filed is
  'User confirmed they filed on an official channel. My Delhi does not submit complaints.';

-- ========== 4) status_source_type on case_updates / reports ==========
alter table public.case_updates
  add column if not exists status_source_type text default 'user'
    check (status_source_type in ('user', 'official_api', 'official_website'));

alter table public.reports
  add column if not exists status_source_type text default 'user'
    check (status_source_type in ('user', 'official_api', 'official_website'));

comment on column public.case_updates.status_source_type is
  'Who recorded this status. Default user — never claim government API sync unless real.';
comment on column public.reports.status_source_type is
  'Source of user_status. Default user-recorded only.';

-- ========== RLS ==========
alter table public.authority_services enable row level security;
alter table public.authority_service_fields enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'authority_services' and policyname = 'Public read authority_services'
  ) then
    create policy "Public read authority_services"
      on public.authority_services for select using (active = true);
  end if;
  if not exists (
    select 1 from pg_policies
    where tablename = 'authority_service_fields' and policyname = 'Public read authority_service_fields'
  ) then
    create policy "Public read authority_service_fields"
      on public.authority_service_fields for select using (active = true);
  end if;
end $$;

-- ========== SEEDS (verified only) ==========

-- Delhi Fire Service — Emergency (101)
-- Fields from official DFS guidance: https://dfs.delhi.gov.in/dfs/history
-- (Caller’s Name, Telephone Number, Address in Full, Nearest land mark, Nature of emergency)
insert into public.authority_services (
  authority_id, service_name, slug, description, service_type,
  official_url, filing_url, tracking_url, phone, integration_type,
  source_id, last_verified_at
)
select a.id,
  'Fire / rescue emergency (Call 101)',
  'dfs_emergency_101',
  'For active fire, smoke, gas leak, or rescue emergency. Call Delhi Fire Service Control Room 101. My Delhi does not place the call or file on your behalf.',
  'emergency',
  'https://dfs.delhi.gov.in/',
  null,
  null,
  '101',
  'phone',
  s.id,
  current_date
from public.authorities a
join public.sources s on s.slug = 'delhi_fire_service'
where a.slug = 'delhi_fire_service'
  and not exists (
    select 1 from public.authority_services x
    where x.authority_id = a.id and x.slug = 'dfs_emergency_101'
  );

insert into public.authority_service_fields (
  service_id, field_key, label, description, field_type, requiredness, sort_order, source_id, last_verified_at
)
select svc.id, v.field_key, v.label, v.description, v.field_type, v.requiredness, v.sort_order, s.id, current_date
from public.authority_services svc
join public.authorities a on a.id = svc.authority_id and a.slug = 'delhi_fire_service'
join public.sources s on s.slug = 'delhi_fire_service'
cross join (values
  ('caller_name', 'Caller’s name', 'Your name when calling 101', 'text', 'recommended', 1),
  ('telephone_number', 'Telephone number', 'Callback number for Fire Control Room', 'phone', 'recommended', 2),
  ('full_address', 'Address in full', 'Complete address of the emergency', 'address', 'recommended', 3),
  ('nearest_landmark', 'Nearest landmark', 'Nearest landmark / main road', 'landmark', 'recommended', 4),
  ('nature_of_emergency', 'Nature of emergency', 'Briefly describe the emergency', 'long_text', 'recommended', 5)
) as v(field_key, label, description, field_type, requiredness, sort_order)
where svc.slug = 'dfs_emergency_101'
  and not exists (
    select 1 from public.authority_service_fields f
    where f.service_id = svc.id and f.field_key = v.field_key
  );

-- Official DFS Complaint and Grievances page (verified channel URL).
-- My Delhi opens this page only — does not submit on behalf of the citizen.
-- See also migration 20260920_fire_safety_location_dfs_url.sql for filing_url patch.
insert into public.authority_services (
  authority_id, service_name, slug, description, service_type,
  official_url, filing_url, tracking_url, phone, integration_type,
  source_id, last_verified_at
)
select a.id,
  'Complaint and Grievances',
  'dfs_complaint_grievances_info',
  'Official DFS Complaint and Grievances page. My Delhi opens this page only — it does not submit on your behalf.',
  'grievance',
  'https://dfs.delhi.gov.in/dfs/complaint-and-grievances',
  'https://dfs.delhi.gov.in/dfs/complaint-and-grievances',
  null,
  null,
  'deep_link',
  s.id,
  current_date
from public.authorities a
join public.sources s on s.slug = 'delhi_fire_service'
where a.slug = 'delhi_fire_service'
  and not exists (
    select 1 from public.authority_services x
    where x.authority_id = a.id and x.slug = 'dfs_complaint_grievances_info'
  );

-- MCD — civic complaint / MCD311 channel (mcdonline.nic.in)
insert into public.authority_services (
  authority_id, service_name, slug, description, service_type,
  official_url, filing_url, tracking_url, phone, integration_type,
  source_id, last_verified_at
)
select a.id,
  'MCD civic complaint (MCD311 / Online Complaints)',
  'mcd_civic_complaint',
  'Official MCD Online Complaints / grievance channel on mcdonline.nic.in. Also listed: Citizen Call Center 155305 and MCD311 app. Login/OTP/CAPTCHA may be required on the official platform.',
  'complaint',
  'https://mcdonline.nic.in/',
  'https://mcdonline.nic.in/portal/mService',
  null,
  '155305',
  'deep_link',
  s.id,
  current_date
from public.authorities a
join public.sources s on s.slug = 'mcd_online'
where a.slug = 'mcd'
  and not exists (
    select 1 from public.authority_services x
    where x.authority_id = a.id and x.slug = 'mcd_civic_complaint'
  );

-- Recommended fields only (what citizens typically prepare; not inventing MCD required form schema)
insert into public.authority_service_fields (
  service_id, field_key, label, description, field_type, requiredness, sort_order, source_id, last_verified_at
)
select svc.id, v.field_key, v.label, v.description, v.field_type, 'recommended', v.sort_order, s.id, current_date
from public.authority_services svc
join public.authorities a on a.id = svc.authority_id and a.slug = 'mcd'
join public.sources s on s.slug = 'mcd_online'
cross join (values
  ('issue_description', 'Issue description', 'Clear description of the civic concern', 'long_text', 1),
  ('location_address', 'Location / address', 'Where the issue is', 'address', 2),
  ('landmark', 'Landmark', 'Nearby landmark if known', 'landmark', 3),
  ('photos', 'Photos (if available)', 'Photos may help on the official app/portal', 'photo', 4),
  ('contact_phone', 'Your phone number', 'May be requested so the authority can reach you', 'phone', 5)
) as v(field_key, label, description, field_type, sort_order)
where svc.slug = 'mcd_civic_complaint'
  and not exists (
    select 1 from public.authority_service_fields f
    where f.service_id = svc.id and f.field_key = v.field_key
  );

-- DJB — water/sewer complaint (phones verified; tracking_url NULL — track via 1916 + SMS ref)
insert into public.authority_services (
  authority_id, service_name, slug, description, service_type,
  official_url, filing_url, tracking_url, phone, integration_type,
  source_id, last_verified_at
)
select a.id,
  'DJB water / sewer complaint (Call 1916)',
  'djb_water_sewer_complaint',
  'Official DJB Central Control Room / Customer Care. Call toll-free 1916 (also listed: 1800117118). After registering, DJB may send an SMS complaint reference for future tracking by calling 1916. No separate verified water/sewer web tracking URL seeded.',
  'complaint',
  'https://delhijalboard.delhi.gov.in/jalboard/important-phone-numbers-complaints-redressal',
  null,
  null,
  '1916',
  'phone',
  s.id,
  current_date
from public.authorities a
join public.sources s on s.slug = 'delhi_jal_board'
where a.slug = 'delhi_jal_board'
  and not exists (
    select 1 from public.authority_services x
    where x.authority_id = a.id and x.slug = 'djb_water_sewer_complaint'
  );

insert into public.authority_service_fields (
  service_id, field_key, label, description, field_type, requiredness, sort_order, source_id, last_verified_at
)
select svc.id, v.field_key, v.label, v.description, v.field_type, 'recommended', v.sort_order, s.id, current_date
from public.authority_services svc
join public.authorities a on a.id = svc.authority_id and a.slug = 'delhi_jal_board'
join public.sources s on s.slug = 'delhi_jal_board'
cross join (values
  ('issue_description', 'Issue description', 'Water supply, leakage, sewer, or quality concern', 'long_text', 1),
  ('location_address', 'Location / address', 'Where the issue is occurring', 'address', 2),
  ('landmark', 'Landmark', 'Nearby landmark if known', 'landmark', 3),
  ('contact_phone', 'Your phone number', 'Needed to receive SMS complaint reference from DJB', 'phone', 4)
) as v(field_key, label, description, field_type, sort_order)
where svc.slug = 'djb_water_sewer_complaint'
  and not exists (
    select 1 from public.authority_service_fields f
    where f.service_id = svc.id and f.field_key = v.field_key
  );

-- Secondary DJB phone as separate channel note (same service stays primary 1916)
-- Store alternate on description; optional second service for 1800117118
insert into public.authority_services (
  authority_id, service_name, slug, description, service_type,
  official_url, filing_url, tracking_url, phone, integration_type,
  source_id, last_verified_at
)
select a.id,
  'DJB toll-free alternate (1800117118)',
  'djb_tollfree_1800117118',
  'Alternate toll-free number listed in official DJB contact materials alongside 1916.',
  'complaint',
  'https://delhijalboard.delhi.gov.in/jalboard/contact-us',
  null,
  null,
  '1800117118',
  'phone',
  s.id,
  current_date
from public.authorities a
join public.sources s on s.slug = 'delhi_jal_board'
where a.slug = 'delhi_jal_board'
  and not exists (
    select 1 from public.authority_services x
    where x.authority_id = a.id and x.slug = 'djb_tollfree_1800117118'
  );

-- Electricity DISCOMs — helpline complaint services only (NO auto-pick distributor; filing_url null)
insert into public.authority_services (
  authority_id, service_name, slug, description, service_type,
  official_url, filing_url, tracking_url, phone, integration_type,
  source_id, last_verified_at
)
select a.id, v.service_name, v.slug, v.description, 'complaint',
  a.official_website, null, null, v.phone, 'phone', s.id, current_date
from (values
  ('brpl', 'brpl', 'brpl_complaint_helpline',
   'BRPL 24x7 complaint / customer care helpline',
   'Call BRPL toll-free 19123 for no-supply and related complaints. Service area dependent — do not assume BRPL without confirming your distributor.',
   '19123'),
  ('bypl', 'bypl', 'bypl_complaint_helpline',
   'BYPL 24x7 complaint / customer care helpline',
   'Call BYPL toll-free 19122 for no-supply and related complaints. Service area dependent — do not assume BYPL without confirming your distributor.',
   '19122'),
  ('tpddl', 'tpddl', 'tpddl_complaint_helpline',
   'Tata Power-DDL 24x7 Sampark Kendra',
   'Call TPDDL toll-free 19124 (or 1800-208-9124 if 19124 unreachable / calling from outside Delhi per TPDDL touchpoints). Service area dependent.',
   '19124'),
  ('ndmc', 'ndmc', 'ndmc_electricity_helpline',
   'NDMC electricity helpline',
   'NDMC-area electricity helpline listed in prior verified seeds (19121). Confirm you are in NDMC jurisdiction before calling.',
   '19121')
) as v(auth_slug, source_slug, slug, service_name, description, phone)
join public.authorities a on a.slug = v.auth_slug
join public.sources s on s.slug = v.source_slug
where not exists (
  select 1 from public.authority_services x
  where x.authority_id = a.id and x.slug = v.slug
);

insert into public.authority_service_fields (
  service_id, field_key, label, description, field_type, requiredness, sort_order, source_id, last_verified_at
)
select svc.id, v.field_key, v.label, v.description, v.field_type, 'may_be_requested', v.sort_order, svc.source_id, current_date
from public.authority_services svc
join public.authorities a on a.id = svc.authority_id
cross join (values
  ('consumer_account', 'Consumer / CA number', 'May be requested by the helpline if you are a registered consumer', 'text', 1),
  ('issue_description', 'Issue description', 'Outage, exposed wires, streetlight, billing, etc.', 'long_text', 2),
  ('location_address', 'Location / address', 'Where the issue is', 'address', 3),
  ('contact_phone', 'Your phone number', 'Callback number', 'phone', 4)
) as v(field_key, label, description, field_type, sort_order)
where a.slug in ('brpl', 'bypl', 'tpddl', 'ndmc')
  and svc.slug like '%_helpline'
  and not exists (
    select 1 from public.authority_service_fields f
    where f.service_id = svc.id and f.field_key = v.field_key
  );

-- DPCC / PWD — information services only (websites previously seeded; no verified filing portal)
insert into public.authority_services (
  authority_id, service_name, slug, description, service_type,
  official_url, filing_url, tracking_url, phone, integration_type,
  source_id, last_verified_at
)
select a.id,
  'DPCC official website (information)',
  'dpcc_official_website',
  'Official DPCC website. No verified dedicated online complaint filing URL seeded in this migration — open the site and follow official instructions.',
  'information',
  'https://www.dpcc.delhigovt.nic.in/',
  null,
  null,
  null,
  'none',
  s.id,
  current_date
from public.authorities a
join public.sources s on s.slug = 'dpcc'
where a.slug = 'dpcc'
  and not exists (
    select 1 from public.authority_services x
    where x.authority_id = a.id and x.slug = 'dpcc_official_website'
  );

insert into public.authority_services (
  authority_id, service_name, slug, description, service_type,
  official_url, filing_url, tracking_url, phone, integration_type,
  source_id, last_verified_at
)
select a.id,
  'PWD Delhi official website (information)',
  'pwd_official_website',
  'Official PWD Delhi website. Applies to PWD assets only — not all roads. No verified dedicated online complaint filing URL seeded.',
  'information',
  'https://pwd.delhi.gov.in/',
  null,
  null,
  null,
  'none',
  s.id,
  current_date
from public.authorities a
join public.sources s on s.slug = 'pwd_delhi'
where a.slug = 'pwd_delhi'
  and not exists (
    select 1 from public.authority_services x
    where x.authority_id = a.id and x.slug = 'pwd_official_website'
  );
