# WO-SKEL-1: Skeleton Screen + Shimmer — ซ่อม sweep ที่พัง + ขยาย Core 4 หน้า/infra
Status: open
Lane/files: `frontend/src/index.css` (+`.skeleton` block), `frontend/src/styles/tokens.css` (+`--skeleton-sheen` ×2 + reduced-motion), `frontend/src/components/ui/Skeleton.tsx` (rewrite เต็มไฟล์), `frontend/src/pages/DashboardPage.tsx`, `frontend/src/pages/OverviewPage.tsx`, `frontend/src/components/RequireAuth.tsx`, `frontend/src/App.tsx`, `frontend/tests/e2e/skeleton.spec.ts` (new)
Branch: main
Model tier: **cheap-ok** (สูตร verbatim ครบ — GLM execute ได้; Fable5 visual polish ปิดท้ายเป็นรอบแยก)

> อนุมัติจาก user 2026-07-20 (grill 4 ข้อ): scope Core 4 หน้า + infra · โทนเทา neutral ·
> Hybrid WO→GLM + Fable5 polish · done criteria = zero-CLS + reduced-motion +
> anti-flash 200ms + e2e assertion. แผนเต็ม: Fable5 plan file (session 2026-07-20).

## บริบท (ทำไม "ซ่อม" ไม่ใช่ "สร้างใหม่")

`Skeleton.tsx` มีอยู่แล้ว 3 variants ใช้ใน 4 หน้า (ReadingsList/Carbon/Trends/
Equipment) แต่:

1. **Shimmer ไม่เคยวิ่ง**: `animate-[flow_1.5s_linear_infinite]` อ้าง keyframe
   `flow` (tailwind.config.js) ซึ่ง animate `strokeDashoffset` — property SVG
   ที่ inert บน div → เหลือแค่ `animate-pulse`
2. **Gradient hardcode สี dark theme** (`rgba(20,46,51,…)`) + tint cyan
   (`rgba(0,240,255,0.08)`) → ผิดใน light theme + ขัดโทน neutral ที่ user เลือก
3. **prefers-reduced-motion ไม่ครอบ skeleton** — ขัด ui-brief rule 6 ("stops all")
4. Dashboard/Overview/RequireAuth/Suspense ×5 ยังเป็น text "กำลังโหลด…" / spinner

## Steps (verbatim)

### 1. `frontend/src/styles/tokens.css` — เพิ่ม sheen token 2 theme + ขยาย reduced-motion

1a. ใน `:root` — แทรกหลังบรรทัด `--aura-placeholder: #6b7a75;` (ก่อน `color-scheme: light;`):

```css
  --skeleton-sheen: rgba(255, 255, 255, 0.65); /* SKEL-1: shimmer highlight (neutral) */
```

1b. ใน `.dark` — แทรกหลังบรรทัด `--aura-placeholder: #6B7A75;` (ก่อน `color-scheme: dark;`):

```css
  --skeleton-sheen: rgba(255, 255, 255, 0.06); /* SKEL-1: shimmer highlight (neutral) */
```

1c. ขยาย block ท้ายไฟล์ (บรรทัด 111-118) — แทนที่ทั้ง block ด้วย:

```css
@media (prefers-reduced-motion: reduce) {
  .aura-card::before,
  .aura-pulse-dot,
  .pfd-flow-line,
  .bubble {
    animation: none !important;
  }
  /* SKEL-1: skeleton freezes to a plain grey box — no sweep, no delayed appear. */
  .skeleton { animation: none !important; opacity: 1 !important; }
  .skeleton::after { animation: none !important; }
}
```

### 2. `frontend/src/index.css` — เพิ่ม `.skeleton` core (แทรก**หลัง** rule `.status-glow-red { … }` ปิด block แล้ว, ก่อน section ถัดไป)

```css
/* ── SKEL-1: skeleton shimmer ─────────────────────────────────────────────
 * Neutral grey box + light sweep (MUI-wave pattern: transform on ::after —
 * GPU-friendly, no background-size math). Dual-theme via tokens.
 * Anti-flash: the box stays invisible for the first 200ms, so fetches that
 * resolve faster never flash a skeleton. Reduced-motion freeze lives in
 * tokens.css next to the other motion kill-switches. */
.skeleton {
  position: relative;
  overflow: hidden;
  background: rgb(var(--aura-surface-high) / 0.55);
  opacity: 0;
  animation: skeleton-appear 0s linear 200ms forwards;
}
.skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, var(--skeleton-sheen), transparent);
  animation: skeleton-sweep 1.6s linear 0.2s infinite;
}
@keyframes skeleton-appear { to { opacity: 1; } }
@keyframes skeleton-sweep { 100% { transform: translateX(100%); } }
```

### 3. `frontend/src/components/ui/Skeleton.tsx` — แทนทั้งไฟล์ด้วย:

```tsx
import { cn } from "../../lib/utils";

/**
 * Skeleton placeholders (SKEL-1). Motion + colors live in the `.skeleton`
 * class (index.css) + `--skeleton-sheen` token (tokens.css) — neutral grey
 * box with a light sweep, dual-theme, frozen under prefers-reduced-motion,
 * invisible for the first 200ms (anti-flash). `data-skeleton` is the e2e
 * hook (tests/e2e/skeleton.spec.ts) — keep it on the primitive only.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div data-skeleton aria-hidden="true" className={cn("skeleton rounded-lg", className)} />;
}

/** Table row skeleton — N rows matching the readings list columns. */
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={cn("h-6", j === 0 ? "flex-[2]" : "flex-1")} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Card grid skeleton — for KPI tiles. */
export function CardGridSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: cards }).map((_, i) => (
        <Skeleton key={i} className="h-20 aura-card p-4" />
      ))}
    </div>
  );
}

/** Full-page placeholder (SKEL-1) — header line + KPI tiles + content block.
 * Used by RequireAuth while the auth/appUser check settles and as the
 * Suspense fallback for lazy routes. */
export function PageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Skeleton className="h-8 w-64" />
      <CardGridSkeleton cards={4} />
      <Skeleton className="h-72" />
    </div>
  );
}
```

### 4. `frontend/src/pages/DashboardPage.tsx` — 2 แก้

4a. เพิ่ม import (รวมกับ import ui เดิม):

```ts
import { CardGridSkeleton } from "../components/ui/Skeleton";
```

4b. บรรทัด 79 — แทน:

```tsx
      {loading && <div className="text-aura-textMuted font-thai">กำลังโหลด…</div>}
```

ด้วย:

```tsx
      {loading && <CardGridSkeleton cards={4} />}
```

(KPI grid จริงถูก gate ด้วย `!loading` อยู่แล้ว → สลับพอดีตัว; PFD + ตาราง
14 วัน มี empty-state ของตัวเอง — **ห้ามแตะ**)

### 5. `frontend/src/pages/OverviewPage.tsx` — 4 แก้

5a. เพิ่ม import:

```ts
import { Skeleton } from "../components/ui/Skeleton";
```

5b. บรรทัด 19-25 — ตัด loading arm ออกจาก waterChip (สถานะ loading จะ render
skeleton ที่ callsite แทน — ข้อ 5c):

```tsx
  const waterChip =
    water.status === false || water.anyAlert
      ? { label: "ผิดปกติ", cls: "text-alert-red border-alert-red/50 bg-alert-red/10" }
      : water.status === true
        ? { label: "ปกติ", cls: "text-alert-green border-alert-green/50 bg-alert-green/10" }
        : { label: "ยังไม่บันทึกวันนี้", cls: "text-aura-textMuted border-aura-borderSubtle" };
```

5c. Water card — prop `chip` (บรรทัด ~47) แทนด้วย:

```tsx
          chip={
            water.loading ? (
              <Skeleton className="h-6 w-24 rounded-full shrink-0" />
            ) : (
              <Chip className={waterChip.cls}>{waterChip.label}</Chip>
            )
          }
```

5d. Energy card — แทน `<Metric value={energy.loading ? "…" : …} … />` (บรรทัด ~71-75) ด้วย:

```tsx
          {energy.loading ? (
            <div className="space-y-1.5">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-3 w-24" />
            </div>
          ) : (
            <Metric value={fmt(energy.latest?.kwh_total, 0)} unit="kWh" caption="เดือนล่าสุด" />
          )}
```

5e. Carbon card — แทน `<Metric value={carbon.loading ? "…" : …} … />` (บรรทัด ~99-103) ด้วย:

```tsx
          {carbon.loading ? (
            <div className="space-y-1.5">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-3 w-24" />
            </div>
          ) : (
            <Metric value={fmt(carbon.latest?.tco2e, 4)} unit="tCO₂e" caption="เดือนล่าสุด" />
          )}
```

(ขนาด h-9/h-3 ประมาณจาก Metric จริง: value = text-3xl ≈ 36px, caption =
text-[11px] — Fable5 จูนเที่ยงตรงในรอบ polish)

### 6. `frontend/src/components/RequireAuth.tsx` — แทน loading block (บรรทัด 22-31)

เพิ่ม import:

```ts
import { PageSkeleton } from "./ui/Skeleton";
```

แทน:

```tsx
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-aura-textMuted font-thai">
          <span className="w-5 h-5 border-2 border-aura-cyan border-t-transparent rounded-full animate-spin" />
          กำลังตรวจสอบสิทธิ์…
        </div>
      </div>
    );
  }
```

ด้วย:

```tsx
  if (loading) {
    return (
      <div aria-busy="true">
        <span className="sr-only">กำลังตรวจสอบสิทธิ์…</span>
        <PageSkeleton />
      </div>
    );
  }
```

### 7. `frontend/src/App.tsx` — Suspense fallbacks ×5

เพิ่ม import:

```ts
import { PageSkeleton } from "./components/ui/Skeleton";
```

แทน `fallback={<div className="p-8 text-center font-thai text-aura-textMuted">กำลังโหลด…(ข้อความใด ๆ)…</div>}`
ทั้ง 5 จุด (บรรทัด ~109 Trends, ~119 Carbon, ~143 CarbonRollup, ~149 DBAConsole,
~159 AIAdmin) ด้วย:

```tsx
fallback={<PageSkeleton />}
```

### 8. `frontend/tests/e2e/skeleton.spec.ts` — ไฟล์ใหม่ทั้งไฟล์:

```ts
import { test, expect } from "./fixtures";

/**
 * SKEL-1: skeleton loading states.
 * The 14-day query is mocked with a delayed response so the skeleton window
 * is deterministic — a fast real DB (<200ms) would resolve before the
 * anti-flash delay ever reveals the skeleton.
 */
test("dashboard shows skeleton tiles while the 14-day query is in flight, then swaps to content", async ({ page }) => {
  await page.route("**/rest/v1/v_dashboard_14day*", async (route) => {
    await new Promise((r) => setTimeout(r, 900));
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.goto("/dashboard");
  await expect(page.locator("[data-skeleton]").first()).toBeVisible();
  await expect(page.locator("[data-skeleton]")).toHaveCount(0, { timeout: 10_000 });
});

test("reduced-motion: skeleton sweep is disabled", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/rest/v1/v_dashboard_14day*", async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.goto("/dashboard");
  const sk = page.locator("[data-skeleton]").first();
  await expect(sk).toBeVisible();
  const anim = await sk.evaluate((el) => getComputedStyle(el, "::after").animationName);
  expect(anim).toBe("none");
});
```

## Verify commands (ทุกข้อผ่านก่อน push)

1. `npm run build` ✅
2. `npx playwright test` → **25 passed** (23 เดิม + 2 ใหม่) — ห้ามมีตัวเดิมแดง
3. grep กัน pattern เก่า: `animate-\[flow` ต้องเหลือ 0 hit ใน `frontend/src/components/ui/Skeleton.tsx`
4. push → deploy-frontend + e2e.yml (prod) ต้องเขียวทั้งคู่
5. **ยกให้ Fable5 (polish round — ห้าม GLM ทำแทน)**: screenshot ทั้ง light/dark,
   จูน sheen intensity/duration/ขนาด h-9 w-28, ตัดสินเคส `CardGridSkeleton`
   ที่ `aura-card` + `overflow-hidden` อาจ clip conic ring, ตรวจ zero-CLS ด้วยตา

## Forbidden

- ห้ามแตะหน้า ReadingsList / Carbon / Trends / Equipment (สืบทอด fix อัตโนมัติ)
- ห้ามแก้ tailwind.config.js (keyframes ใหม่อยู่ index.css เท่านั้น; ห้ามลบ `flow` — PFD ใช้อยู่)
- ห้ามแตะ className อื่นนอก diff ที่ระบุ; ห้ามลบ sr-only text ใน RequireAuth
- ห้ามเปลี่ยน semantics ของ error branches (แตะเฉพาะ loading branches)
- ห้าม commit ถ้า Verify ข้อ 1-4 ไม่ผ่าน — checkpoint ในไฟล์นี้แล้วแจ้งแทน

## Reference pattern

- CSS wave: MUI Skeleton wave variant (transform-based ::after sweep)
- Token dual-theme: `tokens.css` `--aura-*` (F1) + reduced-motion block เดิม
- e2e mock-delay: `pfd.spec.ts` ใช้ `page.route` fulfill อยู่แล้ว (F5)
- การแบ่ง GLM-execute / Fable5-polish: F6 `a04df47` + MOD-*-b `c87fc81`

## Checkpoint log

- [2026-07-20] fable5: plan อนุมัติจาก user (grill 4 ข้อ) → เขียน WO สูตร verbatim.
  Backlog ต่อ (นอก scope ใบนี้): **SKEL-2** = 8 module pages + Regulations +
  CarbonRollup + DailyForm + Attachments + PDFDesigner + AIAdmin +
  NotificationBell (copy pattern เดิม, cheap-ok, เปิดหลัง SKEL-1 + polish ผ่าน)
