# Handoff — ENV-PARITY-P2-002-GLM (D0 — claim transition)

Claim `ENV-PARITY-P2-002-C1` (gen 1, CLAIMED) — AppSheet parity Phase 2 lane P2.2: **ตรวจรายถัง — `safety.extinguisher_inspection` + flow สแกน QR → auto-fill (RPC) + pipe/handle/tank/pressure/barrier + หมดอายุ auto + รูปชำรุด (attachment) + trigger Update_ExpDate** (plan §6 row P2.2), plus the minimal admin master-entry UI for the UNSEEDED `safety.fire_extinguisher` master. **Implementer never merges; stop at REVIEW_REQUESTED.**

## 1. Authorization

1. Owner standing Goal-mode instruction 2026-11-15/16 ("ต่อยาวๆ ตามแผนและ roadmap ที่วางไว้").
2. Owner parity authorization 2026-11-14 → `docs/ai/APPSHEET-PARITY-PLAN.md`; lane bound to §6 Phase 2 row P2.2 (line 232) exactly.
3. The P2.1 closeout frontier (PR #206 merged `086f99d9f13b3c9a1ba566e826e5f8bf0f318227`): P2.2 named as the next lane with two REQUIRED carried notes (§2 below). This transition IS the NEW reviewed claim it demands.

## 2. D0 scope discoveries (verified read-only 2026-11-16)

### 2.1 The two carried notes from P2.1 (binding)

- **(a) `safety.fire_extinguisher` is UNSEEDED (SOURCE_UNAVAILABLE)** — the master sheet `ข้อมูลถังดับเพลิง` was absent from the public Drive folder (P2.1: all six public workbooks' tab lists enumerated; never reconstruct master rows from the inspection table). This lane MUST ship the minimal admin master-entry UI (WO §6) so the owner can populate the master; the sheet re-fetch/re-seed (guarded P2.1 pattern) stays a follow-up migration when the owner shares it. **D1 re-attempts the fetch before changing this ruling — never silently.**
- **(b) CSV filename landmine** — `/tmp/env-p2-001-sources/sheet-fire-inspection.csv` holds the EMERGENCY-LIGHT master despite its name (content genuine, D5-verified at raw-byte level; lineage disclosed in migration header `20261116000004_parity_p2_001.sql:22-25` + P2.1 WO §2 + P2.1 handoff §5.1/§6.3). **Trust the committed citations, never the filename.**

### 2.2 The ตรวจสอบถัง inspection sheet — re-fetched READ-ONLY for column pinning (this transition)

Workbook **fire_extinguisher** `15EjQ9Ze3LsbUlCxWsm5p2PB_a8KD6o-7_c21I7f3s_E`, tab `ตรวจสอบถัง` (gid 0) — the exact workbook/tab pinned by the P2.1 handoff D0. Public gviz CSV export only; **ห้ามเขียน Drive**. Snapshot: `/tmp/env-p2-002-sources/sheet-tham-inspection.csv` — **858 data rows** (matches the P2.1 SHAPE-ONLY record), header = **18 persisted columns verbatim** + 9 empty padding columns (= AppSheet 27 = 1 system + 18 persisted + 8 virtual, ref 12 §3.13 ref 3098-3131). New facts pinned from the real bytes:

- `Date_time` = **datetime** (`17/7/2566 16:02:03` — พ.ศ. d/m/yyyy HH:MM:SS; some rows date-only).
- `QR_CODE` = **master Row IDs in PackedUUID form (~22 chars, e.g. `vtiHJw6wpw4c6f4553dms5`)** — first-ever observation of the master Row ID format (P2.1 could never see it; SOURCE_UNAVAILABLE). TEXT verbatim, never coerced.
- Inspection `row_ID` = 8-hex `UNIQUEID()` (`fc7e2741`); `type` frequently blank (blank ⇒ NULL); `packing_weight` free text (`15 ปอนด์`).
- พ.ศ. parse rule carried from P2.1 (year > 2500 ⇒ −543), extended to datetimes.

### 2.3 Verbatim AppSheet ground truth (reference 12 READ-ONLY) — the binding pins

- §3.13 ตาราง `ตรวจสอบถัง` (ref 3098-3477): 27 columns; per-column init/Valid If/Show If/enum values pinned verbatim in WO §3.1 (QR_CODE Valid If + error `ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ` ref 3158-3166; the 5 Show If gates ref 3176-3253; item enums ปกติ/ชำรุด ×3, ปกติ/ไม่ปกติ, มี/ไม่มี ref 3256-3330; `breakdown_details` init `IF([chem_exp]<=[Date_time],"หมดอายุ","ไม่หมดอายุ")` ref 3336-3338; `cause_of_damaged` enum เกิดจากการใช้งาน/หมดอายุ ref 3354-3356; ผู้ตรวจสอบ SWITCH init + Valid If staff filter ref 3362-3382; inspection `type` enum = **6 values** vs the master's 5 — recorded divergence, both pinned).
- §10 Format Rules `re_check`…`re_check 9` (ref 6430-6438): 9 display-only color/icon rules → **decided UI-only, NOT schema** (WO §3.2).
- §8 automations: bot `Update_ExpDate` (ref 6414-6420 — Adds, condition `chem_exp > ANY(master expiry)`, step Run Action อัปเดต) + master action `_Bot_Update_EXP` (ref 6152-6185 — SET `วันที่หมดอายุ` ← `ANY(SELECT(chem_exp, Row ID=QR_CODE AND Date_time = MAX(...)))`) → ENV AFTER INSERT trigger transcription in WO §5 (SECURITY DEFINER, bump-later-only, deterministic tiebreak). Bot `LineNoti` (ref 6411-6413) = OUT of scope (Phase 4).
- Master `QR CODE` app formula (ref 3077-3081) = derived from Row ID → **QR payload = `legacy_row_id`; QR never stored** (P2.1 D1-3 carry-over).

### 2.4 House facts verified (D0)

- No QR-scanning dependency exists in `frontend/src` today (grep: no jsQR/html5-qrcode/zxing/BarcodeDetector) → D1-4 picks the minimal approach (native `BarcodeDetector` preferred + smallest iOS fallback; manual pick always available).
- Defect-photo attachment = the existing house pattern `frontend/src/lib/attachments.ts` (→ `core.attachment` + Supabase Storage).
- Admin-page precedent: `frontend/src/pages/admin/EquipmentSpecPage.tsx` (P1.4; lazy + `RequireAuth requireAdmin`; App.tsx route-only addition precedent D1-4).
- RLS helpers `core.fn_is_staff_or_admin()` / `core.fn_is_admin()` consumed, never edited; master mutation policies stay admin-only (P2.1) — hence the trigger function is SECURITY DEFINER.
- `core.personnel` does not exist (C8 proposal pending) → `inspector_id` follows the house auth-identity convention (`recorded_by`-style uuid); the AppSheet employee-code Valid If is a recorded parity note (WO §3.1).
- Baselines: registry 33 claims at base `086f99d9f13b3c9a1ba566e826e5f8bf0f318227`; ENV_DB counts 907/9/4 + P2.1 masters 48/0 (live-verified by P2.1 D3/D5).

## 3. Testable-unit analysis → D2 RED plan

1. **SCHEMA** — `safety.extinguisher_inspection` columns/types/nullability/RLS shapes per WO §3.1 (17+ probes, P2.1 style).
2. **RPC** — `safety.fn_resolve_extinguisher_qr`: unknown/blank id fail-closed; payload = master + latest inspection + expiry status; staff-or-admin gate; anon denied.
3. **TRIGGER** — Update_ExpDate: chem_exp > master expiry ⇒ master bumped to the latest inspection's chem_exp; chem_exp ≤ expiry ⇒ unchanged; NULL chem_exp ⇒ no-op; deterministic tiebreak; backdated insert.
4. **FORM PARITY (vitest)** — Thai labels verbatim, the 6-value type enum + 5-value master enum, item enums/init values, Show If gating, `breakdown_details` auto-label, QR Valid If + error text, manual-pick fallback, expiry-status rendering (never zero/fabricated).
5. **E2E (Playwright)** — camera-mocked QR scan → RPC auto-fill → submit; manual-pick path; admin master entry; mobile 360/390/430.
6. **HONESTY** — empty-master fail-closed states; unknown ≠ 0; simulation/none (no simulated data anywhere in this lane).

Truthful RED pre-apply (the SQL suite fails on absent objects; the seed canary pattern is not needed here — this migration seeds NOTHING).

## 4. Bound scope (WO §10)

ONE migration `supabase/migrations/20261116000005_parity_p2_002.sql` (filename pinned at claim — coordinator pin, true next sequential slot; the P2.1 draft-filename deviation is not repeated) + the SQL contract suite + the inspection page/components + admin master page + lib + additive wiring (supabase-queries/hooks) + App.tsx route-only + e2e spec + lib test + CHANGELOG/package.json (v1.5.0 MINOR) + the WO + this handoff + `docs/ai/CURRENT-WORK.md` (transition + closeout only). Everything else forbidden (WO §10). **No seed rows; no master DDL/policies; no Drive writes; no CI.**

## 5. Single next safe action

Independent exact-SHA review of THIS docs-only claim transition (R2 floor: fresh GLM-5.3 MAX reviewer context; the AUTHORIZATION BASIS incl. the two carried notes and the WO §3/§5 verbatim pins is an explicit adversarial check item — insufficient basis parks the claim unmerged). On approval the AUTHORIZED reviewer merges THIS transition; only then does the implementing lane activate on the merged base via a fresh freshness gate: worktree `_worktrees/env-parity-p2-002`, D2 RED → D3 apply (ENV_DB gate, receipted) → D4 battery (incl. camera-mocked QR e2e; checker OK v1.5.0) → D5 fresh-GLM → **STOP at REVIEW_REQUESTED — implementer never merges**.

---

## 6. D2/D3/D4 implementation receipts (2026-11-16 — this lane; frozen at PR #208 head)

Implementation lane executed on the merged claim base `5ccdb506609e7c9478499b9ebcc406ce8fc62249` (worktree `_worktrees/env-parity-p2-002`, branch `feat/env-parity-p2-002`). Commits: `bd275a2` (D2 RED tests) → `06d9b44` (D3 migration + frontend + release) → docs commit (this file + WO §11 + CHANGELOG PR-ref). **STOP at REVIEW_REQUESTED — PR #208, implementer never merges.**

### 6.1 R2-correction + coordinator bindings actually implemented

- P3-1 applied: `inspector_id uuid NULL REFERENCES core.personnel(id)` (live-verified: PK uuid, employee_code text NOT NULL — **note the supabase façade exposes `employee_code`, NOT `staff_code`; the pre-existing `fetchPersonnel()` P1.4 helper selects the nonexistent `staff_code` column and is a latent live bug OUTSIDE this lane's scope**; this lane added a separate `fetchInspectors()` selecting `id, full_name, position, status`). Eligibility = verbatim ≠ลาออก (not the P1.4 =ทำงาน form) — `isEligibleInspector` in `frontend/src/lib/extinguisher-inspection.ts`; live data check: 3 of 9 personnel pass (positions นักวิชาการสาธารณสุข/พนักงานบริการ with status `active`/ทำงาน).
- P3-2 applied: "occasionally blank (2/858)" wording in the migration header.
- RPC SECURITY INVOKER per coordinator instruction (WO §4.3's definer wording superseded; gate via P2.1 master SELECT policy); public façade wrapper for PostgREST reachability; EXECUTE ACLs pinned (PUBLIC/anon revoked, authenticated granted).
- Trigger SECURITY DEFINER per WO §5 + pinned search_path + fn_is_staff_or_admin defense-in-depth gate + deterministic tiebreak (inspection_date DESC, created_at DESC, id DESC — D1-6). A `now()`-transaction-stability subtlety surfaced in testing: within ONE transaction all rows share created_at, so the tiebreak's final id-DESC fallback decides; real saves are one transaction per HTTP request (explicit created_at values model this in the contract suite).
- Master façade `public.fire_extinguisher` + `public.extinguisher_inspection` added (P2.1 deferred "P2.2 decides façades"); no master policy changes.
- jsQR added as the D1-4 iOS fallback (lazy-imported; native BarcodeDetector preferred; manual pick always rendered). Consequence: `frontend/package-lock.json` changed (NOT on the WO §10 list — declared deviation; `npm ci` was broken at base: `Missing: typescript@5.9.3 from lock file`).

### 6.2 D2 RED (truthful, pre-apply)

| Suite | Result |
|---|---|
| `scripts/test_parity_p2_002_extinguisher_inspection.py` | **16 failed / 2 passed** — failures on absent objects (`42P01 relation "safety.extinguisher_inspection" does not exist`, `42703`, `function ... does not exist`); test_31 trivially green (file/rollback-doc), test_14 vacuously green (any-deny contract) — honest notes, not silent |
| `frontend/src/lib/extinguisher-inspection.test.ts` | failed-to-collect (`Cannot find module './extinguisher-inspection'`), 0 tests |
| `frontend/tests/e2e/extinguisher-inspection.spec.ts` | **7 failed / 0 passed** |

### 6.3 D3 apply + post-verify (ENV_DB `gllqtbyofrcjzmbnfoeh`)

- Preflight: objects absent ×3 + RPC count 0; baselines 907/9/4/48/0.
- Apply: **27 statements → 27 OK / 0 FAIL** (1 create-table + 1 RLS + 4 drop-policy + 4 create-policy + 1 table-grant + 2 create-function + 4 revoke + 2 grant-execute + 1 create-trigger-fn + 1 drop-trigger + 1 create-trigger + 2 create-view + 2 view-grant + 1 notify).
- Post-verify: contract suite **18/18 GREEN** (see WO §11.4 for the group list). Trigger smoke: bump-later-only (chem_exp ≤ expiry no-op), bump-to-NEW (latest-wins), backdated larger-chem_exp does NOT lower/override the MAX-date winner, NULL chem_exp no-op, NULL master expiry no-bump (three-valued ANY() transcription), created_at-DESC then id-DESC tiebreak, **staff-path bump via SECURITY DEFINER while direct staff UPDATE is RLS-silently-denied**. All smokes inside single-request BEGIN…ROLLBACK — post-run counts equal pre-run (zero net persistence); inspection table 0 rows (nothing seeded); baselines intact.
- Machine note: secrets resolution needed the explicit Drive override on this machine (`A_WIKI_DRIVE_PATH`/`SUPABASE_ACCESS_TOKEN` exported from the Drive secrets file — token never printed); the worktree also needed the gitignored `frontend/.env` copied from the canonical checkout (the app throws at boot without `VITE_SUPABASE_URL` — a local-env fix only, never committed).

### 6.4 D4 battery (full, green)

| Item | Result |
|---|---|
| vitest FULL | **642 passed / 1 skipped** (37 files; skip = pre-existing designed skipIf) |
| `tsc -b` | clean |
| `oxlint` | exit 0 (pre-existing warnings only; none in new files) |
| Playwright FULL workers=1 | **255/255** (5.8m) — incl. camera-mocked QR (BarcodeDetector stub) → auto-fill → submit, manual pick, verbatim unknown-QR error, expired-master breakdown/cause/photo gating, mobile-360, admin gate + add-row + QR-payload preview |
| guard | **344/344** + 450 subtests |
| runtime | **62/62** + 32 subtests |
| checker | **OK (v1.5.0; CHANGELOG entry v1.5.0)** — explicit `--root .` (default-root pointed at the canonical checkout from inside the worktree) |
| `git diff --check` | clean |

Local-run notes (environment, not code): the copied `node_modules` in this worktree initially served a blank page because the gitignored `frontend/.env` was missing (see 6.3) — after copying it, all suites ran normally; Playwright route-order lesson recorded: last-registered route wins, so the admin test registers the admin `app_user` mock AFTER the general refs.

### 6.5 Deviations + honesty ledger

1. `frontend/package-lock.json` — outside WO §10's mutable list; changed by the sanctioned jsqr dependency + lockfile metadata repair (documented §6.1; also fixes the base-broken `npm ci`).
2. `frontend/.env` + `node_modules` exist locally in the worktree but are gitignored — never committed (verified in the diff).
3. `docs/ai/CURRENT-WORK.md` untouched by this lane (WO §10: this transition + the later closeout only) — the closeout remains its own reviewed transition after D5/merge.
4. The WO §3.1 `inspector_id` auth-uuid wording is superseded by P3-1 + the coordinator instruction; §3.1 left as-written (claim-phase record) and corrected in WO §11.1 + the migration header (the operative contract).
5. Worktree path correction: the task prompt named `Github/_worktrees/env-parity-p2-002`; the actual registered worktree is `Github/env-wastewater-webapp/_worktrees/env-parity-p2-002` (same repo, registered via `git worktree list`) — used as-is at the pinned SHA.
