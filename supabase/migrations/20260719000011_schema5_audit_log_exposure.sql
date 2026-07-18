-- SCHEMA-5 addendum: expose core.audit_log via public façade view.
--
-- SCHEMA-5 (commit 4c60805) added 28 façade views + 4 report views but
-- skipped `core.audit_log` — the audit log viewer (P4 idea) needs REST
-- access to be useful. Without this view, /rest/v1/audit_log returns 404
-- (PGRST205) just like the original SCHEMA-5 P0.
--
-- RLS on core.audit_log is admin-only-read (policy `audit_log_admin_only`
-- from migration 20260719000003_v2_audit_trigger.sql) — security_invoker=on
-- means this view is also admin-gated automatically. No new policy needed.

create view public.audit_log with (security_invoker=on) as select * from core.audit_log;
grant select on public.audit_log to authenticated;

notify pgrst, 'reload schema';
