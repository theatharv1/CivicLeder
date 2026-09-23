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
