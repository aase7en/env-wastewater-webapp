# GLM 5.3 MAX — PR #33 / WO-STAB-009 Remediation After GPT Re-Review

## ROLE

You are the Core Engineering Owner for a narrowly scoped PHI/provider-boundary remediation on open PR #33 in `env-wastewater-webapp`.

Use the highest reasoning effort available: **MAX / Highest Available**.

Do not merely advise. Work directly in the repository and continue the existing PR #33 implementation only within this contract.

## PROJECT / REPOSITORY

- Repository: `A:\GitHub\env-wastewater-webapp`
- GitHub: `aase7en/env-wastewater-webapp`
- Work order: `WO-STAB-009`
- Open remediation PR: **#33**
- PR branch: `fix/p1-annotate-phi-boundary-remediation-2`
- GPT-reviewed PR head: `44c35ee8d08863d88243da99c6ea851ac98b7d7d`
- Implementation commit already present: `105ce8dcd5a7e4948cdd5aca793f0ace6904983d`
- PR base at review: `origin/main` `0f549f17d70b44f70ff6f09aa7f0ea86a2d71ef7`

PR #33 is **OPEN and CHANGES_REQUIRED**. Continue the same branch/PR. Do not create a second implementation PR unless repository state makes continuation impossible and GPT explicitly approves that change.

## MANDATORY BOOTSTRAP

Before changing files:

1. call `initial_instructions`;
2. call `get_current_config`;
3. verify active project is exactly `A:\GitHub\env-wastewater-webapp`;
4. `git fetch origin main`;
5. inspect PR #33 remote head and confirm whether it is still `44c35ee8d08863d88243da99c6ea851ac98b7d7d` or has changed;
6. verify repo/worktree/branch/HEAD/dirty state and ownership;
7. do not reset, clean, delete, move, or blindly stash unknown/untracked files;
8. if GPT reviewer docs have landed on `main`, integrate current `origin/main` additively before final handoff. Preserve the reviewer verdict and historical records if SSoT conflicts occur.

## READ FIRST — IN THIS ORDER

1. `AGENTS.md`
2. `docs/ai/PROJECT-BRIEF.md`
3. `docs/ai/CURRENT-WORK.md`
4. `docs/ai/HANDOFF.md`
5. `docs/agent-handoff/AI_COLLABORATION_PROTOCOL.md`
6. `docs/ai/work-orders/WO-STAB-009-PROPOSAL.md`
7. `docs/ai/prompts/GPT56-REVIEW-PR29-REMEDIATION.md`
8. `docs/ai/prompts/GPT56-REVIEW-PR29-REMEDIATION-2.md`
9. **this file**: `docs/ai/prompts/GPT56-REVIEW-PR33-REMEDIATION.md`
10. `reports/schema-snapshot-live.md` — especially the five provider-safe tables

Then inspect the actual PR #33 diff and the current migrations after the 2026-08-03 schema snapshot.

## GPT RE-REVIEW RESULT ON PR #33

The remediation-2 fix already in PR #33 is valid for the three intended findings:

- `fuel.dispense_log.fuel_type` removed;
- `garbage.collection_log.waste_type` removed;
- stale `wastewater.threshold_alert.severity` removed.

The five new remediation-2 tests are meaningful. GPT independently restored the pre-remediation-2 field list in an isolated review worktree and reproduced **exactly 5 failures**, including captured provider-body leakage of:

`ผู้ป่วย สมชาย ใจดี HN 12345`

After restoring PR #33 code, focused tests returned **21/21 PASS**.

GPT also independently ran:

- full Vitest: **200/200 PASS**;
- build: **PASS**;
- lint: **12 warnings / 0 errors**;
- `git diff --check`: **clean**;
- exact PR #33 GitHub `smoke`, `scripts`, and both `notify` checks: **SUCCESS**;
- PR #33 remote head at review: `44c35ee8d08863d88243da99c6ea851ac98b7d7d`, merge state CLEAN.

Despite those green gates, PR #33 is **CHANGES_REQUIRED** because the claimed all-five-profile audit is incomplete.

## NEW BLOCKING FINDING — 12 STALE `wastewater.reading` SAFE-FIELD KEYS

`TABLE_SAFE_FIELDS["wastewater.reading"]` still contains these 12 keys:

- `do_inlet`
- `do_tank`
- `do_outlet`
- `ph_inlet`
- `ph_tank`
- `ph_outlet`
- `tds_inlet`
- `tds_tank`
- `tds_outlet`
- `temperature`
- `sludge_level_cm`
- `wastewater_out`

They are **not columns in the current live `wastewater.reading` schema** recorded in `reports/schema-snapshot-live.md` (introspected from ENV_DB on 2026-08-03), and repository search finds these names only in the annotation safe-field/test area rather than a real schema/write contract.

The live snapshot shows the actual `wastewater.reading` fields use names such as:

- `tds_aeration`
- `temp_aeration`
- `tds_before_discharge`
- `ph`
- `do_aeration`
- `do_sedimentation`
- `do_before_discharge`
- `sv30`
- `free_chlorine`
- `wastewater_in`
- `wastewater_discharged`
- `system_operating`

Migrations after the 2026-08-03 snapshot do not add the 12 stale fields to `wastewater.reading`.

This is the same class of dormant allowlist hazard that PR #33 correctly fixed for `severity`: a static allowlist entry with no enforceable current schema contract can silently expose a future same-named free-text field.

It is also an immediate boundary weakness for any caller that passes a row object containing one of those keys, because `projectSafeRow()` authorizes by field name and does not type-validate against the DB schema.

GPT independently proved the current PR #33 head will put arbitrary non-regex identifying text into the provider body if it appears under stale `ph_tank`:

`ph_tank = "ผู้ป่วย สมชาย ใจดี HN 12345"`

A temporary reviewer assertion `body.not.toContain("สมชาย")` failed, and the captured provider request contained the full `ph_tank` value. The reviewer test modification was immediately restored; review worktree tracked diff returned clean.

## ROOT CAUSE

The remediation-2 audit correctly removed three newly identified unbounded/stale entries, but it treated the pre-existing `wastewater.reading` profile as schema-backed without diffing every profile key against the actual live schema.

The PR #33 handoff itself records the reusable rule:

> allowlist entries for columns that do not exist are latent hazards; profiles must be diffed against the live schema.

That rule must also be applied to the remaining `wastewater.reading` keys.

## REQUIRED REMEDIATION

Use the **smallest fail-closed correction**.

1. Remove all 12 stale keys listed above from `TABLE_SAFE_FIELDS["wastewater.reading"]`.
2. Do **not** add replacement metrics merely to preserve payload richness. Adding new provider-visible fields is a separate authorization decision and is not required to close this finding.
3. Keep only the current already-allowlisted fields that have an enforceable current schema type. At the reviewed state these include:
   - `id` — uuid
   - `reading_date` — date
   - `free_chlorine` — numeric
   - `sv30` — numeric
   - `wastewater_in` — numeric
   - `wastewater_discharged` — boolean
   - `system_operating` — boolean
4. Re-run the all-five-profile audit against `reports/schema-snapshot-live.md` plus later migrations. Every remaining allowlist key must map to an actual current column and a structurally bounded type/write contract.
5. Preserve the valid remediation-1 and remediation-2 removals.

Do not solve this by adding a patient-name regex or by assuming intended numeric semantics for fields that have no current schema contract.

## RED-FIRST REGRESSION REQUIREMENTS

Before the production fix, add or adjust deterministic tests so the stale-key defect is demonstrably RED.

At minimum:

1. replace the existing `ph_tank` "safe field" test fixture with a real current schema-backed safe field (for example `free_chlorine` or `sv30`);
2. add a row containing `ผู้ป่วย สมชาย ใจดี HN 12345` under stale `ph_tank` and prove the current code projects/sends it before the fix;
3. after the fix, prove `projectSafeRow()` omits `ph_tank` and the captured provider body contains neither the key nor `สมชาย`;
4. preferably cover all 12 stale keys in one deterministic profile-contract regression so reintroducing any one of them fails;
5. keep all existing remediation-1 and remediation-2 tests green.

Show RED before the production change and GREEN after it.

## ALL-FIVE-PROFILE AUDIT GATE

Audit these profiles after the fix:

- `wastewater.reading`
- `carbon.reading`
- `fuel.dispense_log`
- `garbage.collection_log`
- `wastewater.threshold_alert`

For **every allowlisted key**, record:

- current live-schema column exists: YES/NO;
- current DB type;
- whether arbitrary free text can be stored through any current write path;
- disposition: KEEP / REMOVE.

No stale/nonexistent field may remain in a positive provider-safe allowlist.

If actual schema has changed since the snapshot, prove that from migrations/live evidence rather than inference.

## MUST PRESERVE

Do not regress:

- runtime `ai_scope` ∩ static-profile intersection;
- `patient_safe=true` + `is_enabled=true` requirement;
- unknown/unmapped table fail-closed behavior;
- ambiguous bare table-name fail-closed behavior;
- `ai_scope` read-error zero-provider-call behavior;
- unknown-column omission;
- pre-prompt projection;
- refusal-message raw-row protection;
- email/phone/Thai-ID scrubber as defense-in-depth;
- `color_desc` / `smell_desc` / `note` exclusion;
- `fuel_type` exclusion;
- `waste_type` exclusion;
- `severity` exclusion.

## ALLOWED SCOPE

Prefer changes only in:

- `frontend/src/lib/admin/annotate-boundary.ts`
- `frontend/src/lib/admin/annotate-boundary.test.ts`
- existing SSoT/handoff/repo-health files required by repository protocol.

Read schema/migrations/import paths for evidence. Do not broaden into DB migrations, UI redesign, import redesign, or unrelated cleanup.

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

Required gates before returning to GPT:

1. stale-field regression RED before fix;
2. focused boundary tests GREEN;
3. full `npm test`;
4. `npm run build`;
5. `npm run lint`;
6. `git diff --check`;
7. full Playwright if locally available; classify tool/transport failures accurately;
8. all-five-profile schema audit table with every allowlisted field reconciled to actual schema;
9. inspect the final remote PR #33 diff;
10. verify final PR HEAD equals the pushed/review-requested SHA;
11. verify GitHub CI on that exact SHA.

Never print or commit real secrets. Use non-secret dummy env only if required by the test harness.

## SSoT / RECONCILIATION

GPT reviewer coordination docs may land on `main` while your GLM limit is paused.

Before final push/handoff:

1. fetch current `origin/main`;
2. integrate the latest reviewer SSoT additively into the PR #33 branch;
3. if `CURRENT-WORK.md`, `HANDOFF.md`, or repo-health conflicts, preserve both historical GLM execution evidence and the newer GPT `CHANGES_REQUIRED` review record;
4. update current status to `RE-REVIEW_REQUESTED` only after the new stale-profile finding is fixed and verified.

Do not erase the GPT reviewer finding merely to resolve a merge conflict.

## STOP CONDITION / HANDOFF

When complete:

- push the updated existing PR #33 branch;
- keep using PR #33;
- set WO-STAB-009 state to `RE-REVIEW_REQUESTED`;
- record exact new HEAD, RED/GREEN evidence, full gates, all-five-profile audit, and CI;
- **STOP**;
- do not merge;
- do not start deferred work.

Final handoff format:

```text
GLM PR33 REMEDIATION RESULT — WO-STAB-009
STATUS: RE-REVIEW_REQUESTED | CHANGES_REQUIRED | BLOCKED
BRANCH: fix/p1-annotate-phi-boundary-remediation-2
HEAD:
PR: #33
FILES CHANGED:
STALE-FIELD RED PROOF:
GREEN / FULL GATES:
ALL-FIVE-PROFILE SCHEMA AUDIT:
REMOTE DIFF / CI:
SSoT RECONCILED:
REMAINING RISKS:
NEXT OWNER: GPT 5.6 Sol reviewer / merge owner
```
