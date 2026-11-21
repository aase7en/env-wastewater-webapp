# Work Order — ENV-PHASE5-READY-001 (Claim ENV-PHASE5-READY-001-C1, gen 1)

**Status: CLAIMED (claim transition authored 2026-11-21, base `6bb14e98458bce30a7fdea7cb720358ef9bfebc4`
= the ENV-PERSONNEL-C8-001 closeout merge / PR #260). The transition PR is
docs-only (this WO + the lane handoff + `docs/ai/CURRENT-WORK.md`) and stops
at REVIEW_REQUESTED — the implementer never merges; the authorized reviewer
owns approval + merge of every PR in this lane's chain.**

The AppSheet parity program is COMPLETE through Phase 4 + repairs
(P4.1–P4.5 all CLOSED; the P4-ledger repair sweep and the prevent lane
delivered). What remains of the program is **Phase 5 คัทโอเวอร์ —
OWNER-GATED execution**. The C8 closeout frontier at this base names the
next candidate verbatim: *"the Phase-5 readiness toolkit lane (non-owner,
the next candidate — needs its own NEW reviewed claim transition)"*. THIS
claim IS that candidate.

**The lane is preparation tooling only — everything read-only or
additive-local.** It builds the evidence generator and the staff-facing
protocol documents the owner will USE when Phase 5 starts; it never starts,
executes, or triggers any Phase 5 step itself.

## 0. Ground truth

### 0.1 The plan §6 Phase 5 rows — VERBATIM (`docs/ai/APPSHEET-PARITY-PLAN.md:267-276`)

> ### Phase 5 — คัทโอเวอร์ (dual-run → เลิกใช้ AppSheet)
>
> | Lane | เนื้อหา |
> |---|---|
> | P5.1 | โปรโตคอล dual-run: บันทึกสองระบบคู่ขนาน ≥14 วัน — คิวรีตรวจ parity รายวัน (จำนวนแถว/วัน, วันที่ตรงกัน, สุ่มตรวจรายการ ≥98% ค่าตรงกันทุกช่องที่ ENV ครอบ) — เขียนเป็น SQL สำเร็จรูป (count/date parity) |
> | P5.2 | Backfill ประวัติที่เหลือจาก Sheets ก่อนตัดสลับ (§7) + ตรวจซ้ำหลังย้าย |
> | P5.3 | พิธีเลิกใช้: checklist ปิดฟีเจอร์ AppSheet (ปิดการเขียน คงอ่านอย่างเดียว ≥90 วัน) + เกณฑ์ rollback + บันทึกการตัดสินใจของเจ้าของ |
>
> - **ตารางที่แตะ:** ไม่เพิ่ม schema (ย้ายข้อมูล) · **lane: 3** · **ความเสี่ยง: กลาง**
> - **DoD เฟส (นิยาม "เปลี่ยนผ่านสำเร็จ"):** (1) จำนวนบันทึก/วันของ ENV = AppSheet ทุกวันในช่วง dual-run, (2) สุ่มตรวจรายวัน ≥98% ตรง, (3) ประวัติที่ย้ายตรวจนับผ่าน, (4) เจ้าของยืนยันเป็นลายลักษณ์อักษรว่าเลิกบันทึกใน AppSheet, (5) AppSheet คงสิทธิ์อ่าน ≥90 วันเป็น rollback

**The toolkit PREPARES these rows; the rows THEMSELVES stay owner-gated.**
This lane executes NONE of P5.1/P5.2/P5.3: no dual-run start, no backfill
execution, no AppSheet freeze/read-only/retirement, no production data
change. The P5.1 "คิวรีตรวจ parity รายวัน … เขียนเป็น SQL สำเร็จรูป" remains
the owner-gated execution lane; THIS lane ships the read-only count-comparison
TOOL and the checklist DOC that make that execution ready.

### 0.2 Repo/frontier evidence at base

| # | Evidence | Location | Fact |
|---|----------|----------|------|
| R1 | The recorded next candidate | `docs/ai/CURRENT-WORK.md` "Next frontier", the ENV-PERSONNEL-C8-001 CLOSED bullet (this base) | "Frontier after this closeout merges: NO active claim. Remaining: the Phase-5 owner checklist (dual-run/token/sheets — Step 1 awaiting owner shares, probe wakeup active), **the Phase-5 readiness toolkit lane (non-owner, the next candidate — needs its own NEW reviewed claim transition)**" — THIS claim IS that candidate |
| R2 | Program completion state | the ENV-REPAIR-P4-LEDGER-001 CLOSED bullet (PR #254 merged `61cf099`) | parity program "COMPLETE through Phase 4 + repairs"; "REMAINING = **Phase 5 คัทโอเวอร์ OWNER-GATED** (dual-run start ≥14 วัน, Telegram token via supabase secrets, cron-verify, sheet-shares — the owner's action)" |
| R3 | Established AppSheet-side read path | `scripts/test_parity_p3_003_calibration.py:81-82` + the seed-suite family | public workbooks fetched read-only via the docs.google.com XLSX-export fetch (no auth, no Drive writes) |
| R4 | The workbook enumeration receipt | `docs/ai/handoffs/ENV-PARITY-P3-005-GLM.md` (6-workbook re-enumeration 2026-11-19) | pond 12 tabs (`1kWtdmDzUNWTB5LnUY87fHjeK6Wcs8jTxeXCIkAoM6Vk`) / markad 6 tabs (`1AUjAulq0-YvfJVhcBtJJfJhesAPArqn6BhjP3Gi8azQ`) / งานสวน 4 / tool_maintainance 1 / extinguisher 5 / light 4 PUBLIC; the water-supply workbook and several masters NEVER publicly shared — the owner sheet-share obligation carried (the P4.005 frontier names: extinguisher master, คู่มือน้ำประปา, Items-Vendors-Categories, coliform) |
| R5 | Established ENV-side read path | `scripts/_env.py` (`load_secret`) + `scripts/test_parity_p1_001_schema.py:122,168` | ENV_DB read-only introspection via the Management API with `SUPABASE_ACCESS_TOKEN`; a missing token is an honest `LIVE_CONNECTION_UNAVAILABLE`, never a fabricated count |
| R6 | Data-honesty doctrine | `AGENTS.md` binding rules + the plan's global rule | unknown ≠ zero (ห้ามแทนค่าศูนย์); `latest` ≠ `live`; missing = listed, never filled; พ.ศ. user-facing dates |
| R7 | Release precedent | P3.6 / P4.2 / P4.4 / the repair lanes | internal tooling + docs-only lanes ship NO BUMP; checker `OK (v1.15.0)` exit 0 pinned |

### 0.3 Task-time source expectation (to be re-verified live at D1 — never assumed)

At authoring, the pond/water/sensor-relevant workbook tabs answer the public
XLSX fetch; ~6 sheets of the parity program's table set remain unshared. The
D1 live re-enumeration is the binding truth: whichever domains answer TODAY
get real count sections; whichever do NOT get an explicit Thai
`ยังไม่มีแหล่ง` (source-not-yet-available) section — never a 0-vs-0 parity
row, never a fabricated count. Drift vs this expectation pivots via the
coordinator, never a silent re-scope.

## 1. Authorization basis

1. **Owner standing Goal-mode instruction 2026-11-15/16** ("ต่อยาวๆ ตามแผนและ
   roadmap ที่วางไว้") — the parity plan is the recorded roadmap.
2. **Owner 2026-11-20 "มีส่วนไหนที่ทำไปก่อนได้บ้าง"** — the owner asked what
   can proceed ahead of the owner-gated decisions; the Phase-5 readiness
   toolkit is exactly such a non-owner, non-production, read-only
   preparation item: it creates no data, changes no production surface, and
   touches no owner decision.
3. **Parity plan §6 Phase 5 rows read verbatim (§0.1)** — the toolkit
   prepares those rows; the rows themselves remain owner-gated per the
   plan's own Phase-4/Phase-5 gating design ("ประตู owner decision").
4. **The C8 closeout frontier (R1)** — the base's own recorded frontier
   names this lane as the next candidate requiring its own reviewed claim
   transition; this claim is that transition.

This authorization basis is an explicit adversarial review item — an
insufficient basis parks the claim unmerged.

## 2. Deliverable inventory (the implementation lane's claimed files)

1. **`scripts/phase5_parity_check.py` (NEW)** — the parity count-comparison
   script; the Day-14 acceptance evidence generator.
   - ONE command: AppSheet side vs ENV side, per domain.
   - AppSheet side: the public Drive workbooks fetched READ-ONLY via the
     established XLSX-export path (R3/R4); workbook IDs + tab names read
     from the established seed-suite records, re-verified live at D1.
   - ENV side: ENV_DB READ-ONLY via the Management-API path (R5) —
     row counts + per-table MIN/MAX date-ranges; introspection only.
   - Emits a Thai report: per domain — counts per table per month on both
     sides, coverage % (denominator stated), missing-days lists, and the
     honest `ยังไม่มีแหล่ง` section for every unshared/unreachable source
     (`ไม่ทราบ` preserved wherever a value is not derivable).
   - Output: stdout + an optional local report file (path given by flag).
   - ZERO writes: no ENV_DB write, no Drive write, no repo write outside
     the optional local report file the operator names.
2. **`scripts/test_phase5_parity_check.py` (NEW)** — the D2-first contract
   suite. MOCKED sheet/DB response fixtures ONLY at D2 (zero live network):
   a full domain; an EMPTY domain (counts 0 shown AS empty-with-context,
   never read as parity success); an UNSHARED domain (the `ยังไม่มีแหล่ง`
   section emitted, never a 0-vs-0 parity row); a PARTIAL domain
   (month-gap → missing-days listed, coverage % denominator stated). Must
   FAIL truthfully before `phase5_parity_check.py` exists.
3. **`docs/ai/PHASE5-CUTOVER-CHECKLIST.md` (NEW, Thai)** — the staff-facing
   cutover protocol:
   - the ≥14 วัน dual-run protocol: the daily routine for staff (what to
     record, where, in which system, in which order), per plan P5.1;
   - the **friction-log template** (a section of this doc, kept
     lightweight — where staff report ENV-vs-AppSheet differences during
     dual-run; simple form guidance; NO new DB tables);
   - the acceptance criteria per domain (plan §6 DoD line 276, the 5
     conditions, quoted verbatim and operationalized per domain);
   - the backfill inventory (P5.2 prepared as inventory only): the ~6
     unshared sheets + what seeds when each arrives (source → table,
     guarded-seed precedent), execution explicitly the owner's;
   - the rollback/retirement checklist (P5.3 prepared as checklist only):
     AppSheet freeze → read-only period ≥90 วัน → archive export →
     retirement, + the rollback criteria + the owner decision record
     placeholder;
   - **every owner decision point marked clearly** (a distinct marked
     section style, e.g. "🡒 การตัดสินใจของเจ้าของ" callouts): dual-run
     start signal, sheet-shares, backfill execution, Telegram/cron
     activation if referenced, freeze, read-only window, archive,
     retirement, written owner confirmation (DoD condition 4).
   - พ.ศ. dates throughout.
4. **`docs/work-orders/ENV-PHASE5-READY-001.md`** (this WO) +
   **`docs/ai/handoffs/ENV-PHASE5-READY-001-GLM.md`** (the lane handoff) +
   **`docs/ai/CURRENT-WORK.md`** (registry + frontier, via the claim
   transition and later the closeout transition).

## 3. Out-of-scope guards (each needs its own NEW reviewed claim transition)

1. **Phase 5 execution** — dual-run start, backfill execution, AppSheet
   freeze/read-only/retirement, staff-workflow activation: OWNER-GATED,
   the owner's action (§0.1; the checklist marks the decision points,
   never pulls the trigger).
2. **Production DB writes / migrations** — no INSERT/UPDATE/DELETE/DDL on
   ENV_DB, no migration file, no `scripts/apply_migration_api.py` run. The
   P5.1 "SQL สำเร็จรูป (count/date parity)" is NOT built here — if the
   implementing lane finds a read-only SQL helper would serve the script,
   it stays INSIDE the script as a read-only query; no DB object ships.
3. **frontend/ + supabase/ + .github/** — zero diff (migrations/,
   functions/, config.toml, seed/, workflows).
4. **Reference/plan docs** — `docs/ai/APPSHEET-PARITY-PLAN.md`, digital-twin
   reference docs 11/12, `AGENTS.md`, design docs, `ENV-ENGINEERING-LOOP.md`,
   `DEFECT-MEMORY.md`, `HANDOFF.md`: READ-ONLY.
5. **Drive writes** — read-only exports only; no sheet/row/permission is
   ever modified; no share request is sent programmatically (sheet-shares
   are the owner's action, recorded in the checklist inventory).
6. **Other scripts/docs** — the parity seed suites, `env_coordination_guard.py`,
   `env_autonomy_runtime.py`, `check_release_version.py` stay byte-untouched.
7. **Secrets/PII** — `.env` + `data/raw/` never committed/printed; secrets
   flow only through `scripts/_env.py`; no token/JWT literal committed;
   PHI never enters script/report/committed file; Telegram credentials
   ห้าม commit ทุกกรณี.

## 4. Release ruling — NO BUMP (justify)

**NO BUMP — v1.15.0 STAYS, no tag, no CHANGELOG entry.** Justification: the
deliverables are internal tooling (`scripts/`) + internal docs
(`docs/ai/`); no user-visible app surface changes; the app the staff uses
is byte-identical. This is the P3.6/P4.2/P4.4/repair-lane precedent. The
D4 battery pins `scripts/check_release_version.py` → `OK (v1.15.0)` exit 0.
(The checklist doc itself records, for the OWNER's future cutover release
decision, that the actual ตัดสลับ day may warrant its own release per the
CHANGELOG criteria — that is the owner's later call, not this lane's.)

## 5. Delivery phases (D-phases)

- **D1 (READ-ONLY) — source reality re-verification.** Live
  re-enumeration of the public workbooks at the post-merge base: which
  domains answer the XLSX fetch TODAY; live ENV_DB introspection
  reachability check (a missing token = honest UNAVAILABLE, the suite's
  skip semantics, never a fabricated count). Drift vs §0.3 pivots via the
  coordinator — never a silent re-scope. Output recorded in the handoff D1.
- **D2 — truthful RED, mocked.** `scripts/test_phase5_parity_check.py`
  written FIRST against MOCKED sheet/DB response fixtures (full / empty /
  unshared / partial domains; zero live network). It must FAIL before
  `phase5_parity_check.py` exists, for the right reasons (missing module /
  missing report sections), with standing passes disclosed.
- **D3 — implement.** `scripts/phase5_parity_check.py` +
  `docs/ai/PHASE5-CUTOVER-CHECKLIST.md` (Thai, per §2.3). No other file
  appears in the diff.
- **D4 — battery.** At the frozen head: the NEW suite GREEN; FULL vitest;
  `tsc -b` clean; oxlint 0 errors; Playwright FULL chromium workers=1;
  guard 344/344; runtime 62/62; checker `OK (v1.15.0)` exit 0 (no-bump);
  `git diff --check` clean; the diff ⊆ the claimed scope with
  `docs/ai/CURRENT-WORK.md` diff EMPTY in the implementation PR; PII +
  secrets + token/JWT grep = 0 over ALL changed files; **PLUS the LIVE
  read-only smoke run**: run `phase5_parity_check.py` against the
  currently-public sources (real XLSX fetches + real ENV_DB introspection,
  zero writes) and record the emitted Thai report in the handoff as the
  generator's first real evidence — including the honest `ยังไม่มีแหล่ง`
  sections for the unshared domains.
- **D5 — fresh-GLM independent review** at the exact frozen head (battery
  rerun where possible; RED reproduction at the isolated D2 commit; the
  live smoke receipt checked read-only). STOP at REVIEW_REQUESTED —
  **the implementer never merges**; the authorized reviewer owns approval
  + merge.

## 6. D1 adjudication items (explicit reviewer checkpoints)

- **D1-1 the domain/table mapping** — every AppSheet-table ↔ ENV-table pair
  the checker reports is explicit and cited (the parity program's delivered
  table set; reference doc 12 for AppSheet names). An invented or silent
  mapping = P1.
- **D1-2 the two read channels ONLY** — public XLSX exports + read-only
  Management-API introspection. Any other channel (REST anon, service-role
  writes, Drive API mutations) = P1.
- **D1-3 honesty semantics** — unshared/unreachable source ⇒ `ยังไม่มีแหล่ง`
  section; NEVER a 0-vs-0 parity claim; missing days listed, never filled;
  coverage % denominators stated; `ไม่ทราบ` preserved; unknown ≠ zero.
- **D1-4 the owner-gated boundary (THE adversarial item)** — the checklist
  marks every owner decision point and the toolkit never executes a Phase 5
  step; no dual-run start, no backfill execution, no retirement, no
  production data change anywhere in the diff or the runtime behavior.
- **D1-5 the release ruling** — NO BUMP (§4), adversarial.
- **D1-6 the mocked-RED honesty** — D2 fails before implementation for the
  RIGHT reasons with zero live network; the LIVE smoke is D4-only,
  read-only, receipted.

## 7. Scope summary

- **mutable_scope:** `scripts/phase5_parity_check.py` (NEW) ·
  `scripts/test_phase5_parity_check.py` (NEW) ·
  `docs/ai/PHASE5-CUTOVER-CHECKLIST.md` (NEW) ·
  `docs/work-orders/ENV-PHASE5-READY-001.md` ·
  `docs/ai/handoffs/ENV-PHASE5-READY-001-GLM.md` ·
  `docs/ai/CURRENT-WORK.md`.
- **forbidden_scope:** §3 in full (the registry record enumerates it
  bindingly).
- **worktree:** `_worktrees/env-phase5-ready-001` (this transition branch
  `docs/env-phase5-ready-001-claim`; the implementation branch off the
  post-merge main tip, house `feat/env-phase5-ready-001` form, name pinned
  at D1).
- **base:** `6bb14e98458bce30a7fdea7cb720358ef9bfebc4`; fence
  `expected_policy_revision = 6bb14e98458bce30a7fdea7cb720358ef9bfebc4`,
  `expected_registry_hash = 11d15e4c25fcbb38844f604a45a4bd85f080cd89afc6ffdce2d816a436986a78`
  (guard `validate-registry` registry_hash AT `6bb14e9`; the method
  empirically reproduces the prior fence `0982e54e…` at `90ab52e`
  byte-exactly).
