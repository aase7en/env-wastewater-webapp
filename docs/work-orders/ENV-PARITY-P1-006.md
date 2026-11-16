# Work Order — ENV-PARITY-P1-006 (AppSheet parity Phase 1, lane P1.6)

**Claim:** `ENV-PARITY-P1-006` / `ENV-PARITY-P1-006-C1`, generation 1, status **CLAIMED** — this WO is authored by the docs-only claim transition (`docs/env-parity-p1-006-claim`); the implementing lane activates ONLY after that transition PR is independently reviewed and merged to main.
**Lane:** รายงานสรุปช่วงวัน (ทดแทน Filter_Water/tap water_Filter ฝั่งตัวเลข — PDF อยู่ Phase 4) (plan §6 Phase 1 row P1.6) — the NUMERIC layer only: per-selected-date-range aggregates, monthly/yearly rollups, honest missing-day counts, threshold-hit counts, charts via the EXISTING house chart components. **NO PDF in this lane** (ทส.1/ทส.2 PDF = Phase 4, owner-gated separately per plan §6 P4.1; the existing ReportsPage PDF-template flow is out of scope and byte-untouched).
**Surface (plan §6):** `/reports` (route EXISTS — `App.tsx:232` lazy-mounts `frontend/src/pages/ReportsPage.tsx`; NO route change needed)
**Worktree:** `_worktrees/env-parity-p1-006` · **Transition branch:** `docs/env-parity-p1-006-claim` · **Implementation branch:** `feat/env-parity-p1-006`
**Base:** `12df32fa413f60866daf6401b1bbf5246d442b7a` (= origin/main tip at transition authoring; clean, fetched, ff verified — the ENV-PARITY-P1-005-C1 docs-only closeout merge; registry 30 claims, `ENV-PARITY-P1-005-C1` CLOSED)

---

## 1. Authorization basis (record)

1. **Owner standing Goal-mode instruction 2026-11-15/16**: "ต่อยาวๆ ตามแผนและ roadmap ที่วางไว้".
2. **Owner parity authorization 2026-11-14** ("วางแผนทำให้ระบบมีรูปแบบการกรอกข้อมูล, การคำนวณข้อมูลเหมือน appsheet … จนกว่าโปรแกรม ENV จะใช้ทดแทนได้ทั้งหมด") → `docs/ai/APPSHEET-PARITY-PLAN.md`.
3. **Plan §6 Phase 1 lane table row P1.6** (binds the scope exactly): "รายงานสรุปช่วงวัน (ทดแทน Filter_Water/tap water_Filter ฝั่งตัวเลข — PDF อยู่ Phase 4)" — surface `/reports`.
4. **Plan §3 Filter_Water coverage row** (plan line 38): `/reports` `ReportsPage` + `/trends` + `/carbon` + `v_monthly_summary`/`v_overview_carbon` — "ยอดรวมช่วงวัน (sum_energy/water/wastewater/chlorine/sludge) = SQL views ครอบแล้ว; กราฟ 12 เดือน (VC_CY_01..12 + QuickChart URL) = Recharts ในเครื่องแทน; CO2 ×0.4999 = `carbon.v_overview_carbon` (factor เดียวกัน); **ขาด:** PDF ทส.1/ทส.2 + ลิงก์ไฟล์ (→ Phase 4 owner gate)" — this lane delivers the missing in-app date-range NUMERIC report on `/reports` (the QuickChart→native Recharts decision is plan §4 DIVERGE row, plan line 153: "กราฟในเครื่อง (Recharts) … ตัด QuickChart URL ทิ้ง").
5. **Delivered prerequisites (all on main at base, consumed READ-ONLY):** P1.2 `core.equipment_spec` + `wastewater.v_reading_meter_chain` (LAG chain, delta≤0→NULL+`meter_boundary_flag`, spec-at-date joins, `pump1/pump2_m3` spec-driven volumes, `chlorine_used_real` ÷SWITCH verbatim — PR #190); P1.3 thresholds + `wastewater.v_reading_critical_flags` (computed, never stored — PR #187); P1.4 form parity + the `public` security_invoker façade pattern (PR #193, D1-7 ACCEPTED); P1.5 `water_supply.v_daily_check_chain` (`energy_use_estimate` "ค่าประมาณจากสเปก", `water_in_estimate` "ประมาณจากชั่วโมงปั๊ม", `chlorine_usage_realy` ÷(1+9) spec-derived — PR #196, v1.3.0 LIVE).

## 2. Pinned ground truth (VERBATIM — these BIND)

Source: `docs/ai/digital-twin/12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md` — **§3.7 ตาราง `Filter_Water` — 69 คอลัมน์ (key: ID)**, ref 1544–2383, and **§3.10 ตาราง `tap water_Filter` — 21 คอลัมน์ (key: _ComputedKey)**, ref 2708–2960, plus **§5 findings** (5.1/5.3/5.4, ref 5641–5683). Every formula/value below is quoted verbatim with its source line.

### 2.1 Range definition (both tables)

- `Filter_Water`.`Start Date` / `End Date` — init `TODAY()` (ref 1632–1646); range predicate = `[วันที่ บันทึก] >= Start AND <= End` (verbatim in `temporary_data` ref 1668–1675, `Filter` ref 1781–1793).
- `tap water_Filter`.`Start date` / `End date` — init `TODAY()` (ref 2756–2770); range predicate = `[Date] >= Start AND <= End` over `น้ำประปา` (verbatim in every SUM below).
- ENV: the report exposes วันเริ่ม/วันสิ้นสุด date pickers defaulting to today (UI default only — inclusive range, both endpoints recorded).

### 2.2 Filter_Water numeric columns → ENV report aggregates (wastewater side)

| AppSheet column (ref) | Formula (verbatim, abridged to its operation) | ENV report aggregate |
|---|---|---|
| `Sum_Energy` (1685–1699) | `SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ], range))` | **ไฟฟ้ารวมช่วงวัน** — ENV derives from `wastewater.v_reading_meter_chain.delta_kwh` (meter-chain LAG deltas, P1.2; the AppSheet per-day input is a raw typed value per §5.3 — the chain delta is the honest derived replacement, boundary/reset rows → NULL and are EXCLUDED from the sum, counted in the missing/unavailable-day honesty line, never 0) |
| `Sum_waste_water` (1717–1731) | `SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณน้ำเสียที่เข้าระบบบำบัด], range))` | **ปริมาณน้ำเข้ารวม + ค่าเฉลี่ยต่อวันที่มีบันทึก** (from the existing dashboard/detail range rows; recorded values only) |
| `Sum_Chlorine` (1733–1747) | `SUM(SELECT(ข้อมูลคุณภาพน้ำ[คลอรีนน้ำ ที่ใช้], range))` | **คลอรีนน้ำที่ใช้รวม** (recorded values) |
| `useage_Chlorine` (1765–1779) | `SUM(SELECT(ข้อมูลคุณภาพน้ำ[คลอรีนน้ำที่ใช้จริง], range))` | **คลอรีนใช้จริงรวม** — ENV: `v_reading_meter_chain.chlorine_used_real` (÷SWITCH 1:2/1:4/1:9 verbatim, P1.2) |
| `W/V_Chlorine Litter` (1944–1950) | `=[useage_Chlorine]*1.2` | display-layer constant ×1.2 (litters) with VERBATIM provenance — **D1-3**: replicated as a named display constant (`REPORT_CHLORINE_LITTER_FACTOR = 1.2`) sourced ref 1949, never folded silently into sums; reviewer adjudicates |
| `Sum_excess sludge` (1749–1763) | `SUM(SELECT(ข้อมูลคุณภาพน้ำ[ตะกอนส่วนเกินที่นำไปกำจัด], range))` | **ตะกอนส่วนเกินรวม** (recorded values) |
| `ปริมาณสูบ` (no direct AppSheet column — ENV spec-driven per plan §6 P1.2 "ปริมาณสูบรวม (spec-driven)") | — | **ปริมาณสูบรวม** = Σ(`pump1_m3` + `pump2_m3`) from the chain view — spec-flow × hours, **flagged "ค่าประมาณจากสเปก"** per the P1.2/P1.5 estimate pattern; missing spec or boundary rows → excluded + counted honestly, never 0 |
| Quality averages | (no AppSheet range column; ENV parity per the lane instruction) | **ค่าเฉลี่ยคุณภาพน้ำช่วงวัน**: DO (do_average)/pH/TDS/SV30/Free Chlorine — averaged over days WITH values only; the denominator (จำนวนวันที่มีค่า) displayed next to every average |
| `VC_CY_01..12` (1964–2126) | `IF(MONTH(TODAY())>n, SUM(SELECT([ปริมาณการใช้ไฟฟ้าของระบบ], YEAR=THIS_YEAR, MONTH=n)), "null")` | **รายเดือน breakdown (ปีนี้)** — 12 monthly energy sums; the AppSheet "month not yet reached → null" honesty maps to honest NULL (a month with no records → NULL, never 0) |
| `VC_LY_01..12` (ref 2152+ pattern) | same SUMs for `YEAR(TODAY())-1` | **รายเดือน breakdown (ปีก่อน)** — same honesty |
| `VC_Elec_CY`/`VC_Elec_LY` (2128–2144) | `[VC_CY_01] & "%2C" & …` | (AppSheet chart-payload plumbing — superseded by native Recharts, NOT replicated) |
| `VC_Chart_URL` (1952–1962) | QuickChart line URL "เปรียบเทียบการใช้ไฟระบบบำบัดน้ำเสียต่อปี" | **native Recharts line/bar** (house component vocabulary, Thai labels) — plan §4 DIVERGE (line 153) explicitly retires the QuickChart URL |
| `Total_CO2_CY`/`Total_CO2_LY` (1617–1618) | ×0.4999 factor | **existing surface, NO recompute** — `carbon.v_overview_carbon`/`carbon.v_monthly_co2e` already carry the same factor (plan line 38); the report may surface them READ-ONLY; recomputing CO2 in this lane is FORBIDDEN |
| `month_thai`/`year_thai`/`St.*`/`End.*` (1817–1926) | `SWITCH(MONTH(...))` Thai months; `year+543` | **พ.ศ. display vocabulary** (house pattern; Thai month names ref 1822–1835 verbatim order) |
| `Export PDF`/`PDF`/`PDF 2`/`Link.PDF1/2`/`Count` (1566–1570, 1660–1683) | ทส.1/ทส.2 PDF generation | **OUT — Phase 4** (plan §6 P4.1, owner-gated separately; recorded, not silent) |
| `Filter`/`Temp`/`temporary_data` (1781–1815) | range row lists | the report's per-day detail list within the range (ordered by date; the "รายการตรวจสอบที่เรียงแล้ว" ORDERBY-DESC pattern ref 2852–2868 applies) |

### 2.3 tap water_Filter numeric columns → ENV report aggregates (น้ำประปา side)

| AppSheet column (ref) | Formula (verbatim, abridged) | ENV report aggregate |
|---|---|---|
| `Sum_water_in` (2796–2810) | `SUM(SELECT(น้ำประปา[Water_In], [Date] range))` | **ปริมาณน้ำเข้ารวม (ประปา)** — ENV: recorded `water_in` values; days with only the estimate carry `water_in_estimate` **flagged "ประมาณจากชั่วโมงปั๊ม"** and are counted honestly, never substituted silently |
| `Sum_Chlorine_use` (2812–2826) | `SUM(SELECT(น้ำประปา[Chlorine_usage_realy], range))` | **คลอรีนจริงรวม (ประปา)** — ENV: `water_supply.v_daily_check_chain.chlorine_usage_realy` (÷(1+9) from the `chlorine_mix_groundwater` spec, P1.5); days without the spec → excluded + counted |
| `Energy usage` (2828–2842) | `SUM(SELECT(น้ำประปา[Energy_use], range))` | **ไฟฟ้ารวม (ประปา)** — ENV: `energy_use_estimate` (hours × spec-at-date 3.7 kWh/h) — **flagged "ค่าประมาณจากสเปก"** per P1.5; boundary/missing-spec days excluded + counted |
| `Kg_chlorine` (2844–2850) | `=[Sum_Chlorine_use]*1.2` | ×1.2 display constant, same **D1-3** treatment (ref 2849) |
| `รายการตรวจสอบที่เรียงแล้ว` (2852–2868) | `ORDERBY(FILTER("น้ำประปา", range), [Date], FALSE)` | the ประปา per-day detail list (date DESC) |
| `Start/End.*thai` (2899–2960) | Thai พ.ศ. labels | พ.ศ. display vocabulary |

### 2.4 Honesty rules (binding — house truth constraints + §5 findings)

1. **Missing days counted and shown, never zero** (lane instruction + plan risk note "กฎ unknown ≠ zero ต้องไม่พลาด"): the report enumerates the calendar days of the selected range and shows **จำนวนวันที่มีบันทึก / ไม่มีบันทึก** separately for each side (บ่อบำบัด = days with a `wastewater.reading` row; น้ำประปา = days with a `water_supply.daily_check` row). Missing days contribute NOTHING to sums/averages (no 0-fill, no interpolation); averages display their real denominator.
2. **Derived estimates carry flags into aggregates**: any aggregate that includes an estimate-derived component (energy จาก delta/meter-chain, ปริมาณสูบจากสเปก, น้ำประปา energy/water estimates) displays the **"ค่าประมาณจากสเปก"** / **"ประมาณจากชั่วโมงปั๊ม"** flag + its provenance, per the P1.5 delivered pattern. A value that is fully recorded (e.g., น้ำเข้า, คลอรีนที่ใช้) does NOT carry an estimate flag.
3. **SIMULATED vocabulary NOT used** (lane instruction): all report inputs are real recorded data or recorded-derived estimates — no simulation label; but derived-estimate flags ARE required (rule 2). latest ≠ live: the report is derived-from-records, never presented as live telemetry.
4. **Threshold-hit counts** from `wastewater.v_reading_critical_flags` (P1.3 view — computed, never stored; READ-ONLY): count of readings in the range hitting each flag class (DO/FreeCl/pH/TDS/SV30/น้ำเข้า critical + immediate conditions). Never re-evaluates thresholds client-side; never reads/writes `wastewater.threshold_alert`.
5. **พ.ศ. everywhere user-facing** (`Y_thai = year+543`, ref 1843, 1880) — range labels, chart axes, month/year breakdown headers.
6. **No PHI**; no data writes (the report is read-only); tests make no durable writes.

## 3. Deliverables

1. **Data-layer decision (PINNED — D1-1): CLIENT-SIDE aggregation from EXISTING views. NO migration in this lane.**
   Rationale (recorded for reviewer adjudication):
   - **House pattern**: dashboards/reports fetch rows from views filtered by an exact date range client-side and aggregate in the client — `fetchDashboardByMonth` over `v_dashboard_14day` with `.gte/.lt` (`supabase-queries.ts:111-127`), introduced by the C3 fix (2026-08-03, in-file comment `ReportsPage.tsx:53-56`) that removed the cap-60-days bug precisely by range-fetching the exact period. The Overview/Command-Center aggregation follows the same view-row → client-rollup shape.
   - **Honesty requires per-row flags**: the chain views carry per-row derived values with honest NULLs + flags (`meter_boundary_flag`, `spec_missing`, `streak_reset`, P1.2; `hour_boundary_flag`/`spec_missing_flag`, P1.5). A SQL SUM collapses NULLs silently — the missing-day and estimate-provenance honesty of §2.4 is enumerable only client-side. AppSheet's own model is the same (virtual SUM columns over row lists).
   - **Blast radius**: no new PostgREST surface (no façade, no grants, no `notify pgrst`), no D1-7 pattern needed, no ENV_DB apply gate in this lane.
   - **Escalation valve**: if implementation discovers a hard blocker (payload/RLS/perf), it STOPS and records a deviation — a summary SQL view (with the P1.4 D1-7 security_invoker façade) would then require an explicitly adjudicated scope amendment, NEVER a silent switch.
2. **Pure lib** `frontend/src/lib/report-summary.ts` + `frontend/src/lib/report-summary.test.ts`: pure aggregation functions over range rows — sums/averages over non-NULL recorded values (real denominators), calendar-day enumeration + missing-day counts per side, month/year grouping (พ.ศ. headers, Thai month names ref 1822–1835), estimate-flag propagation into aggregates, threshold-flag-class counting, ×1.2 chlorine-litter display constants (D1-3, named + provenance-commented), พ.ศ. formatting helpers. Never a second write path; never re-derives view math (it only aggregates view-provided values).
3. **Wiring** `frontend/src/lib/supabase-queries.ts` (**additive "P1.6 report reads" section ONLY** — D1-2): range fetchers following the `fetchDashboardByMonth` pattern — wastewater range rows (`v_dashboard_14day` or `v_reading_detail` for quality/flows + `v_reading_meter_chain` for chain-derived deltas/volumes/real-chlorine + `v_reading_critical_flags` for flag counts) and น้ำประปา range rows (`public` façade of `water_supply.v_daily_check_chain`). `water-supply.ts`, `hooks.ts`, `form-parity.ts(+test)` stay byte-untouched (P1.5/P1.4 surfaces).
4. **Report UI** `frontend/src/pages/ReportsPage.tsx`: a date-range summary section (วันเริ่ม/วันสิ้นสุด, defaults today per ref 1632–1646/2756–2770) rendering the §2.2/§2.3 aggregates with พ.ศ. labels, the honesty line (มี/ไม่มีบันทึก), estimate flags, threshold-hit counts, month/year breakdowns, and charts via the EXISTING house Recharts vocabulary (TrendsPage pattern — line/bar for the range; NO new visual language; genuinely new chart design parks for Track F). The EXISTING PDF-template chooser + ใบแจ้งซ่อม flow stay byte-untouched. **NO PDF for the new section** (Phase 4).
5. **E2E** `frontend/tests/e2e/env-parity-p1-006.spec.ts`: RED-first — report renders range aggregates correctly from fixtures; missing-days honesty (missing days counted, never 0-filled); estimate flags on derived aggregates; monthly/yearly rollups with honest NULL for no-record months; พ.ศ. labels; threshold-hit counts; existing PDF-template flow regression-guarded; no durable writes.
6. **Version + CHANGELOG**: `frontend/package.json` **1.3.0 → 1.4.0 MINOR** (**D1-4**: new user-visible report capability on `/reports` per the CHANGELOG criteria — ฟีเจอร์ใหม่ที่ใช้งานได้โดยไม่กระทบของเดิม; not a patch) + `CHANGELOG.md` Thai พ.ศ. entry in the implementation PR + annotated tag at the deployed merge SHA post-deploy.
7. **Docs**: this WO + `docs/ai/handoffs/ENV-PARITY-P1-006-GLM.md` (D-phase log appended) + `docs/ai/CURRENT-WORK.md` claim record maintained.

## 4. Execution routing (D-plan)

- Track-Z GLM (numeric + wiring; charts via EXISTING house components — no new visual language; genuinely new chart design parks for Track F).
- **D2 RED-first**: unit + e2e fail truthfully pre-implementation (report-summary module absent; report UI absent). Record RED counts verbatim; RED-era files committed or provenance disclosed per the P1.2/P1.5 D5 precedent.
- **D3 implement** per §3 (lib + wiring + UI + tests GREEN; no migration — the D1-1 valve stays closed unless an adjudicated amendment opens it).
- **D4 battery**: FULL vitest + `tsc -b` + lint + Playwright FULL `workers=1` + guard suite (344/344 at base) + runtime suite (62/62 at base) + `check_release_version.py` OK v1.4.0 + `git diff --check` + validate-registry ok.
- **D5 fresh-GLM independent review** at the exact frozen head (Terra cross-model eligible after 2026-11-20 per the P1.2 D1 receipt — never a silent downgrade), with an independently executed battery rerun where possible.
- **STOP at REVIEW_REQUESTED; implementer never merges.**

## 5. Mutable scope (claim-bound)

`frontend/src/pages/ReportsPage.tsx` · `frontend/src/lib/report-summary.ts` (new) · `frontend/src/lib/report-summary.test.ts` (new) · `frontend/src/lib/supabase-queries.ts` (additive P1.6 section only) · `frontend/tests/e2e/env-parity-p1-006.spec.ts` (new) · `CHANGELOG.md` · `frontend/package.json` · `docs/work-orders/ENV-PARITY-P1-006.md` · `docs/ai/handoffs/ENV-PARITY-P1-006-GLM.md` · `docs/ai/CURRENT-WORK.md`

## 6. Forbidden scope

`docs/ai/HANDOFF.md` · `AGENTS.md` · `docs/ai/architecture/ENV-COORDINATION-GUARD.md` · `scripts/env_coordination_guard.py` · `scripts/env_autonomy_runtime.py` · `docs/ai/APPSHEET-PARITY-PLAN.md` · `docs/ai/digital-twin/**` (incl. reference doc 12 — READ-ONLY ground truth) · `.github/**` · `data/**` · `.env` · `.kilo/**` · **ALL of `supabase/**`** — NO migration exists in this lane (D1-1 client-side decision pinned; any discovered need = STOP + record + adjudicated amendment, never silent) · `wastewater.reading` + all wastewater views (`v_reading_meter_chain`, `v_reading_critical_flags`, `v_dashboard_14day`, `v_reading_detail`, legacy `v_reading_detail`) READ-ONLY · `wastewater.threshold` + `wastewater.threshold_alert` (flag counts come from the computed view only) · `carbon.*` views READ-ONLY (CO2 surfacing only, never recompute) · `water_supply.daily_check` + `water_supply.v_daily_check_chain` + its `public` façade READ-ONLY · `core.equipment_spec` READ-ONLY (spec provenance surfaced, never changed; no new seeds) · delivered P1.2–P1.5 frontend surfaces READ-ONLY: `WaterSupplyPage.tsx`, `DailyFormPage.tsx`, `ReadingsListPage.tsx`, `admin/EquipmentSpecPage.tsx`, `TrendsPage.tsx`, `CarbonPage.tsx`, `water-supply.ts`, `water-supply-parity.ts(+test)`, `form-parity.ts(+test)`, `hooks.ts`, `App.tsx` (route `/reports` already registered, `App.tsx:232`) · the existing ReportsPage PDF-template flow (ทส.1/ทส.2/ใบแจ้งซ่อม + `lib/pdf.ts`) byte-untouched · `/flow` (`FlowDiagramPage.tsx`, `components/flow/**`) · Digital Twin (`components/digital-twin/**`, `components/pfd/**`) · CI · personnel pages · Phase 4 surfaces (PDF ทส.1/ทส.2 for the new section, alert dispatcher, Telegram, scheduled reports) · any data backfill/write (the report is read-only; history backfill = Phase 5 per plan §7).

## 7. Truth constraints (binding)

unknown ≠ 0 (ห้ามแทนค่าศูนย์ — missing days counted + shown, never 0-filled; averages carry real denominators; no-record months → honest NULL, never 0; boundary/spec-missing rows excluded + counted, never coerced); latest ≠ live (derived-from-records, never "live"); SIMULATED vocabulary unused here but derived-estimate aggregates ALWAYS carry "ค่าประมาณจากสเปก"/"ประมาณจากชั่วโมงปั๊ม" + provenance; AppSheet formulas/value lists/Thai month names VERBATIM-recorded with source lines; NO client-side re-derivation of view math (aggregate only); ×1.2 constants named + provenance-commented (D1-3), never silently folded; `supabase/**` untouched (D1-1); พ.ศ. user-facing dates; no PHI; no durable writes in tests; no assertion weakening; implementer never merges.

## 8. Acceptance

1. `/reports` renders the date-range summary covering the §2.2/§2.3 numeric layer: ปริมาณน้ำเข้ารวม/เฉลี่ย, ไฟฟ้ารวม (จาก meter-chain deltas, flagged), ปริมาณสูบรวม (spec-driven, flagged), คลอรีนใช้จริงรวม, ค่าเฉลี่ยคุณภาพน้ำ (DO/pH/TDS/SV30/FreeCl with real denominators), จำนวนวันที่มี/ไม่มีบันทึก (both sides), เดือน/ปี breakdowns (honest NULL for no-record months), threshold-hit counts.
2. Charts use the existing house Recharts vocabulary with Thai labels; all user-facing dates พ.ศ.
3. D1-1 holds: `git diff` vs main touches NO `supabase/**` file; the D1-2 wiring point is the additive `supabase-queries.ts` section; P1.4/P1.5 surfaces byte-unchanged.
4. D4 battery green incl. checker OK v1.4.0; D5 approved; **STOP at REVIEW_REQUESTED**.

## 9. D-phase log (implementation lane appends here)

(awaiting D2 RED receipt after the claim transition merges)
