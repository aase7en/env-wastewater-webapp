# env-wastewater-webapp

Wastewater-treatment data migration (Google Sheets/AppSheet → Supabase) and
monitoring webapp for โรงพยาบาลอุทัย's environmental (ENV) systems.

- **Companion repo**: [A-Wiki](../A-Wiki) holds the domain knowledge (schema
  design, ENV concepts) this repo builds against — see `AGENTS.md` for details.
- **Status**: Phases 1–4 done (907/907 rows migrated, schema stabilized). The
  FastAPI backend (P5) is scaffolded with all v1 endpoints live; the frontend
  (P6) is next. See `MIGRATION.md`.
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
