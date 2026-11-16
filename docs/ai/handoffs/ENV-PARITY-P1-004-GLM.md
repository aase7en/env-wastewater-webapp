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

(appended by the implementing lane)
