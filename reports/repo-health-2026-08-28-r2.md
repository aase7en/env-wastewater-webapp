# ENV Repo Health R2 — 2026-08-28

Status: CLOSED / VERIFIED
Branch: `docs/repo-health-100-r2`
Original base: `origin/main@19eb31ff725e746a1e5856db5c9e86badd1c725b`
Current-base sync: `origin/main@34d656888f589a6e86adc9ce83a5e69959c871f0` via merge `ab38204`
WO: `docs/work-orders/REPO-HEALTH-100-R2.md`

## Goal and parallel boundary

This audit began in parallel with `ENV-MOBILE-005` Garden review and never edited Garden-owned code/tests/SSoT, `.serena/`, schema/RLS/carbon/data adapters, raw hospital data, or secrets.

Garden is now closed: PR #48 merged at `001ef532b1203b3bd2def7c28bdd6845a948dec8`, its post-merge test/E2E/Pages checks passed, and docs-only closeout PR #50 merged at `34d656888f589a6e86adc9ce83a5e69959c871f0`. PR #49 merged that current main into its branch before re-review. Its remediation contract now also owns a small workflow-runtime checker/test and one defect-memory entry.

## Closed remote clutter

PR #8 was a stale July draft that proposed an ENV `AGENTS.md` pointer to `A-Wiki/agent-skills/engineering/reasoning-standards/SKILL.md`. Current A-Wiki has no such file and no companion PR was found. The draft was documented and closed without merge to avoid a dead reference.

## Local checkout health

Primary checkout `A:\GitHub\env-wastewater-webapp` is `main@7d73814782f8475731d886f6826da5bc9af36c11`, 119 commits behind current `origin/main` at the 2026-08-29 re-audit checkpoint.
The primary checkout has no tracked diff but has extensive unknown untracked state (`.serena/`, design assets, firmware, docs, a migration and other files). Ownership is unknown. Per repository safety rules it is protected: no reset/clean/delete/blind stash/unsafe fast-forward was performed.

Current safe local execution uses isolated worktrees based on current remote state, including `A:\GitHub\envww-review-mobile-001` and `A:\GitHub\envww-repo-health-100-r2`.

## CI action-runtime defect

PR #48 exact-head E2E run `33184929519` emitted GitHub's Node 20 deprecation annotation for `actions/checkout@v4` and `actions/setup-node@v4`.

Source audit found five checkout-v4 references and two setup-node-v4 references. The app workflows already request Node 24, so the defect is the JavaScript action runtime rather than the project Node version.

Verified upstream on 2026-08-28:
- `actions/checkout` latest release is v7.0.1;
- `actions/setup-node` latest release is v7.0.0;
- current GitHub guidance is the Node-24 action generation.

The first review at exact SHA `3b61f1c3053e4d0cb8fc0e69a82aa6d18752420a` found the original conclusion was incomplete: green check-run `99035942437` still emitted a Node-20 warning for `astral-sh/setup-uv@v3`. The latest main Pages run also exposed the remaining artifact/deploy chain. Review `5056855963` therefore recorded `CHANGES_REQUIRED`; earlier prose claiming the annotation was absent is superseded.

Official upstream manifests verified on 2026-08-29 identify the Node-24-era replacements: `astral-sh/setup-uv` v10.0.1 at commit `20cfd1bf945f4377ade1205e4dbc17946fc9a30d`, `actions/upload-artifact@v7`, `actions/upload-pages-artifact@v5` (composite over upload-artifact v7), and `actions/deploy-pages@v5`. Because setup-uv has no moving `v10` tag, the workflow pins that exact verified commit. Independent manifest review also found three default changes that would otherwise alter behavior: setup-uv v10 enables cache automatically and defaults downloads to Astral's mirror, while upload-pages-artifact v5 excludes hidden files. The workflow therefore sets `enable-cache: false`, `download-from-astral-mirror: false`, and `include-hidden-files: true`, preserving the old cache/download path and the deployed `.nojekyll` file. Other inputs, triggers, permissions, project Node version, secrets and deployment semantics remain unchanged.
## Verification of CI-runtime slice

- All five workflow YAML files parse successfully with PyYAML.
- `actionlint` is not installed locally; recorded as unavailable, not a PASS.
- `actions/checkout@v4` remaining count: 0; checkout-v7 count: 5.
- `actions/setup-node@v4` remaining count: 0; setup-node-v7 count: 2.
- `uv run python scripts/test_split_sql.py`: PASS.
- Frontend dependencies installed with Node 24.15.0 / npm 11.12.1.
- Vitest with non-secret deterministic test env: 15 files / **202 tests PASS**.
- standalone `tsc -b`: PASS.
- lint: **12 existing warnings / 0 errors**.
- production build: PASS; existing chunk-size advisory only.
- `git diff --check`: PASS before review checkpoint.
- Current-base merge `ab38204` integrated `origin/main@34d656888f589a6e86adc9ce83a5e69959c871f0` without conflict; `origin/main...HEAD` still contains only four workflow files plus this WO/report.
- Current-base focused Chemical E2E: **7/7 PASS** (`--retries=0 --workers=1`).
- Current-base full Playwright: **95/95 PASS** (`--retries=0`).
- A first full-E2E attempt was invalidated because the Vitest-only dummy `VITE_SUPABASE_URL=https://example.invalid` leaked into Playwright and an orphan Vite process on port 5173 was reused. This mismatched the fixture's project-ref-specific Supabase storage key and caused cross-spec auth failures. After terminating only that owned orphan server and using the non-secret project-ref test URL plus `test-anon-key`, the Chemical focus and full suite passed. The invalid run is recorded as harness evidence, not product regression.
- Remediation RED proof against exact reviewed head `3b61f1c`: runtime checker exits 1 with exactly four mapped stale references (`setup-uv@v3`, `upload-artifact@v4`, `upload-pages-artifact@v3`, `deploy-pages@v4`).
- Remediation GREEN before push: runtime-checker tests **14/14 PASS**; repository runtime scan PASS for **5 workflow files**; workflow YAML parse **5/5 PASS**; split-SQL regression PASS; diff-check PASS. Frontend source is unchanged by this remediation; exact-head GitHub E2E remains the release proof after push.

The first Vitest attempt in this isolated worktree correctly failed two module-load suites because no `.env` was copied in. No secret was copied. The suite was rerun with dummy test-only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` and passed 202/202.

## Dependency security baseline

Fresh `npm ci` reports 9 total audit findings; production-only audit reports **7 findings: 4 high, 3 moderate**. Do not run `npm audit fix --force` blindly.
Notable production-tree findings:
- `pdfjs-dist 6.1.200`: HIGH arbitrary-JavaScript advisory; npm current/fixed line includes `6.2.108`.
- `react-router-dom 7.18.1` / `react-router 7.18.1`: HIGH CSRF advisory; fixed after 7.18.1 and npm current is 7.18.3.
- `exceljs 4.4.0` pulls `uuid 8.3.2`: MODERATE. npm audit's suggested `exceljs 3.4.0` is a breaking downgrade and is not accepted automatically.
- `jspdf 4.2.1` pulls vulnerable `dompurify 3.4.12`: MODERATE.
- vulnerable transitive `brace-expansion`: HIGH DoS.
- full tree additionally includes direct dev `postcss 8.5.19`: MODERATE; npm current is 8.5.26.

These require a separate dependency-security WO with focused PDF/import/router/regression evidence and lockfile review.

## Core data-integrity findings — routed separately

### Fuel

`frontend/src/lib/import-adapters/fuel.ts` accepts arbitrary text into `fuel_type`; DB column is unrestricted text. `carbon.v_unified_co2e` casts `fuel_type` to `carbon.source_type`. A non-enum imported value can therefore fail carbon-view evaluation. UI values alone do not close the import path.

### Garbage

Schema migration states `segregation_type` is canonical and `waste_type` is legacy. Current UI initializes `waste_type="ทั่วไป"` while `segregation_type="general"`; changing the dropdown later makes the fields equal. Import adapter writes only canonical `segregation_type`, while carbon rollup still branches on legacy `waste_type`. Imported infectious/recyclable rows can therefore be treated as general by the rollup fallback.
Both Core findings affect carbon/data truth and outrank Garbage visual/mobile polish. They need Core Engineering WOs, regression tests, and exact migration/view contract decisions rather than silent UI fixes.

## SSoT drift findings

Historical work-order files retain non-final status text even where the roadmap/main proves completion. Example: `ENV-ARCH-001.md` still says `REVIEW_REQUESTED`, while ROADMAP records PR #39 merged and the implementation commit is contained in main.

Some Mobile-001 sub-lane statuses are deliberate stop-state evidence and must not be globally rewritten without classifying lane-history versus current-state semantics. Reconcile stale status fields in a bounded SSoT-health pass after Garden closure, not concurrently with Codex edits to shared coordination files.

`WO-UX-AN-P001-GLM.md` still says `READY_FOR_IMPLEMENTATION` even though analytics components/tests exist in current main; source/commit history must be audited before deciding whether the WO status is stale or the implementation remains incomplete.

## Lint / code-health findings

Current lint baseline is 12 warnings / 0 errors. Higher-value follow-ups include:
- `AuthProvider.tsx` hook dependency warning — Core/auth correctness review;
- `EquipmentPage.tsx` missing effect dependency — potential stale-closure/reload behavior;
- `import-engine.ts` unreachable/dead `sendChatTurn` reference — Core/AI import + privacy path review;
- lower-risk structural/test/tool warnings in Toast, CSV import test, theme memo dependencies, and PWA icon script.

No warning was suppressed or weakened in this slice.

## Next bounded lanes

1. `SEC-DEPS-001`: integrate exact current `main` after PR #49, reconcile shared defect memory, rerun clean-install audits + PDF/import/router/full deterministic gates, then stop at fresh independent review before merge.
2. Fuel Core: repair the imported free-text `fuel_type` / `carbon.source_type` contract with regression-first evidence.
3. Garbage Core/data-contract audit and repair: reconcile canonical `segregation_type`, legacy `waste_type`, import, manifest/compliance, and carbon semantics before Garbage UI mutation.
4. Garbage responsive/mobile UI only after its Core contract is verified and merged.
5. Lint correctness lane, then agent-operations/SSoT coordination work and final repo-health audit as bounded non-overlapping work orders.
6. Re-audit the protected primary local checkout only with explicit ownership knowledge; never destroy unknown untracked files.

## Final closure — PR #49

Fresh independent GLM-5.3 MAX review **APPROVED** exact head `42e585a2e1e7780eb058cd32eecf03ebb246eabe`. The lead independently rechecked remote head/base, the 9-file diff boundary, runtime checker, mergeability and exact-head annotations before merge.

PR #49 merged with expected-head protection as `64aae63f4739e39528044c25d3e9f9145ffa04b0`. After fetch, current `origin/main` equals that merge SHA and contains the reviewed head. Exact-main evidence: `test` run `33272276256` SUCCESS; E2E run `33272276111` SUCCESS with **95/95 PASS**; Pages run `33272276131` SUCCESS for build/deploy/live static smoke; deployment `6159528625` SUCCESS for the exact merge SHA. Post-merge check annotations contain no Node-20 runtime warning.

The pre-merge one-off PFD keyboard flake notice remains a separate test-stability observation; the exact-main full E2E run was clean and no retry/suppression was introduced. The external review inbox file has been ingested into this canonical report/work order and is supporting evidence only.

**Result:** CI-runtime hygiene goal VERIFIED/CLOSED. Security dependency remediation is now the active serialized hygiene lane before Fuel/Garbage Core work.
