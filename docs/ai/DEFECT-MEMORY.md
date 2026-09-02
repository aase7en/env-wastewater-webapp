# UTH[AI]-ENV — Defect Memory

Last updated: 2026-08-29
Status: ACTIVE REUSABLE FAILURE MEMORY

Purpose: retain only **reusable defect lessons** that should change how future ENV work is designed, tested, reviewed, or audited. This file is repository memory; chat memory is not a substitute.

Do not turn this into a chronological bug dump. A defect belongs here only when the failure pattern can recur across future work.

## Entry template

```text
ID:
Failure class:
Symptom:
Root cause:
How detected:
Prevention rule:
Regression/evidence:
Domains affected:
Source record:
```

---

## ENV-DEFECT-001 — Positive provider allowlists must be schema-backed

**Failure class:** PHI / external-provider authorization boundary.

**Symptom:** a row key positively allowlisted for external AI could carry arbitrary identifying text even when the field name looked like a numeric operational metric.

**Root cause:** safe-field authorization relied on field names while some allowlisted names were unrestricted text or did not exist in the current live schema. A stale/nonexistent name is not a safe contract.

**How detected:** independent reviewer RED proofs for WO-STAB-009, including captured provider-body leakage when stale `ph_tank` was temporarily re-added.

**Prevention rule:** every positive provider-safe field must be reconciled against the current live schema + later migrations and have an enforceable bounded type/write contract. Unknown/stale names are removed, not guessed. Regex scrubbing is defense-in-depth only.

**Regression/evidence:** `frontend/src/lib/admin/annotate-boundary.test.ts`; `reports/schema-snapshot-live.md`; PR #33 final review record in `docs/ai/CURRENT-WORK.md` / `HANDOFF.md`.

**Domains affected:** AI annotation/chat, schema changes, imports, provider integrations.

---

## ENV-DEFECT-002 — `latest` is not `live`; derived plant values are not direct asset telemetry

**Failure class:** data-honesty / Digital Twin semantics.

**Symptom:** manual/latest or plant-wide derived data could be presented as realtime/direct asset telemetry.

**Root cause:** presentation mapping compressed different provenance/measurement meanings into one visual field/mode.

**How detected:** Digital Twin foundation review and remediation.

**Prevention rule:** preserve distinct contracts for manual/latest, real sensor live, historical, and simulation. A plant-wide derived measurement must not be displayed as a direct asset measurement without a validated mapping.

**Regression/evidence:** Digital Twin records in `docs/ai/CURRENT-WORK.md`; `frontend/src/lib/twin/dashboard-adapter.test.ts`; Digital Twin Playwright coverage.

**Domains affected:** Digital Twin, dashboards, analytics, external telemetry.

---

## ENV-DEFECT-003 — E2E must exercise the PR code, not deployed main

**Failure class:** false-green CI / regression coverage.

**Symptom:** a PR could build successfully while Playwright exercised the already-deployed `main` application, allowing PR behavior regressions to escape pre-merge detection.

**Root cause:** the E2E target and the compiled PR artifact were disconnected.

**How detected:** WO-STAB-004 CI remediation recorded in `.github/workflows/e2e.yml`.

**Prevention rule:** pre-merge E2E must run against the checked-out PR code. Production smoke after merge/deploy is a separate gate.

**Regression/evidence:** `.github/workflows/e2e.yml` runs the branch via Playwright webServer; `deploy-frontend.yml` owns post-deploy smoke.

**Domains affected:** all frontend work.

---

## ENV-DEFECT-004 — Stale/dirty local checkout is not SSoT

**Failure class:** multi-agent coordination / repository freshness.

**Symptom:** an agent can confidently read an old local worktree and treat stale plans/source as current project truth, or destroy user/agent work while trying to update it.

**Root cause:** trusting session/project activation instead of verifying `origin/main`, combined with dirty/untracked multi-agent worktrees.

**How detected:** repository-health audit and repeated reviewer worktree caveats.

**Prevention rule:** fetch current `origin/main` before non-trivial work; verify ancestry; use a clean isolated worktree when the primary checkout is stale/dirty; never blindly reset/clean/stash unknown files.

**Regression/evidence:** freshness gate in `AGENTS.md`; `reports/repo-health-2026-08-25.md`.

**Domains affected:** every agent and every work order.

---

## ENV-DEFECT-005 — Optimistic state transitions must be idempotent

**Failure class:** UI state consistency / repeated action.

**Symptom:** repeated “mark read” interactions could decrement unread counts more than once or change state for already-read/unknown records.

**Root cause:** count mutation and row-state transition were not governed by the same pre-action condition.

**How detected:** WO-STAB-006 independent RED reproduction.

**Prevention rule:** derive one pre-action decision (`wasUnread` or equivalent) and use it for both entity mutation and aggregate count mutation; repeat/already-complete paths must be no-ops and preserve state identity where intended.

**Regression/evidence:** PR #30 review record in `docs/ai/CURRENT-WORK.md` / `HANDOFF.md`; alert unread tests.

**Domains affected:** alerts, optimistic React Query updates, counters/badges, repeated actions.

---

## ENV-DEFECT-006 — Conditional error reveal must wait for the committed target

**Failure class:** accessibility / asynchronous UI focus and viewport race.

**Symptom:** after a failed mobile save, the error alert existed but intermittently focus remained on `BODY` and the alert was fully above the viewport. The regression reproduced 2/20 in the verification lane.

**Root cause:** focus/scroll was scheduled directly from the submit handler with `requestAnimationFrame`, which could run before React committed the conditionally rendered banner/validation target.

**How detected:** independent mobile E2E review strengthened the failed-save path to assert `role=alert`, focus ownership, viewport intersection, entered-value preservation, and successful retry; repeated execution exposed the race.

**Prevention rule:** when the focus/scroll target is conditionally rendered by state, represent the reveal as state and perform focus/scroll in an effect after the target is committed. Error recovery should be deterministic and must not depend on smooth-scroll timing. Preserve entered values and retry semantics.

**Regression/evidence:** `frontend/tests/e2e/daily-form-mobile.spec.ts` failed-save regression; ENV-MOBILE-001D evidence at `cdaa1097022b7fbfedfff8302a628af630f6cfb1`; remediation `b7c2623168da4d6fac8990a7f90180ee1b1326f1`; final independent repeat 20/20 PASS at PR head `f7af3027dafe52f06719a2e08de993a31045162f`.

**Domains affected:** mobile forms, async mutations, conditional validation/error banners, accessibility focus management.

---

## ENV-DEFECT-007 — Hidden document overflow can make local containment false-green

**Failure class:** responsive UI / false-green geometry assertion / action reachability.

**Symptom:** a mobile table and most of its 44px Delete action escaped the owning card/viewport, while `documentElement.scrollWidth <= innerWidth` still passed.

**Root cause:** an ancestor (`AppShell` main) used `overflow-x: hidden`, clipping escaped content and suppressing document-level overflow without creating a usable local scroll/reflow boundary.

**How detected:** independent ENV-MOBILE-005 review measured the Garden card, table, viewport, and action bounds at 320/360px rather than trusting document width alone.

**Prevention rule:** for wide content, assert the actual local boundary against its card and viewport, assert `scrollWidth/clientWidth` + overflow behavior, and prove the full terminal action is reachable by keyboard/touch. A document-width assertion is supplemental, never sufficient when an ancestor clips overflow.

**Regression/evidence:** `frontend/tests/e2e/garden-mobile.spec.ts` local boundary/table/action geometry and ArrowRight reachability; Garden remediation `e137cd468f628961dcfb697f0470cb3da76062bd`; reviewed PR #48 head `327ae8b541f3e29f5727acc7edb3ed76b12f20bc`.

**Domains affected:** every mobile table/chart/canvas, nested scroll regions, AppShell-contained forms, keyboard action reachability.

---

## ENV-DEFECT-008 — Green CI can still carry a deprecated Action runtime

**Failure class:** false-green CI / runner compatibility / evidence quality.

**Symptom:** an exact-head check concluded `SUCCESS`, while its annotations warned that a referenced action still targeted deprecated Node 20 and was only being forced onto Node 24. The review report incorrectly claimed the warning was absent because it relied on the green conclusion and selected step output.

**Root cause:** application runtime versions and GitHub Action JavaScript runtimes were treated as the same boundary, and review did not inspect check-run annotations or the composite Pages action chain.

**How detected:** PR #49 exact-head re-review queried annotations for check-run `99035942437` and traced every active `uses:` reference to the official upstream `action.yml` runtime.

**Prevention rule:** inspect exact-SHA check annotations in addition to conclusions; inventory every active action and relevant composite dependency; keep mapped actions at or above the verified Node-24 generation. Never reuse warning-free evidence after HEAD changes.

**Regression/evidence:** `scripts/check_workflow_action_runtimes.py`, its unit tests, and the `test.yml` runtime-regression step. Post-merge Pages annotations remain a required release gate.

**Domains affected:** GitHub Actions, CI/CD, release review, evidence reports.

---

## ENV-DEFECT-009 — Security hardening must use the library's real API contract

**Failure class:** dependency security / false hardening / type-safety bypass risk.

**Symptom:** while remediating the PDF.js advisory, an initial hardening attempt passed `enableScripting: false` to `pdfjs.getDocument()`. The patched `pdfjs-dist@6.2.108` TypeScript contract rejected it because `enableScripting` is not a `DocumentInitParameters` option. Forcing it through with a cast would have created a false sense of security.

**Root cause:** a viewer-level security concept was assumed to be a document-loader option without first verifying the patched package's actual API/types and the advisory's real remediation boundary.

**How detected:** the focused security regression became green, but `tsc -b` failed on the unsupported option. Upstream/type inspection showed the CVE fix is the patched dependency version; ENV's valid `enableXfa: false` remains defense-in-depth/parser intent, not the CVE fix.

**Prevention rule:** for dependency-security work, verify the advisory's patched version and the exact installed API/type contract before adding controls. Never use casts, `any`, suppressions, or unrelated options to make a security claim compile. Distinguish the actual vulnerability fix from defense-in-depth settings in tests, docs, and review evidence.

**Regression/evidence:** `frontend/src/lib/import-engine.security.test.ts`, `frontend/tests/e2e/import-security.spec.ts`, patched `pdfjs-dist@6.2.108`, clean npm audits 0/0, and TypeScript/build gates.

**Domains affected:** PDF/import parsing, dependency upgrades, security reviews, typed third-party APIs.

---

## ENV-DEFECT-010 — Unknown categorical data must stay unknown at every boundary

**Failure class:** data honesty / import validation / SQL enum boundary.

**Symptom:** importing a Fuel row with a missing `fuel_type` silently classified it as `diesel`, any arbitrary non-empty text passed validation, and the unified carbon view cast that free text to `carbon.source_type` inside its JOIN — so one legacy/imported dirty value could crash every carbon surface reading `v_unified_co2e` (or, pre-cast, quietly misclassify fuel).

**Root cause:** an import adapter treated "missing categorical value" as "default categorical value" (`?? "diesel"`), and a view compared a free-text column to an enum column via text→enum cast instead of comparing the enum side as text.

**How detected:** FUEL-CORE-001 Core audit (read-only schema→adapter→view trace) followed by RED-first regression: `expected 'diesel' to be null`, `token: biodiesel … to throw`, and a static migration contract asserting the executable SQL contains no `d.fuel_type::carbon.source_type` cast.

**Prevention rule:** categorical imports fail closed — blank/missing stays `null`, only canonical values pass (trim/case normalization at most), and everything else errors the row before any write. SQL joining a free-text column to an enum column must cast the enum side to text (`ef.source::text = d.fuel_type`) so unknown values match nothing instead of erroring or being reclassified. Never default an unknown category to a real value.

**Regression/evidence:** `frontend/src/lib/import-adapters/fuel.test.ts` (adapter honesty + migration static contract); `supabase/migrations/20260830000000_fuel_core_001_rollup_safety.sql`; FUEL-CORE-001 WO evidence.

**Domains affected:** bulk import adapters, carbon rollup/views, any free-text column feeding enum comparisons (watch other domains' legacy text fields).

---

## ENV-DEFECT-011 — Legacy compatibility fields must not stay the source of truth, and SQL CASE fallbacks must not invent factors

**Failure class:** data honesty / schema drift / silent misclassification.

**Symptom:** Garbage stored a canonical classification (`segregation_type`) plus a legacy free-text twin (`waste_type`). The UI wrote BOTH (with a Thai-vs-English vocabulary clash), Bulk Import fabricated missing classification into `general`, and the carbon rollup still branched on the LEGACY field whose `ELSE` bucketed `chemical`/missing/unknown onto the general-waste factor — producing carbon numbers that do not exist.

**Root cause:** a canonical replacement column was introduced while every consumer (UI write path, import adapter, rollup view) kept reading/writing the legacy column, and the view's CASE used a default branch instead of explicit mapping with no-match semantics.

**How detected:** GARBAGE-CORE-001 RED evidence — `expected 'general' to be null`, `expected 'ทั่วไป' to be 'general'`, `token: hazardous … to throw`, migration contract failures, and a TypeScript type-RED proving `GarbageInput` still exposed the legacy field as writable.

**Prevention rule:** when a canonical column replaces a legacy one, remove the legacy field from every WRITE type/path (compiler-enforced where possible), keep it read-only for display of historical rows, and switch every query/view to the canonical column in the same change. Categorical SQL mapping must list every classification explicitly and use ELSE NULL (no factor / UNAVAILABLE) — never an ELSE that borrows another category's factor. UI/import defaults must not fabricate a real category for missing data.

**Regression/evidence:** `frontend/src/lib/import-adapters/garbage.test.ts` (adapter honesty + type contract + migration static contract incl. `ELSE NULL`, no `CASE c.waste_type`, fuel-join preservation); `supabase/migrations/20260831000000_garbage_core_001_canonical_classification.sql`; GARBAGE-CORE-001 WO evidence.

**Domains affected:** schema migrations introducing canonical columns, import adapters, rollup views with categorical CASE mapping, any module carrying legacy twin fields.

---

## ENV-DEFECT-012 — Required-column gates must honor the same aliases as row mapping

**Failure class:** import contract / localization / false rejection before validation.

**Symptom:** an adapter can advertise a valid localized header in `mapRow` but still reject the file before row mapping because `applyAdapter()` validates `requiredColumns` first against a narrower token set. FOOD-CORE-001 review found `foodAdapter.requiredColumns=["date"]` while `mapRow` also accepts Thai `วันที่`; a Thai-only file can therefore fail with “คอลัมน์ที่จำเป็นขาด” before the supported alias is used.

**Root cause:** required-column discovery and row-value lookup use different alias contracts. The preflight gate checks one generic token while the mapper later accepts several concrete aliases, so supported localized inputs are not actually end-to-end supported.

**How detected:** independent GPT-5.6 Sol FOOD-CORE-001 source trace through `BulkImportPage` → `applyAdapter()` → `foodAdapter`: required columns are checked before the proxy/mapper alias path, and only `mapped.valid` rows reach batch insert.

**Prevention rule:** required-field discovery and row mapping must share one explicit alias definition per semantic field, with regression coverage for every advertised alias. Do not fix this by weakening required-field validation globally or by inventing fuzzy mappings that can bind the wrong column.

**Regression/evidence required for repair:** a focused Bulk Import/adapter test proving English and Thai supported date headers both pass the required-column gate, genuinely missing date still fails before write, and unrelated columns cannot satisfy the date requirement accidentally. Audit other adapters for the same alias mismatch before choosing the bounded repair scope.

**Domains affected:** Bulk Import, localized CSV/XLSX/OCR column mapping, every adapter whose `requiredColumns` vocabulary is narrower than its `mapRow` aliases.

---

## ENV-DEFECT-013 — GitHub Pages direct deep-links can distort production geometry evidence

**Failure class:** deployment hosting / SPA deep-link / false attribution in responsive acceptance.

**Symptom:** a direct deployed domain-route load can briefly enter GitHub Pages' 404→SPA fallback/shared-shell transition and report mobile document geometry wider than the viewport even though the same deployed bundle is stable after normal root→client navigation. Garden, Garbage, Safety, and Food production checks all exposed variants of this signal; Food direct `/food` failed only the document-width assertion while the remaining Food acceptance checks passed, and a separate deployed root→client probe measured exact viewport width at 360/390/430.

**Root cause:** the test path mixes hosting/fallback-shell behavior with domain-page geometry. During the direct deep-link transition, shared shell/ModuleDock elements can temporarily sit outside the viewport before client routing settles, so attributing first-frame document width to the domain page is not evidence-backed.

**How detected:** deployed ENV-MOBILE-005/006/007/008 browser probes compared direct deep-link/reload behavior against stable root→client SPA navigation and measured the actual offending/shared elements rather than assuming the domain content caused overflow.

**Prevention rule:** production responsive acceptance must use stable root→client SPA navigation for domain-content geometry and interaction assertions, while direct deep-link/reload remains a separate hosting/routing test. Never hide a deep-link failure, but do not classify it as a domain regression without element-level or settled root→client evidence tying the overflow to that domain's content. Keep local card/table containment checks from ENV-DEFECT-007 as an independent requirement.

**Regression/evidence:** deployed root→client probes for Garden, Garbage, Safety, and Food; ENV-MOBILE-008 Food root→client 360/390/430 measured document/body width equal to viewport with mocked REST/no real writes, while direct `/food` reproduced only the hosting-path geometry failure.

**Domains affected:** every GitHub Pages SPA route used for production mobile E2E/smoke, shared shell/ModuleDock transitions, domain responsive acceptance methodology.

---

## ENV-DEFECT-014 — NULL must survive every aggregation boundary; transport state must not be named "live"

**Failure class:** rollup aggregation / NULL-vs-zero collapse / misleading realtime naming.

**Symptom:** `carbon.v_unified_co2e` legitimately emits `kg_co2e = NULL` when an emission factor is unavailable (missing factor, unsupported classification, unit mismatch, pre-effective-date period), but three layers each independently collapsed that UNKNOWN into a numeric zero: the electricity SQL branch `COALESCE(SUM(consumption) * ef.kg_co2e, 0)`, the TypeScript shaping `total += Number(r.kg_co2e)` (`Number(null) === 0`) inside scope totals and `grandTotalKg`, and the page cell `Number(r.kg_co2e).toFixed(3)` rendering NULL as `"0.000"`. Separately, every branch LEFT JOINed the factor table with only `effective_from <= month`, so two applicable factors (the documented annual TGO update path) would fan the join out and double-count every affected month. And `useCarbonRollupRealtime()` exported a boolean named `live` for Supabase subscription connectivity, inviting monthly manual aggregates to be labeled live environmental data.

**Root cause:** NULL semantics were never made a cross-layer contract — each layer independently chose a convenient default (COALESCE-to-zero in SQL, Number() coercion in TS, toFixed in UI), and factor selection had no "exactly one row" rule, so an intentional future factor update was structurally a double-counting bug. The realtime flag was named after what the UI might want to claim rather than what it measures.

**How detected:** ENV-WASTE-CARBON-001A Core archaeology traced every UNION branch of every migration defining `v_unified_co2e` (including the FUEL-CORE-001/GARBAGE-CORE-001 supersessions), then read the TS shaping and page consumers line-by-line against the data-honesty invariants.

**Prevention rule:** any column that can be NULL crosses a layer boundary as `T | null` in the type contract, and every aggregate over it must either exclude-and-flag (known subtotal + explicit unavailable coverage) or fail — never `Number(x)`, `COALESCE(... , 0)`, or `?? 0`. Effective-dated reference joins must select at most one row (LATERAL `ORDER BY effective_from DESC LIMIT 1` or equivalent). A boolean describing subscription/socket state must be named for transport (`realtimeConnected`), never `live`, on any manual/aggregate data path.

**Regression/evidence:** `frontend/src/lib/carbon-rollup.test.ts` — NULL excluded from totals and flagged unavailable (R3/R17), explicit-zero stays zero (R2), all-NULL source stays unavailable-not-complete (R7), known-subtotal completeness flag (R8), `realtimeConnected` type contract (R13); static migration contract S2/S3/S4 pin the SQL-side COALESCE removal, 5× latest-effective LATERAL, and explicit unclassified fuel label.

**Domains affected:** carbon rollup views and every TS consumer of nullable aggregates; effective-dated reference tables (emission factors and any future rate/version tables); realtime hooks over manual aggregate data.

---

## Adding future entries

Add a new entry only after the root cause is verified. The entry should change at least one future behavior: a guardrail, test, spec rule, audit item, or implementation pattern.

When a lesson becomes obsolete because architecture removes the failure class, mark it `RETIRED` with the replacement contract instead of silently deleting history.
