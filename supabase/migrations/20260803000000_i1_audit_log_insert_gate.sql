-- I1 (2026-08-03 recon): gate audit_log INSERT on actor = auth.uid().
-- Same forgery class as D3 (ai_query_log). Track Z scope (SQL only). Idempotent.
-- See scripts/test_oauth4_rls_probe.py `_probe_audit_log_insert` for the
-- regression guard.
--
-- Problem: audit_log_authenticated_insert was
--   FOR INSERT TO authenticated WITH CHECK (true)
-- Two holes (mirror of the D3 ai_query_log finding):
--   1. Any authenticated user could POST /rest/v1/audit_log directly (bypassing
--      the transactional-table trigger path) and write an arbitrary row.
--   2. The `actor` column is client-supplied on a direct INSERT (the trigger
--      sets it server-side, but a direct REST POST skips the trigger). With
--      WITH CHECK (true) a client could forge actor=<other_user_uid>; that
--      forged row then surfaced in the admin audit viewer via
--      audit_log_admin_all — cross-user read amplification on the
--      compliance-critical audit trail.
--
-- Fix: WITH CHECK (actor = auth.uid()). The client must send its own uid; the
-- trigger path already does this (core.fn_audit_log sets actor = auth.uid()),
-- so tightening the gate does NOT break trigger writes — both sides agree.
--
-- Service-role note: service-role inserts set actor = NULL deliberately
-- (system actions, v2_audit_trigger.sql lines 11-12) but the service role
-- has BYPASSRLS, so this WITH CHECK never applies to those writes.
--
-- Read-side policies (audit_log_authenticated_select_own, audit_log_admin_all)
-- were already correct — untouched.

DROP POLICY IF EXISTS audit_log_authenticated_insert ON core.audit_log;
CREATE POLICY audit_log_authenticated_insert
    ON core.audit_log FOR INSERT TO authenticated
    WITH CHECK (actor = auth.uid());
