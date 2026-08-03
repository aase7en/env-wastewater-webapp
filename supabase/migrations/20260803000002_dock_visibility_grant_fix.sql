-- DOCK-18 — grant on core.role_module_visibility
--
-- The admin visibility toggles could not read OR write: every request failed
-- with "permission denied for table role_module_visibility".
--
-- Why. public.role_module_visibility is declared `security_invoker = on`, so
-- the view runs with the CALLER's privileges against the base table, not the
-- view owner's. 20260803000001 granted on the VIEW but never on
-- core.role_module_visibility itself, so `authenticated` had no privilege on
-- the thing the view actually reads.
--
-- Why it was easy to miss. Every other core table is covered by
-- 20260719000010_schema5_rest_exposure.sql:
--     grant select, insert, update, delete on ALL TABLES IN SCHEMA core ...
-- `ALL TABLES` is a one-shot grant over the tables that existed WHEN IT RAN
-- (2026-07-19). It is not a default privilege, so nothing created afterwards
-- inherits it — and this table was created 2026-08-03.
--
-- RLS is unaffected: role_module_visibility_read_own (own role) and
-- role_module_visibility_admin_all (fn_is_admin) still decide which rows any
-- caller may touch. A grant without RLS would be an exposure; a grant WITH
-- RLS is simply what every other table in this schema already has.

grant select, insert, update, delete
    on core.role_module_visibility
    to authenticated;

-- NOTE for whoever adds the next table to core/wastewater/…: this will happen
-- again. The durable fix is ALTER DEFAULT PRIVILEGES per schema, which changes
-- the posture for every future object and so is a call for the DB owner, not
-- something to slip into a bug-fix migration. Until then, a new table needs
-- its own grant line.

notify pgrst, 'reload schema';
