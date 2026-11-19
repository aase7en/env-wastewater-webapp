# GLM Handoff — ENV-PARITY-P4-001 (Claim ENV-PARITY-P4-001-C1, gen 1) — D0

**You (the implementing lane, Track-Z GLM) hold this claim ONLY after the claim-transition PR merges.** Until then this document is the binding brief. Worktree `_worktrees/env-parity-p4-001` (clean, off the post-merge main tip); implementation branch `feat/env-parity-p4-001` off that tip. STOP at REVIEW_REQUESTED — you never merge; the authorized reviewer owns approval + merge of every PR in this lane's chain.

## 0. The lane — the row + owner B4 ARE the scope

AppSheet parity **Phase 4 — ระบบอัตโนมัติ + BI — lane P4.1, the FIRST Phase-4 lane** (Phase 3 COMPLETE 6/6 as of PR #239). Plan §6 row P4.1 line 259 VERBATIM + owner answer B4 of 2026-11-15 (plan §5.3 line 195 VERBATIM: ทำ — เทมเพลตมีอยู่แล้วในโฟลเดอร์ Drive content ของ AppSheet) + B7 (line 198: หัวรายงานจากตาราง — delivered P3.5). WO `docs/work-orders/ENV-PARITY-P4-001.md` holds the full binding pins (§0 the four claim-time decisions, §1 authorization incl. THE 001C DISTINCTION, §2 the data+layout contract, §3 no-migration, §4 v1.14.0 MINOR, §5 D-phases, §6 D1 items, §7 scope). Read it before writing anything. Summary:

- **Deliver THIS lane:** dedicated print-ready **ทส.1/ทส.2 monthly report views** mirroring the Drive content-folder template layouts + **browser print-to-PDF**, Thai/พ.ศ., report headers from `core.address` (B7), honest unknown/estimate/SIMULATED provenance carried into the printed output — upgrading the existing jspdf/html2canvas export (`frontend/src/lib/pdf.ts` generateTs1 :49 / generateTs2 :87 + `ReportsPage.tsx` onDownload :156-171). Release **v1.14.0 MINOR**.
- **NOT this lane:** รายงานถังดับเพลิง / รายงานไฟฉุกเฉิน / รายงานน้ำประปา (successor lanes); the disabled PDF1.1 bot (stays disabled); P4.2 Telegram (B5); P4.3 BI; Phase 5; ANY migration/DB object (`supabase/` diff MUST be EMPTY); any Drive write (READ-ONLY enumeration only); template binaries (never enter repo/DB/chat — layouts mirrored as code, sha256+byte-size metadata only).

## 1. THE 001C DISTINCTION (memorize — the scope-lure guard)

The 2026-11-12 "not-planned" decision (epic #110) covered the **/flow story VIDEO export ONLY** — it never covered operational PDF reports (plan lines 22/38/181/195; §8 line 293 names Phase 4 as the scope-lure risk with §5.3 as THE gate). The gate is answered (B4): this claim is the authorized Phase-4 reach. Equally: do not let THIS lane lure into P4.2/P4.3 or the other three report families — each needs its own NEW reviewed claim transition.

## 2. D1 FIRST — enumerate the Drive content folder (READ-ONLY) before D2

1. Locate the owner's publicly-shared Drive content folder (the AppSheet `content` folder — the `Mydrive/appsheet/data/ActivatedSludge-29279640/` tree per the ref-12 bot paths; **the physical folder id is NOT durably recorded in-repo** — re-locate it read-only; ห้ามเขียน Drive ทุกกรณี).
2. Enumerate the ทส.1/ทส.2 template files; record the honest format found (Google Docs? HTML? .docx? — record what IS found, never assume).
3. Record sha256 content hashes + byte sizes as provenance metadata in this handoff (the P3.4 D5 P3-3 lesson). **Never copy binaries.**
4. Pin the exact template field layouts (header block per B7; monthly aggregate rows; Thai calendar block; year-comparison columns IF the template carries them) + the exact new-file names for the components/lib/e2e. If a Drive file contradicts the ref-12 §3.7 field census, the DRIVE FILE wins + record the divergence.
5. Folder listings are not sheet enumerations (the P3.5 lesson) — a template FILE is what you mirror; workbook tabs are irrelevant here.

## 3. Honesty rules in the PRINTED output (D1-5 — reviewer pins)

unknown ≠ zero (missing telemetry renders ค่าว่าง/ไม่มีข้อมูล, never 0); estimate-derived values carry their provenance flags into the print (×3.7 energy estimate, ×1.2 chlorine-litter note, CO2 ×0.4999 provenance); latest ≠ live; simulation labeled as simulation; พ.ศ. years + Thai month names (`month_thai` verbatim class, +543); the report header shows `core.address` values only (B7) — NEVER personnel identity; no Telegram step (that is P4.2).

## 4. D-phases (per WO §5)

D1 enumeration above → D2 RED (counts verbatim; legacy passes disclosed) → D3 implement (scope-exact vs WO §7; P2.5 summary sections + `generateRepairRequest` byte-untouched) → D4 battery (vitest FULL; tsc -b; oxlint; Playwright FULL workers=1 incl. the print-view e2e; guard 344/344; runtime 62/62; checker v1.14.0; `git diff --check` clean; 13-digit grep 0; `supabase/` EMPTY) → D5 fresh-GLM → **STOP at REVIEW_REQUESTED**. Release v1.14.0 MINOR in the implementation PR (CHANGELOG Thai พ.ศ. entry + package.json 1.13.0→1.14.0); annotated tag at the deployed merge SHA post-deploy per ENV-APP-VERSION-001 D6.

## 5. D-phase log (implementation lane fills this in)

### D1 — TEMPLATE ENUMERATION (2026-11-19, READ-ONLY; recorded BEFORE D2)

**Folder re-location (the id was NOT durably recorded in-repo — honesty pin).** Parent folder `ActivatedSludge-29279640` `1HBhuEaBeQLz8jlj0VxPXvbM03It1bNre` (the P2.1/P2.4 extraction base) re-enumerated live READ-ONLY via the public Drive folder listing (48 rows parsed; HTTP GET only, ห้ามเขียน Drive — nothing written). The B4 "content" folder found: **`Content` = `1p0nSwVa9wQD03rety6ltjkQW1FnX143l`** (modified 27 เม.ย. 2566). The ref-12 bot OUTPUT folders also verified as siblings: `PDFv2` `1n4yjE2DYiwE0uoQ1DIyD8kz-1x_WaIWy` (bot `PDF` → ทส.1 output) + `PDF_ทส2` `1TCq-ITN45QD9jcHHSRj1Osdo5BfydSeg` (bot `PDF 2` → ทส.2 output) — output folders, not templates (folder listings ≠ sheet enumerations; template FILES are what is mirrored).

**Content folder enumeration (10 items, all provenance metadata only — binaries NEVER copied into repo/DB/chat; downloads to /tmp/env-p4-001 only, deleted after verification):**

| File (verbatim) | Drive id | Format (honest) | sha256 (of downloaded bytes) | Bytes | Verdict |
|---|---|---|---|---|---|
| `261109_PDF_TEMPLATE_ทส1_V5.1.3_หมอปรัช.docx` | `1ptC4G55ftF3Dv74RaL8Vd-yNFgqWsTcc` | Microsoft Word 2007+ (.docx) | `378be461b17cac44998b8b4923a1840c5cf90fb28fd6ef4045e554ea39b7a9e8` | 2,657,668 | **ทส.1 LAYOUT AUTHORITY** (newest ทส.1, date prefix 261109 = 9 พ.ย. 2569; readable — field layout extracted from `word/document.xml`) |
| `260806_PDF_TEMPLATE_ทส1_V5.1.2.docx` | `1Ubs5vRMI8rl_FaAElhDxZlSVkXgKXHyb` | Microsoft Word 2007+ | `97ee0701e0c1d28b0a63c88bcb49e98d576d326dddfa41b859a5b377574f66a5` | 2,657,807 | superseded (same field set as V5.1.3) |
| `260806_PDF_TEMPLATE_ทส1_V5.1.1.docx` | `1KYaiMuDyvN0IDjrvLrF8M1-UuFS6lQm6` | Microsoft Word 2007+ | `57160e9ca18891df840794d0de08ffeceb4568aef8a2cb26f1b48339f49876e3` | 2,563,762 | superseded (same field set) |
| `PDF_TEMPLATE_ทส1_V5.1.0.docx` | `1rMTHhsvumaawn6dS0JP3kfcYNXHfyaxv` | Microsoft Word 2007+ | `ab89ef00d6a116e1ca78b4e8f6502f88fc5234a616ed120871e1bd1178f5babb` | 2,563,572 | superseded (same field set) |
| `PDF_ทส1_หมอกุ้ง.docx` | `1T-pZWmkErkbXGJJGkLMCXnWFRc-FPJHT` | Microsoft Word 2007+ | `83b37104c19b6fd432ace9853e408aa9b8f684a9f58c88db7db4fc823520a835` | 23,640 | legacy ทส.1 variant (older author หมอกุ้ง) — not the authority |
| `ทส.2_Template_หมอปรัช` | `1Wj16uu2q5pTbWTeOs-U6rOpH7X79h6zP2yDudEGkU80` | **Google Docs** (native gdoc — no binary; public txt export used for layout) | `c6e67afa53f92ff540ee6e9fd5c2f8218cc9019dadcd0494523f06d8393136f9` (sha256 of the UTF-8 **txt export** — honest note: the native gdoc has no directly-hashable file bytes) | 8,684 | **ทส.2 LAYOUT AUTHORITY** (9 พ.ย.; fully readable via public export) |
| `Task for Createทส.1_BodyTemplate_20260501_092151` | `15vYjjbvuWQYYBBP2uM_EwbSrxCTPKp3Xp8L5DWUml4c` | Google Docs (txt export) | `352bf893e420a278d309b5c08a7f88a3ea8ed34c3601788f14008fb7c3ece0ed` | 1,596 | Apps Script body template — the Filter_Water parameter-row column census VERBATIM (corroborates ref-12 §3.7: Start Date/End Date/Export PDF/Sum_Energy/Sum_Water/Sum_waste_water/Sum_Chlorine/Sum_excess sludge/useage_Chlorine/month_thai/year_thai/St.*.thai/End.*.thai/W/V_Chlorine Litter/VC_CY_01..12/VC_LY_01..12/VC_Elec_CY/LY/Total_CO2_CY/LY) |
| `Task for Createทส.2_BodyTemplate_20250228_081619` | `1FN2z6Y9MjhrV-mVbn7RsBY27AFE9UrDKSocyztfr6CA` | Google Docs (txt export) | `efa287aec4be7ccfbda1b6a61c021be3c1aa0a22f9f47b492fc677393d779ca6` | 762 | Apps Script body template (same parameter-row census, no VC_* group) |
| `รายงานตรวจสอบถังดับเพลิง` | `1lKL8xgo_JnFcznMxncJ_kBKHgHpYYLgfOkhKy3WLPqg` | Google Docs | — (not fetched) | — | OUT of lane (ถังดับเพลิง = successor lane; enumerated, untouched) |
| `รายงานตรวจสอบไฟฉุกเฉิน` | `1MDUy6PHBXPISfnKGXyGnRZPJpT1ef4RHbeODQ9f_Pi4` | Google Docs | — (not fetched) | — | OUT of lane (ไฟฉุกเฉิน = successor lane; enumerated, untouched) |

**Pin: ทส.1 field layout (V5.1.3 docx authority — DRIVE FILE, readable).** The docx carries REAL AppSheet template expressions: a daily-row loop `<<START:ORDERBY(FILTER("ข้อมูลคุณภาพน้ำ",(AND([วันที่ บันทึก] >= [_THISROW].[Start Date],[วันที่ บันทึก] <= [_THISROW].[End Date]))),[วันที่ บันทึก],FALSE)>> … <<END>>` — i.e. rows = RECORDED days of the Filter_Water date range, date-ordered. 18 columns (headers verbatim + row merge fields verbatim):
1. วันเดือนปี ← `<<[วันที่ บันทึก]>>`
2. ปริมาณการใช้ไฟฟ้าของระบบบำบัดน้ำเสีย (หน่วย) ← `<<[ปริมาณการใช้ไฟฟ้าของระบบ]>>`
3. ปริมาณน้ำใช้ในทุกกิจกรรมของแหล่งกำเนิดมลพิษ (ลบ.ม.) ← `<<[ปริมาณน้ำที่ใช้ในทุกกิจกรรม]>>`
4. ปริมาณน้ำเสียที่เข้าระบบบ่อบำบัดน้ำเสีย (ลบ.ม.) ← `<<[ปริมาณน้ำเสียที่เข้าระบบบำบัด]>>`
5. การระบายน้ำทิ้งจากระบบบำบัดน้ำเสีย ← `<<[การระบายน้ำทิ้งออกจากระบบ]>>`
6. ปริมาณสารเคมีหรือสารสกัดชีวภาพที่ใช้ (คลอรีนน้ำ ลิตร) ← `<<[คลอรีนน้ำ ที่ใช้]>>`
7. ปริมาณตะกอนส่วนเกินที่นำไปกำจัด(ลบ.ม.) ← `<<[ตะกอนส่วนเกินที่นำไปกำจัด]>>`
8. ปริมาณของแข็งละลายน้ำ (TDS) ← `<<[ในบ่อเติมอากาศ (TDS-1)]>>`
9. ปริมาณออกซิเจนละลายน้ำ OD ← `<<[น้ำก่อนทิ้ง(DO-3)]>>`
10–17. การทำงานของอุปกรณ์เดินระบบบำบัดน้ำเสีย: เครื่องสูบน้ำ 1 / เครื่องสูบน้ำ 2 / เครื่องเติมอากาศ 1 / เครื่องเติมอากาศ 2 / เครื่องสูบตะกอน 1 / เครื่องสูบตะกอน 2 / เครื่องจ่ายคลอรีน 1 / เครื่องจ่ายคลอรีน 2 ← `<<[เครื่องสูบน้ำเสีย 1/2]>> <<[เครื่องเติมอากาศ 1/2]>> <<[เครื่องสูบตะกอน 1/2]>> <<[เครื่องจ่ายคลอรีน 1/2]>>`
18. ผู้บันทึก ← `<<[ชื่อนาม-สกุล ผู้บันทึก]>>`
Plus: title "แบบรายงาน ทส.1" (docx header, vertical margin text); หมายเหตุ ๑./๒. verbatim; certification block "ขอรับรองว่าการบันทึกสถิติและข้อมูลตามตารางข้างต้นถูกต้องทุกประการ" + signature lines เจ้าของหรือผู้ครอบครองแหล่งกำเนิดมลพิษ / ผู้ควบคุมระบบบำบัดน้ำเสีย / ใบอนุญาตเลขที่…หมดอายุ… / ออกให้โดย… **NO address header block in ทส.1** (honest template fact); the template hardcodes owner name (นาย ปรัชญา พยัคฆ์เรือง) in the signature line — NOT rendered (D1-5 personnel-identity pin wins; signature lines render blank rules). **NO year-comparison block (VC_CY/LY) in ทส.1 or ทส.2** — the census columns exist in Filter_Water (body templates corroborate) but the DRIVE templates do not render them → NOT rendered (drive-file-wins), recorded.

**Pin: ทส.2 field layout (`ทส.2_Template_หมอปรัช` gdoc authority — readable).** Structure: title "แบบ ทส.2" + "รายงานสรุปผลการทำงานของระบบบำบัดน้ำเสีย" → **§๑ ข้อมูลทั่วไป = THE B7 ADDRESS HEADER**: "แหล่งกำเนิดมลพิษ ตั้งอยู่ที่ โรงพยาบาลอุทัย เลขที่15 หมู่ที่ 5 ซอย - ถนน - แขวง/ตำบล อุทัย เขต/อำเภอ อุทัย จังหวัด พระนครศรีอยุธยา โทรศัพท์ 035-356336 … ประกอบกิจการประเภท โรงพยาบาล ชุมชนขนาด 30 เตียง" — B7 ruling: the header chain (แขวง/ตำบล/เขต/อำเภอ/จังหวัด) reads from `core.address` at print time (NOT embedded); fields NOT in `core.address` (ชื่อหน่วยงาน/เลขที่/หมู่/ซอย/ถนน/โทรศัพท์/ประเภทกิจการ/ใบอนุญาต) remain the template's own constants (no fabrication — they are the template's static facts); the hardcoded owner names (นายเศกสรรค์ ชวนะดีเลิศ, นาย ปรัชญา พยัคฆ์เรือง) are NOT rendered (personnel-identity pin) — signature rule lines only. Report month line: "เดือน <<[month_thai]>> พ.ศ. <<[year_thai]>>" + มาตรา ๘๐ preamble verbatim. **§๒** static system facts verbatim: (๑) Activated Sludge, 60 ลบ.ม./วัน (๒) แบบต่อเนื่อง 24 ชั่วโมง/วัน (☑) (๓) อุปกรณ์ ☑เครื่องสูบน้ำ ☑เครื่องเติมอากาศ ☑เครื่องสูบตะกอน (๔) แหล่งรองรับน้ำทิ้ง คลองข้าวเม่า (๕) วิธีจัดการตะกอน ตากแห้งทำปุ๋ย. **§๓ สรุปผลการทำงานรายเดือน** (the merge-field layer): (๑) ปริมาณการใช้ไฟฟ้า (หน่วย) `<<[Sum_Energy]>>` (๒) ปริมาณน้ำใช้ทุกกิจกรรม (ลบ.ม.) `<<[Sum_Water]>>` (๓) ปริมาณน้ำเสียที่เข้าระบบ (ลบ.ม.) `<<[Sum_waste_water]>>` (๔) การระบายน้ำทิ้ง (template constant text "ละบายทุกวัน" — RE-RENDERED COMPUTED per honesty: the printed value derives from recorded rows, never an asserted constant) (๕) ปริมาณสารเคมีฯ (ลิตร) `<<[useage_Chlorine]>>` (carries the ×1.2 W/V litter display line per the P1.6 convention) (๖) การทำงานของระบบ/อุปกรณ์ checkboxes (ปกติ/ผิดปกติ rendered COMPUTED from recorded rows — template's static ☑ not asserted blindly) (๗) ปริมาณตะกอนส่วนเกินที่นำไปกำจัด (ลบ.ม.) `<<[Sum_excess sludge]>>` (๘) ปัญหา อุปสรรค์ และแนวทางแก้ไข (blank). คำเตือน ๑./๒. (มาตรา ๑๐๖/๑๐๗) verbatim. Signature block ×2 (เจ้าของ + ผู้รับจ้าง) — blank rules, no names.

**Aggregate mapping (every field cites its source):** `Sum_Energy` → `buildWastewaterSummary().sumEnergy` (Σ v_reading_meter_chain.delta_kwh, meter-delta provenance, boundary days excluded + counted); `Sum_Water` → `buildWaterSupplySummary().sumWaterIn` (Σ น้ำประปา Water_In — ref-12 1701–1716 reads the water-supply source, P1.6 lib pin); `Sum_waste_water` → `sumWastewaterIn`; `useage_Chlorine` → `sumChlorineReal` + `chlorineLitter` ×1.2 display line; `Sum_excess sludge` → `sumSludge`; ทส.1 daily columns → v_reading_with_computed (TDS-1/DO-3/คลอรีน/ตะกอน) + v_dashboard_14day (น้ำใช้/ระบาย) + `wastewater.reading` equipment-run booleans (8 คอลัมน์เครื่องจักร — pump1/2, aerator1/2, sludge_pump1/2, chlorine_pump1/2) + meter chain (ไฟฟ้า delta); unknown renders ค่าว่าง/"—" NEVER 0; estimate provenance flags carried into the PRINTED output (ENERGY_DELTA_PROVENANCE, ค่าประมาณจากสเปก-class notes, ×1.2); พ.ศ. + month_thai via the existing report-summary helpers.

**Recorded divergences (drive-file-wins / honesty pins — never silent):**
1. ทส.1 has NO address header (B7 header applies to ทส.2 §๑); ทส.1 ได้ certification block instead — owner name hardcoded in the drive file → not rendered (personnel pin).
2. ทส.1 column 6 header says (ลิตร) while the recorded surface stores คลอรีนน้ำ ที่ใช้ in kg — the view renders the recorded value + a printed footer note carrying the ×1.2 W/V liters conversion; never a coerced unit.
3. ทส.2 §๓(๔) "ละบายทุกวัน" + §๓(๖) static ☑ checkboxes are data claims → re-rendered COMPUTED from recorded rows (divergence recorded; honesty beats template constant).
4. ผู้บันทึก column (ทส.1 #18) renders ค่าว่าง — the AppSheet ข้อมูลผู้ปฏิบัติงาน personnel master has no delivered ENV surface (never fabricated; no PHI/personnel rendering).
5. Year-comparison columns (VC_CY/LY, Total_CO2) present in the Filter_Water census but absent from the drive templates → not rendered.
6. ทส.2 address header chain renders live `core.address` values for the hospital's row located by the template chain (ตำบล อุทัย / อำเภอ อุทัยธานี / จังหวัด พระนครศรีอยุธยา, exact match) — if the census row is absent, the header renders an honest "ยังไม่พบ" notice + ค่าว่าง slots (never the template constants masquerading as table values).

**Mechanism (D1-2 implementer pick, recorded):** dedicated print-ready React components rendered on ReportsPage (NO new route — routes/App.tsx are outside the §7 scope) with A4 print CSS + `window.print()` (browser print-to-PDF = the production mechanism; the print dialog's "Save as PDF" is the owner's B4 path). The jspdf export is KEPT as the fallback per what exists: `generateTs1`/`generateTs2` upgraded to render the SAME enumerated layouts (field-census fidelity + honesty flags), `generateRepairRequest`/`downloadPDF`/shared `header`/`footer` byte-untouched. DYNAMIC-IMPORT pattern kept (jspdf only loads on download).

**Pinned new-file names (§7 scope):** `frontend/src/components/reports/Tos1PrintView.tsx`, `frontend/src/components/reports/Tos2PrintView.tsx`, `frontend/src/components/reports/report-print.css` (A4 print CSS), `frontend/src/lib/pdf.test.ts` (NEW lib test — the pinned sibling), `frontend/tests/e2e/env-parity-p4-001-tos-reports.spec.ts`; upgrades: `frontend/src/lib/pdf.ts` (ทส.1/ทส.2 only: new pure `buildTs1PrintModel`/`buildTs2PrintModel` + generateTs1/2 re-targeted to the models), `frontend/src/lib/supabase-queries.ts` (additive report-reads ONLY: equipment run-status range fetch + the one-row B7 address fetch), `frontend/src/pages/ReportsPage.tsx` (additive print-view section + the onDownload ทส.1/ทส.2 region upgrade; P1.6/P2.5 sections byte-untouched), `frontend/package.json` 1.13.0→1.14.0, `CHANGELOG.md` (v1.14.0 Thai พ.ศ.), WO + this handoff.

### D2 — RED

Commit `314ca73` (RED tests) on `feat/env-parity-p4-001`; base = merge `15947b5553a1bd8e656ddbeb73222fff3002ac72` (origin/main ancestor-verified fresh). Verbatim counts against the unmodified base:

- **vitest `src/lib/pdf.test.ts` (focused): 15 failed / 15 passed — 0.** RED class = fail-to-collect-by-missing-export: `TypeError: buildTs1PrintModel is not a function` (the upgraded `./pdf` has no such export at base; the whole suite fails on the import). No legacy passes to disclose (the module is NEW).
- **Playwright `tests/e2e/env-parity-p4-001-tos-reports.spec.ts` (focused): 7 failed / 7 — 0 passed.** RED class = behavioral (every test fails waiting for `getByTestId('report-template-ts2')` / the print-view selectors that do not exist on the base ReportsPage).
- **`tsc -b` at RED: 6 errors** — `TS2305: Module '"./pdf"' has no exported member 'buildTs1PrintModel'/'buildTs2PrintModel'`, `TS2305: Module '"./supabase-queries"' has no exported member 'ReadingRunStatusRow'` (+ the derived duplicates) — recorded honestly; the D4 battery only asserts tsc at the final head.

### D3 — IMPLEMENT

Commit `438c1a1` (feat + release v1.14.0). Diff vs base — changed files exactly the §7 claimed scope:

| File | Change |
|---|---|
| `frontend/src/lib/pdf.ts` | ทส.1/ทส.2 upgrade ONLY: new pure `buildTs1PrintModel`/`buildTs2PrintModel`/`buildTs2Operations`/`TS1_COLUMNS` (the D1 drive-template layouts as models) + `generateTs1`/`generateTs2` re-targeted to render the models; `generateRepairRequest`/`downloadPDF`/`header`/`footer` byte-untouched |
| `frontend/src/lib/pdf.test.ts` | NEW (the pinned sibling lib test) — 15 model tests (census layout, พ.ศ., unknown ≠ 0, equipment mapping, day-count honesty, B7 table-driven header, ×1.2 provenance, computed discharge/ops, no-personnel pins) |
| `frontend/src/lib/supabase-queries.ts` | additive report-reads ONLY (64 added lines at EOF): `ReadingRunStatusRow` + `fetchReadingRunStatusRange` (the 8 equipment-run booleans from `reading`) + `HospitalAddressPick` + `fetchHospitalAddressRow` (the exact-match B7 chain on `address`); no existing fetch modified |
| `frontend/src/components/reports/Tos1PrintView.tsx` | NEW — ทส.1 A4 print view (18 census columns, cell testids incl. `tos1-cell-energy-*`/`tos1-cell-chlorine-*`, honesty notes, signature rule lines without names) |
| `frontend/src/components/reports/Tos2PrintView.tsx` | NEW — ทส.2 A4 print view (§๑ B7 table-driven address header testids, พ.ศ. heading testid, §๓ items with provenance-note testids, computed ops, คำเตือน verbatim) |
| `frontend/src/components/reports/report-print.css` | NEW — A4 print CSS (on-screen preview + `@media print` frame + `@page size: A4`) |
| `frontend/src/pages/ReportsPage.tsx` | additive + the onDownload ทส.1/ทส.2 upgrade region ONLY: template-card testids, month-input testid, "เปิดมุมมองพิมพ์" button, print-view section + `window.print()` button, onDownload builds the SAME models for the jspdf fallback; P1.6 summary sections + P2.5 section byte-untouched |
| `frontend/tests/e2e/env-parity-p4-001-tos-reports.spec.ts` | NEW — 7 print-view e2e (B7 table-driven header, พ.ศ., provenance flags, census labels, unknown ≠ 0, `window.print()` affordance, no-durable-write guard) |
| `frontend/package.json` | 1.13.0 → **1.14.0** |
| `CHANGELOG.md` | v1.14.0 Thai พ.ศ. entry (ผู้ใช้เห็น: รายงาน ทส.1/ทส.2 พร้อมพิมพ์/บันทึก PDF ตรงแบบเทมเพลตเดิม) |

NOT touched (scope-clean): all `supabase/` files (diff EMPTY), CURRENT-WORK.md (transition/closeout are separate lanes), P1.6/P2.5 delivered sections, `generateRepairRequest`, `.github/**`, digital-twin references, `/pdf-designer`.

**Recorded honesty notes:** (1) the D2→D3 e2e run initially failed 7/7 with the page never booting — root cause = the FRESH lane worktree had no `frontend/.env` (gitignored, machine-local); created a LOCAL dummy `.env` (never committed; `git check-ignore` verified) and the same spec went 7/7 — an environment issue, not a code change. (2) The jspdf fallback's Thai text rendering follows the pre-existing approach in `pdf.ts` (the file's old doc-comment claims a bundled Sarabun base64 that was never actually wired — pre-existing inaccuracy, disclosed, NOT silently "fixed" in this lane; the print view is the primary faithful output).

### D4 — BATTERY (final head `438c1a1`)

- **vitest FULL: 50 files — 967 passed / 1 skipped (designed skipIf) / 0 failed** (incl. the 15 new model tests).
- **`tsc -b`: clean** (exit 0).
- **oxlint: exit 0** (19 pre-existing warnings; 0 in the lane's files).
- **Playwright FULL chromium workers=1: 329 passed / 0 failed (7.3 min)** — includes the 7 new print-view e2e + all untouched suites green (the no-regression gate).
- **guard: 344/344 passed + 450 subtests** (`scripts/test_env_coordination_guard.py`).
- **runtime: 62/62 passed + 32 subtests** (`scripts/test_env_autonomy_runtime.py`).
- **scripts battery (full `pytest scripts/`): 462 passed / 64 skipped / 491 subtests** (skips = the ENV_DB/network-gated ones).
- **release checker: `--tag v1.14.0` → `RELEASE VERSION CHECK: OK (v1.14.0; CHANGELOG entry v1.14.0)` exit 0.**
- **`git diff --check`: clean.**
- **13-digit PII digit-run grep of the lane's files: 0 in the lane's additions** (the only 13-digit runs in `supabase-queries.ts` are the pre-existing base migration-timestamp constants — verified identical at base 15947b5).
- **`supabase/` diff vs base: EMPTY** (0 files).
- **Diff vs base ⊆ §7 claimed scope:** 11 files — the exact §7 mutable list (see D3 table).

### D6 — CLOSEOUT RECEIPT (2026-11-19; claim ENV-PARITY-P4-001-C1 CLAIMED → CLOSED)

This closeout is the docs-only transition (CURRENT-WORK.md registry + fence, this WO status, this D6). The lane is DONE: released v1.14.0, deployed, tagged.

**Full chain:**
1. Claim transition PR #240 merged `15947b5553a1bd8e656ddbeb73222fff3002ac72` (docs-only; base `8e56592c26448f654e21ea265a485ca86abb1f50` = the P3.6 closeout merge).
2. Implementation PR #241 — 4 commits on `feat/env-parity-p4-001`: `3ef4ec4` D1 template enumeration → `314ca73` D2 RED → `438c1a1` D3 feat + release v1.14.0 → `95e5b3d` D4/D5 docs. Merged as `31c457a2f5dcc7a652f1e32e6b6c44fa314fe3b7` — parents exactly (`15947b5…`, `95e5b3d1c182fcdd4821ac52fe59b1acecbc7954`); merge commit, no squash; expected-head discipline `--match-head-commit 95e5b3d…`.
3. D5 fresh-GLM APPROVED issuecomment-7012408195 @ exact head `95e5b3d` — 0 P1 / 0 P2 / 3 P3-informational; D5's own Drive template fidelity byte-verification (ทส.1 docx sha256 `378be461…a9e8` 2,657,668 B; ทส.2 txt sha256 `c6e67afa…36f9` 8,684 B), own RED reproduction at isolated `314ca73`, own full battery at head (vitest FULL 967P/1S, tsc clean, oxlint 0 errors, Playwright FULL 329/329, guard 344/344, runtime 62/62, checker OK v1.14.0).
4. Merge-executor review trail issuecomment-7012463748 (D5 receipt + expected head + merge policy + tag plan).
5. Merge stat = exactly 12 files 1611+/73− — all ⊆ WO §7; `supabase/` EMPTY; CURRENT-WORK.md untouched at merge. **(P3-2 reconciliation: the D3/D4 prose above said "11 files" — actual 12; the D3 table itself lists 10 code/release files + WO + handoff = 12. Count corrected here, table was right.)**
6. Post-merge at `31c457a`: guard 344/344 (+450 subtests), validate-registry `{ok:true, claims:45, BOOTSTRAP_CONTROL, registry_hash 64600528…d34}` with THIS claim still CLAIMED at merge time; local main ff-only `15947b5`→`31c457a` clean.
7. Deploy: Pages run 44547236638 SUCCESS @ `31c457a`. Live markers verified fresh (last-modified 2026-11-19 14:46:18 GMT): `assets/index-BY4Y6ZZF.js` HTTP 200 — "1.14.0" ×2 + `app-version-chip` + `app-version-summary` + ข้อมูลเวอร์ชันแอป + ยังไม่มีข้อมูล release; lazy chunk `assets/ReportsPage-CzYOoisP.js` HTTP 200 — แบบรายงาน ทส.1 (Tos1PrintView h1) + แบบ ทส.2 (Tos2PrintView h1) + มุมมองพิมพ์ ×3 + กดพิมพ์แล้วเลือก.
8. Release: annotated tag `v1.14.0` (tag object `aa316bf38017ba946c5d87ff92bd2ca3b5e82ae2`) peels to the deployed merge SHA `31c457a…`; pushed; `check_release_version.py --tag v1.14.0` → OK exit 0.

**The 3 D5 P3 reconciliations (ledger — none silently dropped):**
- **P3-1 (CHANGELOG trail line)** — the v1.14.0 trail line cites "PR ของ ENV-PARITY-P4-001" without the PR number. CHANGELOG.md sits OUTSIDE this closeout's 3-file diff contract (CURRENT-WORK.md + WO + handoff), so the 1-line fix is CARRIED as a trivial docs follow-up for the next CHANGELOG-touching lane. Recorded in the registry ledger.
- **P3-2 (file-count prose)** — doc-side; RECONCILED above (chain item 5): actual 12, the D3 table was right, the prose undercounted.
- **P3-3 (ทส.1 ORDERBY micro-divergence)** — recorded: the drive template's `ORDERBY([วันที่ บันทึก], FALSE)` sorts daily rows DESCENDING; the delivered view renders date-ASCENDING (pdf.ts:206 area — chronological reading order). Zero data impact (same rows, same values). Matching the template row order = an OPTIONAL successor micro-lane; recorded in the registry ledger.

**Also carried (known issue):** the jspdf Thai-font doc-comment inaccuracy (D3 note (2) — the pre-existing pdf.ts:5-6 comment claims a bundled Sarabun base64 that was never wired). Disclosure retained, NOT silently "fixed"; the print view is the primary faithful output; the jspdf fallback renders via the same models. Successor lane may wire the font or drop the comment.

**Frontier (the registry `one_next_safe_action` + CURRENT-WORK hold the canonical copy):** P4.2 Telegram alerts (owner B5 — the AppSheet bots' `Send Telegram` webhook steps, bot-reuse per ref 12 §9) needs its own NEW reviewed claim transition NEXT; then the remaining Phase 4 rows (P4.3 BI/scheduled reports + the three other PDF report families ถังดับเพลิง/ไฟฉุกเฉิน/น้ำประปา per the D1-1 boundary — each its own NEW reviewed claim).

**Standing (unchanged by this lane):** Phase-5 dual-run/cutover + AppSheet shutdown untouched; sheet-share obligations owner-pending (P2.1 fire_extinguisher master sheet + P3.5 คู่มือน้ำประปา); hooks #155 approved-not-started + #156 open (owner-manual); ENV-BUILDING-REPAIR-001-C1 WAITING_EXTERNAL.

**Honesty notes:** the implementer/merge-executor never merges its own closeout — this PR stops at REVIEW_REQUESTED; the fence pins `expected_policy_revision = 31c457a2f5dcc7a652f1e32e6b6c44fa314fe3b7` and `expected_registry_hash = 64600528a78420f00438c6fc0303552ffd1e6f35faeba18bfc130b35bf703d34` (guard registry_hash AT that SHA; validate-registry empirically cross-checked at the same tree). No PHI; no Drive writes; no DB writes; no tag before deploy-verification.
