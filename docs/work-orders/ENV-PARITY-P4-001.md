# Work Order — ENV-PARITY-P4-001 (Claim ENV-PARITY-P4-001-C1, gen 1)

**Status: REGISTERED — CLAIMED (this docs-only claim transition; implementation starts ONLY after the authorized reviewer merges this transition)**

**Governance pattern:** PR #183–#239 claim-transition series (docs-only claim → reviewed merge → implementation lane → D5 fresh-GLM → closeout). Direct predecessor: ENV-PARITY-P3-006 (PRs #237/#238/#239 — PHASE 3 COMPLETE, all 6 lanes CLOSED; base `8e56592c26448f654e21ea265a485ca86abb1f50` = the P3.6 closeout merge). This lane is **Phase 4 lane 1, the FIRST Phase-4 lane** — the owner's Phase-4 gate is OPEN per plan §5.3 (answers B4–B7 of 2026-11-15).

**Routing:** Track-Z GLM (report data lib + print-ready views + tests — lib logic, data contracts, deterministic tests; no art direction — the report views mirror the AppSheet template layouts as functional print documents; any decorative restyling beyond template fidelity parks for Track F and is recorded). One writer per file; the implementing lane never merges its own PR; the authorized reviewer owns approval + merge. **STOP at REVIEW_REQUESTED.**

## 0. Lane identity — plan row pinned VERBATIM, boundary + mechanism decided at claim

AppSheet parity program **Phase 4 — ระบบอัตโนมัติ + BI — lane P4.1** (plan `docs/ai/APPSHEET-PARITY-PLAN.md` §6 Phase 4, row P4.1, **line 259**, quoted VERBATIM — this row text, not any dispatch shorthand, is the lane scope):

> | P4.1 | (ถ้าเจ้าของอนุมัติ PDF) เทมเพลต ทส.1/ทส.2/ถังดับเพลิง/ไฟฉุกเฉิน/น้ำประปา บน `core.pdf_template` + ตัวสร้างฝั่ง server (header จาก address) |

The owner HAS approved (B4 of 2026-11-15, plan §5.3 line 195 VERBATIM — receipt commit `fb57369`):

> | B4 | รายงาน PDF (ทส.1/ทส.2/ถังดับเพลิง/ไฟฉุกเฉิน/น้ำประปา) | **ทำ** — เทมเพลตมีอยู่แล้วในโฟลเดอร์ Drive ที่เก็บ "content" ของ AppSheet (โฟลเดอร์: content) → แหล่งเทมเพลต = โฟลเดอร์นั้น | P4.1 อนุมัติ — ดึงเทมเพลตจาก Drive content folder |

And B7 (line 198 VERBATIM): "**จากตารางแก้ไขได้** — ไม่ฝังในเทมเพลต" → report headers read from the address table — **DELIVERED by P3.5** (`core.address` 7,436 census + AddressPage); this lane consumes it READ-ONLY.

### The four claim-time decisions (the REAL design decisions of this lane)

**D1-1 — Report subset FIRST (the boundary):** THIS lane delivers **the monthly ทส.1/ทส.2 pair ONLY** (the monthly operational reports the owner actually submits — generated in AppSheet by bots `PDF` (ทส.1, File Folder Path `PDFv2`, A4) and `PDF 2` (ทส.2, `PDF_ทส2`, A4) from table `Filter_Water`). **NOT in this lane:** รายงานถังดับเพลิง (`กดสร้าง PDF` / Filter_Firer / `PDFถังดับเพลิง`), รายงานไฟฉุกเฉิน (`สร้าง PDF ไฟฉุกเฉิน` / Filter_Light / `PDFไฟฉุกเฉิน`), รายงานน้ำประปา (`กดสร้าง PDF 2` / tap water_Filter / `PDFน้ำประปา`) — each a successor lane with its own NEW reviewed claim transition; the disabled `(disabled) PDF1.1` bot stays disabled and is NEVER re-enabled in ENV; P4.2 (Telegram/alerts — B5) and P4.3 (BI) out; Phase 5 out. Full bot-parity comes later, lane by lane.

**D1-2 — Rendering mechanism (THE divergence item):** dedicated **print-ready report views** (React routes/sections rendering the exact template layout, Thai labels, พ.ศ. dates, A4 print CSS) + **browser print-to-PDF** as the production mechanism. **NOT server/edge rendering** — there is no server in the SPA + GitHub Pages architecture; adding one is a platform change far outside parity scope. This is a **documented mechanism divergence** from the plan row's own "ตัวสร้างฝั่ง server" wording — ruled HERE at claim time, with the reasons: (a) architecture (no backend exists; the parity plan §4 recorded "PDF = Phase 4" WITHOUT fixing the mechanism); (b) the 2026-11-12 001C consult precedent — both AI delegates endorsed the embed-print approach ("PDF ฝังฉลาก" class) for the /flow story; (c) **THE 001C DISTINCTION (recorded verbatim):** the 2026-11-12 "not-planned" decision in epic #110 covered the **/flow story VIDEO export ONLY — it never covered operational PDF reports** (plan lines 22/38/181/195; plan §8 line 293 names Phase 4 as the scope-lure risk with §5.3 as THE gate — the gate is now answered, so this claim is the authorized Phase-4 reach, not a 001C contradiction). Existing jspdf/html2canvas generation (`frontend/src/lib/pdf.ts` `generateTs1` :49 / `generateTs2` :87 — canvas-screenshot of on-screen tables, wired in `ReportsPage.tsx` onDownload :156-171) is **upgraded**: template-faithful print views replace the canvas-screenshot path for ทส.1/ทส.2 while keeping the export button UX (the ~600KB dynamic-import pattern stays or is superseded by `window.print()` on the dedicated view — the implementer picks one mechanism and records it; `generateRepairRequest` (ใบแจ้งซ่อม) and `downloadPDF` stay byte-untouched unless a shared-helper extraction is genuinely required, then recorded).

**D1-3 — Template fidelity (enumerate BEFORE mirroring):** the binding ground truth for the report layouts is the **actual template files in the Drive "content" folder** (owner B4). At implementation start (before D2), the lane must: (1) locate the Drive content folder READ-ONLY — **the folder id is NOT durably recorded in-repo** (the 2026-11-13 extraction fetched from the owner's publicly-shared folder; no artifact pins the folder UUID — re-locate it, read-only, ห้ามเขียน Drive); (2) enumerate the ทส.1/ทส.2 template files (record honest format: Google Docs? HTML? .docx? per B4 they exist — enumerate what is actually found); (3) record sha256 content hashes + byte sizes as provenance metadata (the P3.4 D5 P3-3 lesson); **never copy binaries into repo/DB/chat** — mirror the FIELD LAYOUTS as report-view code. In-repo verbatim support at claim time: reference 12 §3.7 `Filter_Water` 69-column census (ref 1544–1618) — the report parameter row (`Start Date`/`End Date` init TODAY(), `Export PDF` EnumList `สร้าง ทส.1`/`สร้าง ทส.2`, `PDF` File formula `CONCATENATE("Mydrive/appsheet/data/ActivatedSludge-29279640/PDFv2/",[Count],".pdf")`), the monthly aggregates (`Sum_Energy`/`Sum_Water`/`Sum_waste_water`/`Sum_Chlorine`/`Sum_excess sludge`), the Thai calendar virtual columns (`month_thai`/`year_thai`/`St.M.thai`/`St.D.thai`/`St.Y.thai` +543 class / `End.*.thai`), the year-comparison columns (`VC_CY_01..12` / `VC_LY_01..12` / `VC_Elec_CY` / `VC_Elec_LY` / `Total_CO2_CY` / `Total_CO2_LY`), and `W/V_Chlorine Litter` (the ×1.2 class). If a Drive-enumerated template contradicts the ref-12 field census, the DRIVE FILE wins (it is the owner's actual template) and the divergence is recorded — never silently.

**D1-4 — Release v1.14.0 MINOR:** new user-visible capability (print-ready ทส.1/ทส.2 reports — the owner's B4-approved feature; MINOR per the CHANGELOG criteria ฟีเจอร์ใหม่ที่ใช้งานได้โดยไม่กระทบของเดิม). `frontend/package.json` 1.13.0 → 1.14.0 + Thai พ.ศ. CHANGELOG entry in the implementation PR; annotated tag at the deployed merge SHA post-deploy per the release process (ENV-APP-VERSION-001 D6). A forced deviation = STOP + adjudicated, never silent.

## 1. Authorization basis

1. Owner standing Goal-mode instruction 2026-11-15/16 — "ต่อยาวๆ ตามแผนและ roadmap ที่วางไว้".
2. Owner parity authorization 2026-11-14 producing the plan; lane bound to §6 Phase 4 row P4.1 (line 259) per the D1 pins above.
3. **Owner answer B4 of 2026-11-15** (plan §5.3 line 195 VERBATIM, quoted in §0) — the Phase-4 gate is OPEN; "ทำ", templates already in the Drive content folder. B7 (line 198) — headers from the address table, delivered P3.5.
4. **THE 001C DISTINCTION** — the 2026-11-12 not-planned decision (epic #110) covered /flow story VIDEO export ONLY, never operational reports (plan lines 22/38/181/195; §8 line 293 gate satisfied by B4).
5. The P3.6 closeout frontier (PR #239 merged as `8e56592c26448f654e21ea265a485ca86abb1f50` = THIS transition's base; note verbatim: "**PHASE 4 (อัตโนมัติ + BI — owner-authorized B4–B7 per plan §5.3 …)** needs its own NEW reviewed claim transition per Phase reach"). This claim IS that transition.
6. The 2026-11-12 consult precedent — the embed-print approach endorsed by both AI delegates (mechanism rationale, D1-2b).
7. In-repo bot ground truth: reference 12 §9 bots `PDF`/`PDF 2` (ทส.1/ทส.2, both A4, Disable Timestamp) + §8 actions (`View PDF ทส.1`/`View PDF ทส.2` OPEN_FILE gated on `IN("สร้าง ทส.1",[Export PDF])`).

## 2. Data + layout contract (binding — every field cites its source)

**Report inputs (ทส.1/ทส.2):** a month (or Start/End date range per `Filter_Water.Start Date/End Date`) over the EXISTING delivered data surfaces — `v_monthly_summary`, the P1.2 meter-chain views, `wastewater.reading`, water-supply daily reads — plus `core.address` for the report header (B7: หน่วยงาน/ที่อัตรา — ตำบล/อำเภอ/จังหวัด; `Address_Key` display-time concatenation only, NEVER stored). **No new DB objects.**

**Header block (per B7):** rendered from `core.address` at print time; fields per the template's actual header layout (enumerated per D1-3); the P3.5 verbatim record holds the census facts (7,436 rows / 77 provinces / the hospital's tambon). The header NEVER embeds personnel identity (PHI pin).

**Monthly aggregate rows:** mirror the template's field layout (D1-3); the AppSheet aggregate semantics (`Sum_Energy`/`Sum_Water`/`Sum_waste_water`/`Sum_Chlorine`/`Sum_excess sludge`) map to the delivered SQL views/lib sums; **honesty rules in the printed output**: missing telemetry renders ค่าว่าง/ไม่มีข้อมูล — never 0 (unknown ≠ zero); estimate-derived values carry their provenance markers into the PRINTED output (×3.7 energy estimate flag, ×1.2 chlorine-litter factor note, CO2 ×0.4999 estimate provenance) per the delivered estimate conventions; `latest` ≠ `live`; simulation labeled as simulation.

**Thai calendar block:** month names Thai (`month_thai` verbatim class), years พ.ศ. (+543; the `St.Y.thai`/`year_thai` verbatim precedent), dates rendered พ.ศ. per the AGENTS.md dates rule.

**Year-comparison block (if the template carries it):** `VC_CY_01..12`/`VC_LY_01..12` (current/last year monthly) + `Total_CO2_CY/LY` — rendered only where the Drive template actually shows them (D1-3 drive-file wins rule); months with no data render honest absence, never 0.

**No Telegram step:** the AppSheet bots pair each PDF with a `Send Telegram` webhook step — that notification channel is **P4.2 (B5), NOT this lane**; this lane produces the report document only.

## 3. Data layer — DECISION: NO migration expected (D1-6)

Client-side only: new print-ready report-view components (exact names pinned at implementation start inside `frontend/src/components/reports/`), the `frontend/src/lib/pdf.ts` ทส.1/ทส.2 upgrade (or a superseding lib file — pinned at start), ReportsPage wiring (additive + the onDownload upgrade region only), the new e2e spec, lib tests. **`supabase/` diff MUST be EMPTY** — no migration, no seed row, no ENV_DB apply, no grants/notify pgrst. `core.pdf_template` rows are NOT expected (the template layouts live as code; if implementation genuinely needs a `core.pdf_template` seed row, STOP + adjudicated deviation, never silent). The /pdf-designer admin surface stays untouched.

**Escalation valve:** if implementation discovers a hard blocker (a Drive template that cannot be read read-only, a template/field-census contradiction that changes the lane shape, a missing data surface for a template field), it STOPS and records a deviation — never a silent switch, never a scope self-expansion.

## 4. Release decision — v1.14.0 MINOR (D1-4)

`frontend/package.json` 1.13.0 → **1.14.0** + Thai พ.ศ. CHANGELOG entry (ผู้ใช้เห็น: รายงาน ทส.1/ทส.2 พร้อมพิมพ์/บันทึก PDF ตรงแบบเทมเพลตเดิม) in the implementation PR; annotated tag at the deployed merge SHA post-deploy (checker `--tag v1.14.0` exit 0). If implementation proves the deliverable is not user-visible (should not happen per D1-1), STOP + adjudicated — never a silent no-bump.

## 5. D-phase plan (Track-Z GLM)

- **D1 (implementation lane, before D2)** — enumerate the Drive content folder READ-ONLY: locate the folder, enumerate the ทส.1/ทส.2 template files, record format + sha256 + byte-size provenance metadata (never binaries), pin the exact template field layouts + the exact new-file names into the handoff. **No D2 before this is recorded.**
- **D2 RED** — the new print-view e2e spec + the upgraded-generation suite fail against the unmodified base per the house RED classes (fail-to-collect for new modules / behavioral fails where the base path exists); every count recorded verbatim; any legacy pass disclosed (the P2.4 P3-1 convention). The exact RED classes depend on the pinned file names — recorded honestly at the RED commit.
- **D3 implement** — the dedicated ทส.1/ทส.2 print-ready report views (Thai/พ.ศ., address headers from `core.address` per B7, honest unknown/estimate/SIMULATED provenance in the printed output, A4 print CSS) + the browser print-to-PDF path + the ReportsPage wiring upgrade (P2.5 sections byte-untouched; `generateRepairRequest` byte-untouched). Scope-exact vs §7.
- **D4 battery** — vitest FULL; `tsc -b`; oxlint; Playwright FULL chromium workers=1 **including the print-view e2e** (untouched suites stay green — the no-regression gate); guard **344/344** (+450 subtests); runtime **62/62** (+32 subtests); release checker regression + `--tag v1.14.0` on the staged version → OK; `git diff --check` clean; 13-digit PII digit-run grep of the new files = 0; **`supabase/` diff EMPTY**; diff vs base ⊆ the §7 mutable scope.
- **D5** — fresh-GLM independent review at the exact frozen head with an independently executed battery rerun where possible + hand-verification of the report layout against the recorded template provenance (D1-3 metadata) + the honesty-rule pins (unknown ≠ 0 in printed output; estimate flags carried). **Implementer never merges; the authorized reviewer owns approval + merge.** **STOP at REVIEW_REQUESTED.**

## 6. D1 adjudication items (reviewer)

- **D1-1** — the report-subset boundary (THE adversarial item): ทส.1/ทส.2 ONLY; the other three report families + the disabled PDF1.1 + P4.2/P4.3 + Phase 5 OUT (§0). A different reading must be ruled explicitly with the row text + B4 quoted.
- **D1-2** — the rendering mechanism: dedicated print-ready report views + browser print-to-PDF; NOT server/edge rendering; the "ตัวสร้างฝั่ง server" mechanism divergence ruled + the 001C distinction recorded verbatim (§0 D1-2).
- **D1-3** — template fidelity: Drive enumeration READ-ONLY BEFORE D2; mirror field layouts; cite each file; drive-file-wins rule vs the ref-12 field census; folder id re-located (not durably recorded in-repo — honesty pin); sha256+byte-size provenance metadata only, never binaries; folder listings ≠ sheet enumerations (the P3.5 lesson).
- **D1-4** — release v1.14.0 MINOR (§4); a forced deviation = STOP + adjudicated, never silent.
- **D1-5** — honesty rules in the printed output: unknown ≠ zero (missing telemetry = ค่าว่าง/ไม่มีข้อมูล, never 0); estimate-derived values carry provenance flags (×3.7/×1.2/×0.4999); latest ≠ live; simulation labeled; พ.ศ. + Thai month names; no PHI/personnel identity in headers (address-table values only per B7).
- **D1-6** — no migration: `supabase/` diff EMPTY; no `core.pdf_template` rows expected; /pdf-designer untouched; a genuine need = STOP + adjudicated deviation.
- **D1-7** — scope files (the registry `mutable_scope` mirrors §7): everything unlisted forbidden.

## 7. Registry-scope summary (mirrors the CURRENT-WORK claim append)

Mutable: `frontend/src/lib/pdf.ts` (ทส.1/ทส.2 upgrade only), `frontend/src/lib/pdf.test.ts` (or a NEW sibling lib test — pinned at start), `frontend/src/components/reports/**` (new components; SafetyColiformSummarySection.tsx byte-untouched), `frontend/src/pages/ReportsPage.tsx` (additive + the onDownload ทส.1/ทส.2 upgrade region only; P2.5 + P1.6 sections byte-untouched), `frontend/src/lib/supabase-queries.ts` (additive report-reads section only if genuinely required — deviation rule), `frontend/src/lib/hooks.ts` (same rule), `frontend/tests/e2e/env-parity-p4-001-tos-reports.spec.ts`, `CHANGELOG.md`, `frontend/package.json` (1.13.0→1.14.0), `docs/work-orders/ENV-PARITY-P4-001.md`, `docs/ai/handoffs/ENV-PARITY-P4-001-GLM.md`, `docs/ai/CURRENT-WORK.md` (transition + closeout only).

Forbidden: everything else — ALL `supabase/` files (NO migration/seed/apply, D1-6); Phase 5 of any kind; other Phase-4 lanes (P4.2 Telegram/alerts per B5; P4.3 BI; the รายงานถังดับเพลิง/ไฟฉุกเฉิน/น้ำประปา report families; the disabled PDF1.1 stays disabled); the B6/B7 delivered surfaces (P3.2 chlorine FEFO chain; P3.5 `core.address`/AddressPage) consumed READ-ONLY; delivered Phase 1–3 form/report/QR surfaces + their test suites byte-untouched (P2.5 summary sections + summary libs + P1.6 section edit-forbidden); any Telegram webhook/dispatcher; `.github/**`/CI; `docs/ai/digital-twin/**` (references 11/12 READ-ONLY); reference/plan docs (APPSHEET-PARITY-PLAN, PROJECT-BRIEF, ROADMAP, DEFECT-MEMORY, ENV-ENGINEERING-LOOP, HANDOFF.md, AGENTS.md, MIGRATION.md); guard/autonomy scripts; **any Google Drive write of any kind** (read-only enumeration only); **template binaries never enter repo/DB/chat**; `/pdf-designer` + `frontend/src/components/pdf-designer/**` + `core.pdf_template` consumer code untouched; `data/**`, `.env`, secrets/raw data never committed/printed; 13-digit national-ID/personnel-identity values anywhere.
