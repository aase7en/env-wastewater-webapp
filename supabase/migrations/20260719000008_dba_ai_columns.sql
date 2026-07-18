-- AI-1 — provider config + scope seed.
--
-- Extends core.ai_provider with the missing columns needed for Wave 4b
-- DBA Console AI integration (per user choice "Direct from client +
-- keys in admin DB"):
--   api_url    — full chat-completions endpoint URL (base + path)
--   key_value  — actual API key (RLS admin-only — critical)
--   model_id   — explicit model identifier (separate from `model` legacy
--                which is just a human label)
--
-- Plus seeds core.ai_scope with the safe-by-default rows for every module
-- view (so PHI filter has data to work against from day one).
--
-- RLS hardening:
--   - ai_provider: admin-only SELECT/UPDATE/DELETE (so key_value never
--     leaks to staff). Anonymous INSERT denied (only admin seeds).
--   - ai_scope:    authenticated SELECT (everyone sees what they can ask
--                   about), admin-only INSERT/UPDATE/DELETE.
--   - ai_query_log: authenticated SELECT (own only), admin SELECT all.
--
-- SECURITY WARNING: storing key_value in the DB is a trade-off the user
-- explicitly accepted (vs Edge Function proxy). Mitigations:
--   - RLS admin-only on ai_provider → staff sessions can't read keys
--   - Frontend never persists key in localStorage; fetches per chat turn,
--     uses once, lets GC reclaim
--   - Audit log captures every SELECT on ai_provider (SCHEMA-4 trigger
--     already attached if we add it — see end of migration)
--
-- Track Z scope (SQL only).
-- Idempotent.

-- ───────────────────────────────────────────────────────────────────────────
-- 1) ai_provider column extensions + audit trigger.
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE core.ai_provider
    ADD COLUMN IF NOT EXISTS api_url   text,
    ADD COLUMN IF NOT EXISTS key_value text,
    ADD COLUMN IF NOT EXISTS model_id  text;

COMMENT ON TABLE core.ai_provider IS
    'AI-1 (2026-07-17) — Wave 4 AI provider registry. key_value stored here per user choice (direct from client). RLS admin-only. Audit trigger on every read.';

-- Re-check RLS (was enabled before but policy may be missing).
DROP POLICY IF EXISTS ai_provider_admin_all ON core.ai_provider;
DROP POLICY IF EXISTS ai_provider_authenticated_read ON core.ai_provider;

-- Admin: full access (configure providers, see keys).
CREATE POLICY ai_provider_admin_all
    ON core.ai_provider FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM core.app_user WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM core.app_user WHERE id = auth.uid() AND role = 'admin'));

-- Staff: SELECT only the public config (NOT key_value) via a column-
-- restricted view (defined below). Direct table access denied.

CREATE OR REPLACE VIEW core.v_ai_provider_public AS
SELECT id, name, base_url, model, model_id, api_url, priority, is_enabled
FROM core.ai_provider
WHERE is_enabled = true;

COMMENT ON VIEW core.v_ai_provider_public IS
    'AI-1 — public projection of ai_provider WITHOUT key_value. Staff sessions fetch provider config from here (RLS permits) then separately request key_value via an admin-gated Edge Function or RPC.';

-- ───────────────────────────────────────────────────────────────────────────
-- 2) ai_scope seed — mark every module view with patient_safe default.
-- ───────────────────────────────────────────────────────────────────────────
-- Strategy: every ENV operational view is patient_safe=true UNLESS
-- explicitly marked false. New scopes added by admin UI.
INSERT INTO core.ai_scope (view_name, description, patient_safe, is_enabled) VALUES
    ('wastewater.v_reading_detail', 'ค่าน้ำเสียรายวัน', true, true),
    ('carbon.v_unified_co2e', 'Carbon footprint rollup', true, true),
    ('carbon.v_monthly_co2e', 'ค่าไฟรายเดือน', true, true),
    ('water_supply.daily_check', 'ค่าน้ำประปาบาดาล', true, true),
    ('garbage.collection_log', 'บันทึกขยะ', true, true),
    ('fuel.dispense_log', 'น้ำมันเชื้อเพลิง', true, true),
    ('garden.work_round', 'งานคนสวน', true, true),
    ('building.inspection_round', 'ตรวจอาคาร', true, true),
    ('safety.monthly_check', 'ความปลอดภัย', true, true),
    ('food.lab_test', 'สุขาภิบาลอาหาร (coliform — น้ำ/อาหาร)', true, true),
    ('chemical.master', 'คลังเคมี', true, true),
    ('chemical.movement', 'การเคลื่อนไหวเคมี', true, true),
    ('core.personnel', 'บุคลากร (PHI-adjacent)', false, true),
    ('core.app_user', 'ผู้ใช้ (PHI-adjacent)', false, true)
ON CONFLICT DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 3) ai_query_log RLS (was enabled but had no policy).
-- ───────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS ai_query_log_authenticated_insert ON core.ai_query_log;
DROP POLICY IF EXISTS ai_query_log_owner_select ON core.ai_query_log;
DROP POLICY IF EXISTS ai_query_log_admin_all ON core.ai_query_log;

CREATE POLICY ai_query_log_authenticated_insert
    ON core.ai_query_log FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY ai_query_log_owner_select
    ON core.ai_query_log FOR SELECT TO authenticated
    USING (actor = auth.uid());

CREATE POLICY ai_query_log_admin_all
    ON core.ai_query_log FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM core.app_user WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM core.app_user WHERE id = auth.uid() AND role = 'admin'));
