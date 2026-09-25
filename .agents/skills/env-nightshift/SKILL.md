---
name: env-nightshift
description: Resume and advance ENV work across waits, lost turns, compaction, review, CI, and merge using existing durable task state.
---

# ENV-NightShift

Follow the established loop:

`RECOVER -> RECONCILE -> HARVEST -> REFRESH READY -> AUTO-FILL -> EXECUTE -> VERIFY -> REVIEW -> REPAIR -> CI -> MERGE -> POST-MAIN -> HARVEST -> AUTO-FILL`.

- Resume the same task and Goal from the current published lane handoff. A new session is not a new task; a lost turn is not proof an execution failed.
- Reconcile claim generation/holder, exact worktree and head, lifecycle events, external-operation outcomes, and current `origin/main` before continuing.
- Treat waits as nonterminal. Publish a typed `WAITING_EXTERNAL` or `PARKED` checkpoint, verify the remote fast-forward head, refresh canonical READY work, and continue only through an existing authorized transition.
- An unresolved `UNKNOWN` operation outcome blocks retry. Reconcile from durable provider evidence before any replay; never infer success from a model label, worker-online message, CLI history, or local file.
- Wait quietly while external state is unchanged. Do not poll in a tight loop or recursively continue after the one supported stop-hook continuation.
- The implementer stops at `REVIEW_REQUESTED`. An independent reviewer checks the exact candidate SHA; only the authorized reviewer merges. Then fetch main and verify the exact merge and applicable post-main evidence.
- Keep provider output out of this handoff. Record identity, event order, result status, timestamps, and cryptographic digests only.
