# WO — Import Aura design system from claude.ai/design project

> **Tier**: Track F (Fable5/Claude — NOT GLM)
> **Status**: open — awaiting Fable5/Claude with claude_design MCP access
> **Source**: https://claude.ai/design/p/82063a26-c14f-4581-b891-e3f7f750909d
> **Auth**: claude_design MCP (https://api.anthropic.com/v1/design/mcp, auth via /design-login)
> **Created by**: GLM Track Z (handoff only — GLM ห้ามแตะ className/colors/fonts per two-track)

## ทำไม GLM ส่งต่อไม่ทำเอง

งานนี้ = Track F ทั้งหมด (className, colors, fonts, layout, tokens, index.css,
tailwind.config, frontend/public/). ตาม two-track protocol (handoff §"Track F
scope" บรรทัด 31 + 94): **GLM ห้ามแตะ className/colors/fonts** — เป็นของ
Fable5/Sonnet/Claude. ถ้า GLM ทำ → Fable5 review discard + rewrite.

เพิ่มเติม: GLM ไม่มี claude_design MCP access (เป็น Anthropic auth, ไม่ใช่
ZCode env). ต้องเป็น Claude (Anthropic) ที่ login ผ่าน /design-login แล้วถึง
import project นี้ได้.

## Scope — อะไร Track F บ้าง (จาก design project)

Design project มี assets + tokens + components ทั้งหมดที่ต้อง migrate:

### Assets (binary — copy ตรง)
- `assets/favicon-aura.png` → frontend/public/ (replace existing 64px?)
- `assets/logo-aura.png` → frontend/public/
- `assets/fonts/ibm-plex-thai-{400,500,600,700}-{latin,thai}.woff2` (12 files)
  → frontend/public/fonts/ — **IBM Plex Thai** คือ font หลักใหม่ (เปลี่ยนจาก
  font-thai ปัจจุบัน)
- `assets/fonts/jetbrains-mono-400-latin.woff2` → frontend/public/fonts/ (mono)
- `assets/fonts/plus-jakarta-400-latin.woff2` → frontend/public/fonts/
- `assets/fonts/material-symbols-outlined-subset.woff2` → frontend/public/
  (replace existing subset — **อาจ icon set ต่างจากที่มี ต้อง regen msymbol-icon-names.txt**)
- `assets/fonts/msymbol-icon-names.txt` → frontend/scripts/ (replace)

### Design tokens (CSS — Track F)
- `tokens/aura.css` → @theme / CSS custom properties (aura-* tokens)
- `tokens/colors.css` → color palette (surfaces/accents/status/flow)
- `tokens/fonts.css` → @font-face declarations + font-family tokens
- `tokens/motion.css` → animation/transition tokens
- `tokens/spacing.css` → spacing scale
- `tokens/typography.css` → type scale (display/body/mono)
- `styles.css` → global stylesheet (มัดรวม tokens)

→ เป้าหมาย: อัปเดต `frontend/src/index.css` + `tailwind.config` ให้สอดคล้อง.
**ระวัง**: tokens ปัจจุบัน (aura-textMain, aura-cyan, ฯลฯ) ถูกใช้ในทุก component
— เปลี่ยนต้องไม่ break className เดิม (rename หรือ alias).

### Components (Track F — className/markup)
Design มี reference impl สำหรับทุก component (jsx + .d.ts + .prompt.md):
- **UI core**: AuraCard, Button, Input, MSymbol, Skeleton, Toggle, Toast
- **UI forms**: Input, Toggle
- **UI feedback**: Toast, EmptyState, Chip, TypeCycle
- **Data**: CountUp, KpiTile
- **Layout**: AppShell (sidebar + top bar structure)
- **PFD**: ProcessFlowDiagram, AerationTank, Gauge, StatusBadge
- **Accordion**: AccordionSection

→ เป้าหมาย: อัปเดต `frontend/src/components/{ui,pfd,data,layout}/` ให้ตรง
design (className + structure). **ห้ามแตะ logic (.ts logic files)** — Track Z.

### Guidelines (reference ไม่ใช่ code)
- `guidelines/brand-*.html` — brand wordmark/logo usage
- `guidelines/colors-*.html` — color system (surfaces/accents/status/flow)
- `guidelines/elevation.html`, `motion.html`, `radius.html`, `spacing.html`
- `guidelines/type-*.html` — typography (display/body/mono)
- `guidelines/iconography.html`, `gradient-text.html`

→ อ่านก่อนเริ่มเพื่อเข้าใจ design intent (ไม่ต้อง commit)

### Templates (full-page reference)
- `templates/env-dashboard/` — full dashboard layout
- `templates/env-page/` — generic page layout
- `ui_kits/env-app/` — **complete React app reference** (App.jsx,
  DailyFormScreen, OverviewScreen, ReadingsScreen, WaterDashboardScreen)

→ ใช้เป็น "golden reference" เปรียบเทียบกับ `frontend/src/pages/*` ปัจจุบัน

## Approach (suggest to Fable5/Claude)

1. **Import ผ่าน claude_design MCP** (auth via /design-login ก่อน)
2. **เริ่มจาก tokens** (foundation): copy fonts → tokens → index.css → tailwind
   config. ทดสอบ build หลัง foundation — ถ้า className เดิม break = alias ก่อน
3. **Components ทีละตัว**: เริ่มจาก AuraCard (ใช้เยอะสุด) → Button → Input →
   ที่เหลือ. แต่ละตัว: diff className ปัจจุบัน vs design reference → อัปเดต
4. **AppShell**: structure อาจเปลี่ยน (top bar + sidebar layout) — ระวัง
   PendingUsersBell + NotificationBell mount points (เพิ่งเพิ่ม AUTH-7.5)
5. **Pages**: ใช้ ui_kits/env-app/* เป็น reference อัปเดต layout แต่ละหน้า

## Constraints (ระวัง — อย่า break)

- **PHI boundary**: ห้าม route ข้อมูลผ่าน cloud model
- **Two-track**: className/colors/fonts = คุณ (Track F). logic/SQL/lib = GLM
  (Track Z). ถ้า design ต้องการ prop ใหม่ที่ logic ยังไม่มี → ส่งต่อ GLM
- **Auth chain ล่าสุด**: AUTH-3→7 แก้ login ไว้ — อย่า break flow (AppShell
  mount, RequireAuth gates)
- **PendingUsersBell** (`b948b10`): เพิ่งเพิ่ม — อย่าลบ/ย้ายทำให้หาย
- **PWA** (`4b6c6ea`): icon/manifest เพิ่งแก้ — อย่าเขียนทับ
- **วันที่ = พ.ศ.** เสมอ
- **ห้าม git reset --hard** (rule 6)
- **claim chunk** ใน MIGRATION.md In-progress ก่อนเริ่ม

## Verify

- build ✅ · Vitest (full) · Playwright (full — smoke/auth/pfd/bell specs)
- ภาพ: dev server → เทียบ design reference ทุก page
- font: IBM Plex Thai โหลด + render ถูก (ไม่ fallback)
- icon: material-symbols subset ใหม่ไม่หาย icon ที่ใช้ (grep msymbol names)
- PWA install ยังทำงาน (icon ใหม่ถูก manifest อ้างถูก)

## Open question (for user)

แบ่งเป็น sub-chunks หรือทำครั้งเดียว? Design project ใหญ่ (tokens + 15+
components + หลาย page). แนะนำแบ่ง:
1. **Foundation**: tokens + fonts + index.css + tailwind config (1 chunk)
2. **UI components**: AuraCard/Button/Input/ฯลฯ (1 chunk)
3. **Layout**: AppShell + pages (1 chunk หรือแยกตาม page)

## GLM Track Z backlog หลังนี้

หลัง Fable5/Claude land foundation (tokens) ผมจะ:
- เพิ่ม props/logic ที่ design ต้องการ แต่ className เป็นของ Track F
- ทดสอบ regression (auth chain ไม่ break)
- audit Fable5/Claude work เมื่อส่งกลับ
