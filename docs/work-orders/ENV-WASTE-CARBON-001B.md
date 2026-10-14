# ENV-WASTE-CARBON-001B — Sustainability Follow-up Repairs (Work Order, C1 slice)

Status: CLAIMED (transition pending R3 review + merge; registry task_id uniqueness
requires a fresh slice task — same pattern as ENV-OPS-001 → ENV-OPS-001A)
Task: `ENV-WASTE-CARBON-001B` (follow-up slice of parent `ENV-WASTE-CARBON-001`)
Claim: `ENV-WASTE-CARBON-001B-C1` (generation 1)
Base: `291e896ff8b03f4a96e63b2e9df6dda7e611df31`
Registered by: GLM-5.3 MAX coordinator (claim-transition author)
Review owner (this transition): deterministic R3 cross-model — Codex `gpt-6-sol`
(admitted; NOT GPT-6 Astra, which stays prohibited; never author-and-approve).

## Objective

Close the four parent-node follow-ups recorded at C1 delivery (D5 verdict
`issuecomment-6160114878`; PR #121 `2df0bcd`):

1. **P2 — latent per-family mislabels (waste AND electricity).** In
   `frontend/src/lib/sustainability/family-state.ts`, BOTH CONTRIBUTING
   branches label their value with rollup-wide aggregates instead of
   family-local evidence (R3 R1 finding: the electricity branch is the
   symmetric defect — a waste-only contribution would still render the
   electricity card as CONTRIBUTING via `grandTotalKg`).
   Fix (both families): derive each family's CONTRIBUTING state, value label,
   and `knownOnlyTotal` from **family-mapped rows** —
   - electricity: presence + known subtotal from rows whose `source` maps to
     family `"electricity"`; `grandTotalKg` is reserved for the page's
     overall-total display (ยอดรวมที่ทราบ), never a family card label;
   - waste: presence + known subtotal from rows whose `source` maps to
     family `"waste"`; `knownOnlyTotal: true` when any waste-family row
     carries NULL kg;
   - `SOURCE_FAMILY` must cover **every waste label the rollup view can
     emit** (`'waste_' || segregation_type | 'unclassified'`): at minimum
     `waste_general`, `waste_infectious`, `waste_recyclable`,
     `waste_chemical`, `waste_organic`, `waste_unclassified`, and bare
     `waste` (R3 R1 finding: `waste_infectious` and `waste_unclassified`
     were missing — known infectious kg would silently fall out of the
     family, and an unclassified NULL row would fail to mark the subtotal
     incomplete). Implement the mapping by enumerating the canonical
     segregation set (garbage lib read-only) so a future type cannot
     silently fall out; pin `waste_infectious` inclusion and
     `waste_unclassified` NULL-incompleteness in tests.
   Never coerce NULL to 0; an empty-row family stays UNAVAILABLE
   (ไม่มีข้อมูล), unchanged. Test scenarios must include **waste-only**
   (electricity UNAVAILABLE), **electricity-only** (current world), and
   **mixed** contributions. The T-VER electricity-documentation item derives
   from electricity-mapped rows, not `grandTotalKg`.
2. **P3 — pinned DOM readiness status.** `SustainabilityPage.tsx` emits the
   literal `"UNAVAILABLE"` into `data-readiness-status`, a value outside the
   pinned `TverReadinessItem["status"]` union (`DOCUMENTED | ABSENT |
   PARTIAL`). Fix: `family-state.ts` exports
   `READINESS_DOM_STATUS_UNAVAILABLE = "UNAVAILABLE" as const` and the pinned
   DOM-status union type; the page consumes the constant (byte-identical DOM
   output — no e2e change permitted or needed).
3. **P3 — factor-readiness derivation basis.** `deriveTverReadiness` derives
   the per-source-factor readiness status from the electricity total. Fix:
   derive from **evidence of applied factors** — `PARTIAL` iff at least one
   rollup row has non-NULL `kg_co2e` (a factor was applied to real data),
   `ABSENT` when none does; `DOCUMENTED` is never claimed by this derivation
   while any `EXPECTED_SOURCES` label lacks an applied-factor row in-window.
   Basis documented at the derivation site and pinned by tests.
4. **P3 — knownOnlyTotal discrimination.** Existing tests pin only the
   `true` case. Fix: pin BOTH polarities (false when
   `hasUnavailableContribution === false`) and the waste-branch flag
   semantics from item 1.

## Scope (mutable, exactly — identical to the registry claim entry)

- `frontend/src/lib/sustainability/family-state.ts`
- `frontend/src/lib/sustainability/family-state.test.ts`
- `frontend/src/pages/SustainabilityPage.tsx`
- `docs/work-orders/ENV-WASTE-CARBON-001B.md`
- `docs/ai/handoffs/ENV-WASTE-CARBON-001B-GLM.md`

## Forbidden (read-only dependencies + untouched surfaces)

`frontend/src/lib/carbon-rollup.ts` + `carbon-rollup.test.ts` (frozen 001A
contract — consumed read-only), `frontend/src/lib/garbage.ts` (read-only),
`frontend/tests/e2e/sustainability.spec.ts` (DOM output must stay
byte-identical; the 7/7 suite runs as regression only), `docs/ai/CURRENT-WORK.md`
(via reviewed transitions only), `AGENTS.md`, `scripts/**`, all other pages,
`frontend/src/components/digital-twin/**`, `data/**`, `.env`.

## Binding data-honesty contracts (carried from C1 / 001A, unchanged)

- Unknown ≠ Zero/Normal — NULL kg never coerces; 0-row families stay
  UNAVAILABLE with ไม่มีข้อมูล, never numeric.
- Plastic stays ABSENT; `waste_recyclable` is never relabeled plastic.
- T-VER stays readiness-only — zero eligibility/credit/registration
  vocabulary anywhere in lib or page.
- No new data sources, no invented factors, no schema/RLS changes; the
  rollup contract is consumed read-only.
- User-facing dates พ.ศ. where rendered (none added by this slice).

## Owner split & D3 gate

- **D3a (Track Z = GLM-5.3 MAX):** `family-state.ts` + `family-state.test.ts`
  — items 1–4 lib/test implementation. GLM is the sole writer of these files
  during D3a.
- **D3b (Track F = Codex CLI `gpt-6-sol` @ `model_reasoning_effort=max`):**
  `SustainabilityPage.tsx` ONLY — replace the ad-hoc `"UNAVAILABLE"` literal
  with the pinned constant from item 2 (import + one expression;
  byte-identical rendered output). Sole writer during the D3b window; no
  other file.
- Model authorization: the owner's standing Codex-proactive directive
  (2026-10-12, durable via PR #112) Role B conditions + the owner steer of
  2026-10-14 ("ทำงานต่อที่ค้างให้จบ โดยใช้ JEV AI และ GPT6-Sol ช่วยในงานที่เหมาะสม",
  recorded in-substance here), same form as the C1 D3b authorization.
  gpt-6.1-sol stays unprobed on its unchanged entitlement-blocked
  fingerprint; gpt-5.6-sol stays R3-review-only; GPT-6 Astra prohibited.
  A provider admission error at the D3b dispatch parks the claim in registry
  BLOCKED — never silent fallback, never author-and-approve.
- JEV: named by the owner again 2026-10-14 but UNAVAILABLE per the fleet
  router (no supported live route; no substitution allowed) — no advisory
  consumed, recorded honestly.

## D-plan

- **D1 (GLM):** this WO + the pinned unit-contract table for items 1–4
  (truth table added to the handoff before D2).
- **D2 (GLM):** RED-first — new `family-state.test.ts` cases fail against
  current main code (waste subtotal ≠ grand total; waste knownOnlyTotal;
  factor-basis PARTIAL/ABSENT; knownOnlyTotal false; DOM-status constant),
  recorded with truthful failure output.
- **D3a (GLM):** implement lib to green.
- **D3b (Codex gpt-6-sol @ max):** page constant adoption; output
  byte-identical.
- **D4 (GLM):** full battery — focused vitest, full vitest, tsc, oxlint,
  sustainability e2e 7/7 (regression), `git diff --check`.
- **D5:** fresh-GLM-5.3-MAX independent review at the exact frozen head
  (cross-model vs the Codex page author; fresh context vs the GLM lib
  author); verdict durable on the PR.
- **D6:** expected-head merge, exact-main CI verify, closeout transition
  (registry CLOSED + frontier reconciliation) reviewed like this one.

## Acceptance

- All follow-ups closed with pinned tests (waste AND electricity
  family-row-derived semantics; both-polarity knownOnlyTotal; pinned DOM
  status; factor basis); no behavior change on current real-world data
  (electricity remains the only contributing family and renders
  identically; waste still UNAVAILABLE; factor status still PARTIAL; DOM
  byte-identical).
- Battery green at the frozen head; e2e 7/7 unchanged.
- No forbidden file touched; receipts durable in `docs/ai/handoffs/ENV-WASTE-CARBON-001B-GLM.md`.

## Dispatch-exception risk record

Product-lane work under the owner-authorized dispatch-exception pattern
(standing owner continuation steers 2026-10-12 / 2026-10-14; autonomous
production dispatch remains paused pending the §12 activation ladder).
This slice is a bounded repair of recorded review findings on an already
delivered, owner-steered feature — no new product surface, no production
data writes, no Building/Twin/schema involvement.
