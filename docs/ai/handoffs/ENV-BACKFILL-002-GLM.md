# ENV-BACKFILL-002 — GLM handoff (Track-Z: carbon-domain backfill)

Lane: carbon-domain backfill from the owner's 2026-11-24 shared sheet **"CarbonF งานที่สำเสริม"** (the sheet's own file title is "carbon footprint"). WO: `docs/work-orders/ENV-BACKFILL-002.md`. Status at writing: **claim transition REVIEW_REQUESTED** (PR `docs/env-backfill-002-claim` → main); implementation opens only after the transition merges.

## D0 — transition receipt (2026-11-24)

### Authorization basis (adversarial check item)

1. Owner standing Goal-mode instruction (continue per the laid plan/roadmap).
2. The owner's **2026-11-24 sharing action** — in-chat link, label **"CarbonF งานที่สำเสริม"** (transition-instruction transcription; the verification sibling's receipt transcribes "CarbonF งานที่สำเริง" — both recorded verbatim, never silently normalized), sheet id `17mCv54VhNlYh-N215TAnahll1trbKfy5Q0m_z7gVssA`; verified link-shared-OK and read back READ-ONLY (htmlview tab enumeration + gviz CSV per tab; no login, no writes) by the verification sibling session; raw evidence `/tmp/env-carbonf-2026-11-24/`.
3. Parity plan §7 backfill intent (`docs/ai/APPSHEET-PARITY-PLAN.md:280-283`) — the carbon domain feeds the **delivered** Sustainability/T-VER surfaces (`ENV-WASTE-CARBON-001`/`001B`, CLOSED 2026-10-14).
4. The verification evidence — the sibling's verdict table attached **VERBATIM as Appendix A** below.

### Fence (verified before authoring)

- Base `a1bb03906fe7215c04a3d7f13f795e33335c3b72` = origin/main tip; worktree clean; only pre-existing untracked `_worktrees/` + `supabase/.temp/` (untouched).
- expected_policy_revision = `a1bb03906fe7215c04a3d7f13f795e33335c3b72`.
- expected_registry_hash = `fb0ecbaf30af7619e082ae70d44de3918c98597f22001407ef9b8cb717c4f031` = guard `registry_hash` (sha256 of the exact canonical block, `scripts/env_coordination_guard.py:454-456`) of the registry block **AT `a1bb039`**, empirically reproduced on the git object (`git show a1bb039:docs/ai/CURRENT-WORK.md` → extract → hash → exact match).
- Registry at base: **54 claims, `validate-registry` ok:true BOOTSTRAP_CONTROL**. Registry honesty: the transition instruction said "NO active claim"; the base registry actually holds **54 claims with TWO standing non-CLOSED entries** — `ENV-BUILDING-REPAIR-001-C1` (CLAIMED, owner-deferred WAITING_EXTERNAL) and `ENV-SUNDAYMCP-ROUTING-001-C1` (CLAIMED, owner-side). Both are **scope-disjoint** from this lane (file-level overlap ZERO; CURRENT-WORK.md itself is the append-by-protocol shared surface). Recorded, not silently normalized.

### Live ENV_DB baseline — READ-ONLY probe receipt (2026-11-24, verbatim)

Path: the sanctioned Management-API query route (`scripts/_env.py` Drive-backed secret resolution → `POST https://api.supabase.com/v1/projects/gllqtbyofrcjzmbnfoeh/database/query`), SELECT-only, no writes. Probe machine: this macOS checkout; token resolved via the gitignored one-line `.env` stub `__LOAD_FROM_DRIVE__=true` (house precedent, `.gitignore:10`).

```json
[
 {"q": "carbon.reading total + date range", "http": 201,
  "rows": [{"n": 907, "min_d": "2024-01-09", "max_d": "2026-07-04"}]},
 {"q": "carbon.reading by input_source", "http": 201,
  "rows": [{"input_source": "manual", "n": 907}]},
 {"q": "carbon.meter identities", "http": 201, "rows": [{"n": 1}]},
 {"q": "carbon schema tables", "http": 201,
  "rows": [{"table_name": "emission_factor"}, {"table_name": "meter"}, {"table_name": "reading"},
           {"table_name": "v_monthly_co2e"}, {"table_name": "v_overview_carbon"},
           {"table_name": "v_reading_co2e"}, {"table_name": "v_unified_co2e"}]},
 {"q": "carbon.meter row", "http": 201,
  "rows": [{"id": "b6be4c99-c83a-43f7-b765-72286cc78bd0", "source": "electricity",
            "meter_name": "ระบบบ่อบำบัดน้ำเสีย", "unit": "kWh", "is_active": true}]},
 {"q": "source_type enum values", "http": 201,
  "rows": [{"typname": "input_source", "values": "manual,ocr,iot"},
           {"typname": "source_type", "values": "electricity,diesel,gasoline,lpg,other"}]},
 {"q": "emission_factor rows", "http": 201, "rows": [{"n": 12}]},
 {"q": "chemical schema tables", "http": 201,
  "rows": [{"table_name": "inventory_lot"}, {"table_name": "inventory_lot_allocation"},
           {"table_name": "inventory_lot_deduction"}, {"table_name": "master"}, {"table_name": "movement"}]},
 {"q": "carbon.reading columns", "http": 201,
  "rows": [{"column_name": "id", "data_type": "uuid"}, {"column_name": "meter_id", "data_type": "uuid"},
           {"column_name": "reading_date", "data_type": "date"}, {"column_name": "meter_value", "data_type": "numeric"},
           {"column_name": "consumption", "data_type": "numeric"}, {"column_name": "input_source", "data_type": "USER-DEFINED"},
           {"column_name": "raw_payload", "data_type": "jsonb"}, {"column_name": "recorded_by", "data_type": "uuid"},
           {"column_name": "created_at", "data_type": "timestamp with time zone"}]}
]
```

Negative probes recorded honestly (they SHAPE the D1 fork): `select source_type … from carbon.reading` → **42703 column "source_type" does not exist** (the enum lives on `carbon.meter.source`, not the reading); `select id::text, name, source_type from carbon.meter` → **42703 column "name" does not exist** (the column is `meter_name`). Key consequence: `carbon.reading` carries **no department/activity dimension** — the master's Department×ActivityType has no existing home, which is exactly WO §4's D1 fork.

### WO-pinned values

- ONE migration `supabase/migrations/20261125000000_backfill_002_carbon.sql` (filename pinned at WO §4.5; the prefix is the lane label — a calendar-day divergence is a recorded deviation, never a silent rename).
- Live baseline pin: `carbon.reading` 907 / 2024-01-09 / 2026-07-04 — preflight STOP-on-drift.
- Data-row census (CSV truth binds): basedata 2,944 / energy 126 / waterin 56 / gas 6 / fuel 22 / paper 33 / ink 14 / chlorine 12 / wastemoney 27 / query 1,026 (EXCLUDED) / formresp 2.
- Battery: guard 344/344, validate-registry ok:true (claims 54→55), programmatic claim-by-claim JSON-diff = exactly 1 new claim, 54 byte-identical, `git diff --check` clean.

### D1 procedure (binding, BEFORE D2)

Jev consult FIRST (encode options in the question text — the options param is contract-ignored, P1.2 precedent); contract-degenerate → GLM-coordinator decision under the owner's standing delegation (P1.2 precedent); Terra optional. Receipts (`/tmp` + VERBATIM embed here) for: the A/B/C fork, the master dedup key, the per-tab mapping (incl. chlorine → chemical vs carbon), the per-fragment genuinely-new decisions (WO §6), and the ONE-migration shape. No receipt = no decision.

---

## Appendix A — verification sibling verdict (VERBATIM)

> Verification complete — raw saved to `/tmp/env-carbonf-2026-11-24/` (htmlview.html + 11 gviz CSVs, read-only, no login).
>
> **File:** "carbon footprint" (owner label "CarbonF งานที่สำเริง") — 11 tabs:
>
> | tab | rows×cols | maps to |
> |---|---|---|
> | `query` | 1026×25 | **KNOWN** = AppSheet `ข้อมูลคุณภาพน้ำ` (doc 12 §3.3): headers verbatim (TDS-1/2, DO-1/2/3, pH, SV30, Free Chlorine…), พ.ศ. dates (2567–2568); formula col `คลอรีนน้ำที่ใช้จริง` confirmed (ArrayFormula SWITCH 1:2/1:4/1:9 in doc 12:767) |
> | `ฐานข้อมูล Carbon Footprint รพ.อุทัย` | 2944×7 | master carbon dataset 2018–2025 (ค.ศ.), Department×ActivityType (23×26 distinct)×Value×Unit×ค่าใช้จ่าย → shape of `carbon.reading` |
> | `energy` | 126×14 | electricity kWh+บาท, computed ราคาต่อหน่วย + regional monthly block → `carbon.reading` source_type=electricity |
> | `waterin` | 56×6 | water ลบ.ม.+บาท, computed Avg/unit & Energy_usage(Cal) → water_supply/carbon |
> | `การใช้ก๊าซหุงต้ม` | 6×4 | LPG กิโล → source_type=lpg |
> | `การใช้น้ำมัน` | 22×4 | ดีเซล/เบนซิน ลิตร → source_type=diesel/gasoline |
> | `กระดาษ` | 33×4 | A4 reams → carbon "other"/paper factor |
> | `หมึก` | 14×6 | ink cartridges w/ model+brand+สถานที่ (masked) |
> | `คลอรีน` | 12×4 | chlorine ลิตร by สถานที่ใช้ → chemical domain |
> | `สำเนาของ เงินขายขยะ` | 27×8 | waste-sale money ledger, rolling balance ยอดรวมเหลือ |
> | `การตอบแบบฟอร์ม` | 2×261 | Google Form responses (2024): TGO carbon form — refrigerants, anesthetic gases, pesticides, fertilizers, wastewater blocks, solar |
>
> **Mapping:** ENV live schema has `carbon.reading` (907), `carbon.meter`, `carbon.emission_factor` (12), `source_type` enum = electricity/diesel/gasoline/lpg/**other** only; frontend has CarbonPage/CarbonRollupPage/SustainabilityPage; `fuel.dispense_log`, `garbage.collection_log`, `chemical.master/movement` exist but are **empty (0 rows)**. AppSheet doc 12 (37 tables) is water/sanitation/safety only — no carbon tables; only `query` matches it.
>
> **Verdict:**
> 1. `query` → **KNOWN-table** (AppSheet `ข้อมูลคุณภาพน้ำ` — already migrated, 907 rows in `wastewater.reading`).
> 2. energy/waterin/gas/fuel/paper (+chlorine via chemical) → **NEW-data-for-existing-table**: fits `carbon.reading`+`emission_factor` via source_type, though 20+ activity types collapse into "other"; also `การตอบแบบฟอร์ม`'s 261 columns reveal ~150 future TGO categories beyond the enum.
> 3. `เงินขายขยะ` ledger, `หมึก` cartridge detail, and the form-response template → **GENUINELY-NEW** fragments (no revenue/asset-attribute surface in schema).
>
> **Date formats:** mixed — `query` พ.ศ. (2567/2568); all others ค.ศ. (d/m/yyyy). **Computed columns:** basedata.ค่าใช้จ่าย, energy.ราคาต่อหน่วย, waterin.Avg/unit+Energy_usage(Cal), query.คลอรีนน้ำที่ใช้จริง, wastemoney.ยอดรวมเหลือ. XLSX export not needed (gviz covered all tabs).

Reconciliation note (this lane, not the sibling's): the verdict's `rows×cols` figures are **data-row counts** — re-censused programmatically from the raw CSVs at transition time (csv.reader, header excluded, empty-lines dropped): basedata 2,944 / energy 126 / waterin 56 / gas 6 / fuel 22 / paper 33 / ink 14 / chlorine 12 / wastemoney 27 / query 1,026 / formresp 2 — the verdict numbers and the census AGREE exactly (no BACKFILL-001-style physical-line divergence in this batch).

## Appendix B — evidence inventory (sha256, /tmp stays tmp-only)

| file | bytes | sha256 (first 12) |
|---|---|---|
| basedata.csv | 621,746 | `6d8e00e1d904` |
| energy.csv | 12,576 | `bc06b0a02366` |
| waterin.csv | 4,496 | `16bee9a154ca` |
| gas.csv | 253 | `083524c1a684` |
| fuel.csv | 1,152 | `96c0da7ecadb` |
| paper.csv | 897 | `27bfb8cfed8f` |
| ink.csv | 2,022 | `797c8b4ff4e1` |
| chlorine.csv | 739 | `3981083910be` |
| wastemoney.csv | 1,942 | `f145e89674fe` |
| query.csv | 130,903 | `c948108f1620` |
| formresp.csv | 17,573 | `9eb1b7d9fad0` |
| htmlview.html | 76,669 | (menu evidence) |

The raw CSVs/HTML stay in `/tmp` only — never committed (real operational data); counts, shapes, and sha256s are what attach here. PII/identifying strings (หมึก สถานที่ values and any personal-looking strings) stay masked in every receipt.

## Next (post-merge, in order)

1. Create `_worktrees/env-backfill-002` off the transition merge SHA, branch `feat/env-backfill-002` (or the docs/ transition naming if the lane stays docs-bound — implementation code goes on a feat branch per house convention).
2. D1 consult (WO §4) with receipts → D2 RED (`scripts/test_parity_backfill_002.py`, truthful, canary held) → D3 ONE migration via `scripts/apply_migration_api.py` (ENV_DB gate, preflight STOP-on-drift at 907/2024-01-09/2026-07-04, guarded idempotent, before→after reconciliation) → D4 battery (WO §8.3) → D5 fresh-GLM review at exact head. Implementer never merges. **STOP at REVIEW_REQUESTED.**
3. NO BUMP — v1.15.1 stays.
