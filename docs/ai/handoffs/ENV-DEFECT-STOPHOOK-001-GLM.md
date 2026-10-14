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
