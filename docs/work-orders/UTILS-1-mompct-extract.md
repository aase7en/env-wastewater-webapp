# WO-UTILS-1: extract `momPct` → `lib/utils.ts` (dedupe 2 copies → 1 source of truth)
Status: done (2026-07-20, zcode) — commit pending
Lane/files: `frontend/src/lib/utils.ts` (+ `momPct`), `frontend/src/lib/carbon.ts:91-95`
(export inline → import), `frontend/src/lib/overview.ts:65-68` (drop inline → import)
Branch: main
Model tier: **cheap-ok** (pure helper refactor; behavior preserved — see Pre-mortem)

## บริบท

SCHEMA-6 (`073a65f`) introduced an inline `momPct` in `overview.ts` because
`carbon.ts:92` keeps the function module-private (not exported). Two copies
exist now — but they DIFFER in rounding:

| File | Logic | Rounding |
|---|---|---|
| `carbon.ts:92` | `((curr - prev) / prev) * 100` | none (raw float) |
| `overview.ts:65` | `Math.round(((curr - prev) / prev) * 1000) / 10` | 1 decimal |

**Displayed output is identical** because both pages wrap with `fmt(…, 1)`
which rounds at render time:
- `CarbonPage.tsx:137`: `{fmt(latest.mom_change_pct, 1)}%`
- `OverviewPage.tsx:93`: `{fmt(carbon.latest.mom_change_pct, 1)}%`

The `overview.ts` pre-rounding is therefore redundant — presentation rounding
belongs in the display layer (`fmt`), not in the calculation.

## Goal + Acceptance (define done)

1. `lib/utils.ts` exports a single `momPct(curr, prev)`:
   ```ts
   /** Month-over-month % change. null when prev is 0/missing (no baseline).
    *  Returns the raw float — callers round at display time via fmt(…, digits). */
   export function momPct(curr: number, prev: number | null | undefined): number | null {
     if (prev === null || prev === undefined || prev === 0) return null;
     return ((curr - prev) / prev) * 100;
   }
   ```
2. `carbon.ts:92` — delete the inline `momPct` function, add `import { momPct } from "./utils";`
3. `overview.ts:65-68` — delete the inline `momPct` function + drop pre-rounding (callers
   use `fmt(…, 1)`), add `import { momPct } from "./utils";`
4. **Behavior preserved**: CarbonPage + OverviewPage chips render identically
   (both display `fmt(mom_change_pct, 1)`)
5. `npm run build` ✅ · Playwright 23/23 ✅

## Pre-mortem (what if this is wrong?)

**Hypothesis: "two copies differ → must be intentional"** — Disproof:
grep all callsites (below). Both pages apply `fmt(…, 1)` at render. The
`overview.ts` pre-rounding has no functional effect (double rounding to 1
decimal is idempotent for display purposes). Verdict: carbon.ts (unrounded)
is the canonical shape; rounding is presentation.

**Counter-argument**: "What if someone reads `mom_change_pct` directly
without `fmt`?" → No such callsite exists (grep confirms only CarbonPage
+ OverviewPage use it, both via `fmt`). Adding `fmt` at the read site
would be a presentation fix, not a calc concern.

**Edge cases preserved**:
- prev = null/undefined → null (no previous baseline)
- prev = 0 → null (avoid divide-by-zero / infinity)
- prev negative → signed percentage (carbon reduction shows as negative)
- curr = prev → 0% (no change)

## Reference pattern

- `utils.ts` already hosts `fmt`, `thaiDate`, `daysSince` — small pure
  helpers with no React deps. `momPct` fits the same shape.
- The extract-decide test (codebase-design): if we delete `momPct`, callers
  would have to inline 3 lines each → re-spreading complexity. Module earns
  its keep.

## Steps

1. **`frontend/src/lib/utils.ts`** — append after `daysSince`:
   ```ts
   /** Month-over-month % change. null when prev is 0/missing (no baseline).
    *  Returns the raw float — callers round at display time via fmt(…, digits). */
   export function momPct(curr: number, prev: number | null | undefined): number | null {
     if (prev === null || prev === undefined || prev === 0) return null;
     return ((curr - prev) / prev) * 100;
   }
   ```

2. **`frontend/src/lib/carbon.ts:91-95`** — delete inline + add import:
   - Remove:
     ```ts
     /** Compute month-over-month % change. Returns null if previous is 0/missing. */
     function momPct(curr: number, prev: number | null | undefined): number | null {
       if (prev === null || prev === undefined || prev === 0) return null;
       return ((curr - prev) / prev) * 100;
     }
     ```
   - Add to top imports (after `import { supabase } from "./supabase";`):
     ```ts
     import { momPct } from "./utils";
     ```

3. **`frontend/src/lib/overview.ts:65-68`** — delete inline + import + drop
   pre-rounding in `toCarbonMonths`:
   - Remove:
     ```ts
     function momPct(curr: number, prev: number | null): number | null {
       if (prev == null || prev === 0) return null;
       return Math.round(((curr - prev) / prev) * 1000) / 10;
     }
     ```
   - Update import line at top:
     ```ts
     // before:
     // import { fetchLatestReadingDate, fetchOverviewCarbon, type OverviewCarbonRow } from "./supabase-queries";
     // after:
     import { fetchLatestReadingDate, fetchOverviewCarbon, type OverviewCarbonRow } from "./supabase-queries";
     import { momPct } from "./utils";
     ```
   - In `toCarbonMonths` keep the `momPct(r.tco2e, prev)` call as-is — the
     inline copy already returned a number, the utils version does too.
     Display behavior unchanged because both callers use `fmt(…, 1)`.

4. Verify → commit → push → set done

## Forbidden

- ห้ามเปลี่ยน signature (callers ใช้ `momPct(curr, prev)` เหมือนเดิม)
- ห้ามเปลี่ยน return type (`number | null` เหมือนเดิม)
- ห้ามเพิ่ม rounding param — rounding เป็น presentation concern ของ `fmt`
- ห้ามแตะ className/colors
- ห้ามแตะ CarbonPage.tsx / OverviewPage.tsx (consumer ไม่ต้องแก้ — fmt อยู่แล้ว)

## Verify commands

```bash
cd frontend && npm run build          # typecheck (TS จับถ้า import ผิด)
cd frontend && npx playwright test    # 23/23 — both pages ยัง render chips ปกติ
# Manual visual check (optional): dev server → / และ /carbon → chip MoM% ยัง
# แสดง 1 decimal เหมือนเดิม (12.3% ไม่ใช่ 12.345%)
```

## Checkpoint log (append-only)

- [2026-07-20] zcode (GLM): เขียน WO จาก SCHEMA-6 nit. Discovered 2 copies
  differ in rounding — disproof confirms both display identically via
  fmt(…, 1) wrap, so carbon.ts (unrounded) is canonical. รอ execute.
- [2026-07-20] zcode (GLM): execute ตาม Steps 1-3 — `momPct` moved to
  `lib/utils.ts`, `carbon.ts` import + delete inline, `overview.ts`
  import + delete inline + drop pre-rounding. Verify: `npm run build` ✅ ·
  Playwright 23/23 ✅. Display behavior preserved (both CarbonPage +
  OverviewPage chips use fmt(…, 1) — idempotent double-rounding).
