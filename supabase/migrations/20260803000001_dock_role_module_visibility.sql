-- DOCK — role → module visibility (admin-configurable).
-- See docs/work-orders/DOCK-role-module-visibility.md.
-- Track Z scope (SQL only). Idempotent.
--
-- Goal: an admin decides which modules (dock icons) each role can SEE. This
-- is presentation only — it is NOT the security boundary. Every admin route
-- keeps its RequireAuth requireAdmin guard, and every table keeps its RLS,
-- regardless of what this table says. A user who knows the URL still gets
-- the existing behaviour. This table only controls what the dock OFFERS.
--
-- Shape (per WO): one row per (role, module_key), defaulting to visible so
-- adding a route does not silently hide it. module_key is the NAV `to` path
-- (e.g. '/carbon') — there is no DB modules table today; the nav list lives
-- in AppShell.tsx. updated_by records which admin last changed a row.
--
-- RLS (mirrors ADR-0008 / ADR-0012 patterns):
--   SELECT  — any authenticated user, for THEIR OWN role only. Staff must
--             read their own rows to render the dock; they must not read
--             other roles' rows. Uses an inline subquery on core.app_user
--             (safe per ADR-0008 §"When this applies": the policy lives on
--             a DIFFERENT table than core.app_user, so no self-reference
--             recursion). The enum→text cast lets the text `role` column
--             compare against app_user.role (core.user_role enum) without
--             an operator-does-not-exist error. pending reads their own
--             rows too (harmless — they can't reach the dock until promoted;
--             the rows are visibility hints, not sensitive).
--   INSERT/UPDATE/DELETE — admin only, via core.fn_is_admin() (SECURITY
--             DEFINER, ADR-0008 recursion-safe). Mirrors audit_log_admin_all.
--
-- NOT IN SCOPE: this does not grant access. "Do not" list in the WO:
--   - do not drop RequireAuth requireAdmin from any route
--   - do not hide '/' or '/dashboard' (losing the landing page strands users)
-- The frontend ModuleDock still applies the existing adminOnly filter on top
-- of this visibility set, and skips '/' + '/dashboard' when applying hides.

-- ─── 1) Table ──────────────────────────────────────────────────────────────
-- `role` is plain text (check-constrained to the three role literals) rather
-- than the core.user_role enum: the SELECT policy compares it against
-- app_user.role (an enum), and casting the enum to text in the policy is
-- simpler + avoids the operator-does-not-exist trap of comparing text=enum
-- directly. A CHECK constraint keeps the values identical to the enum's.
create table if not exists core.role_module_visibility (
  role        text not null check (role in ('admin','staff','pending')),
  module_key  text not null,
  visible     boolean not null default true,
  updated_by  uuid references core.app_user(id),
  updated_at  timestamptz not null default now(),
  primary key (role, module_key)
);

comment on table core.role_module_visibility is
  'DOCK (2026-08-03) — admin-configurable dock icon visibility per role. Presentation only (NOT a security boundary — route guards + RLS remain authoritative). module_key = the NAV `to` path from AppShell.tsx. Defaults to visible so new routes do not silently hide. See docs/work-orders/DOCK-role-module-visibility.md.';

-- ─── 2) RLS + policies ─────────────────────────────────────────────────────
alter table core.role_module_visibility enable row level security;

-- SELECT: own role only. Inline subquery on core.app_user is recursion-safe
-- here because the policy is on role_module_visibility, not on app_user
-- (ADR-0008 §"When this applies"). Cast app_user.role (enum) to text to
-- match this table's text `role` column (operator-does-not-exist guard).
drop policy if exists role_module_visibility_read_own on core.role_module_visibility;
create policy role_module_visibility_read_own
    on core.role_module_visibility for select to authenticated
    using (
        role = (
            select au.role::text from core.app_user au
            where au.id = auth.uid()
        )
    );

-- Admin full control (insert/update/delete). Mirrors audit_log_admin_all.
drop policy if exists role_module_visibility_admin_all on core.role_module_visibility;
create policy role_module_visibility_admin_all
    on core.role_module_visibility for all to authenticated
    using (core.fn_is_admin())
    with check (core.fn_is_admin());

-- ─── 3) PostgREST exposure (public. façade + grant) ────────────────────────
-- security_invoker so the RLS above is enforced against the caller, not the
-- view owner. Mirrors every other table in schema5_rest_exposure.sql.
drop view if exists public.role_module_visibility;
create view public.role_module_visibility with (security_invoker=on)
    as select * from core.role_module_visibility;

grant select, insert, update, delete on public.role_module_visibility to authenticated;

notify pgrst, 'reload schema';
