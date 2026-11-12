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

## D2 — RED (to be appended by the implementing lane)

## D3 — Implementation (to be appended by the implementing lane)

## D4 — Battery (to be appended by the implementing lane)

## D5 — Independent review (to be appended by the implementing lane)
