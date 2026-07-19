# env-wastewater-webapp

Wastewater-treatment data migration (Google Sheets/AppSheet → Supabase) and
monitoring webapp for โรงพยาบาลอุทัย's environmental (ENV) systems.

- **Companion repo**: [A-Wiki](../A-Wiki) holds the domain knowledge (schema
  design, ENV concepts) this repo builds against — see `AGENTS.md` for details.
- **Status**: Production live at **https://aase7en.github.io/env-wastewater-webapp/**
  — frontend talks to Supabase directly (P11 auth + P12 Supabase-first pivot
  per ADR-0004). All v1 pages shipped on the UTH[AI]-EVN Aura Edition design
  system. The retired FastAPI backend was removed 2026-07-19 and is preserved
  on the `archive/fastapi-backend` branch (see
  `docs/work-orders/FASTAPI-removal.md`).
- **Data**: `data/raw/` is gitignored — source exports never get committed.

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

The frontend is a React + Vite + TypeScript + Tailwind app that talks to
Supabase directly (supabase-js + RLS; no local backend needed):

```bash
cd frontend
npm install
npm run dev
#   App:  http://localhost:5173  (Vite picks the next free port if 5173 is taken)
#   Build/lint:  npm run build
```

Supabase URL + publishable key live in `frontend/.env` (gitignored; see
`frontend/.env.example` if present, or `frontend/src/lib/supabase.ts` for
the expected `VITE_*` variable names).

**Design direction — UTH[AI]-EVN Aura Edition** (locked in P10.6, see
`design/uth_ai_evn_system_design_aura_edition.md` + `design/DESIGN.md`):
dark deep-teal foundation, neon cyan/lime accents, glassmorphism cards
with a rotating conic-gradient aura border. The brand lockup `UTH[AI]-EVN`
highlights `[AI]` in cyan/lime. `Plus Jakarta Sans` is the display/body
font; `IBM Plex Sans Thai` is the fallback for Thai glyphs.

**Pages:**
- `/dashboard` — Process Flow Diagram + KPI tiles + 14-day log (P10.1–4,
  still on the legacy clinical-teal palette until the P10.7 migration)
- `/form` + `/form/:id` — daily-entry form (create / edit), 6-section
  Accordion, mobile-first, threshold warnings inline (P10.6.4)
- `/readings` — list of recent readings, row click → edit (P10.6.5)

Auth flow (JWT login), PDF template-builder UI, and the dashboard → Aura
migration are deferred to later chunks — see `MIGRATION.md`.
