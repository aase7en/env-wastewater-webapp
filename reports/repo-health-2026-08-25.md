# Repo Health Report — 2026-08-25

Branch: `docs/repo-health-100`. Base: `origin/main` `b54900a`.
Purpose: durable record of the full-repo quality audit + the AGENTS.md
rule-coverage check requested for this lane. Facts below cite their
sources; nothing here authorizes new work by itself.

## Verdict

Healthy with a bounded, explicitly-parked backlog. All P0 stabilization
items are fixed and merged; the active P1 queue is fully implemented and
sitting at `REVIEW_REQUESTED` (2 PRs awaiting GPT review); the security
audit fixes (AUDITFIX-A/B/C) are applied live and closed; every deferred
lane is recorded as deferred rather than silently forgotten.

## Merged and done (verifiable on main)

- **Migration Phases 1–2** — 907/907 rows migrated (2026-07-05; `MIGRATION.md`).
- **AUDITFIX-A / C / B** (2026-08-10) — missing audit triggers, append-only
  admin audit policies, AI-reject logging. Applied live + probe-verified +
  closed in `MIGRATION.md` close-notes.
- **EQ-1..EQ-5, WO-STAB-004/005, WO-STAB-007** — merged 2026-08-11..08-22
  (`MIGRATION.md` close-notes; Review Queue in `docs/ai/CURRENT-WORK.md`).
- **WO-UX-SCALE-001 (#15), Digital Twin foundation (#14), DT-VIS-P001 (#23),
  WO-UX-AN-P001 (#21)** — approved + merged (`docs/ai/CURRENT-WORK.md`
  Review Queue, checkpoints recorded there).
- **P1 work-order proposals + queue activation (#26, #27)** — merged.
- **Uthai activated-sludge process knowledge (#28)** — merged; now a
  mandatory pre-read gate in `AGENTS.md` for wastewater-process work.
- Digital Twin 3D + UX-scale typography are live in production.

## In flight — GPT review outcome update 2026-08-26

| WO | PR | Checkpoint | State |
|---|---|---|---|
| WO-STAB-009 — annotateRow PHI/provider boundary | #33 (open; PR #29 historical merge) | GPT-reviewed `44c35ee` | **CHANGES_REQUIRED** — PR #33 validly removes `fuel_type`, `waste_type`, and stale `severity`, but 12 additional `wastewater.reading` positive-allowlist keys are absent from the live schema; GPT reproduced captured-provider leakage through stale `ph_tank`; remediation: `docs/ai/prompts/GPT56-REVIEW-PR33-REMEDIATION.md` |
| WO-STAB-006 — alert unread idempotency | #30 | `8af33dc` (+docs `941f6d7`) | **APPROVED / MERGED** — merge `72bd8f6088b177fb28017beda95c70a778d872e1` |

PR #29 remains historical merged state. Open PR #33 is the current WO-STAB-009 implementation continuation and is **CHANGES_REQUIRED** at GPT-reviewed head `44c35ee8d08863d88243da99c6ea851ac98b7d7d`. GLM 5.3 MAX resumes the same branch/PR when capacity returns, integrates latest reviewer SSoT from `main`, executes `docs/ai/prompts/GPT56-REVIEW-PR33-REMEDIATION.md`, and stops at `RE-REVIEW_REQUESTED`; GPT remains independent review/merge owner. PR #30 is closed.

## Explicitly deferred / NOT active

- `WO-STAB-008` — NotificationBell UI work, shared with the Codex visual lane.
- `DT-VIS-P002` / `DT-VIS-P003`, `UX-FLOW-P001`, `ENV-INT-P001` — visual /
  external-API lanes (GPT/Codex ownership per collaboration protocol).
- P2 backlog from `reports/code-review-2026-08-12.md` (~10 items).
- `--topbar-h` token reconciliation (visual-lane cleanup).
- `v_unified_co2e` materialization (MV-1) — deliberately skipped: single
  caller, one fetch per page load, no polling; a VIEW is adequate at this
  load. Revisit only with evidence of real load.

## Test baselines (at PR #30 head)

- Vitest **179/179** · Playwright **48/48** · oxlint **12 warnings / 0 errors**
  (baseline) · `tsc -b && vite build` clean · `git diff --check` clean.
- GitHub CI on PRs: `smoke` + `scripts` + `notify` all green.

## AGENTS.md rule-coverage audit (second deliverable of this branch)

Already present on main (kept as-is — existing rules are good):

- SSoT reading order (PROJECT-BRIEF → CURRENT-WORK → HANDOFF → master plan → domain folder)
- Repository freshness gate (fetch `origin/main`; never blindly clean/reset/stash user files)
- `11-UTHAI-ACTIVATED-SLUDGE-PROCESS-KNOWLEDGE.md` mandatory pre-read for wastewater/sludge/simulation work
- Data policy (`data/raw/`, `.env`, project id)

Gaps filled by this branch:

1. `docs/agent-handoff/AI_COLLABORATION_PROTOCOL.md` was missing from the
   reading order — an agent reading only `AGENTS.md` never learned the
   multi-agent rules existed.
2. No consolidated "binding rules" section: PHI boundary, two-track
   ownership (Track F visual / Track Z logic), one-writer-per-file,
   implementer-never-merges-own-PR / stop-at-`REVIEW_REQUESTED`,
   data-honesty invariants (Unknown ≠ Zero/Normal/Stopped; latest ≠ live;
   simulation must be labeled), พ.ศ. date convention, git-safety for
   untracked user files. These rules existed but were scattered across
   protocol/design docs and chat history.
3. Stale header ("future FastAPI/frontend") — the frontend is built and
   deployed; header now states what the repo actually is.

## Next actions (no new authorization implied)

1. When GLM 5.3 MAX capacity returns, resume existing PR #33 and execute `docs/ai/prompts/GPT56-REVIEW-PR33-REMEDIATION.md`: integrate latest `origin/main`, remove the 12 stale `wastewater.reading` allowlist keys, prove stale-key RED→GREEN, re-audit every allowlisted key against live schema + later migrations, run full gates, update SSoT, push, and stop at `RE-REVIEW_REQUESTED`.
2. GPT independently re-reviews the exact updated PR #33 head and merges only if every positive provider-safe key has an enforceable current schema contract and all applicable gates are green.
3. After the P1 queue truly closes: WO-STAB-008 coordination with the Codex lane.
4. P2 backlog triage.
