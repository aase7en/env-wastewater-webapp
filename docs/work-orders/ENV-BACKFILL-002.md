# WO — ENV-BACKFILL-002 — carbon-domain backfill (owner sheet "CarbonF งานที่สำเริม")

Status: **IMPLEMENTATION DELIVERED — REVIEW_REQUESTED (C1, gen 1).** D1 consult receipts + D2 RED (23F/18P pre-apply at head `313a8af`) + D3 apply (76/76 OK; readings 907→1,961, meters 1→27, ledger 27; preflight STOP-on-drift green) + D4 battery GREEN (suite 41/41; idempotency re-run 76 OK w/ zero deltas; vitest 998✓/1 skip; tsc ✓; oxlint 0 errors; Playwright 336/336 w=1; guard 344/344; runtime 62/62; checker OK v1.15.1 NO BUMP) — see `docs/ai/handoffs/ENV-BACKFILL-002-GLM.md` D1–D4. STOP at REVIEW_REQUESTED; the implementer never merges.

- task_id `ENV-BACKFILL-002` (unique — 0 prior ENV-BACKFILL-002* in the repo at base)
- claim_id `ENV-BACKFILL-002-C1`, generation 1, holder `kilo-env-backfill-002-g1-primary`
- worktree (planned) `_worktrees/env-backfill-002` — created off the transition merge SHA after merge, NOT before
- transition branch `docs/env-backfill-002-claim`
- base_sha `a1bb03906fe7215c04a3d7f13f795e33335c3b72` (= origin/main tip at transition; fetched/clean/ff-verified 2026-11-24)
- fence: expected_policy_revision = `a1bb03906fe7215c04a3d7f13f795e33335c3b72` / expected_registry_hash = `fb0ecbaf30af7619e082ae70d44de3918c98597f22001407ef9b8cb717c4f031` (guard `registry_hash` of the registry block AT base, method `scripts/env_coordination_guard.py:454-456`, empirically reproduced on the git object `a1bb039:docs/ai/CURRENT-WORK.md`)

## 0. Authorization basis

1. **Owner standing Goal-mode instruction** — continue per the laid plan/roadmap.
2. **The owner's 2026-11-24 sharing action** — the owner shared the sheet in-chat with the label **"CarbonF งานที่สำเริม"** (sheet id `17mCv54VhNlYh-N215TAnahll1trbKfy5Q0m_z7gVssA`), verified link-shared-OK and read back read-only (htmlview tab enumeration + gviz CSV per tab, no login, no writes) by the verification sibling; raw evidence at `/tmp/env-carbonf-2026-11-24/`, verdict attached **VERBATIM as Appendix A of `docs/ai/handoffs/ENV-BACKFILL-002-GLM.md`**. Spelling-variance honesty: the sibling receipt transcribed the label as "CarbonF งานที่สำเริง" — both transcriptions recorded verbatim, never silently normalized; the sheet's own file title is "carbon footprint".
3. **Parity plan §7 backfill intent** (`docs/ai/APPSHEET-PARITY-PLAN.md:280-283` — pre-cutover backfill rows for the served domains): the carbon domain feeds the **delivered** Sustainability/T-VER surfaces (`ENV-WASTE-CARBON-001`/`001B`, CLOSED 2026-10-14 — `/sustainability` page + emissions-by-source + T-VER evidence readiness), which currently run on a thin carbon corpus; the owner's share pivots this domain from thin-source to backfillable.
4. **The verification evidence** — `/tmp/env-carbonf-2026-11-24/` (11 gviz CSVs + htmlview.html; per-file sha256 in handoff Appendix B).

## 1. Lane scope — pinned at this WO (7 items)

1. **The master: 2,944 rows (2018–2025)** — `ฐานข้อมูล Carbon Footprint รพ.อุทัย` (Department × ActivityType × Value × Unit × ค่าใช้จ่าย, ค.ศ. d/m/yyyy) → carbon-domain backfill. **RECONCILIATION REQUIRED** against the live corpus (§3): the master's 2024-01-09→2025-12-31 electricity rows overlap the live 907-row `carbon.reading` — never blindly double-count; the dedup key is pinned at D1 (§5).
2. **The sub-tabs** — energy 126 / waterin 56 / ก๊าซ 6 / น้ำมัน 22 / กระดาษ 33 / หมึก 14 / คลอรีน 12 → map to `carbon.reading`/`carbon.meter` source_types + the chemical domain (chlorine → `chemical.*` candidate); per-tab mapping pinned at D1 (§4).
3. **D1 DESIGN FORK (delegated consult)** — the master's ~20+ ActivityTypes vs the 5-value `source_type` enum (electricity/diesel/gasoline/lpg/other). Options (A) extend the enum / (B) keep 5 + additive `activity_subtype` column / (C) collapse to existing + a reference-mapping table. Jev consult FIRST (receipts to /tmp, embedded VERBATIM in the handoff); if Jev is contract-degenerate → the GLM coordinator decides under the owner's standing delegation (the P1.2 D1 precedent); Terra optional. Decide with receipts; never silently pick.
4. **GENUINELY-NEW fragments** — เงินขายขยะ ledger 27 + หมึก 14 + the TGO form template (การตอบแบบฟอร์ม 2×261): DECIDE per fragment at D1 — a new minimal table vs defer with a recorded follow-up. The TGO form's 261 columns reveal ~150 future categories: recorded as **FORWARD-INTEL** — a small additive note in `docs/ai/APPSHEET-PARITY-PLAN.md` ONLY; **do NOT build 150 categories now**.
5. **`query` tab = EXCLUDED** — duplicate of AppSheet `ข้อมูลคุณภาพน้ำ` (ref doc 12 §3.3, headers verbatim TDS-1/2, DO-1/2/3, pH, SV30, Free Chlorine…): already migrated as `wastewater.reading` (907 rows). Recorded why; `wastewater.reading` stays byte-untouched.
6. **Mixed date eras** — `query` พ.ศ. (excluded anyway); all other tabs ค.ศ. d/m/yyyy (US month/day order in the master's Timestamp/DataDate); per-source normalization pinned per source at D2/D3, blanks → NULL, never fabricated.
7. **Release: DB-only → NO BUMP** — v1.15.1 stays, no tag, no CHANGELOG entry (the P2.1/P4.4/C8/BACKFILL-001 precedent).

## 2. Source census (CSV truth binds)

Raw files `/tmp/env-carbonf-2026-11-24/{tab}.csv`. Physical CSV line counts include the one header row; the **data-row counts below bind** (the BACKFILL-001 count-honesty precedent — CSV truth wins over prose counts). Per-file sha256 in handoff Appendix B.

| tab (verdict name) | file | data rows | date era | shape note (from the verdict, verbatim in handoff Appendix A) |
|---|---|---|---|---|
| ฐานข้อมูล Carbon Footprint รพ.อุทัย | basedata.csv | **2,944** | ค.ศ. | master: Timestamp, DataDate, Department, ActivityType, Value, Unit, ค่าใช้จ่าย; 23×26 distinct Department×ActivityType; ค่าใช้จ่าย computed-looking |
| energy | energy.csv | **126** | ค.ศ. | electricity kWh + บาท, computed ราคาต่อหน่วย; a regional monthly block inside the same tab |
| waterin | waterin.csv | **56** | ค.ศ. | water ลบ.ม. + บาท, computed Avg/unit + Energy_usage(Cal) |
| การใช้ก๊าซหุงต้ม | gas.csv | **6** | ค.ศ. | LPG กิโล (ประเภท column empty in the export) |
| การใช้น้ำมัน | fuel.csv | **22** | ค.ศ. | ดีเซล/เบนซิน ลิตร |
| กระดาษ | paper.csv | **33** | ค.ศ. | A4 reams (mixed 2024/2023 ordering in-file) |
| หมึก | ink.csv | **14** | ค.ศ. | cartridges: รุ่นเครื่อง, ยี่ห้อ, ประเภทหมึก, จำนวน/ตลับ, สถานที่ |
| คลอรีน | chlorine.csv | **12** | ค.ศ. | คลอรีน/ลิตร by สถานที่ใช้ (ประปาบาดาล …) → chemical-domain candidate |
| สำเนาของ เงินขายขยะ | wastemoney.csv | **27** | mixed in-file | waste-sale money ledger, rolling balance ยอดรวมเหลือ |
| query | query.csv | **1,026** | พ.ศ. 2567–2568 | EXCLUDED (§7) — duplicate of the migrated ข้อมูลคุณภาพน้ำ |
| การตอบแบบฟอร์ม | formresp.csv | **2** | ค.ศ. 2024 | Google-Form responses, 261 columns — the TGO carbon form template |

## 3. Live ENV_DB baseline — probed READ-ONLY 2026-11-24 (the reconciliation pin)

Probed via the sanctioned Management-API query path (`scripts/_env.py` secret resolution + `POST /v1/projects/gllqtbyofrcjzmbnfoeh/database/query`, SELECT-only; receipt verbatim in the handoff D0):

- `carbon.reading`: **907 rows**, `min(reading_date) = 2024-01-09`, `max(reading_date) = 2026-07-04`, every row `input_source = 'manual'`
- `carbon.meter`: **exactly ONE identity** — `source = electricity`, `meter_name = 'ระบบบ่อบำบัดน้ำเสีย'`, `unit = kWh`, `is_active = true` (id `b6be4c99-c83a-43f7-b765-72286cc78bd0`)
- enum `source_type` (lives on `carbon.meter.source`, NOT on reading): `electricity, diesel, gasoline, lpg, other`
- `carbon.emission_factor`: **12 rows** (electricity 0.4999 kWh; diesel 10.21 L; gasoline 8.91 L; lpg 2.99 kg; `other` ×8 incl. chlorine 1.8, alum 0.45, kmno4 5.2, waste_transport 3.27 km, infectious_waste 3.3, reagent_disposal 2.5, recyclable 0.0)
- `carbon` schema objects: `emission_factor, meter, reading` + views `v_monthly_co2e, v_overview_carbon, v_reading_co2e, v_unified_co2e`
- `carbon.reading` columns: id, meter_id, reading_date, meter_value, consumption, input_source (enum), raw_payload jsonb, recorded_by, created_at — **no department/activity columns** (the D1 fork exists because of exactly this)
- chemical schema (chlorine mapping candidate): `master, inventory_lot, inventory_lot_allocation, inventory_lot_deduction, movement`

**Overlap to reconcile:** the master's 2024-01-09→2025-12-31 rows overlap the live electricity corpus (the live 907 = the AppSheet ข้อมูลคุณภาพน้ำ-era electric-meter history seeded through the P12.5-era chain and verified byte-stable through the parity lanes). Preflight **STOP-on-drift**: the live count must still be 907 with the same min/max immediately before apply, else STOP and re-census.

## 4. D1 design fork — binding procedure

Decide BEFORE D2, with receipts embedded VERBATIM in the handoff:

1. **The fork itself** (A extend enum / B keep 5 + additive `activity_subtype` / C collapse + reference-mapping table). Consult **Jev first** (the typesafe provider; options must be encoded in the question text — the options param is ignored by the contract, the P1.2 precedent). If Jev is contract-degenerate → **the GLM coordinator decides** under the owner's standing delegation (P1.2 D1 precedent), recording the reasoning. **Terra optional** (admission-permitting). Constraints the decision must respect:
   - additive-first (no enum-value churn on an existing CHECK-bound type without a receipt-backed reason; `ALTER TYPE ... ADD VALUE IF NOT EXISTS` is transactional-safe only outside a transaction block with the new value unused in the same statement batch — pin the apply mechanics if A is chosen);
   - unknown ≠ zero: an ActivityType that cannot map honestly stays NULL/unmapped — never coerced into `other` silently unless D1 explicitly rules the mapping with the sheet's own vocabulary as the receipt;
   - the choice must keep the delivered `/sustainability` + rollup views truthful (they aggregate by `meter.source`).
2. **The dedup key** for the master overlap (candidates: (reading_date, source_type[, department]) — pinned after inspecting both shapes; the master has no meter identity, so a new-meter-per-source-type shape (one active meter per non-electricity source_type) vs one shared `other` meter is part of this pin).
3. **Per-tab mapping** incl. chlorine → `chemical.*` vs carbon (the chemical tables exist; `chemical.movement` is the ledger the parity lanes shipped).
4. **Per-fragment genuinely-new decisions** (§6).
5. **The ONE-migration shape** — ONE new migration file only, filename pinned in this WO: `supabase/migrations/20261125000000_backfill_002_carbon.sql` (the prefix is the lane label, not a timestamp claim; if the apply lands on a different calendar day the pinned name still binds — a divergence is a recorded deviation, the P1.3 filename-drift P3 prevented). NO DDL beyond the D1-decided additive shape (enum values / additive column / reference table + guarded seeds); every pre-existing migration stays byte-identical.

## 5. Reconciliation + count discipline (plan §7 rules bind)

- Preflight: live `carbon.reading` == 907 / min 2024-01-09 / max 2026-07-04 (STOP-on-drift), plus per-target-table baseline counts.
- Guarded idempotent writes: `INSERT ... SELECT ... WHERE NOT EXISTS` per the D1-pinned key; a re-run inserts ZERO; per-table count guards.
- The count reconciliation report (before → after) per table, per plan §7 rule 3, attached to the handoff D3.
- Computed-looking source columns (`ค่าใช้จ่าย`, energy `ราคาต่อหน่วย`, waterin `Avg/unit` + `Energy_usage(Cal)`, wastemoney `ยอดรวมเหลือ`) are NEVER re-derived into stored values unless D1 pins the sheet's own formula as the receipt; blanks → NULL; unknown ≠ zero.
- Per-source date normalization pinned per source (master ค.ศ. d/m/yyyy US-order; พ.ศ. appears only in the excluded query tab and nothing else in this batch — verify at D2, never assume).

## 6. Genuinely-new fragments — per-fragment DECISIONS at D1 (bounded)

| fragment | rows | decision space |
|---|---|---|
| เงินขายขยะ ledger | 27 | minimal new table (waste-sale revenue ledger w/ rolling balance recorded, never recomputed) vs defer w/ recorded follow-up |
| หมึก cartridge detail | 14 | minimal attribute table vs map-into-carbon vs defer |
| TGO form template | 2×261 | the TEMPLATE (column inventory) is FORWARD-INTEL only → additive note in `docs/ai/APPSHEET-PARITY-PLAN.md`; the 2 actual responses decide like the others |

**Hard cap: do NOT build ~150 TGO categories now.** The additive plan-doc note is the ONLY place the forward inventory is recorded. `docs/ai/APPSHEET-PARITY-PLAN.md` may be edited ADDITIVELY (one appended FORWARD-INTEL note) and nothing else.

## 7. Exclusions (recorded why)

- **`query` tab EXCLUDED**: it is the AppSheet `ข้อมูลคุณภาพน้ำ` table (ref doc 12 §3.3) already migrated — the live `wastewater.reading` 907-row corpus IS that data (2024-01-09→2026-07-04). Re-importing it would double-count the water-quality history; its พ.ศ. era belongs to the wastewater domain's already-pinned normalization. `wastewater.reading` and every wastewater view stay byte-untouched.

## 8. Routing + battery

Track-Z GLM. Worktree `_worktrees/env-backfill-002` created off the transition merge SHA after this PR merges.

1. **D2 RED** — `scripts/test_parity_backfill_002.py` (NEW read-only SQL contract suite): the per-table count/shape contracts, the dedup-key no-double-count contracts, per-source date-normalization pins, blanks-NULL pins, PII-absence pins, and the guarded re-send idempotency canary — run truthfully RED pre-apply (the canary proves the batch was never sent pre-apply), GREEN post-apply. House live-DB gate per the `test_parity_p1_001_schema.py` precedent.
2. **D3 implement + apply** — the ONE migration via `scripts/apply_migration_api.py` with the ENV_DB gate (PROJECT_REF `gllqtbyofrcjzmbnfoeh`); preflight STOP-on-drift; guarded idempotent; count reconciliation vs live (before → after per table); rollback SQL documented in the migration header (DELETE by the exact seeded key sets + the `source_provenance` marker; enum-value reversal owner-gated).
3. **D4 battery** — vitest FULL, `tsc -b`, oxlint, Playwright FULL workers=1, guard 344/344, runtime 62/62, checker OK v1.15.1 (NO BUMP), `git diff --check` clean, PII/token grep over ALL changed files (0 hits), the before/after reconciliation report.
4. **D5 fresh-GLM independent review** at the exact frozen head with an independently executed battery rerun where possible; the implementer never merges. **STOP at REVIEW_REQUESTED.**

## 9. Release ruling

**NO BUMP** — DB-only data backfill through existing surfaces (delivered Sustainability/T-VER UIs read whatever exists); v1.15.1 stays; no tag; no CHANGELOG entry. No Pages deploy expected (docs+scripts+supabase paths do not match the deploy filter — record honestly if a run appears).

## 10. Forbidden scope (mirrors the registry `forbidden_scope`)

- `frontend/` zero diff; the backfilled data surfaces through EXISTING carbon/Sustainability/T-VER UIs only.
- Every pre-existing migration byte-identical; the ONE new migration is the only DDL/DML surface.
- RLS, policies, grants, facades, `supabase/functions/`, `config.toml`, `seed/` byte-untouched (existing policies govern the seed writes; if D1=A adds enum values, `ALTER TYPE ... ADD VALUE` is the sole exception, pinned in-header).
- `wastewater.reading` + all wastewater views byte-untouched; the `query` tab never imported.
- NO ~150-category build; the TGO inventory lives only as the additive plan-doc note.
- Personnel names/IDs of any form (หมึก's สถานที่ and any personal-looking strings masked in receipts) — never seeded verbatim, never committed, never printed; 13-digit patterns never committed.
- `.github/**`, CI workflows untouched; CHANGELOG.md + frontend/package.json untouched (NO BUMP); reference/plan docs read-only EXCEPT the one additive FORWARD-INTEL note in `docs/ai/APPSHEET-PARITY-PLAN.md`.
- The two standing non-CLOSED claims' files (ENV-BUILDING-REPAIR-001-C1 owner-deferred; ENV-SUNDAYMCP-ROUTING-001-C1 owner-side) — scope-disjoint, byte-untouched; CURRENT-WORK.md itself is the append-by-protocol shared surface.
- Telegram credentials, tokens, JWT literals — never committed, never printed. `.env`, `data/raw/`, the `/tmp` raw CSVs — never committed; only findings/counts/sha256s attach to the handoff.

## 11. Deviations log (append-only)

Recorded at transition time: none yet. Any numbered-set split of the ONE migration, any date-prefix divergence on the pinned filename, any per-fragment decision beyond §6's bounded space, or any D1 outcome without an embedded receipt = an explicit adjudicated deviation recorded here + in the handoff, never silent.
