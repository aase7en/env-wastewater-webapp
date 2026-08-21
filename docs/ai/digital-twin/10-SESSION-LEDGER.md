# Digital Twin Session Ledger

Append one concise entry after each material session. Do not rewrite prior entries except to correct a factual error and explain the correction.

## Entry Template

```text
Date:
Agent:
Work Order:
Branch:
Starting HEAD:
Ending HEAD:
Status:
Files changed:
Behavior/contracts changed:
Tests/screenshots:
Decisions added:
Limitations/blockers:
Exact next action:
```

## 2026-08-21 — Durable visual-direction handoff

- Agent: Codex
- Work Order: `DT-VIS-P000`
- Branch: `feature/digital-twin-v3`
- Starting HEAD: `e79073d`
- Ending HEAD: verify the commit containing this ledger entry from Git; a commit cannot stably contain its own SHA
- Status: documentation completed; implementation not started
- Files changed: branch-specific project/current/handoff documents, Digital Twin documentation set, and agent continuity guide
- Behavior/contracts changed: none
- Tests/screenshots: documentation-only; `git diff --check` required before commit
- Decisions added: site-authentic treatment-garden direction, wastewater water treatment, aggregate aerator-state boundary, canal-context boundary, reference-asset privacy rule
- Limitations: source photographs and drone images are not stored in repo; exact site boundary and engineering dimensions remain unconfirmed
- Exact next action: record documentation commit, then wait for explicit user approval before `DT-VIS-P001`
