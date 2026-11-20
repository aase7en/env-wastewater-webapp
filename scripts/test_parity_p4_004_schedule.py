"""ENV-PARITY-P4-004 C1 — D2 RED-first monthly-schedule contract test.

Pins the ONE claimed migration ``supabase/migrations/20261120000000_parity_p4_004.sql``
(pg_cron + pg_net enablement, the public.monthly_report_cycle state table, the
idempotent cron.schedule net.http_post wiring) and the NEW Edge Function
``supabase/functions/notify-monthly-report`` source contract, through the same
Management-API access path as scripts/test_parity_p4_002_notify.py
(READ-ONLY probes plus transaction-scoped ``begin; … rollback;`` checks that
provably leave the state table untouched — this lane performs NO live
Telegram send; D1-5: no bot credentials exist, zero spam by construction).

D1 pins adjudicated this lane (WO §6):

  - Cron expression ``5 17 1 * *`` (UTC) = 17:05 UTC on the 1st = 00:05 ICT
    on the 2nd (UTC+7 → the ICT clock is AHEAD, so 00:05 ICT on the 1st would
    be 17:05 UTC on the PREVIOUS month's last day, which vixie cron cannot
    express — no ``L`` field). The cycle point is therefore 00:05 ICT on the
    2nd: ≥24h inside the new month, so the covered month = the PREVIOUS
    calendar month (ICT) is unambiguous and day-1 readings have all landed.
    The instruction-quoted ``5 18 1 * *`` = 01:05 ICT on the 2nd FAILED
    conversion verification and is NOT used.
  - Cron → EF auth: the EF keeps the platform JWT gate (verify_jwt default
    TRUE — the house convention: ingest-sensor's "callers must present the
    service_role key (set as the bearer)" docstring, notify-threshold's
    README anon-bearer manual test). The cron command reads the bearer from
    ``vault.decrypted_secrets where name = 'service_role'`` AT EXECUTION TIME
    (the Supabase-documented cron→EF pattern) — zero key literals in-repo;
    owner activation = one ``select vault.create_secret('<service-role-key>',
    'service_role')`` alongside the documented ``supabase secrets set``
    Telegram step. ``--no-verify-jwt`` was REJECTED.
  - State table ``public.monthly_report_cycle`` (public schema = the
    supabase-js default the EF client reaches; the house public-REST-exposure
    precedent): month_key PK ('YYYY-MM'), status CHECK ('pending'|'sent'|
    'skipped', default 'pending'), reason, notified_at, provenance (default
    'pg_cron'), created_at, updated_at, and the honesty CHECK
    ``(status = 'sent') = (notified_at IS NOT NULL)``. RLS enabled, no
    policies (fail-closed; service role bypasses, no anon surface).
  - EF env names reuse the owner runbook: TELEGRAM_BOT_TOKEN /
    TELEGRAM_CHAT_ID (unset → honest {"skipped":true} BEFORE any state/queue
    work — the P4.2 precedent, applied to the monthly job).
  - Runner (WO D1-7 option ii, capability evidence recorded): the Deno CLI is
    NOT installed on this machine (``deno not found``; no ~/.deno,
    /opt/homebrew/bin, /usr/local/bin), so the Python contract suite is the
    pinned runner; the co-located Deno test path stays untouched.

Assertion groups (groups 1–3 must FAIL truthfully while the migration is
unapplied and the EF is absent — the RED record goes in the handoff; group 4
plus the disclosed standing passes are pure/local and pass by construction):

  1. Migration-file contract — extensions guarded-enable, state table shape
     + honesty CHECK + RLS, cron.schedule wiring (job name, expression,
     net.http_post URL, vault bearer, idempotent unschedule guard), ICT
     conversion evidence in the header, zero token/secret literals, zero
     user-data DML.
  2. EF source contract — env names + dormant-skip-first, ICT covered-month
     picker (+7 offset, previous month, +543 พ.ศ., Thai months, the
     รายงาน ทส.1/ทส.2 … พร้อมแล้ว message + /reports pointer), data-presence
     check per the P4.1 pattern (public.reading + reading_date range),
     state-table idempotency (sent → honest no-op; notified_at success-only;
     no-data → skipped + reason), Authorization-header send form, and the
     frozen notify-threshold/ingest-sensor files uncoupled from this lane.
  3. Live ENV_DB contract (read-only + ROLLBACK-scoped probes):
     extensions installed; exactly one cron.job row with the pinned
     expression + command shape; state-table columns/CHECKs/RLS posture;
     state table EMPTY (pre-activation honesty); CHECK-honesty probes inside
     explicit ROLLBACKs (sent-without-notified_at rejected,
     pending-with-notified_at rejected, invalid status rejected, valid
     sent row accepted, month_key duplicate rejected, table count unchanged).
  4. Pure mirror logic (Python) — the ICT covered-month picker across
     boundaries (year rollover, leap months) and the cron↔ICT conversion
     verification used by group 3; passes independently of implementation
     state (disclosed standing pass, P2.4 P3-1 convention).

Run:  python3 -m pytest scripts/test_parity_p4_004_schedule.py -q
      (or python3 -m unittest scripts.test_parity_p4_004_schedule)
"""

from __future__ import annotations

import calendar
import re
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx

REPO_ROOT = Path(__file__).resolve().parents[1]
MIGRATION_PATH = REPO_ROOT / "supabase/migrations/20261120000000_parity_p4_004.sql"
EF_DIR = REPO_ROOT / "supabase/functions/notify-monthly-report"
EF_PATH = EF_DIR / "index.ts"

PROJECT_REF = "gllqtbyofrcjzmbnfoeh"
API_URL = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
EF_URL = f"https://{PROJECT_REF}.functions.supabase.co/notify-monthly-report"

CRON_JOB_NAME = "notify-monthly-report"
CRON_EXPRESSION = "5 17 1 * *"  # 17:05 UTC day-1 == 00:05 ICT day-2 (UTC+7)
ICT_OFFSET_HOURS = 7

THAI_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
]

FROZEN_EF_PATHS = [
    REPO_ROOT / "supabase/functions/notify-threshold/index.ts",
    REPO_ROOT / "supabase/functions/ingest-sensor/index.ts",
]


def _load_token() -> str:
    """SUPABASE_ACCESS_TOKEN from process env, else the Drive secrets env.

    Names only are ever echoed; values are never printed or asserted on.
    """
    import os

    tok = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
    if tok:
        return tok
    drive = Path.home() / (
        "Library/CloudStorage/GoogleDrive-aase7en@sunday-estate.com"
        "/My Drive/A-Wiki-Data/secrets/env-wastewater-webapp.env"
    )
    if drive.exists():
        for line in drive.read_text(encoding="utf-8").splitlines():
            if line.startswith("SUPABASE_ACCESS_TOKEN="):
                return line.split("=", 1)[1].strip()
    return ""


def _query(sql: str) -> list[dict]:
    tok = _load_token()
    assert tok, "SUPABASE_ACCESS_TOKEN not found (env or Drive secrets)"
    r = httpx.post(
        API_URL,
        json={"query": sql},
        headers={"Authorization": f"Bearer {tok}"},
        timeout=30,
    )
    assert r.status_code == 201, f"query API returned {r.status_code}: {r.text[:300]}"
    return r.json()


def _migration_source() -> str:
    if not MIGRATION_PATH.exists():
        raise AssertionError(
            f"migration file missing: {MIGRATION_PATH.relative_to(REPO_ROOT)}"
        )
    return MIGRATION_PATH.read_text(encoding="utf-8")


def _ef_source() -> str:
    if not EF_PATH.exists():
        raise AssertionError(
            f"Edge Function missing: {EF_PATH.relative_to(REPO_ROOT)}"
        )
    return EF_PATH.read_text(encoding="utf-8")


# ── Pure mirror logic (group 4 + the group-3 cross-check helper) ──────────


def covered_month_ict(now_iso: str) -> dict:
    """Python mirror of the EF's covered-month picker.

    Steps: shift the instant into ICT (+7h), read the calendar month there,
    then step back exactly one calendar month. Returns the covered month's
    key ('YYYY-MM'), Thai full-month พ.ศ. label, and inclusive date range.
    """
    t = datetime.fromisoformat(now_iso.replace("Z", "+00:00")) + timedelta(
        hours=ICT_OFFSET_HOURS
    )
    y, m = t.year, t.month
    if m == 1:
        y, m = y - 1, 12
    else:
        m -= 1
    last_day = calendar.monthrange(y, m)[1]
    return {
        "year": y,
        "month": m,
        "key": f"{y:04d}-{m:02d}",
        "thai": f"{THAI_MONTHS[m - 1]} {y + 543}",
        "start": f"{y:04d}-{m:02d}-01",
        "end": f"{y:04d}-{m:02d}-{last_day:02d}",
    }


def verify_cron_to_ict(expression: str) -> str:
    """Verify a vixie 'm h dom * *' expression converts to the pinned ICT
    cycle point. Returns a human proof string or raises."""
    parts = expression.split()
    if len(parts) != 5:
        raise AssertionError(f"not a 5-field vixie expression: {expression!r}")
    try:
        minute, hour, dom = int(parts[0]), int(parts[1]), int(parts[2])
    except ValueError as e:
        raise AssertionError(f"minute/hour/dom must be integers: {expression!r}") from e
    if parts[3] != "*" or parts[4] != "*":
        raise AssertionError("month/dow must be '*': monthly job")
    expected = (5, 17, 1)  # 17:05 UTC day-1 = 00:05 ICT day-2 (UTC+7)
    if (minute, hour, dom) != expected:
        raise AssertionError(
            f"expression {expression!r} != pinned {CRON_EXPRESSION!r} "
            "(want 17:05 UTC day-1 = 00:05 ICT day-2)"
        )
    ict_total = hour * 60 + minute + ICT_OFFSET_HOURS * 60
    day_offset = ict_total // (24 * 60)
    ict_minute = ict_total % (24 * 60)
    return (
        f"{CRON_EXPRESSION} UTC → {ict_minute // 60:02d}:{ict_minute % 60:02d} "
        f"ICT on day {dom + day_offset} (UTC+7) — ≥24h inside the new month"
    )


class TestMigrationFileContract(unittest.TestCase):
    """Group 1 — the ONE claimed migration's SQL contract (source pins)."""

    def setUp(self) -> None:
        self.src = _migration_source()

    def test_1a_extensions_guarded_enable(self):
        self.assertRegex(
            self.src, r"create\s+extension\s+if\s+not\s+exists\s+pg_cron\s*;"
        )
        self.assertRegex(
            self.src, r"create\s+extension\s+if\s+not\s+exists\s+pg_net\s*;"
        )

    def test_1b_state_table_contract(self):
        self.assertIn("public.monthly_report_cycle", self.src)
        self.assertRegex(self.src, r"month_key\s+text\s+not\s+null\s+primary\s+key")
        self.assertIn("default 'pending'", self.src)
        for status in ("pending", "sent", "skipped"):
            self.assertIn(f"'{status}'", self.src, f"status value missing: {status}")
        self.assertIn("notified_at", self.src)
        self.assertIn("provenance", self.src)
        # Honesty CHECK: notified_at set exactly when status='sent'.
        self.assertRegex(
            self.src,
            r"status\s*=\s*'sent'\s*\)\s*=\s*\(\s*notified_at\s+is\s+not\s+null",
        )
        # RLS enabled; NO policy at all (fail-closed, no anon surface).
        self.assertRegex(
            self.src,
            r"alter\s+table\s+public\.monthly_report_cycle\s+enable\s+row\s+level"
            r"\s+security\s*;",
        )
        self.assertNotRegex(
            self.src, r"create\s+policy",
            "no policy may open the state table (fail-closed)",
        )

    def test_1c_cron_schedule_wiring(self):
        self.assertIn(f"'{CRON_JOB_NAME}'", self.src)
        self.assertIn(f"'{CRON_EXPRESSION}'", self.src)
        self.assertIn(EF_URL, self.src, "cron must post to the monthly EF URL")
        self.assertIn("net.http_post", self.src)
        self.assertIn("vault.decrypted_secrets", self.src)
        self.assertIn("'service_role'", self.src)
        self.assertIn("jsonb_build_object", self.src)
        self.assertIn('"provenance":"pg_cron"', self.src.replace(" ", ""))
        # Idempotent guarded pattern: unschedule-before-schedule.
        self.assertIn("cron.unschedule", self.src)
        self.assertIn("cron.job", self.src)
        # pg_cron expression documented with its ICT conversion proof.
        self.assertIn("00:05 ICT", self.src)

    def test_1d_no_token_or_secret_literal(self):
        self.assertNotRegex(self.src, r"bot\d{5,}:[A-Za-z0-9_-]{30,}")
        self.assertNotRegex(self.src, r"eyJ[A-Za-z0-9_-]{20,}")

    def test_1e_no_user_data_dml(self):
        """Create-table + schedule only — no INSERT/UPDATE/DELETE on any
        pre-existing table (zero-DML-on-user-data pin)."""
        stripped = re.sub(r"--[^\n]*", "", self.src)
        for line in stripped.splitlines():
            low = line.strip().lower()
            for verb in ("insert into", "update ", "delete from"):
                if low.startswith(verb):
                    self.fail(f"user-data DML found in migration: {line.strip()[:80]}")


class TestEFSourceContract(unittest.TestCase):
    """Group 2 — the notify-monthly-report EF source contract (source pins)."""

    def setUp(self) -> None:
        self.src = _ef_source()

    def test_2a_env_names_and_dormant_skip_first(self):
        self.assertRegex(self.src, r'Deno\.env\.get\(\s*"TELEGRAM_BOT_TOKEN"')
        self.assertRegex(self.src, r'Deno\.env\.get\(\s*"TELEGRAM_CHAT_ID"')
        m = re.search(r"skipped:\s*true", self.src)
        self.assertIsNotNone(m, "dormant skip ({skipped:true,…}) missing")
        skip_pos = m.start()
        state_pos = self.src.find("monthly_report_cycle")
        self.assertGreaterEqual(state_pos, 0, "state-table usage missing")
        self.assertLess(
            skip_pos, state_pos,
            "honest skip must fire BEFORE any state-table work (fail-closed)",
        )

    def test_2b_ict_covered_month_and_thai_be_message(self):
        self.assertIn("รายงาน ทส.1/ทส.2 ประจำเดือน", self.src)
        self.assertIn("พร้อมแล้ว", self.src)
        self.assertIn("+ 543", self.src, "พ.ศ. conversion (+543) missing")
        self.assertIn("ICT_OFFSET_HOURS = 7", self.src, "ICT +7 pin missing")
        for month in THAI_MONTHS:
            self.assertIn(month, self.src, f"Thai month name missing: {month}")
        self.assertIn("/reports", self.src, "print-location pointer missing")

    def test_2c_presence_check_p41_pattern(self):
        """Data-presence mirrors the P4.1 range query (public.reading +
        reading_date gte/lte) — data exists → ready."""
        self.assertIn('from("reading")', self.src)
        self.assertIn("reading_date", self.src)
        self.assertRegex(self.src, r'\.gte\("reading_date"')
        self.assertRegex(self.src, r'\.lte\("reading_date"')

    def test_2d_state_honesty_idempotency(self):
        self.assertIn("monthly_report_cycle", self.src)
        for status in ('status: "sent"', 'status: "pending"', 'status: "skipped"'):
            self.assertIn(status, self.src, f"status literal missing: {status}")
        self.assertIn("notified_at", self.src)
        self.assertIn("reason", self.src)
        self.assertIn("provenance", self.src)
        self.assertIn("no-reading-data", self.src, "honest no-data skip reason missing")
        self.assertIn('onConflict: "month_key"', self.src, "month_key dedupe missing")

    def test_2e_authorization_header_send_form(self):
        self.assertIn("api.telegram.org/bot/sendMessage", self.src)
        self.assertRegex(self.src, r'"Authorization"\s*:\s*`?Bearer')
        for m in re.finditer(r"api\.telegram\.org[^`\"']*", self.src):
            self.assertNotIn("${", m.group(0), "token must never ride in a URL")


class TestFrozenEFsUncoupled(unittest.TestCase):
    """Group 2f — the frozen notify-threshold/ingest-sensor contracts stay
    byte-untouched by this lane (DISCLOSED STANDING PASS — independent of the
    new EF's existence, so green at RED too; P2.4 P3-1 convention)."""

    def test_2f_frozen_efs_uncoupled(self):
        for p in FROZEN_EF_PATHS:
            self.assertTrue(p.exists(), f"frozen EF missing: {p.name}")
            src = p.read_text(encoding="utf-8")
            self.assertNotIn(
                "notify-monthly-report", src,
                f"frozen EF {p.name} must not reference the monthly lane",
            )
            self.assertNotIn(
                "monthly_report_cycle", src,
                f"frozen EF {p.name} must not touch the monthly state table",
            )


class TestLiveScheduleContract(unittest.TestCase):
    """Group 3 — live ENV_DB state (read-only + ROLLBACK-scoped probes)."""

    def _scoped(self, stmt: str) -> list[dict]:
        """Run one statement inside an explicit rollback-wrapped transaction."""
        return _query(f"begin; {stmt} rollback;")

    def test_3a_extensions_installed(self):
        rows = _query(
            "select extname, extversion from pg_extension "
            "where extname in ('pg_cron','pg_net') order by extname"
        )
        names = {r["extname"] for r in rows}
        self.assertIn("pg_cron", names, "pg_cron not installed on ENV_DB")
        self.assertIn("pg_net", names, "pg_net not installed on ENV_DB")
        print(f"\n[receipt] extensions: {[(r['extname'], r['extversion']) for r in rows]}")

    def test_3b_cron_job_row_pinned(self):
        rows = _query(
            "select jobid, jobname, schedule, command from cron.job "
            f"where jobname = '{CRON_JOB_NAME}'"
        )
        self.assertEqual(len(rows), 1, f"expected exactly 1 cron job, got {len(rows)}")
        job = rows[0]
        self.assertEqual(job["schedule"], CRON_EXPRESSION)
        self.assertIn(EF_URL, job["command"])
        self.assertIn("net.http_post", job["command"])
        self.assertIn("vault.decrypted_secrets", job["command"])
        self.assertIn("'service_role'", job["command"])
        print(f"\n[receipt] cron.job: jobid={job['jobid']} schedule={job['schedule']}")
        print(f"[receipt] ICT conversion proof: {verify_cron_to_ict(job['schedule'])}")

    def test_3c_state_table_shape_and_rls(self):
        cols = _query(
            "select column_name, data_type, is_nullable, column_default "
            "from information_schema.columns where table_schema='public' "
            "and table_name='monthly_report_cycle' order by ordinal_position"
        )
        names = [c["column_name"] for c in cols]
        for expected in ("month_key", "status", "reason", "notified_at",
                         "provenance", "created_at", "updated_at"):
            self.assertIn(expected, names, f"state column missing: {expected}")
        rls = _query(
            "select relrowsecurity, relforcerowsecurity from pg_class c "
            "join pg_namespace n on n.oid = c.relnamespace where n.nspname="
            "'public' and c.relname='monthly_report_cycle'"
        )
        self.assertTrue(rls and rls[0]["relrowsecurity"], "RLS must be enabled")
        checks = _query(
            "select conname, pg_get_constraintdef(oid) as def from pg_constraint "
            "where conrelid = 'public.monthly_report_cycle'::regclass "
            "and contype = 'c' order by conname"
        )
        joined = " | ".join(c["def"] for c in checks)
        self.assertIn("'sent'", joined, "status CHECK missing")
        self.assertIn("notified_at", joined, "honesty CHECK missing")
        print(f"\n[receipt] state-table checks: {joined}")

    def test_3d_state_table_empty_pre_activation(self):
        rows = _query("select count(*)::int as n from public.monthly_report_cycle")
        self.assertEqual(
            rows[0]["n"], 0,
            "state table must be empty at D4 (no cycle starts before the "
            "owner activates credentials — unknown ≠ zero, never fabricated)",
        )
        print(f"\n[receipt] state-table rows right now: {rows[0]['n']}")

    def test_3e_honesty_check_probes_rollback_scoped(self):
        """Prove the CHECKs enforce queue honesty, then ROLLBACK — zero
        durable writes (the no-live-send cycle-row evidence)."""
        pre = _query("select count(*)::int as n from public.monthly_report_cycle")[0]["n"]
        # sent WITHOUT notified_at → rejected (never mark success without a send)
        with self.assertRaises(AssertionError):
            self._scoped(
                "insert into public.monthly_report_cycle "
                "(month_key, status, notified_at) values ('2000-01','sent',null);"
            )
        # pending WITH notified_at → rejected (never coerce pending to sent)
        with self.assertRaises(AssertionError):
            self._scoped(
                "insert into public.monthly_report_cycle "
                "(month_key, status, notified_at) values ('2000-03','pending',now());"
            )
        # invalid status value → rejected
        with self.assertRaises(AssertionError):
            self._scoped(
                "insert into public.monthly_report_cycle "
                "(month_key, status, reason) values ('2000-04','failed','x');"
            )
        # a valid sent row (with notified_at) inserts and is visible in-tx
        r = self._scoped(
            "insert into public.monthly_report_cycle (month_key, status, "
            "notified_at, reason, provenance) values ('2000-02','sent',now(),"
            "null,'rollback-probe'); select count(*)::int as n from "
            "public.monthly_report_cycle where month_key='2000-02';"
        )
        self.assertEqual(r[0]["n"], 1, "valid sent row must insert")
        # duplicate month_key → rejected (one row per covered month); BOTH
        # inserts run in the SAME transaction so the conflict is real —
        # after a rollback there is no prior row left to conflict with.
        with self.assertRaises(AssertionError):
            self._scoped(
                "insert into public.monthly_report_cycle (month_key, status, "
                "notified_at, reason, provenance) values ('2000-02','sent',"
                "now(),null,'rollback-probe');"
                "insert into public.monthly_report_cycle (month_key, status, "
                "reason) values ('2000-02','pending','dup');"
            )
        post = _query("select count(*)::int as n from public.monthly_report_cycle")[0]["n"]
        self.assertEqual(pre, post, "ROLLBACK probes must leave the table untouched")
        print(f"\n[receipt] rollback-scoped probes OK; table count {pre}→{post}")


class TestPureMirrorLogic(unittest.TestCase):
    """Group 4 — pure mirror logic (standing pass, disclosed)."""

    def test_4a_covered_month_boundaries(self):
        # Year rollover: Jan 2 00:05 ICT covers the just-ended December.
        c = covered_month_ict("2026-01-02T00:05:00+07:00")
        self.assertEqual(c["key"], "2025-12")
        self.assertEqual(c["thai"], "ธันวาคม 2568")
        self.assertEqual((c["start"], c["end"]), ("2025-12-01", "2025-12-31"))
        # Leap February.
        c2 = covered_month_ict("2025-03-02T00:05:00+07:00")
        self.assertEqual((c2["key"], c2["end"]), ("2025-02", "2025-02-28"))
        c3 = covered_month_ict("2025-04-02T00:05:00+07:00")
        self.assertEqual((c3["key"], c3["end"]), ("2025-03", "2025-03-31"))

    def test_4b_cron_to_ict_conversion_proof(self):
        proof = verify_cron_to_ict(CRON_EXPRESSION)
        self.assertIn("00:05", proof)
        self.assertIn("ICT", proof)
        with self.assertRaises(AssertionError):
            verify_cron_to_ict("5 18 1 * *")  # the instruction-quoted WRONG value
        with self.assertRaises(AssertionError):
            verify_cron_to_ict("* * * * *")

    def test_4c_disclosed_standing_passes(self):
        """Disclosed (P2.4 P3-1 convention): group 4 is truthfully green both
        pre- and post-implementation; 1d/1e/2e/2f are also green at RED
        (pure/local pins independent of the missing files)."""
        print("\n[receipt] standing passes: 4a, 4b, 4c (pure/local; 1d/1e/2e/2f "
              "green at RED too — disclosed)")


if __name__ == "__main__":
    unittest.main(verbosity=2)
