# ENV-APP-VERSION-001-C1 — Handoff (claim checkpoint)

conventions note: this handoff follows the
`docs/ai/handoffs/DT-VIS-P002-CODEX.md` conventions (claim checkpoint
sections, per-phase evidence, durable receipts).

## D0 — Claim transition authored (12 พฤศจิกายน 2569 / 2026-11-12)

- Claim `ENV-APP-VERSION-001-C1` (generation 1, CLAIMED) registered by this
  transition; authority begins only after the reviewed transition merges to
  main.
- Task `ENV-APP-VERSION-001` (new task row; task_id uniqueness checked
  against the registry via the guard — no OWNERSHIP_CONFLICT).
- Work Order: `docs/work-orders/ENV-APP-VERSION-001.md` (two deliverables,
  authorization basis, D1-pending scheme note, execution routing, exact
  mutable scope, forbidden scope, truth constraints, D-plan, acceptance,
  review plan).
- Lane: Track-Z (GLM) version infra + docs + Track-F (Codex) chip slice.
  Holder (this coordinator session): `kilo-env-appversion-001-g1-primary`;
  worktree
  `/Volumes/MAC_WORK/DevWorkspace/Github/_worktrees/env-appversion-001-20261112`;
  branch `docs/env-appversion-001-claim`; base
  `6ad9aa76049aa3c2e8418cdb5a32c2a1a92359cd` (= origin/main at transition
  authoring; fence `expected_policy_revision` pins this SHA and
  `expected_registry_hash` pins the registry block AT this base, guard
  method `scripts/env_coordination_guard.py:454-456`, verified empirically:
  hash at 85b0dd3 = `b897e7ee…` matches the fence PR #166 pinned; hash at
  6ad9aa7 = `cfe8651ccad89046633682daf8252738801c46a6378ae8d72c50c7be6383854a`).
- Deliverable A (versioning system — mechanism pinned, SCHEME NOT PRE-BAKED):
  version source `frontend/package.json` (`"version": "0.0.0"` at line 4 —
  the gap the owner saw); build-time injection via Vite `define` in
  `frontend/vite.config.ts`; single read point `frontend/src/lib/version.ts`
  (new; kebab-case flat convention in `frontend/src/lib/` verified); a small
  user-tappable version chip (new `frontend/src/components/layout/VersionChip.tsx`
  + ONE wiring point in `frontend/src/components/layout/AppShell.tsx` — the
  verified shell surface: `frontend/src/components/layout/` holds
  AppShell.tsx / ModuleDock.tsx; NO footer component exists, the chip's exact
  placement is a D1 question); `CHANGELOG.md` (new, repo root, Thai,
  user-facing, พ.ศ. dates); one git tag per release (naming per D1);
  consistency script `scripts/check_release_version.py` (new; `test_*.py`
  convention verified — `scripts/test_check_release_version.py` new; NO CI
  enforcement changes unless trivially safe via a justified repair-round).
- Deliverable B (README refresh to current reality): source truth =
  `docs/ai/ROADMAP.md` completed sections + `docs/ai/CURRENT-WORK.md`; page
  list verified against `frontend/src/App.tsx` routes AT this base —
  `/`, `/dashboard`, `/form`, `/form/:id`, `/readings`, `/trends`,
  `/reports`, `/equipment`, `/sensors`, `/flow`, `/operations`,
  `/sustainability`, `/carbon`, `/carbon-rollup`, `/water-supply`,
  `/garbage`, `/fuel`, `/garden`, `/building`, `/safety`, `/food`,
  `/chemical`, `/regulations`, `/water-watch`, `/attachments`, `/import`,
  `/pdf-designer`, `/login`, `/auth/callback`, `/pending-approval`,
  `/admin/*` (admin/ai, admin/audit, admin/db, admin/users) — do NOT invent
  features; the 8 daily-form domains are wastewater/chemical/water-supply/
  fuel/garden/garbage/safety/food plus building. README keeps: companion-repo
  (A-Wiki) note, `data/raw/` gitignored note, secrets notes, Python-scripts
  section (referenced files re-verified present at base:
  `scripts/apply_migration_api.py`, `scripts/introspect_schema_api.py`,
  `scripts/test_split_sql.py`, `scripts/_env.py`); removes stale P10.x
  palette/migration-era wording (`/dashboard` "legacy clinical-teal palette
  until the P10.7 migration", "P10.1–4", "P10.6.4", "P10.6.5", the 3-page
  list, the deferred "dashboard → Aura migration" sentence); keeps the
  English style of the file.
- **D1-PENDING (explicit): the version SCHEME is NOT decided in this claim's
  documents** — SemVer vs date-based/CalVer, chip placement, tag prefix,
  first-release number, changelog granularity MUST come from the joint
  delegated consult (Jev via jev-advisory MCP + Terra via Codex CLI
  read-only) BEFORE D2; receipts copied VERBATIM into this handoff's D1
  section when run (ENV-FLEET-ROUTER-001 verbatim-receipt pattern).
- Execution routing: D2 GLM Track-Z RED-first tests
  (`frontend/src/lib/version.test.ts`,
  `scripts/test_check_release_version.py`,
  `frontend/tests/e2e/env-app-version-001.spec.ts` — truthful failures
  recorded) → D3a GLM Track-Z (package.json, vite define, version lib,
  consistency script, CHANGELOG.md, README.md) → D3b Codex CLI
  `gpt-6-sol` @ `model_reasoning_effort=max` Track-F ONLY for the chip
  component + its AppShell wiring (Role B single-writer window; one
  admission probe per materially changed fingerprint; a provider admission
  error parks the claim in registry BLOCKED — no silent fallback, no GLM
  self-assignment of Track F, GPT-6 Astra prohibited) → D4 GLM battery
  (FULL vitest + tsc + lint + Playwright FULL + guard 344/344 + runtime
  62/62 + script check) → freeze the exact head → STOP at
  REVIEW_REQUESTED — the implementing lane never merges its own PR (D5
  fresh-GLM independent review; GPT-6.1 Terra eligible as cross-model
  reviewer; never author-and-approve; never silent downgrade).
- First release happens AFTER merge: tag per the D1 scheme + CHANGELOG
  entry for this release (พ.ศ. dates).
- Truth constraints pinned for the whole lane: the chip renders the real
  injected build version only — dev/unbuilt fallback communicates its true
  state (never a fabricated release number); the tap-through summary comes
  from data known at build time (e.g. bundled CHANGELOG), never a claimed
  future release; unknown ≠ 0 (ห้ามแทนค่าศูนย์); user-facing dates พ.ศ.
  (CE + 543); no PHI; no real writes in tests.

### Authorization basis (honest and complete)

1. Owner decision in-session 2026-11-12 (Kilo chat): after being shown the
   current gaps (`frontend/package.json` version `0.0.0`, no `CHANGELOG.md`,
   `README.md` stale since July 2026), the owner answered **"ทำทั้งสองอย่าง"**
   — do BOTH the versioning system and the README refresh.
2. Owner standing instruction: delegate decision points to Jev + Terra
   jointly — the version scheme is D1 (advisory delegates never hold
   merge/review-acceptance authority per the delegated-decision policy wired
   in `scripts/env_autonomy_runtime.py`).
3. Gap evidence re-verified AT base `6ad9aa7`: `frontend/package.json:4`
   = `"version": "0.0.0"`; no `CHANGELOG.md` at repo root; `README.md`
   (68 lines) lists only `/dashboard`, `/form`, `/form/:id`, `/readings`
   and carries P10.x migration-era wording.

- Next: after merge → in the registered worktree run the D1 joint delegated
  consult (scheme questions; receipts verbatim into the D1 section below)
  → D2 RED-first tests → D3a GLM Track-Z → D3b gated Codex dispatch
  (single-writer window; BLOCKED park on provider admission error) →
  D4 battery → freeze the exact head → stop at REVIEW_REQUESTED.

## D1 — Joint delegated consult on the version scheme

PENDING — not yet run at transition authoring. When run, paste BOTH
receipts (Jev via jev-advisory MCP; Terra via Codex CLI read-only) here
verbatim, byte-for-byte, with model/session metadata, per the
ENV-FLEET-ROUTER-001 / DT-VIS-P002 receipt pattern. The scheme decision is
BINDING for D2+ (SemVer vs date-based/CalVer; chip placement; tag prefix;
first-release number; changelog granularity).

## Checkpoints

(appended per phase as work proceeds; each checkpoint carries exact SHAs and
truthful failure/pass records)
