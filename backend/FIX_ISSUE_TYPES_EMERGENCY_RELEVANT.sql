-- My Delhi — FIX: issue_types.emergency_relevant (additive only)
-- Run FIRST when you see:
--   ERROR 42703: column "emergency_relevant" of relation "issue_types" does not exist
--
-- Idempotent. Safe to re-run.
-- Does NOT drop tables, delete data, invent portals, or seed rows.
-- Existing rows get DEFAULT false. Category migrations set true where needed.
--
-- After this file: run DIAGNOSTIC_issue_types_columns.sql or DIAGNOSTIC_repair_status.sql

ALTER TABLE public.issue_types
  ADD COLUMN IF NOT EXISTS emergency_relevant boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.issue_types.emergency_relevant IS
  'When true, prioritize emergency contacts (112/101/102) before complaint portals for this issue type.';
