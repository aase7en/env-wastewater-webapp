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

## Running the dev loop

```bash
# Frontend (the app) — talks to Supabase directly, no local backend
cd frontend && npm install && npm run dev

# Python scripts (migrations / introspection) — see README for usage
uv run python scripts/test_split_sql.py   # splitter regression, no secrets
```

CI (`.github/workflows/test.yml`) runs the split_sql regression suite on every
push/PR — no secrets needed. (The FastAPI backend + pytest suite was removed
2026-07-19; it lives on the `archive/fastapi-backend` branch.)

## Data policy

- `data/raw/` is gitignored. Never commit hospital operational data.
- `.env` is gitignored. Never commit secrets, and never print connection
  strings to chat/logs.
- The live Supabase DB is the source of truth for schema. Snapshot it with
  `uv run python scripts/introspect_schema_api.py` (read-only, writes
  `reports/schema-snapshot-live.md`).

## Secret storage across devices

The canonical `.env` lives in **Google Drive** so secrets sync across
machines (same pattern as the A-Wiki `drive/` symlink). The local `.env` is a
stub containing `__LOAD_FROM_DRIVE__=true`; the resolver
(`scripts/_env.py`) reads the real values from Drive when that flag is set.

### First-time setup on a new machine

1. Mount Google Drive so `A-Wiki-Data/secrets/env-wastewater-webapp.env` is
   reachable. On this Windows box it's `L:\My Drive\A-Wiki-Data\secrets\...`;
   on macOS it's typically `~/Google Drive/My Drive/A-Wiki-Data/secrets/...`.
   The loader checks both.
2. Create the local stub `.env` (gitignored) with one line:
   ```
   __LOAD_FROM_DRIVE__=true
   ```
3. Run `uv run python scripts/introspect_schema_api.py` — if it finds the
   PAT and writes the snapshot, you're set.

### Editing secrets

Edit `A-Wiki-Data/secrets/env-wastewater-webapp.env` directly (in Drive).
Every machine sees the change on next Drive sync — no per-machine edits.

### Fallback (CI, machines without Drive)

If Drive isn't mounted, the loader falls back to a normal local `.env`. This
is what CI does (it sets `SUPABASE_DB_URL` via the workflow env, and
integration tests skip when it's absent).

## Companion repo (A-Wiki)

Domain knowledge, the original schema design doc, and the project pointer page
live in the A-Wiki sibling repo — see `AGENTS.md` for how to resolve its path.
Keep A-Wiki schema docs in sync with this repo when schema changes land here.
