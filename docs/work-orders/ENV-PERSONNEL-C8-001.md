# Work Order — ENV-PERSONNEL-C8-001 (Claim ENV-PERSONNEL-C8-001-C1, gen 1)

**Status: REVIEW_REQUESTED (implementation delivered 2026-11-21; the
implementer STOPPED here — the authorized reviewer owns approval + merge).
Full implementation receipts: `docs/ai/handoffs/ENV-PERSONNEL-C8-001-GLM.md`
§Implementation receipt (D1 evidence, D2 RED, D3 apply incl. the
ordering-deviation record + PII-incident note, D4 battery).**

The AppSheet parity plan's C8 deferral, closed: ONE migration correcting
`core.personnel`'s two enum CHECK surfaces per the owner's explicit approval.
The lane was explicitly parked twice and is now the recorded gated successor
of the prevent-lane closeout frontier:

1. plan `docs/ai/APPSHEET-PARITY-PLAN.md` C8 row (line 199): "enum ตำแหน่ง
   (3)/สถานะ (6) บุคลากร — ให้ AI **เสนอตัวเลือกมาให้เจ้าของอนุมัติทีหลัง**
   (ยังไม่ตัดสินตอนนี้)" — the owner's deferral answer 2026-11-15
   "ให้เสนอมาภายหลัง".
2. The C8 proposal presented 2026-11-20 (`/tmp/env-c8-personnel-proposal-2026-11-20.md`,
   read-only live-DB receipt; attached to the lane handoff verbatim-except-PII)
   with the owner's decision menu §4 — options ①–④.
3. **Owner approval 2026-11-21 "อนุมัติทั้งหมด" = option ①**, and the
   prevent-lane closeout frontier (PR #257 merged `ecf4b88…` = this base)
   recorded verbatim: "the C8 personnel proposal AWAITING OWNER APPROVAL
   (presented in-chat 2026-11-20; execution = a small gated lane once the
   owner picks an option)". THIS claim IS that gated lane.

NO frontend. NO feature surface. NO CI. NO Phase 5. NO BUMP.

## 0. Ground truth (live-DB evidence at proposal time + repo evidence at base)

The proposal receipt fetched the live table state read-only via the Supabase
Management API on 2026-11-20T20:44Z (project `ENV_DB` `gllqtbyofrcjzmbnfoeh`),
columns `employee_code` / `position` / `status` only — no national-ID, phone,
or photo columns touched. Its table (9 rows, cited here BY SYNTHETIC CODE
ONLY — the name column is PII and is redacted in the handoff attachment):

| Code | Position (live) | Status (live) | Position passes old 5-value enum? | Status passes 4-value enum? |
|---|---|---|---|---|
| STAFF-001 | พนักงานบริการ | active | ✅ | ❌ |
| STAFF-002 | ผู้ช่วยช่างทั่วไป | active | ❌ | ❌ |
| STAFF-003 | พนักงานเปล | active | ❌ | ❌ |
| STAFF-004 | พนักงานบริการ | ลาออก | ✅ | ✅ |
| STAFF-005 | พนักงานบริการ | ลาออก | ✅ | ✅ |
| STAFF-006 | พนักงานบริการ | active | ✅ | ❌ |
| STAFF-007 | พนักงานบริการ | ลาออก | ✅ | ✅ |
| STAFF-008 | นักวิชาการสาธารณสุข | active | ✅ | ❌ |
| STAFF-009 | พนักงานช่วยเหลือคนไข้ | active | ❌ | ❌ |

Exact defect counts (matching the D5 inspection of the P1.1 lane):
**3 rows with positions outside the old enum, 6 rows with status `active`
outside the 4-value enum** (`active` never existed in AppSheet's สถานะ enum
at all). Both P1.1 CHECKs verified live as **NOT VALID** (`convalidated =
false`) — the recorded owner-gated follow-up from the P1.001 closeout ledger.

Repo evidence at base:

| # | Evidence | File:line | Fact |
|---|----------|-----------|------|
| R1 | The old position CHECK (5 values) | `supabase/migrations/20261115120000_parity_p1_001.sql:129-146` | `ck_core_personnel_position_enum CHECK (position IN ('นายแพทย์','พนักงานบริการ','นักวิชาการสาธารณสุข','นักโภชนาการ','พนักงานประกอบอาหาร')) NOT VALID` — idempotent DO-block guarded |
| R2 | The status CHECK (4 values) | same file `:148-166` | `ck_core_personnel_status_enum CHECK (status IN ('ทำงาน','ย้ายกลุ่มงาน','ลาออก','ลาศึกษาต่อ')) NOT VALID` — the enum values are CORRECT already; only `active` data violates, and VALIDATE is deferred |
| R3 | AppSheet enum ground truth | `docs/ai/digital-twin/12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md` §3.2 | ตำแหน่ง = Enum 5 ค่า; สถานะ = Enum 4 ค่า (`ทำงาน`/`ย้ายกลุ่มงาน`/`ลาออก`/`ลาศึกษาต่อ`); the ~12 Valid If formulas referencing [ตำแหน่ง]/[สถานะ] rely on these value sets (the recorder gate, the extinguisher-inspector gate, the sample gate) |
| R4 | The recorder gate shape (P1.4) | doc 12 ref 716–720, delivered P1.4 | Valid If `position ∈ {นักวิชาการสาธารณสุข, พนักงานบริการ} ∧ status = 'ทำงาน'` — STAFF-001 (พนักงานบริการ) currently FAILS the `=ทำงาน` clause because the row holds `active`; after this lane it PASSES. STAFF-008 (นักวิชาการสาธารณสุข) likewise |
| R5 | The plan's deferral row C8 | `docs/ai/APPSHEET-PARITY-PLAN.md:199` + `:203` | "C8/D9/D10 อยู่นอกขอบเขตเอกสารนี้โดยตรง บันทึกไว้ให้ receipt ครบถ้วน" — the owner-approval gate was the recorded plan design, now satisfied |
| R6 | The valid-if dropout risk | proposal §3.1 row STAFF-001 | keeping `active` would leave the ผู้บันทึกหลัก (77 audit rows point here) OUTSIDE the parity recorder gate `[สถานะ]="ทำงาน"` — the correction is also a correctness fix for the delivered P1.4 gate |
| R7 | The precedent mechanism | P1.1 header + P1.001 closeout ledger | "a later VALIDATE is an owner-gated follow-up" — THIS lane is that follow-up, executed by DROP + re-ADD for the position CHECK (value set changes) and plain VALIDATE for the status CHECK (value set unchanged) |

## 1. Authorization basis

1. Owner deferral 2026-11-15 "ให้เสนอมาภายหลัง" (the plan C8 row's own
   instruction to propose later).
2. The C8 proposal presented 2026-11-20 with the four-option menu
   (`/tmp/env-c8-personnel-proposal-2026-11-20.md`; the handoff carries the
   attachment verbatim-except-PII).
3. **Owner approval 2026-11-21 "อนุมัติทั้งหมด"** — approving the proposal's
   recommended option ①: (1) สถานะ 6 แถว `active`→`ทำงาน`; (2) เพิ่มค่า
   ตำแหน่งใหม่ 3 ค่า (`ผู้ช่วยช่างทั่วไป`, `พนักงานเปล`,
   `พนักงานช่วยเหลือคนไข้`) keeping every existing position value; (3) จากนั้น
   VALIDATE ทั้งสอง constraint. NO position value changes on any row.
4. The prevent-lane closeout frontier (PR #257 merged `ecf4b88…` = this
   base) recording C8 execution as "a small gated lane once the owner picks
   an option" — the gate is now answered; THIS claim IS that lane.

## 2. The item inventory — every proposal element adjudicated (none silently dropped)

| Item | Source | Ruling | Where it lands |
|------|--------|--------|----------------|
| (1) สถานะ 6 แถว `active` → `ทำงาน` | proposal §3.1 + owner option ① | **FIX-DATA** — exactly 6 rows, targeted ONLY by the synthetic `employee_code` set `('STAFF-001','STAFF-002','STAFF-003','STAFF-006','STAFF-008','STAFF-009')` AND the `status='active'` predicate; count pinned: exactly 6 affected, 0 `active` rows remain, `ทำงาน` = 6 | implementation D3, ONE migration |
| (2) position enum 5 → 8 values | proposal §3.2 + owner option ① | **EXTEND-ENUM** — DROP `ck_core_personnel_position_enum` + re-ADD with the same 5 verbatim values + the 3 new real-role values, **NOT VALID initially**; the 3 outside-old-enum rows (STAFF-002/003/009) KEEP their exact position values — made legal by the extension, never rewritten | implementation D3, same migration |
| (3) VALIDATE both CHECKs | proposal §5 item 2 + owner option ① + the P1.001 ledger follow-up | **VALIDATE after data conforms** — `ALTER TABLE core.personnel VALIDATE CONSTRAINT ck_core_personnel_position_enum;` + `… ck_core_personnel_status_enum;` (the status CHECK is never dropped — its value set is already correct; only VALIDATE flips `convalidated` to true) | implementation D3, same migration |
| (4) the 5 unused old position values + the 3 unused old status values | proposal §3.2 closing note | **KEEP ALL** — `นายแพทย์`/`นักโภชนาการ`/`พนักงานประกอบอาหาร`/`ย้ายกลุ่มงาน`/`ลาศึกษาต่อ` stay in the value sets; the AppSheet Valid If formulas reference them (the หัก-นายแพทย์ gate, the sample gate) — dropping any would break parity silently | migration value sets, verbatim |
| (5) STAFF-003 พนักงานเปล vs พนักงานช่วยเหลือคนไข้ | proposal §3.2 row STAFF-003 (option-② conditional) | **RESOLVED-BY-OWNER: keep both values** — option ① keeps `พนักงานเปล` as its own enum value (8 values total); no rename, no merge | closed by the approval record |
| Regression pins — the P1.4 recorder gate + the 9-row baseline | this WO | **PIN-TESTS** in the NEW suite: pre-fix 6×`active` (gate-shape probe: STAFF-001 FAILS the P1.4 `status='ทำงาน'` clause); post-fix 6×`ทำงาน` + 3×`ลาออก` (STAFF-001 PASSES; STAFF-004/005/007 ลาออก rows stay FAILING the gate exactly as AppSheet intends); positions byte-unchanged row-by-row; `convalidated = true` ×2 | D2/D4 |
| Everything else — other rows/columns/tables, RLS, policies, grants, the `public.personnel` façade, frontend, functions, CI, Phase 5, release bump, credentials, personnel names/IDs of any form | — | **FORBIDDEN** (§3) | out |

## 3. Out-of-scope guards (lure traps — each excluded item needs its own NEW reviewed claim transition)

1. **No position value changes** — the owner's option ① changes ZERO position
   cells; the 3 outside-old-enum rows are made legal by enum extension only.
   Mapping `พนักงานเปล` → `พนักงานช่วยเหลือคนไข้` (option ②) was REJECTED by
   the approval record.
2. **No row targeting by name/ID/position** — the UPDATE predicate is the
   synthetic code set + the `status='active'` conjunction ONLY. Names,
   national IDs, phones, photos: never committed, never printed (grep-gated;
   the handoff attachment is verbatim-except-PII for exactly this reason).
3. **No other data writes** — no other `core.personnel` column, no other
   table, no backfill, no seed; 9 rows total, 3 `ลาออก` rows byte-untouched.
4. **No schema sprawl** — only the two named CHECKs are touched (position
   DROP+re-ADD, status VALIDATE-only); no column add/drop, no default, no
   NOT NULL, no RLS/policy/grant change, `public.personnel` façade untouched.
5. **Existing migrations IMMUTABLE** — `20261115120000_parity_p1_001.sql`
   stays byte-identical (the P2.2 immutability precedent); this lane's
   migration supersedes the position CHECK by DROP+re-ADD, never by editing
   history.
6. **No frontend / functions / CI** — `frontend/`, `supabase/functions/`,
   `config.toml`, `seed/`, `.github/` byte-untouched; the corrected values
   surface only through EXISTING UIs.
7. **Phase 5 cutover of any kind** — OWNER-GATED, never this lane.
8. **Reference/plan docs** — `APPSHEET-PARITY-PLAN.md`, reference 12,
   AGENTS.md, design docs: read-only.
9. **No release bump** — §4.
10. **Credentials** — Telegram tokens of any form ห้าม commit ทุกกรณี
    (owner B5); `.env`/`data/raw/` never committed, never printed; the
    proposal's original stays in `/tmp` (it declares this itself — it holds
    personnel names).

## 4. Release decision — NO BUMP (D1 recommends; reviewer confirms)

**v1.15.0 STAYS, no tag, no CHANGELOG touch.** Justification: the
deliverables are a backend data/schema correction (one migration) + docs —
zero code change, zero new surface; the corrected values surface through
EXISTING pages only (the same ruling class as P1.3's reference-data seeds:
"NO version bump — DB logic + reference-data seeds surface through existing
alert UIs, no frontend edits; reasoning recorded", and P1.001's schema-only
NO-BUMP). No user-visible feature is added; the parity gate correction is a
data-honesty repair of an already-shipped surface.
`check_release_version.py` must stay `OK (v1.15.0)` exit 0 at the
implementation head; `frontend/package.json` + `CHANGELOG.md` byte-untouched.

## 5. D-phase plan (Track-Z GLM)

- **D1 — live re-verification (read-only, at the implementation worktree off
  the post-merge main tip):** re-run the proposal's read-only probes at the
  new base to confirm the 9-row state still matches §0 (6×`active`,
  3×`ลาออก`, the 3 outside-old-enum positions, both CHECKs
  `convalidated=false`, the P1.4 gate shape: STAFF-001 fails `status='ทำงาน'`).
  A drift pivots to re-scope via the coordinator — never a silent fix.
- **D2 — truthful RED:** the NEW suite `scripts/test_parity_c8_personnel_enum.py`
  (house live-DB gate per the `test_parity_p1_001_schema.py` precedent)
  asserts the PRE-fix state and MUST FAIL truthfully: (a) the 6-row status
  delta (`active` count = 6 expected POST-fix → fails pre-fix), (b) the 3
  positions-inside-8-value-enum assertions (fail pre-fix — the values are
  legal data but outside the 5-value CHECK), (c) both `convalidated = true`
  assertions (fail pre-fix), (d) the P1.4 gate-shape probe (STAFF-001 passes
  → fails pre-fix). Standing passes (the 3 ลาออก rows, the position
  byte-stability pins, the 4-value status enum value-set pin) disclosed
  verbatim per the P2.4 P3-1 convention. Zero durable writes in D2 — the
  suite is read-only SELECT/introspection against the live DB.
- **D3 — implement:** ONE migration, filename pinned at D1 (proposed
  `supabase/migrations/20261121100000_parity_c8_personnel_enum.sql`; house
  naming, no collision — `20261121000000` is taken by the prevent lane):
  (a) `UPDATE core.personnel SET status = 'ทำงาน' WHERE status = 'active'
  AND employee_code IN ('STAFF-001','STAFF-002','STAFF-003','STAFF-006',
  'STAFF-008','STAFF-009');` followed by a guard DO-block that RAISES unless
  `status='active'` count = 0 AND `status='ทำงาน'` count = 6 (the count pin,
  aborted-before-commit on any mismatch); (b) `ALTER TABLE core.personnel
  DROP CONSTRAINT ck_core_personnel_position_enum;` + `ADD CONSTRAINT
  ck_core_personnel_position_enum CHECK (position IN (the 5 verbatim + the
  3 new values)) NOT VALID;`; (c) `VALIDATE CONSTRAINT
  ck_core_personnel_position_enum;` + `VALIDATE CONSTRAINT
  ck_core_personnel_status_enum;` — data conforms after (a), so both
  VALIDATEs succeed; house `notify pgrst, 'reload schema'` trailer. Applied
  via `scripts/apply_migration_api.py` with the ENV_DB gate; per-statement
  row/statement counts recorded. **Rollback documented in the migration
  header + WO (never executed unless the owner orders it): reverse UPDATE
  `SET status = 'active' WHERE status = 'ทำงาน' AND employee_code IN (the
  same 6 codes)` + DROP + re-ADD BOTH CHECKs NOT VALID with their ORIGINAL
  value sets (position 5 values, status 4 values) — restoring the exact
  pre-fix posture (`convalidated = false` on both).** No names/IDs anywhere;
  synthetic codes only.
- **D4 — battery:** the NEW suite GREEN post-apply (9 rows: 6×`ทำงาน` +
  3×`ลาออก`; positions byte-identical to §0 row-by-row; `convalidated = true`
  ×2; the P1.4 gate-shape probe: STAFF-001 + STAFF-008 pass, the 3 ลาออก
  rows fail exactly as AppSheet intends); guard 344/344; runtime 62/62;
  validate-registry ok; `check_release_version.py OK (v1.15.0)` exit 0;
  `git diff --check` clean; PII grep 0 (the 9 name tokens + any 13-digit
  national-ID pattern across ALL changed files); token/JWT-literal grep 0;
  diff vs base ⊆ §7.
- **D5 — fresh-GLM independent review** at the exact frozen head.
- **STOP at REVIEW_REQUESTED** — implementer never merges.

## 6. D1 adjudication items (reviewer)

- **D1-1 the target predicate (THE adversarial item):** the ONLY authorized
  row-write is the status UPDATE keyed on the synthetic code set + the
  `status='active'` conjunction, count-pinned exactly 6. Any name/ID-based
  targeting, any position-cell write, any row outside the 6-code set = P1.
- **D1-2 the enum extension exactness:** the re-ADD carries the 5 original
  values VERBATIM (R1) + exactly the 3 new values; order/spacing may differ,
  values may not; NOT VALID initially, VALIDATE only after the data
  conforms; the status CHECK is NEVER dropped/re-added in the forward path
  (only VALIDATE).
- **D1-3 rollback honesty:** the documented rollback must restore the exact
  pre-fix posture (reverse UPDATE by the same code set; both CHECKs back to
  NOT VALID with the original value sets) and is documented, never executed
  without an owner order.
- **D1-4 the PII attachment ruling:** the handoff attaches the proposal
  verbatim EXCEPT the personnel-name cells (and the elided Drive-secrets
  path), explicitly marked; the original stays `/tmp`. The instruction's
  "attach verbatim" and the zero-names grep gate CONFLICT on the name
  column; the grep gate + the proposal's own "ไม่ลง Git เพราะมีชื่อ-สกุล
  บุคลากร" declaration win — recorded as a stated deviation, reviewer
  adjudicates.
- **D1-5 the release ruling:** NO BUMP per §4 (adversarial check: any
  user-visible feature change that would force even PATCH — the expected
  answer is none; data correction through existing surfaces only).
- **D1-6 gate-shape verification:** the post-fix P1.4 probe must use the
  delivered P1.4 predicate shape (position ∈ {นักวิชาการสาธารณสุข,
  พนักงานบริการ} ∧ status = 'ทำงาน') — STAFF-001 and STAFF-008 pass, the
  three `ลาออก` rows fail — proving the recorder-gate dropout is repaired
  without widening the gate.

## 7. Registry-scope summary (mirrors the CURRENT-WORK claim append)

Claimed: ONE `supabase/migrations/` file + the NEW test script
`scripts/test_parity_c8_personnel_enum.py` + this lane's WO/handoff +
`docs/ai/CURRENT-WORK.md`. Everything else FORBIDDEN (§3).
