# ENV-MAINT-001 — Post-v1.0.1 P3 maintenance bundle → v1.0.2, then WAITING_REAL_FEEDBACK (Work Order)

สถานะ: **IN PROGRESS — D4 เสร็จ, implementation PR เปิดรอรีวิวอิสระ
(STOP ที่ REVIEW_REQUESTED — ห้าม merge โดย implementer เสมอ)** claim
`ENV-MAINT-001-C1` generation 1; implementation base
`16db009d319a0afdcff4e368b3d8395ded58c4f1` = merge SHA ของ transition PR
#173 (main หลัง transition รีวิวแล้ว merge 12 พฤศจิกายน 2569); สาขา
implementation `feat/env-maint-001` ใน worktree ที่จดทะเบียน
`/Volumes/MAC_WORK/DevWorkspace/Github/_worktrees/env-maint-001-20261112`;
ใบเสร็จถาวรอยู่ใน `docs/ai/handoffs/ENV-MAINT-001-GLM.md` (in-brief ของ
consult ทั้งสองฝ่ายฝัง VERBATIM เป็นหลักฐาน D0-EVIDENCE; checkpoints
D2/D3/D4/D5 ต่อท้าย)
Task: `ENV-MAINT-001` (task row ใหม่ — ตรวจความซ้ำของ task_id กับทะเบียน
22 แถวเดิมแล้ว **ไม่มี** `ENV-MAINT*` ก่อนหน้า ไม่มี OWNERSHIP_CONFLICT;
claim id คือ `ENV-MAINT-001-C1`)

## เป้าหมาย — 4 รายการ recorded P3 follow-ups และไม่มีอื่นใดเพิ่ม

ทุกรายการเป็นของที่ **จดบันทึกไว้แล้ว** ณ base `2e6f0119` — lane นี้ไม่มี
ขอบเขตใหม่ที่ไม่ได้จด (no silent scope expansion)

### 1. Version-chip mobile dock-overlap e2e pin — ทดสอบล้วน (chip เองไม่แตะ)

- หลักฐาน: `frontend/tests/e2e/env-app-version-001.spec.ts:68-79` ("mobile
  360px: the chip stays inside the viewport and visible") ยืนยันเฉพาะ
  containment; D5 APPROVED ของ ENV-APP-VERSION-001-C1
  (issuecomment-6811013033) จด P3 ไว้ว่า "The mobile-360 e2e asserts
  containment but not chip↔ModuleDock non-overlap (corner-band design keeps
  them apart in practice)" และระเบียน closeout ในทะเบียน (PR #169) จด
  follow-up เดียวกัน ("mobile-360 no dock-overlap pin between the chip and
  other shell elements")
- งาน: เพิ่ม e2e assertion ใน spec เดิม ว่า **ชิปเวอร์ชันไม่ทับ dock ล่าง**
  (mobile bottom navigation/dock) ที่ความกว้าง **360/390/430** — ตรวจด้วย
  bounding-box intersection ระหว่าง `getByTestId("app-version-chip")` กับ
  dock ตาม locator pattern เดิมของ repo
  (`page.getByRole("navigation", { name: "โมดูล" })` — ตาม
  `daily-form-mobile.spec.ts:541`)
- **ห้ามแตะ component ใด ๆ** — VersionChip.tsx / AppShell.tsx / version.ts
  อยู่นอกขอบเขตและถูก forbidden อย่างชัดเจน (route Track-Z: เพิ่ม coverage
  ของชิปเท่านั้น ไม่แก้ชิป)

### 2. Version-checker vSemVer false-positive mode — script + regression test

- หลักฐาน: `scripts/check_release_version.py:33` (`HARDCODED_RE =
  \bv\d+\.\d+\.\d+\b`); D5 APPROVED (issuecomment-6811013033) จด P3 ไว้ว่า
  "the checker's hardcoded-literal scan (`\bv\d+\.\d+\.\d+\b`) would
  false-positive on any benign vSemVer-bearing string in `frontend/src`
  (e.g. an asset URL path) — currently passes; be aware when adding such
  strings"
- งาน: กัน false-positive ของ version-matching ให้สนิท — เช่น tag/literal
  **v1.0.10 ห้ามติด false-positive กับ logic แบบ prefix ของ 1.0.1** หรือ
  กรณี substring/boundary ใกล้เคียงกัน และ benign vSemVer-bearing string
  (เช่น path ของ asset) ต้องไม่ถูกเขียนเป็น violation ลอย ๆ — พฤติกรรม
  exact-match เดิม (`tag == v<package.json version>`) คงไว้ และไม่เปิด
  false-negative ให้ violation จริงหลุด
- regression test ต้องอยู่ใน `scripts/test_check_release_version.py`
  (ไฟล์เดิมมี 26 tests ณ base) — D2 ต้อง fail จริงก่อนแก้
- กลไก implementation เลือกได้ในขอบเขต (ถ้าต้องเพิ่ม mode/flag ให้
  document ใน docstring ของ script เอง) — **ห้ามแตะ CI workflow ทุกไฟล์**

### 3. Flaky e2e hardening — `garbage-mobile.spec.ts:186`

- หลักฐาน: ระเบียน environmental note ของ PERF lane — D5 R1 FULL run 1
  เจอ load-flake ที่ `garbage-mobile.spec.ts:186` หนึ่งครั้ง (ผ่าน 9/9
  เมื่อรัน isolated และผ่านซ้ำเมื่อ rerun — ไม่ใช่ regression; จดไว้ใน
  `docs/ai/handoffs/ENV-PERF-001-GLM.md` :653 และ :730-733)
- งาน: เพิ่ม robust wait/settle ให้การโหลดหน้าของ test นี้ตาม pattern
  เดิมของ repo (รอ shell/dock/state ที่ deterministic ไม่ใช่ blind
  timeout) — **ห้ามทำ assertion อ่อนลง** และห้ามแตะไฟล์ production ของ
  หน้า Garbage ทุกไฟล์
- รายการนี้ **ไม่มี RED** (เป็นการ hardening ความ flaky ไม่ใช่ behavior
  change ใหม่) — การตรวจจริงคือ repeated-run check ที่ D4 (รันซ้ำหลายรอบ
  ใน FULL battery workers=1 แล้วจดผลตามตรง)
- หากทำ hardening แล้ว flake ยัง repro ได้จริง ให้หยุดและจด follow-up
  ตรงมา — ห้ามขยาย scope ไปแตะหน้า Garbage

### 4. CURRENT-WORK.md narrative-bullet drift — **ปิดงานใน closeout transition เท่านั้น**

- หลักฐาน: bullet ~line 1148 ของ `docs/ai/CURRENT-WORK.md` ณ base
  `2e6f0119` ยังระบุ `ENV-PERF-001 / CLAIMED (C1, this transition)` ทั้งที่
  lane ปิดแล้ว (PR #171 merged, closeout PR #172 merged) — ผู้รีวิวของ #172
  จดเป็น P3 และ bullet นี้ **byte-identical since base** (closeout #172 ไม่
  ได้แก้)
- **กฎผูกตาย: ไฟล์ `docs/ai/CURRENT-WORK.md` แก้ได้ผ่าน claim transition
  ที่ผ่านรีวิวเท่านั้น** — งานแก้ bullet drift นี้ **ถูกกำหนดเวลาไว้ใน
  closeout transition ของ lane นี้ (docs-only รีวิวใหม่อีกครั้ง) ไม่ใช่ใน
  implementation PR** — implementation PR ห้ามแตะ CURRENT-WORK.md ทุก
 กรณี
- ใน closeout transition เดียวกันนั้น ให้ **จด frontier ถัดไปด้วย**:
  หลัง lane นี้ปิด frontier คือ **WAITING_REAL_FEEDBACK** — เก็บ feedback
  จริงจากเจ้าหน้าที่ (การใช้ Building / Twin water-motion / ความเร็ว
  v1.0.1 / การแก้ของ v1.0.2) ก่อนเลือก product lane ถัดไป (ตาม synthesis
  B-then-D ของ consult 2026-11-12 — ดูหมวด Authorization basis)

## เกณฑ์เลขเวอร์ชัน (release plan — ตัดสินโดยเจ้าของชัดเจน)

- **PATCH v1.0.2** ตามคำสั่งอนุมัติของเจ้าของ ("Release: PATCH v1.0.2 per
  the documented CHANGELOG criteria") — บันทึกตรงไปตรงมา: ทั้ง 4 รายการเป็น
  งาน test/script/docs ภายใน ไม่มีพฤติกรรมที่ผู้ใช้เห็นการเปลี่ยนแปลง
  แถว PATCH ของเกณฑ์ใน `CHANGELOG.md`
  ("แก้ไขข้อผิดพลาดหรือปรับปรุงภายในที่ผู้ใช้อาจสังเกตได้") คนเดียวไม่
  บังคับบัมป์ — v1.0.2 เป็น **version marker ที่เจ้าของสั่ง** สำหรับ
  maintenance bundle นี้ (เจ้าของมีอำนาจตัดสิน release เหนือเกณฑ์ default)
  เหตุผลสุดท้ายจดที่ D4 ใน handoff
- CHANGELOG entry ภาษาไทย วันที่ **พ.ศ.** (ค.ศ. + 543) เท่านั้น
- tag ตามขั้นตอน release มาตรฐาน (D6 ใน
  `docs/ai/handoffs/ENV-APP-VERSION-001-GLM.md`): bump
  `frontend/package.json` → CHANGELOG entry → gate เต็ม → merge ด้วย
  expected-head discipline → **หลัง merge**: รอ Pages deploy สำเร็จที่
  merge SHA → ตรวจ live asset → push annotated tag `v1.0.2` ชี้ merge SHA
  ที่ deploy แล้ว → `check_release_version.py --tag v1.0.2` exit 0
- **transition PR นี้เป็น docs-only** — ห้ามบัมป์ ห้าม CHANGELOG entry
  ห้าม tag ณ ตอนนี้ (docs-only merge ไม่เพิ่มเลขเวอร์ชันตามนโยบาย
  CHANGELOG)

## ฐานอำนาจอนุมัติ (Authorization basis — บันทึกตรงไปตรงมาและครบถ้วน)

1. **คำสั่งถาวรของเจ้าของ (Goal mode) "ต่อ" 2026-11-12** — เดินงานต่อ
   เนื่องตาม loop ที่บันทึกไว้: RED-first, battery เต็ม, รีวิวอิสระ,
   ห้าม merge ตัวเอง
2. **Joint delegated consult รอบ 3 ประจำวันที่ 2026-11-12 (nextlane3)** —
   ตัดสิน lane ถัดไปจาก 4 ตัวเลือก (A=HAZARD-PREP, B=maintenance bundle,
   C=M6 first slice, D=STOP):
   - **Terra** (GPT-6.1 Terra ผ่าน Codex CLI read-only, session
     `01a1d05e-3442-7c01-b2ed-f72fcc1877d9`): **Q1=D STOP** — "รอรับ
     feedback จากการใช้งานจริงของทีมโรงพยาบาลก่อน" (Q2=4, Q3A=2 Q3B=2
     Q3C=4, Q4=A2)
   - **Jev** (jev-advisory MCP, pinned model jev-1.13.0, READ-ONLY
     advisory): **Q1=A แบบ weak near-tie กับ D** (docs=A conf 0.41/0.39
     LOW; runner-up review=D 0.41/0.42 — ประกาศเองว่า NOT decision-grade
     ตัวเดียว) + **Q4=A1** (conf 0.76 MODERATE) + หมายเหตุ local
     (non-Jev) ว่า B เสี่ยงต่ำสุด (local estimate B=1/5)
   - **Synthesis (B-then-D)**: ทำ maintenance bundle (B) เป็น lane นี้
     ก่อน แล้ว frontier เปลี่ยนเป็น WAITING_REAL_FEEDBACK (D) — ตรงกับ
     lowest-regret และเงื่อนไข STOP ของ Terra เพราะ B ทำให้ชุดทดสอบ/
     เครื่องมือ release แข็งแรงก่อนพักรับ feedback
   - in-brief ของทั้งสองฝ่ายคัดลอก **VERBATIM** ใน handoff D0-EVIDENCE
     (`jev-nextlane3-consult-2026-11-12.json` + `.txt` +
     `terra-nextlane3-receipt-2026-11-12.txt`) — advisory เท่านั้น
     ไม่ใช่อำนาจ merge/review
3. **รายการทั้ง 4 เป็นของที่จดไว้แล้ว** (ดูหลักฐานในแต่ละรายการด้านบน) —
   ไม่มีขอบเขตใหม่แต่งขึ้น

## Execution routing (Track-Z GLM ทุกรายการ — ไม่มี Codex dispatch)

- **D2** — GLM Track-Z RED-first **เฉพาะพฤติกรรมที่ทดสอบได้**: e2e pin
  ใหม่ (dock-overlap 360/390/430) + checker regression ใหม่ ต้อง **fail
  จริง** ก่อนแก้ และบันทึกผลตามตรง (รายการ 3 ไม่มี RED — hardening;
  รายการ 4 เป็น docs ปิดงานที่ closeout — ทั้งคู่จดสถานะอย่างซื่อสัตย์)
- **D3** — GLM Track-Z implementation ตาม 4 รายการ (ไฟล์ตาม mutable scope
  เท่านั้น — ไม่มี component/page/lib เปลี่ยนเลย)
- **D4** — GLM battery เต็มที่ head ที่ freeze: **vitest FULL + `tsc -b` +
  lint + Playwright FULL `--workers=1` รวม repeated-run flake check ของ
  garbage-mobile (item 3) + guard 344/344 + runtime 62/62 + checker ทั้ง
  โหมดปกติและโหมด/กรณีใหม่ + `git diff --check`**
- **D5** — fresh-GLM independent review ที่ exact head (Terra ผ่าน Codex
  CLI eligible เป็น cross-model reviewer; GPT-6 Astra ห้าม; never
  author-and-approve; never silent downgrade); implementer ห้าม merge
  ตัวเอง — **lane หยุดที่ REVIEW_REQUESTED เสมอ**
- **D6 release — หลัง merge + deploy เท่านั้น**: ตามหมวดเกณฑ์เวอร์ชัน
  (PATCH v1.0.2) และ closeout transition (docs-only รีวิวใหม่) ปิดท้าย:
  แก้ bullet drift (~line 1148) + จด frontier WAITING_REAL_FEEDBACK

## Scope (mutable, exactly — ตรงกับ registry claim entry, one-writer)

ตรวจแล้ว ณ base ว่ามีอยู่จริงทุกไฟล์:

- `frontend/tests/e2e/env-app-version-001.spec.ts` (มีอยู่ — เพิ่ม pin
  dock-overlap 360/390/430)
- `frontend/tests/e2e/garbage-mobile.spec.ts` (มีอยู่ — harden :186)
- `scripts/check_release_version.py` (มีอยู่ — harden version-matching)
- `scripts/test_check_release_version.py` (มีอยู่ — regression test ใหม่)
- `CHANGELOG.md` (มีอยู่ — entry release ภาษาไทย พ.ศ. เฉพาะตอน release)
- `frontend/package.json` (มีอยู่ — bump field `version` เฉพาะตอน release)
- `docs/work-orders/ENV-MAINT-001.md` (WO นี้)
- `docs/ai/handoffs/ENV-MAINT-001-GLM.md` (append checkpoints)
- `docs/ai/CURRENT-WORK.md` (**เฉพาะ claim transition ที่รีวิวแล้ว:
  transition PR นี้ + closeout transition ของ lane นี้เท่านั้น** —
  implementation PR ห้ามแตะ)

## Forbidden (ห้ามแตะ)

- `frontend/src/**` ทั้งหมด — **โดยเฉพาะ** `frontend/src/lib/version.ts`,
  `frontend/src/components/layout/VersionChip.tsx`,
  `frontend/src/components/layout/AppShell.tsx` (ชิปเองไม่แตะ — เพิ่มแต่
  test coverage), `frontend/src/pages/**` ทุกหน้า รวม
  `frontend/src/pages/BuildingPage.tsx` (ของ Building lock),
  `frontend/src/components/**`, `frontend/src/lib/**`
- `frontend/vite.config.ts`, `frontend/public/**` (sw.js ของ Building lock
  อยู่ในนี้), `frontend/tests/e2e/**` ทุกไฟล์นอกเหนือจาก 2 spec ที่ claim
  (รวม `daily-form-mobile.spec.ts` — scope-ruling precedent file และ
  `water-watch.spec.ts` ของ Building lock)
- `supabase/**` ทั้งหมด (ไม่มี migration ใน lane นี้)
- `.github/**` (CI workflow ทุกไฟล์ — ห้ามแตะแม้ checker เปลี่ยน)
- `scripts/env_coordination_guard.py` + `scripts/test_env_coordination_guard.py`
  + `scripts/env_autonomy_runtime.py` +
  `scripts/test_env_autonomy_runtime.py` (verify-only — รันได้ แก้ไม่ได้)
  และ `scripts/**` อื่นทุกไฟล์นอกเหนือจาก 2 ไฟล์ checker ที่ claim
- `README.md` (ไม่อยู่ในขอบเขต lane นี้), `docs/ai/ROADMAP.md`,
  `docs/ai/HANDOFF.md`, `docs/ai/design/**` (รวม approval packet
  ENV-VIS-STORY-001B-NUMERIC-APPROVAL-PACKET.md),
  `docs/ai/digital-twin/11-UTHAI-ACTIVATED-SLUDGE-PROCESS-KNOWLEDGE.md`
  (อ่านอย่างเดียว), `AGENTS.md`
- `.env`, `data/**`, RLS policy ทุกตัว, ข้อมูลแถวทุกแถว
- ทุกไฟล์ที่ไม่อยู่ใน mutable scope

## ข้อจำกัดความจริง (truth constraints)

- unknown ≠ 0 (ห้ามแทนค่าศูนย์) — ไม่มีข้อมูลที่หายถูกเติมเป็นค่าใด ๆ
- `latest` ≠ `live` — ห้ามใช้คำ "live" กับ path ที่ไม่ใช่ telemetry จริง
- e2e pin ใหม่วัดพฤติกรรมจริงของ DOM ที่ render แล้ว (bounding box จริง)
  — ห้าม assert บน selector ที่ยังไม่ settle; hardening ห้ามทำ assertion
  อ่อนลงหรือซ่อนความล้มเหลว
- checker ห้ามปล่อย violation จริงหลุด (ไม่มี false-negative ใหม่);
  พฤติกรรม exact-match ของ `--tag` คงเดิม; ไม่เดาค่า ไม่ fabricate
- วันที่ user-facing (CHANGELOG) เป็น พ.ศ. (ค.ศ. + 543)
- simulation/test ทั้งหมดไม่มี write จริง; ไม่มี PHI; ห้าม print/commit
  token ใด ๆ
- consult ทั้งสองเป็น advisory เท่านั้น (authoritative_for_action:false
  จาก Jev; Terra เป็นผู้ชี้ขาดข้อเสนอ ไม่ใช่อำนาจ merge/review) — ใบเสร็จ
  ฝังตามตรง ห้ามสรุปแทน

## ขั้นตอน (D-plan) — ดูหมวด Execution routing ด้านบน

## การยอมรับ (Acceptance)

- e2e ใหม่พิสูจน์ได้ว่าชิปไม่ทับ dock ที่ 360/390/430 (D2 fail จริงก่อน
  แก้เมื่อทำ RED simulation ได้ หรือจดตามตรงว่า pin ผ่านกับ design
  corner-band ปัจจุบัน — ตามที่ D5 P3 บอกว่า "corner-band design keeps
  them apart in practice") และชุด chip e2e เดิมผ่านครบ ไม่มี assertion
  เดิมถูกทำให้อ่อนลง
- checker: กรณี v1.0.10-vs-1.0.1 + benign vSemVer-bearing string ผ่าน
  regression suite ใหม่ (D2 fail จริง) โดย violation จริงยังโดนจับครบ
  (test เดิม 26 กรณีผ่านครบ); `--tag v1.0.2` exit 0 หลัง release
- `garbage-mobile.spec.ts:186` ผ่านซ้ำหลายรอบใน FULL battery workers=1
  (repeated-run check จดจำนวนรอบจริงใน handoff D4)
- battery เต็มผ่านที่ frozen head: vitest FULL + tsc + lint + Playwright
  FULL workers=1 + guard 344/344 + runtime 62/62 + `git diff --check`
- release (หลัง merge + deploy): package.json `1.0.2`, CHANGELOG entry
  ไทย พ.ศ., annotated tag `v1.0.2` ชี้ deployed merge SHA,
  `check_release_version.py --tag v1.0.2` exit 0
- closeout transition (docs-only, รีวิวใหม่): bullet drift ~line 1148
  แก้แล้ว + frontier จดเป็น WAITING_REAL_FEEDBACK พร้อมหัวข้อ feedback
  ที่รอ (Building usage / Twin water-motion / ความเร็ว v1.0.1 / การแก้
  v1.0.2) — implementation PR ไม่เกี่ยวกับข้อนี้
- ห้าม merge โดย implementer ทุก PR ของ lane นี้ — STOP ที่
  REVIEW_REQUESTED เสมอ
