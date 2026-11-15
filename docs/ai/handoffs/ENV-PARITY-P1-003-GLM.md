# ENV-PARITY-P1-003-C1 — Handoff (claim checkpoint)

conventions note: this handoff follows the
`docs/ai/handoffs/ENV-PARITY-P1-001-GLM.md` conventions (claim checkpoint
sections, per-phase evidence, durable receipts). D-phase logs D1+ are
appended by the implementing lane; nothing before D0 is rewritten later.

## D0 — Claim transition authored (15 พฤศจิกายน 2569 / 2026-11-15)

- Claim `ENV-PARITY-P1-003-C1` (generation 1, CLAIMED) registered by this
  transition; authority begins only after the reviewed transition merges to
  `main`.
- Task `ENV-PARITY-P1-003` (new task row; task_id uniqueness checked against
  the registry via the guard — no OWNERSHIP_CONFLICT; 26 → 27 claims,
  JSON-diff exactly 1 new claim).
- Work Order: `docs/work-orders/ENV-PARITY-P1-003.md` (authorization basis,
  scope bound to plan §6 Phase 1 row P1.3, verbatim threshold ground truth
  from reference §3.3/§9, streak-semantic translation, alert-chain extension
  design, D-plan, mutable/forbidden scope, truth constraints, acceptance).
- Lane: Track-Z (GLM) only — ONE migration (threshold seeds + 2-day critical
  streak functions/view + alert-chain extension) + live-DB RED-first
  threshold test + battery; no Track F work exists (no visual surface).
- Holder (this coordinator session): `kilo-env-parity-p1-003-g1-primary`;
  worktree
  `/Volumes/MAC_WORK/DevWorkspace/Github/_worktrees/env-parity-p1-003`;
  transition branch `docs/env-parity-p1-003-claim`; implementation branch
  `feat/env-parity-p1-003` (created from the transition merge SHA, NOT
  before merge); base `912db2e528d290b675e36e5d9aabb9c2b18d2e28` (=
  origin/main tip at transition authoring; the closeout merge of PR #185 —
  clean, fetched, ff verified).
- Fence: `expected_policy_revision` pins the base SHA;
  `expected_registry_hash` pins the registry block AT the base, guard method
  `scripts/env_coordination_guard.py:454-456`
  (`sha256(exact canonical block text)`), verified via
  `python3 scripts/env_coordination_guard.py validate-registry --file
  docs/ai/CURRENT-WORK.md` at base →
  `{"claims": 26, "ok": true, "registry_hash":
  "6dce8bb6c311b897e7e950259e0b2f8a03b33adf0c6f1f1d2b97c43a3eda75f8"}`.
  Empirical cross-check: the same guard method at the prior base `d153983`
  reproduces the prior fence `d6b62e0959185b2ae06bba2925b0a3298ecc66bef68a8c6988186a606f94d6d8`
  byte-exactly — method validated. Prior fences re-pinned to the new base in
  this transition.

### Authorization basis (recorded, adversarial-check item)

1. Owner standing Goal-mode instruction 2026-11-15: "ต่อยาวๆ ตามแผนและ
   roadmap ที่วางไว้".
2. Owner parity authorization 2026-11-14: "วางแผนทำให้ระบบมีรูปแบบการกรอกข้อมูล,
   การคำนวณข้อมูลเหมือน appsheet … จนกว่าโปรแกรม ENV จะใช้ทดแทนได้ทั้งหมด"
   → `docs/ai/APPSHEET-PARITY-PLAN.md` (base commit `1b00390`).
3. Plan §6 Phase 1 lane table row P1.3 (quoted verbatim in the WO header) +
   plan §4.1 Critical-* computation row + plan §5.1 SV30-seed note.
4. Verbatim AppSheet definition reference §3.3 (`ข้อมูลคุณภาพน้ำ` Critical-*
   formulas) + §9 (bots `Do1_Notice`/`Do3_Notice`/`SV30_Notice`/
   `chlorine_Notice`/`TDS_Notice`/`pH_Notice`/`water_overload`) — values and
   directions quoted in WO §2.1 and BIND; no invented constants.

### Out-of-order execution note (BY DESIGN, recorded in the claim)

Phase 1 runs P1.3 before P1.2/P1.5. P1.2 (×34/×12) and P1.5 (×3.7, ÷10) are
gated on owner confirmation of domain constants per plan §8 risk row 3
("ยืนยันกับเจ้าของ/เอกสารหน้างานก่อน merge"); P1.3 has no such gate because
every constant it seeds comes verbatim from the owner's own production
AppSheet formulas/bots (owner-confirmed by construction). This claim does
NOT authorize P1.2/P1.5 work; lane numbering is not execution order.

### Pinned threshold values (summary — full table with mappings in WO §2.1)

`do1` max 1 · `do2` max 1 · `do3` max 1.5 · `free_chlorine` min 0.5 / max 1 ·
`ph` min 5 / max 9 · `tds2` min 1000 · `sv30` min 150 / max 450 ·
`wastewater_in` min 70. Sources: `Critical-DO-1/2/3` (<1/<1/<1.5),
`Critical-FreeChlorine-Lowerlow/HigherHigh` (<0.5/>1), `TDS2 critical`
(>1000), `pH Critical` (>9/<5), `SV30_Notice` bot (>450/<150),
`water_overload` bot (>70) — all verbatim reference §3.3/§9.

### Scope discoveries recorded at claim time (bind the lane shape)

1. **pH bound discrepancy — verbatim wins:** plan §4.1's summary says
   "pH>9/<4" but the verbatim `pH Critical` formula is `< 5`; seed pins
   min 5. Plan-summary typo documented, not silently copied.
2. **Disabled bots NOT seeded:** `(disabled) Line AS record 3` (TDS-2 >900,
   Temp >40, pH >8.3, SV30 >650, inflow >62) is disabled in AppSheet —
   excluded; `TDS_Notice`/`pH_Notice` bots have EMPTY event conditions
   (broken in AppSheet, plan §5.1) — their substance is the Critical columns
   (seeded via `tds2`/`ph`). The >2.5 free-chlorine FORMAT rule (§10) is a
   UI display rule owned by P1.4 — not a threshold row.
3. **Existing param-code convention:** `do1/do2/do3/free_chlorine/ph` are
   already consumed by `v_reading_detail` flag columns (live snapshot);
   `tds2` follows the positional AppSheet naming (TDS-2 = ในน้ำก่อนทิ้ง) to
   avoid ambiguity with `tds_aeration`.
4. **Existing hardcoded alert branches remain:** `fn_check_thresholds`
   (do-avg <2.0, Cl <0.5, pH 6.5–8.5 — the original FastAPI-port values,
   no AppSheet counterpart) stays byte-identical in behavior; this lane
   EXTENDS the check surface, never replaces (removal = separate owner
   decision).
5. **Streak semantics translation:** verbatim AppSheet = per-date EXISTS at
   D−2/D−1/D with exact calendar-date equality (COUNT>0 per date); a naive
   LAG-over-recorded-rows diverges across calendar gaps — the faithful
   EXISTS form is required; missing/NULL day ⇒ no violation ⇒ streak FALSE
   (missing readings = no streak, never fabricated). `sv30` and
   `wastewater_in` are immediate single-day conditions (their bots fire on
   the reading itself).
6. **Alert delivery is out of scope:** `notify-threshold` Edge Function and
   any Telegram/LINE channel stay untouched (Phase 4 owner decision, plan
   §5.3 item 2); this lane populates the existing pending queue only.
   Existing frontend surfaces (`NotificationBell.tsx`) already read pending
   alerts and stay untouched — new rows surface through existing UI with
   zero frontend edits; `frontend/**` remains forbidden.
7. **Reference-data distinction:** `wastewater.threshold` rows are system
   reference/config data (always in effect in AppSheet; authorized by the
   plan row) — seeding them is NOT a user-data write; no
   `wastewater.reading` row is touched by the migration. Test fixtures, when
   needed for streak semantics, live ONLY inside a single transaction
   ending in ROLLBACK with pre/post row-count proof.
8. **Live-DB caveat (same as P1.001):** the MCP session reachable during
   claim authoring may not be ENV_DB — live verification is an explicit D3
   PREFLIGHT step via the `scripts/apply_migration_api.py` /
   `scripts/introspect_schema_api.py` Management-API path (ENV_DB gate
   artifact + `SELECT MIN(reading_date)` history-bound `effective_from`
   evidence + live `wastewater.threshold` state check). If a discovery above
   does not hold live (e.g. non-empty threshold table, different column
   names), STOP and report — do not improvise.

### Deviations recorded at claim time

- None material. Migration filename pinned as
  `supabase/migrations/20261116000000_parity_p1_003.sql` per the dispatch
  instruction's `<ts>_parity_p1_003.sql` template (house timestamp naming;
  sorts after the delivered `20261115120000_parity_p1_001.sql`).
- Claim-count: instruction's expectation "registry should be 26 claims with
  ENV-PARITY-P1-001-C1 CLOSED" verified true via validate-registry ground
  truth at base (26 claims, ok).

### Binding execution plan (pointer to WO §4)

D2 RED (`scripts/test_parity_p1_003_thresholds.py`: missing seeds/objects +
streak fixtures designed, truthful failure pre-apply) → D3 ONE migration
(`20261116000000_parity_p1_003.sql`) + preflight receipts (ENV_DB gate,
live threshold state, history-bound effective_from, name collisions,
reference-data-only grep) + `scripts/apply_migration_api.py` apply + rollback
SQL documented → D4 battery (FULL vitest, `tsc -b`, lint, Playwright FULL
workers=1, guard 344/344, runtime 62/62, threshold test GREEN, `git diff
--check`; **no version bump — DB logic + reference-data seeds, no
user-facing UI change, reasoning recorded in the D4 log**) → D5 fresh-GLM
independent review at the exact frozen head → **REVIEW_REQUESTED**;
implementer never merges.

### Truth constraints (binding pointer to WO §7)

unknown ≠ 0 (NULL never violates; missing day = no streak; `wastewater_in`
sparse → no fire, never estimated); latest ≠ live; threshold values verbatim
from reference §3.3/§9 (no invented constants; disabled bots stay disabled);
threshold rows = system reference data ≠ user data; พ.ศ. user-facing dates;
no PHI; no durable writes in tests (transaction-scoped fixtures +
ROLLBACK + count proof); no assertion weakening.

## D1 — (empty; no delegated consults were required for this claim — scope,
values, and semantics are fully pinned by the plan row + verbatim reference
§3.3/§9. Any later genuine fork gets its own consult receipt here.)
