# SEC-DEPS-001 - frontend dependency security remediation

Status: IMPLEMENTING
Owner: GPT-5.6 Sol
Branch/worktree: `fix/security-deps-001` / `A:\\GitHub\\envww-security-deps-001`
Base: `origin/main@34d656888f589a6e86adc9ce83a5e69959c871f0`

## Goal

Remove the verified frontend npm security findings without `npm audit fix --force`, preserve import/router/PDF behavior, and harden PDF text extraction so uploaded PDFs cannot execute embedded scripting.

## Upstream / Grill-with-docs evidence

- `pdfjs-dist` GHSA-hq66-cqwq-w95j: affected `>=5.6.83 <6.2.108`, patched `6.2.108`; `enableScripting` defaults true and the upstream workaround is `enableScripting: false` or CSP. ENV directly parses user-selected PDFs, so this is reachable and HIGH priority.
- React Router GHSA-qwww-vcr4-c8h2: affected `>=7.12.0 <7.18.2`; patched `7.18.2`. Upstream says only unstable RSC APIs are affected; ENV uses BrowserRouter/client routing and repository search found no RSC APIs, but a compatible patch removes the vulnerable package line.
- DOMPurify GHSA-55q2-fjhq-7xh7: `<=3.4.12`, patched `3.4.13`; jsPDF accepts a compatible newer transitive version.
- brace-expansion GHSA-mh99-v99m-4gvg / GHSA-rgw5-rvv9-x895: patched `1.1.18` and `2.1.4` for the versions present through ExcelJS/archiver.
- uuid GHSA-w5hq-g745-h8pq: affected `<11.1.1`; advisory affects v3/v5/v6 buffer APIs, while ExcelJS source uses `uuid.v4()`. Scratch override to `uuid@11.1.1` passed ExcelJS workbook write/read + conditional-format smoke.
- PostCSS finding is patched by `8.5.26`; nanoid transitive finding is patched by `3.3.18`.
- Scratch package-lock simulations outside the repo reached production audit 0 and full audit 0 without force/downgrade.

## Owned mutable scope

- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/src/lib/import-engine.ts`
- `frontend/src/lib/import-engine.security.test.ts` (new)
- `docs/work-orders/SEC-DEPS-001.md`
- `docs/ai/handoffs/SEC-DEPS-001-SOL.md` (new at checkpoint)
- `docs/ai/CURRENT-WORK.md` (bounded coordinator state)
- `docs/ai/DEFECT-MEMORY.md` only after PR #49 is merged and this branch integrates that main; it is temporarily no-touch while #49 owns the file
- `MIGRATION.md` claim row only

## Forbidden / no-touch

- `.serena/**`, secrets or real hospital data
- database migrations/schema/RLS/carbon contracts
- module UI pages other than the owned import engine security behavior
- PR #49 workflow/WO/report files
- unrelated dependency upgrades/refactors or warning suppression

## Planned remediation

1. Add RED regression proving PDF.js receives `enableScripting: false`.
2. Set `enableScripting: false` in PDF text extraction.
3. Upgrade `pdfjs-dist` to the patched 6.2.108 line and `react-router-dom` to 7.18.3.
4. Upgrade PostCSS to 8.5.26.
5. Refresh compatible transitive DOMPurify, brace-expansion and nanoid lock entries.
6. Override ExcelJS's uuid to 11.1.1 only if the repository installation/build/import smoke confirms compatibility.
7. Never use `npm audit fix --force` or downgrade ExcelJS.

## Acceptance / verification

- RED security test fails before the source fix; GREEN afterward.
- `npm audit --omit=dev` = 0 vulnerabilities.
- full `npm audit` = 0 vulnerabilities.
- ExcelJS XLSX write/read + conditional-format smoke passes with the resolved uuid.
- focused import-engine security tests PASS.
- full Vitest, typecheck, lint (no new warnings), build PASS.
- focused Bulk Import / auth/router E2E and full Playwright PASS where practical.
- `git diff --check` PASS and lockfile diff is reviewed.
- independent exact-diff review before merge; exact-head CI/E2E; post-merge fetch/test/E2E/Pages verification.

## Parallel ownership

PR #49 currently owns its workflow/runtime-checker/report remediation plus `docs/ai/DEFECT-MEMORY.md`. `SEC-DEPS-001` will not mutate that shared file until #49 merges and this branch integrates the resulting main; all current mutable Security production files otherwise remain non-overlapping.
