# ENV-FLEET-ROUTER-001 — Live JEV Route + Terra Admission + Delegated-Decision Policy (Work Order, C1 slice)

Status: IN PROGRESS — D2/D3/D3b delivered; stop at `REVIEW_REQUESTED` (this lane
never merges its own PR). Task: `ENV-FLEET-ROUTER-001`. Claim:
`ENV-FLEET-ROUTER-001-C1` (generation 1, registered via PR #151, merge
`3b5ab26`). Base: implementation branch `feat/env-fleet-router-001` cut from
`3b5ab26d081f2256098c4fef20274a1b3a61139a` (the reviewed claim-transition
merge; claim base `beb083e` is its ancestor). Lane worktree:
`_worktrees/env-fleet-router-001`. Registered by: GLM-5.3 MAX coordinator
(claim-transition author). Review owner (implementation PR): fresh-GLM
independent exact-SHA review — ordinary R2 floor per the owner routing policy
2026-10-07 (cross-model R3 where admission allows; GPT-6.1 Terra admitted
2026-11-08 and eligible as cross-model reviewer; GPT-6 Astra prohibited;
never author-and-approve; never silent downgrade). The AUTHORIZATION BASIS
(below) is an explicit adversarial review check item — insufficient basis
parks the claim unmerged.

## Defect/need origin (stale SSoT vs live evidence)

The fleet-router SSoT recorded a stale provider state that live 2026-11-08
evidence contradicts:

1. `scripts/env_autonomy_runtime.py` reported the JEV read-only advisory
   route `UNAVAILABLE` (`NO_SUPPORTED_LIVE_JEV_ROUTE`, the `route_state`
   block at ~line 313 pre-slice) — but a supported live route exists:
   TypeSafe-direct `https://api.typesafe.ai/v1/systemone` with model
   `jev-1.14.0` (public id `typesafe/jev-1.14`), Bearer `$TYPESAFE_API_KEY`,
   proven by a full decision consult HTTP 200 on 2026-11-08 (receipt
   `/tmp/jev-typesafe-direct-2026-11-08.json`, copied durable into the
   handoff). The OpenRouter mirror endpoint
   (`openrouter.ai/api/alpha/decisions`) EXISTS but this account's
   `OPENROUTER_API_KEY` is INVALID — 401 "User not found." receipts
   (`/tmp/jev-consult-2026-11-08.json`,
   `/tmp/terra-consult-2026-11-08.json`); the mirror is never presented as
   working.
2. `gpt-6.1-terra` passed a fresh-fingerprint single-probe admission
   (ADMISSION_OK 2026-11-08, first attempt, one probe permitted per the
   2026-10-12 policy) via the ChatGPT-desktop Codex CLI, session
   `01a1bc81-76c7-7543-b354-7814bc92e3bb` (receipt
   `/tmp/terra-codex-2026-11-08.json`) — but no router table recorded the
   admission. GPT-6 Astra stays prohibited; the gpt-6.1-sol
   entitlement-block record is unchanged.
3. The owner's 2026-11-08 Goal-mode delegated-decision policy (non-human
   decisions delegated JOINTLY to Jev + GPT-6.1 Terra; human-reserved:
   domain-owner numeric gate N1–N4, personal harness state, real-data
   operations) existed only in chat/claim-dependency text — no queryable
   record in the router module or SKILL.md.

## Authorization basis

1. **Owner instruction 2026-11-08 (Goal mode):** continue all
   unstuck-able work; delegate non-human decisions jointly to Jev AI
   (Typesafe, OpenRouter) and GPT-6.1 terra (OpenAI); reserve
   truly-human-only decisions (domain-owner numeric gate N1–N4, personal
   harness state, real-data operations). Recorded verbatim-substance in the
   handoff.
2. **Delegate joint decision D5 2026-11-08 (unanimous `run_small_claim_now`):**
   both delegates independently returned `run_small_claim_now` for the
   fleet-router SSoT honesty item (Jev confidence 0.82; Terra
   `run_small_claim_now` with the note "route existence alone does not
   authorize dispatch"). This slice is exactly that small claimed SSoT
   correction. The same delegate round also produced: defer 001C (unanimous),
   defer hook proposal (unanimous), close PRs 87+88 (unanimous), PR85 split
   (Jev close 0.99 / Terra keep-as-recorded-proposal; recorded outcome: keep
   85 per the registry's standing preserve-as-proposal instruction —
   conservative split resolution), close issues 94+101 / keep 110 (unanimous),
   numeric recommendation split (N1 defer both; N3 approve both; N2/N4
   split) presented to the owner — the numeric gate itself stays a
   human-reserved decision.

## Deliverable design (D-plan)

- **D1 (this work order + handoff skeleton):** scope, authorization, and
  receipt plan frozen before mutation.
- **D2 (GLM, RED-first):** new-state runtime tests — JEV route reports
  `LIVE` with the TypeSafe-direct endpoint/model/public-id metadata, the
  401 key-invalid mirror caveat, and the fail-closed
  `jev_available=False` fallback; `gpt-6.1 terra` in `SUPPORTED_MODELS`
  with the `TERRA_ADMISSION` record and cross-model reviewer/consult fit;
  the `delegated_decision_policy()` queryable helper. The stale
  `UNAVAILABLE` assertion in `test_route_fit_enforces_model_task_boundaries`
  is updated to the new state. Baseline run at branch tip (runtime
  untouched): 62 tests, 2 failures + 2 errors (documented in the handoff).
- **D3 (GLM, Track Z):** implement in `scripts/env_autonomy_runtime.py`
  (`JEV_LIVE_ROUTE`, `TERRA_ADMISSION`, `DELEGATED_DECISION_POLICY` +
  helper, `SUPPORTED_MODELS` terra entry, shared cross-model lane lock,
  `select_route` default flip + JEV live branch) and
  `.agents/skills/env-fleet-router/SKILL.md` (live JEV row with the
  read-only advisory boundary intact; terra admission bullet; delegation
  policy bullet). Nothing else in either file.
- **D3b (GLM):** this work order + the handoff with D1–D4 receipts and
  verbatim durable copies of all four consult receipts.
- **D4 (GLM):** battery — full runtime suite (58 + 4 new = 62 green),
  guard suite 344/344, `validate-registry` ok:true on the untouched
  CURRENT-WORK registry (17 claims), scope-exact diff vs `3b5ab26` (exactly
  the 5 mutable files; `docs/ai/CURRENT-WORK.md` diff EMPTY), `git diff
  --check` clean.
- **D5:** independent review at the exact frozen head (fresh-GLM R2 floor;
  authorization basis as an explicit adversarial check item).
- **D6:** expected-head merge + exact-main CI verify + closeout transition
  (by the authorized reviewer, never this lane).

Fail-closed semantics unchanged: `route` never dispatches; JEV stays
`dispatch_allowed: false` and strictly read-only advisory; terra routes stay
`ADMISSION_REQUIRED` semantics via the shared lane locks and never become a
default; the adapter has no provider dispatch implementation and remains
`AUTONOMY_NOT_READY`.

## Scope (mutable, exactly — identical to the registry claim entry)

- `.agents/skills/env-fleet-router/SKILL.md`
- `scripts/env_autonomy_runtime.py`
- `scripts/test_env_autonomy_runtime.py`
- `docs/work-orders/ENV-FLEET-ROUTER-001.md` (this WO)
- `docs/ai/handoffs/ENV-FLEET-ROUTER-001-GLM.md`

## Forbidden

Everything else — including `docs/ai/CURRENT-WORK.md` (must remain
byte-identical to `3b5ab26` in this PR; the registry is edited only via
reviewed claim transitions), `docs/ai/HANDOFF.md`, `docs/ai/DEFECT-MEMORY.md`,
`AGENTS.md`, `scripts/env_coordination_guard.py`,
`scripts/test_env_coordination_guard.py`, `.codex/**`, `.github/**`,
`frontend/**`, `supabase/**`, `data/**`, `.env`.

## Acceptance

- `python scripts/env_autonomy_runtime.py route --task-category
  read_only_advisory` reports the LIVE TypeSafe-direct state with the
  key-invalid mirror caveat and `dispatch_allowed: false`; an explicit
  `jev_available=False` still fails closed to `UNAVAILABLE`.
- The terra admission record and the delegated-decision policy are
  queryable from the module; routing defaults (R2 GLM / R3 Sol) unchanged.
- Full battery green (62 runtime + 344 guard + registry validation);
  scope-exact diff; SKILL.md routing text carries the live route, the
  delegation policy, and the boundary constraints verbatim.
- D2 truthful failures + all four consult receipts durable in the handoff.

## Dispatch-exception risk record

Owner-authorization basis above (2026-11-08 Goal-mode delegation instruction
+ unanimous delegate D5 `run_small_claim_now`, recorded as claim
dependencies). GLM-5.3 MAX is the sole writer (Track Z metadata slice).
JEV/terra delegate inputs are advisory metadata only — they never decide
claim ownership, SAFE_TO_MUTATE, review acceptance, merge, completion, or
risk-tier downgrade, never downgrade an R3 classification, and never
substitute for another model's proof. The implementation lane stops at
`REVIEW_REQUESTED` and never merges its own PR. No production data writes;
no schema/RLS involvement; no frontend impact.
