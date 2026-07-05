#!/usr/bin/env bash
# session-start-companion-notice.sh — remind that A-Wiki is this repo's
# companion knowledge base. Non-blocking, informational only.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
A_WIKI_ROOT="${A_WIKI_ROOT:-$REPO_ROOT/../A-Wiki}"

if [ -d "$A_WIKI_ROOT/wiki/entities/env" ]; then
  echo "📡 Companion repo: A-Wiki (@ $A_WIKI_ROOT) — domain knowledge in wiki/entities/env/, wiki/synthesis/env-webapp-schema-wastewater.md"
else
  echo "⚠️  Companion repo A-Wiki not found at $A_WIKI_ROOT — set \$A_WIKI_ROOT if it moved, or ask the user where it lives."
fi
