# Work Order — ENV-PARITY-P1-002 (C1, gen 1)

**Lane:** AppSheet parity program Phase 1, lane P1.2 — equipment-spec
configuration system (effective-dated `core.equipment_spec`) + SQL views
สายมิเตอร์ (meter chain: LAG เมื่อวาน/สูบ 1-2, delta ไฟ, คำนวณสูบ
spec-driven, AVG 4 วัน, คลอรีนน้ำที่ใช้จริง) with the honest-correction
rules (delta≤0 → NULL + boundary flag; never global-MAX; never 0).
**Status:** PROPOSED — CLAIMED (this docs-only transition binds the lane;
implementation ships in a separate PR after this transition merges).
**Routing:** Track-Z (GLM lane — SQL migration, table/enum/seeds, view
logic, tests, battery). No Track F work exists in this lane (DB only, no
visual surface; the admin UI for spec edits is explicitly deferred to the
P1.4 form-parity/admin lane or a later owner decision).
**Plan reference:** `docs/ai/APPSHEET-PARITY-PLAN.md` §6 Phase 1 lane table
row P1.2 (owner-authorized 2026-11-14; 15-พ.ย. amendment recorded in commit
`fb57369`), verbatim:

> | P1.2 | SQL views สายมิเตอร์ (LAG เมื่อวาน/สูบ1-2, delta ไฟ, คำนวณสูบ ×34/×12, AVG 4 วัน, chlorine streak) — กฎ delta≤0→ค่าว่าง · **อัปเดต 15 พ.ย. 2569:** เจ้าของยืนยัน ×34/×12 = **อัตราสูบต่อ 1 ชม. จากสเปกปั๊ม** (HP/ขนาดท่อ ฯลฯ) และหากซ่อม/เปลี่ยนปั๊มตัวเลขอาจไม่เท่าเดิม → ไม่ฝังค่าคงที่ใน SQL — ต้องเป็น **config จากระบบ spec อุปกรณ์** (lane spec อุปกรณ์ใช้ร่วมอาจมาก่อนหรือยุบรวมใน lane นี้ ตามที่ปรึกษาออกแบบ) | `wastewater.v_reading_*` |

Supporting spec rows: plan §4.1 meter-chain computation rows (เลขมิเตอร์เมื่อวาน
DIVERGE → LAG; delta ไฟ AS-IS; last_meter_สูบ1/2 + คำนวณสูบ ×34/×12 AS-IS with
config-not-literal; ปริมาณน้ำเสียที่เข้าระบบบำบัด DIVERGE → numeric, never
text) and the plan's 15-พ.ย. note ("ค่าคงที่ ×34/×12 และ ×3.7 … ข้อกำหนดใหม่คือ
**ระบบ config spec อุปกรณ์/เครื่องมือ** … lane spec อุปกรณ์ใช้ร่วมอาจทำก่อน
P1.2 หรือยุบรวมเข้า P1.2 ตามที่ปรึกษาออกแบบ").
**Definition reference (read-only):**
`docs/ai/digital-twin/12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md` — the
meter-chain formulas quoted verbatim in §2 below BIND; none invented.
**Process reference (read-only):**
`docs/ai/digital-twin/11-UTHAI-ACTIVATED-SLUDGE-PROCESS-KNOWLEDGE.md` (the
durable user-confirmed process-topology reference; the pumps/meters here are
its instrumented boundaries).

## 1. Authorization basis (record)

1. **Owner standing Goal-mode instruction 2026-11-15** — "ต่อยาวๆ ตามแผนและ
   roadmap ที่วางไว้" (continue along the laid plan and roadmap).
2. **Owner parity authorization 2026-11-14** — "วางแผนทำให้ระบบมีรูปแบบการกรอกข้อมูล,
   การคำนวณข้อมูลเหมือน appsheet … จนกว่าโปรแกรม ENV จะใช้ทดแทนได้ทั้งหมด"
   → produced `docs/ai/APPSHEET-PARITY-PLAN.md`.
3. **Owner gate answers A1–A3, 2026-11-15** (receipt block plan §5.3,
   recorded in repo by commit `fb57369` — verbatim rows quoted in §2.1).
   These answers UN-GATE the P1.2 constants: ×34/×12 and ×3.7 are confirmed
   as equipment specs and become CONFIG from an equipment-spec system
   (removing the §8 risk-row-3 owner-gate that had parked P1.2 at the P1.3
   closeout), and ÷10 (1:9) is confirmed for the groundwater system.
4. **Plan §6 Phase 1 row P1.2** (verbatim, quoted in the header) + plan §4.1
   meter-chain dispositions.
5. **D1 delegated design consult 2026-11-15** — Jev + Terra per the house
   delegation pattern; binding decision recorded in §2.3 with receipts
   verbatim in the handoff D1 section (Terra UNAVAILABLE — usage limit until
   2026-11-20; Jev contract-degenerate on the choice questions; decided by
   the GLM coordinator per the owner standing delegation; Jev's one
   semantically resolvable signal — Q5 `CODE_FAILURE` @ confidence 1.0 —
   makes the meter-reset guard a code-level requirement).

The AUTHORIZATION BASIS is an explicit adversarial check item for the claim
transition review and the D5 implementation review — insufficient basis
parks the claim unmerged.

**In-lane folding note (BY DESIGN, per the plan's own wording):** the plan
row allows the equipment-spec sub-lane "มาก่อนหรือยุบรวมใน lane นี้" (before
P1.2 or folded into it, per the design consultant). This lane FOLDS it in:
one effective-dated table + seeds + the meter-chain views that consume it,
in one migration. No separate spec-system lane is opened.

## 2. Pinned ground truth (VERBATIM — these BIND)

### 2.1 Owner answers A1–A3 (verbatim from plan §5.3 receipt block)

| # | หัวข้อ | คำตอบเจ้าของ (15 พ.ย. 2569) | นัยต่อแผน |
|---|---|---|---|
| A1 | ×34/×12 (คำนวณสูบ 1/2) | เป็น **อัตราการสูบต่อ 1 ชม. ของปั๊ม** คำนวณจากสเปกปั๊ม (กำลัง HP, ขนาดท่อ และปัจจัยที่เกี่ยวข้อง; เก็บโดยจับเวลาจริงต่อ 1 ชม. การทำงาน) — หน้างานใช้ **hour meter** (ชั่วโมง/วันต่อปั๊ม) · **ข้อกำหนดใหม่:** ต้องมีระบบตั้งค่าสเปกปั๊ม เพราะเมื่อซ่อม/เปลี่ยนปั๊มในอนาคต "ตัวเลขการสูบต่อ 1 ชม. อาจไม่เท่าเดิม" | ×34/×12 = ค่าปัจจุบันที่เจ้าของยืนยัน → config จากระบบ spec อุปกรณ์ (P1.2 อัปเดตตาม) |
| A2 | ×3.7 + Water_In (ประปาบาดาล) | เช่นเดียวกัน — พลังงาน/การไหลคำนวณจาก **สเปกเครื่องมือ/อุปกรณ์** ต้องมีระบบข้อมูล spec เครื่องมือ (อัตราการไหล + การกินไฟต่อ 1 ชม.); ค่าที่ผู้ใช้กรอกคือ **จำนวนชั่วโมงปั๊มทำงาน** | P1.5 อัปเดต: ×3.7 เป็นค่าเริ่มต้นจาก spec → config ระบบเดียวกับ P1.2 |
| A3 | ÷10 (Chlorine usage ประปา) | **ยังใช้อยู่** — ระบบน้ำบาดาลผสมคลอรีน 10% : น้ำ = 1:9; hour meter ใช้ติดตามการใช้คลอรีนรายเดือน | ÷10 ยืนยันถูกต้อง 15 พ.ย. 2569 |

Consequences BINDING for this lane:

- The meter-chain views MUST NOT embed 34/12/3.7/÷10 as SQL literals. The
  pump volume factors resolve from `core.equipment_spec` AT the reading
  date (A1: "เมื่อซ่อม/เปลี่ยนปั๊มตัวเลขอาจไม่เท่าเดิม").
- The pump meter columns (`wastewater.reading.pump1_meter`/`pump2_meter`)
  are HOUR METERS (ชั่วโมง/วันต่อปั๊ม); the meter delta is HOURS, and
  สูบม³ = hours × spec-flow (m³/h) at that date.
- The ×3.7 energy spec and the 1:9 mix config serve the P1.5 water-supply
  lane via the same table; this lane seeds them so the spec system is the
  single config source (A2: "config ระบบเดียวกับ P1.2"), but P1.5's
  `water_supply.daily_check` schema/form work is NOT authorized here.

### 2.2 Meter-chain AppSheet formulas (verbatim, reference doc 12 — these BIND)

From `docs/ai/digital-twin/12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md`
(table `ข้อมูลคุณภาพน้ำ`):

```appsheet
#### คอลัมน์ `ปริมาณการใช้ไฟฟ้าของระบบ` (electric delta)
=IF([เลขมิเตอร์วันนี้]-[test_ดึงข้อมูลมิเตอร์วันก่อนหน้า]<= 0,"",[เลขมิเตอร์วันนี้]-[test_ดึงข้อมูลมิเตอร์วันก่อนหน้า])
  (Valid If: =[ปริมาณการใช้ไฟฟ้าของระบบ]>0 — "ตรวจสอบข้อมูลดีๆนะจ๊ะ")

#### คอลัมน์ `เลขมิเตอร์เมื่อวาน` (DOCUMENTED BUG — global MAX, not yesterday)
=MAX(SELECT(ข้อมูลคุณภาพน้ำ[เลขมิเตอร์วันนี้], TRUE))

#### คอลัมน์ `test_ดึงข้อมูลมิเตอร์วันก่อนหน้า`
=MAX(SELECT(ข้อมูลคุณภาพน้ำ[เลขมิเตอร์วันนี้], [วันที่ บันทึก] < [_THISROW].[วันที่ บันทึก]))

#### คอลัมน์ `last_meter_สูบ1`
=MAX(SELECT(ข้อมูลคุณภาพน้ำ[เลขมิเตอร์เครื่องสูบ 1], [วันที่ บันทึก] < [_THISROW].[วันที่ บันทึก]))

#### คอลัมน์ `last_meter_สูบ2`
=MAX(SELECT(ข้อมูลคุณภาพน้ำ[เลขมิเตอร์เครื่องสูบ 2], [วันที่ บันทึก] < [_THISROW].[วันที่ บันทึก]))

#### คอลัมน์ `คำนวณสูบ 1`
=([เลขมิเตอร์เครื่องสูบ 1]-[last_meter_สูบ1])*34

#### คอลัมน์ `คำนวณสูบ 2`
=([เลขมิเตอร์เครื่องสูบ 2]-[last_meter_สูบ2])*12

#### คอลัมน์ `ปริมาณน้ำเสียที่เข้าระบบบำบัด`
=if(SUM(LIST([คำนวณสูบ 1], [คำนวณสูบ 2]))<=0,"อย่าลืมใส่เลข มิเตอร์บ่อสูบนะจ๊ะ",
   (SUM(LIST([คำนวณสูบ 1], [คำนวณสูบ 2]))))

#### คอลัมน์ `AVG_Westwater`
=AVERAGE(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณน้ำเสียที่เข้าระบบบำบัด],
   AND([วันที่ บันทึก] >= ([_THISROW].[วันที่ บันทึก] - 3),
       [วันที่ บันทึก] <= ([_THISROW].[วันที่ บันทึก]))))

#### คอลัมน์ `คลอรีนน้ำที่ใช้จริง` (spreadsheet ArrayFormula, C26=คลอรีนน้ำ ที่ใช้, C38=อัตราส่วนผสม)
=ArrayFormula("คลอรีนน้ำที่ใช้จริง"{;IF(R2C38:R[763]C38="","",R2C26:R[763]C26 / SWITCH(R2C38:R[763]C38,"1:2",2,"1:4",4,"1:9",9,""))})
```

Honest corrections BINDING in the ENV translation (each traceable to a
verbatim fact above or a plan §4.1 disposition):

1. **เลขมิเตอร์เมื่อวาน / last_meter_* — LAG, never global MAX.** The
   AppSheet `MAX(SELECT(…))` forms are the documented bug: `TRUE` selects
   the WHOLE table (a later-edited or future row can be picked), and even
   the `< [_THISROW]` forms take MAX over values, not the date-nearest
   previous value. ENV: `LAG(<meter>) OVER (ORDER BY reading_date,
   created_at, id)` — deterministic, date-ordered, per meter column
   (plan §4.1 row "เลขมิเตอร์เมื่อวาน" is DIVERGE → LAG exactly for this).
   The first-ever reading has no previous → NULL.
2. **delta ≤ 0 → NULL + boundary flag — never 0, never negative volume.**
   The electric delta formula already encodes "≤0 → blank" in AppSheet
   itself; the pump formulas (×34/×12) do NOT — a meter reset/swap would
   produce a negative or wrong volume. Jev Q5 classifies silent
   mis-attribution here as `CODE_FAILURE` @ confidence 1.0 → the guard is
   mandatory in code for BOTH deltas: delta ≤ 0 (or a missing counterpart)
   → NULL + `meter_boundary_flag` TRUE (reason carried in a text column),
   never zero-filled, never negative. This is the unknown ≠ zero rule.
3. **Pump volume = spec-driven, never ×34/×12 literals** (A1). Hours ×
   flow-spec AT the reading date; missing meter, missing spec → NULL.
4. **ปริมาณน้ำเสียที่เข้าระบบบำบัด — numeric only** (plan §4.1 DIVERGE):
   the AppSheet text prompt "อย่าลืมใส่เลข มิเตอร์บ่อสูบนะจ๊ะ" is NEVER
   mirrored into SQL; missing pump data → NULL (the form-side reminder is
   P1.4). Sum of the two computed pump volumes only when both exist.
5. **AVG-4-day window** = AVERAGE over `reading_date BETWEEN D−3 AND D` of
   the DERIVED daily volume; AppSheet AVERAGE ignores blank days — missing
   days contribute nothing and are never filled with 0; no values in the
   window → NULL.
6. **คลอรีนน้ำที่ใช้จริง — verbatim formula wins** (P1.3 precedent:
   verbatim reference beats summary notes): `chlorine_used ÷ SWITCH(
   chlorine_mix_ratio, '1:2'→2, '1:4'→4, '1:9'→9)`; blank/unknown ratio or
   NULL value → NULL, never 0. NOTE recorded (not silently reconciled):
   A3's "÷10" binds the GROUNDWATER water-supply system (น้ำประปา
   Chlorine usage, 10% solution mixed 1:9 → pure-chlorine fraction 1/10)
   and lives in the `chlorine_mix_groundwater` spec row; the WASTEWATER
   production formula above divides by the ratio denominator (÷9 for 1:9).
   The wastewater column mirrors the verbatim production formula; if the
   owner later rules the wastewater column should also be ÷10, that is a
   reviewed follow-up (the AppSheet inconsistency is documented in the
   migration header + handoff D0, never silently "fixed").
7. **Existing views untouched:** `wastewater.v_reading_with_computed`
   keeps its current shape byte-identical. DISCOVERED quirk recorded, not
   fixed here: it computes `(pump2_meter - pump1_meter) AS
   energy_kwh_estimate` (a difference between the two PUMP hour meters —
   not an electric-meter delta; neither ×34/×12 nor a kWh chain). Fixing
   or removing it would change an existing frontend-consumed surface →
   recorded follow-up, needs its own reviewed decision.
8. **`Chlorine_StreakCount` (gaps-and-islands continuous streak,
   reference §3) is NOT in this lane's scope** — the transition
   instruction binds "chlorine streak views already exist from P1.3 — do
   not duplicate". Recorded honestly: P1.3 delivered the 2-day
   critical-flags view (`critical_free_chlorine_low/high`), which is a
   DIFFERENT computation from the continuous `Chlorine_StreakCount`
   (reference doc 12 line ~1421; the P1.3 WO had noted it as "P1.2
   scope"). This transition's instruction excludes it; it is recorded as
   a named follow-up in the handoff D0 so the gap is visible, NOT silently
   dropped and NOT silently added.

### 2.3 D1 binding design decision (2026-11-15)

Consults: Jev (jev-advisory MCP, jev-1.13.0) — contract admits only fixed
decision families, so the A/B/C choice legends were NOT resolvable
(Q1–Q4/Q6 degenerate; Q3 conf 0.51, Q4 conf 0.45 below the escalation
threshold); the ONE semantically resolvable signal: Q5 meter-reset risk →
`CODE_FAILURE` @ 1.0 (prevent in code: guard deltas + spec-validity joins).
Terra (Codex CLI read-only) — UNAVAILABLE: usage limit until 2026-11-20
(receipt, exit 1, zero consult output). Decision made by the GLM
coordinator under the owner standing delegation; receipts verbatim in the
handoff D1 section (`/tmp/jev-equip-d1-2026-11-15.json` + `.txt`,
`/tmp/terra-equip-d1-receipt-2026-11-15.txt`). Binding:

1. **Equipment-spec model = effective-dated history.** Append-only rows
   with `valid_from`/`valid_to`; every computation joins the spec BY THE
   READING DATE; edits append a new row (never overwrite) so historical
   recomputes stay historically correct after a pump swap/repair. The
   admin UI for spec edits is DEFERRED to the P1.4 form-parity/admin lane
   or later — this lane delivers the data model + seeds + views only.
   (Rejected alternative A: single overwrite-row config — would silently
   recompute history after the first pump change; rejected hybrid C-lite:
   no UI is built here, so the "hybrid" reduces to B + a deferred follow-up
   which is recorded.)
2. **Table shape = ONE table `core.equipment_spec`** (schema `core`, where
   `core.equipment` and `core.personnel` live — house location verified
   against `reports/schema-snapshot-live.md`), typed columns:
   - `id uuid` PK default `gen_random_uuid()`
   - `kind core.equipment_spec_kind` — NEW enum, values
     `pump_wastewater_1` | `pump_wastewater_2` | `pump_groundwater` |
     `chlorine_mix_groundwater` (house snake_case naming aligned with the
     `pump1_meter`/`pump2_meter` column convention and the A1/A2 subjects)
   - `flow_m3_per_h numeric NULL`
   - `energy_kwh_per_h numeric NULL`
   - `mix_part_chlorine numeric NULL`, `mix_part_water numeric NULL` —
     the 1:9 ratio stored as a TYPED PAIR (chosen over a `text` ratio or a
     precomputed factor: typed, checkable, and the derived pure-chlorine
     fraction `chlorine_part/(chlorine_part+water_part)` = 1/10 is
     COMPUTED in consumers, never stored, never parsed from a string)
   - `valid_from date NOT NULL`, `valid_to date NULL` (NULL = open-ended)
   - `note text NULL`, `source text NULL` (provenance — seeds carry
     "owner-confirmed 2026-11-15 (plan §5.3 A1–A3)")
   - CHECKs (kind-conditional, named):
     pump_wastewater_1/2 rows require `flow_m3_per_h NOT NULL`;
     pump_groundwater rows require `energy_kwh_per_h NOT NULL`;
     chlorine_mix_groundwater rows require both mix parts NOT NULL;
     every row has at least one spec value
     (`num_nonnulls(flow_m3_per_h, energy_kwh_per_h, mix_part_chlorine) >= 1`);
     positive-value CHECKs (`> 0`) on all spec columns — a zero/negative
     spec is not a spec (a 0 m³/h pump is broken equipment, not config)
   - `UNIQUE (kind, valid_from)` — double-seed guard + one row per start
     date; window overlap is prevented by the append convention + the view
     pick rule (latest `valid_from ≤ reading_date` wins); a `btree_gist`
     EXCLUDE-overlap constraint is recorded as OPTIONAL hardening
     follow-up, not required
   - NO FK to `core.equipment` in this lane (the enum kind is the identity;
     binding spec rows to `core.equipment` ids awaits the owner's equipment
     master reconciliation — recorded follow-up)
   - **RLS: `ENABLE ROW LEVEL SECURITY` with NO policies** on the new
     table (fail-closed: anon/authenticated denied; server-side migration
     owner + view execution unaffected — views run with owner rights; this
     matches the repo's deny-pending posture and the "RLS untouched" rule,
     which binds EXISTING objects). NO grants changes; existing RLS
     untouched everywhere.
3. **Seeds = 4 guarded rows** (`INSERT … SELECT … WHERE NOT EXISTS` on
   `(kind, valid_from)` — reference/config data, NOT user data; no
   `wastewater.reading` or any user row is touched):
   | kind | value |
   |---|---|
   | `pump_wastewater_1` | `flow_m3_per_h = 34` |
   | `pump_wastewater_2` | `flow_m3_per_h = 12` |
   | `pump_groundwater` | `energy_kwh_per_h = 3.7` |
   | `chlorine_mix_groundwater` | `mix_part_chlorine = 1`, `mix_part_water = 9` (1:9) |
   **`valid_from = DATE '2024-01-09'`** — the choice and its reasoning BIND:
   the D2/D3 preflight must re-verify live `MIN(reading_date) = 2024-01-09`
   and STOP if it moved. Alternative considered — pinning at the
   owner-confirmation date (2026-11-15) — REJECTED: computations join by
   reading date, so a late pin leaves all 907 historical rows with no
   resolvable spec (breaking parity recomputes for exactly the history the
   program exists to serve); the owner's A1/A2 confirm these are the
   CURRENT values of long-standing equipment, and no evidence of an earlier
   different spec exists. Honest labeling (not false precision) goes in the
   `note`/`source` text: specs predate the data horizon. NEVER
   `CURRENT_DATE` (non-deterministic on re-run).
4. **View = `wastewater.v_reading_meter_chain`** (ONE view, house naming
   `v_reading_*`; implements §2.2 corrections 1–6): per-reading
   `prev_pump1_meter`/`prev_pump2_meter`/`prev_electric_meter` (date-ordered
   LAG; deterministic tie-break `reading_date, created_at, id`), pump hour
   deltas + `pump1_m3`/`pump2_m3` via the spec-at-that-date (LATERAL pick:
   `valid_from <= reading_date AND (valid_to IS NULL OR valid_to >=
   reading_date) ORDER BY valid_from DESC LIMIT 1`; no spec → NULL, never a
   hardcoded fallback — the entire point of A1), `wastewater_in_derived`
   (sum when both pump volumes exist, else NULL — numeric only),
   `delta_kwh` (electric chain; see below) with delta ≤ 0 → NULL +
   `meter_boundary_flag` (+ `meter_boundary_reason` text),
   `chlorine_used_real` per the verbatim ÷SWITCH formula, and
   `avg_westwater_4d` window. Electric-meter source: the wastewater
   electric meter lives in `carbon.meter`/`carbon.reading` (linked from
   `wastewater.reading.carbon_reading_id`; live snapshot shows exactly ONE
   `carbon.meter` row) — the D2/D3 preflight MUST verify its identity
   read-only (meter_name/source evidence + the carbon_reading_id linkage
   rate) and record it; if identity cannot be established from live
   evidence, `delta_kwh` surfaces NULL with reason
   `'electric-meter-identity-unresolved'` — NEVER guessed. (plan §4.1 row
   125 requires exactly this identification.)
5. **Scope = DB only.** ONE migration (table + enum + seeds + view), ONE
   RED-first live test, docs. NO frontend, NO admin UI, NO form changes
   (P1.4), NO Edge Functions, NO CI. ENV_DB gate + preflight + apply per
   §3.3/§3.4 (the P1.3 pattern); rollback documented; existing views/RLS
   byte-identical.

## 3. Deliverables

### 3.1 Migration file — ONE file

`supabase/migrations/20261115140000_parity_p1_002.sql` (house timestamp
naming; sorts after `20261115130000_parity_p1_003.sql`; this exact name is
pinned here and in the claim `mutable_scope` — the P1.3 filename-drift P3
must not recur). Precedent verified: view definitions live INSIDE
migrations (`v_reading_with_computed` in
`20260718000000_p12_frontend_views.sql`) — no separate SQL-definition file.

Requirements:

- Header comment block: lane id, plan row, the §2.1 owner answers (A1–A3
  verbatim), the §2.2 verbatim formula quotes + the correction list (incl.
  the global-MAX bug note and the ÷9-vs-÷10 wastewater/groundwater note),
  the reference-data-vs-user-data distinction, rollback SQL (§3.4), the
  `valid_from` choice reasoning, and the electric-meter identity evidence
  found at preflight.
- `CREATE TYPE core.equipment_spec_kind AS ENUM (…4 values…)`;
  `CREATE TABLE core.equipment_spec` per §2.3 item 2 (all CHECKs named);
  `ALTER TABLE core.equipment_spec ENABLE ROW LEVEL SECURITY` (no policies).
- 4 guarded seed INSERTs per §2.3 item 3 (`WHERE NOT EXISTS` on
  `(kind, valid_from)`; provenance in `source`).
- `CREATE OR REPLACE VIEW wastewater.v_reading_meter_chain` per §2.3
  item 4 (plain CREATE VIEW, house convention — no GRANT changes, matching
  the existing wastewater views' exposure path).
- No RLS DDL on existing objects. No grant changes. No Edge Function
  changes. No frontend artifact. No trigger changes.

### 3.2 D2 RED-first meter-chain test

`scripts/test_parity_p1_002_meter_chain.py` (new) — Python unittest in the
house `scripts/test_*.py` style against ENV_DB via the same Management-API
access path as `scripts/apply_migration_api.py` (`scripts/_env.py`; token
from Drive secrets; NEVER printed). It must FAIL truthfully before the
migration is applied:

1. `core.equipment_spec_kind` enum, `core.equipment_spec` table (columns,
   named CHECKs, UNIQUE, RLS enabled) and the 4 seed rows exist with EXACT
   pinned values + `valid_from = 2024-01-09` + provenance source text.
2. `wastewater.v_reading_meter_chain` exists with the pinned name.
3. Semantics with transaction-scoped fixtures: inside ONE transaction,
   INSERT clearly-marked fixture rows (note marker `P1.002-FIXTURE`,
   `legacy_id` NULL) covering at minimum: spec date-join correctness
   (reading before `valid_from` → NULL spec; inside the window → the pinned
   value; a second spec row with a later `valid_from` takes over after its
   start date — append-never-overwrite proof); LAG-previous correctness
   (prev = the same meter's date-nearest PRIOR row, NOT the global max —
   construct out-of-order-insert data where MAX ≠ LAG); delta ≤ 0 → NULL +
   `meter_boundary_flag` TRUE (meter-reset case; never zero, never
   negative); missing counterpart/meter → NULL; `wastewater_in_derived`
   NULL when either pump volume is missing (never the AppSheet text);
   `avg_westwater_4d` ignores missing days (calendar gap case) and is NULL
   over an empty window; `chlorine_used_real` ÷2/÷4/÷9 per ratio with NULL
   on unknown ratio — then ROLLBACK with pre/post row-count proof of zero
   durable writes on every touched table (`wastewater.reading`,
   `core.equipment_spec`).
4. Regression guards: `v_reading_with_computed` keeps its
   `energy_kwh_estimate` expression (quirk documented, untouched); the P1.3
   critical-flags surface still resolves (one pinned column existence
   check); no new grants on existing objects.

Run GREEN in D4 after apply.

### 3.3 Preflight before apply (receipts into the handoff)

1. **ENV_DB gate** — same as WO P1.003 §3.3: `PROJECT_REF
   gllqtbyofrcjzmbnfoeh` hardcoded in `scripts/apply_migration_api.py`;
   identifying artifact recorded (`wastewater.reading` = 907 rows,
   `core.personnel` = 9, matching `reports/schema-snapshot-live.md`).
2. **History-bound `valid_from` evidence:** read-only
   `SELECT MIN(reading_date) FROM wastewater.reading` — must equal
   `2024-01-09`; on drift STOP and report (do not improvise a new date).
3. **Electric-meter identity evidence:** read-only query of
   `carbon.meter` (expect 1 row) — record id/meter_name/source/unit and
   the count+date-range of its `carbon.reading` rows and the
   `carbon_reading_id` linkage rate on `wastewater.reading`; the pinned
   delta_kwh wiring follows this evidence; unresolved identity → the NULL
   + reason design (§2.3 item 4), never guessed.
4. **Name-collision check:** no existing `equipment_spec*` object in
   `core`, no existing `v_reading_meter_chain` in `wastewater`, enum name
   free.
5. **Reference-data-only grep:** the migration contains
   `CREATE TYPE/TABLE/VIEW` + guarded `INSERT … SELECT … WHERE NOT EXISTS`
   + one `ENABLE ROW LEVEL SECURITY` on the NEW table only — grep for
   `UPDATE|DELETE|TRUNCATE|DROP TABLE|GRANT|POLICY` against EXISTING
   objects: expected none; anything else STOP and report.

### 3.4 Apply + rollback

- Apply to ENV_DB (`gllqtbyofrcjzmbnfoeh`, ap-southeast-1) ONLY via
  `uv run python scripts/apply_migration_api.py
  supabase/migrations/20261115140000_parity_p1_002.sql`; record the
  statement-by-statement receipt verbatim in the handoff.
- Rollback SQL (documented in the migration header AND the handoff):
  `DROP VIEW IF EXISTS wastewater.v_reading_meter_chain`; `DELETE FROM
  core.equipment_spec WHERE (kind, valid_from) IN (<the 4 exact pinned
  pairs>)`; `DROP TABLE IF EXISTS core.equipment_spec`; `DROP TYPE IF
  EXISTS core.equipment_spec_kind`. No other object is touched; nothing to
  restore byte-exactly (fully additive lane).

### 3.5 WO/handoff/frontier docs

- This WO + `docs/ai/handoffs/ENV-PARITY-P1-002-GLM.md` (D0 + D1 authored
  at claim time, D1 receipts embedded verbatim; D-phase logs D2+ are
  appended by the implementing lane; nothing before D2 is rewritten later).
- `docs/ai/CURRENT-WORK.md`: registry fence re-pin + new claim + frontier
  bullet (done in the claim transition itself; later status updates follow
  the closeout convention).

## 4. Execution routing (D-plan)

- **D2 RED**: author `scripts/test_parity_p1_002_meter_chain.py`; run
  against the live DB BEFORE applying the migration; record the truthful
  failure output (missing table/seeds/view) in the handoff.
- **D3**: author the migration; run the §3.3 preflight; record receipts;
  apply via `scripts/apply_migration_api.py`; re-run the test GREEN
  (RED items + fixture semantics).
- **D4 battery** at the frozen implementation head (all must pass; record
  outputs): FULL vitest suite, `tsc -b`, lint, Playwright FULL (workers=1),
  guard `344/344`, runtime battery `62/62`, the new meter-chain test GREEN,
  `git diff --check` clean. **No version bump** — record the reasoning (DB
  config + views only; no user-facing UI surface is added or changed — the
  new view has no frontend consumer in this lane; CHANGELOG criteria
  require no release entry).
- **D5**: fresh-GLM independent review at the exact frozen head
  (independently re-executed battery where possible). Terra is
  cross-model-eligible per precedent — NOTE recorded at claim time: Terra
  is usage-limited until 2026-11-20 (D1 receipt), so if D5 runs before
  that date the fresh-GLM floor applies and the cross-model option is
  honestly recorded as temporarily unavailable, never silently downgraded.
  Implementer NEVER merges its own implementation PR.
- Stop at **REVIEW_REQUESTED**; the authorized reviewer owns approval and
  merge.

Worktree: `_worktrees/env-parity-p1-002` (implementation branch
`feat/env-parity-p1-002` created from the transition merge SHA; the claim
transition itself lives on `docs/env-parity-p1-002-claim`).

## 5. Mutable scope (claim-bound)

- `supabase/migrations/20261115140000_parity_p1_002.sql` (new)
- `scripts/test_parity_p1_002_meter_chain.py` (new)
- `docs/work-orders/ENV-PARITY-P1-002.md` (this file)
- `docs/ai/handoffs/ENV-PARITY-P1-002-GLM.md` (new)
- `docs/ai/CURRENT-WORK.md` (registry + frontier status transitions only)

## 6. Forbidden scope

Form pages (`/form`, `/water-supply`, `/flow`), `frontend/**`, Digital Twin
pages/lib, `supabase/functions/**`, CI (`.github/**`),
`docs/ai/APPSHEET-PARITY-PLAN.md`, `docs/ai/digital-twin/**` (read-only
references), `docs/ai/HANDOFF.md`, `AGENTS.md`, `data/**`, `.env`,
`scripts/env_coordination_guard.py`, `scripts/env_autonomy_runtime.py`,
`wastewater.threshold*` and `v_reading_with_computed`/`v_reading_detail`
(shape and behavior byte-identical — the discovered energy_kwh_estimate
quirk is a recorded follow-up, NOT fixed here),
`water_supply.daily_check` (P1.5), admin-UI for spec edits (deferred,
P1.4+), and everything else not listed in §5.

## 7. Truth constraints (binding)

- Unknown ≠ zero: missing meters/specs/deltas/averages → NULL +
  boundary/reason flags; never 0, never a negative volume, never the
  AppSheet text prompt, never a fallback constant (the AppSheet fallback-60
  pattern is explicitly NOT mirrored — plan P1.4 note).
- `latest` ≠ `live`: views compute from recorded readings; no telemetry
  claims.
- No hardcoded domain constants in SQL: 34/12/3.7/1:9 exist ONLY as
  `core.equipment_spec` rows (A1: figures change when pumps change); the
  ÷2/÷4/÷9 SWITCH denominators mirror the VERBATIM wastewater production
  formula (documented exception to "no literals" — it is the formula's own
  ratio mapping, quoted and bound in §2.2).
- Effective-dated honesty: specs are append-only (never overwrite);
  historical recomputes must stay historically correct.
- Seeds are system reference/config data (owner-confirmed via plan §5.3
  A1–A3), never user data; no `wastewater.reading` row is touched.
- พ.ศ. (CE + 543) for user-facing dates in any Thai text the lane produces.
- No PHI in test data or receipts; fixtures transaction-scoped with
  ROLLBACK + count proof — no durable writes in tests.
- No assertion weakening to force RED→GREEN.

## 8. Acceptance

1. Registry shows exactly one new claim (`ENV-PARITY-P1-002-C1`, gen 1)
   after the reviewed transition merge; JSON-diff vs base `fb57369` = 1 new
   claim (27 → 28), others byte-identical.
2. Migration applied with preflight + apply receipts in the handoff; test
   RED (pre-apply) and GREEN (post-apply) outputs recorded verbatim;
   fixture rollback proof recorded (zero durable writes).
3. D4 battery green at the frozen head with the no-version-bump reasoning
   recorded.
4. D5 fresh-GLM review recorded; PR stopped at REVIEW_REQUESTED;
   implementer did not merge.
