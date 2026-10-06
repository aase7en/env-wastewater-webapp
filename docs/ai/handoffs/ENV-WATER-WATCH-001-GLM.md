# ENV-WATER-WATCH-001 — Repair lane handoff (R1)

## Assignment — 2026-10-05

- Claim `ENV-WATER-WATCH-001-R1`, generation 1, status `CLAIMED`, holder
  `zcode-env-water-watch-001-r1-primary` (GLM-5.3 MAX lane; external
  cointh/Kilo dispatch remains disabled with quota/upstream `UNKNOWN`, so the
  admitted route is the in-session GLM lane under the current supervisor).
- Worktree `A:\GitHub\_worktrees\env-water-watch-001`, branch
  `feature/uthai-water-watch-001` (open PR #93), base
  `700c186cef76ce2e4071a210a06942facd09e946`.
- Work Order: `docs/work-orders/ENV-WATER-WATCH-001.md` (lives on this
  claim's own branch via PR #93; extended there, never duplicated on main).
- Reviewer: independent GPT-6 Astra via Codex CLI. The 2026-10-01 author
  sidecar note explicitly does not count as independent review.

## Blocking finding (2026-10-01, PR #93 inline at WaterWatchDashboard.tsx:47)

Each station card is fixed ~132px and centered at 8/29/50/71/92%. On a
~390px viewport adjacent centers are only ~70–85px apart, so cards
necessarily overlap (~50px at 390px); the first/last cards extend beyond the
river container. Parent `overflow-hidden` masks this from the existing
`scrollWidth <= viewport` E2E, so the old test can pass while station
content is clipped. Required: a mobile-specific non-overlapping presentation
plus a regression proving station labels/cards themselves remain visible and
non-overlapping, not merely that document overflow is hidden.

## Repair design (staged locally, committed only after this claim merges)

- Absolute river markers render only at `xl+` (1280px+); at 1280 the old
  `xl:w-[150px]` clipped marginally, so the 150px variant moves to `2xl`.
- Below `xl`: compact river band + ordered stacked station list
  (ต้นน้ำ → ปลายน้ำ) with distinct `water-watch-station-row-*` testids.
- Playwright geometry regression (390 + 768 stacked, 1280 absolute): each
  station visible, fully contained in the river section, and pairwise
  non-overlapping by bounding box.

## Checkpoint

- 2026-10-05: component repair + regression spec staged in the worktree;
  focused Vitest 4/4 PASS and `tsc -b` PASS at the staged state. Playwright
  run, full gates, WO extension, exact-SHA freeze, and PR #93 evidence
  update follow after the claim transition merges to main.

## Closeout — 2026-10-06

- PR #93 merged as `c5fa87c9` (second parent = reviewed head `c8364fd`;
  R3 independent APPROVED `issuecomment-6011184241`; exact-head CI
  `37426880808`/`37426880810` success).
- The claim closes at generation 1 through the 2026-10-06 closeout
  transition (all four registry claims CLOSED). Worktree preserved clean.
