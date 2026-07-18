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

## คิวปัจจุบัน

- **cheap-ok เปิดอยู่**: F4.3 Equipment → F4.4 Reports → F4.5 Auth
  (`F4-page-conformance.md`) · MOD-*-b UI เมื่อ -a เสร็จ (copy โครง `CarbonPage.tsx`)
- **mid เปิดอยู่**: F5 PFD interactive · F6 fonts/bundle
- Protocol เต็ม + กติกา 8 ข้อ: MIGRATION.md §Two-track และ A-Wiki
  `docs/protocols/cross-agent-work-orders.md`
