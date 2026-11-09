# Handoff — ENV WWTP Animated 3D V3 (future)

**State:** `PRESERVATION_CANDIDATE / FUTURE_BACKLOG`. Not a live implementation claim.
**Repository:** `aase7en/env-wastewater-webapp`; primary Windows local `A:\\GitHub\\env-wastewater-webapp`.
**Reference snapshot:** `origin/main@51ecaeeed828fd046daf2ddff09a5a55d655e3a5` verified 2026-11-09. Re-fetch latest remote before later work; SHA in this note is historical context, not an instruction to reset.
**Branch:** `docs/wwtp-3d-v3-prototype-archive-20261109` (candidate, requires review).
**Current-risk caveat:** Mac main was clean and matched remote. Windows main was stale at `7d73814782f8475731d886f6826da5bc9af36c11` with 17 untracked files. These are protected; do not clean/stash/checkout or copy into them. Worker 1–5 readiness checks returned 429; no worker mutation lease was assumed.

## Source and scope

See `docs/ai/digital-twin/prototypes/wwtp-animated-v3/README.md` for archived interactive V3 HTML and limitations, `13-WWTP-3D-V3-FUTURE-ARCHITECTURE.md` for design, and `docs/work-orders/ENV-WWTP-3D-V3-FUTURE.md` for the future contract.
The previous React Three Fiber V3 ZIP remains a conversation prototype and is **not** imported into production or this archive. Any future port should be validated against current source and typing rather than treated as already integrated.

## Rehydrate without chat

1. Read `AGENTS.md`, fresh `docs/ai/PROJECT-OPERATING-MAP.md`, `docs/ai/CURRENT-WORK.md`, exact Work Order and current repo/PR/CI/claim state.
2. Read `11-UTHAI-ACTIVATED-SLUDGE-PROCESS-KNOWLEDGE.md` and the relevant A-Wiki ENV context before making domain/process decisions.
3. Inspect `docs/ai/ROADMAP.md` M4 and `03-MICRO-STEP-BOARD.md`; check whether the prior backlog was activated already.
4. Compare existing `frontend/src/components/digital-twin/`, `lib/twin/`, `flow/` and `pfd/` to avoid duplicates.
5. Record owner/claim/worktree/HEAD/dirty/allowed scope and obtain `SAFE_TO_MUTATE = YES` before any code edits.

## Verified vs unverified

- Verified: requested future visual experience; prior V3 source exists; current SSoT topology includes RAS, WAS, chlorine, filtrate return, exceptional bypass, uncertain capacity labels.
- Unverified: actual surveyed dimensions, levels, civil design capacity, flow speeds, current pump operation, sensor readiness, working production React integration, mobile/WebGL/render performance.
- Do not take visually animated liquid/arrows as live plant operation.

## Next safe action

Wait for a new task claim to validate civil dimensions/topology and stage an isolated R3F integration; leave this preservation PR to the authorized independent reviewer before main merge.
