# P5 backend: SQLAlchemy 2.0 async + Supabase JWT, not supabase-py/PostgREST

The original design doc in A-Wiki (`env-webapp-schema-wastewater.md`) targeted a
self-hosted stack on Raspberry Pi 5: Dockerized PostgreSQL + FastAPI + Adminer,
managed via Portainer, accessed over Tailscale. P5 does not follow that path.
This ADR records why the stack changed and why the DB access layer is
SQLAlchemy async rather than the Supabase Python client.

## Context

The Pi5 plan was abandoned before P5 began. The Pi5 at home also runs a Bitcoin
full node and an always-on agent (Hermes); under that load CPU sits near 80% and
RAM is strained. Running a hospital operational webapp on the same box was
judged not viable. Supabase's free tier (managed Postgres + Auth + RLS) replaces
the self-hosted Postgres + GoTrue + manual backup burden.

That left a choice for how the FastAPI backend talks to Supabase Postgres:

1. **supabase-py** — the official client, which goes through PostgREST.
2. **SQLAlchemy 2.0 async + asyncpg** — direct Postgres, ORM-mapped.
3. **asyncpg raw SQL** — no ORM, Pydantic for serialization only.

## Decision

Use **SQLAlchemy 2.0 async + asyncpg**, and verify Supabase-issued **JWTs
in FastAPI** (via `python-jose`) rather than relying solely on PostgREST/RLS.

Auth runs in two selectable modes (`AUTH_MODE`): `stub` (fixed mock user, for
local dev before real `auth.users` rows exist) and `jwt` (real verification with
`SUPABASE_JWT_SECRET` + `core.app_user` lookup).

## Consequences

- **Transactional writes match the migration pattern.** Phase 2 inserts
  `carbon.reading` then `wastewater.reading` (with `carbon_reading_id`) in one
  transaction. SQLAlchemy makes this a natural unit-of-work; PostgREST would
  need an RPC function to get the same atomicity.
- **Complex reads are first-class.** The dashboard reads two views
  (`v_reading_detail`, `v_monthly_summary`); monthly aggregates and joins are
  awkward through PostgREST filters. Direct SQL is unambiguous.
- **Type-safe model layer.** 11 ORM models give editor autocomplete and catch
  column-name drift at import time. The cost is keeping models in sync with the
  live schema (deferred to P5b.2 introspection — DB wins on any disagreement).
- **Auth is verifiable in-process.** Decoding the JWT in FastAPI means endpoints
  can branch on role before hitting the DB. RLS still applies as defense-in-depth
  on the Supabase side; we do not disable it.
- **One extra dependency surface** (`sqlalchemy`, `asyncpg`, `python-jose`) beyond
  what supabase-py would need. Accepted for the above gains.
- **Pooler caveat.** Supabase's transaction-mode pooler (port 6543) does not
  support prepared statements reliably, so `connect_args` disables statement
  caching. This is documented inline in `app/core/db.py`.
- **Schema drift risk.** Models are reconstructed from `phase2_generate_sql.py`
  + migration notes, not introspected from the live DB yet. P5b.2 will snapshot
  the real schema into `reports/schema-snapshot-p5.md` and reconcile.
