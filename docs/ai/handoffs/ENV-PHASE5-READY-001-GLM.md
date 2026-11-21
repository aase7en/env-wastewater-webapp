# Handoff — ENV-PHASE5-READY-001-GLM (Claim ENV-PHASE5-READY-001-C1, gen 1)

**You (the implementing lane, Track-Z GLM) hold this claim ONLY after the
claim-transition PR merges.** Until then this document is the binding brief.
Worktree `_worktrees/env-phase5-ready-001`; the implementation branch goes
off the post-merge main tip (house `feat/env-phase5-ready-001` form, name
pinned at D1). STOP at REVIEW_REQUESTED — you never merge; the authorized
reviewer owns approval + merge of every PR in this lane's chain. WO
`docs/work-orders/ENV-PHASE5-READY-001.md` holds the full binding pins
(§0 ground truth + the plan §6 Phase 5 rows VERBATIM, §1 authorization,
§2 deliverable inventory, §3 out-of-scope guards, §4 NO BUMP, §5 D-phases,
§6 D1 adjudication items, §7 scope). Read it before writing anything.
Summary:

## 1. Deliver these THREE artifacts (plus WO/handoff updates at closeout)

1. **`scripts/phase5_parity_check.py`** — the Day-14 acceptance evidence
   generator. ONE command, AppSheet vs ENV per domain: public Drive
   workbooks READ-ONLY via the established XLSX-export path
   (`scripts/test_parity_p3_003_calibration.py:81-82` precedent; the
   workbook/tab records live in the seed suites + the P3.5 handoff
   enumeration receipt) + ENV_DB READ-ONLY via the Management-API path
   (`scripts/_env.py` `load_secret("SUPABASE_ACCESS_TOKEN")`; the
   `test_parity_p1_001_schema.py` introspection precedent). Emits a Thai
   report: counts per table/month per side, coverage % (denominator
   stated), missing-days lists, honest `ยังไม่มีแหล่ง` sections for
   unshared sources. stdout + optional local report file. **ZERO writes**
   — no DB write, no Drive write, no repo write beyond the named report
   file.
2. **`scripts/test_phase5_parity_check.py`** — written FIRST (D2) against
   MOCKED sheet/DB response fixtures: full / EMPTY / UNSHARED / PARTIAL
   domains; zero live network at D2; truthful RED before the script
   exists.
3. **`docs/ai/PHASE5-CUTOVER-CHECKLIST.md`** (Thai) — the ≥14 วัน dual-run
   protocol (daily staff routine + what to record), the friction-log
   template section (lightweight form guidance, NO new DB tables), the
   acceptance criteria per domain (plan §6 DoD line 276 verbatim +
   operationalized), the backfill inventory (the ~6 unshared sheets + what
   seeds when each arrives — inventory only, execution is the owner's),
   the rollback/retirement checklist (freeze → read-only ≥90 วัน → archive
   export → retirement + rollback criteria + owner decision record), and
   **every owner decision point marked clearly**. พ.ศ. dates.

## 2. The Phase-5 owner-gated boundary (lure traps — each needs its own NEW reviewed claim transition)

1. "The parity query is ready — run the daily parity now / start the
   dual-run clock" — NO. P5.1 execution starts ONLY on the owner's start
   signal. The script is a runnable TOOL, not a running process.
2. "The backfill SQL is trivial — just insert the unshared sheets' history"
   — NO. Backfill execution (P5.2) is the owner's action. The lane ships
   the INVENTORY (what seeds when each sheet arrives), nothing else.
3. "Freeze AppSheet now, it's safer" — NO. Freeze/read-only/retirement
   (P5.3) is the owner's ceremony. The checklist documents it step by step
   and marks it as the owner's decision record.
4. "Add a small table for the friction log" — NO new DB tables. The
   friction-log template is a lightweight section of the checklist doc
   (simple form guidance the staff can copy).
5. "One tiny migration for the parity SQL view would help Day-14" — NO
   migrations in this lane. The P5.1 "SQL สำเร็จรูป" stays the owner-gated
   execution lane; read-only queries live INSIDE the script.
6. "The report should show 0 for unshared sheets so the table looks
   complete" — NO. Unshared ⇒ `ยังไม่มีแหล่ง` section. A 0-vs-0 parity row
   fabricates a parity claim that was never checked (unknown ≠ zero).
7. "Bump the version so staff notice the toolkit" — NO BUMP (WO §4);
   checker must stay `OK (v1.15.0)` exit 0.

## 3. Honesty pins (reviewer-pinned)

- unknown ≠ zero (ห้ามแทนค่าศูนย์) — unshared ≠ 0; missing days are listed,
  never filled; `ไม่ทราบ` is preserved wherever a value is not derivable.
- A probe you cannot run is recorded UNVERIFIED, never asserted (the
  Management-API path: a missing `SUPABASE_ACCESS_TOKEN` = honest
  `LIVE_CONNECTION_UNAVAILABLE` / suite skip — absence-of-probe evidence,
  never a pass).
- The report is EVIDENCE for the owner's Day-14 acceptance — never a
  substitute for the owner's own confirmation (DoD condition 4 stays the
  owner's written word).
- `latest` ≠ `live` — counts are point-in-time reads, labeled as such.
- D2 RED must fail for the RIGHT reasons (missing module / missing report
  sections), standing passes disclosed; the LIVE smoke run happens ONCE at
  D4, read-only, receipted in the handoff.

## 4. D-phase checklist (battery pins)

- D1 (READ-ONLY): live re-enumeration of the public workbooks + ENV_DB
  introspection reachability; drift vs WO §0.3 pivots via the coordinator.
- D2: mocked contract suite RED, zero live network.
- D3: script + checklist doc; no other file in the diff.
- D4: NEW suite GREEN + FULL vitest + `tsc -b` + oxlint + Playwright FULL
  workers=1 + guard 344/344 + runtime 62/62 + checker `OK (v1.15.0)` +
  `git diff --check` clean + diff ⊆ claimed scope (CURRENT-WORK.md diff
  EMPTY in the implementation PR) + PII/secrets/token grep 0 + the LIVE
  read-only smoke run receipted.
- D5: fresh-GLM independent review at the exact frozen head → STOP at
  REVIEW_REQUESTED. Implementer never merges.

## 5. Transition verification receipts (authoring time, base `6bb14e9`)

- Fence method: `expected_registry_hash = 11d15e4c25fcbb38844f604a45a4bd85f080cd89afc6ffdce2d816a436986a78`
  = guard `validate-registry` registry_hash AT `6bb14e98458bce30a7fdea7cb720358ef9bfebc4`;
  the method empirically reproduces the prior fence `0982e54e…343` at
  `90ab52e` byte-exactly (cross-checked before writing).
- Registry: 51 claims at base → 52 with this claim appended; the other 50
  claims byte-identical (programmatic claim-by-claim comparison at D4 of
  the transition).
- Battery at the transition head: guard 344/344 OK, runtime 62/62 OK,
  validate-registry `{ok:true, claims:52, BOOTSTRAP_CONTROL}`, checker
  `OK (v1.15.0)` exit 0, `git diff --check` clean.
- Local-worktree caveat: the canonical checkout sat on the sibling
  `docs/env-repair-report-honesty-001-claim` branch (an ancestor of this
  base) with that lane's uncommitted in-progress `CURRENT-WORK.md` edit +
  untracked `_worktrees/` + `supabase/.temp/`. Nothing there was cleaned,
  reset, moved, or stashed; this transition was authored in the clean
  worktree `_worktrees/env-phase5-ready-001` off `origin/main` and the
  canonical checkout was left exactly as found (record here again at
  closeout if it still stands).

## 6. Source records you may reuse (READ-ONLY)

- Workbook enumeration receipt: `docs/ai/handoffs/ENV-PARITY-P3-005-GLM.md`
  (pond `1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk` 12 tabs / markad
  `1AUjAulq0-YvfJVhcBtJJfJhesAPArqn6BhjP3Gi8azQ` 6 tabs / งานสวน 4 /
  tool_maintainance 1 / extinguisher 5 / light 4 — re-verify live at D1).
- The unshared-sheet set the P4.005 frontier names: extinguisher master,
  คู่มือน้ำประปา, Items-Vendors-Categories, coliform (+ the water-supply
  workbook; the exact count re-verified at D1).
- AppSheet table/column ground truth: `docs/ai/digital-twin/12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md`
  (READ-ONLY).
- ENV table ground truth: the delivered migrations + `scripts/_env.py`
  helpers (READ-ONLY reuse, never edit).
