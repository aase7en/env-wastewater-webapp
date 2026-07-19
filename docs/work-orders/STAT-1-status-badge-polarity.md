# WO-STAT-1: แก้ StatusBadge polarity — rename prop `status` → `operating`
Status: done (2026-07-20, zcode) — commit pending
Lane/files: `frontend/src/components/pfd/StatusBadge.tsx` (interface + body),
3 callsites (`ProcessFlowDiagram.tsx`, `DashboardPage.tsx`, `ReadingsListPage.tsx`),
1 callsite กรณีพิเศษ (`EquipmentPage.tsx`),
`frontend/src/components/ui/aura.stories.tsx` (stories)
Branch: main
Model tier: **mid** (GLM/Sonnet 5 — interface refactor เล็ก แตะ 6 ไฟล์)

## บริบท — พบใน Fable5 visual tour 2026-07-19 (commit `c995ac0`)

`StatusBadge` นิยาม prop `status: true = ผิดปกติ, false = ปกติ` (**alert semantics**)
แต่ callsites ส่ง `row.system_operating` ตรง ๆ (`true = ระบบเดินปกติ`, **system
semantics**) อย่างน้อย 2 จุด — DashboardPage ตารางประวัติ 14 วัน +
ProcessFlowDiagram header → ข้อมูลจริงทุกวันที่ระบบเดินปกติขึ้นป้ายแดง "ผิดปกติ"
ขัดกับ KPI "วันผิดปกติ (14d) 0 วัน" บนหน้าเดียวกัน.

Fable5 propose: audit callsite ทั้งหมดของ StatusBadge แล้ว negate ที่ callsite
(`row.system_operating == null ? null : !row.system_operating`) หรือเปลี่ยน
prop เป็น `operating` ให้ semantic ตรง — ห้ามแก้สองที่พร้อมกัน.

GLM codebase-design verdict: **rename prop เป็น `operating`** (user approved
ใน AskUserQuestion) เพราะ:
- 3 ใน 4 callsites ใช้ system semantics (system_operating) → rename เฉย ๆ ไม่ต้อง negate
- EquipmentPage ใช้ alert semantics (open.length > 0 ? true : false) — negate 1 จุด
- **Deepening**: seam ใหม่ทำให้ caller ไม่ต้องจำ polarity ทุกครั้ง — prop ชื่อ
  `operating` บอก semantic ตรง ๆ (`operating=true` = ระบบเดิน = ปกติ)
- **ทดสอบการลบ**: ถ้าลบ StatusBadge ความซับซ้อนก็หายไป (traffic-light render
  + 3 สี) — module ยังจำเป็นอยู่; ไม่ใช่ pass-through

## Goal + Acceptance

1. `StatusBadgeProps` rename prop `status` → `operating`
2. Contract ใหม่: `operating: boolean | null | undefined` โดย
   - `null`/`undefined` = unknown → สีเทา + label "—"
   - `true` = ระบบเดินปกติ → สีเขียว + label "ปกติ"
   - `false` = ระบบผิดปกติ → สีแดง + glow + label "ผิดปกติ"
3. `label` prop ยัง override text ได้เหมือนเดิม
4. 4 callsites ทุกตัวใช้ prop ใหม่อย่างถูกต้อง:
   - PFD/Dashboard/Readings: `<StatusBadge operating={row.system_operating ?? null} />`
   - Equipment: `<StatusBadge operating={open.length === 0} label=...>` (เพราะ
     open=0 = ไม่มีแจ้งซ่อม = ปกติ = operating-true; negate เพราะ callsite นี้ใช้
     alert semantics เดิม)
5. Stories อัปเดต — rename + flip comment/expectation ให้ตรง semantic ใหม่
6. `npm run build` + `npm run lint`/typecheck ผ่าน
7. ไม่แตะ className ใด ๆ (เป็น Track F scope)

## Reference pattern

- โครง StatusBadge เดิม (เพียง flip polarity logic):
  ```ts
  const color =
    operating === null || operating === undefined
      ? "bg-slate-300 text-slate-600"
      : operating === true                          // เดิม: === false
        ? "bg-alert-green text-white"
        : "bg-alert-red text-white status-glow-red";
  const text = label ?? (operating === null ? "—" : operating ? "ปกติ" : "ผิดปกติ");
  ```
- Callsite pattern (3 system-semantic): เหมือนเดิม เปลี่ยนแค่ prop name
- Callsite pattern (EquipmentPage alert-semantic): negate ก่อนส่ง (`open.length === 0`)

## Steps

### 1. `frontend/src/components/pfd/StatusBadge.tsx` — interface + body:

```tsx
interface StatusBadgeProps {
  /** null = unknown, true = ระบบเดินปกติ, false = ผิดปกติ. */
  operating: boolean | null | undefined;
  label?: string;
}

export function StatusBadge({ operating, label }: StatusBadgeProps) {
  const color =
    operating === null || operating === undefined
      ? "bg-slate-300 text-slate-600"
      : operating === true
        ? "bg-alert-green text-white"
        : "bg-alert-red text-white status-glow-red";
  const text = label ?? (operating === null ? "—" : operating ? "ปกติ" : "ผิดปกติ");
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", color)}>
      {text}
    </span>
  );
}
```

### 2. `ProcessFlowDiagram.tsx:71` — rename prop:

```tsx
<StatusBadge operating={row.system_operating ?? null} />
```

### 3. `DashboardPage.tsx:122` — rename prop:

```tsx
<td className="px-4 py-2"><StatusBadge operating={r.system_operating ?? null} /></td>
```

### 4. `ReadingsListPage.tsx:90` — rename prop:

```tsx
<td className="px-4 py-3"><StatusBadge operating={r.system_operating ?? null} /></td>
```

### 5. `EquipmentPage.tsx:148` — negate เพราะ alert semantics:

```tsx
<StatusBadge operating={open.length === 0} label={open.length > 0 ? "มีการแจ้งซ่อม" : "ปกติ"} />
```

### 6. `aura.stories.tsx:86-91` — rename + flip docs:

```tsx
export const StatusBadges = () => (
  <div className="flex gap-2">
    <StatusBadge operating={null} />
    <StatusBadge operating={true} />
    <StatusBadge operating={false} />
  </div>
);
```
(ไม่ต้องแก้ comment ข้างใต้นั้น — เป็น stories อ่านง่ายอยู่แล้ว)

### 7. Verify → commit → push → set done + ปลด claim

## Forbidden

- ห้ามแตะ className/colors (Track F scope — `bg-alert-green` ฯลฯ คงเดิมทุกตัว)
- ห้ามสร้าง component variant ใหม่ (เช่น `<AlertBadge>`) — overkill สำหรับ 1 callsite
- ห้าม negate ที่ 3 callsite system-semantic (จะกลับด้าน polarity ที่ผิดอยู่แล้ว
  อีกครั้ง = กลับไปผิดเหมือนเดิม)
- ห้ามเปลี่ยนชื่อ StatusBadge (export name คงเดิม)
- ห้ามแตะ lib/overview.ts (ใช้ `water.status` ซึ่งเป็น system_operating semantics
  แล้ว OverviewPage ใช้ถูกต้อง — ไม่เกี่ยวกับ StatusBadge component)

## Verify commands

```bash
cd frontend && npm run build          # typecheck (rename = TS error ทุก callsite ที่ไม่ได้แก้)
cd frontend && npm run lint 2>/dev/null || true   # optional lint
# Stories (optional ถ้าลง ladle แล้ว):
cd frontend && npx @ladle/react serve   # → /?story=aura--status-badges ตรวจสี
```

## Checkpoint log (append-only)

- [2026-07-20] zcode (GLM): เขียน WO จาก Fable5 tour finding + codebase-design
  verdict (deepening via rename, ไม่ negate 3 callsites). user approved rename
  shape ใน AskUserQuestion. รอ dispatch/claim.
- [2026-07-20] zcode (GLM): execute ตาม Steps 1-6 — rename `status`→`operating`,
  flip polarity logic (`operating === true` = green/ปกติ, `=== false` = red/
  ผิดปกติ). 3 callsites (PFD/Dashboard/Readings) เปลี่ยนชื่อ prop เฉย ๆ.
  EquipmentPage negate 1 จุด (`operating={open.length === 0}`). Stories rename
  + reorder (null → true → false อ่านซ้ายไปขวา natural). Verify: `npm run
  build` ✅ (TS จับ rename ครบ — ไม่มี leftover `status=`) · Playwright 23/23 ✅.
  Visual smoke (สี) ส่ง Fable5 เพราะ Track F เป็นเจ้าของสี — GLM ไม่ assert สี.
