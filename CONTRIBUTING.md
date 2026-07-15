# Contributing

## Workflow

This repo uses a chunk-based commit convention. Each deliverable is one commit
formatted as:

```
chunk(<ID>): <result> [next: <next-ID>]
```

See `MIGRATION.md` for the current phase and the chunk plan table. Branch off
`main`, commit one chunk per PR, and reference the next chunk in the commit
summary so the resume point is self-documenting.

## Running the backend + tests

```bash
uv venv && uv pip install -e ".[dev]"
cp .env.example .env       # fill in SUPABASE_DB_URL for live use
uv run pytest              # unit tests, no DB needed
uv run uvicorn app.main:app --reload
```

CI (`.github/workflows/test.yml`) runs the unit suite on every PR. It needs no
secrets — integration tests skip themselves when `SUPABASE_DB_URL` is absent.

## Data policy

- `data/raw/` is gitignored. Never commit hospital operational data.
- `.env` is gitignored. Never commit secrets, and never print connection
  strings to chat/logs.
- The live Supabase DB is the source of truth for schema. ORM models in
  `app/models/` are verified against it via `scripts/introspect_schema.py` +
  `tests/integration/`.

## Companion repo (A-Wiki)

Domain knowledge, the original schema design doc, and the project pointer page
live in the A-Wiki sibling repo — see `AGENTS.md` for how to resolve its path.
Keep A-Wiki schema docs in sync with this repo when schema changes land here.
