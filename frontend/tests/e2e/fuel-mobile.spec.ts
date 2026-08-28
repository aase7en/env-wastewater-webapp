import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

/**
 * ENV-MOBILE-004 — Fuel mobile convergence baseline/regression.
 *
 * Initial checkpoint runs against the unchanged production page. Synthetic
 * rows are deterministic layout evidence only, never production fuel data.
 */

const PHONE = { width: 360, height: 800 };
const DESKTOP = { width: 1024, height: 900 };

const FUEL_ROWS = [
  {
    id: "40000000-0000-0000-0000-000000000001",
    log_date: "2026-08-28",
    fuel_type: "diesel",
    litres: 10,
    meter_before: 100,
    meter_after: 110,
    vehicle_or_use: null,
    vehicle_id: "E2E-SYNTHETIC-01",
    odometer: 1234.5,
    purpose: "E2E synthetic layout row",
    cost_baht: 350,
    supplier: "E2E supplier",
    recorded_by: null,
    note: null,
    created_at: "2026-08-28T00:00:00Z",
  },
];

async function mockFuelDependencies(page: Page) {
  await page.route("**/rest/v1/role_module_visibility**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.route("**/rest/v1/threshold_alert**", async (route) => {
    const headers: Record<string, string> = {};
    if ((route.request().headers()["prefer"] ?? "").includes("count=")) headers["content-range"] = "*/0";
    await route.fulfill({ status: 200, contentType: "application/json", headers, body: "[]" });
  });
  await page.route("**/rest/v1/dispense_log**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(FUEL_ROWS) });
  });
}

async function documentHasNoHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
}

function formControls(page: Page) {
  return page.getByRole("button", { name: "บันทึก", exact: true }).locator("..").locator("input, select");
}

test.describe("ENV-MOBILE-004 Fuel mobile baseline", () => {
  test.beforeEach(async ({ authed: page }) => {
    await mockFuelDependencies(page);
  });

  test("360 px form controls stack into one phone column", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/fuel");
    await expect(page.getByRole("heading", { name: "การใช้เชื้อเพลิง" })).toBeVisible();

    const controls = formControls(page);
    const first = await controls.nth(0).boundingBox();
    const second = await controls.nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();

    const xDelta = Math.abs(first!.x - second!.x);
    expect.soft(xDelta, `Fuel form x delta=${xDelta}px; expected one phone column`).toBeLessThan(8);
  });

  test("phone delete action meets the 44 px touch minimum", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/fuel");

    const remove = page.getByRole("button", { name: "ลบ", exact: true });
    await expect(remove).toHaveCount(1);
    const box = await remove.boundingBox();
    expect(box).not.toBeNull();
    expect.soft(box!.width, `delete width=${box!.width}px`).toBeGreaterThanOrEqual(44);
    expect.soft(box!.height, `delete height=${box!.height}px`).toBeGreaterThanOrEqual(44);
  });

  test("history table does not force document-level horizontal overflow", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/fuel");

    await expect(page.locator("table")).toHaveCount(1);
    expect(await documentHasNoHorizontalOverflow(page)).toBe(true);
  });

  test("desktop preserves useful multi-column form density", async ({ authed: page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/fuel");

    const controls = formControls(page);
    const first = await controls.nth(0).boundingBox();
    const second = await controls.nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(Math.abs(first!.x - second!.x)).toBeGreaterThan(80);
  });
});
