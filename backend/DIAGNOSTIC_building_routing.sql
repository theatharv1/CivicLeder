-- Diagnostic: Building category routing (read-only)
-- Paste ALONE into Supabase SQL Editor → Run.
-- Safe: SELECT only. Does not alter, drop, or delete anything.
--
-- Expected (after successful Building migration):
--   1) building_category_exists → true (1 row, slug = building)
--   2) building_issue_types_count → about 19 active types (complete list)
--   3) building_authorities → 4 rows: mcd, ndmc, dda, delhi_cantonment
--   4) building_routing_rules → ≥4 active category-level rules, all needs_confirmation,
--      none is_primary = true for automatic MCD

-- 1) Building category
select
  exists (
    select 1 from public.issue_categories
    where slug = 'building' and active = true
  ) as building_category_exists,
  (select id from public.issue_categories where slug = 'building' limit 1) as building_category_id;

-- 2) Building issue types count
select count(*) as building_issue_types_count
from public.issue_types t
join public.issue_categories c on c.id = t.category_id
where c.slug = 'building' and t.active = true;

select t.slug, t.name, t.emergency_relevant, t.sort_order
from public.issue_types t
join public.issue_categories c on c.id = t.category_id
where c.slug = 'building' and t.active = true
order by t.sort_order;

-- 3) Building authorities (expected slugs)
select a.slug, a.name, a.active, a.official_website
from public.authorities a
where a.slug in ('mcd', 'ndmc', 'dda', 'delhi_cantonment')
order by a.slug;

-- 4) Building routing rules
select
  c.slug as category,
  a.slug as authority,
  r.confidence,
  r.routing_mode,
  r.is_primary,
  r.active,
  left(r.notes, 120) as notes_preview
from public.routing_rules r
join public.issue_categories c on c.id = r.category_id
join public.authorities a on a.id = r.authority_id
where c.slug = 'building'
  and r.issue_type_id is null
order by a.slug;
