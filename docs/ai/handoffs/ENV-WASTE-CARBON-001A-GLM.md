# ENV-WASTE-CARBON-001A — GLM task handoff (continuity packet)

Task: ENV-WASTE-CARBON-001A — Waste/Plastic/Carbon/T-VER Core Readiness +
carbon-rollup data-honesty hardening (prerequisite sub-lane of roadmap node
ENV-WASTE-CARBON-001; the parent node stays open).

Owner: GLM-5.3 MAX (Core Engineering). Lead/review/merge owner: GPT MAX.
This file is task-specific continuity — global SSoT (CURRENT-WORK.md /
HANDOFF.md) is intentionally NOT edited by this lane while another agent owns
paused state there; the lead reconciles at review/merge time.

## Fixed identity

- Repository: `aase7en/env-wastewater-webapp`
- Worktree: `A:\GitHub\envww-waste-carbon-core-001a`
- Branch: `fix/env-waste-carbon-core-001a`
- Base: `origin/main@64f9f89cec1e0abe6b81d50a9bc6f26ecc500098` (2026-09-02,
  fetched and verified before worktree creation; local stale main checkout at
  `A:\GitHub\env-wastewater-webapp` is 184 commits behind and was NOT trusted)
- Contract: `docs/work-orders/ENV-WASTE-CARBON-001A.md`

## What this lane settled (durable facts for the later visual slice)

- **Carbon source families (5):** electricity, fuel, garden fuel, waste,
  chemical — all UNION branches of `carbon.v_unified_co2e`. Only electricity
  has rows today (907).
- **PLASTIC_DATA = ABSENT.** No plastic category/mass/unit/factor/carbon
  mapping exists anywhere. `waste_recyclable` is NOT plastic. A later UI must
  render plastic as unavailable/not yet contracted; never derive it from
  recyclable mass.
- **TVER_STATUS = NOT CONTRACTED.** No T-VER eligibility/project/credit/
  evidence model exists anywhere. Never infer eligibility, registration,
  verification, issuance, or retirement from generic CO2e data.
- **LPG unit mismatch (known-unavailable):** fuel rows record litres; the
  only lpg factor is `kg`. The view therefore matches no lpg factor →
  kg_co2e NULL (honest). Fixing this needs an authoritative L-unit factor —
  a factor-data decision, NOT taken here.
- **Waste transport factor unused:** `km (waste_transport)` has no distance
  data source; nothing consumes it.
- **Adjacent finding (not repaired, out of scope):** `carbon.v_overview_carbon`
  hardcodes the 0.4999 literal (3rd copy besides the factor row and the
  `carbon.ts` constant) — Overview/CMD lane owns that view.
- **Micro-edge (recorded):** an empty-string `chemical_name` would produce
  label `chemical_` with the designed reagent fallback factor;
  `chemical_name` is NOT NULL in the live schema so NULL labels cannot occur.

## Verified repaired defects

1. Electricity branch COALESCE NULL→0 (SQL) — removed; NULL survives as
   UNAVAILABLE; NULL-activity rows excluded like every other branch.
2. Factor fan-out / no latest-effective selection (SQL, all 5 branches) —
   now `LEFT JOIN LATERAL … ORDER BY effective_from DESC LIMIT 1`; the
   documented annual TGO factor update can no longer double-count months.
3. Fuel NULL source label (SQL) — now explicit `fuel_unclassified`.
4. TS `Number(null)`→0 collapse in scope totals / grand total — now known
   subtotals + `unavailableSources` + `hasUnavailableContribution` +
   `has_unavailable`; `byScope` always renders all three scopes.
5. Page NULL→`"0.000"` — now `—` + known-subtotal warnings.
6. `useCarbonRollupRealtime().live` → `realtimeConnected` (transport
   semantics; zero consumers existed).

## Evidence (2026-09-02)

- RED: focused **17 failed / 3 passed**; `tsc -b` TS2459 + TS2339×13 +
  TS2322 (null fixtures) + TS2322×2 (live/realtimeConnected type contract).
- Fixture-helper honesty note: `?? 0` initially coerced NULL fixtures; fixed
  to default only on `undefined` — the affected tests then failed against the
  new implementation too, proving non-vacuous detection.
- GREEN: focused **20/20**; full Vitest **268/268** (20 files, dummy env);
  `tsc -b` PASS; oxlint 12 pre-existing warnings / 0 errors; build PASS;
  `git diff --check` PASS.
- Changed files (6): `frontend/src/lib/carbon-rollup.ts`,
  `frontend/src/lib/carbon-rollup.test.ts` (new),
  `frontend/src/pages/CarbonRollupPage.tsx`,
  `supabase/migrations/20260902000000_waste_carbon_core_001a_rollup_honesty.sql`
  (new), `docs/work-orders/ENV-WASTE-CARBON-001A.md` (new),
  `docs/ai/DEFECT-MEMORY.md` (bounded ENV-DEFECT-014 entry), this handoff.

## Production / migration status

- **Production migration NOT applied** (implementation owner never applies).
  The lead applies `20260902000000…` post-merge via the supported Management
  API path, then live-verifies read-only: latest-effective LATERAL present in
  the live `carbon.v_unified_co2e` definition, electricity branch has the
  WHERE + non-COALESced product, fuel label COALESCE present, both
  `carbon.v_unified_co2e` and `public.v_unified_co2e` full scans pass, and
  no environmental row changed. Rollback = reapply `20260831000000`.
- No real data writes of any kind occurred in this lane.

## Review request

Independent review owner: GPT MAX. Review scope: Standards, data-contract
correctness, SQL/migration safety, spec/data honesty, regression coverage —
against the exact pushed head of `fix/env-waste-carbon-core-001a`
(IMPLEMENTATION_SHA recorded in the final report / PR). GLM does not merge.

## One next safe action

GPT MAX performs the independent exact-SHA review of the pushed head; on
approval, merge with expected-head guard, apply the migration through the
authorized path, and live-verify read-only.
