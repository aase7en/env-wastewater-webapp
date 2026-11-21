"""ENV-REPAIR-PREVENT-001 C1 — D2 RED-first service_role sensor-grant contract.

Pins the ingest-sensor service_role write path (WO §0.1 E1–E9) and the
queue-façade anon hardening through the same Management-API access path as
scripts/test_parity_p4_002_notify.py (rollback-scoped: every emulation runs
inside ``begin; … rollback;`` — zero durable rows by construction; counts
are re-probed around each batch).

Assertion groups (groups A.x/E.x must FAIL truthfully while
``supabase/migrations/20261121000000_repair_prevent_001_sensor_grants_queue_revoke.sql``
is UNAPPLIED — the RED record goes verbatim in the lane handoff — and pass
GREEN after D3 applies it; groups A.d/A.e/B.c/C.x are standing passes
disclosed per the P2.4 P3-1 convention):

  A. Grant chain (live has_*_privilege deltas):
    Aa. service_role SELECT on wastewater.sensor  (EF lookup :51-54)
    Ab. service_role INSERT on wastewater.sensor_reading (EF :72)
    Ac. service_role UPDATE on wastewater.sensor  (EF last_seen :77-80)
    Ad. service_role USAGE on schema wastewater (standing pass —
        20261120000001 restated in the new migration idempotently)
    Ae. audit-chain regression pins (standing pass — the repair grant must
        not regress): service_role USAGE on schema core + INSERT on
        core.audit_log (uuid PK gen_random_uuid() — no sequence grant).
  B. Queue-façade REVOKE (public.v_pending_threshold_alerts):
    Ba. anon must NOT hold SELECT  (RED: Supabase default privileges
        currently attach it)
    Bb. authenticated must NOT hold SELECT (RED: same default-privilege
        attachment)
    Bc. service_role must STILL hold SELECT on the façade (standing pass;
        the REVOKE must never touch the EF's own path)
  C. Audit-path regression pins (read-only pg_trigger census):
    Ca. trg_audit_log alive on wastewater.reading + wastewater.threshold_alert
    Cb. telemetry exemption intact: NO trigger on wastewater.sensor /
        wastewater.sensor_reading (write-heavy design, v2_audit_trigger
        header — never "fix" the exemption)
  D. Anon REST fail-closed (both queue paths, 401 42501 — asserted here
     post-REVOKE too; the pre-apply 401 was live-verified at D1 and stays
     recorded in the handoff):
    Da. GET /rest/v1/v_pending_threshold_alerts → 401 code 42501
    Db. GET /rest/v1/sensor_reading → 401 code 42501
  E. Rollback-scoped full-path emulation (the EF's three real steps against
     a fixture sensor, exactly as index.ts issues them):
    Ea. lookup SELECT via public.sensor → 201
    Eb. sensor_reading INSERT via public.sensor_reading façade → 201
        (RED pre-apply: 42501 permission denied for table sensor_reading)
    Ec. last_seen_at UPDATE via public.sensor façade → 201
        (RED pre-apply: 42501 permission denied for table sensor)
    Ed. zero-durable + telemetry-exemption truthfulness: sensor /
        sensor_reading / audit_log counts identical around every batch and
        the fixture never survives (no audit row can be produced by the
        sensor path — expected-absent, asserted either way).

Run:  python3 -m pytest scripts/test_repair_prevent_001_grants.py -q
      (or python3 -m unittest scripts.test_repair_prevent_001_grants)

Secrets: SUPABASE_ACCESS_TOKEN / SUPABASE_ANON_KEY resolve via process env
or the approved Drive secrets file — names only are ever echoed; values are
never printed or asserted on.
"""

from __future__ import annotations

import os
import re
import unittest
from pathlib import Path

import httpx

API_URL = (
    "https://api.supabase.com/v1/projects/gllqtbyofrcjzmbnfoeh/database/query"
)
REST_URL = "https://gllqtbyofrcjzmbnfoeh.supabase.co/rest/v1"

FIXTURE_CODE = "ENV-RP1-PROBE"
FIXTURE_INSERT = (
    "insert into wastewater.sensor (code, parameter_code, unit) "
    f"values ('{FIXTURE_CODE}','do','mg/L'); "
)

# Standing baseline (re-probed live inside every test; never assumed).
FIXTURE_TABLES = ("sensor", "sensor_reading")


def _load_secret(name: str) -> str:
    tok = os.environ.get(name, "")
    if tok:
        return tok
    drive = Path.home() / (
        "Library/CloudStorage/GoogleDrive-aase7en@sunday-estate.com"
        "/My Drive/A-Wiki-Data/secrets/env-wastewater-webapp.env"
    )
    if drive.exists():
        for line in drive.read_text(encoding="utf-8").splitlines():
            if line.startswith(f"{name}="):
                return line.split("=", 1)[1].strip()
    return ""


def _query(sql: str) -> list[dict]:
    tok = _load_secret("SUPABASE_ACCESS_TOKEN")
    assert tok, "SUPABASE_ACCESS_TOKEN not found (env or Drive secrets)"
    r = httpx.post(
        API_URL,
        json={"query": sql},
        headers={"Authorization": f"Bearer {tok}"},
        timeout=30,
    )
    assert r.status_code == 201, f"query API returned {r.status_code}: {r.text[:200]}"
    return r.json()


def _query_raw(sql: str) -> tuple[int, object]:
    """Run SQL via the Management API, returning (status, body) raw.

    Used by the rollback-scoped service_role probes where a RED-state
    statement error IS the observation — the caller asserts on the status.
    """
    tok = _load_secret("SUPABASE_ACCESS_TOKEN")
    assert tok, "SUPABASE_ACCESS_TOKEN not found (env or Drive secrets)"
    r = httpx.post(
        API_URL,
        json={"query": sql},
        headers={"Authorization": f"Bearer {tok}"},
        timeout=30,
    )
    try:
        return r.status_code, r.json()
    except ValueError:
        return r.status_code, r.text


def _counts() -> dict:
    rows = _query(
        "select (select count(*)::int from wastewater.sensor) as sensor_n, "
        "(select count(*)::int from wastewater.sensor_reading) as reading_n, "
        "(select count(*)::int from core.audit_log) as audit_n"
    )
    return rows[0]


def _anon_rest(path: str) -> tuple[int, object]:
    anon = _load_secret("SUPABASE_ANON_KEY")
    if not anon:
        raise unittest.SkipTest(
            "LIVE_CONNECTION_UNAVAILABLE: SUPABASE_ANON_KEY not resolvable"
        )
    r = httpx.get(f"{REST_URL}/{path}?select=id&limit=1",
                  headers={"apikey": anon}, timeout=30)
    try:
        return r.status_code, r.json()
    except ValueError:
        return r.status_code, r.text


class TestGrantChain(unittest.TestCase):
    """Group A — the exact sensor-path service_role grant deltas."""

    def test_a_service_role_select_sensor(self):
        """Aa: service_role SELECT on wastewater.sensor (the EF lookup)."""
        rows = _query(
            "select has_table_privilege('service_role',"
            "'wastewater.sensor','select') as ok"
        )
        self.assertTrue(
            rows[0]["ok"],
            "service_role lacks SELECT on wastewater.sensor — the EF lookup "
            "(index.ts:51-54) fails 42501 at owner activation",
        )

    def test_b_service_role_insert_sensor_reading(self):
        """Ab: service_role INSERT on wastewater.sensor_reading (EF :72)."""
        rows = _query(
            "select has_table_privilege('service_role',"
            "'wastewater.sensor_reading','insert') as ok"
        )
        self.assertTrue(
            rows[0]["ok"],
            "service_role lacks INSERT on wastewater.sensor_reading — every "
            "ingest batch fails 42501 fail-closed (whole-batch loss)",
        )

    def test_c_service_role_update_sensor(self):
        """Ac: service_role UPDATE on wastewater.sensor (EF last_seen)."""
        rows = _query(
            "select has_table_privilege('service_role',"
            "'wastewater.sensor','update') as ok"
        )
        self.assertTrue(
            rows[0]["ok"],
            "service_role lacks UPDATE on wastewater.sensor — the "
            "last_seen_at bump (index.ts:77-80) fails 42501",
        )

    def test_d_service_role_schema_usage(self):
        """Ad (DISCLOSED STANDING PASS): USAGE on schema wastewater."""
        rows = _query(
            "select has_schema_privilege('service_role','wastewater','usage') as ok"
        )
        self.assertTrue(rows[0]["ok"], "schema wastewater USAGE regressed")

    def test_e_audit_chain_regression_pins(self):
        """Ae (DISCLOSED STANDING PASS): the repair grant must not regress —
        service_role USAGE core + INSERT core.audit_log (uuid PK, no seq)."""
        rows = _query(
            "select has_schema_privilege('service_role','core','usage') as usage_core, "
            "has_table_privilege('service_role','core.audit_log','insert') as ins_audit"
        )
        self.assertTrue(rows[0]["usage_core"], "core schema USAGE regressed")
        self.assertTrue(rows[0]["ins_audit"], "core.audit_log INSERT regressed")
        # uuid PK gen_random_uuid() — there must be NO sequence to grant.
        seqs = _query(
            "select count(*)::int as n from pg_class c "
            "join pg_namespace n2 on n2.oid = c.relnamespace "
            "where n2.nspname = 'wastewater' and c.relkind = 'S' "
            "and c.relname in ('sensor','sensor_reading')"
        )
        self.assertEqual(seqs[0]["n"], 0, "unexpected sequence on the sensor path")


class TestQueueFacadeRevoke(unittest.TestCase):
    """Group B — the anon/authenticated SELECT REVOKE on the queue façade."""

    def test_a_anon_select_revoked(self):
        """Ba: anon must NOT hold SELECT on public.v_pending_threshold_alerts."""
        rows = _query(
            "select has_table_privilege('anon',"
            "'public.v_pending_threshold_alerts','select') as ok"
        )
        self.assertFalse(
            rows[0]["ok"],
            "anon still holds SELECT on the queue façade (default-privilege "
            "residue) — the service-role-only design is not enforced",
        )

    def test_b_authenticated_select_revoked(self):
        """Bb: authenticated must NOT hold SELECT on the queue façade."""
        rows = _query(
            "select has_table_privilege('authenticated',"
            "'public.v_pending_threshold_alerts','select') as ok"
        )
        self.assertFalse(
            rows[0]["ok"],
            "authenticated still holds SELECT on the queue façade",
        )

    def test_c_service_role_select_untouched(self):
        """Bc (DISCLOSED STANDING PASS): the REVOKE must never open OR close
        anything for the EF's own role."""
        rows = _query(
            "select has_table_privilege('service_role',"
            "'public.v_pending_threshold_alerts','select') as ok"
        )
        self.assertTrue(rows[0]["ok"], "service_role queue read regressed")


class TestAuditPathPins(unittest.TestCase):
    """Group C — the audit chain is asserted, never modified (WO §2)."""

    def test_a_audit_trigger_alive_on_audited_tables(self):
        """Ca: trg_audit_log alive on wastewater.reading + threshold_alert."""
        rows = _query(
            "select c.relname as tbl from pg_trigger t "
            "join pg_class c on c.oid = t.tgrelid "
            "join pg_namespace n on n.oid = c.relnamespace "
            "where n.nspname = 'wastewater' and t.tgname = 'trg_audit_log' "
            "and c.relname in ('reading','threshold_alert') "
            "order by c.relname"
        )
        self.assertEqual(
            [r["tbl"] for r in rows], ["reading", "threshold_alert"],
            "trg_audit_log attach set drifted on the audited tables",
        )

    def test_b_telemetry_exemption_intact(self):
        """Cb: NO trigger on wastewater.sensor / wastewater.sensor_reading —
        the write-heavy telemetry exemption (v2_audit_trigger header)."""
        rows = _query(
            "select c.relname as tbl, t.tgname as trg "
            "from pg_trigger t join pg_class c on c.oid = t.tgrelid "
            "join pg_namespace n on n.oid = c.relnamespace "
            "where n.nspname = 'wastewater' "
            "and c.relname in ('sensor','sensor_reading') "
            "and not t.tgisinternal"
        )
        self.assertEqual(
            rows, [],
            f"unexpected trigger(s) on the telemetry tables (exemption "
            f"regressed): {rows}",
        )


class TestAnonRestFailClosed(unittest.TestCase):
    """Group D — the REVOKE must never open anything: both queue paths stay
    401 42501 to anon after the REVOKE (pre-apply 401s live-verified at D1)."""

    def test_a_anon_rest_queue_facade_42501(self):
        """Da: GET /rest/v1/v_pending_threshold_alerts → 401 code 42501."""
        status, body = _anon_rest("v_pending_threshold_alerts")
        self.assertEqual(status, 401, f"anon queue read not denied: {body}")
        self.assertEqual(body.get("code"), "42501", f"wrong denial code: {body}")

    def test_b_anon_rest_sensor_reading_42501(self):
        """Db: GET /rest/v1/sensor_reading → 401 code 42501."""
        status, body = _anon_rest("sensor_reading")
        self.assertEqual(status, 401, f"anon sensor read not denied: {body}")
        self.assertEqual(body.get("code"), "42501", f"wrong denial code: {body}")


class TestFullPathEmulation(unittest.TestCase):
    """Group E — the EF's three real steps, rollback-scoped, exactly as
    index.ts issues them against a fixture sensor."""

    def test_a_lookup_select_via_facade(self):
        """Ea: fixture sensor → service_role lookup via public.sensor → 201."""
        pre = _counts()
        status, body = _query_raw(
            "begin; " + FIXTURE_INSERT +
            "set local role service_role; "
            f"select id, code from public.sensor where code in ('{FIXTURE_CODE}'); "
            "rollback;"
        )
        self.assertEqual(
            status, 201,
            f"service_role lookup failed (live): {body}",
        )
        self._assert_zero_durable(pre)

    def test_b_sensor_reading_insert_via_facade(self):
        """Eb: service_role INSERT sensor_reading via the façade → 201
        (RED pre-apply: 42501 permission denied for table sensor_reading)."""
        pre = _counts()
        status, body = _query_raw(
            "begin; " + FIXTURE_INSERT +
            "set local role service_role; "
            "insert into public.sensor_reading (sensor_id, taken_at, value) "
            f"select id, now(), 3.42 from wastewater.sensor where code = '{FIXTURE_CODE}'; "
            "rollback;"
        )
        self.assertEqual(
            status, 201,
            f"service_role sensor_reading INSERT failed (live): {body}",
        )
        self._assert_zero_durable(pre)

    def test_c_last_seen_update_via_facade(self):
        """Ec: service_role UPDATE last_seen_at via the façade → 201
        (RED pre-apply: 42501 permission denied for table sensor)."""
        pre = _counts()
        status, body = _query_raw(
            "begin; " + FIXTURE_INSERT +
            "set local role service_role; "
            f"update public.sensor set last_seen_at = now() where code = '{FIXTURE_CODE}'; "
            "rollback;"
        )
        self.assertEqual(
            status, 201,
            f"service_role sensor UPDATE failed (live): {body}",
        )
        self._assert_zero_durable(pre)

    def test_d_zero_durable_and_no_audit_row(self):
        """Ed: the full three-step path in ONE batch — every step green
        post-fix, counts identical around the batch, fixture never survives,
        and NO audit row produced (telemetry exemption — asserted either
        way; expected-absent by design)."""
        pre = _counts()
        status, body = _query_raw(
            "begin; " + FIXTURE_INSERT +
            "set local role service_role; "
            f"select id, code from public.sensor where code in ('{FIXTURE_CODE}'); "
            "insert into public.sensor_reading (sensor_id, taken_at, value) "
            f"select id, now(), 3.42 from wastewater.sensor where code = '{FIXTURE_CODE}'; "
            f"update public.sensor set last_seen_at = now() where code = '{FIXTURE_CODE}'; "
            "reset role; "
            "select "
            "  (select count(*)::int from wastewater.sensor where "
            f"   code = '{FIXTURE_CODE}') as fixture_rows, "
            "  (select count(*)::int from core.audit_log) as audit_n; "
            "rollback;"
        )
        self.assertEqual(status, 201, f"full-path emulation failed (live): {body}")
        self.assertEqual(body[0]["fixture_rows"], 1,
                         "fixture must exist inside the transaction")
        self.assertEqual(
            body[0]["audit_n"], pre["audit_n"],
            "the sensor path must produce NO audit row (telemetry exemption)",
        )
        self._assert_zero_durable(pre)
        print(f"\n[receipt] full-path emulation OK; audit rows "
              f"{pre['audit_n']}→unchanged inside tx; zero durable rows")

    def _assert_zero_durable(self, pre: dict):
        post = _counts()
        for k in ("sensor_n", "reading_n", "audit_n"):
            self.assertEqual(
                pre[k], post[k],
                f"rollback-scoped probe left durable drift on {k}: "
                f"{pre[k]} → {post[k]}",
            )
        rows = _query(
            "select count(*)::int as n from wastewater.sensor "
            f"where code = '{FIXTURE_CODE}'"
        )
        self.assertEqual(rows[0]["n"], 0, "fixture sensor survived rollback")


if __name__ == "__main__":
    unittest.main(verbosity=2)
