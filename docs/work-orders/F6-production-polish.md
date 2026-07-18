# WO-F6: Production polish — fonts/logo/bundle
Status: open
Lane/files: `frontend/public/*`, `frontend/src/index.css`, `frontend/index.html`,
`frontend/src/App.tsx` (เฉพาะ lazy imports), จุด import ของ `lib/pdf.ts`
(`pages/ReportsPage.tsx`, `components/repair/RepairRequestModal.tsx`)
Branch: main
Model tier: **mid** (opus4.8 — หลายไฟล์แต่ทุกขั้นเป็นสูตร)

## Goal + Acceptance
1. **Self-host fonts** (โรงพยาบาลเน็ตช้า/อาจบล็อก googleapis):
   - ดาวน์โหลด woff2: Plus Jakarta Sans (400,500,600,700,800 latin), IBM Plex Sans
     Thai (400,500,600,700 thai+latin), JetBrains Mono (400,500 latin), Material
     Symbols Outlined (variable, subset ได้) → วางใน `frontend/public/fonts/`
   - แหล่ง: google-webfonts-helper (gwfh.mranftl.com) หรือ fonts.google.com
     download — ถ้า network โหลดไม่ได้ใน session: หยุด, บันทึก checkpoint ให้
     user โหลดเอง (ห้าม commit ไฟล์ font เปล่า/เสีย)
   - แทน 2 บรรทัด `@import url(...)` บนสุดของ `src/index.css` ด้วยบล็อก
     `@font-face` (font-display: swap; Material Symbols ใช้ font-display: block)
     ชี้ `/fonts/<file>.woff2`
2. **React.lazy หน้าหนัก chart**: ใน `App.tsx` เปลี่ยน import ตรงของ `TrendsPage`,
   `CarbonPage`, `CarbonRollupPage` เป็น `lazy(() => import(...))` + ห่อ route ด้วย
   `<Suspense fallback=...>` — **copy pattern DBAConsolePage ที่มีอยู่แล้วในไฟล์
   เดียวกันเป๊ะ ๆ** (บรรทัด lazy + Suspense fallback ภาษาไทย)
3. **Dynamic-import PDF**: ใน 2 ไฟล์ที่ import `lib/pdf.ts` แบบ static — เปลี่ยนเป็น
   `const { generateX, downloadPDF } = await import("../lib/pdf")` ภายใน handler
   ที่กดพิมพ์เท่านั้น (ลบ import บนหัวไฟล์)
4. **favicon.ico**: สร้างจาก `public/favicon-aura.png` (64px) — ใช้เครื่องมือที่มีจริง
   ในเครื่อง; ถ้าไม่มีตัวแปลง ico ให้ข้ามข้อนี้ + บันทึก checkpoint (link PNG ที่มีอยู่ใช้ได้)
5. เป้า: main chunk (index-*.js) **< 600KB** minified (ตอนนี้ ~1.34MB — recharts +
   jspdf + html2canvas คือก้อนใหญ่); **visual ห้ามเปลี่ยนแม้แต่พิกเซลเดียว**

## Forbidden
ห้ามแก้ component/page อื่นนอกรายการ Lane, ห้ามเปลี่ยน token/สี/ธีม, ห้ามลบ
ฟีเจอร์, ห้ามเพิ่ม dependency ใหม่ (ยกเว้นไม่มีจริง ๆ — บันทึกเหตุผลใน checkpoint),
ห้ามแตะ vite.config base/proxy

## Verify commands
```
cd frontend
npm run build            # ดูตาราง chunk ท้าย build: index-*.js < 600KB
npx playwright test      # 8 passed
```
บวก: เปิด dev server + devtools Network → block domain `fonts.googleapis.com` +
`fonts.gstatic.com` → reload → ฟอนต์ไทย/icon ยัง render ถูก (ไม่เป็น Tahoma/☐);
กดพิมพ์ PDF จาก Reports ยังได้ (โหลด chunk pdf ตอนกด)

## Checkpoint log
