-- ============================================================================
-- ENV-PARITY-P3-001 C1 — the four AppSheet master tables + the two
-- equipment bindings (AppSheet parity Phase 3, lane P3.1, v1.9.0).
-- ============================================================================
-- Lane: Track-Z (GLM). Work Order: docs/work-orders/ENV-PARITY-P3-001.md
-- (plan §6 Phase 3 FIRST row P3.1 line 245 VERBATIM). Handoff:
-- docs/ai/handoffs/ENV-PARITY-P3-001-GLM.md. Predecessors: P2.1–P2.6
-- (PHASE 2 COMPLETE; the P2.4 D1-4 successor FK debt repaid here).
--
-- DELIVERS (the ONE authorized supabase write of this lane):
--   1. core.item_category  ← §3.27 Categories   (4 cols, key ID UNIQUEID)
--   2. core.vendor         ← §3.31 Vendors      (9 cols incl. system _RowNumber; Related Items virtual OUT)
--   3. core.item           ← §3.29 Items        (20 cols incl. system _RowNumber + 4 Related… virtual REF_ROWS OUT → 15 persisted; + the D1-4 category FK)
--   4. core.distributor    ← §3.15 distributor  (8 cols incl. system _RowNumber)
--   5. RLS + pinned policies + grants (house master pattern, P2.1 D1-7:
--      these are EDITABLE reference data — SELECT staff-or-admin;
--      INSERT/UPDATE/DELETE admin; UPDATE carries USING + WITH CHECK)
--   6. the TWO bindings:
--      (a) D1-4 — food.lab_test.equipment_id uuid NULL FK → core.item(id)
--          (repays the P2.4 D1-4 successor obligation quoted verbatim in
--          20261117000003_parity_p2_004.sql:54-60,176-178; equipment_legacy
--          verbatim column UNTOUCHED; lab_test is 0 rows so the additive
--          FK breaks nothing)
--      (b) D1-3 (adjudicated: the row names BOTH columns) — the water-side
--          ชนิดเครื่องมือตรวจ additive column
--          water_supply.daily_check.instrument_id uuid NULL FK →
--          core.item(id) (AppSheet น้ำประปา.ชนิดเครื่องมือตรวจ is
--          Ref→Items — ref 12 ref 2397 + §4 relationship line 5605;
--          P1.5 shipped the usage columns WITHOUT it — migration
--          20261116000002…:88-91)
--   7. security_invoker REST façades (only `public` is PostgREST-reachable)
--      for the four masters + refreshed public.lab_test /
--      public.daily_check carrying the new FK columns (the P2.4 D1-6
--      lesson: a stored `select *` view expands its column list AT
--      CREATION — OR REPLACE preserves ACLs, security_invoker restated).
--   8. the guarded 6-row distributor seed (see the seed block below).
--
-- ─── NAME MAPPINGS (verbatim AppSheet → house snake_case, pinned) ─────────
--   §3.27 Categories: ID→legacy_id · Category→category · Icon (Image,
--     Label)→icon_path · (_RowNumber system → not persisted)
--   §3.31 Vendors: ID→legacy_id · Name→name · Logo (Thumbnail)→logo_path ·
--     URL→url · Phone→phone · Email→email · Address→address ·
--     Related Items (virtual REF_ROWS)→ recorded-never-persisted
--   §3.29 Items: Item ID→legacy_id · Name→name · Description→description ·
--     Image→image_path · Category (Enum w6hwsyj/72b68b19/9a7ebdaf —
--     legacy Categories ID tokens, ref 4792)→category_legacy verbatim +
--     category_id uuid FK (resolved rows; the enum stays a UI-restricted
--     list, NO hard CHECK — the P1.001 lesson) · Vendor (Ref→Vendors
--     ID, ref 4794-4798)→vendor_id uuid FK · Purchase Cost
--     (Price)→purchase_cost · unit_count_num/unit_count/unit_formula/
--     unit_use_num/unit_calculate verbatim · User manual (File)→
--     user_manual_path · min→min_qty · max→max_qty ·
--     Related น้ำประปาs / Related coliform bac. Employees / Food.s /
--     _Waters (virtual REF_ROWS, ref 4800-4862)→ recorded-never-persisted
--   §3.15 distributor: id→legacy_id · dealer/dealer_email/dealer_address/
--     dealer_tel/salesname verbatim · lineID→line_id ·
--     (_RowNumber system → not persisted)
--   House conventions on all four: uuid PKs (UNIQUEID() 8-hex keys become
--   uuid with the legacy id preserved verbatim UNIQUE) + source_provenance
--   (the P2.1/P2.4 seed-lineage convention); image/file/logo columns hold
--   references (the existing attachment surface), never inline blobs;
--   blanks ⇒ NULL.
--
-- ─── SOURCE HONESTY (WO §2 receipts, D1-2/D1-6 adjudicated) ───────────────
-- distributor REACHABLE: pond workbook ข้อมูลบ่อบำบัดประจำวัน
-- 1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk, tab 'distributor'
-- (sheetId 11), full XLSX export 364,794 bytes fetched READ-ONLY
-- 2026-11-18 (/tmp/env-p3-001-pond.xlsx; 12 tabs byte-consistent with the
-- P2.4 enumeration; header = id, dealer, dealer_email, dealer_address,
-- dealer_tel, salesname, lineID = §3.15 verbatim; 6 data rows / 6 unique
-- 8-hex ids). Seed VALUES below were generated PROGRAMMATICALLY from those
-- bytes — never hand-typed; blanks ⇒ NULL; strings verbatim (D1-6:
-- business-contact fields are NOT PHI / NOT the Employee_id national-ID
-- class; verbatim-commit adjudicated — masking a present value to NULL
-- would fabricate absence).
--
-- Items / Vendors / Categories: SOURCE_UNAVAILABLE — ABSENT in all 12 pond
-- tabs (programmatic enumeration 2026-11-18) + ABSENT across the other five
-- public workbooks (the P2.4 full enumeration). NOTHING is seeded, nothing
-- reconstructed from formulas/enum tokens (the standing P2-001…P2-006
-- ruling). legacy_id UNIQUE + source_provenance ship NOW so the deferred
-- owner-shared seeds need NO second schema migration.
--   *** The Category enum tokens (w6hwsyj / 72b68b19 / 9a7ebdaf) are
--   *** carried VERBATIM as UI-restricted values + column comment — they
--   *** are NOT fabricated into core.item_category rows.
--
-- ─── RLS (house master pattern; editable reference data — P2.1 D1-7) ──────
-- SELECT : authenticated, using (core.fn_is_staff_or_admin())
-- INSERT : authenticated, with check (core.fn_is_admin())
-- UPDATE : authenticated, using + with check (core.fn_is_admin())
-- DELETE : authenticated, using (core.fn_is_admin())
-- NO anon policies → anonymous access is fail-closed by RLS. The four
-- public façade views are security_invoker=on so the caller's RLS gates
-- every row through REST as well; view grants mirror the editable-master
-- shape (select+insert+update+delete to authenticated — the P1.4 façade
-- grant pattern extended for the editable semantics; RLS remains the
-- enforcement).
--
-- ─── PREFLIGHT (verified live 2026-11-18 before apply) ────────────────────
--   to_regclass('core.item_category'/'core.vendor'/'core.item'/
--     'core.distributor')  -- all NULL (absent)
--   pg_policies for the four core tables   -- 0
--   to_regclass('public.item'/'public.vendor'/'public.item_category'/
--     'public.distributor')  -- all NULL (absent)
--   food.lab_test columns equipment_id absent;
--   water_supply.daily_check column instrument_id absent
--   baselines intact: wastewater.reading 907 / core.personnel 9 /
--   core.equipment_spec 4 / safety.emergency_light 48 /
--   safety.fire_extinguisher 0 / safety.emergency_light_check 332 /
--   food.lab_test 0
--
-- ─── ROLLBACK (reverse order; DESTRUCTIVE — drops the seeded master and
--      any admin-entered rows in the four masters) ────────────────────────
--   drop view if exists public.distributor;
--   drop view if exists public.item;
--   drop view if exists public.vendor;
--   drop view if exists public.item_category;
--   create or replace view public.lab_test with (security_invoker=on)
--     as select * from food.lab_test;  -- re-created WITHOUT equipment_id
--   create or replace view public.daily_check with (security_invoker=on)
--     as select * from water_supply.daily_check;  -- same, WITHOUT instrument_id
--   alter table food.lab_test drop column if exists equipment_id;
--   alter table water_supply.daily_check drop column if exists instrument_id;
--   drop table if exists core.distributor;
--   drop table if exists core.item;
--   drop table if exists core.vendor;
--   drop table if exists core.item_category;
--   notify pgrst, 'reload schema';
--   (lab_test/daily_check re-creates restore the exact pre-P3 column
--   sets; nothing pre-existing outside the two named bindings is touched.)
--
-- Zero writes to any other table. The seed block is guarded WHERE NOT
-- EXISTS — re-running it is a no-op (idempotency contract, tested by
-- test_seed_block_reapply_is_noop).
-- ============================================================================

-- ─── 1) core.item_category (ref 12 §3.27 Categories — 4 cols) ──────────────

create table core.item_category (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category          text,                      -- AppSheet 'Category'
    icon_path         text,                      -- AppSheet 'Icon' (Image, Label) — reference, never an inline blob
    source_provenance text NOT NULL DEFAULT 'AppSheet Sheets export 2026-11-18',
    legacy_id         text UNIQUE                -- AppSheet 'ID' verbatim 8-hex UNIQUEID() (no observed values — SOURCE_UNAVAILABLE)
);

-- ─── 2) core.vendor (ref 12 §3.31 Vendors — 9 cols incl. system) ──────────

create table core.vendor (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name              text,                      -- AppSheet 'Name' (Name, Label)
    logo_path         text,                      -- AppSheet 'Logo' (Thumbnail, Label) — reference
    url               text,                      -- AppSheet 'URL'
    phone             text,                      -- AppSheet 'Phone'
    email             text,                      -- AppSheet 'Email'
    address           text,                      -- AppSheet 'Address'
    source_provenance text NOT NULL DEFAULT 'AppSheet Sheets export 2026-11-18',
    legacy_id         text UNIQUE                -- AppSheet 'ID' verbatim 8-hex UNIQUEID() (no observed values — SOURCE_UNAVAILABLE)
);

-- ─── 3) core.item (ref 12 §3.29 Items — 15 persisted + category FK) ───────

create table core.item (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name              text,                      -- AppSheet 'Name' (Name, Label)
    description       text,                      -- AppSheet 'Description'
    image_path        text,                      -- AppSheet 'Image' (Image, Label) — reference
    category_legacy   text,                      -- AppSheet 'Category' Enum token VERBATIM (w6hwsyj / 72b68b19 / 9a7ebdaf — ref 4792; UI-restricted, NO hard CHECK)
    category_id       uuid REFERENCES core.item_category(id),  -- the resolved Categories row (D1-4 category FK)
    vendor_id         uuid REFERENCES core.vendor(id),         -- AppSheet 'Vendor' Ref → Vendors (ref 4794-4798)
    purchase_cost     numeric,                   -- AppSheet 'Purchase Cost' (Price)
    unit_count_num    numeric,                   -- AppSheet 'unit_count_num' (Number)
    unit_count        text,                      -- AppSheet 'unit_count'
    unit_formula      text,                      -- AppSheet 'unit_formula'
    unit_use_num      numeric,                   -- AppSheet 'unit_use_num' (Number)
    unit_calculate    text,                      -- AppSheet 'unit_calculate'
    user_manual_path  text,                      -- AppSheet 'User manual' (File) — reference
    min_qty           numeric,                   -- AppSheet 'min' (Number)
    max_qty           numeric,                   -- AppSheet 'max' (Number)
    source_provenance text NOT NULL DEFAULT 'AppSheet Sheets export 2026-11-18',
    legacy_id         text UNIQUE                -- AppSheet 'Item ID' verbatim 8-hex UNIQUEID() (the อุปกรณ์/ชนิดเครื่องมือตรวจ Ref values)
);

-- ─── 4) core.distributor (ref 12 §3.15 — 8 cols incl. system) ─────────────

create table core.distributor (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer            text,                      -- AppSheet 'dealer' (Text, Label)
    dealer_email      text,                      -- AppSheet 'dealer_email' (Email)
    dealer_address    text,                      -- AppSheet 'dealer_address' (Address)
    dealer_tel        text,                      -- AppSheet 'dealer_tel' (Phone)
    salesname         text,                      -- AppSheet 'salesname' (Text)
    line_id           text,                      -- AppSheet 'lineID' (Text)
    source_provenance text NOT NULL DEFAULT 'AppSheet Sheets export 2026-11-18',
    legacy_id         text UNIQUE                -- AppSheet 'id' verbatim 8-hex UNIQUEID() (6 real values seeded below)
);

-- ─── 5) RLS + policies (house master pattern — editable masters) ──────────

alter table core.item_category enable row level security;
alter table core.vendor enable row level security;
alter table core.item enable row level security;
alter table core.distributor enable row level security;

-- item_category
drop policy if exists item_category_read on core.item_category;
create policy item_category_read
    on core.item_category for select to authenticated
    using (core.fn_is_staff_or_admin());

drop policy if exists item_category_insert_admin on core.item_category;
create policy item_category_insert_admin
    on core.item_category for insert to authenticated
    with check (core.fn_is_admin());

drop policy if exists item_category_update_admin on core.item_category;
create policy item_category_update_admin
    on core.item_category for update to authenticated
    using (core.fn_is_admin())
    with check (core.fn_is_admin());

drop policy if exists item_category_delete_admin on core.item_category;
create policy item_category_delete_admin
    on core.item_category for delete to authenticated
    using (core.fn_is_admin());

-- vendor
drop policy if exists vendor_read on core.vendor;
create policy vendor_read
    on core.vendor for select to authenticated
    using (core.fn_is_staff_or_admin());

drop policy if exists vendor_insert_admin on core.vendor;
create policy vendor_insert_admin
    on core.vendor for insert to authenticated
    with check (core.fn_is_admin());

drop policy if exists vendor_update_admin on core.vendor;
create policy vendor_update_admin
    on core.vendor for update to authenticated
    using (core.fn_is_admin())
    with check (core.fn_is_admin());

drop policy if exists vendor_delete_admin on core.vendor;
create policy vendor_delete_admin
    on core.vendor for delete to authenticated
    using (core.fn_is_admin());

-- item
drop policy if exists item_read on core.item;
create policy item_read
    on core.item for select to authenticated
    using (core.fn_is_staff_or_admin());

drop policy if exists item_insert_admin on core.item;
create policy item_insert_admin
    on core.item for insert to authenticated
    with check (core.fn_is_admin());

drop policy if exists item_update_admin on core.item;
create policy item_update_admin
    on core.item for update to authenticated
    using (core.fn_is_admin())
    with check (core.fn_is_admin());

drop policy if exists item_delete_admin on core.item;
create policy item_delete_admin
    on core.item for delete to authenticated
    using (core.fn_is_admin());

-- distributor
drop policy if exists distributor_read on core.distributor;
create policy distributor_read
    on core.distributor for select to authenticated
    using (core.fn_is_staff_or_admin());

drop policy if exists distributor_insert_admin on core.distributor;
create policy distributor_insert_admin
    on core.distributor for insert to authenticated
    with check (core.fn_is_admin());

drop policy if exists distributor_update_admin on core.distributor;
create policy distributor_update_admin
    on core.distributor for update to authenticated
    using (core.fn_is_admin())
    with check (core.fn_is_admin());

drop policy if exists distributor_delete_admin on core.distributor;
create policy distributor_delete_admin
    on core.distributor for delete to authenticated
    using (core.fn_is_admin());

-- Table grants (schema5 house grant shape covers new core tables via "all
-- tables", but they are restated explicitly here for self-containment).
grant select, insert, update, delete on core.item_category to authenticated;
grant select, insert, update, delete on core.vendor to authenticated;
grant select, insert, update, delete on core.item to authenticated;
grant select, insert, update, delete on core.distributor to authenticated;

-- ─── 6) the TWO bindings ───────────────────────────────────────────────────

-- (a) D1-4 — the lab อุปกรณ์ FK (repays the P2.4 successor obligation).
--     NULLable, additive; lab_test is 0 rows at base so nothing breaks.
--     legacy→uuid resolution materializes only as core.item gains rows.
ALTER TABLE food.lab_test
    ADD COLUMN IF NOT EXISTS equipment_id uuid REFERENCES core.item(id);

COMMENT ON COLUMN food.lab_test.equipment_id IS
    'P3.1 — อุปกรณ์ resolved (§3.16/§3.17/§3.19 Ref→Items). uuid-or-NULL FK → core.item(id); the verbatim equipment_legacy column stays untouched (lineage). UI entries resolve via the Items picker (empty master ⇒ honest empty state — unknown stays NULL, never a fabricated default). Repays the P2.4 D1-4 successor obligation.';

-- (b) D1-3 — the water-side ชนิดเครื่องมือตรวจ column (additive, NULLable;
--     AppSheet น้ำประปา.ชนิดเครื่องมือตรวจ is Ref→Items — ref 2397 + §4
--     line 5605; P1.5 shipped the four usage columns WITHOUT it).
ALTER TABLE water_supply.daily_check
    ADD COLUMN IF NOT EXISTS instrument_id uuid REFERENCES core.item(id);

COMMENT ON COLUMN water_supply.daily_check.instrument_id IS
    'P3.1 — ชนิดเครื่องมือตรวจ (AppSheet น้ำประปา Ref→Items, ref 2397 + §4 line 5605). uuid-or-NULL FK → core.item(id). NULL = unknown stays unknown (never coerced; the P1.5 history backfill is Phase 5 per plan §7).';

-- Façade refreshes — Postgres expands `select *` AT CREATION (the P2.4
-- D1-6 recorded lesson), so the new FK columns need OR REPLACE on both
-- views. ACLs are preserved by OR REPLACE; security_invoker is restated.
-- No policy/grant statement is involved (none exists on these views).
create or replace view public.lab_test
with (security_invoker=on) as
select * from food.lab_test;

create or replace view public.daily_check
with (security_invoker=on) as
select * from water_supply.daily_check;

-- ─── 7) the four REST façades (security_invoker — P1.4/P1.5 pattern) ──────
-- Only `public` is PostgREST-reachable (PGRST106). The caller's RLS gates
-- every row; the view grants mirror the editable-master shape.

create view public.item_category
with (security_invoker=on) as
select * from core.item_category;

create view public.vendor
with (security_invoker=on) as
select * from core.vendor;

create view public.item
with (security_invoker=on) as
select * from core.item;

create view public.distributor
with (security_invoker=on) as
select * from core.distributor;

grant select, insert, update, delete on public.item_category to authenticated;
grant select, insert, update, delete on public.vendor to authenticated;
grant select, insert, update, delete on public.item to authenticated;
grant select, insert, update, delete on public.distributor to authenticated;

-- ─── 8) Column comments — the documented value sets verbatim (UI-restricted,
--       NO hard CHECK — D1-8) + the honesty pins ────────────────────────────

COMMENT ON COLUMN core.item.category_legacy IS
    'P3.1 — AppSheet Items.Category Enum token VERBATIM (ref 4792; the tokens are legacy Categories IDs): w6hwsyj / 72b68b19 / 9a7ebdaf. UI-restricted verbatim list, NO hard CHECK (P1.001 lesson — unknown ≠ rejected). NULL = unresolved; the resolved row lives in category_id.';

COMMENT ON COLUMN core.item_category.category IS
    'P3.1 — AppSheet Categories.Category (§3.27). Categories master SOURCE_UNAVAILABLE at base (zero tabs in the 12-tab pond enumeration + the P2.4 6-workbook enumeration) — zero rows seeded, never fabricated; the deferred owner-shared seed needs NO second migration (legacy_id UNIQUE + source_provenance ship now).';

COMMENT ON COLUMN core.distributor.legacy_id IS
    'P3.1 — AppSheet distributor.id verbatim 8-hex UNIQUEID() (§3.15). Seeded verbatim from workbook 1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk tab distributor (sheetId 11), 2026-11-18 — 6 rows / 6 unique ids; blanks ⇒ NULL; provenance pinned.';

COMMENT ON COLUMN core.item.legacy_id IS
    'P3.1 — AppSheet Items.Item ID verbatim 8-hex UNIQUEID() (§3.29). The value the AppSheet อุปกรณ์ (coliform ×3, ref 4821/4837/4853) and ชนิดเครื่องมือตรวจ (น้ำประปา, ref 2397) Ref columns carry. SOURCE_UNAVAILABLE at base — 0 rows, never fabricated.';

COMMENT ON COLUMN core.item.min_qty IS
    'P3.1 — AppSheet Items.min (Number, §3.29). Renamed min_qty (min/max are house-unsafe identifiers); value semantics verbatim.';
COMMENT ON COLUMN core.item.max_qty IS
    'P3.1 — AppSheet Items.max (Number, §3.29). Renamed max_qty; value semantics verbatim.';
COMMENT ON COLUMN core.distributor.line_id IS
    'P3.1 — AppSheet distributor.lineID (§3.15) renamed line_id; bytes verbatim in the seed.';

-- ─── 9) seed — core.distributor (6 guarded rows, D1-2/D1-6) ────────────────
-- Guarded idempotent INSERTs (WHERE NOT EXISTS on legacy_id). The block
-- below was generated PROGRAMMATICALLY from the source XLSX bytes — never
-- hand-typed. Re-running it inserts zero rows.

-- >>> SEED-BLOCK-START (guarded, idempotent — re-running is a no-op)
-- 6 rows generated programmatically from /tmp/env-p3-001-pond.xlsx
-- (workbook ข้อมูลบ่อบำบัดประจำวัน 1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk,
-- tab distributor sheetId 11, 364,794 bytes, 2026-11-18).
-- Parse: blanks→NULL; strings verbatim (D1-6 — business contacts, NOT PHI).
INSERT INTO core.distributor (legacy_id, dealer, dealer_email, dealer_address, dealer_tel, salesname, line_id, source_provenance) SELECT 'e5e76725', 'สสจ.', NULL, 'ตลาดเจ้าพรหม', '0822952481', 'ยุ้ย มัลลิตา ใณฑปใหญ่', NULL, 'AppSheet Sheets export 2026-11-18' WHERE NOT EXISTS (SELECT 1 FROM core.distributor WHERE legacy_id = 'e5e76725');
INSERT INTO core.distributor (legacy_id, dealer, dealer_email, dealer_address, dealer_tel, salesname, line_id, source_provenance) SELECT '0a7abe65', 'HANNA', 'hnlab611@gmail.com', NULL, '0645873691', 'คุณมุก', NULL, 'AppSheet Sheets export 2026-11-18' WHERE NOT EXISTS (SELECT 1 FROM core.distributor WHERE legacy_id = '0a7abe65');
INSERT INTO core.distributor (legacy_id, dealer, dealer_email, dealer_address, dealer_tel, salesname, line_id, source_provenance) SELECT 'becdc598', 'หจก. M&P IMPEX LIMITED PARTNER', NULL, NULL, '020129044', NULL, NULL, 'AppSheet Sheets export 2026-11-18' WHERE NOT EXISTS (SELECT 1 FROM core.distributor WHERE legacy_id = 'becdc598');
INSERT INTO core.distributor (legacy_id, dealer, dealer_email, dealer_address, dealer_tel, salesname, line_id, source_provenance) SELECT 'f67d5e26', 'หจก. เอส.ดับบลิว.เอ เอ็นจิเนียริ่ง เซอร์วิส', NULL, '23 Soi Pracha Uthit 76, Khwaeng Thung Khru, Khet Thung Khru, Krung Thep Maha Nakhon 10140, Thailand', '02-873-8880', 'S.W.A.', 'S.W.A.', 'AppSheet Sheets export 2026-11-18' WHERE NOT EXISTS (SELECT 1 FROM core.distributor WHERE legacy_id = 'f67d5e26');
INSERT INTO core.distributor (legacy_id, dealer, dealer_email, dealer_address, dealer_tel, salesname, line_id, source_provenance) SELECT '262d81ee', 'หจก. ปุณยธร', 'poonyatorn.aya@hotmail.com', '41/1 หมู่ 2ซ.ชัยมงคล 14 ถ.สายสนามกีฬา-วัดรพะญาติการาม ไผ่ลิง 13000', '0871174977', NULL, NULL, 'AppSheet Sheets export 2026-11-18' WHERE NOT EXISTS (SELECT 1 FROM core.distributor WHERE legacy_id = '262d81ee');
INSERT INTO core.distributor (legacy_id, dealer, dealer_email, dealer_address, dealer_tel, salesname, line_id, source_provenance) SELECT '96e0f383', 'หจก.วอเตอร์ ชอยส', NULL, '56 ซ. สุภาพงษ์ แขวงหยองบอน เขตประเวศ กรุงเทพมหานคร 10250 ประเทศไทย', '0897993309', NULL, NULL, 'AppSheet Sheets export 2026-11-18' WHERE NOT EXISTS (SELECT 1 FROM core.distributor WHERE legacy_id = '96e0f383');
-- <<< SEED-BLOCK-END

-- ─── 10) Items / Vendors / Categories seed — ZERO ROWS (D1-2) ──────────────
--
-- *** SOURCE_UNAVAILABLE: zero Items/Vendors/Categories tabs in the 12-tab
-- *** pond enumeration (2026-11-18) + the full P2.4 6-workbook enumeration.
-- *** NOTHING is inserted and NOTHING may be reconstructed from the
-- *** REF_ROWS formulas or the Category enum tokens (the standing
-- *** P2-001…P2-006 ruling). RE-FETCH OBLIGATION: when the owner shares the
-- *** master sheets, the guarded P2.1/P2.3 seed pattern applies with NO
-- *** second schema migration (legacy_id UNIQUE + source_provenance above).

-- ─── P3-1 (house trailer): PostgREST schema cache reload.
notify pgrst, 'reload schema';
