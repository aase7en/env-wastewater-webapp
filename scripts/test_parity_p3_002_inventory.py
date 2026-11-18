"""ENV-PARITY-P3-002 C1 — D2 RED-first live contract battery for the
chlorine inventory lots + FEFO auto-deduction (AppSheet parity Phase 3,
lane P3.2, Track-Z GLM).

Queries ENV_DB (project gllqtbyofrcjzmbnfoeh, ap-southeast-1) through the
same Management-API access path as scripts/apply_migration_api.py
(scripts/_env.py; SUPABASE_ACCESS_TOKEN from Drive secrets — never
printed; A_WIKI_DRIVE_PATH points the resolver at the Drive root).

Assertion groups (WO §3/§4/§7 + the R2 carried pins P3-1/P3-2/P3-3; every
group must FAIL truthfully while migration 20261118000002_parity_p3_002.sql
is UNAPPLIED — the RED record goes in the handoff — and pass GREEN after):

  SCHEMA     — chemical.inventory_lot (per-ถัง lot receipts: master/item/
               legacy bindings, receipt/lot/mfg/exp, amount_received > 0,
               amount_deducted >= 0, remaining-never-negative named CHECK,
               legacy_id UNIQUE, source_provenance) +
               chemical.inventory_lot_deduction ((source_table, source_id)
               UNIQUE — the idempotency index) +
               chemical.inventory_lot_allocation (slice-level lot↔movement
               join — the FEFO-inverse reversal provenance) +
               chemical.master.legacy_item_id text UNIQUE (ONE additive
               column) + the public.inventory_lot security_invoker façade.
  RLS        — inventory_lot: SELECT staff-or-admin / INSERT admin /
               UPDATE staff-or-admin (the amended D2 posture — the RPC is
               SECURITY INVOKER, staff saves must be able to deduct;
               receipt INSERT + DELETE stay admin) / DELETE admin;
               ledger + allocation: staff-or-admin ALL (the movement
               posture — bookkeeping written only via the RPC); zero anon
               policies everywhere.
  RPC        — chemical.fn_deduct_chlorine_stock(text, uuid, numeric, date)
               and chemical.fn_revoke_chlorine_deduction(text, uuid, date)
               exist, return jsonb, SECURITY INVOKER (prosecdef = false —
               the P2.2 binding), arg names pinned.
  SEED       — exactly ONE chemical.master row with legacy_item_id
               = '0c0e6a47' (the VERBATIM AppSheet anchor, ref 6014 —
               the R2 P3-3 citation pin), provenance names ref 6014;
               chemical.inventory_lot holds ZERO rows durable
               (SOURCE_UNAVAILABLE — never fabricated); re-sending the
               migration's guarded seed block inserts ZERO new rows
               (WHERE NOT EXISTS) — single-request BEGIN…ROLLBACK smoke,
               zero net persistence.
  DEDUCT     — the deduction fixtures, each ONE request
               BEGIN…(CREATE TEMP capture tables)…call…evidence…ROLLBACK
               (zero-net-persistence; canary-gated so the fixtures are
               NEVER SENT while the objects are absent pre-apply):
               F-A FEFO order incl. NULL-expiry-last + multi-lot split +
               movement-row shape (direction='out', lot_no/master_id/
               purpose 'auto-deduct FEFO <source>:<id>');
               F-B shortfall fail-closed (partial allocation, surfaced
               shortfall, stock never negative);
               F-C no lots → 'skipped' + full shortfall + zero movements
               (unknown ≠ zero — never deducted-as-0);
               F-D idempotent retry → 'already-deducted' (R2 P3-2), no
               second movement, one ledger row;
               F-E never-negative CHECK holds under direct overdraw;
               F-F reversal (the D2 P3-1 ruling): usage-row-delete
               compensation writes direction='in' provenance-reversal
               movements (FEFO-inverse), restores lot amount_deducted,
               flips the ledger to 'reversed', is idempotent
               (nothing-to-reverse), and is a no-op when nothing was ever
               deducted;
               F-G mapping-absent path (is_active=false inside the txn) →
               honest 'skipped' with the mapping-absent reason, ledger
               records the failed attempt.
  COUNTS     — baselines wastewater.reading 907 / core.personnel 9 /
               core.equipment_spec 4 / safety.emergency_light 48 /
               safety.fire_extinguisher 0 / safety.emergency_light_check
               332 / food.lab_test 0 / core.item 0 / core.vendor 0 /
               core.item_category 0 / core.distributor 6 identical
               pre/post battery (the RED canary + zero unanticipated
               durable writes), chemical.inventory_lot 0 durable rows,
               zero 'auto-deduct FEFO' movements leaked.

Run:  A_WIKI_DRIVE_PATH=<drive root> python3 -m pytest \\
        scripts/test_parity_p3_002_inventory.py -q
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent))

API_URL = (
    "https://api.supabase.com/v1/projects/gllqtbyofrcjzmbnfoeh/database/query"
)

MIGRATION = "20261118000002_parity_p3_002.sql"
MIGRATION_PATH = Path(__file__).resolve().parent.parent / "supabase/migrations" / MIGRATION

SEED_MARKER_START = "-- >>> SEED-BLOCK-START"
SEED_MARKER_END = "-- <<< SEED-BLOCK-END"

CHLORINE_LEGACY_ITEM_ID = "0c0e6a47"

BASELINES = {
    ("wastewater", "reading"): 907,
    ("core", "personnel"): 9,
    ("core", "equipment_spec"): 4,
    ("safety", "emergency_light"): 48,
    ("safety", "fire_extinguisher"): 0,
    ("safety", "emergency_light_check"): 332,
    ("food", "lab_test"): 0,
    ("core", "item"): 0,
    ("core", "vendor"): 0,
    ("core", "item_category"): 0,
    ("core", "distributor"): 6,
    ("chemical", "master"): 0,  # live-empty at claim (2026-11-18 probe); the ONE config seed row is asserted separately
}


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
    relation "chemical.inventory_lot" does not exist)."""
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


def _objects_present() -> bool:
    try:
        rows = q(
            "SELECT to_regclass('chemical.inventory_lot') AS lot,"
            " to_regclass('chemical.inventory_lot_deduction') AS ded,"
            " to_regclass('chemical.inventory_lot_allocation') AS alloc,"
            " to_regproc('chemical.fn_deduct_chlorine_stock(text,uuid,numeric,date)') AS fn,"
            " to_regproc('chemical.fn_revoke_chlorine_deduction(text,uuid,date)') AS rev,"
            " EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='chemical'"
            "   AND table_name='master' AND column_name='legacy_item_id') AS col"
        )
        row = rows[0]
        return all(row[k] is not None for k in ("lot", "ded", "alloc", "fn", "rev")) and bool(row["col"])
    except AssertionError:
        return False


_OBJECTS_PRESENT = _objects_present()


def _baseline_counts_sql() -> str:
    """Baselines over PRE-EXISTING objects only — runnable (and passing)
    at RED so the durable-write canary is observable before the migration
    exists; the disclosed RED legacy pass."""
    parts = [
        f"(SELECT count(*) FROM {s}.{t}) AS {s.replace('_', '')}_{t.replace('_', '')}"
        for (s, t) in BASELINES
        if (s, t) != ("chemical", "master")
    ]
    parts.append("(SELECT count(*) FROM chemical.master) AS chemical_master")
    return "SELECT " + ", ".join(parts)


def _counts_sql() -> str:
    """Post-apply zero-net snapshot: baselines + the new objects."""
    parts = [
        f"(SELECT count(*) FROM {s}.{t}) AS {s.replace('_', '')}_{t.replace('_', '')}"
        for (s, t) in BASELINES
    ]
    parts.append("(SELECT count(*) FROM chemical.inventory_lot) AS chemical_inventorylot")
    parts.append(
        "(SELECT count(*) FROM chemical.movement WHERE note = 'auto-deduct FEFO') AS chemical_fefomovements"
    )
    parts.append(
        "(SELECT count(*) FROM chemical.master WHERE legacy_item_id = '0c0e6a47') AS chemical_mappedmaster"
    )
    return "SELECT " + ", ".join(parts)


class CountsProbe(unittest.TestCase):
    """Baseline snapshot used by the canary + zero-net-persistence checks."""

    def test_baseline_counts_intact(self):
        rows = q(_baseline_counts_sql())
        row = rows[0]
        for (s, t), expected in BASELINES.items():
            key = s.replace("_", "") + "_" + t.replace("_", "")
            self.assertEqual(
                row[key], expected, f"baseline {s}.{t} = {row[key]}, expected {expected}"
            )

    def test_zero_net_persistence_after_fixtures(self):
        rows = q(_counts_sql())
        row = rows[0]
        self.assertEqual(row["chemical_inventorylot"], 0, "durable lot rows leaked (must stay 0)")
        self.assertEqual(row["chemical_fefomovements"], 0, "fixture movements leaked (must stay 0)")
        self.assertEqual(row["chemical_mappedmaster"], 1, "exactly ONE mapping row expected")


@unittest.skipUnless(
    _OBJECTS_PRESENT,
    "canary: migration 20261118000002 unapplied — the deduction fixtures are NEVER SENT pre-apply (zero durable writes)",
)
class DeductionFixtures(unittest.TestCase):
    """Transaction-scoped deduction contract fixtures (BEGIN…ROLLBACK)."""

    def _fixture_run(self, body: str, evidence: str):
        """One request: BEGIN; fixtures; capture; ROLLBACK; with the
        evidence SELECT as the LAST statement before ROLLBACK (the
        endpoint is simple-protocol, one transaction per request, last
        result set wins). The capture temp tables are ON COMMIT DROP and
        the ROLLBACK kills everything else — zero net persistence."""
        sql = f"BEGIN;\n{body}\n{evidence}\nROLLBACK;"
        rows = q(sql)
        assert rows, "fixture evidence query returned no rows"
        return rows[0]

    # ── F-A FEFO + split + movement shape ─────────────────────────────

    def test_f_a_fefo_order_nulls_last_split_and_movement_shape(self):
        body = """
CREATE TEMP TABLE fx ON COMMIT DROP AS
INSERT INTO chemical.inventory_lot (master_id, receipt_date, lot_no, mfg_date, expiry_date,
                                    amount_received, source_provenance, legacy_id)
SELECT m.id, CURRENT_DATE, v.lot_no, v.mfg, v.exp, v.amt, 'contract-fixture (txn-rolled-back)', v.legacy_id
FROM chemical.master m,
     (VALUES
        ('LOT-A', NULL::date, '2027-01-31'::date, 4.0::numeric, 'fx-lot-a'),
        ('LOT-B', '2026-10-01'::date, '2026-12-01'::date, 3.0::numeric, 'fx-lot-b'),
        ('LOT-C', NULL::date, NULL::date, 5.0::numeric, 'fx-lot-c')
     ) AS v(lot_no, mfg, exp, amt, legacy_id)
WHERE m.legacy_item_id = '0c0e6a47'
RETURNING id, lot_no;
CREATE TEMP TABLE cap ON COMMIT DROP AS
SELECT chemical.fn_deduct_chlorine_stock('wastewater.reading', '44444444-4444-4444-4444-444444444444', 5.5, CURRENT_DATE) AS r;
"""
        evidence = """
SELECT jsonb_build_object(
  'status', (SELECT r->>'status' FROM cap),
  'total', (SELECT (r->>'deducted_total')::numeric FROM cap),
  'shortfall', (SELECT (r->>'shortfall')::numeric FROM cap),
  'lot_deducted', (SELECT jsonb_object_agg(lot_no, amt) FROM (
      SELECT lot_no, (SELECT amount_deducted FROM chemical.inventory_lot i WHERE i.legacy_id = fx.legacy_id) AS amt
      FROM fx) s),
  'movements', (SELECT jsonb_agg(jsonb_build_object('lot_no', m.lot_no, 'qty', m.quantity, 'dir', m.direction,
                                                     'purpose_has_src', m.purpose LIKE 'auto-deduct FEFO wastewater.reading:%')
                                 ORDER BY m.quantity DESC, m.lot_no)
                FROM chemical.movement m
                WHERE m.id IN (SELECT a.movement_id FROM chemical.inventory_lot_allocation a
                               JOIN chemical.inventory_lot_deduction d ON d.id = a.deduction_id
                               WHERE d.source_id = '44444444-4444-4444-4444-444444444444'))
) AS evidence
"""
        row = self._fixture_run(body, evidence)["evidence"]
        self.assertEqual(row["status"], "deducted")
        self.assertEqual(float(row["total"]), 5.5)
        self.assertEqual(float(row["shortfall"]), 0)
        # FEFO: LOT-B (exp 2026-12-01) fully first (3.0), then LOT-A (exp 2027-01-31) 2.5, LOT-C (NULL exp) untouched.
        self.assertEqual(float(row["lot_deducted"]["LOT-B"]), 3.0)
        self.assertEqual(float(row["lot_deducted"]["LOT-A"]), 2.5)
        self.assertEqual(float(row["lot_deducted"]["LOT-C"]), 0.0)
        movs = row["movements"]
        self.assertEqual(len(movs), 2)
        self.assertTrue(all(m["dir"] == "out" for m in movs))
        self.assertTrue(all(m["purpose_has_src"] for m in movs))
        self.assertEqual({(m["lot_no"], float(m["qty"])) for m in movs}, {("LOT-B", 3.0), ("LOT-A", 2.5)})

    # ── F-B shortfall fail-closed ────────────────────────────────────

    def test_f_b_shortfall_fail_closed_partial_never_negative(self):
        body = """
CREATE TEMP TABLE fx ON COMMIT DROP AS
INSERT INTO chemical.inventory_lot (master_id, receipt_date, lot_no, expiry_date,
                                    amount_received, source_provenance, legacy_id)
SELECT m.id, CURRENT_DATE, 'LOT-S1', '2026-12-15', 1.5, 'contract-fixture (txn-rolled-back)', 'fx-lot-s1'
FROM chemical.master m WHERE m.legacy_item_id = '0c0e6a47'
RETURNING id, lot_no;
INSERT INTO chemical.inventory_lot (master_id, receipt_date, lot_no, expiry_date,
                                    amount_received, source_provenance, legacy_id)
SELECT m.id, CURRENT_DATE, 'LOT-S2', NULL, 0.5, 'contract-fixture (txn-rolled-back)', 'fx-lot-s2'
FROM chemical.master m WHERE m.legacy_item_id = '0c0e6a47';
CREATE TEMP TABLE cap ON COMMIT DROP AS
SELECT chemical.fn_deduct_chlorine_stock('water_supply.daily_check', '55555555-5555-5555-5555-555555555555', 5.0, CURRENT_DATE) AS r;
"""
        evidence = """
SELECT jsonb_build_object(
  'status', (SELECT r->>'status' FROM cap),
  'total', (SELECT (r->>'deducted_total')::numeric FROM cap),
  'shortfall', (SELECT (r->>'shortfall')::numeric FROM cap),
  'remaining_negatives', (SELECT count(*) FROM chemical.inventory_lot WHERE amount_deducted > amount_received),
  'lot_deducted', (SELECT jsonb_object_agg(lot_no, amt) FROM (
      SELECT lot_no,
             (SELECT amount_deducted FROM chemical.inventory_lot i WHERE i.legacy_id IN ('fx-lot-s1','fx-lot-s2')
                AND i.lot_no = lot_no) AS amt
      FROM (VALUES ('LOT-S1'), ('LOT-S2')) v(lot_no)) s),
  'master_min_balance', (SELECT min(current_balance) FROM chemical.master WHERE legacy_item_id = '0c0e6a47')
) AS evidence
"""
        row = self._fixture_run(body, evidence)["evidence"]
        self.assertEqual(row["status"], "partial")
        self.assertEqual(float(row["total"]), 2.0)
        self.assertEqual(float(row["shortfall"]), 3.0)
        self.assertEqual(int(row["remaining_negatives"]), 0)
        self.assertEqual(float(row["lot_deducted"]["LOT-S1"]), 1.5)
        self.assertEqual(float(row["lot_deducted"]["LOT-S2"]), 0.5)
        self.assertGreaterEqual(float(row["master_min_balance"]), 0)

    # ── F-C no lots → skipped ────────────────────────────────────────

    def test_f_c_no_stock_skipped_full_shortfall_zero_movements(self):
        body = """
CREATE TEMP TABLE cap ON COMMIT DROP AS
SELECT chemical.fn_deduct_chlorine_stock('wastewater.reading', '66666666-6666-6666-6666-666666666666', 4.0, CURRENT_DATE) AS r;
"""
        evidence = """
SELECT jsonb_build_object(
  'status', (SELECT r->>'status' FROM cap),
  'total', (SELECT (r->>'deducted_total')::numeric FROM cap),
  'shortfall', (SELECT (r->>'shortfall')::numeric FROM cap),
  'movements', (SELECT count(*) FROM chemical.movement m
                WHERE m.id IN (SELECT a.movement_id FROM chemical.inventory_lot_allocation a
                               JOIN chemical.inventory_lot_deduction d ON d.id = a.deduction_id
                               WHERE d.source_id = '66666666-6666-6666-6666-666666666666')),
  'ledger_status', (SELECT status FROM chemical.inventory_lot_deduction
                    WHERE source_id = '66666666-6666-6666-6666-666666666666')
) AS evidence
"""
        row = self._fixture_run(body, evidence)["evidence"]
        self.assertEqual(row["status"], "skipped")
        self.assertEqual(float(row["total"]), 0.0)
        self.assertEqual(float(row["shortfall"]), 4.0)
        self.assertEqual(int(row["movements"]), 0)
        self.assertEqual(row["ledger_status"], "skipped")

    # ── F-D idempotent retry (R2 P3-2 already-deducted) ──────────────

    def test_f_d_idempotent_retry_already_deducted_no_double_deduct(self):
        body = """
INSERT INTO chemical.inventory_lot (master_id, receipt_date, lot_no, expiry_date,
                                    amount_received, source_provenance, legacy_id)
SELECT m.id, CURRENT_DATE, 'LOT-I1', '2026-12-15', 3.0, 'contract-fixture (txn-rolled-back)', 'fx-lot-i1'
FROM chemical.master m WHERE m.legacy_item_id = '0c0e6a47';
SELECT chemical.fn_deduct_chlorine_stock('wastewater.reading', '77777777-7777-7777-7777-777777777777', 2.0, CURRENT_DATE);
CREATE TEMP TABLE cap ON COMMIT DROP AS
SELECT chemical.fn_deduct_chlorine_stock('wastewater.reading', '77777777-7777-7777-7777-777777777777', 2.0, CURRENT_DATE) AS r;
"""
        evidence = """
SELECT jsonb_build_object(
  'status', (SELECT r->>'status' FROM cap),
  'already', (SELECT (r->>'already_recorded')::boolean FROM cap),
  'total', (SELECT (r->>'deducted_total')::numeric FROM cap),
  'movement_count', (SELECT count(*) FROM chemical.movement m
                     WHERE m.id IN (SELECT a.movement_id FROM chemical.inventory_lot_allocation a
                                    JOIN chemical.inventory_lot_deduction d ON d.id = a.deduction_id
                                    WHERE d.source_id = '77777777-7777-7777-7777-777777777777')),
  'ledger_rows', (SELECT count(*) FROM chemical.inventory_lot_deduction
                  WHERE source_id = '77777777-7777-7777-7777-777777777777'),
  'lot_deducted', (SELECT amount_deducted FROM chemical.inventory_lot WHERE legacy_id = 'fx-lot-i1')
) AS evidence
"""
        row = self._fixture_run(body, evidence)["evidence"]
        self.assertEqual(row["status"], "already-deducted")
        self.assertTrue(row["already"])
        self.assertEqual(float(row["total"]), 2.0)
        self.assertEqual(int(row["movement_count"]), 1)
        self.assertEqual(int(row["ledger_rows"]), 1)
        self.assertEqual(float(row["lot_deducted"]), 2.0)

    # ── F-E never-negative CHECK holds ───────────────────────────────

    def test_f_e_never_negative_check_holds_under_direct_overdraw(self):
        body = """
INSERT INTO chemical.inventory_lot (master_id, receipt_date, lot_no, expiry_date,
                                    amount_received, amount_deducted, source_provenance, legacy_id)
SELECT m.id, CURRENT_DATE, 'LOT-N1', NULL, 2.0, 2.0, 'contract-fixture (txn-rolled-back)', 'fx-lot-n1'
FROM chemical.master m WHERE m.legacy_item_id = '0c0e6a47';
CREATE TEMP TABLE fxres (outcome text);
DO $fx$
BEGIN
  UPDATE chemical.inventory_lot SET amount_deducted = amount_received + 1 WHERE legacy_id = 'fx-lot-n1';
  INSERT INTO fxres VALUES ('check_not_fired');
EXCEPTION WHEN check_violation THEN
  INSERT INTO fxres VALUES ('check_fired');
END
$fx$;
"""
        evidence = "SELECT outcome AS evidence FROM fxres"
        row = self._fixture_run(body, evidence)
        self.assertEqual(row["evidence"], "check_fired")

    # ── F-F reversal (the D2 P3-1 ruling) ────────────────────────────

    def test_f_f_reversal_restores_lots_via_fefo_inverse_provenance(self):
        body = """
INSERT INTO chemical.inventory_lot (master_id, receipt_date, lot_no, expiry_date,
                                    amount_received, source_provenance, legacy_id)
SELECT m.id, CURRENT_DATE, 'LOT-R1', '2026-12-01', 1.5, 'contract-fixture (txn-rolled-back)', 'fx-lot-r1'
FROM chemical.master m WHERE m.legacy_item_id = '0c0e6a47';
INSERT INTO chemical.inventory_lot (master_id, receipt_date, lot_no, expiry_date,
                                    amount_received, source_provenance, legacy_id)
SELECT m.id, CURRENT_DATE, 'LOT-R2', '2027-03-01', 3.0, 'contract-fixture (txn-rolled-back)', 'fx-lot-r2'
FROM chemical.master m WHERE m.legacy_item_id = '0c0e6a47';
SELECT chemical.fn_deduct_chlorine_stock('wastewater.reading', '88888888-8888-8888-8888-888888888888', 4.0, CURRENT_DATE);
CREATE TEMP TABLE cap1 ON COMMIT DROP AS
SELECT chemical.fn_revoke_chlorine_deduction('wastewater.reading', '88888888-8888-8888-8888-888888888888', CURRENT_DATE) AS r;
CREATE TEMP TABLE cap2 ON COMMIT DROP AS
SELECT chemical.fn_revoke_chlorine_deduction('wastewater.reading', '88888888-8888-8888-8888-888888888888', CURRENT_DATE) AS r;
"""
        evidence = """
SELECT jsonb_build_object(
  'rev_status', (SELECT r->>'status' FROM cap1),
  'restored', (SELECT (r->>'restored_total')::numeric FROM cap1),
  'rev_movements', (SELECT jsonb_agg(jsonb_build_object('dir', m.direction, 'qty', m.quantity,
                                                         'purpose_rev', m.purpose LIKE 'auto-reversal wastewater.reading:88888888%',
                                                         'note_has_provenance', m.note LIKE '%provenance reversal%')
                                      ORDER BY m.quantity)
                    FROM chemical.movement m
                    WHERE m.purpose LIKE 'auto-reversal wastewater.reading:88888888%'),
  'lot_restored', (SELECT jsonb_object_agg(lot_no, amt) FROM (
      SELECT lot_no, (SELECT amount_deducted FROM chemical.inventory_lot i
                      WHERE i.legacy_id IN ('fx-lot-r1','fx-lot-r2') AND i.lot_no = lot_no) AS amt
      FROM (VALUES ('LOT-R1'), ('LOT-R2')) v(lot_no)) s),
  'ledger_status', (SELECT status FROM chemical.inventory_lot_deduction
                    WHERE source_id = '88888888-8888-8888-8888-888888888888'),
  'second_rev', (SELECT r->>'status' FROM cap2)
) AS evidence
"""
        row = self._fixture_run(body, evidence)["evidence"]
        self.assertEqual(row["rev_status"], "reversed")
        self.assertEqual(float(row["restored"]), 4.0)
        revs = row["rev_movements"]
        self.assertEqual(len(revs), 2)
        self.assertTrue(all(m["dir"] == "in" for m in revs))
        self.assertTrue(all(m["purpose_rev"] for m in revs))
        self.assertTrue(all(m["note_has_provenance"] for m in revs))
        self.assertEqual(float(row["lot_restored"]["LOT-R1"]), 0.0)
        self.assertEqual(float(row["lot_restored"]["LOT-R2"]), 0.0)
        self.assertEqual(row["ledger_status"], "reversed")
        self.assertEqual(row["second_rev"], "nothing-to-reverse")

    def test_f_f2_reversal_without_deduction_is_an_honest_noop(self):
        body = """
CREATE TEMP TABLE cap ON COMMIT DROP AS
SELECT chemical.fn_revoke_chlorine_deduction('wastewater.reading', '99999999-9999-9999-9999-999999999999', CURRENT_DATE) AS r;
"""
        evidence = """
SELECT jsonb_build_object('status', (SELECT r->>'status' FROM cap)) AS evidence
"""
        row = self._fixture_run(body, evidence)
        self.assertEqual(row["evidence"]["status"], "nothing-to-reverse")

    # ── F-G mapping-absent path (txn-scoped) ─────────────────────────

    def test_f_g_mapping_absent_path_is_honest_skip(self):
        body = """
UPDATE chemical.master SET is_active = false WHERE legacy_item_id = '0c0e6a47';
CREATE TEMP TABLE cap ON COMMIT DROP AS
SELECT chemical.fn_deduct_chlorine_stock('wastewater.reading', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2.0, CURRENT_DATE) AS r;
"""
        evidence = """
SELECT jsonb_build_object(
  'status', (SELECT r->>'status' FROM cap),
  'reason_absent', (SELECT (r->>'reason') LIKE 'mapping config absent%' FROM cap),
  'ledger_status', (SELECT status FROM chemical.inventory_lot_deduction
                    WHERE source_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'movements', (SELECT count(*) FROM chemical.movement m
                WHERE m.id IN (SELECT a.movement_id FROM chemical.inventory_lot_allocation a
                               JOIN chemical.inventory_lot_deduction d ON d.id = a.deduction_id
                               WHERE d.source_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'))
) AS evidence
"""
        row = self._fixture_run(body, evidence)["evidence"]
        self.assertEqual(row["status"], "skipped")
        self.assertTrue(row["reason_absent"])
        self.assertEqual(row["ledger_status"], "skipped")
        self.assertEqual(int(row["movements"]), 0)

    # ── SEED idempotency (guarded re-send, txn-rolled-back) ──────────

    def test_seed_block_resend_inserts_zero_rows(self):
        text = MIGRATION_PATH.read_text(encoding="utf-8")
        start = text.index(SEED_MARKER_START)
        end = text.index(SEED_MARKER_END)
        block = text[start:end]
        from apply_migration_api import split_sql

        stmts = [s for s in split_sql(block) if s.strip()]
        self.assertGreaterEqual(len(stmts), 1)
        before = q("SELECT count(*) AS c FROM chemical.master WHERE legacy_item_id = '0c0e6a47'")[0]["c"]
        sql = "BEGIN;\n" + "\n".join(stmts) + "\nROLLBACK;"
        q(sql)
        after = q("SELECT count(*) AS c FROM chemical.master WHERE legacy_item_id = '0c0e6a47'")[0]["c"]
        self.assertEqual(before, after, "guarded seed re-send must insert ZERO rows")


class SchemaContract(unittest.TestCase):
    """SCHEMA + RLS + RPC + SEED shape contract (fails truthfully while
    the migration is unapplied)."""

    def test_tables_exist_with_pinned_columns(self):
        expected = [
            ("inventory_lot", "id", "uuid", "NO"),
            ("inventory_lot", "master_id", "uuid", "YES"),
            ("inventory_lot", "item_id", "uuid", "YES"),
            ("inventory_lot", "item_legacy_id", "text", "YES"),
            ("inventory_lot", "receipt_date", "date", "NO"),
            ("inventory_lot", "lot_no", "text", "YES"),
            ("inventory_lot", "mfg_date", "date", "YES"),
            ("inventory_lot", "expiry_date", "date", "YES"),
            ("inventory_lot", "lifetime_note", "text", "YES"),
            ("inventory_lot", "amount_received", "numeric", "NO"),
            ("inventory_lot", "amount_deducted", "numeric", "NO"),
            ("inventory_lot", "source_provenance", "text", "NO"),
            ("inventory_lot", "legacy_id", "text", "YES"),
            ("inventory_lot", "note", "text", "YES"),
            ("inventory_lot", "recorded_by", "uuid", "YES"),
            ("inventory_lot_deduction", "id", "uuid", "NO"),
            ("inventory_lot_deduction", "source_table", "text", "NO"),
            ("inventory_lot_deduction", "source_id", "uuid", "NO"),
            ("inventory_lot_deduction", "master_id", "uuid", "YES"),
            ("inventory_lot_deduction", "deducted_total", "numeric", "NO"),
            ("inventory_lot_deduction", "shortfall", "numeric", "NO"),
            ("inventory_lot_deduction", "status", "text", "NO"),
            ("inventory_lot_allocation", "id", "uuid", "NO"),
            ("inventory_lot_allocation", "deduction_id", "uuid", "NO"),
            ("inventory_lot_allocation", "lot_id", "uuid", "NO"),
            ("inventory_lot_allocation", "movement_id", "uuid", "NO"),
            ("inventory_lot_allocation", "quantity", "numeric", "NO"),
            ("inventory_lot_allocation", "reversed_movement_id", "uuid", "YES"),
            ("inventory_lot_allocation", "reversed_at", "timestamptz", "YES"),
        ]
        cols = q(
            "SELECT table_name, column_name, data_type, is_nullable"
            " FROM information_schema.columns"
            " WHERE table_schema='chemical' AND table_name IN"
            " ('inventory_lot','inventory_lot_deduction','inventory_lot_allocation')"
        )
        actual = {(c["table_name"], c["column_name"]): (c["data_type"], c["is_nullable"]) for c in cols}
        for table, column, dtype, nullable in expected:
            key = (table, column)
            self.assertIn(key, actual, f"chemical.{table}.{column} missing")
            self.assertEqual(
                actual[key][0],
                dtype,
                f"chemical.{table}.{column} type {actual[key][0]} != {dtype}",
            )
            self.assertEqual(
                actual[key][1],
                nullable,
                f"chemical.{table}.{column} nullable {actual[key][1]} != {nullable}",
            )

    def test_pinned_checks_exist(self):
        rows = q(
            "SELECT conname FROM pg_constraint"
            " WHERE conrelid IN ('chemical.inventory_lot'::regclass,)"
            " AND contype = 'c' AND conname IN"
            " ('inventory_lot_amount_positive','inventory_lot_amount_deducted_nonnegative','inventory_lot_remaining_nonnegative')"
        )
        names = {r["conname"] for r in rows}
        self.assertIn("inventory_lot_amount_positive", names)
        self.assertIn("inventory_lot_amount_deducted_nonnegative", names)
        self.assertIn("inventory_lot_remaining_nonnegative", names)

    def test_deduction_source_unique_index(self):
        rows = q(
            "SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid = i.indrelid"
            " WHERE c.oid = 'chemical.inventory_lot_deduction'::regclass"
            " AND i.indisunique AND pg_get_indexdef(i.indexrelid) LIKE '%(source_table, source_id)%'"
        )
        self.assertTrue(rows, "(source_table, source_id) UNIQUE index missing on chemical.inventory_lot_deduction")

    def test_master_legacy_item_id_unique(self):
        rows = q(
            "SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid = i.indrelid"
            " WHERE c.oid = 'chemical.master'::regclass AND i.indisunique"
            " AND pg_get_indexdef(i.indexrelid) LIKE '%legacy_item_id%'"
        )
        self.assertTrue(rows, "chemical.master.legacy_item_id UNIQUE index missing")

    def test_facade_view_security_invoker(self):
        rows = q(
            "SELECT reloptions FROM pg_class WHERE oid = 'public.inventory_lot'::regclass"
        )
        self.assertTrue(rows, "public.inventory_lot view missing")
        opts = rows[0]["reloptions"] or []
        self.assertIn("security_invoker=on", opts)

    def test_rls_enabled_and_pinned_policies(self):
        for t in ("inventory_lot", "inventory_lot_deduction", "inventory_lot_allocation"):
            rows = q(
                f"SELECT relrowsecurity FROM pg_class WHERE oid = 'chemical.{t}'::regclass"
            )
            self.assertTrue(rows[0]["relrowsecurity"], f"RLS not enabled on chemical.{t}")
        expected = {
            ("inventory_lot", "inventory_lot_select"): ("SELECT",),
            ("inventory_lot", "inventory_lot_insert_admin"): ("INSERT",),
            ("inventory_lot", "inventory_lot_update"): ("UPDATE",),
            ("inventory_lot", "inventory_lot_delete_admin"): ("DELETE",),
            ("inventory_lot_deduction", "inventory_lot_deduction_staff_all"): ("ALL",),
            ("inventory_lot_allocation", "inventory_lot_allocation_staff_all"): ("ALL",),
        }
        for (table, policy), (cmd,) in expected.items():
            rows = q(
                "SELECT cmd FROM pg_policy"
                " WHERE polrelid = 'chemical." + table + "'::regclass AND polname = '" + policy + "'"
            )
            self.assertTrue(rows, f"policy {policy} missing on chemical.{table}")
            got = {("SELECT",): {1}, ("INSERT",): {2}, ("UPDATE",): {3}, ("DELETE",): {4}, ("ALL",): {1, 2, 3, 4}}[(cmd,)]
            self.assertEqual(rows[0]["cmd"], got, f"policy {policy} cmd mismatch on chemical.{table}")
        anon = q(
            "SELECT count(*) AS c FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid"
            " WHERE c.relname IN ('inventory_lot','inventory_lot_deduction','inventory_lot_allocation')"
            " AND c.relnamespace = 'chemical'::regnamespace"
            " AND NOT EXISTS (SELECT 1 FROM pg_roles r WHERE r.oid = ANY (p.polroles) AND r.rolname = 'authenticated')"
        )
        self.assertEqual(anon[0]["c"], 0, "anon-visible policy found on the new chemical tables")

    def test_rpcs_exist_security_invoker_jsonb(self):
        rows = q(
            "SELECT p.proname, p.prosecdef, pg_get_function_arguments(p.oid) AS args,"
            " t.typname AS rettype"
            " FROM pg_proc p JOIN pg_type t ON t.oid = p.prorettype"
            " WHERE p.pronamespace = 'chemical'::regnamespace"
            " AND p.proname IN ('fn_deduct_chlorine_stock','fn_revoke_chlorine_deduction')"
        )
        byname = {r["proname"]: r for r in rows}
        self.assertIn("fn_deduct_chlorine_stock", byname)
        self.assertIn("fn_revoke_chlorine_deduction", byname)
        for name in ("fn_deduct_chlorine_stock", "fn_revoke_chlorine_deduction"):
            self.assertFalse(byname[name]["prosecdef"], f"{name} must be SECURITY INVOKER (P2.2 binding)")
            self.assertEqual(byname[name]["rettype"], "jsonb")
        self.assertIn("p_source_table", byname["fn_deduct_chlorine_stock"]["args"])
        self.assertIn("p_quantity", byname["fn_deduct_chlorine_stock"]["args"])
        self.assertIn("p_reversal_date", byname["fn_revoke_chlorine_deduction"]["args"])

    def test_config_mapping_seed_row(self):
        rows = q(
            "SELECT name, unit, legacy_item_id, source_provenance, is_active"
            " FROM chemical.master WHERE legacy_item_id = '0c0e6a47'"
        )
        self.assertEqual(len(rows), 1, "exactly ONE mapping row expected")
        row = rows[0]
        self.assertEqual(row["legacy_item_id"], CHLORINE_LEGACY_ITEM_ID)
        self.assertEqual(row["unit"], "kg")
        self.assertTrue(row["is_active"])
        self.assertIn("ref 6014", row["source_provenance"], "provenance must cite ref 6014 (R2 P3-3 pin)")

    def test_zero_durable_lot_rows(self):
        rows = q("SELECT count(*) AS c FROM chemical.inventory_lot")
        self.assertEqual(rows[0]["c"], 0, "chemical.inventory_lot must hold ZERO rows (SOURCE_UNAVAILABLE — never fabricated)")
