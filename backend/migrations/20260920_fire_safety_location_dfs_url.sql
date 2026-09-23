-- Fire Safety: distinguish current vs incident location; set verified DFS complaint URL.
-- Safe / idempotent. Apply after 20260920_authority_filing_assistant.sql.

-- ========== report_locations: current vs incident + manual address parts ==========
alter table public.report_locations
  add column if not exists location_kind text,
  add column if not exists location_source text,
  add column if not exists building text,
  add column if not exists street text,
  add column if not exists locality text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists postal text,
  add column if not exists country text,
  add column if not exists location_captured_at timestamptz;

-- Optional check: location_kind / location_source values are app-enforced
-- (current | incident; current_gps | map_selected | manually_entered | photo_metadata | unknown)

comment on column public.report_locations.location_kind is
  'current = device GPS at capture; incident = where the issue happened (may differ)';
comment on column public.report_locations.location_source is
  'current_gps | map_selected | manually_entered | photo_metadata | unknown';

-- ========== DFS Complaint and Grievances — verified official channel URL ==========
-- https://dfs.delhi.gov.in/dfs/complaint-and-grievances
-- Opening this URL does NOT mean My Delhi submitted a complaint.
update public.authority_services
set
  filing_url = 'https://dfs.delhi.gov.in/dfs/complaint-and-grievances',
  official_url = coalesce(
    nullif(trim(official_url), ''),
    'https://dfs.delhi.gov.in/dfs/complaint-and-grievances'
  ),
  service_type = case
    when service_type = 'information' then 'grievance'
    else service_type
  end,
  integration_type = case
    when integration_type = 'none' then 'deep_link'
    else integration_type
  end,
  description = 'Official DFS Complaint and Grievances page. My Delhi opens this page only — it does not submit on your behalf.',
  last_verified_at = current_date
where slug = 'dfs_complaint_grievances_info'
  and (
    filing_url is null
    or filing_url <> 'https://dfs.delhi.gov.in/dfs/complaint-and-grievances'
  );
