# ENV-MOBILE-005 - Garden mobile convergence

Date: 2026-08-28
Status: RE-REVIEW_REQUESTED
Owner: GPT-5.6 Sol
Branch/worktree: `feat/env-mobile-005-garden` / `A:\GitHub\envww-review-mobile-001`
Base: `origin/main@19eb31ff725e746a1e5856db5c9e86badd1c725b`
Contract: `docs/work-orders/ENV-MOBILE-005-GARDEN.md`

## Activation checkpoint

- Fuel (`ENV-MOBILE-004`) is closed on main; no production work order overlapped at activation.
- Garden was selected before Garbage because both share the same mobile layout/touch pattern, while Garbage also has dual `waste_type`/`segregation_type` and manifest/compliance semantics that deserve a separate Core audit before responsive mutation.
- Mutable production file is only `frontend/src/pages/GardenPage.tsx`; focused regression file is `frontend/tests/e2e/garden-mobile.spec.ts`.
- `frontend/src/lib/garden.ts`, schema/RLS/carbon/shared UI/AppShell/other modules are read-only.
- Actual ENV schema confirms Garden extension fields; A-Wiki's pending-extension note is stale and not used as authority.
- `.serena/` remains protected/untracked and untouched.
- Next step: establish deterministic phone-width RED/baseline before production edit.

## RED / baseline evidence

At activation head `1fce5132f7e667f9324a1ff0eca9110c73d9f2f1`, focused Garden baseline ran with retries 0 / worker 1: **2 PASS / 3 RED**.

- phone control x-delta = 154 px;
- delete width = 19.125 px (<44);
- first semantic label lookup resolves 0 controls and source shows the same unassociated label pattern for all nine controls;
- history/document containment already passes at 360 px;
- desktop density already passes at 1024 px.

The production page remained untouched. The implementation seam is therefore limited to phone grid composition, page-local label/control associations, and the delete touch target.

## Implementation checkpoint

Production checkpoint: `356334641fb15b5c399579dc7cde9f5640cdbb90`.

- `GardenPage.tsx` phone grid: `grid-cols-1 sm:grid-cols-2 md:grid-cols-4`; larger-screen density preserved.
- All nine visible Garden controls have stable page-local IDs with matching `Field htmlFor`.
- Delete action uses the existing `--touch-min` minimum; shared Button/Input primitives were not changed.
- History table was deliberately left unchanged because baseline containment already passed.
- `frontend/src/lib/garden.ts`, schema/RLS/carbon/shared shell/Garbage/other modules were not edited.

## GREEN verification

- focused `garden-mobile.spec.ts`: **9/9 PASS**, worker 1, retries 0;
- full Playwright: **92/92 PASS**, 2 workers, retries 0;
- Vitest: **202/202 PASS** across 15 files;
- standalone `tsc -b`: PASS;
- production build: PASS (existing Vite plugin/chunk advisories only);
- lint: **12 pre-existing warnings / 0 errors**; targeted Garden page/spec lint: 0/0;
- `git diff --check`: PASS;
- screenshots/viewport coverage: 360, 390, 430, 768, 1024;
- Pixel 7 touch path: PASS;
- keyboard Tab sequence + Enter Save: PASS;
- first mocked save error preserves values; failed/retry POST bodies are equal and match the complete null-aware `GardenInput`, including `location_id: null` and `photo_path: null`.

All representative rows are synthetic E2E evidence, never production operational/environmental data.

## Independent review and remediation checkpoint

Fresh review of exact original PR head `39f25a92c0bbd10365c618c4477d4cca34f52f1f` returned `CHANGES_REQUIRED` in review `PRR_kwDOTN3Mzc8AAAABLSqMwQ`:

- AppShell's hidden document overflow made the original document-only containment assertion false-green; at 320/360 px the table/action escaped the Garden card and the complete delete action was not locally reachable.
- The schema-required `round_date` could be cleared and POSTed as an empty string without a persistent associated error or focus recovery.

Regression-first remediation produced **4 FAIL / 8 PASS** before production mutation. Checkpoint `e137cd468f628961dcfb697f0470cb3da76062bd` then added a named local horizontal-scroll region with keyboard ArrowRight support and a page-local required-date zero-POST/error/focus guard.

Fresh GREEN evidence is focused Garden **12/12 PASS**, full Playwright **95/95 PASS**, Vitest **202/202 PASS**, standalone typecheck/build PASS, lint **12 baseline warnings / 0 errors**, targeted lint 0/0, and `git diff --check` PASS. Coverage includes local boundary/table/action geometry at 320/360/390, keyboard local-scroll reachability, desktop no-unnecessary-clipping, and corrected-date valid save. All Garden REST remains mocked/no-real-write.

## Codex continuation contract

Start from repository SSoT and actual remote state, not chat memory.

1. Repo/worktree: `A:\GitHub\envww-review-mobile-001`; branch `feat/env-mobile-005-garden`.
2. Fetch `origin/main` + the feature branch; verify exact pushed head and no protected dirty state beyond untouched `.serena/`.
3. Read `AGENTS.md`, `docs/ai/CURRENT-WORK.md`, this handoff, and `docs/work-orders/ENV-MOBILE-005-GARDEN.md`.
4. Review exact diff against current main; production ownership is Garden page only and test ownership is Garden E2E only. Do not broaden into `lib/garden.ts`, schema/RLS/carbon/shared shell/Garbage.
5. Rerun focused Garden Playwright with retries 0; inspect exact-head GitHub CI. Any code-changing push invalidates prior evidence and requires fresh verification.
6. Return `APPROVED` or `CHANGES_REQUIRED`. If approved, merge using the exact reviewed head.
7. After merge: fetch main, verify merge ancestry, post-merge `test` + E2E + Pages run against exact merge SHA, verify Pages deployment exact SHA, and live-smoke `/garden` at about 390x844 with all REST mocked/no real writes.
8. Close Garden in a docs-only checkpoint (`CURRENT-WORK=IDLE`, claim complete, WO/handoff/roadmap/graph closure plus defect-memory entry for the hidden-overflow false-green class). Only then may Garbage be activated under a fresh WO/claim/audit.

## Stop gate

Remediation owner stops at `RE-REVIEW_REQUESTED`. Fresh independent reviewer owns the next gate.
