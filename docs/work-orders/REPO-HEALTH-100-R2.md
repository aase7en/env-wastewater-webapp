# REPO-HEALTH-100-R2 — 2026-08-28 repo-health loop

Status: RE_REVIEW_REQUESTED
Owner: GPT-5.6 Sol
Branch/worktree: `docs/repo-health-100-r2` / `A:\GitHub\envww-repo-health-100-r2`
Original base: `origin/main@19eb31ff725e746a1e5856db5c9e86badd1c725b`
Current-base sync: `origin/main@34d656888f589a6e86adc9ce83a5e69959c871f0` via merge `ab38204`

## Goal

Remove verified repository/CI hygiene defects without overlapping the active Garden implementation/review lane, while producing a durable audit that routes Core/data issues into separate bounded work orders.

## Parallel-safety contract

- PR #48 / `ENV-MOBILE-005` Garden remains owned by Codex/fresh reviewer for review/merge/closure.
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
- this work order
- `reports/repo-health-2026-08-28-r2.md`

## Implementation

1. Replace first-party `actions/checkout@v4` references with `actions/checkout@v7`.
2. Replace first-party `actions/setup-node@v4` references with `actions/setup-node@v7`.
3. Preserve existing project Node versions, cache inputs, permissions, secrets, triggers, deploy behavior, third-party pinned SHAs, and workflow semantics.
4. Do not opportunistically update unrelated actions in the same diff.

## Verification

- parse every workflow as YAML;
- assert no `actions/checkout@v4` or `actions/setup-node@v4` remains under `.github/workflows`;
- assert expected v7 counts;
- `git diff --check`;
- run applicable local script/frontend gates when practical;
- inspect exact remote diff and exact-head CI after PR open;
- verify the Node 20 deprecation annotation is absent from the new exact-head run before merge.

## Audit findings routed out of this slice

- Fuel: unrestricted/imported `fuel_type` can be cast to `carbon.source_type` inside the unified carbon view; unsafe values can break rollup evaluation. Core Engineering lane required.
- Garbage: migration declares `segregation_type` canonical, but UI initializes legacy `waste_type` differently and carbon rollup still consumes legacy `waste_type`; import adapter writes only `segregation_type`. Core/data-contract fix required before Garbage mobile convergence.
- SSoT: several historical WO files retain stale non-final status text despite merged project state. Reconcile only after Garden closes to avoid shared SSoT collision.
- Lint: 12 existing warnings remain; triage into bounded ownership-safe fixes rather than suppressing them.
- Remote hygiene: stale draft PR #8 was closed after verifying its A-Wiki target file/companion PR does not exist.

## Verification evidence

- Workflow YAML parse: PASS for all `.github/workflows/*.yml`.
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

This slice stops at `REVIEW_REQUESTED`; implementation owner does not self-merge. Fresh review must verify the exact workflow diff and exact-head CI. After merge/fetch, record closure in the repo-health report and then continue the next bounded defect lane.
