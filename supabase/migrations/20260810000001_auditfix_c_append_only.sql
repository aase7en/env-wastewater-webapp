-- AUDITFIX-C — make audit_log + ai_query_log append-only (tamper-evidence)
--
-- Closes the P2 "log tampering" gap from reports/infra-audit-2026-08.md.
-- Recon confirmed zero UPDATE/DELETE callers exist today (AuditLogPage is
-- read-only display; audit-log.ts uses .select() only; no edge function
-- touches either table), so tightening the admin policy closes the tamper
-- hole with zero behavior change.
--
-- What changes:
--   audit_log_admin_all        FOR ALL -> FOR SELECT  (admin reads all rows)
--   ai_query_log_admin_all     FOR ALL -> FOR SELECT
--
-- What is NOT affected:
--   * The separate _authenticated_insert policy still permits INSERT
--     WITH CHECK (actor = auth.uid()) — server-side trigger inserts with
--     actor = auth.uid() pass; service_role inserts with actor = NULL
--     bypass RLS entirely (BYPASSRLS).
--   * The _owner_select policy (user reads own rows) is unchanged.
--   * admin *reads* (AuditLogPage render) are unchanged — SELECT is
--     preserved in both policies.
--
-- Why not HMAC chain? The audit doc weighed this: pgcrypto is available,
-- but a hash chain would complicate the trigger (capture prior row's hash,
-- circular reference hazard) for a threat model that has no compliance
-- mandate. The policy-only change is the right-sized fix. HMAC remains a
-- future option if a compliance regime demands it.
--
-- Idempotent: DROP POLICY IF EXISTS + CREATE. Safe to re-run.

-- core.audit_log — admin policy: append-only (was FOR ALL)
DROP POLICY IF EXISTS audit_log_admin_all ON core.audit_log;
CREATE POLICY audit_log_admin_all
    ON core.audit_log
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM core.app_user
                   WHERE id = auth.uid() AND role = 'admin'));

-- core.ai_query_log — admin policy: append-only (was FOR ALL)
DROP POLICY IF EXISTS ai_query_log_admin_all ON core.ai_query_log;
CREATE POLICY ai_query_log_admin_all
    ON core.ai_query_log
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM core.app_user
                   WHERE id = auth.uid() AND role = 'admin'));
