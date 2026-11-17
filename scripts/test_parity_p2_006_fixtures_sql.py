"""ENV-PARITY-P2-006 C1 — the AppSheet-parity SQL fixture battery for the
Phase-2 surfaces (final Phase-2 lane P2.6; the P1.7 SQL-suite convention in
the P2.2/P2.3/P2.4 house shape).

Executes the SQL-semantics fixture cases (frontend/src/lib/parity-fixtures-p2.ts,
SAME case ids mirrored 1:1 via P2_006_SQL_CASE_IDS — WO §4/D1-2) against live
ENV_DB (project gllqtbyofrcjzmbnfoeh): ONE request per case batch — synthetic
probe INSERTs → asserts → ROLLBACK — ZERO net persistence (probe ids
re-queried after every batch = 0, asserted; preflight/post-run baselines
identical).

TEST-ONLY lane (WO §3, D1-2/D1-4): NO migration, NO new/changed DB object,
NO seed row, NO ENV_DB apply, NO grants/notify pgrst. Every write here lives
inside a single-request BEGIN…ROLLBACK — fixture masters, fixture
inspections and fixture checks are SYNTHETIC rows that never persist.

Case groups (WO §4-1..4-3):

  EXTINGUISHER (P2.2 delivered objects, verified at this base)
    EX-T01..06 — the Update_ExpDate trigger decision table: bump-later-only
                (chem_exp > master expiry ⇒ bump; ≤ ⇒ no-op; NULL chem_exp
                ⇒ no-op), the adjudicated NULL-expiry parity ruling (NULL
                master expiry + recorded chem_exp ⇒ SET — migration
                20261116000006; the divergence case), the deterministic
                tiebreak (created_at DESC then id DESC), the backdated
                latest-wins recompute.
    EX-R01..05 — fn_resolve_extinguisher_qr: known id ⇒ master copies +
                latest inspection + expiry status; unknown/blank/whitespace
                ⇒ fail-closed with the verbatim Valid If error (ref
                3159-3166); both payload forms (raw + padded) resolve
                identically; snapshot freezing (a later master change never
                rewrites the stored inspection snapshots).
  LIGHT (P2.3 delivered objects)
    LT-R01/02  — fn_resolve_emergency_light_qr: known erl_id ⇒ master +
                prior-check summary (the SortKey transcription order);
                unknown/blank/placeholder ⇒ fail-closed with the reused
                §3.13-family verbatim label (the recorded divergence); anon
                fail-closed.
    LT-D01..04 — the seed-reality distributions over the 332-row P2.3
                backfill, asserted as REAL data facts (test_result ผ่าน×316
                /ไม่ผ่าน×16; Persistency มี×315/ไม่มี×17; Position
                เหมาะสม×329/ไม่เหมาะสม×3; Status blank×300/ขอติดตั้ง×16/
                แจ้งซ่อม×14/แจ้งย้ายตำแหน่ง×2) — live-verified 2026-11-18.
    LT-K01     — catalog: safety.emergency_light_check stores NO
                SortKey-equivalent column (derive-never-store; ordering is
                query-time check_date DESC + id DESC).
  COLIFORM (P2.4 delivered objects)
    CB-C01     — catalog: the result-side columns (result, mpn_value,
                reported_date, reporter_id, result_image + the
                traceability sample_source/collect_point) carry NO DB
                defaults (step-2 writes are app-supplied).
    CB-C02     — the two-step transition smoke: collect-only INSERT lands
                pending (result-side NULL; sample_date DEFAULT CURRENT_DATE);
                the later result+reported_date UPDATE makes it resulted.
    CB-C03     — catalog: the ONLY CHECK constraints are the two FOOD-CORE-001
                canonical ones; the per-source vocabularies are never hard
                CHECKs (off-vocabulary never coerced).
    CB-F01     — catalog: the same-day gate TODAY()>[Collect_date] is
                UI-gated (showResultFields), NOT DB-enforced — the only
                triggers are trg_audit_log + trg_decrement_reagent.
  COUNTS       — preflight/post baselines identical: wastewater.reading 907,
                core.personnel 9, core.equipment_spec 4,
                safety.emergency_light 48, safety.fire_extinguisher 0,
                safety.extinguisher_inspection 0,
                safety.emergency_light_check 332, food.lab_test 0.

RED-first honesty (WO §7 D2, recorded): this script is NEW at D3 — it did
NOT exist at the RED commit, and its D3 first run is expected GREEN: its
subject is verification of EXISTING delivered objects (P2.2/P2.3/P2.4), not
absent ones. The lane's truthful RED lives in the TS suite
(frontend/src/lib/parity-fixtures-p2.test.ts, fail-to-collect at commit
e4b84c1 — the honest new-file-lane RED mode). Never claimed as RED here.

Secrets: SUPABASE_ACCESS_TOKEN resolves via the approved resolver
(scripts/_env.py, process-env tier first; A_WIKI_DRIVE_PATH override). No
secret is ever printed. Fixture values are SYNTHETIC — no personnel-
identity values, no production row copies, no 13-digit digit-runs.

Run:  A_WIKI_DRIVE_PATH=<drive root> uv run --with httpx python -m pytest \
      scripts/test_parity_p2_006_fixtures_sql.py -q
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

# Verbatim AppSheet QR_CODE Valid If error (ref 12 §3.13, ref 3159-3166;
# double space after "!!" is verbatim). Reused by the light resolve RPC for
# its fail-closed path (the LT-R02 recorded divergence).
ERR_QR_NOT_FOUND = "ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ"

# Synthetic fixture master row used ONLY inside ROLLED-BACK transactions
# (the P2.2 suite shape; the real PackedUUID shape observed in the
# ตรวจสอบถัง sheet — never a production row copy).
FIXTURE_EXT_ID = "vtiHJw6wpw4c6f4553dms5"
FIXTURE_MASTER_SQL = (
    "INSERT INTO safety.fire_extinguisher "
    "(legacy_row_id, location, extinguisher_type, packed_date, expiry_date, size_label, source_provenance, legacy_id) "
    f"VALUES ('{FIXTURE_EXT_ID}', 'ห้องเคาะปอด', 'เคมีแห้ง (Dry Chemical Extinguishers)', "
    "DATE '2025-09-13', DATE '2026-09-13', '15 ปอนด์', 'fixture (rolled back)', 'fixture-001')"
)

# Baseline counts (live-verified 2026-11-18 at base 85743a2).
BASELINES = {
    "reading": 907,      # wastewater.reading
    "personnel": 9,      # core.personnel
    "spec": 4,           # core.equipment_spec
    "light": 48,         # safety.emergency_light
    "ext": 0,            # safety.fire_extinguisher (SOURCE_UNAVAILABLE — NO seed, D1-4)
    "insp": 0,           # safety.extinguisher_inspection
    "lcheck": 332,       # safety.emergency_light_check (P2.3 seed)
    "lab": 0,            # food.lab_test (SOURCE_UNAVAILABLE — NO seed, D1-4)
}

BASELINE_SQL = (
    "SELECT (SELECT count(*) FROM wastewater.reading) AS reading,"
    " (SELECT count(*) FROM core.personnel) AS personnel,"
    " (SELECT count(*) FROM core.equipment_spec) AS spec,"
    " (SELECT count(*) FROM safety.emergency_light) AS light,"
    " (SELECT count(*) FROM safety.fire_extinguisher) AS ext,"
    " (SELECT count(*) FROM safety.extinguisher_inspection) AS insp,"
    " (SELECT count(*) FROM safety.emergency_light_check) AS lcheck,"
    " (SELECT count(*) FROM food.lab_test) AS lab"
)

# Probe residue ids — must be 0 after every batch (the ROLLBACK held).
RESIDUE_SQL = (
    "SELECT (SELECT count(*) FROM safety.extinguisher_inspection WHERE id IN"
    " ('deadbeef','a0000001','a0000002','a0000003','zzzz9999','aaaa0001','bbbb0002')) AS insp,"
    " (SELECT count(*) FROM safety.emergency_light_check WHERE id = 'cbfixchk1') AS lcheck,"
    " (SELECT count(*) FROM food.lab_test WHERE legacy_id = 'p2-006-probe') AS lab"
)


def _token() -> str:
    import os

    tok = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
    if not tok:
        from _env import load_secret

        tok = load_secret("SUPABASE_ACCESS_TOKEN")
    if not tok:
        raise unittest.SkipTest("SUPABASE_ACCESS_TOKEN not resolvable (Drive secrets offline)")
    return tok


_TOKEN = _token()


def q(sql: str):
    """One Management-API query. Raises AssertionError carrying the real
    DB error on failure. Retries Management-API throttling (429) with
    backoff."""
    import time

    last = None
    for attempt in range(6):
        r = httpx.post(
            API_URL,
            headers={"Authorization": f"Bearer {_TOKEN}", "Content-Type": "application/json"},
            json={"query": sql},
            timeout=120,
        )
        if r.status_code == 429:
            last = r.text[:200]
            time.sleep(3 * (attempt + 1))
            continue
        if r.status_code >= 400:
            try:
                msg = r.json().get("message") or r.text
            except Exception:
                msg = r.text
            raise AssertionError(f"DB query failed ({r.status_code}): {msg}")
        return r.json()
    raise AssertionError(f"DB query throttled after retries: {last}")


def _staff_and_personnel() -> tuple[str, str]:
    """(staff app_user uuid, an eligible personnel uuid) — read-only lookup,
    values stay inside the test process (never printed)."""
    rows = q(
        "SELECT (SELECT id FROM core.app_user WHERE role = 'staff' ORDER BY created_at LIMIT 1) AS staff_id,"
        " (SELECT id FROM core.personnel WHERE position IN ('นักวิชาการสาธารณสุข','พนักงานบริการ')"
        "   AND (status IS DISTINCT FROM 'ลาออก') ORDER BY full_name LIMIT 1) AS personnel_id"
    )[0]
    assert rows["staff_id"] and rows["personnel_id"], "live staff app_user / eligible personnel not found"
    return rows["staff_id"], rows["personnel_id"]


def _staff_ctx_assign(staff_id: str) -> str:
    """SQL that switches a single-request transaction into an
    authenticated-staff context (the Management API connects as postgres;
    auth.uid() reads request.jwt.claims)."""
    return (
        "SET LOCAL role authenticated;"
        f" SET LOCAL request.jwt.claims = '{{\"sub\":\"{staff_id}\",\"role\":\"authenticated\"}}';"
    )


def _tx(sql: str) -> str:
    """Wrap a smoke script in an explicit single-request BEGIN…ROLLBACK so
    NOTHING persists even on success (zero-net-persistence contract; the
    Management API auto-commits a bare statement). On an assertion RAISE
    the server-side aborted transaction rolls itself back."""
    return "BEGIN;\n" + sql + "\nROLLBACK;"


class P2ParityFixturesSql(unittest.TestCase):
    """The P2.6 SQL fixture battery — EX / LT / CB + COUNTS groups."""

    # ─────────────────────────── COUNTS ─────────────────────────────

    def test_00_preflight_baselines(self):
        counts = q(BASELINE_SQL)[0]
        for key, expected in BASELINES.items():
            self.assertEqual(
                counts[key], expected, f"preflight baseline {key} moved: {counts[key]} != {expected}"
            )

    # ──────────────────── EXTINGUISHER — trigger (EX-T01..06) ────────────────

    def test_10_EX_T01_bump_later_only_fires(self):
        staff_id, _ = _staff_and_personnel()
        sql = f"""
        DO $$
        DECLARE v_exp date;
        BEGIN
          {FIXTURE_MASTER_SQL};  -- master expiry 2026-09-13
          {_staff_ctx_assign(staff_id)}
          INSERT INTO safety.extinguisher_inspection
            (id, inspection_date, extinguisher_id, chem_exp_snapshot, source_provenance)
          VALUES ('a0000001', '2026-11-01T09:00:00+07', '{FIXTURE_EXT_ID}', '2029-01-01', 'fixture (rolled back)');
          SELECT expiry_date INTO v_exp FROM safety.fire_extinguisher WHERE legacy_row_id = '{FIXTURE_EXT_ID}';
          IF v_exp IS DISTINCT FROM DATE '2029-01-01' THEN
            RAISE EXCEPTION 'EX-T01: chem_exp > expiry must bump the master; got %', v_exp;
          END IF;
        END $$;
        """
        q(_tx(sql))

    def test_11_EX_T02_bump_later_only_guard(self):
        staff_id, _ = _staff_and_personnel()
        sql = f"""
        DO $$
        DECLARE v_exp date;
        BEGIN
          {FIXTURE_MASTER_SQL};  -- master expiry 2026-09-13
          {_staff_ctx_assign(staff_id)}
          INSERT INTO safety.extinguisher_inspection
            (id, inspection_date, extinguisher_id, chem_exp_snapshot, source_provenance)
          VALUES ('a0000002', '2026-10-01T09:00:00+07', '{FIXTURE_EXT_ID}', '2026-09-01', 'fixture (rolled back)');
          SELECT expiry_date INTO v_exp FROM safety.fire_extinguisher WHERE legacy_row_id = '{FIXTURE_EXT_ID}';
          IF v_exp IS DISTINCT FROM DATE '2026-09-13' THEN
            RAISE EXCEPTION 'EX-T02: chem_exp <= expiry must NOT bump; got %', v_exp;
          END IF;
        END $$;
        """
        q(_tx(sql))

    def test_12_EX_T03_null_chem_exp_noop(self):
        staff_id, _ = _staff_and_personnel()
        sql = f"""
        DO $$
        DECLARE v_exp date;
        BEGIN
          {FIXTURE_MASTER_SQL};
          {_staff_ctx_assign(staff_id)}
          INSERT INTO safety.extinguisher_inspection
            (id, inspection_date, extinguisher_id, chem_exp_snapshot, source_provenance)
          VALUES ('a0000003', '2026-11-01T09:00:00+07', '{FIXTURE_EXT_ID}', NULL, 'fixture (rolled back)');
          SELECT expiry_date INTO v_exp FROM safety.fire_extinguisher WHERE legacy_row_id = '{FIXTURE_EXT_ID}';
          IF v_exp IS DISTINCT FROM DATE '2026-09-13' THEN
            RAISE EXCEPTION 'EX-T03: NULL chem_exp insert must be a no-op; got %', v_exp;
          END IF;
        END $$;
        """
        q(_tx(sql))

    def test_13_EX_T04_null_master_expiry_sets_parity_ruling(self):
        staff_id, _ = _staff_and_personnel()
        sql = f"""
        DO $$
        DECLARE v_exp date;
        BEGIN
          -- NULL master expiry + non-NULL chem_exp ⇒ SET (the adjudicated
          -- parity ruling; fix migration 20261116000006 — AppSheet's blank
          -- master date behaves as the spreadsheet-serial zero-date
          -- 1899-12-30, so the verbatim bot fires; a real value is SET,
          -- never fabricated; ruling recorded verbatim in the P2.2 handoff
          -- repair section).
          INSERT INTO safety.fire_extinguisher
            (legacy_row_id, location, expiry_date, source_provenance, legacy_id)
          VALUES ('nullxppackuuid22ch', 'ทดสอบ', NULL, 'fixture (rolled back)', 'fixture-002');
          {_staff_ctx_assign(staff_id)}
          INSERT INTO safety.extinguisher_inspection
            (id, inspection_date, extinguisher_id, chem_exp_snapshot, source_provenance)
          VALUES ('b0000001', '2026-11-01T09:00:00+07', 'nullxppackuuid22ch', '2030-01-01', 'fixture (rolled back)');
          SELECT expiry_date INTO v_exp FROM safety.fire_extinguisher WHERE legacy_row_id = 'nullxppackuuid22ch';
          IF v_exp IS DISTINCT FROM DATE '2030-01-01' THEN
            RAISE EXCEPTION 'EX-T04: NULL master expiry + chem_exp must SET per ruling 20261116000006; got %', v_exp;
          END IF;
        END $$;
        """
        q(_tx(sql))

    def test_14_EX_T05_deterministic_tiebreak(self):
        staff_id, _ = _staff_and_personnel()
        sql = f"""
        DO $$
        DECLARE v_exp date;
        BEGIN
          {FIXTURE_MASTER_SQL};  -- expiry 2026-09-13
          {_staff_ctx_assign(staff_id)}
          -- Same inspection_date: the LATER-created row wins (created_at DESC).
          INSERT INTO safety.extinguisher_inspection
            (id, inspection_date, extinguisher_id, chem_exp_snapshot, created_at, source_provenance)
          VALUES ('zzzz9999', '2026-11-05T09:00:00+07', '{FIXTURE_EXT_ID}', '2031-06-01', '2026-11-05T09:00:01+07', 'fixture (rolled back)');
          INSERT INTO safety.extinguisher_inspection
            (id, inspection_date, extinguisher_id, chem_exp_snapshot, created_at, source_provenance)
          VALUES ('aaaa0001', '2026-11-05T09:00:00+07', '{FIXTURE_EXT_ID}', '2032-01-01', '2026-11-05T09:00:02+07', 'fixture (rolled back)');
          SELECT expiry_date INTO v_exp FROM safety.fire_extinguisher WHERE legacy_row_id = '{FIXTURE_EXT_ID}';
          IF v_exp IS DISTINCT FROM DATE '2032-01-01' THEN
            RAISE EXCEPTION 'EX-T05: created_at tiebreak must pick the later row (2032-01-01); got %', v_exp;
          END IF;
          -- Final fallback: equal inspection_date AND equal created_at → id DESC.
          INSERT INTO safety.extinguisher_inspection
            (id, inspection_date, extinguisher_id, chem_exp_snapshot, created_at, source_provenance)
          VALUES ('bbbb0002', '2026-11-05T09:00:00+07', '{FIXTURE_EXT_ID}', '2033-07-01', '2026-11-05T09:00:02+07', 'fixture (rolled back)');
          SELECT expiry_date INTO v_exp FROM safety.fire_extinguisher WHERE legacy_row_id = '{FIXTURE_EXT_ID}';
          IF v_exp IS DISTINCT FROM DATE '2033-07-01' THEN
            RAISE EXCEPTION 'EX-T05: id-DESC fallback must pick bbbb0002 (2033-07-01); got %', v_exp;
          END IF;
        END $$;
        """
        q(_tx(sql))

    def test_15_EX_T06_backdated_insert_latest_wins(self):
        staff_id, _ = _staff_and_personnel()
        sql = f"""
        DO $$
        DECLARE v_exp date;
        BEGIN
          {FIXTURE_MASTER_SQL};  -- expiry 2026-09-13
          {_staff_ctx_assign(staff_id)}
          -- latest inspection (2026-11-01) sets the master…
          INSERT INTO safety.extinguisher_inspection
            (id, inspection_date, extinguisher_id, chem_exp_snapshot, source_provenance)
          VALUES ('c0000001', '2026-11-01T09:00:00+07', '{FIXTURE_EXT_ID}', '2029-01-01', 'fixture (rolled back)');
          -- …then a BACKDATED insert with a LARGER chem_exp must NOT win:
          -- the SET recomputes from MAX(inspection_date) → stays 2029-01-01.
          INSERT INTO safety.extinguisher_inspection
            (id, inspection_date, extinguisher_id, chem_exp_snapshot, source_provenance)
          VALUES ('c0000002', '2026-10-15T09:00:00+07', '{FIXTURE_EXT_ID}', '2029-06-01', 'fixture (rolled back)');
          SELECT expiry_date INTO v_exp FROM safety.fire_extinguisher WHERE legacy_row_id = '{FIXTURE_EXT_ID}';
          IF v_exp IS DISTINCT FROM DATE '2029-01-01' THEN
            RAISE EXCEPTION 'EX-T06: backdated larger chem_exp must be ignored (latest-wins recompute); got %', v_exp;
          END IF;
        END $$;
        """
        q(_tx(sql))

    # ──────────────────── EXTINGUISHER — RPC (EX-R01..05) ────────────────────

    def test_20_EX_R01_known_id_payload(self):
        staff_id, personnel_id = _staff_and_personnel()
        sql = f"""
        DO $$
        DECLARE v jsonb;
        BEGIN
          {FIXTURE_MASTER_SQL};
          {_staff_ctx_assign(staff_id)}
          INSERT INTO safety.extinguisher_inspection
            (id, legacy_id, inspection_date, extinguisher_id, location_snapshot, type_snapshot,
             packed_date_snapshot, chem_exp_snapshot, size_snapshot, pipe, handle, tank,
             pressure_gauge, barrier, breakdown_details, cause_of_damaged, inspector_id,
             source_provenance)
          VALUES ('deadbeef', 'insp-0001', '2026-01-15T10:00:00+07', '{FIXTURE_EXT_ID}',
                  'ห้องเคาะปอด', 'เคมีแห้ง (Dry Chemical Extinguishers)', '2025-09-13',
                  '2026-01-15', '15 ปอนด์', 'ปกติ', 'ปกติ', 'ปกติ', 'ปกติ', 'ไม่มี',
                  'ไม่หมดอายุ', NULL, '{personnel_id}', 'fixture (rolled back)');
          v := safety.fn_resolve_extinguisher_qr('{FIXTURE_EXT_ID}');
          IF (v->'master'->>'legacy_row_id') IS DISTINCT FROM '{FIXTURE_EXT_ID}' THEN
            RAISE EXCEPTION 'EX-R01: master payload wrong: %', v;
          END IF;
          IF (v->'master'->>'location') IS DISTINCT FROM 'ห้องเคาะปอด' THEN
            RAISE EXCEPTION 'EX-R01: master location wrong: %', v;
          END IF;
          IF (v->'latest_inspection'->>'id') IS DISTINCT FROM 'deadbeef' THEN
            RAISE EXCEPTION 'EX-R01: latest_inspection wrong: %', v;
          END IF;
          -- master expiry 2026-09-13 <= today (2026-11) → หมดอายุ (honest)
          IF (v->>'expiry_status') IS DISTINCT FROM 'หมดอายุ' THEN
            RAISE EXCEPTION 'EX-R01: expiry_status wrong (expected หมดอายุ): %', v->>'expiry_status';
          END IF;
        END $$;
        """
        q(_tx(sql))

    def test_21_EX_R02_R03_fail_closed_verbatim(self):
        staff_id, _ = _staff_and_personnel()
        sql = f"""
        DO $$
        DECLARE v_err text;
        BEGIN
          {_staff_ctx_assign(staff_id)}
          -- EX-R02: unknown id
          BEGIN
            PERFORM safety.fn_resolve_extinguisher_qr('zzzzunknownzzzzzzzzzzzzz');
            RAISE EXCEPTION 'EX-R02: unknown qr did NOT fail closed';
          EXCEPTION WHEN OTHERS THEN
            v_err := SQLERRM;
            IF v_err NOT LIKE '%ไม่พบข้อมูล!!%' THEN
              RAISE EXCEPTION 'EX-R02: wrong error: %', v_err;
            END IF;
          END;
          -- EX-R03: blank / whitespace / the placeholder init (ref 3153)
          BEGIN
            PERFORM safety.fn_resolve_extinguisher_qr('');
            RAISE EXCEPTION 'EX-R03: blank qr did NOT fail closed';
          EXCEPTION WHEN OTHERS THEN
            v_err := SQLERRM;
            IF v_err NOT LIKE '%ไม่พบข้อมูล!!%' THEN
              RAISE EXCEPTION 'EX-R03 blank: wrong error: %', v_err;
            END IF;
          END;
          BEGIN
            PERFORM safety.fn_resolve_extinguisher_qr('   ');
            RAISE EXCEPTION 'EX-R03: whitespace qr did NOT fail closed';
          EXCEPTION WHEN OTHERS THEN
            v_err := SQLERRM;
            IF v_err NOT LIKE '%ไม่พบข้อมูล!!%' THEN
              RAISE EXCEPTION 'EX-R03 whitespace: wrong error: %', v_err;
            END IF;
          END;
          BEGIN
            PERFORM safety.fn_resolve_extinguisher_qr('สแกน QR CODE');
            RAISE EXCEPTION 'EX-R03: placeholder qr did NOT fail closed';
          EXCEPTION WHEN OTHERS THEN
            v_err := SQLERRM;
            IF v_err NOT LIKE '%ไม่พบข้อมูล!!%' THEN
              RAISE EXCEPTION 'EX-R03 placeholder: wrong error: %', v_err;
            END IF;
          END;
        END $$;
        """
        q(_tx(sql))

    def test_22_EX_R04_both_forms_resolve_identically(self):
        staff_id, personnel_id = _staff_and_personnel()
        sql = f"""
        DO $$
        DECLARE v jsonb;
        BEGIN
          {FIXTURE_MASTER_SQL};
          {_staff_ctx_assign(staff_id)}
          INSERT INTO safety.extinguisher_inspection
            (id, inspection_date, extinguisher_id, chem_exp_snapshot, source_provenance)
          VALUES ('deadbeef', '2026-01-15T10:00:00+07', '{FIXTURE_EXT_ID}', '2026-01-15', 'fixture (rolled back)');
          -- the padded form btrims to the SAME master row (both-forms pin)
          v := safety.fn_resolve_extinguisher_qr('  {FIXTURE_EXT_ID}  ');
          IF (v->'master'->>'legacy_row_id') IS DISTINCT FROM '{FIXTURE_EXT_ID}' THEN
            RAISE EXCEPTION 'EX-R04: padded qr did not resolve identically: %', v;
          END IF;
          IF (v->'latest_inspection'->>'id') IS DISTINCT FROM 'deadbeef' THEN
            RAISE EXCEPTION 'EX-R04: payload mismatch across forms: %', v;
          END IF;
        END $$;
        """
        q(_tx(sql))

    def test_23_EX_R05_snapshot_freezing(self):
        staff_id, _ = _staff_and_personnel()
        sql = f"""
        DO $insp$
        DECLARE v_snap text;
        BEGIN
          {FIXTURE_MASTER_SQL};  -- location ห้องเคาะปอด
          {_staff_ctx_assign(staff_id)}
          INSERT INTO safety.extinguisher_inspection
            (id, inspection_date, extinguisher_id, location_snapshot, source_provenance)
          VALUES ('deadbeef', '2026-01-15T10:00:00+07', '{FIXTURE_EXT_ID}', 'ห้องเคาะปอด', 'fixture (rolled back)');
        END $insp$;
        RESET ROLE;
        -- the master later moves (admin/postgres path)…
        UPDATE safety.fire_extinguisher SET location = 'ห้องยา'
         WHERE legacy_row_id = '{FIXTURE_EXT_ID}';
        DO $assert$
        DECLARE v_master text; v_snap text;
        BEGIN
          SELECT location INTO v_master FROM safety.fire_extinguisher WHERE legacy_row_id = '{FIXTURE_EXT_ID}';
          SELECT location_snapshot INTO v_snap FROM safety.extinguisher_inspection WHERE id = 'deadbeef';
          IF v_master IS DISTINCT FROM 'ห้องยา' THEN
            RAISE EXCEPTION 'EX-R05 precondition: master must have moved; got %', v_master;
          END IF;
          -- …but the stored inspection snapshot keeps the INSERT-TIME value
          -- (history is immutable; a master change never rewrites it).
          IF v_snap IS DISTINCT FROM 'ห้องเคาะปอด' THEN
            RAISE EXCEPTION 'EX-R05: snapshot must stay frozen at ห้องเคาะปอด; got %', v_snap;
          END IF;
        END $assert$;
        """
        q(_tx(sql))

    # ──────────────────── LIGHT — RPC + seed reality (LT-*) ──────────────────

    def test_30_LT_R01_known_id_resolve_prior_summary(self):
        staff_id, _ = _staff_and_personnel()
        sql = f"""
        DO $$
        DECLARE v jsonb; v_count bigint;
        BEGIN
          {_staff_ctx_assign(staff_id)}
          v := safety.fn_resolve_emergency_light_qr('001');
          IF (v->'master'->>'erl_id') IS DISTINCT FROM '001' THEN
            RAISE EXCEPTION 'LT-R01: master payload wrong: %', v;
          END IF;
          IF (v->'master'->>'location') IS NULL THEN
            RAISE EXCEPTION 'LT-R01: master location missing: %', v;
          END IF;
          IF (v->'prior'->>'check_count') IS NULL THEN
            RAISE EXCEPTION 'LT-R01: prior check_count missing: %', v;
          END IF;
          v_count := (v->'prior'->>'check_count')::bigint;
          IF (v->'prior'->>'latest_check_date') IS NULL
             OR (v->'prior'->>'latest_test_result') IS NULL THEN
            RAISE EXCEPTION 'LT-R01: prior summary incomplete: %', v;
          END IF;
          -- a fixture check (inserted as staff) becomes the prior latest —
          -- the check_date DESC + id DESC transcription order (ref 5160).
          INSERT INTO safety.emergency_light_check
            (id, check_date, erl_payload, light_id, persistency, position, test_result, source_provenance)
          VALUES ('cbfixchk1', '2099-01-10T09:00:00+07', '001', '001', 'มี', 'เหมาะสม', 'ไม่ผ่าน', 'fixture (rolled back)');
          v := safety.fn_resolve_emergency_light_qr('001');
          IF (v->'prior'->>'latest_test_result') IS DISTINCT FROM 'ไม่ผ่าน' THEN
            RAISE EXCEPTION 'LT-R01: prior latest must be the fixture row: %', v;
          END IF;
          IF (v->'prior'->>'check_count')::bigint <> v_count + 1 THEN
            RAISE EXCEPTION 'LT-R01: prior count must advance: %', v;
          END IF;
        END $$;
        """
        q(_tx(sql))

    def test_31_LT_R02_fail_closed_verbatim_incl_anon(self):
        staff_id, _ = _staff_and_personnel()
        sql = f"""
        DO $$
        DECLARE v_err text;
        BEGIN
          {_staff_ctx_assign(staff_id)}
          -- unknown / blank / placeholder fail closed with the reused
          -- §3.13-family verbatim label (the LT-R02 recorded divergence).
          BEGIN
            PERFORM safety.fn_resolve_emergency_light_qr('zzzzunknownzzzzzzzzzzzzz');
            RAISE EXCEPTION 'LT-R02: unknown qr did NOT fail closed';
          EXCEPTION WHEN OTHERS THEN
            v_err := SQLERRM;
            IF v_err NOT LIKE '%ไม่พบข้อมูล!!%' THEN
              RAISE EXCEPTION 'LT-R02 unknown: wrong error: %', v_err;
            END IF;
          END;
          BEGIN
            PERFORM safety.fn_resolve_emergency_light_qr('   ');
            RAISE EXCEPTION 'LT-R02: blank qr did NOT fail closed';
          EXCEPTION WHEN OTHERS THEN
            v_err := SQLERRM;
            IF v_err NOT LIKE '%ไม่พบข้อมูล!!%' THEN
              RAISE EXCEPTION 'LT-R02 blank: wrong error: %', v_err;
            END IF;
          END;
          BEGIN
            PERFORM safety.fn_resolve_emergency_light_qr('สแกน QR CODE');
            RAISE EXCEPTION 'LT-R02: placeholder qr did NOT fail closed';
          EXCEPTION WHEN OTHERS THEN
            v_err := SQLERRM;
            IF v_err NOT LIKE '%ไม่พบข้อมูล!!%' THEN
              RAISE EXCEPTION 'LT-R02 placeholder: wrong error: %', v_err;
            END IF;
          END;
          -- anon is fail-closed on both schemas (EXECUTE revoked / RLS deny —
          -- any deny is the fail-closed contract; a payload is the failure).
          RESET ROLE;
          SET LOCAL role anon;
          BEGIN
            PERFORM public.fn_resolve_emergency_light_qr('001');
            RAISE EXCEPTION 'LT-R02: anon rpc (public) did NOT fail closed — payload returned';
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END;
          BEGIN
            PERFORM safety.fn_resolve_emergency_light_qr('001');
            RAISE EXCEPTION 'LT-R02: anon rpc (safety) did NOT fail closed — payload returned';
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END;
        END $$;
        """
        q(_tx(sql))

    def _distribution(self, column: str) -> dict:
        rows = q(
            f"SELECT COALESCE({column}, '(blank)') AS k, count(*) AS n"
            f" FROM safety.emergency_light_check GROUP BY 1"
        )
        return {r["k"]: r["n"] for r in rows}

    def test_40_LT_D01_seed_distribution_test_result(self):
        got = self._distribution("test_result")
        self.assertEqual(
            got, {"ผ่าน": 316, "ไม่ผ่าน": 16}, f"LT-D01 test_result distribution moved: {got}"
        )

    def test_41_LT_D02_seed_distribution_persistency(self):
        got = self._distribution("persistency")
        self.assertEqual(
            got, {"มี": 315, "ไม่มี": 17}, f"LT-D02 persistency distribution moved: {got}"
        )

    def test_42_LT_D03_seed_distribution_position(self):
        got = self._distribution("position")
        self.assertEqual(
            got, {"เหมาะสม": 329, "ไม่เหมาะสม": 3}, f"LT-D03 position distribution moved: {got}"
        )

    def test_43_LT_D04_seed_distribution_status(self):
        got = self._distribution("status")
        self.assertEqual(
            got,
            {"(blank)": 300, "ขอติดตั้ง": 16, "แจ้งซ่อม": 14, "แจ้งย้ายตำแหน่ง": 2},
            f"LT-D04 status distribution moved: {got}",
        )

    def test_44_LT_K01_no_sortkey_column_stored(self):
        rows = q(
            "SELECT column_name FROM information_schema.columns"
            " WHERE table_schema='safety' AND table_name='emergency_light_check'"
            " AND column_name ILIKE '%sort%'"
        )
        self.assertEqual(
            len(rows), 0, f"LT-K01: no SortKey-equivalent column may be stored; got {rows}"
        )

    # ──────────────────── COLIFORM — catalog + two-step (CB-*) ───────────────

    def test_50_CB_C01_result_side_columns_carry_no_defaults(self):
        rows = q(
            "SELECT column_name, column_default FROM information_schema.columns"
            " WHERE table_schema='food' AND table_name='lab_test'"
            " AND column_name IN ('result','mpn_value','reported_date','reporter_id',"
            " 'result_image','sample_source','collect_point')"
        )
        got = {r["column_name"]: r["column_default"] for r in rows}
        expected = [
            "result", "mpn_value", "reported_date", "reporter_id",
            "result_image", "sample_source", "collect_point",
        ]
        for col in expected:
            self.assertIn(col, got, f"CB-C01: column {col} missing")
            self.assertIsNone(got[col], f"CB-C01: {col} must carry NO DB default; got {got[col]}")

    def test_51_CB_C02_two_step_transition_smoke(self):
        staff_id, personnel_id = _staff_and_personnel()
        sql = f"""
        DO $probe$
        DECLARE v_id uuid; v_pid uuid;
        BEGIN
          {_staff_ctx_assign(staff_id)}
          v_pid := '{personnel_id}'::uuid;
          -- STEP 1 — collect-only insert: the row lands รอผล (pending):
          -- sample_source/collect_point + sample_date defaulted; EVERY
          -- result-side column NULL (no DB default may fill them).
          INSERT INTO food.lab_test (sample_source, collect_point, test_type, collected_by_id, source_provenance)
          VALUES ('อาหาร', 'ช้อนสั้น', 'total_coliform', v_pid, 'fixture (rolled back)')
          RETURNING id INTO v_id;
          IF (SELECT result FROM food.lab_test WHERE id = v_id) IS NOT NULL
             OR (SELECT reported_date FROM food.lab_test WHERE id = v_id) IS NOT NULL THEN
            RAISE EXCEPTION 'CB-C02 step-1: row must be pending (result-side NULL)';
          END IF;
          -- STEP 2 — the later result write lands: pending → resulted.
          UPDATE food.lab_test
             SET result = 'Positive', reported_date = CURRENT_DATE, reporter_id = v_pid
           WHERE id = v_id;
          IF (SELECT result FROM food.lab_test WHERE id = v_id) IS DISTINCT FROM 'Positive'
             OR (SELECT reported_date FROM food.lab_test WHERE id = v_id) IS NULL THEN
            RAISE EXCEPTION 'CB-C02 step-2: row must be resulted (result + reported_date present)';
          END IF;
        END $probe$;
        """
        q(_tx(sql))

    def test_52_CB_C03_only_canonical_checks(self):
        rows = q(
            "SELECT conname FROM pg_constraint"
            " WHERE conrelid='food.lab_test'::regclass AND contype='c'"
            " ORDER BY conname"
        )
        got = sorted(r["conname"] for r in rows)
        self.assertEqual(
            got,
            ["lab_test_sample_type_check", "lab_test_test_type_check"],
            f"CB-C03: only the two FOOD-CORE-001 canonical CHECKs may exist; got {got}",
        )

    def test_53_CB_F01_gate_is_ui_only_triggers(self):
        rows = q(
            "SELECT tgname FROM pg_trigger"
            " WHERE tgrelid='food.lab_test'::regclass AND NOT tgisinternal"
            " ORDER BY tgname"
        )
        got = sorted(r["tgname"] for r in rows)
        self.assertEqual(
            got,
            ["trg_audit_log", "trg_decrement_reagent"],
            f"CB-F01: the same-day gate is UI-only — no gate trigger may exist; got {got}",
        )

    # ─────────────────────────── COUNTS (post) ───────────────────────

    def test_90_post_run_baselines_identical(self):
        counts = q(BASELINE_SQL)[0]
        for key, expected in BASELINES.items():
            self.assertEqual(
                counts[key], expected, f"post-run baseline {key} moved: {counts[key]} != {expected}"
            )

    def test_91_probe_residue_zero(self):
        got = q(RESIDUE_SQL)[0]
        for key in ("insp", "lcheck", "lab"):
            self.assertEqual(got[key], 0, f"probe residue {key} leaked: {got[key]}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
