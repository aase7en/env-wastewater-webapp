# UTH[AI]-ENV — AI Collaboration Protocol

> Purpose: define how GPT, GLM 5.3, and Codex collaborate on `env-wastewater-webapp` by using each agent for the work it is strongest at, while preventing overlapping ownership, silent architecture drift, fabricated data semantics, and avoidable merge conflicts.
>
> This protocol complements `docs/agent-handoff/GLM53_DIGITAL_TWIN_COORDINATION.md`.

## 1. Core principle

Do not divide work as "one agent codes, another agent designs". UI is code too, and that causes overlap.

Divide work by **responsibility for correctness**:

```text
                       USER
                    Product Owner
                         │
                         ▼
                 GPT / ChatGPT
          Architecture · Coordination · Review
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
      GLM 5.3                         Codex
  Core Engineering              Visual Experience
```

The agents are complementary, not competitors.

If a task crosses boundaries, the owner of the risky/authoritative layer leads and produces a stable contract for the other agent.

---

## 2. GPT / ChatGPT role

GPT is the **Architecture + Coordination + Review owner**.

Use GPT for work that benefits from cross-domain judgment, design trade-offs, planning, review, and deciding which specialist should own implementation.

### GPT should own

- product/architecture decisions
- system boundaries
- UX information architecture
- Digital Twin product semantics
- data-honesty rules
- deciding what counts as LATEST / LIVE / HISTORICAL / WHAT-IF
- work-order design and dependency ordering
- resolving GLM ↔ Codex ownership conflicts
- reviewing proposed contracts before they become stable
- reviewing screenshots and visual direction
- reviewing whether a visually attractive implementation misrepresents operational data
- deciding when a distant roadmap item is premature
- deciding whether technical debt blocks new features
- maintaining coordination documents and approved decisions

### GPT should usually NOT own

- large repository-wide implementation passes
- repeated mechanical refactors
- low-level debugging that requires running the full local app repeatedly
- authoring every 3D mesh/material directly
- changing Supabase schema without Core Engineering review

### GPT handoff trigger

GLM or Codex should escalate to GPT when:

- source code contradicts the coordination brief
- a change alters an approved domain contract
- a visual requirement needs fabricated/inferred data
- a work order requires modifying files owned by the other agent
- a security/privacy trade-off has multiple reasonable options
- simulation terminology or claims may overstate scientific validity
- a proposed optimization sacrifices accessibility or data integrity
- a large route/IA redesign is being proposed

Escalation format:

```text
DECISION REQUEST
Topic:
Current behavior:
Option A:
Option B:
Risk of each:
Recommended option:
Files affected:
Blocking WO:
```

---

## 3. GLM 5.3 role

GLM is the **Core Engineering Owner**.

GLM owns anything where the main question is:

> "Is the system behavior, data contract, security boundary, or calculation correct?"

### GLM should own

- TypeScript domain types and contracts
- `frontend/src/lib/twin/**`
- Supabase/Postgres
- RLS and migrations
- React Query behavior
- query keys/cache invalidation
- authentication/session correctness
- privacy/PHI boundaries
- data adapters
- provenance/freshness semantics
- historical Twin snapshots
- realtime sensor normalization
- scenario/What-if logic
- validated threshold/business rules
- derived values and calculations
- testable normalization functions
- WebGL fallback contracts at the application boundary
- unit/integration/security tests
- reliability on reconnect/refetch/offline transitions
- performance measurements and engineering budgets
- debugging production correctness issues

### GLM should NOT silently own

- art direction
- palette decisions
- scene composition
- camera aesthetics
- material aesthetics
- visual animation style
- icon/sprite art style
- redesigning Aura UI purely for appearance

### GLM must produce renderer-friendly contracts

Codex must not need to inspect raw database records to know what to draw.

Preferred flow:

```text
Supabase / Sensors
      ↓
React Query
      ↓
GLM-owned adapters
      ↓
Twin domain state
      ↓
semantic renderer contract
      ↓
Codex renderer
```

Example:

BAD:

```text
Codex reads wastewater_in and decides it means 68% water level.
```

GOOD:

```text
GLM decides whether a validated water-level mapping exists.
If none exists:
waterLevelPercent = unavailable
Codex renders "ไม่มีข้อมูล".
```

### GLM handoff to Codex

A visual task is ready for Codex only when GLM can provide:

- stable input type/interface
- semantic meaning of each field
- null/unknown behavior
- status states
- normalized visual values if applicable
- reduced-motion implications if data-driven
- tests proving data semantics

Handoff format:

```text
GLM → CODEX HANDOFF
WO:
Contract status: STABLE / PROVISIONAL
Owned domain files:
Renderer input type:
Fields and semantics:
Unknown behavior:
Scenario behavior:
Accessibility semantics:
Tests passing:
Files Codex may modify:
Files Codex must not modify:
Known limitations:
```

---

## 4. Codex role

Codex is the **Visual Experience Owner**.

Codex owns anything where the main question is:

> "How should the user see, understand, navigate, and interact with the system?"

### Codex should own

- `frontend/src/components/digital-twin/**`
- Three.js / React Three Fiber scene implementation
- procedural 3D assets
- GLB integration
- sprites/SVG/icon assets
- visual tokens
- materials
- lighting
- camera composition
- scene layout
- water/bubble/particle/flow animation
- selection/highlight behavior
- spatial navigation
- interaction polish
- responsive visual behavior
- Aura UI visual refinement
- accessible DOM alternatives for Canvas interactions
- reduced-motion visual behavior
- visual regression and screenshot QA
- bundle-conscious asset integration

### Codex must NOT silently own

- Supabase schema
- RLS
- raw query logic
- auth/session semantics
- threshold/business rules
- data provenance
- freshness policy
- PHI policy
- scenario equations
- sensor-unit conversion rules
- interpreting null as zero/off
- reclassifying manual data as LIVE

### Codex data-honesty rule

Codex renders the contract; it does not invent operational meaning.

Examples:

```text
aeratorRunning = true
→ bubbles may animate
```

```text
aeratorRunning = null
→ no fake bubbles
→ show unknown/unavailable state through accessible UI
```

```text
metric.source = manual-daily-snapshot
→ do not display LIVE
```

### Codex handoff to GLM

If visual implementation requires data not present in the contract, Codex must not infer it.

Use:

```text
CODEX → GLM DATA REQUEST
WO:
Visual behavior desired:
Missing semantic field:
Why current fields are insufficient:
Candidate domain meaning (if any):
Do NOT implement visual inference until Core Engineering answers.
```

---

## 5. Shared-file rule

Some files cannot have permanent single ownership.

High-conflict examples:

```text
frontend/src/pages/DashboardPage.tsx
frontend/src/pages/OverviewPage.tsx
frontend/src/components/layout/AppShell.tsx
frontend/package.json
frontend/package-lock.json
```

Rules:

1. One agent edits a shared file per Work Order/integration step.
2. The Work Order must name the temporary owner.
3. The other agent reviews or consumes the result but does not edit concurrently.
4. If both changes are required, split into sequential WOs.
5. Never resolve semantic conflicts by "taking whichever diff compiles".

---

## 6. Branch strategy

Do not let GLM and Codex actively develop the same branch at the same time.

Recommended shape:

```text
main
 │
 ├── fix/p0-stabilization              GLM
 │
 └── feature/environmental-digital-twin
      ├── glm/<work-order>
      └── codex/<work-order>
```

The existing `feature/digital-twin-v3` foundation should be preserved before rebasing or rewriting history.

Integration order should generally be:

```text
GLM contract/change
      ↓
tests + review
      ↓
merge/integrate
      ↓
Codex consumes stable contract
      ↓
visual QA
```

For a visual-only iteration after contracts are stable, Codex may proceed without a new GLM pass.

---

## 7. Work Order rule

Agents should not receive giant open-ended implementation prompts.

Each implementation task should be a Work Order with:

- ID
- owner
- objective
- dependencies
- authoritative documents/contracts
- files allowed to modify
- files forbidden to modify
- implementation tasks
- tests
- acceptance criteria
- required handoff output
- stop condition

Example:

```text
WO-TWIN-003
Owner: GLM
Objective: expose Aeration renderer contract

Allowed:
frontend/src/lib/twin/**

Forbidden:
frontend/src/components/digital-twin/**

Output:
AerationTwinViewModel with tested null/source semantics
```

Then:

```text
WO-VIS-003
Owner: Codex
Dependency: WO-TWIN-003
Objective: render cozy Aeration Tank from stable view model

Allowed:
frontend/src/components/digital-twin/**

Forbidden:
frontend/src/lib/twin/**
Supabase/**
```

---

## 8. When to ask the other agent instead of improvising

### GLM should ask GPT/Codex when

- it is choosing colors, visual style, layout, camera, material, animation feel
- a renderer contract could be simplified in multiple UX-equivalent ways
- a UX change affects navigation hierarchy
- it wants to delete an existing visual component because the new architecture "doesn't need it"

### Codex should ask GLM when

- a visual state depends on a value not provided by the contract
- it needs to distinguish OFF from UNKNOWN
- it needs to convert engineering units into animation intensity
- it needs freshness/staleness semantics
- it needs historical/realtime/scenario selection logic
- it wants to derive one metric from another

### Both should ask GPT when

- their recommended approaches conflict
- the product semantics are ambiguous
- a large architectural/UX trade-off is involved
- the requested change would violate a binding coordination rule

---

## 9. Review loop

Recommended collaboration loop:

```text
1. GPT defines/approves WO
       ↓
2. GLM implements correctness layer OR Codex implements visual layer
       ↓
3. Owner runs its required tests
       ↓
4. Owner writes structured handoff
       ↓
5. GPT reviews architecture/UX/data honesty
       ↓
6. Next agent consumes approved output
       ↓
7. Integration + full regression gate
```

Do not skip the handoff because "tests are green". Green tests do not prove the correct product semantics were implemented.

---

## 10. Digital Twin binding rules

These are shared constraints for every agent:

- Existing app is evolved, not rewritten.
- Existing SVG ProcessFlowDiagram remains available.
- 3D is an optional renderer, never the only operational interface.
- Null/unavailable is never silently converted to zero/off/default.
- Manual daily readings are LATEST, not LIVE.
- Realtime applies only to actual sensor telemetry.
- Global Twin modes currently target `latest | historical | scenario`.
- Realtime should remain metric/source-level until a coherent full realtime snapshot exists.
- User-facing scenario language is `สมมติสถานการณ์ (What-if Scenario)` until scientific validation exists.
- Do not claim predictive accuracy without a validated model.
- Canvas must not contain the only copy of critical operational information.
- `prefers-reduced-motion` must be respected.
- WebGL failure must leave Process/Data views functional.
- Privacy/PHI and production data integrity outrank visual polish.
- Budget defaults to near-zero; do not introduce paid SaaS without explicit approval.

---

## 11. Current near-term execution priority

Until changed by an approved coordination update:

```text
1. Production stabilization
2. Preserve existing Digital Twin foundation
3. Normalize Twin contracts
4. Establish performance baseline
5. Aeration vertical slice contract
6. Aeration visual review
7. Full wastewater plant
8. Historical mode
9. What-if scenarios
10. Realtime expansion
11. Multi-domain Environmental Twin
12. AI Operator
```

Production/privacy blockers always outrank new visual work.

---

## 12. Completion report format

Every agent completing a Work Order should return:

```text
WORK ORDER COMPLETE
WO:
Owner:
Branch:
Commit(s):
Files changed:
Behavior changed:
Contracts changed:
Tests run/results:
Known limitations:
Cross-agent follow-up needed:
Recommended next WO:
```

If the result needs architecture/product judgment, add:

```text
GPT REVIEW REQUIRED
Decision needed:
Options:
Recommendation:
```

---

## 13. Conflict resolution

Priority order when instructions disagree:

```text
1. Current source reality
2. Security/privacy/data integrity
3. Latest approved GPT decision in coordination docs
4. Approved Work Order
5. Agent recommendation
6. Older planning notes
```

Source reality overriding documentation does not mean silently ignoring the documentation. Report the mismatch and request reconciliation.

---

## 14. Agent startup instruction

At the beginning of a non-trivial task, an agent should read:

1. `AGENTS.md`
2. `docs/agent-handoff/AI_COLLABORATION_PROTOCOL.md`
3. `docs/agent-handoff/GLM53_DIGITAL_TWIN_COORDINATION.md`
4. The assigned Work Order / latest coordination log
5. Relevant source and tests

Do not infer project state only from chat history.

---

## 15. Short principle to remember

```text
GPT decides the boundaries.
GLM makes the system correct.
Codex makes the system understandable and beautiful.

If one agent needs to guess what the other agent owns, stop and hand off instead of guessing.
```
