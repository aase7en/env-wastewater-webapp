# env-wastewater-webapp

Wastewater-treatment data migration (Google Sheets/AppSheet → Supabase) and
monitoring webapp for โรงพยาบาลอุทัย's environmental (ENV) systems.

- **Companion repo**: [A-Wiki](../A-Wiki) holds the domain knowledge (schema
  design, ENV concepts) this repo builds against — see `AGENTS.md` for details.
- **Status**: Phases 1–4 done (907/907 rows migrated, schema stabilized). The
  FastAPI backend (P5) is live with all v1 endpoints. The frontend (P10) has
  a dashboard + daily-entry form + readings list wired to the API on the
  UTH[AI]-EVN Aura Edition design system. See `MIGRATION.md`.
- **Data**: `data/raw/` is gitignored — source exports never get committed.

## Running the backend

Requires Python ≥3.11 and [uv](https://docs.astral.sh/uv/).

```bash
# 1. Install deps
uv venv && uv pip install -e ".[dev]"

# 2. Configure secrets (never commit .env)
cp .env.example .env
#   fill in SUPABASE_DB_URL (and SUPABASE_JWT_SECRET for real auth)

# 3. Run the dev server
uv run uvicorn app.main:app --reload
#   API:    http://127.0.0.1:8000/api/health
#   Docs:   http://127.0.0.1:8000/docs

# 4. Tests (run without a DB — stub auth + mocked session)
uv run pytest
```

Without a `.env`, the app still boots for health checks (`AUTH_MODE=stub`,
DB engine built lazily). Any endpoint that queries will fail loudly until
`SUPABASE_DB_URL` is set.

See `docs/adr/0003-fastapi-sqlalchemy-async-supabase-jwt.md` for why the
backend uses SQLAlchemy async + JWT verification instead of supabase-py.

## Running the frontend

The frontend (P10) is a React + Vite + TypeScript + Tailwind app wired to
the backend's `/api/*` endpoints. Start the backend first (above), then:

```bash
cd frontend
npm install
npm run dev
#   App:  http://localhost:5173  (Vite picks the next free port if 5173 is taken)
#   Build/lint:  npm run build
```

Vite proxies `/api` → `http://127.0.0.1:8000`, so no backend URL needs to be
configured in the frontend — it talks to FastAPI via the same origin.

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
