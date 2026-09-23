# Fix: `relation "property"` / `relation "My"` (42P01)

**Cannot query live Supabase from this workspace.** Apply the steps below in the Supabase SQL Editor yourself.

## What these errors mean

Postgres is treating English words as **table names**:

| Error | Typical cause |
|-------|----------------|
| `relation "property" does not exist` | Fragment containing `property` ran **outside** a string or `--` comment |
| `relation "My" does not exist` | Fragment containing `My Delhi ...` ran **outside** a string or `--` comment |

**Do not** create tables named `property`, `My`, or `a`.

## Disk verification (2026-09-20)

Automated scan of all `backend/**/*.sql` (comments + quoted strings stripped):

- **No bare `My`** outside `--` comments / quoted strings
- **No bare `property`** outside `--` comments / quoted strings
- **Quote / `$$` blocks balanced** on Water, Waste, Roads, Electricity, APPLY_ALL, FIX files
- **`authorities a` aliases present** wherever `a.` is used (missing alias → `relation "a"`)

Files of interest:

| File | Status on disk |
|------|----------------|
| `migrations/20260920_water_drainage_category.sql` | Safe — `property` only in quoted labels / comments |
| `migrations/20260920_waste_garbage_category.sql` | Safe — `My Delhi` only in comments / quoted seeds |
| `migrations/20260920_roads_public_spaces_category.sql` | Safe — idempotent; paste **entire** file from disk |
| `migrations/20260920_environment_category.sql` | Safe — same rules; no bare My/property |
| `FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql` | Exists — minimal `ADD COLUMN IF NOT EXISTS` only |

So a full paste of the **current disk file** should not produce these 42P01 errors.

Live failures almost always mean one of:

1. **Partial selection** — only a VALUES / prose chunk was Run (opening `'` or leading `--` missing).
2. **Stale SQL Editor buffer** — old/broken paste still open; not the file on disk.
3. **Markdown / chat prose** pasted into the SQL Editor (headers like `My Delhi — …` without `--`).

Related prior error: `relation "a"` = `join public.authorities on a.slug=...` missing alias `a`. Disk migrations already use `authorities a`. See `FIX_SCHEMA_MISMATCH.md`.

## What NOT to do

- Do **not** re-run the full ~1000–1500 line Water / Waste / Roads / Environment migration blindly while these errors appear.
- Do **not** DROP / TRUNCATE Building, Construction, Electricity, Water, Waste, Roads, or Fire Safety data.
- Do **not** disable RLS.
- Do **not** insert new category seeds until diagnostics are clean.
- Do **not** invent tables named `My`, `property`, or `a` to “fix” 42P01.

## Exact repair order (Supabase SQL Editor)

1. **New query** → paste entire `FIX_ISSUE_TYPES_EMERGENCY_RELEVANT.sql` → **Run**  
   (restores `issue_types.emergency_relevant` if missing; additive only)
2. **New query** → paste entire `DIAGNOSTIC_issue_types_columns.sql` → **Run**  
   Confirm `emergency_relevant_exists = true`
3. **New query** → paste entire `DIAGNOSTIC_repair_status.sql` → **Run**  
   Note which categories / issue-type counts already exist
4. **Only if** a category still needs finishing: open the migration **from disk**, copy **the entire file**, paste into a **fresh** SQL Editor tab, Run once.  
   - Prefer resume only if diagnostic shows the category incomplete.  
   - Migrations are written idempotent (`ON CONFLICT` / `IF NOT EXISTS`); still avoid blind re-runs while 42P01 persists.
5. If 42P01 `property` / `My` still appears: you are not running the full disk file — discard the editor buffer and re-copy from disk.

## After repair

Follow `APPLY_INSTRUCTIONS.md` for the normal category order (Roads → Environment). Do not invent new civic data in ad-hoc SQL.
