import { test, expect } from "./fixtures";
import { devices, type Page } from "@playwright/test";

/**
 * ENV-MOBILE-002 — Chemical sub-store mobile convergence.
 *
 * This spec starts as RED/baseline evidence before ChemicalPage production
 * mutation. Data/query/schema semantics are intentionally mocked/preserved;
 * this work order owns responsive/interaction behavior only.
 */

const PHONE = { width: 360, height: 800 };
const PHONE_430 = { width: 430, height: 900 };
const TABLET = { width: 768, height: 1024 };
const DESKTOP = { width: 1024, height: 900 };
const VISUAL_DIR = "test-results";

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

interface ChemicalMockOptions {
  failMovementPostOnce?: boolean;
  movementPosts?: string[];
  masterPosts?: string[];
}

async function mockChemicalDependencies(page: Page, options: ChemicalMockOptions = {}) {
  let movementPostCount = 0;

  await page.route("**/rest/v1/role_module_visibility**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });

  await page.route("**/rest/v1/threshold_alert**", async (route) => {
    const headers: Record<string, string> = {};
    if ((route.request().headers()["prefer"] ?? "").includes("count=")) headers["content-range"] = "*/0";
    await route.fulfill({ status: 200, contentType: "application/json", headers, body: "[]" });
  });

  await page.route("**/rest/v1/master**", async (route) => {
    if (route.request().method() === "POST") {
      options.masterPosts?.push(route.request().postData() ?? "");
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(MASTER_ROWS[0]) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MASTER_ROWS) });
  });

  await page.route("**/rest/v1/movement**", async (route) => {
    if (route.request().method() === "POST") {
      movementPostCount += 1;
      options.movementPosts?.push(route.request().postData() ?? "");
      if (options.failMovementPostOnce && movementPostCount === 1) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ message: "E2E movement failure", code: "E2E" }),
        });
        return;
      }
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(MOVEMENT_ROWS[0]) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOVEMENT_ROWS) });
  });
}

async function documentHasNoHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
}

function sectionInputs(page: Page, heading: string) {
  return page.getByRole("heading", { name: heading }).locator("..").locator("input");
}

test.describe("ENV-MOBILE-002 Chemical mobile regression", () => {
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

  test("phone primary and delete actions meet the 44 px touch minimum", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/chemical");

    const primaryActions = [
      page.getByRole("button", { name: "เพิ่ม", exact: true }),
      page.getByRole("button", { name: "บันทึก", exact: true }),
    ];
    for (const [index, action] of primaryActions.entries()) {
      const box = await action.boundingBox();
      expect(box).not.toBeNull();
      expect.soft(box!.width, `primary action ${index + 1} width=${box!.width}px`).toBeGreaterThanOrEqual(44);
      expect.soft(box!.height, `primary action ${index + 1} height=${box!.height}px`).toBeGreaterThanOrEqual(44);
    }

    const deleteButtons = page.getByRole("button", { name: "ลบ", exact: true });
    await expect(deleteButtons).toHaveCount(3);
    for (let i = 0; i < await deleteButtons.count(); i += 1) {
      const box = await deleteButtons.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect.soft(box!.width, `delete action ${i + 1} width=${box!.width}px`).toBeGreaterThanOrEqual(44);
      expect.soft(box!.height, `delete action ${i + 1} height=${box!.height}px`).toBeGreaterThanOrEqual(44);
    }
  });

  test("390 and 430 px keep one-column phone composition", async ({ authed: page }) => {
    for (const [label, viewport] of [["390", { width: 390, height: 844 }], ["430", PHONE_430]] as const) {
      await page.setViewportSize(viewport);
      await page.goto("/chemical");
      const catalogInputs = sectionInputs(page, "เพิ่มเคมีใหม่ใน catalog");
      const first = await catalogInputs.nth(0).boundingBox();
      const second = await catalogInputs.nth(1).boundingBox();
      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      expect(Math.abs(first!.x - second!.x), `${label}px should remain one column`).toBeLessThan(8);
      expect(await documentHasNoHorizontalOverflow(page)).toBe(true);
      await page.screenshot({ path: `${VISUAL_DIR}/chemical-${label}.png`, fullPage: true });
    }
  });

  test("tablet and desktop preserve useful multi-column form density", async ({ authed: page }) => {
    for (const [label, viewport] of [["768", TABLET], ["1024", DESKTOP]] as const) {
      await page.setViewportSize(viewport);
      await page.goto("/chemical");
      const catalogInputs = sectionInputs(page, "เพิ่มเคมีใหม่ใน catalog");
      const first = await catalogInputs.nth(0).boundingBox();
      const second = await catalogInputs.nth(1).boundingBox();
      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      expect(Math.abs(first!.x - second!.x), `${label}px should preserve multi-column density`).toBeGreaterThan(80);
      await page.screenshot({ path: `${VISUAL_DIR}/chemical-${label}.png`, fullPage: true });
    }
  });

  test("wide stock and history tables scroll locally without page overflow", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/chemical");

    const tables = page.locator("table");
    await expect(tables).toHaveCount(2);
    for (let i = 0; i < await tables.count(); i += 1) {
      const scrollBox = tables.nth(i).locator("..");
      const metrics = await scrollBox.evaluate((el) => ({ clientWidth: el.clientWidth, scrollWidth: el.scrollWidth }));
      expect(metrics.scrollWidth, `table ${i + 1} should own its horizontal scroll`).toBeGreaterThan(metrics.clientWidth);
    }
    expect(await documentHasNoHorizontalOverflow(page)).toBe(true);
    await page.screenshot({ path: `${VISUAL_DIR}/chemical-360.png`, fullPage: true });
  });

  test("movement save error preserves entered values and retry succeeds", async ({ authed: page }) => {
    const movementPosts: string[] = [];
    let postCount = 0;
    await page.unroute("**/rest/v1/movement**");
    await page.route("**/rest/v1/movement**", async (route) => {
      if (route.request().method() === "POST") {
        postCount += 1;
        movementPosts.push(route.request().postData() ?? "");
        if (postCount === 1) {
          await route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ message: "E2E movement failure", code: "E2E" }) });
          return;
        }
        await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(MOVEMENT_ROWS[0]) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOVEMENT_ROWS) });
    });

    await page.setViewportSize(PHONE_430);
    await page.goto("/chemical");
    const movementInputs = sectionInputs(page, "บันทึกรับเข้า / จ่ายออก");
    await movementInputs.nth(1).fill("สารส้ม E2E");
    await movementInputs.nth(2).fill("3.5");
    const purpose = page.getByRole("heading", { name: "บันทึกรับเข้า / จ่ายออก" }).locator("..").locator("textarea");
    await purpose.fill("ทดสอบงานภาคสนาม");

    const save = page.getByRole("button", { name: "บันทึก", exact: true });
    await save.click();
    await expect(page.getByRole("status").filter({ hasText: "ผิดพลาด: E2E movement failure" })).toBeVisible();
    await expect(movementInputs.nth(1)).toHaveValue("สารส้ม E2E");
    await expect(movementInputs.nth(2)).toHaveValue("3.5");
    await expect(purpose).toHaveValue("ทดสอบงานภาคสนาม");

    await save.click();
    await expect(page.getByRole("status").filter({ hasText: "บันทึกการเคลื่อนไหว" })).toBeVisible();
    expect(movementPosts).toHaveLength(2);
    const retryPayload = JSON.parse(movementPosts[1]) as Record<string, unknown>;
    expect(retryPayload.chemical_name).toBe("สารส้ม E2E");
    expect(retryPayload.quantity).toBe(3.5);
  });
});

test.describe("ENV-MOBILE-002 real touch context", () => {
  const { defaultBrowserType: _browserType, ...pixel7Touch } = devices["Pixel 7"];
  test.use(pixel7Touch);

  test("tap path can add a catalog item and record a movement", async ({ authed: page }) => {
    const masterPosts: string[] = [];
    const movementPosts: string[] = [];
    await mockChemicalDependencies(page, { masterPosts, movementPosts });
    await page.goto("/chemical");

    const catalogInputs = sectionInputs(page, "เพิ่มเคมีใหม่ใน catalog");
    await catalogInputs.nth(0).fill("E2E Touch Chemical");
    await page.getByRole("button", { name: "เพิ่ม", exact: true }).tap();
    await expect(page.getByRole("status").filter({ hasText: "เพิ่มเคมีใหม่" })).toBeVisible();

    const movementInputs = sectionInputs(page, "บันทึกรับเข้า / จ่ายออก");
    await movementInputs.nth(1).fill("E2E Touch Chemical");
    await movementInputs.nth(2).fill("1.25");
    await page.getByRole("button", { name: "บันทึก", exact: true }).tap();
    await expect(page.getByRole("status").filter({ hasText: "บันทึกการเคลื่อนไหว" })).toBeVisible();

    expect(masterPosts).toHaveLength(1);
    expect(movementPosts).toHaveLength(1);
    expect(await documentHasNoHorizontalOverflow(page)).toBe(true);
  });
});
