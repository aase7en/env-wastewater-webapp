-- AUTH-2: add core.app_user.display_name column + backfill admin row.
--
-- Root cause (login block ทั้งแอป):
--   AuthProvider.loadAppUser() query ผิด schema 2 จุด —
--     .select("id, role, display_name")   -- display_name ไม่มีใน schema
--     .eq("auth_user_id", userId)         -- auth_user_id ไม่มี; id คือ FK ตรงไป auth.users.id
--   → PostgREST PGRST204 → setAppUser(null) → isAuthenticated=false →
--   RequireAuth bounce /login ทุกครั้ง แม้ session valid.
--
-- Fix:
--   1. Add `display_name text` column (user-approved — ต้องการชื่อจริงแสดงใน
--      sidebar + PDF reporter ไม่ใช่แค่ email fallback).
--   2. AuthProvider fix (separate commit) — `.eq("id", userId)` ตรง PK +
--      `.select("id, role, display_name, is_active")`.
--   3. Backfill existing admin row with email localpart as placeholder
--      (single row in DB today per probe 2026-07-19).
--
-- Idempotent: ALTER TABLE ADD COLUMN IF NOT EXISTS + UPDATE WHERE display_name IS NULL.
-- Track Z scope (SQL only).
-- Reference: WO docs/work-orders/AUTH-2-app-user-query-schema.md

-- ───────────────────────────────────────────────────────────────────────────
-- 1) Add display_name column
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE core.app_user
    ADD COLUMN IF NOT EXISTS display_name text;

COMMENT ON COLUMN core.app_user.display_name IS
    'Human-readable display name for sidebar + PDF reporter (e.g. "นายวิโรจน์ สุขเกษม"). Nullable — UI falls back to auth.users.email.';

-- ───────────────────────────────────────────────────────────────────────────
-- 2) Recreate the public.app_user façade view (SCHEMA-5) so `select *`
--    expands to include display_name.
--
--    PostgreSQL caches a view's column list at CREATE time — adding a
--    column to the base table does NOT propagate to `select *` views
--    automatically. Without this, AuthProvider's `.select("id, role,
--    display_name, is_active")` still hits PGRST204.
-- ───────────────────────────────────────────────────────────────────────────
create or replace view public.app_user
    with (security_invoker=on) as select * from core.app_user;

-- ───────────────────────────────────────────────────────────────────────────
-- 3) Backfill existing rows: derive from auth.users.email localpart
--    when display_name is NULL (single admin row today).
--    Future real rows come from the form/sign-up flow with explicit value.
-- ───────────────────────────────────────────────────────────────────────────
UPDATE core.app_user u
SET display_name = split_part(a.email, '@', 1)
FROM auth.users a
WHERE u.id = a.id
  AND u.display_name IS NULL;
