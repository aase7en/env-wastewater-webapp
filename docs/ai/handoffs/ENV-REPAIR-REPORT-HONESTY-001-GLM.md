# Handoff — ENV-REPAIR-REPORT-HONESTY-001-GLM (Claim ENV-REPAIR-REPORT-HONESTY-001-C1, gen 1)

**You (the implementing lane, Track-Z GLM) hold this claim ONLY after the
claim-transition PR merges.** Until then this document is the binding brief.
Worktree `_worktrees/env-repair-report-honesty-001` (clean, off the
post-merge main tip); implementation branch off that tip (house
`feat/env-repair-report-honesty-001` form, name pinned at D1). STOP at
REVIEW_REQUESTED — you never merge; the authorized reviewer owns approval +
merge of every PR in this lane's chain. WO
`docs/work-orders/ENV-REPAIR-REPORT-HONESTY-001.md` holds the full binding
pins (§0 the lane identity + the R1–R12 investigation record, §1
authorization, §2 the item inventory, §3 out-of-scope guards, §4 PATCH
v1.15.1, §5 D-phases, §6 D1 items, §7 scope). Read it before writing
anything. Summary:

## 1. Deliver THIS lane (Group-A corrective report-honesty repair — the 3 CONFIRMED defects)

- **(1) The family ☑ ready-verdict must not coerce unknown/incomplete data
  to Ready** — `frontend/src/components/reports/family-report-models.ts`
  extinguisher `:204-213` gates ☑ on `inspectedCount > 0 &&
  abnormalHeadlineCount === 0` while `safety-summary.ts:149-155` puts
  blank/null/off-vocab rows OUTSIDE both verbatim predicates (counted only
  in `incompleteCount`, never in `abnormalHeadlineCount` `:164`) ⇒ an
  incomplete-only month renders "☑ ถังดับเพลิงทุกจุดอยู่ในสภาพพร้อมใช้งาน"
  (live-probe receipt verbatim in Appendix A). Light `:321-333` same class —
  `failCount` counts only verbatim `ไม่ผ่าน`; everything else lands in
  `otherCount` and never blocks ☑. The empty-month variant is ALREADY honest
  (null verdict + the "ไม่ออกความพร้อมใช้งานจากข้อมูลว่าง" fallbacks, pinned
  by tests — do not regress it) — the defect is strictly the
  partial/unknown-data month. Corrective: gate ☑ on zero-abnormal AND
  zero-incomplete/other; incomplete surfaces as its own honest non-verdict
  state disclosing the count (D1-1 wording ruling; unknown ≠ zero ≠ ปกติ).
- **(2) The dual print-area overlap** — `frontend/src/pages/ReportsPage.tsx`
  keeps TWO independent print-model states (`printModel` `:175-179` /
  `familyPrint` `:267-273`) that never clear each other; all 5 print views
  share ONE `.tos-print-area` class and `report-print.css:76-96` makes every
  such node visible + absolutely positioned at the same top-left under
  `@media print` ⇒ opening a ทส.1 view then a family view superimposes both
  reports on the printed page (browser print-to-PDF is the sole production
  output path, `family-report-models.ts:5-9` D1-2 pin). Corrective:
  state-level mutual clearing (opening one print mode unmounts the other) —
  `report-print.css` stays untouched unless the D1-2 ruling adjudicates
  class hardening as defense-in-depth.
- **(3) The water monthly totals must not render 0 with no data** —
  `frontend/src/lib/report-summary.ts:399` `sumNonNull([])` returns `0` and
  `family-report-models.ts:96-99` `trimNum(0)` = `"0"` ⇒ an empty month or a
  rows-but-all-null month renders "การบริโภคน้ำประปาบาดาล ตลอดเดือน …
  0 ลบ.ม." (live-probe receipt verbatim in Appendix A); the same coercion
  class is reachable at `ReportsPage.tsx:587` `fmt(summary.ws.sumWaterIn, 1)`
  → "0.0 m³". The lib's OWN convention elsewhere is null-honest
  (`MonthlyPoint.total` null → "—" `:351`, `carbon.cy/ly` null `:470-472`) —
  the water recorded-sums are the outlier. Corrective: null-honest rollup
  (or a render gate keyed on **days with a non-null value**, never
  `recordedDays` alone — rows-but-all-null MUST also render non-0), headline
  "ไม่มีข้อมูล"/"—", never 0 (D1-3 type ruling).

## 2. Lure traps (each excluded item needs its own NEW reviewed claim transition)

1. "Count incomplete rows as abnormal so ☑ flips" — FORBIDDEN: that rewrites
   the AppSheet VERBATIM predicates in `safety-summary.ts` (WO §3 guard 2);
   only the READY-gating + rendering honesty in `family-report-models.ts`
   change; P4.5 + prior parity semantics stay.
2. "The empty month renders nothing — fix it too" — it is ALREADY honest
   (null verdict + explicit fallbacks, pinned); PIN-ONLY, never regress.
3. "Harden report-print.css with distinct classes while you're there" —
   CONDITIONAL per D1-2 only (adjudicated defense-in-depth); the primary fix
   is the ReportsPage state wiring; the ทส. views stay content-frozen.
4. "The EF announce says พร้อมแล้ว — fix the wording too" — the
   notify-monthly-report gate is VERDICT NOT-A-DEFECT (presence-only,
   honest skip); `supabase/**` byte-untouched.
5. "MINOR bump since you touched many files" — PATCH v1.15.1 (WO §4):
   user-visible behavior corrections, no new features.
6. "Skip the D1 re-run, the receipt is fresh enough" — the pivot rule (WO
   §3 guard 10) is binding: re-run the probes read-only at the
   implementation base; a drift pivots to re-scope, never a silent fix.

## 3. Honesty pins (reviewer-pinned)

- unknown ≠ zero ≠ normal everywhere — a month with no contributing value
  never renders 0; an incomplete month never renders a pass verdict; the
  disclosure always counts the unknown rows.
- Data honesty rule: `latest` ≠ `live`; simulation explicitly labeled —
  untouched by this lane but never violated by it.
- The receipt (Appendix A) is the defect evidence of record — quote it
  verbatim, never paraphrase the verdicts.
- No PHI: none exists in this chain; never route any patient data anywhere.
- Dates Thai พ.ศ. (+543) + Thai months in any user-facing string touched
  (the CHANGELOG entry + any new honest-state wording).
- Secrets: `SUPABASE_ACCESS_TOKEN` and any credential never printed to
  chat, logs, or receipts; `.env`/`data/raw/` never committed.

## 4. D-phase plan (mirrors WO §5 — details there)

D1 read-only re-verification + rulings → D2 truthful RED (the 3 defect
classes failing first: ext/light incomplete-or-unknown-only months assert
`summaryReady` is NOT a Ready verdict; water empty + all-null months assert
the headline is not 0; the overlap e2e asserts exactly one
`.tos-print-area` after opening a ทส.1 view then a family view; the
existing 23 model pins stay green through the RED commit) → D3 implement
(the smallest honest fix per defect; scope ⊆ WO §7) → D4 battery (vitest
FULL, `tsc -b`, oxlint, Playwright FULL workers=1 incl. the overlap e2e,
guard 344/344, runtime 62/62, validate-registry ok, checker OK v1.15.1,
`git diff --check` clean, token/JWT-literal grep 0) → D5 fresh-GLM →
**STOP at REVIEW_REQUESTED**.

## 5. D1 pins (decide + record in this handoff before D2)

1. The D1 probe receipt verbatim (the 3 defect shapes at the implementation
   base; expected: identical to Appendix A — a drift pivots per WO §3
   guard 10).
2. D1-1 the honest non-verdict wording (ext + light) — never a pass verdict,
   discloses the count, unknown never zero.
3. D1-2 the overlap mechanism ruling (state-level mutual clearing primary;
   CSS class hardening only as adjudicated defense-in-depth).
4. D1-3 the water honest type ruling (null-honest `number | null` vs render
   gate on non-null-value days; rows-but-all-null non-0 either way).
5. D1-4 the e2e print-emulation approach (existing spec vs NEW sibling).
6. D1-5 the release ruling confirmation (PATCH v1.15.1).
7. D1-6 the verbatim-predicate preservation check (`safety-summary.ts`
   byte-untouched — adversarial diff).

## 6. Standing (unchanged by this lane)

Phase 5 คัทโอเวอร์ OWNER-GATED (dual-run ≥14 วัน per plan §6 P5.1 line 271 +
the 5-condition DoD line 276 — the owner's action; the readiness toolkit
delivered via PR #262 is preparation-only); hooks #155 approved-not-started
+ #156 OPENROUTER_API_KEY renewal (owner-manual);
ENV-BUILDING-REPAIR-001-C1 WAITING_EXTERNAL; ENV-SUNDAYMCP-ROUTING-001
CLAIMED (disjoint surface); the parity follow-up ledger stays. This lane
adjudicates ONLY its three confirmed defects and sweeps nothing else.

---

## Appendix A — the read-only reproduction receipt, VERBATIM

Provenance: `/tmp/env-groupA-repro-2026-11-20.md`, produced 2026-11-20 by
the Group-A (P1 — Reports Data Honesty) read-only investigation; HEAD
verified `40cab6b76c85a3bf23acff1f21203c2b11c49da2` (= the transition-era
main, 25 commits before THIS base `c12775f05d2e15187dbc97c031471a05e9cd2f13`;
the transition-time `git diff 40cab6b..c12775f` over the cited
reports-family files is EMPTY — every anchor byte-identical). Reproduced
below byte-for-byte:

```

# Group A (P1 — Reports Data Honesty) — READ-ONLY reproduction report

- Date: 2026-11-20
- Repo: /Volumes/MAC_WORK/DevWorkspace/Github/env-wastewater-webapp
- HEAD verified: `40cab6b76c85a3bf23acff1f21203c2b11c49da2` (= current `origin/main`, descendant of `f88157b`). Freshness gate passed (`git merge-base --is-ancestor origin/main HEAD` → true).
- Method: source trace + live read-only execution of the pure model libs (probe script at `/tmp/kilo/env-groupA-probe.ts`, outside the repo) + existing vitest specs re-run read-only (3 files, 23/23 pass at HEAD).
- Mutations: NONE. Worktree clean at exit (`git status` shows only pre-existing untracked `_worktrees/`, `supabase/.temp/`). No commits, no DB writes, no file changes inside the repo.

---

## VERDICT 1 — Extinguisher/Light report "Ready" with unknown/incomplete data: **CONFIRMED-DEFECT** (partial-data variant only; empty-month variant is honest)

### (a) Print-model ☑/☐ computed pair — how unknown values render

**Extinguisher** — `frontend/src/components/reports/family-report-models.ts`
- :204-213 — verdict gate: `has = summary.inspectedCount > 0`; ☑ Ready iff `has && summary.abnormalHeadlineCount === 0`.
- :218-221 — incomplete rows are disclosed ONLY as a note ("มี N รายการที่ค่าไม่ครบตามสูตร — นับแยกต่างหาก ไม่ถูกนับเป็นปกติ"), they do NOT block the ☑ verdict.
- `frontend/src/lib/safety-summary.ts:149-155` — incomplete rows (blank/null/off-vocab component values) fall OUTSIDE both verbatim predicates → counted only in `incompleteCount`, never in `abnormalHeadlineCount` (:164). So "not verbatim-abnormal ⇒ ☑ Ready" coerces unknown → Ready.

**Light** — same file
- :321-322 — `failCount` counts only verbatim `ไม่ผ่าน`; everything else (blank, "รอผล", "เสีย", any off-vocab string) lands in `otherCount`.
- :327-333 — ☑ Ready iff `has && failCount === 0`. Off-vocab/unknown results never block the verdict; disclosed only as notes (:337-345).

**Live probe evidence (executed against HEAD source):**
```
EXT incomplete-only month (1 inspection, all 4 component enums null):
  totalInspected: 1, abnormalCount: 0, incompleteCount: 1
  summaryReady: "☑ ถังดับเพลิงทุกจุดอยู่ในสภาพพร้อมใช้งาน"   ← unknown rendered as READY
  summaryAction: "☐ … จำนวน 0 ถัง"

LIGHT unknown-result-only month (test_result "เสีย" and ""):
  failCount: 0, otherCount: 2
  summaryReady: "☑ โคมไฟฉุกเฉินทุกจุดอยู่ในสภาพพร้อมใช้งาน"  ← unknown rendered as READY
```
The zero-data months are honest: `summaryReady/summaryAction = null` (family-report-models.ts:206, 325; pinned by ext test :157-168 and light test :131-137) and both family views fall back to "ไม่มีรายการตรวจสอบในเดือนนี้ (ไม่ออกความพร้อมใช้งานจากข้อมูลว่าง)" (ExtinguisherPrintView.tsx:77, LightPrintView.tsx:66). The defect is strictly the **partial/unknown-data** month.

**Test gap:** the 23 existing model tests pin the disclosure notes (ext test :170-180 `incompleteCount=1`; light test :118-129 `otherCount=2`) but never assert `summaryReady` for an incomplete/unknown-only month — the coercing behavior is active but unpinned.

### (b) notify-monthly-report EF readiness gate — NOT-A-DEFECT

`supabase/functions/notify-monthly-report/index.ts`
- :211-218 — readiness = PRESENCE ONLY: `count` of `public.reading` rows in the covered month (`head:true, count:"exact"`, gte/lte month bounds).
- :218-238 — zero rows → status `skipped`, reason `no-reading-data`, NO notice sent (honest no-data, unknown never fabricated).
- :106-112 — the notice text is "รายงาน ทส.1/ทส.2 ประจำเดือน X พร้อมแล้ว" — it announces **printability**, never "ผ่าน"/completeness, and covers only ทส.1/ทส.2 (wastewater), not the safety families.
- Presence-based readiness is an explicitly recorded D1 pin in the file contract (:14-17 "Readiness = data presence … Data exists → ready; an honest no-data month is recorded status 'skipped'"). Judgment: NOT-A-DEFECT. Caveat (advisory only): a month with a single sparse row is announced "พร้อมแล้ว" — truthful (the report IS printable and honestly partial) but could be misread as complete; wording hardening is optional, not corrective scope.

### Verdict: CONFIRMED-DEFECT for the family print-model pair (ext + light); NOT-A-DEFECT for the EF gate.

---

## VERDICT 2 — Print-area overlap when two report types open: **CONFIRMED-DEFECT**

### Trace
1. **All 5 print views share ONE CSS class** `.tos-print-area`: Tos1PrintView.tsx:25, Tos2PrintView.tsx:22, ExtinguisherPrintView.tsx:24, LightPrintView.tsx:22, WaterPrintView.tsx:25.
2. **ReportsPage keeps two INDEPENDENT print-model states that never clear each other:**
   - `printModel` (ทส.1/ทส.2) — ReportsPage.tsx:175-179, set by `onOpenPrint` (:224-239), mounted at :871-888.
   - `familyPrint` (ext/light/water) — :267-273, set by `onOpenFamilyPrint` (:278-313), mounted at :949-967.
   - No `useEffect` cleanup; the family picker (`setFamily`, :913) only changes which model is BUILT next and does not unmount an already-open view; switching family kind replaces `familyPrint` only. Opening a ทส.1 view and then a family view leaves BOTH `.tos-print-area` nodes in the DOM.
3. **Print CSS superimposes them:** `frontend/src/components/reports/report-print.css:76-96` — `body * { visibility: hidden }`, then `.tos-print-area, .tos-print-area * { visibility: visible }` and `.tos-print-area { position: absolute; top: 0; left: 0 }`. With two areas mounted, BOTH become visible and BOTH are absolutely positioned at the same top-left → the printed page superimposes the two reports (text over text). This is the only `@media print` block in `frontend/src` (grep-verified).
4. Either print button calls plain `window.print()` (ReportsPage.tsx:878, :955) — the whole document prints, so both areas appear regardless of which button was pressed.
5. **Test gap:** e2e `frontend/tests/e2e/env-parity-p4-005-family-reports.spec.ts` exercises single-view flows only (:150-246); no two-views-open scenario is pinned.

On screen there is NO overlap (both render inline in normal page flow); the defect is the printed/PDF output — the exact production path (browser print-to-PDF is the sole output mechanism, family-report-models.ts:5-9 D1-2 pin).

---

## VERDICT 3 — Water monthly totals showing 0 with no data: **CONFIRMED-DEFECT** (headline rollup; mitigated by adjacent notes)

### Trace
1. `frontend/src/lib/report-summary.ts:399` — `sumWaterIn: sumNonNull(chain.map((c) => c.water_in))`; `sumNonNull([])` returns `0` (a number, not null — :147-154). Same for `sumChlorineReal` (:391).
2. `frontend/src/components/reports/family-report-models.ts:472-475` — `summaryLines` use `trimNum(ws.sumWaterIn)`; `trimNum(0)` = `"0"` (:96-99 — only null/undefined/NaN render "—").
3. **Live probe evidence:**
```
WATER zero-rows month:
  sumWaterIn: 0, sumChlorineReal: 0, recordedDays: 0, missingDays: 30
  summaryLines: ["การบริโภคน้ำประปาบาดาล ตลอดเดือน พฤศจิกายน 0 ลบ.ม.",
                 "ปริมาณสารเคมี… (คลอรีนน้ำ) 0 ลิตร"]            ← 0 rendered with NO data
WATER rows-but-all-null month (1 row, water_in/chlorine null):
  summaryLines: same "0 ลบ.ม." / "0 ลิตร"                       ← unknown coerced to 0
```
4. WaterPrintView renders the lines verbatim at `family-water-total-water` / `family-water-total-chlorine` (WaterPrintView.tsx:62-66).
5. Mitigations present but insufficient per Unknown ≠ Zero: empty-table row "ไม่มีบันทึกในเดือนนี้" (:44-48) and the note "มีบันทึก 0 วัน · ไม่มีบันทึก 30 วัน … วันที่ไม่มีบันทึกไม่ถูกนับเป็น 0" (family-report-models.ts:478). The headline number is still a zero-coercion of "no data".
6. **Test gap:** `family-report-models.water.test.ts` pins a data month (75 ลบ.ม., :103-113) but has NO empty-month case (23/23 pass; the zero rendering is unpinned).
7. Same coercion class is reachable in the P1.6 numeric layer: ReportsPage.tsx:587 `fmt(summary.ws.sumWaterIn, 1)` → "0.0 m³" (with the honesty card above showing มีบันทึก 0 วัน). Note the lib's OWN convention elsewhere is null-honest (`MonthlyPoint.total` null → "—" :351; `avgWastewaterIn.mean` null :170; carbon `cy/ly` null :470-472) — the water recorded-sums are the outlier.

---

# Proposed corrective scope (IF corrective WO is opened — nothing changed in this investigation)

### Fix 1 — family ☑/☐ verdict must not coerce unknown → Ready
- `frontend/src/components/reports/family-report-models.ts`
  - Extinguisher (:204-213): ☑ requires `incompleteCount === 0` too; otherwise emit a non-verdict line (e.g. "ยังสรุปความพร้อมใช้งานไม่ได้ — มีรายการค่าไม่ครบตามสูตร N รายการ") keeping the note.
  - Light (:321-333): ☑ requires `otherCount === 0` too; otherwise emit the same class of non-verdict line.
  - (Views already render `summaryReady ?? fallback`; the fallback string may need a per-case variant — ExtinguisherPrintView.tsx:77 / LightPrintView.tsx:66.)
- Tests: `family-report-models.extinguisher.test.ts` + `family-report-models.light.test.ts` — RED pins first: incomplete-only month ⇒ summaryReady is NOT ☑ (null or explicit non-verdict); same for unknown-result-only light month. Keep existing 23 pins green.
- Optional: e2e family spec pin for the non-verdict rendering.

### Fix 2 — one print area at a time
- `frontend/src/pages/ReportsPage.tsx` (state-level, minimal): `onOpenPrint` clears `setFamilyPrint(null)`; `onOpenFamilyPrint` clears `setPrintModel(null)` (:224-239, :278-313). Alternative/complement: distinct print-area classes per report family + container-scoped `@media print` visibility in `report-print.css` (guards future mounts).
- Tests: new e2e scenario — open ทส.1 print view, then open a family print view, assert exactly one `.tos-print-area` (or only one visible region) exists; plus a ReportsPage-level vitest pin if state-level fix chosen.

### Fix 3 — water rollup: no data ⇒ "—" / ไม่มีข้อมูล, never 0
- `frontend/src/lib/report-summary.ts` `buildWaterSupplySummary`: make `sumWaterIn` / `sumChlorineReal` null-honest when no day contributed a non-null value (type becomes `number | null`, mirroring `MonthlyPoint.total`/`carbon.cy`), OR keep `number` and gate at render time on "days with a non-null value === 0".
- `frontend/src/components/reports/family-report-models.ts` (:472-475): summaryLines use the honest gate (`trimNum` already handles null → "—"; add a "ไม่มีข้อมูล" variant keyed on recordedDays/value-days).
- `frontend/src/pages/ReportsPage.tsx` (:584-626 P1.6 water cards): same gate for `sumWaterIn` / `sumChlorineReal` / estimates (estimates already flagged; the recorded-sum cards are the gap). Gate must key on **days with a non-null value**, not `recordedDays` alone (rows-but-all-null case must also render non-0).
- Tests: `family-report-models.water.test.ts` — RED pin: empty month ⇒ headline "ไม่มีข้อมูล"/"—", NOT "0 ลบ.ม."; plus all-null-values month. `report-summary` tests if the type changes; e2e family spec water totals pin.

### Explicitly out of scope (verified fine)
- EF `notify-monthly-report` gate (presence-only, honest skip on zero) — no corrective change required; optional wording note.
- P2.5 `SafetyColiformSummarySection` — counts-only display (ผ่าน/ไม่ผ่าน/รอผล as separate numbers, SafetyColiformSummarySection.tsx:275-417); no ready/ผ่าน verdict headline; not implicated.
- Empty-month family models — already honest (null verdict + explicit "ไม่ออกความพร้อมใช้งานจากข้อมูลว่าง" fallback).

```
