# ENV-ROUTE-ALIGN-001 — GLM Handoff (runtime route-table alignment)

Task `ENV-ROUTE-ALIGN-001`. Claim: `ENV-ROUTE-ALIGN-001-C1` (generation 1).
WO: `docs/work-orders/ENV-ROUTE-ALIGN-001.md`. This file is the durable
receipt trail (transitions, RED evidence, battery, review verdicts, merge
receipts).

## Review-route record (R3, this transition)

- Reviewer: Codex CLI `gpt-6-sol` @ `model_reasoning_effort=max`, sandbox
  read-only, dispatched from this exact worktree at the transition head.
- Live admission evidence for THIS review route (actual dispatch receipts):
  - **R1 @ `1542e05`**: exit 0, 101,313 tokens — verdict CHANGES_REQUIRED
    (2xP2: category-specific admission reason; duplicate stale 001B-closure
    clause) — repaired in `6bb2fb4`.
  - **R2 @ `6bb2fb4`**: exit 0, 103,277 tokens — verdict CHANGES_REQUIRED
    (1xP2: this receipt placeholder) — repaired in this commit.
- Designated fallback if the gpt-6-sol review dispatch hits a provider
  admission error: `gpt-5.6-sol` (admitted R3-review-only across the
  PR #113/#118/#122 trails). GPT-6 Astra prohibited. Never
  author-and-approve; never silent GLM downgrade.

## Status

- 2026-10-14 (claim transition authored): WO + registry entry + frontier
  bullet drafted on `docs/env-route-align-001-claim` off main `3cf1209`.
  Predecessor fence (computed programmatically via the guard module):
  policy `3cf12092bff0c6d3dee6420097da79012a99fb01`, registry block
  sha256 `2712e9a30547c07c62d1054df4dda00c03cf51293498755b68b1a936f0e53a06`.
  Next: R3 cross-model review → expected-head merge → D2 RED → D3 → D4 →
  D5 → D6.

(append-only below this line)

## Execution receipts

- 2026-10-14 (transition merged): PR #129 merged as `cea86c4` (second parent = R3-APPROVED `76224c2`; 3-round trail: R1 CR 2xP2 → R2 CR 1xP2 → R3 APPROVED no-findings; verdicts issuecomment-6165690729 + 6165827039 + 6165917605; main CI test=success). Implementation branch feat/env-route-align-001 at base `cea86c4`.
- 2026-10-14 (D2 RED, commit `1548087`): 3 truthful failures — hard_engineering + architecture_consult TASK_CATEGORY_UNSUPPORTED (errors) + non-disruption case (categories absent).
- 2026-10-14 (D3 GLM): SUPPORTED_MODELS["gpt-6.1 sol"] += hard_engineering + architecture_consult; ROUTE_DEFAULTS += the two rows; SOL_CATEGORY_LANES per-category lane map (route_fit keeps REVIEWER_ROLE_ONLY for independent_review mismatches, SOL_ROLE_LANE_MISMATCH otherwise); SOL_CATEGORY_ADMISSION_REASONS category-specific reasons (R3 reason byte-identical); select_route docstring notes the 2026-10-12 directive.
- 2026-10-14 (D4 battery): `uv run python -m unittest scripts.test_env_autonomy_runtime` → **41 tests OK** (38 + 3 new); CLI probes: `route --task-category hard_engineering` → GPT-6.1 Sol / MUTATION / codex-cli / ADMISSION_REQUIRED / HARD_ENGINEERING_ADMISSION_REQUIRED / dispatch_allowed false; `architecture_consult` → READ_ONLY_CONSULT / ARCHITECTURE_CONSULT_ADMISSION_REQUIRED / dispatch_allowed false (external_call_started false on both); guard regression `scripts.test_env_coordination_guard` → **344 tests OK**.
- Next: D5 fresh-GLM review at the frozen head → D6 expected-head merge + closeout.

## Closure receipts (D5/D6)

- D5 (2026-10-14): fresh-GLM independent review at exact head `f56a70b` — **APPROVED** (verdict issuecomment-6166104715). Independently REPRODUCED the battery (41 OK, 344 OK, CLI probes byte-for-byte; R3 reason identical; plain independent_review → GLM-5.3 MAX). Verified policy faithfulness, additions-only test diff (zero deletions), no dispatch path added, receipts match SHAs. 1 non-blocking P3 recorded (no test asserts the legacy REVIEWER_ROLE_ONLY reason string itself — pre-existing gap, behavior covered).
- D6 (2026-10-14): expected-head merge — **PR #130 merged as `c2803fe`** (parents: `cea86c4` + reviewed `f56a70b`; ancestry verified). Exact-main workflow on `c2803fe`: test SUCCESS (scripts+docs change — no frontend deploy applicable). Closeout transition: registry CLOSED at generation 1, fence moved to `c2803fe` + block sha256 `6b724821…` (guard module), frontier bullet + coordination summary reconciled (ONE active claim remains: Building, deferred). Implementation worktree `env-route-align-20261014` preserved clean at `f56a70b` (fully merged). CLOSED confers no fresh mutation authority.
