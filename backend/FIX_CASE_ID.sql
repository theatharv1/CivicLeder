-- =============================================================================
-- My Delhi — FIX: column "case_id" does not exist (42703)
--
-- Paste this ENTIRE file into Supabase SQL Editor → Run.
-- Use when APPLY_ALL_CIVIC.sql (or Phase 2) failed because public.reports
-- already existed from a partial run WITHOUT case_id.
--
-- Safe to re-run. Does not drop tables or invent civic seed data.
-- After this succeeds, re-run APPLY_ALL_CIVIC.sql to finish seeds / RLS.
-- =============================================================================

create extension if not exists "pgcrypto";

-- Minimal shells if tables are missing entirely
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.report_evidence (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.report_locations (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.report_authorities (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.official_complaints (
  id uuid primary key default gen_random_uuid()
);

create table if not exists public.case_updates (
  id uuid primary key default gen_random_uuid()
);

-- ---------- reports: every column the app expects (src/lib/reportCase.ts) ----------
alter table public.reports
  add column if not exists case_id text,
  add column if not exists category_slug text,
  add column if not exists issue_type_slug text,
  add column if not exists emergency_result text,
  add column if not exists user_status text default 'draft',
  add column if not exists selected_authority_slug text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create sequence if not exists public.my_delhi_case_seq start 1;

update public.reports
set case_id = 'MD-' || lpad(nextval('public.my_delhi_case_seq')::text, 6, '0')
where case_id is null;

alter table public.reports alter column case_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.reports'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) ilike '%(case_id)%'
  ) and not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'reports'
      and indexdef ilike '%unique%' and indexdef ilike '%(case_id)%'
  ) then
    alter table public.reports add constraint reports_case_id_key unique (case_id);
  end if;
end $$;

create index if not exists reports_case_id_idx on public.reports(case_id);
create index if not exists reports_created_at_idx on public.reports(created_at desc);

create or replace function public.next_my_delhi_case_id()
returns text
language plpgsql
as $$
declare
  n bigint;
begin
  n := nextval('public.my_delhi_case_seq');
  return 'MD-' || lpad(n::text, 6, '0');
end;
$$;

-- ---------- related tables (incomplete prior runs) ----------
alter table public.report_evidence
  add column if not exists report_id uuid,
  add column if not exists draft_key text,
  add column if not exists media_type text,
  add column if not exists storage_path text,
  add column if not exists local_uri text,
  add column if not exists mime_type text,
  add column if not exists file_size_bytes bigint,
  add column if not exists duration_seconds numeric,
  add column if not exists width int,
  add column if not exists height int,
  add column if not exists location_on_media boolean default false,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists sort_order int default 0,
  add column if not exists created_at timestamptz default now();

create index if not exists report_evidence_report_idx on public.report_evidence(report_id);
create index if not exists report_evidence_draft_idx on public.report_evidence(draft_key);

alter table public.report_locations
  add column if not exists report_id uuid,
  add column if not exists draft_key text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists address_text text,
  add column if not exists landmark text,
  add column if not exists accuracy_meters double precision,
  add column if not exists jurisdiction_status text default 'unknown',
  add column if not exists jurisdiction_id uuid,
  add column if not exists add_location_on_photo boolean default true,
  add column if not exists source text default 'user',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create index if not exists report_locations_report_idx on public.report_locations(report_id);

alter table public.report_authorities
  add column if not exists report_id uuid,
  add column if not exists draft_key text,
  add column if not exists authority_id uuid,
  add column if not exists authority_slug text,
  add column if not exists role text default 'suggested',
  add column if not exists confidence text,
  add column if not exists needs_confirmation boolean default true,
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now();

alter table public.official_complaints
  add column if not exists report_id uuid,
  add column if not exists authority_id uuid,
  add column if not exists authority_slug text,
  add column if not exists channel_type text,
  add column if not exists channel_value text,
  add column if not exists official_reference text,
  add column if not exists has_official_reference boolean,
  add column if not exists filed_by_user_at timestamptz,
  add column if not exists user_notes text,
  add column if not exists recorded_by text default 'user',
  add column if not exists created_at timestamptz default now();

alter table public.case_updates
  add column if not exists report_id uuid,
  add column if not exists status text,
  add column if not exists message text,
  add column if not exists recorded_by text default 'user',
  add column if not exists created_at timestamptz default now();

create index if not exists case_updates_report_idx on public.case_updates(report_id);

-- Safe comments (same as end of APPLY_ALL — only after columns exist)
comment on table public.report_evidence is
  'Evidence metadata. Files belong in private Storage bucket report-evidence. My Delhi does not submit to government.';

comment on table public.reports is
  'Internal My Delhi cases (MD-######). Not government complaints. Users file on official channels.';

comment on column public.official_complaints.official_reference is
  'User-entered official reference only. Never invent government complaint IDs.';

-- Quick verify (should return one row with case_id present)
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'reports' and column_name = 'case_id';

select public.next_my_delhi_case_id() as sample_case_id;
