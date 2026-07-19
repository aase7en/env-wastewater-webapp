# Work Orders — หน่วยงานที่ agent ไหนก็หยิบทำต่อได้

ทุก chunk มีไฟล์ WO ของตัวเอง สถานะ:
`open` → `claimed(<agent>)` → (`⏸ paused`) → `done`

## Model tier (ประหยัด credit — cost-first pyramid)

ทุก WO ประกาศ `Model tier` บนหัวไฟล์ — dispatch ตามนี้:

| Tier | Model | เหมาะกับ |
|---|---|---|
| **cheap-ok** | GLM (ZCode) / Claude Sonnet 5 | งาน mechanical มี Reference pattern ให้ copy ครบ (conformance, icon swap, CRUD UI ตาม golden reference) |
| **mid** | Claude Opus 4.8 | reasoning ปานกลาง แต่ spec ปิดช่องแล้ว (interactive component, refactor ที่ acceptance ชัด) |
| **primary-only** | Fable5 | design ใหม่, security, cross-system, แก้ protocol — และเป็นผู้ตรวจ diff งาน tier ล่าง |

WO ระดับ cheap-ok/mid ต้องมีครบ: `Reference pattern` (ชี้ไฟล์+สิ่งที่ copy),
`Forbidden` (ข้อห้าม — เจอเกิน scope ให้หยุดแล้วบันทึก checkpoint แทนการเดา),
`Verify commands` (copy-paste ได้)

## Dispatch prompts (user ใช้สั่งงาน)

**ZCode (GLM):**
```
อ่าน MIGRATION.md section "Two-track F/Z" + docs/work-orders/<id>.md
claim ในตาราง In-progress ก่อนเริ่ม แล้วทำตาม Steps เฉพาะ Lane/files ที่ระบุ
ห้ามเกิน Forbidden; เสร็จ = Verify commands ผ่าน → commit → push → set done
ห้าม git reset --hard (rule 6)
```

**Claude Sonnet 5 / Opus 4.8** (เปิด session ใหม่ใน repo นี้, เลือก model ก่อน):
```
อ่าน MIGRATION.md section "Two-track F/Z" + docs/work-orders/<id>.md
claim ในตาราง In-progress ก่อนเริ่ม (commit+push แถว claim)
ทำตาม Steps ทีละข้อ เฉพาะ Lane/files ที่ระบุ — ห้ามเกิน Forbidden
ติดปัญหา/เจอสิ่งนอก spec: อย่าเดา — commit งานที่ผ่าน build + append
Checkpoint + Status ⏸ paused แล้วจบ
เสร็จ: Verify commands ผ่านครบ → commit ตาม convention chunk(<id>) →
push → Status done + ปลด claim
```

**Resume/handoff (agent ไหนก็ได้ เมื่อมี ⏸ paused):**
```
อ่าน MIGRATION.md section "Two-track F/Z" + docs/work-orders/<id>.md
ทำต่อจาก Checkpoint ล่าสุด เฉพาะใน Lane/files ที่ระบุ
เริ่มจาก branch ที่ work order ระบุ; เสร็จแล้ว merge เข้า main + set done
```

## Pause protocol (ใกล้ 5-hr limit / ต้องสลับ agent)

commit งานค้าง (build ผ่าน → branch ปกติ; ไม่ผ่าน → `wip/<id>`) → append
Checkpoint (commit hash + เหลืออะไร + กับดัก) → Status `⏸ paused` →
อัปเดตตาราง claim ใน MIGRATION.md → push — **ห้ามทิ้ง uncommitted**

ZCode รับงานที่ค้างบน `track-f`: merge `track-f` เข้า tree ตัวเอง —
**ห้าม checkout `track-f` ตรง ๆ** (mount อยู่ใน worktree `A:\GitHub\envww-trackf`)

## คิวปัจจุปัน (อัปเดต 2026-07-20 — post F8/CI-1/FastAPI-removal/F6.5)

- **cheap-ok/mid เปิดอยู่ (GLM sweep รอบนี้)**:
  - `STAT-1-status-badge-polarity` (mid — rename prop `status`→`operating`, 4 callsites + stories)
  - `AUTH-1-auth-loading-race` (cheap-ok/mid — refresh-bounce login; async ordering fix)
  - `SCHEMA-6-overview-public-aggregate` (cheap-ok — public definer view สำหรับหน้า `/` anon)
- **cheap-ok เปิดอยู่ (backlog รอบถัดไป)**:
  - `introspect_schema_api::SCHEMAS` ขยาย 3→11 domain schemas (1 บรรทัด)
  - Material Symbols subset แบบ keep-axes (ฟอนต์ 3.9MB → subset)
  - E2E authenticated integration profile (P11 follow-up — ต้องมี real seeded session)
- **mid เปิดอยู่**: (ว่าง — F6 ปิดแล้วในรอบ #2)
- **ปิดแล้ว (ประวัติ)**: F1 · F2 · F3 · F4.1–F4.5 · F5 (ทั้ง logic+visual) ·
  F6 (+ F6.5 hotfix + F8 NAV pass) · SCHEMA-1..5 (+ audit_log addendum) ·
  DBA-1..10 · MOD-*-a · MOD-*-b · CRB-2-realtime · F7-stale-data ·
  FASTAPI-removal (Approach C) · CI-1 (Node 24) · V1a..V4b · AI-1..3 ·
  IMP-1..3 · PDF-1..3 · DOC-3
- Protocol เต็ม + กติกา 8 ข้อ: MIGRATION.md §Two-track และ A-Wiki
  `docs/protocols/cross-agent-work-orders.md`
