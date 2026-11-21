# Handoff — ENV-PERSONNEL-C8-001-GLM (Claim ENV-PERSONNEL-C8-001-C1, gen 1)

**You (the implementing lane, Track-Z GLM) hold this claim ONLY after the
claim-transition PR merges.** Until then this document is the binding brief.
Worktree `_worktrees/env-personnel-c8-001` (clean, off the post-merge main
tip); implementation branch off that tip (house `feat/env-personnel-c8-001`
form, name pinned at D1). STOP at REVIEW_REQUESTED — you never merge; the
authorized reviewer owns approval + merge of every PR in this lane's chain.
WO `docs/work-orders/ENV-PERSONNEL-C8-001.md` holds the full binding pins
(§0 ground truth + R1–R7, §1 authorization, §2 item inventory, §3
out-of-scope guards, §4 NO BUMP, §5 D-phases, §6 D1 items, §7 scope). Read
it before writing anything. Summary:

## 1. Deliver THIS lane (ONE migration + ONE contract suite, per owner option ①)

- **(1) สถานะ 6 แถว `active` → `ทำงาน`** — `UPDATE core.personnel SET status
  = 'ทำงาน' WHERE status = 'active' AND employee_code IN ('STAFF-001',
  'STAFF-002','STAFF-003','STAFF-006','STAFF-008','STAFF-009');` — the code
  set + the status predicate is the ONLY authorized target; count pinned
  exactly 6 (a guard DO-block aborts the transaction unless 0 `active` rows
  and exactly 6 `ทำงาน` rows remain). NEVER target by name or any ID. The
  3 `ลาออก` rows stay byte-untouched.
- **(2) position enum 5 → 8** — `DROP CONSTRAINT
  ck_core_personnel_position_enum` + re-ADD with the SAME 5 verbatim values
  (`นายแพทย์`,`พนักงานบริการ`,`นักวิชาการสาธารณสุข`,`นักโภชนาการ`,
  `พนักงานประกอบอาหาร`) + exactly 3 new (`ผู้ช่วยช่างทั่วไป`,`พนักงานเปล`,
  `พนักงานช่วยเหลือคนไข้`), **NOT VALID initially**. ZERO position cells are
  rewritten — STAFF-002/003/009 keep their exact values, made legal by the
  extension. Every old value stays (the Valid If families reference them).
- **(3) VALIDATE both CHECKs** — `VALIDATE CONSTRAINT
  ck_core_personnel_position_enum` + `VALIDATE CONSTRAINT
  ck_core_personnel_status_enum` after the data conforms (the P1.001
  owner-gated follow-up, now un-gated by the approval). The status CHECK is
  never dropped in the forward path — only validated.
- Rollback (documented in the migration header + WO §5, never executed
  without an owner order): reverse UPDATE by the SAME 6-code set + DROP +
  re-ADD BOTH CHECKs NOT VALID with their original value sets — restoring
  the exact pre-fix posture (`convalidated = false` ×2).
- Applied via `scripts/apply_migration_api.py` with the ENV_DB gate;
  per-statement counts recorded verbatim.

## 2. Lure traps (each excluded item needs its own NEW reviewed claim transition)

1. "Fix STAFF-003's position to พนักงานช่วยเหลือคนไข้ while you're there" —
   that was proposal option ②; the owner chose ① (8 values, both kept). Any
   position-cell write = P1 (WO §3.1).
2. "Target rows by name — the codes might drift" — the code set IS the
   authorized target (WO §6 D1-1); the live re-verification at D1 re-pins
   the 6×`active` state before anything ships; drift pivots, never retarget.
3. "Drop and re-ADD the status CHECK too, for symmetry" — NO: the forward
   path VALIDATEs it only (its value set is already correct); drop/re-ADD
   of the status CHECK exists ONLY in the documented rollback.
4. "Drop the unused enum values (นายแพทย์/นักโภชนาการ/พนักงานประกอบอาหาร/
   ย้ายกลุ่มงาน/ลาศึกษาต่อ) to keep the enum tidy" — the AppSheet Valid If
   formulas reference them; dropping breaks parity silently (WO §2 row 4).
5. "Commit the /tmp proposal as evidence — verbatim means verbatim" — the
   zero-names grep gate + the proposal's own declaration win; the handoff
   attachment is verbatim-except-PII (Appendix A below states every
   redaction); the original stays `/tmp`.
6. "VALIDATE right after the UPDATE without the introspection proof" — the
   suite must pin `convalidated` transitions via `pg_constraint.convalidated`
   before/after, not assume them.
7. "The version chip should move — the gate behavior changed" — NO BUMP
   (WO §4): data correction through existing surfaces; checker must stay
   `OK (v1.15.0)` exit 0.

## 3. Honesty pins (reviewer-pinned)

- unknown ≠ zero / missing ≠ fixed — a probe you cannot run is recorded
  UNVERIFIED, never asserted; the exactly-6 count is asserted, never assumed.
- Data honesty: the 3 `ลาออก` rows are real history and stay byte-untouched;
  the gate-shape probe must show them STILL failing the recorder gate after
  the fix (that is correct AppSheet semantics, not a defect).
- PII: zero names / national IDs / phones / photos in any committed file or
  printed receipt — grep-gated at D4 (the 9 name tokens + any 13-digit
  pattern over ALL changed files = 0 matches). The D5 P2 PII-verbatim lesson
  (PR #210 repair) applies: synthetic codes only.
- The proposal attachment's redactions are declared, never silent (§6).
- No PHI exists in this chain; never route any patient data anywhere.
- Dates Thai พ.ศ. (+543) anywhere user-facing text is touched (none expected
  in this lane).
- Secrets: `SUPABASE_ACCESS_TOKEN` and any credential never printed to chat,
  logs, or receipts; `.env`/`data/raw/` never committed.

## 4. D-phase plan (mirrors WO §5 — details there)

D1 live re-verification (read-only; the 9-row state re-pinned at the new
base; drift pivots) → D2 truthful RED (`scripts/test_parity_c8_personnel_enum.py`:
the 6-row status delta + the 3 positions-in-8-enum + both `convalidated=true`
+ the P1.4 gate-shape probes FAIL pre-fix; standing passes disclosed) →
D3 ONE migration via `scripts/apply_migration_api.py` with the ENV_DB gate
(scope ⊆ WO §7; per-statement counts; rollback documented, unexecuted) →
D4 battery (suite GREEN + guard 344 + runtime 62 + checker OK v1.15.0 +
PII/token greps 0 + `git diff --check` clean + diff ⊆ scope) → D5
fresh-GLM → **STOP at REVIEW_REQUESTED — implementer never merges.**

## 5. D1 pins / adjudication items (details in WO §6)

D1-1 the target predicate (THE adversarial item — code-set + status
conjunction only, exactly 6) · D1-2 the enum extension exactness (5 verbatim
+ 3 new, NOT VALID → VALIDATE after data conforms; status CHECK
VALIDATE-only) · D1-3 rollback honesty (restores the exact pre-fix posture;
documented, never executed) · D1-4 the PII attachment ruling (verbatim-
except-PII; the stated deviation; reviewer adjudicates) · D1-5 the release
ruling (NO BUMP; adversarial check) · D1-6 gate-shape verification (the
delivered P1.4 predicate; STAFF-001/STAFF-008 pass post-fix, the 3 ลาออก
rows fail by design).

## 6. Authorization basis + proposal receipt

The approval chain: owner deferral 2026-11-15 "ให้เสนอมาภายหลัง" → the C8
proposal presented 2026-11-20 (four-option menu §4) → **owner approval
2026-11-21 "อนุมัติทั้งหมด" = option ①**. The prevent-lane closeout frontier
(PR #257 merged `ecf4b88…` = this base) had recorded C8 execution as "a
small gated lane once the owner picks an option" — this claim is that lane,
gate answered. The proposal's original lives at
`/tmp/env-c8-personnel-proposal-2026-11-20.md` (it declares itself
/tmp-only: "ไม่ลง Git เพราะมีชื่อ-สกุลบุคลากร"). The committed attachment
below is **byte-verbatim EXCEPT**: (a) every ชื่อ-สกุล (personnel-name) cell
replaced by `(PII-REDACTED)` per the zero-names grep gate, (b) the elided
Drive-secrets path in §6 replaced by a redaction marker. Every other byte —
structure, codes, positions, statuses, evidence rows, the option table — is
verbatim. This verbatim-vs-gate conflict is the recorded stated deviation
(WO §6 D1-4); the reviewer adjudicates.

### Appendix A — the C8 proposal receipt (verbatim-except-PII; original at /tmp/env-c8-personnel-proposal-2026-11-20.md)

# ข้อเสนอ C8 — enum ตำแหน่ง/สถานะของ core.personnel (เสนอเจ้าของโครงการอนุมัติ)

**วันที่:** 21 พฤศจิกายน พ.ศ. 2569 (สืบเนื่องคำสั่งเจ้าของ 15 พ.ย. 2569 "ให้เสนอมาภายหลัง")
**สถานะเอกสาร:** ข้อเสนอเพื่อขออนุมัติเท่านั้น — ยังไม่แก้ DB ใด ๆ, ยังไม่ commit เข้า repo, ไฟล์นี้อยู่ /tmp เท่านั้น (ไม่ลง Git เพราะมีชื่อ-สกุลบุคลากร)

---

## 1. สถานะปัจจุบัน (หลักฐานจาก ENV_DB จริง)

ดึงแบบ read-only ผ่าน Supabase Management API (โครงการ ENV_DB `gllqtbyofrcjzmbnfoeh`) เมื่อ 2026-11-20T20:44Z — ดึงเฉพาะคอลัมน์ employee_code / full_name / position / status (ไม่แตะเลขบัตร 13 หลัก เบอร์โทร หรือรูป)

CHECK constraint ที่ P1.1 สร้างไว้ยืนยันจาก DB จริง: `ck_core_personnel_position_enum` (5 ค่า) และ `ck_core_personnel_status_enum` (4 ค่า) ทั้งคู่ยัง **NOT VALID** (`convalidated = false`) — รออนุมัติแก้ค่าก่อนจึงจะ VALIDATE ได้

| รหัส | ชื่อ-สกุล | ตำแหน่ง (จริงใน DB) | สถานะ (จริงใน DB) | ตำแหน่งผ่าน enum? | สถานะผ่าน enum? |
|---|---|---|---|---|---|
| STAFF-001 | (PII-REDACTED) | พนักงานบริการ | active | ✅ | ❌ |
| STAFF-002 | (PII-REDACTED) | ผู้ช่วยช่างทั่วไป | active | ❌ | ❌ |
| STAFF-003 | (PII-REDACTED) | พนักงานเปล | active | ❌ | ❌ |
| STAFF-004 | (PII-REDACTED) | พนักงานบริการ | ลาออก | ✅ | ✅ |
| STAFF-005 | (PII-REDACTED) | พนักงานบริการ | ลาออก | ✅ | ✅ |
| STAFF-006 | (PII-REDACTED) | พนักงานบริการ | active | ✅ | ❌ |
| STAFF-007 | (PII-REDACTED) | พนักงานบริการ | ลาออก | ✅ | ✅ |
| STAFF-008 | (PII-REDACTED) | นักวิชาการสาธารณสุข | active | ✅ | ❌ |
| STAFF-009 | (PII-REDACTED) | พนักงานช่วยเหลือคนไข้ | active | ❌ | ❌ |

ตรงกับผลตรวจ D5 เป๊ะ: ตำแหน่งนอก enum 3 แถว, สถานะ `active` นอก enum 6 แถว

---

## 2. ความจริงอ้างอิงจาก AppSheet (เอกสาร 12 §3.2 + สูตรที่อ้างตำแหน่ง/สถานะ)

`docs/ai/digital-twin/12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md` §3.2 ตาราง `ข้อมูลผู้ปฏิบัติงาน` (21 คอลัมน์, key = Employee_id):

- **ตำแหน่ง** = Enum ธรรมดา 5 ค่า: `นายแพทย์` / `พนักงานบริการ` / `นักวิชาการสาธารณสุข` / `นักโภชนาการ` / `พนักงานประกอบอาหาร` — คอลัมน์นี้ไม่มี Valid If / Initial value ของตัวเอง
- **สถานะ** = Enum ธรรมดา 4 ค่า: `ทำงาน` / `ย้ายกลุ่มงาน` / `ลาออก` / `ลาศึกษาต่อ` — เช่นกันไม่มีสูตรบนคอลัมน์เอง

สูตรที่ *อ้างถึง* [ตำแหน่ง]/[สถานะ] ทั้งหมดเป็น Valid If บนคอลัมน์ Ref ของตารางอื่น (~12 คอลัมน์: ผู้บันทึก/ผู้ตรวจสอบ/ผู้เก็บตัวอย่าง/ผู้รายงาน/Auditor/practician/sample) สรุปเป็น 3 ตระกูล:

1. เกตผู้บันทึก/ผู้ตรวจสอบ: `AND([ตำแหน่ง]<>"นายแพทย์", [สถานะ]="ทำงาน" หรือ <>"ลาออก", OR([ตำแหน่ง]="นักวิชาการสาธารณสุข",[ตำแหน่ง]="พนักงานบริการ"))` → AppSheet **อนุญาตเฉพาะ** นักวิชาการสาธารณสุข/พนักงานบริการ + สถานะ ทำงาน
2. เกตผู้ตรวจสอบถังดับเพลิง/Filter_Firer: `([ตำแหน่ง]<>"นายแพทย์")` และรูปแบบอนุศาสน์อื่นที่ยังอิงค่าเดียวกัน
3. เกต sample (แผลมือพนักงาน): `OR([ตำแหน่ง]="นักโภชนาการ",[ตำแหน่ง]="พนักงานประกอบอาหาร")` → คนโภชนาการ/อาหารเป็น subject ตรวจ

**นัยสำคัญ:** (ก) enum เดิมออกแบบบนชุดบุคลากร 34 คนของแท็บ AppSheet ไม่ใช่ 9 คนผู้บันทึกน้ำเสียที่ seed เข้า core.personnel (ที่มา: CSV `ข้อมูลบ่อบำบัดประจำวัน - ข้อมูลผู้ปฏิบัติงาน.csv`, insert 2026-07-05) — ตำแหน่งช่าง/เปล/ช่วยเหลือคนไข้จึงไม่เคยอยู่ใน dropdown เดิม (ข) ค่า `active` ไม่เคยมีใน enum สถานะของ AppSheet เลย (ค่าที่ logic ใช้จริงคือ `ทำงาน`)

ข้อจำกัดความซื่อตรง: เครื่องนี้ไม่มี Google token ใน secrets และไม่พบไฟล์ export ของ workbook `1kWtdmDz…` บน Drive mirror จึงไม่ได้เปิดแผ่น Drive ต้นทางซ้ำ — แต่ข้อมูล DB ปัจจุบัน (ตารางข้างบน) คือค่าจริงที่ต้องตัดสิน และที่มา/enum อ้างจากเอกสารที่ commit แล้วเป็นหลักฐานรองรับ

---

## 3. ข้อเสนอรายแถว (ค่าปัจจุบัน → ค่าที่เสนอ)

### 3.1 สถานะ 6 แถว `active` → `ทำงาน` (แนะนำ: **แก้ค่า**)

| รหัส | ชื่อ-สกุล | ปัจจุบัน | เสนอ | เหตุผล |
|---|---|---|---|---|
| STAFF-001 | (PII-REDACTED) | active | **ทำงาน** | แปลภาษาตรงความหมาย; แถวนี้คือผู้บันทึกหลัก (audit 77 แถวชี้มาที่คนนี้) และเกต parity กรอง `[สถานะ]="ทำงาน"` — คงค่า active ไว้จะทำให้เขาหลุดจากเกต |
| STAFF-002 | (PII-REDACTED) | active | **ทำงาน** | ค่า `active` ไม่มีใน enum เดิมเลย; คนอื่นในตารางเดียวกันใช้ค่าไทยแล้ว (ลาออก ×3) |
| STAFF-003 | (PII-REDACTED) | active | **ทำงาน** | เดียวกัน |
| STAFF-006 | (PII-REDACTED) | active | **ทำงาน** | เดียวกัน |
| STAFF-008 | (PII-REDACTED) | active | **ทำงาน** | เดียวกัน — นักวิชาการสาธารณสุข เป็นเกตผู้บันทึกหลักตามสูตร |
| STAFF-009 | (PII-REDACTED) | active | **ทำงาน** | เดียวกัน |

ไม่มีแถวไหนที่ `active` อาจหมายถึง ย้ายกลุ่มงาน/ลาออก/ลาศึกษาต่อ — ทั้ง 6 คนยังอยู่ในชุดผู้ปฏิบัติงานปัจจุบันของระบบ (แถวที่ออกจริงถูกบันทึกเป็น `ลาออก` แล้ว 3 คน)

### 3.2 ตำแหน่ง 3 แถวนอก enum (แนะนำ: **คงค่าเดิม + เพิ่มค่า enum ใหม่**)

| รหัส | ชื่อ-สกุล | ค่าปัจจุบัน | การกระทำแนะนำ | เหตุผล |
|---|---|---|---|---|
| STAFF-002 | (PII-REDACTED) | ผู้ช่วยช่างทั่วไป | **เพิ่มค่า enum ใหม่** `ผู้ช่วยช่างทั่วไป` (คงค่าแถวเดิม) | ไม่มีค่าใดใน 5 ค่าเดิมใกล้เคียงเชิงบทบาทจริง; ถ้า map เป็น พนักงานบริการ จะทำให้เขา "ผ่านเกต" ผู้บันทึก/ผู้ตรวจสอบใน parity logic โดยไม่ตรงตำแหน่งจริง (ผิดหลัก unknown ≠ coerced) |
| STAFF-003 | (PII-REDACTED) | พนักงานเปล | **เพิ่มค่า enum ใหม่** `พนักงานเปล` (คงค่าแถวเดิม) — หรือถ้าเจ้าของยืนยันว่าชื่อเรียกมาตรฐาน ก.พ. เดียวกับ STAFF-009 ให้**แก้ค่า**เป็น `พนักงานช่วยเหลือคนไข้` และเพิ่มเพียงค่าเดียว | ตำแหน่งจริงตามใบงาน; "พนักงานเปล" กับ "พนักงานช่วยเหลือคนไข้" อาจเป็นบทบาทเดียวกันต่างชื่อเรียก — เจ้าของเป็นคนยืนยันได้ |
| STAFF-009 | (PII-REDACTED) | พนักงานช่วยเหลือคนไข้ | **เพิ่มค่า enum ใหม่** `พนักงานช่วยเหลือคนไข้` (คงค่าแถวเดิม) | เป็นชื่อตำแหน่งมาตรฐานราชการจริง — เพิ่มเป็นค่าถูกต้อง ไม่ควรแปลงเป็นค่าอื่น |

ค่า enum เดิมที่ *ยังไม่มีใครใช้* (นายแพทย์ / นักโภชนาการ / พนักงานประกอบอาหาร / ย้ายกลุ่มงาน / ลาศึกษาต่อ) **คงไว้ทั้งหมด** — สูตร Valid If ของ AppSheet อ้างถึงทุกค่านี้ (เกตหัก นายแพทย์, เกต sample ต้องการ นักโภชนาการ/พนักงานประกอบอาหาร) การลบทิ้งจะทำให้ parity รองเท้าหลุด

---

## 4. สรุปให้อนุมัติครั้งเดียว (เลือก 1 ข้อ)

| ทางเลือก | เนื้อหา | ผล enum ตำแหน่ง | แก้แถว |
|---|---|---|---|
| **① อนุมัติทั้งหมด (แนะนำ)** | สถานะ 6 แถว `active`→`ทำงาน` + เพิ่มค่าตำแหน่งใหม่ 3 ค่า (ผู้ช่วยช่างทั่วไป, พนักงานเปล, พนักงานช่วยเหลือคนไข้) — ไม่แก้ตำแหน่งแถวใด | 5 → 8 ค่า | แก้ 6 แถว (สถานะเท่านั้น) |
| ② ปรับ (ทางเลือกเทียบ) | สถานะเหมือน ① + เพิ่มค่าตำแหน่งใหม่ 2 ค่า (ผู้ช่วยช่างทั่วไป, พนักงานช่วยเหลือคนไข้) และแก้ STAFF-003 พนักงานเปล→พนักงานช่วยเหลือคนไข้ | 5 → 7 ค่า | แก้ 7 แถว |
| ③ ปรับ (รักษะ AppSheet เดิมสุด) | สถานะเหมือน ① + แก้ทั้ง 3 แถวตำแหน่ง → พนักงานบริการ ไม่เพิ่มค่า enum | คง 5 ค่า (ตรง AppSheet เป๊ะ) | แก้ 9 แถว — ⚠️ บทบาทจริงสูญ และคนเหล่านี้จะผ่านเกตผู้บันทึก/ผู้ตรวจสอบที่อิง พนักงานบริการ โดยไม่ตรงตำแหน่ง |
| ④ แก้รายแถว | ผู้ใช้ตาราง §3 ทำเครื่องหมาย/สั่งแก้รายคน แล้วให้ทำตาม | ตามที่สั่ง | ตามที่สั่ง |

---

## 5. สิ่งที่จะเกิดหลังอนุมัติ (อีก lane หนึ่ง ไม่ใช่เอกสารนี้)

1. migration แก้ค่าตามที่อนุมัติ (UPDATE เฉพาะแถวที่ได้รับอนุมัติ — ไม่แตะแถวอื่น)
2. `ALTER TABLE core.personnel VALIDATE CONSTRAINT ck_core_personnel_position_enum;` + `…status_enum;` — เท่านี้ constraint จะกลายเป็น VALID สมบูรณ์
3. จากนั้น enum ตำแหน่ง/สถานะพร้อมเป็นฐานของ dropdown parity (Valid If role-filter ตามแผน §4.2 ของ APPSHEET-PARITY-PLAN)

หากเจ้าของยังไม่ตัดสิน: constraint ยังคง NOT VALID ต่อไป (ข้อมูลเดิมอ่านได้ครบ ไม่มีอะไรพัง — เพียงแต่ค่าใหม่ยังถูกบังคับ enum ทันที ส่วนค่าเดิมนอก enum จะยังฝังค้างได้จนกว่าจะแก้)

---

## 6. ร่องรอยการทำงานของเอกสารนี้

- ดึงข้อมูล: read-only SELECT ผ่าน `https://api.supabase.com/v1/projects/gllqtbyofrcjzmbnfoeh/database/query` (Management API) ด้วย `SUPABASE_ACCESS_TOKEN` จาก Drive secrets (พาธ secrets — REDACTED) — token ไม่ถูกพิมพ์/บันทึกที่ใด
- ไม่มีการ INSERT/UPDATE/ALTER ใด ๆ ต่อ DB; ไม่มีการ commit/push; เขียนไฟล์เฉพาะ /tmp
- เลขบัตรประชาชน 13 หลัก / เบอร์โทร / พาธรูป ไม่ถูกดึงและไม่ปรากฏในเอกสารนี้ (ตรวจ grep ไม่มี pattern 13 หลัก)
- หลักฐานอ้างอิง: P1.1 migration `supabase/migrations/20261115120000_parity_p1_001.sql`, เอกสาร 12 §3.2 (ref 105–152, 6452), APPSHEET-PARITY-PLAN.md (แถว ข้อมูลผู้ปฏิบัติงาน 9 คน), บันทึก P2.3/P2.4 (Valid If verbatim)

*(End of Appendix A — the attachment reproduces the original through its final line; 9 name cells + 1 secrets-path marker redacted as declared in §6 above.)*

## 7. Local-worktree caveat (freshness-gate record)

The canonical checkout was NOT usable as the authoring surface for this
transition: it sat on the sibling `docs/env-repair-report-honesty-001-claim`
branch at `40cab6b` (BEHIND origin/main `ecf4b88`) with an UNCOMMITTED
in-progress registry edit owned by that lane. Per the repository freshness
gate, nothing there was cleaned, reset, stashed, or overwritten; this
transition was authored in the clean worktree
`_worktrees/env-personnel-c8-001` off the verified base `ecf4b88` and the
canonical checkout was left exactly as found. The sibling lane's transition,
when it opens, will re-fence against the then-current main (the registry is
merge-ordered by protocol — one new claim per transition).
