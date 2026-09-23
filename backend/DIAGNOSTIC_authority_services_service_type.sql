-- Diagnostic: authority_services.service_type CHECK constraints
-- Paste ALONE into Supabase SQL Editor → Run.
-- Safe: SELECT only. Does not alter, drop, or delete anything.
--
-- Correct catalog join: nsp.oid = rel.relnamespace
-- (Wrong: nsp.nspname = rel.relnamespace → ERROR 42883: operator does not exist: name = oid)

SELECT con.conname, pg_get_constraintdef(con.oid) AS def
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
  AND rel.relname = 'authority_services'
  AND con.contype = 'c'
  AND pg_get_constraintdef(con.oid) ILIKE '%service_type%';
