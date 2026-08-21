# WO-UX-SCALE-001 — Responsive interface scale

## Owner

CODEX — Visual Experience Owner

## Objective

Increase the shipped Aura interface scale for hospital staff using phones,
tablets and desktop displays, including outdoor field use. Preserve the
existing information architecture, behavior, data semantics and dual-theme
identity.

## Dependencies

- Branch from current `origin/main`.
- Lane 2 Digital Twin visual work remains blocked until PR #14 merges.
- Existing design authority: `design/ui-brief.md` and the Aura design files.

## Source files to inspect

- `frontend/tailwind.config.js`
- `frontend/src/styles/typography.css`
- `frontend/src/styles/spacing.css`
- `frontend/src/index.css`
- shared UI primitives and `AppShell`

## Files allowed to modify

- `frontend/tailwind.config.js`
- `frontend/src/styles/typography.css`
- `frontend/src/index.css`
- `frontend/src/components/ui/Button.tsx`
- `frontend/src/components/ui/ThemeToggle.tsx`
- `frontend/src/components/ui/NotificationBell.tsx`
- `frontend/src/components/ui/PendingUsersBell.tsx`
- `frontend/src/components/layout/AppShell.tsx`
- coordination and work-order documentation

## Files forbidden to modify

- `frontend/src/lib/**`
- Supabase schema, migrations, auth and RLS
- telemetry contracts, thresholds, provenance and null interpretation
- Digital Twin and Process Flow implementation files
- feature/business logic

## Implementation tasks

1. Wire the common Tailwind type scale to semantic typography tokens.
2. Raise the in-app body, label and micro text sizes without flattening the
   heading hierarchy.
3. Increase the default Material Symbol size and make shared button/header
   controls meet the 44px touch target.
4. Keep the top bar usable without document-level horizontal overflow at a
   360px viewport.
5. Preserve focus visibility, semantic labels and reduced-motion behavior.

## Tests

- `npm run build`
- `npm run lint` (document existing baseline findings separately)
- `npm test`
- full Playwright suite
- `git diff --check`
- browser QA at 360px mobile and desktop widths, both themes where practical
- verify no document-level horizontal overflow at 360px

## Acceptance criteria

- Common UI text is 16–17px and secondary text is 14px by default.
- Legacy 10px/11px utilities render through readable 12px/13px compatibility
  tokens until they can be replaced with semantic utility names.
- Default icons render at 24px.
- Shared small buttons and top-bar icon controls have at least a 44px target.
- The top bar and primary page shell do not create horizontal page scrolling at
  360px.
- Aura light/dark identity and data-honesty behavior are unchanged.

## Handoff artifact

PR with before/after screenshots, gate results, limitations and a concise
visual QA record for GPT review.

## Stop condition

Stop at PR review requested. Do not merge. Do not start Twin visual Lane 2
until PR #14 is merged.
