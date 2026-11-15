# ENV-PARITY-P1-002-C1 — Handoff (claim checkpoint)

conventions note: this handoff follows the
`docs/ai/handoffs/ENV-PARITY-P1-003-GLM.md` conventions (claim checkpoint
sections, per-phase evidence, durable receipts). D-phase logs D2+ are
appended by the implementing lane; nothing before D2 is rewritten later.
The D1 consult record below is FROZEN at claim time — receipts embedded
verbatim (byte-verified against the /tmp originals).

## D0 — Claim transition authored (15 พฤศจิกายน 2569 / 2026-11-15)

- Claim `ENV-PARITY-P1-002-C1` (generation 1, CLAIMED) registered by this
  transition; authority begins only after the reviewed transition merges to
  `main`.
- Task `ENV-PARITY-P1-002` (new task row; task_id uniqueness checked
  against the registry via the guard — no OWNERSHIP_CONFLICT; 27 → 28
  claims, JSON-diff exactly 1 new claim).
- Work Order: `docs/work-orders/ENV-PARITY-P1-002.md` (authorization basis,
  scope bound to plan §6 Phase 1 row P1.2 as amended by commit `fb57369`,
  verbatim meter-chain ground truth from reference doc 12, the D1 binding
  equipment-spec design, D-plan, mutable/forbidden scope, truth
  constraints, acceptance).
- Lane: Track-Z (GLM) only — ONE migration (`core.equipment_spec_kind`
  enum + `core.equipment_spec` effective-dated table + 4 guarded seeds +
  `wastewater.v_reading_meter_chain` view) + live-DB RED-first
  meter-chain test + battery; no Track F work exists (no visual surface;
  admin UI for spec edits deferred to P1.4+).
- Holder (this coordinator session): `kilo-env-parity-p1-002-g1-primary`;
  worktree
  `/Volumes/MAC_WORK/DevWorkspace/Github/_worktrees/env-parity-p1-002`
  (the P1.003 claim's recorded sibling-location convention; the repo-local
  untracked `_worktrees/` holds prior-lane state and is NOT this lane's);
  transition branch `docs/env-parity-p1-002-claim`; implementation branch
  `feat/env-parity-p1-002` (created from the transition merge SHA, NOT
  before merge); base `fb57369c3dea5f3cfc75d487a1f774795d6eb403` (=
  origin/main tip at transition authoring — the owner-decisions receipt
  commit; clean, fetched, ff verified).
- Fence: `expected_policy_revision` pins the base SHA;
  `expected_registry_hash` pins the registry block AT the base, guard
  method `scripts/env_coordination_guard.py:454-456`
  (`sha256(exact canonical block text)`), verified via
  `python3 scripts/env_coordination_guard.py validate-registry --file
  docs/ai/CURRENT-WORK.md` at base →
  `{"claims": 27, "ok": true, "registry_hash":
  "95d363ff90868e3f79d7cc8b0cb2f54da50e621ec8896f1cee63aa68ad9ce63f"}`.
  Empirical cross-check: the same guard method at the prior base `83b2ba0`
  reproduces the prior fence
  `be292731ac54847f6e8ad54bc3288c272bb119a0bd198ff417f60c333970d943`
  byte-exactly — method validated. Prior fences re-pinned to the new base
  in this transition.

### Authorization basis (recorded, adversarial-check item)

1. Owner standing Goal-mode instruction 2026-11-15: "ต่อยาวๆ ตามแผนและ
   roadmap ที่วางไว้".
2. Owner parity authorization 2026-11-14: "วางแผนทำให้ระบบมีรูปแบบการกรอกข้อมูล,
   การคำนวณข้อมูลเหมือน appsheet … จนกว่าโปรแกรม ENV จะใช้ทดแทนได้ทั้งหมด"
   → `docs/ai/APPSHEET-PARITY-PLAN.md` (base commit `1b00390`).
3. Owner gate answers A1–A3 of 2026-11-15 (plan §5.3 receipt block,
   recorded by commit `fb57369`; rows quoted verbatim in WO §2.1):
   ×34/×12 = pump per-hour spec values (hour meters on site) + the NEW
   requirement of an equipment-spec configuration system because repaired/
   replaced pumps may change the per-hour figures; ×3.7 likewise from the
   instrument spec (same config system as P1.2); ÷10 with the 1:9
   10%-chlorine mix confirmed for the groundwater system. These answers
   un-gate P1.2's §8 risk-row-3 constants gate (the gate the P1.3 closeout
   recorded as pending).
4. Plan §6 Phase 1 lane table row P1.2 (quoted verbatim in the WO header)
   + plan §4.1 meter-chain dispositions (LAG-vs-MAX DIVERGE, numeric-only
   DIVERGE, config-not-literal, delta≤0→ค่าว่าง).
5. D1 delegated design consult 2026-11-15 (record in the D1 section below;
   receipts verbatim).

### D1 decision (binding) — equipment-spec system + meter-chain semantics

Decided by the GLM coordinator under the owner standing delegation
(2026-11-15), because: Terra (Codex CLI) was UNAVAILABLE — usage limit
until 2026-11-20 (receipt below, exit 1, zero consult output); Jev's
contract admitted only fixed decision families so the A/B/C design choices
were NOT resolvable (receipts below). The one semantically resolvable Jev
signal — Q5 meter-reset mis-attribution = `CODE_FAILURE` @ confidence 1.0
— makes the delta guard a code-level requirement. Binding decisions
(full reasoning in WO §2.3):

1. **Model = effective-dated history** (`core.equipment_spec`,
   append-only `valid_from`/`valid_to`; computations join by reading
   date; NEVER overwrite). Admin UI deferred to P1.4+.
2. **ONE table** in schema `core` (house location of
   `core.equipment`/`core.personnel`): typed columns
   (`kind` enum ×4, `flow_m3_per_h`, `energy_kwh_per_h`, mix parts pair,
   `valid_from` NOT NULL, `valid_to` NULL-open, `note`, `source`),
   kind-conditional CHECKs + positive-value CHECKs +
   `UNIQUE (kind, valid_from)`; RLS enabled with NO policies
   (fail-closed; existing RLS untouched); no FK to `core.equipment` this
   lane (recorded follow-up).
3. **4 guarded seeds** (WHERE NOT EXISTS on `(kind, valid_from)`;
   provenance "owner-confirmed 2026-11-15"): pump_wastewater_1 flow 34 ·
   pump_wastewater_2 flow 12 · pump_groundwater energy 3.7 ·
   chlorine_mix_groundwater parts 1:9. **`valid_from = DATE '2024-01-09'`
   (= live `MIN(reading_date)`; preflight re-verifies, STOP on drift).**
   Choice recorded: pin at the data horizon, not the owner-confirmation
   date — specs predate the data; a late pin would leave the 907
   historical rows without a resolvable spec (computations join by reading
   date); honest labeling in `note`/`source`, no false precision; NEVER
   `CURRENT_DATE`.
4. **View `wastewater.v_reading_meter_chain`**: date-ordered LAG prev
   meters (the documented AppSheet global-MAX bug corrected), pump deltas
   as HOURS × spec-at-that-date (never ×34/×12 literals),
   `wastewater_in_derived` numeric-only (never the AppSheet text prompt),
   `delta_kwh` with **delta ≤ 0 → NULL + `meter_boundary_flag`/reason**
   (Jev Q5 CODE_FAILURE guard; never zero, never negative),
   `chlorine_used_real` per the VERBATIM ÷SWITCH formula (1:2→÷2, 1:4→÷4,
   1:9→÷9), `avg_westwater_4d` (missing days contribute nothing). Electric
   meter resolved from `carbon.meter`/`carbon.reading` via
   `carbon_reading_id` at preflight; unresolved identity → NULL + reason,
   never guessed.
5. **Scope = DB only** (ONE migration + ONE test + docs). NO frontend, NO
   admin UI, NO form changes (P1.4), NO Edge Functions, NO CI. ENV_DB gate
   + preflight + apply per the P1.3 §3.3/§3.4 pattern; rollback documented
   (fully additive lane); existing views/RLS byte-identical.

### Scope discoveries recorded at claim time (bind the lane shape)

1. **`Chlorine_StreakCount` EXCLUDED by instruction, gap recorded:** the
   transition instruction binds "chlorine streak views already exist from
   P1.3 — do not duplicate". Honest record: P1.3 delivered the 2-day
   critical streak FLAGS (`critical_free_chlorine_low/high` in the
   critical-flags view) — a different computation from the continuous
   gaps-and-islands `Chlorine_StreakCount` (reference doc 12 line ~1421),
   which the P1.3 WO had noted as "P1.2 scope". This lane does NOT deliver
   it (instruction is authority; no silent scope expansion) and does NOT
   silently drop the gap — `Chlorine_StreakCount` is a NAMED follow-up
   needing either a reviewed addendum here (reviewer's call at exact-SHA
   review) or its own successor claim.
2. **Existing-view quirk discovered, NOT fixed:**
   `wastewater.v_reading_with_computed` computes `(pump2_meter -
   pump1_meter) AS energy_kwh_estimate` — a difference between the two
   PUMP hour meters, not an electric-meter delta and not ×3.7. Fixing it
   would change an existing surface → recorded follow-up; the view stays
   byte-identical in this lane (regression-guarded in the D2 test).
3. **÷9 vs ÷10 recorded, never silently reconciled:** the wastewater
   `คลอรีนน้ำที่ใช้จริง` production formula divides by the ratio
   DENOMINATOR (`SWITCH(ratio,"1:2",2,"1:4",4,"1:9",9)` — reference doc
   12 line ~767), while owner answer A3's "÷10" binds the GROUNDWATER
   water-supply system (10% solution, 1:9 → pure fraction 1/10), which
   lives in the `chlorine_mix_groundwater` spec row for the P1.5 lane.
   The wastewater view mirrors the verbatim production formula (verbatim
   wins, P1.3 pH precedent); if the owner later rules wastewater should
   also be ÷10, that is a reviewed follow-up.
4. **Migration filename pinned everywhere:**
   `supabase/migrations/20261115140000_parity_p1_002.sql` (sorts after the
   P1.003 migration; exact name pinned in WO §3.1/§3.4/§5 + claim
   mutable_scope — the P1.3 filename-drift P3 must not recur).
5. **Electric-meter identity is a preflight requirement:** live snapshot
   shows exactly ONE `carbon.meter` row; plan §4.1 row 125 requires
   identifying which meter is the wastewater electric meter. D2/D3
   preflight records meter_name/source evidence + `carbon_reading_id`
   linkage rate; unresolved → `delta_kwh` NULL +
   `'electric-meter-identity-unresolved'` (never guessed).
6. **Hour-meter semantic note:** per A1 the pump meters are HOUR meters
   (ชั่วโมง/วันต่อปั๊ม) — deltas are hours; volume = hours × flow-spec at
   that date. The AppSheet คำนวณสูบ formulas already encode this shape;
   the lane's correction is the spec JOIN replacing the ×34/×12 literals.
7. **Live-DB caveat (same as P1.001/P1.003):** the MCP session reachable
   during claim authoring may not be ENV_DB — live verification is an
   explicit D3 PREFLIGHT step via the `scripts/apply_migration_api.py` /
   `scripts/introspect_schema_api.py` Management-API path (ENV_DB gate
   artifact + `SELECT MIN(reading_date)` history-bound `valid_from`
   evidence + `carbon.meter` identity evidence + name-collision check).
   If a discovery above conflicts with live state, STOP and report — do
   not improvise.
8. **Battery/checker note:** D4 expects checker **no-bump** (no
   user-facing surface); guard baseline 344 passed + 450 subtests and
   runtime 62/62 verified at the base by this transition.

## D1 — CONSULT RECORD (frozen verbatim at claim time, 2026-11-15)

Consult summary: Jev via MCP `jev-advisory` (typesafe, pinned
jev-1.13.0), 6 questions, READ-ONLY, `authoritative_for_action:false` on
every response; contract admits only fixed families → choice legends
degenerate for Q1–Q4/Q6 (Q3 0.51, Q4 0.45 below escalation), Q5
`failure_classification` returned `CODE_FAILURE` @ 1.0 (the only
semantically resolvable signal → delta guard mandatory in code). Terra
via Codex CLI read-only: UNAVAILABLE — usage limit until 2026-11-20,
exit 1, zero consult output (receipt below). Decision authority: GLM
coordinator under the owner standing delegation; joint-decision policy
respects the 2026-11-08 delegated-decision record (delegates never hold
merge/review authority; advisory only).

Receipt files (originals, embedded verbatim below):
`/tmp/jev-equip-d1-2026-11-15.json` (sha256
`baa9ad27bddb23023c4407f3b6c62a155f5cc0ccbb604e4eb3264cc6ddd854b5`),
`/tmp/jev-equip-d1-2026-11-15.txt` (sha256
`f03fe6d426d4415d6a6eb0ae31f50145ac43dba066d5faabc758a044ccbdf2c8`),
`/tmp/terra-equip-d1-receipt-2026-11-15.txt` (sha256
`2a22730d697162d1b97e09ec7e9e2f1b8f39cc14ccc624de395b6dd9e8b3d075`).

### Jev receipt — machine record (verbatim)

```json
[
  {
    "label": "Q1_model_choice",
    "request": {
      "family": "task_classification",
      "primitive": "choice",
      "risk": "medium",
      "question": "ENV project consult (ADVISORY ONLY; human decides). Thai hospital wastewater-treatment webapp (Uthai Hospital), Supabase Postgres. Honesty rule: unknown != zero (missing data must never be coerced to a value). Data: daily readings table wastewater.reading (907 historical rows, 2024 -> now) holds per-day hour-meter values; computations (m3 pumped = hours x pump spec m3/h; energy = hours x kWh/h) feed views/reports. Owner requirement (2026-11-15): pump flow/energy constants must come from an EQUIPMENT-SPEC CONFIGURATION SYSTEM, not hardcoded, because pumps get repaired/replaced and per-hour figures change. Owner-confirmed current values: wastewater pump 1 = 34 m3/h, wastewater pump 2 = 12 m3/h (from hour meters x spec); water-supply (groundwater) pumps: energy 3.7 kWh/h, flow + chlorine mixing 1:9 with 10% chlorine (usage tracked via hours meter). Scope: single treatment location today; a 2nd treatment location is possible someday; ~5 users. QUESTION Q1: Classify the equipment-spec data-modeling task among these approaches. CHOICE LEGEND (map the returned class label to these options): any class indicating simple/minimal/lightweight single-row config without history -> OPTION A; any class indicating versioned/effective-dated/temporal/history-aware modeling -> OPTION B; any class indicating hybrid (versioned model now + admin tooling/UI later) -> OPTION C; class indicating none/unknown -> OTHER. OPTION A: simple config table (one row per equipment, current values only, edits overwrite) - historical reports recompute with TODAY's spec (wrong after a pump swap). OPTION B: effective-dated spec history (equipment + spec rows with valid_from/valid_to; computations join spec by reading date; edits append, never overwrite) - historically correct, slightly more complex views. OPTION C: hybrid - effective-dated specs + a later spec-change admin UI; views always resolve spec by reading date. Answer: which option A/B/C/other."
    },
    "response": "{\"ok\": true, \"provider\": \"typesafe\", \"model\": \"jev-1.13.0\", \"family\": \"task_classification\", \"primitive\": \"choice\", \"answer\": \"feature\", \"confidence\": 0.63, \"probabilities\": {\"bugfix\": 0.0, \"feature\": 0.72, \"docs\": 0.02, \"review\": 0.26}, \"input_usage\": 877, \"output_usage\": 46, \"latency_ms\": 387.338750064373, \"error\": null, \"authoritative_for_action\": false, \"advisory_notice\": \"ADVISORY ONLY. Escalate to frontier reasoning on any error, low confidence, or high risk. Never use as mutation/review authority.\"}"
  },
  {
    "label": "Q2_overengineering_score",
    "request": {
      "family": "task_classification",
      "primitive": "score",
      "risk": "low",
      "question": "ENV project consult (ADVISORY ONLY; human decides). Thai hospital wastewater-treatment webapp (Uthai Hospital), Supabase Postgres. Honesty rule: unknown != zero (missing data must never be coerced to a value). Data: daily readings table wastewater.reading (907 historical rows, 2024 -> now) holds per-day hour-meter values; computations (m3 pumped = hours x pump spec m3/h; energy = hours x kWh/h) feed views/reports. Owner requirement (2026-11-15): pump flow/energy constants must come from an EQUIPMENT-SPEC CONFIGURATION SYSTEM, not hardcoded, because pumps get repaired/replaced and per-hour figures change. Owner-confirmed current values: wastewater pump 1 = 34 m3/h, wastewater pump 2 = 12 m3/h (from hour meters x spec); water-supply (groundwater) pumps: energy 3.7 kWh/h, flow + chlorine mixing 1:9 with 10% chlorine (usage tracked via hours meter). Scope: single treatment location today; a 2nd treatment location is possible someday; ~5 users. QUESTION Q2: Score 1-5 (1 = lowest risk, 5 = highest risk) the OVER-ENGINEERING risk of building an effective-dated equipment-spec history (approach B or C) for this single-location, ~5-user hospital app that today needs only: 2 wastewater pumps (34 and 12 m3/h), water-supply/groundwater pump energy (3.7 kWh/h), and chlorine mixing 1:9 (10%), with only a possible future second treatment location."
    },
    "response": "{\"ok\": true, \"provider\": \"typesafe\", \"model\": \"jev-1.13.0\", \"family\": \"task_classification\", \"primitive\": \"choice\", \"answer\": \"review\", \"confidence\": 0.65, \"probabilities\": {\"bugfix\": 0.0, \"feature\": 0.23, \"docs\": 0.03, \"review\": 0.74}, \"input_usage\": 774, \"output_usage\": 46, \"latency_ms\": 288.2959172129631, \"error\": null, \"authoritative_for_action\": false, \"advisory_notice\": \"ADVISORY ONLY. Escalate to frontier reasoning on any error, low confidence, or high risk. Never use as mutation/review authority.\"}"
  },
  {
    "label": "Q3_table_shape",
    "request": {
      "family": "task_classification",
      "primitive": "choice",
      "risk": "medium",
      "question": "ENV project consult (ADVISORY ONLY; human decides). Thai hospital wastewater-treatment webapp (Uthai Hospital), Supabase Postgres. Honesty rule: unknown != zero (missing data must never be coerced to a value). Data: daily readings table wastewater.reading (907 historical rows, 2024 -> now) holds per-day hour-meter values; computations (m3 pumped = hours x pump spec m3/h; energy = hours x kWh/h) feed views/reports. Owner requirement (2026-11-15): pump flow/energy constants must come from an EQUIPMENT-SPEC CONFIGURATION SYSTEM, not hardcoded, because pumps get repaired/replaced and per-hour figures change. Owner-confirmed current values: wastewater pump 1 = 34 m3/h, wastewater pump 2 = 12 m3/h (from hour meters x spec); water-supply (groundwater) pumps: energy 3.7 kWh/h, flow + chlorine mixing 1:9 with 10% chlorine (usage tracked via hours meter). Scope: single treatment location today; a 2nd treatment location is possible someday; ~5 users. QUESTION Q3: Classify the schema shape for the equipment-spec configuration system whose spec rows join daily readings by date. CHOICE LEGEND (map the returned class label): any class indicating generic/extensible/registry/JSON-flexible -> OPTION A; any class indicating typed/normalized/explicit-columns/constraints -> OPTION B; any class indicating neither/other/mixed -> OPTION C. OPTION A: generic equipment registry (equipment(id, kind in {pump_wastewater, pump_groundwater, chlorine_system}, attrs jsonb); spec rows with jsonb attrs) - flexible, weaker typing/constraints. OPTION B: typed columns per equipment class (flow_m3_per_h numeric, energy_kwh_per_h numeric, chlorine_mix_ratio numeric, chlorine_concentration_pct numeric, ...) with NOT NULL/CHECK constraints - strong typing, migration needed per new attribute/kind. OPTION C: other (e.g., typed core columns + optional attrs jsonb for extras, or one table per kind). Answer: which shape A/B/C."
    },
    "response": "{\"ok\": true, \"provider\": \"typesafe\", \"model\": \"jev-1.13.0\", \"family\": \"task_classification\", \"primitive\": \"choice\", \"answer\": \"feature\", \"confidence\": 0.51, \"probabilities\": {\"bugfix\": 0.0, \"feature\": 0.63, \"docs\": 0.02, \"review\": 0.35}, \"input_usage\": 887, \"output_usage\": 46, \"latency_ms\": 297.95174952596426, \"error\": null, \"authoritative_for_action\": false, \"advisory_notice\": \"ADVISORY ONLY. Escalate to frontier reasoning on any error, low confidence, or high risk. Never use as mutation/review authority.\"}"
  },
  {
    "label": "Q4_seed_strategy",
    "request": {
      "family": "task_classification",
      "primitive": "choice",
      "risk": "medium",
      "question": "ENV project consult (ADVISORY ONLY; human decides). Thai hospital wastewater-treatment webapp (Uthai Hospital), Supabase Postgres. Honesty rule: unknown != zero (missing data must never be coerced to a value). Data: daily readings table wastewater.reading (907 historical rows, 2024 -> now) holds per-day hour-meter values; computations (m3 pumped = hours x pump spec m3/h; energy = hours x kWh/h) feed views/reports. Owner requirement (2026-11-15): pump flow/energy constants must come from an EQUIPMENT-SPEC CONFIGURATION SYSTEM, not hardcoded, because pumps get repaired/replaced and per-hour figures change. Owner-confirmed current values: wastewater pump 1 = 34 m3/h, wastewater pump 2 = 12 m3/h (from hour meters x spec); water-supply (groundwater) pumps: energy 3.7 kWh/h, flow + chlorine mixing 1:9 with 10% chlorine (usage tracked via hours meter). Scope: single treatment location today; a 2nd treatment location is possible someday; ~5 users. QUESTION Q4: Classify how to record the owner-confirmed initial spec values (wastewater pump 1 = 34 m3/h, pump 2 = 12 m3/h; water-supply energy 3.7 kWh/h; chlorine mixing 1:9 at 10%) in Supabase Postgres. CHOICE LEGEND (map the returned class label): any class indicating migration/seed/reference-data/code-reviewed -> OPTION A; any class indicating runtime entry/admin-UI/manual only -> OPTION B; both/other -> OTHER. OPTION A: seed rows via a versioned SQL migration (reviewable reference data, effective-dated from 2026-11-15 or earlier). OPTION B: no seed; values entered once at runtime via admin UI. Answer: A/B/other."
    },
    "response": "{\"ok\": true, \"provider\": \"typesafe\", \"model\": \"jev-1.13.0\", \"family\": \"task_classification\", \"primitive\": \"choice\", \"answer\": \"feature\", \"confidence\": 0.45, \"probabilities\": {\"bugfix\": 0.0, \"feature\": 0.59, \"docs\": 0.05, \"review\": 0.36}, \"input_usage\": 838, \"output_usage\": 46, \"latency_ms\": 282.3007917031646, \"error\": null, \"authoritative_for_action\": false, \"advisory_notice\": \"ADVISORY ONLY. Escalate to frontier reasoning on any error, low confidence, or high risk. Never use as mutation/review authority.\"}"
  },
  {
    "label": "Q5_meter_reset_risk",
    "request": {
      "family": "failure_classification",
      "primitive": "score",
      "risk": "medium",
      "question": "ENV project consult (ADVISORY ONLY; human decides). Thai hospital wastewater-treatment webapp (Uthai Hospital), Supabase Postgres. Honesty rule: unknown != zero (missing data must never be coerced to a value). Data: daily readings table wastewater.reading (907 historical rows, 2024 -> now) holds per-day hour-meter values; computations (m3 pumped = hours x pump spec m3/h; energy = hours x kWh/h) feed views/reports. Owner requirement (2026-11-15): pump flow/energy constants must come from an EQUIPMENT-SPEC CONFIGURATION SYSTEM, not hardcoded, because pumps get repaired/replaced and per-hour figures change. Owner-confirmed current values: wastewater pump 1 = 34 m3/h, wastewater pump 2 = 12 m3/h (from hour meters x spec); water-supply (groundwater) pumps: energy 3.7 kWh/h, flow + chlorine mixing 1:9 with 10% chlorine (usage tracked via hours meter). Scope: single treatment location today; a 2nd treatment location is possible someday; ~5 users. QUESTION Q5: Score 1-5 (1 = lowest, 5 = highest) the FAILURE risk that effective-dated spec-history joins silently mis-attribute pumped volume or energy when a pump is swapped and its hour meter resets to 0. Mechanism: daily readings give hours as meter delta (today minus yesterday); hours x spec-valid-on-that-date = volume/energy. Failure modes: a delta spanning the pump-swap day, meter reset producing negative or wrong deltas, or the spec chosen for the wrong pump identity. Context: one daily readings table (907 rows), per-pump meter readings not guaranteed yet."
    },
    "response": "{\"ok\": true, \"provider\": \"typesafe\", \"model\": \"jev-1.13.0\", \"family\": \"failure_classification\", \"primitive\": \"choice\", \"answer\": \"CODE_FAILURE\", \"confidence\": 1.0, \"probabilities\": {\"CODE_FAILURE\": 1.0, \"TEST_FAILURE\": 0.0, \"TRANSPORT_FAILURE\": 0.0, \"RATE_LIMITED\": 0.0, \"AUTH_FAILURE\": 0.0}, \"input_usage\": 830, \"output_usage\": 62, \"latency_ms\": 277.6359161362052, \"error\": null, \"authoritative_for_action\": false, \"advisory_notice\": \"ADVISORY ONLY. Escalate to frontier reasoning on any error, low confidence, or high risk. Never use as mutation/review authority.\"}"
  },
  {
    "label": "Q6_concerns",
    "request": {
      "family": "task_classification",
      "primitive": "noul",
      "risk": "medium",
      "question": "ENV project consult (ADVISORY ONLY; human decides). Thai hospital wastewater-treatment webapp (Uthai Hospital), Supabase Postgres. Honesty rule: unknown != zero (missing data must never be coerced to a value). Data: daily readings table wastewater.reading (907 historical rows, 2024 -> now) holds per-day hour-meter values; computations (m3 pumped = hours x pump spec m3/h; energy = hours x kWh/h) feed views/reports. Owner requirement (2026-11-15): pump flow/energy constants must come from an EQUIPMENT-SPEC CONFIGURATION SYSTEM, not hardcoded, because pumps get repaired/replaced and per-hour figures change. Owner-confirmed current values: wastewater pump 1 = 34 m3/h, wastewater pump 2 = 12 m3/h (from hour meters x spec); water-supply (groundwater) pumps: energy 3.7 kWh/h, flow + chlorine mixing 1:9 with 10% chlorine (usage tracked via hours meter). Scope: single treatment location today; a 2nd treatment location is possible someday; ~5 users. QUESTION Q6: In at most 5 short bullets, state the top concerns or a better alternative for implementing this equipment-spec configuration system (effective-dated specs joined to daily meter readings; unknown != zero honesty rule; values must be editable when pumps are repaired/replaced; possible future 2nd location). Consider at most: backfill/migration of the 907 historical rows, view complexity, admin UX, typing/constraints, and anything options A/B/C miss."
    },
    "response": "{\"ok\": true, \"provider\": \"typesafe\", \"model\": \"jev-1.13.0\", \"family\": \"task_classification\", \"primitive\": \"choice\", \"answer\": \"review\", \"confidence\": 0.71, \"probabilities\": {\"bugfix\": 0.0, \"feature\": 0.2, \"docs\": 0.02, \"review\": 0.78}, \"input_usage\": 760, \"output_usage\": 46, \"latency_ms\": 262.57508248090744, \"error\": null, \"authoritative_for_action\": false, \"advisory_notice\": \"ADVISORY ONLY. Escalate to frontier reasoning on any error, low confidence, or high risk. Never use as mutation/review authority.\"}"
  }
]

```

### Jev receipt — readable rendition (verbatim)

```text
JEV ADVISORY CONSULT — ENV equipment-spec design (D1, parity lane P1.2)
=======================================================================
Date of calls : 2026-11-15 (UTC)
Tool          : MCP `jev-advisory` (Code Mode), provider typesafe, pinned model jev-1.13.0
Mode          : READ-ONLY consult; ADVISORY ONLY per tool's own notice — never mutation/review authority
Receipts      : /tmp/jev-equip-d1-2026-11-15.json (verbatim machine record)
                /tmp/jev-equip-d1-2026-11-15.txt  (this readable rendition, same content)

CONTRACT LIMITATIONS (disclosure)
---------------------------------
1. The tool admits only FIXED decision families with FIXED class sets:
   - task_classification -> classes {bugfix, feature, docs, review}
   - failure_classification -> classes {CODE_FAILURE, TEST_FAILURE, TRANSPORT_FAILURE, RATE_LIMITED, AUTH_FAILURE}
   No ENV-specific option set exists.
2. The `options` parameter is IGNORED by contract ("options are fixed by the admitted
   family template"), so ENV options A/B/C and the Q4 A/B seed choices were NOT passed
   as options. Instead they were ENCODED inside the `question` text as class->option
   legends, per the delegation instruction.
3. The `primitive` parameter is OVERRIDDEN by the family template: requests with
   primitive "score" (Q2, Q5) and "noul" (Q6) all came back as primitive "choice".
   Therefore NO numeric 1-5 score and NO free-text bullets were obtainable.
4. Legend resolution was DEGENERATE for Q1-Q4 and Q6: the returned classes are
   task-type labels, not approach descriptors, so they do not directly encode A/B/C.
   Only Q5's failure-class returned a semantically interpretable signal.

VERBATIM REQUESTS + RESPONSES (per question)
---------------------------------------------

--- Q1_model_choice (task_classification, risk=medium) ---
REQUEST: {"family":"task_classification","primitive":"choice","risk":"medium","question":"ENV project consult (ADVISORY ONLY; human decides). Thai hospital wastewater-treatment webapp (Uthai Hospital), Supabase Postgres. Honesty rule: unknown != zero (missing data must never be coerced to a value). Data: daily readings table wastewater.reading (907 historical rows, 2024 -> now) holds per-day hour-meter values; computations (m3 pumped = hours x pump spec m3/h; energy = hours x kWh/h) feed views/reports. Owner requirement (2026-11-15): pump flow/energy constants must come from an EQUIPMENT-SPEC CONFIGURATION SYSTEM, not hardcoded, because pumps get repaired/replaced and per-hour figures change. Owner-confirmed current values: wastewater pump 1 = 34 m3/h, wastewater pump 2 = 12 m3/h (from hour meters x spec); water-supply (groundwater) pumps: energy 3.7 kWh/h, flow + chlorine mixing 1:9 with 10% chlorine (usage tracked via hours meter). Scope: single treatment location today; a 2nd treatment location is possible someday; ~5 users. QUESTION Q1: Classify the equipment-spec data-modeling task among these approaches. CHOICE LEGEND (map the returned class label to these options): any class indicating simple/minimal/lightweight single-row config without history -> OPTION A; any class indicating versioned/effective-dated/temporal/history-aware modeling -> OPTION B; any class indicating hybrid (versioned model now + admin tooling/UI later) -> OPTION C; class indicating none/unknown -> OTHER. OPTION A: simple config table (one row per equipment, current values only, edits overwrite) - historical reports recompute with TODAY's spec (wrong after a pump swap). OPTION B: effective-dated spec history (equipment + spec rows with valid_from/valid_to; computations join spec by reading date; edits append, never overwrite) - historically correct, slightly more complex views. OPTION C: hybrid - effective-dated specs + a later spec-change admin UI; views always resolve spec by reading date. Answer: which option A/B/C/other."}
RESPONSE (raw): {"ok": true, "provider": "typesafe", "model": "jev-1.13.0", "family": "task_classification", "primitive": "choice", "answer": "feature", "confidence": 0.63, "probabilities": {"bugfix": 0.0, "feature": 0.72, "docs": 0.02, "review": 0.26}, "input_usage": 877, "output_usage": 46, "latency_ms": 387.338750064373, "error": null, "authoritative_for_action": false, "advisory_notice": "ADVISORY ONLY. Escalate to frontier reasoning on any error, low confidence, or high risk. Never use as mutation/review authority."}
Legend result: class "feature" does not denote an approach -> A/B/C NOT resolvable from Jev. (Read as: the consult subject is new-feature design work, review-leaning 0.26.)

--- Q2_overengineering_score (task_classification, requested primitive "score") ---
REQUEST: {"family":"task_classification","primitive":"score","risk":"low","question":"ENV project consult (ADVISORY ONLY; human decides). ... [full context as in JSON receipt] ... QUESTION Q2: Score 1-5 (1 = lowest risk, 5 = highest risk) the OVER-ENGINEERING risk of building an effective-dated equipment-spec history (approach B or C) for this single-location, ~5-user hospital app that today needs only: 2 wastewater pumps (34 and 12 m3/h), water-supply/groundwater pump energy (3.7 kWh/h), and chlorine mixing 1:9 (10%), with only a possible future second treatment location."}
RESPONSE (raw): {"ok": true, "provider": "typesafe", "model": "jev-1.13.0", "family": "task_classification", "primitive": "choice", "answer": "review", "confidence": 0.65, "probabilities": {"bugfix": 0.0, "feature": 0.23, "docs": 0.03, "review": 0.74}, "input_usage": 774, "output_usage": 46, "latency_ms": 288.2959172129631, "error": null, "authoritative_for_action": false, "advisory_notice": "ADVISORY ONLY. Escalate to frontier reasoning on any error, low confidence, or high risk. Never use as mutation/review authority."}
Legend result: NO numeric score available (primitive coerced to choice). Class "review" (0.74) — consult subject reads as scrutiny/review-type concern, not a design reject.

--- Q3_table_shape (task_classification, risk=medium) ---
REQUEST: {"family":"task_classification","primitive":"choice","risk":"medium","question":"... [full context] ... QUESTION Q3: Classify the schema shape ... OPTION A: generic equipment registry (kind enum + attrs jsonb) ... OPTION B: typed columns per equipment class with NOT NULL/CHECK ... OPTION C: other (typed core + optional attrs jsonb, or table per kind). Answer: which shape A/B/C."}
RESPONSE (raw): {"ok": true, "provider": "typesafe", "model": "jev-1.13.0", "family": "task_classification", "primitive": "choice", "answer": "feature", "confidence": 0.51, "probabilities": {"bugfix": 0.0, "feature": 0.63, "docs": 0.02, "review": 0.35}, "input_usage": 887, "output_usage": 46, "latency_ms": 297.95174952596426, "error": null, "authoritative_for_action": false, "advisory_notice": "ADVISORY ONLY. Escalate to frontier reasoning on any error, low confidence, or high risk. Never use as mutation/review authority."}
Legend result: A/B/C NOT resolvable from Jev; LOW confidence 0.51 -> per tool notice, escalate to frontier reasoning.

--- Q4_seed_strategy (task_classification, risk=medium) ---
REQUEST: {"family":"task_classification","primitive":"choice","risk":"medium","question":"... [full context] ... QUESTION Q4: Classify how to record the owner-confirmed initial spec values ... OPTION A: seed rows via a versioned SQL migration ... OPTION B: no seed; values entered once at runtime via admin UI. Answer: A/B/other."}
RESPONSE (raw): {"ok": true, "provider": "typesafe", "model": "jev-1.13.0", "family": "task_classification", "primitive": "choice", "answer": "feature", "confidence": 0.45, "probabilities": {"bugfix": 0.0, "feature": 0.59, "docs": 0.05, "review": 0.36}, "input_usage": 838, "output_usage": 46, "latency_ms": 282.3007917031646, "error": null, "authoritative_for_action": false, "advisory_notice": "ADVISORY ONLY. Escalate to frontier reasoning on any error, low confidence, or high risk. Never use as mutation/review authority."}
Legend result: A/B NOT resolvable from Jev; LOWEST confidence of the set (0.45) -> escalate to frontier reasoning.

--- Q5_meter_reset_risk (failure_classification, requested primitive "score") ---
REQUEST: {"family":"failure_classification","primitive":"score","risk":"medium","question":"... [full context] ... QUESTION Q5: Score 1-5 (1 = lowest, 5 = highest) the FAILURE risk that effective-dated spec-history joins silently mis-attribute pumped volume or energy when a pump is swapped and its hour meter resets to 0. Mechanism: daily readings give hours as meter delta (today minus yesterday); hours x spec-valid-on-that-date = volume/energy. Failure modes: a delta spanning the pump-swap day, meter reset producing negative or wrong deltas, or the spec chosen for the wrong pump identity. Context: one daily readings table (907 rows), per-pump meter readings not guaranteed yet."}
RESPONSE (raw): {"ok": true, "provider": "typesafe", "model": "jev-1.13.0", "family": "failure_classification", "primitive": "choice", "answer": "CODE_FAILURE", "confidence": 1.0, "probabilities": {"CODE_FAILURE": 1.0, "TEST_FAILURE": 0.0, "TRANSPORT_FAILURE": 0.0, "RATE_LIMITED": 0.0, "AUTH_FAILURE": 0.0}, "input_usage": 830, "output_usage": 62, "latency_ms": 277.6359161362052, "error": null, "authoritative_for_action": false, "advisory_notice": "ADVISORY ONLY. Escalate to frontier reasoning on any error, low confidence, or high risk. Never use as mutation/review authority."}
Legend result: class CODE_FAILURE at confidence 1.0 — the meter-reset mis-attribution is a CODE/LOGIC-level failure (not transport/auth), i.e. it must be prevented in code/schema: guard meter deltas (clamp negative deltas at swap boundaries, treat unknown/reset as unknown per honesty rule), and keep spec validity windows aligned to reading dates. No 1-5 numeric score obtainable.

--- Q6_concerns (task_classification, requested primitive "noul") ---
REQUEST: {"family":"task_classification","primitive":"noul","risk":"medium","question":"... [full context] ... QUESTION Q6: In at most 5 short bullets, state the top concerns or a better alternative ... Consider at most: backfill/migration of the 907 historical rows, view complexity, admin UX, typing/constraints, and anything options A/B/C miss."}
RESPONSE (raw): {"ok": true, "provider": "typesafe", "model": "jev-1.13.0", "family": "task_classification", "primitive": "choice", "answer": "review", "confidence": 0.71, "probabilities": {"bugfix": 0.0, "feature": 0.2, "docs": 0.02, "review": 0.78}, "input_usage": 760, "output_usage": 46, "latency_ms": 262.57508248090744, "error": null, "authoritative_for_action": false, "advisory_notice": "ADVISORY ONLY. Escalate to frontier reasoning on any error, low confidence, or high risk. Never use as mutation/review authority."}
Legend result: free-text bullets NOT obtainable (primitive coerced). Class "review" (0.78) — the concern space reads as review/scrutiny work.

SUMMARY OF RESOLVABLE SIGNALS FROM JEV
--------------------------------------
- Q1/Q3/Q4: A/B/C/A-B legend NOT resolvable (fixed classes are task types: feature/review/docs/bugfix). Confidence 0.63 / 0.51 / 0.45 — Q3 and Q4 below the escalation threshold implied by the tool's advisory notice ("escalate ... on any error, low confidence, or high risk").
- Q2/Q5: requested score primitive overridden; no numeric 1-5 returned.
- Q5 (only semantically resolvable item): CODE_FAILURE @ 1.0 confidence — silent spec/meter-delta mis-attribution is a code-logic failure class and must be defended in delta logic + spec-validity joins.
- Q6: no free text; review-leaning classification (0.71-0.78 review).

ESCALATION FLAG (per tool notice)
---------------------------------
Low-confidence results (Q3 0.51, Q4 0.45) and non-resolvable legends (Q1, Q2, Q6)
mean the ENV design decision A/B/C must be settled by the owner/frontier reasoning,
NOT by this advisory consult. The consult is evidence only; `authoritative_for_action`
= false in every response.

```

### Terra receipt (verbatim)

```text
=== terra-equip-d1 consult receipt ===
command: /Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex exec --sandbox read-only -m gpt-6.1-terra "Read /tmp/terra-equip-d1-brief-2026-11-15.md and answer all questions in its exact output structure."
start_utc: 2026-11-15T18:48:12Z (epoch 1794768492)
=== CODEX OUTPUT (verbatim stdout+stderr) ===
Reading additional input from stdin...
OpenAI Codex v0.166.0-alpha.5.1
--------
workdir: /Volumes/MAC_WORK/DevWorkspace/Github/env-wastewater-webapp
model: gpt-6.1-terra
provider: openai
approval: never
sandbox: read-only
reasoning effort: low
reasoning summaries: none
session id: 01a1e089-d7a2-7e33-9b7e-ab7d55237f4a
--------
user
Read /tmp/terra-equip-d1-brief-2026-11-15.md and answer all questions in its exact output structure.
hook: SessionStart
hook: SessionStart Completed
hook: UserPromptSubmit
hook: UserPromptSubmit Completed
ERROR: You’ve hit your usage limit. Upgrade to Pro (https://chatgpt.com/explore/pro), visit https://chatgpt.com/settings/usage to purchase more credits or try again at Nov 20th, 2026 4:53 AM.
ERROR: You’ve hit your usage limit. Upgrade to Pro (https://chatgpt.com/explore/pro), visit https://chatgpt.com/settings/usage to purchase more credits or try again at Nov 20th, 2026 4:53 AM.
=== END ===
end_utc: 2026-11-15T18:48:16Z (epoch 1794768496)
latency_seconds: 4
exit_code: 1

```
