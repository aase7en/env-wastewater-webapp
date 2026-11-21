# Work Order — ENV-REPAIR-PREVENT-001 (Claim ENV-REPAIR-PREVENT-001-C1, gen 1)

**Status: DELIVERED — CLOSED (2026-11-21).**
Claim transition PR #255 merged `40cab6b76c85a3bf23acff1f21203c2b11c49da2`
(parents `f88157b…` + reviewed transition head `fa3fceb…`; independent
audit APPROVED issuecomment-7050697677 — every refutation link re-verified).
Implementation PR #256 merged `b52b69e2176b3430366a532f73debe29d7d48731` —
merge commit, no squash, parents EXACTLY (`40cab6b…`,
`a43e2f78b956205de998e86bb60acd3add2724ea`) with the second parent = the
D5-APPROVED frozen head; expected-head discipline
`gh pr merge --merge --match-head-commit a43e2f78b956205de998e86bb60acd3add2724ea`.
D5 fresh-GLM APPROVED issuecomment-7054487026 at the exact frozen head —
0 P1 / 0 P2, 2 informational P3 carried — with the grant set verified
VERBS-EXACT against the EF's own SQL, own live privilege probes, contract
suite 16/16, and the RED outage reproduced via rollback-scoped revocation
(verbatim 42501 on all three EF steps, counts 0/0/40 drift-free).
Merge-executor review trail issuecomment-7054562832; merge stat = exactly
4 files 690+/9− with `supabase/functions/` + `frontend/` + `.github/` diffs
byte-empty — the EF code-untouched per the pivot rule. Post-merge at
`b52b69e`: guard 344/344 +450 subtests, validate-registry
{ok:true, claims:50, BOOTSTRAP_CONTROL}; **NO Pages run** (backend-only
paths filter — only the `test` workflow green); **NO BUMP — v1.15.0 STAYS,
no tag**. Closeout receipts: the registry record (status CLOSED +
one_next_safe_action), this file, and handoff §8 D6 CLOSEOUT RECEIPT.
The D-phase log below (§8) and the original claim text are preserved
verbatim.

Preventive repair — TWO items from the repair-lane (ENV-REPAIR-P4-LEDGER-001,
PR #253/#254) closeout ledger's successor candidates:

1. **the ingest-sensor audit exposure** — the ledger recorded the adjacent
   observation that `wastewater.reading` carries the audit trigger
   `trg_audit_log`, so "`ingest-sensor`'s service_role INSERTs would hit the
   same 42501" (handoff `ENV-REPAIR-P4-LEDGER-001-GLM.md` §7 D3 + §8.3).
   This WO's repo-side investigation (§0.1 E1–E9) **refutes the recorded
   mechanism and replaces it with a REAL, evidence-pinned one**: the EF's
   actual write targets carry NO audit trigger, and the audit chain is
   already granted to service_role at ROLE level — the REAL exposure is the
   missing service_role grant chain on the security_invoker sensor façades.
2. **the façade anon hardening** — D5 P3-1: Supabase default privileges
   leave SELECT on `public.v_pending_threshold_alerts` attached to
   anon/authenticated (no current data exposure — live-verified; the
   recorded successor = the explicit REVOKE).

NO Phase 5. NO feature surfaces. NO CI. NO BUMP.

## 0. Lane identity — the ledger successor candidates pinned VERBATIM

> (repair handoff §8.3, D5 ledger, verbatim) **Adjacent successor observation
> (honestly recorded, untouched):** `wastewater.reading` carries the same
> audit trigger — a service_role INSERT through ingest-sensor would hit the
> same `42501`. Successor-lane material; can ride a future lane or a batch
> with P3-1.

> (repair handoff §7 D3, verbatim) …service_role had no core grants, so EVERY
> mark UPDATE — on any audited table — would fail and rows would queue
> forever. The migration was supplemented … with the exact write path only:
> `grant usage on schema core to service_role; grant insert on core.audit_log
> to service_role;` (no read/update/delete on audit history).

> (D5 ledger P3-1, verbatim) Supabase default privileges leave SELECT on
> public.v_pending_threshold_alerts attached to anon/authenticated — no
> current exposure because security_invoker chains to wastewater where
> neither role holds grants (REST anon 401 42501 verified) … successor
> `REVOKE SELECT … FROM anon, authenticated`.

### 0.1 Investigation record (repo-side evidence at base — LIVE re-verification still REQUIRED at implementation D1)

| # | Evidence | File:line | Fact |
|---|----------|-----------|------|
| E1 | The EF runs as service_role via the DEFAULT-schema client | `supabase/functions/ingest-sensor/index.ts:8` + `:36-38` | auth contract "callers must present the service_role key"; `createClient(url, serviceKey)` with NO `db: { schema }` ⇒ PostgREST `Accept-Profile: public` |
| E2 | The EF's exact write paths | `index.ts:51-54` / `:72` / `:77-80` | `.from("sensor").select("id, code").in("code", codes)` (lookup) → `.from("sensor_reading").insert(rows)` → `.from("sensor").update({ last_seen_at })`; whole-batch fail-closed on any error (`500 {error}`, batch lost) |
| E3 | The REST targets RESOLVE — the notify-threshold PGRST205 bug class does NOT apply | `supabase/migrations/20260719000010_schema5_rest_exposure.sql:42-43` | `public.sensor` + `public.sensor_reading` façades EXIST (`security_invoker=on`) — the EF's default-schema client resolves both |
| E4 | security_invoker checks the INVOKER on the base tables | schema5 `:42-43` posture + the repair lane's live D1 probe (recorded verbatim in `20261120000001`'s header comment) | "service_role held ZERO wastewater grants (has_schema_privilege usage=false; select/update on wastewater.threshold_alert=false)"; schema5 `:21-22` granted the wastewater tables to **authenticated** only |
| E5 | The ONLY service_role grants ever shipped | `supabase/migrations/20261120000001_repair_p4_ledger_queue_facade.sql` (grep "to service_role" across all 61 migrations ⇒ this ONE file) | `usage` schema wastewater + `select` wastewater.v_pending_threshold_alerts + `select,update` wastewater.threshold_alert + `select` public façade + `usage` schema core + `insert` core.audit_log — **sensor/sensor_reading ABSENT** |
| E6 | Supabase default privileges cover only the PUBLIC-façade layer for service_role | repair-lane D1 live receipt (handoff §7 D1) | "select/update on the `public.threshold_alert` façade = **true** (Supabase default privileges in public)" vs base-table = false ⇒ the façade layer passes, the security_invoker base-table check fails |
| E7 | The AUDIT-chain premise is REFUTED for ingest-sensor | `supabase/migrations/20260719000003_v2_audit_trigger.sql:15` + `:111` + the full attach list | `trg_audit_log` EXPLICITLY SKIPS telemetry ("wastewater.sensor_reading would be too write-heavy for an audit trigger"); attached to 12 tables incl. `wastewater.reading` + `wastewater.threshold_alert`; `20260810000000_auditfix_a` adds `core.ai_provider` + `core.attachment` only; grep across ALL migrations: `trg_audit_log ON wastewater` = reading + threshold_alert exactly; ingest-sensor NEVER writes `wastewater.reading` |
| E8 | The audit chain is ALREADY granted at ROLE level | `20261120000001` (same migration) + the D5 live emulation | `grant usage on schema core to service_role; grant insert on core.audit_log to service_role;` — proven live by the D5 rollback-scoped mark-path emulation with the audit INSERT included; `core.fn_audit_log` needs INSERT only (uuid PK `gen_random_uuid()`, explicit VALUES, no sequence) and service_role bypasses RLS (policies TO authenticated only) |
| E9 | Item-2 authority + scope precision | D5 ledger P3-1 + the `20261120000001` header comment | "No anon/authenticated grant: this façade is the EF's work queue, not a user surface" — yet default privileges auto-attached SELECT to anon/authenticated (no current data exposure: security_invoker chains to wastewater where neither role holds grants; REST anon `401 42501` live-verified on both paths); every OTHER public façade's anon/authenticated posture is an intentional user surface (schema5 `:73-74`) — ONLY the queue façade is in scope |

**Working conclusion:** the ledger's successor candidate is REAL but its
recorded mechanism is WRONG (honest correction, never silently rewritten —
§2 row 2): ingest-sensor's INSERTs/UPDATEs pass the public-façade layer
(E6) and FAIL at the security_invoker base-table check — the `42501
permission denied for table sensor_reading/sensor` class (E4/E5) — at owner
activation, with whole-batch loss per E2. The audit-chain 42501 the ledger
described cannot fire on the EF's paths (E7) and is already mitigated
role-level even where the chain exists (E8). **This is evidence-based, not
blind change:** the live D1 probe (§5) must CONFIRM E1–E9 before the
migration ships; if the live probe contradicts them (e.g. service_role
already holds the sensor grants; a trigger exists on a sensor table), the
lane pivots to document-why + regression pin with `index.ts` code-untouched
and the migration shrinks to the REVOKE-only form (or nothing).

## 1. Authorization basis

1. Owner standing Goal-mode instruction 2026-11-15/16 ("ต่อยาวๆ ตามแผนและ
   roadmap ที่วางไว้").
2. Owner instruction 2026-11-20 "มีส่วนไหนที่ทำไปก่อนได้บ้างระหว่างรอส่วนของฉัน"
   (do what can be done while waiting for the owner's parts; the owner's own
   pending items stay parked).
3. **The repair-lane closeout frontier** (PR #254 merged as `f88157b` = this
   base) explicitly recording the successor-lane candidates ("the
   ingest-sensor audit exposure on `wastewater.reading`; the anon-REVOKE on
   the façade … OPTIONAL and can ride future lanes or a batch") — THIS claim
   IS that transition (both items, ONE lane, scoped §2/§7).
4. The repair-lane D5 ledger (issuecomment-7031647410: P3-1 the façade
   anon/authenticated default-privilege SELECT + the adjacent
   ingest-sensor audit-trigger observation) + the repair handoff §7 D3
   audit-chain discovery + §8.3 successor record.

## 2. The item inventory — every carried candidate adjudicated (none silently dropped)

| Item | Source | Ruling | Where it lands |
|------|--------|--------|----------------|
| (1) ingest-sensor service_role write path fails at owner activation (E1–E6) | repair handoff §7/§8.3 adjacent observation | **INVESTIGATE → FIX-GRANTS** (ONE additive migration granting the EXACT sensor-path chain; the pivot rule of §0.1 is binding — live probe first, never blind) | implementation D1 → D2 RED → D3 |
| (1a) the ledger's audit-chain MECHANISM premise | handoff §8.3 | **CORRECTED-BY-EVIDENCE** (WO §0.1 E7/E8: no `trg_audit_log` on either sensor table — telemetry exempt BY DESIGN, never "fixed"; the audit chain already granted role-level) — recorded in this WO + the lane handoff, re-verified live at D1 | §0.1 + D1 receipt |
| (2) `public.v_pending_threshold_alerts` carries anon/authenticated SELECT via default privileges | D5 ledger P3-1 | **REVOKE** (explicit `revoke select on public.v_pending_threshold_alerts from anon, authenticated;` — service-role-only is the recorded design; defense-in-depth, no current exposure) | implementation D3, same migration |
| Regression pins — the audit-path invariants this lane must not disturb | this WO | **PIN-TESTS** in the NEW suite: `trg_audit_log` alive on `wastewater.reading` + `wastewater.threshold_alert`; the telemetry exemption intact (NO trigger on sensor/sensor_reading); `USAGE core + INSERT core.audit_log` present for service_role (the repair grant must not regress); anon REST stays `401 42501` on both queue paths before AND after | D2/D4 |
| Everything else — Phase 5, feature surfaces, other façades' grant posture, the telemetry audit exemption itself, EF rewrites, notify-* files, CI, release bump, credentials | — | **FORBIDDEN** (§3) | out |

## 3. Out-of-scope guards (lure traps — each excluded item needs its own NEW reviewed claim transition)

1. **Phase 5 cutover of any kind** — dual-run, backfill, AppSheet retirement:
   OWNER-GATED (the owner's action), never this lane.
2. **Feature surfaces** — every delivered frontend page/lib byte-untouched
   (`frontend/` zero diff expected; the FULL frontend battery is the
   no-regression gate if any surface file appears in the diff).
3. **CI** — `.github/**` untouched; no new workflows.
4. **Reference/plan docs** — `APPSHEET-PARITY-PLAN.md`, reference 12,
   AGENTS.md, design docs: read-only.
5. **No EF rewrite** — `supabase/functions/ingest-sensor/index.ts` is
   expected CODE-UNTOUCHED (E3: resolution is fine; the fix is grants-only);
   `notify-threshold/**` + `notify-monthly-report/**` stay byte-untouched.
   ANY index.ts touch requires a recorded D1 contradiction + reviewer
   adjudication.
6. **No audit-chain modification** — `core.fn_audit_log`, `trg_audit_log`,
   `core.audit_log`, the RLS policies, and the telemetry exemption are
   consumed/pinned READ-ONLY; never "fix" the exemption (it is the recorded
   write-heavy design, v2_audit_trigger header).
7. **No grant/revoke sprawl** — ONLY the exact sensor-path service_role
   grants + the ONE queue-façade REVOKE; no `GRANT ALL`, no blanket schema
   grants, no other façade's posture touched (E9), no anon/authenticated
   addition anywhere.
8. **The Telegram channel stays dormant** — no credentials are created,
   read, committed, or printed (ห้าม commit ทุกกรณี, owner B5).
9. **No blind schema change** — the migration ships ONLY after the live D1
   probe confirms E1–E9; a contradiction pivots per §0.1.
10. **No release bump** — §4.

## 4. Release decision — NO BUMP (D1-5 recommends; reviewer confirms)

**v1.15.0 STAYS, no tag, no CHANGELOG touch.** Justification: the
deliverables are backend grants/REVOKE + docs on owner-activated/dormant
paths (ingest-sensor is IoT-ingest awaiting owner deployment; the notify
queue is the dormant channel) — zero user-visible change; mirrors the P4.2
D1-6 dormant-channel ruling, the P3.6 test-only ruling, and the repair
lane's NO-BUMP precedent. `check_release_version.py` must stay
`OK (v1.15.0)` exit 0 at the implementation head; `frontend/package.json`
+ `CHANGELOG.md` byte-untouched.

## 5. D-phase plan (Track-Z GLM)

- **D1 — live evidence + rulings (read-only):** the privilege probes
  (`has_schema_privilege` service_role on wastewater/core;
  `has_table_privilege` service_role SELECT/INSERT/UPDATE on
  `wastewater.sensor`/`wastewater.sensor_reading`; the façade
  `aclexplode`/information_schema census for anon/authenticated on
  `public.v_pending_threshold_alerts`); the trigger census (`pg_trigger` on
  the four sensor-path tables + `wastewater.reading` +
  `wastewater.threshold_alert`); the anon REST probes (GET
  `v_pending_threshold_alerts` + `sensor_reading` anon-bearer — expect
  `401 42501`, zero data, zero writes); the rulings D1-1…D1-6 recorded in
  the lane handoff. Probe failure/contradiction = pivot per §0.1.
- **D2 — truthful RED:** the NEW suite `scripts/test_repair_prevent_001_grants.py`
  (house live-DB gate per the `test_parity_p4_002_notify.py` precedent):
  the grant-chain assertions FAIL live pre-apply; the REVOKE assertions
  FAIL live (anon/authenticated hold SELECT); the audit-path regression
  pins + the anon fail-closed pins PASS (standing passes disclosed verbatim
  per the P2.4 P3-1 convention). Counts verbatim in the handoff.
- **D3 — implement:** ONE additive migration (filename pinned at D1;
  proposed `supabase/migrations/20261121000000_repair_prevent_001_sensor_grants_queue_revoke.sql`;
  a live-evidence re-pin is recorded, never silent): `grant select on
  wastewater.sensor to service_role;` + `grant insert on
  wastewater.sensor_reading to service_role;` + `grant update on
  wastewater.sensor to service_role;` (+ the `usage` grants restated
  idempotently) + `revoke select on public.v_pending_threshold_alerts from
  anon, authenticated;` + `notify pgrst, 'reload schema';` — applied via the
  house path `scripts/apply_migration_api.py` with the ENV_DB gate. NO EF
  change expected; deploy receipt ONLY if `index.ts` changed (not expected).
- **D4 — battery:** the NEW suite GREEN (grant + REVOKE assertions pass;
  audit pins stay green); the rollback-scoped service_role FULL-PATH
  emulation (`begin;` lookup SELECT + `sensor_reading` INSERT +
  `last_seen_at` UPDATE through the façades + verify the telemetry
  exemption produced NO audit row — expected-absent, recorded either way —
  + `rollback;` zero-net); the anon REST re-probe `401 42501` both queue
  paths; guard 344/344; runtime 62/62; validate-registry ok;
  `check_release_version.py OK (v1.15.0)` exit 0; `git diff --check` clean;
  token/JWT-literal grep 0; diff vs base ⊆ §7.
- **D5 — fresh-GLM independent review** at the exact frozen head.
- **STOP at REVIEW_REQUESTED** — implementer never merges.

## 6. D1 adjudication items (reviewer)

- **D1-1 the mechanism ruling (THE adversarial item):** does the live
  evidence confirm E1–E9 (grants-gap exposure, audit-chain refuted) or
  contradict it (grants already present / a sensor trigger exists)? The
  pivot rule of §0.1 is binding either way; no blind fix; the ledger
  correction (§2 row 1a) is itself an adversarial check item.
- **D1-2 the exact grant set:** SELECT on `wastewater.sensor` (the `:51-54`
  lookup), INSERT on `wastewater.sensor_reading` (`:72`; uuid PK
  `gen_random_uuid()` — NO sequence grant), UPDATE on `wastewater.sensor`
  (`:77-80`) — the EF's real paths ONLY; the exact set re-derived from the
  live `has_*_privilege` deltas; never `GRANT ALL`, never blanket.
- **D1-3 the REVOKE exact shape:** `revoke select on
  public.v_pending_threshold_alerts from anon, authenticated;` + a zero-
  residual privilege re-probe + the service_role unaffected check (public
  defaults) + anon REST `42501` both paths before/after.
- **D1-4 test-suite bounds:** the NEW suite pins THIS lane's surfaces only
  (the 4 sensor-path privileges, the 6 grant-chain invariants, the queue
  façade, the 2 trigger pins + 2 exemption pins, the anon probes); no
  repo-wide trigger-census creep; the audit chain is asserted, never
  modified.
- **D1-5 the release ruling:** NO BUMP per §4 (adversarial check: any
  user-visible behavior change that would force even PATCH — the expected
  answer is none; both paths are owner-activated/dormant).
- **D1-6 ledger completeness:** §2 above — every candidate FIXED /
  CORRECTED-BY-EVIDENCE / PINNED / FORBIDDEN with its justification; the
  correction recorded, never a silent rewrite of the predecessor ledger.

## 7. Registry-scope summary (mirrors the CURRENT-WORK claim append)

Claimed: ONE additive `supabase/migrations/` file (the sensor-path grants +
the queue-façade REVOKE) + the NEW test script
`scripts/test_repair_prevent_001_grants.py` + `supabase/functions/ingest-sensor/index.ts`
CONDITIONALLY (expected code-untouched; only per a recorded D1
contradiction) + this lane's WO/handoff + `docs/ai/CURRENT-WORK.md`.
Everything else FORBIDDEN (§3).

## 8. D-phase log (implementation receipts — 2026-11-21; full verbatim transcripts in the lane handoff)

- **D1 — LIVE GATE, pre-apply (all probes HTTP-verified; read-only + rollback-scoped):**
  - Privileges: service_role on `wastewater.sensor`/`wastewater.sensor_reading`
    select/insert/update **ALL false** (exposure confirmed); `usage`
    wastewater/core **true** (20261120000001 chain intact).
  - Queue façade census: anon SELECT **true**, authenticated SELECT **true**
    (default-privilege residue — the REVOKE target), service_role SELECT true.
  - Trigger census: `trg_audit_log` on `reading` + `threshold_alert` only;
    `sensor`/`sensor_reading` **NONE** (telemetry exemption intact — E7 live).
  - **The pre-fix emulation, verbatim (rollback-scoped, fixture
    `ENV-RP1-PROBE`, `begin; … rollback;`):**
    - lookup via `public.sensor` → `ERROR: 42501: permission denied for
      table sensor`;
    - INSERT via `public.sensor_reading` → `ERROR: 42501: permission denied
      for table sensor_reading`;
    - last_seen UPDATE via `public.sensor` → `ERROR: 42501: permission
      denied for table sensor`.
    - Zero-durable post-emulation: counts 0/0/40 unchanged, fixture residue 0.
  - Anon REST both queue paths pre-apply: **401 `{"code":"42501"}`**.
  - Honest refinement (verdict unchanged): E6 framed the lookup as passing
    "the façade layer" — live truth: under `security_invoker=on` the base
    table is the ONLY check, so ALL THREE steps fail 42501 pre-fix (even
    earlier than E2/E6 framed). No pivot trigger fired (no pre-existing
    grants; no sensor trigger) — the pivot rule is satisfied, grants-only
    fix proceeded, EF code-untouched.
- **D2 — TRUTHFUL RED** (`scripts/test_repair_prevent_001_grants.py`, commit
  `f771f00`, run against the UNAPPLIED state): **9 failed / 7 passed** —
  RED = the 3 grant deltas (A.a–A.c), the 2 REVOKE assertions (B.a–B.b, the
  default-privilege residue), the 4 emulation tests (E.a–E.d, the verbatim
  42501s above); standing passes disclosed per the P2.4 P3-1 convention (7):
  A.d schema usage, A.e audit-chain regression pins, B.c service_role façade
  select, C.a audit-trigger census, C.b telemetry exemption, D.a/D.b anon
  REST 401 42501 both paths.
- **D3 — APPLIED** via `scripts/apply_migration_api.py` (ENV_DB gate):
  `supabase/migrations/20261121000000_repair_prevent_001_sensor_grants_queue_revoke.sql`
  — **6/6 statements OK, 0 FAIL** (grants + REVOKE + pgrst reload).
  Post-verify: exact grant set true (select sensor / insert sensor_reading /
  update sensor; insert-on-sensor stays FALSE — exact verbs only);
  anon/authenticated SELECT on the façade **false** (zero residual);
  service_role façade select **true** (unaffected); audit chain intact.
  **Post-fix emulation (same rollback-scoped shape): HTTP 201 — all three
  EF steps green; audit_n stayed 40 inside the tx (NO audit row — exemption
  confirmed live); rollback left 0/0/40 + fixture residue 0.** Anon REST
  re-probe: **401 42501 both paths** (the REVOKE never opened anything).
- **D4 — battery at the delivered head:** new suite **16/16 GREEN**; vitest
  FULL **53 files, 990 passed + 1 skipped** (designed skip); `tsc -b` exit 0;
  oxlint **0 errors** (19 pre-existing warnings, exactly the historical
  baseline; 0 in changed files — no frontend files changed); Playwright FULL
  chromium `--workers=1` **335/335 exit 0**; guard **344/344 + 450 subtests**;
  runtime **62/62 OK**; validate-registry `{ok:true, claims:50,
  enforcement_mode:BOOTSTRAP_CONTROL}`; release checker **OK (v1.15.0;
  CHANGELOG entry v1.15.0) exit 0 — NO BUMP confirmed** (regression suite
  37/37); `git diff --check` clean; token/JWT-literal grep 0; **diff vs base
  ⊆ §7** (4 files: migration + test script + this WO + the handoff —
  `frontend/`, `.github/`, `supabase/functions/` EMPTY, EF byte-untouched).
- **STOP — REVIEW_REQUESTED.** D5 fresh-GLM independent review at the exact
  frozen head; the implementer never merges.
