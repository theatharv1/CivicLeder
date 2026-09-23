-- Diagnostic: civic repair status (read-only)
-- Paste ALONE into Supabase SQL Editor → Run.
-- Safe: SELECT only. No INSERT / UPDATE / DELETE / DROP / TRUNCATE.
--
-- Use AFTER FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql and before re-running
-- any large Water / Waste / category migration.

-- 1) issue_types columns (look for emergency_relevant)
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'issue_types'
ORDER BY ordinal_position;

-- 2) Does emergency_relevant exist?
SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'issue_types'
    AND column_name = 'emergency_relevant'
) AS emergency_relevant_exists;

-- 3) Target categories present?
SELECT slug, name, active, sort_order
FROM public.issue_categories
WHERE slug IN (
  'building',
  'construction',
  'electricity',
  'water_drainage',
  'waste_garbage',
  'roads_public_spaces',
  'environment',
  'fire_safety'
)
ORDER BY sort_order, slug;

-- 4) Active issue_types count per category
SELECT
  c.slug AS category_slug,
  count(t.id) FILTER (WHERE t.active) AS active_issue_types,
  count(t.id) AS total_issue_types
FROM public.issue_categories c
LEFT JOIN public.issue_types t ON t.category_id = c.id
WHERE c.slug IN (
  'building',
  'construction',
  'electricity',
  'water_drainage',
  'waste_garbage',
  'roads_public_spaces',
  'environment',
  'fire_safety'
)
GROUP BY c.slug
ORDER BY c.slug;

-- 5) Sample authorities (existence / slug check only)
SELECT slug, name, active
FROM public.authorities
WHERE slug IN (
  'mcd',
  'ndmc',
  'dda',
  'delhi_cantonment',
  'delhi_jal_board',
  'irrigation_flood_control',
  'brpl',
  'bypl',
  'tpddl',
  'dpcc',
  'dfs',
  'delhi_forest',
  'environment_dept_delhi',
  'delhi_traffic_police',
  'pwd_delhi'
)
ORDER BY slug;

-- 6) Sanity: no accidental tables named My / property / a
SELECT n.nspname AS schema_name, c.relname AS relation_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'v', 'm')
  AND c.relname IN ('My', 'property', 'a');
