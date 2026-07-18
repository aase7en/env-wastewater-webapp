# Handoff — 2026-07-19 (Track Z rolling roadmap closed)

> สำหรับ agent ที่รับงานต่อ (Fable5 / Sonnet 5 / Opus 4.8 / Hermes).
> อ่านไฟล์นี้ครั้งเดียวแทนการไล่ประวัติทั้งหมด
> Authoritative status: `git log --oneline | head -40` + `MIGRATION.md`

## สถานะรวม (19 ก.ค. 2026 / พ.ศ. 2569)

**Track Z (data/logic/SQL) — COMPLETE ทุก chunk ที่วางแผนไว้**

| Wave | Chunks | Commit สุดท้าย | สถานะ |
|---|---|---|---|
| Wave 1 (V1–V4) | V1a/b, V2a/b, V3a/b, V4a/b | `1d2e6a8` | ✅ ทั้ง 8 |
| Wave 2 (SCHEMA) | SCHEMA-1..4 | `ef6989c` | ✅ ทั้ง 4 |
| Wave 3 (MOD) | MOD-WS/WA/FU/GA/BL/FS/FO/CH (-a libs+pages) | `28cef54` | ✅ ทั้ง 8 |
| Wave 4 (cross-cutting) | AI-1/2/3, IMP-1/2/3, PDF-1/2/3, DOC-3 | `3aaddb0` | ✅ ทั้งหมด |
| Wave 4b (DBA Console) | DBA-1..10 | `ec4bc0d` | ✅ ทั้ง 10 |
| Cleanup (19 ก.ค.) | hash backfill, schema drift, success toasts | `8c81f15` | ✅ |

**Track F (visual) — F1/F2/F3/F4.1–F4.5 ปิด โดย Fable5/Sonnet บน `track-f` worktree.**

## งานที่เหลือ จริง ๆ (รอ dispatch)

### 🟡 เปิดอยู่ (WO `Status: open`)

| WO | เนื้องาน | Tier | แนะนำให้ทำ |
|---|---|---|---|
| `F5-pfd-interactive.md` | PFD hover/click state, drill-down | mid | **Sonnet 5** (มี Reference pattern ครบ) |
| `F6-production-polish.md` | font subset, bundle split, brand hygiene | mid | **Sonnet 5** |

### 🟡 Track F scope (ห้าม GLM5.2 แตะ className)

- **MOD-*-b UI polish** สำหรับ 8 module page (WaterSupply/Garbage/Fuel/Garden/Building/Safety/Food/Chemical):
  - skeleton CRUD ทำงานได้แล้ว (`8c81f15` เพิ่ม success toast ล่าสุด)
  - ที่ยังขาด: header layout, EmptyState, summary tiles, brand accent — ทั้งหมดเป็น **className/markup = Track F**
  - วิธีทำ: copy โครง `CarbonPage.tsx` (golden ref สำหรับ analytics page) หรือ `ReadingsListPage.tsx` (golden ref สำหรับ CRUD page)
  - **Fable5/Sonnet เป็นเจ้าของไฟล์เหล่านี้ต่อไป**

### 🔴 Blocked on user

- **MIG-WA + MIG-FU** — AppSheet CSV export ยังไม่ได้จาก user. รอ export จริงจึง migrate ได้
- **AppSheet data backfill** สำหรับ module ใหม่ (8 module) — รอ user ระบุว่ามี AppSheet data อยู่แล้วหรือเริ่มสะสมใหม่ใน webapp

### 🟢 P3 deferred (ยังไม่ถูกแผนงาน — เลือกได้)

| งาน | Tier | หมายเหตุ |
|---|---|---|
| ลบ FastAPI legacy dead code (`app/`, `tests/`, `pyproject.toml`) | **mid** | one-way door ⚠️ → ต้อง Fable5 verify ก่อนลบ |
| `apply_migration_api.py` splitter bug (`;` ใน string literal) | mid | ต้อง parser ใหม่ → **Sonnet 5** |
| A-Wiki entity page content fill | cheap-ok | GLM ก็ทำได้ |
| E2E tests สำหรับ 8 module + DBA Console | mid | **Sonnet 5** (Playwright via `webapp-testing` skill) |

### 💡 P4 ideas (ยังไม่วางแผน — ต้อง design ก่อน)

- AI NL→SQL modal ใน DBAConsolePage (DBA-8 spec มี lib แล้ว ขาด UI)
- AI row annotation ใน ResultTable (DBA-10)
- AI suggest queries chip (DBA-9)
- Realtime subscription สำหรับ carbon rollup
- drag-drop PDF template designer
- audit log viewer admin page

ขั้นตอน: **Fable5 design → write WO with Reference pattern → ค่อย dispatch tier ล่าง**

## Model routing (ยืนยันจาก `docs/work-orders/README.md`)

```
┌─────────────────────────────────────────────────────┐
│  Fable5 (primary-only)                              │
│  • verifier ของ diff ทุกชิ้น (built-in role)        │
│  • design ใหม่ / security / cross-system / protocol │
│  • P4 ideas → spec ก่อนแยก tier                     │
│  • FastAPI dead code removal (one-way door)         │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  Sonnet 5 (cheap-ok/mid boundary)                   │
│  • F5 PFD interactive                                │
│  • F6 production polish                              │
│  • E2E tests                                         │
│  • apply_migration_api.py parser rewrite            │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  GLM 5.2 / ZCode (cheap-ok)                         │
│  • mechanical มี Reference ให้ copy ครบ              │
│  • A-Wiki entity page content                       │
│  (ปัจจุบันไม่มี cheap-ok เปิดอยู่ — Track Z ปิดหมด)   │
└─────────────────────────────────────────────────────┘
```

## กติกาที่ต้องรู้ก่อนเริ่ม (จาก `MIGRATION.md §Two-track`)

1. **Claim ก่อน work**: เพิ่มแถวในตาราง In-progress ของ `MIGRATION.md` → commit+push → ค่อยเริ่ม
2. **pull --ff-only ก่อน commit** + `npm run build` ต้องผ่านก่อน push ทุกครั้ง
3. **ห้าม `git reset --hard` / `git checkout -- .` / `git clean`** — Track F worktree อาจมีงานค้าง
4. **Track F scope**: colors/fonts/layout/tailwind.config/index.css/design/`frontend/public/`/`index.html` (F1 ปิดแล้ว แต่ className ของทุก page ยังเป็น F)
5. **Track Z scope**: `src/lib/*`, page logic, SQL/Edge Functions, e2e tests, `.zcode/*`
6. **PHI boundary**: ข้อมูลคนไข้ไม่ออกนอกระบบ — `core.ai_scope.patient_safe=false` filter ก่อนเรียก AI provider. **Z.ai/GLM cloud อยู่ใต้กฎหมายจีน → ห้าม route PHI แม้ indirect**
7. **Data policy**: `data/raw/` และ `.env` gitignored ห้าม commit, ห้าม print ลง chat
8. **วันที่ = พ.ศ.** เสมอ (CE + 543) — อย่า assume CE
9. **Worktree Track F**: `A:\GitHub\envww-trackf` mount อยู่บน branch `track-f` — ห้าม checkout ตรง ๆ ถ้าเป็น ZCode; ใช้ `git fetch origin track-f` แล้ว merge แทน

## Resume prompt (สำหรับ agent หยิบงานต่อ)

```
อ่าน docs/handoff/2026-07-19-track-z-complete.md + MIGRATION.md §Two-track
เลือก WO จาก "งานที่เหลือ" ใน handoff doc — claim ใน MIGRATION.md ก่อน
ทำตาม Lane/files ในไฟล์ WO ห้ามเกิน Forbidden
เสร็จ: Verify commands ผ่าน → commit chunk(<ID>): → push → Status done
```

## Commit สำคัญล่าสุด (อ้างอิง)

- `8c81f15` — fix(MOD-b toast): success toast 8 module pages
- `7c7159a` — fix(schema-drift): equipment.name alias + drop phantom reported_date
- `cf83876` — docs(WO): backfill commit hash 7 WO (SCHEMA-1..4 + DBA-1..3)
- `13bb737` — docs(WO-batch): sync 15 WO status → done
- `3aaddb0` — chunk(PDF-1/2/3 + DOC-3): template designer + print + attachments
- `0a5d111` — chunk(IMP-1/2/3): generic import engine + 9 adapters
- `ec4bc0d` — chunk(Phase E+F+G): AI-SQL + carbon rollup + regulations
- `d48c6f2` — chunk(DBA-4..7): DBA Console page
- `28cef54` — chunk(MOD-batch pages): 8 module page skeletons
- `c639b67` — chunk(SCHEMA-1): v2 multi-domain foundations (8 schemas)

---

**จบ Track Z สำหรับตอนนี้.** ส่งต่อให้ Fable5 ตรวจ diff รอบนี้, และ Sonnet 5 รับ F5/F6.
