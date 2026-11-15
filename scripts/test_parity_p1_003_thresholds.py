"""ENV-PARITY-P1-003 C1 — D2 RED-first live threshold contract test.

Queries ENV_DB (project gllqtbyofrcjzmbnfoeh, ap-southeast-1) through the
same Management-API access path as scripts/apply_migration_api.py
(scripts/_env.py; SUPABASE_ACCESS_TOKEN from Drive secrets — never printed).

Assertion groups (WO §3.2; groups 1–3 must FAIL truthfully while the
migration 20261115130000_parity_p1_003.sql is UNAPPLIED — the RED record
goes in the handoff — and pass GREEN after it):

  1. The 8 seeded `wastewater.threshold` rows exist with EXACTLY the
     pinned (min_value, max_value, effective_from, note) per WO §2.1
     (NULL sides asserted as NULL; values verbatim from reference §3.3/§9).
  2. The parity objects exist with the pinned names:
     fn_critical_flags(uuid), fn_check_thresholds_parity(uuid),
     fn_persist_parity_alerts(), v_reading_critical_flags,
     trigger trg_persist_parity_alerts on wastewater.reading.
  3. Streak semantics + alert firing via transaction-scoped fixtures:
     a parse-safe canary request gates on the parity functions existing
     (while unapplied, the fixture batch would fail at PARSE time —
     PG resolves function calls before CASE laziness applies — so the
     truthful RED is the canary gate failing, batch never sent). With
     the objects present, ONE Management-API request inserts
     clearly-marked fixture wastewater.reading rows
     (note 'P1.003-FIXTURE'), computes fn_critical_flags on probe rows
     server-side, checks that the triggers wrote threshold_alert rows,
     and ends with ROLLBACK.
     Cases (WO §3.2 item 3): 3 consecutive violating days → TRUE;
     gap day in D−2/D−1 → FALSE; value inside bounds → FALSE; NULL value
     day → FALSE (no fabrication); immediate sv30/wastewater_in firing;
     legacy fn_check_thresholds branch still fires (regression).
     The request pre- and post-checks durable row counts of
     wastewater.reading and wastewater.threshold_alert — zero durable
     writes is itself asserted.
  4. The legacy fn_check_thresholds(uuid) definition is byte-identical
     (whitespace-normalized pg_get_functiondef) to its prior P12
     definition — regression guard against accidental replacement.

Run:  uv run python -m pytest scripts/test_parity_p1_003_thresholds.py -q
"""

from __future__ import annotations

import sys
import unittest
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

API_URL = (
    "https://api.supabase.com/v1/projects/gllqtbyofrcjzmbnfoeh/database/query"
)

MIGRATION = "20261115130000_parity_p1_003.sql"

# History-bound effective_from pinned at D3 preflight: = live
# MIN(reading_date) = 2024-01-09 (the seeded config covers all 907
# historical rows; NEVER CURRENT_DATE — non-deterministic on re-run).
EFFECTIVE_FROM = "2024-01-09"

# Pinned seed table (WO §2.1, values verbatim from reference §3.3/§9).
# parameter_code → (min_value, max_value, note). One-sided thresholds use
# the unused side NULL.
EXPECTED_SEEDS = {
    "do1": (None, "1", "Critical-DO-1 (ref §3.3): DO-1 < 1 — AppSheet parity seed"),
    "do2": (None, "1", "Critical-DO-2 (ref §3.3): DO-2 < 1 — AppSheet parity seed"),
    "do3": (None, "1.5", "Critical-DO-3 (ref §3.3): DO-3 < 1.5 — AppSheet parity seed"),
    "free_chlorine": (
        "0.5",
        "1",
        "Critical-FreeChlorine-Lowerlow < 0.5 / HigherHigh > 1 (ref §3.3) — AppSheet parity seed",
    ),
    "ph": (
        "5",
        "9",
        "pH Critical: > 9 OR < 5 (ref §3.3 verbatim; plan-summary '<4' is a typo) — AppSheet parity seed",
    ),
    "tds2": (
        "1000",
        None,
        "TDS2 critical: TDS-2 > 1000 (ref §3.3) — AppSheet parity seed",
    ),
    "sv30": (
        "150",
        "450",
        "SV30_Notice bot: > 450 OR < 150 (ref §9) — AppSheet parity seed",
    ),
    "wastewater_in": (
        "70",
        None,
        "water_overload bot: > 70 (ref §9) — AppSheet parity seed",
    ),
}

PARITY_ROUTINES = [
    "fn_critical_flags",
    "fn_check_thresholds_parity",
    "fn_persist_parity_alerts",
]
PARITY_VIEW = "v_reading_critical_flags"
PARITY_TRIGGER = "trg_persist_parity_alerts"

# Pinned prior definition of wastewater.fn_check_thresholds(uuid) (from
# migration 20260718000000_p12_frontend_views.sql; captured live via
# pg_get_functiondef at D2 against the pre-migration DB). This lane must
# NEVER alter it — the migration does not touch the function at all.
LEGACY_FN_DEF_CANONICAL = (
    "CREATE OR REPLACE FUNCTION wastewater.fn_check_thresholds(reading_uuid uuid)"
    " RETURNS TABLE(field text, message text) LANGUAGE sql STABLE"
    " AS $function$ WITH r AS ( SELECT do_aeration, do_sedimentation,"
    " do_before_discharge, ph, free_chlorine,"
    " wastewater.fn_do_average(do_aeration, do_sedimentation,"
    " do_before_discharge) AS do_avg FROM wastewater.reading WHERE id ="
    " reading_uuid ) SELECT 'do_average', 'DO เฉลี่ย ' || do_avg::text ||"
    " ' mg/L ต่ำกว่า 2.0 — ตรวจสอบระบบเติมอากาศ' FROM r WHERE do_avg IS NOT"
    " NULL AND do_avg < 2.0 UNION ALL SELECT 'free_chlorine', 'คลอรีนอิสระ '"
    " || free_chlorine::text || ' mg/L ต่ำกว่า 0.5' FROM r WHERE"
    " free_chlorine IS NOT NULL AND free_chlorine < 0.5 UNION ALL SELECT"
    " 'ph', 'pH ' || ph::text || ' อยู่นอกช่วงปกติ 6.5–8.5' FROM r WHERE ph"
    " IS NOT NULL AND (ph < 6.5 OR ph > 8.5) $function$"
)

FIXTURE_NOTE = "P1.003-FIXTURE"

# Fixture rows: clearly-marked, far-future dates (no overlap with real
# data 2024-01-09..2026-07-04), legacy_id NULL, location_id NULL. Each
# scenario block uses a distinct date band so streaks cannot contaminate
# each other. Fields map 1:1 to wastewater.reading columns.
_S = lambda d, **kw: {"date": d, **kw}  # noqa: E731
FIXTURE_ROWS = [
    # A — hit: do_aeration < 1 on D−2, D−1, D (2099-01-03 probes TRUE)
    _S("2099-01-01", do_aeration=0.5),
    _S("2099-01-02", do_aeration=0.5),
    _S("2099-01-03", do_aeration=0.5),
    # B — gap: D−2 and D violate, D−1 missing (2099-02-03 probes FALSE)
    _S("2099-02-01", do_aeration=0.5),
    _S("2099-02-03", do_aeration=0.5),
    # C — inside bounds: 1.2 ≥ 1 three days running (FALSE)
    _S("2099-03-01", do_aeration=1.2),
    _S("2099-03-02", do_aeration=1.2),
    _S("2099-03-03", do_aeration=1.2),
    # D — NULL day breaks the streak honestly (FALSE)
    _S("2099-04-01", do_aeration=0.5),
    _S("2099-04-02"),                      # do_aeration NULL
    _S("2099-04-03", do_aeration=0.5),
    # E — immediate single-day conditions (SV30_Notice / water_overload bots)
    _S("2099-05-01", sv30=480, wastewater_in=85),
    _S("2099-05-02", sv30=200),
    _S("2099-05-03"),                      # sv30/wastewater_in NULL
    # F — pH Critical streak (> 9 OR < 5): 9.5 ×3 days (TRUE)
    _S("2099-06-01", ph=9.5),
    _S("2099-06-02", ph=9.5),
    _S("2099-06-03", ph=9.5),
    # G — free chlorine low streak (< 0.5) (TRUE; legacy <0.5 branch too)
    _S("2099-07-01", free_chlorine=0.2),
    _S("2099-07-02", free_chlorine=0.2),
    _S("2099-07-03", free_chlorine=0.2),
    # H — TDS2 critical streak (> 1000) (TRUE)
    _S("2099-08-01", tds_before_discharge=1100),
    _S("2099-08-02", tds_before_discharge=1100),
    _S("2099-08-03", tds_before_discharge=1100),
    # I — free chlorine high streak (> 1) (TRUE)
    _S("2099-09-01", free_chlorine=1.5),
    _S("2099-09-02", free_chlorine=1.5),
    _S("2099-09-03", free_chlorine=1.5),
    # J — DO-2 streak (< 1) (TRUE)
    _S("2099-10-01", do_sedimentation=0.5),
    _S("2099-10-02", do_sedimentation=0.5),
    _S("2099-10-03", do_sedimentation=0.5),
    # K — DO-3 streak (< 1.5) (TRUE)
    _S("2099-11-01", do_before_discharge=1.0),
    _S("2099-11-02", do_before_discharge=1.0),
    _S("2099-11-03", do_before_discharge=1.0),
]

FIXTURE_COLUMNS = [
    "reading_date",
    "do_aeration",
    "do_sedimentation",
    "do_before_discharge",
    "ph",
    "free_chlorine",
    "tds_before_discharge",
    "sv30",
    "wastewater_in",
]

# Expected fn_critical_flags audit values (post-apply). Keys per probe:
#   A_hit_do1        2099-01-03 critical_do1  TRUE
#   A2_mid_do1       2099-01-02 critical_do1  FALSE (D−2 missing)
#   B_gap_do1        2099-02-03 critical_do1  FALSE (gap day)
#   C_bounds_do1     2099-03-03 critical_do1  FALSE (in bounds)
#   D_null_do1       2099-04-03 critical_do1  FALSE (NULL day)
#   J_do2            2099-10-03 critical_do2  TRUE
#   K_do3            2099-11-03 critical_do3  TRUE
#   F_ph             2099-06-03 critical_ph   TRUE
#   G_cl_low         2099-07-03 critical_free_chlorine_low  TRUE
#   I_cl_high        2099-09-03 critical_free_chlorine_high TRUE
#   H_tds2           2099-08-03 critical_tds2 TRUE
#   E_sv30           2099-05-01 immediate_sv30 TRUE
#   E_wwin           2099-05-01 immediate_wastewater_in TRUE
#   E2_sv30_bounds   2099-05-02 immediate_sv30 FALSE
#   E3_sv30_null     2099-05-03 immediate_sv30 FALSE (NULL never violates)
#   E3_wwin_null     2099-05-03 immediate_wastewater_in FALSE
EXPECTED_FLAGS = {
    "A_hit_do1": True,
    "A2_mid_do1": False,
    "B_gap_do1": False,
    "C_bounds_do1": False,
    "D_null_do1": False,
    "J_do2": True,
    "K_do3": True,
    "F_ph": True,
    "G_cl_low": True,
    "I_cl_high": True,
    "H_tds2": True,
    "E_sv30": True,
    "E_wwin": True,
    "E2_sv30_bounds": False,
    "E3_sv30_null": False,
    "E3_wwin_null": False,
}

# Expected threshold_alert fields produced inside the fixture transaction.
EXPECTED_ALERTS = {
    "parity_sv30": True,               # parity trigger, field 'sv30'
    "parity_wastewater_in": True,      # parity trigger, field 'wastewater_in'
    "parity_critical_do1": True,       # parity trigger, streak completes
    "parity_critical_ph": True,
    "parity_critical_free_chlorine_high": True,
    "legacy_free_chlorine": True,      # legacy trigger, UNTOUCHED branch
}


def _flag_probe(probe_key: str, column: str, probe_date: str) -> str:
    return (
        f"(SELECT f.{column} FROM wastewater.fn_critical_flags("
        f"(SELECT x.id FROM wastewater.reading x WHERE x.note = '{FIXTURE_NOTE}'"
        f" AND x.reading_date = DATE '{probe_date}')) f)"
    )


def _alert_exists(probe_date: str, field: str) -> str:
    return (
        f"EXISTS (SELECT 1 FROM wastewater.threshold_alert ta"
        f" JOIN wastewater.reading r ON r.id = ta.reading_id"
        f" WHERE r.note = '{FIXTURE_NOTE}'"
        f" AND r.reading_date = DATE '{probe_date}' AND ta.field = '{field}')"
    )


def _fixture_batch() -> str:
    """One Management-API request: INSERTs → audit SELECT → ROLLBACK.

    The fn_critical_flags probes are guarded by to_regprocedure CASE so
    the batch never errors pre-apply (RED reports MISSING truthfully and
    the final ROLLBACK is always reached — zero durable-write risk).
    CASE evaluates only the taken branch, so the function is never
    invoked when absent.
    """
    cols = ", ".join(FIXTURE_COLUMNS)
    values = []
    for row in FIXTURE_ROWS:
        cells = []
        for col in FIXTURE_COLUMNS:
            v = row["date"] if col == "reading_date" else row.get(col)
            if col == "reading_date":
                cells.append(f"DATE '{v}'")
            elif v is None:
                cells.append("NULL")
            else:
                cells.append(str(v))
        values.append("(" + ", ".join(cells) + f", '{FIXTURE_NOTE}')")
    insert = (
        f"INSERT INTO wastewater.reading ({cols}, note) VALUES\n"
        + ",\n".join(f"  {v}" for v in values)
        + ";"
    )
    flags_obj = ", ".join(
        f"'{k}', {_flag_probe(k, c, d)}"
        for k, (c, d) in {
            "A_hit_do1": ("critical_do1", "2099-01-03"),
            "A2_mid_do1": ("critical_do1", "2099-01-02"),
            "B_gap_do1": ("critical_do1", "2099-02-03"),
            "C_bounds_do1": ("critical_do1", "2099-03-03"),
            "D_null_do1": ("critical_do1", "2099-04-03"),
            "J_do2": ("critical_do2", "2099-10-03"),
            "K_do3": ("critical_do3", "2099-11-03"),
            "F_ph": ("critical_ph", "2099-06-03"),
            "G_cl_low": ("critical_free_chlorine_low", "2099-07-03"),
            "I_cl_high": ("critical_free_chlorine_high", "2099-09-03"),
            "H_tds2": ("critical_tds2", "2099-08-03"),
            "E_sv30": ("immediate_sv30", "2099-05-01"),
            "E_wwin": ("immediate_wastewater_in", "2099-05-01"),
            "E2_sv30_bounds": ("immediate_sv30", "2099-05-02"),
            "E3_sv30_null": ("immediate_sv30", "2099-05-03"),
            "E3_wwin_null": ("immediate_wastewater_in", "2099-05-03"),
        }.items()
    )
    alerts_obj = ", ".join(
        f"'{k}', {_alert_exists(d, f)}"
        for k, (f, d) in {
            "parity_sv30": ("sv30", "2099-05-01"),
            "parity_wastewater_in": ("wastewater_in", "2099-05-01"),
            "parity_critical_do1": ("critical_do1", "2099-01-03"),
            "parity_critical_ph": ("critical_ph", "2099-06-03"),
            "parity_critical_free_chlorine_high": (
                "critical_free_chlorine_high",
                "2099-09-03",
            ),
            "legacy_free_chlorine": ("free_chlorine", "2099-07-03"),
        }.items()
    )
    audit = (
        "SELECT json_build_object("
        f"'flags', jsonb_build_object({flags_obj}),"
        f"'alerts', jsonb_build_object({alerts_obj})"
        ") AS audit;"
    )
    return insert + "\n" + audit + "\nROLLBACK;"


def _parity_canary() -> str:
    """Parse-safe presence probe for the two parity functions.

    to_regprocedure(text) returns NULL (never raises) for a missing
    function. This MUST be its own request: PostgreSQL resolves function
    CALLS at parse time, so a batch containing fn_critical_flags probes
    would fail with 42883 while the migration is unapplied — the canary
    gates the fixture batch on the parity objects being present.
    """
    return (
        "SELECT"
        " (to_regprocedure('wastewater.fn_critical_flags(uuid)')"
        "  IS NOT NULL) AS flags_fn_present,"
        " (to_regprocedure('wastewater.fn_check_thresholds_parity(uuid)')"
        "  IS NOT NULL) AS parity_fn_present"
    )


def _query():
    """Return the Management-API query fn (Drive-resolved token) or None.

    Mirrors scripts/test_parity_p1_001_schema.py:_query — same approved
    resolver (scripts/_env.py, process-env tier first), same API endpoint,
    never prints or persists the token.
    """
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
    """Whitespace-normalized form for byte-pinning function definitions."""
    return " ".join(def_text.split())


class C1ParityThresholdsLiveContract(unittest.TestCase):
    """Live ENV_DB threshold contract (seeds + parity objects + fixtures)."""

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

    # ── Assertion group 1: the 8 seeded threshold rows ──

    def test_seed_rows_exact(self):
        rows = self.q(
            "SELECT parameter_code, min_value, max_value, effective_from, note"
            " FROM wastewater.threshold ORDER BY parameter_code"
        )
        self.assertEqual(
            len(rows), 8, f"expected exactly 8 seed rows, found {len(rows)}"
        )
        for r in rows:
            code = r["parameter_code"]
            with self.subTest(seed=code):
                self.assertIn(code, EXPECTED_SEEDS, f"unexpected seed {code}")
                exp_min, exp_max, exp_note = EXPECTED_SEEDS[code]
                self.assertEqual(
                    r["effective_from"], EFFECTIVE_FROM,
                    f"{code} effective_from must be the pinned literal",
                )
                got_min = (
                    None if r["min_value"] is None
                    else Decimal(str(r["min_value"]))
                )
                got_max = (
                    None if r["max_value"] is None
                    else Decimal(str(r["max_value"]))
                )
                # Numeric equality (Decimal('150.000') == Decimal('150')):
                # compares the exact fixed-point values, not string forms.
                self.assertEqual(
                    got_min,
                    None if exp_min is None else Decimal(exp_min),
                    f"{code} min_value",
                )
                self.assertEqual(
                    got_max,
                    None if exp_max is None else Decimal(exp_max),
                    f"{code} max_value",
                )
                self.assertEqual(r["note"], exp_note, f"{code} note")
        self.assertEqual(
            {r["parameter_code"] for r in rows}, set(EXPECTED_SEEDS),
            "seed parameter_code set must match the pinned table exactly",
        )

    # ── Assertion group 2: parity objects exist with pinned names ──

    def test_parity_objects_exist(self):
        routines = self.q(
            "SELECT routine_name FROM information_schema.routines"
            " WHERE routine_schema='wastewater'"
            f" AND routine_name IN ({','.join(repr(n) for n in PARITY_ROUTINES)})"
        )
        found = {r["routine_name"] for r in routines}
        for name in PARITY_ROUTINES:
            with self.subTest(routine=name):
                self.assertIn(name, found, f"missing routine wastewater.{name}")
        views = self.q(
            "SELECT table_name FROM information_schema.views"
            " WHERE table_schema='wastewater'"
            f" AND table_name = '{PARITY_VIEW}'"
        )
        self.assertEqual(
            len(views), 1, f"missing view wastewater.{PARITY_VIEW}"
        )
        trig = self.q(
            "SELECT tg.tgname FROM pg_trigger tg"
            " JOIN pg_class c ON c.oid = tg.tgrelid"
            " JOIN pg_namespace n ON n.oid = c.relnamespace"
            " WHERE n.nspname='wastewater' AND c.relname='reading'"
            f" AND tg.tgname = '{PARITY_TRIGGER}' AND NOT tg.tgisinternal"
        )
        self.assertEqual(
            len(trig), 1, f"missing trigger {PARITY_TRIGGER} on wastewater.reading"
        )

    # ── Assertion group 3: streak semantics + alert firing (rolled back) ──

    def test_streak_semantics_and_alert_firing_rollback_fixture(self):
        baseline = self.q(
            "SELECT json_build_object("
            "'reading', (SELECT count(*) FROM wastewater.reading),"
            "'alerts', (SELECT count(*) FROM wastewater.threshold_alert)"
            ") AS counts"
        )[0]["counts"]

        # Parse-safe canary first: while the migration is unapplied the
        # fixture batch would fail at PARSE time (42883 — PG resolves
        # function calls before CASE laziness can help), so the batch is
        # gated on the parity functions being present. The truthful RED
        # pre-apply is exactly this gate failing.
        canary = self.q(_parity_canary())[0]
        if not (canary["flags_fn_present"] and canary["parity_fn_present"]):
            self.fail(
                "parity functions missing (migration unapplied): "
                "fn_critical_flags / fn_check_thresholds_parity — fixture "
                "batch NOT sent (parse-time failure and zero-write risk "
                "avoided); streak assertions cannot be evaluated yet"
            )

        audit = self.q(_fixture_batch())[0]["audit"]

        for key, expected in EXPECTED_FLAGS.items():
            with self.subTest(flag=key):
                self.assertEqual(audit["flags"].get(key), expected, key)
        for key, expected in EXPECTED_ALERTS.items():
            with self.subTest(alert=key):
                self.assertEqual(audit["alerts"].get(key), expected, key)

        after = self.q(
            "SELECT json_build_object("
            "'reading', (SELECT count(*) FROM wastewater.reading),"
            "'alerts', (SELECT count(*) FROM wastewater.threshold_alert)"
            ") AS counts"
        )[0]["counts"]
        self.assertEqual(
            after, baseline,
            "ZERO-DURABLE-WRITES VIOLATION: fixture transaction leaked rows "
            f"(baseline={baseline}, after={after}); any leaked rows carry "
            f"note='{FIXTURE_NOTE}' for identification",
        )

    # ── Assertion group 4: legacy fn_check_thresholds byte-identical ──

    def test_legacy_fn_check_thresholds_unchanged(self):
        rows = self.q(
            "SELECT pg_get_functiondef(p.oid) AS def"
            " FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace"
            " WHERE n.nspname='wastewater' AND p.proname='fn_check_thresholds'"
            " AND pg_get_function_identity_arguments(p.oid)='reading_uuid uuid'"
        )
        self.assertEqual(len(rows), 1, "fn_check_thresholds(uuid) missing")
        self.assertEqual(
            _canon(rows[0]["def"]), _canon(LEGACY_FN_DEF_CANONICAL),
            "fn_check_thresholds definition drifted from its prior P12 text "
            "(byte-identical behavior required)",
        )


if __name__ == "__main__":
    unittest.main()
