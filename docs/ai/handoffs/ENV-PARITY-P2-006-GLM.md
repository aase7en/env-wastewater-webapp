# Handoff — ENV-PARITY-P2-006-GLM (D0 — claim transition)

Claim `ENV-PARITY-P2-006-C1` (gen 1, CLAIMED) — AppSheet parity Phase 2 lane P2.6 — **the FINAL Phase-2 lane**: **Tests + seed ข้อมูล master จาก Sheets + เชื่อม QR** (plan §6 row P2.6, line 236, verbatim). **Test-only lane: fixtures ship; seeds ship an honest NO-SEED record; QR ships connectivity test coverage. Implementer never merges; stop at REVIEW_REQUESTED.**

## 1. Authorization

1. Owner standing Goal-mode instruction 2026-11-15/16 ("ต่อยาวๆ ตามแผนและ roadmap ที่วางไว้").
2. Owner parity authorization 2026-11-14 → `docs/ai/APPSHEET-PARITY-PLAN.md`; lane bound to §6 Phase 2 row P2.6 (line 236) exactly.
3. The P2.5 closeout frontier (PR #218 merged `5e30a54332e296906a1ffc4421b880ac7ffdd3a4` = this transition's base): "the FINAL Phase-2 lane P2.6 (Tests + seed ข้อมูล master จาก Sheets + เชื่อม QR; plan line 236) — needs its own NEW reviewed claim transition; then Phase 4 (PDF)." This transition IS the P2.6 claim of that record.
4. **Verbatim-pin directive honored (D0):** the dispatch required reading the actual row text before writing — the row's own THREE components (Tests / seed ข้อมูล master จาก Sheets / เชื่อม QR) supersede the dispatch's "tests+master-seed+QR" shorthand; the boundary ruling (WO D1-1: Tests = the executable deliverable; seed = honest NO-SEED; QR = test coverage, printable-QR OUT) is THE adversarial check item.
5. **Structural precedent carried:** ENV-PARITY-P1-007 (PRs #201/#202, v1.4.1) — the P1.7 fixture-driven parity suite: typed case tables `{ id, family, input…, expected, ref, divergence? }`, every case citing its ref-12 line, divergent cases asserting CORRECTED expectations, plus a transactional SQL fixture script. This lane clones that shape for the Phase-2 domains (trigger/RPC/QR resolve, light-check flow, coliform two-step).

## 2. D0 scope discoveries (verified read-only 2026-11-17/18)

### 2.1 The seed verdicts — re-verified NOW (the dispatch's fetch directive, executed)

- **Extinguisher master `ข้อมูลถังดับเพลิง` — STILL SOURCE_UNAVAILABLE.** Workbook `fire_extinguisher` `15EjQ9Ze3LsbUlCxWsm5p2PB_a8KD6o-7_c21I7f3s_E` re-enumerated via full XLSX export: exactly **5 tabs (ตรวจสอบถัง / เก็บรูป / Filter_Firer / Menu_Firer / Numbers)** — byte-identical to the P2.1 enumeration. No master tab. Seed NOTHING; never reconstructed from the inspection table (P2.1 D1).
- **Coliform history — STILL SOURCE_UNAVAILABLE.** Light workbook `ข้อมูลตรวจไฟฉุกเฉิน` `1iqSxixJxPApUOYNFFvw2cgH4zD7lPcC_tPzNs2QePAw` re-enumerated: **4 tabs (Emergency light / Check / ER_light_Menu / Filter_Light)**; combined with P2.4's full 6-workbook enumeration (2026-11-17) — **zero coliform tabs anywhere**. Seed NOTHING; `legacy_id`/`source_provenance` already shipped by P2.4 (no second migration needed).
- **`ตรวจสอบถัง` inspection history — REACHABLE but FK-BLOCKED.** Public gviz CSV (tab `ตรวจสอบถัง`, gid 0): **858 data rows, 27-col header (18 persisted + 9 padding)**, first data row matches P2.2's pinned observation byte-for-byte. The seed is blocked: `safety.extinguisher_inspection.extinguisher_id` FKs → `safety.fire_extinguisher(legacy_row_id)` (0 rows — SOURCE_UNAVAILABLE master), the 858 `QR_CODE` values ARE the master Row IDs, and reconstructing masters from inspections is FORBIDDEN. The history seed rides with the master re-seed (guarded P2.1/P2.3 recipe, dependency-ordered: master → inspections → coliform ×4) + plan §7 Phase-2 backfill + P5.2 pre-cutover.
- **METHOD LANDMINE (new, recorded):** a by-NAME gviz probe (`&sheet=<name>`) silently FALLS BACK to the first tab and returns HTTP 200 for unknown sheet names — observed live (`sheet=ข้อมูลถังดับเพลิง` returned the ตรวจสอบถัง content). Absence proofs require full XLSX exports + programmatic tab enumeration. Never trust a 200-by-name as presence.

### 2.2 Verbatim AppSheet ground truth (reference 12 READ-ONLY) — the binding pins

- **§3.12 master** (9 cols): ประเภทถังดับเพลิง 5-value enum verbatim; **`QR CODE` = `="https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=" & [Row ID]`** (ref 3077-3081) — QR derive-never-store; วันที่บรรจุ/หมดอายุ init TODAY().
- **§3.13 ตรวจสอบถัง** (27 cols): QR_CODE Valid If + verbatim error `ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ` (ref 3158-3166); 5 Show If gates (ref 3176-3253); item enums (ref 3256-3330); `breakdown_details` init `IF([chem_exp]<=[Date_time],"หมดอายุ","ไม่หมดอายุ")` (ref 3336-3338); type **6-value vs master 5-value** — recorded divergence, both pinned.
- **§8 bots → the trigger:** `Update_ExpDate` (ref 6414-6420) + `_Bot_Update_EXP` (ref 6152-6185) → ENV bump-later-only + the adjudicated NULL-expiry parity ruling (blank master date fires the bot — resolved by `20261116000006_parity_p2_002_trigger_null_fix.sql`); deterministic tiebreak.
- **§3.32 light master** (8 cols): `QR` = same formula shape over `[ERL_ID]`; `location_floor` 1..3. **§3.33 Check** (14 cols): the full value-set/Show-If matrix — test_result Show If `[Persistency]="มี"`; Broken_detail EnumList 5 values + Pic/Status Show If `OR(ไม่ผ่าน, ไม่เหมาะสม)` + Status 3 values; `location` auto-fill + master-gated Show If; `SortKey = CONCATENATE([Date_time], "-", [_ROWNUMBER])`.
- **§3.11/§3.16/§3.17/§3.19 coliform ×4:** result sets (+`Positive ++`/invalid food/employee), collect-point vocabularies water 4 / food 5 / general 2 / employee none, Show If `=TODAY()>[Collect_date]` (ref 3606/3646/3838), suggested `+1/+2` Food ref 3654 + Employee ref 3848 ONLY, `อ11` static-image virtual OUT.
- **PII pin:** `Employee_id` IS the Thai national ID (ref 12 §11); the §3.33 Auditor SWITCH is redacted. **Fixture tables carry SYNTHETIC values only** (P1.7 precedent: no secrets, no real patient data, no production row copies); 13-digit digit-run grep of new files = 0 matches (suite pin).

### 2.3 House facts verified (D0)

- Baselines at base `5e30a54`: registry **37 claims** (validate-registry `ok:true`, registry_hash `2a6b3671c197a4ed2b049f7ce860a50e23bd9204c19a839aa744fcb25067afa9` — the fence value, empirically cross-checked: the same guard method at the prior claim base `fb2bead` reproduces the recorded `faae38d5…` byte-exactly); all parity claims CLOSED except THIS after append.
- The fixture targets are LIVE at base: `Update_ExpDate` trigger + `fn_resolve_extinguisher_qr` (P2.2 + the NULL-expiry fix), the light resolve RPC + 332-row check seed (P2.3), the coliform two-step + `isPendingResult` (`lib/food.ts:251-255`) (P2.4); existing suites inventoried in WO §2.2 — P2.6 does NOT re-cover them (additive tables only; edit-forbidden).
- `frontend/package.json` = **1.8.0** → **stays 1.8.0 (NO bump — test-only, D1-3; CHANGELOG byte-untouched)**.

## 3. Testable-unit analysis → D2 RED plan

1. **EXTINGUISHER (`family: "extinguisher"`)** — trigger decision table (bump-later-only; NULL-expiry parity case; tiebreak; backdated); RPC resolve (known id ⇒ payload copies + expiry status; unknown/blank ⇒ fail-closed w/ the verbatim label); QR derive-never-store; form value sets incl. the 6-vs-5 type divergence + `breakdown_details` auto-label + Show If gates.
2. **LIGHT (`family: "light"`)** — §3.33 value sets + the Show If matrix; location auto-fill + unknown-id honesty; light RPC resolve contract; the seed-reality distributions (blank-300 Status) as real-data facts.
3. **COLIFORM (`family: "coliform"`)** — same-day gate cases; `isPendingResult` consumed (never re-derived); +1/+2 suggestions (Food/Employee only; never auto-filled); per-source vocabulary gating (never coerced); result-set membership (++/invalid separate); collect-first NULL result semantics (catalog-probed in the SQL battery: result-side columns carry NO DB defaults).
4. **SQL battery (`scripts/test_parity_p2_006_fixtures_sql.py`)** — transactional zero-net-persistence (the `test_parity_p2_002/003/004` shape): trigger/RPC/two-step cases against the LIVE delivered objects; preflight/post-run baseline counts identical (907/9/4 + 48/0 + 332 + lab_test unchanged).

Truthful RED: the TS suite fails-to-collect at RED (module `./parity-fixtures-p2` absent — the honest new-file-lane RED mode); the SQL script does not exist at RED and its D3 first run is expected GREEN (it verifies EXISTING objects) — recorded plainly, per the P2.4 P3-1 honesty lesson.

## 4. Bound scope (WO §9 / registry mutable_scope)

`frontend/src/lib/parity-fixtures-p2.ts` + `.test.ts`, `scripts/test_parity_p2_006_fixtures_sql.py`, the WO + this handoff + `docs/ai/CURRENT-WORK.md` (transition + closeout only). Everything else forbidden (WO §9) — including ALL `supabase/` files (NO migration/seed/DB write), `CHANGELOG.md` + `frontend/package.json` (byte-untouched), delivered surfaces, existing test suites (additive-only lane), CI, reference/plan docs, Drive writes, `data/**`, `.env`, personnel-identity values in fixtures (synthetic only).

## 5. Single next safe action

Independent exact-SHA review of THIS docs-only claim transition (R2 floor: fresh GLM-5.3 MAX reviewer context; the AUTHORIZATION BASIS incl. the D1-1 three-component boundary ruling (row-verbatim) and the D1-4 seed verdicts are explicit adversarial check items — insufficient basis parks the claim unmerged). On approval the AUTHORIZED reviewer merges THIS transition; only then does the implementing lane activate on the merged base via a fresh freshness gate: worktree `_worktrees/env-parity-p2-006`, D2 RED (fail-to-collect) → D3 implement (fixture tables + SQL battery) → D4 battery (vitest FULL, tsc, oxlint, Playwright FULL workers=1, guard 344, runtime 62, checker OK v1.8.0 NO-bump, PII grep 0) → D5 fresh-GLM → **STOP at REVIEW_REQUESTED — implementer never merges**.

---

## 6. Implementation-lane receipts (D2/D3/D4 — appended after the claim merges)

*(appended by the implementing lane)*

---

## 7. D6 CLOSEOUT RECEIPT (docs-only closeout lane)

*(appended by the closeout lane)*
