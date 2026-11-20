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
