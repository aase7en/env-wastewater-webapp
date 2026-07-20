# WO-OAUTH-2: client — pending bounce + PendingApprovalPage + AuthPage config banner

Status: open (2026-07-21, queued after OAUTH-1)
Lane/files:
- `frontend/src/components/RequireAuth.tsx` (pending bounce logic)
- `frontend/src/pages/PendingApprovalPage.tsx` (NEW)
- `frontend/src/pages/AuthCallback.tsx` (post-OAuth redirect tuning)
- `frontend/src/App.tsx` (new `/pending-approval` route)
- `frontend/src/components/AuthProvider.tsx` (expose `isPending`)
Branch: main
Model tier: **cheap-ok** (Track Z logic — no className styling beyond AuraCard reuse; Fable5 polish Track F later)

## บริบท

หลัง OAUTH-1 schema land + user config provider ใน dashboard → OAuth user login
สำเร็จ → trigger สร้าง `core.app_user` role='pending' → `isAuthenticated=true`
แต่ user ยังไม่ผ่านการ approve. ต้องกันไม่ให้เข้า `/dashboard` ฯลฯ

## Goal + Acceptance

1. `useAuth()` exposes `isPending: appUser?.role === 'pending'`
2. `RequireAuth`:
   - `isAuthenticated && isPending` → `<Navigate to="/pending-approval" replace />`
   - `isAuthenticated && isAdmin/staff` → render children (existing behavior)
3. New `/pending-approval` route renders `PendingApprovalPage`:
   - Thai copy: "บัญชีรอการอนุมัติ — แจ้งผู้ดูแลระบบเพื่ออนุมัติบัญชีของคุณ"
   - "ออกจากระบบ" button (call signOut)
   - NO link to dashboard (must be approved first)
4. `AuthPage.tsx` shows a checklist banner when OAuth provider is not yet
   configured (read from env or static — see Step 4). For now: static
   notice that says "หากเข้าสู่ระบบด้วย Google/LINE ไม่ได้ โปรดแจ้งผู้ดูแล"
5. `AuthCallback.tsx`: after OAuth return, redirect to:
   - `/pending-approval` if `isPending`
   - `stash || /dashboard` otherwise
6. `npm run build` ✅ + `npx playwright test` ✅ (existing 25/25 + new pending bounce test)
7. New Playwright test: mock appUser with role='pending' → route bounce to `/pending-approval`

## Forbidden

- ห้ามแตะ className/colors/fonts (Track F) — AuraCard + Button reuse only
- ห้ามลบ AUTH-1 race fix / AUTH-2 query fix
- ห้าม implement provider config in code (user config in dashboard only)
- ห้าม route credentials ผ่าน chat

## Steps

### 1. AuthProvider.tsx — expose isPending

```ts
interface AuthContextValue {
  // ... existing
  /** True iff appUser.role === 'pending' (OAuth user awaiting approval). */
  isPending: boolean;
}

// in useMemo value:
isPending: appUser?.role === "pending",
```

### 2. RequireAuth.tsx — pending bounce

```tsx
const { loading, isAuthenticated, isAdmin, isPending } = useAuth();

if (loading) { /* existing PageSkeleton */ }
if (!isAuthenticated) { /* existing Navigate to /login */ }
if (isPending) {
  return <Navigate to="/pending-approval" replace />;
}
if (requireAdmin && !isAdmin) { /* existing 403 */ }
return <>{children}</>;
```

### 3. PendingApprovalPage.tsx (new)

```tsx
export function PendingApprovalPage() {
  const { signOut, user } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Brand lockup (copy from AuthPage pattern) */}
        <AuraCard className="p-6 space-y-4 text-center font-thai">
          <MSymbol name="hourglass_top" className="text-[48px] text-aura-cyan" />
          <h1 className="text-xl font-semibold text-aura-textMain">
            บัญชีรอการอนุมัติ
          </h1>
          <p className="text-sm text-aura-textMuted">
            บัญชี <span className="text-aura-textMain">{user?.email}</span> ลงทะเบียนสำเร็จ
            แต่ยังรอผู้ดูแลระบบอนุมัติ กรุณาติดต่อผู้ดูแลหรือรอการอนุมัติ
          </p>
          <Button onClick={() => void signOut()} variant="secondary" className="w-full">
            ออกจากระบบ
          </Button>
        </AuraCard>
      </div>
    </div>
  );
}
```

### 4. AuthCallback.tsx — pending redirect

```tsx
useEffect(() => {
  if (!loading) {
    const stash = sessionStorage.getItem("auth-next");
    sessionStorage.removeItem("auth-next");
    if (isPending) {
      navigate("/pending-approval", { replace: true });
    } else {
      navigate(stash || "/dashboard", { replace: true });
    }
  }
}, [loading, isPending, session, navigate]);
```

### 5. App.tsx — route

```tsx
<Route path="/pending-approval" element={<PendingApprovalPage />} />
```

(No RequireAuth wrapper — page itself handles via useAuth; accessible when
authenticated + pending only. If not authenticated, navigate to /login.)

### 6. AuthPage.tsx — config notice banner (optional, low priority)

Insert under the OAuth buttons div:

```tsx
<p className="text-xs text-aura-textMuted text-center font-thai">
  หากเข้าสู่ระบบด้วย Google/LINE ไม่ได้ อาจยังไม่ได้เปิดใช้งาน — โปรดแจ้งผู้ดูแล
</p>
```

### 7. Playwright test (new — `tests/e2e/pending.spec.ts`)

```ts
import { test, expect } from "./fixtures";

test("pending role bounces to /pending-approval", async ({ page }) => {
  await page.addInitScript(() => {
    // Mock appUser with role=pending
    localStorage.setItem("sb-...-auth-token", JSON.stringify({
      access_token: "fake", user: { id: "test-pending" }, expires_at: 9999999999,
    }));
  });
  await page.route("**/rest/v1/app_user**", (r) => r.fulfill({
    status: 200, json: [{ id: "test-pending", role: "pending", display_name: "Test", is_active: true }],
  }));
  await page.goto("./dashboard");
  await expect(page).toHaveURL(/\/pending-approval$/);
  await expect(page.getByText("บัญชีรอการอนุมัติ")).toBeVisible();
});
```

## Dependencies

- **OAUTH-1** must land first (pending role must exist in DB)
- **User config dashboard** for actual OAuth flow to work end-to-end
  (this chunk's tests use mocks — they pass without dashboard config)

## Verify

```bash
cd frontend && npm run build && npx vitest run && npx playwright test
# Expect: 96 unit + 26 e2e (25 existing + 1 new pending)
```

## Checkpoint / ปิดท้าย

(none yet — execute pending)
