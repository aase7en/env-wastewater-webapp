"""ENV-PARITY-P1-002 C1 — D2 RED-first live meter-chain contract test.

Queries ENV_DB (project gllqtbyofrcjzmbnfoeh, ap-southeast-1) through the
same Management-API access path as scripts/apply_migration_api.py
(scripts/_env.py; SUPABASE_ACCESS_TOKEN from Drive secrets — never printed).

Assertion groups (WO §3.2; groups 1–3 must FAIL truthfully while migration
20261115140000_parity_p1_002.sql is UNAPPLIED — the RED record goes in the
handoff — and pass GREEN after it):

  1. `core.equipment_spec_kind` enum (4 pinned values), `core.equipment_spec`
     table (pinned column shape, named CHECK constraints, UNIQUE
     (kind, valid_from), RLS enabled with NO policies) and the 4 seed rows
     exist with EXACT pinned values + `valid_from = 2024-01-09` + the
     provenance source text ("owner-confirmed 2026-11-15 …").
  2. `wastewater.v_reading_meter_chain` exists with the pinned name and the
     pinned column shape; the view spans exactly the wastewater.reading row
     set (spot-run over the 907 real rows).
  3. Semantics via ONE transaction-scoped fixture batch (parse-safe canary
     gates on the table/view existing; while unapplied the batch is never
     sent and the truthful RED is the gate failing): clearly-marked fixture
     rows (note 'P1.002-FIXTURE', far-future dates 2098/2099, legacy_id NULL,
     location_id NULL) + fixture spec rows + a fixture carbon meter with 3
     readings, then ROLLBACK with pre/post row-count proof on
     wastewater.reading, core.equipment_spec, carbon.meter, carbon.reading
     and wastewater.threshold_alert — zero durable writes is itself asserted.
     Cases:
       - spec date-join: reading BEFORE valid_from → no spec (volume NULL +
         spec_missing TRUE); inside the window → pinned value; a second
         spec row with a later valid_from takes over after its start date
         (append-never-overwrite proof);
       - LAG-previous = date-nearest PRIOR row, NOT global MAX (out-of-order
         construction where the global max is a real-table row);
       - delta ≤ 0 → NULL + meter_boundary_flag TRUE with reason (meter
         reset/swap; never 0, never negative); missing counterpart → NULL +
         flag with its own reason;
       - missing pump meter → delta NULL without a boundary flag (unknown
         input, not a boundary anomaly);
       - wastewater_in_derived NULL when either pump volume is missing
         (numeric only — never the AppSheet text prompt);
       - avg_westwater_4d ignores missing calendar days and is NULL over an
         all-NULL window;
       - chlorine_used_real ÷2/÷4/÷9 per the verbatim SWITCH, NULL on
         unknown ratio and NULL value (the unknown ratio is exercisable as
         a NULL ratio: P1.001's ck_wastewater_reading_chlorine_mix_ratio_enum
         confines the column to {1:2,1:4,1:9}+NULL — the view's ELSE NULL
         branch stays for future ratio additions);
       - chlorine_streak_count gaps-and-islands: first day 1, consecutive
         increments, NULL usage resets to 0, calendar gap resets to 1.
  4. Regression guards (expected GREEN even pre-apply — they pin EXISTING
     objects this lane must never touch): v_reading_with_computed keeps its
     byte-pinned definition incl. the discovered
     `(pump2_meter - pump1_meter) AS energy_kwh_estimate` quirk; the P1.3
     v_reading_critical_flags surface keeps its pinned columns; grant sets
     on wastewater.reading and v_reading_critical_flags are unchanged and
     the NEW objects carry owner-only grants (no new grants).

Run:  uv run python -m pytest scripts/test_parity_p1_002_meter_chain.py -q
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

API_URL = (
    "https://api.supabase.com/v1/projects/gllqtbyofrcjzmbnfoeh/database/query"
)

MIGRATION = "20261115140000_parity_p1_002.sql"

# History-bound valid_from pinned at D3 preflight: = live MIN(reading_date)
# = 2024-01-09 (907 rows span 2024-01-09..2026-07-04; NEVER CURRENT_DATE).
VALID_FROM = "2024-01-09"

EXPECTED_ENUM_LABELS = [
    "pump_wastewater_1",
    "pump_wastewater_2",
    "pump_groundwater",
    "chlorine_mix_groundwater",
]

# Pinned column shape (information_schema.columns: name → (data_type/udt, nullable)).
EXPECTED_TABLE_COLUMNS = {
    "id": ("uuid", "NO"),
    "kind": ("equipment_spec_kind", "NO"),
    "flow_m3_per_h": ("numeric", "YES"),
    "energy_kwh_per_h": ("numeric", "YES"),
    "mix_part_chlorine": ("numeric", "YES"),
    "mix_part_water": ("numeric", "YES"),
    "valid_from": ("date", "NO"),
    "valid_to": ("date", "YES"),
    "note": ("text", "YES"),
    "source": ("text", "YES"),
    "created_at": ("timestamp with time zone", "NO"),
}

# Named constraints that must exist (semantic-core fragments asserted inside
# the whitespace-normalized pg_get_constraintdef text; the rendered form
# casts enum comparisons as ::core.equipment_spec_kind and the pretty
# printer drops redundant parens — captured live at the GREEN run).
EXPECTED_CONSTRAINT_CORES = {
    "uq_equipment_spec_kind_valid_from": "UNIQUE (kind, valid_from)",
    "ck_equipment_spec_pump_ww1_flow_required": (
        "kind <> 'pump_wastewater_1'::core.equipment_spec_kind OR flow_m3_per_h IS NOT NULL"),
    "ck_equipment_spec_pump_ww2_flow_required": (
        "kind <> 'pump_wastewater_2'::core.equipment_spec_kind OR flow_m3_per_h IS NOT NULL"),
    "ck_equipment_spec_pump_gw_energy_required": (
        "kind <> 'pump_groundwater'::core.equipment_spec_kind OR energy_kwh_per_h IS NOT NULL"),
    "ck_equipment_spec_chlorine_mix_parts_required": (
        "kind <> 'chlorine_mix_groundwater'::core.equipment_spec_kind"
        " OR mix_part_chlorine IS NOT NULL AND mix_part_water IS NOT NULL"),
    "ck_equipment_spec_has_spec_value": "num_nonnulls(flow_m3_per_h, energy_kwh_per_h, mix_part_chlorine) >= 1",
    "ck_equipment_spec_positive_values": "flow_m3_per_h IS NULL OR flow_m3_per_h > 0",
    "ck_equipment_spec_valid_window": "valid_to IS NULL OR valid_to >= valid_from",
}

SEED_SOURCE = "owner-confirmed 2026-11-15 (plan §5.3 A1–A3)"
EXPECTED_SEEDS = {
    "pump_wastewater_1": {
        "flow_m3_per_h": 34, "energy_kwh_per_h": None,
        "mix_part_chlorine": None, "mix_part_water": None,
    },
    "pump_wastewater_2": {
        "flow_m3_per_h": 12, "energy_kwh_per_h": None,
        "mix_part_chlorine": None, "mix_part_water": None,
    },
    "pump_groundwater": {
        "flow_m3_per_h": None, "energy_kwh_per_h": 3.7,
        "mix_part_chlorine": None, "mix_part_water": None,
    },
    "chlorine_mix_groundwater": {
        "flow_m3_per_h": None, "energy_kwh_per_h": None,
        "mix_part_chlorine": 1, "mix_part_water": 9,
    },
}

# Pinned view column shape (name → data_type).
EXPECTED_VIEW_COLUMNS = [
    ("id", "uuid"),
    ("location_id", "uuid"),
    ("reading_date", "date"),
    ("created_at", "timestamp with time zone"),
    ("pump1_meter", "numeric"),
    ("prev_pump1_meter", "numeric"),
    ("pump2_meter", "numeric"),
    ("prev_pump2_meter", "numeric"),
    ("electric_meter", "numeric"),
    ("prev_electric_meter", "numeric"),
    ("carbon_reading_id", "uuid"),
    ("pump1_hours", "numeric"),
    ("pump2_hours", "numeric"),
    ("delta_kwh", "numeric"),
    ("pump1_spec_flow_m3_per_h", "numeric"),
    ("pump2_spec_flow_m3_per_h", "numeric"),
    ("pump1_m3", "numeric"),
    ("pump2_m3", "numeric"),
    ("wastewater_in_derived", "numeric"),
    ("avg_westwater_4d", "numeric"),
    ("chlorine_used", "numeric"),
    ("chlorine_mix_ratio", "text"),
    ("chlorine_used_real", "numeric"),
    ("chlorine_streak_count", "bigint"),
    ("meter_boundary_flag", "boolean"),
    ("meter_boundary_reason", "text"),
    ("spec_missing", "boolean"),
    ("spec_missing_kinds", "text"),
]

# Byte-pinned live definition of wastewater.v_reading_with_computed
# (pg_get_viewdef(…, true), captured READ-ONLY pre-migration at D2). This
# lane must never alter the view — the migration does not touch it.
LEGACY_VIEW_DEF_CANONICAL = (
    " SELECT id, location_id, reading_date, reported_by, tds_aeration,"
    " temp_aeration, tds_before_discharge, ph, do_aeration, do_sedimentation,"
    " do_before_discharge, sv30, free_chlorine, color_desc, smell_desc,"
    " screen_cleaned_coarse, screen_cleaned_fine, pump1_running, pump2_running,"
    " aerator1_running, aerator2_running, sludge_pump1_running,"
    " sludge_pump2_running, chlorine_pump1_running, chlorine_pump2_running,"
    " system_operating, pump1_meter, pump2_meter, water_used_total,"
    " wastewater_in, wastewater_discharged, chlorine_used, chlorine_mix_ratio,"
    " excess_sludge_removed, carbon_reading_id, input_source, note, created_at,"
    " legacy_id, reported_by_name_legacy,"
    " wastewater.fn_do_average(do_aeration, do_sedimentation,"
    " do_before_discharge) AS do_average, pump2_meter - pump1_meter AS"
    " energy_kwh_estimate, EXTRACT(year FROM reading_date)::integer + 543 AS"
    " date_thai_be FROM wastewater.reading r;"
)

# Pinned P1.3 surface columns (v_reading_critical_flags).
EXPECTED_CRITICAL_FLAGS_COLUMNS = [
    "id", "reading_date", "critical_do1", "critical_do2", "critical_do3",
    "critical_free_chlorine_low", "critical_free_chlorine_high",
    "critical_tds2", "critical_ph", "immediate_sv30", "immediate_wastewater_in",
]

# Pinned grant sets (grantee, privilege_type), captured READ-ONLY pre-migration.
GRANT_OWNER_ONLY = sorted(
    (role, priv) for role in ("postgres",)
    for priv in ("INSERT", "SELECT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER")
)
GRANT_BASELINE = {
    "reading": sorted(
        [("postgres", p) for p in ("INSERT", "SELECT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER")]
        + [("authenticated", p) for p in ("INSERT", "SELECT", "UPDATE", "DELETE")]
    ),
    "v_reading_critical_flags": GRANT_OWNER_ONLY,
}

FIXTURE_NOTE = "P1.002-FIXTURE"
FIXTURE_SPEC_NOTE = "P1.002-FIXTURE-SPEC"
FIXTURE_METER_NAME = "P1.002-FIXTURE electric"


def _probe(date: str, fields: dict[str, str]) -> str:
    """Scalar subselect building a json object for one fixture view row."""
    inner = ", ".join(f"'{k}', v.{expr}" for k, expr in fields.items())
    return (
        f"(SELECT json_build_object({inner}) FROM wastewater.v_reading_meter_chain v"
        f" WHERE v.reading_date = DATE '{date}')"
    )


# Fixture rows: (date, pump1_meter, pump2_meter, chlorine_used,
#                chlorine_mix_ratio, carbon_reading_day_or_None).
# Chain layout (LAG never skips NULLs):
#   - BEFORE1/BEFORE2 (2023-12-31 / 2024-01-01) sit BEFORE the real seed's
#     valid_from (2024-01-09): no spec resolves there → volumes NULL +
#     spec_missing TRUE on BEFORE2. BEFORE1 is the view's first row (prev
#     NULL → no deltas → boundary flag 'pump1: no previous reading').
#   - All 907 real rows (2024-01-09..2026-07-04) sit between BEFORE2 and the
#     2099 bands, so the 2099 chain is anchored by ANCHOR (2098-12-31):
#     its pump meters inherit the real last row's LAG, giving deterministic
#     deltas (+5/+1); the REAL seed (34, open-ended) resolves there —
#     proving the valid_from pin covers future dates too.
#   - Band A rows then test the fixture-spec takeover: at 2099-01-01 BOTH
#     the real seed (34) and fixture spec A (50, from 2099-01-01) match —
#     the LATERAL must pick the LATEST valid_from (50); at 2099-01-10
#     fixture spec B (60) takes over (append-never-overwrite proof).
#   - Band G row 1 (2099-02-01) inherits its pump2 LAG from F5, hence
#     2099 rows carry pump2 in +2 steps; its delta +10 resolves through the
#     REAL seed spec (12) by date-join.
def _fixture_rows(last_v1: float, last_v2: float) -> list[tuple]:
    v1, v2 = last_v1, last_v2
    return [
        # Band A0 — BEFORE the real seed valid_from (no spec resolves)
        ("2023-12-31", 1000.00, None, None, None, None),
        ("2024-01-01", 1005.00, None, None, None, None),        # +5, spec NULL → sm
        # Anchor — bridges the real rows' LAG into the 2099 chain
        ("2098-12-31", v1 + 5, v2 + 1, None, None, None),       # +5 ×34 = 170 (REAL seed)
        # Band A — fixture spec apply + append-never-overwrite takeover
        ("2099-01-01", v1 + 10, v2 + 3, None, None, None),      # +5 ×50 = 250
        ("2099-01-09", v1 + 15, v2 + 5, None, None, None),      # +5 ×50 = 250
        ("2099-01-10", v1 + 20, v2 + 7, None, None, None),      # +5 ×60 = 300 (takeover)
        ("2099-01-11", v1 + 25, v2 + 9, None, None, None),      # +5 ×60 = 300
        # Band B — LAG-not-MAX + meter-reset guard (pump2)
        ("2099-02-01", None, v2 + 19, None, None, None),        # +10 ×12 = 120 (REAL seed)
        ("2099-02-02", None, 100, None, None, None),            # delta ≤ 0 → NULL + flag
        ("2099-02-03", None, 150, None, None, None),            # prev = 100 (LAG, not MAX)
        # Band C — electric chain via fixture carbon meter
        ("2099-03-01", None, None, None, None, "2099-03-01"),   # prev elec NULL → flag
        ("2099-03-02", None, None, None, None, "2099-03-02"),   # delta 50
        ("2099-03-03", None, None, None, None, "2099-03-03"),   # delta ≤ 0 → NULL + flag
        # Band D — avg window + calendar gap (04-03 missing)
        ("2099-04-01", 2000, 3000, None, None, None),           # derived NULL (p1 prev NULL)
        ("2099-04-02", 2004, 3002, None, None, None),           # derived 264; avg 264
        ("2099-04-04", 2010, 3010, None, None, None),           # derived 456; avg 360
        ("2099-04-05", 2012, 3011, None, None, None),           # derived 132; avg 284
        # Band E — chlorine ÷SWITCH + streak
        ("2099-05-01", None, None, 10, "1:2", None),            # 5;  streak 1
        ("2099-05-02", None, None, 12, "1:4", None),            # 3;  streak 2
        ("2099-05-03", None, None, 9, "1:9", None),             # 1;  streak 3
        ("2099-05-04", None, None, 8, None, None),              # NULL (NULL ratio — the
                                                                # P1.001 enum CHECK confines
                                                                # ratio to 1:2/1:4/1:9+NULL);
                                                                # streak 0
        ("2099-05-05", None, None, None, "1:9", None),          # NULL (NULL value); streak 0
        ("2099-05-07", None, None, 6, "1:9", None),             # 2/3; streak 1 (restart)
        ("2099-05-08", None, None, 9, "1:9", None),             # 1;  streak 2
        ("2099-05-09", None, None, 4, "1:2", None),             # 2;  streak 3
        # Band J — pure calendar-gap resets (both days recorded)
        ("2099-06-01", None, None, 5, "1:9", None),             # gap from 05-09 → streak 1
        ("2099-06-03", None, None, 7, "1:9", None),             # gap at 06-02 → streak 1
        ("2099-06-04", None, None, 8, "1:9", None),             # consecutive → streak 2
    ]


def _fixture_batch(last_v1: float, last_v2: float) -> str:
    """One Management-API request (one transaction): fixtures → audit → ROLLBACK.

    Parse-safe canary in the test gates this batch on the table/view
    existing: while the migration is unapplied the batch is NOT sent (the
    INSERTs would fail at parse/plan time), so the truthful RED is the
    gate failing and the batch never reaching the DB.
    """
    meter_inserts = (
        f"INSERT INTO carbon.meter (meter_name, source, unit) VALUES ('{FIXTURE_METER_NAME}', 'electricity', 'kWh');\n"
        "INSERT INTO carbon.reading (meter_id, reading_date, meter_value)\n"
        "SELECT m.id, x.dt, x.v FROM carbon.meter m"
        " CROSS JOIN (VALUES (DATE '2099-03-01', 1000.0), (DATE '2099-03-02', 1050.0),"
        " (DATE '2099-03-03', 1030.0)) AS x(dt, v)"
        f" WHERE m.meter_name = '{FIXTURE_METER_NAME}';\n"
        "INSERT INTO core.equipment_spec (kind, flow_m3_per_h, valid_from, note, source)\n"
        "VALUES ('pump_wastewater_1', 50, DATE '2099-01-01',"
        f" '{FIXTURE_SPEC_NOTE}', 'fixture'),\n"
        "       ('pump_wastewater_1', 60, DATE '2099-01-10',"
        f" '{FIXTURE_SPEC_NOTE}', 'fixture');\n"
    )
    rows = []
    for d, p1, p2, cl, ratio, cr_day in _fixture_rows(last_v1, last_v2):
        cells = [f"DATE '{d}'"]
        cells.append("NULL" if p1 is None else f"{p1:.2f}")
        cells.append("NULL" if p2 is None else f"{p2:.2f}")
        cells.append("NULL" if cl is None else str(cl))
        cells.append("NULL" if ratio is None else f"'{ratio}'")
        if cr_day is None:
            cells.append("NULL")
        else:
            cells.append(
                "(SELECT cr.id FROM carbon.reading cr JOIN carbon.meter m ON m.id = cr.meter_id"
                f" WHERE m.meter_name = '{FIXTURE_METER_NAME}' AND cr.reading_date = DATE '{cr_day}')"
            )
        cells.append(f"'{FIXTURE_NOTE}'")
        rows.append("(" + ", ".join(cells) + ")")
    reading_insert = (
        "INSERT INTO wastewater.reading (reading_date, pump1_meter, pump2_meter,"
        " chlorine_used, chlorine_mix_ratio, carbon_reading_id, note) VALUES\n"
        + ",\n".join(rows) + ";\n"
    )
    probes = {
        # Band A0 — BEFORE the real seed valid_from
        "A0_first_row": _probe("2023-12-31", {
            "hours": "pump1_hours", "spec": "pump1_spec_flow_m3_per_h",
            "m3": "pump1_m3", "sm": "spec_missing", "smk": "spec_missing_kinds",
            "flag": "meter_boundary_flag", "reason": "meter_boundary_reason"}),
        "A0b_before_window": _probe("2024-01-01", {
            "hours": "pump1_hours", "spec": "pump1_spec_flow_m3_per_h",
            "m3": "pump1_m3", "sm": "spec_missing", "smk": "spec_missing_kinds"}),
        # Anchor — real seed resolves a far-future date (open-ended window)
        "ANCHOR_real_seed_future": _probe("2098-12-31", {
            "hours": "pump1_hours", "spec": "pump1_spec_flow_m3_per_h",
            "m3": "pump1_m3", "sm": "spec_missing", "flag": "meter_boundary_flag"}),
        # Band A — spec date-join + append-never-overwrite takeover
        "A1_apply": _probe("2099-01-01", {
            "m3": "pump1_m3", "spec": "pump1_spec_flow_m3_per_h",
            "sm": "spec_missing", "flag": "meter_boundary_flag"}),
        "A2_prev_lag": _probe("2099-01-09", {
            "m3": "pump1_m3", "spec": "pump1_spec_flow_m3_per_h",
            "prev": "prev_pump1_meter"}),
        "A3_takeover": _probe("2099-01-10", {
            "m3": "pump1_m3", "spec": "pump1_spec_flow_m3_per_h"}),
        "A4_after": _probe("2099-01-11", {"m3": "pump1_m3"}),
        # Band B — LAG-not-MAX + meter reset
        "B1_seed12": _probe("2099-02-01", {
            "m3": "pump2_m3", "flag": "meter_boundary_flag"}),
        "B2_reset": _probe("2099-02-02", {
            "hours": "pump2_hours", "m3": "pump2_m3",
            "flag": "meter_boundary_flag", "reason": "meter_boundary_reason"}),
        "B3_lag_not_max": _probe("2099-02-03", {
            "prev": "prev_pump2_meter", "m3": "pump2_m3",
            "flag": "meter_boundary_flag"}),
        # Band C — electric chain
        "C1_elec_first": _probe("2099-03-01", {
            "delta": "delta_kwh", "flag": "meter_boundary_flag",
            "reason": "meter_boundary_reason"}),
        "C2_elec_delta": _probe("2099-03-02", {
            "delta": "delta_kwh", "flag": "meter_boundary_flag"}),
        "C3_elec_reset": _probe("2099-03-03", {
            "delta": "delta_kwh", "flag": "meter_boundary_flag",
            "reason": "meter_boundary_reason"}),
        # Band D — derived inflow + avg window
        "D1_derived_null": _probe("2099-04-01", {
            "derived": "wastewater_in_derived", "flag": "meter_boundary_flag",
            "reason": "meter_boundary_reason"}),
        "D2_avg2": _probe("2099-04-02", {
            "derived": "wastewater_in_derived", "avg": "avg_westwater_4d",
            "flag": "meter_boundary_flag"}),
        "D3_avg4_gap": _probe("2099-04-04", {"avg": "avg_westwater_4d"}),
        "D4_avg5": _probe("2099-04-05", {"avg": "avg_westwater_4d"}),
        "D5_avg_empty_window": _probe("2099-03-01", {"avg": "avg_westwater_4d"}),
        # Band E — chlorine ÷SWITCH + streak
        "E1_div2": _probe("2099-05-01", {
            "real": "chlorine_used_real", "streak": "chlorine_streak_count"}),
        "E2_div4": _probe("2099-05-02", {
            "real": "chlorine_used_real", "streak": "chlorine_streak_count"}),
        "E3_div9": _probe("2099-05-03", {
            "real": "chlorine_used_real", "streak": "chlorine_streak_count"}),
        "E4_unknown_ratio": _probe("2099-05-04", {
            "real": "chlorine_used_real", "streak": "chlorine_streak_count"}),
        "E5_null_value": _probe("2099-05-05", {
            "real": "chlorine_used_real", "streak": "chlorine_streak_count"}),
        "E6_restart": _probe("2099-05-07", {
            "real": "chlorine_used_real", "streak": "chlorine_streak_count"}),
        "E7_streak2": _probe("2099-05-08", {"streak": "chlorine_streak_count"}),
        "E8_streak3": _probe("2099-05-09", {"streak": "chlorine_streak_count"}),
        # Band J — gap resets
        "J1_gap_after_streak": _probe("2099-06-01", {"streak": "chlorine_streak_count"}),
        "J2_gap_reset": _probe("2099-06-03", {"streak": "chlorine_streak_count"}),
        "J3_continue": _probe("2099-06-04", {"streak": "chlorine_streak_count"}),
        # Global honesty invariants over ALL rows visible in the transaction
        "N_never_negative": (
            "(SELECT json_build_object("
            "'min_p1m3', (SELECT min(pump1_m3) FROM wastewater.v_reading_meter_chain),"
            "'min_p2m3', (SELECT min(pump2_m3) FROM wastewater.v_reading_meter_chain),"
            "'min_delta', (SELECT min(delta_kwh) FROM wastewater.v_reading_meter_chain),"
            "'view_rows', (SELECT count(*) FROM wastewater.v_reading_meter_chain),"
            "'reading_rows', (SELECT count(*) FROM wastewater.reading)"
            "))"
        ),
    }
    audit = (
        "SELECT json_build_object("
        "'counts_post_insert', json_build_object("
        "'reading', (SELECT count(*) FROM wastewater.reading),"
        "'spec', (SELECT count(*) FROM core.equipment_spec),"
        "'meters', (SELECT count(*) FROM carbon.meter),"
        "'carbon_reading', (SELECT count(*) FROM carbon.reading),"
        "'alerts', (SELECT count(*) FROM wastewater.threshold_alert)),"
        + ", ".join(f"'{k}', {expr}" for k, expr in probes.items())
        + ") AS audit;"
    )
    # NOTE: the Management-API query endpoint returns ONLY the final
    # statement's result set, so the batch carries ONE SELECT (audit, with
    # the in-transaction counts inside it); the post-rollback zero-write
    # proof re-queries the counts as a separate request (P1.3 pattern).
    return meter_inserts + reading_insert + audit + "\nROLLBACK;"


def _canary() -> str:
    """Parse-safe presence probe for the new objects.

    to_regclass(text) returns NULL (never raises) for a missing relation.
    This MUST be its own request: PostgreSQL resolves relations and types
    at parse time, so a batch inserting into core.equipment_spec or reading
    the view would fail at parse time while the migration is unapplied —
    the canary gates the fixture batch on the objects being present.
    """
    return (
        "SELECT"
        " (to_regclass('core.equipment_spec') IS NOT NULL) AS spec_table_present,"
        " (to_regclass('wastewater.v_reading_meter_chain') IS NOT NULL) AS view_present,"
        " (to_regtype('core.equipment_spec_kind') IS NOT NULL) AS enum_present,"
        " (to_regclass('wastewater.threshold_alert') IS NOT NULL) AS alerts_table_present"
    )


def _query():
    """Management-API query fn (Drive-resolved token) or None — mirrors
    scripts/test_parity_p1_003_thresholds.py:_query (same approved resolver,
    token never printed or persisted)."""
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


def _canon(text: str) -> str:
    """Whitespace-normalized form for byte-pinning definitions."""
    return " ".join(text.split())


def _require_present(cls, present: dict, what: str):
    missing = [k for k, v in present.items() if not v]
    if missing:
        cls.fail(
            f"{what} missing (migration {MIGRATION} unapplied): "
            f"{', '.join(missing)} — fixture batch NOT sent (parse-time "
            "failure and zero-write risk avoided); semantics assertions "
            "cannot be evaluated yet"
        )


class C1MeterChainLiveContract(unittest.TestCase):
    """Live ENV_DB meter-chain contract (spec table + seeds + view + fixtures)."""

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

    # ── Group 1: enum + table shape + seeds ──

    def test_enum_and_table_shape(self):
        # RED pre-apply = truthful failure naming the missing object.
        present = self.q(
            "SELECT (to_regtype('core.equipment_spec_kind') IS NOT NULL) AS enum_present,"
            " (to_regclass('core.equipment_spec') IS NOT NULL) AS table_present"
        )[0]
        if not (present["enum_present"] and present["table_present"]):
            self.fail(
                "core.equipment_spec_kind / core.equipment_spec missing "
                f"(migration {MIGRATION} unapplied) — RED as designed"
            )
        labels = self.q(
            "SELECT e.enumlabel FROM pg_enum e"
            " JOIN pg_type t ON t.oid = e.enumtypid"
            " JOIN pg_namespace n ON n.oid = t.typnamespace"
            " WHERE t.typname = 'equipment_spec_kind' AND n.nspname = 'core'"
            " ORDER BY e.enumsortorder"
        )
        self.assertEqual(
            [r["enumlabel"] for r in labels], EXPECTED_ENUM_LABELS,
            "enum values/order must match the pinned 4-value set",
        )
        cols = self.q(
            "SELECT column_name, data_type, udt_name, is_nullable"
            " FROM information_schema.columns"
            " WHERE table_schema='core' AND table_name='equipment_spec'"
            " ORDER BY ordinal_position"
        )
        got = {
            r["column_name"]: (
                r["udt_name"] if r["data_type"] == "USER-DEFINED" else r["data_type"],
                r["is_nullable"],
            )
            for r in cols
        }
        self.assertEqual(got, EXPECTED_TABLE_COLUMNS, "table column shape drifted")
        cons = self.q(
            "SELECT con.conname, pg_get_constraintdef(con.oid, true) AS def"
            " FROM pg_constraint con"
            " JOIN pg_class c ON c.oid = con.conrelid"
            " JOIN pg_namespace n ON n.oid = c.relnamespace"
            " WHERE n.nspname='core' AND c.relname='equipment_spec'"
            " AND con.contype IN ('u','c','p')"
        )
        by_name = {r["conname"]: _canon(r["def"]) for r in cons}
        for name, core in EXPECTED_CONSTRAINT_CORES.items():
            with self.subTest(constraint=name):
                self.assertIn(name, by_name, f"missing constraint {name}")
                self.assertIn(core, by_name[name], f"{name} definition drifted")
        rls = self.q(
            "SELECT c.relrowsecurity,"
            " (SELECT count(*) FROM pg_policies p"
            "  WHERE p.schemaname='core' AND p.tablename='equipment_spec') AS policies"
            " FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace"
            " WHERE n.nspname='core' AND c.relname='equipment_spec'"
        )[0]
        self.assertTrue(rls["relrowsecurity"], "RLS must be ENABLED on the new table")
        self.assertEqual(
            rls["policies"], 0,
            "deny-pending posture: NO policies on the new table",
        )
        grantees = self.q(
            "SELECT DISTINCT grantee FROM information_schema.role_table_grants"
            " WHERE table_schema='core' AND table_name='equipment_spec'"
        )
        self.assertEqual(
            {r["grantee"] for r in grantees}, {"postgres"},
            "new table must carry owner-only grants (no GRANT statements)",
        )

    def test_seed_rows_exact(self):
        present = self.q(
            "SELECT (to_regclass('core.equipment_spec') IS NOT NULL) AS table_present"
        )[0]
        if not present["table_present"]:
            self.fail(
                f"core.equipment_spec missing (migration {MIGRATION} unapplied) — RED as designed"
            )
        rows = self.q(
            "SELECT kind, flow_m3_per_h, energy_kwh_per_h, mix_part_chlorine,"
            " mix_part_water, valid_from, note, source"
            " FROM core.equipment_spec ORDER BY kind"
        )
        self.assertEqual(
            len(rows), 4, f"expected exactly 4 seed rows, found {len(rows)}"
        )
        self.assertEqual(
            {r["kind"] for r in rows}, set(EXPECTED_SEEDS),
            "seed kind set must match the pinned table exactly",
        )
        for r in rows:
            with self.subTest(seed=r["kind"]):
                exp = EXPECTED_SEEDS[r["kind"]]
                for col, want in exp.items():
                    got = r[col]
                    if want is None:
                        self.assertIsNone(got, f"{r['kind']}.{col} must be NULL")
                    else:
                        self.assertAlmostEqual(
                            float(got), float(want), places=9, msg=f"{r['kind']}.{col}"
                        )
                self.assertEqual(
                    r["valid_from"], VALID_FROM,
                    f"{r['kind']} valid_from must be the pinned literal",
                )
                self.assertEqual(
                    r["source"], SEED_SOURCE, f"{r['kind']} provenance source"
                )
                self.assertTrue(r["note"], f"{r['kind']} carries an honest note")

    # ── Group 2: view exists + pinned shape + 907-row spot-run ──

    def test_view_exists_pinned_shape_spans_readings(self):
        present = self.q(
            "SELECT (to_regclass('wastewater.v_reading_meter_chain') IS NOT NULL) AS view_present"
        )[0]
        if not present["view_present"]:
            self.fail(
                f"wastewater.v_reading_meter_chain missing (migration {MIGRATION} "
                "unapplied) — RED as designed"
            )
        cols = self.q(
            "SELECT column_name, data_type FROM information_schema.columns"
            " WHERE table_schema='wastewater' AND table_name='v_reading_meter_chain'"
            " ORDER BY ordinal_position"
        )
        self.assertEqual(
            [(c["column_name"], c["data_type"]) for c in cols],
            EXPECTED_VIEW_COLUMNS,
            "view column shape/order drifted from the pinned list",
        )
        counts = self.q(
            "SELECT (SELECT count(*) FROM wastewater.v_reading_meter_chain) AS view_rows,"
            " (SELECT count(*) FROM wastewater.reading) AS reading_rows"
        )[0]
        self.assertEqual(
            counts["view_rows"], counts["reading_rows"],
            "view must span exactly the wastewater.reading row set (spot-run)",
        )
        self.assertGreaterEqual(counts["reading_rows"], 907, "real rows present")
        grantees = self.q(
            "SELECT DISTINCT grantee FROM information_schema.role_table_grants"
            " WHERE table_schema='wastewater' AND table_name='v_reading_meter_chain'"
        )
        self.assertEqual(
            {r["grantee"] for r in grantees}, {"postgres"},
            "new view must carry owner-only grants (plain CREATE convention)",
        )

    # ── Group 3: semantics via rolled-back fixtures ──

    def test_meter_chain_semantics_rollback_fixture(self):
        baseline = self.q(
            "SELECT json_build_object("
            "'reading', (SELECT count(*) FROM wastewater.reading),"
            "'spec', (SELECT count(*) FROM core.equipment_spec),"
            "'meters', (SELECT count(*) FROM carbon.meter),"
            "'carbon_reading', (SELECT count(*) FROM carbon.reading),"
            "'alerts', (SELECT count(*) FROM wastewater.threshold_alert)"
            ") AS counts"
        )[0]["counts"]

        canary = self.q(_canary())[0]
        _require_present(
            self,
            {k: canary[k] for k in (
                "spec_table_present", "view_present", "enum_present",
                "alerts_table_present")},
            "migration objects",
        )

        # LAG anchors from the real table's last row (deterministic fixture
        # deltas; see _fixture_rows).
        last = self.q(
            "SELECT pump1_meter, pump2_meter FROM wastewater.reading"
            " ORDER BY reading_date DESC, created_at DESC, id DESC LIMIT 1"
        )[0]
        last_v1, last_v2 = float(last["pump1_meter"]), float(last["pump2_meter"])

        result = self.q(_fixture_batch(last_v1, last_v2))[0]
        a = result["audit"]

        # In-transaction fixture footprint (28 readings + 2 spec rows + 1
        # meter + 3 carbon readings): proves the fixture batch inserted.
        self.assertEqual(
            a["counts_post_insert"]["reading"], baseline["reading"] + 28)
        self.assertEqual(
            a["counts_post_insert"]["spec"], baseline["spec"] + 2)
        self.assertEqual(
            a["counts_post_insert"]["meters"], baseline["meters"] + 1)
        self.assertEqual(
            a["counts_post_insert"]["carbon_reading"], baseline["carbon_reading"] + 3)

        def num(key: str, field: str, expected: float | None, places: int = 6):
            got = a[key][field] if a.get(key) else None
            if expected is None:
                self.assertIsNone(got, f"{key}.{field} must be NULL")
            else:
                self.assertIsNotNone(got, f"{key}.{field} must NOT be NULL")
                self.assertAlmostEqual(float(got), expected, places=places, msg=f"{key}.{field}")

        # Band A0 — BEFORE the real seed valid_from
        num("A0_first_row", "hours", None)          # view's first row: prev NULL
        num("A0_first_row", "spec", None)
        num("A0_first_row", "m3", None)
        self.assertIs(a["A0_first_row"]["sm"], False,
                      "no hours computed on the first row → no spec-missing flag")
        self.assertIs(a["A0_first_row"]["flag"], True,
                      "first row with a present meter → boundary flag")
        self.assertIn("pump1: no previous reading", a["A0_first_row"]["reason"])
        num("A0b_before_window", "hours", 5)
        num("A0b_before_window", "spec", None)
        num("A0b_before_window", "m3", None)
        self.assertIs(a["A0b_before_window"]["sm"], True)
        self.assertIn("pump_wastewater_1", a["A0b_before_window"]["smk"])
        self.assertNotIn("pump_wastewater_2", a["A0b_before_window"]["smk"])
        # Anchor — the REAL seed (34, open-ended window) resolves a 2098 date
        num("ANCHOR_real_seed_future", "hours", 5)
        num("ANCHOR_real_seed_future", "spec", 34)
        num("ANCHOR_real_seed_future", "m3", 170)
        self.assertIs(a["ANCHOR_real_seed_future"]["sm"], False)
        self.assertIs(a["ANCHOR_real_seed_future"]["flag"], False)
        # Band A — fixture spec apply (latest valid_from wins over the real
        # seed's open-ended 34) + append-never-overwrite takeover
        num("A1_apply", "m3", 250)
        num("A1_apply", "spec", 50)
        self.assertIs(a["A1_apply"]["sm"], False)
        self.assertIs(a["A1_apply"]["flag"], False)
        num("A2_prev_lag", "m3", 250)
        num("A2_prev_lag", "spec", 50)
        num("A2_prev_lag", "prev", last_v1 + 10)
        self.assertNotAlmostEqual(float(a["A2_prev_lag"]["prev"]), last_v1 + 25, places=6,
                                  msg="prev must be the date-nearest prior row, not a later row")
        num("A3_takeover", "m3", 300)
        num("A3_takeover", "spec", 60)
        num("A4_after", "m3", 300)

        # Band B — LAG-not-MAX + meter reset
        num("B1_seed12", "m3", 120)  # real seed spec 12 resolved by date-join
        self.assertIs(a["B1_seed12"]["flag"], False)
        num("B2_reset", "hours", None)
        num("B2_reset", "m3", None)
        self.assertIs(a["B2_reset"]["flag"], True, "delta ≤ 0 must raise the boundary flag")
        self.assertIn("pump2: delta <= 0", a["B2_reset"]["reason"])
        num("B3_lag_not_max", "prev", 100)
        self.assertNotAlmostEqual(float(a["B3_lag_not_max"]["prev"]), last_v2, places=6,
                                  msg="prev must NOT be the global max (AppSheet bug)")
        num("B3_lag_not_max", "m3", 600)
        self.assertIs(a["B3_lag_not_max"]["flag"], False)

        # Band C — electric chain
        num("C1_elec_first", "delta", None)
        self.assertIs(a["C1_elec_first"]["flag"], True)
        self.assertIn("electric: no previous reading", a["C1_elec_first"]["reason"])
        num("C2_elec_delta", "delta", 50)
        self.assertIs(a["C2_elec_delta"]["flag"], False)
        num("C3_elec_reset", "delta", None)
        self.assertIs(a["C3_elec_reset"]["flag"], True)
        self.assertIn("electric: delta <= 0", a["C3_elec_reset"]["reason"])

        # Band D — derived inflow + AVG window
        num("D1_derived_null", "derived", None)
        self.assertIs(a["D1_derived_null"]["flag"], True,
                      "present meter with a missing counterpart → boundary flag")
        self.assertIn("pump1: no previous reading", a["D1_derived_null"]["reason"])
        num("D2_avg2", "derived", 264)
        num("D2_avg2", "avg", 264)
        self.assertIs(a["D2_avg2"]["flag"], False)
        num("D3_avg4_gap", "avg", 360)
        num("D4_avg5", "avg", 284)
        num("D5_avg_empty_window", "avg", None)

        # Band E — chlorine ÷SWITCH + streak
        num("E1_div2", "real", 5)
        self.assertEqual(a["E1_div2"]["streak"], 1)
        num("E2_div4", "real", 3)
        self.assertEqual(a["E2_div4"]["streak"], 2)
        num("E3_div9", "real", 1)
        self.assertEqual(a["E3_div9"]["streak"], 3)
        num("E4_unknown_ratio", "real", None)
        self.assertEqual(a["E4_unknown_ratio"]["streak"], 0)
        num("E5_null_value", "real", None)
        self.assertEqual(a["E5_null_value"]["streak"], 0)
        num("E6_restart", "real", 6 / 9, places=6)
        self.assertEqual(a["E6_restart"]["streak"], 1)
        self.assertEqual(a["E7_streak2"]["streak"], 2)
        self.assertEqual(a["E8_streak3"]["streak"], 3)

        # Band J — pure gap resets
        self.assertEqual(a["J1_gap_after_streak"]["streak"], 1)
        self.assertEqual(a["J2_gap_reset"]["streak"], 1)
        self.assertEqual(a["J3_continue"]["streak"], 2)

        # Global honesty invariants: never negative anywhere; view spans readings.
        n = a["N_never_negative"]
        for field in ("min_p1m3", "min_p2m3", "min_delta"):
            got = n[field]
            if got is not None:
                self.assertGreaterEqual(float(got), 0, f"{field} must never go negative")
        self.assertEqual(n["view_rows"], n["reading_rows"])

        after = self.q(
            "SELECT json_build_object("
            "'reading', (SELECT count(*) FROM wastewater.reading),"
            "'spec', (SELECT count(*) FROM core.equipment_spec),"
            "'meters', (SELECT count(*) FROM carbon.meter),"
            "'carbon_reading', (SELECT count(*) FROM carbon.reading),"
            "'alerts', (SELECT count(*) FROM wastewater.threshold_alert)"
            ") AS counts"
        )[0]["counts"]
        self.assertEqual(
            after, baseline,
            "ZERO-DURABLE-WRITES VIOLATION: fixture transaction leaked rows "
            f"(baseline={baseline}, after={after}); leaked rows carry "
            f"note='{FIXTURE_NOTE}' / '{FIXTURE_SPEC_NOTE}' for identification",
        )

    # ── Group 4: regression guards (existing surface untouched) ──

    def test_v_reading_with_computed_byte_identical(self):
        rows = self.q(
            "SELECT pg_get_viewdef('wastewater.v_reading_with_computed'::regclass, true) AS def"
        )
        self.assertEqual(len(rows), 1)
        self.assertEqual(
            _canon(rows[0]["def"]), _canon(LEGACY_VIEW_DEF_CANONICAL),
            "v_reading_with_computed definition drifted from its pinned text "
            "(byte-identical behavior required, incl. the energy_kwh_estimate "
            "quirk: pump2_meter - pump1_meter)",
        )

    def test_p13_critical_flags_surface_intact(self):
        cols = self.q(
            "SELECT column_name FROM information_schema.columns"
            " WHERE table_schema='wastewater' AND table_name='v_reading_critical_flags'"
            " ORDER BY ordinal_position"
        )
        self.assertEqual(
            [c["column_name"] for c in cols], EXPECTED_CRITICAL_FLAGS_COLUMNS,
            "P1.3 critical-flags surface columns drifted",
        )

    def test_no_new_grants_on_existing_objects(self):
        def grant_set(table: str):
            rows = self.q(
                "SELECT grantee, privilege_type FROM information_schema.role_table_grants"
                " WHERE table_schema='wastewater' AND table_name='" + table + "'"
            )
            return sorted((r["grantee"], r["privilege_type"]) for r in rows)

        self.assertEqual(
            grant_set("reading"), GRANT_BASELINE["reading"],
            "wastewater.reading grant set must be unchanged (no new grants)",
        )
        self.assertEqual(
            grant_set("v_reading_critical_flags"), GRANT_BASELINE["v_reading_critical_flags"],
            "v_reading_critical_flags grant set must be unchanged",
        )


if __name__ == "__main__":
    unittest.main()
