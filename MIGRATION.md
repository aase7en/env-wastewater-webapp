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

## Known follow-ups — decisions closed 2026-07-06

- **`reported_by`** — mapping fully resolved, see "Personnel reconciliation" below.
  Backfill SQL not yet written/run — that's next-session chunk `P1`.
- **`location_id`** — **scope expanded** (user decision 2026-07-06): the
  wastewater pond is one location (Activated Sludge, 60 ลบ.ม.) but
  `core.location` must support the hospital's *other* departments too —
  โรงครัว, ซักฟอก, OPD, IPD, ห้องฟัน, ห้องยา, การเงิน, and more added later —
  plus **GPS coordinates** per location. Current `core.location` schema has
  no coordinate columns (only `id, code, qr_code, area_name, image_path,
  created_at`) — needs `lat`/`lng` (or a PostGIS `geography(Point)`) added.
  This is bigger than "seed one row" — see next-session chunk `P3`.
- **`wastewater_discharged`** — **decided (2026-07-06): simplify to a
  boolean** (ระบายหรือไม่ระบาย) rather than tracking an actual discharged
  volume — matches what the source system ever recorded (a status, not a
  measurement). Current column is `numeric`; needs a type change or a new
  boolean column — see next-session chunk `P4`.

## RESOLVED — Personnel reconciliation (closed 2026-07-06)

`reported_by_name_legacy` has 12 distinct values across 907 rows. All three
"reporter" variants below are now confirmed to be **the same person**:

| Legacy value | Rows | Person |
|---|---|---|
| `นายวิโรจน์ สุขเกษม` (full name, as originally logged) | 87 | นายวิโรจน์ สุขเกษม |
| `2122222222029292` (raw ID, confirmed 2026-07-05) | 176 | นายวิโรจน์ สุขเกษม |
| `1234567890678` (raw ID, confirmed 2026-07-06) | 67 | นายวิโรจน์ สุขเกษม |

→ **330 of 907 rows (36%) all belong to one person**, logged under 3
different legacy values. The backfill (`P1`, see below) must fold all three
into a single `core.personnel` row.

**Still blocking the actual backfill**: the personnel master file. User
pointed to `C:\Users\aase7en\Downloads\เจ้าหน้าที่รพ.อุทัย.csv` (2026-07-06)
— **that path is on the user's own Windows machine, not reachable from this
session** (this session runs in an isolated cloud container with no access
to any local computer's filesystem). To unblock: attach/paste the CSV
directly into the chat, or upload it to a Google Drive folder the session's
Drive connector can search.

## Not started

- FastAPI backend — see next-session chunk `P5`.
- Frontend build-out — see next-session chunk `P6`. Design direction for
  this is paused for now; see `design/ui-brief.md` for the full brief
  (portable prompt for Claude Design / z.ai design or whichever tool picks
  it up next) and the 4 mockups already made (dashboard ×3 palette
  variants + a live-dashboard-style variant + a mobile daily-entry form) —
  links are in-session only; regenerate from the brief if lost.
- PDF template-builder module (`core.pdf_template`/`core.equipment`/
  `core.repair_request` tables) — see next-session chunk `P2`.

## Next-session plan (cross-agent handoff)

This file is git-tracked, so it is the resume point for **any** agent
(Claude, Codex, ZCode, Hermes, ...) that clones this repo — not just this
session. Follow the commit convention already used in this repo's log:
`chunk(<ID>): <result> [next: <ID>]`. Resume order below; each chunk should
be its own commit.

| ID | Goal | Depends on | Files |
|---|---|---|---|
| `P1` | Personnel backfill: `INSERT` 33 rows into `core.personnel`/`core.app_user` from the master CSV (once provided), then `UPDATE wastewater.reading SET reported_by = ...` keyed off `reported_by_name_legacy`, folding the 3 นายวิโรจน์ variants into one person. Gate: gets a live-DB write, needs explicit user approval before executing, same as Phase 2. | Personnel CSV from user | new `scripts/phase3_personnel_backfill.py` (mirror `phase2_generate_sql.py`'s batching pattern), `reports/phase3-personnel-summary.md` |
| `P2` | Add `core.pdf_template` (layout JSON), `core.equipment`, `core.repair_request` tables per `docs/adr/0001-pdf-template-builder-in-v1.md`. Write as a migration, apply via Supabase MCP `apply_migration`, verify with `list_tables`. | none | new migration file, update `SPEC.md` status line |
| `P3` | Expand `core.location`: add department/category field (enum or free text — decide against the list โรงครัว/ซักฟอก/OPD/IPD/ห้องฟัน/ห้องยา/การเงิน/etc.) + coordinate columns (`lat numeric`, `lng numeric`, or PostGIS point — decide based on whether map display is needed near-term). Seed the one wastewater location (Activated Sludge, 60 ลบ.ม.) then backfill `wastewater.reading.location_id` + `carbon.meter.location_id`. | none, but the column-type decision (enum vs text, lat/lng vs PostGIS) needs a quick user confirm before writing the migration | migration file, `CONTEXT.md` (add "Location" glossary update) |
| `P4` | Change `wastewater_discharged` to boolean semantics (decided 2026-07-06) — either `ALTER COLUMN` type change or add new boolean column + deprecate the numeric one. Backfill the historical 907 rows' value from whatever's inferable, or leave NULL (nothing to infer — source only ever had a status, not captured before). | none | migration file |
| `P5` | Scaffold FastAPI backend: project structure, Supabase client, `core.app_user`-based auth, REST endpoints for the daily form + dashboard reads, pytest scaffolding per Iron Law #1 (failing test first). | P1-P4 ideally done first so the schema is stable | new `app/` or `backend/` dir |
| `P6` | Build the real frontend from the approved design (see `design/ui-brief.md` + chosen mockup direction) — replace the Claude Artifact mockups with real templated pages wired to P5's API. | P5, and a design direction locked in via Claude Design/z.ai | frontend dir (framework TBD at P5) |

**Resume command for a fresh agent**: read this file, then `git log --oneline -10` to see which `chunk(P#)` commits already landed, then continue at the lowest-numbered `P#` not yet committed.
