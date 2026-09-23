# Fix: Schema / script mismatch (`emergency_relevant` + relation `"a"`)

## A) `column "emergency_relevant" of relation "issue_types" does not exist` (42703)

### Exact cause

- Base schema (`APPLY_ALL_CIVIC` / Phase 1) creates `issue_types` **without** `emergency_relevant`.
- Building COMPLETE was the first migration to `ADD COLUMN emergency_relevant`.
- Construction INSERT / `COMMENT ON COLUMN` / diagnostic `SELECT t.emergency_relevant` all **assume** the column already exists.
- Live DB never received the ALTER (Building skipped, half-applied, or Construction run alone) → INSERT/COMMENT/SELECT fail with **42703**.

### Decision (keep the column)

- Architecture: Building intentionally adds `issue_types.emergency_relevant` as a **fast flag** (collapse / trapped / fire-risk types).
- Not a duplicate of `emergency_rules` — rules drive the questionnaire; the flag marks which issue types are emergency-relevant for seeds / signals.
- App TS currently selects `slug, name, short_description, sort_order` only and loads questions from `emergency_rules` — but SQL seeds + diagnostics still need the column. **Keep and add safely** (do not strip from Construction/Building seeds).

### Fix (additive only)

1. `DIAGNOSTIC_issue_types_columns.sql` — confirm column missing
2. `FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql` — `ADD COLUMN IF NOT EXISTS ... DEFAULT false`
3. Re-run diagnostic — `emergency_relevant_exists = true`
4. Then Building (if needed) → Construction

**Do not** drop/recreate `issue_types` or delete data.

---

## B) `relation "a" does not exist` (42P01)

### Exact cause

SQL referenced `a.slug` / `a.id` while joining `public.authorities` **without** alias `a`:

```sql
-- WRONG (Postgres looks for a table named "a")
join public.authorities on a.slug = v.auth_slug
```

### Repo status

Disk migrations already use correct forms:

```sql
join public.authorities a on a.slug = v.auth_slug
-- or
cross join public.authorities a
```

If you still see 42P01, you are almost certainly running an **old SQL Editor buffer**. Re-copy the file **from disk**.

**Do not** create a table named `a`.

Updated / verified in:

- `migrations/20260920_building_category_complete.sql`
- `migrations/20260920_authority_registry_phase1.sql`
- `migrations/20260920_construction_category.sql`

See also `FIX_BUILDING_SQL_CATALOG_JOIN.md` (catalog `name=oid` + alias history).

---

## Exact run order (schema repair → Construction)

1. `DIAGNOSTIC_issue_types_columns.sql`
2. `FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql`
3. `DIAGNOSTIC_issue_types_columns.sql` again (confirm column)
4. Re-run `migrations/20260920_building_category_complete.sql` from disk (idempotent) **or skip** if Building data already OK
5. `DIAGNOSTIC_building_routing.sql`
6. `migrations/20260920_construction_category.sql` (also adds column at top if FIX was skipped)
7. Optional Construction verification SELECTs (see `APPLY_INSTRUCTIONS.md`)

Construction is safe after the FIX even if Building never completed: it opens with `ADD COLUMN IF NOT EXISTS emergency_relevant`.

Electricity / Water / Waste migrations also `ADD COLUMN IF NOT EXISTS emergency_relevant` at the top, but still run `FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql` first if you already hit 42703 — then use `DIAGNOSTIC_repair_status.sql` before any large re-paste.

For `relation "property"` / `relation "My"` (plain English parsed as SQL), see `FIX_SQL_PROPERTY_AND_MY_ERRORS.md`.
