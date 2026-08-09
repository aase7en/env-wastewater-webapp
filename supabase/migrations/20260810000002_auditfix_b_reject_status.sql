-- AUDITFIX-B — log rejected AI queries (whitelist + PHI filter)
--
-- Closes the P1 "silent AI reject" gap from reports/infra-audit-2026-08.md
-- #3: today both the DBA-3 SQL whitelist reject and the PHI filter block
-- raise exceptions and leave NO trace, so an admin cannot tell anyone is
-- probing forbidden queries.
--
-- Approach: reuse core.ai_query_log (do NOT create a separate table) by
-- adding two columns:
--   status          text NOT NULL DEFAULT 'success'
--                   values in practice: 'success' (default for existing rows
--                   + new success-path inserts), 'rejected_phi' (PHI filter
--                   block in ai-chat.ts), 'rejected_whitelist' (TS or PG
--                   whitelist reject in db-query.ts)
--   reject_reason   text (the user-facing reason string, truncated 4000 by
--                   callers like the existing `question` field)
--
-- Existing rows backfill to 'success' via the DEFAULT (no UPDATE needed).
-- RLS unchanged — the existing _authenticated_insert WITH CHECK
-- (actor = auth.uid()) gate applies equally to reject rows; the browser
-- resolves actor via supabase.auth.getUser() before insert (same pattern
-- the success path uses post-I3). owner_select + admin (FOR SELECT after
-- AUDITFIX-C) cover reads.
--
-- NOTE: this only catches browser-originated rejects (TS chokepoints in
-- ai-chat.ts:123 + db-query.ts:254,269). A non-browser caller (curl to
-- the admin_run_query RPC) would bypass these. Recon confirms no such
-- caller exists today; defense-in-depth for that vector would require
-- INSERT statements inside admin_run_query before each RAISE EXCEPTION
-- (deferred — out of scope for this chunk).
--
-- Idempotent: ADD COLUMN IF NOT EXISTS. Safe to re-run.

ALTER TABLE core.ai_query_log
    ADD COLUMN IF NOT EXISTS status        text NOT NULL DEFAULT 'success',
    ADD COLUMN IF NOT EXISTS reject_reason text;
