# ENV-MOBILE-001E — Sol MAX Production Error-Reveal Remediation

Status: RE_REVIEW_REQUESTED (repo canonical: RE-REVIEW_REQUESTED)
Model tier: GPT-5.6 Sol MAX
Owner: GPT-5.6 Sol MAX
Coordinator / independent re-review owner: fresh GPT reviewer context
Parent: `docs/work-orders/ENV-MOBILE-001.md`
PR: #40

## Objective

Remediate the production failed-save/error-reveal race proven by `ENV-MOBILE-001D` while preserving all existing DailyForm data, validation, hydration, threshold, repair-request, retry, and null semantics.

## Exact start boundary

- Repo/worktree: `A:\\GitHub\\envww-mobile-001`
- Branch: `feat/env-mobile-001`
- Required starting HEAD: `cdaa1097022b7fbfedfff8302a628af630f6cfb1`
- Base: `origin/main@08db62c821cf7b95aaeb373c603d77ccc4d9b98a`
- Protected unknown state: `.serena/` — do not touch.
- GLM lane D: stopped at `PRODUCTION_REMEDIATION_REQUIRED`; claim complete.

Before production mutation: fetch/verify repo, remote branch, exact HEAD, base ancestry, dirty state and ownership; confirm this lane claim is ACTIVE and no competing writer owns `DailyFormPage.tsx`.

## Owned files

May edit only:

- `frontend/src/pages/DailyFormPage.tsx`
- this lane WO/status
- `docs/ai/handoffs/ENV-MOBILE-001E-SOLMAX.md`
- `MIGRATION.md` only for this claim row
- bounded shared coordinator status only if required to leave `RE_REVIEW_REQUESTED`

No-touch:

- `.serena/`
- GLM lane D WO/handoff/spec and prior lane artifacts
- `frontend/tests/e2e/daily-form-mobile.spec.ts`
- schema/RLS/migrations, workflows, package files, shared UI/AppShell/ModuleDock, Digital Twin
- PR merge/deploy/parent closure/next ROADMAP work

## Production change contract

1. Replace submit-handler `requestAnimationFrame` focus calls with a state-backed reveal request.
2. Run focus/scroll only after React commits the conditional banner or abnormal-cause field.
3. Error recovery must use deterministic `scrollIntoView({ behavior: "auto", block: "center", inline: "nearest" })`.
4. Preserve accessible focus, `role=alert`, `tabIndex=-1`, entered values, retry behavior, and error messaging.
5. Replace the false atomicity hint with: `ระบบจะบันทึกรายการก่อน แล้วจึงพยายามสร้างใบแจ้งซ่อมแยกต่างหาก`.
6. Recreate the approved staged change against the authoritative HEAD; do not copy the staging worktree.

## Verification

Run from `frontend/` using the documented non-secret test profile:

- focused first-save-failure test once, `--retries=0`;
- same failed-save scenario `--repeat-each=20 --retries=0`; acceptance = 20/20 focus + viewport intersection;
- full `daily-form-mobile.spec.ts`, `--retries=0`;
- full Vitest / project unit suite;
- typecheck/build;
- lint;
- `git diff --check`;
- fresh exact-diff independent review of the applied change.

Do not weaken the GLM regression spec, retries, timeouts, selectors, or assertions to obtain green.

## Stop gate

When all applicable gates pass:

1. record exact commands/results and exact HEAD in the lane handoff;
2. mark only this claim complete;
3. set lane/shared bounded status to `RE_REVIEW_REQUESTED`;
4. fetch and require a safe fast-forward-only relationship before commit/push;
5. commit/push only owned files;
6. STOP at `RE_REVIEW_REQUESTED` and do not merge PR #40.
