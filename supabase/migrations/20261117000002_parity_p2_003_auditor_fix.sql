-- ============================================================================
-- ENV-PARITY-P2-003 C1 FIX — auditor_id resolution backfill (D5 P1 repair)
-- migration 20261117000001_parity_p2_003.sql is IMMUTABLE (already applied
-- live); this file is the house fix-migration for the corrected D5 finding.
-- ============================================================================
-- Lane: Track-Z (GLM). Base: supabase/migrations/20261117000001_parity_p2_003.sql
-- (PR #211, feat/env-parity-p2-003). Receipt: PR #211 D5 review comment
-- 2026-11-17 (issuecomment-6936446464).
--
-- ─── THE CORRECTION (P1 — the prior record was FALSE) ─────────────────────
-- The prior record (000001 header + WO §10 count report + handoff §6.2)
-- claimed the single distinct 13-digit Check Auditor account had NO
-- deterministic match (0/34 probes). That probe was a PARTIAL-DATA ERROR:
-- it compared against the 14 packed-header tokens of the Drive-sourced
-- ข้อมูลผู้ปฏิบัติงาน tab, never the per-employee rows. Re-fetch 2026-11-17
-- (D5): the Auditor value (77 nonempty rows, 1 distinct) EXACTLY equals the
-- Employee_id of one per-employee row of that tab (workbook
-- 1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk, excel row 32 col A — the
-- value is stored as a NUMBER there, so a string probe without numeric
-- normalization misses it), and that row's name resolves UNIQUELY, by exact
-- full-name match, to core.personnel STAFF-001 (employee_code column,
-- live-verified 2026-11-17; 9-row table, exactly one such name).
--
-- ─── PII PIN (UNCHANGED) ───────────────────────────────────────────────────
-- The 13-digit value NEVER appears in this repo: not in 000001, not here,
-- not in the suite/docs/CHANGELOG (suite test_30 greps BOTH migration
-- files). Evidence in receipts is REDACTED (first-3 + last-2 digits only).
-- auditor_legacy_id stays NULL (national-ID-class data never seeded).
--
-- ─── THE FIX ────────────────────────────────────────────────────────────────
-- Guarded + idempotent: only rows still auditor_id IS NULL; the target list
-- is the 77 row_IDs whose source Auditor cell was non-blank (generated
-- programmatically from the CSV snapshot /tmp/env-p2-003-sources/
-- sheet-check.csv; id = legacy_id = the AppSheet 8-hex row_ID). The person
-- subquery is pinned to employee_code = 'STAFF-001' (the live synthetic code
-- column of core.personnel — verified live 2026-11-17; no legacy identifier
-- column exists on that table, so code+name is the only resolution path),
-- and a DO-block guard aborts the migration unless that code resolves to
-- EXACTLY ONE personnel row (fail-closed, never a silent NULL backfill).
--
-- ─── ROLLBACK (documented; NOT executed by this file) ─────────────────────
--   update safety.emergency_light_check set auditor_id = null
--     where legacy_id in (<the same 77 legacy_ids>);
--   notify pgrst, 'reload schema';
-- (auditor_legacy_id was never set — nothing else to reverse.)
-- ============================================================================

-- pre-guard: the resolution target must exist EXACTLY once (fail-closed).
do $$
begin
    if (select count(*) from core.personnel where employee_code = 'STAFF-001') <> 1 then
        raise exception 'auditor fix: employee_code STAFF-001 must resolve to exactly one core.personnel row';
    end if;
end
$$;

update safety.emergency_light_check
   set auditor_id = (select id from core.personnel where employee_code = 'STAFF-001')
 where auditor_id is null
   and legacy_id in (
    '7c1bea90', '402a65f1', '3791276d', '25e0ec8a', 'ebc75805', 'dd4fc8c0', '328b7c66', '4ca7d5d0',
    '067c2ebb', '0e64ec7c', 'a2172841', '5e11dc8d', '62be2e36', 'c5ffe787', 'b08cbc73', 'dd4b7a68',
    '1001774f', '63f46f07', 'a555d2c0', '33c0e0cb', '430671f5', '73ea2e61', '2da8903a', '8f9d997f',
    '3cbbef04', '2f533414', '45960af8', '2514060c', 'b107ab0f', '4d1d1745', 'dd324965', 'd4950d21',
    '2e1ef8f1', 'bdbe6b66', 'a872aa0d', '38343843', 'f5110f6c', '44ef3416', 'ed0cb384', '11b4ef1d',
    'f4db2f2d', '6e065e20', '2b1212e7', '923f314f', 'b7feb633', 'fb9a3e03', '6ef74518', '34a89c3f',
    '85eceac7', 'f01bf8ec', '218f86c6', '77b59b31', '726c4258', '3e6dd73c', 'a094fecc', '305cd644',
    '08b6fe94', 'a3d8d8d7', 'e98e51b3', 'b4db8a1b', '013ef5e3', 'e8b3cc1b', '6ec13b89', '1861d402',
    '19ca1f6d', '163609ec', '58b50413', 'acec1b54', 'cbebdf66', 'c5f9e85b', '4b55e8f7', '769b256a',
    '2a76bdbf', '982be175', '045da4ef', 'f02202e6', '0e62c5bd');

-- P3-1 (house trailer): PostgREST schema cache reload after the data fix.
notify pgrst, 'reload schema';
