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
- **`location_id`** — **P3 complete, executed 2026-07-07.** See "Location
  schema" below.
- **`wastewater_discharged`** — **P4 complete, executed 2026-07-07.** See
  "Discharge boolean" below.

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

## RESOLVED — PDF template-builder tables (closed 2026-07-07, chunk P2)

Migration `p2_pdf_template_equipment_repair_request` applied to `ENV_DB`:

- **`core.equipment`** — seeded with all 10 pieces of equipment, `code`
  matching the existing boolean column names in `wastewater.reading`
  (`pump1`, `pump2`, `aerator1`, `aerator2`, `sludge_pump1`, `sludge_pump2`,
  `chlorine_pump1`, `chlorine_pump2`, `screen_coarse`, `screen_fine`).
  `location_id` left NULL pending P3.
- **`core.repair_request`** — `equipment_id`/`reading_id`/`reported_by` all
  nullable, `cause text NOT NULL`, `status` enum (`open`/`in_progress`/
  `resolved`/`cancelled`). Empty — nothing to seed, these get created by
  staff/the future webapp.
- **`core.pdf_template`** — `paper_size` enum (`a4`/`a5`), `orientation`
  enum (`portrait`/`landscape`), `layout jsonb`, `is_builtin` flag. **Empty
  on purpose** — no starter templates seeded yet, since the actual layout
  for ทส.1/ทส.2/repair-request depends on the UI design work that's
  paused (see `design/ui-brief.md`). Populate once that direction is picked.

All three have RLS enabled with the same `ALL` policy for `authenticated`
used elsewhere in this schema (see `carbon.reading`, `wastewater.reading`).

## RESOLVED — Location schema (closed 2026-07-07, chunk P3)

Migration `p3_location_category_coords_p4_discharge_boolean` applied to
`ENV_DB`, decisions from a grilling session (see `docs/adr/0002-location-
category-lookup-table.md` for the reasoning on the category decision):

- **`core.location_category`** — new lookup table (not an enum, not free
  text — see ADR-0002), seeded with 8 categories: สิ่งแวดล้อม, โรงครัว,
  ซักฟอก, OPD, IPD, ห้องฟัน, ห้องยา, การเงิน.
- **`core.location`** — gained `category_id` (FK), `lat`/`lng` (plain
  `numeric`, not PostGIS — no spatial-query requirement exists yet).
  Seeded with exactly **one** real row: `WWTP-1`, "บ่อบำบัดน้ำเสีย
  (Activated Sludge 60 ลบ.ม.)", category สิ่งแวดล้อม. Other departments'
  locations are *not* seeded with placeholder data — added by whoever
  manages them, when ready.
- **Backfilled**: all 907 `wastewater.reading.location_id` and the 1
  `carbon.meter.location_id` now point at `WWTP-1`. Verified 0 remaining
  NULLs on both.

## RESOLVED — Discharge boolean (closed 2026-07-07, chunk P4)

`wastewater.reading.wastewater_discharged` changed from `numeric` to
`boolean` in place (`ALTER COLUMN ... TYPE boolean`, NULL-preserving —
all 907 rows were NULL before and after, so no data was at risk). Meaning
is now simply "was treated water discharged today" (yes/no), matching what
the source system ever actually recorded (a status, never a measured
volume).

**Discovered mid-migration**: two views depend on this column —
`wastewater.v_reading_detail` (per-reading detail + threshold flags used by
the dashboard) and `wastewater.v_monthly_summary` (the ทส.2 data source),
which had `sum(wastewater_discharged)` — meaningless once the column is
boolean. Both views were dropped and recreated; `v_monthly_summary`'s
`total_wastewater_discharged` (a sum) became **`days_discharged`**
(`count(*) FILTER (WHERE wastewater_discharged)`) — "how many days this
month had a discharge," the boolean-correct equivalent. Verified the view
still runs and returns sane data (all `days_discharged = 0` currently,
correct since every row is still NULL).

## RESOLVED — FastAPI backend (closed 2026-07-16, chunk P5)

The backend is scaffolded and all v1 endpoints are live. Built in five
sub-chunks (P5a–P5e), each its own commit on branch `claude/webapp-p5-fastapi`.

- **Stack** (decision recorded in `docs/adr/0003-fastapi-sqlalchemy-async-
  supabase-jwt.md`): FastAPI + SQLAlchemy 2.0 async + asyncpg against ENV_DB.
  The original Pi5 self-host plan was abandoned (Pi5 also runs a Bitcoin full
  node + Hermes agent — CPU ~80%, RAM strained). Supabase free tier replaces it.
- **Auth** runs in two selectable modes via `AUTH_MODE`:
  - `stub` — fixed mock user (for local dev before real `auth.users` rows exist)
  - `jwt`  — verifies Supabase-issued JWTs with `SUPABASE_JWT_SECRET`, looks
    up `core.app_user` by `auth.users.id`
- **15 endpoints** across 6 routers: daily-form CRUD (transactional carbon +
  wastewater insert), dashboard (reads `v_reading_detail` + `v_monthly_summary`),
  reference data, repair requests, PDF templates, `/api/me`.
- **Threshold stub**: DO<2.0 / Cl<0.5 / pH 6.5–8.5 checks fire on create and
  log at WARNING. Telegram/Line delivery is deliberately NOT wired (SPEC lists
  threshold alerts as out-of-v1) — the return list lets a future notifier
  consume the same results.
- **44 tests passing** — pure-function (computed values, thresholds), schema
  validation (SPEC §6 cause-mandatory rule), auth stub, and endpoint contracts
  via a stub async session. DB-backed integration tests deferred (see P5b.2).

### Open follow-up from P5

- **P5b.2 — schema introspection verification.** The 11 ORM models are
  reconstructed from `phase2_generate_sql.py` (the authoritative INSERT
  contract) + migration notes, NOT introspected from the live DB yet. Once
  `SUPABASE_DB_URL` is provided, snapshot the real schema into
  `reports/schema-snapshot-p5.md` and reconcile any drift (DB wins).

## Not started

- **P6 — Frontend build-out.** Build the real frontend from the approved design
  (see `design/ui-brief.md` + chosen mockup direction), replacing the Claude
  Artifact mockups with real templated pages wired to P5's API. Depends on P5
  (done) and a design direction being locked in via Claude Design/z.ai. Design
  is currently paused — 4 mockups exist (dashboard ×3 palette variants + a
  live-dashboard-style variant + a mobile daily-entry form); links are
  in-session only, regenerate from the brief if lost.

## Next-session plan (cross-agent handoff)

This file is git-tracked, so it is the resume point for **any** agent
(Claude, Codex, ZCode, Hermes, ...) that clones this repo — not just this
session. Follow the commit convention already used in this repo's log:
`chunk(<ID>): <result> [next: <ID>]`. Resume order below; each chunk should
be its own commit.

| ID | Goal | Depends on | Files |
|---|---|---|---|
| ~~`P1`~~ | ~~Personnel backfill~~ — **done 2026-07-07**, see "Personnel reconciliation" above. | — | — |
| ~~`P2`~~ | ~~PDF-builder tables~~ — **done 2026-07-07**, see "PDF template-builder tables" above. | — | — |
| ~~`P3`~~ | ~~Location schema~~ — **done 2026-07-07**, see "Location schema" above. | — | — |
| ~~`P4`~~ | ~~Discharge boolean~~ — **done 2026-07-07**, see "Discharge boolean" above. | — | — |
| ~~`P5`~~ | ~~Scaffold FastAPI backend~~ — **done 2026-07-16**, see "FastAPI backend" above. 5 sub-chunks P5a–P5e. | — | `app/`, `tests/`, `pyproject.toml`, `docs/adr/0003-*.md` |
| `P6` | Build the real frontend from the approved design (see `design/ui-brief.md` + chosen mockup direction) — replace the Claude Artifact mockups with real templated pages wired to P5's API. | P5, and a design direction locked in via Claude Design/z.ai | frontend dir (framework TBD at P5) |

**Resume command for a fresh agent**: read this file, then `git log --oneline -10` to see which `chunk(P#)` commits already landed, then continue at the lowest-numbered `P#` not yet committed.
