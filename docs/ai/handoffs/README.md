# Parallel Work Handoffs

This directory prevents multi-agent writers from colliding in the shared `docs/ai/HANDOFF.md` file.

Rules:

- Parallel lanes write only their own handoff file in this directory.
- The coordinating/reviewer agent owns `docs/ai/HANDOFF.md` while parallel work is active.
- A lane handoff records status, branch, exact HEAD, files changed, tests/evidence, blockers, and stop condition.
- After review/merge, the coordinator summarizes the accepted result into the global `HANDOFF.md` and may archive/retain the lane handoff as durable evidence.
