-- ============================================================================
-- ENV-PARITY-P2-001 C1 — safety asset masters (AppSheet parity Phase 2,
-- lane P2.1) — NEW tables + RLS + guarded seed
-- ============================================================================
-- Lane: Track-Z (GLM). Work Order: docs/work-orders/ENV-PARITY-P2-001.md
-- (plan §6 Phase 2 row P2.1). Handoff:
-- docs/ai/handoffs/ENV-PARITY-P2-001-GLM.md
--
-- DELIVERS (the ONE authorized supabase write of this lane):
--   1. schema safety (IF NOT EXISTS — the schema ALREADY EXISTS in ENV_DB
--      with the garbage/safety-domain table safety.monthly_check, verified
--      live at preflight 2026-11-16; this statement is a no-op there and
--      creates it on environments that lack it)
--   2. safety.emergency_light — master rows SEEDED (48, from the
--      cross-verified source workbook tab 'Emergency light')
--   3. safety.fire_extinguisher — SCHEMA ONLY, ZERO rows
--      (SOURCE_UNAVAILABLE — see below)
--   4. RLS + pinned policy shapes (P1.4 binding precedent:
--      20261116000001:81-91) + grants
--
-- ─── SOURCE HONESTY (WO §2.1, D1-1 adjudicated at claim R2) ───────────────
-- The emergency-light MASTER is real: workbook ข้อมูลตรวจไฟฉุกเฉิน
-- (1iqSxixJxPApUOYNFFvw2cgH4zD7lPcC_tPzNs2QePAw), tab 'Emergency light' —
-- 48 data rows, fetched read-only (gviz CSV export), saved snapshot
-- /tmp/env-p2-001-sources/sheet-fire-inspection.csv. Seed VALUES below were
-- generated PROGRAMMATICALLY from that CSV (generator cited in the handoff;
-- never hand-typed): blanks→NULL (38 providers, 8 pics), พ.ศ. dates
-- 5/6/2568 → DATE '2025-06-05' (D1-4), zero-padded TEXT ids verbatim,
-- row 032 trailing space kept verbatim, source id gap 044 preserved
-- (never back-filled). QR is an app formula derived from the id
-- (verified on all 48 rows) → NOT stored as data (D1-3).
--
-- The fire-extinguisher MASTER (ข้อมูลถังดับเพลิง) IS NOT PRESENT in the
-- publicly-shared Drive folder — all six public workbooks' tab lists were
-- enumerated; only the per-tank INSPECTION table (ตรวจสอบถัง, P2.2 scope)
-- exists. RECONSTRUCTION FROM THE INSPECTION TABLE IS FORBIDDEN.
--   *** SOURCE_UNAVAILABLE — fire_extinguisher seeds ZERO rows. ***
--   *** RE-FETCH OBLIGATION: re-probe the master sheet (WO §2.1 D1 rule)
--       at the start of lane P2.2; the moment it is fetchable, activate
--       the commented template below via its own reviewed transition. ***
-- The schema ships from reference 12 §3.12 alone (AppSheet definition —
-- docs/ai/digital-twin/12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md:3044-3096).
--
-- ─── RLS (house convention; shapes per 20261116000001:81-91) ──────────────
-- SELECT : authenticated, using (core.fn_is_staff_or_admin())
-- INSERT : authenticated, with check (core.fn_is_admin())   [P1.4 binding]
-- UPDATE : authenticated, using + with check (core.fn_is_admin())
--          (these masters are EDITABLE reference data — P2.2's
--          Update_ExpDate trigger updates expiry_date — D1-7)
-- DELETE : authenticated, using (core.fn_is_admin())
-- NO anon policies → anonymous access is fail-closed by RLS. No REST
-- façade in this lane (P2.2 decides façades; PostgREST exposes only
-- `public`, so the safety schema is not REST-reachable today anyway).
--
-- ─── PREFLIGHT (verified live 2026-11-16 before apply) ────────────────────
--   select to_regclass('safety.emergency_light');   -- NULL (absent)
--   select to_regclass('safety.fire_extinguisher'); -- NULL (absent)
--   select count(*) from pg_policies where schemaname='safety'
--     and tablename in ('emergency_light','fire_extinguisher');  -- 0
--   safety.monthly_check exists (pre-existing, untouched) + baseline
--   counters: wastewater.reading 907 / core.personnel 9 /
--   core.equipment_spec 4.
--
-- ─── ROLLBACK (reverse order; DESTRUCTIVE — drops the seeded masters) ─────
--   drop table if exists safety.fire_extinguisher;
--   drop table if exists safety.emergency_light;
--   drop schema if exists safety;
--   -- NB the guarded form is only safe when NO pre-existing safety tables
--   -- remain; on ENV_DB safety.monthly_check pre-dates this lane, so the
--   -- plain drop schema above would fail (not empty) — by design. To drop
--   -- ONLY this lane's objects there, run just the two drop tables.
--
-- Zero writes to any other table/schema. The seed block is guarded
-- WHERE NOT EXISTS — re-running this file's seed block is a no-op
-- (idempotency contract, tested by test_seed_block_reapply_is_noop).
-- ============================================================================

-- ─── 1) schema ─────────────────────────────────────────────────────────────

create schema if not exists safety;

grant usage on schema safety to authenticated;

-- ─── 2) safety.emergency_light (WO §3.1 — headers ≡ AppSheet §3.32) ────────

create table safety.emergency_light (
    erl_id            text PRIMARY KEY,          -- zero-padded TEXT verbatim ('001'…) — never numeric (QR payload)
    location          text NOT NULL,             -- whitespace verbatim (row '032' carries a trailing space)
    pic_path          text,                      -- legacy AppSheet Drive-relative path; NULL when blank
    receive_date      date,                      -- พ.ศ. parsed per D1-4 (all rows 5/6/2568 → 2025-06-05)
    location_floor    smallint,                  -- observed domain {1,2,3}; NO DEFAULT (D1-6 — AppSheet =1 is form-only)
    providers         text,                      -- NULL when blank (38 of 48)
    source_provenance text NOT NULL DEFAULT 'AppSheet Sheets export 2026-11-16',
    legacy_id         text UNIQUE                -- traceability = erl_id itself (house convention name)
);

-- ─── 3) safety.fire_extinguisher (WO §3.2 — shape from ref 12 §3.12 ONLY) ──

create table safety.fire_extinguisher (
    legacy_row_id    text PRIMARY KEY,           -- AppSheet UNIQUEID("PackedUUID") — real format never observed (SOURCE_UNAVAILABLE)
    location         text,
    -- extinguisher_type: DOCUMENTED ENUM — 5 AppSheet values pinned verbatim
    -- from ref 12 §3.12 (ref 3044-3096), NO hard CHECK constraint (D1-2 —
    -- unknown ≠ rejected; P1.001 VALIDATE-CONSTRAINT lesson):
    --   'เคมีแห้ง (Dry Chemical Extinguishers)'
    --   'สารเหลวระเหย BF2000'
    --   'น้ำยาโฟม (Foam Extinguishers)'
    --   'คาร์บอนไดออกไซด์ (Carbon Dioxide (CO2) Extinguishers)'
    --   'น้ำ (Best Drop)'
    -- seed-time reconciliation (when the master becomes fetchable) flags any
    -- out-of-enum value instead of rejecting it.
    extinguisher_type text,
    photo_path        text,                      -- AppSheet 'รูปถ่ายถังดับเพลิง'
    -- QR CODE is an app formula derived from legacy_row_id → NOT stored (D1-3).
    packed_date       date,                      -- 'วันที่บรรจุ' — TODAY() init is form-only, never a DB default
    expiry_date       date,                      -- 'วันที่หมดอายุ' — P2.2's Update_ExpDate trigger writes this LATER
    size_label        text,                      -- 'ขนาดบรรจุ'
    source_provenance text NOT NULL DEFAULT 'AppSheet Sheets export 2026-11-16',
    legacy_id         text UNIQUE                -- house traceability name (no observed values — SOURCE_UNAVAILABLE)
);

-- ─── 4) RLS + policies (P1.4 binding shapes) ───────────────────────────────

alter table safety.emergency_light enable row level security;
alter table safety.fire_extinguisher enable row level security;

-- emergency_light
drop policy if exists emergency_light_read on safety.emergency_light;
create policy emergency_light_read
    on safety.emergency_light for select to authenticated
    using (core.fn_is_staff_or_admin());

drop policy if exists emergency_light_insert_admin on safety.emergency_light;
create policy emergency_light_insert_admin
    on safety.emergency_light for insert to authenticated
    with check (core.fn_is_admin());

drop policy if exists emergency_light_update_admin on safety.emergency_light;
create policy emergency_light_update_admin
    on safety.emergency_light for update to authenticated
    using (core.fn_is_admin())
    with check (core.fn_is_admin());

drop policy if exists emergency_light_delete_admin on safety.emergency_light;
create policy emergency_light_delete_admin
    on safety.emergency_light for delete to authenticated
    using (core.fn_is_admin());

-- fire_extinguisher
drop policy if exists fire_extinguisher_read on safety.fire_extinguisher;
create policy fire_extinguisher_read
    on safety.fire_extinguisher for select to authenticated
    using (core.fn_is_staff_or_admin());

drop policy if exists fire_extinguisher_insert_admin on safety.fire_extinguisher;
create policy fire_extinguisher_insert_admin
    on safety.fire_extinguisher for insert to authenticated
    with check (core.fn_is_admin());

drop policy if exists fire_extinguisher_update_admin on safety.fire_extinguisher;
create policy fire_extinguisher_update_admin
    on safety.fire_extinguisher for update to authenticated
    using (core.fn_is_admin())
    with check (core.fn_is_admin());

drop policy if exists fire_extinguisher_delete_admin on safety.fire_extinguisher;
create policy fire_extinguisher_delete_admin
    on safety.fire_extinguisher for delete to authenticated
    using (core.fn_is_admin());

-- Table grants to authenticated (monthly_check house grant shape); the
-- policy predicates above enforce staff-read / admin-write.
grant select, insert, update, delete on safety.emergency_light to authenticated;
grant select, insert, update, delete on safety.fire_extinguisher to authenticated;

-- ─── 5) seed — safety.emergency_light (48 guarded rows) ────────────────────
-- Guarded idempotent INSERTs (WHERE NOT EXISTS on erl_id). The block below
-- was generated PROGRAMMATICALLY from the saved source CSV (cited in the
-- handoff) — never hand-typed. Re-running it inserts zero rows.

-- >>> SEED-BLOCK-START (guarded, idempotent — re-running is a no-op)
-- 48 rows generated programmatically from the saved source CSV
-- /tmp/env-p2-001-sources/sheet-fire-inspection.csv (workbook ข้อมูลตรวจไฟฉุกเฉิน
-- 1iqSxixJxPApUOYNFFvw2cgH4zD7lPcC_tPzNs2QePAw, tab 'Emergency light', 2026-11-16).
-- Parse: blanks→NULL; พ.ศ. 5/6/2568 → DATE '2025-06-05'; 032 trailing space verbatim;
-- id gap 044 preserved at source (never back-filled); QR derived-from-id NOT stored.
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '001', 'ในห้องควบคุมโรค เบอร์1', NULL, DATE '2025-06-05', 2, NULL, 'AppSheet Sheets export 2026-11-16', '001' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '001');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '002', 'หน้าห้องควบคุมโรค เบอร์1', 'Emergency light_Images/002.Pic.063439.jpg', DATE '2025-06-05', 2, 'MAX BRIGHT by C.E.E', 'AppSheet Sheets export 2026-11-16', '002' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '002');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '003', 'ปฐมภูมิ เบอร์8', NULL, DATE '2025-06-05', 2, NULL, 'AppSheet Sheets export 2026-11-16', '003' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '003');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '004', 'ปฐมภูมิ เบอร์7', 'Emergency light_Images/004.Pic.064047.jpg', DATE '2025-06-05', 2, 'MAX BRIGHT by C.E.E', 'AppSheet Sheets export 2026-11-16', '004' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '004');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '005', 'ปฐมภูมิ หน้าห้องเบอร์ 4', 'Emergency light_Images/005.Pic.080112.jpg', DATE '2025-06-05', 2, 'MAX', 'AppSheet Sheets export 2026-11-16', '005' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '005');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '006', 'ปฐมภูมิ ในห้องเบอร์ 4', 'Emergency light_Images/006.Pic.063640.jpg', DATE '2025-06-05', 2, 'MAX BRIGHT by C.E.E', 'AppSheet Sheets export 2026-11-16', '006' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '006');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '007', 'ปฐมภูมิ เบอร์6', 'Emergency light_Images/007.Pic.064500.jpg', DATE '2025-06-05', 2, NULL, 'AppSheet Sheets export 2026-11-16', '007' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '007');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '008', 'ปฐมภูมิ เบอร์5', NULL, DATE '2025-06-05', 2, NULL, 'AppSheet Sheets export 2026-11-16', '008' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '008');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '009', 'หน้าห้องฟัน', 'Emergency light_Images/009.Pic.064909.jpg', DATE '2025-06-05', 2, NULL, 'AppSheet Sheets export 2026-11-16', '009' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '009');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '010', 'ทางเดินในห้องฟัน', 'Emergency light_Images/010.Pic.065639.jpg', DATE '2025-06-05', 2, NULL, 'AppSheet Sheets export 2026-11-16', '010' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '010');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '011', 'ในห้องเก็บของห้องฟัน', 'Emergency light_Images/011.Pic.065739.jpg', DATE '2025-06-05', 2, NULL, 'AppSheet Sheets export 2026-11-16', '011' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '011');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '012', 'ทางเดินข้างห้องฟันด้านนอก', 'Emergency light_Images/012.Pic.065426.jpg', DATE '2025-06-05', 2, NULL, 'AppSheet Sheets export 2026-11-16', '012' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '012');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '013', 'กลุ่มงานการพยาบาล', 'Emergency light_Images/013.Pic.065910.jpg', DATE '2025-06-05', 2, NULL, 'AppSheet Sheets export 2026-11-16', '013' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '013');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '014', 'ห้องประชุมโรจนะ', 'Emergency light_Images/014.Pic.075154.jpg', DATE '2025-06-05', 2, 'MAX', 'AppSheet Sheets export 2026-11-16', '014' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '014');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '015', 'ปฐมภูมิ ห้องน้ำ ญ.', 'Emergency light_Images/015.Pic.070409.jpg', DATE '2025-06-05', 2, NULL, 'AppSheet Sheets export 2026-11-16', '015' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '015');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '016', 'ปฐมภูมิ ห้องน้ำ ช.', 'Emergency light_Images/016.Pic.070345.jpg', DATE '2025-06-05', 2, NULL, 'AppSheet Sheets export 2026-11-16', '016' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '016');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '017', 'ปฐมภูมิ ห้องน้ำพิการ', 'Emergency light_Images/017.Pic.070558.jpg', DATE '2025-06-05', 2, NULL, 'AppSheet Sheets export 2026-11-16', '017' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '017');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '018', 'ดาดฟ้า', NULL, DATE '2025-06-05', 3, NULL, 'AppSheet Sheets export 2026-11-16', '018' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '018');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '019', 'หน้าลฟต์ 3', NULL, DATE '2025-06-05', 3, NULL, 'AppSheet Sheets export 2026-11-16', '019' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '019');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '020', 'หน้าลิฟต์ 2', 'Emergency light_Images/020.Pic.070707.jpg', DATE '2025-06-05', 2, NULL, 'AppSheet Sheets export 2026-11-16', '020' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '020');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '021', 'หน้าลิฟต์ 1', 'Emergency light_Images/021.Pic.071005.jpg', DATE '2025-06-05', 1, NULL, 'AppSheet Sheets export 2026-11-16', '021' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '021');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '022', 'คลินิกแผนไทย', 'Emergency light_Images/022.Pic.071434.jpg', DATE '2025-06-05', 1, NULL, 'AppSheet Sheets export 2026-11-16', '022' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '022');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '023', 'หน้าห้องประชุม มงคลบพิตร', 'Emergency light_Images/023.Pic.080701.jpg', DATE '2025-06-05', 1, NULL, 'AppSheet Sheets export 2026-11-16', '023' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '023');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '024', 'Word หน้าหอหญิง', NULL, DATE '2025-06-05', 1, NULL, 'AppSheet Sheets export 2026-11-16', '024' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '024');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '025', 'Word ในหอหญิง', 'Emergency light_Images/025.Pic.082015.jpg', DATE '2025-06-05', 1, NULL, 'AppSheet Sheets export 2026-11-16', '025' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '025');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '026', 'Word ห้องพยาบาล', 'Emergency light_Images/026.Pic.081440.jpg', DATE '2025-06-05', 1, NULL, 'AppSheet Sheets export 2026-11-16', '026' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '026');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '027', 'Word ห้อง Trethment', 'Emergency light_Images/027.Pic.081904.jpg', DATE '2025-06-05', 1, NULL, 'AppSheet Sheets export 2026-11-16', '027' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '027');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '028', 'Word ในหอชาย', 'Emergency light_Images/028.Pic.082220.jpg', DATE '2025-06-05', 1, NULL, 'AppSheet Sheets export 2026-11-16', '028' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '028');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '029', 'Word หน้าหอชาย', 'Emergency light_Images/029.Pic.081052.jpg', DATE '2025-06-05', 1, NULL, 'AppSheet Sheets export 2026-11-16', '029' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '029');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '030', 'ห้องเก็บ O2', 'Emergency light_Images/030.Pic.082536.jpg', DATE '2025-06-05', 1, NULL, 'AppSheet Sheets export 2026-11-16', '030' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '030');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '031', 'ห้องยา', 'Emergency light_Images/031.Pic.074348.jpg', DATE '2025-06-05', 1, 'MAX', 'AppSheet Sheets export 2026-11-16', '031' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '031');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '032', 'OPD หัตการ เบอร์7 ', 'Emergency light_Images/032.Pic.074009.jpg', DATE '2025-06-05', 1, 'Sunny MODEL SN 206 DH 1', 'AppSheet Sheets export 2026-11-16', '032' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '032');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '033', 'OPD โถงหน้าห้อง6 พยาบาล', NULL, DATE '2025-06-05', 1, NULL, 'AppSheet Sheets export 2026-11-16', '033' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '033');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '034', 'หน้าห้องแลป', 'Emergency light_Images/034.Pic.073614.jpg', DATE '2025-06-05', 1, NULL, 'AppSheet Sheets export 2026-11-16', '034' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '034');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '035', 'OPD หน้าห้องน้ำ หลังแลป', NULL, DATE '2025-06-05', 1, NULL, 'AppSheet Sheets export 2026-11-16', '035' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '035');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '036', 'OPD ห้องน้ำ ช.', 'Emergency light_Images/036.Pic.073259.jpg', DATE '2025-06-05', 1, NULL, 'AppSheet Sheets export 2026-11-16', '036' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '036');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '037', 'OPD ห้องน้ำ ญ.', 'Emergency light_Images/037.Pic.073317.jpg', DATE '2025-06-05', 1, NULL, 'AppSheet Sheets export 2026-11-16', '037' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '037');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '038', 'OPD ห้องน้ำคนพิการ', 'Emergency light_Images/038.Pic.073329.jpg', DATE '2025-06-05', 1, NULL, 'AppSheet Sheets export 2026-11-16', '038' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '038');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '039', 'หน้าห้องเคาะปอด', 'Emergency light_Images/039.Pic.072001.jpg', DATE '2025-06-05', 1, NULL, 'AppSheet Sheets export 2026-11-16', '039' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '039');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '040', 'ในห้องกายภาพ', 'Emergency light_Images/040.Pic.072711.jpg', DATE '2025-06-05', 1, NULL, 'AppSheet Sheets export 2026-11-16', '040' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '040');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '041', 'ในห้อง LAB', 'Emergency light_Images/041.Pic.072935.jpg', DATE '2025-06-05', 1, NULL, 'AppSheet Sheets export 2026-11-16', '041' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '041');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '042', 'ในห้อง X-ray', 'Emergency light_Images/042.Pic.074845.jpg', DATE '2025-06-05', 1, NULL, 'AppSheet Sheets export 2026-11-16', '042' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '042');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '043', 'LR ห้องทำคลอด', 'Emergency light_Images/043.Pic.075422.jpg', DATE '2025-06-05', 1, 'SUNNY', 'AppSheet Sheets export 2026-11-16', '043' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '043');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '045', 'ห้อง OR', 'Emergency light_Images/045.Pic.075647.jpg', DATE '2025-06-05', 1, NULL, 'AppSheet Sheets export 2026-11-16', '045' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '045');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '046', 'LR พักรอคลอด', 'Emergency light_Images/046.Pic.075238.jpg', DATE '2025-06-05', 1, 'SUNNY', 'AppSheet Sheets export 2026-11-16', '046' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '046');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '047', 'ER เสาโต๊ะคอม', 'Emergency light_Images/047.Pic.080249.jpg', DATE '2025-06-05', 1, 'SUNNY', 'AppSheet Sheets export 2026-11-16', '047' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '047');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '048', 'ER หน้าห้อง Pressure', 'Emergency light_Images/048.Pic.080103.jpg', DATE '2025-06-05', 1, NULL, 'AppSheet Sheets export 2026-11-16', '048' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '048');
INSERT INTO safety.emergency_light (erl_id, location, pic_path, receive_date, location_floor, providers, source_provenance, legacy_id) SELECT '049', 'ER จุดเตรียมอุปกรณ์ด้านหน้า', 'Emergency light_Images/049.Pic.080409.jpg', DATE '2025-06-05', 1, NULL, 'AppSheet Sheets export 2026-11-16', '049' WHERE NOT EXISTS (SELECT 1 FROM safety.emergency_light WHERE erl_id = '049');
-- <<< SEED-BLOCK-END

-- ─── 6) fire_extinguisher seed — ZERO ROWS (SOURCE_UNAVAILABLE) ────────────
--
-- *** SOURCE_UNAVAILABLE: the ข้อมูลถังดับเพลิง master sheet is not present
-- *** in the publicly-shared Drive folder (WO §2.1; all six public
-- *** workbooks' tab lists enumerated). NOTHING is inserted here and
-- *** NOTHING may be reconstructed from the ตรวจสอบถัง inspection table.
-- *** RE-FETCH OBLIGATION: re-probe the master sheet at the start of lane
-- *** P2.2; activate the template below ONLY via its own reviewed
-- *** transition, with a seed-time enum reconciliation.
--
-- Shape-complete template (kept commented out until the sheet is fetchable):
--
-- INSERT INTO safety.fire_extinguisher
--     (legacy_row_id, location, extinguisher_type, photo_path,
--      packed_date, expiry_date, size_label, source_provenance, legacy_id)
-- SELECT
--     <legacy_row_id verbatim from the master sheet>,
--     NULLIF(<location>, ''),
--     <ประเภทถังดับเพลิง verbatim>,             -- reconcile vs the 5-value documented enum; flag out-of-enum, never reject
--     NULLIF(<รูปถ่ายถังดับเพลิง>, ''),
--     <วันที่บรรจุ พ.ศ.-parsed>,                 -- blanks → NULL, never TODAY()
--     <วันที่หมดอายุ พ.ศ.-parsed>,
--     NULLIF(<ขนาดบรรจุ>, ''),
--     'AppSheet Sheets export <fetch-date>',
--     <legacy_row_id>
-- WHERE NOT EXISTS (SELECT 1 FROM safety.fire_extinguisher
--                   WHERE legacy_row_id = <legacy_row_id>);

notify pgrst, 'reload schema';
