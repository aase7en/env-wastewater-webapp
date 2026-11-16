# Work Order — ENV-PARITY-P1-004 (AppSheet parity Phase 1, lane P1.4)

**Claim:** `ENV-PARITY-P1-004` / `ENV-PARITY-P1-004-C1`, generation 1, status **DELIVERED — CLOSED**. Implementation merged via PR #193 as `b4c31726dd07e993e3ad953bbefc71651154fad8` (second parent = D5-APPROVED reviewed head `336e161f5a41b295dc5c12276b90aa84e70327eb`; D5 fresh-GLM APPROVED issuecomment-6905106639 with an independently reproduced battery and D1-3/D1-4/D1-7 ACCEPTED; merge trail issuecomment-6905134357 with expected-head discipline --match-head-commit, branch kept; migration `20261116000001_parity_p1_004_equipment_spec_admin.sql` applied to ENV_DB 12/12 OK/0 FAIL with preflight + post-verify receipts — admin-only INSERT per the R2 binding condition, staff SELECT, security_invoker façades; D2 RED-first truthfulness reproduced by D5 at isolated `45c90af`; D4 battery green at the frozen implementation head; claim transition PR #192 merged as `01433f0274606f09ebfdc15e55931d2e8cfff026` with R2-APPROVED reviewed transition head `56fe1fa6ebcfe8c5652468e2b1d7268821449c8d`; release v1.2.0 MINOR LIVE — Pages run 43788870487 SUCCESS @ b4c3172, live markers verified, annotated tag v1.2.0 dereferences b4c3172, checker exit 0; registry closed by the docs-only closeout PR off main @ `b4c3172`). Full D2/D3/D4/D5/D6 receipts in `docs/ai/handoffs/ENV-PARITY-P1-004-GLM.md`.
**Lane:** ฟอร์มบ่อบำบัด parity (ช่องที่ขาด + validation ทดแทน Valid If + เตือน "ยังไม่มีมิเตอร์สูบ/ยังไม่มีบันทึกน้ำประปา" — ห้าม fallback 60) + format rule Cl>2.5 — surface `/form`
**Table(s) touched (plan §6):** `/form` UI + `core.equipment_spec` (read/append via UI; additive RLS policy migration only)
**Worktree:** `_worktrees/env-parity-p1-004` · **Transition branch:** `docs/env-parity-p1-004-claim` · **Implementation branch:** `feat/env-parity-p1-004`
**Base:** `faf9c2f9641fbd7d666a2dba9e32d63d000e4518` (= origin/main tip at transition authoring; clean, fetched, ff verified — merge of PR #191, the ENV-PARITY-P1-002-C1 closeout)

---

## 1. Authorization basis (record)

1. **Owner standing Goal-mode instruction 2026-11-15**: "ต่อยาวๆ ตามแผนและ roadmap ที่วางไว้".
2. **Owner parity authorization 2026-11-14** ("วางแผนทำให้ระบบมีรูปแบบการกรอกข้อมูล, การคำนวณข้อมูลเหมือน appsheet … จนกว่าโปรแกรม ENV จะใช้ทดแทนได้ทั้งหมด") → `docs/ai/APPSHEET-PARITY-PLAN.md`.
3. **Plan §6 Phase 1 lane table row P1.4** (binds the scope exactly): "ฟอร์มบ่อบำบัด parity (ช่องที่ขาด + validation ทดแทน Valid If + เตือน "ยังไม่มีมิเตอร์สูบ/ยังไม่มีบันทึกน้ำประปา" — ห้าม fallback 60) + format rule Cl>2.5" — surface `/form`.
4. **Owner gate answers A1–A3 of 2026-11-15** (plan §5.3 receipt block, commit `fb57369`): A1 ×34/×12 = pump per-hour specs + "ข้อกำหนดใหม่: ต้องมีระบบตั้งค่าสเปกปั้ม เพราะเมื่อซ่อม/เปลี่ยนปั๊มในอนาคต ตัวเลขการสูบต่อ 1 ชม. อาจไม่เท่าเดิม"; A2 ×3.7 = instrument spec in the same config system; A3 ÷10 + 1:9 confirmed for the groundwater system. The owner EXPLICITLY asked for the spec-settings system ("ช่วยทำระบบบันทึกการตั้งค่าสเปกปั้มด้วย" per A1) — this lane lands the MINIMAL admin-gated spec management page (D1-4 below).
5. **Delivered prerequisites (all on main at base):** P1.1 schema (10 `*_status` enum columns + `chlorine_mix_ratio` CHECK on `wastewater.reading`, migration `20261115120000_parity_p1_001.sql`, delivered PR #184); P1.2 `core.equipment_spec` (effective-dated, 4 guarded seeds, `valid_from DATE '2024-01-09'`) + `wastewater.v_reading_meter_chain` (LAG prev meters, delta≤0→NULL+boundary flag, spec-at-that-date pump volumes, `wastewater_in_derived`, `delta_kwh`, `avg_westwater_4d`, `chlorine_used_real`, `chlorine_streak_count`, migration `20261115140000_parity_p1_002.sql`, delivered PR #190); P1.3 `wastewater.threshold` 8 seeds + `v_reading_critical_flags` + alert firing (migration `20261115130000_parity_p1_003.sql`, delivered PR #187).

## 2. Pinned ground truth (VERBATIM — these BIND)

### 2.1 Form-parity rules (verbatim, `docs/ai/digital-twin/12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md` §3.3 ตาราง `ข้อมูลคุณภาพน้ำ` — source lines pinned per item)

**Enum fields (AppSheet display names + value lists + initial values, verbatim):**

| AppSheet column (display name) | ref §3.3 lines | Enum values (verbatim) | Initial value | ENV storage mapping |
|---|---|---|---|---|
| `อัตราส่วนผสม(คลอรีน/น้ำ)` | 750–761 | `1:2` / `1:4` / `1:9` | `1:4` | EXISTING `chlorine_mix_ratio` (P1.1 CHECK enforces) — form is free-text today (`DailyFormPage.tsx:529-531`, placeholder "เช่น 1:5") → becomes enum select with the 3 verbatim options; initial value `1:4` is a UI default only (no DB default per P1.1) |
| `ล้างตะแกรงบ่อสูบ` | 476–487 | `ไม่ล้าง` / `ล้าง` | `ไม่ล้าง` | boolean `screen_cleaned_coarse` (true↔`ล้าง`, false↔`ไม่ล้าง`) + P1.1 `screen_cleaned_coarse_status` column written alongside (booleans REMAIN source of truth) |
| `ล้างตะแกรงละเอียด` | 488–499 | `ไม่ล้าง` / `ล้าง` | `ล้าง` | boolean `screen_cleaned_fine` + `screen_cleaned_fine_status` |
| `เครื่องสูบน้ำเสีย 1` | 500–511 | `ปกติ` / `เสีย` | `ปกติ` | boolean `pump1_running` + `pump1_running_status` |
| `เครื่องสูบน้ำเสีย 2` | 512–523 | `ปกติ` / `เสีย` | `ปกติ` | boolean `pump2_running` + `pump2_running_status` |
| `เครื่องเติมอากาศ 1` | 524–535 | `ปกติ` / `เสีย` | `ปกติ` | boolean `aerator1_running` + `aerator1_running_status` |
| `เครื่องเติมอากาศ 2` | 536–547 | `ปกติ` / `เสีย` | `ปกติ` | boolean `aerator2_running` + `aerator2_running_status` |
| `เครื่องสูบตะกอน 1` | 548–559 | `ปกติ` / `เสีย` | `ปกติ` | boolean `sludge_pump1_running` + `sludge_pump1_running_status` |
| `เครื่องสูบตะกอน 2` | 560–571 | `ปกติ` / `เสีย` | `ปกติ` | boolean `sludge_pump2_running` + `sludge_pump2_running_status` |
| `เครื่องจ่ายคลอรีน 1` | 572–583 | `ปกติ` / `เสีย` | `ปกติ` | boolean `chlorine_pump1_running` + `chlorine_pump1_running_status` |
| `เครื่องจ่ายคลอรีน 2` | 584–595 | `ปกติ` / `เสีย` | `ปกติ` | boolean `chlorine_pump2_running` + `chlorine_pump2_running_status` |
| `การระบายน้ำทิ้งออกจากระบบ` | 646–657 | `ระบาย` / `ไม่ระบาย` | `ระบาย` | boolean `wastewater_discharged` (toggle exists; label matches the enum pair) |
| `การทำงานของระบบบำบัดน้ำเสีย` | 658–669 | `ปกติ` / `ผิดปกติ` | `ปกติ` | boolean `system_operating` + existing abnormal_cause flow (SPEC §6) |
| `ตะกอนส่วนเกินที่นำไปกำจัด` | 670–675 | `1.35` / `2.7` / `5.4` / `8.1` | — | `excess_sludge_removed` (numeric; today free input `DailyFormPage.tsx:532-534`) → quick-pick chips + validated number |
| `ลักษณะสี` | 676–687 | `น้ำตาลอ่อน` / `น้ำตาลเข้ม` / `ดำ` | `น้ำตาลเข้ม` | `color_desc` (today chips lack `ดำ`; add the third verbatim option) |
| `ลักษณะกลิ่น` | 688–699 | `กลิ่นดินปกติ` / `กลิ่นเหม็นแก๊สไข้เน่า` / `อื่นๆ` | `กลิ่นดินปกติ` | `smell_desc` (add the two missing verbatim options) |

Thai labels on the form MUST match the AppSheet display names verbatim (the table's left column above).

**Valid If / Required If / Invalid-value error rules (each with its source line — replicate verbatim):**

1. `คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)` — Min 0 / Max 100 (ref 456–474); **Invalid value error**: `=แน่ใจหรือที่จะลงข้อมูลนี้` (ref 461).
2. `ปริมาณการใช้ไฟฟ้าของระบบ` — **Valid If**: `=[ปริมาณการใช้ไฟฟ้าของระบบ]>0` (ref 607); **Invalid value error**: `=ตรวจสอบข้อมูลดีๆนะจ๊ะ` (ref 613); App formula = today-meter − prev-meter with `<=0 → ""` (ref 601) — the DERIVED value lives in P1.2's `delta_kwh`; the form field stays a plain input validated `>0`, no client-side derivation duplication.
3. `ปริมาณน้ำเสียที่เข้าระบบบำบัด` — **Invalid value error**: `=ข้อมูลผิดพลาด` (ref 643); App formula silently writes the text prompt `อย่าลืมใส่เลข มิเตอร์บ่อสูบนะจ๊ะ` into the value when pump volumes ≤ 0 (ref 629–637) — FORBIDDEN in ENV (numeric-only per P1.2; the honest warning replaces it, see §2.2).
4. `ผู้บันทึก` — **Valid If**: `=SELECT(ข้อมูลผู้ปฏิบัติงาน[Employee_id],AND([ตำแหน่ง]<>"นายแพทย์",[สถานะ]="ทำงาน",OR([ตำแหน่ง]="นักวิชาการสาธารณสุข",[ตำแหน่ง]="พนักงานบริการ")))` (ref 716–720) — ENV equivalent: the reporter picker must only offer active personnel whose position ∈ {`นักวิชาการสาธารณสุข`, `พนักงานบริการ`} (never `นายแพทย์`, never non-`ทำงาน`); personnel data already carries the P1.1 position/status CHECKs.
5. `คู่มือ DO` Show link + photo Show columns (ref 734–739, 927–1065) are AppSheet static Drive content — OUT of parity scope (Drive-hosted assets; no ENV storage for them exists) — recorded here so the omission is explicit, not silent.

### 2.2 Honest warnings (replacing AppSheet fallbacks — HONESTY BINDING, unknown ≠ 0)

1. **ปริมาณน้ำที่ใช้ในทุกกิจกรรม** (`water_used_total`): AppSheet App formula silently defaulted to **60** when the day's น้ำประปา `Water_In` lookup was blank (ref 616–622, `if(ISBLANK(LOOKUP(...)),60,LOOKUP(...))`). ENV MUST: leave the field/value EMPTY (never 60, never 0 — never any fallback number) and show warning chip **"ยังไม่มีบันทึกน้ำประปาของวัน"** when `water_supply.daily_check` has no `Water_In` row for the form's `reading_date`. Data source: `water_supply.daily_check` (read; the P1.2 views do not cover this one — it is a direct table read like existing queries).
2. **ปริมาณน้ำเสียที่เข้าระบบบำบัด / มิเตอร์สูบ**: when the meter chain has no previous pump meters (first-ever reading, or `meter_boundary_flag`/`spec_missing` on `wastewater.v_reading_meter_chain`) → show warning chip **"ยังไม่มีมิเตอร์สูบ"** (and never write the AppSheet text prompt `อย่าลืมใส่เลข มิเตอร์บ่อสูบนะจ๊ะ` into any value; the stored `wastewater_in` stays whatever the user typed or empty). Data source: `wastewater.v_reading_meter_chain` (read; the view already carries the boundary/spec-missing flags per P1.2).
3. Warning chips are INFORMATIONAL (not blockers): the user may still save — AppSheet blocked invalid VALUES, not missing telemetry; a missing telemetry value is UNKNOWN, and unknown ≠ zero (house truth constraint).

### 2.3 Format rule Cl>2.5 (verbatim + divergence discovery)

- AppSheet format rule `free chlorine` (ref §10 "Format Rules (12)" table, line 6429 — heading corrected from the earlier "§9.2" wording per the claim R2 verdict P3): table `ข้อมูลคุณภาพน้ำ`, formula `=[คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)]>2.5`, target column `คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)`, style: **text red, highlight red, icon `fas fa-exclamation-triangle`, size 3**. Strictly `>2.5` (2.5 exactly is NOT highlighted).
- ENV implementation: red text + red highlight + warning icon on (a) the form's Free Chlorine field value and (b) the readings list row's Cl cell (`ReadingsListPage.tsx` "Cl อิสระ" column) whenever the value exists and is `> 2.5`. Icon: Material Symbols warning glyph per house UI (MSymbol) — semantic equivalent of the AppSheet `fas fa-exclamation-triangle`; colors from house alert-red tokens. NO new visual language (Track F parked).
- **DIVERGENCE DISCOVERY (recorded, fix here; wording corrected per the claim R2 verdict P3 — issuecomment-6903872629 §5):** the plan §5.2 line names "ENV: `flag_free_chlorine` มีใน `v_reading_detail`" — **wording corrected:** `flag_free_chlorine` exists in NO repo migration/view definition, but the repo's live-DB snapshot (`reports/schema-snapshot-live.md:672,1147`) shows the legacy **live-only** `wastewater.v_reading_detail` DOES carry a threshold-driven `flag_free_chlorine` (max/min joined from `threshold`; post-P1.3 seeds = `<0.5`/`>1` — the Critical streak rules, a DIFFERENT rule from the >2.5 FORMAT rule; it can never express strict >2.5, the legacy view is READ-ONLY/forbidden to this lane, and P1.3's own record routes >2.5 to "a P1.4 UI display rule, not a threshold row"). Fix unchanged: implement the >2.5 display rule in the FRONTEND (pure client-side predicate on the entered/stored value; no DB change, no threshold row). Do NOT touch `v_reading_critical_flags` or legacy `v_reading_detail`.

### 2.4 D1 binding decisions (2026-11-16, GLM coordinator per the owner standing delegation; reviewer adjudicates)

1. **Spec admin UI lands HERE** (not a successor lane): the owner named it explicitly in A1 ("ต้องมีระบบตั้งค่าสเปกปั้ม…"), and the P1.2 closeout frontier said "the equipment-spec admin UI belongs there or a successor lane — decide per its WO". Scope MINIMAL: ONE page — list specs (grouped by kind, Thai labels) + append a NEW effective-dated row (`valid_from`/`valid_to`, kind-conditional fields per the P1.2 CHECKs) + **never edit/overwrite history** (no update/delete UI; the btree_gist EXCLUDE / zero-length-window hardening follow-ups from the P1.2 D5 P3s stay follow-ups, not this lane).
2. **Route + gating**: `frontend/src/pages/admin/EquipmentSpecPage.tsx`, route `/admin/equipment-specs` in `frontend/src/App.tsx` (lazy + PageSkeleton pattern, `<RequireAuth requireAdmin>` — the exact gating the four existing `/admin/*` routes use).
3. **RLS reality (additive migration REQUIRED for the append to work):** `core.equipment_spec` was delivered P1.2 with RLS enabled and NO policies (fail-closed) — every client INSERT is denied today. This lane adds ONE additive migration `supabase/migrations/20261116000001_parity_p1_004_equipment_spec_admin.sql` containing ONLY `CREATE POLICY` statements on `core.equipment_spec`: SELECT+INSERT for `core.fn_is_staff_or_admin()`-style admin gate (house predicate used by `fn_create_reading`), INSERT blocked for non-admins (default), UPDATE/DELETE never granted (append-only by grant shape). It does NOT modify the P1.1/P1.2/P1.3 migrations, the table definition, the enum, the seeds, or any view; rollback documented; applied to ENV_DB only via `scripts/apply_migration_api.py` with preflight receipts. **DEVIATION from the transition instruction's literal claimed-file list (supabase migration not listed there), recorded and justified:** without it the owner-named "ระบบบันทึกการตั้งค่าสเปกปั้ม" cannot save anything — a viewer-only page would ship a dead feature against the owner's explicit ask. Reviewer: adjudicate this D1-3 item explicitly.
4. **Route-registration file `frontend/src/App.tsx` added to mutable scope** (DEVIATION from the instruction's literal list, recorded): a page file without a route is dead code; App.tsx's route table is the house mounting pattern (lazy import + `RequireAuth`).
5. **NO computation changes in the form** (binding): computed values live in the P1.2 views; the form may DISPLAY read-only derived info from `wastewater.v_reading_meter_chain` (e.g. เลขมิเตอร์เมื่อวาน, delta_kwh, avg_westwater_4d) flagged as derived ("ค่าคำนวณจากระบบ"), and must never locally re-implement ×34/×12/÷SWITCH/streak math.
6. **Version: v1.2.0 MINOR** (decided per the CHANGELOG criteria — ฟีเจอร์ใหม่ที่ผู้ใช้เห็น: previously-missing daily-form fields + validation parity + honest warning chips + spec admin page are all new user-visible capabilities; not a patch): `frontend/package.json` `1.1.0 → 1.2.0` + Thai พ.ศ. CHANGELOG entry in the implementation PR + annotated tag at the deployed merge SHA post-deploy per `docs/ai/handoffs/ENV-APP-VERSION-001-GLM.md` D6.

## 3. Deliverables

1. **Form parity** (`frontend/src/pages/DailyFormPage.tsx` + new pure lib `frontend/src/lib/form-parity.ts`): enum surfaces per §2.1 (labels verbatim, value lists verbatim, booleans stay source of truth — every toggle ALSO writes the mapped P1.1 `*_status` column; enum→boolean mapping functions in the pure lib); §2.2 warning chips; §2.3 >2.5 highlight; validation per §2.1 items 1–4 with Thai error texts verbatim.
2. **Readings list** (`frontend/src/pages/ReadingsListPage.tsx`): the >2.5 red highlight + warning icon on the Cl cell.
3. **Spec admin page** (`frontend/src/pages/admin/EquipmentSpecPage.tsx` + `frontend/src/App.tsx` route + `frontend/src/lib/supabase-queries.ts`/`hooks.ts` wiring): list + append per §2.4; kind labels Thai (ปั๊มน้ำเสีย 1/2, ปั๊มน้ำบาดาล, สเปกผสมคลอรีนน้ำบาดาล); append form validates kind-conditional fields + positive values + `valid_from` required; history rows rendered read-only.
4. **Wiring** (`frontend/src/lib/supabase-queries.ts`, `frontend/src/lib/hooks.ts`): reads for `core.equipment_spec`, `wastewater.v_reading_meter_chain`, `water_supply.daily_check` (Water_In lookup) + the spec INSERT — query/hook patterns per house style; React Query cache keys namespaced; no server code.
5. **RLS policy migration** (§2.4-3) + preflight + apply receipts into the handoff.
6. **Tests**: `frontend/src/lib/form-parity.test.ts` (RED-first unit: enum↔boolean maps, validation rules incl. 0/100 bounds + Thai messages, >2.5 predicate boundary incl. 2.5-not-flagged, no-fallback-60 invariant) + `frontend/tests/e2e/env-parity-p1-004.spec.ts` (RED-first e2e: new fields render, warning chips show when telemetry missing, no 60/0 appears, Cl>2.5 highlight on form + list, spec admin gate + append + history-immutable UI).
7. **Version + CHANGELOG**: `frontend/package.json` 1.2.0 + `CHANGELOG.md` Thai พ.ศ. entry (implementation PR).
8. **Docs**: this WO + `docs/ai/handoffs/ENV-PARITY-P1-004-GLM.md` (D-phase log appended) + `docs/ai/CURRENT-WORK.md` claim record maintained.

## 4. Execution routing (D-plan)

- Track-Z GLM (behavior + wiring; visual chrome follows existing house components — no art direction; genuinely new visual language parks for Track F).
- **D2 RED-first**: unit + e2e must fail truthfully (fields absent, chips absent, highlight absent, spec page/route absent, RLS policy absent). Record RED counts verbatim.
- **D3 implement** per §3 (form → list → spec page + migration → wiring).
- **D4 battery**: FULL vitest + `tsc -b` + lint + Playwright FULL `workers=1` + guard 344/344 + runtime 62/62 + `check_release_version.py` OK v1.2.0 + `git diff --check`.
- **D5 fresh-GLM independent review** at the exact frozen head (Terra cross-model eligible after 2026-11-20 per the P1.2 D1 receipt — never a silent downgrade).
- **STOP at REVIEW_REQUESTED; implementer never merges.**

## 5. Mutable scope (claim-bound)

`frontend/src/pages/DailyFormPage.tsx` · `frontend/src/pages/ReadingsListPage.tsx` · `frontend/src/pages/admin/EquipmentSpecPage.tsx` (new) · `frontend/src/App.tsx` (route only — D1-4 deviation) · `frontend/src/lib/supabase-queries.ts` · `frontend/src/lib/hooks.ts` · `frontend/src/lib/form-parity.ts` (new) · `frontend/src/lib/form-parity.test.ts` (new) · `frontend/tests/e2e/env-parity-p1-004.spec.ts` (new) · `CHANGELOG.md` · `frontend/package.json` · `supabase/migrations/20261116000001_parity_p1_004_equipment_spec_admin.sql` (new, additive — D1-3 deviation) · `docs/work-orders/ENV-PARITY-P1-004.md` · `docs/ai/handoffs/ENV-PARITY-P1-004-GLM.md` · `docs/ai/CURRENT-WORK.md`

## 6. Forbidden scope

`docs/ai/HANDOFF.md` · `AGENTS.md` · `docs/ai/architecture/ENV-COORDINATION-GUARD.md` · `scripts/env_coordination_guard.py` · `scripts/env_autonomy_runtime.py` · `docs/ai/APPSHEET-PARITY-PLAN.md` · `docs/ai/digital-twin/**` · `.github/**` · `data/**` · `.env` · `.kilo/**` · all pre-existing `supabase/` files (43 migrations incl. the P1.1/P1.2/P1.3 files, `supabase/functions/**`, `config.toml`, `seed/`) — the ONE authorized supabase write is the §3.5 additive policy migration · `wastewater.v_reading_meter_chain` (READ-ONLY) · `wastewater.v_reading_critical_flags` + legacy `wastewater.v_reading_detail` (READ-ONLY, untouched) · `wastewater.threshold` + `wastewater.threshold_alert` · `core.equipment_spec` table/enum/seeds definition (read/insert-through-UI only; no DDL besides §3.5 policies) · `/flow` · Digital Twin · CI · Phase 4 (PDF/Telegram) · personnel pages · `water_supply.daily_check` schema (read-only; P1.5 lane).

## 7. Truth constraints (binding)

unknown ≠ 0 (ห้ามแทนค่าศูนย์ — missing Water_In/meters → EMPTY + warning chip, never 60/0, never the AppSheet text prompt); latest ≠ live; booleans remain source of truth (enums are the UI vocabulary + `*_status` mirrors); AppSheet display names/value lists/error texts verbatim; NO computation in the form (P1.2 views own derived values; display-only + "ค่าคำนวณจากระบบ" flag); spec history append-only, never edited; admin-gated spec surface; พ.ศ. user-facing dates; no PHI; no real writes in tests (spec append e2e uses the RLS-gated admin path with rollback/cleanup or is designed as no-durable-write per house patterns — record the choice honestly); no assertion weakening.

## 8. Acceptance

1. Every §2.1 field renders with the verbatim Thai label + value list; booleans + `*_status` stay in sync on save.
2. §2.1 validation items 1–4 enforced with the verbatim Thai error texts; RED-first evidence recorded.
3. Missing Water_In → empty value + "ยังไม่มีบันทึกน้ำประปาของวัน" (never 60/0 — regression-pinned); missing pump meters → "ยังไม่มีมิเตอร์สูบ".
4. `free_chlorine > 2.5` (strictly greater) → red + warning icon on form value and readings list row; 2.5 exactly NOT flagged.
5. `/admin/equipment-specs` admin-gated; list renders specs; append creates a NEW effective-dated row; no edit/delete path; RLS denies non-admin writes.
6. D4 battery green; v1.2.0 checker OK; D5 approved; STOP at REVIEW_REQUESTED.

## 9. D-phase log (implementation lane appends here)

### D2 — RED-first (2026-11-16, commit `45c90af` on `feat/env-parity-p1-004` @ base 01433f0)

- Unit `frontend/src/lib/form-parity.test.ts`: **1 suite failed-to-collect** (`Cannot find module './form-parity'`), **0 tests run** — truthful RED (the module did not exist).
- E2E `frontend/tests/e2e/env-parity-p1-004.spec.ts`: **11 failed / 0 passed** — parity fields, verbatim validations, warning chips, >2.5 highlight, and `/admin/equipment-specs` all absent at base.
- `tsc -b` at RED: 1 error (TS2307 on the missing module import) — recorded honestly; the D4 battery runs at the final head only.

### D3 — implementation (2026-11-16, implementation commit)

1. **Pure lib** `frontend/src/lib/form-parity.ts` (37 unit tests green): verbatim enum vocab + AppSheet initial values applied on CREATE only (never DB defaults); boolean↔enum maps (booleans stay source of truth); `buildStatusMirror` derives the 10 P1.1 `*_status` mirrors from the booleans (sync by construction); validations with verbatim Thai errors (Cl 0–100 `แน่ใจหรือที่จะลงข้อมูลนี้`, electricity >0 `ตรวจสอบข้อมูลดีๆนะจ๊ะ`, wastewater-in numeric `ข้อมูลผิดพลาด`); `isFreeChlorineHigh` strictly >2.5 (2.5 NOT flagged); honest-warning predicates (missing Water_In → null + chip text, never 60/0; missing/boundary/spec-missing meters → chip); recorder eligibility position ∈ {นักวิชาการสาธารณสุข, พนักงานบริการ} ∧ สถานะ = ทำงาน.
2. **Form** (`DailyFormPage.tsx`): verbatim labels; enum selects ride ALONGSIDE the boolean Toggles; AppSheet initial values on create; live field errors + submit blocking; warning chips (informational, never value substitutions — `water_used_total` stays EMPTY; Water_In prefill only when the day's record carries a value, marked dirty so snapshots cannot wipe it); derived meter box flagged "ค่าคำนวณจากระบบ" (read-only, from `v_reading_meter_chain` — no client-side ×34/×12/streak re-derivation); ผู้บันทึก picker filtered by `isEligibleRecorder`; >2.5 red + MSymbol warning icon on the Free Chlorine field; labels for สี/กลิ่น → ลักษณะสี/ลักษณะกลิ่น with the full verbatim value sets (chip display order keeps the house frequency order — น้ำตาลเข้ม first — value SET complete and verbatim).
3. **List** (`ReadingsListPage.tsx`): "Cl อิสระ" cell → red text + red highlight + warning icon when strictly >2.5 (2.5 exactly not flagged).
4. **Spec admin** (`EquipmentSpecPage.tsx` + `App.tsx` route `/admin/equipment-specs`, lazy + `<RequireAuth requireAdmin>` — D1-4): kind-grouped list with Thai labels (ปั๊มน้ำเสีย 1/2, ปั๊มน้ำบาดาล, สเปกผสมคลอรีนน้ำบาดาล), effective-dated rows (พ.ศ. dates), append form (kind-conditional fields per the P1.2 CHECKs, positive values, `valid_from` required), history rows read-only, NO edit/delete affordances anywhere.
5. **RLS migration** `supabase/migrations/20261116000001_parity_p1_004_equipment_spec_admin.sql` — see D3-apply below + **DEVIATION D1-7** (facades).
6. **Wiring**: `supabase-queries.ts` (fetchMeterChainById/Before, fetchWaterUsedForDate with generic `select("*")` extraction — P1.5's `Water_In` column may not exist yet; honest `{value:null}` either way; fetchEquipmentSpecs/createEquipmentSpec via the public façade; cache keys `["water-used",date]`, `["meter-chain-*",…]`, `["equipment-specs"]`, `["personnel"]`), `hooks.ts` (usePersonnel, useWaterUsedForDate, useMeterChainById/Before, useEquipmentSpecs, useCreateEquipmentSpec; `useCreateReading` becomes a dedicated hook that syncs the `*_status` mirrors post-create and reports a mirror failure as an honest WARNING — never as a failed save, since the row is already durably stored).
7. **Status-mirror create path (binding-constraint note):** `fn_create_reading` (P12.5) predates the P1.1 status columns and takes a fixed key list (the RPC is outside mutable scope), so create-path mirrors sync via a follow-up targeted UPDATE in the hook layer; edit path writes them in the existing generic update payload. Mirror failure = warning toast + a later edit re-syncs (learned: the first attempt threw — that misreported saved readings as failed and broke the atomic-save contract tests; fixed to non-fatal warning).
8. **Version:** `frontend/package.json` 1.1.0 → **1.2.0** + Thai พ.ศ. CHANGELOG entry (MINOR: new user-visible features). No tag (tag at the deployed merge SHA post-deploy per the versioning handoff).

### D3-apply — RLS migration to ENV_DB (2026-11-16)

- Preflight (all PASS): `core.equipment_spec` relrowsecurity=true; pg_policies count=0 (additive baseline); seeds=4; helpers `fn_is_admin`/`fn_is_staff_or_admin` exist; readings count=907.
- Apply: `scripts/apply_migration_api.py` (Management API, project `gllqtbyofrcjzmbnfoeh`) — **12/12 statements OK, 0 FAIL**.
- Post-verify (all PASS): `equipment_spec_insert_admin` = INSERT `with check (core.fn_is_admin())` (BINDING shape per R2 §4a — admin-only, not staff-or-admin); `equipment_spec_read` = SELECT `using (core.fn_is_staff_or_admin())`; NO UPDATE/DELETE policies (append-only by grant shape); seeds 4 + readings 907 untouched; `public.equipment_spec` reloptions `security_invoker=on`; anon REST probes on both façades → 401/permission-denied (fail-closed for anon).
- **DEVIATION D1-7 (beyond D1-3, reviewer adjudicates):** the migration also creates public security_invoker façade views + grants for `core.equipment_spec` and `wastewater.v_reading_meter_chain`. LIVE EVIDENCE: PostgREST answers `PGRST106 — Only the following schemas are exposed: public, graphql_public` for `Accept-Profile: core/wastewater` (probed 2026-11-16 against ENV_DB), so `supabase-js .schema('core')` reads/writes are IMPOSSIBLE from the frontend; without the façades the owner-named spec page ships dead and the honest-warning meter read is unreachable. House precedent: dock visibility migration 20260803000001 bundles view + grant + policies in one file.

### D4 — battery at final head (2026-11-16)

| Gate | Result |
|---|---|
| vitest FULL | 33 files — **540 passed / 1 skipped** (designed skipIf) |
| `tsc -b` | clean |
| oxlint | exit 0 — 18 warnings, ALL pre-existing files, none in changed files |
| Playwright FULL `workers=1` (CI profile) | **224 passed / 0 failed / 0 flaky** (5.1m) — incl. 11 new parity e2e |
| guard suite | **344 passed, OK** |
| runtime suite | **62 passed, OK** |
| `check_release_version.py --tag v1.2.0` | OK (v1.2.0 ↔ CHANGELOG entry) |
| `git diff --check` | clean |
| validate-registry | `{ok: true, claims: 29, BOOTSTRAP_CONTROL, hash 99e49674…}` — CURRENT-WORK.md byte-identical to base (registry/status flip belongs to the closeout transition, house precedent) |

Honesty notes: (1) the CI-profile Playwright run needs `CI=1` for workers=1+retries — the full run caught one real defect (my append e2e raced the POST capture; fixed with `expect.poll`, re-run 5× standalone + full suite clean) and one real regression (status-mirror follow-up broke the atomic-save contract in the mocked mobile suite; root-caused and fixed to the non-fatal warning design above — no assertion weakening anywhere, both out-of-scope suites pass byte-identically). (2) The `frontend/.env` + `node_modules` in the lane worktree are machine-local gitignored setup (`.env` copied from the canonical checkout; `package-lock.json` restored to HEAD after install — diff clean).

### Status

**IMPLEMENTATION DELIVERED — STOP at REVIEW_REQUESTED.** Implementer never merges. D5 fresh-GLM independent review at the exact frozen head (Terra cross-model eligible after 2026-11-20 — never a silent downgrade).
