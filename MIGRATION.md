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

- **`reported_by`** — **P1 complete, executed 2026-07-07.** Decision: historical/
  migrated rows do **not** get the `reported_by` FK backfilled (it points to
  `core.app_user.id` → `auth.users.id`, which would mean creating real login
  accounts for 3 already-resigned staff just for record-keeping — not worth
  it). Instead: `reported_by_name_legacy` was consolidated (the 3 นายวิโรจน์
  variants → one canonical string, verified 330 rows) and `core.personnel`
  was seeded with all 9 identifiable people (name/position/status only — no
  national ID/bank/salary/address, see below). `reported_by` (FK) stays NULL
  for migrated rows; it'll be populated going forward once real users log
  into the webapp.
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

## RESOLVED — Personnel reconciliation (closed 2026-07-07)

`reported_by_name_legacy` originally had 12 distinct values across 907 rows.
All three of these are the **same person**, now consolidated to one string
(`UPDATE ... SET reported_by_name_legacy = 'นายวิโรจน์ สุขเกษม' WHERE ...`,
verified 330 rows post-update):

| Legacy value (before) | Rows | Person |
|---|---|---|
| `นายวิโรจน์ สุขเกษม` (full name, as originally logged) | 87 | นายวิโรจน์ สุขเกษม |
| `2122222222029292` (raw ID) | 176 | นายวิโรจน์ สุขเกษม |
| `1234567890678` (raw ID) | 67 | นายวิโรจน์ สุขเกษม |

The source was the hospital's **full HR export** (264 employees, not the
33-row water-treatment-specific file originally expected) — it contains
national ID, bank account, salary, and home address per employee. **None of
that was extracted, stored, or committed** — only name/position/department/
status for the 9 people who actually appear as wastewater reporters. The raw
upload itself was never committed to git (session-local only, same policy as
`data/raw/`).

`core.personnel` now has 9 rows (`STAFF-001`..`STAFF-009`, employee_code
synthesized — the HR export had no usable position-number field, and
national ID was deliberately not used as a key):

| Code | Name | Position | Dept | Status |
|---|---|---|---|---|
| STAFF-001 | นายวิลาส รื่นวิชา | พนักงานบริการ | อนามัยสิ่งแวดล้อมฯ | active |
| STAFF-002 | นายสมพร หามาลี | ผู้ช่วยช่างทั่วไป | งานซ่อมบำรุง | active |
| STAFF-003 | นายวิโรจน์ สุขเกษม | พนักงานเปล | งานการพยาบาลผู้ป่วยนอก (ย้ายมาจาก ENV — confirmed by user) | active |
| STAFF-004 | นายภาณุ งามนิมิตร | พนักงานบริการ | อนามัยสิ่งแวดล้อมฯ | ลาออก |
| STAFF-005 | นายเชษฐา ธรรมสาลี | พนักงานบริการ | อนามัยสิ่งแวดล้อมฯ | ลาออก |
| STAFF-006 | นายธงชัย มะอาจเลิศ | พนักงานบริการ | อนามัยสิ่งแวดล้อมฯ | active |
| STAFF-007 | นายต้นฟ้า งามนิมิตร | พนักงานบริการ | อนามัยสิ่งแวดล้อมฯ | ลาออก |
| STAFF-008 | นายศุภศิษฎิ์ คงสุวรรณ | นักวิชาการสาธารณสุข | อนามัยสิ่งแวดล้อมฯ | active |
| STAFF-009 | นายเขตโสภณ แก้วเที่ยง | พนักงานช่วยเหลือคนไข้ | งานการพยาบาลผู้ป่วยนอก | active |

**Not resolved**: `นางสาวอริศรา เรืองอุไร` (1 row only) — not found in the HR
export (possibly left before the export was taken, or name recorded
differently). Left as-is; negligible impact (1/907 rows).

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
| ~~`P1`~~ | ~~Personnel backfill~~ — **done 2026-07-07**, see "Personnel reconciliation" above. | — | — |
| `P2` | Add `core.pdf_template` (layout JSON), `core.equipment`, `core.repair_request` tables per `docs/adr/0001-pdf-template-builder-in-v1.md`. Write as a migration, apply via Supabase MCP `apply_migration`, verify with `list_tables`. | none | new migration file, update `SPEC.md` status line |
| `P3` | Expand `core.location`: add department/category field (enum or free text — decide against the list โรงครัว/ซักฟอก/OPD/IPD/ห้องฟัน/ห้องยา/การเงิน/etc.) + coordinate columns (`lat numeric`, `lng numeric`, or PostGIS point — decide based on whether map display is needed near-term). Seed the one wastewater location (Activated Sludge, 60 ลบ.ม.) then backfill `wastewater.reading.location_id` + `carbon.meter.location_id`. | none, but the column-type decision (enum vs text, lat/lng vs PostGIS) needs a quick user confirm before writing the migration | migration file, `CONTEXT.md` (add "Location" glossary update) |
| `P4` | Change `wastewater_discharged` to boolean semantics (decided 2026-07-06) — either `ALTER COLUMN` type change or add new boolean column + deprecate the numeric one. Backfill the historical 907 rows' value from whatever's inferable, or leave NULL (nothing to infer — source only ever had a status, not captured before). | none | migration file |
| `P5` | Scaffold FastAPI backend: project structure, Supabase client, `core.app_user`-based auth, REST endpoints for the daily form + dashboard reads, pytest scaffolding per Iron Law #1 (failing test first). | P1-P4 ideally done first so the schema is stable | new `app/` or `backend/` dir |
| `P6` | Build the real frontend from the approved design (see `design/ui-brief.md` + chosen mockup direction) — replace the Claude Artifact mockups with real templated pages wired to P5's API. | P5, and a design direction locked in via Claude Design/z.ai | frontend dir (framework TBD at P5) |

**Resume command for a fresh agent**: read this file, then `git log --oneline -10` to see which `chunk(P#)` commits already landed, then continue at the lowest-numbered `P#` not yet committed.
