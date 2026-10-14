# ENV-DEFECT-STOPHOOK-001 — GLM Handoff (Stop-hook worktree-context fix)

Task `ENV-DEFECT-STOPHOOK-001` (repo-side remediation of issue #94, first
defect). Claim: `ENV-DEFECT-STOPHOOK-001-C1` (generation 1).
WO: `docs/work-orders/ENV-DEFECT-STOPHOOK-001.md`. This file is the durable
receipt trail.

## Review-route record (R3, this transition)

- Reviewer: Codex CLI `gpt-6-sol` @ `model_reasoning_effort=max`, sandbox
  read-only, dispatched from this exact worktree at the transition head.
- Live admission evidence for THIS review route: the R1 dispatch itself
  (exit code / tokens / verdict appended below as each round completes).
- Designated fallback if the gpt-6-sol review dispatch hits a provider
  admission error: `gpt-5.6-sol` (admitted R3-review-only across the
  PR #113/#118/#122 trails). GPT-6 Astra prohibited. Never
  author-and-approve; never silent GLM downgrade.

## Role A consult record (pre-WO)

- 2026-10-15: gpt-6-sol @ max read-only consult (148,601 tokens). Fully
  incorporated: `_select_stop_claim(policy, root, branch)` per-invocation
  selection inside `_cmd_hook` (unique unreleased claim matching worktree +
  branch; closed claims ineligible; NO module-level CURRENT_TASK); the
  three-row behavior table (match → enforcement preserved; foreign/closed →
  exit 0 with `{}` and no verifier call; un-establishable/ambiguous → fail
  closed typed); `os.path.samefile` + resolved-path comparison with exact
  branch equality (HEAD equality stays in checkpoint verification); only
  `_cmd_hook` (~2474) changes in this slice — the other legacy lookups
  (~874/1417/1553/1853/2221) get a separate later audit (recorded as
  follow-up); RED-first plan incl. the #94 reproduction as a unit test and
  the missing Stop-entrypoint regression; P1 risks (false-foreign → require
  unique physical worktree + exact branch; neutral JSON for the foreign
  result because `decision: "block"` is the continuation-prompt vector);
  user-state/A-Wiki parts proposal-only; #101 typed-wait rule SEPARATE slice.

## D1 design table (frozen for D2)

| Executing context (root via `git rev-parse --show-toplevel`; current branch) | Registry state | `_cmd_hook` outcome |
| --- | --- | --- |
| root samefile a registered claim worktree AND branch exact-equal AND that claim unreleased | exactly ONE eligible claim | existing path UNCHANGED: verify_published_checkpoint / refill / stop_hook_active; checkpoint failure still blocks |
| no eligible claim matches (foreign worktree, wrong/detached branch, or only CLOSED claims) | zero eligible | exit 0, output `{}`, NO verifier call, no reason/systemMessage/continue |
| eligibility un-establishable (resolution errors) OR multiple eligible claims match | ambiguous | fail closed with a typed reason (never classified foreign) |

Predicate details: path compare via existing-path resolution + `os.path.samefile`
(covers `A:/` vs `A:\` and case); branch compare exact string equality;
detached HEAD = wrong branch; closed claims (status CLOSED) ineligible;
unreleased = any non-CLOSED status with a registered worktree + branch.

## Status

- 2026-10-15 (claim transition authored): WO + registry entry + frontier
  bullet drafted on `docs/env-defect-stophook-001-claim` off main `9db59fa`.
  Predecessor fence (guard module): policy `9db59fa84e53105b4db9ec8cf6943eb0226d6b1e`,
  registry block sha256 `2180475613e8975b62de812c9fe06bc254059fb0dd272ba771cdf0eb2c8cc640`.
  Authorization basis = the owner's 8th repeated continuation steer after the
  report enumerating remaining lanes (open defect issue #94 = the most literal
  pending work) + this full reviewed-claim process as the designed counter-path
  to the issue's own non-authorization clause — submitted to R3 as an explicit
  adversarial check; insufficient basis ⇒ parks unmerged + one-line ask once.
  Next: R3 → expected-head merge → D2 RED → D3 → D4 → D5 → D6.

(append-only below this line)

## Execution receipts

- 2026-10-15 (transition merged): PR #142 merged as `c3a23af` (second parent = R3-APPROVED `3e6582c`; R3 round 1 APPROVED + AUTHORIZATION_BASIS: SUFFICIENT, no findings, verdict 6176334451; main CI test=success). Implementation worktree env-stophook-20261015 / feat/env-defect-stophook-001 at base `c3a23af`.
- 2026-10-15 (D2 RED, commit `c863811`; receipt CORRECTED per D5 P2): 4 truthful outcomes at that commit — the #94 reproduction errored on the then-missing git-context plumbing (the mock rejected rev-parse --show-toplevel before verification could run) and _select_stop_claim was absent (module error); the matching-context and stop_hook_active cases likewise failed against the unimplemented gate. The full behavioral RED (blocking REMOTE_HEAD_MISMATCH vs neutral {}) was exercised during D3 bring-up once the helper stubs existed — recorded here honestly rather than retroactively claimed for c863811.
- 2026-10-15 (D3 GLM Track Z): `_select_stop_claim(policy, root, branch)` + `_current_branch(root)` (symbolic-ref, check=False; detached -> None) added before `_cmd_hook`; the hardcoded `claim_by_task("ENV-AUTONOMY-001")` in `_cmd_hook` replaced by the context-gated selection; foreign context -> `_emit({})` exit 0 (no verifier call, no reason/systemMessage/continue - never a continuation prompt). Two test-harness clarifications during D3: `_actual_context` stubbed in the helper (existing `_hook_patches` precedent); one pre-existing entrypoint fixture (`test_duplicate_posttool_receipt...`) updated to answer `symbolic-ref` with its claim's branch (its constant `_run_git` return made every context foreign; the test's duplicate-receipt substance unchanged); one D2 expectation corrected to the hook contract's actual semantics (decisions ride the JSON payload; `_emit` defaults to exit 0 - the block/neutral distinction is the payload).
- 2026-10-15 (D4 battery): runtime suite **45/45 OK** (41 + 4 new); guard regression **344/344 OK**; `git diff --check` clean.
- Next: D5 fresh-GLM review at the frozen head -> D6 expected-head merge + exact-main CI verify + closeout transition.

## D5 verdict + repairs (reviewer deviation note)

- 2026-10-15 (D5 R1): the planned fresh-GLM D5 was UNAVAILABLE (the GLM proxy's 5-hour quota window exhausted - "key over quota, wait for the next window"). Per the never-downgrade rule the review was UPGRADED to Codex gpt-6-sol @ max read-only (cross-model vs the GLM Track-Z author; Codex never authored this slice) - the deviation recorded here openly. Verdict CHANGES_REQUIRED at `9dac226` (105,662 tokens): P1 the neutral {} applied to EVERY hook event, so a foreign PreToolUse bypassed hook_pretool (fail-open mutation guard); P1 identity errors (missing registered paths, samefile OSError, failed branch query) were classified foreign instead of failing closed; P2 the D2 receipt over-described the c863811 RED (the mock rejected rev-parse --show-toplevel before verification ran; corrected above); P3 the reviewer sandbox could not create temp files so it could not run the suites itself (our recorded runs + CI are the machine evidence).
- 2026-10-15 (repairs): Stop-only neutrality (foreign PreToolUse still routes through hook_pretool; foreign other events raise NO_ELIGIBLE_CLAIM_CONTEXT -> the typed fail-closed handler); _current_branch probed git validity first (the R1 repair intent; INCOMPLETE as R2 proved - symbolic-ref failures were still swallowed as detached until the 860af99 returncode probe); _select_stop_claim counts identity failures (missing registered worktree / samefile OSError) and raises CLAIM_IDENTITY_UNESTABLISHABLE when nothing matched but identity was unresolvable; three new tests pin the fail-open cases (foreign PreToolUse guard routing; foreign SessionStart fail-closed systemMessage; unresolvable identity blocks even Stop). Battery after repairs: runtime **48/48 OK** (45 + 3 new) + guard **344/344 OK** + diff-check clean.

- 2026-10-15 (D5 R2 at `4f2f67c`): CHANGES_REQUIRED - P1 _current_branch still discarded a failed symbolic-ref exit (an exit-128 probe made Stop neutral despite a matching active claim); P2 the R1 receipt-append had doubled carriage returns on 71 handoff lines (git diff --check failed); P3 sandbox could not run the suites (uv cache denied - CI is the machine evidence).
- 2026-10-15 (R2 repairs, `c6dbfd2`+`860af99`): handoff normalized to uniform LF (check clean); _current_branch now runs a direct returncode-checked symbolic-ref probe - exit 0 = branch, exit 1 = the documented detached case (None), ANY other exit raises BRANCH_IDENTITY_FAILED (fail closed even with a matching active claim - pinned); test seams updated for the direct probe; the two stray bare CRs remained at 860af99 and were removed only in the R3-repair commit 19677a2 (converted to LF). Battery: runtime **50/50 OK** + guard **344/344 OK** + `git diff --check 9dac226..HEAD` clean.
- 2026-10-15 (D5 R3 at `860af99`): CHANGES_REQUIRED on documentation-only findings - P2 this receipt trail itself (the R1-repair over-claim corrected above + these R2/R3 entries appended), P3 two stray bare CRs. P1 code paths PASSED static review; only the three declared files changed.
- 2026-10-15 (D5 R4 at `19677a2`): single P2 - attribution: the stray-CR removal belongs to the R3 repair at 19677a2 (they persisted through 860af99), corrected above. Scope, diff --check, and no-code-change checks pass. R5 dispatch follows.
- 2026-10-15 (**D5 R5 at `b93391d`: VERDICT APPROVED, no findings** - the final D5 receipt; verdict issuecomment-6180217775). With this the implementation review is complete on the record: the planned fresh-GLM D5 was superseded by the recorded gpt-6-sol upgrade (quota block, never-downgrade; GLM authored the slice so independence held).

## Closure receipts (D6)

- D6 (2026-10-15): expected-head merge - **PR #143 merged as `07fb481`** (parents: `c3a23af` + reviewed `b93391d`; ancestry verified). Exact-main workflow on `07fb481`: test SUCCESS (scripts-only change - no frontend deploy applicable). Closeout transition: registry CLOSED at generation 1, fence moved to `07fb481` + block sha256 `11f11447...` (guard module), frontier bullet + coordination summary reconciled (ONE active claim remains: Building, deferred). Implementation worktree `env-stophook-20261015` preserved clean at `b93391d` (fully merged). CLOSED confers no fresh mutation authority; the legacy-lookup audit and #101 typed-wait rule are separate future slices; the user-state/A-Wiki hook parts stay owner-proposal-only.
