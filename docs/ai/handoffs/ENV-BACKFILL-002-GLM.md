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

---

## D1 — CONSULT RECORD + DECISIONS (2026-11-24, implementation lane)

### Jev consult receipts (jev-1.13.0 via typesafe; 5 calls; raw JSON verbatim also at /tmp/kilo/jev_d1_002/)

Q1 — the A/B/C enum fork (task_classification, choice, risk=high; options encoded in the question text per the P1.2 precedent):

```json
{"ok": true, "provider": "typesafe", "model": "jev-1.13.0", "family": "task_classification", "primitive": "choice", "answer": "feature", "confidence": 0.37, "probabilities": {"bugfix": 0.29, "feature": 0.53, "docs": 0.0, "review": 0.18}, "input_usage": 777, "output_usage": 46, "latency_ms": 368.6143755912781, "error": null, "authoritative_for_action": false, "advisory_notice": "ADVISORY ONLY. Escalate to frontier reasoning on any error, low confidence, or high risk. Never use as mutation/review authority."}
```

Q2 — the merge/dedup shape (M merge-sum+breakdown / D drop / X defer):

```json
{"ok": true, "provider": "typesafe", "model": "jev-1.13.0", "family": "task_classification", "primitive": "choice", "answer": "feature", "confidence": 0.63, "probabilities": {"bugfix": 0.09, "feature": 0.72, "docs": 0.0, "review": 0.19}, "input_usage": 733, "output_usage": 46, "latency_ms": 286.98246726989746, "error": null, "authoritative_for_action": false, "advisory_notice": "ADVISORY ONLY. Escalate to frontier reasoning on any error, low confidence, or high risk. Never use as mutation/review authority."}
```

Q3 — evidence_relevance for the energy-tab disambiguation (primitive contract-coerced to `noul`):

```json
{"ok": true, "provider": "typesafe", "model": "jev-1.13.0", "family": "evidence_relevance", "primitive": "noul", "answer": 0.77, "confidence": null, "probabilities": null, "input_usage": 637, "output_usage": 20, "latency_ms": 330.7775827124715, "error": null, "authoritative_for_action": false, "advisory_notice": "ADVISORY ONLY. Escalate to frontier reasoning on any error, low confidence, or high risk. Never use as mutation/review authority."}
```

Q4 — chlorine domain (CAR vs CHE):

```json
{"ok": true, "provider": "typesafe", "model": "jev-1.13.0", "family": "task_classification", "primitive": "choice", "answer": "feature", "confidence": 0.55, "probabilities": {"bugfix": 0.0, "feature": 0.66, "docs": 0.0, "review": 0.34}, "input_usage": 629, "output_usage": 46, "latency_ms": 324.010648727417, "error": null, "authoritative_for_action": false, "advisory_notice": "ADVISORY ONLY. Escalate to frontier reasoning on any error, low confidence, or high risk. Never use as mutation/review authority."}
```

Q5 — the two genuinely-new fragments (LEDGER*/INK*):

```json
{"ok": true, "provider": "typesafe", "model": "jev-1.13.0", "family": "task_classification", "primitive": "choice", "answer": "feature", "confidence": 0.64, "probabilities": {"bugfix": 0.0, "feature": 0.73, "docs": 0.01, "review": 0.26}, "input_usage": 741, "output_usage": 46, "latency_ms": 343.71563386917114, "error": null, "authoritative_for_action": false, "advisory_notice": "ADVISORY ONLY. Escalate to frontier reasoning on any error, low confidence, or high risk. Never use as mutation/review authority."}
```

**Contract-degeneracy finding:** every consult returned the provider's own fixed class space (`feature`/`bugfix`/`docs`/`review`) or a bare relevance score — the legend options were NOT reflected in any answer space (the P1.2 options-ignored behavior), confidences 0.37–0.64, Q1 explicitly LOW. **The consult is contract-degenerate on the actual choices** → per the WO's binding procedure and the owner's standing delegation, the GLM coordinator decides with written rationale. Q3's `noul` score 0.77 is retained as a weak corroborating vote that the energy-tab evidence IS relevant.

### D1 decisions (GLM, receipt- and evidence-backed)

1. **Enum fork → (B).** Keep the 5-value `source_type` enum; additive nullable `carbon.reading.activity_subtype` (text); one meter per activity series (26 new); quantity stored in `meter_value` with `consumption NULL` for every non-grid-electric series; ONLY the grid-electricity series (การใช้ไฟฟ้าส่วนภูมิภาค, 121 monthly rows) stores `consumption`. Rationale: (a) additive-first — `ALTER TYPE ... ADD VALUE` churn is exactly the fragile path the WO flags, and A buys nothing numerically; (b) the DECISIVE evidence: `carbon.v_unified_co2e` arm-1 applies the ELECTRICITY factor (0.4999) to **every** `carbon.reading` row's `consumption` regardless of meter, and `carbon.v_overview_carbon` sums **all** consumption as kWh — so ANY non-kWh quantity in `consumption` corrupts both delivered rollups no matter which enum value the meter carries; NULL consumption makes non-electric rows invisible to both (verified post-apply). C's reference table adds indirection without per-row fidelity. (c) subtype + raw_payload keep the sheet's 26-activity vocabulary verbatim.
2. **Dedup key → `(meter_id, reading_date)`** — the existing UNIQUE constraint is the key; every seed is `INSERT ... SELECT ... WHERE NOT EXISTS` on exactly that pair; re-run ⇒ 0 rows (proven twice, below). **The WO's master-vs-live overlap resolved by evidence:** the live 907 = DAILY cumulative-register readings of the บ่อบำบัด plant submeter (~5 kWh/day; 722 distinct dates in the overlap window, exactly one per date), while the master's electricity = MONTHLY hospital-wide regional grid bills (~42k–81k kWh/month) — same domain+period, NOT the same measurement (~4 orders of magnitude apart). Both series are kept under separate meter identities; the live 907 rows are byte-untouched (plant-meter count 907 before == after; min/max 2024-01-09/2026-07-04 unchanged).
3. **Multi-row (series,date) groups → merge-sum (Q2's M shape).** The sheet logs waste per department (up to 10 rows/date; 405 multi-row groups; ขยะทั่วไป 2,271 rows over 389 dates), and `UNIQUE(meter_id, reading_date)` makes per-department rows physically impossible without forbidden DDL. Pin: one reading per (meter,date), `meter_value` = arithmetic SUM of the sheet's own same-date rows, full per-row breakdown verbatim in `raw_payload.breakdown` marked `merged_sum`/`rows_merged`. Cost columns are never summed into a computed total unless all rows carry costs (`cost_thb_merged`), else stored per-row (`cost_thb_per_row`).
4. **Electricity version-conflicts → energy-tab-matching rows (Q3 REL, score 0.77).** 5 dates carry a big monthly bill (42k–81k kWh, ~4.3 ฿/unit) + a small companion (237–378 kWh, ~5.4–5.7 ฿/unit). The dedicated energy tab's 126 dates agree with the big rows everywhere incl. exactly those 5 → the big row is the reading; the 5 small companions are preserved verbatim in `raw_payload.companion_rows` with `recorded_not_aggregated: true` (never dropped, never summed).
5. **Chlorine → CARBON (Q4 CAR).** 12 rows → a chlorine series meter (`source='other'`, subtype = usage place in breakdown, `consumption NULL`). `chemical.master/movement` implement inventory-balance semantics (NOT NULL balances, lots) that would fabricate stock structure from consumption records; the carbon domain already owns a chlorine production factor. Chlorine tab verified 12/12 exact-subset of master → seeds 0 new rows; master's 6 merged pairs preserve the สถานที่ใช้ split in breakdown.
6. **Fragments → LEDGER + INKREAD (Q5).** (i) `carbon.waste_sale_ledger` NEW minimal table — 27 rows verbatim: `balance_recorded` stored as-written (never recomputed; seq 27 carries the sheet's own 8,295; seq 11 keeps the negative −730), blank → NULL, undated rows NULL date, the `21/01/2025` anomaly stored as written (recorded, never corrected); **4 notes masked to NULL** (seqs 10, 21, 22, 23 — each contains a personal-name reference; monetary columns untouched). (ii) Ink cartridges mapped INTO `carbon.reading` (ink meter, unit ตลับ): master's 2025-06-05 pair (ตลับ+typo ตลัับ, normalized unit recorded verbatim in payload) covers the tab's same-day pair (verified equal); tab adds 6 NEW dates (12 rows; two multi-row dates merged with model/brand/ink-type breakdown); the **สถานที่ column is omitted from storage entirely** (PII-safe). (iii) TGO form responses → deferred (no honest surface; FORWARD-INTEL note added to `docs/ai/APPSHEET-PARITY-PLAN.md` §9 as the ONLY inventory record; ~150 categories NOT built — hard cap honored).
7. **Per-tab mappings (zero-double-count evidence):** energy main block = exact date-subset of master electricity (126/126 dates; 5 version-conflicts above; regional monthly summary block in the tab ≡ master 2023 12/12 exact — derived summary, never seeded) → 0 new; gas 6/6, fuel ดีเซล 18/18 + เบนซิน 4/4, paper A4 22/22 + A5 11/11, chlorine 12/12 exact subsets → 0 new each; waterin ประปาส่วนภูมิภาค → +7 (2026-01..07, beyond master) at exact-date rule; waterin บาดาล → period-level prefer-master (the tab's month-end dates duplicate master mid-month readings 14/18 value-identical; Dec-2025 diverges: master 788 @14/12 kept, tab 1060 @31/12 skipped and recorded) → +4 (2024-06..09 only). `query` tab EXCLUDED per WO §7 — `wastewater.reading` 907 untouched.

## D2 — RED record (2026-11-24, at head `313a8af`, batch NOT sent)

`scripts/test_parity_backfill_002.py` (NEW read-only live contract suite, house gate per BACKFILL-001):

- **RED pre-apply: 23 failed / 18 passed** — EnvGate + all 7 baseline canaries (wastewater 907, plant meter identity/907/range, EF 12, chemical/fuel/garbage 0, query-tab exclusion) + 4 static migration-file contracts GREEN; the whole target group truthfully RED on the un-applied schema (the canary proves the batch was never sent pre-apply).
- **GREEN post-apply: 41 passed / 0 failed** (full list: subtype column, 27 meters exact, total 1,961, provenance 1,054, all manual input_source, UNIQUE dedup key, per-meter counts, sub-tab zero-leak, merged 402 w/ breakdown consistency, 5 version conflicts, consumption discipline 121, meter_value discipline, v_monthly_co2e electricity-only totals, no CO2e for non-electric, pre-2023 no-factor, date-era pins per meter, blanks-NULL, ink-place absence, ledger 27/balances/masks/anomaly, TGO absence, idempotency provenance pin).
- Suite repairs between RED and GREEN were transport/assertion-style only (select-side casts in the migration; numeric-string comparisons; merged-total 400→402 expectation incl. 2 ink-tab merges; v_monthly_co2e filtered to consumption-bearing rows; ledger mask widened 3→4 notes). All 41 contracts above are from the final file; the RED record binds at `313a8af` (file hashes in git history).

## D3 — apply + verify receipts (2026-11-24)

- **Preflight STOP-on-drift: PASS** (`scripts/backfill_002_preflight.py`; receipt `/tmp/kilo/backfill_002_preflight.json`) — live `carbon.reading` 907 / min 2024-01-09 / max 2026-07-04, meters 1, EF 12, chemical.movement/fuel.dispense_log/garbage.collection_log 0, wastewater.reading 907, subtype column absent.
- **Apply 1: 33/76 OK, 43 FAIL** — the Management-API query endpoint resolves mixed `NULL`/`::numeric` VALUES columns as text (42804). In-flight state after apply 1: subtype column + 26 meters + ledger DDL/rows landed; 0 reading rows. Guarded-idempotent recovery per the apply script's documented contract.
- **Apply 2 (repair `6476ce0`): 76/76 OK** — select-side casts (`s.v::numeric, s.c::numeric, s.p::jsonb`). Readings 907 → 1,961.
- **Idempotency PROVEN twice:** (a) immediate re-run hit endpoint throttling mid-run (ThrottlerException — throttled statements simply don't execute; counts verified stable post-window); (b) full paced re-run: **76 OK / 0 FAIL with zero count deltas** (1,961 / 1,054 / 27).
- **One out-of-band repair SQL (recorded):** `update carbon.waste_sale_ledger set note = null where entry_seq = 23 and note is not null and note like '%ชัย%' returning entry_seq` — the D1 mask rule was widened from `พี่ชัย` to any `ชัย` personal reference after the first apply revealed seq 23's note carries a personal-looking fragment with no operational vocabulary; the regenerated migration masks it correctly for fresh environments, and this UPDATE reconciled the already-applied row. No other out-of-band SQL.
- **Count reconciliation (before → after):** `carbon.reading` 907→1,961 (+1,054) · `carbon.meter` 1→27 (+26) · `carbon.waste_sale_ledger` 0→27 (+27) · `carbon.emission_factor` 12→12 · `wastewater.reading` 907→907 · `chemical.movement` 0→0 · `fuel.dispense_log` 0→0 · `garbage.collection_log` 0→0. Full per-meter table + 11 honesty invariants: `/tmp/kilo/backfill_002_reconciliation.md` — **ALL INVARIANTS HOLD** (UNIQUE dedup key 1,961 pairs; consumption 121 grid-only; merged 402; 5 conflicts recorded; no CO2e for non-electric; pre-2023 grid rows honestly excluded from `v_reading_co2e` by the inner lateral join; v_monthly_co2e totals electricity-only; ledger balances as-written; 0 personal-name notes; 0 ink-place values).
- **Live-corpus integrity:** plant-meter rows 907 before == after; min/max unchanged; `input_source` all-manual everywhere; the WO §3 overlap is resolved as distinct-series (D1 decision 2) — nothing merged into the live rows, nothing dropped from the master.

## D4 — battery (2026-11-24, at final head)

| gate | result |
|---|---|
| contract suite (`test_parity_backfill_002.py`) | **41/41 GREEN** |
| idempotency re-run | 76 OK / 0 FAIL, zero deltas |
| vitest FULL | **998 passed / 1 skipped** (designed skipIf; after copying the gitignored `frontend/.env` into the worktree — first run without it: 7 suites failed to collect, environmental, not code) |
| `tsc -b` | clean |
| oxlint | 0 errors (pre-existing warnings only, none in changed files) |
| Playwright FULL w=1 | **336/336** (7.7 min) |
| guard | **344/344** (+450 subtests) |
| runtime | **62/62** (+32 subtests) |
| release checker | **OK (v1.15.1; CHANGELOG entry v1.15.1)** — NO BUMP honored |
| `git diff --check` | clean |
| PII/token greps over all changed files | 0 hits (the suite's own negative-assertion literals `พี่ชัย`/`ห้องควบคุมโรคติดต่อ` are absence checks, not data; the 14-digit migration filename matches a bare `[0-9]{13}` probe — filename, not a personal number) |
| diff ⊆ claimed files | migration + 2 new scripts + WO + handoff + plan doc §9 note — nothing else; `frontend/` zero diff, `CURRENT-WORK.md` untouched (registry closeout is the next lane's job), CHANGELOG/package.json untouched |

**STOP at REVIEW_REQUESTED.** The implementer never merges. D5 fresh-GLM independent review at the exact frozen head next.
