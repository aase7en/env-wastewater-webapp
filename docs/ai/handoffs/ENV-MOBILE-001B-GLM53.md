# ENV-MOBILE-001B — GLM-5.3 Verification Lane Handoff

Status: RE-REVIEW_REQUESTED
Date: 2026-08-28
Owner: GLM-5.3 (verification lane; see Ownership event below)
Branch: `feat/env-mobile-001`
PR: #40 (base `origin/main@08db62c821cf7b95aaeb373c603d77ccc4d9b98a`)
Dependency: `74550da24af09a5afe506d2c269de89cb6392092` (ENV-MOBILE-001A production checkpoint; verified ancestor of HEAD before mutation)
Lane base HEAD: `2b50b2cc3b5f840d93085e854366c472fdc3cc7d` (= `origin/feat/env-mobile-001` at lane start; 0 ahead / 0 behind)
Lane commit: the single `chunk(ENV-MOBILE-001B)` commit containing this handoff (plus a follow-up evidence-only commit recording post-push PR checks below).

## Ownership event (recorded for the reviewer)

While this GLM session was paused mid-lane, the coordinator recorded an
**uncommitted** `SOL_MAX_FALLBACK` reassignment in `MIGRATION.md` and this
lane's WO ("preserve the existing uncommitted `daily-form-mobile.spec.ts`
partial; do not discard or rewrite it from baseline"). On 2026-08-28 the user
directed this GLM session to finish the pending work. The uncommitted spec
partial was exactly the GLM work-in-progress; it was **preserved and completed
in place** — never reset, cleaned, or rewritten from baseline. The
coordinator's uncommitted fallback edits are preserved verbatim and are
committed by this lane only as the unavoidable staging consequence of updating
lane status (WO status line + claim row) in the same files. No other agent
edited the spec during the lane.

## Pre-mutation gate

- `git fetch origin main`; `origin/main` is an ancestor of HEAD; dependency
  `74550da…` is an ancestor of HEAD; dirty state was only protected untracked
  `.serena/` (untouched); claim row ACTIVE; no competing file claim.
- Stated `SAFE_TO_MUTATE = YES` before editing.

## Changed paths (owned files only)

- `frontend/tests/e2e/daily-form-mobile.spec.ts` — 3 tests → 11 tests; existing assertions kept (strengthened only by the repair-request capture); no production file touched.
- `docs/ai/handoffs/ENV-MOBILE-001B-GLM53.md` — this evidence packet (new).
- `docs/work-orders/ENV-MOBILE-001B-GLM53-VERIFICATION.md` — lane status line only (coordinator's fallback record preserved).
- `MIGRATION.md` — ENV-MOBILE-001B claim row marked complete only (coordinator's fallback record preserved).

## Coverage matrix — WO "Required regression coverage" → tests

| # | Requirement | Test(s) |
|---|---|---|
| 1 | 360/430 no overflow, one-column dense controls, final field/actions reachable | "dense water-quality fields recompose…" (360, pre-existing, kept) + "430 px phone keeps one-column density…" (new) |
| 2 | Tablet 768×1024 + desktop 1024 two-column density, no action-bar regression | "tablet 768×1024 keeps two-column density…" (new) + "desktop keeps the useful two-column…" (kept, + no-overflow assert) |
| 3 | Every visible QuickChip ≥44×44 CSS px (measured) | "every visible QuickChip measures at least 44×44 css pixels" (new; bounding-box measured for น้ำตาลเข้ม/น้ำตาลอ่อน/กลิ่นดินปกติ) |
| 4 | Real mobile/touch context, not resized desktop | "tap path drives dense sections…" (new) — `devices["Pixel 7"]` profile: hasTouch + isMobile + mobile UA (real touch emulation; `defaultBrowserType` dropped only because `test.use` cannot fork workers) |
| 5 | Keyboard reach/activation + visible/focusable validation | "keyboard users reach and activate QuickChips and submit…" (new: Enter on accordion, Tab→chip→Enter, Space on switch, Enter submit; banner `role=alert`/`aria-live=assertive`; inline `#abnormal-cause-error`; focus lands on `#abnormal_cause`; `aria-invalid`) |
| 6 | Abnormal submit without cause: announced context + values preserved across accordions | phone workflow test (kept) + keyboard test (new) |
| 7 | First save failure: accessible error, values kept, retry succeeds | "first save failure is announced accessibly…" (new: 500 PostgREST-shaped → `role=alert` `aria-live=assertive`; values retained; second POST 201; retry payload equality) |
| 8 | Abnormal-cause success invokes repair-request boundary (captured request) | phone workflow test extended: captured `POST /rest/v1/repair_request` body equals `{reading_id, cause, status:"open"}` exactly |
| 9 | Edit mode phone: update/cancel/delete usable, non-overlapping, clear of final field | "edit mode at phone width…" (new: visible+enabled, in-viewport, pairwise non-overlap, `elementFromPoint` hit-test per action, final field scrolls clear) |
| 10 | Dock tappable at rest; form actions never above/through sheet-scrim | "ModuleDock is tappable at rest…" (new: at-rest hit-test on a dock slot + submit; sheet open → bar `aria-hidden`+`inert`+`pointer-events:none`+z<35; hit at Save center is a dock layer, never the form bar; Escape restores z≥40 + tappable) |
| 11 | Deterministic screenshots 360/430/tablet | `frontend/test-results/env-mobile-001b-visual/` (local ignored evidence; see below) |

### Viewport/device matrix

| Context | Kind | Tests |
|---|---|---|
| 360×800 | viewport-only (Desktop Chrome resized) | layout 360, chips, keyboard, error/retry, edit-mode, workflow |
| 430×900 | viewport-only | 430 layout, dock/scrim |
| 768×1024 | viewport-only | tablet density + action bar |
| 1024×900 | viewport-only | desktop density |
| Pixel 7 (412×915, hasTouch, isMobile, mobile UA) | **real touch emulation** | tap path (accordion/toggle/QuickChip/submit via `tap()`) |

### Screenshot evidence (local, gitignored — same convention as the 001A lane)

| Path | Proves |
|---|---|
| `frontend/test-results/env-mobile-001b-visual/360-create-quality-open.png` | 360 create form, คุณภาพน้ำ open: one-column dense controls, no horizontal overflow |
| `frontend/test-results/env-mobile-001b-visual/430-create-notes-open.png` | 430 create form, หมายเหตุ open + final note scrolled above the fixed action bar |
| `frontend/test-results/env-mobile-001b-visual/768-tablet-two-column.png` | Tablet two-column measurement density with action bar inside the viewport |

## RED / GREEN evidence

**GREEN (remediated HEAD `2b50b2c`):** focused spec 11/11 PASS ×3 runs
(19.2 s / 15.7 s / 17.5 s, `--retries=0`); full Playwright 59/59 PASS.

**RED (pre-remediation `a99629935b68dac58a3e7fb8c1498e923fe5a174`, isolated
worktree `../envww-001b-red` with its own vite on :5199; old code confirmed by
`min-h-[36px]` present in the served `DailyFormPage.tsx`):**

4 new tests failed — each maps to a 001A remediation:

1. QuickChip 44×44 — `น้ำตาลเข้ม height ≥ 44` failed (36 px).
2. Keyboard announce — `getByRole('alert').filter({ hasText: 'กรุณาระบุสาเหตุ…' })` not visible (no alert role pre-remediation).
3. Accessible API error — `getByRole('alert').filter({ hasText: 'e2e-forced-create-failure' })` not visible.
4. Dock scrim demotion — action-bar `aria-hidden` expected `"true"`, received `null`.

7 tests passed at `a996299` — baseline evidence for behavior that pre-dates
the 001A remediation (original mobile-first implementation already shipped it:
one-column/no-overflow at 360/430, tablet/desktop density, final-field
clearance, repair-request boundary, edit actions, touch tap path). Per the
parent WO, RED was not fabricated for these.

**False-start note (methodology):** the first RED attempt reported 11/11 PASS
at `a996299` — invalid: Playwright's `reuseExistingServer` reused a leftover
:5173 vite serving the **remediated** worktree. Re-run against an isolated
:5199 server produced the honest 4-failed/7-passed result above. Same hazard
class as ENV-DEFECT-003 (test must exercise the intended code, not whatever
server is lying around).

## Full verification (non-secret test profile:
`VITE_SUPABASE_URL=https://gllqtbyofrcjzmbnfoeh.supabase.co`,
`VITE_SUPABASE_ANON_KEY=test-anon-key`)

| Gate | Result |
|---|---|
| focused `daily-form-mobile.spec.ts` (`--retries=0`) | **11/11 PASS** |
| `daily-form-dirty.spec.ts` focused | **1/1 PASS** (1.6 m, WO-STAB-004 reconnect regression) |
| full Playwright (`--retries=0`) | **59/59 PASS** (51 pre-lane → 59) |
| `npm test -- --run` | **202/202 PASS** (15 files; baseline preserved) |
| `npm run build` | **PASS** (pre-existing chunk-size warnings only) |
| `npm run lint` (oxlint) | **0 errors / 12 pre-existing warnings** (baseline preserved) |
| `git diff --check` | **PASS** |

No production defect was exposed by any required assertion, so the lane did
not stop at `PRODUCTION_REMEDIATION_REQUIRED`.

## Residual risks / observations for the reviewer

1. **API-error banner focus race (non-blocking).** `showApiError` focuses the
   banner via a single `requestAnimationFrame` scheduled before React's
   concurrent commit; additionally the pending submit renders `disabled`,
   which drops focus to `body`. Under full-suite load the focus move can miss
   (observed 2× with a strict focus poll; focused runs always passed). The
   banner's display + announcement (`role=alert`, `aria-live=assertive`),
   value retention, and retry always held — WO item 7's required lifecycle
   passed. Reproducer: run the full suite with
   `expect.poll(activeElement.role).toBe("alert")` after the first failed
   save. Production file is read-only for this lane; left for reviewer
   decision (a defect-memory candidate).
2. **Dock strip at phone width (non-blocking, out of WO scope).** The dock bar
   is a horizontally scrollable strip by design (`max-w-[calc(100vw-6rem)]
   overflow-x-auto` + pan/scrub gesture). At 430 with the default 8 pinned
   entries the trailing `ทุกโมดูล` control is off-viewport until the strip is
   scrolled, and the release-to-select gesture re-targets trailing-slot mouse
   clicks (keyboard activation is reliable — used for the scrim test). Not a
   DailyForm defect; AppShell/ModuleDock belongs to Track F. Worth a future
   dock-focused work order if phone reachability of `ทุกโมดูล` matters.
3. Local Playwright runs use the repository's documented vite-dev CI profile;
   there is no local exact-prod-build E2E profile (unchanged repo convention).

## Remote / PR evidence (recorded after push, 2026-08-28)

- PR #40 head: `518d346d9297a3787160753f21c271d60db07498` (= lane commit,
  verified equal to `origin/feat/env-mobile-001`); base `main`; state OPEN;
  mergeability MERGEABLE / mergeStateStatus **CLEAN** after checks.
- Checks on head `518d346…` — all SUCCESS:
  - `smoke` (full `npx playwright test` via webServer profile) — pass, 2 m 38 s — run 33121779735
  - `scripts` — pass — run 33121779756
  - `notify` ×2 — pass
- Exact CI checkout ref (from the smoke run's `actions/checkout@v4` log):
  `HEAD is now at ebfe5e7 Merge 518d346d… into 08db62c8…` — i.e. GitHub's
  synthetic PR merge ref `ebfe5e7`, **not the literal head SHA**. This is the
  same documented caveat as the previous review round (no branch
  protection/ruleset; `pull_request` events always test the merge ref). The
  independent reviewer must decide whether merge-ref CI satisfies the
  exact-head evidence gate; local evidence in this handoff was produced
  directly at `2b50b2c` + lane commit content.

## Next action

Independent **GPT-5.6 Sol Ultra exact-SHA re-review** of PR #40 at this lane's
pushed head against `origin/main@08db62c…`. Do not merge before that review;
this lane does not merge.
