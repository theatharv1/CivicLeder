-- Diagnostic: issue_types columns (read-only)
-- Paste ALONE into Supabase SQL Editor → Run.
-- Safe: SELECT only. Does not alter, drop, or delete anything.
--
-- Use before/after FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql to confirm
-- emergency_relevant exists.

-- 1) All columns on public.issue_types
SELECT
  column_name,
  data_type,
  udt_name,
  column_default,
  is_nullable,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'issue_types'
ORDER BY ordinal_position;

-- 2) Presence check for emergency_relevant (expect 1 row after FIX)
SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'issue_types'
    AND column_name = 'emergency_relevant'
) AS emergency_relevant_exists;
