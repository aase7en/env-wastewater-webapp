# Work Order — ENV-REPAIR-REPORT-HONESTY-001 (Claim ENV-REPAIR-REPORT-HONESTY-001-C1, gen 1)

**Status: DELIVERED—CLOSED (PR #265 merged `e0738029e5a01ebaf6a8d5187f4789565e3102cc`, released v1.15.1, deployed, tagged v1.15.1; closeout = registry transition off main @ `e073802`).** This WO is
written by the
docs-only claim transition off main @
`c12775f05d2e15187dbc97c031471a05e9cd2f13` (PR: the
`docs/env-repair-report-honesty-001-claim` transition; STOP at
REVIEW_REQUESTED — the implementing lane NEVER merges; the authorized
reviewer owns approval + merge). The implementing lane holds the claim ONLY
after this transition PR merges (worktree
`_worktrees/env-repair-report-honesty-001`, implementation branch off the
post-merge main tip — name pinned at its D1, house
`feat/env-repair-report-honesty-001` form).
DELIVERY CHAIN (closed 2026-11-21): D1 receipt `a4d7968` (LIVE probe re-run
read-only at `2b1cfd9`, 3/3 shapes identical) → D2 truthful RED `d7bd2be`
(8 failed / 55 passed, existing 23 model pins stay green) → D3 fix `c7119be`
→ release `efbc085` (v1.15.1 PATCH) → implementation PR #265 merged
`e073802` (second parent EXACTLY the D5-APPROVED head `ac230ae2`,
expected-head discipline `--match-head-commit`, merge trail
issuecomment-7063107774; merge stat = exactly 12 files 398+/15−,
`safety-summary.ts` absent — AppSheet verbatim predicates byte-untouched).
D5 fresh-GLM APPROVED issuecomment-7063078774 at exact head `ac230ae2`
(0 P1 / 0 P2 / 2 informational P3 carried to the ledger; own battery at head:
vitest FULL 998P/1skip, tsc clean, oxlint 0, Playwright FULL 336/336 w=1,
guard 344/344, runtime 62/62, checker OK v1.15.1; RED REPRODUCED at isolated
`d7bd2be`). Release v1.15.1 LIVE: Pages run 44907777019 SUCCESS @ `e073802`,
live markers fresh (index-uwg6S2PD.js: 1.15.1 ×2 + chip markers + ไม่มีข้อมูล
×11 + ยังสรุปความพร้อมใช้งานไม่ได้ ×1), tag v1.15.1 (`28c7c3f7`) peels to
`e073802`, checker `--tag v1.15.1` exit 0. Post-merge at `e073802`: guard
344/344 + validate-registry ok:true 53 claims (claim still CLAIMED at merge
time). Full receipts: registry `one_next_safe_action` + handoff D6.
Group-A corrective report-honesty repair — the 3 CONFIRMED defects from the
read-only reproduction receipt `/tmp/env-groupA-repro-2026-11-20.md`
(UTH[AI]-ENV directive 2026-11-20 Group A, P1 Reports Data Honesty; the
receipt is attached VERBATIM as the lane handoff Appendix A):

1. **the family ☑ ready-verdict coercing unknown/incomplete data to Ready** —
   `family-report-models.ts` extinguisher `:204-213` gates ☑ on
   `inspectedCount > 0 && abnormalHeadlineCount === 0` while
   `safety-summary.ts:149-155` puts blank/null/off-vocab rows OUTSIDE both
   verbatim predicates (counted only in `incompleteCount`, never in
   `abnormalHeadlineCount` `:164`) ⇒ an incomplete-only month renders
   "☑ ถังดับเพลิงทุกจุดอยู่ในสภาพพร้อมใช้งาน"; light `:321-333` same class.
   The empty-month variant is ALREADY honest — the defect is strictly the
   partial/unknown-data month.
2. **the dual print-area overlap** — `ReportsPage.tsx` keeps TWO independent
   print-model states (`printModel` `:175-179` / `familyPrint` `:267-273`)
   that never clear each other; all 5 print views share ONE
   `.tos-print-area` class and `report-print.css:76-96` makes every such
   node visible + absolutely positioned at the same top-left under
   `@media print` ⇒ opening a ทส.1 view then a family view superimposes both
   reports on the printed page (browser print-to-PDF is the sole production
   output path, `family-report-models.ts:5-9` D1-2 pin).
3. **the water monthly totals rendering 0 with no data** —
   `report-summary.ts:399` `sumNonNull([])` returns `0` and
   `trimNum(0)` = `"0"` (`family-report-models.ts:96-99`) ⇒ an empty month
   or a rows-but-all-null month renders "การบริโภคน้ำประปาบาดาล ตลอดเดือน …
   0 ลบ.ม."; the same coercion class is reachable at `ReportsPage.tsx:587`
   `fmt(summary.ws.sumWaterIn, 1)` → "0.0 m³". The lib's OWN convention
   elsewhere is null-honest (`MonthlyPoint.total` null → "—" `:351`,
   `carbon.cy/ly` null `:470-472`) — the water recorded-sums are the outlier.

User-visible behavior corrections → **PATCH v1.15.1**. NO Phase 5, NO EF,
NO CI, NO new visual language, NO AppSheet-verbatim-predicate touch.

## 0. Lane identity — the reproduction receipt verdicts pinned

> (receipt VERDICT 1, verbatim) **Extinguisher/Light report "Ready" with
> unknown/incomplete data: CONFIRMED-DEFECT** (partial-data variant only;
> empty-month variant is honest). … `summaryReady: "☑
> ถังดับเพลิงทุกจุดอยู่ในสภาพพร้อมใช้งาน" ← unknown rendered as READY` …
> Test gap: the 23 existing model tests pin the disclosure notes … but never
> assert `summaryReady` for an incomplete/unknown-only month — the coercing
> behavior is active but unpinned.

> (receipt VERDICT 2, verbatim) **Print-area overlap when two report types
> open: CONFIRMED-DEFECT.** … With two areas mounted, BOTH become visible and
> BOTH are absolutely positioned at the same top-left → the printed page
> superimposes the two reports (text over text). … On screen there is NO
> overlap; the defect is the printed/PDF output.

> (receipt VERDICT 3, verbatim) **Water monthly totals showing 0 with no
> data: CONFIRMED-DEFECT** (headline rollup; mitigated by adjacent notes). …
> `summaryLines: ["การบริโภคน้ำประปาบาดาล ตลอดเดือน พฤศจิกายน 0 ลบ.ม.", …]
> ← 0 rendered with NO data` … unknown coerced to 0.

> (receipt, explicitly OUT) EF `notify-monthly-report` readiness gate:
> **NOT-A-DEFECT** (presence-only, honest skip on zero). P2.5
> `SafetyColiformSummarySection`: **NOT-IMPPLICATED** (counts-only display).
> Empty-month family models: **already honest** (null verdict + the
> "ไม่ออกความพร้อมใช้งานจากข้อมูลว่าง" fallbacks, pinned by tests).

### 0.1 Investigation record (repo-side evidence at base — re-verified at transition; LIVE re-run still REQUIRED at implementation D1)

The receipt verified HEAD `40cab6b76c85a3bf23acff1f21203c2b11c49da2`; the
transition-time `git diff 40cab6b..c12775f` over the cited reports-family
files is EMPTY (every anchor below byte-identical at THIS base
`c12775f`). D1 still re-runs the probes read-only at the implementation base.

| # | Evidence | File:line | Fact |
|---|----------|-----------|------|
| R1 | `trimNum` coerces only null/undefined/NaN to "—" | `frontend/src/components/reports/family-report-models.ts:96-99` | `trimNum(0)` = `"0"` — a numeric zero always renders as 0 |
| R2 | `sumNonNull` starts at 0 and returns a number | `frontend/src/lib/report-summary.ts:147-154` | `sumNonNull([])` = `0` — "no data" and "data summing to 0" are indistinguishable at the type level |
| R3 | Extinguisher ☑ gate ignores incomplete rows | `family-report-models.ts:204-213` + notes `:218-221` | `has = inspectedCount > 0`; ☑ iff `abnormalHeadlineCount === 0`; incomplete rows surface only as the "มี N รายการที่ค่าไม่ครบตามสูตร" note and never block ☑ |
| R4 | Light ☑ gate counts only verbatim `ไม่ผ่าน` | `family-report-models.ts:321-333` (+ notes `:337-345`) | `failCount` = verbatim `ไม่ผ่าน` only; blank/"รอผล"/"เสีย"/off-vocab land in `otherCount` and never block ☑ |
| R5 | The AppSheet VERBATIM predicates leave unknowns outside both buckets | `frontend/src/lib/safety-summary.ts:149-155` + `:164` | blank/null/off-vocab ⇒ `incompleteCount` only, never `abnormalHeadlineCount` — **these predicates stay BYTE-UNTOUCHED** (§3 guard 2) |
| R6 | Two independent print states that never clear each other | `frontend/src/pages/ReportsPage.tsx:175-179` + setters `:224-239`; `:267-273` + setters `:278-313`; mounts `:871-888`/`:949-967` | `onOpenPrint` does not clear `familyPrint`; `onOpenFamilyPrint` does not clear `printModel`; the family picker only swaps the NEXT model |
| R7 | Print CSS superimposes every mounted area | `frontend/src/components/reports/report-print.css:76-96` (the ONLY `@media print` block in `frontend/src`) | `body * { visibility: hidden }` + `.tos-print-area { visibility: visible; position: absolute; top: 0; left: 0 }`; all 5 print views share the class (Tos1 `:25`, Tos2 `:22`, Extinguisher `:24`, Light `:22`, Water `:25`) ⇒ two mounts = superimposed print |
| R8 | Water summary lines render `trimNum` of the sums verbatim | `family-report-models.ts:472-475` + note `:478`; `WaterPrintView.tsx:62-66` render + empty-table note `:44-48` | `"การบริโภคน้ำประปาบาดาล ตลอดเดือน … 0 ลบ.ม."` on a zero/all-null month; the recorded-days note exists but the headline still reads 0 |
| R9 | The P1.6 numeric layer has the same coercion class | `ReportsPage.tsx:584-626` (water cards) incl. `:587` `fmt(summary.ws.sumWaterIn, 1)` | renders "0.0 m³" when no day contributed a value — the honesty card above shows มีบันทึก 0 วัน but the recorded-sum card shows 0 |
| R10 | The lib's OWN null-honest precedents | `report-summary.ts` `MonthlyPoint.total` null → "—" `:351`; `avgWastewaterIn.mean` null `:170`; `carbon` `cy/ly` null `:470-472` | null-honest rollup is the established house convention in this same lib — the water recorded-sums are the outlier |
| R11 | The empty months are ALREADY honest | `ExtinguisherPrintView.tsx:77`, `LightPrintView.tsx:66` (`summaryReady ?? "ไม่มีรายการตรวจสอบในเดือนนี้ (ไม่ออกความพร้อมใช้งานจากข้อมูลว่าง)"`), pinned by ext test `:157-168` + light test `:131-137` | the defect is strictly the partial/unknown-data month; the empty-month behavior is pinned and must not regress |
| R12 | The test gaps (why the defects are unpinned) | ext test `:170-180` pins `incompleteCount=1` but never `summaryReady`; light test `:118-129` pins `otherCount=2` but never `summaryReady`; water test `:103-113` pins a data month with NO empty-month case; e2e `env-parity-p4-005-family-reports.spec.ts:150-246` exercises single-view flows only | truthful RED = adding the missing pins so they FAIL first |

**Working conclusion:** all 3 defect shapes are CONFIRMED-DEFECT with live
probe evidence in the receipt; the fixes are bounded rendering/gating
corrections (§2), not formula changes — the AppSheet verbatim predicates
(R5) stay byte-untouched, and every fix keys on "days/rows with a non-null
value", never on `recordedDays` alone or on zero-equality.

## 1. Authorization basis

1. Owner standing Goal-mode instruction ("ต่อยาวๆ ตามแผนและ roadmap ที่วางไว้").
2. **The UTH[AI]-ENV directive 2026-11-20 Group A (P1 Reports Data
   Honesty)** — the corrective lane for the confirmed report-honesty defect
   classes.
3. **The read-only reproduction receipt `/tmp/env-groupA-repro-2026-11-20.md`**
   (HEAD-verified `40cab6b`, zero mutations, method disclosed — source trace
   + live read-only execution of the pure model libs + existing vitest specs
   re-run read-only 23/23 pass at HEAD; all 3 verdicts CONFIRMED with live
   probe evidence) — attached VERBATIM as the lane handoff Appendix A. An
   insufficient authorization basis parks the claim unmerged (reviewer
   adversarial check).

## 2. The item inventory — every receipt verdict adjudicated (none silently dropped)

| Item | Source | Ruling | Where it lands |
|------|--------|--------|----------------|
| (1) family ☑ ready-verdict coerces unknown/incomplete → Ready (ext `:204-213`, light `:321-333`) | receipt VERDICT 1 | **FIX** — gate ☑ on zero-abnormal AND zero-incomplete/other; incomplete/unknown surfaces as its own honest non-verdict state disclosing the count (unknown ≠ zero ≠ ปกติ) | D2 RED (ext + light suites) → D3 |
| (2) dual print-area overlap (ReportsPage states + `report-print.css:76-96`) | receipt VERDICT 2 | **FIX** — state-level mutual clearing primary (opening one print mode unmounts the other; exactly ONE `.tos-print-area` at a time); `report-print.css` stays untouched unless the D1-2 ruling adjudicates class hardening as defense-in-depth | D2 RED (overlap e2e) → D3 |
| (3) water monthly totals zero-coercion (`report-summary.ts:147-154/:399` + `family-report-models.ts:472-475` + `ReportsPage.tsx:587`) | receipt VERDICT 3 | **FIX** — null-honest rollup (`number \| null`, mirroring R10) or a render gate keyed on **days with a non-null value**; rows-but-all-null MUST also render non-0; headline "ไม่มีข้อมูล"/"—", never 0 | D2 RED (water + report-summary suites) → D3 |
| EF `notify-monthly-report` readiness gate | receipt — NOT-A-DEFECT | **OUT** (presence-only, honest skip; optional wording note is not corrective scope) — byte-untouched | §3 guard 4 |
| P2.5 `SafetyColiformSummarySection` | receipt — NOT-IMPPLICATED | **OUT** (counts-only display, no ready-verdict headline) — byte-untouched | §3 guard 5 |
| Empty-month family models | receipt — already honest | **PIN-ONLY** — the existing honest behavior stays green through RED and head | D2/D4 |
| `safety-summary.ts` AppSheet VERBATIM predicates (`:149-155`, `:164`) | WO §0.1 R5 | **BYTE-UNTOUCHED** — only the READY-gating + rendering honesty in `family-report-models.ts` change; P4.5 + prior parity semantics stay | §3 guard 2 |
| Release ruling | D1-5 | **PATCH v1.15.1** (user-visible behavior corrections, no new features) | §4 |

## 3. Out-of-scope guards (lure traps — each excluded item needs its own NEW reviewed claim transition)

1. **Phase 5 cutover of any kind** — dual-run, backfill, AppSheet retirement:
   OWNER-GATED (the owner's action), never this lane.
2. **`frontend/src/lib/safety-summary.ts` + `safety-summary.test.ts`
   byte-untouched** — they carry the AppSheet VERBATIM predicates (R5); the
   fix gates ☑ in `family-report-models.ts` only; making `incompleteCount`
   count as abnormal is FORBIDDEN (it would rewrite the AppSheet semantics).
3. **No EF touch** — `supabase/**` entirely (the closed PREVENT-001 lane's
   surface): migrations, config.toml, seed/, `ingest-sensor/`,
   `notify-threshold/`, `notify-monthly-report/` — the receipt rules the
   notify-monthly-report gate NOT-A-DEFECT; zero overlap with this lane.
4. **The ทส. print views are content-frozen** — `Tos1PrintView.tsx` +
   `Tos2PrintView.tsx` byte-untouched (the overlap fix is the ReportsPage
   state wiring, not the ทส. views).
5. **No new visual language / design token / route** — the family print
   views (`ExtinguisherPrintView`/`LightPrintView`/`WaterPrintView`) are
   MINIMAL-touch only: the honest non-verdict fallback strings per D1-1 and
   the water no-data state per D1-3; no layout or visual-language change;
   `report-print.css` untouched unless D1-2 adjudicates defense-in-depth.
6. **CI** — `.github/**` untouched; no new workflows.
7. **Reference/plan docs** — `APPSHEET-PARITY-PLAN.md`, reference 12,
   AGENTS.md, design docs: read-only.
8. **`supabase-queries.ts` READ-ONLY** — no fetch changes expected; a needed
   change pivots to the coordinator, never silent.
9. **Credentials** — no Telegram token/JWT literal in any committed file or
   printed receipt (ห้าม commit ทุกกรณี); `.env` + `data/raw/` never
   committed, never printed.
10. **No silent drift** — D1 re-runs the reproduction probes read-only at
    the implementation base; a drift pivots to re-scope, never a silent fix.

## 4. Release decision — PATCH v1.15.1 (D1-5 recommends; reviewer confirms)

**v1.15.0 → v1.15.1 PATCH.** Justification: all three fixes are user-visible
behavior corrections to delivered surfaces (the printed/PDF reports and the
/reports water cards) — corrections, no new features; the house PATCH
precedent applies. `frontend/package.json` `1.15.0` → `1.15.1` + ONE Thai
พ.ศ. CHANGELOG entry carrying the PR number. `check_release_version.py` must
report `OK (v1.15.1)` at the implementation head. Tag/deploy decisions stay
with the reviewer (this transition claims the code+docs scope only).

## 5. D-phase plan (Track-Z GLM)

- **D1 — read-only re-verification + rulings:** re-run the reproduction
  probes read-only at the implementation worktree off the post-merge main
  tip; confirm the 3 defect shapes still reproduce (R1–R12 anchors; a drift
  pivots per §3 guard 10). Record the rulings D1-1…D1-6 in the handoff.
- **D2 — truthful RED:** the three defect classes failing FIRST:
  `family-report-models.extinguisher.test.ts` (incomplete-only month ⇒
  `summaryReady` is NOT a Ready verdict), `family-report-models.light.test.ts`
  (unknown-result-only month ⇒ same), `family-report-models.water.test.ts` +
  `report-summary.test.ts` (empty AND rows-but-all-null months ⇒ headline is
  NOT 0), the overlap e2e (open a ทส.1 print view then a family print view ⇒
  exactly ONE `.tos-print-area` in the print-emulated DOM). The existing 23
  model pins stay green through the RED commit (R11/R12 — the honest
  empty-month behavior must not regress).
- **D3 — implement the smallest honest fix per defect:** (1) ready-gating +
  honest non-verdict rendering per D1-1; (2) the ReportsPage mutual clearing
  per D1-2; (3) the water null-honest rollup + ReportsPage honest gate per
  D1-3. Scope ⊆ §7.
- **D4 — battery:** vitest FULL, `tsc -b`, oxlint, Playwright FULL
  workers=1 INCLUDING the print-overlap e2e under print emulation, guard
  344/344, runtime 62/62, validate-registry ok,
  `check_release_version.py` OK v1.15.1, `git diff --check` clean,
  token/JWT-literal grep 0; diff vs base ⊆ §7.
- **D5 — fresh-GLM independent review** at the exact frozen head.
- **STOP at REVIEW_REQUESTED** — implementer never merges.

## 6. D1 adjudication items (reviewer)

- **D1-1 the honest non-verdict wording (extinguisher + light):** must never
  read as a pass verdict; discloses the incomplete/unknown count; unknown
  never zero; the `summaryReady ?? fallback` view path needs the non-verdict
  variant to flow through (ExtinguisherPrintView.tsx:77 / LightPrintView.tsx:66).
- **D1-2 the overlap mechanism:** state-level mutual clearing (primary) vs
  `report-print.css` distinct-class hardening (adjudicated defense-in-depth
  only; the CSS file stays untouched if the state fix suffices — the
  reviewer rules).
- **D1-3 the water honest type:** null-honest `number | null` (mirroring
  `MonthlyPoint.total`/`carbon.cy`) vs a render gate keyed on non-null-value
  days — rows-but-all-null MUST also render non-0 either way.
- **D1-4 the e2e print-emulation approach:** the overlap pin lives in the
  existing family spec vs a NEW sibling spec (house naming).
- **D1-5 the release ruling:** PATCH v1.15.1 per §4 (adversarial check: is
  any fix actually a feature? the expected answer is no — corrections only).
- **D1-6 the verbatim-predicate preservation:** `safety-summary.ts`
  byte-untouched — adversarial diff check.

## 7. Registry-scope summary (mirrors the CURRENT-WORK claim append)

Claimed: `frontend/src/components/reports/family-report-models.ts` + its 3
co-located tests, `frontend/src/lib/report-summary.ts` +
`report-summary.test.ts`, `frontend/src/pages/ReportsPage.tsx`,
`report-print.css` CONDITIONALLY (only per a D1-2 adjudication; expected
untouched), the 3 family print views MINIMAL,
`frontend/tests/e2e/env-parity-p4-005-family-reports.spec.ts` (+ a NEW
sibling spec only if D1-4 separates them), `CHANGELOG.md` +
`frontend/package.json` (v1.15.1), this lane's WO/handoff +
`docs/ai/CURRENT-WORK.md`. Everything else FORBIDDEN (§3).
