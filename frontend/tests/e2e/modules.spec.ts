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

test("sidebar exposes the legacy nav set (modules pending Track F)", async ({ page }) => {
  // Sidebar NAV list (AppShell.tsx) currently surfaces only legacy routes.
  // The 8 new module routes + DBA Console + AI Admin are reachable via
  // direct URL only — adding them to the sidebar is a Track F gap,
  // flagged here so a future Track F pass knows to add them.
  await page.goto("/dashboard");
  const expectedLegacy = [
    "/", "/dashboard", "/form", "/readings",
    "/trends", "/carbon", "/equipment", "/reports",
  ];
  for (const href of expectedLegacy) {
    // Both desktop + mobile sidebars render — at least one link per route.
    await expect(page.locator(`nav a[href="${href}"]`).first()).toBeVisible();
  }
});
