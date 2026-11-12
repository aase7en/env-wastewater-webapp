# env-wastewater-webapp

Environmental (ENV) monitoring webapp for โรงพยาบาลอุทัย's wastewater
treatment and utilities systems — migrated from the Google Sheets/AppSheet
workflow to Supabase.

- **Companion repo**: [A-Wiki](../A-Wiki) holds the domain knowledge (schema
  design, ENV concepts) this repo builds against — see `AGENTS.md` for details.
- **Production**: live at **https://aase7en.github.io/env-wastewater-webapp/**
  (GitHub Pages auto-deploys on every merge to `main`). Every page is
  login-gated: Supabase Auth (JWT) + row-level security (RLS); access is
  approved per user (pending-approval flow), with an admin role for DBA/AI/
  user-management consoles.
- **Versioning**: the app version lives in `frontend/package.json` and is
  shown by a small chip in the footer corner of the app — tap it for the
  latest-release summary. See [`CHANGELOG.md`](CHANGELOG.md) (Thai, พ.ศ.
  dates) for the release history and bump criteria. Documentation-only merges
  do not bump the version and do not create a git tag.
- **Data**: `data/raw/` is gitignored — source exports never get committed.

## Pages (as routed in `frontend/src/App.tsx`)

- `/` — Command Center (post-login overview)
- `/dashboard` — treatment-process dashboard with the Digital Twin
  (3D aerated-basin water surface + status callouts)
- `/flow` — process narrative with SIMULATED scenario storytelling and
  numeric chips (N2/N3/N4)
- `/form` + `/form/:id` — daily-entry form (create / edit) across the
  8 domains: wastewater, chemical, water-supply, fuel, garden, garbage,
  safety, food
- Domain modules: `/water-supply`, `/garbage`, `/fuel`, `/garden`,
  `/building`, `/safety`, `/food`, `/chemical`
- Records: `/readings`, `/trends`, `/reports`, `/equipment`, `/sensors`
- Environment & compliance: `/carbon`, `/carbon-rollup`, `/sustainability`
  (T-VER readiness), `/regulations`, `/water-watch`
- Operations: `/operations` (attention board)
- Admin tools: `/import`, `/pdf-designer`, `/attachments`, `/admin/db`,
  `/admin/ai`, `/admin/users`, `/admin/audit`
- Auth: `/login`, `/auth/callback`, `/pending-approval`

## Tech stack

- **Frontend**: React + TypeScript + Vite + Tailwind (UTH[AI]-EVN Aura
  Edition design system — see `design/uth_ai_evn_system_design_aura_edition.md`
  and `design/DESIGN.md`)
- **Backend**: Supabase (Postgres + RLS; the frontend talks to it directly
  via supabase-js, per ADR-0004 — the retired FastAPI backend was removed
  2026-07-19 and is preserved on the `archive/fastapi-backend` branch)
- **Digital Twin**: Three.js / React-Three-Fiber
- **Deploy**: GitHub Pages, auto-deploy on merge to `main`

## Versioning & releases

- Single source of truth: `frontend/package.json` → `"version"` (SemVer
  `vMAJOR.MINOR.PATCH`), injected into the build via a Vite `define`
  (`__APP_VERSION__`) and read only by `frontend/src/lib/version.ts`.
- The chip (footer corner of the app shell) shows the running version; tap
  or keyboard-activate it for the latest-release summary with a pointer to
  the CHANGELOG.
- Release history + Thai bump criteria: [`CHANGELOG.md`](CHANGELOG.md).
  Git tags (`v1.0.0`, …) are cut after merge + deploy verification and must
  match `package.json` (`python3 scripts/check_release_version.py --tag vX.Y.Z`).

## Python scripts (migrations / schema introspection)

Requires Python ≥3.11 and [uv](https://docs.astral.sh/uv/). Python in this
repo is scripts-only:

```bash
# Apply a SQL migration to ENV_DB via the Supabase Management API
uv run python scripts/apply_migration_api.py db/migrations/<file>.sql

# Refresh reports/schema-snapshot-live.md (read-only introspection)
uv run python scripts/introspect_schema_api.py

# Regression suite for the SQL statement splitter (no DB, no secrets)
uv run python scripts/test_split_sql.py
```

Both API scripts read `SUPABASE_ACCESS_TOKEN` from the environment or the
Drive-backed `.env` — resolution logic lives in `scripts/_env.py` (see
CONTRIBUTING.md "Secret storage across devices").

## Running the frontend

```bash
cd frontend
npm install
npm run dev
#   App:  http://localhost:5173  (Vite picks the next free port if 5173 is taken)
#   Build/lint/test:  npm run build  /  npm run lint  /  npm run test
#   E2E (Playwright, local dev profile):  npm run e2e
```

Supabase URL + publishable key live in `frontend/.env` (gitignored; see
`frontend/.env.example` for the expected `VITE_*` variable names). Secrets
and raw operational data never leave the machine — see `AGENTS.md`
("Secrets & raw data") and CONTRIBUTING.md.
