-- DBA-7 helper — atomic run_count + last_run_at increment for saved queries.
-- Called from lib/admin/saved-query.ts:incrementRunCount().
-- SECURITY INVOKER so RLS applies (owner/admin can update own queries).

CREATE OR REPLACE FUNCTION increment_saved_query_run(q_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    UPDATE core.saved_query
    SET run_count = run_count + 1,
        last_run_at = now()
    WHERE id = q_id;
END;
$$;

COMMENT ON FUNCTION increment_saved_query_run(uuid) IS
    'DBA-7 — atomic run_count++ + last_run_at touch for saved queries. SECURITY INVOKER.';
