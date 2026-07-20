# WO-E2E-2: prod-profile URL handling — basename-aware goto + href matchers
Status: done (2026-07-20, zcode) — commit pending
Lane/files: `frontend/tests/e2e/fixtures.ts` (new), `frontend/tests/e2e/*.spec.ts` (import swap + href matchers), `frontend/playwright.config.ts` (baseURL normalize 1 บรรทัด)
Branch: main
Model tier: **cheap-ok** (สูตร verbatim ครบ — GLM execute ได้เลย)

## บริบท

e2e.yml รันเทสต์กับ prod URL (`E2E_BASE_URL=https://aase7en.github.io/env-wastewater-webapp/`)
แต่**ไม่เคยรันสำเร็จมาก่อนเลย** (npm ci แดงตลอดประวัติ — แก้ใน CI-1 `69aa8dd`).
พอ CI-1 ปลดบล็อก run แรก (29694290054 @ F8) ก็เผยบั๊ก harness ที่ซ่อนอยู่:

1. **goto ทิ้ง subpath**: ทุก spec ใช้ `page.goto("/form")` — Playwright resolve
   absolute-path กับ ORIGIN ไม่ใช่ path ของ baseURL → ยิงไป
   `https://aase7en.github.io/form` (นอก project site = GitHub 404 จริง ไม่มี
   SPA redirect ของเรา) → auth.spec ล้ม 6 เทสต์. Local ไม่เจอเพราะ
   `localhost:5173` เสิร์ฟแอปที่ origin-root พอดี.
2. **href-exact matchers**: `nav a[href="/water-supply"]` (modules.spec/F8) —
   บน prod react-router (basename `/env-wastewater-webapp/`) render href เป็น
   `/env-wastewater-webapp/water-supply` → ไม่ match (ยังไม่ทันล้มเพราะ
   auth.spec ล้มก่อน).

**บั๊กเป็นของ test harness ล้วน — แอปบน prod ทำงานถูกต้อง** (Fable5 ตรวจ
bundle/fonts/nav บน prod แล้วใน review #5).

## Steps (verbatim)

1. สร้าง `frontend/tests/e2e/fixtures.ts`:
```ts
import { test as base, expect } from "@playwright/test";

/**
 * E2E-2: baseURL-aware navigation. Playwright resolves goto("/x") against
 * the ORIGIN, dropping any subpath in baseURL (GitHub Pages serves the app
 * under /env-wastewater-webapp/). Rewriting "/x" -> "./x" resolves relative
 * to the baseURL directory instead, so specs keep writing app-root paths.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page);
    page.goto = (url, options) =>
      goto(typeof url === "string" && url.startsWith("/") ? "." + url : url, options);
    await use(page);
  },
});
export { expect };
```
2. ทุกไฟล์ `frontend/tests/e2e/*.spec.ts` (auth, pfd, smoke, modules):
   `import { test, expect } from "@playwright/test";`
   → `import { test, expect } from "./fixtures";`
3. modules.spec.ts href matchers → ends-with:
   - `nav a[href="${href}"]` → `nav a[href$="${href}"]` (ทั้งลูป expectedNav
     และลูป admin `toHaveCount(0)`)
   - ตัด `"/"` ออกจาก expectedNav (root href บน prod = basename dir ลงท้าย
     "/" ทำให้ ends-with match มั่ว; label "ภาพรวม" ถูก assert ใน smoke แล้ว)
4. `frontend/playwright.config.ts`: normalize baseURL ให้ลงท้าย "/" เสมอ
   (`baseURL.endsWith("/") ? baseURL : baseURL + "/"`) — กัน user ตั้ง
   E2E_BASE_URL ไม่มี trailing slash แล้ว "./x" resolve ผิดชั้น
5. Verify: `npx playwright test` local ผ่านครบ →
   `E2E_BASE_URL=https://aase7en.github.io/env-wastewater-webapp/ npm run e2e:prod`
   ผ่านจากเครื่อง หรือ push แล้วดู e2e.yml run เขียว

## Forbidden
- ห้ามแตะ app code / RequireAuth / AuthProvider (แอปไม่ผิด — harness ผิด)
- ห้ามแก้ `.github/workflows/e2e.yml` (CI-1 จัด Node แล้ว; E2E_BASE_URL ถูกอยู่แล้ว)
- ห้ามลด coverage (ห้ามลบ/skip เทสต์เพื่อให้เขียว)

## Checkpoint log
- [2026-07-20] fable5: เขียน WO หลัง diagnose run 29694290054 (รายละเอียดใน
  handoff review #6). Root cause = URL resolution ไม่ใช่ flakiness/race.
- [2026-07-20] zcode (GLM): execute ตาม Steps 1-4 — `frontend/tests/e2e/
  fixtures.ts` ใหม่ (page.goto rewrite "/x" → "./x"), 4 spec files swap
  import จาก `@playwright/test` → `./fixtures`, modules.spec.ts href
  matchers `href=` → `href$=` (ends-with) + ตัด "/" ออกจาก expectedNav
  (basename dir ลงท้าย "/" จะ false-match), playwright.config.ts normalize
  baseURL ให้ลงท้าย "/" เสมอ. Verify: `npm run build` ✅ + Playwright
  23/23 ✅ (ทุก spec pass — auth/pfd/modules/smoke). prod CI smoke รอ push
  แล้วดู e2e.yml run เขียว.
- [2026-07-20] fable5 (verify): **Steps 1-4 ถูกต้องครบ — harness fix ทำงานจริง**
  (probe ยืนยัน goto("./form") resolve เป็น `…/env-wastewater-webapp/form` ✓)
  แต่ prod CI run 29709454444 ยังแดง 8 เทสต์ด้วยสาเหตุใหม่ที่ WO นี้ไม่ cover
  และ**เป็นบั๊กฝั่งแอป ไม่ใช่ harness**: deep link บน Pages → 404.html snippet
  stash + bounce ไป root → `main.tsx` restore ด้วย strip-and-rejoin ที่ตัด "/"
  หาย (`/env-wastewater-webappform`) → BrowserRouter ไม่ match → จอเปล่า.
  บั๊กมาจาก `fc30a4c fix(P13)` (ก่อน sweep นี้) เพิ่ง manifest เมื่อ CI-1 ทำให้
  deploy ขึ้นครั้งแรก. Fix แยกเป็น chunk **SPA-1** (main.tsx restore verbatim).
  Diagnosis เดิมของ WO ("แอปบน prod ปกติ") จึงแคบไป — ปกติเฉพาะ root/asset
  ไม่รวม deep link. E2E-2 เอง = **done ยืนยันแล้ว**; acceptance "e2e.yml เขียว"
  ย้ายไปปิดที่ SPA-1.
