# Roadmap — beyond P5

> Living document. Captures ideas, deferred work, and next-step options
> surfaced during P5 (2026-07-16). Update as chunks land or decisions shift.
> Source of phase sequencing is `MIGRATION.md`; this file holds the *why* and
> the longer-horizon thinking.

## Immediate (before/around P6)

### P5b.2-live — done via Management API path
- **One command**: `uv run python scripts/introspect_schema_api.py` (HTTPS
  Management API — the direct-DB variant + pytest integration suite were
  removed with the FastAPI backend, 2026-07-19).
- Verifies: exact Postgres types, enum values, constraints, view column sets,
  RLS policies — everything local-source reconciliation couldn't confirm.
- `reports/schema-snapshot-live.md` is the refreshable snapshot.

### Lock design direction (prerequisite for P6)
- 4 mockups exist (dashboard ×3 palette variants + mobile daily-entry form).
- Links are in-session only; regenerate from `design/ui-brief.md` if lost.
- Decision needed: which palette/typography, then P6 builds real pages.

### Install `gh` CLI on this machine (done this session)
- ✅ Installed via winget. Auth via `git credential fill` (no manual token).
- Future sessions create PRs without the proxy "click this link" step.

## Frontend era (P6)

### ~~Typed API client from OpenAPI~~ (retired with the FastAPI backend)
- ADR-0004 pivot: the frontend types against Supabase directly
  (`frontend/src/lib/types.ts`); no `/openapi.json` exists anymore.

### Real users + flip `AUTH_MODE=jwt`
- Create `core.app_user` rows for the 9 seeded personnel + Supabase Auth.
- Set `SUPABASE_JWT_SECRET`, flip `AUTH_MODE=jwt` in prod.
- Stub mode stays the default for local dev + tests.

### E2E tests with `webapp-testing` skill
- Playwright flows: login → daily form → submit → dashboard shows new row.
- Add once P6 has a runnable UI.

### Write-path integration tests with disposable schema
- (The FastAPI-era read-only `tests/integration/` was removed 2026-07-19.)
- For write coverage now: Playwright e2e against an authenticated session,
  or SQL-level checks via the Management API — separate test schema in
  ENV_DB, gated behind an explicit env flag.

## Medium horizon (v1.1+)

### Telegram/LINE alert delivery
- Threshold logic now lives in SQL views + frontend badges; a notifier would
  be a Supabase Edge Function / cron over the same views. (The Python
  reference implementation `app/core/alert.py` is on `archive/fastapi-backend`.)
- SPEC marks threshold alerts out-of-v1 — design before building.

### PDF rendering engine
- `core.pdf_template` stores layout JSON; the engine (layout JSON + data
  source → WeasyPrint) is a substantial chunk of its own.
- Starter templates (ทส.1, ทส.2, repair request) populate once UI is locked.

### Observability
- Structured logging (`structlog`) replacing basicConfig.
- Split `/api/health` into liveness (process up) vs readiness (DB reachable).
- Request-id propagation for tracing across logs.

### Alembic migrations
- Today schema changes land via manual SQL + notes in `MIGRATION.md`.
- If schema churn increases, Alembic gives versioned, reversible migrations
  with an audit trail. Trade-off: added tooling complexity.

## Long horizon (v2+)

### IoT sensor ingest
- `input_source` enum has `iot` reserved.
- Separate router + API-key auth (not user JWT) + rate limiting.
- Time-series (InfluxDB) consideration if volume grows.

### A-Wiki schema doc: full rewrite or delete
- Current `env-webapp-schema-wastewater.md` is deprecated (Pi5 era).
- Once ENV_DB is stable + introspected, either rewrite it to match live
  schema or delete it and point solely at `app/models/` + snapshots.
- A-Wiki PR #7 adds the deprecation banner as an interim measure.

### Multi-location entry
- Only WWTP-1 is seeded; `readings.py` hardcodes it as the default.
- When other departments onboard, generalize the location picker + seed.

## Decisions deferred (no urgency, recorded so they're not lost)

- **Frontend framework**: SPEC says "decide at P5 scaffold." P5 landed
  without a frontend; the decision now belongs to P6. Candidates per the
  original Pi5 doc: React + Vite + Tailwind. Revisit against the chosen
  mockup direction.
- **Deploy target**: Cloud Run per the original plan, but Supabase free-tier
  limits + the Pi5 situation may shift this. Confirm at deploy time.
- **RLS depth**: assumed `authenticated ALL` everywhere. Tighten per-role
  policies before any public exposure.
