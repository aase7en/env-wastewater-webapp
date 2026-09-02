# ENV-CMD-001 — GPT-5.6 Sol Contract Handoff

Status: CLOSED / MERGED / POST-MERGE VERIFIED
Date: 2026-09-02
Repo: `aase7en/env-wastewater-webapp`
Worktree: `A:\GitHub\envww-cmd-001`
Branch: `docs/env-cmd-001-contract`
Activation base: `origin/main@436dbe77095cdc9c8e205ba5438a3850392d3c7c`
Owner: GPT-5.6 Sol — architecture / IA / UX contract

## Goal

Create the reusable responsive command-center composition contract before any production `/` rewrite, using current Aura/analytics/Twin foundations and preserving source/freshness/data-honesty semantics.

## Concurrency / Ownership

- GPT Ultra Building lane is active separately; Building/repair files are no-touch.
- GLM Environmental Intelligence provenance lane is separate; no competing provenance implementation is created here.
- This lane is docs-only and initially avoids global `CURRENT-WORK/HANDOFF/ROADMAP/PROJECT-GRAPH` mutation to reduce shared-file collision while other agents run.
- `.serena/**` is protected/no-touch.

## Source Reality Verified

At `436dbe77095cdc9c8e205ba5438a3850392d3c7c`:

- `/` → authenticated `OverviewPage`.
- `/dashboard` → authenticated `DashboardPage` with lazy `TwinCanvas` and Process fallback.
- Overview currently renders Water/Energy/Carbon cards + quick links.
- `useOverview()` uses newest 14-day wastewater row as a variable named `today`; command-center contract therefore forbids promoting newest/latest to current/live without freshness evidence.
- `v_overview_carbon` frontend contract currently exposes only `month/days/kwh_total/tco2e`; no source/provider/observed-at provenance is available there.
- `SituationMetricCard`, `ProvenanceBadge`, and `SituationChartFrame` exist and are tested/storied, but no production page currently consumes them.
- existing analytics types distinguish `manual_latest` from `live_sensor` and freshness `current/stale/unknown`.
- prototype command-center HTML provides bento hierarchy/topology/KPI motifs but contains sample values and status words that are not production authority.
- A-Wiki ENV project pointer was checked and is stale for current framework/project-state details; repo source remains authority.

## Contract Decisions

The draft `docs/ai/design/ENV-CMD-001-COMPOSITION-CONTRACT.md` defines:

1. operator question order: Situation → Action → Trust/Freshness → Drill-down;
2. four orthogonal state dimensions:
   - availability;
   - freshness;
   - provenance completeness;
   - caller/domain-owned operational status;
3. page zones:
   - Context header;
   - Situation strip;
   - Action/attention lane;
   - Spatial/process anchor;
   - Trend/evidence lane;
   - Domain situation modules;
   - Supporting quick actions/evidence;
4. mobile 360/390/430, tablet 768, desktop 1024/1440 recomposition;
5. prototype translation rules that explicitly reject fake values/status/live animation;
6. existing route drill-down mapping;
7. Carbon/Energy and wastewater semantic guardrails from current source;
8. no second/eager R3F Canvas on Overview;
9. accessibility + reduced motion + 44px action requirements;
10. `ENV-CMD-002` boundary and acceptance matrix.

## Key Design Judgment

The command center must not use one overloaded “system state” badge. Availability, freshness, provenance confidence/completeness, and operational condition answer different questions and must remain independent in UI/data binding.

A stale last-known-normal measurement is stale historical evidence — not current normal.

## Reuse Strategy

`REUSE → MODIFY → EXTEND → CREATE`

Expected first implementation seams for CMD-002:

- reuse `OverviewPage` rather than add a new route;
- reuse Aura primitives;
- reuse analytics kit;
- use existing `/dashboard` as Twin/Process drill-down;
- keep `TwinCanvas` lazy and absent from initial Overview runtime;
- preserve existing domain routes.

## Known Gaps Deferred to Owning Lanes

- provider-independent external provenance/freshness implementation → GLM ENV-INT lane;
- Building `repair_needed` contract → GPT Ultra Building lane;
- any Carbon public-view provenance expansion → separate Core Engineering work if CMD-002 proves it necessary;
- Hazard Map / Operations / Resource Explorer / System Network routes → later roadmap slices.

## Release Evidence

- Contract candidate committed as `260c60862842f47fe1ff67e6fd511c61efb20be7`.
- PR #70 remote diff contained exactly the 3 contract docs files.
- Fresh detached exact-SHA review APPROVED Standards + Spec/Product/Data-honesty; evidence comment `issuecomment-5508635456`.
- Exact-head `notify` + `scripts` checks PASS.
- Expected-head merge commit: `c9542b2fc51e25bf30b2b0e68b38a91c35192b92`.
- Reviewed head is verified as an ancestor of merged `origin/main`.
- Exact-main post-merge `test` run `33623435110` SUCCESS.
- No production UI, schema, RLS, provider integration, or environmental/application data writes occurred.
- Concurrent Building Ultra lane remains decision-gated and isolated; GLM `ENV-INT-PROVENANCE-001` remains a separate implementation writer.

## One Next Safe Action

After this docs-only closeout reaches main, recover fresh SSoT and activate `ENV-CMD-002` in a new production worktree with explicit ownership. Do not absorb Building repair semantics or unfinished GLM provenance implementation into the visual slice.
