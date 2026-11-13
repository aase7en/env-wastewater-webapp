# ENV-UNDO-001-C1 — Handoff (claim checkpoint)

conventions note: this handoff follows the
`docs/ai/handoffs/ENV-MAINT-001-GLM.md` conventions (claim checkpoint
sections, per-phase evidence, durable receipts). The implementing lane
appends D2/D3/D4/D5 sections below D0 — it must never rewrite D0 (it is
the transition record, frozen by the reviewed transition PR).

## D0 — Claim transition authored (12 พฤศจิกายน 2569 / 2026-11-12)

- Claim `ENV-UNDO-001-C1` (generation 1, CLAIMED) registered by this
  transition; authority begins only after the reviewed transition merges to
  main.
- Task `ENV-UNDO-001` (new task row; task_id uniqueness checked against the
  registry — 23 prior rows scanned at base `fb124ac627a287247b95310d63d252d5e5d9d7ea`,
  **0 prior occurrences of `ENV-UNDO*`** in the whole repo docs tree, no
  OWNERSHIP_CONFLICT; the only non-CLOSED record `ENV-BUILDING-REPAIR-001-C1`
  (registry status field `CLAIMED`, lifecycle state WAITING_EXTERNAL per the
  owner's 2026-10-12 deferral) holds no overlapping path — its migrations,
  building/repair libs+pages, import-adapters, sw.js, BulkImportPage and e2e
  spec are all disjoint from this claim's mutable scope and stay explicitly
  forbidden here).
- Work Order: `docs/work-orders/ENV-UNDO-001.md` — the single feature
  "ลบแบบย้อนกลับได้ 10 วินาที" for the wastewater daily-record delete flow
  (authorization basis, binding design bounds, source reality, execution
  routing, exact mutable scope, forbidden scope, truth constraints, D-plan,
  MINOR v1.1.0 release plan, acceptance, closeout plan).
- Lane: **Track-Z (GLM)** — behavior + minimal UI wiring on the existing
  Toast component; **no art direction** — if a toast visual restyle grows
  beyond the minimal action-button support, park it for Track F and record
  the park in this handoff. Holder (this coordinator session):
  `kilo-env-undo-001-g1-primary`; planned worktree
  `/Volumes/MAC_WORK/DevWorkspace/Github/_worktrees/env-undo-001-20261112`;
  transition branch `docs/env-undo-001-claim`; implementation branch
  `feat/env-undo-001` (created at D2 start, off the transition merge SHA);
  base `fb124ac627a287247b95310d63d252d5e5d9d7ea` (= origin/main at
  transition authoring; verified fetched, clean, ff — it is the merge SHA
  of PR #175 closeout. Honesty note: the dispatch instruction's "last known
  2e6f011" predates it — `2e6f01197959cb85b42939e00c53ee1e63c36c2d` is the
  merge SHA of PR #172 (PERF closeout), already two merges behind; the tip
  was re-verified and this transition re-pins to the actual tip); fence
  `expected_policy_revision` pins this SHA and `expected_registry_hash`
  pins the registry block AT this base, guard method
  `scripts/env_coordination_guard.py:454-456`, verified by running
  `validate-registry` at base: hash
  `feacaf1a00f13f716fbd40fc8447f2455b0553fb5d95db1e17434038be9cdb8d`,
  claims 23, ok:true, enforcement_mode BOOTSTRAP_CONTROL — this re-pins the
  prior fence `b4cfd4d…` / `4b97392d…` from the ENV-MAINT-001-C1 closeout
  PR #175.
- Authorization basis (recorded verbatim where quoted):
  1. Owner in-session decision 2026-11-12 — after being shown the current
     permanent-delete behavior (`DailyFormPage.tsx` `onDelete` →
     `window.confirm("ยืนยันการลบรายการนี้? การกระทำนี้ย้อนกลับไม่ได้")` →
     `deleteReading` hard delete; admin-gated via `RequireAuth` route
     wrapper), the owner approved: **"เรื่องบันทึก 10 วิลบย้อนกลับได้อันนี้น่าสนใจดีทำเลย"**
     (verbatim quote including the original wording; not paraphrased).
  2. Owner standing Goal-mode instruction: RED-first, full battery,
     independent review, implementer never merges.
- Binding design bounds (D1 delegated consult only for a genuine fork —
  otherwise these decide):
  1. UX: confirm → optimistic removal + toast "ลบแล้ว" with action button
     "ย้อนกลับ" for 10 s (visible countdown if the house pattern supports
     it); undo restores via refetch/invalidate with NO server round-trip
     (deletion is deferred); expiry executes the actual DELETE.
  2. Storage semantic: hard delete stays; **NO new soft-delete DB column**
     unless a genuine-fork D1 consult says otherwise; deferring the DELETE
     call until expiry is the pinned mechanism (trivially correct undo).
  3. Race/error honesty: deferred-DELETE failure at expiry → error toast +
     refetch (record returns) — never silent loss of either outcome;
     multiple rapid deletes must not break the toast queue (the
     implementer must verify ToastProvider queue capability for real and
     record the verification here).
  4. Scope BOUNDED: wastewater daily-record delete flow ONLY
     (DailyFormPage + readings cache invalidation + minimal Toast action
     support). Other modules keep current behavior; generalization is a
     follow-up lane needing its own NEW reviewed claim transition.
  5. Accessibility/mobile: undo tap target ≥44px, visible focus, Thai
     labels; reduced-motion respected per house patterns.
  6. Admin gate unchanged (RequireAuth — `App.tsx` forbidden).
- Source reality at base (every file:line verified before authoring):
  - `frontend/src/pages/DailyFormPage.tsx:248-258` — `onDelete`:
    `window.confirm` → `deleteMut.mutate(id)` → `navigate("/readings")` or
    error banner; success judged by `!error` (WO-STAB-001 comment
    :251-254; `deleteReading` returns `Promise<void>`).
  - `frontend/src/lib/hooks.ts:185-186` — `useDeleteReading` →
    `useReadingMutation((id) => deleteReadingQ(id))`.
  - `frontend/src/lib/supabase-queries.ts:242` — `deleteReading(id)`:
    hard delete via the Supabase client.
  - `frontend/src/components/ui/Toast.tsx` (105 lines) — kinds
    success/error/warning/info; auto-dismiss 4 s (success) / 6 s (others);
    **no action-button support** (only an X dismiss); shared component —
    `useToast` consumers include `AiQueryBox`, `AiSuggestions`,
    `ChatPanel`, `RepairRequestModal`, `ChemicalPage`, `GardenPage`,
    `FuelPage`, `ReportsPage`, `WaterSupplyPage`, DailyFormPage → the
    minimal extension MUST be backward-compatible (existing API +
    auto-dismiss behavior byte-compatible; all existing tests of Toast
    consumers must pass unchanged).
  - Route gate: `/form`, `/form/:id`, `/readings` inside `RequireAuth`
    (`frontend/src/App.tsx:196-224`) — unchanged; `App.tsx` itself is
    forbidden.
- D2 RED-first plan (new specs must fail truthfully against the UNMODIFIED
  base): `frontend/tests/e2e/env-undo-001.spec.ts` +
  `frontend/src/components/ui/Toast.test.tsx` (`.test.tsx` is house
  precedent: analytics, WaterWatchDashboard) covering (a) no server DELETE
  within the 10 s window (deferred), (b) undo restores without refetch
  flicker / no restore-attributable fetch, (c) expiry fires DELETE exactly
  once, (d) deferred-DELETE failure at expiry → error toast + refetch
  (record returns), (e) undo button ≥44px tap target + Thai labels
  ("ลบแล้ว"/"ย้อนกลับ"), (f) multiple rapid deletes keep one undo per
  toast, queue intact. Clock control: Playwright `page.clock` / house
  clock-pin pattern (PERF lane precedent). Cases that cannot RED by nature
  get an honest pin-not-red status — no fabricated REDs.
- D4 battery at the frozen head: FULL vitest + `tsc -b` + lint + Playwright
  FULL `--workers=1` (including the new clock-controlled cases) + guard
  344/344 + runtime 62/62 + release checker (`v1.1.0` after bump) +
  `git diff --check`.
- Review routing (review_owner in the registry record): claim transition —
  independent exact-SHA review, R2 floor fresh GLM-5.3 MAX reviewer context;
  cross-model R3/D5 where admission allows (GPT-6.1 Terra admitted
  2026-11-08 via Codex CLI and eligible as cross-model reviewer; GPT-6
  Astra prohibited); never author-and-approve; never silent downgrade.
  Implementation PR: fresh-GLM independent review at the exact frozen head
  with an independently executed battery rerun where possible. The
  AUTHORIZATION BASIS is an explicit adversarial check item — insufficient
  basis parks the claim unmerged. The implementing lane never merges.
- Release plan: MINOR `v1.1.0` per the documented CHANGELOG criteria
  (MINOR — ฟีเจอร์ใหม่ที่ใช้งานได้โดยไม่กระทบของเดิม; the 10-second undo is
  a new user-visible capability). `frontend/package.json` `1.0.2` →
  `1.1.0` + Thai พ.ศ. CHANGELOG entry in the implementation PR; annotated
  tag ONLY after Pages deploy verification at the deployed merge SHA
  (`check_release_version.py --tag v1.1.0` exit 0) per
  `docs/ai/handoffs/ENV-APP-VERSION-001-GLM.md` D6. This transition PR is
  docs-only — no bump, no entry, no tag.
- Newly-noticed follow-up recorded here (NOT fixed in this transition —
  fixing it is not part of this lane's authorized content set): the
  frontier bullet at `docs/ai/CURRENT-WORK.md` line ~1205 still reads
  `ENV-APP-VERSION-001 / CLAIMED (C1, this transition)` although that lane
  is CLOSED (implementation PR #168 merged `5bca608`, closeout PR #169
  merged `ebdfcee`; registry status CLOSED) — the same drift class the
  ENV-MAINT-001-C1 closeout fixed for the ENV-PERF-001 bullet (its WO
  item 4). A future closeout transition should repair this bullet the same
  reviewed way.
- Honesty provisions for the implementing lane: record all deviations in a
  D-phase log here; conditional claims (`frontend/src/lib/hooks.ts`,
  `frontend/src/lib/supabase-queries.ts`) are justified per-use — if D3
  does not need one, leave it untouched and record that truthfully (PERF
  AIAdminPage conditional-claim precedent); CURRENT-WORK.md must not be
  touched by the implementation PR.

## D2 — RED (appended by the implementing lane, 2026-11-12)

Branch `feat/env-undo-001` cut at base `5ea4f71f20d940521606737d22ea27fd17fda283`
(= origin/main tip at start, merge SHA of transition PR #176; verified
fetched, clean, ff before authoring). RED commit: **`3036f2f`**
("test(undo): D2 RED — ENV-UNDO-001 expectations failing") — tests only,
no app-code change.

Truthful RED counts against the UNMODIFIED base:

- `frontend/src/components/ui/Toast.test.tsx` — vitest focused run:
  **1 file failed / 10 tests failed / 0 passed**. Failure mode: the
  exported seams under test (`ToastCard`, `resolveToastDurationMs`,
  `runToastAction`) do not exist at base — every test fails on the missing
  exports (element-type error inside `renderToStaticMarkup`), i.e. the RED
  is the absence of the feature's testable API, not a mock artifact.
- `frontend/tests/e2e/env-undo-001.spec.ts` — Playwright focused run
  (`--workers=1`): **6 failed / 0 passed** (cases a–f). Verified failure
  points are the base-behavior divergences, in order: (a,b,c,e,f) no
  "ลบแล้ว"/"ย้อนกลับ" toast exists (base hard-deletes immediately behind
  `window.confirm` + navigates); (d) base error path stays on the form
  page (`toHaveURL(/\/readings/)` fails) because the immediate DELETE
  rejects into the page banner — no deferred semantics, no error toast, no
  return-to-list.

Environment-constrained split (honest, recorded): the house vitest config
is `environment: "node"` with NO DOM library in the dependency tree (no
jsdom/happy-dom anywhere in package-lock.json; adding one would change
`package-lock.json`, which is outside the claim's mutable scope), so the
literal "toast renders action button; action click fires callback" is
covered as: (render) SSR-safe `ToastCard` markup assertions in vitest;
(click contract) pure `runToastAction` sequencing unit + the REAL
in-browser click-through in e2e cases (b)/(f). No RED is claimed for a
capability the node environment cannot observe.

Environment receipts for this D2 (recorded because they gate the runs):
- `frontend/node_modules` absent in the lane worktree; `npm ci` FAILED on
  a PRE-EXISTING lock drift ("Missing: typescript@5.9.3 from lock file" —
  lock out of sync with `package.json` at base, not caused by this lane).
  Worked around with `npm install --no-save` — `package.json` and
  `package-lock.json` both left byte-identical (verified via
  `git status --porcelain`).
- `frontend/.env` is gitignored and absent in the worktree; copied from
  the main checkout (`/Volumes/MAC_WORK/DevWorkspace/Github/
  env-wastewater-webapp/frontend/.env`) so the dev server boots. Contents
  never printed; no tracked-file change (`?? frontend/.env` never appears
  because .env is gitignored — verified by status).

## D3 — Implementation (appended by the implementing lane, 2026-11-12)

Commits: **`6acd22b`** ("feat(undo): 10-second undo window for daily
record delete (ENV-UNDO-001)") + **`2f118ba`** (spec lint hygiene:
`authed` → `authed: _authed`, the house fixture convention from
daily-form-dirty.spec.ts) + **`20e3449`** (release: `frontend/package.json`
1.0.2 → 1.1.0 + Thai พ.ศ. CHANGELOG entry; CHANGELOG "PR #XXX" placeholder
to be fixed in a follow-up push immediately after PR creation, per the
dispatch instruction — the PR cannot know its own number at authoring
time).

Files changed vs base (exactly the claimed set; `git diff --name-only
5ea4f71..20e3449`):

- `frontend/src/pages/DailyFormPage.tsx` — delete flow rework
- `frontend/src/components/ui/Toast.tsx` — minimal extension
- `frontend/src/components/ui/Toast.test.tsx` — new (claimed new file)
- `frontend/tests/e2e/env-undo-001.spec.ts` — new (claimed new file)
- `frontend/package.json` — version bump only (diff verified version-line
  only)
- `CHANGELOG.md` — new v1.1.0 entry, Thai, พ.ศ. (12 พฤศจิกายน พ.ศ. 2569)

**Conditional claims `frontend/src/lib/hooks.ts` and
`frontend/src/lib/supabase-queries.ts` were NOT needed and are NOT
touched** (verified in the scope diff above). Rationale: the deferred flow
calls `deleteReading` directly (`import { deleteReading as deleteReadingQ }
from "../lib/supabase-queries"`), so the ad-hoc `useDeleteReading` wrapper
was dropped from the page (the wrapper stays exported in hooks.ts for any
future caller); `deleteReading` itself was already the exact primitive the
expiry timer needs (PERF conditional-claim precedent recorded truthfully:
not used → untouched).

Design as implemented (binding bounds respected):

1. **Deferred DELETE + pure-cache undo** (`DailyFormPage.tsx` module scope):
   confirm (text honestly updated to
   "ยืนยันการลบรายการนี้? ย้อนกลับได้ภายใน 10 วินาที" — the old
   "การกระทำนี้ย้อนกลับไม่ได้" would be false messaging under the new
   flow) → `captureAndHideReadings()` snapshots every affected
   `["readings", limit]` / `["dashboard", days]` cache entry (only entries
   actually containing the row — untouched entries are NOT snapshotted so
   restore cannot clobber newer refetches) + removes `["reading", id]`,
   then filters the row from the lists → `navigate("/readings")` →
   `scheduleDeferredDelete()` arms a module-scope `setTimeout(10_000)` →
   toast `toast("success", "ลบแล้ว", { action: { label: "ย้อนกลับ", ... },
   durationMs: 10_000, countdown: true })`. Undo = clear timer + remove map
   entry + `restoreReadingsSnapshots()` writes the snapshots back — no
   server round-trip (WO case b pins zero restore-attributable fetch).
   Expiry fires `deleteReadingQ(id)` exactly once; on success
   `removeQueries(["reading", id])` + invalidate readings/dashboard (list
   reconciles to server truth); on failure invalidate reading/readings/
   dashboard + error toast
   "ลบไม่สำเร็จ — ยังไม่ได้ลบจากระบบ รายการจะปรากฏอีกครั้ง" — the refetch
   returns the record visibly (WO case d). NO soft-delete column, NO
   supabase/** change, NO D1 consult needed (no genuine fork — bounds
   decided).
2. **Unload/reload mid-window semantics (dispatch-required decision,
   honest-conservative option chosen)**: the pending timer lives in module
   JS state; a full page unload/reload (or closed tab) destroys it, so the
   DELETE never fires and the record simply stays. This is the conservative
   outcome the dispatch prefers ("deferred means a closed browser cancels
   the delete") and is documented in the confirm-text/toast contract
   rather than disclosed per-toast (kept simple per dispatch: documented
   here + in the WO status, no extra UI).
3. **Navigation survival**: pending state is module-scope (NOT component
   scope), so the window survives navigating away from the form page;
   ToastProvider is app-level (`App.tsx:128`, forbidden file, untouched)
   and the toast functions captured by the timer closure are
   useCallback-stable provider callbacks. App.tsx and all route gating
   untouched.
4. **Rapid deletes / no cross-talk**: one `Map<id, PendingDelete>` —
   per-id entry, per-id timer, per-id toast; the provider stacks cards 1:1
   from its entries array (queue capability verified for real before D3:
   `toasts.map` render + Date.now()+Math.random() ids cannot collide).
   Same-id re-confirm inside the window keeps the ORIGINAL pending entry
   (single DELETE on expiry). Undo restore filters rows whose ids are
   still in `pendingDeletes` — restoring record A must not resurrect
   still-pending record B (e2e case (f) caught exactly this bug at GREEN
   and it was fixed before freeze).
5. **Toast minimal extension (23 consumers verified backward-compatible)**:
   `grep -rln "useToast()"` = **23 files**, matching the WO's consumer
   list; convenience wrappers and the `(kind, message)` call shape are
   unchanged; `resolveToastDurationMs` keeps the legacy 4s/6s defaults and
   `durationMs` is opt-in (pinned by tests). `ToastCard` is extracted as an
   SSR-safe presentational card (no portal/document access) with identical
   legacy markup when no options are passed; provider renders one card per
   entry. Countdown is a text span (`aria-hidden`, SR users get
   toast+button without 10chatty announcements). Undo button: ≥44px via
   house tokens `min-h-[var(--touch-min)] min-w-[var(--touch-min)]`
   (--touch-min = 44px, styles/spacing.css:40), visible focus ring,
   Thai labels, no new motion (existing `.toast-in` + existing
   reduced-motion rules apply).
6. **Known transient (documented, not fixed)**: while record A is pending,
   any readings-list refetch (e.g. triggered by record B's expiry
   invalidate) returns server truth, which still contains A — A may
   briefly reappear until its own expiry resolves it. This is honest
   (A really is still on the server during its window) and self-healing;
   the primary flow (undo before any expiry, as in e2e (f)) never sees it.
7. **New lint warnings, deliberate**: oxlint stays **0 errors**; two NEW
   `react(only-export-components)` warnings in Toast.tsx come from the two
   exported test seams (`resolveToastDurationMs`, `runToastAction`) — the
   node-env vitest constraint makes an extra constants-file the only
   alternative, and no new file is in the claimed scope. Recorded as a
   trade-off for the reviewer; a follow-up lane may move them if desired.

GREEN evidence at D3: vitest Toast suite 10/10; e2e env-undo-001 6/6;
tsc -b clean; adjacent daily-form suites (dirty + mobile) 12/12 (WO
boundary check — delete button pins intact); FULL vitest 32 files / 503
passed / 1 designed skip (= baseline 493 + 10 new, 0 regressions).

## D4 — Battery (appended by the implementing lane, 2026-11-12)

Frozen head: **`20e3449`** (branch `feat/env-undo-001`, working tree
clean). All receipts re-run at this exact head, 2026-11-12. After the
receipts commit, two docs-only commits landed (`6c37773` receipts, then
the CHANGELOG PR-ref fix `f696105`); the full battery was **re-run
identical at `f696105`** (last code-bearing head — vitest 32/503+1skip,
tsc clean, oxlint exit 0, Playwright FULL 213/213, guard 344/344, runtime
62/62, checker OK v1.1.0, `git diff --check` clean, tree clean). The only
commit after `f696105` is this docs line — no code bytes change after the
verified head. Per-facet receipts at `20e3449`/`f696105`:

1. vitest FULL (`npm test`): **32 files passed / 503 tests passed /
   1 designed skip** (skip is the pre-existing designed skip; 503 =
   493 baseline + 10 new).
2. `tsc -b`: clean.
3. oxlint: **exit 0**; 18 warnings total — 3 in Toast.tsx (1 pre-existing
   class at base from the `useToast` hook export + 2 new, see D3 §7),
   15 in files untouched by this lane (AuthProvider, csv-import.test,
   import-engine, CarbonPage, SensorsPage, TrendsPage, env-perf-001.spec).
4. Playwright FULL `--workers=1`: **213/213 passed** (4.9 min) —
   207 baseline + 6 new env-undo-001 cases (clock-controlled, all six
   WO categories a–f).
5. guard: `python3 scripts/test_env_coordination_guard.py` →
   **Ran 344 tests — OK** (344/344).
6. runtime: `python3 scripts/test_env_autonomy_runtime.py` →
   **Ran 62 tests — OK** (62/62).
7. release checker: `python3 scripts/check_release_version.py --tag
   v1.1.0` → **OK (v1.1.0; CHANGELOG entry v1.1.0)**, exit 0.
8. `git diff --check`: clean (no whitespace errors).
9. Scope gate: `git diff --name-only 5ea4f71..20e3449` = exactly the 6
   files listed in D3; **CURRENT-WORK.md untouched**; hooks.ts +
   supabase-queries.ts untouched (conditional claims honestly unused);
   no forbidden file in the diff.

STOP — REVIEW_REQUESTED. The implementing lane does not merge; D5
independent review is appended by/for the reviewer at this exact head.

## D5 — Independent review (to be appended by the implementing lane)

## D6 — CLOSEOUT RECEIPT (appended by the closeout transition lane, 2026-11-13)

This section is the durable closeout record for claim `ENV-UNDO-001-C1`
(generation 1). The registry transition is docs-only and authored on branch
`docs/env-undo-001-closeout` off main @ `64764f9f92c56951f324b49910cf0c06493603b0`;
the implementing lane never merges — **STOP at REVIEW_REQUESTED**.

### Full delivery chain (receipts verified live by the closeout lane)

- **Claim transition PR #176** merged as `5ea4f71f20d940521606737d22ea27fd17fda283`
  (merge commit `5ea4f71`; parents `fb124ac` + `1e0fbfb`; head
  `1e0fbfb7e6a58e22dcf1a6745f356c0240153808`; mergedAt 2026-11-12T21:48:10Z).
  R2 APPROVED receipt issuecomment-6836835368 (fresh independent
  review-and-merge executor context, zero P1/P2) with **2 recorded P3s**:
  1. route-level auth-gating wording — `/form` routes are `RequireAuth`-gated
     **without** `requireAdmin`, so durable docs read as route-level auth
     gating (DB-level delete policy for `reading` not in tracked migrations);
  2. toast-consumer list says 10 while **23 files** import `useToast` at
     base — the 100% byte-compatibility bound covers all of them regardless.
- **D2 RED `3036f2f`** ("test(undo): D2 RED — ENV-UNDO-001 expectations
  failing") — truthful failures against the UNMODIFIED base behavior:
  vitest `Toast.test.tsx` **10 failed / 0 passed** (each failing on the
  missing exported seams — RED is the feature's absence, not a mock
  artifact) and e2e `env-undo-001.spec.ts` **6 failed / 0 passed** across
  WO categories (a)–(f), clock-controlled. Both counts reproduced exactly
  by D5 in an isolated checkout at `3036f2f`.
- **D3 `6acd22b`** ("feat(undo): 10-second undo window for daily record
  delete (ENV-UNDO-001)") — deferred-DELETE window: confirm text promises
  10 s → optimistic per-key snapshot hide → toast with action button and
  10 s countdown; `deleteReadingQ` fires only inside `setTimeout(10_000)`;
  undo = `clearTimeout` + snapshot restore, zero fetch; expiry deletes
  exactly once; deferred-DELETE failure → Thai error toast + invalidate so
  the record visibly returns (never silent loss of either outcome);
  cross-talk keep-filter so undoing A cannot resurrect still-pending B —
  **caught by e2e case (f)**; Toast extension backward-compatible (23
  `useToast` consumers keep byte-identical legacy behavior; action button
  ≥ 44px focusable, Thai label, `aria-hidden` countdown).
- **D4 battery** at the frozen head, reproduced identical by D5 at
  `8b29d36`: vitest FULL 32 files **503 passed / 1 designed skip**, `tsc -b`
  clean, oxlint 0 errors (18 warnings: 2 new test-seam exports disclosed as
  deliberate + 16 pre-existing), Playwright FULL **213/213** `--workers=1`,
  guard **344/344**, runtime **62/62**, release checker OK v1.1.0 exit 0,
  `git diff --check` clean, scope = exactly the 8 claimed files with
  CURRENT-WORK.md diff EMPTY.
- **D5 fresh-GLM independent review — VERDICT: APPROVED** at exact head
  `8b29d368e5c7067ff5fb811fdccb638951ce8749` (receipt issuecomment-6838284688;
  zero P1/P2; **4 informational P3s** listed below; all 9 adversarial
  checklist items independently reproduced from the reviewer's own
  checkouts). The PR description's plan to fill the handoff D5 section was
  superseded by the reviewer's self-contained issuecomment receipt + the WO
  D5 record; this D6 keeps the pointer durable.
- **Implementation PR #177** merged as
  `64764f9f92c56951f324b49910cf0c06493603b0` (second parent = D5-APPROVED
  reviewed head `8b29d36`; parents `5ea4f71` + `8b29d36`, expected-head
  discipline held; merge-executor trail issuecomment-6838319926;
  mergedAt 2026-11-12T23:00:32Z).

### Release v1.1.0 — LIVE and verified

- Pages deploy run **43325064280 SUCCESS** @ `64764f9`.
- Live asset `assets/index-g2DPM_0q.js` (HTTP 200 fresh fetch) carries
  version `1.1.0` (2 occurrences) + `app-version-chip` marker + the Thai
  undo promise `ย้อนกลับได้ภายใน 10 วินาที` + `ย้อนกลับ` ×6.
- Annotated tag `v1.1.0` (tag object `b55975e688b3bd1fcf3851304a93845fd1e64bb3`)
  dereferences to `64764f9` and is pushed (ls-remote confirmed:
  `refs/tags/v1.1.0` + peeled `^{}` both verified).
- `python3 scripts/check_release_version.py --tag v1.1.0` → **OK
  (v1.1.0; CHANGELOG entry v1.1.0)**, exit 0 — re-verified by the closeout
  lane at `64764f9` (2026-11-13).
- Closeout-lane guard re-verification at `64764f9`:
  `python3 scripts/test_env_coordination_guard.py` → **Ran 344 tests — OK**.

### Honest notes recorded for D6

1. **Unload/reload mid-window semantics** — the module-scope timer is
   destroyed on full unload/reload, so the pending delete is canceled and
   the record stays. Conservative direction (no data loss possible; worst
   case is the record remains and can be deleted again); documented in the
   WO + handoff §2 + code comment; judged acceptable by D5 §4. The confirm
   text's 10 s promise can be silently broken only in the safe direction.
2. **SSR-seam test split** — vitest runs in `node` env with no
   jsdom/happy-dom dependency (no DOM library in packages entries; lock
   untouched); real-browser click-through covered by e2e (b)/(f). The two
   resulting test-seam lint warnings are disclosed as deliberate.
3. **`npm --no-save` local workaround** — `package-lock.json` byte-identical
   to base (absent from the PR #177 diff); the pre-existing lock drift
   (typescript@5.9.3) predates this lane.
4. **Refetch-during-pending transient** — `setQueryData` refreshes
   `dataUpdatedAt` and the global staleTime (30 s) gates
   refetchOnWindowFocus/Mount/Reconnect, so nothing automatically resurrects
   the hidden row mid-window; only an explicit invalidation (e.g. another
   create/update within 10 s) can transiently re-show it; self-healing at
   expiry; documented and D5-verified.
5. **`hooks.ts` + `supabase-queries.ts` claimed-but-unused honest
   conditionals** — both were conditionally claimed; neither was needed, so
   both stayed untouched (`useDeleteReading` is now an unreferenced harmless
   export); D5 verified the untouched state.

### P3 follow-up list (informational — no code change required for closure)

1. **Union-merge suggestion for the double-undo oldest-first list
   transient** — `restoreReadingsSnapshots` (DailyFormPage.tsx:157-172)
   wholesale-snapshot overwrite can drop the first-restored row from the
   list view until the next staleTime-gated refetch when undoing A then B
   oldest-first; server truth never affected; self-heals; suggested future
   repair = union-merge the own row instead of whole-snapshot overwrite.
   **Priority follow-up named by the closeout instruction.**
2. Unload/reload mid-window confirm-text polish candidate (a one-line
   "ปิดเบราว์เซอร์ = ยกเลิกการลบ" note).
3. Handoff jsdom-wording nit (this file's earlier "no jsdom/happy-dom
   anywhere in package-lock.json" is imprecise — the strings appear in
   vitest's peerDependencies metadata inside the lock; the substantive
   claim — no DOM library as an installed dependency/packages entry — is
   TRUE and independently verified).
4. Same-id re-confirm inside the window spawns a second "ลบแล้ว" toast
   wired to the same pending entry; after one undo the other toast's button
   is a silent no-op until expiry.

Plus the 2 PR #176 R2 recorded P3s above (route-level auth-gating wording;
10-vs-23 toast consumers).

### Frontier after this closeout merges

NO active claim; **WAITING_REAL_FEEDBACK** resumes — the next product lane
is chosen only after real-world staff feedback arrives on (1) Building
module real usage (unlocks the `ENV-BUILDING-REPAIR-001-C1` D9b/Gate-2
path), (2) Twin water-motion first impressions, (3) v1.0.1 speed
improvements in daily use, (4) any v1.0.x friction, and now (5) the v1.1.0
10-second undo UX in daily delete flows. Owner-manual reminders #155
(re-enable ENV hooks) + #156 (OPENROUTER_API_KEY renewal) remain OPEN;
`ENV-BUILDING-REPAIR-001-C1` stays WAITING_EXTERNAL. Scope lock released at
generation 1; CLOSED confers no fresh mutation authority.

### Narrative hygiene recorded in this closeout

The stale `ENV-APP-VERSION-001 / CLAIMED` frontier bullet header is fixed
header-only to CLOSED with PR refs (#168 `5bca608` second parent `88f43dd`;
closeout #169 `3875bc68b5bdfae8ee4c232a8bc47a33280c94d0`) per the `ENV-UNDO-001-C1` dependency follow-up —
the same repair class as the PERF bullet fix in the ENV-MAINT-001-C1
closeout PR #175. Fence for this transition:
`expected_policy_revision = 64764f9f92c56951f324b49910cf0c06493603b0`,
`expected_registry_hash = 1e44ffb45c69b44ad1b457c455a086cee7fd900a29e9012be8c34be6762c39b5`
(registry block AT base, guard method — verified to reproduce the PR #176
fence convention: the same method on the block at `fb124ac` yields
`feacaf1a…`, the value PR #176 wrote).
