import { test, expect } from "@playwright/test";

/**
 * Smoke tests — verify the SPA boots, renders, and routes correctly.
 * Does NOT exercise auth flows (those need real Supabase users + OAuth
 * config; deferred to an integration test profile).
 */

test.describe("Aura SPA smoke", () => {
  test("root redirects to /dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("dashboard renders brand + Aura theme", async ({ page }) => {
    await page.goto("/dashboard");
    // Brand lockup — UTH[AI]-EVN with [AI] highlighted
    await expect(page.locator("text=UTH")).toBeVisible();
    await expect(page.locator("text=EVN")).toBeVisible();
    // Header — should contain "แดชบอร์ด"
    await expect(page.locator("h1", { hasText: "แดชบอร์ด" })).toBeVisible();
  });

  test("dashboard shows the header (KPIs only render after a successful query)", async ({ page }) => {
    await page.goto("/dashboard");
    // The KPI grid is conditional on a successful data fetch (not loading,
    // not error). When Supabase env isn't configured in the test, the grid
    // may be hidden — but the dashboard header + log section are always there.
    await expect(page.locator("h1", { hasText: "แดชบอร์ด" })).toBeVisible();
    // The 14-day log table title always renders.
    await expect(page.locator("text=ประวัติ 14 วัน")).toBeVisible();
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

  test("sidebar nav has the full set of items", async ({ page }) => {
    await page.goto("/dashboard");
    // Update this list when NAV grows. Order matters less than presence.
    const navLabels = ["แดชบอร์ด", "บันทึกประจำวัน", "ประวัติ", "อุปกรณ์", "เอกสาร", "ตั้งค่า"];
    for (const label of navLabels) {
      await expect(page.locator(`nav a:has-text("${label}")`)).toBeVisible();
    }
  });
});
