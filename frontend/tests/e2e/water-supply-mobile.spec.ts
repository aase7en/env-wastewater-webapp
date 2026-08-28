import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

/**
 * ENV-MOBILE-003 — Water Supply mobile convergence baseline/regression.
 *
 * The first checkpoint intentionally runs against the unchanged production
 * page. Mock rows are deterministic layout evidence only, never production
 * water-quality data.
 */

const PHONE = { width: 360, height: 800 };
const DESKTOP = { width: 1024, height: 900 };

const WATER_ROWS = [
  {
    id: "30000000-0000-0000-0000-000000000001",
    check_date: "2026-08-27",
    location_id: null,
    ph: 7.2,
    free_chlorine_residual: 0.5,
    turbidity: 1.2,
    total_coliform: "ไม่พบ",
    fecal_coliform: "ไม่พบ",
    iron: 0.1,
    manganese: 0.05,
    hardness: 90,
    tds: 180,
    recorded_by: null,
    note: null,
    created_at: "2026-08-27T00:00:00Z",
  },
];

async function mockWaterSupplyDependencies(page: Page) {
  await page.route("**/rest/v1/role_module_visibility**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.route("**/rest/v1/threshold_alert**", async (route) => {
    const headers: Record<string, string> = {};
    if ((route.request().headers()["prefer"] ?? "").includes("count=")) headers["content-range"] = "*/0";
    await route.fulfill({ status: 200, contentType: "application/json", headers, body: "[]" });
  });
  await page.route("**/rest/v1/daily_check**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(WATER_ROWS) });
  });
}

async function documentHasNoHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
}

function formInputs(page: Page) {
  return page.getByRole("heading", { name: "กรอกข้อมูล" }).locator("..").locator("input");
}

test.describe("ENV-MOBILE-003 Water Supply mobile baseline", () => {
  test.beforeEach(async ({ authed: page }) => {
    await mockWaterSupplyDependencies(page);
  });

  test("360 px form fields stack into one phone column while page stays contained", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/water-supply");
    await expect(page.getByRole("heading", { name: "น้ำประปาบาดาล" })).toBeVisible();

    const inputs = formInputs(page);
    const first = await inputs.nth(0).boundingBox();
    const second = await inputs.nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();

    const xDelta = Math.abs(first!.x - second!.x);
    expect.soft(xDelta, `form x delta=${xDelta}px; expected one phone column`).toBeLessThan(8);
    expect.soft(await documentHasNoHorizontalOverflow(page), "Water Supply page should not overflow 360px viewport").toBe(true);
  });

  test("phone delete action meets the 44 px touch minimum", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/water-supply");

    const remove = page.getByRole("button", { name: "ลบ", exact: true });
    await expect(remove).toHaveCount(1);
    const box = await remove.boundingBox();
    expect(box).not.toBeNull();
    expect.soft(box!.width, `delete width=${box!.width}px`).toBeGreaterThanOrEqual(44);
    expect.soft(box!.height, `delete height=${box!.height}px`).toBeGreaterThanOrEqual(44);
  });

  test("existing recent-record table is locally contained", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/water-supply");

    const table = page.locator("table");
    await expect(table).toHaveCount(1);
    const wrapper = table.locator("..");
    const metrics = await wrapper.evaluate((el) => ({ clientWidth: el.clientWidth, scrollWidth: el.scrollWidth }));
    expect(metrics.scrollWidth).toBeGreaterThanOrEqual(metrics.clientWidth);
    expect(await documentHasNoHorizontalOverflow(page)).toBe(true);
  });

  test("desktop preserves useful multi-column form density", async ({ authed: page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/water-supply");

    const inputs = formInputs(page);
    const first = await inputs.nth(0).boundingBox();
    const second = await inputs.nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(Math.abs(first!.x - second!.x)).toBeGreaterThan(80);
  });
});
