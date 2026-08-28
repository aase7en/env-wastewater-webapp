# ENV-MOBILE-001D — GLM-5.3 MAX Error-Visibility Regression

Status: PRODUCTION_REMEDIATION_REQUIRED (lane stopped 2026-08-28; race reproduced 2/20 in repeat run — evidence in `docs/ai/handoffs/ENV-MOBILE-001D-GLM53.md`)
Owner: GLM-5.3 MAX
Coordinator / production owner: GPT-5.6 Sol Ultra
Execution order: FIRST; Ultra production remediation starts only after this test lane stops.
Parent: `docs/work-orders/ENV-MOBILE-001.md`
PR: #40

## Model-routing evidence

Verified 2026-08-28 from Z.ai's official release: https://z.ai/blog/glm-5.3

- Z.ai recommends `reasoning_effort=max` for coding.
- Vendor-reported GLM-5.3 results include Terminal Bench 3.0 28.3, DeepSWE v1.1 66.9, and Z.ai Code Bench 34.5% at Max.
- It remains below GPT-5.6 Sol on the cited Terminal Bench 3.0 and DeepSWE results. Therefore this lane is deterministic E2E engineering only; UX judgment, production design, final review, and merge remain with Sol Ultra.
- Benchmarks route capability only. Repository tests are acceptance authority.

## Exact start boundary

- Repo/worktree: `A:\\GitHub\\envww-mobile-001`
- Branch: `feat/env-mobile-001`
- Required starting HEAD: `3763b6205a46a3819579dff5f890b4c536c3f6e9`
- Base: `origin/main@08db62c821cf7b95aaeb373c603d77ccc4d9b98a`
- Protected unknown state: `.serena/` — do not touch.

Before mutation: read repo `AGENTS.md` and this contract. Fetch safely; verify repo, remote, branch, exact HEAD, base ancestry, dirty state, and no competing owner. If HEAD differs or an owned file has unknown edits, STOP and report.

First copy this contract verbatim into:

`docs/work-orders/ENV-MOBILE-001D-GLM53-ERROR-REGRESSION.md`

Then add one ACTIVE `ENV-MOBILE-001D` claim row to `MIGRATION.md` before touching the test.

## Owned files

May edit only:

- `frontend/tests/e2e/daily-form-mobile.spec.ts`
- `docs/work-orders/ENV-MOBILE-001D-GLM53-ERROR-REGRESSION.md`
- `docs/ai/handoffs/ENV-MOBILE-001D-GLM53.md`
- `MIGRATION.md` only for this claim row

No-touch:

- `frontend/src/**`, especially `DailyFormPage.tsx`
- shared `CURRENT-WORK.md`, `HANDOFF.md`, parent/lane A/lane B artifacts
- workflows, package files, schema/RLS/migrations, `.serena/`
- PR review, merge, deploy, closure, or next ROADMAP work

## Task

1. Stub `**/rest/v1/role_module_visibility**` deterministically in `mockDailyFormDependencies()` with an empty successful response.
2. Strengthen only the first-save-failure/retry test. Submit from the bottom of the phone form and prove:
   - API alert is visible and `role=alert`;
   - alert receives focus after React commits it;
   - alert bounding box intersects the phone viewport;
   - values remain and retry succeeds.
3. Preserve useful assertions. Do not weaken timeouts/retries, hide a production defect with selectors, or add dependencies.
4. Baseline: independent exact-head review ran 20 phone-width failed saves at `3763b620...`; 19 focused/scrolled, 1 left focus on `BODY` with the alert fully above viewport. Do not fabricate RED if your repeat does not reproduce it.

## Verification

- focused failed-save test, `--retries=0`;
- full `daily-form-mobile.spec.ts`, `--retries=0`;
- failed-save repeat 20 times if practical;
- `git diff --check`.

Current production may fail; that is expected evidence, not permission to edit it.

## Stop gate

Set `PRODUCTION_REMEDIATION_REQUIRED`, write the handoff, mark only this claim complete, commit/push owned files with `chunk(ENV-MOBILE-001D): ...`, and STOP. Even if 20/20 passes, record exact evidence and STOP because the independent reviewer already reproduced the race. Do not approve or merge PR #40.
