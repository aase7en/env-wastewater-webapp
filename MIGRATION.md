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
- Frontend (monitoring webapp) — a first UI design mockup exists as a Claude
  Artifact (control-room-style daily dashboard: DO process-flow card, water
  quality KPI tiles, equipment LED panel, 14-day log table). Not yet
  implemented or saved into this repo — ask in-session for the link, or
  regenerate the design brief from this file's context if the artifact link
  is lost.

## In progress — Personnel reconciliation (started 2026-07-05, session 2)

Goal: backfill `wastewater.reading.reported_by` (currently NULL on all 907
rows) by resolving `reported_by_name_legacy` to real `core.personnel` /
`core.app_user` records.

`reported_by_name_legacy` has 12 distinct values across 907 rows. 2 of them
are raw IDs instead of names (see phase1-analysis.md §7):

| Legacy value | Rows | Resolved to |
|---|---|---|
| `2122222222029292` | 176 | **นายวิโรจน์ สุขเกษม** (confirmed by user 2026-07-05) — same person as the 87 rows already logged under the full name "นายวิโรจน์ สุขเกษม"; these two legacy values must merge to one `core.personnel` row when backfilled |
| `1234567890678` | 67 | **unresolved** — still need to identify who this is |

Still needed before the backfill can run:
1. Identity behind `1234567890678`.
2. The personnel master source (`ข้อมูลบ่อบำบัดประจำวัน - ข้อมูลผู้ปฏิบัติงาน.csv`,
   33 rows) or equivalent, to populate `core.personnel` + `core.app_user` for
   all 12 reporters, not just the 2 unmatched ones.
3. Once both are in hand: `INSERT` into `core.personnel`/`core.app_user`,
   then `UPDATE wastewater.reading SET reported_by = ...` keyed off
   `reported_by_name_legacy` (folding the two `2122222222029292` /
   `นายวิโรจน์ สุขเกษม` variants into the same person).
