# ADR-0004: Supabase-first architecture (no FastAPI in production)

- **Status**: Accepted (2026-07-17, chunk P12)
- **Supersedes**: ADR-0003 (FastAPI + SQLAlchemy async + Supabase JWT)
- **Context**: [P10.6 → P11 → P12 grilling session](../../MIGRATION.md)

## Context

ADR-0003 chose FastAPI + SQLAlchemy async + asyncpg against Supabase
Postgres, with JWT verification against Supabase Auth. P5 shipped 15
endpoints + 44 tests on that stack.

Two constraints surfaced during the P12 deploy grilling:

1. **Cost.** The hospital wants a 100% free-tier deployment forever.
   FastAPI needs a Python runtime somewhere (Cloud Run / Fly / Railway).
   All of those have free tiers but with caveats — Cloud Run free egress
   is generous but adds a Google Cloud account; Fly free tier is shared
   CPU with sleep; Railway/Vercel have strict limits.
2. **IPv6 egress.** This dev machine cannot reach Supabase's IPv6-only
   direct host (free-tier constraint). Any deploy target that solves this
   has to be a hosted environment with v4 egress, which re-raises the
   "where does the server live" question.

Supabase itself already provides everything FastAPI was providing:
Postgres + Auth + RLS + PostgREST (auto-CRUD over HTTP) + SQL views for
computed fields + Edge Functions for anything genuinely procedural.

## Decision

**Drop FastAPI from the production runtime.** The frontend talks to
Supabase directly:

| Concern | Before (ADR-0003) | After (P12) |
|---|---|---|
| Auth | FastAPI verifies JWT, looks up `core.app_user` | Supabase Auth + RLS (auth.uid() in policies) |
| CRUD | 15 typed FastAPI endpoints | PostgREST auto-CRUD + RLS |
| Computed fields | `app/core/computed.py` (Python) | SQL functions + views in `wastewater` schema |
| Threshold checks | `app/core/alert.py` (Python) | `wastewater.fn_check_thresholds(uuid)` SQL function |
| Hosting | Cloud Run (Python) + CDN | GitHub Pages (static) — no server runtime |
| Cost | Free-tier Cloud Run (with risk of bill if traffic spikes) | 100% free forever (static + Supabase free) |

The `app/` directory **stays in the repo** as:
- A reference implementation of the v1 contract
- A local-dev scaffolding tool (run uvicorn for integration tests)
- The source of truth for the column list / computed logic that the SQL
  views mirror

It is **not deployed** and is not in any production runtime path.

## Consequences

### Positive

- Zero server runtime cost — pure static frontend + Supabase free tier.
- IPv6 egress problem disappears (Supabase exposes v4 PostgREST URL).
- One less moving piece to monitor (no FastAPI process, no Gunicorn, no
  health checks, no cold-start latency).
- RLS gives row-level security for free — no auth middleware to maintain.

### Negative

- **Computed logic now lives in SQL**, not Python. SQL functions are harder
  to unit-test in isolation; the trade-off is they're guaranteed to match
  the DB schema.
- **Schema migrations become more load-bearing** — a bad migration can
  break the frontend with no application-layer safety net. Mitigation:
  all P12 migrations are idempotent (`CREATE OR REPLACE` / `DROP IF EXISTS`).
- **Type safety is weaker.** PostgREST returns JSON; the frontend types
  in `lib/types.ts` are manually maintained (matching the SQL view
  columns). Auto-gen from OpenAPI is no longer applicable (there's no
  OpenAPI to generate from).
- **Complex transactions** (like the carbon.reading + wastewater.reading +
  repair_request triple-insert in P5's POST endpoint) become multi-call
  sequences from the client, or have to move to a Supabase Edge Function
  / DB function. P12's `createReading()` does them as 3 sequential calls;
  acceptable for low-volume daily entry, but worth revisiting if volume
  grows.

## Verification

- Frontend build still passes (`npm run build`) with 0 TS errors after
  the rewrite — see `chunk(P12)` commit.
- Smoke test against production Supabase happens in P13 (deploy).
- The SQL views (`v_dashboard_14day`, `v_reading_detail`) and functions
  (`fn_do_average`, `fn_check_thresholds`) are exact ports of the
  Python originals; cross-checking outputs is a P13 follow-up.

## Future pressure points

- If a feature needs server-side orchestration beyond what PostgREST +
  RLS + SQL functions can express cleanly (e.g. PDF generation, complex
  aggregation pipelines, scheduled jobs), the cheapest path is a
  Supabase Edge Function (Deno/TS, free 500k invocations/month) — not
  re-introducing FastAPI.
