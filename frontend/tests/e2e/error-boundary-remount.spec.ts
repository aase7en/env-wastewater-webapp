import { test, expect } from "./fixtures";

/**
 * WO-STAB-005 — regression: ErrorBoundary must not remount the subtree on
 * healthy navigation, and must still clear the recovery screen on route
 * change after a crash.
 *
 * Bug (P0 #5, reports/code-review-2026-08-12.md): the wrapper rendered
 * `<div key={location.pathname}>` AROUND ErrorBoundaryInner > AuthProvider,
 * so every route change unmounted/remounted the whole subtree —
 * AuthProvider re-ran getSession + loadAppUser on every dock click
 * (skeleton flicker + a fresh `app_user` REST call each time).
 *
 * Test A (healthy navigation): counts `app_user` REST calls across SPA
 * navigations. With the fix, AuthProvider mounts ONCE — the count stays
 * at its boot value. On the old key-remount code each navigation
 * re-mounts AuthProvider → the count grows (RED proof).
 *
 * Test B (escape after crash): blocks the lazy TrendsPage chunk (404) so
 * navigating to /trends makes React lazy() throw during render → the
 * boundary shows its recovery screen ("เกิดข้อผิดพลาด"). Navigating to
 * another route must clear the error and render that route normally.
 */
test.describe("WO-STAB-005 ErrorBoundary remount/reset", () => {
  test("A: healthy SPA navigation does not remount AuthProvider", async ({ page, authed: _authed }) => {
    let appUserCalls = 0;
    await page.route("**/rest/v1/app_user**", async (route) => {
      appUserCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "00000000-0000-0000-0000-0000000000aa", role: "staff", display_name: "E2E Staff", is_active: true },
        ]),
      });
    });
    // Quiet the data queries so the pages render fast and only auth
    // traffic matters to the counter.
    for (const pat of ["**/rest/v1/v_dashboard_14day**", "**/rest/v1/v_overview_carbon**", "**/rest/v1/equipment**", "**/rest/v1/v_unified_co2e**"]) {
      await page.route(pat, async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
      });
    }

    await page.goto("/readings");
    await expect(page.getByText("ประวัติ", { exact: true }).first()).toBeVisible();
    const bootCalls = appUserCalls; // AuthProvider mount #1
    expect(bootCalls).toBeGreaterThanOrEqual(1);

    // SPA-navigate via client-side React Router. CHANGES_REQUIRED
    // remediation: activate the links with KEYBOARD (focus + Enter) —
    // no pointer hit-testing, so animated/overlapping dock chrome (the
    // `.dock-item` parents that made the click() variant flaky) cannot
    // intercept. In-page navigation only: page.goto after boot would be
    // a full reload and would remount AuthProvider by itself.
    const navTo = async (hrefPart: string, urlPattern: RegExp) => {
      const link = page.locator(`a[href*="${hrefPart}"]`).first();
      await link.focus();
      await page.keyboard.press("Enter");
      // Prove the ROUTE actually changed before continuing — URL, not a
      // text marker (the old markers also exist in persistent nav UI and
      // could resolve before the destination page is active).
      await expect(page).toHaveURL(urlPattern, { timeout: 10_000 });
    };
    await navTo("form", /\/form$/);
    await navTo("readings", /\/readings$/);
    await navTo("form", /\/form$/);
    // Let any (buggy) remount-side auth traffic land before counting.
    await page.waitForTimeout(500);

    // The fix: no additional AuthProvider mounts → app_user called only
    // at boot. (Old key-remount code: +1 per navigation.)
    expect(appUserCalls).toBe(bootCalls);
  });

  test("B: route change escapes the error recovery screen after a crash", async ({ page, authed: _authed }) => {
    await page.route("**/rest/v1/app_user**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "00000000-0000-0000-0000-0000000000aa", role: "staff", display_name: "E2E Staff", is_active: true },
        ]),
      });
    });
    for (const pat of ["**/rest/v1/v_dashboard_14day**", "**/rest/v1/v_overview_carbon**", "**/rest/v1/equipment**", "**/rest/v1/v_unified_co2e**"]) {
      await page.route(pat, async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
      });
    }
    // Make the lazy TrendsPage chunk fail to load → React lazy() throws
    // during render → boundary catches → recovery screen. Pattern covers
    // both shapes: dev server module URL and hashed prod asset.
    await page.route("**/TrendsPage*", async (route) => {
      await route.fulfill({ status: 404, contentType: "text/plain", body: "blocked for test" });
    });

    await page.goto("/readings");
    await expect(page.getByText("ประวัติ", { exact: true }).first()).toBeVisible();

    // Navigate into the broken lazy route.
    await page.locator('a[href*="trends"]').first().click();
    await expect(page.getByText("เกิดข้อผิดพลาด").first()).toBeVisible({ timeout: 10_000 });

    // Escape: the crashed tree offers no in-app nav — the real user path
    // is the browser BACK button (popstate → route change → boundary
    // must clear the error and render the previous route).
    await page.goBack();
    await expect(page.getByText("เกิดข้อผิดพลาด")).toHaveCount(0, { timeout: 10_000 });
    await expect(page.getByText("ประวัติ", { exact: true }).first()).toBeVisible({ timeout: 10_000 });
  });
});
