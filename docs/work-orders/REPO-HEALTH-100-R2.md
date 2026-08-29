# REPO-HEALTH-100-R2 — 2026-08-28 repo-health loop

Status: RE_REVIEW_REQUESTED
Owner: GPT-5.6 Sol
Branch/worktree: `docs/repo-health-100-r2` / `A:\GitHub\envww-repo-health-100-r2`
Original base: `origin/main@19eb31ff725e746a1e5856db5c9e86badd1c725b`
Current-base sync: `origin/main@34d656888f589a6e86adc9ce83a5e69959c871f0` via merge `ab38204`

## Goal

Remove every verified Node-20 GitHub Action runtime residue from the active workflows, add a deterministic regression guard, and produce a durable audit that routes Core/data issues into separate bounded work orders.

## Parallel-safety contract

- PR #48 / `ENV-MOBILE-005` Garden and its closeout are merged; this lane remains isolated from Garden product code and tests.
- This lane does not edit Garden page/spec or Garden SSoT rows.
- Do not edit `.serena/`, raw data, secrets, schema/RLS/carbon/data adapters in this repo-health slice.
- Core Engineering findings are audit-only here; route them separately.

## Baseline evidence

- PR #48 E2E run `33184929519` emitted GitHub's Node 20 action-runtime deprecation annotation.
- Active workflows still use `actions/checkout@v4`; deploy/E2E also use `actions/setup-node@v4`.
- Current project runtime already uses Node 24 in deploy/E2E, so no app runtime change is needed.
- Official upstream latest releases verified 2026-08-28: `actions/checkout v7.0.1`, `actions/setup-node v7.0.0`, both current Node-24-era actions.

## Owned mutable files

- `.github/workflows/deploy-frontend.yml`
- `.github/workflows/e2e.yml`
- `.github/workflows/test.yml`
- `.github/workflows/_example_hermes_l4_auto_pr.yml`
- `scripts/check_workflow_action_runtimes.py`
- `scripts/test_workflow_action_runtimes.py`
- `docs/ai/DEFECT-MEMORY.md` (one CI-runtime prevention entry only)
- this work order
- `reports/repo-health-2026-08-28-r2.md`

## Implementation

1. Keep the completed first-party upgrades: `actions/checkout@v4 -> @v7` and `actions/setup-node@v4 -> @v7`.
2. Repair the exact-head warning found at review SHA `3b61f1c`: pin `astral-sh/setup-uv@v3` to verified v10.0.1 commit `20cfd1bf...` (upstream has no moving `v10` tag).
3. Upgrade the remaining verified Node-20 first-party action chain: `actions/upload-artifact@v4 -> @v7`, `actions/upload-pages-artifact@v3 -> @v5`, and `actions/deploy-pages@v4 -> @v5`.
4. Preserve changed major-version defaults explicitly: `setup-uv enable-cache: false` and `download-from-astral-mirror: false` retain v3 cache/download behavior, while `upload-pages-artifact include-hidden-files: true` retains `.nojekyll` in the artifact.
5. Add a standard-library-only checker plus adversarial tests that fail when block- or flow-style YAML regresses a mapped active action below its verified Node-24-era major, uses an unverified full SHA, or drops a behavior-preserving input.
6. Preserve existing project Node versions, other inputs, permissions, secrets, triggers, deploy behavior, third-party secret-holding pinned SHAs, and workflow semantics.
7. Do not opportunistically update unrelated actions in the same diff.

## Verification

- parse every workflow as YAML;
- run the runtime-checker unit tests and repository scan;
- assert no mapped Node-20-era action reference remains under `.github/workflows`;
- assert the expected Node-24-era action counts;
- `git diff --check`;
- run applicable local script/frontend gates when practical;
- inspect exact remote diff and exact-head CI after PR open;
- inspect check-run annotations, not only green conclusions, and verify the Node 20 deprecation annotation is absent from the new exact-head run before merge;
- after merge, require the exact-main Pages deployment and its annotations to pass without Node-20 action warnings before closure.

## Audit findings routed out of this slice

- Fuel: unrestricted/imported `fuel_type` can be cast to `carbon.source_type` inside the unified carbon view; unsafe values can break rollup evaluation. Core Engineering lane required.
- Garbage: migration declares `segregation_type` canonical, but UI initializes legacy `waste_type` differently and carbon rollup still consumes legacy `waste_type`; import adapter writes only `segregation_type`. Core/data-contract fix required before Garbage mobile convergence.
- SSoT: several historical WO files retain stale non-final status text despite merged project state. Reconcile only after Garden closes to avoid shared SSoT collision.
- Lint: 12 existing warnings remain; triage into bounded ownership-safe fixes rather than suppressing them.
- Remote hygiene: stale draft PR #8 was closed after verifying its A-Wiki target file/companion PR does not exist.

## Verification evidence

- Exact-head review `5056855963` at `3b61f1c` is `CHANGES_REQUIRED`: green check-run `99035942437` still warned that `astral-sh/setup-uv@v3` targets Node 20.
- The last main Pages deployment also warned on the still-unupgraded artifact/deploy action chain; prior evidence claiming the annotation was absent is superseded and must not be reused.
- Independent RED proof on reviewed head `3b61f1c`: the new checker reports four violations (`setup-uv@v3`, `upload-artifact@v4`, `upload-pages-artifact@v3`, `deploy-pages@v4`) and exits 1.
- Remediation GREEN: checker unit tests **14/14 PASS**; current repository scan PASS across **5 workflow files**; PyYAML parse **5/5 PASS**; `scripts/test_split_sql.py` PASS; `git diff --check` PASS.
- Upstream manifest verification on 2026-08-29: `setup-uv@20cfd1bf...` and `deploy-pages@v5` declare `node24`; upload-pages-artifact v5 composes upload-artifact v7. The setup-uv v10 moving tag does not exist (404), so the verified v10.0.1 release commit remains pinned.
- Workflow YAML parse: PASS for all `.github/workflows/*.yml` at the superseded pre-remediation checkpoint.
- `actionlint`: unavailable locally; not claimed as PASS.
- v4 first-party action references remaining: 0; checkout-v7: 5; setup-node-v7: 2.
- `scripts/test_split_sql.py`: PASS.
- Vitest with non-secret test env: 202/202 PASS.
- standalone TypeScript build: PASS.
- lint: 12 existing warnings / 0 errors.
- production build: PASS.
- `git diff --check`: PASS.
- Current-base merge `ab38204`: PASS, no conflict and no scope expansion in `origin/main...HEAD`.
- Current-base focused Chemical Playwright: 7/7 PASS after correcting the local test-profile contamination.
- Current-base full Playwright: 95/95 PASS with the non-secret project-ref test URL and `test-anon-key`.
- Invalid E2E evidence from the leaked `example.invalid` Vitest env/orphan Vite reuse is explicitly excluded from product-regression evidence and preserved in the repo-health report as a harness lesson.
- Dependency/security and Core data-contract findings are recorded in `reports/repo-health-2026-08-28-r2.md` and explicitly routed out of this diff.

## Stop / review gate

After remediation this slice stops at `REVIEW_REQUESTED`; implementation owner does not self-merge. A fresh reviewer must verify the exact workflow diff and exact-head CI, then owns merge. After merge/fetch, the lead must verify exact-main test/E2E/Pages annotations, record closure in the repo-health report, and continue the next bounded defect lane.
