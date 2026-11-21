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

## 8. Implementation receipt (2026-11-21, Track-Z GLM — STOP at REVIEW_REQUESTED)

Branch `feat/env-personnel-c8-001` off the verified post-merge main tip
`643603cca4e66125028a98a9dfde293ea9ca7d7d` (freshness gate: `git fetch`
+ ancestor check at lane start, clean tree). Deliverables: the ONE
migration `supabase/migrations/20261121100000_parity_c8_personnel_enum.sql`
+ the NEW suite `scripts/test_parity_c8_personnel_enum.py` + this handoff
+ the WO status. `frontend/`, `supabase/functions/`, `.github/`,
`config.toml`, `seed/`, `CHANGELOG.md`, `frontend/package.json`,
`20261115120000_parity_p1_001.sql` — all byte-untouched (diff ⊆ WO §7).
CURRENT-WORK.md untouched at implementation-PR time per the house
precedent (the closeout transition updates the registry).

### D1 — live re-verification (read-only Management-API probes, synthetic codes only)

Live state at the new base, 2026-11-21: 9 rows total; `active` = 6 with
ALL 6 inside the authorized code set (gate6 = 6 — the predicate
`status='active' AND employee_code IN (STAFF-001/002/003/006/008/009)`
matches exactly the intended 6); `ทำงาน` = 0; `ลาออก` = 3
(STAFF-004/005/007); positions byte-match WO §0 row-by-row
(STAFF-002 `ผู้ช่วยช่างทั่วไป`, STAFF-003 `พนักงานเปล`, STAFF-009
`พนักงานช่วยเหลือคนไข้` outside the old 5-value enum); both CHECKs
`convalidated=false` with the pinned P1.1 deparses; the P1.4 recorder
gate rejects all 9 pre-fix (STAFF-001/STAFF-008 fail the status
clause). **No drift — no pivot.**

### D2 — truthful RED (pre-apply)

`uv run --with pytest python -m pytest scripts/test_parity_c8_personnel_enum.py -q`
→ **17 failed / 9 passed / 32 subtests passed**; the failing classes
are EXACTLY the WO §5 D2 four classes: (a) the 6-row status delta
(`active` must be 0 — was 6; `ทำงาน` must be 6 on the exact code set —
was 0; post-fix row map ×6), (b) the 8-value position-CHECK def (3 new
values absent + parent def pin), (c) `convalidated=true` ×2 (were
false ×2), (d) the P1.4 gate admission (STAFF-001/STAFF-008 rejected).
Standing passes disclosed verbatim: the 9-row total, positions
byte-stable row-by-row, the 3-outside-old-enum fact, all 9 positions
inside the 8-value set (as data), the status CHECK 4-value pin, the 3
`ลาออก` rows failing the gate by design, the exited-set pin.

### D3 — apply (ENV_DB gate, `scripts/apply_migration_api.py`)

**Apply attempt 1 (WO §5 D3 literal order UPDATE-first) FAILED — the
live DB refuted the pinned order, recorded verbatim here as the
ordering deviation (WO §6/D1-adjacent, reviewer adjudicates):**
statement 1 (`UPDATE … SET status='ทำงาน' …`) failed
`23514: new row for relation "personnel" violates check constraint
"ck_core_personnel_position_enum"` — a status UPDATE writes a new row
version, and 3 of the 6 target rows (STAFF-002/003/009) carry
positions outside the STILL-PRESENT old 5-value CHECK, so EVERY status
UPDATE on them is rejected. The statement rolled back atomically (the
count guard read active=6 / ทำงาน=0 immediately after — no partial
write); the position-CHECK DROP + re-ADD(8 values) + VALIDATE landed
(statements 3–5 OK), VALIDATE status correctly refused (6 rows still
`active`). Root cause: an order dependency the WO missed — the
constraint swap MUST precede the status UPDATE. Semantics unchanged:
same UPDATE predicate, same 8-value enum, same VALIDATE-both, same
rollback.

**Apply attempt 2 (corrected order: swap → UPDATE → guard → VALIDATE
×2 → notify): 7/7 OK, 0 FAIL.** The count guard passed, which is the
exactly-6 row-count pin: post-apply probes recorded `active` = 0,
`ทำงาน` = 6 (ALL 6 inside the authorized set), `ลาออก` = 3 untouched,
positions byte-identical, both CHECKs `convalidated=true` with deparses
matching the suite pins byte-exactly (8-value ARRAY in authored order,
no `NOT VALID` suffix — no pin correction needed on the constraint
defs). Per-statement row counts: the Management-API query endpoint
returns no command tag for UPDATE, so the exactly-6 evidence is the
in-transaction count guard (statement 4) + the post-apply count probes
+ the suite — recorded honestly instead of an unverifiable "UPDATE 6"
tag.

**PII incident (declared, never repeated):** the attempt-1 PG error
`DETAIL` echoed one full row INCLUDING a personnel name into the apply
stderr (the local receipt `/tmp`-only, never committed, never quoted
further). The corrected apply produced no row-echo. Lesson carried for
future lanes: prefer predicates whose failure modes cannot echo PII
rows in DETAIL, and keep raw apply logs out of Git.

### D4 — battery (all GREEN at the implementation head)

| Gate | Result |
|---|---|
| Contract suite (post-apply) | **13 passed / 45 subtests passed** |
| guard (`scripts/env_coordination_guard.py` tests) | **Ran 344 tests — OK** |
| runtime (`scripts/test_env_autonomy_runtime.py`) | **Ran 62 tests — OK** |
| validate-registry | `ok:true`, 51 claims, BOOTSTRAP_CONTROL |
| `check_release_version.py` | **OK (v1.15.0)** exit 0 — NO BUMP holds |
| vitest FULL | **990 passed / 1 skipped (991)** |
| `tsc -b` | exit 0 |
| `oxlint` (`npm run lint`) | exit 0, 0 errors (19 pre-existing warnings) |
| Playwright FULL `--workers=1` | **335 passed** |
| `git diff --check` | clean |
| PII gate | **PASS** — the 9 name tokens (extracted read-only from the /tmp proposal, never echoed) + any 13-digit pattern + JWT/token literals: **0 matches** across ALL changed files |
| diff vs base | exactly 4 files ⊆ WO §7 |

Battery notes (disclosed): (1) the fresh worktree lacked the GITIGNORED
`frontend/.env` — vitest first ran 2 failed / 785 passed with 8
file-level collection failures, ALL from the house fail-loud guard
(`Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY`); resolved by
copying the canonical checkout's gitignored `frontend/.env` into the
worktree (machine-local, never committed, values never printed) — the
same fresh-worktree prerequisite the P4-001 closeout already recorded;
after the copy: 990 passed / 1 skipped. (2) Frontend battery ran green
with ZERO frontend diffs — pure no-regression gate.

### Deviations for reviewer adjudication (3)

1. **Statement-order deviation (WO-forced-by-live-DB):** forward order
   is constraint-swap → status UPDATE → guard → VALIDATE ×2, not the
   WO §5 D3 UPDATE-first order — the live 23514 (attempt 1) proves the
   WO order is impossible; all authorized surfaces unchanged; the
   migration header records the full attempt-1 story.
2. **Test-side pin correction (P1.001 precedent):** the D2 RED run
   pinned the post-fix recorder-gate admitted set as exactly
   {STAFF-001, STAFF-008}; the GREEN live probe replaced it with the
   §0-table-derived set **{STAFF-001, STAFF-006, STAFF-008}** —
   STAFF-006 (พนักงานบริการ) passes the UNCHANGED P1.4 predicate
   post-fix and failed pre-fix only via `active`. The gate did NOT
   widen; the original pin was narrower than its own predicate. The
   correction comment lives in the suite test body.
3. **PII DETAIL incident:** the attempt-1 PG DETAIL echoed one
   personnel name into /tmp-only stderr — never committed, never
   re-quoted; declared here per the honesty pins.

### D5 repair receipt (2026-11-21) — P2 rollback-comment correction + P3 repairs

**P2 — rollback comment block corrected in place (comment-only edit;
the applied statements stay byte-identical).** The documented ROLLBACK
trailer in `supabase/migrations/20261121100000_parity_c8_personnel_enum.sql`
had a statement-order bug: its UPDATE-first draft ran
`SET status='active'` while the LIVE-VALIDATED 4-value status CHECK was
still in place → 23514 on all 6 rows (PG re-validates the whole new row
on every UPDATE). Rewritten to the fails-closed order: (1) DROP both
CHECK constraints → (2) reverse UPDATE (status='active' by the
synthetic 6-code set) → (3) re-ADD both CHECKs NOT VALID. Precedent:
the P2.2 D5-P3 comment-correction class — comments edited in place,
applied statements never touched (verified: git diff = comment lines
only).

**P3a — stale test renamed** to match the {STAFF-001, STAFF-006,
STAFF-008} pin: `…admits_staff001_and_staff008…` →
`test_recorder_gate_admits_exactly_staff001_staff006_staff008_post_fix`
(assertion body + the in-test pin-correction record unchanged).

**Lane lessons (DEFECT-MEMORY-style, for future apply lanes):**

- Apply tooling continues past failed statements — attempt-1 left a
  schema-only intermediate state; always verify post-apply posture via
  the count guard.

### STOP

Implementation halted at REVIEW_REQUESTED per the claim contract — the
implementer never merges. D5 fresh-GLM review + the reviewer-owned
approval/merge follow.
