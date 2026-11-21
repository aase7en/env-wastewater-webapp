-- ENV-REPAIR-PREVENT-001 — the ingest-sensor service_role sensor grants
-- (activation-blocking 42501) + the queue-façade anon REVOKE (WO §2 items
-- (1) + (2); claim ENV-REPAIR-PREVENT-001-C1).
--
-- The ledger successor observation (ENV-REPAIR-P4-LEDGER-001, handoff
-- §8.3) recorded "ingest-sensor would hit the audit-trigger 42501 on
-- wastewater.reading" — REFUTED by evidence (WO §0.1 E7/E8: trg_audit_log
-- attaches to 12 tables with wastewater.sensor_reading EXPLICITLY skipped
-- as write-heavy telemetry; no trigger on either sensor table across all
-- migrations; the audit chain is already granted role-level by
-- 20261120000001). The REAL exposure, live-confirmed by the D1 probes
-- (2026-11-21, receipts in docs/ai/handoffs/ENV-REPAIR-PREVENT-001-GLM.md):
-- supabase/functions/ingest-sensor/index.ts runs the DEFAULT-schema
-- service_role client (:36-38) and writes through the public.sensor /
-- public.sensor_reading façades (schema5 20260719000010:42-43,
-- security_invoker=on). Under security_invoker the invoker's privileges on
-- the BASE tables are checked — and service_role held ZERO grants there
-- (live has_table_privilege: select/insert/update all false on both
-- sensor-path tables). The rollback-scoped D1 emulation reproduced the
-- outage verbatim: lookup SELECT via public.sensor → `42501 permission
-- denied for table sensor`; sensor_reading INSERT via the façade →
-- `42501 permission denied for table sensor_reading`; last_seen UPDATE →
-- `42501 permission denied for table sensor` — at owner activation every
-- ingest call fails at the first query, whole batch lost (fail-closed 500,
-- index.ts:55/73). This migration grants the EF's EXACT write verbs only
-- (WO D1-2): SELECT on wastewater.sensor (the :51-54 lookup), INSERT on
-- wastewater.sensor_reading (:72; uuid PK gen_random_uuid() — NO sequence
-- grant), UPDATE on wastewater.sensor (:77-80). Never GRANT ALL, never
-- blanket (WO §3.7). service_role bypasses RLS (BYPASSRLS; the sensor
-- policies are TO authenticated only), so the table grants are the gate.
--
-- The same migration ships the repair-lane ledger's P3-1 hardening: Supabase
-- default privileges leave SELECT on public.v_pending_threshold_alerts
-- attached to anon/authenticated (D1 live census: both true). The recorded
-- design is service-role-only ("No anon/authenticated grant: this façade is
-- the EF's work queue, not a user surface" — 20261120000001 header), and
-- every OTHER public façade's anon/authenticated posture is an intentional
-- user surface (schema5 §F) — ONLY this queue façade is in scope (WO §2
-- item (2), E9). No current data exposure existed (security_invoker chains
-- to wastewater where anon/authenticated hold no grants; anon REST 401
-- 42501 live-verified before AND after — the REVOKE never opens anything).
--
-- Idempotent: re-runnable GRANT/REVOKE statements (mirrors the
-- 20261120000001 house pattern).

-- 1) The exact ingest-sensor sensor-path grant chain (WO D1-2).
grant usage on schema wastewater to service_role;
grant select on wastewater.sensor to service_role;
grant insert on wastewater.sensor_reading to service_role;
grant update on wastewater.sensor to service_role;

-- 2) The queue-façade hardening — service-role-only per the recorded
--    design; ONLY this façade (E9: the other public façades are intentional
--    user surfaces, untouched).
revoke select on public.v_pending_threshold_alerts from anon, authenticated;

notify pgrst, 'reload schema';

-- ROLLBACK (documented per the claim contract):
--   revoke update on wastewater.sensor from service_role;
--   revoke insert on wastewater.sensor_reading from service_role;
--   revoke select on wastewater.sensor from service_role;
--   grant select on public.v_pending_threshold_alerts to anon, authenticated;
--   notify pgrst, 'reload schema';
-- The schema-usage grant and the audit-chain grants (usage on schema core +
-- insert on core.audit_log) predate this migration (20261120000001) and
-- must NOT be rolled back by it.
