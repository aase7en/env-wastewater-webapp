# WO-F6: Production polish — fonts/logo/bundle
Status: open
Lane/files: `frontend/public/*`, `frontend/src/index.css`, `frontend/vite.config.ts`, import sites ของ `lib/pdf.ts`/Recharts pages
Branch: track-f / main ตามผู้ทำ

## Goal + Acceptance
- Self-host fonts: ดาวน์โหลด Plus Jakarta Sans + IBM Plex Sans Thai + JetBrains Mono + Material Symbols เป็น woff2 ใน `public/fonts/` + `@font-face` แทน CDN @import (โรงพยาบาลเน็ตช้า/อาจบล็อก googleapis) — subset ไทย+latin พอ
- SVG flat logo (วาดจาก wordmark UTH[AI]-ENV — ไม่ใช่ trace รูป 3D) + `favicon.ico` multi-size
- Code-split: `jspdf`/`jspdf-autotable` → dynamic import ตอนกดพิมพ์เท่านั้น; Recharts → lazy route (React.lazy Trends/Carbon) — เป้า main chunk < 600KB (ตอนนี้ 1.34MB)
- Build ผ่าน + GH Pages deploy ยังทำงาน (path base ถูก)

## Verify
`npm run build` ดูขนาด chunk; เปิด preview ตัด network googleapis (devtools block) → ฟอนต์ยัง render; พิมพ์ PDF ยังได้

## Checkpoint log
