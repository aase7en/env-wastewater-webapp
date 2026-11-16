-- ENV-PARITY-P1-007 — the critical-flags public PostgREST façade (PART A).
--
-- The PR #199 D5 D1-5 ruling (issuecomment-6912632368) named this remedy
-- verbatim: "create view public.v_reading_critical_flags with
-- (security_invoker=on) as select * from wastewater.v_reading_critical_flags;
-- grant select … to authenticated; notify pgrst" — a façade-ONLY micro-lane
-- (P1.3-origin gap; folded into lane P1.7 per the PR #200 closeout frontier
-- option 1 / WO D1-1). The P1.6 /reports threshold-counts wiring
-- (fetchCriticalFlagsRange → v_reading_critical_flags) already queries this
-- view name and goes LIVE with ZERO frontend code change: the amber
-- "ยังไม่พร้อมใช้" notice flips to real counts.
--
-- Shape mirrors the P1.4 sibling façade file
-- 20261116000001_parity_p1_004_equipment_spec_admin.sql:108-116 (and the
-- 2026-08-03 precedent 20260719000010_schema5_rest_exposure.sql):
-- only `public` is PostgREST-exposed (PGRST106); security_invoker=on so the
-- caller's context gates every row. The explicit grant is to `authenticated`
-- (the ruling text); Supabase default privileges ALSO grant anon nominal
-- table privileges on new public objects (identical rows on the P1.4
-- sibling) — anon probes still FAIL CLOSED because security_invoker
-- evaluates the underlying query in the caller's context and anon has NO
-- USAGE on schema `wastewater` (REST probe: HTTP 401, PG 42501 permission
-- denied). The base view wastewater.v_reading_critical_flags is
-- BYTE-UNCHANGED (additive-only; pg_get_viewdiff asserted by the lane's
-- smoke suite).
--
-- ROLLBACK (unexecuted unless adjudicated; run via the same Management-API
-- apply path — fully additive lane, nothing to restore byte-exactly):
--   drop view if exists public.v_reading_critical_flags;
--   notify pgrst, 'reload schema';
--   (the base wastewater view + fn_critical_flags predate this migration
--    and are NEVER touched here — nothing else to roll back)

drop view if exists public.v_reading_critical_flags;
create view public.v_reading_critical_flags with (security_invoker=on)
    as select * from wastewater.v_reading_critical_flags;

-- Read-only by construction: wastewater.v_reading_critical_flags is a
-- complex view (CROSS JOIN LATERAL fn_critical_flags) — not auto-updatable,
-- so the façade cannot become a write path. Select granted to authenticated
-- per the ruling text; anon fails closed at query time (security_invoker +
-- no anon USAGE on schema wastewater — see the header note).
grant select on public.v_reading_critical_flags to authenticated;

notify pgrst, 'reload schema';
