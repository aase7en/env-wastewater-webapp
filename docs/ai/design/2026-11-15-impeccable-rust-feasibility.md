# UTH[AI]-ENV Digital Twin — Impeccable Pilot + Rust Feasibility

**Owner intent:** systematically detect and fix generic-looking AI UI while retaining field usability and the existing Digital Twin.
**Actual repo basis:** React 19/Vite 8/TypeScript `frontend/`, Supabase, React Three Fiber/Three.js, charting, Python backend/scripts.
**Agent entry:** `AGENTS.md` → `docs/ai/PROJECT-OPERATING-MAP.md` → current `docs/ai/CURRENT-WORK.md` + claim/WO.
**Execution blocker:** `CURRENT-WORK.md` reports `RECOVERY_HOLD` (verified 2026-11-15). This document is **read-only planning** pending coordination and recovery; it does not unblock implementation.
**Design SSoT:** `docs/ai/design/ENV-EXPERIENCE-MASTER-PLAN.md` and `ENV-PRODUCT-EXPERIENCE-GOAL.md` supersede aesthetic suggestions from a tool.

## Why this pilot
- Digital Twin remains the spatial/visual center. Impeccable must **not** flatten it into an ordinary card dashboard or imply that non-live sensor inputs are live.
- Two experiences: calm, high-density desktop command center and Thai-first mobile operational forms (field staff). Outdoor legibility, 44px+ touch targets, provenance/freshness labels and data quality outrank anti-slop cosmetics.
- Preserve Aura styling, existing tokens, accepted reference prototypes, and actual hospital wastewater-process constraints. No PHI, secrets or raw hospital exports in external agent prompts or screenshots.

## Bounded pilot
1. After recovery/claim verification, choose a read-only Overview KPI/detail or field-entry form away from active Track F/Z writers. No Digital Twin process simulation mutation in the first pilot.
2. Baseline mobile field form and desktop Dashboard/Command Center with mock/sanitized telemetry; capture statuses `LIVE/LATEST/STALE/SIMULATED/UNKNOWN/UNAVAILABLE`, unit labels, provenance, error/empty/loading and WebGL fallback.
3. Run Impeccable critique + audit on that UI, source detector on a small `frontend/src` scope and browser-rendered scan locally if supported. Manual domain review decides valid improvements; document false positives.
4. Prototype a single change within declared Track F ownership; keep source-status semantics, mobile field workflow, Digital Twin fidelity, reduced-motion and non-WebGL accessibility.
5. Verify `cd frontend && npm run lint && npm test && npm run build && npm run e2e` plus project-specific design/telemetry integrity checks. Independent review before owner acceptance.

## Rust preliminary decision
**Recommendation: keep React/Three.js and Python; profile first.**
- **Potential Rust/WASM candidate:** offline heavy geospatial transforms, large time-series data reduction, compute-bound analytical/simulation kernel, or efficient secure edge/IOT ingest **only with measured bottlenecks**. Rust does not replace WebGL/Three.js rendering.
- **Alternative first:** server-side SQL aggregation, streaming, React render profiling, Web Workers and optimized TypeScript/Python/vectorized libraries. Consider backend separation rather than a full Rust frontend.
- **Critical evidence:** p50/p95 transform latency, battery/CPU on field devices, memory, WASM download and startup overhead, data-validation parity, observability, reproducibility, PHI/security boundary.
- No direct Rust or Impeccable auto-fixes in clinical/operational production flows. Any pilot is separately approved and rollback-capable.

## Authority and safe execution
- **Status: PROPOSAL / RESEARCH ONLY.** This document records owner-requested intent (2026-11-15); it does **not** claim a mutation lane, authorize implementation/deployment, or override the repository SSoT.
- Start with current `AGENTS.md` and live task/claim records. Verify remote `main`, worktree identity, HEAD, dirty ownership, and active PRs. Create an approved bounded JOB/WO, declare a disjoint scope, and follow existing review gates before any product/source edits.
- Do not replace the existing design system, rewrite the app, install unreviewed packages/hooks, change CI defaults, delete user files, migrate data, or touch Production as part of discovery.
- This proposal intentionally leaves canonical live-status files unchanged; do not treat a draft PR as acceptance or as a claim.

## Impeccable investigation protocol (not yet run)
1. Establish **baseline**: capture representative desktop/tablet/mobile or native-app screens, and user journeys. Record page/commit/device, user goal, a11y, contrast, keyboard flow, motion, performance, screenshots, and known UI defects. Use dummy/sanitized data.
2. Preserve brand identity and existing design tokens; write a concise product/design context from confirmed SSoT (do not allow AI to infer or replace business intent).
3. Review upstream source/license/version before opting into `npx impeccable install` and its hooks. Use a throwaway branch/worktree first. Run `/impeccable init` only with approved product context; compare any generated `PRODUCT.md` or `DESIGN.md` with existing authoritative docs. Never blindly overwrite them.
4. Pilot **one isolated component/flow**: `/impeccable critique` for design hierarchy, `/impeccable audit` for a11y/responsive/performance, and `npx impeccable detect <source-path>` and a local rendered URL where supported. Review detector rules and false positives; `--json` for machine-readable evidence. Detector is a heuristic, not a definitive design score.
5. Triage findings: P0 unusable/accessibility/safety, P1 major task friction/incorrect status representation, P2 inconsistency, P3 aesthetic polish. For each finding record URL/screenshot, rule or rationale, impact, proposed correction, owner, before/after comparison, and verified status.
6. Prototype one reversible change. Compare before/after visually and with automated verification; test keyboard, touch, reduced motion, focus, responsive layouts and real content lengths. No aesthetics-only change that regresses user tasks.
7. Request owner decision on the visual direction and an independently reviewed PR before merging. If no measurable benefit, retain original design.

**Suggested gates (targets, not results):** 0 new P0/P1 accessibility/usability regressions; all existing task workflows pass; WCAG AA contrast where applicable; touch targets meet project-specific standard; mobile/desktop screenshots and E2E pass; no sustained bundle/performance regression versus measured baseline. Document exceptions rather than hiding detector warnings.

## Rust evaluation protocol (separate from UI aesthetic work)
- **Hypothesis, not mandate:** assess Rust only where real profiling shows CPU-bound, memory-safety, binary-distribution, concurrency, or resource-use needs not solved by simpler optimization in the current stack. Rust does not by itself make React/Tk UI visually better.
- Inventory current language/process boundaries, native dependencies, build/release/CI platforms, team proficiency, and integration cost. Profile a baseline with realistic workloads and attributable bottlenecks.
- Compare **A: keep and optimize current stack**, **B: isolated Rust service/library/CLI or WASM proof of concept**, **C: broad rewrite**. Default to A until B demonstrates durable total-cost advantage; C requires separate owner-approved ADR and rollback plan.
- Define 1–2 week *experiment scope only after approval*, plus exact benchmarks: median/p95 latency, memory peak, CPU, startup time, binary size, failure/recovery, CI friction, developer time, dependency/security surface, and parity tests.
- Run identical fixtures for incumbent vs Rust candidate; assess FFI/WASM/IPC data marshaling, portability, debug/observability and cross-platform deployment. Abandon pilot if results are inconclusive or integration burden exceeds measured gain.
- Accept Rust only behind a stable interface, preserving current behavior with compatibility tests and an explicit rollback path. Never migrate all projects or entire frontend solely for language uniformity.

## References (checked 2026-11-15)
- Impeccable upstream: https://github.com/pbakaus/impeccable and https://impeccable.style/
- Tauri architecture (Rust core + webview, **not** automatic Rust frontend): https://v2.tauri.app/concept/architecture/
- Rust language: https://doc.rust-lang.org/book/
- WebAssembly constraints: https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Concepts

## Deliverables for a future authorized agent
- Baseline evidence matrix with screenshots/sha/device and false-positive review.
- Prioritized UI/UX anti-slop audit, before/after prototype and a11y/responsive/E2E evidence.
- Rust feasibility ADR: measured bottleneck, options A/B/C, costs/risks, go/no-go with human decision.
- A bounded JOB/WO and claim through existing SSoT; independently reviewed PR for *any* source change.