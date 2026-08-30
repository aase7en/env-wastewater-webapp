# SEC-DEPS-001 handoff

Status: CLOSED
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

- PR #49/#52 are closed and current main is integrated; Security has reconciled the shared defect-memory history and may add only its bounded dependency-hardening lesson.
- `.serena/**`, schema/RLS/carbon/module UI remain no-touch.
- Do not merge Security from this checkpoint. Exact-head GitHub CI/E2E + fresh independent review are still mandatory.

## One next safe action

Push the reconciled checkpoint, inspect PR #51 actual remote diff and exact head, require GitHub exact-head CI/E2E, obtain a fresh independent Security verdict for that exact SHA, then merge only if APPROVED. After merge: fetch main -> verify ancestry -> post-merge tests/E2E/Pages/deployment/live smoke -> docs closure -> Fuel Core.


## Post-base-sync evidence

- Current main integrated: `origin/main@375cce37aadbefe5f777c41b5c89f3ae6a304f0f`; additive merge checkpoint `a19f7a86038b63b83dc9e15c4d80a2f4f6a523e2`; no conflict.
- Clean install PASS; production/full npm audit = 0/0 vulnerabilities.
- ExcelJS + uuid11 runtime smoke PASS; focused PDF Vitest 1/1; full Vitest 203/203; typecheck/build PASS; lint 12 baseline warnings / 0 errors.
- Synthetic PDF actual-browser import 1/1 PASS, zero REST writes/no real data; expanded auth/router/error/import/smoke E2E 19/19 PASS.
- Full local Playwright post-sync is intentionally **not claimed**: Worker transport lost the final summary. Exact-head GitHub E2E is the required final system-level proof.
- `git diff --check` PASS before SSoT reconciliation.
- Review target must be the exact pushed PR #51 head after this handoff/defect-memory checkpoint; pre-sync head `91cb332...` is superseded.


## Final closure - 2026-08-30

- Fresh GLM-5.3 MAX independent review: **APPROVED** for exact head `1d41e0896dd4a8d32532202e4b5f4ca0f70e4310`.
- Exact-head GitHub E2E: **96/96 PASS**.
- PR #51 merge commit: `4e8b4fe90354c3e25939c940a74e6ea47f3fbf26`; reviewed-head ancestry verified on `origin/main`.
- Post-merge: test `33296980433` SUCCESS; E2E `33296980446` SUCCESS; Pages/deploy/smoke `33296980442` SUCCESS; deployment `6163951586` SUCCESS.
- Security scope is closed. The next safe project action is the minimal Agent-Ops governance foundation, then Fuel Core.
