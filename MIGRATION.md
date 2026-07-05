# Migration Status

## Phase 1 — Read-only CSV analysis
**Status: COMPLETE.** See `reports/phase1-analysis.md` for the full findings
(date parsing, checklist column distinct values, chlorine column mapping
decision, electricity meter deltas, null rates, reporter/personnel join gaps).

Key decision from this phase: `wastewater.reading.chlorine_used` maps from
`คลอรีนน้ำที่ใช้จริง` (actual concentrated chlorine), not `คลอรีนน้ำ ที่ใช้`
(gross top-up volume) — see phase1-analysis.md §3 for the reasoning.

## Phase 2 — Supabase insert
**Status: COMPLETE** — executed 2026-07-05 against Supabase project `ENV_DB`
(`gllqtbyofrcjzmbnfoeh`). See `reports/phase2-summary.md` for the full method
and verification log.

Result: 907/907 source rows (908 CSV rows minus 1 blank-date row) inserted
into both `carbon.reading` and `wastewater.reading`, joined via
`carbon_reading_id`, 0 wrong meter assignments, 0 null legacy IDs.

## Known follow-ups (not blocking, out of scope for Phase 1/2)

- **`reported_by` FK is NULL on all rows** — 2 of 13 distinct reporter IDs in
  the source CSV aren't in the personnel master (see phase1-analysis.md §7).
  Needs a personnel migration/reconciliation pass before this FK can be
  backfilled.
- **`location_id` FK is NULL on all rows** — no location migration has been
  done yet.
- **`wastewater_discharged` is NULL on all rows** — source column
  (`การระบายน้ำทิ้ง` status) is a text status, not a volume; the status text
  was appended into `note` instead per user decision during Phase 2.

## Not started

- FastAPI backend
- Frontend (monitoring webapp)
