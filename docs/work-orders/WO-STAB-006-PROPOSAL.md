# WO PROPOSAL — WO-STAB-006: alert unread optimistic-count double-decrement

> **Status: ACTIVE — READY_FOR_IMPLEMENTATION.** GPT activation decision recorded 2026-08-24 after PR #26 review.
> Execution order: **2 of 2** — do not start until WO-STAB-009 reaches `REVIEW_REQUESTED`.
> Owner: GLM 5.3 (pure lib logic + tests — GLM lane). Stop at `REVIEW_REQUESTED`; GLM must not merge its implementation PR.

## Source finding (still open on main)

`reports/code-review-2026-08-12.md` **P1 #6** —
`frontend/src/lib/alerts.ts` `markRead` optimistic cache write decrements
`n` unconditionally (`n: Math.max(0, prev.n - 1)`), while the row-flip is
guarded by `a.read_at === null`. Double-clicking dismiss in
NotificationBell (no debounce) under-counts the unread badge until the
next 60s poll.

Verified STILL PRESENT as of main `b5f4e76` (the guard mismatch is in the
optimistic setQueryData block; no later migration touched it).

## Objective

Unread count must only decrement when the target row was actually unread.

## GPT activation note

Approved as a bounded GLM lane. Prefer extracting one pure optimistic-cache transform (rows + count together, with an injected timestamp for deterministic tests) so the `wasUnread` decision cannot diverge between row flip and badge arithmetic. This does not expand scope beyond the proposal.

## Proposed fix (smallest correct shape)

In the optimistic write, gate the decrement on the same condition as the
row-flip:

```ts
const wasUnread = prev.rows.some((a) => a.id === id && a.read_at === null);
qc.setQueryData(queryKey, {
  rows: prev.rows.map(...flip as today...),
  n: Math.max(0, prev.n - (wasUnread ? 1 : 0)),
});
```

Single-site change in `frontend/src/lib/alerts.ts`; no component, visual,
or schema change; rollback path stays invalidation-on-error (unchanged).

## Proposed test (RED-first)

Vitest unit on a new pure helper (extract the decrement decision for
node-env testability, mirroring the form-hydration pattern — NOT exported
from a component):

- click on unread row → n-1, row flipped
- second click same row (now read) → n unchanged, row unchanged
- rollback on server error → invalidation (existing behavior, pin it)

E2E not required (bell interaction already covered by polling tests; the
bug is pure cache arithmetic).

## Files (ownership)

- `frontend/src/lib/alerts.ts` (edit)
- `frontend/src/lib/alerts-unread.test.ts` or inline in a new pure-helper
  module + its test (new)

Out of scope: NotificationBell UI, debounce, other P1s.

## Gates

lint baseline · build · Vitest (159+) · full Playwright (48+) ·
diff-check · PR → GPT review. No merge by GLM.
