# Report evidence Storage (manual setup)

My Delhi uploads report photos/videos to a **private** Supabase Storage bucket named `report-evidence`.

App path (from `src/lib/reportEvidence.ts`): `{draftKey}/{evidenceId}.{ext}`  
Example: `draft-abc/uuid-123.jpg`

---

## Create the bucket (exact clicks)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → select your project  
2. Left sidebar → **Storage**  
3. Click **New bucket**  
4. **Name:** `report-evidence` (exact spelling, lowercase, hyphen)  
5. **Public bucket:** leave **OFF** (private)  
6. Click **Create bucket**  
7. Do **not** put the service-role key in the mobile app

---

## Storage policies (MVP / anon key)

Until user auth ships, the app uploads with the **anon** key. Add policies so those uploads can succeed.

### Option A — Dashboard UI

1. Storage → click bucket **report-evidence**  
2. Open **Policies** (or **Configuration** → Policies)  
3. **New policy** → create these (names can match below):

| Policy name | Allowed operation | Target roles | WITH CHECK / USING |
|-------------|-------------------|--------------|--------------------|
| `Anon upload report-evidence` | INSERT | `anon`, `authenticated` | `true` |
| `Anon update report-evidence` | UPDATE | `anon`, `authenticated` | `true` (needed for `upsert: true`) |
| `Anon read report-evidence` | SELECT | `anon`, `authenticated` | `true` |

Keep the bucket **private** (no public URL listing). Tighten to `{user_id}/*` when auth lands.

### Option B — SQL Editor (after bucket exists)

```sql
-- Run only after bucket "report-evidence" exists in Dashboard → Storage

insert into storage.buckets (id, name, public)
values ('report-evidence', 'report-evidence', false)
on conflict (id) do update set public = false;

-- Allow anon/authenticated upload (MVP). Tighten when auth ships.
drop policy if exists "Anon upload report-evidence" on storage.objects;
create policy "Anon upload report-evidence"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'report-evidence');

drop policy if exists "Anon update report-evidence" on storage.objects;
create policy "Anon update report-evidence"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'report-evidence')
  with check (bucket_id = 'report-evidence');

drop policy if exists "Anon read report-evidence" on storage.objects;
create policy "Anon read report-evidence"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'report-evidence');
```

**Do not** add a public `SELECT` policy for everyone, and **do not** use the service-role key from the app.

---

## App behaviour

- `uploadEvidenceToStorage` in `src/lib/reportEvidence.ts` uploads to `report-evidence`
- If upload fails (no bucket / no policy), the app keeps the **local URI** in the draft; `storagePath` stays null
- My Delhi never submits files to government portals

## When auth ships

Prefer:

- `INSERT` / `SELECT` / `UPDATE` only under `{user_id}/*`
- No broad anon write
- Still no service-role on the client
