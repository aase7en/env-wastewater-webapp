"""ENV-PARITY-P3-001 C1 — D2 RED-first live contract battery for the four
AppSheet master tables + the two equipment bindings (AppSheet parity
Phase 3, lane P3.1, Track-Z GLM).

Queries ENV_DB (project gllqtbyofrcjzmbnfoeh, ap-southeast-1) through the
same Management-API access path as scripts/apply_migration_api.py
(scripts/_env.py; SUPABASE_ACCESS_TOKEN from Drive secrets — never printed).

Assertion groups (WO §3/§7; every group must FAIL truthfully while
migration 20261118000001_parity_p3_001.sql is UNAPPLIED — the RED record
goes in the handoff — and pass GREEN after it):

  SCHEMA     — core.item_category / core.vendor / core.item /
               core.distributor exist with the pinned columns/types/
               nullability (ref 12 §3.27/§3.31/§3.29/§3.15 mapped to the
               house snake_case shapes), uuid PKs, legacy_id UNIQUE per
               table, source_provenance defaults, category/vendor FKs on
               core.item, the D1-4 lab binding (food.lab_test.equipment_id
               FK → core.item) and the D1-3 water binding
               (water_supply.daily_check.instrument_id FK → core.item).
  RLS        — RLS enabled on all four masters; the four pinned policy
               shapes per table (SELECT staff-or-admin; INSERT/UPDATE/
               DELETE admin-only via core.fn_is_admin(), UPDATE carries
               USING + WITH CHECK — the editable-master pattern, P2.1 D1-7);
               zero anon policies; the security_invoker façades exist
               (public.item / public.vendor / public.item_category /
               public.distributor + the refreshed public.lab_test and
               public.daily_check carrying the new FK columns).
  SEED       — the 6 distributor rows match EXPECTED_DISTRIBUTOR_ROWS
               exactly (generated programmatically from the source bytes:
               pond workbook ข้อมูลบ่อบำบัดประจำวัน
               1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk, tab
               'distributor' sheetId 11, full XLSX export 364,794 bytes,
               fetched read-only 2026-11-18); Items/Vendors/Categories hold
               ZERO rows (SOURCE_UNAVAILABLE — never fabricated).
  IDEMPOTENCY— re-sending the migration's guarded seed block inserts ZERO
               new rows (WHERE NOT EXISTS guard) — single-request
               BEGIN…SELECT…ROLLBACK smoke, canary-gated so the batch is
               never sent while core.distributor is absent; zero durable
               writes asserted by pre/post count equality.
  HONESTY    — blanks are NULL not '' (per-cell audit across the 6 rows ×
               6 contact columns); zero 13-digit digit-run cells (the PII
               class pin — dealer_tel values here are business landlines/
               mobiles from the sheet bytes, and the suite additionally
               asserts NO 13-digit Thai-national-ID-shaped value exists).
  COUNTS     — count reconciliation: distributor 6/6/0 (sheet 6 → seeded 6
               → skipped 0); item/vendor/item_category 0/0 with the
               SOURCE_UNAVAILABLE reconciliation; baselines wastewater.
               reading 907 / core.personnel 9 / core.equipment_spec 4 /
               safety.emergency_light 48 / safety.fire_extinguisher 0 /
               safety.emergency_light_check 332 / food.lab_test 0 intact.

Run:  uv run python -m pytest scripts/test_parity_p3_001_masters.py -q
"""

from __future__ import annotations

import re
import sys
import unittest
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent))

API_URL = (
    "https://api.supabase.com/v1/projects/gllqtbyofrcjzmbnfoeh/database/query"
)

MIGRATION = "20261118000001_parity_p3_001.sql"
MIGRATION_PATH = Path(__file__).resolve().parent.parent / "supabase/migrations" / MIGRATION

SEED_MARKER_START = "-- >>> SEED-BLOCK-START"
SEED_MARKER_END = "-- <<< SEED-BLOCK-END"

# Generated programmatically from the source XLSX bytes (/tmp/env-p3-001-pond.xlsx
# 364,794 bytes, workbook ข้อมูลบ่อบำบัดประจำวัน
# 1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk, tab 'distributor' sheetId 11,
# 2026-11-18; blanks ⇒ None). legacy_id -> (dealer, dealer_email,
# dealer_address, dealer_tel, salesname, line_id) — bytes VERBATIM (D1-6).
EXPECTED_DISTRIBUTOR_ROWS = {
    'e5e76725': ('สสจ.', None, 'ตลาดเจ้าพรหม', '0822952481', 'ยุ้ย มัลลิตา ใณฑปใหญ่', None),
    '0a7abe65': ('HANNA', 'hnlab611@gmail.com', None, '0645873691', 'คุณมุก', None),
    'becdc598': ('หจก. M&P IMPEX LIMITED PARTNER', None, None, '020129044', None, None),
    'f67d5e26': ('หจก. เอส.ดับบลิว.เอ เอ็นจิเนียริ่ง เซอร์วิส', None, '23 Soi Pracha Uthit 76, Khwaeng Thung Khru, Khet Thung Khru, Krung Thep Maha Nakhon 10140, Thailand', '02-873-8880', 'S.W.A.', 'S.W.A.'),
    '262d81ee': ('หจก. ปุณยธร', 'poonyatorn.aya@hotmail.com', '41/1 หมู่ 2ซ.ชัยมงคล 14 ถ.สายสนามกีฬา-วัดรพะญาติการาม ไผ่ลิง 13000', '0871174977', None, None),
    '96e0f383': ('หจก.วอเตอร์ ชอยส', None, '56 ซ. สุภาพงษ์ แขวงหยองบอน เขตประเวศ กรุงเทพมหานคร 10250 ประเทศไทย', '0897993309', None, None),
}

DISTRIBUTOR_LEGACY_IDS = list(EXPECTED_DISTRIBUTOR_ROWS)

PROVENANCE = "AppSheet Sheets export 2026-11-18"

MASTER_TABLES = ("item_category", "vendor", "item", "distributor")

# Pinned column shapes: (table, column, data_type, nullable) — the house
# snake_case mappings of ref 12 §3.27/§3.31/§3.29/§3.15 (see the migration
# header for the verbatim-name pins).
EXPECTED_COLUMNS = [
    # core.item_category (§3.27 Categories — 4 cols)
    ("item_category", "id", "uuid", "NO"),
    ("item_category", "category", "text", "YES"),
    ("item_category", "icon_path", "text", "YES"),
    ("item_category", "source_provenance", "text", "NO"),
    ("item_category", "legacy_id", "text", "YES"),
    # core.vendor (§3.31 Vendors — 9 cols incl. system _RowNumber; Related Items virtual OUT)
    ("vendor", "id", "uuid", "NO"),
    ("vendor", "name", "text", "YES"),
    ("vendor", "logo_path", "text", "YES"),
    ("vendor", "url", "text", "YES"),
    ("vendor", "phone", "text", "YES"),
    ("vendor", "email", "text", "YES"),
    ("vendor", "address", "text", "YES"),
    ("vendor", "source_provenance", "text", "NO"),
    ("vendor", "legacy_id", "text", "YES"),
    # core.item (§3.29 Items — the 15 persisted AppSheet cols + the D1-4
    # category FK + source_provenance; the 4 Related… virtuals OUT)
    ("item", "id", "uuid", "NO"),
    ("item", "name", "text", "YES"),
    ("item", "description", "text", "YES"),
    ("item", "image_path", "text", "YES"),
    ("item", "category_legacy", "text", "YES"),
    ("item", "category_id", "uuid", "YES"),
    ("item", "vendor_id", "uuid", "YES"),
    ("item", "purchase_cost", "numeric", "YES"),
    ("item", "unit_count_num", "numeric", "YES"),
    ("item", "unit_count", "text", "YES"),
    ("item", "unit_formula", "text", "YES"),
    ("item", "unit_use_num", "numeric", "YES"),
    ("item", "unit_calculate", "text", "YES"),
    ("item", "user_manual_path", "text", "YES"),
    ("item", "min_qty", "numeric", "YES"),
    ("item", "max_qty", "numeric", "YES"),
    ("item", "source_provenance", "text", "NO"),
    ("item", "legacy_id", "text", "YES"),
    # core.distributor (§3.15 — 8 cols incl. system _RowNumber)
    ("distributor", "id", "uuid", "NO"),
    ("distributor", "dealer", "text", "YES"),
    ("distributor", "dealer_email", "text", "YES"),
    ("distributor", "dealer_address", "text", "YES"),
    ("distributor", "dealer_tel", "text", "YES"),
    ("distributor", "salesname", "text", "YES"),
    ("distributor", "line_id", "text", "YES"),
    ("distributor", "source_provenance", "text", "NO"),
    ("distributor", "legacy_id", "text", "YES"),
]

PRIMARY_KEYS = {t: ["id"] for t in MASTER_TABLES}

EXPECTED_POLICIES = {
    ("item_category", "item_category_read"): ("SELECT", "core.fn_is_staff_or_admin()"),
    ("item_category", "item_category_insert_admin"): ("INSERT", "core.fn_is_admin()"),
    ("item_category", "item_category_update_admin"): ("UPDATE", "core.fn_is_admin()"),
    ("item_category", "item_category_delete_admin"): ("DELETE", "core.fn_is_admin()"),
    ("vendor", "vendor_read"): ("SELECT", "core.fn_is_staff_or_admin()"),
    ("vendor", "vendor_insert_admin"): ("INSERT", "core.fn_is_admin()"),
    ("vendor", "vendor_update_admin"): ("UPDATE", "core.fn_is_admin()"),
    ("vendor", "vendor_delete_admin"): ("DELETE", "core.fn_is_admin()"),
    ("item", "item_read"): ("SELECT", "core.fn_is_staff_or_admin()"),
    ("item", "item_insert_admin"): ("INSERT", "core.fn_is_admin()"),
    ("item", "item_update_admin"): ("UPDATE", "core.fn_is_admin()"),
    ("item", "item_delete_admin"): ("DELETE", "core.fn_is_admin()"),
    ("distributor", "distributor_read"): ("SELECT", "core.fn_is_staff_or_admin()"),
    ("distributor", "distributor_insert_admin"): ("INSERT", "core.fn_is_admin()"),
    ("distributor", "distributor_update_admin"): ("UPDATE", "core.fn_is_admin()"),
    ("distributor", "distributor_delete_admin"): ("DELETE", "core.fn_is_admin()"),
}

FAÇADE_VIEWS = ("item", "vendor", "item_category", "distributor")


def _token() -> str:
    from _env import load_secret

    tok = load_secret("SUPABASE_ACCESS_TOKEN")
    if not tok:
        raise unittest.SkipTest("SUPABASE_ACCESS_TOKEN not resolvable (Drive secrets offline)")
    return tok


_TOKEN = _token()


def q(sql: str):
    """One Management-API query. Raises AssertionError carrying the real
    DB error on failure — a RED must show the true reason (e.g.
    relation "core.item" does not exist)."""
    r = httpx.post(
        API_URL,
        headers={"Authorization": f"Bearer {_TOKEN}", "Content-Type": "application/json"},
        json={"query": sql},
        timeout=60,
    )
    if r.status_code >= 400:
        try:
            msg = r.json().get("message") or r.text
        except Exception:
            msg = r.text
        raise AssertionError(f"DB query failed ({r.status_code}): {msg}")
    return r.json()


def _seed_block() -> str:
    text = MIGRATION_PATH.read_text(encoding="utf-8")
    start = text.index(SEED_MARKER_START)
    end = text.index(SEED_MARKER_END)
    return text[start:end]


def _seed_statements() -> list[str]:
    from apply_migration_api import split_sql

    return [s for s in split_sql(_seed_block()) if s.strip()]


def _counts_sql() -> str:
    return (
        "SELECT (SELECT count(*) FROM core.distributor) AS distributor,"
        " (SELECT count(*) FROM core.item) AS item,"
        " (SELECT count(*) FROM core.vendor) AS vendor,"
        " (SELECT count(*) FROM core.item_category) AS item_category"
    )


class P3MastersContract(unittest.TestCase):
    """Live contract for the P3.1 masters + bindings."""

    # ─────────────────────────── SCHEMA ────────────────────────────

    def test_master_tables_exist(self):
        for t in MASTER_TABLES:
            reg = q(f"SELECT to_regclass('core.{t}') AS reg")[0]["reg"]
            self.assertIsNotNone(reg, f"core.{t} does not exist")

    def test_table_owner_is_postgres(self):
        for t in MASTER_TABLES:
            rows = q(
                "SELECT tableowner FROM pg_tables"
                " WHERE schemaname='core' AND tablename='" + t + "'"
            )
            self.assertEqual(rows[0]["tableowner"], "postgres", f"core.{t} owner")

    def test_column_shapes(self):
        rows = q(
            "SELECT table_name, column_name, data_type, is_nullable"
            " FROM information_schema.columns"
            " WHERE table_schema='core'"
            " AND table_name IN ('item_category','vendor','item','distributor')"
            " ORDER BY table_name, ordinal_position"
        )
        actual = {(r["table_name"], r["column_name"]): (r["data_type"], r["is_nullable"]) for r in rows}
        for table, column, dtype, nullable in EXPECTED_COLUMNS:
            key = (table, column)
            self.assertIn(key, actual, f"missing column core.{table}.{column}")
            self.assertEqual(
                actual[key],
                (dtype, nullable),
                f"core.{table}.{column} shape (type/nullability)",
            )
        extra = set(actual) - {(t, c) for t, c, _, _ in EXPECTED_COLUMNS}
        self.assertEqual(extra, set(), f"unexpected extra columns in core masters: {sorted(extra)}")

    def test_primary_keys(self):
        rows = q(
            "SELECT tc.table_name, kcu.column_name"
            " FROM information_schema.table_constraints tc"
            " JOIN information_schema.key_column_usage kcu"
            " ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema"
            " WHERE tc.table_schema='core' AND tc.constraint_type='PRIMARY KEY'"
            " AND tc.table_name IN ('item_category','vendor','item','distributor')"
            " ORDER BY tc.table_name, kcu.ordinal_position"
        )
        pks: dict[str, list[str]] = {}
        for r in rows:
            pks.setdefault(r["table_name"], []).append(r["column_name"])
        self.assertEqual(pks, PRIMARY_KEYS)

    def test_legacy_id_unique_on_all_four(self):
        rows = q(
            "SELECT tc.table_name"
            " FROM information_schema.table_constraints tc"
            " WHERE tc.table_schema='core' AND tc.constraint_type='UNIQUE'"
            " AND tc.table_name IN ('item_category','vendor','item','distributor')"
        )
        names = {r["table_name"] for r in rows}
        self.assertEqual(names, set(MASTER_TABLES), "legacy_id UNIQUE must exist on all four masters")

    def test_item_foreign_keys(self):
        rows = q(
            "SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint"
            " WHERE conrelid = 'core.item'::regclass AND contype='f'"
        )
        defs = {r["conname"]: r["def"] for r in rows}
        self.assertTrue(
            any("category_id" in d and "core.item_category" in d for d in defs.values()),
            f"core.item must carry the category FK — got {defs}",
        )
        self.assertTrue(
            any("vendor_id" in d and "core.vendor" in d for d in defs.values()),
            f"core.item must carry the vendor FK — got {defs}",
        )

    def test_binding_lab_equipment_id_fk(self):
        """D1-4 — food.lab_test.equipment_id uuid NULL FK → core.item(id);
        the verbatim equipment_legacy column stays untouched."""
        rows = q(
            "SELECT column_name, data_type, is_nullable"
            " FROM information_schema.columns"
            " WHERE table_schema='food' AND table_name='lab_test' AND column_name='equipment_id'"
        )
        self.assertEqual(len(rows), 1, "food.lab_test.equipment_id must exist")
        self.assertEqual((rows[0]["data_type"], rows[0]["is_nullable"]), ("uuid", "YES"))
        fk = q(
            "SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint"
            " WHERE conrelid = 'food.lab_test'::regclass AND contype='f'"
            " AND pg_get_constraintdef(oid) LIKE '%equipment_id%'"
        )
        self.assertTrue(fk, "food.lab_test.equipment_id FK → core.item(id) missing")
        legacy = q(
            "SELECT count(*) AS n FROM information_schema.columns"
            " WHERE table_schema='food' AND table_name='lab_test' AND column_name='equipment_legacy'"
        )[0]["n"]
        self.assertEqual(legacy, 1, "equipment_legacy verbatim column must remain (lineage)")

    def test_binding_water_instrument_id_fk(self):
        """D1-3 — water_supply.daily_check.instrument_id uuid NULL FK →
        core.item(id) (น้ำประปา.ชนิดเครื่องมือตรวจ Ref→Items, ref 2397 +
        §4 line 5605)."""
        rows = q(
            "SELECT column_name, data_type, is_nullable"
            " FROM information_schema.columns"
            " WHERE table_schema='water_supply' AND table_name='daily_check' AND column_name='instrument_id'"
        )
        self.assertEqual(len(rows), 1, "water_supply.daily_check.instrument_id must exist")
        self.assertEqual((rows[0]["data_type"], rows[0]["is_nullable"]), ("uuid", "YES"))
        fk = q(
            "SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint"
            " WHERE conrelid = 'water_supply.daily_check'::regclass AND contype='f'"
            " AND pg_get_constraintdef(oid) LIKE '%instrument_id%'"
        )
        self.assertTrue(fk, "water_supply.daily_check.instrument_id FK → core.item(id) missing")

    def test_no_hard_check_on_category_legacy(self):
        """The Category enum tokens are a UI-restricted verbatim list — NO
        hard CHECK (P1.001 lesson; D1-8)."""
        rows = q(
            "SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint"
            " WHERE conrelid = 'core.item'::regclass AND contype='c'"
        )
        offenders = [r for r in rows if "category_legacy" in (r["def"] or "")]
        self.assertEqual(offenders, [], "category_legacy must carry NO hard CHECK (D1-8)")

    def test_provenance_defaults(self):
        rows = q(
            "SELECT table_name, column_default FROM information_schema.columns"
            " WHERE table_schema='core' AND column_name='source_provenance'"
            " AND table_name IN ('item_category','vendor','item','distributor')"
            " ORDER BY table_name"
        )
        self.assertEqual(len(rows), 4, "source_provenance on all four masters")
        for r in rows:
            self.assertIn(PROVENANCE, r["column_default"] or "", f"provenance default on {r['table_name']}")

    # ───────────────────────────── RLS ─────────────────────────────

    def test_rls_enabled(self):
        for t in MASTER_TABLES:
            rows = q(
                "SELECT relrowsecurity FROM pg_class"
                " WHERE oid = 'core.%s'::regclass" % t
            )
            self.assertTrue(rows[0]["relrowsecurity"], f"RLS not enabled on core.{t}")

    def test_policy_shapes(self):
        rows = q(
            "SELECT tablename, policyname, cmd, roles, qual, with_check"
            " FROM pg_policies WHERE schemaname='core'"
            " AND tablename IN ('item_category','vendor','item','distributor')"
        )
        actual = {(r["tablename"], r["policyname"]): r for r in rows}
        for (table, name), (cmd, predicate) in EXPECTED_POLICIES.items():
            key = (table, name)
            self.assertIn(key, actual, f"missing policy {name} on core.{table}")
            pol = actual[key]
            self.assertEqual(pol["cmd"], cmd, f"policy {name} cmd")
            self.assertEqual(pol["roles"], "{authenticated}", f"policy {name} roles")
            body = (pol["qual"] or "") + " " + (pol["with_check"] or "")
            self.assertIn(predicate, body, f"policy {name} predicate must use {predicate}")
            if cmd == "UPDATE":
                self.assertTrue(pol["qual"] and pol["with_check"], f"policy {name} needs both USING and WITH CHECK")
        self.assertEqual(
            set(actual),
            set(EXPECTED_POLICIES),
            f"unexpected/missing policies on core masters: {sorted(set(actual) ^ set(EXPECTED_POLICIES))}",
        )

    def test_no_anon_policies_on_core_masters(self):
        rows = q(
            "SELECT tablename, policyname FROM pg_policies"
            " WHERE schemaname='core'"
            " AND tablename IN ('item_category','vendor','item','distributor')"
            " AND 'anon' = ANY (roles::name[])"
        )
        self.assertEqual(rows, [], "no policy may target anon (fail-closed by default)")

    def test_facades_exist_and_carry_new_columns(self):
        for v in FAÇADE_VIEWS:
            reg = q(f"SELECT to_regclass('public.{v}') AS reg")[0]["reg"]
            self.assertIsNotNone(reg, f"public.{v} façade missing")
            opts = q(
                "SELECT reloptions FROM pg_class WHERE oid = 'public.%s'::regclass" % v
            )[0]["reloptions"]
            self.assertIn("security_invoker=on", " ".join(opts or []), f"public.{v} must be security_invoker=on")
        lab = q(
            "SELECT count(*) AS n FROM information_schema.columns"
            " WHERE table_schema='public' AND table_name='lab_test' AND column_name='equipment_id'"
        )[0]["n"]
        self.assertEqual(lab, 1, "public.lab_test façade must expose equipment_id (the P2.4 select*-expansion lesson)")
        daily = q(
            "SELECT count(*) AS n FROM information_schema.columns"
            " WHERE table_schema='public' AND table_name='daily_check' AND column_name='instrument_id'"
        )[0]["n"]
        self.assertEqual(daily, 1, "public.daily_check façade must expose instrument_id")

    # ──────────────────────────── SEED ─────────────────────────────

    def test_seed_ids_exact(self):
        rows = q("SELECT legacy_id FROM core.distributor ORDER BY legacy_id")
        self.assertEqual(
            [r["legacy_id"] for r in rows],
            sorted(DISTRIBUTOR_LEGACY_IDS),
            "legacy ids must be exactly the 6 verbatim 8-hex UNIQUEID() values",
        )

    def test_seed_rows_exact(self):
        rows = q(
            "SELECT legacy_id, dealer, dealer_email, dealer_address, dealer_tel,"
            " salesname, line_id FROM core.distributor ORDER BY legacy_id"
        )
        self.assertEqual(len(rows), 6, f"expected 6 seeded rows, got {len(rows)}")
        for r in rows:
            lid = r["legacy_id"]
            self.assertIn(lid, EXPECTED_DISTRIBUTOR_ROWS, f"unexpected legacy id {lid}")
            exp = EXPECTED_DISTRIBUTOR_ROWS[lid]
            act = (
                r["dealer"], r["dealer_email"], r["dealer_address"],
                r["dealer_tel"], r["salesname"], r["line_id"],
            )
            self.assertEqual(act, exp, f"row {lid} mismatch vs sheet bytes")

    def test_seed_traceability(self):
        rows = q(
            "SELECT legacy_id FROM core.distributor"
            " WHERE source_provenance <> '" + PROVENANCE + "'"
        )
        self.assertEqual(rows, [], "every seeded row must pin the provenance")

    def test_id_vendors_categories_zero_rows_source_unavailable(self):
        """D1-2 — Items/Vendors/Categories are SOURCE_UNAVAILABLE; seed
        NOTHING, never fabricated (the standing P2-001…P2-006 ruling)."""
        counts = q(_counts_sql())[0]
        self.assertEqual(counts["item"], 0, "core.item must hold ZERO rows — Items master SOURCE_UNAVAILABLE")
        self.assertEqual(counts["vendor"], 0, "core.vendor must hold ZERO rows — Vendors master SOURCE_UNAVAILABLE")
        self.assertEqual(counts["item_category"], 0, "core.item_category must hold ZERO rows — Categories master SOURCE_UNAVAILABLE")

    # ──────────────────────── IDEMPOTENCY ──────────────────────────

    def test_seed_block_reapply_is_noop(self):
        """Canary-gated single-request rollback smoke: re-send the guarded
        seed block; ZERO rows may be inserted; durable state unchanged."""
        reg = q("SELECT to_regclass('core.distributor') AS reg")[0]["reg"]
        if reg is None:
            self.fail("canary: core.distributor absent — seed block NOT sent (truthful RED)")
        before = q(_counts_sql())[0]
        stmts = _seed_statements()
        self.assertEqual(len(stmts), 6, f"seed block must carry 6 statements, got {len(stmts)}")
        batch = "BEGIN;\n" + "\n".join(stmts) + f"\n{_counts_sql()};\nROLLBACK;"
        r = httpx.post(
            API_URL,
            headers={"Authorization": f"Bearer {_TOKEN}", "Content-Type": "application/json"},
            json={"query": batch},
            timeout=120,
        )
        self.assertLess(r.status_code, 400, f"seed re-send failed: {r.text[:300]}")
        during = r.json()
        self.assertEqual(during[0]["distributor"], 6, "re-send inserted rows — WHERE NOT EXISTS guard broken")
        after = q(_counts_sql())[0]
        self.assertEqual(
            (after["distributor"], after["item"], after["vendor"], after["item_category"]),
            (before["distributor"], before["item"], before["vendor"], before["item_category"]),
            "durable counts changed across the rollback smoke — zero-write contract broken",
        )

    # ─────────────────────────── HONESTY ───────────────────────────

    def test_blanks_are_null_not_empty(self):
        rows = q(
            "SELECT"
            " count(*) FILTER (WHERE dealer = '') AS dealer_empty,"
            " count(*) FILTER (WHERE dealer_email = '') AS email_empty,"
            " count(*) FILTER (WHERE dealer_address = '') AS addr_empty,"
            " count(*) FILTER (WHERE dealer_tel = '') AS tel_empty,"
            " count(*) FILTER (WHERE salesname = '') AS sales_empty,"
            " count(*) FILTER (WHERE line_id = '') AS line_empty"
            " FROM core.distributor"
        )[0]
        for key in ("dealer_empty", "email_empty", "addr_empty", "tel_empty", "sales_empty", "line_empty"):
            self.assertEqual(rows[key], 0, f"{key}: blank cells must be NULL (unknown ≠ '')")

    def test_null_shape_matches_sheet_bytes(self):
        rows = q(
            "SELECT"
            " count(*) FILTER (WHERE dealer_email IS NULL) AS email_null,"
            " count(*) FILTER (WHERE dealer_address IS NULL) AS addr_null,"
            " count(*) FILTER (WHERE dealer_tel IS NULL) AS tel_null,"
            " count(*) FILTER (WHERE salesname IS NULL) AS sales_null,"
            " count(*) FILTER (WHERE line_id IS NULL) AS line_null"
            " FROM core.distributor"
        )[0]
        self.assertEqual(rows["email_null"], 3, "3 blank dealer_email cells must be NULL")
        self.assertEqual(rows["addr_null"], 2, "2 blank dealer_address cells must be NULL")
        self.assertEqual(rows["tel_null"], 0, "dealer_tel is filled on all 6 sheet rows")
        self.assertEqual(rows["sales_null"], 3, "3 blank salesname cells must be NULL")
        self.assertEqual(rows["line_null"], 4, "4 blank lineID cells must be NULL")

    def test_no_13_digit_national_id_shaped_value(self):
        """The PII pin: Employee_id IS the Thai national ID — no 13-digit
        digit-run may appear anywhere in the seeded master (dealer_tel
        values are 9–10-digit business numbers)."""
        rows = q(
            "SELECT legacy_id, dealer_tel, salesname FROM core.distributor"
        )
        offenders = [
            r["legacy_id"]
            for r in rows
            if re.search(r"\d{13}", " ".join(filter(None, (r["dealer_tel"], r["salesname"]))))
        ]
        self.assertEqual(offenders, [], "no 13-digit digit-run may appear in any seeded value")

    # ───────────────────── COUNT-RECONCILIATION ────────────────────

    def test_count_reconciliation(self):
        rows = q(
            "SELECT"
            " (SELECT count(*) FROM core.distributor) AS distributor,"
            " (SELECT count(*) FROM core.item) AS item,"
            " (SELECT count(*) FROM core.vendor) AS vendor,"
            " (SELECT count(*) FROM core.item_category) AS item_category,"
            " (SELECT count(*) FROM wastewater.reading) AS reading,"
            " (SELECT count(*) FROM core.personnel) AS personnel,"
            " (SELECT count(*) FROM core.equipment_spec) AS equipment_spec,"
            " (SELECT count(*) FROM safety.emergency_light) AS light,"
            " (SELECT count(*) FROM safety.fire_extinguisher) AS ext,"
            " (SELECT count(*) FROM safety.emergency_light_check) AS elc,"
            " (SELECT count(*) FROM food.lab_test) AS lab_test"
        )[0]
        self.assertEqual(rows["distributor"], 6, "WO §2: sheet 6 → seeded 6, skipped 0")
        self.assertEqual(rows["item"], 0, "Items SOURCE_UNAVAILABLE → 0 rows")
        self.assertEqual(rows["vendor"], 0, "Vendors SOURCE_UNAVAILABLE → 0 rows")
        self.assertEqual(rows["item_category"], 0, "Categories SOURCE_UNAVAILABLE → 0 rows")
        self.assertEqual(rows["reading"], 907, "wastewater.reading baseline untouched")
        self.assertEqual(rows["personnel"], 9, "core.personnel baseline untouched")
        self.assertEqual(rows["equipment_spec"], 4, "core.equipment_spec baseline untouched")
        self.assertEqual(rows["light"], 48, "safety.emergency_light baseline untouched")
        self.assertEqual(rows["ext"], 0, "safety.fire_extinguisher baseline untouched")
        self.assertEqual(rows["elc"], 332, "safety.emergency_light_check baseline untouched")
        self.assertEqual(rows["lab_test"], 0, "food.lab_test baseline untouched (0 rows)")


if __name__ == "__main__":
    unittest.main(verbosity=2)
