#!/usr/bin/env python3
"""ENV-BACKFILL-002 D3 preflight — STOP-on-drift gates (read-only).

Aborts (exit 3) unless the live corpus matches the WO §3 pin exactly:
  carbon.reading 907 / min 2024-01-09 / max 2026-07-04, plant meter intact,
  plus per-target-table baseline counts recorded for the reconciliation.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import httpx  # noqa: E402

from test_parity_backfill_002 import q, token, PLANT_METER_ID  # noqa: E402

CHECKS = [
    ("carbon.reading count", "select count(*)::int n from carbon.reading", 907),
    ("carbon.meter count", "select count(*)::int n from carbon.meter", 1),
    ("carbon.emission_factor", "select count(*)::int n from carbon.emission_factor", 12),
    ("chemical.movement", "select count(*)::int n from chemical.movement", 0),
    ("fuel.dispense_log", "select count(*)::int n from fuel.dispense_log", 0),
    ("garbage.collection_log", "select count(*)::int n from garbage.collection_log", 0),
    ("wastewater.reading", "select count(*)::int n from wastewater.reading", 907),
    ("plant meter rows", f"select count(*)::int n from carbon.reading where meter_id='{PLANT_METER_ID}'", 907),
    ("subtype column absent", ("select count(*)::int n from information_schema.columns "
                               "where table_schema='carbon' and table_name='reading' "
                               "and column_name='activity_subtype'"), 0),
]


def main() -> int:
    if not token():
        print("NO TOKEN — preflight cannot run", file=sys.stderr)
        return 2
    rec = {}
    drift = []
    for label, sql, want in CHECKS:
        ok, rows = q(sql)
        got = rows[0]["n"] if ok and rows else f"QUERY-FAIL: {rows}"
        rec[label] = got
        status = "OK" if got == want else "DRIFT"
        print(f"  [{status}] {label}: {got} (expect {want})")
        if got != want:
            drift.append(label)
    ok, rows = q(f"select min(reading_date)::text mn, max(reading_date)::text mx "
                 f"from carbon.reading where meter_id='{PLANT_METER_ID}'")
    rng = rows[0] if ok and rows else None
    print(f"  plant range: {rng}")
    rec["plant_range"] = rng
    if not rng or rng["mn"] != "2024-01-09" or rng["mx"] != "2026-07-04":
        drift.append("plant range")
    Path("/tmp/kilo/backfill_002_preflight.json").write_text(json.dumps(rec, ensure_ascii=False, indent=1))
    if drift:
        print(f"STOP-ON-DRIFT: {drift}", file=sys.stderr)
        return 3
    print("PREFLIGHT OK — drift gates green; baseline recorded.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
