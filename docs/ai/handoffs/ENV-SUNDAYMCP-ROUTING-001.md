# ENV-SUNDAYMCP-ROUTING-001 — Implementation Handoff

Status: IMPLEMENTATION_MERGED_VERIFIED / CLAIM_C1_REMAINS_CLAIMED_PENDING_QUIESCENCE_ATTESTATION. The active routing migration is on remote main; §4.2B ownership release is not yet authorized.
Task / claim: ENV-SUNDAYMCP-ROUTING-001 / ENV-SUNDAYMCP-ROUTING-001-C1, generation 1
Executor: GPT-6 integration via verified macOS SundayMCP; one authoring lane; no legacy Worker/Serena dispatch.
Repository: aase7en/env-wastewater-webapp
Worktree: /Volumes/MAC_WORK/DevWorkspace/Github/_worktrees/env-sundaymcp-routing-001-impl-20261113
Branch: docs/env-sundaymcp-routing-001
Actual implementation base: 8dd0c5ce031ecd39b553f340c376ad5b2ebc1d57 (claim-transition PR #179 merge on main)
Registry `base_sha` f60316ceff7459caebc7b18d112b0976dec32890 is the historical transition-proposal base, not the implementation start SHA (reviewer P3-1).
Claim-transition branch: docs/env-sundaymcp-routing-001-claim (separate from this implementation branch; reviewer P3-3).

## Gate evidence

- PR #179 exact-head independent GLM-5.3 read-only APPROVED at b320e806b025de9fd7acfe8a0c7ed3c5ec072352; review receipt on PR #179 (issuecomment-6850141600), 0 P1/P2, 3 informational P3.
- Claim-transition CI `scripts` and `notify` PASS; expected-head merge created 8dd0c5ce031ecd39b553f340c376ad5b2ebc1d57, verified on authoritative remote main.
- New claim retrieved from authoritative `main` with status CLAIMED, generation 1; Work Order and mutable/forbidden scopes match registry.
- Before editing, actual isolated implementation worktree was clean, branch and registered path matched, `origin/main`=8dd0c5c, claim base f60316c was an ancestor of HEAD.
- Deterministic `evaluate_mutation` with four edit paths, Work Order edit, and new handoff returned `SAFE_TO_MUTATE=True` (reason=None, policy=8dd0c5c, 6 allowed scope entries).
- Deferred ENV-BUILDING-REPAIR-001 claim is disjoint; original main `.tmp/` remains untouched.
- BOOTSTRAP_CONTROL routing-docs exception is explicitly owner-directed; no production data, frontend, migration, server policy, credentials, startup config or legacy service mutation.

## Intended docs-only changes

- AGENTS.md: add current SundayMCP Windows/macOS, GitHub, verified RDC fallback, legacy no-auto-dispatch, and connected != authorized guidance.
- docs/ai/PROJECT-OPERATING-MAP.md: replace obsolete active Worker/Serena responsibility row.
- docs/ai/tooling/AI-DEVELOPER-TOOLCHAIN.md: replace obsolete ACTIVE Worker/Serena row while preserving 2026-08-22 historical Codex config record.
- docs/ai/design/ENV-EXPERIENCE-MASTER-PLAN.md: replace active Serena/SunDay worker execution guidance without altering product/design strategy.
- docs/work-orders/ENV-SUNDAYMCP-ROUTING-001.md: record that claim was reviewed and merged before implementation.
- This handoff only; no changes to docs/ai/CURRENT-WORK.md or other forbidden paths.

## Verification and outstanding gates

- Targeted docs-only grep/schema checks: PASS for all four active routing documents; canonical OS tools, GitHub, verified RDC fallback, LEGACY states verified; table column format PASS and dated historical Codex note preserved.
- Guard regression at implementation candidate: `python3 -m pytest scripts/test_env_coordination_guard.py -q` PASS — 344 tests / 450 subtests. `git diff --check` PASS.
- Exact implementation candidate `394f3b35ee3f0fea756eca3e275f7ee8b691011f`; PR #180 independent GLM reviewer APPROVED at exact SHA (issuecomment-6850356749, zero P1/P2), hosted scripts/notify PASS; expected-head merge commit `43be7e6f67fc556a05ccaefb4b66ebf949506808`, verified from GitHub main. Post-main scripts PASS; notify SKIPPED, not claimed as PASS.
- No frontend E2E warranted for docs-only change; no production/live verification requested.
- Never assume ChatGPT Project Instructions/Sources were updated merely because repository instructions are changed; owner reported manual updates separately.

## Reviewer P3 follow-through

- P3-1 addressed in this handoff by recording the exact implementation merge-base separately from proposal base.
- P3-2 scoped review must confirm only the four active routing docs plus claimed WO/handoff, not production or guard-server policy.
- P3-3 transition and implementation branches explicitly distinguished here.

## One next safe action

Maintain the existing claim C1 scope lock. Obtain a valid §4.2B Quiescence Attestation (claim identity, generation, holder, latest lifecycle evidence, admissions high-water mark, active_admissions=0 and resolved effects) or an explicit owner-approved risk/exception resolution before proposing any CLOSED claim transition. No auto-release.

## Post-merge reconciliation — 2026-11-13

- GitHub main `43be7e6f67fc556a05ccaefb4b66ebf949506808` verified from remote; repository AGENTS.md, Operating Map, Toolchain and Experience Master Plan all read directly from this SHA and show consistent SundayMCP-first routing.
- Both PR #179 and PR #180 MERGED after separate GLM independent exact-SHA reviews and hosted CI; no production/runtime configuration or historical handoffs changed. Recorded primary evidence is PR #179 issuecomment-6850141600 and PR #180 issuecomment-6850356749.
- Current C1 claim remains CLAIMED in `docs/ai/CURRENT-WORK.md`; do not write a competing registry or silently release it. Repo's §4.2B requires stronger quiescence evidence than available tool snapshots. SundayMCP lane list empty, terminal session list empty, implementation worktree clean; admission high-water mark and active_admissions were NOT exposed. Separate old READ-ONLY transition-worktree execution `exec-mwetct9n-p5v48v8x` remained PENDING_SCOPE/no PID/cancel requested, not evidence of mutation success or formal quiescence.
- No active implementation mutation or pending code PR remains for routing docs. This handoff records verification and the exact remaining governance blocker for a fresh agent. Project-level ChatGPT UI updates remain owner-reported, not tool-verified.
