-- AUDITFIX-A — add missing audit triggers flagged by infra-audit-2026-08
--
-- Two sensitive admin tables had NO audit trigger despite one of them carrying
-- a code comment claiming coverage:
--   * core.ai_provider  (stores `key_value` = API keys)
--       — 20260719000008_dba_ai_columns.sql:26-27 falsely claimed "Audit log
--         captures every SELECT on ai_provider". No CREATE TRIGGER was ever
--         issued, AND the fn_audit_log() helper only fires on
--         INSERT/UPDATE/DELETE — it cannot audit SELECTs at all. The comment
--         was wrong on two counts.
--   * core.attachment   (regulation PDF upload/delete — phish vector)
--       — Created in the archived FastAPI era (not in any tracked migration
--         here); the live schema is `id uuid PK, entity_type, entity_id,
--         file_path, kind, uploaded_by, created_at`.
--
-- This migration retro-fits both with the standard `trg_audit_log` trigger
-- that every other transactional table already uses (pattern copied verbatim
-- from 20260719000003_v2_audit_trigger.sql:116-118). The trigger captures
-- INSERT/UPDATE/DELETE only — for read-audit of `key_value` you'd need a
-- separate SECURITY DEFINER RPC wrapper, which is out of scope here.
--
-- Idempotent: DROP TRIGGER IF EXISTS + CREATE. Safe to re-run.
-- Affects only the audit trail; no app query changes.

-- core.ai_provider (was: no trigger; comment lied about SELECT audit)
DROP TRIGGER IF EXISTS trg_audit_log ON core.ai_provider;
CREATE TRIGGER trg_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON core.ai_provider
    FOR EACH ROW EXECUTE FUNCTION core.fn_audit_log();

-- core.attachment (was: no trigger; PDF swap was untracked)
DROP TRIGGER IF EXISTS trg_audit_log ON core.attachment;
CREATE TRIGGER trg_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON core.attachment
    FOR EACH ROW EXECUTE FUNCTION core.fn_audit_log();
