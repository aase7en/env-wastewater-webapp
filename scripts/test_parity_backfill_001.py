"""ENV-BACKFILL-001 C1 — D2 RED-first live contract battery for the Phase-5
backfill seed from the owner's 2026-11-24 shared sources (WO
docs/work-orders/ENV-BACKFILL-001.md; claim ENV-BACKFILL-001-C1, Track-Z GLM).

Queries ENV_DB (project gllqtbyofrcjzmbnfoeh, ap-southeast-1) through the
same Management-API access path as scripts/apply_migration_api.py
(scripts/_env.py; SUPABASE_ACCESS_TOKEN from Drive secrets — never printed).

Every count/shape contract must FAIL truthfully while migration
20261124000000_backfill_001.sql is UNAPPLIED (the RED record goes in the
handoff) and pass GREEN after. The pre-existing baseline group passes both
before and after (zero-unanticipated-writes canary).

Pinned count contracts (WO §2 data-row truth; D1-7 deviation for
chemical.inventory_lot — 5 source rows are unrepresentable in the shipped
NOT NULL/CHECK shape without a forbidden DDL change, disclosed, never
coerced):

  safety.fire_extinguisher        0  ->  30   (derived latest-per-QR master)
  safety.extinguisher_inspection  0  ->  882  (full history)
  safety.emergency_light          48 ->  48   (set-diff 0 new — header-count
                                              artifact confirmed)
  safety.emergency_light_check    332->  351  (+19 net new)
  core.item_category              0  ->  3
  core.vendor                     0  ->  6
  core.item                       0  ->  24
  core.distributor                6  ->   6   (untouched)
  chemical.inventory_lot          0  ->  33   (38 census − 5 disclosed skips)
  core.item_calibration           11 ->  51   (+40; 11∩40 = ∅, D1-4)

D1 pins verified in this suite: legacy_row_id = QR_CODE verbatim (22-char);
latest-per-QR by max Date_time with first-occurrence tie-break (0 ties);
inspector/auditor → personnel-UUID-or-NULL (deterministic exact-full-name
match — 0/6 matched ⇒ ALL NULL; names NEVER committed/printed — the PII
absence probes read the names from the /tmp source at runtime into memory
only); blanks ⇒ NULL; fire/light sheets พ.ศ. D/M/Y → ISO (−543);
Items-sheet Inventory/maintenance ค.ศ. US M/D/Y → ISO; log datetimes are
Thai local ICT (+07:00); extinguisher_inspection.id = sha256(legacy_id)[:8]
(deterministic 8-hex, 882 distinct — D1-11).

Source of truth: /tmp/env-links-2026-11-24/ (the owner's 2026-11-24 share;
stays /tmp-only per WO §3.2 — NEVER committed). Family contracts skip
honestly when the snapshot is absent on the machine.

Run:
  A_WIKI_DRIVE_PATH=<drive root> python3 -m pytest \\
      scripts/test_parity_backfill_001.py -q
"""

from __future__ import annotations

import csv
import hashlib
import re
import sys
import unittest
from datetime import datetime
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent))

API_URL = (
    "https://api.supabase.com/v1/projects/gllqtbyofrcjzmbnfoeh/database/query"
)

MIGRATION = "20261124000000_backfill_001.sql"
MIGRATION_PATH = Path(__file__).resolve().parent.parent / "supabase/migrations" / MIGRATION
SRC = Path("/tmp/env-links-2026-11-24")

FIRE_CSV = SRC / "15EjQ9Ze3LsbUlCxWsm5p2PB_a8KD6o-7_c21I7f3s_E__tab__ตรวจสอบถัง.csv"
ELIGHT_CSV = SRC / "1iqSxixJxPApUOYNFFvw2cgH4zD7lPcC_tPzNs2QePAw__tab__Emergency_light.csv"
CHECK_CSV = SRC / "1iqSxixJxPApUOYNFFvw2cgH4zD7lPcC_tPzNs2QePAw__tab__Check.csv"
ITEMS_CSV = SRC / "1lLKTXEYx83zukwb0JmyVFjB_VFXHtx-lfpiVyJvRaxI__tab__Items.csv"
VENDORS_CSV = SRC / "1lLKTXEYx83zukwb0JmyVFjB_VFXHtx-lfpiVyJvRaxI__tab__Vendors.csv"
CATS_CSV = SRC / "1lLKTXEYx83zukwb0JmyVFjB_VFXHtx-lfpiVyJvRaxI__tab__Categories.csv"
INV_CSV = SRC / "1lLKTXEYx83zukwb0JmyVFjB_VFXHtx-lfpiVyJvRaxI__tab__Inventory.csv"
MAINT_CSV = SRC / "1lLKTXEYx83zukwb0JmyVFjB_VFXHtx-lfpiVyJvRaxI__tab__maintenance.csv"

SEED_MARKER_START = "-- >>> SEED-BLOCK-START"
SEED_MARKER_END = "-- <<< SEED-BLOCK-END"

FIRE_PROVENANCE = (
    "DERIVED-FROM-LOG 2026-11-24 (latest-per-QR_CODE from the 882-row "
    "ตรวจสอบถัง export; tie-break first-occurrence; ENV-BACKFILL-001)"
)
FIRE_INSPECTION_PROVENANCE = "AppSheet ตรวจสอบถัง export 2026-11-24 (ENV-BACKFILL-001)"
LIGHT_CHECK_PROVENANCE = "AppSheet Check export 2026-11-24 (ENV-BACKFILL-001)"
ITEMS_PROVENANCE = "AppSheet Items-sheet export 2026-11-24 (ENV-BACKFILL-001)"
P23_SEED_PROVENANCE_PREFIX = "AppSheet Sheets export Check 2026-11-17"

# D1-7 — the five disclosed inventory skips (CHECK-inviolable at source;
# never coerced, never silently dropped — asserted absent post-apply).
INV_SKIPS = {
    "e102936e": "Amount 0 — inventory_lot_amount_positive CHECK (> 0)",
    "be012199": "Amount −25 (negative correction) — CHECK (> 0)",
    "67f9a938": "Amount −15 (negative correction) — CHECK (> 0)",
    "27bae2e0": "Amount_unit_deduct 20 > Amount 1 — remaining CHECK",
    "8ad18e5a": "Amount_unit_deduct 2 > Amount 1 — remaining CHECK",
}

BASELINES = {
    ("wastewater", "reading"): 907,
    ("core", "personnel"): 9,
    ("core", "equipment_spec"): 4,
    ("core", "distributor"): 6,
}

TARGET_COUNTS = {
    "safety.fire_extinguisher": 30,
    "safety.extinguisher_inspection": 882,
    "safety.emergency_light": 48,
    "safety.emergency_light_check": 351,
    "core.item_category": 3,
    "core.vendor": 6,
    "core.item": 24,
    "chemical.inventory_lot": 33,
    "core.item_calibration": 51,
}

TARGET_TABLES = [
    "safety.fire_extinguisher", "safety.extinguisher_inspection",
    "safety.emergency_light", "safety.emergency_light_check",
    "core.item_category", "core.vendor", "core.item",
    "chemical.inventory_lot", "core.item_calibration",
]

TARGET_POLICIES = 4  # per-table policy count (house shape) — zero drift pin


def _token() -> str:
    from _env import load_secret

    tok = load_secret("SUPABASE_ACCESS_TOKEN")
    if not tok:
        raise unittest.SkipTest("SUPABASE_ACCESS_TOKEN not resolvable (Drive secrets offline)")
    return tok


_TOKEN = _token()


def q(sql: str):
    """One Management-API query. Raises AssertionError carrying the real
    DB error on failure — a RED must show the true reason."""
    r = httpx.post(
        API_URL,
        headers={"Authorization": f"Bearer {_TOKEN}", "Content-Type": "application/json"},
        json={"query": sql},
        timeout=120,
    )
    if r.status_code >= 400:
        try:
            msg = r.json().get("message") or r.text
        except Exception:
            msg = r.text
        raise AssertionError(f"DB query failed ({r.status_code}): {msg[:400]}")
    return r.json()


def _csv(path: Path):
    with open(path, newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def _thai_dt(s: str):
    """พ.ศ. D/M/Y [HH:MM:SS] → datetime (CE), or None when blank; raises on
    an unparsable non-blank cell (the Feb-29 lesson: an honest failure beats
    a silent guess)."""
    s = (s or "").strip()
    if not s:
        return None
    m = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})(?:\s+(\d{1,2}):(\d{2}):(\d{2}))?$", s)
    if not m:
        raise ValueError("unparsable พ.ศ. cell (value withheld)")
    d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3)) - 543
    return datetime(y, mo, d, int(m.group(4) or 0), int(m.group(5) or 0), int(m.group(6) or 0))


def _us_date(s: str):
    """ค.ศ. US M/D/Y → date-ISO, or None when blank."""
    s = (s or "").strip()
    if not s:
        return None
    m = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})$", s)
    if not m:
        raise ValueError("unparsable ค.ศ. cell (value withheld)")
    return datetime(int(m.group(3)), int(m.group(1)), int(m.group(2))).date().isoformat()


def _money(s: str):
    """AppSheet Price text ('$9,844.00') → float, or None when blank."""
    s = (s or "").strip().replace("$", "").replace(",", "")
    return float(s) if s else None


def _derived_master_rows():
    """The WO §3.3 derivation re-implemented independently: latest-per-QR
    by max Date_time, tie-break first-occurrence-in-export-order."""
    rows = _csv(FIRE_CSV)
    per: dict[str, list[int]] = {}
    for i, r in enumerate(rows):
        per.setdefault(r["QR_CODE"], []).append(i)
    out = []
    for qr, idxs in per.items():
        cands = [i for i in idxs if _thai_dt(rows[i]["Date_time"]) is not None]
        mx = max(_thai_dt(rows[i]["Date_time"]) for i in cands)
        best = min(i for i in cands if _thai_dt(rows[i]["Date_time"]) == mx)
        out.append((qr, rows[best]))
    return rows, out


def _inspection_id(legacy: str) -> str:
    return hashlib.sha256(legacy.encode("utf-8")).hexdigest()[:8]


def _count_query(tables):
    return "SELECT " + ", ".join(
        f"(SELECT count(*) FROM {t}) AS t{i}" for i, t in enumerate(tables)
    )


_SOURCES_PRESENT = all(p.exists() for p in (FIRE_CSV, ELIGHT_CSV, CHECK_CSV, ITEMS_CSV,
                                            VENDORS_CSV, CATS_CSV, INV_CSV, MAINT_CSV))
_MIGRATION_PRESENT = MIGRATION_PATH.exists()


class CountsProbe(unittest.TestCase):
    """Pre-existing baselines — pass BOTH pre- and post-apply (the
    zero-unanticipated-writes canary)."""

    def test_baseline_counts_intact(self):
        parts = [
            f"(SELECT count(*) FROM {s}.{t}) AS {s.replace('_', '')}{t.replace('_', '')}"
            for (s, t) in BASELINES
        ]
        row = q("SELECT " + ", ".join(parts))[0]
        for (s, t), expected in BASELINES.items():
            key = s.replace("_", "") + t.replace("_", "")
            self.assertEqual(row[key], expected, f"baseline {s}.{t} drifted")

    def test_target_policies_undrifted(self):
        """The backfill is INSERT-only — no policy/DDL drift allowed."""
        reg = ",".join(f"'{t}'::regclass" for t in TARGET_TABLES)
        rows = q(
            "SELECT c.oid::regclass::text AS tbl, count(p.oid) AS pols"
            " FROM pg_class c LEFT JOIN pg_policy p ON p.polrelid = c.oid"
            f" WHERE c.oid IN ({reg}) GROUP BY 1 ORDER BY 1"
        )
        by = {r["tbl"]: r["pols"] for r in rows}
        for t in TARGET_TABLES:
            self.assertEqual(by.get(t, 0), TARGET_POLICIES, f"policy drift on {t}")

    def test_no_anon_policies_on_targets(self):
        reg = ",".join(f"'{t}'::regclass" for t in TARGET_TABLES)
        rows = q(
            "SELECT count(*) AS c FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid"
            f" WHERE c.oid IN ({reg})"
            " AND NOT EXISTS (SELECT 1 FROM pg_roles r WHERE r.oid = ANY (p.polroles)"
            " AND r.rolname = 'authenticated')"
        )
        self.assertEqual(rows[0]["c"], 0, "anon-visible policy found on a target table")


class BackfillCounts(unittest.TestCase):
    """The binding per-table count contracts — RED pre-apply (the honest
    0≠30 first failure), GREEN post-apply."""

    def test_counts_exact(self):
        actual = {t: q(f"SELECT count(*) AS c FROM {t}")[0]["c"] for t in TARGET_COUNTS}
        for t, expected in TARGET_COUNTS.items():
            self.assertEqual(
                actual[t], expected,
                f"count contract {t}: live {actual[t]}, pinned {expected}",
            )


@unittest.skipUnless(_SOURCES_PRESENT, "source snapshot /tmp/env-links-2026-11-24 absent on this machine")
class FireMasterContract(unittest.TestCase):
    """Group 1a — the DERIVED-FROM-LOG master (WO §3.3): 30 rows, each the
    latest-per-QR snapshot, byte-equal to the independent re-derivation."""

    def test_master_rows_equal_independent_derivation(self):
        _, derived = _derived_master_rows()
        db = q(
            "SELECT legacy_row_id, location, extinguisher_type, photo_path,"
            " packed_date::text, expiry_date::text, size_label, source_provenance, legacy_id"
            " FROM safety.fire_extinguisher ORDER BY legacy_row_id"
        )
        self.assertEqual(len(db), 30, "master must hold exactly 30 rows")
        self.assertEqual({r["legacy_row_id"] for r in db}, {qr for qr, _ in derived},
                         "master key set must equal the distinct-QR census")
        by_qr = {r["legacy_row_id"]: r for r in db}
        for qr, src in derived:
            r = by_qr[qr]
            pd_, ed_ = _thai_dt(src["packing_date"]), _thai_dt(src["chem_exp"])
            expect = {
                "legacy_id": qr,
                "location": src["location"].strip() or None,
                "extinguisher_type": src["type"].strip() or None,
                "packed_date": pd_.date().isoformat() if pd_ else None,
                "expiry_date": ed_.date().isoformat() if ed_ else None,
                "size_label": src["packing_weight"].strip() or None,
                "photo_path": None,
                "source_provenance": FIRE_PROVENANCE,
            }
            for k, v in expect.items():
                self.assertEqual(r[k], v, f"{k} mismatch on a derived master row (value withheld)")

    def test_out_of_documented_enum_flagged_not_rejected(self):
        """The P2.1 documented master enum has 5 values; the observed latest
        value 'น้ำ (Best Drop แบบ Low Pressure Water Mist)' (the P2.2
        inspection-side 6th enum member) is flagged in the report, never
        rejected (no CHECK exists — the observed set is asserted verbatim)."""
        db = q("SELECT DISTINCT extinguisher_type FROM safety.fire_extinguisher")
        observed = {r["extinguisher_type"] for r in db}
        self.assertEqual(
            observed,
            {"เคมีแห้ง (Dry Chemical Extinguishers)", "สารเหลวระเหย BF2000",
             "คาร์บอนไดออกไซด์ (Carbon Dioxide (CO2) Extinguishers)",
             "น้ำ (Best Drop แบบ Low Pressure Water Mist)"},
            "derived type set must equal the observed latest-per-QR census verbatim",
        )


@unittest.skipUnless(_SOURCES_PRESENT, "source snapshot /tmp/env-links-2026-11-24 absent on this machine")
class InspectionContract(unittest.TestCase):
    """Group 1b — all 882 log rows, D1 pins, PII absence."""

    def test_shape_and_pins(self):
        row = q(
            "SELECT count(*) AS total, count(DISTINCT legacy_id) AS legacy,"
            " count(DISTINCT id) AS ids,"
            " count(*) FILTER (WHERE inspector_id IS NOT NULL) AS insp,"
            " count(*) FILTER (WHERE id !~ '^[0-9a-f]{8}$') AS bad_id_shape,"
            " count(*) FILTER (WHERE location_snapshot = '' OR type_snapshot = ''"
            "   OR size_snapshot = '' OR breakdown_details = '' OR cause_of_damaged = '') AS empty_strs"
            " FROM safety.extinguisher_inspection"
        )[0]
        self.assertEqual(row["total"], 882, "all 882 log rows must be seeded")
        self.assertEqual(row["legacy"], 882, "legacy_id (row_ID) must be unique")
        self.assertEqual(row["ids"], 882, "generated 8-hex ids must be collision-free")
        self.assertEqual(row["bad_id_shape"], 0, "every id must be 8-hex (sha256[:8] pin)")
        self.assertEqual(row["insp"], 0, "inspector_id NULL everywhere (0/6 deterministic name matches)")
        self.assertEqual(row["empty_strs"], 0, "blanks must be NULL, never '' (ค่าว่างคงค่าว่าง)")

    def test_every_row_matches_source_and_resolves_fk(self):
        rows = _csv(FIRE_CSV)
        db = q(
            "SELECT id, legacy_id,"
            " to_char(inspection_date AT TIME ZONE 'Asia/Bangkok','YYYY-MM-DD HH24:MI:SS') AS ict,"
            " extinguisher_id, location_snapshot, type_snapshot,"
            " packed_date_snapshot::text, chem_exp_snapshot::text, size_snapshot,"
            " pipe, handle, tank, pressure_gauge, barrier, breakdown_details,"
            " cause_of_damaged, source_provenance FROM safety.extinguisher_inspection"
        )
        self.assertEqual(len(db), len(rows))
        by_legacy = {r["legacy_id"]: r for r in db}
        master_keys = {r["legacy_row_id"] for r in q("SELECT legacy_row_id FROM safety.fire_extinguisher")}
        mismatch = 0
        for src in rows:
            r = by_legacy.get(src["row_ID"])
            if r is None:
                mismatch += 1
                continue
            dt = _thai_dt(src["Date_time"])
            expect = {
                "id": _inspection_id(src["row_ID"]),
                "ict": dt.strftime("%Y-%m-%d %H:%M:%S"),
                "extinguisher_id": src["QR_CODE"],
                "location_snapshot": src["location"].strip() or None,
                "type_snapshot": src["type"].strip() or None,
                "packed_date_snapshot": (_thai_dt(src["packing_date"]).date().isoformat()
                                         if _thai_dt(src["packing_date"]) else None),
                "chem_exp_snapshot": (_thai_dt(src["chem_exp"]).date().isoformat()
                                      if _thai_dt(src["chem_exp"]) else None),
                "size_snapshot": src["packing_weight"].strip() or None,
                "pipe": src["pipe"].strip() or None,
                "handle": src["handle"].strip() or None,
                "tank": src["tank"].strip() or None,
                "pressure_gauge": src["pressure_gauge"].strip() or None,
                "barrier": src["barrier"].strip() or None,
                "breakdown_details": src["breakdown_details"].strip() or None,
                "cause_of_damaged": src["cause_of_damaged"].strip() or None,
                "source_provenance": FIRE_INSPECTION_PROVENANCE,
            }
            ok = r["extinguisher_id"] in master_keys
            for k, v in expect.items():
                if r[k] != v:
                    ok = False
                    break
            if not ok:
                mismatch += 1
        self.assertEqual(mismatch, 0, f"{mismatch} row(s) diverge from the CSV bytes (values withheld)")

    def test_pii_absence_full_table_probe(self):
        """The ผู้ตรวจสอบ names (read from the /tmp CSV into MEMORY only,
        never printed/committed) must not appear in any seeded text column;
        inspector_id stays NULL everywhere."""
        rows = _csv(FIRE_CSV)
        names = sorted({r["ผู้ตรวจสอบ"].strip() for r in rows if r["ผู้ตรวจสอบ"].strip()})
        self.assertEqual(len(names), 6, "distinct inspector-name census drifted")
        cols = ["location_snapshot", "type_snapshot", "size_snapshot",
                "breakdown_details", "cause_of_damaged", "source_provenance"]
        hits = 0
        for name in names:
            lit = name.replace("'", "''")
            for col in cols:
                res = q(
                    "SELECT count(*) AS c FROM safety.extinguisher_inspection "
                    f"WHERE {col} ILIKE '%{lit}%'"
                )
                hits += res[0]["c"]
        self.assertEqual(hits, 0, "an inspector-name token leaked into seeded rows (count only reported)")


@unittest.skipUnless(_SOURCES_PRESENT, "source snapshot /tmp/env-links-2026-11-24 absent on this machine")
class LightDeltaContract(unittest.TestCase):
    """Group 2 — master set-diff (0 new, byte-equal) + Check +19 net-new."""

    def test_master_undrifted_and_unchanged(self):
        csv_rows = _csv(ELIGHT_CSV)
        db = {r["erl_id"]: r for r in q(
            "SELECT erl_id, location, pic_path, receive_date::text, location_floor, providers"
            " FROM safety.emergency_light")}
        self.assertEqual(len(db), 48, "master stays 48 (the +1 prose count is the header artifact)")
        drift = []
        for src in csv_rows:
            r = db.get(src["ERL_ID"])
            if r is None:
                drift.append(src["ERL_ID"])
                continue
            floor = int(src["location_floor"]) if src["location_floor"].strip() else None
            rd = _thai_dt(src["Receive_date"])
            same = (r["location"] == src["location"]
                    and (r["pic_path"] or None) == (src["Pic"].strip() or None)
                    and (r["receive_date"] or None) == (rd.date().isoformat() if rd else None)
                    and r["location_floor"] == floor
                    and (r["providers"] or None) == (src["Providers"].strip() or None))
            if not same:
                drift.append(src["ERL_ID"])
        self.assertEqual(drift, [], "master drift must pivot to the coordinator, never silently updated")

    def test_check_351_with_exact_19_net_new(self):
        csv_ids = {r["row_ID"] for r in _csv(CHECK_CSV)}
        db_ids = {r["legacy_id"] for r in q("SELECT legacy_id FROM safety.emergency_light_check")}
        self.assertEqual(len(db_ids), 351, "check total must be 332 + 19 = 351")
        self.assertTrue(csv_ids <= db_ids, "every CSV row_ID must be present")
        row = q(
            "SELECT count(*) FILTER (WHERE source_provenance = '" + LIGHT_CHECK_PROVENANCE
            + "') AS new_rows, count(*) FILTER (WHERE source_provenance LIKE '"
            + P23_SEED_PROVENANCE_PREFIX + "%') AS seed_rows,"
            " count(*) FILTER (WHERE auditor_id IS NOT NULL AND source_provenance = '"
            + LIGHT_CHECK_PROVENANCE + "') AS new_auditor_set,"
            " count(*) FILTER (WHERE light_id IS NULL AND source_provenance = '"
            + LIGHT_CHECK_PROVENANCE + "') AS new_unresolved"
            " FROM safety.emergency_light_check"
        )[0]
        self.assertEqual(row["new_rows"], 19, "exactly 19 net-new rows carry the backfill provenance")
        self.assertEqual(row["seed_rows"], 332, "the P2.3 seed must stay 332")
        self.assertEqual(row["new_auditor_set"], 0, "new rows carry no auditor resolution (all blank at source)")
        self.assertEqual(row["new_unresolved"], 0, "all 19 QRs resolve exact (0 NULL light_id)")

    def test_new_rows_field_equality_vs_source(self):
        csv_rows = _csv(CHECK_CSV)
        live_seed_ids = {r["legacy_id"] for r in q(
            "SELECT legacy_id FROM safety.emergency_light_check"
            f" WHERE source_provenance LIKE '{P23_SEED_PROVENANCE_PREFIX}%'")}
        new_src = [r for r in csv_rows if r["row_ID"] not in live_seed_ids]
        db = {r["legacy_id"]: r for r in q(
            "SELECT id, legacy_id, check_date::text, erl_payload, light_id, location_snapshot,"
            " persistency, position, test_result, auditor_id, auditor_legacy_id, broken_detail,"
            " pic_path, status, source_provenance FROM safety.emergency_light_check"
            f" WHERE source_provenance = '{LIGHT_CHECK_PROVENANCE}'")}
        self.assertEqual(len(new_src), 19, "net-new census")
        master_ids = {r["erl_id"] for r in q("SELECT erl_id FROM safety.emergency_light")}
        mismatch = 0
        for src in new_src:
            r = db.get(src["row_ID"])
            if r is None:
                mismatch += 1
                continue
            cd = _thai_dt(src["Date_time"])
            expect = {
                "id": src["row_ID"],
                "check_date": cd.date().isoformat(),
                "erl_payload": src["QR_CODE"],
                "light_id": src["QR_CODE"].strip() if src["QR_CODE"].strip() in master_ids else None,
                "location_snapshot": src["location"].strip() or None,
                "persistency": src["Persistency"].strip(),
                "position": src["Position"].strip(),
                "test_result": src["test_result"].strip(),
                "auditor_id": None,
                "auditor_legacy_id": None,
                "broken_detail": src["Broken_detail"].strip() or None,
                "pic_path": src["Pic"].strip() or None,
                "status": src["Status"].strip() or None,
                "source_provenance": LIGHT_CHECK_PROVENANCE,
            }
            ok = True
            for k, v in expect.items():
                if r[k] != v:
                    ok = False
                    break
            if not ok:
                mismatch += 1
        self.assertEqual(mismatch, 0, f"{mismatch} net-new row(s) diverge from CSV bytes (values withheld)")


@unittest.skipUnless(_SOURCES_PRESENT, "source snapshot /tmp/env-links-2026-11-24 absent on this machine")
class ItemsFamilyContract(unittest.TestCase):
    """Group 3a — Categories 3 / Vendors 6 / Items 24 with resolved FKs and
    verbatim contacts (compared boolean-style — values never printed)."""

    def test_categories(self):
        src = _csv(CATS_CSV)
        db = {r["legacy_id"]: r for r in q(
            "SELECT category, icon_path, source_provenance, legacy_id FROM core.item_category")}
        self.assertEqual(len(db), 3)
        mismatch = 0
        for s in src:
            r = db.get(s["ID"])
            if r is None:
                mismatch += 1
                continue
            ok = (r["category"] == (s["Category"].strip() or None)
                  and r["icon_path"] == (s["Icon"].strip() or None)
                  and r["source_provenance"] == ITEMS_PROVENANCE)
            if not ok:
                mismatch += 1
        self.assertEqual(mismatch, 0, f"{mismatch} category row(s) diverge (values withheld)")

    def test_vendors_verbatim_contacts_no_leak_in_output(self):
        src = _csv(VENDORS_CSV)
        db = {r["legacy_id"]: r for r in q(
            "SELECT name, logo_path, url, phone, email, address, source_provenance, legacy_id"
            " FROM core.vendor")}
        self.assertEqual(len(db), 6)
        mismatch = 0
        for s in src:
            r = db.get(s["ID"])
            if r is None:
                mismatch += 1
                continue
            ok = (r["name"] == s["Name"].strip()
                  and (r["logo_path"] or None) == (s["Logo"].strip() or None)
                  and (r["url"] or None) == (s["URL"].strip() or None)
                  and (r["phone"] or None) == (s["Phone"].strip() or None)
                  and (r["email"] or None) == (s["Email"].strip() or None)
                  and (r["address"] or None) == (s["Address"].strip() or None)
                  and r["source_provenance"] == ITEMS_PROVENANCE)
            if not ok:
                mismatch += 1
        self.assertEqual(mismatch, 0, f"{mismatch} vendor row(s) diverge (values withheld)")

    def test_items_24_with_resolved_refs_and_money(self):
        src = _csv(ITEMS_CSV)
        db = {r["legacy_id"]: r for r in q(
            "SELECT name, description, image_path, category_legacy, category_id, vendor_id,"
            " purchase_cost::text, unit_count_num::text, unit_count, unit_formula,"
            " unit_use_num::text, unit_calculate, user_manual_path, min_qty::text, max_qty::text,"
            " source_provenance, legacy_id FROM core.item")}
        self.assertEqual(len(db), 24)
        mismatch = 0
        for s in src:
            r = db.get(s["Item ID"])
            if r is None:
                mismatch += 1
                continue
            expect = {
                "name": s["Name"].strip() or None,
                "description": s["Description"].strip() or None,
                "image_path": s["Image"].strip() or None,
                "category_legacy": s["Category"].strip() or None,
                "unit_count": s["unit_count"].strip() or None,
                "unit_formula": s["unit_formula"].strip() or None,
                "unit_calculate": s["unit_calculate"].strip() or None,
                "user_manual_path": s["User manual"].strip() or None,
            }
            ok = r["category_id"] is not None and r["vendor_id"] is not None
            for k, v in expect.items():
                if (r[k] or None) != v:
                    ok = False
                    break
            for k, sv in [("purchase_cost", s["Purchase Cost"]), ("unit_count_num", s["unit_count_num"]),
                          ("unit_use_num", s["unit_use_num"]), ("min_qty", s["min"]), ("max_qty", s["max"])]:
                want = _money(sv)
                got = float(r[k]) if r[k] is not None else None
                if got != want:
                    ok = False
                    break
            if not ok:
                mismatch += 1
        self.assertEqual(mismatch, 0, f"{mismatch} item row(s) diverge (values withheld)")
        unbound = q("SELECT count(*) AS c FROM core.item WHERE category_id IS NULL OR vendor_id IS NULL")[0]["c"]
        self.assertEqual(unbound, 0, "every item must resolve its category/vendor FK")


@unittest.skipUnless(_SOURCES_PRESENT, "source snapshot /tmp/env-links-2026-11-24 absent on this machine")
class InventoryLotContract(unittest.TestCase):
    """Group 3b — 33 insertable lots (38 census − 5 D1-7 skips), NULL-honest
    MFG/EXP, ค.ศ. dates, item/master bindings."""

    def test_33_rows_and_skips_absent(self):
        ids = [r["Inventory ID"] for r in _csv(INV_CSV)]
        db = {r["legacy_id"] for r in q("SELECT legacy_id FROM chemical.inventory_lot")}
        self.assertEqual(len(db), 33, f"expected the 33 insertable lots, got {len(db)}")
        self.assertEqual(len(ids), 38, "CSV census stays 38")
        for skip in INV_SKIPS:
            self.assertNotIn(skip, db, f"skipped row {skip} must not be seeded")

    def test_lots_field_equality_vs_source(self):
        src = [r for r in _csv(INV_CSV) if r["Inventory ID"] not in INV_SKIPS]
        db = {r["legacy_id"]: r for r in q(
            "SELECT item_legacy_id, item_id, master_id, receipt_date::text, lot_no, mfg_date::text,"
            " expiry_date::text, lifetime_note, amount_received::text, amount_deducted::text,"
            " source_provenance, legacy_id FROM chemical.inventory_lot")}
        item_ids = {r["legacy_id"] for r in q("SELECT legacy_id FROM core.item")}
        chlorine_master = q("SELECT id FROM chemical.master WHERE legacy_item_id = '0c0e6a47'")
        mismatch = 0
        for s in src:
            r = db.get(s["Inventory ID"])
            if r is None:
                mismatch += 1
                continue
            dt = datetime.strptime(s["DateTime"].strip(), "%m/%d/%Y %H:%M:%S")
            expect = {
                "item_legacy_id": s["Item ID"],
                "receipt_date": dt.date().isoformat(),
                "lot_no": s["LotNo"].strip() or None,
                "mfg_date": _us_date(s["MFG"]),
                "expiry_date": _us_date(s["EXP"]),
                "lifetime_note": s["LifeTime"].strip() or None,
                "source_provenance": ITEMS_PROVENANCE,
            }
            ok = (r["item_id"] is not None and r["item_legacy_id"] in item_ids
                  and float(r["amount_received"]) == _money(s["Amount"])
                  and float(r["amount_deducted"]) == (_money(s["Amount_unit_deduct"]) or 0.0))
            for k, v in expect.items():
                if r[k] != v:
                    ok = False
                    break
            if s["Item ID"] == "0c0e6a47":
                if chlorine_master and r["master_id"] != chlorine_master[0]["id"]:
                    ok = False
            elif r["master_id"] is not None:
                ok = False
            if not ok:
                mismatch += 1
        self.assertEqual(mismatch, 0, f"{mismatch} lot row(s) diverge (values withheld)")


@unittest.skipUnless(_SOURCES_PRESENT, "source snapshot /tmp/env-links-2026-11-24 absent on this machine")
class CalibrationContract(unittest.TestCase):
    """Group 3c — 11 seeded stay + 40 net-new (D1-4: the sets, not just the
    totals; ∩ = ∅) with item resolution through the seeded lots."""

    SEEDED_11 = {"1d5ce050", "3c40c1ed", "e75eb989", "2b2bd62d", "e424523a",
                 "18211fa1", "0f579225", "678f6b15", "b0106ceb", "50ae0e7b", "664d0c36"}

    def test_sets_and_counts_d1_4(self):
        row = q(
            "SELECT count(*) AS total,"
            " count(*) FILTER (WHERE source_provenance LIKE 'workbook tool_maintainance%') AS seeded,"
            " count(*) FILTER (WHERE source_provenance = '" + ITEMS_PROVENANCE + "') AS backfill"
            " FROM core.item_calibration"
        )[0]
        db_ids = {r["legacy_id"] for r in q("SELECT legacy_id FROM core.item_calibration")}
        src_ids = {r["maintenanceID"] for r in _csv(MAINT_CSV)}
        self.assertEqual(row["total"], 51, "11 seeded + 40 net-new")
        self.assertEqual(row["seeded"], 11, "the P3.3 seed must stay exactly 11")
        self.assertEqual(row["backfill"], 40, "exactly 40 backfill rows")
        self.assertEqual(db_ids & src_ids, src_ids, "every maintenance row_ID must be seeded")
        self.assertEqual(src_ids & self.SEEDED_11, set(), "D1-4: the 11∩40 set must stay ∅")

    def test_backfill_rows_field_equality_vs_source(self):
        src = _csv(MAINT_CSV)
        db = {r["legacy_id"]: r for r in q(
            "SELECT item_id, tool_legacy_id, item_name, calibration_date::text, cal_method,"
            " cal_result, source_provenance, legacy_id FROM core.item_calibration"
            f" WHERE source_provenance = '{ITEMS_PROVENANCE}'")}
        lot_items = {r["legacy_id"]: r["item_id"] for r in q(
            "SELECT legacy_id, item_id FROM chemical.inventory_lot")}
        mismatch = 0
        for s in src:
            r = db.get(s["maintenanceID"])
            if r is None:
                mismatch += 1
                continue
            expect = {
                "tool_legacy_id": s["InventoryID"].strip() or None,
                "item_name": s["item_Name"].strip() or None,
                "calibration_date": _us_date(s["Cal_date"]),
                "cal_method": s["Cal_method"].strip() or None,
                "cal_result": s["Cal_result"].strip() or None,
                "source_provenance": ITEMS_PROVENANCE,
            }
            want_item = lot_items.get(s["InventoryID"].strip())
            ok = r["item_id"] == want_item and want_item is not None
            for k, v in expect.items():
                if r[k] != v:
                    ok = False
                    break
            if not ok:
                mismatch += 1
        self.assertEqual(mismatch, 0, f"{mismatch} calibration row(s) diverge (values withheld)")


class MigrationFileContract(unittest.TestCase):
    """Static guard over the generated migration — every seed INSERT is
    guarded (idempotent by construction), no DDL beyond seeds."""

    @unittest.skipUnless(_MIGRATION_PRESENT, "migration not generated yet (pre-generation RED)")
    def test_every_insert_guarded_and_no_ddl(self):
        text = MIGRATION_PATH.read_text(encoding="utf-8")
        start = text.index(SEED_MARKER_START)
        end = text.index(SEED_MARKER_END)
        block = text[start:end]
        inserts = [ln for ln in block.splitlines() if ln.lstrip().upper().startswith("INSERT INTO")]
        self.assertGreaterEqual(
            len(inserts), 30 + 882 + 19 + 3 + 6 + 24 + 33 + 40,
            "seed-block INSERT count below the pinned families")
        unguarded = sum(1 for ln in inserts if "WHERE NOT EXISTS" not in ln)
        self.assertEqual(unguarded, 0, "unguarded INSERT found (count only)")
        body = block.upper()
        for banned in ("CREATE TABLE", "CREATE POLICY", "ALTER TABLE", "CREATE VIEW", "GRANT "):
            self.assertNotIn(banned, body, f"DDL/grant statement found in seed block ({banned})")

    @unittest.skipUnless(_MIGRATION_PRESENT, "migration not generated yet (pre-generation RED)")
    def test_provenance_markers_pin_the_derivation(self):
        text = MIGRATION_PATH.read_text(encoding="utf-8")
        self.assertIn("DERIVED-FROM-LOG 2026-11-24", text)
        self.assertIn("882-row", text)


@unittest.skipUnless(_MIGRATION_PRESENT, "canary: migration unapplied/ungenerated — fixtures never sent pre-apply")
class IdempotencyCanary(unittest.TestCase):
    """Live guarded re-send of ONE statement per family inside a single
    BEGIN…ROLLBACK — zero net persistence (the P3.3 canary shape)."""

    def test_guarded_resend_inserts_zero_rows(self):
        from apply_migration_api import split_sql

        text = MIGRATION_PATH.read_text(encoding="utf-8")
        start = text.index(SEED_MARKER_START)
        end = text.index(SEED_MARKER_END)
        stmts = [s for s in split_sql(text[start:end]) if s.strip()]
        sample = [stmts[0], stmts[10], stmts[len(stmts) // 2], stmts[len(stmts) - 1]]
        tables = ["safety.fire_extinguisher", "safety.extinguisher_inspection",
                  "safety.emergency_light_check", "core.item_category", "core.vendor",
                  "core.item", "chemical.inventory_lot", "core.item_calibration"]
        before = q(_count_query(tables))[0]
        q("BEGIN;\n" + "\n".join(sample) + "\nROLLBACK;")
        after = q(_count_query(tables))[0]
        self.assertEqual(before, after, "guarded re-send changed durable state")


if __name__ == "__main__":
    unittest.main(verbosity=2)
