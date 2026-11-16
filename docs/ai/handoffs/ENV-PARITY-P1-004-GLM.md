# Handoff — ENV-PARITY-P1-004 (GLM implementing lane) · D0

Claim `ENV-PARITY-P1-004-C1` (gen 1, CLAIMED) — AppSheet parity Phase 1 lane P1.4: ฟอร์มบ่อบำบัด parity + honest warnings + spec admin + format rule Cl>2.5.

## D0 — Claim transition authored (16 พฤศจิกายน 2569 / 2026-11-16)

Authored on branch `docs/env-parity-p1-004-claim` off base `faf9c2f9641fbd7d666a2dba9e32d63d000e4518` (= origin/main tip at authoring: merge of PR #191, the ENV-PARITY-P1-002-C1 closeout; clean, fetched, ff verified). Docs-only transition — the implementing lane must be activated ONLY after this PR is independently reviewed and merged to main.

### Authorization basis (recorded, adversarial-check item)

1. Owner standing Goal-mode instruction 2026-11-15: "ต่อยาวๆ ตามแผนและ roadmap ที่วางไว้".
2. Owner parity authorization 2026-11-14 → `docs/ai/APPSHEET-PARITY-PLAN.md`; lane scope = §6 Phase 1 table row P1.4 bound exactly ("ฟอร์มบ่อบำบัด parity (ช่องที่ขาด + validation ทดแทน Valid If + เตือน "ยังไม่มีมิเตอร์สูบ/ยังไม่มีบันทึกน้ำประปา" — ห้าม fallback 60) + format rule Cl>2.5" — `/form`).
3. Owner gate answers A1–A3 2026-11-15 (plan §5.3 receipt block, commit `fb57369`): A1 ×34/×12 = pump per-hour specs + "ข้อกำหนดใหม่: ต้องมีระบบตั้งค่าสเปกปั้ม…" — the owner EXPLICITLY asked for the spec-settings system; A2 ×3.7 same config system; A3 ÷10 + 1:9 groundwater confirmed. Delivered prerequisites verified at base: P1.1 schema columns (PR #184), P1.2 `core.equipment_spec` + `wastewater.v_reading_meter_chain` (PR #190, migration applied, 4 seeds, 32 genuine boundary rows), P1.3 thresholds + `v_reading_critical_flags` (PR #187).
4. Coordinator transition instruction 2026-11-16 (goal-mode, coordinator session) binding the lane scope + routing + STOP at REVIEW_REQUESTED.

**No delegated consult was run in THIS transition** (honesty record): the binding decisions below restate the owner's own words (A1/A2/A3), the plan row, and reference-doc ground truth; the genuinely new judgment items (RLS policy addition, App.tsx route scope, v1.2.0) are D1 items 3/4/6 in the WO with rationale in place — the reviewer adjudicates them explicitly. Precedent: the P1.2 lane's consult record bound ITS lane; this transition creates no new domain constant (every number is verbatim from reference doc 12 §3.3 + §9.2 line 6429).

### Scope discoveries recorded at claim time (bind the lane shape)

1. **Current form state** (`frontend/src/pages/DailyFormPage.tsx`, 623 lines at base): has DO×3/pH/TDS×2/temp/SV30/free_chlorine inputs; `chlorine_mix_ratio` as FREE TEXT with placeholder "เช่น 1:5" (`:529-531`); equipment 10× boolean Toggles with NO enum vocabulary (`:538-551`); `wastewater_discharged` boolean toggle; `system_operating` + abnormal_cause flow (SPEC §6); สี/กลิ่น free text + 2/1 quick-pick chips (`:586-594`); NO `*_status` columns wired; NO >2.5 highlight; NO warning chips; NO Water_In lookup.
2. **`flag_free_chlorine` DOES NOT EXIST anywhere in the repo** (grep at base: only the plan §5.2 wording names it). Real surfaces: legacy `wastewater.v_reading_detail` (`flag_do1..3`, untouched since p12) and P1.3 `wastewater.v_reading_critical_flags` (`critical_free_chlorine_low/high` at `<0.5`/`>1` — the Critical streak rules, NOT the format rule). The >2.5 rule is implemented fresh as a frontend display predicate (WO §2.3).
3. **Readings list located**: `frontend/src/pages/ReadingsListPage.tsx` (103 lines; "Cl อิสระ" cell at `:89` gets the >2.5 highlight).
4. **`core.equipment_spec` is RLS-enabled with NO policies** (P1.2, fail-closed) → client INSERTs are denied for everyone today; the spec admin page REQUIRES an additive policy migration (WO §2.4-3) or it cannot save. No policy file exists at base.
5. **AppSheet error texts/labels quoted verbatim** in the WO §2.1 with ref lines: `แน่ใจหรือที่จะลงข้อมูลนี้` (ref 461), `ตรวจสอบข้อมูลดีๆนะจ๊ะ` (ref 613), `ข้อมูลผิดพลาด` (ref 643), ผู้บันทึก Valid If (ref 716–720), fallback-60 formula (ref 616–622), มิเตอร์ text prompt (ref 629–637), format rule (ref 6429).
6. **AppSheet คู่มือ DO / photo Show columns** (ref 734–1065) are Drive-hosted static content — OUT of scope (recorded, not silent).

### Deviations from the transition instruction's literal claimed-file list (recorded, reviewer adjudicates)

1. `supabase/migrations/20261116000001_parity_p1_004_equipment_spec_admin.sql` added to mutable scope — additive CREATE POLICY only; without it the owner-named spec-settings system cannot persist anything (WO §2.4-3).
2. `frontend/src/App.tsx` added to mutable scope (route registration only) — a page without a route is dead code (WO §2.4-4).
Everything else in the instruction's list is honored verbatim; P1.2 views/migrations stay READ-ONLY.

### D2 RED-first plan (binding counts recorded by the lane at execution)

- Unit `frontend/src/lib/form-parity.test.ts`: enum↔boolean maps (10 machines + 2 screens), mix-ratio enum `1:2/1:4/1:9`, validation bounds (Cl 0–100; electricity >0; error texts verbatim), >2.5 predicate (2.5 exactly NOT flagged, 2.6 flagged), no-fallback-60 invariant (missing Water_In → null + chip text "ยังไม่มีบันทึกน้ำประปาของวัน"; missing meters → chip "ยังไม่มีมิเตอร์สูบ").
- E2E `frontend/tests/e2e/env-parity-p1-004.spec.ts`: fields render; chips appear when telemetry missing (no 60/0 anywhere in the DOM for those fields); Cl>2.5 red+icon on form value AND readings row; `/admin/equipment-specs` denies non-admin (RequireAuth requireAdmin), lists specs, append form submits a new effective-dated row, no edit/delete affordances; history rows read-only.
- RED must fail truthfully pre-implementation; counts recorded verbatim in the D2 section below.

### Truth constraints (binding)

unknown ≠ 0 (ห้ามแทนค่าศูนย์); latest ≠ live; booleans stay source of truth + `*_status` mirrors; verbatim labels/values/errors; no client-side re-derivation of P1.2 math (display + "ค่าคำนวณจากระบบ" flag only); spec history append-only; admin-gated; พ.ศ. dates; no PHI; no durable writes in tests; no assertion weakening; implementer never merges.

### Fence (transition)

`expected_policy_revision = faf9c2f9641fbd7d666a2dba9e32d63d000e4518`
`expected_registry_hash = 0a616928cc9143d42c1057d8727ebec06316db846abc6473258d2c02ff75576e` (registry block AT base, guard method `scripts/env_coordination_guard.py:454-456`; empirically cross-checked — the same method at prior base `85ddf75` reproduces the prior fence `f3c69b01…` byte-exactly). validate-registry at base: `{ok: true, claims: 28}`.

## D-phase log (implementation lane appends below)

### D2 — RED-first receipt (2026-11-16, commit `45c90af`, base 01433f0 = origin/main)

- Unit `src/lib/form-parity.test.ts`: **1 suite failed-to-collect** (`Cannot find module './form-parity'`), 0 tests run — the module did not exist. Truthful RED.
- E2E `tests/e2e/env-parity-p1-004.spec.ts`: **11 failed / 0 passed** (fields, chips, highlight, spec route all absent).
- `tsc -b` at RED: 1 error (TS2307, the missing import) — recorded honestly.

### D3 — implementation receipt (commit `989dd3f`)

Everything in WO §9 D-phase log D3 items 1–8 applies (form parity, honest warnings, >2.5 rule, spec admin, wiring, migration, v1.2.0). Binding-condition compliance: INSERT policy gated **admin-only** via `core.fn_is_admin()` (R2 §4a binding); SELECT policy staff-or-admin; no UPDATE/DELETE policies (append-only by grant shape; supersede-by-append documented in the migration header — closure UPDATEs + btree_gist hardening stay owner-gated follow-ups).

### D3-apply — ENV_DB receipts (2026-11-16)

- Preflight PASS: rls=true; policies=0; seeds=4; helpers exist; readings=907.
- Apply via `scripts/apply_migration_api.py`: **12/12 OK, 0 FAIL** (file `supabase/migrations/20261116000001_parity_p1_004_equipment_spec_admin.sql`).
- Post-verify PASS: INSERT policy `with check (core.fn_is_admin())`; SELECT policy `using (core.fn_is_staff_or_admin())`; data intact (4 seeds / 907 readings); `public.equipment_spec` `security_invoker=on`; anon REST probes → 401 fail-closed on both façades.
- **DEVIATION D1-7 (reviewer adjudicates):** the same migration adds public security_invoker façade views + grants for `core.equipment_spec` (select+insert only) and `wastewater.v_reading_meter_chain` (select only). LIVE-EVIDENCE-anchored reason: ENV_DB PostgREST exposes ONLY `public` + `graphql_public` (`PGRST106` probe 2026-11-16), so schema-direct access from supabase-js is impossible; without façades the owner-named spec page cannot read or save (the exact dead-feature outcome D1-3's rationale rejects) and the honest-warning meter read is unreachable. House precedent: dock migration `20260803000001` bundles view + grant + policies; rollback documented in the migration header.

### D4 — battery receipt (final head; full table in WO §9)

vitest FULL 33 files **540 passed / 1 skipped**; `tsc -b` clean; oxlint exit 0 (18 pre-existing warnings, zero in changed files); Playwright FULL workers=1 **224/224** (no flaky); guard **344 OK**; runtime **62 OK**; checker **OK v1.2.0**; `git diff --check` clean; validate-registry `{ok:true, claims:29, hash 99e49674…}` with CURRENT-WORK.md byte-identical (registry flip = closeout transition, house precedent).

### Honest notes + lessons (for the reviewer)

1. **Two real defects caught by the D4 battery and fixed (no assertion weakening; out-of-scope suites pass unmodified):** (a) my spec-append e2e raced the POST capture — fixed with `expect.poll` (5× standalone re-run + full suite clean); (b) the status-mirror follow-up UPDATE originally THREW on failure, which misreported durably-saved readings as failed and broke the pre-existing atomic-save mobile suite — root-caused and re-designed: the mirror sync lives in the create HOOK layer, non-fatal, surfaced as an honest warning toast whose text deliberately avoids the success-toast phrase (strict-selector collision recorded in code).
2. **fn_create_reading cannot write the P1.1 `*_status` columns** (fixed key list; RPC out of mutable scope) → create-path mirror sync is the hook-layer follow-up UPDATE; edit path carries the mirrors in the existing generic update. Recorded as a noted follow-up: if a later lane touches the RPC, folding the mirrors in would remove the extra round-trip.
3. **Water_In source:** `water_supply.daily_check` is still the v2 skeleton (no `Water_In` column — MOD-WS-a/P1.5 pending). `fetchWaterUsedForDate` reads `select("*")` and extracts `water_in`/`Water_In` generically — errors are impossible on the missing column and the chip shows honestly either way (WO §2.2-1 binding). When P1.5 lands the column, the prefill + chip behavior switches on with zero frontend change.
4. **Enum display order:** ลักษณะสี chips render [น้ำตาลเข้ม, น้ำตาลอ่อน, ดำ] — value SET verbatim-complete from ref 676–687; display order keeps the house frequency ordering so the pre-existing keyboard-flow e2e (out of scope) stays truthful. Same for ลักษณะกลิ่น (กลิ่นดินปกติ first).
5. Machine-local setup (not repo changes): lane worktree `frontend/.env` copied from the canonical checkout; `npm install` in the worktree with `frontend/package-lock.json` restored to HEAD afterwards (diff clean).
6. **STOP at REVIEW_REQUESTED — implementer never merges.** D5 fresh-GLM review at the exact frozen head; Terra cross-model eligible after 2026-11-20 (never a silent downgrade).

### Fence (implementation lane)

`expected_policy_revision = 01433f0274606f09ebfdc15e55931d2e8cfff026` (origin/main at branch point); `expected_registry_hash = 99e4967411678fc245d72552a62949e51c5d190162e9836dc9c09f1e872c2de9` (validate-registry output at HEAD — CURRENT-WORK.md untouched).
