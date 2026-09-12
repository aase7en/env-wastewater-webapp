# ENV-GOV-FAST-001 โ€” Risk-adaptive fast workflow

Status: REVIEW_REQUESTED
Owner: GPT-5.6 Sol / architecture-integrator
Risk: STANDARD (governance/docs; no production runtime mutation)
Base: `origin/main@a92bfec2ffd705bec2a899995026d913412d1f52`
Branch: `docs/env-fastpath-governance-001`
Worktree: `A:\GitHub\envww-fastpath-governance-001`

## Objective
Reduce ENV execution latency/ceremony while preserving authority, ownership, safety, data honesty and exact-head verification. Reuse the existing Operating Map + Engineering Loop; do not create a second workflow/SSoT.

## Authorized source
Explicit user instruction dated 2026-09-13 authorizes this workflow/governance optimization. Existing `ENV-COORD-002` remains independently owned and untouched.

## Mutable scope
- `AGENTS.md`
- `docs/ai/PROJECT-OPERATING-MAP.md`
- `docs/ai/ENV-ENGINEERING-LOOP.md`
- this Work Order

## Forbidden scope
- `docs/ai/CURRENT-WORK.md` coordination registry
- `docs/work-orders/ENV-COORD-002.md` and `docs/ai/handoffs/ENV-COORD-002-GLM.md`
- `scripts/env_coordination_guard.py` and its tests
- `.github/**`, `frontend/**`, `supabase/**`, `data/**`, production/runtime behavior

## Acceptance
1. FAST/STANDARD/HIGH-RISK routes are explicit and risk-adaptive.
2. STANDARD/HIGH-RISK candidate freeze enables independent review + CI fan-out/fan-in.
3. Anti-loop rules cover no manual continue, selective tests, no moving-target review, batched repair, focused re-review, root-cause mode, bounded CI polling, non-overlapping worker lanes, meaningful-boundary checkpointing and automatic authorized merge.
4. Existing ENV safety/data/ownership invariants are not weakened.
5. New session can route from repository artifacts without chat memory.

## Verification
- inspect exact diff + `git diff --check`
- deterministic docs-link/path checks for changed references
- independent reviewer not authoring the change
- GitHub remote diff + applicable CI on exact PR head
- expected-head merge and post-merge main verification

## Checkpoint
Before review freeze exact candidate SHA and record evidence here. After merge record merge SHA, CI/review status and one next safe action (if any).

## Pre-freeze evidence
- git diff --check PASS.
- deterministic doc invariant check PASS (6 required fan-out/anti-loop markers).
- changed scope is governance docs + this Work Order only; production/runtime/CI/ENV-COORD-002 untouched.
- PowerShell heredoc check attempt failed at shell parse only; corrected by using a temporary Python script (no repo defect, no repo mutation from the failed command).
