#!/usr/bin/env bash
# One-shot Supabase link + schema pull, for P5b.2-live.
#
# PREREQUISITE: run `supabase login` once (opens browser, takes ~30s).
# This script then links the project and dumps the live schema.
#
# Usage (from repo root):
#   bash scripts/supabase_link.sh
#
# Output: supabase/migrations/*.sql (live schema as SQL) which we then feed
# into the introspection reconciliation in reports/schema-snapshot-live.md.
set -euo pipefail

PROJECT_REF="gllqtbyofrcjzmbnfoeh"

echo "=== Step 1/3: link project ==="
supabase link --project-ref "$PROJECT_REF"

echo ""
echo "=== Step 2/3: pull live schema → supabase/migrations/ ==="
mkdir -p supabase/migrations
supabase db pull
echo "(schema written to supabase/migrations/)"

echo ""
echo "=== Step 3/3: run integration tests against ENV_DB ==="
uv run pytest tests/integration -v

echo ""
echo "=== Next: commit as chunk(P5b.2-live) ==="
echo "git add supabase/ reports/ && git commit -m 'chunk(P5b.2-live): live schema snapshot + integration tests green'"
