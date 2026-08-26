# GLM 5.3 MAX — WO-STAB-009 Remediation 2

## ROLE

You are the Core Engineering Owner for a narrowly scoped PHI/provider-boundary remediation in `env-wastewater-webapp`.

Use the highest reasoning effort available: **MAX / Highest Available**.

Do not merely advise. Work directly in the repository, but stay inside this contract.

## PROJECT / REPOSITORY

- Repository: `A:\GitHub\env-wastewater-webapp`
- GitHub: `aase7en/env-wastewater-webapp`
- Work order: `WO-STAB-009`
- Historical PR: #29
- Historical reviewed head: `676b432452ad1754708907fb0c1fbef9c77d325e`
- Historical merge: `590f41303ba7c949eb44b9844ccc8dab4675b34a`

PR #29 is already merged. **Do not reopen, rewrite, force-push, or continue working on the merged PR.**

Create a fresh branch from current `origin/main`, suggested name:

`fix/p1-annotate-phi-boundary-remediation-2`

Create a fresh PR when verification is complete.

## MANDATORY BOOTSTRAP

Before changing files:

1. call `initial_instructions`;
2. call `get_current_config`;
3. verify active project is exactly `A:\GitHub\env-wastewater-webapp`;
4. `git fetch origin main`;
5. verify repo/worktree/branch/HEAD/dirty state and ownership;
6. do not reset, clean, delete, move, or blindly stash unknown/untracked files;
7. use a clean isolated worktree if the primary worktree is dirty or owned by another task.

## READ FIRST — IN THIS ORDER

1. `AGENTS.md`
2. `docs/ai/PROJECT-BRIEF.md`
3. `docs/ai/CURRENT-WORK.md`
4. `docs/ai/HANDOFF.md`
5. `docs/agent-handoff/AI_COLLABORATION_PROTOCOL.md`
6. `docs/ai/work-orders/WO-STAB-009-PROPOSAL.md`
7. `docs/ai/prompts/GPT56-REVIEW-PR29-REMEDIATION.md`
8. **this file**: `docs/ai/prompts/GPT56-REVIEW-PR29-REMEDIATION-2.md`

Then inspect the actual implementation/tests/schema/import paths relevant to this remediation:

- `frontend/src/lib/admin/annotate-boundary.ts`
- `frontend/src/lib/admin/annotate-boundary.test.ts`
- `frontend/src/lib/admin/ai-sql.ts`
- `frontend/src/lib/import-adapters/fuel.ts`
- `frontend/src/pages/BulkImportPage.tsx`
- relevant Supabase migrations for:
  - `fuel.dispense_log`
  - `garbage.collection_log`
  - `wastewater.threshold_alert`
  - `core.ai_scope`

## SOURCE REALITY / WHY THIS WORK EXISTS

The first PR #29 remediation was valid and must remain intact:

- `wastewater.reading.color_desc` removed from provider-safe profile;
- `wastewater.reading.smell_desc` removed;
- `wastewater.reading.note` removed;
- runtime `core.ai_scope` ∩ static-profile authorization preserved;
- fail-closed canonicalization preserved;
- scope-read failure still produces zero provider calls;
- projection still occurs before provider payload construction;
- refusal paths do not echo raw row values.

Independent re-review proved the original two remediation tests are meaningful: temporarily re-adding the three wastewater fields makes exactly the two remediation tests fail, including captured-body leakage of:

`ผู้ป่วย สมชาย ใจดี HN 12345`

After restoring the reviewed implementation, focused tests returned 16/16 and the full Vitest suite returned 195/195.

## NEW BLOCKING FINDING — ALL FIVE STATIC PROFILES

The post-merge re-re-review audited every static provider-safe profile and found three remaining boundary risks.

### 1. `fuel.dispense_log.fuel_type`

`TABLE_SAFE_FIELDS` currently allowlists `fuel_type`.

But the current contract is not a hard enum boundary:

- database column is plain `text` with no CHECK/enum constraint;
- `frontend/src/lib/import-adapters/fuel.ts` accepts arbitrary string input via `str(raw["fuel_type"] ?? raw["type"])`;
- `BulkImportPage` can insert mapped valid rows into `dispense_log`;
- `core.ai_scope` seeds `fuel.dispense_log` as `patient_safe=true`, `is_enabled=true`.

Therefore arbitrary identifying free text can be stored in `fuel_type` and then pass the provider-safe projection.

### 2. `garbage.collection_log.waste_type`

`TABLE_SAFE_FIELDS` currently allowlists `waste_type`.

But:

- database column is plain unrestricted `text`;
- migration notes identify it as a legacy/backwards-compatibility field;
- authenticated writes are permitted by the current RLS contract;
- `core.ai_scope` seeds `garbage.collection_log` as `patient_safe=true`, `is_enabled=true`.

Treat it as unbounded free text at the external-provider boundary unless an enforceable bounded contract exists.

### 3. `wastewater.threshold_alert.severity`

`TABLE_SAFE_FIELDS` currently allowlists `severity`, but the current `wastewater.threshold_alert` schema does not contain a `severity` column.

This is a dormant/stale safe-field entry. It is unsafe because a future plain-text column with the same name could silently become provider-visible without a fresh privacy review.

## REQUIRED REMEDIATION

Use the **smallest fail-closed correction**.

Preferred solution unless actual repo evidence proves an equally strong bounded contract already exists:

1. remove `fuel_type` from the provider-safe static profile;
2. remove `waste_type` from the provider-safe static profile;
3. remove stale `severity` from the provider-safe static profile.

Do **not** expand this WO into a DB migration, UI redesign, import redesign, or broad schema cleanup merely to keep these strings provider-visible.

If you believe one of these strings can safely remain allowlisted, you must first prove an enforceable current contract at every write path (not merely a dropdown in one UI). A regex/name scrubber is not sufficient authorization.

## HARD PHI RULE

**Patient-identifying information must never leave the system.**

Content scrubbing is defense-in-depth only. The authorization boundary must be structural and fail closed.

Do not solve this by adding a patient-name regex while continuing to allow arbitrary free text.

## RED-FIRST REGRESSION REQUIREMENTS

Before the production fix, add deterministic tests that fail against the current merged behavior.

Use a non-regex identifier payload such as:

`ผู้ป่วย สมชาย ใจดี HN 12345`

At minimum prove:

1. a `fuel.dispense_log` row containing that value in `fuel_type` does not expose it through `projectSafeRow()` after the fix;
2. the actual captured provider request body from `annotateRow()` does not contain the value or the unsafe key;
3. a `garbage.collection_log` row containing that value in `waste_type` does not expose it through `projectSafeRow()` after the fix;
4. the actual captured provider request body does not contain the value or unsafe key;
5. `wastewater.threshold_alert.severity` is not projected to provider-safe output.

Show the new focused tests **RED before the production fix** and **GREEN after the fix**.

Preserve the earlier wastewater regression tests and all existing fail-closed tests.

## ALL-FIVE-PROFILE AUDIT GATE

Before requesting re-review, inspect all five entries in `TABLE_SAFE_FIELDS` again:

- `wastewater.reading`
- `carbon.reading`
- `fuel.dispense_log`
- `garbage.collection_log`
- `wastewater.threshold_alert`

For every surviving string field, verify from actual schema + write paths that it is structurally bounded and cannot contain arbitrary patient-identifying free text.

If any surviving provider-safe path can still carry arbitrary identifying text, the task remains `CHANGES_REQUIRED`.

## MUST PRESERVE

Do not regress:

- runtime `ai_scope` ∩ static-profile intersection;
- `patient_safe=true` + `is_enabled=true` requirement;
- unknown/unmapped table fail-closed behavior;
- ambiguous bare table name fail-closed behavior;
- `ai_scope` read-error zero-provider-call behavior;
- unknown-column omission;
- pre-prompt projection;
- refusal-message raw-row protection;
- existing email/phone/Thai-ID scrubber as defense-in-depth;
- original `color_desc` / `smell_desc` / `note` exclusion.

## ALLOWED SCOPE

Prefer changes only in:

- `frontend/src/lib/admin/annotate-boundary.ts`
- `frontend/src/lib/admin/annotate-boundary.test.ts`
- SSoT/handoff/repo-health files required by repository protocol.

Read other files for evidence. Do not modify them unless the minimal safe fix genuinely requires it and the reason is recorded.

## FORBIDDEN SCOPE

Do not start or modify:

- `WO-STAB-008`;
- `DT-VIS-P002` / `DT-VIS-P003`;
- `UX-FLOW-P001`;
- `ENV-INT-P001`;
- navigation rewrite;
- Operations redesign;
- external API production integration;
- unrelated schema/UI/refactor work.

Do not merge your own implementation PR.

## VERIFICATION

Run from `frontend` with non-secret dummy env only if the test harness requires env values. Never print or commit real secrets.

Required gates:

1. focused boundary tests with explicit RED-before-fix evidence;
2. focused boundary tests GREEN after fix;
3. full `npm test`;
4. `npm run build`;
5. `npm run lint`;
6. `git diff --check`;
7. full Playwright if locally available; if transport/tool infrastructure fails, classify it accurately and use exact-head GitHub E2E evidence when repository policy permits;
8. inspect the final remote PR diff and verify the PR HEAD equals the reviewed/pushed SHA.

Do not weaken existing tests to obtain green.

## SSoT / CHECKPOINT REQUIREMENTS

Before handing back to GPT, update the repository's existing SSoT rather than creating shadow status files:

- `docs/ai/CURRENT-WORK.md`
- `docs/ai/HANDOFF.md`
- `reports/repo-health-2026-08-25.md` if it remains the active repo-health record for this queue.

Record:

- branch;
- exact HEAD;
- changed files;
- RED evidence;
- GREEN evidence;
- full test/build/lint/Playwright results;
- warnings;
- PR URL/number;
- remote diff audit;
- remaining risks, if any.

## STOP CONDITION / HANDOFF

When implementation and verification are complete:

- set WO-STAB-009 state to `RE-REVIEW_REQUESTED`;
- push the fresh branch;
- open the fresh PR;
- ensure CI has valid results or record exact pending/infra state;
- **STOP**;
- do not merge;
- do not start any deferred work.

Final handoff should be concise and include:

```text
GLM REMEDIATION-2 RESULT — WO-STAB-009
STATUS: RE-REVIEW_REQUESTED | CHANGES_REQUIRED | BLOCKED
BRANCH:
HEAD:
PR:
FILES CHANGED:
RED PROOF:
GREEN / FULL GATES:
ALL-FIVE-PROFILE AUDIT:
REMOTE DIFF / CI:
SSoT UPDATED:
REMAINING RISKS:
NEXT OWNER: GPT 5.6 Sol reviewer / merge owner
```
