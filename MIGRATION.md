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

- **P5b.2-local — DONE.** Reconciled the 11 ORM models against the Phase 2
  INSERT contract (`phase2_generate_sql.py` `WR_COLS`) + migration notes.
  Found and fixed one real drift: `wastewater.reading.cause` did not exist
  (it lives on `core.repair_request`); the request field is now
  `abnormal_cause` and seeds a repair request in the same transaction.
  Recorded in `reports/schema-snapshot-p5.md`.
- **P5b.2-live — scaffolded, awaiting `SUPABASE_DB_URL`.** Two artifacts
  land the moment the URL is provided:
  1. `scripts/introspect_schema.py` — dumps exact types, enums, constraints,
     indexes, RLS, and view definitions to `reports/schema-snapshot-live.md`.
  2. `tests/integration/` — 8 tests (table/column presence, 907-row claim,
     view queryability, seeds, GET endpoints end-to-end). Auto-skip until
     the URL is set; `uv run pytest` stays green on fresh checkouts.
  Run with: `uv run python scripts/introspect_schema.py && uv run pytest tests/integration -v`

## RESOLVED — Frontend tracer-bullet (closed 2026-07-16 → 17, chunks P10 → P10.7)

The frontend is scaffolded end-to-end as a tracer-bullet on branch
`claude/webapp-p5-fastapi`. P10.1–P10.5 shipped the dashboard; P10.6
added the Aura Edition design system + the daily-entry form; P10.7
migrated the dashboard onto Aura so the whole app is consistent.

- **Stack**: React 18 + Vite + TypeScript + Tailwind CSS + react-router-dom.
  Vite proxies `/api` → `http://127.0.0.1:8000` so the frontend shares the
  backend's origin in dev — no separate API URL to configure.
- **Design direction — UTH[AI]-EVN Aura Edition** (locked in P10.6,
  applied across the whole app in P10.7): dark deep-teal foundation
  (`#00161B`), neon cyan/lime accents (`#00F0FF` / `#CCFF00`),
  glassmorphism cards with a rotating conic-gradient aura border,
  `Plus Jakarta Sans` display + `IBM Plex Sans Thai` fallback.
  See `design/uth_ai_evn_system_design_aura_edition.md` + `design/DESIGN.md`.
- **Pages** (3 of them, all wired to the live API, all on Aura):
  - `/dashboard` — Process Flow Diagram + KPI tiles + 14-day log table
    with Thai-BE dates (P10.1–4 → migrated to Aura in P10.7).
  - `/form` + `/form/:id` — daily-entry form (create / edit), 6-section
    Accordion, mobile-first, inline threshold warnings, conditional
    `abnormal_cause` when `system_operating=false` (SPEC §6), admin-gated
    delete (P10.6.4).
  - `/readings` — recent readings list, row click → edit (P10.6.5).
- **CRUD**: `POST/GET/PUT/DELETE /api/readings` all wired through typed
  `api-client.ts` + mutation hooks (`useCreate/Update/DeleteReading`).
  `reported_by` + `location_id` are NOT sent by the form (server-derived).
- **Verified** (P10.6 smoke test + P10.7 DOM scan): TypeScript 0 errors,
  Vite build ~301KB → ~94KB gzip, all routes serve HTTP 200, Vite
  `/api/*` proxy reaches FastAPI (`/api/health` returns JSON). Dashboard
  DOM scan confirms no legacy `bg-white` / `text-navy-900` / `border-navy`
  classes remain. DB-backed endpoints return 500 on this Windows machine
  — known IPv6-only direct-host issue (see P5b.2-live), not a frontend
  bug; full CRUD round-trip waits for Cloud Run deploy or a v4-pooled
  Supabase connection.

### Open follow-up (deferred chunks)

- **P11 — Auth flow wiring.** Frontend currently no-op against stub auth;
  JWT login UI + token storage is a later chunk once `AUTH_MODE=jwt` is
  real and `auth.users` rows exist.
- **P12 — Deployment.** Dockerfile + Cloud Run (or Supabase Edge
  Function for the API). Also unblocks the full CRUD round-trip by
  giving the backend a v4-routable DB connection.
- **P13 — PDF template-builder UI** — ทส.1/ทส.2/repair-request layouts.
  Depends on the layout work still paused in `design/ui-brief.md`.
- **OpenAPI auto-gen client** — `src/lib/types.ts` is manual for now;
  `openapi-typescript` auto-gen is a later hardening chunk.

> **⚠ Superseded 2026-07-17/18 (ZCode rolling roadmap):** the three bullets
> above shipped in a different shape than planned — P11 = Supabase Auth
> (email/password + Google + LINE, no FastAPI JWT), P12 = **drop FastAPI in
> prod** (frontend → Supabase JS client + SQL views), P13 = GitHub Pages
> deploy, plus P14–P19 (UX polish, Playwright+Ladle, ทส.1/ทส.2/ใบแจ้งซ่อม
> client-side PDF, threshold notifications, Equipment page, Trends charts).
> See `git log --oneline` + `.zcode/plans/` for the authoritative trail.

## ACTIVE — Two-track parallel work: F (Fable5) ∥ Z (ZCode) — from 2026-07-18

Two agents work this repo **at the same time**. Read this before starting any
chunk. Full plan lives in the session plan file of 2026-07-18 (Fable5); the
binding rules are here.

### Lanes

| | **Track F — Fable5** (visual layer) | **Track Z — ZCode** (feature/data layer) |
|---|---|---|
| Scope | Theme/tokens, AppShell/layout, styling (className/markup) of all pages, `design/ui-brief.md`, `frontend/public/` assets, `frontend/index.html` (while F1 open) | `src/lib/*` logic (supabase-queries, hooks, pdf), page logic, new feature pages, Supabase SQL / Edge Functions, `tests/e2e/*`, `.zcode/*`, `.github/workflows/*` |
| Chunk prefix | `chunk(F#): ...` | `chunk(P#): ...` (continues P20+) |
| Must NOT touch | Z's logic/data code, SQL, e2e tests | Colors/fonts/layout/theme, `tailwind.config.js`, `index.css`, `src/styles/*`, `design/` |

### Shared rules (both agents)

1. **Claim before work**: add a row to the In-progress table below, commit+push
   it, then start. Remove the lock in the chunk's own commit when done.
   Never edit files inside another agent's locked chunk scope.
2. **Pull before commit**: `git pull --ff-only` (rebase own commits if
   diverged) + `npm run build` must pass before every push.
3. **Hotspot files**: `package.json` — additive deps OK, pull first.
   `App.tsx` — Z may add routes; F does not edit routes.
   `index.html` — owned by F until F1 is done, then Z may add PWA manifest.
4. **Same page ≠ same time**: a Z chunk that edits logic inside an existing
   page (e.g. autosave in `DailyFormPage`) must not run while an F chunk is
   restyling that page — check the In-progress table first.
5. **Dark/Light toggle is Track F (F1)** — removed from ZCode's P20 rolling
   list. Z: do not implement theming.
6. **No destructive git in the shared working tree** (added after F2 was
   wiped 3× mid-flight by Track Z `reset --hard`/`clean` cycles on
   2026-07-18): `git reset --hard`, `git checkout -- .`, and `git clean`
   destroy the *other* agent's uncommitted work — use `git stash` /
   `git revert` instead. Track F now works from its own **git worktree**
   (`git worktree add ../envww-trackf track-f`) and lands via fast-forward
   pushes of `track-f` → `main`, so Z's tree operations can no longer
   collide with F. Z: keep pulling `main` as usual; never delete the
   `track-f` branch or the worktree registration.
7. **Work orders (Phase 2)**: every chunk has a spec file in
   `docs/work-orders/` any agent can execute or resume — file scope binds
   to the *chunk*, not permanently to an agent; whoever holds the claim
   may touch its files. Pause/resume protocol + the standard resume prompt
   live in `docs/work-orders/README.md` (built for the 5-hr-limit handoff).
8. **New page = new file**; the `App.tsx` route for a page is edited only
   by the holder of that page's work order (one WO at a time).

### In-progress claims

| Chunk | Agent | Claimed | Scope (files) |
|---|---|---|---|
| STAT-1 | zcode (GLM5.2) | 2026-07-20 | `frontend/src/components/pfd/StatusBadge.tsx`, `ProcessFlowDiagram.tsx`, `pages/DashboardPage.tsx`, `pages/ReadingsListPage.tsx`, `pages/EquipmentPage.tsx`, `components/ui/aura.stories.tsx` |
| SCHEMA-6 | zcode (GLM5.2) | 2026-07-20 | `supabase/migrations/20260720000000_schema6_overview_public_aggregate.sql`, `frontend/src/lib/supabase-queries.ts`, `frontend/src/lib/overview.ts` |

> **Reopened 2026-07-19 (Fable5 review): P0 `SCHEMA-5-rest-exposure`** — ทุก
> `.from()` ใน frontend 404 (PGRST205) เพราะ `public` schema ว่างเปล่าและไม่
> expose domain schemas. Fix spec + DDL verbatim ครบใน
> `docs/work-orders/SCHEMA-5-rest-exposure.md` (cheap-ok → GLM).
> ผล review เต็มอยู่ท้าย `docs/handoff/2026-07-19-track-z-complete.md`.
> Track Z chunks อื่นปิดหมดตามเดิม; F5/F6 เป็น Track F scope (Sonnet 5).

> **Phase 2 (Wave 1) is live** — chunks are defined in `docs/work-orders/`:
> V1a/b ใบแจ้งซ่อม · V2a/b Carbon page · V3a/b Notification bell ·
> V4a/b Unified Command home · F4.1–F4.5 · F5 · F6.
> Z suggested start order: **V1a → V3a → V2a** (all new files, zero
> collision), then V4a after V2a. UI halves (b) unblock as data halves
> land — either agent may claim them (rule 7).
>
> **v2 multi-domain expansion (2026-07-17)** — Wave 2 (SCHEMA-1..4)
> shipped: 8 new schemas + RLS + emission factors Scope 1+2+3 +
> `carbon.v_unified_co2e` rollup view + `core.fn_audit_log()` trigger
> on every transactional table + A-Wiki schema-doc sync (PR #8).
> Wave 3 module data + UI skeletons queued (MOD-WS/WA/FU/GA/BL/FS/FO/CH).
> Wave 4 cross-cutting infra (AI-1/2/3, IMP-1/2/3, PDF-1/2/3).
> **Wave 4b DBA Console** queued: DBA-1..10 — admin database management
> UI (Hybrid query builder + raw SQL Advanced), NL→SQL generator,
> saved-query store, row annotation, chat on result set. RLS-bounded +
> statement whitelist (defense in depth via Edge Function). PHI filter
> via `core.ai_scope.patient_safe` flag.

Done: ~~F1 dual-theme foundation~~ (2026-07-18 — tokens.css `:root`/`.dark`,
toggle in AppShell, no-flash script in index.html; `frontend/index.html` is
released back to shared-hotspot status → Z may start PWA manifest work).
~~F2 shell + theme-safety conformance~~ (2026-07-18 — suite AppShell w-72 +
Material Symbols + top bar + user footer, ENV wordmark, AuraCard static-ring
discipline, Gauge/PFD/Recharts token-driven colors; landed from the track-f
worktree after 3 working-tree wipes, see rule 6).
~~F3 assets + docs~~ (2026-07-18 — logo/favicon from `logo 3D_aura.png`
into `frontend/public/` + sidebar brand + favicon link; `design/ui-brief.md`
rewritten as the suite-authority record with the 9 binding domain-mapping
rules; brand = UTH[AI]-ENV closed).

### Track F queue (Fable5)

F1 dual theme (Luminous Mint light + Boost dark + toggle) → F2.1–F2.7
per-page conformance with the 14-screen suite in `design/` (Dashboard, Form,
Readings, Trends, Equipment, Reports, Auth) → F3 logo/favicon + docs.

### Track Z queue (ZCode — user assigns; suggested order to avoid F)

P20a bulk import CSV (new files) → P20b form autosave (after F2 form pass) →
P20c PWA (after F1 releases `index.html`) → P20d sensor feed / AI query.

## Not started

(Nothing currently blocked — see "Next-session plan" below for the next
chunk candidates: P10.6 daily form, auth wiring, deployment.)

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
| ~~`P10`~~ | ~~Frontend tracer-bullet (dashboard)~~ — **done 2026-07-16**, see "Frontend tracer-bullet" above. 5 sub-chunks P10.1–P10.5. | P5, design direction (PFD, locked in) | `frontend/` (React + Vite + Tailwind) |
| ~~`P10.6`~~ | ~~Aura Edition design system + daily-entry form + readings list~~ — **done 2026-07-17**, see "Frontend tracer-bullet" above. 6 sub-chunks P10.6.1–P10.6.6. | P10 (scaffold), Aura design direction (locked in) | `frontend/src/components/ui/`, `pages/DailyFormPage.tsx`, `pages/ReadingsListPage.tsx`, `design/` |
| ~~`P10.7`~~ | ~~Dashboard → Aura migration~~ — **done 2026-07-17**. Restyled `DashboardPage` + the 4 PFD components (KpiTile, Gauge, AerationTank, ProcessFlowDiagram) onto the Aura Edition dark theme. Pure styling pass, no behavior change. | P10.6.1 (Aura foundation) | `frontend/src/pages/DashboardPage.tsx`, `components/pfd/*`, `components/KpiTile.tsx` |

> **Note on the P-numbering gap (P6–P9)**: those chunks were cross-cutting
> work tracked in the companion **A-Wiki** repo, not migration chunks here —
> P6.5 (Drive-backed global `.env` + repo env) is the only one with a commit
> in this repo (`b4d9b5e`); P7 (bootstrap automation), P8, P9 (stability
> hardening) landed in A-Wiki. The frontend was originally planned as "P6"
> but shipped as P10 once the design direction was locked in. No work is
> missing — the gap is just a shared cross-repo numbering scheme.

**Resume command for a fresh agent**: read this file, then `git log --oneline -10` to see which `chunk(P#)` commits already landed, then continue at the lowest-numbered `P#` not yet committed.

**Next chunk candidates** (in rough priority order; pick one per session):

| ID | Goal | Depends on | Files |
|---|---|---|---|
| `P11` | Auth wiring — JWT login UI + token storage; flip `AUTH_MODE=jwt` | P5 (auth modes), P10.6 | `frontend/src/pages/AuthPage.tsx`, `app/core/auth.py` |
| `P12` | Deployment — Dockerfile + Cloud Run (or Supabase Edge Function for API). Also unblocks full CRUD round-trip (v4-routable DB connection). | P5 + P10.6 | `Dockerfile`, `.github/workflows/deploy.yml` |
| `P13` | PDF template-builder UI — ทส.1/ทส.2/repair-request layouts | `design/ui-brief.md` unpause, P5 PDF endpoints | `frontend/src/pages/ReportsPage.tsx` |
