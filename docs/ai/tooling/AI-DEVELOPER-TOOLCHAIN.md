# AI Developer Toolchain — UTH[AI]-ENV

Last updated: 2026-08-22

## Goal

Provide a small, professional, auditable toolset for multi-agent development. Prefer high-value tools with clear ownership over a large collection of overlapping MCP servers.

This file is the source of truth for planned/connected AI developer tools. Client-specific secrets or OAuth tokens must not be committed here.

## Current Core Toolchain

| Tool | Purpose | Status | Cost / auth note |
|---|---|---|---|
| Serena / SunDay workers | local repo intelligence, scoped edits, tests | ACTIVE | existing local tooling |
| Git / GitHub | source control, PRs, CI evidence | ACTIVE | existing repo workflow |
| Playwright CLI | deterministic browser regression | ACTIVE | repository dependency/tooling |
| Vitest | unit tests | ACTIVE | repository dependency/tooling |
| Context7 MCP | current library/API documentation for agents | CONFIGURED FOR CODEX | basic remote use can work without API key; rate limits may apply |
| Playwright MCP | exploratory browser automation for coding agents | CONFIGURED FOR CODEX | package resolves through `npx` |
| Chrome DevTools MCP | browser/runtime/network/performance debugging | CONFIGURED FOR CODEX | package resolves through `npx`; isolated mode and network-header redaction configured |

## Codex MCP Configuration — 2026-08-22

The user-level Codex configuration was updated non-destructively. A timestamped backup of the previous `config.toml` was created first.

Configured servers:

```text
context7
playwright
chrome_devtools
```

Security choices:

- Context7 uses the remote MCP endpoint without an API key for basic access. No secret is stored in Codex config.
- Chrome DevTools uses an isolated browser context rather than the user's normal signed-in browser profile.
- Chrome DevTools network-header redaction is enabled.
- Playwright MCP is for exploratory agent browser work; repository Playwright specs remain the CI regression source of truth.

After a Codex restart/reload, verify the MCP tool list before relying on these servers.

## Recommended Usage Boundaries

### Context7

Use for:

- React/Vite/TypeScript API questions;
- R3F/Three/Drei/Zustand docs;
- Supabase client/Edge Function docs;
- Playwright and other fast-changing library documentation.

Do not treat Context7 as repository state. Actual source and repo docs override generic library documentation.

### Playwright MCP

Use for:

- exploratory UI/browser investigation;
- accessibility-tree-driven navigation;
- reproducing a UI bug before writing a deterministic spec.

Do not replace committed Playwright tests with ad-hoc MCP sessions.

### Chrome DevTools MCP

Use for:

- console/runtime errors;
- network inspection;
- performance traces;
- memory investigation;
- CSS/layout debugging;
- browser behavior that source inspection alone cannot explain.

Default to the isolated profile. Only attach to a user's signed-in browser session when the user explicitly needs that workflow and understands the data exposure.

## Manual / OAuth-Gated Connections

### Supabase MCP — RECOMMENDED

Status: USER ACTION REQUIRED.

Reason: authentication opens a browser and grants Supabase account/project access, so the user must authorize it.

Policy:

- scope to the UTH[AI]-ENV project;
- start read-only;
- enable only feature groups needed for the current task;
- never give database mutation privileges to a reviewer agent by default.

### Figma MCP / ChatGPT Figma app — OPTIONAL, HIGH VALUE FOR VISUAL LANE

Status: USER ACTION REQUIRED.

Reason: Figma OAuth/account authorization requires the user's approval.

Use for design variables, components, layout context, and design-to-code workflows. Do not use Figma as a source for operational data semantics.

### Sentry MCP — DEFERRED

Status: NOT CONFIGURED.

Adopt only after a Sentry project and runtime-observability policy are intentionally created. This is useful for production diagnostics but is not required merely to continue feature development.

## Component-System MCP Decision

### Storybook MCP

Status: DEFERRED / REVIEW FIRST.

Storybook now provides an MCP server for React component documentation, story generation, testing, and accessibility workflows. However this repository already uses Ladle. Adding Storybook would introduce another component-workbench dependency and maintenance surface.

Decision rule:

- do not install Storybook solely because an MCP exists;
- first assess whether Ladle is limiting multi-agent visual development;
- if yes, create a dedicated migration/adoption work order with bundle/dev-dependency and CI impact review.

## 3D / Game-Dev Tool Candidates

### Blender MCP

Status: CANDIDATE — NOT AUTO-INSTALLED.

Reason: community MCPs that can execute Blender/Python have a larger local-code execution surface. Review repository, permissions, and workflow before installation.

Potential use:

- low-poly site assets;
- blockouts;
- GLB export;
- repeatable asset generation scripts.

### Three.js runtime/devtools MCP

Status: CANDIDATE — NOT AUTO-INSTALLED.

Potential value is scene-tree/material/performance inspection. Treat community runtime MCPs as optional until security/maintenance quality is reviewed.

## Free Does Not Mean Zero-Cost Forever

Open-source MCP server packages may be free while related hosted services can have account tiers, rate limits, quotas, or paid features. Before making a cloud service a production dependency, document its pricing/limits separately.

## Agent Policy

Reviewer agents should prefer read-only tools.

Implementation agents may receive write tools only for the currently owned work order.

External-service credentials must live in approved secret stores or client credential managers, never repository markdown, `.env` committed to Git, prompts, or screenshots.
