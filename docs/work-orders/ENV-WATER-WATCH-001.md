# ENV-WATER-WATCH-001 — Uthai/Ayutthaya Water Watch public infographic vertical slice

Status: CANDIDATE_READY
Owner / integrator: GPT-5.6 Sol
Visual implementation lane: SunDay-Worker 2 (ownership transferred after Worker 1 Active Project drift was detected; bounded repository mutation)
Core/data review owner: GLM-5.3 MAX when the source/risk contract reaches review
Independent review / merge owner: fresh reviewer per ENV policy
Repository: `aase7en/env-wastewater-webapp`
Worktree: `A:\GitHub\_worktrees\env-water-watch-001`
Branch: `feature/uthai-water-watch-001`
Base: `origin/main@6987036740de4fd3b4c1a51639b1631860262242`
Activation authority: explicit user instruction, 2026-09-26
Last updated: 2026-09-26

> Coordination note: `docs/ai/CURRENT-WORK.md` is currently owned by an active ENV autonomy lane. This slice does not mutate that shared SSoT while ownership is active. The work order itself records the bounded authorization from the user's explicit instruction. Integration into canonical current-work must be reconciled at the next safe coordination boundary.

## Goal contract

### User outcome

Create a public-facing, Thai-first water-situation dashboard for Uthai Hospital and the surrounding Ayutthaya area that an ordinary person can understand within about five seconds without knowing GIS, river engineering, or technical environmental terminology.

The first deliverable is a truthful, standalone visual vertical slice at a public route. It must be architected as an ENV feature, not as a separate application, so later real-data ingestion and navigation integration do not require a rewrite.

### Primary questions answered by the screen

1. ตอนนี้สถานการณ์น้ำในพื้นที่อุทัยเป็นอย่างไร
2. แนวโน้มกำลังดีขึ้น ทรงตัว หรือแย่ลง
3. พื้นที่/จุดใดต้องเฝ้าระวัง
4. ประชาชนควรทำอะไรต่อ โดยไม่ต้องอ่านข้อมูลทางเทคนิคจำนวนมาก
5. ข้อมูลสดแค่ไหน และเป็นข้อมูลจริง/พยากรณ์/จำลองประเภทใด

### Target users/devices

- General public with no map/GIS knowledge
- Hospital staff and visitors
- Uthai Hospital large display / TV, nominal 1920×1080
- Desktop/tablet/mobile as responsive secondary targets
- Future browser-geolocation mode for personal-location risk

## Product principles

- Main screen is an infographic / river-story, not GIS-first.
- Desktop hospital-display view must fit one viewport without requiring scroll for the primary situation.
- No critical meaning may depend on clicking, hovering, zooming, or reading a map.
- One glance hierarchy: current situation → trend/impact → river/station story → plain-language advice → compact evidence.
- Nearby districts/provinces may rotate as later auto-slide pages, but the first slice focuses on Uthai.
- Main screen may be visually rich, but operational/public clarity outranks decoration.
- Color is secondary; status text and symbols remain explicit.

## Data-honesty invariants

- This work order's visual slice uses **SIMULATED / DEMO** values only.
- The page must show a persistent, highly visible label that the values are simulated and not current flood/water measurements.
- No real operational/environmental measurement is fabricated.
- Unknown is never zero or normal.
- Forecast is never presented as observation.
- `LATEST != LIVE`; future LIVE state requires actual realtime telemetry.
- Source/freshness/provenance concepts must already exist in the view-model contract even when demo values are used.
- AI-like summary text in this slice is fixed/template content derived from the demo view model; no LLM call is made.
- Future official warning state may only be asserted from a verified official-warning source.

## Slice 1 scope — Visual + Demo Contract

### Allowed mutable scope

- `docs/work-orders/ENV-WATER-WATCH-001.md`
- `docs/ai/environmental-intelligence/04-AYUTTHAYA-WATER-WATCH-PLAN.md`
- `docs/ai/environmental-intelligence/05-AYUTTHAYA-WATER-SOURCE-CONTRACT.md`
- `frontend/src/features/water-watch/**`
- `frontend/src/pages/WaterWatchPage.tsx`
- `frontend/src/App.tsx` — temporary route-owner for this work order only
- focused tests directly owned by this feature

### Forbidden scope

- `docs/ai/CURRENT-WORK.md` while another active lane owns it
- `docs/ai/HANDOFF.md` unless explicitly reconciled at a later coordination boundary
- active ENV-COORD / ENV-AUTONOMY files
- existing Digital Twin domain semantics
- `frontend/src/lib/env-int/core/**`
- existing GISTDA PM2.5 adapter semantics
- Supabase schema, migrations, RLS, production DB
- `.env`, credentials, provider API keys
- `data/raw/**`
- any real environmental write
- existing shared navigation unless separately authorized after this slice

## Architecture boundary

Slice 1:

```text
SIMULATED WaterWatchSnapshot
        ↓
presentation-only selectors
        ↓
WaterWatchDashboard
        ↓
public /water-watch route
```

Future production path:

```text
HII / ThaiWater + GISTDA + TMD + RID/official warning
        ↓
server-side provider adapters / proxy
        ↓
normalized ENV environmental-intelligence observations
        ↓
deterministic Water Risk Engine
        ↓
WaterWatchSnapshot
        ↓
same WaterWatchDashboard
```

The UI must never parse raw provider payloads.

## View-model contract — initial

```ts
type WaterWatchEvidenceKind =
  | "OBSERVED"
  | "FORECAST"
  | "DERIVED"
  | "SIMULATED"
  | "UNAVAILABLE";

type WaterWatchRisk = "NORMAL" | "WATCH" | "HIGH" | "OFFICIAL_WARNING" | "UNAVAILABLE";

interface WaterWatchSnapshot {
  mode: "SIMULATED";
  risk: WaterWatchRisk;
  title: string;
  summary: string;
  updatedAt: string;
  sourceLabel: string;
  rainfall: SituationMetric;
  waterLevel: SituationMetric;
  trend: SituationMetric;
  impact: SituationMetric;
  stations: WaterWatchStation[];
  advice: string[];
  watchAreas: WaterWatchArea[];
  forecast: WaterWatchForecastPoint[];
}
```

No field above grants future scientific/risk meaning by itself; production semantics are frozen only in later Core/Risk contracts.

## Visual acceptance criteria

### Hospital display

At 1920×1080:
- primary screen fits within one viewport;
- no horizontal scroll;
- no primary-content vertical scroll;
- headline situation/risk can be read from several metres away;
- top-level risk uses icon + word, not color alone;
- simulated-data banner is visible without interaction;
- Uthai Hospital and Uthai-area context are visually dominant;
- river story communicates upstream → local → downstream without requiring map literacy;
- five-second scan communicates current demo status, direction, and what to do;
- no fake “LIVE” badge.

### Responsive

- Desktop: coordinated infographic dashboard.
- Tablet: reorganized 2-column/stacked layout without clipped content.
- Mobile: single-column explanatory view may scroll; critical status appears first.
- No content requires hover.
- Touch targets ≥44 px where interactive.
- reduced-motion keeps equivalent information.

### Accessibility

- semantic headings/sections;
- status has readable text;
- charts/river story have accessible text equivalents;
- contrast follows current Aura design system;
- animation not required to understand status.

## Test/verification seam

Minimum candidate gates:
1. focused model/render tests;
2. TypeScript `tsc -b`;
3. production build;
4. `git diff --check`;
5. changed-file and forbidden-scope audit;
6. secret scan;
7. browser smoke at desktop and mobile;
8. screenshot/viewport evidence at 1920×1080 that primary display does not scroll;
9. independent review on frozen SHA before merge.

No real-network CI is required for this simulated visual slice.

## Candidate verification — 2026-09-26

- Focused Vitest: `WaterWatchDashboard.test.tsx` — 4/4 PASS.
- TypeScript + production build: `npm run build` — PASS.
- Browser smoke: `water-watch.spec.ts` on Chromium — 3/3 PASS, including 1920×1080 no-scroll geometry, mobile no-horizontal-overflow, and public-route/no-auth-redirect assertions.
- Browser verification used ephemeral synthetic `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` process values only because this isolated worktree intentionally has no copied `.env`. No secret or local credential file was read or created.
- The first no-env browser run failed before React mount because the shared Supabase module correctly fails loud when its public build variables are absent; rerunning with synthetic process-only values proved the Water Watch route itself renders and passes the viewport assertions.
- Base-to-current-main audit: current remote main is one commit ahead of this work-order base and changes only `AGENTS.md`; there is no mutable-scope overlap with this slice.
- Forbidden-scope audit: no `CURRENT-WORK`, `HANDOFF`, ENV-COORD/ENV-AUTONOMY, env-int Core, Supabase schema, `.env`, or `data/raw` changes.
- Added-scope secret-signature scan: no matches.
- Runtime artifacts such as `.serena/`, `npm-ci-water-watch.done`, and `npm-ci-water-watch.log` are not candidate files and must not be staged or deleted by this work order.

## Phase roadmap after Slice 1

### Slice 2 — Source Contract / API proof
- verify exact HII/ThaiWater current station access for Ayutthaya/Uthai;
- verify GISTDA FloodCheck exact lat/lon endpoint and entitlement;
- verify GISTDA Disaster flood extent endpoint response;
- verify TMD observation/forecast endpoint;
- record rate limits, licensing, attribution, units, cadence, missing semantics;
- capture sanitized deterministic fixtures.

### Slice 3 — Normalized water-data adapters
Core Engineering only:
- provider-specific deterministic parsers;
- observed/forecast/satellite/model distinctions;
- Bangkok timezone semantics;
- provenance/freshness;
- timeout/schema-drift/fail-closed behavior;
- no frontend credentials.

### Slice 4 — Deterministic risk contract
Define and validate:
- NORMAL
- WATCH
- HIGH
- OFFICIAL_WARNING
- UNAVAILABLE

Risk is deterministic and auditable. AI cannot promote/demote the risk state.

### Slice 5 — Real read-only dashboard integration
Replace simulated snapshot provider with normalized read-only source pipeline while keeping the same presentation contract.

### Slice 6 — Hospital display rotation
Add display pages/rotation for:
- Uthai current situation
- upstream/nearby areas
- rainfall/flood/forecast context
- official warnings/advice

Official warning may interrupt rotation.

### Slice 7 — Personal location mode
Browser Geolocation permission → ephemeral lat/lon → official/validated spatial risk source → deterministic risk engine → plain-language advice. Do not retain coordinates by default.

### Slice 8 — ENV shell integration
Add navigation/Command Center links only after standalone public surface and source contracts are accepted. Reuse the same feature package; do not duplicate the dashboard.

## Stop conditions

Stop this work order at `REVIEW_REQUESTED` when:
- plan/source-contract files exist;
- public simulated `/water-watch` vertical slice exists;
- verification gates pass;
- branch is pushed;
- exact candidate SHA is frozen;
- PR is opened/updated;
- implementer has not merged its own work.

Escalate `DECISION_REQUIRED` if implementation would require:
- invented risk thresholds;
- an unverified provider field;
- a paid dependency/service;
- storing user geolocation;
- schema/RLS changes;
- changing active shared navigation ownership;
- claiming public redistribution rights not proven by provider terms.
