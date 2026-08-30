# Migration Status

## Phase 1 โ€” Read-only CSV analysis
**Status: COMPLETE.** See `reports/phase1-analysis.md` for the full findings
(date parsing, checklist column distinct values, chlorine column mapping
decision, electricity meter deltas, null rates, reporter/personnel join gaps).

Key decision from this phase: `wastewater.reading.chlorine_used` maps from
`เธเธฅเธญเธฃเธตเธเธเนเธณเธ—เธตเนเนเธเนเธเธฃเธดเธ` (actual concentrated chlorine), not `เธเธฅเธญเธฃเธตเธเธเนเธณ เธ—เธตเนเนเธเน`
(gross top-up volume) โ€” see phase1-analysis.md ยง3 for the reasoning.

## Phase 2 โ€” Supabase insert
**Status: COMPLETE** โ€” executed 2026-07-05 against Supabase project `ENV_DB`
(`gllqtbyofrcjzmbnfoeh`). See `reports/phase2-summary.md` for the full method
and verification log.

Result: 907/907 source rows (908 CSV rows minus 1 blank-date row) inserted
into both `carbon.reading` and `wastewater.reading`, joined via
`carbon_reading_id`, 0 wrong meter assignments, 0 null legacy IDs.

## Known follow-ups โ€” decisions closed 2026-07-06

- **`reported_by`** โ€” **P1 complete, executed 2026-07-07.** Decision: historical/
  migrated rows do **not** get the `reported_by` FK backfilled (it points to
  `core.app_user.id` โ’ `auth.users.id`, which would mean creating real login
  accounts for 3 already-resigned staff just for record-keeping โ€” not worth
  it). Instead: `reported_by_name_legacy` was consolidated (the 3 เธเธฒเธขเธงเธดเนเธฃเธเธเน
  variants โ’ one canonical string, verified 330 rows) and `core.personnel`
  was seeded with all 9 identifiable people (name/position/status only โ€” no
  national ID/bank/salary/address, see below). `reported_by` (FK) stays NULL
  for migrated rows; it'll be populated going forward once real users log
  into the webapp.
- **`location_id`** โ€” **P3 complete, executed 2026-07-07.** See "Location
  schema" below.
- **`wastewater_discharged`** โ€” **P4 complete, executed 2026-07-07.** See
  "Discharge boolean" below.

## RESOLVED โ€” Personnel reconciliation (closed 2026-07-07)

`reported_by_name_legacy` originally had 12 distinct values across 907 rows.
All three of these are the **same person**, now consolidated to one string
(`UPDATE ... SET reported_by_name_legacy = 'เธเธฒเธขเธงเธดเนเธฃเธเธเน เธชเธธเธเน€เธเธฉเธก' WHERE ...`,
verified 330 rows post-update):

| Legacy value (before) | Rows | Person |
|---|---|---|
| `เธเธฒเธขเธงเธดเนเธฃเธเธเน เธชเธธเธเน€เธเธฉเธก` (full name, as originally logged) | 87 | เธเธฒเธขเธงเธดเนเธฃเธเธเน เธชเธธเธเน€เธเธฉเธก |
| `2122222222029292` (raw ID) | 176 | เธเธฒเธขเธงเธดเนเธฃเธเธเน เธชเธธเธเน€เธเธฉเธก |
| `1234567890678` (raw ID) | 67 | เธเธฒเธขเธงเธดเนเธฃเธเธเน เธชเธธเธเน€เธเธฉเธก |

The source was the hospital's **full HR export** (264 employees, not the
33-row water-treatment-specific file originally expected) โ€” it contains
national ID, bank account, salary, and home address per employee. **None of
that was extracted, stored, or committed** โ€” only name/position/department/
status for the 9 people who actually appear as wastewater reporters. The raw
upload itself was never committed to git (session-local only, same policy as
`data/raw/`).

`core.personnel` now has 9 rows (`STAFF-001`..`STAFF-009`, employee_code
synthesized โ€” the HR export had no usable position-number field, and
national ID was deliberately not used as a key):

| Code | Name | Position | Dept | Status |
|---|---|---|---|---|
| STAFF-001 | เธเธฒเธขเธงเธดเธฅเธฒเธช เธฃเธทเนเธเธงเธดเธเธฒ | เธเธเธฑเธเธเธฒเธเธเธฃเธดเธเธฒเธฃ | เธญเธเธฒเธกเธฑเธขเธชเธดเนเธเนเธงเธ”เธฅเนเธญเธกเธฏ | active |
| STAFF-002 | เธเธฒเธขเธชเธกเธเธฃ เธซเธฒเธกเธฒเธฅเธต | เธเธนเนเธเนเธงเธขเธเนเธฒเธเธ—เธฑเนเธงเนเธ | เธเธฒเธเธเนเธญเธกเธเธณเธฃเธธเธ | active |
| STAFF-003 | เธเธฒเธขเธงเธดเนเธฃเธเธเน เธชเธธเธเน€เธเธฉเธก | เธเธเธฑเธเธเธฒเธเน€เธเธฅ | เธเธฒเธเธเธฒเธฃเธเธขเธฒเธเธฒเธฅเธเธนเนเธเนเธงเธขเธเธญเธ (เธขเนเธฒเธขเธกเธฒเธเธฒเธ ENV โ€” confirmed by user) | active |
| STAFF-004 | เธเธฒเธขเธ เธฒเธ“เธธ เธเธฒเธกเธเธดเธกเธดเธ•เธฃ | เธเธเธฑเธเธเธฒเธเธเธฃเธดเธเธฒเธฃ | เธญเธเธฒเธกเธฑเธขเธชเธดเนเธเนเธงเธ”เธฅเนเธญเธกเธฏ | เธฅเธฒเธญเธญเธ |
| STAFF-005 | เธเธฒเธขเน€เธเธฉเธเธฒ เธเธฃเธฃเธกเธชเธฒเธฅเธต | เธเธเธฑเธเธเธฒเธเธเธฃเธดเธเธฒเธฃ | เธญเธเธฒเธกเธฑเธขเธชเธดเนเธเนเธงเธ”เธฅเนเธญเธกเธฏ | เธฅเธฒเธญเธญเธ |
| STAFF-006 | เธเธฒเธขเธเธเธเธฑเธข เธกเธฐเธญเธฒเธเน€เธฅเธดเธจ | เธเธเธฑเธเธเธฒเธเธเธฃเธดเธเธฒเธฃ | เธญเธเธฒเธกเธฑเธขเธชเธดเนเธเนเธงเธ”เธฅเนเธญเธกเธฏ | active |
| STAFF-007 | เธเธฒเธขเธ•เนเธเธเนเธฒ เธเธฒเธกเธเธดเธกเธดเธ•เธฃ | เธเธเธฑเธเธเธฒเธเธเธฃเธดเธเธฒเธฃ | เธญเธเธฒเธกเธฑเธขเธชเธดเนเธเนเธงเธ”เธฅเนเธญเธกเธฏ | เธฅเธฒเธญเธญเธ |
| STAFF-008 | เธเธฒเธขเธจเธธเธ เธจเธดเธฉเธเธดเน เธเธเธชเธธเธงเธฃเธฃเธ“ | เธเธฑเธเธงเธดเธเธฒเธเธฒเธฃเธชเธฒเธเธฒเธฃเธ“เธชเธธเธ | เธญเธเธฒเธกเธฑเธขเธชเธดเนเธเนเธงเธ”เธฅเนเธญเธกเธฏ | active |
| STAFF-009 | เธเธฒเธขเน€เธเธ•เนเธชเธ เธ“ เนเธเนเธงเน€เธ—เธตเนเธขเธ | เธเธเธฑเธเธเธฒเธเธเนเธงเธขเน€เธซเธฅเธทเธญเธเธเนเธเน | เธเธฒเธเธเธฒเธฃเธเธขเธฒเธเธฒเธฅเธเธนเนเธเนเธงเธขเธเธญเธ | active |

**Not resolved**: `เธเธฒเธเธชเธฒเธงเธญเธฃเธดเธจเธฃเธฒ เน€เธฃเธทเธญเธเธญเธธเนเธฃ` (1 row only) โ€” not found in the HR
export (possibly left before the export was taken, or name recorded
differently). Left as-is; negligible impact (1/907 rows).

## RESOLVED โ€” PDF template-builder tables (closed 2026-07-07, chunk P2)

Migration `p2_pdf_template_equipment_repair_request` applied to `ENV_DB`:

- **`core.equipment`** โ€” seeded with all 10 pieces of equipment, `code`
  matching the existing boolean column names in `wastewater.reading`
  (`pump1`, `pump2`, `aerator1`, `aerator2`, `sludge_pump1`, `sludge_pump2`,
  `chlorine_pump1`, `chlorine_pump2`, `screen_coarse`, `screen_fine`).
  `location_id` left NULL pending P3.
- **`core.repair_request`** โ€” `equipment_id`/`reading_id`/`reported_by` all
  nullable, `cause text NOT NULL`, `status` enum (`open`/`in_progress`/
  `resolved`/`cancelled`). Empty โ€” nothing to seed, these get created by
  staff/the future webapp.
- **`core.pdf_template`** โ€” `paper_size` enum (`a4`/`a5`), `orientation`
  enum (`portrait`/`landscape`), `layout jsonb`, `is_builtin` flag. **Empty
  on purpose** โ€” no starter templates seeded yet, since the actual layout
  for เธ—เธช.1/เธ—เธช.2/repair-request depends on the UI design work that's
  paused (see `design/ui-brief.md`). Populate once that direction is picked.

All three have RLS enabled with the same `ALL` policy for `authenticated`
used elsewhere in this schema (see `carbon.reading`, `wastewater.reading`).

## RESOLVED โ€” Location schema (closed 2026-07-07, chunk P3)

Migration `p3_location_category_coords_p4_discharge_boolean` applied to
`ENV_DB`, decisions from a grilling session (see `docs/adr/0002-location-
category-lookup-table.md` for the reasoning on the category decision):

- **`core.location_category`** โ€” new lookup table (not an enum, not free
  text โ€” see ADR-0002), seeded with 8 categories: เธชเธดเนเธเนเธงเธ”เธฅเนเธญเธก, เนเธฃเธเธเธฃเธฑเธง,
  เธเธฑเธเธเธญเธ, OPD, IPD, เธซเนเธญเธเธเธฑเธ, เธซเนเธญเธเธขเธฒ, เธเธฒเธฃเน€เธเธดเธ.
- **`core.location`** โ€” gained `category_id` (FK), `lat`/`lng` (plain
  `numeric`, not PostGIS โ€” no spatial-query requirement exists yet).
  Seeded with exactly **one** real row: `WWTP-1`, "เธเนเธญเธเธณเธเธฑเธ”เธเนเธณเน€เธชเธตเธข
  (Activated Sludge 60 เธฅเธ.เธก.)", category เธชเธดเนเธเนเธงเธ”เธฅเนเธญเธก. Other departments'
  locations are *not* seeded with placeholder data โ€” added by whoever
  manages them, when ready.
- **Backfilled**: all 907 `wastewater.reading.location_id` and the 1
  `carbon.meter.location_id` now point at `WWTP-1`. Verified 0 remaining
  NULLs on both.

## RESOLVED โ€” Discharge boolean (closed 2026-07-07, chunk P4)

`wastewater.reading.wastewater_discharged` changed from `numeric` to
`boolean` in place (`ALTER COLUMN ... TYPE boolean`, NULL-preserving โ€”
all 907 rows were NULL before and after, so no data was at risk). Meaning
is now simply "was treated water discharged today" (yes/no), matching what
the source system ever actually recorded (a status, never a measured
volume).

**Discovered mid-migration**: two views depend on this column โ€”
`wastewater.v_reading_detail` (per-reading detail + threshold flags used by
the dashboard) and `wastewater.v_monthly_summary` (the เธ—เธช.2 data source),
which had `sum(wastewater_discharged)` โ€” meaningless once the column is
boolean. Both views were dropped and recreated; `v_monthly_summary`'s
`total_wastewater_discharged` (a sum) became **`days_discharged`**
(`count(*) FILTER (WHERE wastewater_discharged)`) โ€” "how many days this
month had a discharge," the boolean-correct equivalent. Verified the view
still runs and returns sane data (all `days_discharged = 0` currently,
correct since every row is still NULL).

## RESOLVED โ€” FastAPI backend (closed 2026-07-16, chunk P5)

> โ ๏ธ **REMOVED 2026-07-19 (`c6fc72a`, Approach C).** The app went direct-to-Supabase;
> this FastAPI backend was retired as dead code. Source preserved on branch
> `archive/fastapi-backend`; `scripts/_env.py` (stdlib-only) took over the env
> resolver the scripts still needed; `pyproject.toml` โ’ `0.2.0`. WO
> `docs/work-orders/FASTAPI-removal.md` = `Status: done`, verified in Fable5
> review #4. The section below documents what the backend *was* โ€” kept for
> history. (Any handoff line saying "FastAPI removal still open / assigned to
> Opus 4.8" is stale โ€” reconciled 2026-07-22, see handoff doc tail.)

The backend is scaffolded and all v1 endpoints are live. Built in five
sub-chunks (P5aโ€“P5e), each its own commit on branch `claude/webapp-p5-fastapi`.

- **Stack** (decision recorded in `docs/adr/0003-fastapi-sqlalchemy-async-
  supabase-jwt.md`): FastAPI + SQLAlchemy 2.0 async + asyncpg against ENV_DB.
  The original Pi5 self-host plan was abandoned (Pi5 also runs a Bitcoin full
  node + Hermes agent โ€” CPU ~80%, RAM strained). Supabase free tier replaces it.
- **Auth** runs in two selectable modes via `AUTH_MODE`:
  - `stub` โ€” fixed mock user (for local dev before real `auth.users` rows exist)
  - `jwt`  โ€” verifies Supabase-issued JWTs with `SUPABASE_JWT_SECRET`, looks
    up `core.app_user` by `auth.users.id`
- **15 endpoints** across 6 routers: daily-form CRUD (transactional carbon +
  wastewater insert), dashboard (reads `v_reading_detail` + `v_monthly_summary`),
  reference data, repair requests, PDF templates, `/api/me`.
- **Threshold stub**: DO<2.0 / Cl<0.5 / pH 6.5โ€“8.5 checks fire on create and
  log at WARNING. Telegram/Line delivery is deliberately NOT wired (SPEC lists
  threshold alerts as out-of-v1) โ€” the return list lets a future notifier
  consume the same results.
- **44 tests passing** โ€” pure-function (computed values, thresholds), schema
  validation (SPEC ยง6 cause-mandatory rule), auth stub, and endpoint contracts
  via a stub async session. DB-backed integration tests deferred (see P5b.2).

### Open follow-up from P5

- **P5b.2-local โ€” DONE.** Reconciled the 11 ORM models against the Phase 2
  INSERT contract (`phase2_generate_sql.py` `WR_COLS`) + migration notes.
  Found and fixed one real drift: `wastewater.reading.cause` did not exist
  (it lives on `core.repair_request`); the request field is now
  `abnormal_cause` and seeds a repair request in the same transaction.
  Recorded in `reports/schema-snapshot-p5.md`.
- **P5b.2-live โ€” scaffolded, awaiting `SUPABASE_DB_URL`.** Two artifacts
  land the moment the URL is provided:
  1. `scripts/introspect_schema.py` โ€” dumps exact types, enums, constraints,
     indexes, RLS, and view definitions to `reports/schema-snapshot-live.md`.
  2. `tests/integration/` โ€” 8 tests (table/column presence, 907-row claim,
     view queryability, seeds, GET endpoints end-to-end). Auto-skip until
     the URL is set; `uv run pytest` stays green on fresh checkouts.
  Run with: `uv run python scripts/introspect_schema.py && uv run pytest tests/integration -v`

## RESOLVED โ€” Frontend tracer-bullet (closed 2026-07-16 โ’ 17, chunks P10 โ’ P10.7)

The frontend is scaffolded end-to-end as a tracer-bullet on branch
`claude/webapp-p5-fastapi`. P10.1โ€“P10.5 shipped the dashboard; P10.6
added the Aura Edition design system + the daily-entry form; P10.7
migrated the dashboard onto Aura so the whole app is consistent.

- **Stack**: React 18 + Vite + TypeScript + Tailwind CSS + react-router-dom.
  Vite proxies `/api` โ’ `http://127.0.0.1:8000` so the frontend shares the
  backend's origin in dev โ€” no separate API URL to configure.
- **Design direction โ€” UTH[AI]-EVN Aura Edition** (locked in P10.6,
  applied across the whole app in P10.7): dark deep-teal foundation
  (`#00161B`), neon cyan/lime accents (`#00F0FF` / `#CCFF00`),
  glassmorphism cards with a rotating conic-gradient aura border,
  `Plus Jakarta Sans` display + `IBM Plex Sans Thai` fallback.
  See `design/uth_ai_evn_system_design_aura_edition.md` + `design/DESIGN.md`.
- **Pages** (3 of them, all wired to the live API, all on Aura):
  - `/dashboard` โ€” Process Flow Diagram + KPI tiles + 14-day log table
    with Thai-BE dates (P10.1โ€“4 โ’ migrated to Aura in P10.7).
  - `/form` + `/form/:id` โ€” daily-entry form (create / edit), 6-section
    Accordion, mobile-first, inline threshold warnings, conditional
    `abnormal_cause` when `system_operating=false` (SPEC ยง6), admin-gated
    delete (P10.6.4).
  - `/readings` โ€” recent readings list, row click โ’ edit (P10.6.5).
- **CRUD**: `POST/GET/PUT/DELETE /api/readings` all wired through typed
  `api-client.ts` + mutation hooks (`useCreate/Update/DeleteReading`).
  `reported_by` + `location_id` are NOT sent by the form (server-derived).
- **Verified** (P10.6 smoke test + P10.7 DOM scan): TypeScript 0 errors,
  Vite build ~301KB โ’ ~94KB gzip, all routes serve HTTP 200, Vite
  `/api/*` proxy reaches FastAPI (`/api/health` returns JSON). Dashboard
  DOM scan confirms no legacy `bg-white` / `text-navy-900` / `border-navy`
  classes remain. DB-backed endpoints return 500 on this Windows machine
  โ€” known IPv6-only direct-host issue (see P5b.2-live), not a frontend
  bug; full CRUD round-trip waits for Cloud Run deploy or a v4-pooled
  Supabase connection.

### Open follow-up (deferred chunks)

- **P11 โ€” Auth flow wiring.** Frontend currently no-op against stub auth;
  JWT login UI + token storage is a later chunk once `AUTH_MODE=jwt` is
  real and `auth.users` rows exist.
- **P12 โ€” Deployment.** Dockerfile + Cloud Run (or Supabase Edge
  Function for the API). Also unblocks the full CRUD round-trip by
  giving the backend a v4-routable DB connection.
- **P13 โ€” PDF template-builder UI** โ€” เธ—เธช.1/เธ—เธช.2/repair-request layouts.
  Depends on the layout work still paused in `design/ui-brief.md`.
- **OpenAPI auto-gen client** โ€” `src/lib/types.ts` is manual for now;
  `openapi-typescript` auto-gen is a later hardening chunk.

> **โ  Superseded 2026-07-17/18 (ZCode rolling roadmap):** the three bullets
> above shipped in a different shape than planned โ€” P11 = Supabase Auth
> (email/password + Google + LINE, no FastAPI JWT), P12 = **drop FastAPI in
> prod** (frontend โ’ Supabase JS client + SQL views), P13 = GitHub Pages
> deploy, plus P14โ€“P19 (UX polish, Playwright+Ladle, เธ—เธช.1/เธ—เธช.2/เนเธเนเธเนเธเธเนเธญเธก
> client-side PDF, threshold notifications, Equipment page, Trends charts).
> See `git log --oneline` + `.zcode/plans/` for the authoritative trail.

## ACTIVE โ€” Two-track parallel work: F (Codex GPT5.6) โฅ Z (ZCode/GLM) โ€” from 2026-07-18 (F owner reassigned 2026-08-07)

Two agents work this repo **at the same time**. Read this before starting any
chunk. The original 2026-07-18 plan was authored by Fable5; Track F ownership
**moved to Codex GPT5.6 on 2026-08-07** (Codex's edge = image generation +
3D animation, picked to drive the wastewater virtual-process PFD upgrade).
The binding rules below still apply.

### Lanes

| | **Track F โ€” Codex GPT5.6** (visual + 3D layer) | **Track Z โ€” ZCode/GLM** (feature/data layer) |
|---|---|---|
| Scope | Theme/tokens, AppShell/layout, styling (className/markup) of all pages, `design/ui-brief.md`, `frontend/public/` assets, `frontend/index.html` (while F1 open), **3D virtual process (PFD upgrade)** โ€” `frontend/src/components/pfd/*`, React Three Fiber/Three.js assets | `src/lib/*` logic (supabase-queries, hooks, pdf), page logic, new feature pages, Supabase SQL / Edge Functions, `tests/e2e/*`, `.zcode/*`, `.github/workflows/*` |
| Chunk prefix | `chunk(F#): ...` | `chunk(P#): ...` (continues P20+) |
| Must NOT touch | Z's logic/data code, SQL, e2e tests | Colors/fonts/layout/theme, `tailwind.config.js`, `index.css`, `src/styles/*`, `design/` |

### Shared rules (both agents)

1. **Claim before work**: add a row to the In-progress table below, commit+push
   it, then start. Remove the lock in the chunk's own commit when done.
   Never edit files inside another agent's locked chunk scope.
2. **Pull before commit**: `git pull --ff-only` (rebase own commits if
   diverged) + `npm run build` must pass before every push.
3. **Hotspot files**: `package.json` โ€” additive deps OK, pull first.
   `App.tsx` โ€” Z may add routes; F does not edit routes.
   `index.html` โ€” owned by F until F1 is done, then Z may add PWA manifest.
4. **Same page โ  same time**: a Z chunk that edits logic inside an existing
   page (e.g. autosave in `DailyFormPage`) must not run while an F chunk is
   restyling that page โ€” check the In-progress table first.
5. **Dark/Light toggle is Track F (F1)** โ€” removed from ZCode's P20 rolling
   list. Z: do not implement theming.
6. **No destructive git in the shared working tree** (added after F2 was
   wiped 3ร— mid-flight by Track Z `reset --hard`/`clean` cycles on
   2026-07-18): `git reset --hard`, `git checkout -- .`, and `git clean`
   destroy the *other* agent's uncommitted work โ€” use `git stash` /
   `git revert` instead. **Track F (Codex, 2026-08-07 reassigned)**: if
   you want the historical worktree isolation, run
   `git worktree add ../envww-trackf track-f` and work there, landing via
   fast-forward pushes of `track-f` โ’ `main`. Otherwise you may work in
   this tree directly but MUST `git pull --ff-only` before every commit
   and stage only your own files (see "DO NOT TOUCH" list in your handoff
   prompt โ€” other agents have untracked work in this tree right now).
   Track Z: keep pulling `main` as usual; never delete the `track-f`
   branch or the worktree registration if it exists.
7. **Work orders (Phase 2)**: every chunk has a spec file in
   `docs/work-orders/` any agent can execute or resume โ€” file scope binds
   to the *chunk*, not permanently to an agent; whoever holds the claim
   may touch its files. Pause/resume protocol + the standard resume prompt
   live in `docs/work-orders/README.md` (built for the 5-hr-limit handoff).
8. **New page = new file**; the `App.tsx` route for a page is edited only
   by the holder of that page's work order (one WO at a time).

### In-progress claims

> **Infra audit (caching + logging) done 2026-08-09** โ€” full sweep of
> every cache layer (SW, HTTP headers, Vite hashing, localStorage,
> polling, Realtime, PostgREST, materialized views, Edge Functions) and
> every logging layer (DB audit triggers, AI query log, frontend console,
> Supabase platform logs, rate limiting, UX analytics). Findings + ranked
> recommendations in `reports/infra-audit-2026-08.md`. **3 P1 gaps that
> should land before any wider rollout**: (1) `core.ai_provider` has no
> audit trigger despite a code comment claiming it does โ€” admin key
> changes leave no trace; (2) `core.attachment` (regulation PDF swap)
> untriggered; (3) AI-SQL rejected queries (whitelist + PHI filter) log
> nothing โ€” probing is invisible. Plus P2 tamper-evidence (admin
> `FOR ALL` on `audit_log` allows silent rewrite), SW no-bump, no
> ErrorBoundary, no React Query, no source maps. Not blocking Track F
> (Codex) or current ops โ€” flagged for next Track Z chunk decision.

| Chunk | Agent | Claimed | Scope (files) |
|---|---|---|---|
| ~~SEC-DEPS-001~~ | GPT-5.6 Sol | 2026-08-30 | COMPLETE / MERGED - reviewed head `1d41e0896dd4a8d32532202e4b5f4ca0f70e4310`; fresh GLM-5.3 MAX APPROVED; exact-head E2E 96/96; PR #51 merge `4e8b4fe90354c3e25939c940a74e6ea47f3fbf26`; post-merge test/E2E/Pages green; deployment `6163951586` SUCCESS; audits 0/0 and synthetic PDF zero-write guarantees preserved. Evidence: `docs/ai/handoffs/SEC-DEPS-001-SOL.md`. |
| ~~ENV-MOBILE-005~~ | GPT-5.6 Sol | 2026-08-28 | COMPLETE / MERGED - remediation `e137cd468f628961dcfb697f0470cb3da76062bd`; reviewed head `327ae8b541f3e29f5727acc7edb3ed76b12f20bc`; PR #48 merge `001ef532b1203b3bd2def7c28bdd6845a948dec8`; focused reviewer 12/12, exact-head CI green, post-merge test/E2E/Pages green, deployment `6150037544` SUCCESS, live 390px root-to-client smoke PASS with mocked REST/no real writes. Garden data/schema/RLS/carbon/shared shell/Garbage and `.serena/` unchanged. Evidence: `docs/ai/handoffs/ENV-MOBILE-005-SOL.md`. |
| ~~ENV-MOBILE-004~~ | GPT-5.6 Sol | 2026-08-28 | COMPLETE / MERGED - production `413d435cf780ee6b809175d15fc2b86a55baf01d`; remediation `6ac3c96d42cd9b9eff15429e4436d24dcad22438`; reviewed head `8e871d225a67f1da2a1c143556c2b34aaf9e90c6`; PR #46 merge `57f0bb3dd5c9a7e74ee0deb84bb166b215a8706a`; focused reviewer 10/10, exact-head CI green, post-merge test/E2E/Pages green, deployment `6142569782` SUCCESS, live 390px root-to-client smoke PASS. Fuel data/import/carbon/schema/RLS/shared shell unchanged; separate import `fuel_type` -> carbon enum-cast finding remains a Core follow-up. Evidence: `docs/ai/handoffs/ENV-MOBILE-004-SOL.md`. |
| ~~ENV-MOBILE-003~~ | GPT-5.6 Sol (user-directed continuation) | 2026-08-28 | COMPLETE / MERGED โ€” production `66e86dcb515d411b9e6b858ae89a4109f5ac3bc3`; reviewed head `5cd8f4aa304812868a669bab614177f8a4525c1b`; PR #44 merge `d3034d83954ec8287b9dab561f7802668207d23e`; focused 7/7, full Playwright 73/73, Vitest 202/202, typecheck/build PASS, lint 12 baseline warnings / 0 errors; post-merge test `33150344819`, E2E `33150344767`, Pages `33150344886`, deployment `6137172294` SUCCESS; live 390px smoke PASS. Evidence: `docs/ai/handoffs/ENV-MOBILE-003-SOL.md`. |
| ~~ENV-MOBILE-002~~ | GPT-5.6 Sol (GLM-5.3 limit fallback) | 2026-08-28 | COMPLETE / MERGED โ€” production `7b1baef8e70f3081fbc6e5088fdfac57c7341d92`; reviewed head `795aefcf86442029923be87110831e08c589ad8d`; PR #42 merge `f26c753a6e49a65dfc9e5d43a482380f79dece0c`; focused 7/7, full Playwright 66/66, Vitest 202/202, typecheck/build PASS, lint 12 baseline warnings / 0 errors, post-merge main test/E2E/Pages + deployment `6136344674` SUCCESS. Evidence: `docs/ai/handoffs/ENV-MOBILE-002-SOL.md`. |
| ~~ENV-MOBILE-001A~~ | GPT-5.6 Sol MAX | 2026-08-27 | COMPLETE / PUSHED `74550da24af09a5afe506d2c269de89cb6392092` โ€” `frontend/src/pages/DailyFormPage.tsx`, lane WO/status, lane handoff, this claim row only. |
| ~~ENV-MOBILE-001B~~ | GLM-5.3 (resumed 2026-08-28 after the Sol MAX fallback record; user-directed) | 2026-08-27 | COMPLETE / PUSHED โ€” dependency `74550da24af09a5afe506d2c269de89cb6392092`; spec partial preserved and completed in place; owns only `frontend/tests/e2e/daily-form-mobile.spec.ts`, lane WO/status, lane handoff, this claim row (same branch; **no production edits**); evidence `docs/ai/handoffs/ENV-MOBILE-001B-GLM53.md` |
| ~~ENV-MOBILE-001D~~ | GLM-5.3 MAX | 2026-08-28 | COMPLETE / PUSHED โ€” stopped at PRODUCTION_REMEDIATION_REQUIRED; error-visibility race reproduced 2/20 in repeat run at starting HEAD `3763b6205a46a3819579dff5f890b4c536c3f6e9` (reviewer baseline 1/20); evidence `docs/ai/handoffs/ENV-MOBILE-001D-GLM53.md` |
| ~~ENV-MOBILE-001E~~ | GPT-5.6 Sol MAX | 2026-08-28 | COMPLETE / PUSHED `b7c2623168da4d6fac8990a7f90180ee1b1326f1`; final PR head `f7af3027dafe52f06719a2e08de993a31045162f` APPROVED and PR #40 merged as `74675a532a871c7bba78de15eccb35b6b0ba433b`; failed-save 20/20, mobile spec 11/11, Vitest 202/202, typecheck/lint/build/diff-check PASS; evidence `docs/ai/handoffs/ENV-MOBILE-001E-SOLMAX.md`. |
| ~~WO-UX-SCALE-001~~ | Codex | 2026-08-22 | done โ€” cb083a5; `frontend/tailwind.config.js`, typography/index styles, shared button/header controls and `AppShell` (branch `feat/ux-scale-001`; no `src/lib/**`) |
| ~~WO-STAB-002~~ | GLM | 2026-08-15 | done โ€” cdd6f6d | `frontend/src/lib/admin/ai-chat.ts`, `ai-chat.test.ts` (branch `fix/p0-stabilization`) |
| ~~WO-STAB-003~~ | GLM | 2026-08-15 | done โ€” e065253 | `frontend/src/components/AuthProvider.tsx` (branch `fix/p0-stabilization`) |
| ~~WO-STAB-001~~ | GLM | 2026-08-15 | done โ€” see STAB-001 commit | `frontend/src/pages/DailyFormPage.tsx` (branch `fix/p0-stabilization`) |
| ~~OPT-HYGIENE~~ | GLM | 2026-08-07 | done โ€” see close-note below |
| ~~AUDITFIX-A~~ | GLM | 2026-08-10 | done โ€” see close-note below |
| ~~AUDITFIX-C~~ | GLM | 2026-08-10 | done โ€” see close-note below |
| ~~AUDITFIX-B~~ | GLM | 2026-08-10 | done โ€” see close-note below |
| ~~WO-STAB-007~~ | GLM | 2026-08-22 | done โ€” P1 carbon MoM gap fixed (see PR) |
| ~~EQ-1~~ | GLM | 2026-08-11 | done โ€” see close-note below |
| ~~EQ-2~~ | GLM | 2026-08-11 | done โ€” see close-note below |
| ~~EQ-3~~ | GLM | 2026-08-11 | done โ€” see close-note below |
| ~~EQ-4~~ | GLM | 2026-08-11 | done โ€” see close-note below |
| ~~EQ-5~~ | GLM | 2026-08-11 | done โ€” see close-note below |

> **EQ-5 GLM execute done 2026-08-11** โ€” ported `useSensorFeed` to
> react-query while preserving its incremental realtime cache updates.
> The initial fetch (sensors + per-sensor seed samples) is now a single
> `useQuery({ queryKey: ['sensor-feed', limit] })`. Realtime INSERT
> events on `wastewater.sensor_reading` still arrive via the same
> Supabase channel; on each event, the hook calls
> `qc.setQueryData(['sensor-feed', limit], prev => { prepend + cap })`
> โ€” preserving the exact rolling-window semantics the prior
> `setSamplesBySensor` callback had. The `connected` flag stays in
> local `useState` (channel state, not query state).
>
> `useCarbonRollupRealtime` (carbon-rollup.ts) deliberately KEPT โ€” not
> dead code despite no caller today; it's a foundation for
> CarbonRollupPage to opt into realtime when ready, and deleting it
> would lose the resilience backstop (10s channel-state poll + refetch).
> Migrating it to react-query's `queryClient.invalidateQueries` on
> channel event would be a clean follow-up but is out of EQ scope
> (no caller = no urgency).
>
> **EQ series complete (5/5 chunks)**. All read hooks (~25), mutations
> (3), optimistic UI sites (2: markRead + setVisibility), polling (2),
> and realtime (1 active, 1 dormant) are now on react-query. Build โ…,
> Vitest 138/138 across the series.

> **EQ-4 GLM execute done 2026-08-11** โ€” ported the 3 reading mutations
> + 2 optimistic UI sites to react-query. The caller-facing shapes are
> preserved; the cache is now the single source of truth (no more local
> useState mirrors).
>
> `hooks.ts`: replaced the private `useMutation` helper with
> `useReadingMutation` built on RQ's `useMutation`. On success, calls
> `qc.invalidateQueries(['dashboard'] / ['readings'] / ['reading'])` so
> pages refetch automatically โ€” replaces the old "caller calls refresh()
> after mutate" convention (callers can still call refresh explicitly).
>
> `alerts.ts useThresholdAlerts.markRead`: now does optimistic cache
> write via `qc.setQueryData(['threshold-alerts', 20], prev => ...)`,
> with rollback via `qc.invalidateQueries` on error. Local
> `useState<alerts/unread>` + the `useEffect` sync from EQ-3 are GONE โ€”
> the cache is the source. Caller-facing `{alerts, unread, ...}` reads
> from `q.data?.rows ?? []`.
>
> `role-module-visibility.ts useAllVisibility.setVisibility`: optimistic
> cache write via `applyLocal` helper (`qc.setQueryData`); on error,
> restores the prior row (or drops the appended row) from the snapshot
> taken before the write. **DOCK-18 contract preserved** โ€” the cache
> write still happens BEFORE the await, so a missing GRANT surfaces
> immediately rather than looking like a stuck toggle. `useHiddenModules`
> also migrated (one-shot, `enabled: !!role`, fail-open empty set on
> error preserved).
>
> Note: `setVisibility` now `throw`s on error (instead of swallowing
> into a local error state). The consumer `RoleVisibilitySheet` already
> wrapped calls in try/catch + toast, so this surfaces the message
> correctly. Build โ…, Vitest 138/138.

> **EQ-3 GLM execute done 2026-08-11** โ€” converted the 2 polling hooks
> (`useThresholdAlerts` in `alerts.ts`, `usePendingUsers` in
> `admin/users.ts`) from manual `setInterval` + `window.focus` +
> `document.visibilitychange` listeners to React Query's
> `refetchInterval: pollMs` + the global `refetchOnWindowFocus: true`
> set in EQ-1's `query-client.ts`. ~30 lines of manual timer/focus
> plumbing deleted per hook.
> `useThresholdAlerts` still holds local `alerts`/`unread` state for
> `markRead`'s optimistic update (synced via `useEffect` watching
> `q.data`) โ€” EQ-4 will port `markRead` to `useMutation` +
> `queryClient.setQueryData` and remove the local state entirely.
> `usePendingUsers` is now stateless (just returns query fields).
> **3 unused hooks (useUpcomingSafetyChecks, useAdminProviders,
> useRepairRequests) deliberately NOT deleted** โ€” definitions only, no
> callers, but kept for API stability in case a future page wants them.
> Build โ…, Vitest 138/138.

> **EQ-2 GLM execute done 2026-08-11** โ€” migrated 15 mechanical read
> hooks across 12 lib files to `@tanstack/react-query`. Caller-facing
> shape `{ data, loading, error, refresh }` preserved exactly so no page
> changes required. Files: `hooks.ts` (4: useDashboard/useReadings/
> useEquipment/useReading), `carbon.ts` (useCarbonMonthly), `carbon-rollup.ts`
> (useCarbonRollup), `repair.ts` (useRepairRequests), `chemical.ts` (3:
> stock/movements/low-stock-composite), `building.ts`, `fuel.ts`,
> `garbage.ts`, `garden.ts`, `food.ts`, `water-supply.ts`, `regulations.ts`,
> `overview.ts` (composite: useOverviewCarbon + useLatestReadingDate as
> separate useQuery โ€” F7 `enabled: !today` for the conditional fetch).
> Each query gets a stable `queryKey` so future cache invalidation works.
> React Query's staleTime 30s (set in EQ-1) replaces the prior nonce-
> based manual refresh as the cache floor โ€” pages that need fresher
> data still get `refresh = () => q.refetch()`. Build โ…, Vitest 138/138.
> Next: EQ-3 migrates 2 polling hooks (useThresholdAlerts/usePendingUsers)
> to `refetchInterval` + deletes 3 unused hooks.

> **EQ-1 GLM execute done 2026-08-11** โ€” React Query + ErrorBoundary
> foundation (5-chunk EQ series, chunk 1 of 5). **Installs
> `@tanstack/react-query@^5.101`** (React 19-compatible). 3 new files:
> (1) `lib/query-client.ts` โ€” singleton QueryClient with defaults
> (staleTime 30s, retry 1, refetchOnWindowFocus true โ€” the last one
> replaces the manual focus/visibility listeners that useThresholdAlerts
> + usePendingUsers were running, deleted in EQ-3). Includes
> `createTestQueryClient()` factory for future *.test.ts files needing
> `<QueryClientProvider>`.
> (2) `components/ErrorBoundary.tsx` โ€” class component (React 19 still
> needs class for componentDidCatch/getDerivedStateFromError). Wraps the
> whole app inside `<ToastProvider>`. Inner `<ErrorRouteWatcher>` uses
> `useLocation()` + `key={pathname}` to reset the boundary on route
> change so a broken route is escapable via the dock. Fallback uses
> **inline styles** (not className) to stay under Track F/Z lane split
> โ€” visual polish deferred to Track F. Closes the P2 "no ErrorBoundary"
> gap from `reports/infra-audit-2026-08.md`.
> (3) `main.tsx` wraps `<QueryClientProvider>` outermost (before
> StrictMode) + adds a `window.unhandledrejection` listener that
> `console.error`s stray promise rejections (forwarding to analytics
> sink waits on policy #16).
> Closes the P2 "no error-tracking / no ErrorBoundary" gaps. Build โ…,
> Vitest 138/138 (no logic added โ€” foundation only; tests added in EQ-2+).
> Next: EQ-2 migrates 15 mechanical read hooks to `useQuery`.

> **AUDITFIX-B GLM execute done 2026-08-10** โ€” closes the P1
> "silent AI reject" gap from `reports/infra-audit-2026-08.md` #3 (the
> last of the 3 P1 audit gaps; A + C closed the other two earlier today).
> Two TS chokepoints logged previously-nothing rejects:
> (1) `ai-chat.ts:123-125` PHI filter block โ€” now INSERTs
> `status='rejected_phi'` + `reject_reason` before throwing;
> (2) `db-query.ts:254,269` whitelist reject (TS-layer
> `isStatementAllowed` AND PG-layer `admin_run_query` RAISE EXCEPTION
> re-throw) โ€” now INSERTs `status='rejected_whitelist'`. PGRST202
> (DBA-3 not deployed) deliberately NOT logged (infra state, not a probe).
> Refactors: extracted `actorUid()` helper in ai-chat.ts (shared by
> success + reject paths; replaces per-call `supabase.auth.getUser()`);
> local `logSqlReject()` helper in db-query.ts (avoids circular import
> ai-chat โ’ ai-providers โ’ db-query). Both follow the existing best-effort
> try/catch + `console.warn` convention โ€” a log failure never changes
> the reject UX. Success-path INSERT now also carries `status:'success'`
> explicitly (existing rows backfill via DEFAULT). Migration
> `20260810000002` adds `status text NOT NULL DEFAULT 'success'` +
> `reject_reason text` to `core.ai_query_log` (1/1 OK live); RLS
> unchanged (existing `WITH CHECK (actor = auth.uid())` gate applies to
> reject rows equally). Vitest 132โ’138 (+6 new: ai-chat +3, db-query +3);
> build โ…. NOTE: catches browser-originated rejects only โ€” a non-browser
> caller (curl to `admin_run_query` RPC) would bypass; recon confirms no
> such caller exists today; defense-in-depth for that vector (INSERT
> statements inside `admin_run_query` before each RAISE) deferred.

> **AUDITFIX-C GLM execute done 2026-08-10** โ€” closes the P2
> "log tampering" gap from `reports/infra-audit-2026-08.md`. The two
> admin-overview policies `audit_log_admin_all` and `ai_query_log_admin_all`
> were `FOR ALL` โ€” an admin (or compromised admin session) could
> UPDATE/DELETE rows and silently rewrite history. Recon confirmed zero
> UPDATE/DELETE callers today (AuditLogPage read-only; audit-log.ts uses
> `.select()` only; no edge function touches either table) so tightening
> to `FOR SELECT` closes the hole with zero behavior change. INSERT still
> flows via the separate `_authenticated_insert` policy (server-side
> trigger sets `actor = auth.uid()`; service-role bypasses RLS via
> BYPASSRLS). HMAC hash chain deliberately deferred โ€” pgcrypto is
> available but the chain would complicate the trigger for a threat model
> with no compliance mandate; policy-only is the right-sized fix.
> Migration `20260810000001_auditfix_c_append_only.sql` 4/4 OK live.
> `scripts/test_oauth4_rls_probe.py` extended with `TAMPER_TARGET_POLICIES`
> + `_probe_admin_policy_is_select_only` (asserts cmd=SELECT not ALL);
> REDโ’GREEN verified (both `ALL/FAIL` before โ’ `SELECT/PASS` after).
> Build โ…, Vitest 132/132, AuditLogPage render unaffected.

> **AUDITFIX-A GLM execute done 2026-08-10** โ€” closes the two
> "missing audit trigger" gaps flagged by `reports/infra-audit-2026-08.md`
> P1 #1 + #2. New migration `20260810000000_auditfix_a_missing_triggers.sql`
> retro-fits the standard `trg_audit_log` (DROP IF EXISTS + CREATE, pattern
> copied verbatim from `20260719000003_v2_audit_trigger.sql:116-118`) onto:
> (a) `core.ai_provider` โ€” stores API keys (`key_value`); the original
> `20260719000008_dba_ai_columns.sql:26-27` comment falsely claimed
> "Audit log captures every SELECT on ai_provider" but no trigger was ever
> created AND `fn_audit_log()` only fires on DML (cannot audit SELECT).
> Comment corrected in-place to reflect reality (DML audit via AUDITFIX-A,
> NO SELECT-audit โ€” read-audit would need separate RPC wrapper).
> (b) `core.attachment` โ€” regulation PDF upload/delete (phish vector);
> table verified live (created in archived FastAPI era, `id uuid` PK,
> `file_path`/`uploaded_by` columns confirmed).
> `scripts/test_oauth4_rls_probe.py` extended with `AUDITFIX_TABLES`
> constant + `_probe_trigger_existence` (queries `pg_trigger` joined to
> `pg_class`/`pg_namespace`, excludes internal triggers, tolerates absent
> table as SKIP). REDโ’GREEN verified (exit 1 before migration โ’ exit 0
> after, both tables `present/PASS`). Migration 4/4 OK live. Build โ…,
> Vitest 132/132.

> **OPT-HYGIENE GLM execute done 2026-08-07** โ€” three Track-Z hygiene
> fixes that GLM could do without blocking on other actors. (1) `carbon.ts`
> `prevCalendarMonth` exported (single caller unchanged) + new
> `carbon.test.ts` (6 tests) pinning the C3 MoM-gap regression (Jan rollover,
> zero-pad, year-boundary, non-idempotency guard). Vitest 126โ’132. (2) WO
> status hygiene: DOCK-role-module-visibility.md and OAUTH-4-deny-pending-rls.md
> headers synced from open/in-progress โ’ done (commit refs `e81c946`,
> OAUTH-4 probe REDโ’GREEN). (3) Companion A-Wiki entity
> `env-webapp-project.md` updated from 2026-07-16 stale state (FastAPI
> "live", PR #10 "open") to 2026-08-07 reality (FastAPI removed `c6fc72a`,
> two-track FโฅZ, OAuth/AI-SQL/DOCK/SCHEMA5b shipped). Commit `1657f45`
> (env-wastewater-webapp) + `cbcabb1d` (A-Wiki, separate repo). build โ…,
> Vitest 132/132.

> **DOCK role-module-visibility GLM execute done 2026-08-03** โ€” admin-
> configurable dock icon visibility per role (per docs/work-orders/DOCK-
> role-module-visibility.md). New table `core.role_module_visibility`
> (role, module_key, visible, default true) + RLS (own-role SELECT via
> inline subquery on core.app_user with enumโ’text cast โ€” ADR-0008 safe;
> admin INSERT/UPDATE/DELETE via core.fn_is_admin) + public. PostgREST
> faรงade. Frontend: `lib/role-module-visibility.ts` (useHiddenModules
> one-shot read + useAllVisibility admin matrix), ModuleDock filter
> extended (adminOnly AND not-hidden, with '/' + '/dashboard' locked
> visible per WO "Do not"), new `RoleVisibilitySheet` (roles ร— modules
> toggles, opened from the formerly-disabled toolbar button).
> **Presentation only โ€” NOT a security boundary** (route guards + RLS
> remain authoritative; this controls what the dock OFFERS). Migration
> 11/11 OK live; build โ…, Vitest 123/123, Playwright 31/31. Note: first
> apply hit an operator-does-not-exist error (text vs user_role enum) โ€”
> fixed by keeping `role` as text + casting the enum in the policy; DO-
> block ALTER approach was abandoned (split_sql mishandles nested $$).

> **SCHEMA5b deny-pending-rls GLM execute done 2026-08-01** โ€” closes the
> bug-hunt-recon finding that OAUTH-4 missed 5 reference tables. OAUTH-4
> repolicied 11 transactional tables but `schema5_rest_exposure.sql:8-17`
> had left 5 more on `USING(true)` / `WITH CHECK(true)`, reachable by a
> pending user via PostgREST: `core.personnel` (PHI-adjacent staff roster),
> `core.attachment` (was world-writable), `core.location`,
> `wastewater.sensor`, `wastewater.sensor_reading`. Migration
> `20260730000000_schema5b_deny_pending_rls.sql` mirrors the OAUTH-4 DROP +
> CREATE pattern exactly, reusing the existing `core.fn_is_staff_or_admin()`
> SECURITY DEFINER helper (ADR-0008 recursion lesson). `scripts/test_oauth4_rls_probe.py`
> extended with `_probe_reference_policy_bodies` + `REFERENCE_TABLES`;
> REDโ’GREEN verified (exit 1 before apply โ’ exit 0 after, 16/16 tables PASS).
> Independent live verify via direct `pg_policies` query confirms qual =
> `core.fn_is_staff_or_admin()` on all 5. Zero caller-break (all callers
> behind `<RequireAuth>` staff+admin gate; helper admits staff).
> **Should land alongside OAUTH-4 before OAuth users reach prod data** โ€” same
> PHI-belt intent, just the table set OAUTH-4 didn't cover.

> **OAUTH-4 deny-pending-rls GLM execute done 2026-07-24 (ADR-0012)** โ€”
> tightens the RLS belt to match OAUTH-1's intent. 11 transactional tables
> (`water_supply.daily_check`, `garbage.collection_log`, `fuel.dispense_log`,
> `garden.work_round`, `building.inspection_round`, `safety.monthly_check`,
> `food.lab_test`, `chemical.movement`, `chemical.master`,
> `wastewater.threshold_alert`, `core.regulation`) repolicied from
> `TO authenticated USING(true)` โ’ `USING(core.fn_is_staff_or_admin())`.
> New SECURITY DEFINER helper mirrors `core.fn_is_admin()` (ADR-0008
> recursion lesson). `scripts/test_oauth4_rls_probe.py` pins the contract:
> helper logic 3/3 roles (pendingโ’deny, staff/adminโ’allow) + policy bodies
> 11/11 reference helper in USING + WITH CHECK. Migration 24/24 OK live.
> **Should land before user opens Google OAuth** โ€” otherwise pending users
> touch transactional data during the signupโ’approve window.

> **P4 เนเธซเธกเน 2026-07-21 (ADR-0009): AI-SQL UI trio** โ€” three WOs over
> already-shipped infrastructure. `lib/admin/ai-sql.ts` (nlToSql +
> suggestQueries + buildSchemaContext) shipped in `ec4bc0d`; the
> `public.audit_log` faรงade shipped in SCHEMA-5 (`20260719000011`).
> **But the UI was never built** (`frontend/src/components/admin/` does
> not exist). ADR-0009 sets the design: **review-gate** โ€” the AI never
> runs SQL, it lands the generated statement into the existing DBA
> Console raw-SQL editor for human review (existing เธฃเธฑเธ button routes
> through DBA-2 whitelist + DBA-3 Edge Function). Three chunks:
> P4-nl-sql (mid) โ’ P4-audit-viewer (mid) โ’ P4-suggest-chip (cheap-ok).
> WO: `docs/work-orders/P4-{nl-sql,audit-viewer,suggest-chip}.md`.
> **P4-nl-sql GLM execute done 2026-07-21** โ€” AiQueryBox shipped +
> wired into DBAConsolePage (hoisted `useAiSql` seam for P4-suggest-chip
> reuse) ยท build โ… ยท Vitest 96/96 ยท Playwright 26/26 ยท `git grep เธฃเธฑเธเน€เธฅเธข
> โ’ 0 hits`.
> **P4-audit-viewer GLM execute done 2026-07-21** โ€” lib + page + route
> + NAV (`/admin/audit`, icon `history_edu`) shipped. **Column contract
> corrected from WO draft against live snapshot**: `id bigint` (not
> uuid) + `changed_at` (not `created_at`). Material Symbols subset
> regen 51โ’52. anon GET `/rest/v1/audit_log` โ’ `401/42501`. build โ… ยท
> Vitest 96/96 ยท Playwright 26/26.
> **P4-suggest-chip GLM execute done 2026-07-21** โ€” AiSuggestions panel
> reusing the same `useAiSql` seam hoisted in P4-nl-sql ยท build โ… ยท
> Vitest 96/96 ยท Playwright 26/26 ยท `git grep -nE "\.rpc\(|runRawQuery|
> runQuery" โ’ 0 hits` (review-gate holds).
> **P4 trio complete.** 3/3 chunks shipped on `main`. Manual end-to-end
> verify (admin login + AI provider configured in `/admin/ai`) still
> owed โ€” blocked on user dashboard config (Google/LINE providers).

> **AISQL-phi-filter GLM execute done 2026-07-21** โ€” closes the ADR-0009 ยง2
> known limitation. `buildSchemaContext()` now reads `core.ai_scope`
> (`is_enabled=true AND patient_safe=false`) into a deny-set and drops
> PHI-adjacent tables before row-count fetches โ€” provider never sees
> `core.app_user` or `core.personnel` in the catalog. Pure helpers
> (`filterPhiTables`, `formatSchemaContext`, `loadPhiDenySet`) extracted
> for testability; defensive fallback (empty deny-set) keeps the feature
> working if `ai_scope` is unreadable. Vitest 96โ’105 (+9 new unit tests) ยท
> build โ… ยท Playwright 26/26 ยท live DB probe confirms `core.app_user` +
> `core.personnel` filtered (13/15 tables reach AI). ADR-0009 ยง2 + ยง3
> synced (`changed_at`/`bigint` correction + ยง2 marked Resolved).
> already-shipped infrastructure. `lib/admin/ai-sql.ts` (nlToSql +
> suggestQueries + buildSchemaContext) shipped in `ec4bc0d`; the
> `public.audit_log` faรงade shipped in SCHEMA-5 (`20260719000011`).
> **But the UI was never built** (`frontend/src/components/admin/` does
> not exist). ADR-0009 sets the design: **review-gate** โ€” the AI never
> runs SQL, it lands the generated statement into the existing DBA
> Console raw-SQL editor for human review (existing เธฃเธฑเธ button routes
> through DBA-2 whitelist + DBA-3 Edge Function). Three chunks:
> P4-nl-sql (mid) โ’ P4-audit-viewer (mid) โ’ P4-suggest-chip (cheap-ok).
> WO: `docs/work-orders/P4-{nl-sql,audit-viewer,suggest-chip}.md`.
> **P4-nl-sql GLM execute done 2026-07-21** โ€” AiQueryBox shipped +
> wired into DBAConsolePage (hoisted `useAiSql` seam for P4-suggest-chip
> reuse) ยท build โ… ยท Vitest 96/96 ยท Playwright 26/26 ยท `git grep เธฃเธฑเธเน€เธฅเธข
> โ’ 0 hits`. [next: P4-audit-viewer].

> **P1 เนเธซเธกเน 2026-07-21 (user request): OAUTH โ€” Google + LINE login** โ€”
> `AuthPage` เธกเธตเธเธธเนเธก Google/LINE เนเธ•เนเนเธกเนเธ—เธณเธเธฒเธ (provider เธขเธฑเธเนเธกเน config) +
> เนเธกเนเธกเธต auto-provisioning (race AUTH-2 เธเนเธณ) + เนเธกเนเธกเธต role pending (PHI risk
> เธ–เนเธฒ auto-approve). Plan = 3 chunks (OAUTH-1 schema โ’ OAUTH-2 client โ’
> OAUTH-3 admin) + user config dashboard. ADR-0007 captures the design.
> WO: `docs/work-orders/OAUTH-{1,2,3}-*.md`.
> **OAUTH-1 GLM execute done 2026-07-21** โ€” migration 13/13 OK ยท enum
> extended ยท trigger fires end-to-end (test INSERT auth.users โ’ app_user
> auto role=pending) ยท snapshot refresh ยท build โ… ยท **เธฃเธญ user config
> dashboard โ’ OAUTH-2/3**.

> **P0 เนเธซเธกเน 2026-07-19 (user smoke test): `AUTH-2-app-user-query-schema`** โ€”
> `AuthProvider.loadAppUser()` query เธเธดเธ” schema (`auth_user_id` + `display_name`
> เนเธกเนเธกเธตเนเธ `core.app_user`) โ’ PGRST204 โ’ `appUser=null` โ’ `isAuthenticated=false`
> โ’ RequireAuth bounce /login เธ—เธธเธเธเธฃเธฑเนเธ เนเธกเน session valid. **Login block เธ—เธฑเนเธเนเธญเธ.**
> Fix: migration เน€เธเธดเนเธก `display_name` column + query `.eq("id", userId)`.
> WO: `docs/work-orders/AUTH-2-app-user-query-schema.md` (cheap-ok โ’ GLM execute).
> **GLM execute done 2026-07-19** โ€” build โ… ยท Vitest 96/96 โ… ยท Playwright 25/25 โ… ยท
> migration applied live (4/4) ยท view recreate (PostgreSQL `select *` cache) ยท
> DB probe AuthProvider query เธเธทเธ row เธชเธกเธเธนเธฃเธ“เน ยท **เธฃเธญ user JWT round-trip เธเธฃเธดเธ
> (was "Fable5 verify" โ€” Track F owner reassigned to Codex 2026-08-07; this
> is a Track Z schema/auth concern, GLM owns it pending real-user test)**.

> **Reopened 2026-07-19 (Fable5 review): P0 `SCHEMA-5-rest-exposure`** โ€” เธ—เธธเธ
> `.from()` เนเธ frontend 404 (PGRST205) เน€เธเธฃเธฒเธฐ `public` schema เธงเนเธฒเธเน€เธเธฅเนเธฒเนเธฅเธฐเนเธกเน
> expose domain schemas. Fix spec + DDL verbatim เธเธฃเธเนเธ
> `docs/work-orders/SCHEMA-5-rest-exposure.md` (cheap-ok โ’ GLM).
> เธเธฅ review เน€เธ•เนเธกเธญเธขเธนเนเธ—เนเธฒเธข `docs/handoff/2026-07-19-track-z-complete.md`.
> Track Z chunks เธญเธทเนเธเธเธดเธ”เธซเธกเธ”เธ•เธฒเธกเน€เธ”เธดเธก; F5/F6 เน€เธเนเธ Track F scope (Sonnet 5).

> **Phase 2 (Wave 1) is live** โ€” chunks are defined in `docs/work-orders/`:
> V1a/b เนเธเนเธเนเธเธเนเธญเธก ยท V2a/b Carbon page ยท V3a/b Notification bell ยท
> V4a/b Unified Command home ยท F4.1โ€“F4.5 ยท F5 ยท F6.
> Z suggested start order: **V1a โ’ V3a โ’ V2a** (all new files, zero
> collision), then V4a after V2a. UI halves (b) unblock as data halves
> land โ€” either agent may claim them (rule 7).
>
> **v2 multi-domain expansion (2026-07-17)** โ€” Wave 2 (SCHEMA-1..4)
> shipped: 8 new schemas + RLS + emission factors Scope 1+2+3 +
> `carbon.v_unified_co2e` rollup view + `core.fn_audit_log()` trigger
> on every transactional table + A-Wiki schema-doc sync (PR #8).
> Wave 3 module data + UI skeletons queued (MOD-WS/WA/FU/GA/BL/FS/FO/CH).
> Wave 4 cross-cutting infra (AI-1/2/3, IMP-1/2/3, PDF-1/2/3).
> **Wave 4b DBA Console** queued: DBA-1..10 โ€” admin database management
> UI (Hybrid query builder + raw SQL Advanced), NLโ’SQL generator,
> saved-query store, row annotation, chat on result set. RLS-bounded +
> statement whitelist (defense in depth via Edge Function). PHI filter
> via `core.ai_scope.patient_safe` flag.

Done: ~~F1 dual-theme foundation~~ (2026-07-18 โ€” tokens.css `:root`/`.dark`,
toggle in AppShell, no-flash script in index.html; `frontend/index.html` is
released back to shared-hotspot status โ’ Z may start PWA manifest work).
~~F2 shell + theme-safety conformance~~ (2026-07-18 โ€” suite AppShell w-72 +
Material Symbols + top bar + user footer, ENV wordmark, AuraCard static-ring
discipline, Gauge/PFD/Recharts token-driven colors; landed from the track-f
worktree after 3 working-tree wipes, see rule 6).
~~F3 assets + docs~~ (2026-07-18 โ€” logo/favicon from `logo 3D_aura.png`
into `frontend/public/` + sidebar brand + favicon link; `design/ui-brief.md`
rewritten as the suite-authority record with the 9 binding domain-mapping
rules; brand = UTH[AI]-ENV closed).

### Track F queue (Codex GPT5.6 โ€” reassigned 2026-08-07)

**Done under prior owner (Fable5/Claude, 2026-07-18 โ’ 2026-08-07):**
F1 dual theme (Luminous Mint light + Boost dark + toggle) ยท F2.1โ€“F2.7
per-page conformance with the 14-screen suite in `design/` (Dashboard,
Form, Readings, Trends, Equipment, Reports, Auth) ยท F3 logo/favicon +
docs ยท F5/F6 PFD polish (Sonnet 5) ยท DOCK-11..21 mobile dock gestures.

**Active under Codex (starts here):**
F3D-1 โ’ F3D-5 โ€” replace the flat 2D SVG PFD with an animated 3D virtual
process (wastewater treatment stages + RAS/WAS sludge loop + live
DO/flow/Cl animation states). Codex should propose the library choice
(React Three Fiber? Three.js? CSS-3D?), chunk plan, and first slice as a
work order in `docs/work-orders/F3D-*.md` before editing. See the
handoff prompt (chat with ZCode 2026-08-07) for full mission brief +
domain knowledge pointers + DO-NOT-TOUCH list.

### Track Z queue (ZCode โ€” user assigns; suggested order to avoid F)

P20a bulk import CSV (new files) โ’ P20b form autosave (after F2 form pass) โ’
P20c PWA (after F1 releases `index.html`) โ’ P20d sensor feed / AI query.

## Not started

(Nothing currently blocked โ€” see "Next-session plan" below for the next
chunk candidates: P10.6 daily form, auth wiring, deployment.)

## Next-session plan (cross-agent handoff)

This file is git-tracked, so it is the resume point for **any** agent
(Claude, Codex, ZCode, Hermes, ...) that clones this repo โ€” not just this
session. Follow the commit convention already used in this repo's log:
`chunk(<ID>): <result> [next: <ID>]`. Resume order below; each chunk should
be its own commit.

| ID | Goal | Depends on | Files |
|---|---|---|---|
| ~~`P1`~~ | ~~Personnel backfill~~ โ€” **done 2026-07-07**, see "Personnel reconciliation" above. | โ€” | โ€” |
| ~~`P2`~~ | ~~PDF-builder tables~~ โ€” **done 2026-07-07**, see "PDF template-builder tables" above. | โ€” | โ€” |
| ~~`P3`~~ | ~~Location schema~~ โ€” **done 2026-07-07**, see "Location schema" above. | โ€” | โ€” |
| ~~`P4`~~ | ~~Discharge boolean~~ โ€” **done 2026-07-07**, see "Discharge boolean" above. | โ€” | โ€” |
| ~~`P5`~~ | ~~Scaffold FastAPI backend~~ โ€” **done 2026-07-16**, see "FastAPI backend" above. 5 sub-chunks P5aโ€“P5e. | โ€” | `app/`, `tests/`, `pyproject.toml`, `docs/adr/0003-*.md` |
| ~~`P10`~~ | ~~Frontend tracer-bullet (dashboard)~~ โ€” **done 2026-07-16**, see "Frontend tracer-bullet" above. 5 sub-chunks P10.1โ€“P10.5. | P5, design direction (PFD, locked in) | `frontend/` (React + Vite + Tailwind) |
| ~~`P10.6`~~ | ~~Aura Edition design system + daily-entry form + readings list~~ โ€” **done 2026-07-17**, see "Frontend tracer-bullet" above. 6 sub-chunks P10.6.1โ€“P10.6.6. | P10 (scaffold), Aura design direction (locked in) | `frontend/src/components/ui/`, `pages/DailyFormPage.tsx`, `pages/ReadingsListPage.tsx`, `design/` |
| ~~`P10.7`~~ | ~~Dashboard โ’ Aura migration~~ โ€” **done 2026-07-17**. Restyled `DashboardPage` + the 4 PFD components (KpiTile, Gauge, AerationTank, ProcessFlowDiagram) onto the Aura Edition dark theme. Pure styling pass, no behavior change. | P10.6.1 (Aura foundation) | `frontend/src/pages/DashboardPage.tsx`, `components/pfd/*`, `components/KpiTile.tsx` |

> **Note on the P-numbering gap (P6โ€“P9)**: those chunks were cross-cutting
> work tracked in the companion **A-Wiki** repo, not migration chunks here โ€”
> P6.5 (Drive-backed global `.env` + repo env) is the only one with a commit
> in this repo (`b4d9b5e`); P7 (bootstrap automation), P8, P9 (stability
> hardening) landed in A-Wiki. The frontend was originally planned as "P6"
> but shipped as P10 once the design direction was locked in. No work is
> missing โ€” the gap is just a shared cross-repo numbering scheme.

**Resume command for a fresh agent**: read this file, then `git log --oneline -10` to see which `chunk(P#)` commits already landed, then continue at the lowest-numbered `P#` not yet committed.

**Next chunk candidates** (in rough priority order; pick one per session):

| ID | Goal | Depends on | Files |
|---|---|---|---|
| `P11` | Auth wiring โ€” JWT login UI + token storage; flip `AUTH_MODE=jwt` | P5 (auth modes), P10.6 | `frontend/src/pages/AuthPage.tsx`, `app/core/auth.py` |
| `P12` | Deployment โ€” Dockerfile + Cloud Run (or Supabase Edge Function for API). Also unblocks full CRUD round-trip (v4-routable DB connection). | P5 + P10.6 | `Dockerfile`, `.github/workflows/deploy.yml` |
| `P13` | PDF template-builder UI โ€” เธ—เธช.1/เธ—เธช.2/repair-request layouts | `design/ui-brief.md` unpause, P5 PDF endpoints | `frontend/src/pages/ReportsPage.tsx` |
