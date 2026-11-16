# Handoff — ENV-PARITY-P1-007 (GLM implementing lane) · D0

Claim `ENV-PARITY-P1-007-C1` (gen 1, CLAIMED) — AppSheet parity Phase 1 FINAL lane P1.7: Tests + parity fixtures เทียบสูตร AppSheet (ตารางค่าคาดหวังจากสูตร verbatim) + the critical-flags public façade folded in per the PR #199 D5 D1-5 ruling.

## D0 — Claim transition authored (16 พฤศจิกายน 2569 / 2026-11-16)

Authored on branch `docs/env-parity-p1-007-claim` off base `dfd44238d500b25b653321880a82f3f4346b13ab` (= origin/main tip at authoring: the ENV-PARITY-P1-006-C1 docs-only closeout merge, PR #200; clean, fetched, ff verified; registry 31 claims at base with `ENV-PARITY-P1-006-C1` CLOSED). Docs-only transition — the implementing lane must be activated ONLY after this PR is independently reviewed and merged to main.

### Authorization basis (recorded, adversarial-check item)

1. Owner standing Goal-mode instruction 2026-11-15/16: "ต่อยาวๆ ตามแผนและ roadmap ที่วางไว้".
2. Owner parity authorization 2026-11-14 → `docs/ai/APPSHEET-PARITY-PLAN.md`; lane scope = §6 Phase 1 table row P1.7 bound exactly (plan line 221: "Tests + parity fixtures เทียบสูตร AppSheet (ตารางค่าคาดหวังจากสูตร verbatim)" — surface `tests`).
3. The D5 D1-5 ruling on PR #199 (issuecomment-6912632368, verbatim in WO §1-4): the `v_reading_critical_flags` façade gap is P1.3-origin (acceptable-with-record on P1.6); the named remedy is a façade-only micro-lane; folded into THIS lane per the PR #200 closeout frontier option 1 ("can ALSO carry the critical-flags façade per the D5 ruling if scoped at claim") — the fold is WO D1-1, an explicit reviewer adjudication item.
4. Coordinator transition instruction 2026-11-16 (goal-mode, coordinator session) binding the lane scope + routing + STOP at REVIEW_REQUESTED.

**No delegated consult was run in THIS transition** (honesty record): the binding decisions restate the plan row, the D1-5 ruling text, and reference-doc 12 verbatim ground truth; the genuinely new judgment items (the fold D1-1, TS-fixture format D1-2, rollback-smoke-vs-lib-exports D1-3, live-or-mocked e2e D1-4, v1.4.1 PATCH D1-5, the ≥98% reporting rule D1-6) are WO D1 items with rationale in place — the reviewer adjudicates them explicitly. This lane introduces NO new domain constant (all expected values come from reference doc 12 verbatim or the delivered spec seeds).

### Scope discoveries recorded at claim time (bind the lane shape)

1. **Façade gap evidence** (the D1-5 ruling's chain, re-verified read-only at base): `wastewater.v_reading_critical_flags` was created by P1.3 (`20261115130000_parity_p1_003.sql:288-295`) with NO `public.*` façade and no grant; every REST-reachable sibling got its façade in its own lane — `20260719000010_schema5_rest_exposure.sql` (v_dashboard_14day / v_reading_with_computed), P1.4 `20261116000001_parity_p1_004_equipment_spec_admin.sql:98-116` (public.v_reading_meter_chain — view + grant + notify pgrst + header rollback SQL), P1.5 `20261116000002_parity_p1_005_water_supply_usage.sql:241-245` (public.v_daily_check_chain). The migration shape is therefore fully pinned by the ruling text + the P1.4 sibling file (WO §3.1); NO design freedom is introduced.
2. **P1.6 wiring state** (`frontend/src/pages/ReportsPage.tsx:196-201`, `frontend/src/lib/supabase-queries.ts:388-406`): `fetchCriticalFlagsRange` already queries `v_reading_critical_flags` and the card renders the honest amber notice "ยังไม่พร้อมใช้ — ต้องมี public façade … (รอการอนุมัติเป็น migration แยก)" on the 404-class failure — the façade going live flips this to real counts with ZERO code change. The notice branch itself stays (dead-but-honest fallback); the P3-1 classifier wording suggestion (`/not found|404/i` vs PostgREST PGRST205 "Could not find the table …") stays a carried P3 — `ReportsPage.tsx` is forbidden scope here.
3. **E2E mock state** (`frontend/tests/e2e/env-parity-p1-006.spec.ts:123-138+`): the threshold case mocks the view endpoint with a 200 + fixed flag objects (P1.5 house pattern). The minimal tweak (D1-4) switches it live-or-mocked: prefer a live read-through of the applied façade, keep the mock as the no-DB-context fallback so CI stays green; the rest of the spec byte-identical.
4. **Testable-unit exposure state (why D1-3 pins the rollback-smoke route)**: the five fixture families live in SQL surfaces — `wastewater.v_reading_meter_chain` (LAG deltas, ÷SWITCH chlorine, spec-at-date volumes), `wastewater.fn_critical_flags`/`v_reading_critical_flags` (2-day streaks + immediate conditions), `wastewater.threshold` seeds, `water_supply.v_daily_check_chain` (×3.7 / ÷(1+9) spec-derived) — none of which are importable into vitest. The house route for SQL parity is the transactional rollback-smoke script (`scripts/test_parity_p1_002_meter_chain.py`, `scripts/test_parity_p1_003_thresholds.py` precedent: ONE transaction, synthetic probe rows, assert, full rollback, probe ids re-queried = 0). The lib side of the parity surface (`REPORT_CHLORINE_LITTER_FACTOR = 1.2`, ref 1949/2849 provenance comments) is ALREADY exported from `report-summary.ts` (P1.6 D1-3). ⇒ **Zero new exports required; every existing `frontend/src/lib/**` file is forbidden scope.** A discovered genuine need = STOP + record + adjudicated amendment.
5. **Threshold/streak ground truth**: the 8 seeded thresholds (`20261115130000…:151-199` — do1<1, do2<1, do3<1.5, free_chlorine 0.5..1, ph 5..9, tds2>1000, sv30 150..450, wastewater_in>70, `valid_from` DATE '2024-01-09'); the 2-day streak = per-date EXISTS at D−2/D−1/D over exact calendar equality (P1.3 WO §2.2 — NOT a naive LAG chain; NULL never violates; a missing day ⇒ no streak); the chlorine continuous streak = P1.2 gaps-and-islands (`Chlorine_StreakCount`); sv30/wastewater_in are IMMEDIATE single-day conditions (no streak).
6. **Meter-chain ground truth**: AppSheet `คำนวณสูบ 1/2` ×34/×12 hardcoded (ref 802–816), `เลขมิเตอร์เมื่อวาน` = global MAX over ALL rows (ref 778–787), `last_meter_สูบ1/2` = global-MAX-before (ref 789–800); ENV `20261115140000_parity_p1_002.sql:302-420` = per-meter LAG + spec-at-date flows + `delta_kwh` NULL-on-boundary + `meter_boundary_flag` + `streak_reset`. The three KNOWN INTENTIONAL DIVERGENCES (LAG-vs-global-MAX; delta≤0→NULL vs negative raw difference; spec-config vs hardcoded ×34/×12) are pinned in WO §2.1 — every affected fixture encodes the CORRECTED expectation + note + refs (never silently matching a bug).
7. **Estimates ground truth**: `Energy_use` ×3.7 negative→0 (ref 2529–2539) vs ENV spec-derived 3.7 + honest NULL/boundary (owner A2, plan §5.3 commit `fb57369`); `Water_In = [Hour_Work]*8` (ref 2547–2553) RECORDED-NOT-REPLICATED (P1.5 D1-5: spec-flow-driven, never hardcoded 8; NULL + flag until the owner seeds the flow).
8. **NO data writes, NO backfill** (plan §7): the rollback-smoke transaction rolls back fully; probe ids re-queried = 0; `wastewater.threshold_alert` never read/written by tests; no real history rows touched.

### D2 RED-first plan (binding counts recorded by the lane at execution)

- Unit `frontend/src/lib/parity-fixtures.test.ts`: fixture tables load + every case carries a ref citation (a meta-test pins citation completeness); the lib-side pins (×1.2 constants named + provenance; พ.ศ. where in parity scope) run against existing surfaces — pass-by-design disclosed honestly, never claimed as RED.
- SQL `scripts/test_parity_p1_007_fixtures_sql.py`: RED on the missing façade read-through (anon/authenticated REST probes fail until the migration applies) + any case whose assertion harness is not yet wired.
- E2E `env-parity-p1-006.spec.ts`: the tweaked threshold case fails truthfully pre-apply when in live mode.
- RED counts recorded verbatim in the D2 section; RED-era files committed or provenance disclosed (P1.2/P1.5/P1.6 D5 precedent).

### Truth constraints (binding)

unknown ≠ 0 (missing/boundary/spec-missing ⇒ NULL + flag, never 0, never a fabricated streak); latest ≠ live; AppSheet formulas verbatim-recorded with reference lines in every case; divergence honesty (encode the CORRECTED expectation + note + refs — never silently match a bug; divergent cases count as passing only when asserting the corrected expectation); ≥98% figure reported from the actual D4 run; the façade migration additive-only (base view `pg_get_viewdef` byte-identical; RLS untouched; security_invoker + grant shape only); no client-side re-derivation of view math; พ.ศ. dates; no PHI; no secrets printed (`.env` values never); no durable writes in tests; no assertion weakening; implementer never merges.

### Fence (transition)

`expected_policy_revision = dfd44238d500b25b653321880a82f3f4346b13ab`
`expected_registry_hash = eef1dc00e4742f766d1101ab616d46962f955d0a15647ed51b95fca1ed42b492` (registry block AT base, guard method `scripts/env_coordination_guard.py:454-456`; `validate-registry` on `git show origin/main:docs/ai/CURRENT-WORK.md` at base = `{"claims": 31, "ok": true, "registry_hash": "eef1dc00…"}`; cross-checked via `guard status` — policy_revision `dfd44238…`, registry_hash `eef1dc00…`, 31 claims). Prior fences (`be4a342…` / `91b662b…`) re-pinned to the new base in this transition.

## D-phase log (implementation lane appends below)

### D2 — RED record (as-run, verbatim; 16 พ.ศ. 2569)

- **Unit `frontend/src/lib/parity-fixtures.test.ts`**: RED = fail-to-collect before the files existed (suite is pure-additive over shipped P1.4–P1.6 surfaces). At the D2 commit (`bbc5f98`): **20/20 passed — pass-by-design disclosed** (fixture-table integrity pins + factor-1.2 executed against the shipped lib + mix-enum/estimate-vocabulary pins + source-scan hygiene pins).
- **SQL `scripts/test_parity_p1_007_fixtures_sql.py`**: RED = **4 failed / 6 passed / 43 subtests passed** pre-apply. Failures = exactly the façade group (FAC-01/02/03/05; REST probe HTTP 404 PGRST205). Viewdef byte-pin passed pre-apply by design (base unchanged). Fixture families passed pre-apply (delivered P1.2/P1.3/P1.5 objects) — pass-by-design disclosed.
- **E2E**: no forced-live RED run pre-apply (gated behind `E2E_CRITICAL_FLAGS_LIVE`; the truthful pre-apply live behavior = PGRST205 404, recorded by the SQL suite's FAC-03 RED). Mocked path unchanged (CI green at RED — disclosed).
- Harness notes (honesty): `uv run --with pytest` used for the Python suite (pytest is NOT a repo dev-dependency — pyproject.toml/uv.lock untouched, out of mutable scope); a stray `npm install` lockfile normalization was reverted (out of scope); `frontend/.env` created locally from the approved Drive secrets resolver (gitignored, never committed, values never printed) — required by pre-existing `water-supply-parity.test.ts` module-load assertions, unrelated to this lane's files.

### D3 — implement + apply receipts (16 พ.ศ. 2569)

- **Migration name**: applied as **`supabase/migrations/20261116000003_parity_p1_007_critical_flags_facade.sql`** per the coordinator implementation instruction (claim-era draft pinned `20261117000000_…`; deviation recorded per WO §3.1 clause, never silent; WO §3.1/§5 re-pinned in the implementation commit). **App-side mock-toggle check**: NO mock-mode toggle exists in app code — `ReportsPage.tsx` calls `fetchCriticalFlagsRange` directly with the honest-notice catch; the e2e tweak is therefore spec-file-only (+23 lines; rest byte-identical). ReportsPage.tsx itself NOT touched (P3-1 classifier wording stays a carried P3).
- **Zero-DML preflight OK**: base view exists; public façade absent; base rows = 907; pre-apply `pg_get_viewdef` captured (531 chars, embedded as the smoke suite canonical); statement-surface scan = no DML outside comments.
- **Apply**: `uv run python scripts/apply_migration_api.py supabase/migrations/20261116000003_parity_p1_007_critical_flags_facade.sql` → **4/4 statements OK** (drop-if-exists / create view with (security_invoker=on) / grant select to authenticated / notify pgrst).
- **Post-verify (live ENV_DB, project gllqtbyofrcjzmbnfoeh)**: façade exists; **row counts match 907 = 907**; `reloptions = ["security_invoker=on"]`; base `pg_get_viewdef` **byte-identical pre/post (raw string equality)**; anon REST = **HTTP 401 / PG 42501 "permission denied for schema wastewater"**; authenticated SELECT = TRUE. **Grant-mechanism note (reviewer-relevant)**: Supabase default privileges grant anon nominal table privileges on new `public` objects — VERIFIED IDENTICAL on the P1.4 sibling `public.v_reading_meter_chain` — so the anon fail-closed proof is at QUERY time (security_invoker + anon's missing USAGE on schema wastewater), not `has_table_privilege`; the smoke suite pins exactly this mechanism (`anon_ww_usage = false` + the 401 REST probe). Rollback SQL in the migration header, **unexecuted**.
- **SQL suite GREEN post-apply**: **10 passed / 0 failed / 43 subtests passed**.
- **E2E live-mode run**: full `env-parity-p1-006` spec with `E2E_CRITICAL_FLAGS_LIVE=1` + real ENV_DB REST context → **12/12 passed** (live probe: façade registered + anon denied; UI assertions as before).

### D4 — battery + achieved parity % (as-run)

- vitest FULL **630 passed / 1 skipped (designed skipIf) / 0 failed** (36 files) · tsc -b clean · oxlint **exit 0** (pre-existing warnings only) · Playwright FULL `--workers=1` **248 passed / 0 failed** (5.7m) · reports spec live-mode **12/12** · guard **344 + 450 subtests** · runtime **62 + 32 subtests** · checker regression suite passed · `check_release_version.py --tag v1.4.1` **OK** · `git diff --check` clean · `validate-registry` `{"claims": 32, "ok": true}` (registry untouched by this implementation PR).
- **ACHIEVED PARITY % = 100%** (45/45 executable fixture cases at D4; DoD ≥98% met): meter-chain 5/5 · chlorine 6/6 · factor-1.2 2/2 (vitest-executed) · threshold seeds 8/8 · streak/immediate 18/18 · estimates 6/6. **Divergent cases: 9** (MC-01..04, CH-05, ES-01..04) — each asserts the CORRECTED expectation with a note naming a pinned divergence kind (LAG-vs-global-MAX; delta≤0→NULL vs raw difference; spec-config vs hardcoded ×34/×12; ÷10-in-the-schema ≡ ÷(1+9)-from-spec; ×3.7 spec-derived/negative→0 NOT replicated; Water_In ×8 RECORDED-NOT-REPLICATED). No silent formula matches; no assertion weakening.
- Release: `frontend/package.json` **1.4.0 → 1.4.1 PATCH** + CHANGELOG Thai พ.ศ. entry (v1.4.1 — 16 พฤศจิกายน พ.ศ. 2569; the /reports threshold card notice → real counts) + PR-ref line (PR #202 predicted at authoring — corrected by follow-up commit if the created PR differs). Tag v1.4.1 remains POST-MERGE work (deployed-SHA tag per the release policy — NOT this lane).

### D5 — pending

Fresh-GLM independent review at the exact frozen PR head; implementer never merges. The reviewer should re-run: (a) the SQL suite (`uv run --with pytest python -m pytest scripts/test_parity_p1_007_fixtures_sql.py -q` — needs SUPABASE_ACCESS_TOKEN/SUPABASE_ANON_KEY via the approved resolver), (b) the vitest + Playwright batteries, (c) the façade `pg_get_viewdef` byte-pin against the pre-apply canonical embedded in the smoke suite.

## D6 — CLOSEOUT RECEIPT (only by a separate reviewed closeout transition)

Recorded by the closeout transition `docs/env-parity-p1-007-closeout` off
`origin/main @ 2d766736b8bd2dce2f9e0d2e23d25d9e1819eae6` (the implementation
merge SHA; clean, fetched, ff-verified — local HEAD = `origin/main` = the base
SHA, `git status` clean except the pre-existing untracked `_worktrees/` which
is not this transition's file). Fence:
`expected_policy_revision = 2d766736b8bd2dce2f9e0d2e23d25d9e1819eae6`;
`expected_registry_hash = d16381885aa8e55f474b1920cea7df321bb37fb1467a5dfc3625c64e71bad3ec`
(guard `registry_hash` of the registry block AT `2d76673` —
`validate-registry` on the clean checkout at that SHA =
`{"claims": 32, "ok": true, "registry_hash": "d1638188…"}`, same guard method
(`scripts/env_coordination_guard.py:454-456`) as the
PR #166/#169/#185/#188/#191/#194/#197/#200 closeout convention; the value was
independently recomputed by the PR #201 R2 reviewer as the head-block hash —
same convention: the fence pins the base state). Claim
`ENV-PARITY-P1-007-C1`: CLAIMED → CLOSED; claim-by-claim JSON-diff vs
`2d76673` = exactly 1 of 32 claims changed, the other 31 byte-identical;
changed files = exactly 3 (`docs/ai/CURRENT-WORK.md`,
`docs/work-orders/ENV-PARITY-P1-007.md`, this handoff).

### Full chain (each receipt verified live 2026-11-16 before writing)

1. **Claim transition** — PR #201 MERGED as
   `2a8de7d37eda18033dd6656362b7ddb532389f1e` (parents EXACTLY
   `dfd44238d500b25b653321880a82f3f4346b13ab` + the R2-APPROVED reviewed
   transition head `9e937f3026d9b9b1082da540c1320606425d5d7b`; mergedAt
   2026-11-16T10:39:40Z); R2 APPROVED issuecomment-6914097689 (fresh
   independent reviewer, exact-SHA, not the author) — **0×P1 / 0×P2 / 0×P3**,
   fence independently recomputed (`eef1dc00…` at base `dfd4423`, guard
   method) and the claim-by-claim JSON-diff reproduced (exactly 1 added
   claim, 31 byte-identical); merge trail recorded in-thread.
2. **Implementation PR #202 MERGED as
   `2d766736b8bd2dce2f9e0d2e23d25d9e1819eae6`** — second parent EXACTLY the
   D5-APPROVED reviewed head `f4515c6a8ca3796878312c5c6b28b93081675f2f`
   (verified from the merge commit object; merge commit, no squash);
   merge-executor review trail issuecomment-6915442926 pins the D5 receipt,
   expected head, and merge policy.
3. **D2 truthful RED `bbc5f98`** (disclosed as-run): the SQL rollback-smoke
   suite **4 failed / 6 passed** pre-apply — failures = exactly the façade
   group FAC-01/02/05/03 against the UNAPPLIED façade (REST probe PGRST205
   404); the 43 fixture subtests pass-by-design against the delivered
   P1.2/P1.3/P1.5 objects — disclosed, never claimed as RED. The parity unit
   suite failed-to-collect at RED (module absent), then **20/20
   pass-by-design disclosed** (pure-additive over shipped P1.4–P1.6
   surfaces). No forced-live e2e RED (truthful pre-apply behavior = the same
   PGRST205 404 the SQL suite recorded; default mocked path unchanged).
4. **D3** — the ONE façade migration
   `20261116000003_parity_p1_007_critical_flags_facade.sql` applied to ENV_DB
   via `scripts/apply_migration_api.py` **4/4 statements OK** with the
   zero-DML preflight + live post-verify: façade rows **907 = 907**, base
   `pg_get_viewdef` **byte-identical pre/post**, anon REST **HTTP 401 / PG
   42501** (security_invoker + anon missing USAGE on schema wastewater),
   authenticated SELECT = TRUE; rollback SQL documented, unexecuted.
   Migration-name deviation recorded, never silent (claim draft
   `20261117000000` → applied `20261116000003`, coordinator instruction
   pinned, re-pinned in the WO). E2E tweak spec-file-only (live-or-mocked;
   NO app code change).
5. **D4 battery + ACHIEVED PARITY = 100%** — vitest FULL **630 passed / 1
   skipped** (36 files; parity-fixtures 20/20) · tsc clean · oxlint 0 errors
   · Playwright FULL **248/248** workers=1 (+ reports spec live-mode 12/12)
   · guard 344 + 450 subtests · runtime 62 + 32 subtests ·
   `git diff --check` clean. **45/45 executable fixture cases** vs the P1
   DoD ≥98% — met; **9 divergent cases** (MC-01..04, CH-05, ES-01..04) all
   assert the CORRECTED expectation with divergence notes (LAG-vs-global-MAX;
   delta≤0→NULL vs negative raw difference; spec-config vs hardcoded
   ×34/×12; ÷10-in-the-schema ≡ ÷(1+9)-from-spec; ×3.7 spec-derived/
   negative→0 not replicated; Water_In ×8 RECORDED-NOT-REPLICATED) — no
   silent formula match.
6. **D5 fresh-GLM independent review** — APPROVED at exact head `f4515c6`
   (issuecomment-6915414332): **0 blocking; 2 non-blocking P3** (ES-04
   wording; CH-01 ref range off-by-one). D5 hand-computed the fixture
   expected values (incl. the MC-04 interleaved corrected expectation) and
   re-ran the battery.
7. **Release v1.4.1 PATCH LIVE** — `frontend/package.json` 1.4.0→1.4.1 +
   Thai พ.ศ. CHANGELOG entry (threshold card notice → real counts); Pages
   run **43860200309 SUCCESS @ `2d76673`**; live markers verified fresh from
   the live origin (`index-BcL044EM.js` carries `1.4.1`; lazy chunk
   **`ReportsPage-S2i4fQdi.js` HTTP 200** carries the live threshold card
   reading `v_reading_critical_flags` + testids + threshold vocabulary — the
   `ยังไม่พร้อมใช้` string remains in the bundle ONLY as the dead fallback
   branch of the fetch-catch ternary, honest-by-construction); annotated tag
   `v1.4.1` (object `2194aa9562126dfeca8c9b35c1b38755be06bba2`) dereferences
   `^{}` → `2d76673` (the deployed merge SHA); `check_release_version.py
   --tag v1.4.1` → OK, exit 0.

### PHASE 1 COMPLETION RECORD — ALL 7 LANES CLOSED

| Lane | Scope | Claim SHA | Impl SHA | PRs | Release |
|---|---|---|---|---|---|
| P1.1 | schema parity (enums + 10 status columns) | `aeda44108882e0dda2f55134c62a610b2da5fbd3` | `d15398343ecc6c749acc5ef801107287771d1ff7` | #183/#184 | — (schema-only) |
| P1.3 | thresholds + `fn_critical_flags` + `v_reading_critical_flags` | `a65125ecfa3338a0c37102e62337d9b41bbcdddc` | `83b2ba05d7690d1113459418bfff98a3754b80d0` | #186/#187 | — |
| P1.2 | `core.equipment_spec` + meter-chain LAG view | `93e197e9d2d91ff320c0f739dfa09e9fe5934623` | `85ddf75eb4eec5070abd9f8f438f880497721acb` | #189/#190 | — |
| P1.4 | form parity + spec admin + façade pattern | `01433f0274606f09ebfdc15e55931d2e8cfff026` | `b4c31726dd07e993e3ad953bbefc71651154fad8` | #192/#193 | v1.2.0 |
| P1.5 | water-supply usage + chain | `049b097cfb9edd139df4643aa6470050a14cd9a9` | `39402c9b3716fefd7ebb4d2bbea464efa77e25a4` | #195/#196 | v1.3.0 |
| P1.6 | `/reports` range summary | `a99f27ca44e570687f4fb4474613b3db17d49bb7` | `be4a342523c033df4382fce7285e93ebbb410da0` | #198/#199 | v1.4.0 |
| P1.7 | parity fixtures + critical-flags façade | `2a8de7d37eda18033dd6656362b7ddb532389f1e` | `2d766736b8bd2dce2f9e0d2e23d25d9e1819eae6` | #201/#202 | v1.4.1 |

(All 14 SHAs verified resolving in the merged main history before recording.)

**P1 DoD status (plan §6/§7):**

1. **ทุกช่องรายวันของ AppSheet มีทางเข้าใน ENV ✓** — บ่อบำบัด (`wastewater.reading` + views/forms) และ น้ำประปา (`water_supply.daily_check` + chain) ครบทั้งสอง surface.
2. **สูตร parity 100% ≥ 98% ✓** — 45/45 executable fixture cases, 9 divergent all corrected-expectation with notes.
3. **เจ้าของลองบันทึกจริง 1 สัปดาห์คู่ขนาน = PENDING OWNER ACTION** — the remaining DoD item, recorded as the frontier's HUMAN GATE: **เชิญเจ้าของเริ่ม dual-run บันทึกคู่ขนาน AppSheet+ENV ตั้งแต่บัดนี้ได้** (ทั้งสองระบบพร้อมใช้คู่ขนานแล้วตั้งแต่ v1.4.1 — ทุกช่องของ AppSheet มีทางเข้าใน ENV และสูตรตรงตาม fixture แล้ว).

### P3 ledger (carried; none repaired silently in this closeout)

1. **ES-04 wording** (D5 P3): the estimate-family fixture ES-04's wording needs tightening (ref-range/expectation phrasing) — future fixture-doc pass.
2. **CH-01 ref range off-by-one** (D5 P3): the CH-01 fixture's reference-line citation is off by one line — future fixture-doc pass; both are citation/wording quality items, not computation defects (D5 hand-computed the values themselves as correct).

Plus the standing ledger carried forward: the enum-mirror create-path sync gap
(candidate: fold into the fn_create_reading fix lane), the P1.3 NULL-guard
multi-location follow-up (REQUIRED before any second-location onboarding), the
P1.001 owner-gated VALIDATE CONSTRAINT follow-up, the personnel C8 proposal
(pending owner decision), the P1.6 P3s (404-classifier wording — the
specific-notice branch is now dead-but-honest with the façade live;
year-scoped 12-month grid), the P1.2 D5 P3s (RED-era file provenance;
row-based streak dup-date note; append-only/btree_gist hardening; redundant
rollback DELETE).

### Frontier recorded at closeout

NO active claim. **BOTH options recorded honestly** — the natural pause point
is exactly here (Phase 1 complete + the dual-run invitation open):
(a) **continue Phase 2** (ถังดับเพลิง/ไฟฉุกเฉิน/coliform — 6 lanes) per the
owner standing instruction ต่อยาวๆ ตามแผนและ roadmap ที่วางไว้ — each lane
requires its own NEW reviewed claim transition; or (b) **pause at the Phase 1
boundary** and resume Phase 2 on the owner's dual-run signal. Neither option
self-executes from this CLOSED record. Standing: hooks #155
approved-not-started (owner-manual, not agent-actionable), #156 open
(owner-manual), Building WAITING_EXTERNAL, Phase 4 authorized awaiting Phase
reach (owner decisions OPEN per plan §5.3/§8 risk row 4).

### Honest notes

- Merge executed by the authorized reviewer per the STOP-at-REVIEW-REQUESTED
  protocol; this closeout is a separate docs-only transition and likewise
  stops at REVIEW_REQUESTED (implementer never merges — the closeout author
  is not the merger).
- All receipts (PR states, merge SHAs + parents, review comment IDs, trail
  ID, Pages run, tag peel, live markers, checker, the 14 lane SHAs) were
  verified live before any text was written; no receipt is copied from chat
  memory.
- The GitHub Releases API has no `v1.4.1` release object (404) — consistent
  with the house convention: the version release surface is the
  package.json bump + พ.ศ. CHANGELOG entry + annotated tag at the deployed
  merge SHA + live-marker verification (same as v1.2.0/v1.3.0/v1.4.0; no
  GitHub Release object was created for any of them).
- The worktree `_worktrees/env-parity-p1-007` is preserved clean at the
  delivered head (fully merged via PR #202). Scope lock released at
  generation 1; CLOSED confers no fresh mutation authority; all other work
  still requires a NEW claim transition.
