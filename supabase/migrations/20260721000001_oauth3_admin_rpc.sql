-- OAUTH-3: admin approve/reject RPCs + extend provisioning to copy email.
-- See docs/work-orders/OAUTH-3-admin.md + docs/adr/0007-oauth-pending-approval.md
-- Idempotent. Track Z scope (SQL only).
--
-- Why this chunk exists:
--   After OAUTH-1 (pending role + provisioning trigger) and OAUTH-2 (client
--   pending bounce), pending OAuth users land on /pending-approval and stay
--   there. Admin needs a UI to promote or reject them. This migration
--   provides the SECURITY DEFINER RPCs that UI calls.
--
-- Design notes:
--   * core.app_user.email column duplicates auth.users.email because auth
--     schema is not exposed via PostgREST (and we don't want to add a
--     public.auth_users view = PHI risk). Admin UI reads core.app_user only.
--   * RPCs are SECURITY DEFINER so the UPDATE inside bypasses the OAUTH-1b
--     fn_is_admin() RLS guard. Admin check happens inside the RPC body
--     (EXISTS clause) before any UPDATE — fail-closed.
--   * Reject sets is_active=false, NOT delete auth.users. The user can
--     still attempt login but RequireAuth's is_active check (AUTH-2)
--     rejects them. Deletion is a one-way door reserved for the dashboard.

-- ─── 1) Add email column to core.app_user + recreate view ────────────────
ALTER TABLE core.app_user ADD COLUMN IF NOT EXISTS email text;
COMMENT ON COLUMN core.app_user.email IS
    'Duplicate of auth.users.email for admin UI listing. Populated by the provisioning trigger for new users. NULL for users created before OAUTH-3.';

-- ─── 2) Recreate provisioning fn to populate email too ───────────────────
-- (DROP IF EXISTS not needed — CREATE OR REPLACE on the function.)
CREATE OR REPLACE FUNCTION core.fn_provision_app_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
BEGIN
    INSERT INTO core.app_user (id, role, display_name, email)
    VALUES (
        NEW.id,
        'pending',
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            NULL
        ),
        NEW.email
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;
COMMENT ON FUNCTION core.fn_provision_app_user() IS
    'OAUTH-3 (2026-07-21) — same as OAUTH-1 but also copies email from auth.users.email into core.app_user so the admin approval UI can list users without exposing auth schema.';

-- ─── 3) Recreate view (PG caches `select *` column list at CREATE) ──────
CREATE OR REPLACE VIEW public.app_user
    WITH (security_invoker=on) AS SELECT * FROM core.app_user;

-- ─── 4) Backfill email for existing rows ────────────────────────────────
UPDATE core.app_user u
SET email = a.email
FROM auth.users a
WHERE u.id = a.id
  AND u.email IS NULL;

-- ─── 5) Approve / reject RPCs ───────────────────────────────────────────
-- SECURITY DEFINER + admin check inside body. UPDATE bypasses the
-- fn_is_admin() RLS guard because the function runs as the postgres owner.
CREATE OR REPLACE FUNCTION core.fn_approve_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
BEGIN
    IF NOT core.fn_is_admin() THEN
        RAISE EXCEPTION 'permission denied: admin role required' USING ERRCODE = '42501';
    END IF;
    UPDATE core.app_user
    SET role = 'staff'
    WHERE id = p_user_id AND is_active = true;
END;
$$;
COMMENT ON FUNCTION core.fn_approve_user(uuid) IS
    'OAUTH-3 (2026-07-21) — admin promotes a pending user to staff. SECURITY DEFINER + admin role check via fn_is_admin() inside body (fn_is_admin itself bypasses RLS so this does not recurse). Audit log fires via trg_audit_log (OAUTH-1).';

CREATE OR REPLACE FUNCTION core.fn_reject_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
BEGIN
    IF NOT core.fn_is_admin() THEN
        RAISE EXCEPTION 'permission denied: admin role required' USING ERRCODE = '42501';
    END IF;
    UPDATE core.app_user
    SET is_active = false
    WHERE id = p_user_id;
END;
$$;
COMMENT ON FUNCTION core.fn_reject_user(uuid) IS
    'OAUTH-3 (2026-07-21) — admin deactivates a user (is_active=false). Does NOT delete auth.users (one-way door). User can still attempt login but RequireAuth rejects via AUTH-2 is_active check. SECURITY DEFINER + admin check via fn_is_admin().';

GRANT EXECUTE ON FUNCTION core.fn_approve_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION core.fn_reject_user(uuid) TO authenticated;

-- ─── 6) Public-schema wrappers (PostgREST exposes only `public` RPCs) ──
-- PostgREST only resolves /rest/v1/rpc/<name> for functions in the
-- `public` schema. core.* is not in the db-exposed-schemas list. Thin
-- wrappers in public delegate to the core SECURITY DEFINER functions
-- (which carry the actual admin check). Idempotent.
CREATE OR REPLACE FUNCTION public.fn_approve_user(p_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = core, public
AS $$ SELECT core.fn_approve_user(p_user_id) $$;

CREATE OR REPLACE FUNCTION public.fn_reject_user(p_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = core, public
AS $$ SELECT core.fn_reject_user(p_user_id) $$;

GRANT EXECUTE ON FUNCTION public.fn_approve_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_reject_user(uuid) TO authenticated;
