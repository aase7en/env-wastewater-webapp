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
- **Auditor data class:** ref 12 §11 records `Employee_id` in this app IS the Thai national ID (redacted to pseudonyms in the reference doc) → the Auditor column is national-ID-class; the commit ruling **D1-3 is CLOSED — never verbatim** (R2 PR #210 repair): the seed maps the ONE distinct 13-digit account (77 nonempty rows — likely a staff member already in `core.personnel`) → `core.personnel` via the synthetic `employee_code` mapping IF a deterministic match exists — resolved at D3 by a LOOKUP against `core.personnel` legacy identifiers held in the DRIVE-SOURCED seed data (never in the repo); no deterministic match ⇒ `auditor_id` NULL + `auditor_legacy_id` NULL + disclosure count. The migration VALUES commit ONLY the resolved personnel UUID or NULL — **NEVER the 13-digit ID** (PII rationale: the repo is PUBLIC and a committed national ID is irreversible once pushed — git history/public clone — and the in-repo precedent MIGRATION.md:53-61, owner-confirmed 2026-07-07, already forecloses verbatim: the HR export's national IDs were deliberately not used, none extracted/stored/committed, `employee_code` is synthetic `STAFF-001..009`).

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

---

## 6. Implementation-lane receipts (D2/D3/D4 — appended 2026-11-17)

The claim transition was reviewed and merged as **PR #210** (head 5ec9c3d, merge 70c0a64 — the D1-3 PII repair INCLUDED: auditor resolution pinned to personnel-UUID-or-NULL, never verbatim). The implementation lane activated on the merged base 70c0a64 in worktree `_worktrees/env-parity-p2-003` (branch `feat/env-parity-p2-003`), freshness-gated (`git fetch origin main`; HEAD == origin/main tip 70c0a64 at lane start).

**Commits:** `f33e047` (D2 RED) → `7196a66` (D3 feat) → `3fc1db2` (release v1.6.0) → docs (WO §10 + this section). **PR: STOP at REVIEW_REQUESTED — the implementing agent never merges.**

### 6.1 D2 RED (f33e047)

- SQL contract suite (20 tests): **18 FAIL / 2 ok**, truthful — 17 absent-object `42P01 relation "safety.emergency_light_check" does not exist` + 2 absent-migration-file failures; ok = anon-fail-closed (vacuously closed) + baselines 907/9/4/48/0/0 live.
- vitest: fail-to-collect (`Cannot find module './emergency-light-check'`), 0 tests.
- Playwright: **8 failed / 0 passed** (absent route/testids).
- Full raw record: `/tmp/env-p2-003-receipts/d2-red-sql.txt` (ephemeral; counts recorded here verbatim).

### 6.2 D3 (7196a66) — apply + count report

Preflight live: 5 target objects absent; baselines 907/9/4/48/0/0 intact. Apply via `scripts/apply_migration_api.py`.

**Throttling event (honest record):** DDL/policies/RPC/views/grants all landed; the seed hit Management-API rate limits at statement 233/355 (228 OK / 127 FAIL — every failure `ThrottlerException`, zero SQL errors). The guarded-idempotent seed statements were re-applied through the retrying helper (429 backoff); 205 were already durable, 127 backfilled; **no duplicates; 332/332 final**.

**Count report (live post-verify):** 332/332 · light_id resolved 331 + NULL 1 (the non-padded `31` row, `legacy_id='305cd644'`, payload verbatim, never `031`) · พ.ศ. 2568×144→2025 / 2569×188→2026 · Status blank→NULL 300 (16/14/2) · Persistency 315/17 · Position 329/3 · test_result 316/16 · broken_detail 16 (free text verbatim) · pic_path 31 (legacy refs verbatim) · **Auditor: 77 source rows = ONE distinct 13-digit account → NO deterministic match** (Drive-sourced `ข้อมูลผู้ปฏิบัติงาน` tab of workbook `1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk`: 34 rows, 0 exact / 0 digits-only / 0 last-13 `Employee_id` matches; `core.personnel` carries no legacy identifier column — live column list verified) ⇒ **all 77 rows `auditor_id NULL` + `auditor_legacy_id NULL`, suppression DISCLOSED**; migration file 13-digit grep: **0 matches** (suite test_30 pins) · anon fail-closed (SQL-role probes) · spot-checks `c33588cf` / `430671f5` / `305cd644` byte-exact vs CSV incl. one free-text · guarded reseed no-op proven.

**Contract suite GREEN: 20/20** after two truthful test-authoring fixes recorded in WO §10 (test_21 `total` key; test_13 fixture date — test bugs, not migration defects).

**Deviations/decisions (reviewer adjudication) — full detail in WO §10:** (1) `light_id` TEXT not UUID (FK target `erl_id` is the master TEXT PK — no UUID column exists on the live master); (2) NO hard CHECKs on documented enums (WO §3.1 pin governs over the instruction's "CHECK" shorthand; P1.001 lesson); (3) pic: seed legacy refs verbatim + new UI entries via the house core.attachment pattern; (4) RPC error text = the §3.13-family verbatim (no Check-specific error pinned in ref 12); (5) `public.emergency_light` façade view added (unchanged P2.1 policies — manual-pick REST reachability, P2.2 precedent); (6) the D2-suite fixes above; (7) local gitignored `frontend/.env` + process-env token (this machine has no `.env` stub — Drive secrets path resolved manually, values never printed).

### 6.3 D4 battery (at freeze 3fc1db2)

vitest FULL **655 passed / 1 skipped** · `tsc -b` clean · oxlint exit 0 (pre-existing warnings only) · Playwright FULL workers=1 **263 passed** (8 new + 7 P2.2 regression green) · guard **344 passed + 450 subtests** · runtime+checker+workflow pytest **76 passed + 32 subtests** (runtime 62/62) · release checker **OK (v1.6.0)** · validate-registry `{ok:true, claims:35, BOOTSTRAP_CONTROL, hash aab66d68…}` · `git diff --check` clean · changed files ⊆ WO §9 claimed scope.

**Next:** D5 fresh-GLM independent review at the exact frozen head; the authorized reviewer owns approval + merge (implementer never merges). Post-merge closeout lane flips the claim registry status.

### 6.4 D5 P1 REPAIR — auditor resolution CORRECTED (2026-11-17, repair lane on PR #211)

**The D5 receipt's P1 stands: the §6.2 Auditor record above was FALSE.** The "NO deterministic match (0/34)" probe was a **partial-data error** — it compared only the **14 packed-header tokens** of the Drive-sourced `ข้อมูลผู้ปฏิบัติงาน` tab and never reached its per-employee rows. A deterministic match EXISTS (re-fetch verified 2026-11-17): the Check Auditor value (**77 rows, 1 distinct**) EXACTLY equals the `Employee_id` of one per-employee row of that tab (excel row 32 col A — `Employee_id` is stored as a NUMBER in the sheet, so string probes without numeric normalization miss it), and that row's name resolves **UNIQUELY by exact full-name match** to `core.personnel` **STAFF-001** (นายวิลาส รื่นวิชา; `employee_code` = the live synthetic code column, live-verified 2026-11-17; the 9-row table carries exactly one such name).

**Repairs (fix head; migration 20261117000001 IMMUTABLE):**

- **Fix-migration** `supabase/migrations/20261117000002_parity_p2_003_auditor_fix.sql`: fail-closed DO-block guard (personnel code must resolve to EXACTLY one row), guarded idempotent `UPDATE … SET auditor_id = (SELECT id FROM core.personnel WHERE employee_code = 'STAFF-001') WHERE auditor_id IS NULL AND legacy_id IN (<the 77 row_IDs, generated programmatically from the CSV snapshot where Auditor non-blank>)`, house `notify pgrst, 'reload schema'` trailer (P3-1), documented rollback. **The 13-digit value NEVER appears in the file or anywhere in the repo (evidence REDACTED first-3/last-2).**
- **4 record sites corrected** (originals preserved, corrections appended): migration 000001 header `auditor_id` note + DDL inline comment; WO §10 count report (D5-correction paragraph after the table); this handoff §6.2 (corrected by §6.4); suite pins (`DIST_PINS.auditor_id_nonnull` 0→77 + docstring/HONESTY lines + test_30 extended to grep BOTH migration files with filename-timestamp tokens excluded + new test_33 pinning the live repair: exactly 1 distinct auditor UUID = STAFF-001's, guarded re-apply no-op, rollback/trailer/guard markers present).
- **CHANGELOG**: v1.6.0 entry carries the `การเปลี่ยนแปลงชุดนี้: PR #211` line (P3-2).

**Live post-verify (after fix apply):** 332 total unchanged · `auditor_id` set = **77** (exactly the source non-blank rows; all = STAFF-001's personnel UUID `11590d77-f73d-4742-9446-22c442814a91`, 1 distinct) · NULL = **255** · `auditor_legacy_id` still 0 · no duplicates (`legacy_id` 332 distinct). Battery re-run at the repair head recorded in the commit receipt; CI green on the pushed head.
