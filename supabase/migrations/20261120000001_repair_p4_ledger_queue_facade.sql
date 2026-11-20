-- ENV-REPAIR-P4-LEDGER-001 — the P17 queue-view REST façade (WO §2 item (a)).
--
-- WO D1 live probe (2026-11-20, read-only; verbatim receipts in the lane
-- handoff): the notify-threshold EF builds a DEFAULT-schema supabase-js
-- client (Accept-Profile: public) and reads
-- .from("v_pending_threshold_alerts") → PostgREST 404 PGRST205
-- "Could not find the table 'public.v_pending_threshold_alerts' in the
-- schema cache". The queue view lives in wastewater (E1:
-- 20260718000001_p17_threshold_alerts.sql:62) and no public façade ever
-- existed for it (E6). The schema-scoped-client alternative is LIVE-RULED
-- OUT: Accept-Profile: wastewater → 406 PGRST106 "Only the following
-- schemas are exposed: public, graphql_public". This migration therefore
-- ships the ONE additive public façade (the schema5/P1.7 house precedent),
-- preserving the EF's default-schema client.
--
-- The mark path rides the existing public.threshold_alert façade
-- (20260719000010_schema5_rest_exposure.sql). D1 also proved service_role
-- held ZERO wastewater grants (has_schema_privilege usage=false;
-- select/update on wastewater.threshold_alert=false), so under
-- security_invoker the façade UPDATE would fail 42501 — this migration
-- grants the exact service_role chain both EF paths need. No anon /
-- authenticated grant: this façade is the EF's work queue, not a user
-- surface (the P4.4 P3-2 posture is kept; grants mirror the house
-- service_role default-privilege shape in public).
--
-- Idempotent: CREATE OR REPLACE VIEW + re-runnable GRANTs.

-- 1) The queue façade — security_invoker=on per the schema5 CRUD-façade
--    house convention (privileges checked as the invoker; service_role
--    bypasses RLS; the grants below are the gate). select * snapshots the
--    queue view's 7 pinned columns (id, reading_id, field, message,
--    created_at, reading_date, reporter).
create or replace view public.v_pending_threshold_alerts
  with (security_invoker = on) as
select * from wastewater.v_pending_threshold_alerts;

-- 2) The exact service_role grant chain (queue read + mark path).
grant usage on schema wastewater to service_role;
grant select on wastewater.v_pending_threshold_alerts to service_role;
grant select, update on wastewater.threshold_alert to service_role;
grant select on public.v_pending_threshold_alerts to service_role;

-- 3) The audit chain the mark path fires live (D3 emulation discovery —
--    the rollback-scoped service_role UPDATE probe failed 42501
--    "permission denied for schema core"): wastewater.threshold_alert
--    carries trg_audit_log → core.fn_audit_log (SECURITY INVOKER), which
--    INSERTs into core.audit_log AS THE INVOKER. service_role had no core
--    grants, so every mark UPDATE — on any audited table — would fail,
--    leaving rows queued forever. Grant the exact write path only: usage
--    on core + INSERT on core.audit_log (no read/update/delete on audit
--    history; actor column records NULL for service-role by the trigger's
--    own design).
grant usage on schema core to service_role;
grant insert on core.audit_log to service_role;

notify pgrst, 'reload schema';
