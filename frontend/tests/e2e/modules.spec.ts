import { test, expect } from "@playwright/test";

/**
 * Module route smoke tests — guard + sidebar nav.
 *
 * Module pages (WaterSupply/Garbage/Fuel/Garden/Building/Safety/Food/
 * Chemical) live under RequireAuth, so the smoke we can run without a
 * real session is: route bounce to /login + sidebar nav shape.
 * Authenticated CRUD round-trips are deferred to an integration profile
 * (need real auth.users — P11 follow-up).
 */

const MODULE_ROUTES = [
  "/water-supply", "/garbage", "/fuel", "/garden",
  "/building", "/safety", "/food", "/chemical",
];

test("module routes bounce to /login with next param", async ({ page }) => {
  for (const path of MODULE_ROUTES) {
    await page.goto(path);
    const expected = new RegExp(`/login\\?next=${path.replace(/\//g, "%2F")}`);
    await expect(page).toHaveURL(expected);
  }
});

test("DBA Console + AI Admin routes bounce to /login", async ({ page }) => {
  await page.goto("/admin/db");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Fdb/);
  await page.goto("/admin/ai");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Fai/);
});

test("sidebar exposes module + orphan routes; admin entries stay hidden (F8)", async ({ page }) => {
  // F8 Track F NAV pass closed the gap this test used to flag: the 8 module
  // routes plus the previously-orphan /carbon-rollup, /attachments and
  // /regulations now live in the sidebar. Admin-only entries render only
  // for admin users, so an unauthenticated visitor must see none of them.
  await page.goto("/dashboard");
  const expectedNav = [
    "/", "/dashboard", "/form", "/readings",
    "/trends", "/carbon", "/carbon-rollup", "/equipment", "/reports",
    "/attachments", ...MODULE_ROUTES, "/regulations",
  ];
  for (const href of expectedNav) {
    // Both desktop + mobile sidebars render — at least one link per route.
    await expect(page.locator(`nav a[href="${href}"]`).first()).toBeVisible();
  }
  for (const href of ["/import", "/pdf-designer", "/admin/db", "/admin/ai"]) {
    await expect(page.locator(`nav a[href="${href}"]`)).toHaveCount(0);
  }
});
