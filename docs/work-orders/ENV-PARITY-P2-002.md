# Work Order — ENV-PARITY-P2-002 (Claim ENV-PARITY-P2-002-C1, gen 1)

**Status: IMPLEMENTATION DELIVERED — REVIEW_REQUESTED (implementation lane, 2026-11-16; PR #208 off the merged claim base `5ccdb506609e7c9478499b9ebcc406ce8fc62249`; D2 RED 16 failed/2 passed pre-apply → D3 apply 27/27 OK → contract suite 18/18 GREEN → D4 battery green incl. Playwright 255/255 + checker OK v1.5.0; implementer NEVER merges — awaiting D5 fresh-GLM independent review).**

**Claim phase (superseded):** CLAIMED — claim transition PR (docs-only, branch `docs/env-parity-p2-002-claim`, base `086f99d9f13b3c9a1ba566e826e5f8bf0f318227`, merged as PR #207). The implementing lane ran D2→D4 on the merged base and stopped at REVIEW_REQUESTED — implementer never merges.
**Claim branch:** `docs/env-parity-p2-002-claim` · **Implementation branch:** `feat/env-parity-p2-002` (base = merged claim `5ccdb506`).
**Governance pattern:** PR #183–#207 claim-transition series (docs-only claim → reviewed merge → implementation lane → D5 → closeout); direct predecessor: ENV-PARITY-P2-001 (PRs #204/#205 — asset masters delivered 2026-11-16).

## 0. Lane identity

AppSheet parity program **Phase 2, lane P2.2** (plan §6 Phase 2 row P2.2, line 232):

> ตรวจรายถัง: `safety.extinguisher_inspection` — flow สแกน QR → auto-fill (RPC) + pipe/handle/tank/pressure/barrier + หมดอายุ auto + รูปชำรุด (attachment) + trigger Update_ExpDate

**This lane = the extinguisher per-unit inspection flow end-to-end:** schema + QR-scan auto-fill RPC + the Update_ExpDate trigger + a minimal admin master-entry UI + the staff inspection form UI + tests. **NOT in this lane:** emergency-light checks (`safety.emergency_light_check`, P2.3), coliform (P2.4+), the P2.5 aggregate report (Filter_Firer), PDF/Telegram (Phase 4), bulk import UI (the master sheet re-seed stays migration-side when the owner shares it). Implementer never merges.

## 1. Authorization basis

1. Owner standing Goal-mode instruction 2026-11-15/16 — "ต่อยาวๆ ตามแผนและ roadmap ที่วางไว้".
2. Owner parity authorization 2026-11-14 producing `docs/ai/APPSHEET-PARITY-PLAN.md`; lane bound to §6 Phase 2 row P2.2 exactly.
3. The P2.1 closeout frontier (PR #206, merged `086f99d9f13b3c9a1ba566e826e5f8bf0f318227`): "Next lane: P2.2 — extinguisher inspection QR flow … needs its own NEW reviewed claim transition" with the two REQUIRED carried notes reproduced in §2 below. This claim IS that transition.
4. The P2.1 closeout record's carried rulings that bind this lane: extinguisher master UNSEEDED (SOURCE_UNAVAILABLE) with a re-fetch obligation; this lane MUST include a minimal admin path to populate the master.

## 2. Source data — carried notes + the read-only re-fetch receipt (2026-11-16)

### 2.1 Carried note (a) — extinguisher master UNSEEDED (SOURCE_UNAVAILABLE)

`safety.fire_extinguisher` exists with **0 rows** (P2.1 D3: seed NOTHING — the master sheet `ข้อมูลถังดับเพลิง` was absent from the public Drive folder; every one of the six public workbooks' tabs was enumerated; **never reconstruct master rows from the inspection table**). **This lane therefore MUST ship the minimal admin master-entry UI (§6) so the owner can populate the master now;** the sheet re-fetch/re-seed via the guarded P2.1 migration pattern remains a follow-up migration the moment the owner shares the sheet. D1 re-attempts the fetch before changing this ruling — never silently.

### 2.2 Carried note (b) — CSV filename landmine

`/tmp/env-p2-001-sources/sheet-fire-inspection.csv` **actually contains the EMERGENCY-LIGHT master** (misleading name; content verified genuine by D5 at raw-byte level). **Trust the committed citations (migration header `20261116000004_parity_p2_001.sql:22-25`, P2.1 WO §2, P2.1 handoff §5.1/§6.3) — never the filename.** This lane's own snapshot is deliberately named for its content (§2.3).

### 2.3 The ตรวจสอบถัง inspection sheet — re-fetched READ-ONLY for column pinning (this transition, 2026-11-16)

Workbook **fire_extinguisher** `15EjQ9Ze3LsbUlCxWsm5p2PB_a8KD6o-7_c21I7f3s_E`, tab `ตรวจสอบถัง` (gid 0) — the exact workbook/tab pinned by the P2.1 handoff D0 (§2.1). Fetched via the public gviz CSV export (read-only; **ห้ามเขียน Drive**; nothing written to Drive) to `/tmp/env-p2-002-sources/sheet-tham-inspection.csv`:

- **858 data rows** (matches the P2.1 SHAPE-ONLY record exactly) + 1 header row.
- **18 real persisted headers** (verbatim): `row_ID, Date_time, QR_CODE, location, type, packing_date, chem_exp, packing_weight, pipe, handle, tank, pressure_gauge, barrier, breakdown_details, cause_of_damaged, ผู้ตรวจสอบ, รูปชำรุด, Filter_Firer_ID` + 9 empty padding columns — exactly the AppSheet decomposition: **27 = 1 system (`_RowNumber`) + 18 persisted + 8 virtual** (ref 12 §3.13, ref 3098–3131).
- New ground-truth facts pinned from the real bytes (beyond P2.1):
  - `Date_time` is a **datetime** at source (`17/7/2566 16:02:03` — พ.ศ. d/m/yyyy HH:MM:SS), some rows date-only (`2/10/2569`).
  - `QR_CODE` values are the **master Row IDs in PackedUUID form (~22 chars, e.g. `vtiHJw6wpw4c6f4553dms5`)** — the first-ever observation of the master Row ID format that P2.1 could never see (SOURCE_UNAVAILABLE). Still TEXT verbatim, never numeric-coerced.
  - `row_ID` (inspection key) = 8-hex `UNIQUEID()` (e.g. `fc7e2741`).
  - `type` is frequently blank in the inspection sheet; auto-fill copies stay blank when the master had nothing (blank ⇒ NULL, never 0/`''`).
  - `packing_weight` is free text (`15 ปอนด์` observed).
- Parse hazards carried from P2.1 §6 unchanged: พ.ศ. d/m/yyyy (year > 2500 ⇒ BE−543; now extended to datetime with time-of-day), zero-padded/text IDs verbatim, blanks ⇒ NULL, whitespace verbatim, derived QR never stored.

## 3. Pinned ground truth — schema (reference 12 §3.13 READ-ONLY × the real CSV)

### 3.1 `safety.extinguisher_inspection` — the real subset (18 persisted → ENV columns)

| AppSheet §3.13 column | Type/init (verbatim refs) | Real CSV header | ENV column | ENV type | Notes |
|---|---|---|---|---|---|
| `row_ID` (Key) | Text, init `UNIQUEID()` (ref 3132-3138) | `row_ID` | `id` | TEXT PK | ENV generates its own id; `legacy_id` UNIQUE = the AppSheet `row_ID` verbatim when backfilled later (house traceability convention) |
| `Date_time` (Label) | Date, init `=now()` (ref 3140-3146) | `Date_time` | `inspection_date` | TIMESTAMPTZ NOT NULL | datetime at source; **app/RPC-supplied, NO DB default** (AppSheet init is form-only — P2.1 D1-6 rule); UI default = current datetime |
| `QR_CODE` | Text, init `="สแกน QR CODE"`, Valid If `=AND([QR_CODE]<>"สแกน QR CODE",[QR_CODE]<>"",IN([QR_CODE],ข้อมูลถังดับเพลิง[Row ID]))`, error `="ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ"` (ref 3148-3166) | `QR_CODE` | `extinguisher_id` | TEXT NOT NULL **FK → `safety.fire_extinguisher(legacy_row_id)`** | the scan payload = the master Row ID; **the QR string itself is NOT stored** (P2.1 D1-3 carry-over — QR is an app-formula image derived from the id); the placeholder/blank/in-master Valid If is enforced by the RPC + form, not a DB constraint; the verbatim Thai error text is the parity label candidate |
| `location` | Text, init `=select(ข้อมูลถังดับเพลิง[Location],…)` (ref 3168-3174) | `location` | `location_snapshot` | TEXT NULL | **auto-fill COPY of the master's location at inspection time** (snapshot semantics — the master row may change later) |
| `type` | Enum (ref 3182-3198) | `type` | `type_snapshot` | TEXT NULL | **documented enum, NO hard CHECK** (P1.001/D1-2 lesson); 6 values verbatim (ref 3198) — `เคมีแห้ง (Dry Chemical Extinguishers)` / `สารเหลวระเหย BF2000` / `น้ำยาโฟม (Foam Extinguishers)` / `คาร์บอนไดออกไซด์ (Carbon Dioxide (CO2) Extinguishers)` / `น้ำ (Water Extinguishers)` / `น้ำ (Best Drop แบบ Low Pressure Water Mist)` — **note: 6 here vs the master's 5 (`น้ำ (Best Drop)` single value)** — a recorded AppSheet divergence, both lists pinned verbatim |
| `packing_date` | Date, init copy from master (ref 3200-3206) | `packing_date` | `packed_date_snapshot` | DATE NULL | auto-fill copy |
| `chem_exp` | Date, init copy from master (ref 3214-3220) | `chem_exp` | `chem_exp_snapshot` | DATE NULL | auto-fill copy; **the Update_ExpDate trigger input** (§5); พ.ศ. parse per §2.3 |
| `packing_weight` | Text, init copy (ref 3228-3234) | `packing_weight` | `size_snapshot` | TEXT NULL | free text (`15 ปอนด์`) |
| `pipe` | Enum init `=ปกติ` (ref 3242-3258) | `pipe` | `pipe` | TEXT | enum `ปกติ` / `ชำรุด` documented verbatim, no CHECK |
| `handle` | Enum init `=ปกติ` (ref 3260-3276) | `handle` | `handle` | TEXT | enum `ปกติ` / `ชำรุด` |
| `tank` | Enum init `=ปกติ` (ref 3278-3294) | `tank` | `tank` | TEXT | enum `ปกติ` / `ชำรุด` |
| `pressure_gauge` | Enum init `=ปกติ` (ref 3296-3312) | `pressure_gauge` | `pressure_gauge` | TEXT | enum `ปกติ` / `ไม่ปกติ` (semantics differ from pipe/handle/tank — verbatim) |
| `barrier` | Enum init `=ไม่มี` (ref 3314-3330) | `barrier` | `barrier` | TEXT | enum `มี` / `ไม่มี` |
| `breakdown_details` | Text, init `=IF([chem_exp]<=[Date_time],"หมดอายุ","ไม่หมดอายุ")`, Show If `=OR(any-abnormal…,[chem_exp]<=[Date_time],[QR_CODE]<>"สแกน QR CODE")` (ref 3332-3344) | `breakdown_details` | `breakdown_details` | TEXT NULL | the auto expiry label — UI pre-fills per the verbatim formula; persisted verbatim |
| `cause_of_damaged` | Enum, Show If `=OR(pipe≠ปกติ,handle≠ปกติ,tank≠ปกติ,pressure_gauge≠ปกติ,barrier≠ไม่มี)` (ref 3346-3356) | `cause_of_damaged` | `cause_of_damaged` | TEXT NULL | enum `เกิดจากการใช้งาน` / `หมดอายุ` documented verbatim |
| `ผู้ตรวจสอบ` | Ref → `ข้อมูลผู้ปฏิบัติงาน` (Employee_id); init `SWITCH(USEREMAIL(),…)`; Valid If `=SELECT(ข้อมูลผู้ปฏิบัติงาน[Employee_id],AND([ตำแหน่ง]<>"นายแพทย์",[สถานะ]<>"ลาออก",OR([ตำแหน่ง]="นักวิชาการสาธารณสุข",[ตำแหน่ง]="พนักงานบริการ")))` (ref 3358-3382) | `ผู้ตรวจสอบ` | `inspector_id` | UUID NULL — **house auth-identity convention (`recorded_by`-style, auth.uid())** | **`core.personnel` does not exist yet (C8 proposal pending)** — the AppSheet employee-code FK cannot be transcribed today; the Valid If staff filter (positions นักวิชาการสาธารณสุข/พนักงานบริการ, สถานะ ≠ ลาออก, ≠ นายแพทย์) is recorded verbatim here as the parity note and enforced as a UI hint only; full personnel-FK parity waits for the C8 lane |
| `รูปชำรุด` (defect photo) | Thumbnail, Show If any-abnormal (ref 3384-3390) | `รูปชำรุด` | `defect_photo` | **attachment per house conventions** | follow the existing house pattern (`frontend/src/lib/attachments.ts` → `core.attachment` rows + Supabase Storage upload); Show If gating = UI visibility only; D1 pins the exact column/bucket shape |
| `Filter_Firer_ID` (hidden) | Ref → `Filter_Firer` (ref 3392-3396) | `Filter_Firer_ID` | **OUT OF SUBSET** | — | P2.5 report-grouping helper; ENV reports group by `inspection_date` directly. Pinned as intentionally omitted, never silently dropped |
| (8 virtual) | `tank_photo`, `re_check`, `M.THAI`, `Y.THAI`, `D.THAI`, `Nickname`, `Link.image`, `SortKey` (ref 3398-3477) | (absent — sheet padding) | **OUT OF SUBSET** | — | display-time derivations, never stored: `M.THAI`/`Y.THAI`/`D.THAI` = พ.ศ. date rendering; `Nickname` = inspector lookup; `Link.image`/`tank_photo` = AppSheet Drive URL builders (secrets redacted — never reconstructed); `SortKey = CONCATENATE([Date_time],"-",_ROWNUMBER)` (ref 3479-3485) = sort order → ENV orders by `inspection_date`; `re_check` = §3.2 below |
| — | — | — | `source_provenance` | TEXT NOT NULL DEFAULT | MIGRATION.md convention; value pins the ENTRY PATH (manual admin/UI entry in this lane — there is **no seed** in this lane; a future sheet backfill migration sets its own provenance) |
| — | — | — | `created_at` | TIMESTAMPTZ NOT NULL DEFAULT `now()` | house audit convention |

**RLS (house pattern):** SELECT `core.fn_is_staff_or_admin()`; **INSERT staff-or-admin (staff write — this is an operational log, unlike the P2.1 masters)**; UPDATE admin + DELETE admin (append-only integrity for staff; corrections admin-only; the master stays admin-only per P2.1 — untouched here). No anonymous access.

### 3.2 `re_check` 1–9 — decided: UI display semantics, NOT schema (D1-2)

`re_check` is a **Virtual ReadOnly List** (`=select(ข้อมูลถังดับเพลิง[Row ID],…)` — ref 3406-3420) rendered by **9 Format Rules** (ref 12 §10, ref 6430-6438: `re_check`..`re_check 9` — text pink/purple/cyan/green/purple/primaryText/orange/secondaryText/themeMainColor + highlights red/green/cyan/orange/yellow/purple/themeMainColor/blue/pink + icons check-circle/thumbs-up/vote-yea/clipboard-check/check-square/check-circle/badge-check×2/check-circle). The P2.1 plan already ruled these "Phase 2 (UI แสดงผล)" (plan line 175). **Decision at claim: NOT schema columns.** The outcome classification they decorate (ปกติผ่าน / ผิดปกติ / หมดอายุ) is derived at display time from the inspection row; the 9 AppSheet color/icon variants are cosmetic styling — implement as simple display variants in the form/list (behavioral UI per the P1.4 Track-Z precedent); if a genuinely new visual language is wanted, park that styling for Track F. The verbatim rule table stays in reference 12 — READ-ONLY.

## 4. QR flow (plan row P2.2 "flow สแกน QR → auto-fill (RPC)")

1. **QR format — derive-from-id, never stored:** the AppSheet master `QR CODE` is an app formula = `api.qrserver.com…&data=` + `[Row ID]` (ref 3077-3081; verified in P2.1 for the sibling table). ENV likewise: the QR payload **is the master `legacy_row_id`**; ENV never stores QR images or URLs; printable QR generation for physically labeling new extinguishers is **out of scope** (future lane if the owner asks).
2. **Scan:** mobile web camera → decode → the decoded string is treated as an `extinguisher_id` candidate. **No QR-scanning dependency exists in the app today** (verified: no jsQR/html5-qrcode/zxing/BarcodeDetector usage in `frontend/src`). D1-4 picks the minimal house-blessed approach: prefer the zero-dependency native `BarcodeDetector` API with graceful unsupported-browser fallback, plus the smallest viable decode fallback for iOS Safari (a single small dependency such as jsQR or html5-qrcode) — the binding constraints are: minimal dependency footprint, works on the owner's real Android/iOS devices, camera-permission and unsupported-camera states are honest Thai messages, and **manual pick from the master list is always available as the fallback entry path** (the AppSheet form itself had the manual/scan duality).
3. **Auto-fill RPC `safety.fn_resolve_extinguisher_qr(p_qr text)`** — mirrors the AppSheet initial-value copies verbatim: given the scanned id → the master row (`location`, `extinguisher_type`, `packed_date`, `expiry_date`, `size_label`) + the latest prior inspection summary + the computed expiry status (`หมดอายุ` / `ไม่หมดอายุ` per the `breakdown_details` formula: `chem_exp <= today`). **Fail-closed on unknown/blank id** — explicit error (no auto-fill, no invented rows, honest Thai message; the AppSheet error `ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ` is the verbatim label candidate). SECURITY DEFINER with a pinned `search_path`, gated staff-or-admin, EXECUTE granted to authenticated (shape per the `fn_create_reading` precedent — D1-5 pins the exact contract).
4. **Empty-master honesty:** until the owner populates the master (admin entry §6 or a future re-seed), both scan and manual pick fail closed with the honest empty state — never a fabricated auto-fill.

## 5. `Update_ExpDate` trigger — verbatim AppSheet semantics (ref 6414-6420 + the master action ref 6152-6185)

- **Bot `Update_ExpDate`** (tableGroup `ตรวจสอบถัง`; Event `App`, triggers `Adds`):
  - Condition (verbatim): `[_THISROW].[chem_exp] > ANY( SELECT( ข้อมูลถังดับเพลิง[วันที่หมดอายุ], [_THISROW].[QR_CODE] = [Row ID] ))`
  - Step: `Run Action อัปเดต` (dataAction — run the master action on the referenced master row).
- **Action `_Bot_Update_EXP`** (on `ข้อมูลถังดับเพลิง`, `SET_COLUMN_VALUE` column `วันที่หมดอายุ`, Only-if `true`):
  - SET `วันที่หมดอายุ` ← `ANY( SELECT( ตรวจสอบถัง[chem_exp], AND( [_THISROW].[Row ID] = [QR_CODE], [Date_time] = MAX( SELECT( ตรวจสอบถัง[Date_time], [_THISROW].[Row ID] = [QR_CODE] )))))` — i.e. **the master's expiry becomes the `chem_exp` of the latest (MAX `Date_time`) inspection of that extinguisher**.
- **ENV transcription:** one `AFTER INSERT` trigger on `safety.extinguisher_inspection`: **only when** `NEW.chem_exp_snapshot IS NOT NULL AND NEW.chem_exp_snapshot > master.expiry_date` (the verbatim guard — the trigger can push expiry LATER, never earlier), set `master.expiry_date` = the `chem_exp_snapshot` of that extinguisher's inspection with MAX `inspection_date`. **Determinism ruling (D1-6):** AppSheet `ANY()` is nondeterministic on ties; ENV must pick one deterministic tiebreak (pin it, e.g. latest `created_at` then `id`) and record it. The trigger function is **SECURITY DEFINER with a pinned search_path** because staff have no master UPDATE grant (P2.1 admin-only mutation policies) — the definer path performs exactly the guarded single-column UPDATE and nothing else, fail-closed. Rollback = `DROP TRIGGER` + `DROP FUNCTION` (precise, documented in the migration header per house convention).
- **Bot `LineNoti`** (`ตรวจสอบถัง` Adds → Call a script — ref 6411-6413) is **OUT of scope** (Telegram/line notification = Phase 4 surfaces); pinned as intentionally omitted.

## 6. Minimal admin master-entry UI

Admin-gated page `frontend/src/pages/admin/ExtinguisherMasterPage.tsx` (route `/admin/extinguishers`, lazy + `RequireAuth requireAdmin` — the P1.4 `EquipmentSpecPage` precedent, route-only addition to `App.tsx` per its D1-4 ruling). Simple add form for the P2.1 `safety.fire_extinguisher` fields: `location`, `extinguisher_type` (the 5-value master enum verbatim), `photo_path` (optional), `packed_date`, `expiry_date`, `size_label`. **No bulk import UI.** The row id: ENV generates `legacy_row_id` (D1-9 pins the generator — the observed AppSheet PackedUUID format `vtiHJw6wpw4c6f4553dms5` is the shape reference; never numeric); `legacy_id` mirrors it (house convention); `source_provenance = 'manual admin entry (P2.2)'` (D1-9). QR derives from the id — nothing QR-related is stored. Writes go through the existing P2.1 admin INSERT policy — **no new master policies, no master-table DDL in this lane.**

## 7. Inspection form UI (staff) — per the AppSheet Valid If / Show If verbatim

- List + create; entry via QR scan (§4) or manual pick from the master list.
- Form field visibility follows the verbatim Show If gates: `location`/`type`/`packing_date`/`chem_exp`/`packing_weight` appear only after a resolved extinguisher (the `[QR_CODE]<>"สแกน QR CODE"` gate's ENV equivalent); `breakdown_details` appears when any item is abnormal OR expired OR the extinguisher is resolved (ref 3343 verbatim); `cause_of_damaged` + `รูปชำรุด` appear only when any of pipe/handle/tank/pressure_gauge is abnormal or barrier ≠ ไม่มี (ref 3351/3389 verbatim).
- Validations per the verbatim enums/init values (§3.1): pipe/handle/tank init `ปกติ`; pressure_gauge init `ปกติ`; barrier init `ไม่มี`; `breakdown_details` auto-label `IF(chem_exp <= inspection_date, "หมดอายุ", "ไม่หมดอายุ")`.
- Thai labels verbatim from the AppSheet column names; mobile-first 360/390/430 (house mobile contract); defect-photo attachment via the house attachments pattern; unknown stays unknown — no zero substitution, expiry status renders only from real dates.

## 8. D-phase plan (Track-Z GLM; behavioral UI per the P1.4 precedent)

- **D2 RED** — two suites: (1) `scripts/test_parity_p2_002_extinguisher_inspection.py` — transactional rollback-smoke against ENV_DB (zero net persistence), groups: SCHEMA (table/columns/types/RLS shapes), RPC (unknown/blank id fail-closed; payload shape; staff-or-admin gate), TRIGGER (bump-later-only guard; latest-inspection value; NULL chem_exp no-op; determinism/tiebreak; backdated insert), HONESTY (empty-master fail-closed; anon denied). Truthful RED pre-apply. (2) `frontend/src/lib/extinguisher-inspection.test.ts` + `frontend/tests/e2e/extinguisher-inspection.spec.ts` — form-parity RED (labels, verbatim value lists, Show If gating, QR Valid If + error, manual-pick fallback) with the camera-mocked QR e2e.
- **D3** — the ONE migration `supabase/migrations/20261116000005_parity_p2_002.sql` (table + RLS + RPC + trigger + grants; header carries the precise rollback SQL) applied via `scripts/apply_migration_api.py` with the **ENV_DB gate** (PROJECT_REF `gllqtbyofrcjzmbnfoeh`); preflight = objects absent + baselines intact (907/9/4 + P2.1 counts 48/0); post-verify = column/policy/trigger/RPC shapes via catalogs + fail-closed probes. NO seed rows in this migration (the master is populated by the admin UI or a future owner-sheet re-seed). Filename pinned HERE at claim (coordinator pin — the true next sequential slot after `20261116000004`, avoiding the P2.1 filename deviation).
- **D4 battery** — vitest FULL, `tsc -b`, oxlint, Playwright FULL workers=1 **including the camera-mocked QR e2e**, guard 344/344, runtime 62/62, `git diff --check`; release checker **OK v1.5.0** — MINOR bump `frontend/package.json` 1.4.1 → 1.5.0 + Thai พ.ศ. CHANGELOG entry (D1-10 justification: first user-visible extinguisher inspection flow + admin master entry = new functionality per the MINOR criteria).
- **D5** — fresh-GLM independent review at the exact frozen head with an independently executed battery rerun where possible. **Implementer never merges.**

## 9. D1 adjudication items (reviewer)

D1-1 the two carried notes are binding (master UNSEEDED/SOURCE_UNAVAILABLE + admin path required; CSV filename landmine — committed citations, never filenames) + D1 re-attempts the master-sheet fetch before changing the ruling · D1-2 the 18/8/1 decomposition, the OUT-of-subset rulings (Filter_Firer_ID, 8 virtual columns), and `re_check` 1–9 as UI-only (§3.2) · D1-3 snapshot-column naming (`*_snapshot`) vs verbatim names · D1-4 the QR decode dependency pick (native BarcodeDetector + minimal iOS fallback vs one small dep) + manual-pick fallback mandatory + camera-mocked e2e regardless · D1-5 RPC contract (SECURITY DEFINER, pinned search_path, staff-or-admin gate, fail-closed) · D1-6 trigger SECURITY DEFINER + deterministic tiebreak for the ANY()/MAX() transcription + backdated-insert behavior · D1-7 RLS shapes (staff INSERT on the log; admin UPDATE/DELETE) + `inspector_id` auth-identity convention (no `core.personnel`; C8 pending; Valid If staff filter recorded as parity note) · D1-8 defect-photo attachment shape (core.attachment + Storage; bucket existence) · D1-9 admin-entry id generator + provenance value + no QR storage · D1-10 release v1.5.0 MINOR justification · D1-11 scope = exactly the claimed files (App.tsx route-only precedent).

## 10. Scope

**Mutable (implementation lane):** `supabase/migrations/20261116000005_parity_p2_002.sql` · `scripts/test_parity_p2_002_extinguisher_inspection.py` · `frontend/src/pages/ExtinguisherInspectionPage.tsx` (+ components colocated under `frontend/src/components/extinguisher/**`) · `frontend/src/pages/admin/ExtinguisherMasterPage.tsx` · `frontend/src/lib/extinguisher-inspection.ts` + `frontend/src/lib/extinguisher-inspection.test.ts` · `frontend/src/lib/supabase-queries.ts` + `frontend/src/hooks.ts` (additive wiring only) · `frontend/src/App.tsx` (route-only additions) · `frontend/tests/e2e/extinguisher-inspection.spec.ts` · `CHANGELOG.md` + `frontend/package.json` (v1.5.0) · `docs/work-orders/ENV-PARITY-P2-002.md` · `docs/ai/handoffs/ENV-PARITY-P2-002-GLM.md` · `docs/ai/CURRENT-WORK.md` (this transition + the later closeout only).

**Forbidden:** everything else — ALL pre-existing `supabase/` files (49 migrations + functions/ + config.toml + seed/ stay untouched; the ONE authorized supabase write is the new migration file; the P2.1 master tables are consumed, never re-altered beyond the trigger's guarded expiry UPDATE); P1 surfaces; emergency-light checks (P2.3 `safety.emergency_light_check`); coliform (P2.4+); the P2.5 aggregate report; `.github/**` / CI changes; reference/plan docs (`docs/ai/APPSHEET-PARITY-PLAN.md`, `docs/ai/digital-twin/**`, PROJECT-BRIEF, ROADMAP, DEFECT-MEMORY, ENV-ENGINEERING-LOOP, HANDOFF.md, AGENTS.md — reference doc 12 is READ-ONLY ground truth); `data/**`; `.env`; secrets/raw data never committed or printed; **Google Drive writes of any kind** (the inspection sheet is READ-ONLY, fetched once via the public gviz CSV export with a local temporary snapshot only); other schemas READ-ONLY (wastewater, water_supply, carbon, core, food — the `fn_is_admin`/`fn_is_staff_or_admin` helpers are consumed, never edited); bulk-import UI; printable-QR generation; Phase 4 surfaces (PDF, Telegram, alert dispatcher); shared shell/nav surfaces beyond the App.tsx route-only additions.

**STOP at REVIEW_REQUESTED — the implementing agent never merges its own PR.**

## 11. Implementation-lane log (2026-11-16 — this lane; appends the D-phase receipts)

### 11.1 R2 corrections applied (issuecomment-6921736220 — binding on this lane)

- **P3-1 — false premise corrected:** `core.personnel` EXISTS (v2 baseline, 9 rows live-verified 2026-11-16: PK `id uuid`, `employee_code text NOT NULL`, position/status TEXT with the P1.1 NOT-VALID enum CHECKs; `personnel_read` policy; `public.personnel` façade; C8 pending = owner approval of enum VALUES, not table existence; no auth↔personnel linkage column). Per the coordinator instruction the inspector ref binds to core.personnel following the wastewater form's ผู้บันทึก pattern: `inspector_id uuid NULL REFERENCES core.personnel(id)` — NOT the auth-uuid convention this WO §3.1 wording assumed (§3.1 left as-written above; the correction is recorded here and in the migration header, which is the operative transcription). Eligibility UI filter = the AppSheet Valid If VERBATIM (position ∈ {นักวิชาการสาธารณสุข, พนักงานบริการ} ∧ status ≠ 'ลาออก') — deliberately ≠ลาออก, NOT the P1.4 recorder's =ทำงาน form (the reference says ≠ลาออก; the live legacy status 'active' passes the verbatim rule and would fail =ทำงาน). The SWITCH(USEREMAIL()) init is NOT replicated (no auth↔personnel mapping column — R2-verified); the picker starts empty (unknown stays unknown).
- **P3-2 — wording corrected:** inspection `type` blanks are occasional (2/858; master-side blanks propagate) — blank ⇒ NULL rule unchanged (migration header says "occasionally", not "frequently").

### 11.2 Coordinator bindings beyond this WO's pre-claim wording (recorded, reviewer-attention items)

- **RPC is SECURITY INVOKER** (RLS respected) — the coordinator instruction supersedes the §4.3 "SECURITY DEFINER gated staff-or-admin" wording; the staff-or-admin gate is enforced by the P2.1 master SELECT policy itself (an anon caller sees no master row ⇒ the same verbatim unknown-id error). The TRIGGER stays SECURITY DEFINER per §5 (the definer path is the ONLY staff bump path — pinned by the SQL contract suite's test_24).
- **RPC exposure:** canonical `safety.fn_resolve_extinguisher_qr(text)` + thin `public.fn_resolve_extinguisher_qr(text)` SECURITY INVOKER wrapper (PostgREST exposes only `public`; `fn_create_reading` house precedent) — EXECUTE revoked from PUBLIC/anon, granted to authenticated.
- **Master façade added:** `public.fire_extinguisher` + `public.extinguisher_inspection` (security_invoker) — the P2.1 header deferred façades to "P2.2 decides"; the manual pick list + admin entry need REST reachability. No new policies; base RLS applies through the views.
- **`frontend/package-lock.json` deviation:** not on the §10 mutable list; changed by the D1-4-sanctioned `jsqr` dependency (iOS fallback) + npm lockfile metadata repair (`npm ci` was broken at base — "Missing: typescript@5.9.3 from lock file"). Declared in the PR body.

### 11.3 D2 RED (pre-apply, 2026-11-16 — truthful)

- `scripts/test_parity_p2_002_extinguisher_inspection.py` (Management-API path, ENV_DB gate): **16 failed / 2 passed** — the 16 fail on absent objects (`relation "safety.extinguisher_inspection" does not exist` / `function ... does not exist`); test_31 passes trivially (migration-file/rollback-doc check, green once the file exists), test_14 passes vacuously pre-apply (any-deny contract catches the function-missing error as a deny) — both noted honestly.
- `frontend/src/lib/extinguisher-inspection.test.ts`: failed-to-collect (`Cannot find module './extinguisher-inspection'`), 0 tests.
- `frontend/tests/e2e/extinguisher-inspection.spec.ts`: **7 failed / 0 passed** (routes + testids absent).

### 11.4 D3 apply + post-verify (ENV_DB gate `gllqtbyofrcjzmbnfoeh`, 2026-11-16)

- Preflight live: target objects absent (`to_regclass` NULL ×3; RPC count 0); baselines wastewater.reading 907 / core.personnel 9 / core.equipment_spec 4 / safety.emergency_light 48 / safety.fire_extinguisher 0.
- Apply: `scripts/apply_migration_api.py supabase/migrations/20261116000005_parity_p2_002.sql` → **27 statements → 27 OK / 0 FAIL**.
- Post-verify: contract suite **18/18 GREEN** — SCHEMA (columns/types/nullability/defaults, PK, FK→fire_extinguisher + FK→core.personnel, legacy_id UNIQUE, ZERO CHECK constraints on the documented enums, RLS enabled + exactly 4 pinned policy shapes, both façade views security_invoker=on) · RPC (invoker + pinned search_path ×2 functions, EXECUTE ACLs: PUBLIC+anon revoked / authenticated granted, blank/whitespace/unknown fail-closed with the verbatim error, staff-context payload smoke incl. the padded-payload resolve, anon fail-closed) · TRIGGER (AFTER INSERT shape, SECURITY DEFINER + pinned search_path, bump-later-only, latest-wins SET, backdated recompute, NULL chem_exp no-op, NULL master expiry no-bump, deterministic tiebreak created_at-DESC-then-id-DESC, **SECURITY-DEFINER-path-works-as-staff** — staff hold the SQL grant but no master UPDATE policy, so a direct staff UPDATE is RLS-silently-denied and the definer trigger is the only staff bump path) · HONESTY/COUNTS (**zero net persistence** — every smoke in an explicit single-request BEGIN…ROLLBACK with pre/post count equality; zero seed; baselines 907/9/4/48/0 intact; inspection table 0 rows).
- Rollback smoke = the same rolled-back-transaction harness (the migration header's rollback SQL is documented; a destructive rollback was NOT executed on ENV_DB — nothing to roll back, and the header SQL is the reviewed contract).

### 11.5 D4 battery (worktree `_worktrees/env-parity-p2-002` @ implementation head 06d9b44 + docs commit)

- vitest FULL: **642 passed / 1 skipped** (37 files; the 1 skip is the pre-existing designed skipIf from the versioning lane)
- `tsc -b`: clean (0 errors) · `oxlint`: exit 0 (pre-existing warnings only, none in new files)
- Playwright FULL workers=1: **255 passed / 255** (5.8m) — includes the camera-mocked QR e2e (BarcodeDetector stub → scan → RPC auto-fill → read-only snapshots → submit), manual-pick flow, unknown-QR verbatim error, expired-master gating + cause/photo Show If, mobile-360 no-horizontal-scroll, admin in-place ไม่มีสิทธิ์เข้าถึง gate + add-row + QR-payload preview (display only, never stored)
- guard: **344/344 passed + 450 subtests** · runtime: **62/62 passed + 32 subtests**
- release checker: **OK (v1.5.0; CHANGELOG entry v1.5.0)** — `check_release_version.py --tag v1.5.0 --root .` (explicit root: the default-root resolution pointed at the canonical checkout from inside the worktree)
- `git diff --check`: clean
- Diff vs main @ `5ccdb506` ⊆ the claimed files + the documented package-lock.json deviation (§11.2). `docs/ai/CURRENT-WORK.md` untouched (this transition + the later closeout only).

### 11.6 Where the lane stopped

**REVIEW_REQUESTED — PR #208 (base main, head = final docs commit).** The implementing agent never merges. Next: D5 fresh-GLM independent review at the exact frozen head with an independently executed battery rerun where possible; then the authorized reviewer merges; then the closeout lane (CURRENT-WORK.md registry CLOSEOUT) by its own reviewed transition.
