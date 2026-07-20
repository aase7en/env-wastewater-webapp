-- OAUTH-1: add 'pending' role + auto-provisioning trigger + audit on app_user.
-- See docs/work-orders/OAUTH-1-schema.md + docs/adr/0007-oauth-pending-approval.md
-- Idempotent. Track Z scope (SQL only).
--
-- Why this chunk exists:
--   * `core.user_role` was (admin, staff) — no "signed up but not yet
--     approved" state. OAuth to all Gmail = immediate staff = PHI risk.
--   * No auto-provisioning: OAuth callback lands a new auth.users row but
--     core.app_user stayed empty → appUser=null → isAuthenticated=false →
--     bounce to /login (same race as AUTH-2).
--   * core.app_user had no audit trigger (SCHEMA-4 gap) — approve/reject
--     actions would not be logged.
--
-- Fix: extend enum, fire a SECURITY DEFINER trigger on auth.users AFTER
-- INSERT to seed core.app_user role='pending', refresh the public.app_user
-- façade view (PG caches `select *` columns at CREATE), and attach the
-- generic audit trigger (core.fn_audit_log from SCHEMA-4) to core.app_user.

-- ─── 1) Extend user_role enum ─────────────────────────────────────────────
ALTER TYPE core.user_role ADD VALUE IF NOT EXISTS 'pending';

-- ─── 2) Provisioning function + trigger on auth.users ────────────────────
-- When a new auth.users row appears (email signup OR OAuth callback), create
-- the matching core.app_user row automatically with role='pending'.
-- SECURITY DEFINER so the trigger can write to core.app_user regardless of
-- caller role (auth.users INSERT is performed by Supabase Auth internals
-- as the postgres owner, not as an authenticated user — the trigger still
-- needs DEFINER so the function body runs with our explicit privilege).
CREATE OR REPLACE FUNCTION core.fn_provision_app_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
BEGIN
    INSERT INTO core.app_user (id, role, display_name)
    VALUES (
        NEW.id,
        'pending',
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            NULL
        )
    )
    ON CONFLICT (id) DO NOTHING;  -- idempotent if re-fired
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_provision_app_user ON auth.users;
CREATE TRIGGER trg_provision_app_user
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION core.fn_provision_app_user();

COMMENT ON FUNCTION core.fn_provision_app_user() IS
    'OAUTH-1 (2026-07-21) — auto-provision core.app_user row when a new auth.users row lands (email signup or OAuth callback). role=pending by default; admin promotes via core.fn_approve_user (OAUTH-3). SECURITY DEFINER so the trigger can write to core.app_user regardless of caller role. Idempotent via ON CONFLICT (id) DO NOTHING.';

-- ─── 3) Recreate public.app_user view (PG caches column list at CREATE) ──
-- Pattern identical to AUTH-2: adding display_name to base table does not
-- propagate to `select *` views without an explicit recreate. We do this
-- defensively here too in case OAUTH-3 later adds an `email` column —
-- the OAUTH-3 migration recreates the view again at that point.
CREATE OR REPLACE VIEW public.app_user
    WITH (security_invoker=on) AS SELECT * FROM core.app_user;

-- ─── 4) Audit trigger on core.app_user (SCHEMA-4 gap) ────────────────────
-- Same pattern as every other transactional table
-- (see 20260719000003_v2_audit_trigger.sql:115+). Captures approve/reject
-- actions (UPDATE role / SET is_active=false) in core.audit_log.
DROP TRIGGER IF EXISTS trg_audit_log ON core.app_user;
CREATE TRIGGER trg_audit_log AFTER INSERT OR UPDATE OR DELETE ON core.app_user
    FOR EACH ROW EXECUTE FUNCTION core.fn_audit_log();

-- ─── 5) RLS on core.app_user (explicit pending-aware re-declaration) ─────
-- SCHEMA-5 declared `app_user_read` for authenticated broadly; we tighten
-- to "own row only" so a pending user cannot enumerate other users (PHI).
-- Admin retains full access for the approval UI in OAUTH-3.
DROP POLICY IF EXISTS app_user_read ON core.app_user;
DROP POLICY IF EXISTS app_user_update_self ON core.app_user;
DROP POLICY IF EXISTS app_user_admin_all ON core.app_user;

-- authenticated: SELECT own row only (pending user resolves appUser; cannot
-- list other users — privacy).
CREATE POLICY app_user_read ON core.app_user
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- admin: full access (read all + update role for approve/reject via OAUTH-3 RPCs)
CREATE POLICY app_user_admin_all ON core.app_user
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM core.app_user WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM core.app_user WHERE id = auth.uid() AND role = 'admin'));
