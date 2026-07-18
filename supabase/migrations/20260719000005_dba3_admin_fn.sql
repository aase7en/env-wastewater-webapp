-- DBA-3 — admin_run_query + admin_explain PG functions.
--
-- Server-side layer 2 of the DBA Console defense in depth (layer 1 =
-- client-side isStatementAllowed in lib/admin/db-query.ts).
--
-- DESIGN DECISION (a-think): chosen PG function over Deno Edge Function
-- because:
--   - PostgREST auto-exposes RPCs at /rest/v1/rpc/<name> — no deploy step
--   - SECURITY INVOKER + the calling user's authenticated session → RLS
--     policies on underlying tables apply natively (no need to manually
--     SET LOCAL ROLE)
--   - Reuses existing Postgres parser (harder to bypass than regex)
--   - One language (PL/pgSQL), no Deno toolchain to maintain
--
-- Two functions:
--   admin_run_query(sql_text text) RETURNS jsonb
--     - Whitelist re-check server-side (regex — defense layer 2)
--     - Executed via EXECUTE in the caller's RLS context
--     - Returns { rows: [...], rowCount: N }
--   admin_explain(sql_text text) RETURNS jsonb
--     - Same whitelist check
--     - Wraps in EXPLAIN, returns { text, estimatedRows }
--
-- Both are SECURITY INVOKER (default) so they run as the authenticated
-- user — RLS policies apply on every underlying table touched.
--
-- Idempotent: CREATE OR REPLACE.

-- ───────────────────────────────────────────────────────────────────────────
-- 1) admin_run_query — execute whitelisted SQL, return rows as JSONB.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_run_query(sql_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_clean  text;
    v_result jsonb;
    v_count  bigint;
BEGIN
    IF sql_text IS NULL OR btrim(sql_text) = '' THEN
        RAISE EXCEPTION 'SQL ว่างเปล่า' USING ERRCODE = '42000';
    END IF;

    -- Strip comments (block + line) so keyword scan can't be evaded.
    v_clean := regexp_replace(regexp_replace(sql_text, '/\*[\s\S]*?\*/', ' ', 'g'), '--[^\n]*', ' ', 'g');

    -- Whitelist: must start with allowed leading keyword.
    -- NOTE: PostgreSQL POSIX regex does NOT support \s/\b — use [[:space:]]
    -- and (?i) for case-insensitive (or ~* operator). Word boundary
    -- alternative: (|^|[^a-zA-Z]) prefix check.
    IF NOT (v_clean ~* '^[[:space:]]*(SELECT|INSERT[[:space:]]+INTO|UPDATE|DELETE[[:space:]]+FROM|WITH)([^a-zA-Z]|$)') THEN
        RAISE EXCEPTION 'คำสั่งต้องเริ่มด้วย SELECT/INSERT INTO/UPDATE/DELETE FROM/WITH เท่านั้น'
            USING ERRCODE = '42000';
    END IF;

    -- Deny forbidden keywords (word-boundary via [^a-zA-Z] before + after).
    IF v_clean ~* '(^|[^a-zA-Z])(DROP|TRUNCATE|ALTER|GRANT|REVOKE|CREATE|VACUUM|ANALYZE|COPY|CALL)([^a-zA-Z]|$)' THEN
        RAISE EXCEPTION 'คำสั่งต้องห้าม (DROP/TRUNCATE/ALTER/GRANT/REVOKE/CREATE/VACUUM/ANALYZE/COPY/CALL)'
            USING ERRCODE = '42000';
    END IF;

    -- Deny anonymous code blocks + role escalation.
    IF v_clean ~* '(^|[^a-zA-Z])DO([^a-zA-Z]|$).*[$]{2}' OR v_clean ~* '(^|[^a-zA-Z])(SET|RESET)[[:space:]]+ROLE([^a-zA-Z]|$)' THEN
        RAISE EXCEPTION 'คำสั่งต้องห้าม (anonymous DO / SET ROLE)'
            USING ERRCODE = '42000';
    END IF;

    -- Deny stacked queries (any ; after stripping trailing terminator).
    v_clean := regexp_replace(btrim(v_clean), ';\s*$', '');
    IF v_clean LIKE '%;%' THEN
        RAISE EXCEPTION 'ห้ามหลายคำสั่งในครั้งเดียว (stacked queries)'
            USING ERRCODE = '42000';
    END IF;

    -- Execute as caller (SECURITY INVOKER) → RLS applies natively.
    EXECUTE format('WITH q AS (%s) SELECT jsonb_agg(to_jsonb(q)) AS rows FROM q', v_clean)
        INTO v_result;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'rows', COALESCE(v_result, '[]'::jsonb),
        'rowCount', COALESCE(jsonb_array_length(COALESCE(v_result, '[]'::jsonb)), 0)
    );
END;
$$;

COMMENT ON FUNCTION admin_run_query(text) IS
    'DBA-3 (2026-07-17) — DBA Console raw SQL runner. SECURITY INVOKER (RLS applies). Layer 2 whitelist re-check (regex). Returns {rows, rowCount}.';

-- ───────────────────────────────────────────────────────────────────────────
-- 2) admin_explain — EXPLAIN preview for a mutation.
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_explain(sql_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_clean    text;
    v_plan     text;
    v_est      bigint;
BEGIN
    IF sql_text IS NULL OR btrim(sql_text) = '' THEN
        RAISE EXCEPTION 'SQL ว่างเปล่า' USING ERRCODE = '42000';
    END IF;

    v_clean := regexp_replace(regexp_replace(sql_text, '/\*[\s\S]*?\*/', ' ', 'g'), '--[^\n]*', ' ', 'g');

    IF NOT (v_clean ~* '^[[:space:]]*(SELECT|INSERT[[:space:]]+INTO|UPDATE|DELETE[[:space:]]+FROM|WITH)([^a-zA-Z]|$)') THEN
        RAISE EXCEPTION 'EXPLAIN ต้องเริ่มด้วย SELECT/INSERT/UPDATE/DELETE/WITH'
            USING ERRCODE = '42000';
    END IF;

    IF v_clean ~* '(^|[^a-zA-Z])(DROP|TRUNCATE|ALTER|GRANT|REVOKE|CREATE|VACUUM|ANALYZE|COPY|CALL)([^a-zA-Z]|$)' THEN
        RAISE EXCEPTION 'คำสั่งต้องห้าม' USING ERRCODE = '42000';
    END IF;

    -- Build EXPLAIN (no ANALYZE — ANALYZE would actually run the statement).
    EXECUTE format('EXPLAIN (FORMAT TEXT, VERBOSE) %s', v_clean)
        INTO v_plan;

    -- Rough row estimate extraction (best-effort — not all plan shapes have rows=N).
    BEGIN
        EXECUTE format('
            WITH p AS (EXPLAIN (FORMAT JSON) %s)
            SELECT (plan->''Plan''->>''Rows'')::bigint FROM p, jsonb_array_elements(plan) AS plan LIMIT 1',
            v_clean) INTO v_est;
    EXCEPTION WHEN OTHERS THEN v_est := NULL;
    END;

    RETURN jsonb_build_object(
        'text', COALESCE(v_plan, '(no output)'),
        'estimatedRows', v_est
    );
END;
$$;

COMMENT ON FUNCTION admin_explain(text) IS
    'DBA-3 — EXPLAIN preview for mutation safety check. SECURITY INVOKER. Returns {text, estimatedRows}. Does NOT execute the statement.';
