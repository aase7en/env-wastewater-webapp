# ENV-APP-VERSION-001 — ระบบเลขเวอร์ชัน release + ปรับปรุง README (Work Order)

สถานะ: **IMPLEMENTATION COMPLETE — REVIEW_REQUESTED (implementation PR
เปิดรอรีวิวอิสระ D5; lane ไม่ merge เอง)** claim
`ENV-APP-VERSION-001-C1` generation 1; implementation branch
`feat/env-appversion-001` ตัดจาก main @
`ebdfcee42d115dc7f2a1925cfec7a0a16ea533d9` (transition PR #167 merged);
D1 consult เสร็จสิ้น (receipts verbatim ใน handoff หมวด D1 — binding:
SemVer vMAJOR.MINOR.PATCH, release แรก v1.0.0, chip มุม footer,
per-release changelog); D2 RED + D3a + D3b + D4 battery เสร็จ
(หลักฐานต่อ phase ใน handoff หมวด Checkpoints); tag `v1.0.0` **ยังไม่ตั้ง**
— จะตั้งหลัง merge + ตรวจ deploy แล้วเท่านั้น (ต้องชี้ SHA ที่ deploy จริง)
(transition base เดิม: `6ad9aa76049aa3c2e8418cdb5a32c2a1a92359cd`, สาขา
transition `docs/env-appversion-001-claim`, worktree ที่จดทะเบียน
`/Volumes/MAC_WORK/DevWorkspace/Github/_worktrees/env-appversion-001-20261112`)
ใบเสร็จถาวรอยู่ใน `docs/ai/handoffs/ENV-APP-VERSION-001-GLM.md`
Task: `ENV-APP-VERSION-001` (task row ใหม่ — ตรวจความซ้ำของ task_id กับ
ทะเบียนผ่าน guard แล้ว ไม่มี OWNERSHIP_CONFLICT; claim id คือ
`ENV-APP-VERSION-001-C1`)

## เป้าหมาย — deliverable สองชิ้น

### (A) ระบบเลขเวอร์ชัน release ที่ผู้ใช้เห็นได้

ทุก release ในอนาคตต้องมี **เลขเวอร์ชันที่มองเห็นได้ในแอป** — กลไก (pinned):

- **แหล่งเดียวของเลขเวอร์ชัน**: `frontend/package.json` field `version`
  (ปัจจุบัน `0.0.0` ที่บรรทัด 4 — gap ที่เจ้าของเห็นและสั่งแก้)
- **Build-time injection**: Vite `define` ใน `frontend/vite.config.ts`
  ฉีดค่า version เข้า build — แอปอ่านจาก **ที่เดียว** ผ่าน lib ใหม่
  `frontend/src/lib/version.ts` (ไม่มี hardcoded เวอร์ชันซ้ำซ้อน — no drift)
- **Version chip เล็กใน UI ของแอป** (component ใหม่ใน
  `frontend/src/components/layout/` + จุด wire เดียวใน app shell): แสดงเลข
  เวอร์ชัน; **ผู้ใช้แตะได้ → แสดงสรุป release ล่าสุด**
- **`CHANGELOG.md`** (repo root, **ใหม่**): ภาษาไทย เขียนสำหรับผู้ใช้
  วันที่เป็น พ.ศ. (ค.ศ. + 543)
- **Git tag ต่อ release**: ตั้งชื่อตามสกีมที่ D1 กำหนด
- **สคริปต์ตรวจความสอดคล้อง (small consistency check)**:
  `scripts/check_release_version.py` (ใหม่) — **ไม่แก้ CI workflow ใด ๆ
  เว้นแต่ trivially safe และต้องมี justification แบบ repair-round**

**สกีม = D1 DELEGATED — ห้าม pre-bake ใน claim นี้**: SemVer vs
date-based/CalVer, ตำแหน่ง chip, tag prefix, เลข release แรก, ความละเอียดของ
changelog (granularity) — **ต้องมาจาก joint delegated consult (Jev + Terra)
ก่อน D2 เสมอ** พร้อมใบเสร็จ verbatim ใน handoff กลไก (mechanism) ด้านบนตายตัว
แต่ตัวเลข/รูปแบบเวอร์ชันยังไม่มีค่าใด ๆ ในเอกสาร claim นี้โดยตั้งใจ

### (B) ปรับปรุง README ให้ตรงความจริงปัจจุบัน

`README.md` ล้าสมัยตั้งแต่เดือน กรกฎาคม 2569 (ระบุแค่ `/dashboard`, `/form`,
`/readings` + ถ้อยคำยุค migration/palette P10.x) — ปรับให้ตรงของจริง:

- Production URL `https://aase7en.github.io/env-wastewater-webapp/` + สรุป
  auth (Supabase Auth/RLS, login-gated)
- **รายการหน้าจริง** — ตรวจจาก `frontend/src/App.tsx` แล้ว ณ base นี้
  (ห้ามมั่ว): Command Center/overview (`/`), `/dashboard`, ฟอร์มรายวัน
  (`/form`, `/form/:id`) ครบ 8 โดเมน (wastewater/chemical/water-supply/fuel/
  garden/garbage/safety/food) + `/building`, `/flow` (เรื่องเล่ากระบวนการ +
  สถานการณ์ SIMULATED + numeric chips N2/N3/N4), Digital Twin (ผิวน้ำบ่อ
  เติมอากาศ + status callouts), `/sustainability` (T-VER readiness),
  `/operations` (attention board), `/readings` `/trends` `/reports`
  `/equipment` `/sensors` `/carbon` `/carbon-rollup` `/water-watch`
  `/regulations` `/attachments` `/import` `/pdf-designer` `/admin/*`
- Tech stack: React + TypeScript + Vite + Tailwind; Supabase Postgres + RLS;
  Three.js/React-Three-Fiber Twin; GitHub Pages auto-deploy
- **หมวด versioning** ชี้ไปที่ `CHANGELOG.md`
- **ห้ามแตะ**: หมายเหตุ companion-repo/A-Wiki, หมายเหตุ `data/raw/`
  gitignored, หมายเหตุ secrets, หมวด Python scripts (ตรวจว่าคำสั่งยังถูก
  ต้องจริง ณ base — ไฟล์อ้างอิงยังมีอยู่: `scripts/apply_migration_api.py`,
  `scripts/introspect_schema_api.py`, `scripts/test_split_sql.py`,
  `scripts/_env.py`)
- **ลบ**: ถ้อยคำล้าสมัย palette/migration-era P10.x
- คงสไตล์ภาษาอังกฤษของไฟล์เดิม

## ฐานอำนาจอนุมัติ (Authorization basis — บันทึกตรงไปตรงมาและครบถ้วน)

1. **การตัดสินใจของเจ้าของในเซสชัน 2026-11-12 (Kilo chat)**: หลังเห็น gap
   ปัจจุบัน (`frontend/package.json` version `0.0.0`, ไม่มี `CHANGELOG.md`,
   `README.md` ล้าสมัยตั้งแต่ ก.ค. 2569) เจ้าของตอบ **"ทำทั้งสองอย่าง"** —
   ทั้งระบบเวอร์ชันและการปรับ README
2. **คำสั่งถาวรของเจ้าของ**: มอบจุดตัดสินใจให้ Jev + Terra — สกีมเวอร์ชันเป็น
   D1 delegated consult (binding เฉพาะขอบเขตสกีม; delegates ไม่มีอำนาจ
   merge/review-acceptance ตามนโยบาย delegated-decision ที่ wired ใน
   `scripts/env_autonomy_runtime.py`)
3. **หลักฐาน gap ณ base** (ตรวจแล้ว): `frontend/package.json:4` = `"version":
   "0.0.0"`; ไม่มี `CHANGELOG.md` ที่ repo root; `README.md` (68 บรรทัด)
   ระบุหน้าแค่ 3 หน้า + ถ้อยคำ P10.6/P10.7 ยุค migration

## Execution routing

- **D1** — Joint delegated consult **ก่อน D2**: Jev (jev-advisory MCP) +
  Terra (Codex CLI read-only) ตอบคำถามสกีม (SemVer vs CalVer, ตำแหน่ง chip,
  tag prefix, เลข release แรก, changelog granularity); ใบเสร็จ verbatim
  คัดลอกถาวรใน handoff (หมวด D1)
- **D2** — GLM Track-Z: RED-first tests ก่อน (`frontend/src/lib/version.test.ts`,
  `scripts/test_check_release_version.py`,
  `frontend/tests/e2e/env-app-version-001.spec.ts`) — truthful failures
  บันทึกถาวร
- **D3a** — GLM Track-Z implementation: `frontend/package.json`,
  `frontend/vite.config.ts` (define), `frontend/src/lib/version.ts`,
  สคริปต์, `CHANGELOG.md`, `README.md`
- **D3b** — Codex CLI `gpt-6-sol` @ `model_reasoning_effort=max` Track-F —
  **เฉพาะ chip component + จุด wire เดียวใน app shell** ภายใต้ Role B
  **single-writer window**: admission probe ก่อน dispatch; ถ้า dispatch จริง
  คืน provider admission error → **จดสถานะ BLOCKED ในทะเบียน ห้าม fallback
  เงียบ** — ไม่มี GLM รับงาน Track-F แทนเอง, ห้าม GPT-6 Astra เด็ดขาด
- **D4** — GLM battery เต็ม: FULL vitest + tsc + lint + Playwright FULL +
  guard 344/344 + runtime 62/62 + script check ที่ head ที่ freeze
- **D5** — fresh-GLM independent review (Terra ผ่าน Codex CLI eligible เป็น
  cross-model reviewer; GPT-6 Astra ห้าม; never author-and-approve; never
  silent downgrade); implementer ห้าม merge ตัวเอง — **lane หยุดที่
  REVIEW_REQUESTED เสมอ**
- **Release แรก — หลัง merge เท่านั้น**: แท็กตามสกีม D1 + บันทึก entry
  release นี้ใน `CHANGELOG.md` (พ.ศ.)

## Scope (mutable, exactly — ตรงกับ registry claim entry, one-writer)

ตรวจแล้ว ณ base ว่ามีอยู่จริงหรือเป็นไฟล์ใหม่:

- `frontend/package.json` (มีอยู่ — bump field `version` ตามสกีม D1)
- `frontend/vite.config.ts` (มีอยู่ — เพิ่ม `define` injection)
- `frontend/src/lib/version.ts` (ใหม่ — single read point; ตาม convention
  kebab-case แบนใน `frontend/src/lib/`)
- `frontend/src/lib/version.test.ts` (ใหม่ — vitest collocated ตาม convention)
- `frontend/src/components/layout/VersionChip.tsx` (ใหม่ — Track F เท่านั้น;
  PascalCase ตาม AppShell/ModuleDock)
- `frontend/src/components/layout/AppShell.tsx` (มีอยู่ — **จุด wire เดียว**
  ของ chip; Track F เท่านั้น; ห้ามแตะส่วนอื่นของ shell)
- `frontend/tests/e2e/env-app-version-001.spec.ts` (ใหม่ — chip + truth states)
- `scripts/check_release_version.py` (ใหม่ — consistency check; ไม่แก้ CI)
- `scripts/test_check_release_version.py` (ใหม่ — ตาม convention `test_*.py`)
- `CHANGELOG.md` (ใหม่ — repo root; ไทย, ผู้ใช้, พ.ศ.)
- `README.md` (มีอยู่ — refresh ตาม deliverable B)
- `docs/work-orders/ENV-APP-VERSION-001.md` (WO นี้)
- `docs/ai/handoffs/ENV-APP-VERSION-001-GLM.md` (append checkpoints + ใบเสร็จ
  D1 verbatim)
- `docs/ai/CURRENT-WORK.md` (เฉพาะ transition ถัดไปที่รีวิวแล้ว)

## Forbidden (ห้ามแตะ)

ทุก feature page/component นอกจากจุด wire เดียวใน AppShell + ไฟล์ chip ใหม่;
`frontend/src/pages/**`; `frontend/src/components/**` อื่น ๆ ทั้งหมด;
`supabase/**`; `db/**`; CI workflow files (ห้ามแก้ `.github/**` โดยดีฟอลต์ —
เว้นแต่ D1 บังคับจริง และต้องผ่าน repair-round พร้อม justification เท่านั้น);
`.env`; `data/**`; `docs/ai/ROADMAP.md`; `docs/ai/HANDOFF.md`; `AGENTS.md`;
`docs/ai/design/**`; ทุกไฟล์ที่ไม่อยู่ใน claimed list

## ข้อจำกัดความจริง (truth constraints)

- chip แสดงเลขเวอร์ชันจาก build injection เท่านั้น — dev/unbuilt fallback
  ต้องสื่อสารสถานะจริง (เช่น DEV/unset) **ห้ามปลอมเลข release มาแทน**
- สรุป release ล่าสุดที่ chip แตะแล้วแสดง ต้องมาจากข้อมูลที่ build รู้จริง
  (เช่น CHANGELOG bundled ณ build time) — ห้ามอ้าง release ที่ยังไม่เกิด,
  unknown ≠ 0, ห้ามแทนค่าที่ไม่รู้ด้วยค่าปกติ
- วันที่ user-facing ใน CHANGELOG/README เป็น พ.ศ. (ค.ศ. + 543)
- ไม่มี PHI; ไม่มี write จริงใน tests

## ขั้นตอน (D-plan) — ดูหมวด Execution routing ด้านบน

## การยอมรับ (Acceptance)

- แอปที่ build แล้วแสดงเลขเวอร์ชันจริงจาก `frontend/package.json` ผ่าน
  injection ที่ Vite define — grep ยืนยันไม่มี hardcoded เวอร์ชันที่สอง
- chip แตะได้ (target ≥44px, keyboard ถึงได้) → สรุป release ล่าสุดแสดงถูก
  truth states; reduced-motion/mobile 360/390/430 ไม่พัง
- `CHANGELOG.md` มี entry แรก (ภาษาไทย ผู้ใช้ พ.ศ.) เท่ากับ release ที่แท็ก
- สคริปต์ `scripts/check_release_version.py` ตรวจความสอดคล้อง
  package.json ↔ CHANGELOG ↔ tag ได้ และ `scripts/test_check_release_version.py`
  ผ่าน
- `README.md` ตรงความจริง: URL + auth + รายการหน้าตรง `App.tsx` + tech stack
  + หมวด versioning; คงหมายเหตุ A-Wiki/data raw/secrets/Python scripts;
  ไม่เหลือถ้อยคำ P10.x ล้าสมัย; สไตล์ภาษาอังกฤษเดิม
- Battery D4 ทุกประตูเขียวที่ head ที่ freeze; ไม่มีไฟล์ forbidden ถูกแตะ;
  ทดสอบเดิมทั้งหมดไม่ถูกทำให้เสีย

## Review plan

Claim transition (PR นี้) = รีวิวอิสระ exact-SHA (R2 floor: fresh-GLM;
cross-model R3 ที่ admission เอื้อ — Terra eligible, Astra ห้าม).
Implementation PR = fresh-GLM independent review (Terra eligible เป็น
cross-model reviewer ตาม precedent DT-VIS-P003/N2/P002) ที่ exact frozen head
พร้อม battery rerun อิสระเมื่อทำได้. Implementing lane ไม่เคย merge PR ของตัวเอง —
หยุดที่ REVIEW_REQUESTED; merge เป็นของผู้รีวิวที่ได้รับมอบอำนาจเท่านั้น
Release แรก (tag + CHANGELOG entry) เกิดหลัง merge เท่านั้น
