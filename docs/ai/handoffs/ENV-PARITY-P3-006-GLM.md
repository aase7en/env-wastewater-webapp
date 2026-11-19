# GLM Handoff — ENV-PARITY-P3-006 (Claim ENV-PARITY-P3-006-C1, gen 1) — D0

**You (the implementing lane, Track-Z GLM) hold this claim ONLY after the claim-transition PR merges.** Until then this document is the binding brief. Worktree `_worktrees/env-parity-p3-006` (clean, off the post-merge main tip); implementation branch `feat/env-parity-p3-006` off that tip. STOP at REVIEW_REQUESTED — you never merge; the authorized reviewer owns approval + merge of every PR in this lane's chain.

## 0. The lane — the row IS the scope

AppSheet parity **Phase 3 — งานสนับสนุน — lane P3.6, the FINAL Phase-3 lane**. Plan §6 row P3.6 line 250 VERBATIM (binding, supersedes any shorthand):

> | P3.6 | Tests |

WO `docs/work-orders/ENV-PARITY-P3-006.md` holds the full binding pins (§0 boundary, §1 authorization, §2 the fixture scope matrix with every verbatim formula + divergence note, §3 test-only data layer, §4 no-bump, §5 D-phases, §6 D1 items). Read it before writing anything. Summary of the deliverables:

1. **TEST-ONLY consolidation** — the P1.7/P2.6 fixture pattern applied to the five delivered Phase-3 surfaces: typed expected-value case tables `{ id, family, input…, expected, ref (verbatim citation), divergence? }` in `frontend/src/lib/parity-fixtures-p3.ts` + the executable `parity-fixtures-p3.test.ts` + the transactional SQL battery `scripts/test_parity_p3_006_fixtures_sql.py` (zero-net-persistence over the LIVE delivered objects).
2. **The five families (WO §2 matrix)** — masters/bindings (P3.1: distributor 6 seeded; Items/Vendors/Categories 0 SOURCE_UNAVAILABLE never fabricated; the lab_test equipment_id binding + the water-side picker), inventory FEFO deduction + reversal (P3.2: earliest-EXP-first, fail-closed never deducted-as-0, idempotent states, exact FEFO-inverse reversal never-over-restore, FOR UPDATE race safety), calibration (P3.3: NEXT_DUE_PINNED_ABSENT — no verbatim formula exists, cycle fields are measured values, blank cycle ⇒ no next-due), job geofence/QR (P3.4: haversine ≤0.7 server gate + the verbatim errors + the QR fail-closed contracts + the history-seed exemption), manuals/address (P3.5: link-only metadata + the link-display predicate + the honest water-supply zero + the 7,436 census + Address_Key display-time only).
3. **The three divergence pins (WO D1-5)** — every divergence case asserts the CORRECTED/owner-decided expectation with the note + refs: the **0.7-vs-2 geofence divergence** (server write gate = 0.7 km; the AppSheet `Distance<=2` virtual display check is a display-layer artifact documented, never reconciled); **NEXT_DUE_PINNED_ABSENT** (Cal_date Init TODAY() is the only §3.30 formula); **FEFO = ENV-new per owner B6** (plan line 197: เปิด ถ้าทำได้จริง — AppSheet never auto-deducted; never presented as AppSheet transcription).
4. **NO bump expected** (D1-3) — `frontend/package.json` stays 1.13.0, `CHANGELOG.md` byte-untouched; a case that forces a bump = STOP + adjudicated deviation, never silent.

## 1. Ground-truth citations (reference 12 READ-ONLY — never edited)

| Pin | Where |
|---|---|
| plan §6 Phase 3 row P3.6 line 250 VERBATIM (Tests) | `docs/ai/APPSHEET-PARITY-PLAN.md:250` |
| P3.1 masters + bindings | WO §2 row 1 (ref 12 §3.29/§3.31/§3.27/§3.15; Category tokens ref 4792) + `docs/work-orders/ENV-PARITY-P3-001.md` |
| P3.2 FEFO + reversal + owner B6 | WO §2 row 2 (ref 12 §3.28 ref 4679–4751 + actions/bots ref 6011–6041/6350–6353) + `docs/ai/APPSHEET-PARITY-PLAN.md:197` (B6) + `docs/work-orders/ENV-PARITY-P3-002.md` |
| P3.3 NEXT_DUE_PINNED_ABSENT | WO §2 row 3 (ref 12 §3.30 ref 4864–4884) + `docs/work-orders/ENV-PARITY-P3-003.md` D1-5 |
| P3.4 geofence/QR + the 0.7-vs-2 divergence | WO §2 row 4 (ref 12 §3.24 ref 4363–4620 + §3.23) + `docs/work-orders/ENV-PARITY-P3-004.md` §0-2/§4 |
| P3.5 manuals/address + Address_Key display-time | WO §2 row 5 (ref 12 §3.22/§3.26/§3.6) + `docs/work-orders/ENV-PARITY-P3-005.md` §0/§4 |
| Fixture pattern precedents | `frontend/src/lib/parity-fixtures.ts` (P1.7, 45 cases) + `parity-fixtures-p2.ts` (P2.6, 59 cases) |

## 2. Delivered Phase-3 surfaces (TESTED-NOT-EDITED — byte-untouched)

Consumed READ-ONLY at base `a967ec90b71ee9784ec03534e25f51043735fb6f`: `core.item`/`core.vendor`/`core.item_category`/`core.distributor` + the `food.lab_test.equipment_id` binding + the water-side `ชนิดเครื่องมือตรวจ` picker; `chemical.inventory_lot` + `chemical.inventory_lot_deduction`/`inventory_lot_allocation` + `chemical.fn_deduct_chlorine_stock` + `chemical.fn_revoke_chlorine_deduction`; `core.item_calibration` (11 rows); `core.job_log` (1102) + `core.location_area` (15) + `core.fn_job_log_geofence()` (BEFORE INSERT trigger); `core.manual_wastewater` (10) + `core.manual_water_supply` (0 + marker) + `core.address` (7,436). Baselines asserted intact by the SQL battery preflight/post: 907/9/4 + 48/0 + 332 + lab_test 0 + item 0 + vendor 0 + item_category 0 + distributor 6 + inventory_lot 0 + item_calibration 11 + location_area 15 + job_log 1102 + manual_wastewater 10 + manual_water_supply 0 + address 7,436.

## 3. D-phase obligations

- **D2 RED first** — the TS suite fails-to-collect (module absent — the honest new-file RED mode); `tsc -b` records TS2307; the SQL battery is a new-file lane honestly NOT at RED — disclosed per the P2.6 framing (its subject is verification of EXISTING delivered semantics; its D3 first run is expected GREEN); ZERO durable writes at RED. Record every count verbatim; disclose any legacy pass.
- **D3** — the fixture tables (all five families with ref citations + divergence notes) + the SQL battery (single transaction BEGIN…ROLLBACK, synthetic probes only, zero net persistence, probe ids re-queried = 0, preflight/post baselines identical). No other file in the diff.
- **D4 battery** — vitest FULL; `tsc -b`; oxlint; Playwright FULL chromium workers=1; guard **344/344** (+450 subtests); runtime **62/62** (+32 subtests); `git diff --check` clean; checker `--tag v1.13.0` OK exit 0 (NO bump); 13-digit digit-run grep of new files = 0; diff ⊆ WO §7.
- **D5** — fresh-GLM independent review at the exact frozen head + independent battery rerun where possible + hand-verification of expected values vs the ref-12 verbatim formulas (incl. the three divergence pins). Implementer never merges.

## 4. Hard constraints (violations park the claim)

- Scope = the registry `mutable_scope` + WO §7 EXACTLY. Everything unlisted forbidden. Any rename-class change = recorded deviation, never silent.
- TEST-ONLY: `supabase/` diff MUST be EMPTY — NO migration/DB object/seed row/apply/grants; the battery never persists (rollback fully; probe residue 0).
- The delivered P3.1–P3.5 + P1/P2 surfaces and their suites are byte-untouched; consolidation = ADDITIVE tables only.
- NO bump expected: `frontend/package.json` 1.13.0 + `CHANGELOG.md` byte-untouched; any forced bump = STOP + adjudication (D1-3).
- Honesty: unknown ≠ zero (no stock = skipped + flagged; blank cycle ⇒ no next-due; the honest water-supply zero); synthetic fixture values only (no real personnel names, no Employee_id values, no production row copies); latest ≠ live; verbatim strings; พ.ศ. dates; zero unanticipated durable writes.
- No `.env`/secrets in commits or chat; no reference/plan-doc edits; no CI edits; no Phase 4 surface of any kind; no Drive writes.

## 5. Single next safe action

After the transition PR merges: create `_worktrees/env-parity-p3-006` off the new main tip, commit D2 RED (the suite importing the absent module + tsc evidence, zero durable writes), then D3 → D4 → D5 per §3 — stopping at REVIEW_REQUESTED.
