# ENV-INT-GISTDA-CORE-001 — GLM task handoff (continuity packet)

Task: deterministic GISTDA PM2.5 adapter/parser/normalization core consuming
the merged ENV-INT provenance/freshness/time core. Provider-specific
CONTRACT layer only — no UI, no polling, no redistribution, no schema, no
network code.

Owner: GLM-5.3 MAX (implementation). Independent reviewer / merge owner:
GPT-5.6 Sol. Task-specific continuity file; global SSoT untouched by this
lane.

## Fixed identity

- Repository: `aase7en/env-wastewater-webapp`
- Worktree: `A:\GitHub\envww-env-int-gistda-core-001`
- Branch: `feat/env-int-gistda-core-001`
- Base: `origin/main@685037e5c6c94bc11bf307ac2b739eaeec3eebd2` (verified
  2026-09-03; re-fetched at freeze — unchanged, no merge needed)
- Contract: `docs/work-orders/ENV-INT-GISTDA-CORE-001.md`
- Activation authority: CURRENT-WORK next-safe-action line explicitly
  authorizing GLM to claim this bounded lane after a clean isolated worktree.

## Source-contract evidence

`A:\GitHub\A-Wiki\inbox\ENV-GLM53-ENV-INT-SOURCE-CONTRACT-001.md` §3/§7/§8/
§10/§11/§12 (verified by actual provider responses 2026-09-02): envelope
`{status,errMsg,data}`; history `graphHistory24hrs:[pm25,dt]` with
`graphMetadata === ["pm25","dt"]`; Pred3 per-amphoe records
`{ap_idn,pm25,dt,pm25Avg24hr,pred1..3}`; trailing-Z-as-ICT time trap; pred
fields may be absent per area (no cross-fill); license NOT FOUND →
UNVERIFIED; attribution floor "GISTDA (เช็คฝุ่น)". Forecast step convention
predN = dt + N×3h pinned by the merged core test suite.

## Delivered contract (summary)

- `parseGistdaPm25History(payload, receivedAt)` → OBSERVED hourly envelopes
  (`pm25_check_amphoe_24h`, window "1h"); NO client-side 24h mean fabrication
  (official app computes it; provider does not send it on this endpoint).
- `parseGistdaPm25Pred3(payload, receivedAt)` → current OBSERVED (1h) +
  average24h DERIVED ("24h", null iff omitted) + 0–3 FORECAST envelopes
  ("3h_step", valid=dt+3h·N, issued=dt).
- Fail-closed result union: `ok | empty | target_not_found |
  schema_mismatch | provider_error | input_error`; numeric strings never
  coerced; NaN/±Infinity = mismatch; impossible timestamps → mismatch (the
  merged `parseWallClockAs` throw is caught at the adapter seam);
  duplicate rows pass through; extra unknown fields tolerated when
  contracted fields still prove structure; absent-by-omission OR null
  optional fields stay absent.

## Evidence (2026-09-03)

- RED: vitest `Cannot find module './gistda'` + `tsc` TS2307 (file-level,
  new-module RED pattern; plumbing cleaned so nothing else failed).
- GREEN: focused **25/25**; full Vitest **352/352** (dummy env); `tsc -b`
  PASS; oxlint 12 pre-existing warnings / 0 errors; production build PASS;
  `git diff --check` PASS; secret scan clean; changed files = 3 lane code
  files + WO + this handoff. No network (static R19), no UI imports
  (static R20), no real writes.
- Known risks: Pred3 record envelope shape (`data` array) is inferred from
  the packet's envelope rule + F2 record fixture (per-record shape is
  verbatim; the array wrapper is the standard envelope pattern) — any future
  live-verification WO must confirm once against a real response; pred
  step = 3h follows the merged core test convention; GISTDA license stays
  UNVERIFIED — public redistribution remains DECISION_REQUIRED.

## Review request

GPT-5.6 Sol: fresh detached exact-SHA independent Standards + Spec/
Data-Honesty review of the PR head (IMPLEMENTATION_SHA + PR recorded at
push; this handoff is committed inside the candidate). GLM does not
self-approve; GLM does not merge.

## One next safe action

"GPT-5.6 Sol performs a fresh detached exact-SHA independent Standards +
Spec/Data-Honesty review."
