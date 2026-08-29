# SEC-DEPS-001 handoff

Status: IMPLEMENTED_AWAITING_BASE_SYNC
Owner: GPT-5.6 Sol
Branch: `fix/security-deps-001`
Worktree: `A:\\GitHub\\envww-security-deps-001`
Original base: `origin/main@34d656888f589a6e86adc9ce83a5e69959c871f0`

## What changed

- Direct security patches: `pdfjs-dist ^6.2.108`, `react-router-dom ^7.18.3`, `postcss ^8.5.26`.
- Compatible transitive lock refresh: DOMPurify 3.4.14, brace-expansion 1.1.18 / 2.1.4, nanoid 3.3.18.
- ExcelJS transitive uuid is overridden to 11.1.1; runtime workbook/conditional-format round-trip passed.
- PDF import uses the patched PDF.js package and explicitly sets valid `enableXfa: false` on the text-only `getDocument()` path. The earlier `enableScripting` idea was rejected by TypeScript/upstream API and must not be reintroduced with a cast.
- Added focused Vitest boundary coverage and a real-browser synthetic PDF `/import` regression with zero REST writes.

## Evidence

- Baseline audits: production 7 vulnerabilities (4 high / 3 moderate); full 9 (5 high / 4 moderate).
- Final clean-install audits: production 0; full 0.
- Focused PDF Vitest 1/1 PASS; full Vitest 203/203 PASS.
- `tsc -b` PASS; production build PASS.
- Lint 12 existing warnings / 0 errors; targeted security files introduce no new error.
- ExcelJS + uuid 11.1.1 runtime write/read/conditional-format smoke PASS.
- Focused auth/router/import Playwright 12/12 PASS.
- Full Playwright `--workers=2 --retries=0`: 96/96 PASS.
- `git diff --check`: PASS.
- No real hospital data and no real REST write were used by the new PDF E2E.

## Ownership / stop gate

- PR #49 still owns its workflow/runtime report plus `docs/ai/DEFECT-MEMORY.md`; this Security branch must not modify that shared file until #49 merges and the branch integrates new main.
- `.serena/**`, schema/RLS/carbon/module UI remain no-touch.
- Do not merge Security from this checkpoint. After base sync, rerun gates and request fresh independent review.

## One next safe action

After PR #49 receives a fresh independent verdict and merges, fetch exact `origin/main`, integrate it additively into this branch, reconcile the shared defect-memory entry without dropping #49 history, rerun security/full gates, and advance to `REVIEW_REQUESTED`.
