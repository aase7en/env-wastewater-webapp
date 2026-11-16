# Handoff — ENV-PARITY-P2-003-GLM (D0 — claim transition)

Claim `ENV-PARITY-P2-003-C1` (gen 1, CLAIMED) — AppSheet parity Phase 2 lane P2.3: **ตรวจไฟฉุกเฉิน — `safety.emergency_light_check` — Persistency/Position/test_result/Broken_detail/Pic/Status + สแกน QR** (plan §6 row P2.3, line 233), plus the **guarded history seed of the 332 real Check rows** (decided IN this lane — WO §5). **Implementer never merges; stop at REVIEW_REQUESTED.**

## 1. Authorization

1. Owner standing Goal-mode instruction 2026-11-15/16 ("ต่อยาวๆ ตามแผนและ roadmap ที่วางไว้").
2. Owner parity authorization 2026-11-14 → `docs/ai/APPSHEET-PARITY-PLAN.md`; lane bound to §6 Phase 2 row P2.3 (line 233) exactly.
3. The P2.2 closeout frontier (PR #209 merged `efac8fcf11d7e93e5e09e3d340400575b4a9422b`): P2.3 named as the next lane with "Inputs ready" (Check 332 rows SHAPE-ONLY + Filter_Light semantics pending verbatim pinning + the 48-row master seeded). This transition IS the NEW reviewed claim it demands — and the pending verbatim pinning is DONE by this transition (WO §2/§3, handoff §2.2/§2.3).

## 2. D0 scope discoveries (verified read-only 2026-11-17)

### 2.1 Carried prerequisites

- **`safety.emergency_light` is LIVE 48/48** (P2.1 D3/D5, byte-verified 2026-11-16): `erl_id` TEXT PK zero-padded verbatim (`001`–`049`, source gap `044`), `legacy_id` = `erl_id`. This is the exact-reference target for check rows (331/332 resolve).
- **`safety.extinguisher_inspection` + `fn_resolve_extinguisher_qr` + Update_ExpDate trigger are LIVE** (P2.2, v1.5.0) — READ-ONLY precedents for this lane; extinguisher surfaces are forbidden to this lane.
- **P2.2 §11.2 coordinator bindings carry to this lane:** resolve RPC SECURITY INVOKER (RLS respected; anon sees no master row ⇒ the same unknown-id error), canonical `safety.fn_resolve_emergency_light_qr(text)` + thin `public.` SECURITY INVOKER wrapper (EXECUTE revoked PUBLIC/anon, granted authenticated), and a `public.emergency_light_check` security_invoker façade view (no new policies).

### 2.2 The Check sheet — fetched READ-ONLY for column pinning (this transition)

Workbook **ข้อมูลตรวจไฟฉุกเฉิน** `1iqSxixJxPApUOYNFFvw2cgH4zD7lPcC_tPzNs2QePAw`, tab `Check` (gid 1164639452) — the exact workbook/tab pinned by the P2.1 handoff D0 (SHAPE-ONLY there). Public gviz CSV export only; **ห้ามเขียน Drive**. Snapshot: `/tmp/env-p2-003-sources/sheet-check.csv` — **332 data rows** (matches the P2.1 record), header = **11 persisted columns verbatim** + 8 empty padding columns (= AppSheet 14 = 1 system + 11 persisted + 2 virtual, ref 12 §3.33 ref 4985-5004). New facts pinned from the real bytes:

- `Date_time` = **date-only** d/m/yyyy พ.ศ. (2568×144, 2569×188) — unlike the extinguisher sheet's datetime; parse year > 2500 ⇒ −543.
- `QR_CODE` = master `ERL_ID`s: 40 distinct = 39 zero-padded (all present in the 48-row master) + **ONE non-padded `31` (1 row)** — and that row is also the ONLY blank-`location` row (AppSheet's own auto-fill `=select(Emergency light[location],[QR_CODE]=[ERL_ID])` returned blank at source). **Never normalized to `031`** — verbatim payload + NULL `light_id` + honest UI state (WO D1-1).
- `row_ID` = 8-hex `UNIQUEID()`, 0 duplicates / 332 rows.
- Distributions: Persistency {มี315, ไม่มี17} · Position {เหมาะสม329, ไม่เหมาะสม3} · test_result {ผ่าน316, ไม่ผ่าน16} · Status {blank300, ขอติดตั้ง16, แจ้งซ่อม14, แจ้งย้ายตำแหน่ง2} · Broken_detail 16 nonempty (free-text tokens `น๊อตหลุด`×3 + `ถอดปลั๊กออก`×1 outside the 5-value enum — NO hard CHECK) · Pic 31 legacy `Check_Images/…` refs · Auditor 77 nonempty = **ONE distinct 13-digit account** · location 331 nonempty.
- **Auditor data class:** ref 12 §11 records `Employee_id` in this app IS the Thai national ID (redacted to pseudonyms in the reference doc) → the Auditor column is national-ID-class; the verbatim-commit ruling is **D1-3** (live `core.personnel.employee_code` precedent check at D1 before deciding verbatim vs NULL; `auditor_id`→`core.personnel(id)` resolved only on exact `employee_code` match).

### 2.3 Verbatim AppSheet ground truth (reference 12 READ-ONLY) — the binding pins

- **§3.33 ตาราง `Check`** (ref 4985-5161): per-column init/Show If/enum values pinned verbatim in WO §3.1 — `row_ID` UNIQUEID() init (ref 5006-5012); `Date_time` init `=now()` Label ReadOnly (ref 5014-5020); `QR_CODE` init `=สแกน QR CODE` (ref 5022-5028); `location` init auto-fill + Show If resolved (ref 5030-5043); `Persistency` มี/ไม่มี init มี (ref 5045-5055); `Position` เหมาะสม/ไม่เหมาะสม init เหมาะสม (ref 5057-5067); `test_result` ผ่าน/ไม่ผ่าน init ผ่าน + Show If `[Persistency]="มี"` (ref 5069-5085); `Auditor` Ref → ข้อมูลผู้ปฏิบัติงาน + SWITCH default READ_ONLY (ref 5087-5106); `Broken_detail` EnumList 5 values + Show If OR(ไม่ผ่าน, ไม่เหมาะสม) (ref 5108-5118); `Pic` + `Status` Show If OR(ไม่ผ่าน, ไม่เหมาะสม, ไม่มี) (ref 5120-5138); Status enum แจ้งซ่อม/แจ้งย้ายตำแหน่ง/ขอติดตั้ง (ref 5136-5138); `re_check` REF_ROWS virtual (ref 5140-5153); `SortKey` = CONCATENATE(Date_time, -, _ROWNUMBER) virtual (ref 5155-5161).
- **§3.35 `Filter_Light`** (ref 5183-5510): 26 columns = 1 system + 10 persisted + 15 virtual — a **date-range report builder** (Start/End Date + choice1-4 + จำนวนX COUNT formulas + ORDERBY-SortKey list + พ.ศ. renderers + `linkPDF_light`). **Entirely OUT of this lane** — the numeric summary is the P2.5 lane (ตัวเลขอย่างเดียว), the PDF is Phase 4 (owner decision §5.3 B4). `ER_light_Menu` (§3.34) likewise OUT.
- **§10 Format Rules (12, ref 6425-6440): NO Check/Filter_Light rules exist** — all 12 accounted for (free chlorine ×1 delivered; re_check 1-9 ×9 delivered UI-only by P2.2; fire Rule/2 ×2 = Filter_Firer → P2.5). Check-row display styling = **house-UI decision (D1-5)**; no invented "verbatim" styling.
- Master `QR` app formula (ref 12 §3.32) = derived from `ERL_ID` → **QR payload = `erl_id`; QR never stored** (P2.1 D1-3 carry-over).

### 2.4 House facts verified (D0)

- The camera-mocked QR e2e pattern is proven by P2.2 (BarcodeDetector stub → scan → RPC auto-fill → submit); manual-pick fallback mandatory; the house `jsqr` iOS fallback dependency already exists from P2.2.
- RLS helpers `core.fn_is_staff_or_admin()` / `core.fn_is_admin()` consumed, never edited; master mutation policies stay admin-only (P2.1) — untouched here.
- Baselines at base `efac8fc`: registry **34 claims**, all CLOSED except Building-REPAIR (DEFERRED) + THIS claim after append; ENV_DB counts 907/9/4 + masters 48/0 + extinguisher inspection 0 (live-verified by P2.1/P2.2 D3/D5).
- One migration slot: `supabase/migrations/20261117000001_parity_p2_003.sql` (true next sequential after `20261116000006` — pinned at claim, no filename deviation).

## 3. Testable-unit analysis → D2 RED plan

1. **SCHEMA** — `safety.emergency_light_check` columns/types/nullability/RLS shapes/facade view per WO §3.1 (P2.1/P2.2 probe style).
2. **SEED-COUNT pins** — 332/332 rows + the §2.2 distribution table (per-column counts verbatim) + the `31`-unresolved pin (light_id NULL, payload verbatim) + blank⇒NULL pins; the idempotency canary holds pre-apply (zero durable writes).
3. **RPC** — `safety.fn_resolve_emergency_light_qr` (+ public wrapper): unknown/blank fail-closed with the honest Thai error; payload = master row + prior-check summary; anon denied; EXECUTE ACLs pinned.
4. **FORM PARITY (vitest)** — Thai labels verbatim; enum value lists (มี/ไม่มี; เหมาะสม/ไม่เหมาะสม; ผ่าน/ไม่ผ่าน; แจ้งซ่อม/แจ้งย้ายตำแหน่ง/ขอติดตั้ง; Broken_detail 5+free text); init values; Show If gating (location resolved-gate; test_result persistency-gate; broken/status/pic abnormal-gate); manual-pick fallback; unresolved-reference honest state.
5. **E2E (Playwright)** — camera-mocked QR scan → RPC auto-fill → submit; manual-pick path; per-light history list; mobile 360/390/430.
6. **HONESTY** — unknown ≠ zero; the `31` row never matched to `031`; blanks stay NULL; baselines intact (907/9/4/48/0/0).

Truthful RED pre-apply: the SQL suite fails on absent objects; seed-count probes fail as absent-table probes (canary holds — zero writes); vitest fails-to-collect; e2e fails on absent routes/testids.

## 4. Bound scope (WO §9)

ONE migration `supabase/migrations/20261117000001_parity_p2_003.sql` (check table + RLS + resolve RPC + public wrapper + façade view + the guarded 332-row seed + grants; filename pinned at claim) + the SQL contract suite + `EmergencyLightCheckPage.tsx` + components + lib + additive wiring (supabase-queries/hooks) + App.tsx route-only + e2e spec + lib test + CHANGELOG/package.json (v1.6.0 MINOR) + the WO + this handoff + `docs/ai/CURRENT-WORK.md` (transition + closeout only). Everything else forbidden (WO §9) — including extinguisher surfaces, P2.5 summaries (Filter_Firer AND Filter_Light), PDF, CI, reference/plan docs, Drive writes, `data/**`, `.env`. **No master DDL/policy changes; the CSV snapshot never committed.**

## 5. Single next safe action

Independent exact-SHA review of THIS docs-only claim transition (R2 floor: fresh GLM-5.3 MAX reviewer context; the AUTHORIZATION BASIS incl. the seed-NOW decision (WO §5) and the verbatim §3.33/§3.35/§10 pins is an explicit adversarial check item — insufficient basis parks the claim unmerged). On approval the AUTHORIZED reviewer merges THIS transition; only then does the implementing lane activate on the merged base via a fresh freshness gate: worktree `_worktrees/env-parity-p2-003`, D2 RED → D3 apply (ENV_DB gate `gllqtbyofrcjzmbnfoeh`, receipted preflight/post-verify, guarded 332-row seed + MIGRATION.md count report) → D4 battery (vitest FULL, tsc, oxlint, Playwright FULL workers=1 incl. the camera-mocked e2e, guard 344, runtime 62, checker OK v1.6.0) → D5 fresh-GLM → **STOP at REVIEW_REQUESTED — implementer never merges**.
