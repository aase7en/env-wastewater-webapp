# Programmatic Media / Code-to-Video for ENV

Last updated: 2026-09-30

Status: **IDEA / PLANNING ONLY — NOT IMPLEMENTATION AUTHORIZATION**

## Purpose

Record a reusable idea for turning ENV Digital Twin scenes and validated environmental data into deterministic educational/demo videos without requiring generative-video models for every scene.

This is a capability direction for future agents to evaluate and shape. It does not change the current implementation queue, ownership, claims, or review gates.

## Core Idea

Use the existing web graphics stack as a renderable media engine:

```text
validated ENV content / storyboard
            ↓
scene definition / timeline
            ↓
Three.js / React Three Fiber + WebGL
            ↓
deterministic frame rendering
            ↓
frame capture
            ↓
FFmpeg composition / encoding
            ↓
MP4 / short-form / training media
```

The same spatial assets may therefore serve both:

- interactive Digital Twin views in the browser; and
- rendered video or still-image media.

Prefer reuse of existing Twin components and data-honesty contracts over building a separate visual world.

## Why This May Fit ENV

Good candidate content includes:

- Activated Sludge process explanation;
- environmental-flow stories;
- sensor/data provenance explainers;
- PM2.5 / heat / flood context animations;
- equipment/process training;
- project demos and stakeholder presentations;
- short educational media for public communication.

Programmatic rendering is especially attractive where the content is diagrams, charts, labels, maps, particles, process flow, camera motion, or 3D plant visualization rather than photorealistic human action.

## Human Role

Humans remain responsible for:

1. goal and audience;
2. domain/technical correctness;
3. storyboard approval and narrative priority;
4. visual references / art direction;
5. consequential interpretation of hospital/environmental data;
6. final publication approval.

Agents may automate code, animation, rendering, QA, and iteration, but they must not invent physical topology, telemetry, operating state, or regulatory facts.

## Suggested Tool Stack

```text
TypeScript / JavaScript
        ↓
Three.js / React Three Fiber
        ↓
WebGL
        ↓
GSAP or deterministic timeline layer
        ↓
Chromium / browser renderer
        ↓
frame capture
        ↓
FFmpeg
```

Implementation should prefer deterministic time control such as:

```text
t = frame / fps
render(t)
```

rather than depending on uncontrolled wall-clock animation during offline rendering.

Fix or record random seeds, viewport, device pixel ratio, fonts, assets, camera state, physics timestep, and timeline inputs when reproducibility matters.

## Shared Scene Definition Direction

A future reusable media layer should avoid prompting an agent to rewrite raw WebGL for every clip.

Prefer a scene/storyboard contract such as:

```json
{
  "scene": "aeration_tank",
  "durationSeconds": 8,
  "camera": "orbit_to_closeup",
  "show": ["influent", "aeration", "do_sensor"],
  "telemetryMode": "latest"
}
```

The exact schema is not decided here. It should reuse stable Twin asset IDs and truthful provenance semantics where possible.

## Data-Honesty Guardrails

All existing ENV truth rules remain binding:

- unknown is not zero/normal/stopped;
- `latest` is not `live`;
- simulation is labeled simulation;
- a drawn pipe proves topology, not current flow;
- equipment geometry does not prove equipment state;
- no individual status is inferred from aggregate values;
- source/freshness/provenance remain visible when decision-relevant.

For wastewater process media, `11-UTHAI-ACTIVATED-SLUDGE-PROCESS-KNOWLEDGE.md` remains the topology authority.

## Agent Routing Direction

Route by capability and current repository ownership, not by model brand.

Potential roles:

- **GPT / integrator** — architecture, storyboard quality, task slicing, adjudication, final acceptance;
- **Codex / visual lane** — Three.js/R3F scene composition, camera, motion, responsive visual implementation, screenshot evidence;
- **GLM-5.3 high-effort lane** — bounded renderer infrastructure, deterministic utilities, FFmpeg pipeline, tests, debugging, refactor where scope is authorized;
- **fast/low-cost multimodal lane** — screenshot/contact-sheet QA, repetitive visual checks, variant inspection when an admitted model/tool supports the task;
- **deterministic tools** — browser automation, frame capture, FFmpeg, tests, telemetry collection.

GLM-5.3 MAX / Flash are candidate execution lanes when available and admitted, but this document does not override current Track F / Track Z ownership or active claims.

## Compute / Cost Hypothesis

Hypothesis to verify, not a benchmark result:

For infographic/process/3D explanatory media, programmatic rendering should require substantially less AI GPU/VRAM than diffusion-based video generation because the browser GPU rasterizes known geometry/materials instead of running a large generative video model for every frame.

The likely remaining costs are:

- agent/model tokens or subscription allowance;
- browser/GPU rasterization;
- frame capture;
- FFmpeg encoding;
- storage;
- human QA.

Do not record a percentage saving until measured on an ENV PoC.

## Proposed PoC

Candidate first proof:

**Activated Sludge explainer — 30–45 seconds, 1080p, 30 fps**

Potential sequence, subject to the process-knowledge file:

1. wastewater collection / pump sump;
2. fine screening / Aeration Tank;
3. Aeration → Clarifier;
4. RAS loop back to Aeration;
5. WAS → sludge drying beds;
6. flow measurement / chlorine contact;
7. treated effluent discharge.

The PoC should reuse truthful topology and avoid presenting unavailable equipment state as observed.

## PoC Measurements

Capture at minimum:

- wall-clock agent time;
- agent/model token usage where exposed;
- number of repair iterations;
- CPU utilization;
- RAM;
- GPU utilization;
- VRAM;
- render FPS / seconds per frame;
- encoding time;
- output size;
- screenshot/contact-sheet QA findings;
- technical-correctness findings;
- comparison with any generative-video baseline used later.

## Success Criteria for a Future Work Order

A future implementation Work Order should define a narrow success target such as:

- one deterministic 30–45 s ENV video;
- repeat render from the same inputs produces the same timeline/output semantics;
- no false LIVE/telemetry claims;
- critical information remains available outside WebGL where applicable;
- reusable scene/timeline components are demonstrated;
- render/compute telemetry is captured;
- output can be regenerated after a data/text correction without regenerative-video inference.

## Non-Goals

This idea does **not** authorize:

- replacing the interactive Digital Twin;
- starting a new rendering framework alongside the existing stack without reuse analysis;
- full wastewater-plant visual expansion ahead of approved roadmap dependencies;
- generative claims about hospital infrastructure not supported by source material;
- automatic public publishing;
- PHI or private infrastructure imagery leaving approved boundaries;
- GPU hardware purchases before measured need.

## Suggested Next Planning Step

When the roadmap/ownership gate allows it:

1. create a bounded planning/PoC Work Order;
2. inventory reusable Digital Twin components;
3. define storyboard + scene/timeline contract;
4. implement the smallest deterministic renderer seam;
5. render one short ENV proof;
6. measure compute/token/iteration cost;
7. independently review technical truth and visual quality;
8. decide whether to expand into a reusable ENV Programmatic Media Engine.

Until such a Work Order is explicitly activated, keep this as a durable idea for agents to refine, challenge, or incorporate into future planning.
