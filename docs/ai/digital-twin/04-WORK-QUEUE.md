# Digital Twin Work Queue

Last updated: 2026-08-21

## Queue Order

1. Complete and commit `DT-VIS-P000` documentation.
2. Collect/annotate optional site references under `DT-REF-P001`.
3. Obtain explicit user approval for `DT-VIS-P001`.
4. Implement one visual micro-step on an isolated branch/worktree.
5. Run required gates and capture screenshots.
6. Open one focused PR; do not merge to `main` without review.
7. Only after blockout approval, consider `DT-VIS-P002` and `DT-VIS-P003` separately.

## Priority Rule

Production privacy, security, and data-integrity work outranks Digital Twin polish. Do not edit shared files while an active stabilization work order owns them.

## Required Work-Order Fields

- ID
- owner and reviewer
- goal
- dependency
- source/docs to inspect
- allowed and forbidden files
- data behavior and unknown behavior
- accessibility/reduced-motion requirements
- acceptance criteria
- tests/screenshots
- handoff artifact
- stop condition
