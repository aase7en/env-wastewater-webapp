-- ============================================================================
-- ENV-PARITY-P1-004 C1 — equipment-spec admin policies (AppSheet parity
-- Phase 1, lane P1.4) — ADDITIVE ONLY
-- ============================================================================
-- Lane: Track-Z (GLM). Work Order: docs/work-orders/ENV-PARITY-P1-004.md
-- (§2.4-3 / §3.5). Owner ask A1 (plan §5.3, commit fb57369): "ต้องมีระบบตั้งค่า
-- สเปกปั๊ม เพราะเมื่อซ่อม/เปลี่ยนปั๊มในอนาคต ตัวเลขการสูบต่อ 1 ชม. อาจไม่เท่าเดิม".
--
-- WHY THIS MIGRATION EXISTS: core.equipment_spec shipped in P1.2
-- (20261115140000_parity_p1_002.sql) with RLS ENABLED and NO policies —
-- fail-closed, so EVERY client read/write is denied today. The P1.4
-- equipment-spec admin page (EquipmentSpecPage, /admin/equipment-specs)
-- cannot read or append anything until policies land. This is the ONE
-- authorized supabase write of lane P1.4 (D1-3 deviation, reviewer-
-- adjudicated at the claim transition R2).
--
-- SCOPE (D1-3 as adjudicated): policies on core.equipment_spec ONLY.
-- The P1.1/P1.2/P1.3 migrations, the table definition, the enum, the 4
-- seeds, and every view are UNTOUCHED. No data is written (zero-DML).
--
-- RECORDED DEVIATION (beyond D1-3, for reviewer adjudication — D1-7):
-- this migration ALSO creates public security_invoker façade views +
-- grants for core.equipment_spec and wastewater.v_reading_meter_chain.
-- LIVE EVIDENCE (probed 2026-11-16 against ENV_DB gllqtbyofrcjzmbnfoeh):
-- PostgREST answers `PGRST106 — Only the following schemas are exposed:
-- public, graphql_public` for Accept-Profile: core/wastewater, so
-- supabase-js .schema('core')/.schema('wastewater') queries are IMPOSSIBLE
-- from the frontend. Without the façades the owner-named spec page ships
-- dead (a viewer-only page that cannot save — exactly what the D1-3
-- rationale rejects), and the honest-warning meter-chain read is
-- unreachable. House precedent for façade-in-same-migration:
-- 20260803000001_dock_role_module_visibility.sql (view + grant + policies
-- in one file, security_invoker=on, notify pgrst).
--
-- ─── RLS POLICIES (binding shape) ──────────────────────────────────────────
-- SELECT: staff-or-admin (forms + admin page need reads; every
--         transactional read in the house uses this predicate).
-- INSERT: ADMIN-ONLY via core.fn_is_admin() — BINDING per the claim R2
--         verdict (issuecomment-6903872629 §4a): equipment_spec drives the
--         ×34/×12 computed volumes and is frontend-gated requireAdmin, so
--         it is an ADMIN-CONFIG surface (dock-visibility precedent
--         20260803000001), NOT an operational daily-form write; a
--         staff-or-admin INSERT gate would be a P2.
-- UPDATE/DELETE: NO policies → denied for everyone (append-only by grant
--         shape; the façade grant below also omits UPDATE/DELETE as
--         belt-and-suspenders).
--
-- APPEND-ONLY DISCIPLINE (documented per the claim instruction; not
-- over-engineered): rows are appended with a FRESH valid_from — duplicates
-- per (kind, valid_from) are already impossible via
-- uq_equipment_spec_kind_valid_from (P1.2). Superseding a spec = append a
-- later valid_from row (the P1.2 effective-dated join picks
-- valid_from <= reading_date < COALESCE(valid_to, ∞) ORDER BY valid_from
-- DESC LIMIT 1, so the newest open row wins without closing the old one).
-- Closing superseded rows' valid_to would need an UPDATE policy — an
-- explicit owner-gated follow-up (the btree_gist / zero-length-window
-- hardening P1.2 D5 P3s stay follow-ups per WO §2.4-1), NOT granted here.
--
-- PREFLIGHT (run before apply; all must hold):
--   select relrowsecurity from pg_class
--     where oid = 'core.equipment_spec'::regclass;            -- must be true
--   select count(*) from pg_policies
--     where schemaname='core' and tablename='equipment_spec'; -- must be 0
--   select count(*) from core.equipment_spec;                 -- 4 seeds
--
-- ROLLBACK (reverse order; the policies/views are the only objects):
--   drop view if exists public.v_reading_meter_chain;
--   drop view if exists public.equipment_spec;
--   drop policy if exists equipment_spec_insert_admin on core.equipment_spec;
--   drop policy if exists equipment_spec_read on core.equipment_spec;
--   revoke select, insert on public.equipment_spec from authenticated;
--   revoke select on public.v_reading_meter_chain from authenticated;
-- (core.equipment_spec, its enum/seeds, and wastewater.v_reading_meter_chain
--  are NEVER dropped — they pre-date this migration.)
-- ============================================================================

-- ─── 1) RLS policies on core.equipment_spec ────────────────────────────────

-- SELECT: staff-or-admin (reads needed by the daily form + admin page).
drop policy if exists equipment_spec_read on core.equipment_spec;
create policy equipment_spec_read
    on core.equipment_spec for select to authenticated
    using (core.fn_is_staff_or_admin());

-- INSERT: admin-only append (BINDING — see header). fn_is_admin() is
-- SECURITY DEFINER (recursion-safe, ADR-0008), same predicate as the dock
-- role_module_visibility admin policy.
drop policy if exists equipment_spec_insert_admin on core.equipment_spec;
create policy equipment_spec_insert_admin
    on core.equipment_spec for insert to authenticated
    with check (core.fn_is_admin());

-- UPDATE / DELETE: intentionally NO policies — denied by default for every
-- role (append-only history, see header). Documented, not enforced by a
-- trigger: the grant shape + policy absence are the enforcement, and the
-- window-hardening follow-ups stay owner-gated.

-- ─── 2) PostgREST façades (security_invoker — RLS applies to the caller) ──
-- LIVE REASON: only `public` is exposed (PGRST106 probe, header).

drop view if exists public.equipment_spec;
create view public.equipment_spec with (security_invoker=on)
    as select * from core.equipment_spec;

-- Read-only by construction: wastewater.v_reading_meter_chain is a complex
-- view (window functions) — not auto-updatable, so the façade cannot
-- become a write path. (READ-ONLY for lane P1.4 per the forbidden scope.)
drop view if exists public.v_reading_meter_chain;
create view public.v_reading_meter_chain with (security_invoker=on)
    as select * from wastewater.v_reading_meter_chain;

-- Grants: select for both; INSERT only on the spec façade (append path).
-- No UPDATE/DELETE grants anywhere — append-only belt-and-suspenders.
grant select on public.equipment_spec to authenticated;
grant insert on public.equipment_spec to authenticated;
grant select on public.v_reading_meter_chain to authenticated;

notify pgrst, 'reload schema';
