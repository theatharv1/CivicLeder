# Fix: Building SQL errors

For the combined **`emergency_relevant` (42703) + relation `"a"` (42P01)** repair path and exact run order, see **`FIX_SCHEMA_MISMATCH.md`**.

## A) `relation "a" does not exist` (42P01)

### Why

Postgres error:

```text
ERROR: 42P01: relation "a" does not exist
```

This happens when SQL references `a.slug` / `a.id` but the `authorities` table was joined **without** the alias `a`:

```sql
-- WRONG
cross join (values ...) as v(...)
join public.authorities on a.slug = v.auth_slug
```

Postgres treats `a` as a table name → `relation "a" does not exist`.

### Correct form (smallest fix)

```sql
join public.authorities a on a.slug = v.auth_slug
```

Repo migrations now use an even safer **comma / CROSS JOIN** form so the alias cannot be dropped:

```sql
from public.issue_categories c
cross join (values ...) as v(auth_slug, source_slug, notes)
cross join public.authorities a
cross join public.sources s
where a.slug = v.auth_slug
  and s.slug = v.source_slug
```

Updated in:

- `backend/migrations/20260920_building_category_complete.sql`
- `backend/migrations/20260920_authority_registry_phase1.sql`

**Do not** create a table named `a`, drop tables, or delete Building data.

### After the alias fix

1. Paste/run `backend/DIAGNOSTIC_building_routing.sql` (read-only) — confirm Building category, issue types, authorities, routing.
2. Re-run **entire** `backend/migrations/20260920_building_category_complete.sql` (idempotent `ON CONFLICT` / `NOT EXISTS` — safe; does not delete Building rows).
3. Then run `backend/migrations/20260920_construction_category.sql`.

---

## B) Catalog join `name = oid` (42883) — earlier Building fix

`pg_class.relnamespace` is **oid**; `pg_namespace.nspname` is **name**.

```sql
-- WRONG
JOIN pg_namespace nsp ON nsp.nspname = rel.relnamespace

-- CORRECT
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
```

See also `DIAGNOSTIC_authority_services_service_type.sql`.

## Do NOT

- Drop tables or columns
- Delete Fire Safety / DFS / Building data
- Invent complaint / tracking URLs
