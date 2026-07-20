-- OAUTH-1b: fix infinite recursion in core.app_user admin policy.
--
-- BUG (found 2026-07-21 via authenticated REST probe):
--   OAUTH-1 introduced `app_user_admin_all` policy with
--     USING (EXISTS (SELECT 1 FROM core.app_user WHERE id=auth.uid() AND role='admin'))
--   That subquery re-enters RLS on core.app_user itself → Postgres detects
--   the cycle and raises `42P17 infinite recursion detected in policy
--   for relation "app_user"`. Result: any authenticated SELECT on
--   public.app_user fails with HTTP 500 — including AuthProvider's
--   loadAppUser lookup → isAuthenticated stays false → login bounce.
--   (Same failure mode as AUTH-2, different root cause.)
--
-- FIX: extract the admin check into a SECURITY DEFINER function
-- `core.fn_is_admin()`. SECURITY DEFINER functions run with the owner's
-- privileges (postgres), bypassing RLS, so the lookup does not re-enter
-- the policy. This is the standard Supabase pattern for self-referential
-- role checks (see https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-in-rls
-- — "use SECURITY DEFINER for functions called from RLS that read the
-- same table").
--
-- Idempotent. Track Z scope (SQL only).

-- ─── 1) SECURITY DEFINER admin-check function ────────────────────────────
-- Reads the caller's role from core.app_user, bypassing RLS so the
-- lookup does not re-enter the policy that called it.
CREATE OR REPLACE FUNCTION core.fn_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = core, public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM core.app_user
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

COMMENT ON FUNCTION core.fn_is_admin() IS
    'OAUTH-1b (2026-07-21) — SECURITY DEFINER helper for admin role check. Used inside RLS policies on core.app_user itself to avoid infinite recursion (a policy on app_user cannot subquery app_user without re-entering its own RLS).';

-- ─── 2) Replace the recursive admin policy with one that calls fn_is_admin ─
DROP POLICY IF EXISTS app_user_admin_all ON core.app_user;

CREATE POLICY app_user_admin_all ON core.app_user
    FOR ALL TO authenticated
    USING (core.fn_is_admin())
    WITH CHECK (core.fn_is_admin());

-- app_user_read (own row) is unchanged — it does not recurse.
