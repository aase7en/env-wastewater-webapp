# ENV-WWTP-3D-V3-FUTURE — Archived Animated WWTP Twin

**Class:** Future product feature backlog. **Status:** `NOT_CLAIMED / DESIGN_ONLY` (2026-11-09).
**Origin:** Explicit owner request to persist the earlier interactive V3 3D prototype and prepare agent continuity in repository. This document **does not** authorize implementing or merging the future 3D feature.

## Objective

Preserve the actual runnable interactive V3 HTML as a source artifact under `docs/ai/digital-twin/prototypes/wwtp-animated-v3/`; prepare stable future architecture and detailed acceptance criteria without changing frontend runtime.

## Current preservation scope

- New reference-only HTML and README
- New `13-WWTP-3D-V3-FUTURE-ARCHITECTURE.md`
- New lane handoff `docs/ai/handoffs/ENV-WWTP-3D-V3-FUTURE.md`
- Discoverability updates only in `AGENTS.md` and `docs/ai/ROADMAP.md`

Forbidden: `frontend/**`, `supabase/**`, `data/raw/**`, `.env*`, real operational data, migrations, backend/RLS, production deployment. No substitute schema/SSoT, no new telemetry or sensor reads.

## Later implementation contract

A new claimed Work Order must specify canonical asset IDs and process edges from `11-UTHAI-ACTIVATED-SLUDGE-PROCESS-KNOWLEDGE.md`, as-built uncertainties, Track F vs Track Z ownership, review/CI gates, UI fallback, motion/data honesty and exact scope. Do not promote concept pump state or treatment capacity into production facts.

## Preservation acceptance

1. File is byte-complete, loads as plain HTML with intended WebGL dependencies where a browser supports them (browser QA still required).
2. Source is archived in Git under docs and not imported into deployed frontend.
3. Existing AGENTS / ROADMAP point to the archive and handoff.
4. No real hospital data, PHI, secrets or uploaded photographs in public diff.
5. Candidate PR leaves main untouched until independently reviewed and authorized.

## One next safe action

A fresh authorized visual owner opens a scoped *future* implementation claim after reviewing site drawings, current Twin/Flow contracts and `DT-VIS-P002` / `ENV-VIS-STORY` dependencies, then chooses a minimal R3F integration slice with a semantic adapter contract from Track Z.
