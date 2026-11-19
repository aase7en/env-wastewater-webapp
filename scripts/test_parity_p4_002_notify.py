"""ENV-PARITY-P4-002 C1 — D2 RED-first Telegram dispatcher contract test.

Pins the `supabase/functions/notify-threshold` Edge Function source contract
(WO ENV-PARITY-P4-002 §2: Telegram dispatcher upgrade of the existing P17
stub) and the live queue-view semantics it consumes, through the same
Management-API access path as scripts/test_parity_p1_003_thresholds.py
(Read-ONLY: SELECT probes only — this lane performs NO live Telegram send;
D1-4: no bot credentials exist, zero spam by construction).

Assertion groups (WO §0 D1-2/D1-3; groups 1a–1e must FAIL truthfully while
`supabase/functions/notify-threshold/index.ts` is still the unmodified P17
stub — the RED record goes in the handoff — and pass GREEN after the D3
upgrade; groups 1f and 2 are legacy/consumed-object passes, disclosed per
the P2.4 P3-1 convention):

  1a. Env contract — the EF reads TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
      via Deno.env (the D1-pinned secret names; never Vault/URL-embedded
      token), and gates the honest skip on BOTH of them.
  1b. Dormant-fail-closed — when credentials are unset the EF returns
      {"skipped":true,…} BEFORE any queue work (the channel stays honest
      and sends nothing until the owner plugs the token).
  1c. Send mechanism — Telegram Bot API Authorization-header form:
      `Authorization: Bearer <token>` + JSON POST to
      https://api.telegram.org/bot/sendMessage (token never in the URL
      path — no token may leak into logs/proxies).
  1d. Message parity — per-alert Thai messages rendering reading_date in
      พ.ศ. (year +543) with Thai month names, from the queue view's own
      columns only (field/message/reading_date/reporter; the view's
      (ไม่ระบุ) fallback stands — no personnel lookup).
  1e. Queue honesty + 429 — notified_at marked ONLY on success
      (resp.ok AND body.ok); failed sends stay queued; a Telegram 429 is
      surfaced with parameters.retry_after (never coerced to success);
      ok:false bodies are failures.
  1f. No bot-token literal anywhere in git-tracked files (P1 guard —
      passes by construction; disclosed as a standing pass).
  2.  Live queue contract on ENV_DB (read-only): v_pending_threshold_alerts
      exposes exactly the pinned columns with the (ไม่ระบุ) fallback and
      pending-ASC ordering (WHERE notified_at IS NULL ORDER BY created_at
      ASC); the threshold_alert queue table exists with notified_at.
      (Passes already — the P1.3-delivered objects, consumed READ-ONLY.)

Run:  python3 -m pytest scripts/test_parity_p4_002_notify.py -q
      (or python3 -m unittest scripts.test_parity_p4_002_notify)
"""

from __future__ import annotations

import re
import subprocess
import sys
import unittest
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent))

API_URL = (
    "https://api.supabase.com/v1/projects/gllqtbyofrcjzmbnfoeh/database/query"
)

EF_PATH = (
    Path(__file__).resolve().parents[1]
    / "supabase/functions/notify-threshold/index.ts"
)

THAI_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
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
    assert r.status_code == 201, f"query API returned {r.status_code}: {r.text[:200]}"
    return r.json()


def _ef_source() -> str:
    return EF_PATH.read_text(encoding="utf-8")


class TestEFSourceContract(unittest.TestCase):
    """Group 1 — source-contract pins against the notify-threshold EF."""

    def test_1a_env_contract_telegram_names(self):
        """1a: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID read via Deno.env."""
        src = _ef_source()
        self.assertIn("TELEGRAM_BOT_TOKEN", src,
                      "EF must read the D1-pinned bot-token env name")
        self.assertIn("TELEGRAM_CHAT_ID", src,
                      "EF must read the D1-pinned chat-id env name")
        self.assertRegex(src, r'Deno\.env\.get\(\s*"TELEGRAM_BOT_TOKEN"')
        self.assertRegex(src, r'Deno\.env\.get\(\s*"TELEGRAM_CHAT_ID"')
        # The legacy Vault-era names must be gone (single broker: EF env).
        self.assertNotIn("WEBHOOK_THRESHOLD_NOTIFY_URL", src,
                         "legacy Vault-era webhook URL env must be removed")
        self.assertNotIn("WEBHOOK_THRESHOLD_NOTIFY_TOKEN", src,
                         "legacy Vault-era webhook token env must be removed")

    def test_1b_dormant_fail_closed_skip_order(self):
        """1b: skipped-true honest skip gates on BOTH env names, pre-queue."""
        src = _ef_source()
        token_pos = src.find('"TELEGRAM_BOT_TOKEN"')
        chat_pos = src.find('"TELEGRAM_CHAT_ID"')
        self.assertGreaterEqual(token_pos, 0, "bot token env name missing")
        self.assertGreaterEqual(chat_pos, 0, "chat id env name missing")
        m = re.search(r'skipped:\s*true', src)
        self.assertIsNotNone(m, "dormant skip ({skipped:true,…}) missing")
        skip_pos = m.start()
        queue_pos = src.find('.from("v_pending_threshold_alerts")')
        self.assertGreaterEqual(queue_pos, 0, "queue view usage missing")
        self.assertLess(
            skip_pos, queue_pos,
            "honest skip must fire BEFORE any queue work (fail-closed)",
        )

    def test_1c_authorization_header_send(self):
        """1c: Bearer-header sendMessage; token never embedded in a URL."""
        src = _ef_source()
        self.assertIn("api.telegram.org/bot/sendMessage", src,
                      "Telegram endpoint must be the header-form base URL")
        self.assertRegex(src, r'"Authorization"\s*:\s*`?Bearer')
        # The token must NOT be interpolated into any URL string.
        for m in re.finditer(r'api\.telegram\.org[^`"\']*', src):
            self.assertNotIn("${", m.group(0),
                             "token must never be interpolated into the URL")

    def test_1d_thai_buddhist_era_message(self):
        """1d: per-alert Thai message, พ.ศ. (+543) Thai-month date render."""
        src = _ef_source()
        self.assertIn("543", src, "พ.ศ. conversion (+543) missing")
        for month in THAI_MONTHS:
            self.assertIn(month, src, f"Thai month name missing: {month}")
        # Message built from the queue view's own columns only.
        for col in ("field", "message", "reading_date", "reporter"):
            self.assertIn(col, src, f"queue-view column missing from message: {col}")
        # No personnel lookup beyond the view's own fallback column.
        self.assertNotRegex(
            src, r'from\(\s*"personnel"|"reported_by_name_legacy"',
            "the EF must consume the view only — never its own personnel join",
        )

    def test_1e_queue_honesty_and_429(self):
        """1e: mark-on-success-only, 429 retry_after surfaced, ok:false fails."""
        src = _ef_source()
        # Success gate requires BOTH the HTTP status and the Bot-API ok flag.
        self.assertRegex(src, r'\.ok\s*&&', "success gate must include body ok")
        self.assertIn('"ok"', src, "Bot-API body ok flag must be checked")
        # 429 handling with retry_after surfaced (parameters.retry_after).
        self.assertIn("429", src, "429 status handling missing")
        self.assertIn("retry_after", src, "retry_after surfacing missing")
        self.assertIn("parameters", src, "Telegram 429 parameters missing")
        # notified_at is the queue marker — only successful sends may set it.
        self.assertIn("notified_at", src, "queue marker missing")
        self.assertIn("notifiedIds", src, "success-only mark list missing")

    def test_1f_no_bot_token_literal_in_tracked_files(self):
        """1f (standing pass, disclosed): no Telegram bot-token literal."""
        files = subprocess.run(
            ["git", "ls-files"],
            capture_output=True, text=True, check=True,
        ).stdout.splitlines()
        pattern = re.compile(r'bot\d{5,}:[A-Za-z0-9_-]{30,}')
        hits = []
        for f in files:
            p = Path(f)
            if not p.exists():
                continue
            try:
                if pattern.search(p.read_text(encoding="utf-8", errors="ignore")):
                    hits.append(f)
            except OSError:
                pass
        self.assertEqual(hits, [], f"bot-token literal committed in: {hits}")


class TestLiveQueueContract(unittest.TestCase):
    """Group 2 — live read-only probe of the P1.3-delivered queue objects."""

    def test_2a_view_columns_and_fallback(self):
        """2a: v_pending_threshold_alerts exposes exactly the pinned columns."""
        rows = _query(
            "select column_name from information_schema.columns "
            "where table_schema='wastewater' and table_name="
            "'v_pending_threshold_alerts' order by ordinal_position"
        )
        cols = [r["column_name"] for r in rows]
        self.assertEqual(
            cols,
            ["id", "reading_id", "field", "message", "created_at",
             "reading_date", "reporter"],
            f"queue view columns drifted: {cols}",
        )

    def test_2b_view_definition_pending_asc_and_fallback(self):
        """2b: pending-ASC WHERE + the (ไม่ระบุ) COALESCE stand verbatim."""
        rows = _query(
            "select pg_get_viewdef('wastewater.v_pending_threshold_alerts'"
            "::regclass, true) as def"
        )
        vdef = rows[0]["def"]
        self.assertIn("notified_at", vdef)
        self.assertRegex(vdef, re.compile(r'notified_at\s+is\s+null', re.I))
        self.assertRegex(vdef, re.compile(r'order\s+by\s+.*created_at', re.I | re.S))
        self.assertIn("(ไม่ระบุ)", vdef, "(ไม่ระบุ) fallback missing")
        self.assertIn("reported_by_name_legacy", vdef)

    def test_2c_queue_table_notified_marker(self):
        """2c: threshold_alert exists with notified_at (NULL = pending)."""
        rows = _query(
            "select 1 from information_schema.columns where table_schema="
            "'wastewater' and table_name='threshold_alert' and column_name="
            "'notified_at'"
        )
        self.assertEqual(len(rows), 1, "wastewater.threshold_alert.notified_at missing")

    def test_2d_queue_queryable_read_only(self):
        """2d: the queue is readable (honest count recorded, no assertion on size)."""
        rows = _query("select count(*)::int as n from wastewater.v_pending_threshold_alerts")
        self.assertIsInstance(rows[0]["n"], int)
        print(f"\n[receipt] pending threshold alerts right now: {rows[0]['n']}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
