"""ENV-PARITY-P1-007 C1 — the AppSheet-parity SQL rollback-smoke suite.

Executes the SQL-semantics fixture families (frontend/src/lib/parity-fixtures.ts,
SAME case ids, mirrored 1:1 — D1-2/D1-3) against live ENV_DB (project
gllqtbyofrcjzmbnfoeh) through the same approved Management-API path as
scripts/apply_migration_api.py and the P1.3 precedent
(scripts/test_parity_p1_003_thresholds.py): ONE request per fixture batch —
synthetic probe INSERTs → audit SELECT → ROLLBACK — ZERO net persistence
(probe ids re-queried after every batch = 0, asserted).

Families (WO §2.1–§2.5, every case cites reference doc 12 in the TS module):
  meter-chain  MC-01..05  — wastewater.v_reading_meter_chain LAG deltas,
              reset boundaries (delta ≤ 0 → NULL + flag), the interleaved
              LAG-vs-global-MAX corrected expectation, spec-derived m³,
              ÷SWITCH chlorine + continuous-streak gaps-and-islands.
  chlorine     CH-01..04 (÷SWITCH carriers) + CH-05/06 (groundwater ÷(1+9)
              spec-derived) — v_daily_check_chain.
  thresholds   TH-S-* (the 8 seeds, READ-ONLY) + TH-01..18 (2-day Critical
              streak via wastewater.fn_critical_flags + immediate
              sv30/wastewater_in; flags ONLY — wastewater.threshold_alert is
              never read or written by this suite).
  estimates    ES-01..06 — hour chain, energy = hours × spec 3.7, the
              Water_In ×8 RECORDED-NOT-REPLICATED case (spec-flow-driven;
              no flow seeded → NULL + flag).
  façade       FAC-01..05 — public.v_reading_critical_flags exists, row
              count matches the underlying view, anon REST denied (and NOT
              PGRST205-404 = registered), base view pg_get_viewdef
              byte-identical (whitespace-normalized) to the pre-apply
              canonical, authenticated/anon grant shape.

RED-first (D2): FAC-* fail truthfully while migration
20261116000003_parity_p1_007_critical_flags_facade.sql is UNAPPLIED
(façade missing → PGRST205/anon-404/count-mismatch); the fixture families
run against P1.2/P1.3/P1.5 objects that already exist (pass-by-design
disclosed, never claimed as RED).

Secrets: SUPABASE_ACCESS_TOKEN / SUPABASE_ANON_KEY resolve via the approved
resolver (scripts/_env.py, process-env tier first — see the D-phase log
note re the WO's ".env SUPABASE_DB_URL" phrasing; the Management-API path
never needs the DB URL and no secret is ever printed).

Run:  uv run python -m pytest scripts/test_parity_p1_007_fixtures_sql.py -q
"""

from __future__ import annotations

import os
import sys
import unittest
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

API_URL = (
    "https://api.supabase.com/v1/projects/gllqtbyofrcjzmbnfoeh/database/query"
)
REST_URL = "https://gllqtbyofrcjzmbnfoeh.supabase.co/rest/v1"

MIGRATION = "20261116000003_parity_p1_007_critical_flags_facade.sql"
FIXTURE_NOTE = "P1.007-FIXTURE"

# The 8 seeded thresholds (WO §2.4; P1.3 seeds at valid_from 2024-01-09).
# parameter_code → (min_value, max_value). READ-ONLY consumption.
EXPECTED_SEEDS = {
    "do1": (None, "1"),
    "do2": (None, "1"),
    "do3": (None, "1.5"),
    "free_chlorine": ("0.5", "1"),
    "ph": ("5", "9"),
    "tds2": ("1000", None),
    "sv30": ("150", "450"),
    "wastewater_in": ("70", None),
}

# Pre-apply canonical pg_get_viewdef of the BASE view
# wastewater.v_reading_critical_flags (captured live at D2, 2026-11-16,
# BEFORE the façade applied — the façade must be additive-only: the base
# definition byte-unchanged). Whitespace-normalized comparison.
BASE_VIEWDEF_CANONICAL = (
    "SELECT c.id, c.reading_date, c.critical_do1, c.critical_do2,"
    " c.critical_do3, c.critical_free_chlorine_low,"
    " c.critical_free_chlorine_high, c.critical_tds2, c.critical_ph,"
    " c.immediate_sv30, c.immediate_wastewater_in FROM"
    " wastewater.reading x CROSS JOIN LATERAL"
    " wastewater.fn_critical_flags(x.id) c(id, reading_date, critical_do1,"
    " critical_do2, critical_do3, critical_free_chlorine_low,"
    " critical_free_chlorine_high, critical_tds2, critical_ph,"
    " immediate_sv30, immediate_wastewater_in);"
)

# ── Meter-chain band (MC): pump1/pump2/electric meters ONLY here, so the
#    LAG chains cannot cross-contaminate the other fixture bands. Row 12-01
#    chains from the last REAL row (2026-07-04, non-negative totalizers) →
#    meter value 0 makes delta ≤ 0 deterministic → NULL + boundary flag.
#    carbon.reading probes anchor meter_id to a REAL meter row (read-only
#    reference; the inserts themselves roll back).
MC_BAND = [
    # (date, pump1, pump2, electric_carbon_value, chlorine_used, mix)
    ("2099-12-01", "0", "0", "0", "9", "'1:9'"),
    ("2099-12-02", "34", "12", "60", "8", "'1:4'"),
    ("2099-12-03", "10", "20", "60", "NULL", "NULL"),
    ("2099-12-04", "160", "30", "80", "6", "'1:2'"),
    ("2099-12-06", "NULL", "NULL", "NULL", "9", "'1:9'"),
]

MC_EXPECTED = {
    "MC-01": {
        "date": "2099-12-01",
        "pump1_hours": None, "pump2_hours": None, "delta_kwh": None,
        "pump1_m3": None, "pump2_m3": None, "wastewater_in_derived": None,
        "chlorine_used_real": "1", "chlorine_streak_count": 1,
        "meter_boundary_flag": True,
    },
    "MC-02": {
        "date": "2099-12-02",
        "pump1_hours": "34", "pump2_hours": "12", "delta_kwh": "60",
        "pump1_m3": "1156", "pump2_m3": "144", "wastewater_in_derived": "1300",
        "chlorine_used_real": "2", "chlorine_streak_count": 2,
        "meter_boundary_flag": False,
    },
    "MC-03": {
        "date": "2099-12-03",
        "pump1_hours": None, "pump2_hours": "8", "delta_kwh": None,
        "pump1_m3": None, "pump2_m3": "96", "wastewater_in_derived": None,
        "chlorine_used_real": None, "chlorine_streak_count": 0,
        "meter_boundary_flag": True,
    },
    "MC-04": {
        "date": "2099-12-04",
        "pump1_hours": "150", "pump2_hours": "10", "delta_kwh": "20",
        "pump1_m3": "5100", "pump2_m3": "120", "wastewater_in_derived": "5220",
        "chlorine_used_real": "3", "chlorine_streak_count": 1,
        "meter_boundary_flag": False,
    },
    # MC-05: 12-05 carries NO row (a MISSING calendar day) — the streak
    # restarts at 1 (calendar gap breaks honestly, never fabricated).
    "MC-05": {
        "date": "2099-12-06",
        "pump1_hours": None, "pump2_hours": None, "delta_kwh": None,
        "pump1_m3": None, "pump2_m3": None, "wastewater_in_derived": None,
        "chlorine_used_real": "1", "chlorine_streak_count": 1,
        "meter_boundary_flag": False,
    },
}

# ÷SWITCH carriers ride the MC band rows (case id → (date, expected real)).
CH_EXPECTED = {
    "CH-01": ("2099-12-01", "1"),
    "CH-02": ("2099-12-02", "2"),
    "CH-03": ("2099-12-04", "3"),
    "CH-04": ("2099-12-03", None),
}

# ── Threshold streak bands (TH): per-band date isolation (P1.3 pattern).
TH_BAND = [
    # A — hit: do_aeration < 1 on D−2, D−1, D
    ("2099-01-01", "do_aeration", "0.5"),
    ("2099-01-02", "do_aeration", "0.5"),
    ("2099-01-03", "do_aeration", "0.5"),
    # B — gap: D−2 and D violate, D−1 MISSING (no row)
    ("2099-02-01", "do_aeration", "0.5"),
    ("2099-02-03", "do_aeration", "0.5"),
    # C — in bounds ×3 days
    ("2099-03-01", "do_aeration", "1.2"),
    ("2099-03-02", "do_aeration", "1.2"),
    ("2099-03-03", "do_aeration", "1.2"),
    # D — NULL value day breaks the streak
    ("2099-04-01", "do_aeration", "0.5"),
    ("2099-04-02", "do_aeration", "NULL"),
    ("2099-04-03", "do_aeration", "0.5"),
    # E — immediate sv30 / wastewater_in windows + NULL day
    ("2099-05-01", "sv30", "480"),
    ("2099-05-01", "wastewater_in", "85"),
    ("2099-05-02", "sv30", "100"),
    ("2099-05-03", "sv30", "200"),
    ("2099-05-03", "wastewater_in", "40"),
    ("2099-05-04", "wastewater_in", "NULL"),
    ("2099-05-04", "sv30", "NULL"),
    # F — pH Critical streak
    ("2099-06-01", "ph", "9.5"),
    ("2099-06-02", "ph", "9.5"),
    ("2099-06-03", "ph", "9.5"),
    # G — free chlorine low streak
    ("2099-07-01", "free_chlorine", "0.2"),
    ("2099-07-02", "free_chlorine", "0.2"),
    ("2099-07-03", "free_chlorine", "0.2"),
    # H — TDS2 critical streak
    ("2099-08-01", "tds_before_discharge", "1100"),
    ("2099-08-02", "tds_before_discharge", "1100"),
    ("2099-08-03", "tds_before_discharge", "1100"),
    # I — free chlorine high streak
    ("2099-09-01", "free_chlorine", "1.5"),
    ("2099-09-02", "free_chlorine", "1.5"),
    ("2099-09-03", "free_chlorine", "1.5"),
    # J — DO-2 streak
    ("2099-10-01", "do_sedimentation", "0.5"),
    ("2099-10-02", "do_sedimentation", "0.5"),
    ("2099-10-03", "do_sedimentation", "0.5"),
    # K — DO-3 streak
    ("2099-11-01", "do_before_discharge", "1.0"),
    ("2099-11-02", "do_before_discharge", "1.0"),
    ("2099-11-03", "do_before_discharge", "1.0"),
]

# case id → (flag column, probe date, expected)
TH_EXPECTED = {
    "TH-01": ("critical_do1", "2099-01-03", True),
    "TH-02": ("critical_do1", "2099-01-02", False),
    "TH-03": ("critical_do1", "2099-02-03", False),
    "TH-04": ("critical_do1", "2099-03-03", False),
    "TH-05": ("critical_do1", "2099-04-03", False),
    "TH-06": ("critical_do2", "2099-10-03", True),
    "TH-07": ("critical_do3", "2099-11-03", True),
    "TH-08": ("critical_ph", "2099-06-03", True),
    "TH-09": ("critical_free_chlorine_low", "2099-07-03", True),
    "TH-10": ("critical_free_chlorine_high", "2099-09-03", True),
    "TH-11": ("critical_tds2", "2099-08-03", True),
    "TH-12": ("immediate_sv30", "2099-05-01", True),
    "TH-13": ("immediate_sv30", "2099-05-02", True),
    "TH-14": ("immediate_sv30", "2099-05-03", False),
    "TH-15": ("immediate_wastewater_in", "2099-05-01", True),
    "TH-16": ("immediate_wastewater_in", "2099-05-03", False),
    "TH-17": ("immediate_sv30", "2099-05-04", False),
    "TH-18": ("immediate_wastewater_in", "2099-05-04", False),
}

# ── Water-supply band (ES + CH-05/06): daily_check is EMPTY live, so the
#    hour chain is fully fixture-determined. 2024-01-01/02 probe the
#    no-spec branch (seeds start 2024-01-09).
WS_BAND = [
    # (date, hour_meter, chlorine_usage)
    ("2024-01-01", "0", "NULL"),
    ("2024-01-02", "4", "NULL"),
    ("2099-06-01", "0", "NULL"),
    ("2099-06-02", "4", "10"),
    ("2099-06-03", "4", "NULL"),
    ("2099-06-04", "8", "NULL"),
]

WS_EXPECTED = {
    "ES-01": ("2099-06-01", {
        "hour_work": None, "energy_use_estimate": None,
        "water_in_estimate": None, "hour_boundary_flag": True,
        "spec_missing": False,
    }),
    "ES-02": ("2099-06-02", {
        "hour_work": "4", "energy_use_estimate": "14.8",
        "water_in_estimate": None, "hour_boundary_flag": False,
        "spec_missing": True,
    }),
    "ES-03": ("2099-06-02", {
        "hour_work": "4", "energy_use_estimate": "14.8",
        "water_in_estimate": None, "hour_boundary_flag": False,
        "spec_missing": True,
    }),
    "ES-04": ("2099-06-03", {
        "hour_work": None, "energy_use_estimate": None,
        "water_in_estimate": None, "hour_boundary_flag": True,
        "spec_missing": False,
    }),
    "ES-05": ("2099-06-04", {
        "hour_work": "4", "energy_use_estimate": "14.8",
        "water_in_estimate": None, "hour_boundary_flag": False,
        "spec_missing": True,
    }),
    "ES-06": ("2024-01-02", {
        "hour_work": "4", "energy_use_estimate": None,
        "water_in_estimate": None, "hour_boundary_flag": False,
        "spec_missing": True,
    }),
    "CH-05": ("2099-06-02", {
        "chlorine_usage_realy": "1",
        # Shares the row with ES-02: pump_groundwater has NO flow seeded
        # live → the row carries spec_missing TRUE (flow dimension); the
        # mix part itself is present (realy computes correctly).
        "spec_missing": True,
    }),
    "CH-06": ("2099-06-04", {
        "chlorine_usage_realy": None,
        # Shares the row with ES-05 (same flow-missing flag).
        "spec_missing": True,
    }),
}


def _query():
    """Return the Management-API query fn or None (approved resolver)."""
    import httpx
    from _env import load_secret

    token = load_secret("SUPABASE_ACCESS_TOKEN")
    if not token:
        return None

    def query(sql: str):
        r = httpx.post(
            API_URL,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json={"query": sql},
            timeout=60,
        )
        if r.status_code >= 400:
            try:
                msg = r.json().get("message") or r.text
            except Exception:
                msg = r.text
            raise RuntimeError(f"[{r.status_code}] {msg}")
        return r.json()

    return query


def _canon(def_text: str) -> str:
    return " ".join(def_text.split())


def _mc_fixture_batch() -> str:
    """Meter-chain batch: carbon probes + reading probes → audit → ROLLBACK."""
    carbon_insert = (
        "INSERT INTO carbon.reading (id, meter_id, reading_date, meter_value,"
        " input_source)"
        " SELECT gen_random_uuid(), m.id, x.d, x.v, 'manual'"
        " FROM (VALUES (DATE '2099-12-01', 0), (DATE '2099-12-02', 60),"
        "       (DATE '2099-12-03', 60), (DATE '2099-12-04', 80))"
        "  AS x(d, v)"
        " CROSS JOIN (SELECT id FROM carbon.meter LIMIT 1) m;"
    )
    reading_rows = []
    for d, p1, p2, _e, cl, mix in MC_BAND:
        reading_rows.append(
            f"(DATE '{d}', {p1}, {p2},"
            f" (SELECT c.id FROM carbon.reading c WHERE c.reading_date = DATE '{d}'"
            f" AND c.meter_id = (SELECT meter_id FROM carbon.meter LIMIT 1)"
            f" ORDER BY c.created_at DESC LIMIT 1),"
            f" {cl}, {mix}, '{FIXTURE_NOTE}')"
        )
    reading_insert = (
        "INSERT INTO wastewater.reading"
        " (reading_date, pump1_meter, pump2_meter, carbon_reading_id,"
        f" chlorine_used, chlorine_mix_ratio, note) VALUES {', '.join(reading_rows)};"
    )
    audit = (
        "SELECT jsonb_object_agg(v.reading_date::text,"
        " jsonb_build_object('pump1_hours', v.pump1_hours,"
        " 'pump2_hours', v.pump2_hours, 'delta_kwh', v.delta_kwh,"
        " 'pump1_m3', v.pump1_m3, 'pump2_m3', v.pump2_m3,"
        " 'wastewater_in_derived', v.wastewater_in_derived,"
        " 'chlorine_used_real', v.chlorine_used_real,"
        " 'chlorine_streak_count', v.chlorine_streak_count,"
        " 'meter_boundary_flag', v.meter_boundary_flag)) AS audit"
        " FROM wastewater.v_reading_meter_chain v"
        " WHERE v.id IN (SELECT id FROM wastewater.reading"
        f" WHERE note = '{FIXTURE_NOTE}');"
    )
    return carbon_insert + "\n" + reading_insert + "\n" + audit + "\nROLLBACK;"


def _th_fixture_batch() -> str:
    """Streak batch: reading probes → fn_critical_flags audit → ROLLBACK.

    Canary-gated on fn_critical_flags existing (parse-time resolution —
    P1.3 precedent); while absent the batch is NOT sent.
    """
    cells = {}
    for d, col, v in TH_BAND:
        cells.setdefault(d, {})[col] = v
    values = []
    cols = sorted({c for row in cells.values() for c in row})
    for d in sorted(cells):
        parts = [f"DATE '{d}'", f"'{FIXTURE_NOTE}'"]
        for c in cols:
            v = cells[d].get(c)
            parts.append("NULL" if v in (None, "NULL") else v)
        values.append("(" + ", ".join(parts) + ")")
    insert = (
        "INSERT INTO wastewater.reading (reading_date, note,"
        f" {', '.join(cols)}) VALUES {', '.join(values)};"
    )
    probes = ", ".join(
        f"'{cid}', (SELECT f.{col} FROM wastewater.fn_critical_flags("
        f"(SELECT x.id FROM wastewater.reading x WHERE x.note = '{FIXTURE_NOTE}'"
        f" AND x.reading_date = DATE '{d}')) f)"
        for cid, (col, d, _e) in TH_EXPECTED.items()
    )
    audit = (
        "SELECT jsonb_build_object(" + probes + ") AS audit;"
    )
    return insert + "\n" + audit + "\nROLLBACK;"


def _ws_fixture_batch() -> str:
    """Water-supply batch: daily_check probes → chain audit → ROLLBACK."""
    values = ", ".join(
        f"(gen_random_uuid(), DATE '{d}', {h}, {cl}, '{FIXTURE_NOTE}')"
        for d, h, cl in WS_BAND
    )
    insert = (
        "INSERT INTO water_supply.daily_check (id, check_date, hour_meter,"
        f" chlorine_usage, note) VALUES {values};"
    )
    audit = (
        "SELECT jsonb_object_agg(v.check_date::text,"
        " jsonb_build_object('hour_work', v.hour_work,"
        " 'energy_use_estimate', v.energy_use_estimate,"
        " 'water_in_estimate', v.water_in_estimate,"
        " 'chlorine_usage_realy', v.chlorine_usage_realy,"
        " 'hour_boundary_flag', v.hour_boundary_flag,"
        " 'spec_missing', v.spec_missing)) AS audit"
        " FROM water_supply.v_daily_check_chain v"
        " WHERE v.id IN (SELECT id FROM water_supply.daily_check"
        f" WHERE note = '{FIXTURE_NOTE}');"
    )
    return insert + "\n" + audit + "\nROLLBACK;"


def _parity_canary() -> str:
    return (
        "SELECT"
        " (to_regprocedure('wastewater.fn_critical_flags(uuid)')"
        "  IS NOT NULL) AS flags_fn_present,"
        " (to_regclass('wastewater.v_reading_meter_chain') IS NOT NULL)"
        "  AS chain_view_present,"
        " (to_regclass('water_supply.v_daily_check_chain') IS NOT NULL)"
        "  AS ws_view_present"
    )


def _counts_query() -> str:
    return (
        "SELECT jsonb_build_object("
        "'reading', (SELECT count(*) FROM wastewater.reading),"
        "'daily_check', (SELECT count(*) FROM water_supply.daily_check),"
        "'carbon_reading', (SELECT count(*) FROM carbon.reading)"
        ") AS counts"
    )


def _dec(v) -> Decimal | None:
    return None if v is None else Decimal(str(v))


class C1ParityFixturesSql(unittest.TestCase):
    """Live ENV_DB parity fixtures (rollback-smoke; zero net persistence)."""

    @classmethod
    def setUpClass(cls):
        q = _query()
        if q is None:
            raise unittest.SkipTest(
                "LIVE_CONNECTION_UNAVAILABLE: SUPABASE_ACCESS_TOKEN not "
                "resolvable via the approved resolver (scripts/_env.py); "
                "a skip is absence-of-probe evidence, never a pass"
            )
        cls.q = staticmethod(q)
        canary = cls.q(_parity_canary())[0]
        cls.parity_objects_present = bool(
            canary["flags_fn_present"]
            and canary["chain_view_present"]
            and canary["ws_view_present"]
        )

    # ── seeds (TH-S-*; READ-ONLY consumption of wastewater.threshold) ──

    def test_threshold_seed_rows_exact_TH_S(self):
        rows = self.q(
            "SELECT parameter_code, min_value, max_value, effective_from"
            " FROM wastewater.threshold ORDER BY parameter_code"
        )
        self.assertEqual(len(rows), 8, f"expected 8 seeds, found {len(rows)}")
        for r in rows:
            code = r["parameter_code"]
            with self.subTest(case=f"TH-S-{code}"):
                self.assertIn(code, EXPECTED_SEEDS)
                exp_min, exp_max = EXPECTED_SEEDS[code]
                self.assertEqual(r["effective_from"], "2024-01-09")
                self.assertEqual(
                    _dec(r["min_value"]),
                    None if exp_min is None else Decimal(exp_min),
                )
                self.assertEqual(
                    _dec(r["max_value"]),
                    None if exp_max is None else Decimal(exp_max),
                )

    # ── meter chain (MC-01..05) + ÷SWITCH carriers (CH-01..04) ──

    def test_meter_chain_and_chlorine_rollback_fixture(self):
        baseline = self.q(_counts_query())[0]["counts"]
        audit = self.q(_mc_fixture_batch())[0]["audit"]
        for cid, exp in MC_EXPECTED.items():
            got = audit.get(exp["date"])
            with self.subTest(case=cid):
                self.assertIsNotNone(got, f"{cid}: no chain row for probe date")
                for field, expected in exp.items():
                    if field == "date":
                        continue
                    if isinstance(expected, (bool, int)):
                        self.assertEqual(got[field], expected, f"{cid}.{field}")
                    else:
                        self.assertEqual(
                            _dec(got[field]),
                            None if expected is None else Decimal(expected),
                            f"{cid}.{field}",
                        )
        for cid, (d, exp) in CH_EXPECTED.items():
            got = audit.get(d)
            with self.subTest(case=cid):
                self.assertIsNotNone(got, f"{cid}: no chain row for {d}")
                self.assertEqual(
                    _dec(got["chlorine_used_real"]),
                    None if exp is None else Decimal(exp),
                    f"{cid}.chlorine_used_real",
                )
        self._assert_no_leak(baseline)

    # ── 2-day Critical streak + immediate windows (TH-01..18) ──

    def test_critical_streak_semantics_rollback_fixture(self):
        if not self.parity_objects_present:
            self.fail(
                "parity objects missing (canary): fn_critical_flags /"
                " v_reading_meter_chain / v_daily_check_chain — fixture"
                " batch NOT sent (parse-time failure and zero-write risk"
                " avoided)"
            )
        baseline = self.q(_counts_query())[0]["counts"]
        audit = self.q(_th_fixture_batch())[0]["audit"]
        for cid, (col, d, expected) in TH_EXPECTED.items():
            with self.subTest(case=cid):
                self.assertEqual(
                    audit.get(cid), expected, f"{cid} ({col} @ {d})"
                )
        self._assert_no_leak(baseline)

    # ── water-supply estimates + groundwater chlorine (ES-01..06, CH-05/06) ──

    def test_water_supply_estimates_rollback_fixture(self):
        baseline = self.q(_counts_query())[0]["counts"]
        audit = self.q(_ws_fixture_batch())[0]["audit"]
        for cid, (d, exp) in WS_EXPECTED.items():
            got = audit.get(d)
            with self.subTest(case=cid):
                self.assertIsNotNone(got, f"{cid}: no chain row for {d}")
                for field, expected in exp.items():
                    if isinstance(expected, bool):
                        self.assertEqual(got[field], expected, f"{cid}.{field}")
                    else:
                        self.assertEqual(
                            _dec(got[field]),
                            None if expected is None else Decimal(expected),
                            f"{cid}.{field}",
                        )
        self._assert_no_leak(baseline)

    # ── façade group (FAC-01..05) — RED pre-apply, GREEN post-apply ──

    def test_facade_exists(self):
        rows = self.q(
            "SELECT to_regclass('public.v_reading_critical_flags') AS facade"
        )
        self.assertIsNotNone(
            rows[0]["facade"],
            f"public.v_reading_critical_flags missing — migration {MIGRATION}"
            " unapplied (truthful RED)",
        )

    def test_facade_row_count_matches_underlying_view(self):
        rows = self.q(
            "SELECT"
            " (SELECT count(*) FROM public.v_reading_critical_flags) AS pub,"
            " (SELECT count(*) FROM wastewater.v_reading_critical_flags)"
            "  AS base"
        )
        self.assertEqual(
            rows[0]["pub"], rows[0]["base"],
            "façade row count must equal the underlying view's",
        )

    def test_facade_grant_shape(self):
        rows = self.q(
            "SELECT"
            " CASE WHEN to_regclass('public.v_reading_critical_flags')"
            "  IS NULL THEN NULL ELSE has_table_privilege('authenticated',"
            "  'public.v_reading_critical_flags', 'SELECT') END AS auth_ok,"
            " CASE WHEN to_regclass('public.v_reading_critical_flags')"
            "  IS NULL THEN NULL ELSE has_schema_privilege('anon',"
            "  'wastewater', 'USAGE') END AS anon_ww_usage,"
            " CASE WHEN to_regclass('public.v_reading_critical_flags')"
            "  IS NULL THEN NULL ELSE (SELECT reloptions::text FROM pg_class"
            "  WHERE oid = to_regclass('public.v_reading_critical_flags'))"
            "  END AS relopts"
        )
        self.assertIs(rows[0]["auth_ok"], True, "authenticated must hold SELECT")
        # The anon DENIAL is at QUERY time (house-wide mechanism, identical
        # to the P1.4 sibling facade): Supabase default privileges give anon
        # nominal table grants on new public objects, but security_invoker
        # evaluates the underlying query in the caller's context and anon
        # holds NO USAGE on schema `wastewater` → permission denied. The
        # executable denial proof is the REST probe (see
        # test_anon_rest_denied_and_registered); here we pin the mechanism:
        self.assertIs(
            rows[0]["anon_ww_usage"], False,
            "anon must lack USAGE on schema wastewater (the fail-closed path)",
        )
        self.assertIn("security_invoker=on", rows[0]["relopts"])

    def test_base_viewdef_byte_identical(self):
        rows = self.q(
            "SELECT pg_get_viewdef('wastewater.v_reading_critical_flags'::regclass,"
            " true) AS d"
        )
        self.assertEqual(
            _canon(rows[0]["d"]), _canon(BASE_VIEWDEF_CANONICAL),
            "the base view definition drifted — the façade migration must"
            " be additive-only (pg_get_viewdef byte-identical)",
        )

    def test_anon_rest_denied_and_registered(self):
        from _env import load_secret

        anon = os.environ.get("SUPABASE_ANON_KEY", "") or load_secret(
            "SUPABASE_ANON_KEY"
        )
        if not anon:
            self.skipTest(
                "LIVE_CONNECTION_UNAVAILABLE: SUPABASE_ANON_KEY not resolvable"
                " via the approved resolver; a skip is absence-of-probe"
                " evidence, never a pass"
            )
        import httpx

        r = httpx.get(
            f"{REST_URL}/v_reading_critical_flags",
            params={"select": "id", "limit": "1"},
            headers={"apikey": anon},
            timeout=30,
        )
        self.assertGreaterEqual(
            r.status_code, 400, "anon must be denied (no anon grant)"
        )
        self.assertNotEqual(
            r.status_code, 404,
            "404 = PGRST205 (view not registered with PostgREST) — the"
            " façade is missing or the schema cache is stale",
        )

    # ── zero durable writes (guard, order-independent) ──

    def _assert_no_leak(self, baseline: dict):
        after = self.q(_counts_query())[0]["counts"]
        self.assertEqual(
            after, baseline,
            "ZERO-DURABLE-WRITES VIOLATION: a fixture transaction leaked rows"
            f" (baseline={baseline}, after={after}); leaked rows carry"
            f" note='{FIXTURE_NOTE}'",
        )

    def test_zero_durable_writes_after_all_batches(self):
        # Belt-and-suspenders after the tx methods: probe ids re-queried = 0.
        rows = self.q(
            "SELECT"
            f" (SELECT count(*) FROM wastewater.reading WHERE note = '{FIXTURE_NOTE}') AS r,"
            f" (SELECT count(*) FROM water_supply.daily_check WHERE note = '{FIXTURE_NOTE}') AS d,"
            " (SELECT count(*) FROM carbon.reading c WHERE EXISTS"
            f"  (SELECT 1 FROM wastewater.reading x WHERE x.note = '{FIXTURE_NOTE}'"
            "   AND x.carbon_reading_id = c.id)) AS c"
        )
        self.assertEqual(rows[0]["r"], 0, "leaked reading probes")
        self.assertEqual(rows[0]["d"], 0, "leaked daily_check probes")
        self.assertEqual(rows[0]["c"], 0, "leaked carbon probes")


if __name__ == "__main__":
    unittest.main()
