import { test, expect } from "./fixtures";

/**
 * SKEL-1: skeleton loading states.
 * The 14-day query is mocked with a delayed response so the skeleton window
 * is deterministic — a fast real DB (<200ms) would resolve before the
 * anti-flash delay ever reveals the skeleton.
 *
 * AUTH-5 (2026-07-30): uses the `authed` fixture so RequireAuth on /dashboard
 * lets the page render (it's now auth-gated like every data route).
 */
test.describe("skeleton (authed)", () => {
  test("dashboard shows skeleton tiles while the 14-day query is in flight, then swaps to content", async ({ authed: page }) => {
    await page.route("**/rest/v1/v_dashboard_14day*", async (route) => {
      await new Promise((r) => setTimeout(r, 900));
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });
    await page.goto("/dashboard");
    await expect(page.locator("[data-skeleton]").first()).toBeVisible();
    await expect(page.locator("[data-skeleton]")).toHaveCount(0, { timeout: 10_000 });
  });

  test("reduced-motion: skeleton sweep is disabled", async ({ authed: page }) => {
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
});
