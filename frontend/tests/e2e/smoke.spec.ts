import { test, expect } from "./fixtures";

/**
 * Smoke tests — verify the SPA boots, renders, and routes correctly.
 * Does NOT exercise auth flows (those need real Supabase users + OAuth
 * config; deferred to an integration test profile).
 */

test.describe("Aura SPA smoke", () => {
  test("root bounces to /login (AUTH-5: overview is auth-gated)", async ({ page }) => {
    // AUTH-5 (2026-07-30): / is now RequireAuth-gated (it's a data overview,
    // not a public landing). Unauthenticated visitors bounce to /login.
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("dashboard bounces to /login (AUTH-5)", async ({ page }) => {
    // AUTH-5: /dashboard now RequireAuth-gated. (Previously public — that
    // let a pending/anon user land on the data dashboard, the root cause of
    // the "login ไม่ผ่านแต่เข้าแอปได้บางส่วน" symptom.)
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page renders brand + Aura theme (moved from dashboard, now public)", async ({ page }) => {
    // AUTH-5: brand/Aura-theme assertions moved here since /dashboard now
    // bounces anon. The login page carries the same brand lockup.
    await page.goto("/login");
    await expect(page.locator("text=UTH").first()).toBeVisible();
    await expect(page.locator("text=-ENV").first()).toBeVisible();
  });

  test("protected route bounces to /login when unauthenticated", async ({ page }) => {
    await page.goto("/form");
    // RequireAuth should redirect; URL should contain /login
    await expect(page).toHaveURL(/\/login/);
    // Login page should show the 3 mode tabs. The submit button shares
    // the "เข้าสู่ระบบ" label, so target the tab container instead.
    const tabStrip = page.locator("div.flex.gap-1");
    await expect(tabStrip.getByText("เข้าสู่ระบบ", { exact: true })).toBeVisible();
    await expect(tabStrip.getByText("สมัครใหม่")).toBeVisible();
    await expect(tabStrip.getByText("ลืมรหัส")).toBeVisible();
  });

  test("/readings also bounces to /login when unauthenticated", async ({ page }) => {
    await page.goto("/readings");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page shows OAuth buttons", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("button:has-text('Google')")).toBeVisible();
    await expect(page.locator("button:has-text('LINE')")).toBeVisible();
  });

  test("unknown path shows 404 page", async ({ page }) => {
    await page.goto("/this-path-does-not-exist");
    // 404 page has the giant gradient "404" + Thai message
    await expect(page.locator("text=ไม่พบหน้าที่ค้นหา")).toBeVisible();
    await expect(page.locator("text=กลับหน้าแดชบอร์ด")).toBeVisible();
  });

  test("sidebar nav is hidden when unauthenticated (AUTH-5 — app shell is auth-gated)", async ({ page }) => {
    // AUTH-5: the sidebar (AppShell) only renders inside the auth-gated
    // route tree. An unauthenticated visitor lands on /login, which has no
    // sidebar. The full NAV item set is verified under an authenticated
    // fixture (TODO: authenticated e2e profile — see handoff). Here we just
    // confirm anon sees no module nav.
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("nav")).toHaveCount(0);
  });
});
