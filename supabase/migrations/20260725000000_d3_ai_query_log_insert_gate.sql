-- D3 (Opus review 2026-07-25): gate ai_query_log INSERT on actor = auth.uid().
-- See docs/handoff/dispatch-prompts-opus5-fable5.md §"STEP 1 — RESULT" defect D3.
-- Idempotent. Track Z scope (SQL only).
--
-- Problem: ai_query_log_authenticated_insert was
--   FOR INSERT TO authenticated WITH CHECK (true)
-- Two holes:
--   1. Any authenticated user — including 'pending' (signed-up-but-not-approved)
--      — could write a log row before admin approval. (Same class of gap OAUTH-4
--      closed on the transactional tables.)
--   2. The `actor` column has no default and was unconstrained, so a client
--      could INSERT with actor=<other_user_uid>, then that victim's
--      owner_select policy (USING actor = auth.uid()) would surface the
--      forged row — cross-user read amplification.
--
-- Fix: WITH CHECK (actor = auth.uid()). The client must send actor = its own
-- uid (the frontend already does; this is a server-side belt). pending users
-- are still allowed to log (it's telemetry, not PHI) but can only ever log
-- their own actions — no spoofing. We intentionally do NOT tighten this to
-- staff/admin (unlike OAUTH-4) because ai_query_log is INSERT-only telemetry
-- and we want to observe what pending users try, not silently drop it.
--
-- Read-side policies (owner_select, admin_all) were already correct — untouched.

DROP POLICY IF EXISTS ai_query_log_authenticated_insert ON core.ai_query_log;
CREATE POLICY ai_query_log_authenticated_insert
    ON core.ai_query_log FOR INSERT TO authenticated
    WITH CHECK (actor = auth.uid());
