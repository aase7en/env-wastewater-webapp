# Work Orders — หน่วยงานที่ agent ไหนก็หยิบทำต่อได้ (Rule 7)

ทุก chunk มีไฟล์ WO ของตัวเอง สถานะ: `open` → `claimed(<agent>)` → (`⏸ paused`) → `done`

**Pause protocol (ใกล้ 5-hr limit):** commit งานค้าง (build ผ่าน → branch ปกติ; ไม่ผ่าน → `wip/<id>`) → append Checkpoint (commit hash + เหลืออะไร) → Status `⏸ paused` → อัปเดต claim ใน MIGRATION.md → push

**Resume prompt (user ใช้กับ agent ไหนก็ได้):**

```
อ่าน MIGRATION.md section "Two-track F/Z" + docs/work-orders/<id>.md
แล้วทำต่อจาก Checkpoint ล่าสุด เฉพาะใน Lane/files ที่ระบุ
เริ่มจาก branch ที่ work order ระบุ; เสร็จแล้ว merge เข้า main + set done
```

ZCode รับงานที่ค้างบน `track-f`: merge `track-f` เข้า tree ตัวเอง — **ห้าม checkout `track-f` ตรง ๆ** (mount อยู่ใน worktree `A:\GitHub\envww-trackf`)

Wave 1: V1a/b (ใบแจ้งซ่อม), V2a/b (Carbon), V3a/b (Bell), V4a/b (Unified home) — a=data ก่อน b=UI ของ feature เดียวกัน, ต่าง feature ขนานกันได้ · Track F: F4.1–F4.5, F5, F6
