# Digital Twin PR Review Protocol

Status: ACTIVE

## Rule

One micro-step should produce one focused PR whenever practical.

## PR Evidence

- Work Order ID
- branch and exact commit
- concise summary
- files changed
- data/contracts changed, or explicitly none
- screenshots for visual changes
- desktop/mobile and light/dark coverage where affected
- accessibility and reduced-motion checks
- build/lint/unit/Playwright results
- bundle delta against the foundation baseline
- limitations and follow-up
- confirmation that `ProcessFlowDiagram.tsx`, Supabase, Auth/RLS, and unrelated routes were untouched when forbidden

## Reject Conditions

- scope expansion or shared-file collision
- fake telemetry, timestamps, status, freshness, or water level
- manual snapshot labeled LIVE
- per-unit status inferred from aggregate data
- game-like controls or copied game assets
- inaccessible Canvas-only critical information
- reduced-motion or WebGL fallback regression
- visual status conveyed only by color
- raw hospital-site reference media committed without authorization
- missing documentation/handoff update
