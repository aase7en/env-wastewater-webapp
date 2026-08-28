import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

/**
 * ENV-MOBILE-002 — Chemical sub-store mobile convergence.
 *
 * This spec starts as RED/baseline evidence before ChemicalPage production
 * mutation. Data/query/schema semantics are intentionally mocked/preserved;
 * this work order owns responsive/interaction behavior only.
 */

const PHONE = { width: 360, height: 800 };
const DESKTOP = { width: 1024, height: 900 };

const MASTER_ROWS = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    name: "คลอรีนเหลวสำหรับระบบบำบัดน้ำเสีย",
    cas_no: "7681-52-9",
    hazard_class: "Corrosive",
    unit: "kg",
    reorder_point: 20,
    current_balance: 12.5,
    is_active: true,
    created_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    name: "สารส้ม",
    cas_no: null,
    hazard_class: null,
    unit: "kg",
    reorder_point: 10,
    current_balance: 25,
    is_active: true,
    created_at: "2026-08-01T00:00:00Z",
  },
];

const MOVEMENT_ROWS = [
  {
    id: "20000000-0000-0000-0000-000000000001",
    movement_date: "2026-08-27",
    chemical_name: "คลอรีนเหลวสำหรับระบบบำบัดน้ำเสีย",
    direction: "out",
    quantity: 2.5,
    unit: "kg",
    balance_after: 12.5,
    purpose: "ระบบบำบัดน้ำเสีย",
    lot_no: "LOT-ENV-001",
    expiry_date: "2027-08-27",
    supplier: "E2E supplier",
    unit_cost: 100,
    master_id: "10000000-0000-0000-0000-000000000001",
    recorded_by: null,
    note: null,
    created_at: "2026-08-27T00:00:00Z",
  },
];

async function mockChemicalDependencies(page: Page) {
  await page.route("**/rest/v1/role_module_visibility**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });

  await page.route("**/rest/v1/threshold_alert**", async (route) => {
    const headers: Record<string, string> = {};
    if ((route.request().headers()["prefer"] ?? "").includes("count=")) headers["content-range"] = "*/0";
    await route.fulfill({ status: 200, contentType: "application/json", headers, body: "[]" });
  });

  await page.route("**/rest/v1/master**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MASTER_ROWS),
    });
  });

  await page.route("**/rest/v1/movement**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOVEMENT_ROWS),
    });
  });
}

async function documentHasNoHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
}

function sectionInputs(page: Page, heading: string) {
  return page.getByRole("heading", { name: heading }).locator("..").locator("input");
}

test.describe("ENV-MOBILE-002 Chemical mobile baseline", () => {
  test.beforeEach(async ({ authed: page }) => {
    await mockChemicalDependencies(page);
  });

  test("360 px stacks catalog and movement controls and keeps page contained", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/chemical");
    await expect(page.getByRole("heading", { name: "คลังเคมี" })).toBeVisible();

    const catalogInputs = sectionInputs(page, "เพิ่มเคมีใหม่ใน catalog");
    const catalogFirst = await catalogInputs.nth(0).boundingBox();
    const catalogSecond = await catalogInputs.nth(1).boundingBox();
    expect(catalogFirst).not.toBeNull();
    expect(catalogSecond).not.toBeNull();

    const movementInputs = sectionInputs(page, "บันทึกรับเข้า / จ่ายออก");
    const moveFirst = await movementInputs.nth(0).boundingBox();
    const moveSecond = await movementInputs.nth(1).boundingBox();
    expect(moveFirst).not.toBeNull();
    expect(moveSecond).not.toBeNull();

    const catalogDx = Math.abs(catalogFirst!.x - catalogSecond!.x);
    const movementDx = Math.abs(moveFirst!.x - moveSecond!.x);
    const pageContained = await documentHasNoHorizontalOverflow(page);

    expect.soft(catalogDx, `catalog x delta=${catalogDx}px; expected one phone column`).toBeLessThan(8);
    expect.soft(movementDx, `movement x delta=${movementDx}px; expected one phone column`).toBeLessThan(8);
    expect.soft(pageContained, "Chemical page should not overflow the 360px viewport").toBe(true);
  });

  test("phone delete actions meet the 44 px touch minimum", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/chemical");

    const deleteButtons = page.getByRole("button", { name: "ลบ", exact: true });
    await expect(deleteButtons).toHaveCount(3);
    for (let i = 0; i < await deleteButtons.count(); i += 1) {
      const box = await deleteButtons.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect.soft(box!.width, `delete action ${i + 1} width=${box!.width}px`).toBeGreaterThanOrEqual(44);
      expect.soft(box!.height, `delete action ${i + 1} height=${box!.height}px`).toBeGreaterThanOrEqual(44);
    }
  });

  test("desktop preserves useful multi-column form density", async ({ authed: page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/chemical");

    const catalogInputs = sectionInputs(page, "เพิ่มเคมีใหม่ใน catalog");
    const first = await catalogInputs.nth(0).boundingBox();
    const second = await catalogInputs.nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(Math.abs(first!.x - second!.x)).toBeGreaterThan(80);
  });
});
