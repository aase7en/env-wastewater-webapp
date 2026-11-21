# Handoff — ENV-REPAIR-PREVENT-001-GLM (Claim ENV-REPAIR-PREVENT-001-C1, gen 1)

**You (the implementing lane, Track-Z GLM) hold this claim ONLY after the
claim-transition PR merges.** Until then this document is the binding brief.
Worktree `_worktrees/env-repair-prevent-001` (clean, off the post-merge main
tip); implementation branch off that tip (house `feat/env-repair-prevent-001`
form, name pinned at D1). STOP at REVIEW_REQUESTED — you never merge; the
authorized reviewer owns approval + merge of every PR in this lane's chain.
WO `docs/work-orders/ENV-REPAIR-PREVENT-001.md` holds the full binding pins
(§0 the lane identity + the E1–E9 investigation record + the pivot rule,
§1 authorization, §2 the item inventory, §3 out-of-scope guards, §4 NO BUMP,
§5 D-phases, §6 D1 items, §7 scope). Read it before writing anything.
Summary:

## 1. Deliver THIS lane (the repair-lane ledger's two successor candidates, ONE migration)

- **(1) The ingest-sensor service_role write path** — the ledger recorded
  "the ingest-sensor audit exposure on `wastewater.reading`"; the WO §0.1
  repo investigation (E1–E9) CORRECTS the mechanism: `supabase/functions/
  ingest-sensor/index.ts` runs service_role through the DEFAULT-schema
  client (`:36-38`) and its real write paths — `.from("sensor").select(…)`
  `:51-54`, `.from("sensor_reading").insert(rows)` `:72`,
  `.from("sensor").update({ last_seen_at })` `:77-80` — RESOLVE via the
  existing `public.sensor`/`public.sensor_reading` façades (schema5
  `20260719000010:42-43`, security_invoker=on; the notify-threshold PGRST205
  bug class does NOT apply), then FAIL at the security_invoker base-table
  check: service_role holds ZERO wastewater table grants (the repair lane's
  own live D1 probe; schema5 `:21-22` granted wastewater to authenticated
  only; `20261120000001` granted ONLY the notify-threshold + audit-chain
  grants) while Supabase default privileges cover just the public-façade
  layer. ⇒ at owner activation every ingest call 42501-fails at the base
  table, whole batch lost (fail-closed `500`, never a partial write).
  The ledger's audit-chain premise is REFUTED (E7: `trg_audit_log` attaches
  to 12 tables, `wastewater.sensor_reading` EXPLICITLY skipped as
  write-heavy telemetry `20260719000003:15,111`, no trigger on either
  sensor table across ALL migrations; E8: the audit chain is already
  granted role-level — `usage core + insert core.audit_log` to service_role,
  live-proven by the D5 mark-path emulation). The fix is GRANTS-ONLY:
  `grant select on wastewater.sensor to service_role; grant insert on
  wastewater.sensor_reading to service_role; grant update on
  wastewater.sensor to service_role;` (+ `usage` restated idempotently) in
  ONE additive migration. The EF is expected CODE-UNTOUCHED.
- **(2) The queue-façade anon REVOKE** — D5 P3-1: default privileges leave
  SELECT on `public.v_pending_threshold_alerts` attached to
  anon/authenticated (no current data exposure — security_invoker chains to
  wastewater where neither role holds grants; REST anon `401 42501`
  live-verified). The design is service-role-only (the `20261120000001`
  header says so verbatim). Ship the explicit hardening in the SAME
  migration: `revoke select on public.v_pending_threshold_alerts from anon,
  authenticated;`. ONLY this façade — every other public façade's posture
  is an intentional user surface (E9).

## 2. Lure traps (each excluded item needs its own NEW reviewed claim transition)

1. "The ledger said audit exposure — add the audit trigger to the sensor
   tables too" — the exemption IS the recorded design (write-heavy
   telemetry, v2_audit_trigger header); the audit chain is pinned
   READ-ONLY. OUT.
2. "Grant service_role ALL on wastewater while you're there" — the exact
   sensor-path grants only (D1-2); never blanket, never schema-wide.
3. "Revoke anon/authenticated from the other public façades too" — those
   are intentional user surfaces (E9); ONLY the queue façade.
4. "The EF resolves fine, delete the façade lookup / refactor the EF" —
   `index.ts` expected CODE-UNTOUCHED; any touch needs a recorded D1
   contradiction + reviewer adjudication.
5. "Phase 5 is waiting, do the cutover too" — OWNER-GATED, OUT.
6. "Skip the live probe, the repo evidence is enough" — the pivot rule
   (WO §0.1) is binding; evidence-driven, no blind change.
7. "Bump to v1.15.1 since you touched the DB" — NO BUMP (WO §4):
   backend grants/REVOKE + docs on dormant/owner-activated paths; checker
   must stay `OK (v1.15.0)` exit 0.

## 3. Honesty pins (reviewer-pinned)

- unknown ≠ zero / missing ≠ fixed — a probe you cannot run is recorded
  UNVERIFIED, never asserted.
- The ledger correction (§2 row 1a of the WO) is recorded openly in the
  handoff D1 receipts — the predecessor's observation is never silently
  rewritten; the CORRECTED mechanism is what ships.
- Data honesty: ingest-sensor stays fail-closed whole-batch (never a
  partial/pseudo-success write); the emulation is rollback-scoped with
  zero-net durable writes; the telemetry exemption's no-audit-row result is
  recorded either way.
- No PHI: none exists in this chain; never route any patient data anywhere.
- Dates Thai พ.ศ. (+543) + Thai months anywhere user-facing text is touched
  (none expected in this lane).
- Secrets: `SUPABASE_ACCESS_TOKEN` and any credential never printed to
  chat, logs, or receipts; `.env`/`data/raw/` never committed.
- The anon/authenticated fail-closed posture is asserted BEFORE and AFTER
  the REVOKE (`401 42501` both queue paths) — the REVOKE must never open
  anything.

## 4. D-phase plan (mirrors WO §5 — details there)

D1 live privilege/trigger/REST probe + rulings → D2 truthful RED (the NEW
suite `scripts/test_repair_prevent_001_grants.py`: grant assertions +
REVOKE assertions FAIL live pre-apply; audit-path regression pins + anon
fail-closed pins PASS, disclosed) → D3 implement (ONE migration via
`scripts/apply_migration_api.py` with the ENV_DB gate; scope ⊆ WO §7) →
D4 battery (the new suite GREEN + the rollback-scoped service_role
full-path emulation + anon re-probe + guard 344/344 + runtime 62/62 +
validate-registry ok + checker OK v1.15.0 + `git diff --check` clean +
token/JWT-literal grep 0; EF deploy receipt ONLY if index.ts changed) →
D5 fresh-GLM → **STOP at REVIEW_REQUESTED**.

## 5. D1 pins (decide + record in this handoff before D2)

1. The live privilege probes verbatim (has_schema_privilege /
   has_table_privilege service_role on the sensor path; the façade
   aclexplode census for anon/authenticated; expected: sensor-path false,
   queue- façade anon/authenticated SELECT true).
2. The trigger census verbatim (pg_trigger on sensor/sensor_reading/
   reading/threshold_alert; expected: NONE / NONE / trg / trg).
3. D1-1 the mechanism ruling + the pivot decision (binding either way).
4. D1-2 the exact grant set re-derived from the live deltas.
5. D1-3 the REVOKE exact shape + the zero-residual re-probe plan.
6. D1-5 the release ruling confirmation (NO BUMP).
7. D1-6 the ledger completeness check (WO §2, every row adjudicated) +
   the correction note recorded.

## 6. Standing (unchanged by this lane)

Phase 5 คัทโอเวอร์ OWNER-GATED (dual-run ≥14 วัน per plan §6 P5.1 line 271 +
the 5-condition DoD line 276 — the owner's action); the dormant-channel
OWNER ACTIVATION runbook (Telegram credentials via `supabase secrets` +
the vault service_role secret); hooks #155 approved-not-started + #156
OPENROUTER_API_KEY renewal (owner-manual); ENV-BUILDING-REPAIR-001-C1
WAITING_EXTERNAL; the repair-lane carried P3s stay on the ledger (WO §2 /
repair handoff §8.3) — this lane adjudicates ONLY its two candidates and
sweeps nothing else.

---

## 7. D-phase receipts — implementation (2026-11-21, Track-Z GLM)

Branch `feat/env-repair-prevent-001` off `40cab6b76c85a3bf23acff1f21203c2b11c49da2`
(the PR #255 merge tip). All probes through the house Management-API path
(`api.supabase.com/v1/projects/gllqtbyofrcjzmbnfoeh/database/query`); secrets
resolved from the approved Drive secrets file/env — **names only echoed,
values never printed**; `.env`/`data/raw/` never read into the diff.

### D1 — live evidence + rulings (read-only + rollback-scoped; PRE-apply)

1. **Privilege probes (HTTP 201, verbatim):**
   `{"sr_usage_ww": true, "sr_usage_core": true, "anon_usage_ww": false,
   "auth_usage_ww": true}` and
   `{"sr_sel_sensor": false, "sr_ins_sensor": false, "sr_upd_sensor": false,
   "sr_sel_reading": false, "sr_ins_reading": false, "sr_upd_reading": false,
   "sr_del_reading": false}` — service_role held ZERO sensor-path grants
   (E4/E5 live-confirmed); the 20261120000001 chain (usage wastewater/core)
   intact (E8 pin).
2. **Queue-façade census (HTTP 201, verbatim):** `{"anon_sel_facade": true,
   "auth_sel_facade": true, "sr_sel_facade": true}` — the default-privilege
   REVOKE target confirmed (item 2).
3. **Trigger census (HTTP 201, verbatim):** `[{"tbl":"reading","trg":
   "trg_audit_log"},{"tbl":"reading","trg":"trg_persist_parity_alerts"},
   {"tbl":"reading","trg":"trg_persist_threshold_alerts"},{"tbl":
   "threshold_alert","trg":"trg_audit_log"}]` — `sensor`/`sensor_reading`
   NONE (telemetry exemption intact; E7 live-confirmed).
4. **Baselines:** sensor=0, sensor_reading=0, audit_log=40.
5. **THE PRE-FIX EMULATION (rollback-scoped, `begin; insert fixture sensor
   ENV-RP1-PROBE; set local role service_role; … rollback;`) — verbatim:**
   - lookup via `public.sensor` (the EF :51-54 shape):
     `ERROR:  42501: permission denied for table sensor` (HTTP 400);
   - INSERT via `public.sensor_reading` (the EF :72 shape):
     `ERROR:  42501: permission denied for table sensor_reading` (HTTP 400);
   - last_seen UPDATE via `public.sensor` (the EF :77-80 shape):
     `ERROR:  42501: permission denied for table sensor` (HTTP 400);
   - zero-durable re-probe: `{"sensor_n": 0, "reading_n": 0,
     "fixture_left": 0}` — **ROLLBACK LEAVES ZERO DURABLE ROWS**.
6. **Anon REST pre-apply (both queue paths, verbatim):** GET
   `/rest/v1/v_pending_threshold_alerts` → `HTTP 401 {"code":"42501",…,
   "message":"permission denied for view v_pending_threshold_alerts"}`;
   GET `/rest/v1/sensor_reading` → `HTTP 401 {"code":"42501",…,"message":
   "permission denied for table sensor_reading"}` — fail-closed confirmed.
7. **D1-1 mechanism ruling:** E1–E9 CONFIRMED (no contradiction: no
   pre-existing sensor grants, no sensor trigger). **The pivot rule did not
   fire** — grants-only fix, EF code-untouched.
   **Honest refinement recorded (verdict unchanged):** E6 framed the lookup
   as passing "the public-façade layer" — live truth: under
   `security_invoker=on` the base table is the ONLY privilege check (the
   façade ACL is not consulted), so ALL THREE EF steps fail 42501 pre-fix —
   the outage starts at the very first query (`:51-54`), not at the INSERT.
   The observable owner-activation behavior matches the WO conclusion
   exactly (fail-closed 500, whole batch lost); the grant set (D1-2) is
   unchanged; the migration ships as designed.
8. **D1-2 grant set (re-derived from the live deltas):** SELECT on
   `wastewater.sensor` + INSERT on `wastewater.sensor_reading` + UPDATE on
   `wastewater.sensor` (+ `usage` wastewater restated idempotently). uuid
   PK `gen_random_uuid()` — live census: 0 sequences on the sensor path —
   **NO sequence grant** (WO pin). Never GRANT ALL, never blanket (§3.7).
9. **D1-3 REVOKE shape (as WO):** `revoke select on
   public.v_pending_threshold_alerts from anon, authenticated;` + the
   zero-residual re-probe + the service_role-unaffected check — both
   executed post-apply below.
10. **D1-5 release ruling:** NO BUMP confirmed post-battery — checker
    `OK (v1.15.0)` exit 0; zero user-visible change (owner-activated IoT
    ingest + dormant queue channel).
11. **D1-6 ledger completeness:** WO §2 — (1) FIXED (grants), (1a)
    CORRECTED-BY-EVIDENCE (recorded here + §0.1, never a silent rewrite),
    (2) FIXED (REVOKE), regression pins PINNED (group C of the suite),
    everything else FORBIDDEN per §3.

### D2 — TRUTHFUL RED (commit `f771f00`, against the UNAPPLIED state)

`python3 -m pytest scripts/test_repair_prevent_001_grants.py -q` →
**`9 failed, 7 passed`** — verbatim:

```
FAILED TestGrantChain::test_a_service_role_select_sensor
FAILED TestGrantChain::test_b_service_role_insert_sensor_reading
FAILED TestGrantChain::test_c_service_role_update_sensor
FAILED TestQueueFacadeRevoke::test_a_anon_select_revoked
FAILED TestQueueFacadeRevoke::test_b_authenticated_select_revoked
FAILED TestFullPathEmulation::test_a_lookup_select_via_facade
FAILED TestFullPathEmulation::test_b_sensor_reading_insert_via_facade
FAILED TestFullPathEmulation::test_c_last_seen_update_via_facade
FAILED TestFullPathEmulation::test_d_zero_durable_and_no_audit_row
========================= 9 failed, 7 passed =========================
```

Standing passes disclosed per the P2.4 P3-1 convention (7): A.d schema
usage, A.e audit-chain regression pins (usage core + insert core.audit_log +
0-sequence census), B.c service_role façade select, C.a audit-trigger
census, C.b telemetry-exemption census, D.a/D.b anon REST 401 42501 both
paths. Emulation failure messages verbatim: the three `42501` lines of D1 §5.

### D3 — applied + post-verify

`python3 scripts/apply_migration_api.py
supabase/migrations/20261121000000_repair_prevent_001_sensor_grants_queue_revoke.sql`
→ **`6/6 OK, 0 FAIL`** (grants ×4, REVOKE, `notify pgrst, 'reload schema'`).

Post-verify (HTTP 201, verbatim): `{"sr_sel_sensor": true, "sr_ins_sensor":
false, "sr_upd_sensor": true, "sr_ins_reading": true, "sr_usage_ww": true,
"sr_usage_core": true, "sr_ins_audit": true, "anon_sel_facade": false,
"auth_sel_facade": false, "sr_sel_facade": true}` — exact verbs only
(insert-on-sensor stays FALSE), zero anon/authenticated residual,
service_role unaffected, audit chain intact.

**THE POST-FIX EMULATION (same rollback-scoped shape) — verbatim:**
HTTP **201**; inside the tx: `{"fixture_rows": 1, "reading_rows": 1,
"audit_n": 40, "seen_set": true}` — all three EF steps green as
service_role; **`audit_n` stayed 40 → the sensor path produced NO audit row
(telemetry exemption, expected-absent, recorded)**. Zero-durable re-probe:
`{"sensor_n": 0, "reading_n": 0, "audit_n": 40, "fixture_left": 0}` —
**ROLLBACK LEAVES ZERO DURABLE ROWS**. Anon REST re-probe: **401 42501 both
paths post-REVOKE** (nothing opened).

### D4 — battery at the delivered head

- New suite: **16/16 passed** (GREEN post-apply).
- vitest FULL: **53 files, 990 passed + 1 skipped** (designed skip).
- `tsc -b`: exit 0. oxlint: **0 errors**, 19 warnings (the exact
  pre-existing baseline; no frontend file changed).
- Playwright FULL chromium `--workers=1`: **335/335 passed, exit 0**.
- guard: **344 passed + 450 subtests**. runtime: **Ran 62 tests — OK**.
- validate-registry: `{"ok": true, "claims": 50,
  "enforcement_mode": "BOOTSTRAP_CONTROL"}`.
- Release checker: **`RELEASE VERSION CHECK: OK (v1.15.0; CHANGELOG entry
  v1.15.0)` exit 0** — NO BUMP; regression suite 37/37 exit 0.
- `git diff --check`: clean. Token/JWT-literal grep: 0. No bot-token-like
  literals anywhere in the diff.
- **Diff vs base ⊆ §7 (4 files):** the migration + the test script + this
  WO + this handoff. `frontend/` EMPTY; `.github/` EMPTY;
  `supabase/functions/` EMPTY — **EF byte-untouched (§3.5 held; no D1
  contradiction ever justified a code change)**; CURRENT-WORK.md untouched
  (the closeout transition flips the registry, mirroring the PR #152/#161
  convention).

### Deviations

None from the WO/handoff contract. Notes (non-deviations): the D1 §7 honest
refinement (E6's façade-layer framing vs the security_invoker base-table
truth — recorded, verdict + scope unchanged); secrets resolved via process
env from the approved Drive secrets file because this worktree has no `.env`
stub (the P4-lane precedent path; values never printed).

## 8. D6 CLOSEOUT RECEIPT (2026-11-21)

The claim is CLOSED by the docs-only closeout transition off main @
`b52b69e2176b3430366a532f73debe29d7d48731`. Full chain:

**Claim transition — PR #255 merged `40cab6b76c85a3bf23acff1f21203c2b11c49da2`**
(parents `f88157b44bba8fffeef920d852b7d69fe32b986a` + reviewed transition head
`fa3fcebd07748c68b0da0c5bf8d178d030eb75c1`; independent post-merge audit
APPROVED issuecomment-7050697677: fence recomputed byte-exact, JSON-diff
49→50 claims exactly one added, refutation links re-verified).

**Implementation — PR #256 merged `b52b69e2176b3430366a532f73debe29d7d48731`**
(merge commit, no squash; parents EXACTLY (`40cab6b…`,
`a43e2f78b956205de998e86bb60acd3add2724ea`) — the second parent IS the
D5-APPROVED frozen head; expected-head discipline
`gh pr merge --merge --match-head-commit a43e2f78b956205de998e86bb60acd3add2724ea`;
merge-executor review trail issuecomment-7054562832). Merge stat = exactly
4 files 690+/9− (`supabase/migrations/20261121000000_repair_prevent_001_sensor_grants_queue_revoke.sql`
NEW, `scripts/test_repair_prevent_001_grants.py` NEW, this WO, this handoff);
`supabase/functions/` + `frontend/` + `.github/` diffs byte-empty — **the EF
stayed CODE-UNTOUCHED per the pivot rule** (D1 ruled E1–E9 confirmed, no
contradiction). Local main ff-only `40cab6b`→`b52b69e` clean; post-merge at
`b52b69e`: guard 344 passed + 450 subtests, validate-registry
{ok:true, claims:50, BOOTSTRAP_CONTROL}; **deploy honest note: NO Pages run
at `b52b69e`** — only the `test` workflow green (backend-only paths, the
deploy-frontend.yml filter does not match); **NO BUMP — v1.15.0 STAYS, no
tag** (regression checker 37/37).

**D5 fresh-GLM independent review — APPROVED issuecomment-7054487026** at the
exact frozen head `a43e2f7`: 0 P1 / 0 P2 / 2 informational P3 carried to this
ledger, with D5's OWN verification: (a) the grant set VERBS-EXACT against
`supabase/functions/ingest-sensor/index.ts` — lookup SELECT `:51-54` →
`grant select wastewater.sensor`; INSERT `:72` → `grant insert
wastewater.sensor_reading`; last_seen UPDATE `:77-80` → `grant update
wastewater.sensor`; nothing more (no DELETE, no ALL; `sensor_reading` PK is
`uuid DEFAULT gen_random_uuid()` so no sequence grant needed); the REVOKE
scoped to `anon, authenticated` SELECT on `public.v_pending_threshold_alerts`
ONLY, every other public façade untouched; (b) own live probes —
`has_table_privilege` service_role sensor-path all TRUE, the negative
insert-on-sensor pin FALSE, anon/authenticated queue-façade SELECT FALSE,
service_role façade SELECT TRUE, `core` usage + `core.audit_log` INSERT TRUE;
contract suite rerun 16/16; (c) RED truthfulness — the 9F/7P record matches
the derived would-fail set, and D5 re-reproduced the pre-apply outage
itself via rollback-scoped transaction-local revocation (verbatim
`42501: permission denied for table sensor` / `…sensor_reading` on all three
EF steps, zero durable drift 0/0/40). P3s carried: (1) a fresh worktree needs
the gitignored `frontend/.env` copied in or vitest shows 8 file-level
`Missing VITE_SUPABASE_URL` failures — environmental, not code; (2) the test
script's Drive-secrets path follows the pre-existing house pattern
(`test_parity_p4_002_notify.py:119-121`, names-only) — no new exposure.

**THE DELIVERED STORY (refutation → real bug → emulation):**
1. **Refutation** — the repair-lane ledger's recorded premise ("ingest-sensor
   INSERTs would hit the reading table's audit-trigger 42501") was REFUTED by
   repo evidence E7/E8: `trg_audit_log` attaches to 12 tables with
   `wastewater.sensor_reading` EXPLICITLY skipped as write-heavy telemetry
   (`20260719000003:15,111`), NO trigger exists on either sensor table across
   ALL migrations, and the audit chain is ALREADY granted role-level
   (`20261120000001` usage core + insert core.audit_log — the repair lane's
   own D5 mark-path emulation had live-proven it).
2. **The REAL bug (live-confirmed pre-fix)** — `ingest-sensor` runs
   service_role through the default-schema client and resolves via the
   EXISTING `public.sensor`/`public.sensor_reading` security_invoker façades,
   then fails at the base-table check: service_role held ZERO wastewater
   table grants (D1 verbatim `sr_sel/ins/upd_sensor == false`; the only
   to-service_role migration in the repo is `20261120000001`, which omits
   sensor/sensor_reading) ⇒ at owner activation EVERY ingest call
   `42501`-fails, whole batch lost. The pre-fix emulation reproduced the
   outage verbatim on all three EF steps (§7 D1 item 5).
3. **The fix + emulation** — ONE additive migration
   `20261121000000_repair_prevent_001_sensor_grants_queue_revoke.sql`
   (the EXACT EF verbs + usage restatements; the explicit
   `REVOKE SELECT … FROM anon, authenticated` on the queue façade — the
   repair-lane D5 P3-1; `notify pgrst` reload; rollback documented
   in-header, the audit-chain pre-grants correctly excluded from rollback).
   Applied via the ENV_DB-gated helper; post-fix rollback-scoped
   service_role FULL-PATH EMULATION green — all three EF steps HTTP 201
   through the public façades, NO audit row (telemetry exemption intact),
   zero durable rows every batch (0/0/40, fixture residue 0); anon REST
   still 401 `42501` on both queue paths post-REVOKE (fail-closed held).

**Frontier after this closeout merges:** NO active claim. BOTH edge functions
are now ACTIVATION-SAFE — `notify-threshold` fixed by the repair lane
(ENV-REPAIR-P4-LEDGER-001) and `ingest-sensor` by THIS lane — so the
Telegram/sensor channels will work the moment the owner supplies the
tokens/data (`supabase secrets TELEGRAM_*` + the sensor-data source per the
recorded runbooks). The remaining work: the Phase-5 owner checklist (dual-run
≥ 14 วัน start signal, backfill, AppSheet retirement — OWNER-GATED, the
owner's action) + the C8 personnel proposal AWAITING OWNER APPROVAL
(presented in-chat 2026-11-20; execution = a small gated lane once the owner
picks an option). Standing: hooks #155 approved-not-started (owner-manual),
#156 OPENROUTER_API_KEY renewal (owner-manual), Building WAITING_EXTERNAL.
All other work still requires a NEW claim transition; no closed lane confers
execution authority.
