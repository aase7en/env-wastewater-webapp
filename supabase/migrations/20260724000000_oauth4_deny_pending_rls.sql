-- OAUTH-4: deny pending-role on transactional RLS.
-- See docs/work-orders/OAUTH-4-deny-pending-rls.md + (pending) ADR-0011.
-- Idempotent. Track Z scope (SQL only).
--
-- Problem (found 2026-07-24 while prepping dashboard config runbook):
--   OAUTH-1 added a `pending` role (signed-up-but-not-approved OAuth user),
--   and RequireAuth bounces pending → /pending-approval at the FRONTEND
--   (RequireAuth.tsx:41-42). But the transactional RLS belt still allowed
--   pending through, because every transactional policy was:
--     FOR ALL TO authenticated USING (true) WITH CHECK (true)
--   `TO authenticated` matches ANY authenticated JWT — including pending.
--   So a pending user with a direct REST call (or any future tool using
--   the JWT layer) could read AND write transactional data before admin
--   approval, contradicting OAUTH-1's intent.
--
-- Fix: mirror the `core.fn_is_admin()` SECURITY DEFINER pattern from
-- OAUTH-1b (commit 20260721000002). Add a sibling `core.fn_is_staff_or_admin()`
-- that returns true when the caller's role ∈ {staff, admin}, then rewrite
-- each transactional policy's USING/WITH CHECK from `(true)` → the helper.
-- `pending` is the only role denied.
--
-- Why SECURITY DEFINER (not inline subquery): OAUTH-1b found that a policy
-- subquery on core.app_user re-enters RLS → 42P17 infinite recursion. The
-- helper reads app_user under the owner's privileges, bypassing RLS, so the
-- lookup does not recurse. Same lesson; same fix shape.

-- ─── 1) SECURITY DEFINER staff-or-admin check ────────────────────────────
-- Reads the caller's role from core.app_user, bypassing RLS so the lookup
-- does not re-enter the policy that called it (same recursion-avoidance
-- rationale as core.fn_is_admin).
CREATE OR REPLACE FUNCTION core.fn_is_staff_or_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = core, public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM core.app_user
        WHERE id = auth.uid() AND role IN ('staff', 'admin')
    );
$$;

COMMENT ON FUNCTION core.fn_is_staff_or_admin() IS
    'OAUTH-4 (2026-07-24) — SECURITY DEFINER helper for staff-or-admin role check. Used by every transactional RLS policy so a pending user (signed-up-but-not-approved via OAuth) is denied read+write before admin promotion. Mirrors core.fn_is_admin() from OAUTH-1b to avoid RLS recursion on core.app_user.';

-- ─── 2) Repolicy: deny pending on every transactional table ──────────────
-- Pattern for each table: DROP IF EXISTS, recreate with USING/WITH CHECK
-- gated on core.fn_is_staff_or_admin(). The DROP IF EXISTS keeps the
-- migration idempotent (re-run is a no-op).

-- water_supply.daily_check
DROP POLICY IF EXISTS daily_check_authenticated_rw ON water_supply.daily_check;
CREATE POLICY daily_check_authenticated_rw ON water_supply.daily_check
    FOR ALL TO authenticated
    USING (core.fn_is_staff_or_admin())
    WITH CHECK (core.fn_is_staff_or_admin());

-- garbage.collection_log
DROP POLICY IF EXISTS collection_log_authenticated_rw ON garbage.collection_log;
CREATE POLICY collection_log_authenticated_rw ON garbage.collection_log
    FOR ALL TO authenticated
    USING (core.fn_is_staff_or_admin())
    WITH CHECK (core.fn_is_staff_or_admin());

-- fuel.dispense_log
DROP POLICY IF EXISTS dispense_log_authenticated_rw ON fuel.dispense_log;
CREATE POLICY dispense_log_authenticated_rw ON fuel.dispense_log
    FOR ALL TO authenticated
    USING (core.fn_is_staff_or_admin())
    WITH CHECK (core.fn_is_staff_or_admin());

-- garden.work_round
DROP POLICY IF EXISTS work_round_authenticated_rw ON garden.work_round;
CREATE POLICY work_round_authenticated_rw ON garden.work_round
    FOR ALL TO authenticated
    USING (core.fn_is_staff_or_admin())
    WITH CHECK (core.fn_is_staff_or_admin());

-- building.inspection_round
DROP POLICY IF EXISTS inspection_round_authenticated_rw ON building.inspection_round;
CREATE POLICY inspection_round_authenticated_rw ON building.inspection_round
    FOR ALL TO authenticated
    USING (core.fn_is_staff_or_admin())
    WITH CHECK (core.fn_is_staff_or_admin());

-- safety.monthly_check
DROP POLICY IF EXISTS monthly_check_authenticated_rw ON safety.monthly_check;
CREATE POLICY monthly_check_authenticated_rw ON safety.monthly_check
    FOR ALL TO authenticated
    USING (core.fn_is_staff_or_admin())
    WITH CHECK (core.fn_is_staff_or_admin());

-- food.lab_test
DROP POLICY IF EXISTS lab_test_authenticated_rw ON food.lab_test;
CREATE POLICY lab_test_authenticated_rw ON food.lab_test
    FOR ALL TO authenticated
    USING (core.fn_is_staff_or_admin())
    WITH CHECK (core.fn_is_staff_or_admin());

-- chemical.movement
DROP POLICY IF EXISTS movement_authenticated_rw ON chemical.movement;
CREATE POLICY movement_authenticated_rw ON chemical.movement
    FOR ALL TO authenticated
    USING (core.fn_is_staff_or_admin())
    WITH CHECK (core.fn_is_staff_or_admin());

-- chemical.master
DROP POLICY IF EXISTS master_authenticated_rw ON chemical.master;
CREATE POLICY master_authenticated_rw ON chemical.master
    FOR ALL TO authenticated
    USING (core.fn_is_staff_or_admin())
    WITH CHECK (core.fn_is_staff_or_admin());

-- wastewater.threshold_alert
DROP POLICY IF EXISTS threshold_alert_authenticated_rw ON wastewater.threshold_alert;
CREATE POLICY threshold_alert_authenticated_rw ON wastewater.threshold_alert
    FOR ALL TO authenticated
    USING (core.fn_is_staff_or_admin())
    WITH CHECK (core.fn_is_staff_or_admin());

-- core.regulation
DROP POLICY IF EXISTS regulation_authenticated_rw ON core.regulation;
CREATE POLICY regulation_authenticated_rw ON core.regulation
    FOR ALL TO authenticated
    USING (core.fn_is_staff_or_admin())
    WITH CHECK (core.fn_is_staff_or_admin());

-- NOTE: core.ai_query_log (INSERT-only telemetry-style, no PHI) is left
-- open to authenticated on purpose — anonymous logging use case, out of
-- scope for the pending-deny tightening. core.app_user / core.audit_log
-- are already role-scoped by OAUTH-1 / SCHEMA-5; not touched here.
