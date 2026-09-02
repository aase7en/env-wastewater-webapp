# ENV-INT-GISTDA-CORE-001 — deterministic GISTDA PM2.5 adapter/parser core

Status: REVIEW_REQUESTED (implementation complete; awaiting independent GPT-5.6 Sol exact-SHA review)
Owner / implementer: GLM-5.3 MAX (Core Engineering)
Independent reviewer / merge owner: GPT-5.6 Sol
Repository: `aase7en/env-wastewater-webapp`
Worktree: `A:\GitHub\envww-env-int-gistda-core-001`
Branch: `feat/env-int-gistda-core-001`
Base: `origin/main@685037e5c6c94bc11bf307ac2b739eaeec3eebd2` (verified 2026-09-03)
Task handoff: `docs/ai/handoffs/ENV-INT-GISTDA-CORE-001-GLM.md`
Last updated: 2026-09-03

Activation authority: `docs/ai/CURRENT-WORK.md` next-safe-action line —
"GLM-5.3 MAX may claim only the bounded ENV-INT-GISTDA-CORE-001
adapter/contract lane after verifying a clean isolated worktree" (verified;
fresh worktree from current origin/main, no prior gistda lane existed).

## Goal

Deliver the provider-specific GISTDA PM2.5 ingestion CONTRACT layer: pure,
deterministic, network-free parsers that turn verified GISTDA payload shapes
into the already-merged ENV-INT provenance/freshness/time core envelopes —
preserving OBSERVED / DERIVED / FORECAST distinctions, the verified
trailing-Z-as-ICT wall-clock semantics, and fail-closed schema-drift/error
boundaries. This consumes `frontend/src/lib/env-int/core/**`; it never
modifies it and never reimplements any of its machinery.

## Non-goals / forbidden scope

No public UI, Hazard Map, Command Center or Operations integration, no public
redistribution/caching decision, no production provider polling, no
real-network CI, no hospital-coordinate query, no HII/TMD, no heat-index/flood
semantics, no DB schema/RLS, no `.env`/secrets, no `.serena/**`. GISTDA public
redistribution/license stays DECISION_REQUIRED; license is `UNVERIFIED`
everywhere. No mutation of `frontend/src/lib/env-int/core/**`, pages,
components, App.tsx, e2e, Operations/Building/Waste-Carbon/Twin files.

## Source-contract evidence (authority)

`A:\GitHub\A-Wiki\inbox\ENV-GLM53-ENV-INT-SOURCE-CONTRACT-001.md` §3 (GISTDA
contract, verified 2026-09-02 by actual HTTP responses), §7 (timestamp matrix:
`dt`/`graphHistory24hrs[i][1]` are Bangkok wall-clock mislabeled Z — parse as
Asia/Bangkok, never +7-shift), §8 (provenance/data-class matrix), §10
(failure/outage semantics), §11 (sanitized fixtures F1/F2/F7/F8/F9), §12
(contract-test plan). Merged core: PR #72 `ffbb740`
(`envIntObservation`, `parseWallClockAs`, `classifyFreshness`, etc.).

### Contract facts pinned by that evidence

- Envelope `{status:number, errMsg:string, data:...}`; `status !== 200` or
  non-empty `errMsg` → provider error; `data: []` possible (empty).
- History product (`getPM25byAmphoe24hrs?ap_idn=1414`):
  `data.graphHistory24hrs: Array<[pm25:number, dt:string]>`,
  `graphMetadata === ["pm25","dt"]`; hourly observed values; trailing-24h mean
  is computed by the official app CLIENT-SIDE (not provider-provided on this
  endpoint — so this adapter does NOT fabricate it here).
- Pred3 product (`getPm25byAmphoePred3?pv_idn=14`): per-amphoe records
  `{ap_tn, ap_en, ap_idn, pm25, dt, pm25Avg24hr, pred1, pred2, pred3}`;
  `pm25` = current hourly analysis (OBSERVED), `pm25Avg24hr` =
  provider-computed trailing mean (DERIVED, 24h), `pred1/2/3` = 3-hourly
  forecast steps (FORECAST); pred fields may be absent per area — render only
  what exists, never cross-fill.
- Forecast step convention: predN valid_at = dt + N×3h; issued_at = dt
  (provider last-point time); horizon "3h_step" — as already pinned by the
  merged core test suite.
- Method label `satellite_ground_calibrated_ai_analysis`; unit `ug/m3`;
  geo `{level:"amphoe", id:1414, label:"อุทัย"}`; timezone `Asia/Bangkok`.
- Attribution floor "GISTDA (เช็คฝุ่น)"; license NOT FOUND → `UNVERIFIED`.

## Settled adapter contract

```
GistdaParseResult<T> =
  | { kind: "ok"; data: T }
  | { kind: "empty" }                    // provider returned no data rows
  | { kind: "target_not_found" }         // data present but amphoe 1414 absent
  | { kind: "schema_mismatch"; reason }  // drift: renamed/missing field, wrong
                                         //   type, NaN/±Infinity, unparseable
                                         //   timestamp, wrong nesting/order
  | { kind: "provider_error"; reason }   // status != 200 / non-empty errMsg
  | { kind: "input_error"; reason }      // caller bug (non-object payload,
                                         //   invalid receivedAt)
```

- `parseGistdaPm25History(payload, receivedAt)` → `{observations:
  EnvIntObservation[]}` — one OBSERVED envelope per history point
  (`source_product "pm25_check_amphoe_24h"`, `aggregation_window "1h"`).
- `parseGistdaPm25Pred3(payload, receivedAt)` → `{current: EnvIntObservation
  (OBSERVED, 1h), average24h: EnvIntObservation | null (DERIVED, "24h";
  null iff provider omitted), forecasts: EnvIntObservation[] (0–3, FORECAST,
  valid = dt+3h·N, issued = dt, horizon "3h_step")}` —
  `source_product "pm25_check_pred3"`.
- All envelopes: provider "GISTDA", merged-core method/url constants,
  `unit "ug/m3"`, geo amphoe 1414, `received_at` = caller-supplied ingest
  clock (validated), `license "UNVERIFIED"`.
- Numeric strings are NEVER coerced to numbers (contract proves `pm25` et al.
  are JSON numbers); NaN/±Infinity are schema mismatches; impossible
  timestamps fail closed into `schema_mismatch`; duplicate history rows pass
  through (not deduped — provider truth); extra unknown fields tolerated when
  contracted fields still prove the structure; `null`/absent optional pred /
  avg fields mean absent (no cross-fill, no fabrication).

## Mutable scope

`frontend/src/lib/env-int/gistda/**` (adapter + tests + fixtures),
`docs/work-orders/ENV-INT-GISTDA-CORE-001.md`,
`docs/ai/handoffs/ENV-INT-GISTDA-CORE-001-GLM.md`. Nothing else. Any need to
touch `env-int/core/**` ⇒ STOP at DECISION_REQUIRED.

## RED matrix (deterministic, sanitized fixtures only)

R1 observed fixture → OBSERVED/amphoe 1414/exact unit+value; R2 trailing-Z →
ICT semantics, no double shift (10:00"Z" ⇒ 03:00Z); R3 received_at stays
caller ingest time; R4 24h average → DERIVED + window, never hourly; R5
pred1/2/3 → FORECAST only; R6 issued/valid/horizon distinct; R7 absent pred
stays absent (no cross-fill); R8 `data:[]` → EMPTY; R9 renamed/missing field →
SCHEMA_MISMATCH (incl. swapped graphMetadata order); R10 wrong primitive type
(numeric string, boolean) → SCHEMA_MISMATCH; R11 NaN/Infinity → mismatch; R12
impossible timestamp → mismatch (fail closed, no throw past boundary); R13
amphoe 1414 absent / unknown categorical → target_not_found, never guessed;
R14 license UNVERIFIED; R15 output never claims LIVE; R16 unit exact; R17
current and 24h average coexist without substitution; R18 malformed forecast
never becomes an observation; R19 no network primitives in adapter (static);
R20 adapter/tests/fixtures import no UI/page/react modules (static). Fuzz
group: null/undefined/empty/whitespace/wrong key case/wrong nesting/duplicate
rows/partial preds/legit 0 vs missing/negative values/future valid_at/
identical issued/valid attempt/received_at before-after/extra fields.

## Verification plan

Focused gistda Vitest → full Vitest → `tsc -b` → oxlint (no new warnings) →
production build → `git diff --check` → changed-file + forbidden-scope audit →
secret-pattern scan → current-main re-reconciliation before freeze. No browser
E2E (pure core slice, no browser-visible behavior).

## Stop conditions

REVIEW_REQUESTED with exact pushed SHA + PR; DECISION_REQUIRED if any source
semantics would need guessing beyond the packet.

## Implementation evidence — 2026-09-03

- **RED (before implementation):** the whole focused suite was blocked by the
  absent module — vitest `Cannot find module './gistda'` + `tsc -b`
  **TS2307** on the same import (the identical honest file-level RED pattern
  the merged ENV-INT-PROVENANCE-001 lane recorded for its own new module).
  Test-plumbing casting was cleaned before RED was frozen so the only
  remaining failure was the module absence itself.
- **Implementation (files, all inside the mutable scope):**
  `frontend/src/lib/env-int/gistda/gistda.ts` (pure adapter: shared envelope
  boundary, contractNumber/optionalContractNumber/contractTime validators,
  `parseGistdaPm25History`, `parseGistdaPm25Pred3`, provider constants incl.
  `GISTDA_ATTRIBUTION`/`GISTDA_LICENSE`), `fixtures.ts` (sanitized packet
  F1/F2/F7/F9 fixtures + RECEIVED_AT ingest clock), `gistda.test.ts`
  (R1–R20 + fuzz group, 25 tests). Imports: only `../core/provenance`,
  `../core/time`, `vitest`, `node:fs`/`node:path` (static scans in tests).
- **GREEN gates:** focused **25/25 PASS**; full Vitest **352/352 PASS**
  (non-secret dummy Supabase env); `tsc -b` PASS; oxlint **12 pre-existing
  warnings / 0 errors** (unchanged baseline); production build PASS (existing
  chunk-size advisory only); `git diff --check` PASS; secret-pattern scan
  clean (no key/token/secret/bearer strings in the lane); changed-file audit
  = 3 code files + this WO + handoff only.
- **Current-main reconciliation:** origin/main re-fetched at freeze — still
  `685037e5c6c94bc11bf307ac2b739eaeec3eebd2` (identical to base; nothing to
  merge).
- **No-network / no-real-write evidence:** adapter module graph is
  gistda.ts → core/* only; static tests R19/R20 pin absence of fetch/
  XMLHttpRequest/axios/http imports and absence of page/component/react
  imports; all fixtures are sanitized packet evidence; no Supabase, no DB,
  no environmental writes of any kind.
- **Browser/E2E not run:** pure Core slice with no browser-visible behavior
  (per WO verification plan; no fake E2E created).
