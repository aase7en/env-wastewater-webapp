import { test, expect } from "./fixtures";

/**
 * Auth guard + login page tests.
 *
 * Scope: the *behaviour* of RequireAuth (bounce to /login?next=…, restore
 * next path after login) and the login page UI. Does NOT exercise a real
 * Supabase login round-trip — that needs a real `auth.users` test account
 * (P11 follow-up) and is intentionally deferred to an integration profile.
 *
 * What this guards against regression:
 * - removing <RequireAuth> from a protected route silently exposing data
 * - dropping the ?next= query → users land on /dashboard instead of where
 *   they asked for
 * - login page losing its OAuth buttons (the only login path today)
 */

test.describe("auth guard", () => {
  test("protected route /form bounces to /login with next param", async ({ page }) => {
    await page.goto("/form");
    await expect(page).toHaveURL(/\/login\?next=%2Fform/);
  });

  test("protected route /readings bounces to /login with next param", async ({ page }) => {
    await page.goto("/readings");
    await expect(page).toHaveURL(/\/login\?next=%2Freadings/);
  });

  test("admin-only route /admin/db bounces to /login (not authenticated at all)", async ({ page }) => {
    await page.goto("/admin/db");
    // Unauthenticated users bounce to /login before the admin check runs.
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Fdb/);
  });

  test("deep link with querystring preserves query in next param", async ({ page }) => {
    // /readings has no :id sub-route; the meaningful "deep link" shape is
    // a top-level protected path with a query string.
    await page.goto("/readings?from=today");
    await expect(page).toHaveURL(/\/login\?next=%2Freadings/);
  });

  test("/ and /dashboard are auth-gated too (AUTH-5)", async ({ page }) => {
    // AUTH-5 (2026-07-30): previously / and /dashboard had NO RequireAuth — a
    // pending/anon user could land on the data overview directly, then hit
    // RLS 401s + RequireAuth bounces on every other tab. Now gated like the
    // rest. (The old test asserted these stayed put — it was asserting the
    // bug, not the contract.)
    for (const path of ["/", "/dashboard"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    }
  });
});

test.describe("login page", () => {
  test("renders Thai copy + OAuth buttons (Google, LINE)", async ({ page }) => {
    await page.goto("/login");
    // h1 is the brand wordmark (UTH[AI]-ENV); the primary mode label is
    // "เข้าสู่ระบบ" rendered as a section heading.
    await expect(page.getByText("เข้าสู่ระบบ").first()).toBeVisible();
    // OAuth buttons — Google + LINE are the only login paths today
    // (email/password helpers exist in AuthProvider but the UI hides them).
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /line/i })).toBeVisible();
  });

  test("direct /login visit (no next param) does not error", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login$/);
    // No error toast should appear on a clean direct visit.
    await expect(page.locator("[role='alert']")).toHaveCount(0);
  });

  test("/auth/callback with no session → /login (AUTH-4 + AUTH-5)", async ({ page }) => {
    // AUTH-4: AuthCallback waits for appUserResolved before navigating.
    // AUTH-5: /dashboard is now RequireAuth-gated. With no session (test env),
    // AuthCallback never gets a role to branch on — and even if it fell
    // through to /dashboard, RequireAuth would bounce to /login. So the
    // observable end-state for an unauthenticated /auth/callback visit is
    // /login, not /dashboard. (The old test asserted /dashboard — it relied
    // on /dashboard being public, which AUTH-5 closed.)
    await page.goto("/auth/callback");
    await expect(page).toHaveURL(/\/login/);
  });
});
