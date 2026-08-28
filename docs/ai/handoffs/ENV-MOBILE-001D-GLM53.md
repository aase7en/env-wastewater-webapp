# ENV-MOBILE-001D — GLM-5.3 MAX Error-Visibility Regression Handoff

Status: PRODUCTION_REMEDIATION_REQUIRED
Date: 2026-08-28
Owner: GLM-5.3 MAX (deterministic E2E engineering only)
Coordinator / production owner: GPT-5.6 Sol Ultra
Branch: `feat/env-mobile-001`
PR: #40 (base `origin/main@08db62c821cf7b95aaeb373c603d77ccc4d9b98a`)
Starting HEAD (verified before mutation): `3763b6205a46a3819579dff5f890b4c536c3f6e9` (local == `origin/feat/env-mobile-001`; `08db62c` and `origin/main` ancestors; dirty state only protected `.serena/`; no competing claim — 001A/001B rows complete, no 001C/001D row existed)

## Verdict

**PRODUCTION_REMEDIATION_REQUIRED — the production error-visibility race
reproduced in this lane's repeat run (2/20), independently confirming the
reviewer's exact-head baseline (1/20 at `3763b62`).** Per the lane contract
this verdict stands even if the repeat had passed 20/20. No production code
was touched (`frontend/src/**` read-only for this lane).

## Changed paths (owned files only)

- `frontend/tests/e2e/daily-form-mobile.spec.ts`
  - `mockDailyFormDependencies()` now stubs `**/rest/v1/role_module_visibility**` with an empty successful response (the dock/visibility layer fetches it on mount).
  - First-save-failure/retry test strengthened (all prior useful assertions preserved: accessible alert visible, `aria-live=assertive`, values retained, retry succeeds, retry payload equality):
    1. submits from the **bottom of the phone form** (`window.scrollTo` to `scrollHeight`; asserts `scrollY > 0` so the reproduction precondition is proven, not assumed);
    2. polls honestly until the **alert receives focus after React commits it** (`document.activeElement` is `role=alert` containing the API message — 5 s default poll, not weakened);
    3. polls until the committed alert's bounding box **settles inside the phone viewport** (smooth-scroll aware; still times out if production never brings the alert into view).
- `docs/work-orders/ENV-MOBILE-001D-GLM53-ERROR-REGRESSION.md` — verbatim contract copy (verified byte-identical to the dispatch file) + this lane's status update.
- `docs/ai/handoffs/ENV-MOBILE-001D-GLM53.md` — this handoff.
- `MIGRATION.md` — ENV-MOBILE-001D claim row added ACTIVE at start, marked complete at stop.

## Verification (env: documented non-secret test profile)

| Run | Result |
|---|---|
| focused failed-save test `--retries=0` | 1/1 PASS (5.5 s) |
| failed-save repeat `--repeat-each=20 --retries=0` | **18 PASS / 2 FAIL** — production race reproduced |
| full `daily-form-mobile.spec.ts` `--retries=0` | 11/11 PASS (16.7 s) |
| `git diff --check` | PASS |

### Test-side correction (disclosed)

The first draft measured the alert's bounding box once, immediately after the
focus poll. That version failed even the focused single run — the snapshot
landed mid-smooth-scroll (production `revealTarget` scrolls with
`behavior: smooth` under no-preference). Corrected to a settled-state poll of
the same final condition (alert intersects viewport). This is not a weakening:
the poll still fails whenever production never brings the alert into view —
which is exactly how the 2/20 failures below failed.

## Defect evidence — exact reproducers

**Command** (from `frontend/`, at starting HEAD `3763b62` + this lane's spec):

```bash
VITE_SUPABASE_URL=https://gllqtbyofrcjzmbnfoeh.supabase.co \
VITE_SUPABASE_ANON_KEY=test-anon-key \
npx playwright test tests/e2e/daily-form-mobile.spec.ts \
  --grep "first save failure" --repeat-each=20 --retries=0
```

Observed: **2/20 failures** (repeats 6 and 12). Both failed at the
ENV-MOBILE-001D **viewport-intersection poll** (5 s timeout): the focus poll
had already PASSED — focus did land on the alert — but the alert's box never
intersected the 360×800 viewport. I.e. `revealTarget`'s
`scrollIntoView({ behavior: "smooth", block: "center" })` did not bring the
committed banner into view.

**Relationship to the reviewer baseline** (20 failed saves at `3763b62`:
19 focused/scrolled, 1 left focus on BODY with the alert fully above the
viewport): same production function failing — `DailyFormPage.tsx
showApiError → setBanner(...) + single requestAnimationFrame(() =>
revealTarget(bannerRef.current))` racing React's concurrent commit, plus
`revealTarget`'s preventScroll-focus + smooth scroll. Two manifestations:

- **A (reviewer):** the rAF fires before React commits the banner →
  `bannerRef.current` is null → no focus, no scroll. Focus also lands on BODY
  because the pending submit renders `disabled`, dropping the focused button.
  Alert stays fully above the fold.
- **B (this lane, 2/20):** the rAF lands after commit → focus succeeds, but
  the smooth scroll never actually delivers the banner into the viewport.

**Remediation surface for the Sol Ultra production lane** (analysis only —
production ownership is not this lane's): make the banner reveal
commit-anchored rather than rAF-raced (e.g. focus/scroll in an effect keyed on
the banner's presence, or re-arm until the ref exists), prefer a scroll mode
that guarantees final position (`auto`, or verify post-scroll position), and
account for the pending-submit focus drop. Repository tests are acceptance
authority; UX judgment stays with Sol Ultra.

## Stop gate

- Lane status: `PRODUCTION_REMEDIATION_REQUIRED` (set in the WO file).
- ENV-MOBILE-001D claim row marked complete; no other row touched.
- Commit/push: `chunk(ENV-MOBILE-001D): ...`, owned files only.
- **STOP.** No `frontend/src/**` edit, no PR review/merge/deploy, no parent-WO
  closure, no next ROADMAP work. PR #40 remains unmerged.
