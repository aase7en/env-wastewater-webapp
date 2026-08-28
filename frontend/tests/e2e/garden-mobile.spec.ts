import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

/** ENV-MOBILE-005 baseline/RED for Garden mobile convergence. */
const PHONE = { width: 360, height: 800 };
const DESKTOP = { width: 1024, height: 900 };

const LABELS = [
  "\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48",
  "\u0e1b\u0e23\u0e30\u0e40\u0e20\u0e17\u0e07\u0e32\u0e19",
  "\u0e1e\u0e37\u0e49\u0e19\u0e17\u0e35\u0e48 (\u0e15\u0e23.\u0e21)",
  "\u0e08\u0e33\u0e19\u0e27\u0e19\u0e04\u0e19",
  "\u0e19\u0e49\u0e33\u0e21\u0e31\u0e19\u0e17\u0e35\u0e48\u0e43\u0e0a\u0e49 (L)",
  "\u0e0a\u0e31\u0e48\u0e27\u0e42\u0e21\u0e07\u0e17\u0e33\u0e07\u0e32\u0e19",
  "\u0e2d\u0e38\u0e1b\u0e01\u0e23\u0e13\u0e4c",
  "\u0e02\u0e22\u0e30\u0e17\u0e35\u0e48\u0e40\u0e01\u0e47\u0e1a (kg)",
  "\u0e2b\u0e21\u0e32\u0e22\u0e40\u0e2b\u0e15\u0e38",
] as const;

const GARDEN_ROW = {
  id: "50000000-0000-0000-0000-000000000001",
  round_date: "2026-08-28",
  location_id: null,
  work_type: "E2E synthetic garden round",
  area_sqm: 120,
  worker_count: 2,
  fuel_used_l: 1.5,
  duration_hours: 3,
  equipment_used: "E2E mower",
  waste_collected_kg: 8,
  photo_path: null,
  recorded_by: null,
  note: "synthetic layout evidence",
  created_at: "2026-08-28T00:00:00Z",
};

async function mockGardenDependencies(page: Page) {
  await page.route("**/rest/v1/role_module_visibility**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.route("**/rest/v1/threshold_alert**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.route("**/rest/v1/work_round**", async (route) => {
    if (route.request().method() === "DELETE") {
      await route.fulfill({ status: 204, body: "" });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([GARDEN_ROW]) });
  });
}

async function noDocumentOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
}

test.describe("ENV-MOBILE-005 Garden baseline", () => {
  test.beforeEach(async ({ authed: page }) => {
    await mockGardenDependencies(page);
  });

  test("360 px primary controls should form one phone column", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/garden");
    const controls = page.locator("input, textarea");
    const first = await controls.nth(0).boundingBox();
    const second = await controls.nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(Math.abs(first!.x - second!.x), "Garden phone x-delta should be <8px").toBeLessThan(8);
  });

  test("delete target should meet 44 px touch minimum", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/garden");
    const box = await page.getByRole("button", { name: "\u0e25\u0e1a", exact: true }).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test("all visible Garden controls should have semantic label associations", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/garden");
    for (const label of LABELS) {
      await expect(page.getByLabel(label, { exact: true }), `label: ${label}`).toHaveCount(1);
    }
  });

  test("history remains contained without document-level horizontal overflow", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/garden");
    await expect(page.locator("table")).toHaveCount(1);
    expect(await noDocumentOverflow(page)).toBe(true);
  });

  test("desktop preserves useful multi-column density", async ({ authed: page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/garden");
    const controls = page.locator("input, textarea");
    const first = await controls.nth(0).boundingBox();
    const second = await controls.nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(Math.abs(first!.x - second!.x)).toBeGreaterThan(80);
  });
});
