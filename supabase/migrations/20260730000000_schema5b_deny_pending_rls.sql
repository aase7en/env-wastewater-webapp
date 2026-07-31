-- SCHEMA5b: deny pending-role on the 5 reference tables OAUTH-4 missed.
-- Closes the bug-hunt-recon finding (2026-07-30): schema5_rest_exposure.sql
-- created `USING (true)` policies on these tables, and OAUTH-4 only repolicied
-- the 11 transactional tables — so a pending user (signed-up-via-OAuth-but-
-- not-approved) could still reach this reference data via PostgREST.
-- Idempotent. Track Z scope (SQL only). Reuses core.fn_is_staff_or_admin()
-- shipped by OAUTH-4 — no new helper.
--
-- Problem (found 2026-07-30 via scripts/test_oauth4_rls_probe.py RED-first):
--   schema5_rest_exposure.sql:8-17 policy bodies:
--     personnel_read        ... for select to authenticated using (true)
--     attachment_rw         ... for all    to authenticated
--                                  using (true) with check (true)   -- world-writable
--     location_read         ... for select to authenticated using (true)
--     sensor_read           ... for select to authenticated using (true)
--     sensor_reading_read   ... for select to authenticated using (true)
--   `TO authenticated` matches ANY authenticated JWT — including pending. So
--   a pending user with a direct REST call could:
--     - read the staff roster (core.personnel = PHI-adjacent: phone, nickname)
--     - INSERT/UPDATE/DELETE attachment rows (swap a regulation's PDF → phish)
--     - read location + sensor metadata
--   This is the same OAUTH-1-intent gap OAUTH-4 closed for transactional data;
--   these 5 tables just weren't in the OAUTH-4 scope list.
--
-- Fix: mirror the OAUTH-4 repolicy pattern exactly — DROP IF EXISTS, recreate
-- with USING/WITH CHECK gated on core.fn_is_staff_or_admin() (the SECURITY
-- DEFINER helper from OAUTH-4 that avoids the ADR-0008 RLS recursion).
-- `pending` is the only role denied.
--
-- Caller impact = zero (verified during recon): every caller of these 5 tables
-- sits behind <RequireAuth> (staff+admin route gate; pending is bounced to
-- /pending-approval at the frontend already). The helper admits staff, so no
-- legitimate caller breaks. core.personnel / core.location have no live UI
-- callers (lib-only definitions). wastewater.sensor* are read-only from the
-- frontend and written only by the ingest-sensor Edge Function (service-role,
-- which bypasses RLS) — so keeping them SELECT-only is correct.

-- ─── 1) core.personnel — PHI-adjacent staff roster ──────────────────────
DROP POLICY IF EXISTS personnel_read ON core.personnel;
CREATE POLICY personnel_read ON core.personnel
    FOR SELECT TO authenticated
    USING (core.fn_is_staff_or_admin());

-- ─── 2) core.attachment — was world-writable (FOR ALL + WITH CHECK true) ──
-- Stays FOR ALL so legitimate upload/delete (attachments.ts uploadAttachment/
-- deleteAttachment, both behind /attachments = RequireAuth) keep working;
-- both clauses now gated on the helper.
DROP POLICY IF EXISTS attachment_rw ON core.attachment;
CREATE POLICY attachment_rw ON core.attachment
    FOR ALL TO authenticated
    USING (core.fn_is_staff_or_admin())
    WITH CHECK (core.fn_is_staff_or_admin());

-- ─── 3) core.location ────────────────────────────────────────────────────
DROP POLICY IF EXISTS location_read ON core.location;
CREATE POLICY location_read ON core.location
    FOR SELECT TO authenticated
    USING (core.fn_is_staff_or_admin());

-- ─── 4) wastewater.sensor ────────────────────────────────────────────────
DROP POLICY IF EXISTS sensor_read ON wastewater.sensor;
CREATE POLICY sensor_read ON wastewater.sensor
    FOR SELECT TO authenticated
    USING (core.fn_is_staff_or_admin());

-- ─── 5) wastewater.sensor_reading ────────────────────────────────────────
-- INSERTs arrive only from the ingest-sensor Edge Function (service-role,
-- bypasses RLS), so keeping the policy SELECT-only is correct — a frontend
-- INSERT would need its own FOR INSERT policy added separately.
DROP POLICY IF EXISTS sensor_reading_read ON wastewater.sensor_reading;
CREATE POLICY sensor_reading_read ON wastewater.sensor_reading
    FOR SELECT TO authenticated
    USING (core.fn_is_staff_or_admin());
