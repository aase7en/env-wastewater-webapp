import { test, expect } from "./fixtures";
import { devices, type Page } from "@playwright/test";

/**
 * ENV-MOBILE-003 — Water Supply mobile convergence.
 *
 * Mock rows are deterministic layout evidence only, never production
 * water-quality data. The production data/query/schema contract is read-only
 * for this work order.
 */

const PHONE = { width: 360, height: 800 };
const PHONE_430 = { width: 430, height: 900 };
const TABLET = { width: 768, height: 1024 };
const DESKTOP = { width: 1024, height: 900 };
const VISUAL_DIR = "test-results";

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

interface WaterMockOptions {
  failPostOnce?: boolean;
  posts?: string[];
}

async function mockWaterSupplyDependencies(page: Page, options: WaterMockOptions = {}) {
  let postCount = 0;

  await page.route("**/rest/v1/role_module_visibility**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.route("**/rest/v1/threshold_alert**", async (route) => {
    const headers: Record<string, string> = {};
    if ((route.request().headers()["prefer"] ?? "").includes("count=")) headers["content-range"] = "*/0";
    await route.fulfill({ status: 200, contentType: "application/json", headers, body: "[]" });
  });
  await page.route("**/rest/v1/daily_check**", async (route) => {
    if (route.request().method() === "POST") {
      postCount += 1;
      options.posts?.push(route.request().postData() ?? "");
      if (options.failPostOnce && postCount === 1) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ message: "E2E water save failure", code: "E2E" }),
        });
        return;
      }
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(WATER_ROWS[0]) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(WATER_ROWS) });
  });
}

async function documentHasNoHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
}

function formCard(page: Page) {
  return page.getByRole("heading", { name: "กรอกข้อมูล" }).locator("..");
}

function formInputs(page: Page) {
  return formCard(page).locator("input");
}

test.describe("ENV-MOBILE-003 Water Supply mobile regression", () => {
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
    await page.screenshot({ path: `${VISUAL_DIR}/water-supply-360.png`, fullPage: true });
  });

  test("phone save and delete actions meet the 44 px touch minimum", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/water-supply");

    const actions = [
      page.getByRole("button", { name: "บันทึก", exact: true }),
      page.getByRole("button", { name: "ลบ", exact: true }),
    ];
    for (const [index, action] of actions.entries()) {
      const box = await action.boundingBox();
      expect(box).not.toBeNull();
      expect.soft(box!.width, `action ${index + 1} width=${box!.width}px`).toBeGreaterThanOrEqual(44);
      expect.soft(box!.height, `action ${index + 1} height=${box!.height}px`).toBeGreaterThanOrEqual(44);
    }
  });

  test("existing recent-record table remains locally contained without document overflow", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/water-supply");

    const table = page.locator("table");
    await expect(table).toHaveCount(1);
    const wrapper = table.locator("..");
    const metrics = await wrapper.evaluate((el) => ({ clientWidth: el.clientWidth, scrollWidth: el.scrollWidth }));
    expect(metrics.scrollWidth).toBeGreaterThanOrEqual(metrics.clientWidth);
    expect(await documentHasNoHorizontalOverflow(page)).toBe(true);
  });

  test("390 and 430 px keep one-column phone composition", async ({ authed: page }) => {
    for (const [label, viewport] of [["390", { width: 390, height: 844 }], ["430", PHONE_430]] as const) {
      await page.setViewportSize(viewport);
      await page.goto("/water-supply");
      const inputs = formInputs(page);
      const first = await inputs.nth(0).boundingBox();
      const second = await inputs.nth(1).boundingBox();
      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      expect(Math.abs(first!.x - second!.x), `${label}px should remain one column`).toBeLessThan(8);
      expect(await documentHasNoHorizontalOverflow(page)).toBe(true);
      await page.screenshot({ path: `${VISUAL_DIR}/water-supply-${label}.png`, fullPage: true });
    }
  });

  test("tablet and desktop preserve useful multi-column form density", async ({ authed: page }) => {
    for (const [label, viewport] of [["768", TABLET], ["1024", DESKTOP]] as const) {
      await page.setViewportSize(viewport);
      await page.goto("/water-supply");
      const inputs = formInputs(page);
      const first = await inputs.nth(0).boundingBox();
      const second = await inputs.nth(1).boundingBox();
      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      expect(Math.abs(first!.x - second!.x), `${label}px should preserve multi-column density`).toBeGreaterThan(80);
      await page.screenshot({ path: `${VISUAL_DIR}/water-supply-${label}.png`, fullPage: true });
    }
  });

  test("save error preserves entered values and retry sends the same Water Supply semantics", async ({ authed: page }) => {
    const posts: string[] = [];
    await page.unroute("**/rest/v1/daily_check**");
    await mockWaterSupplyDependencies(page, { failPostOnce: true, posts });

    await page.setViewportSize(PHONE_430);
    await page.goto("/water-supply");
    const inputs = formInputs(page);
    await inputs.nth(1).fill("7.4");
    await inputs.nth(2).fill("0.6");
    await inputs.nth(3).fill("1.5");
    await inputs.nth(4).fill("ไม่พบ E2E");

    const save = page.getByRole("button", { name: "บันทึก", exact: true });
    await save.click();
    await expect(page.getByRole("status").filter({ hasText: "ผิดพลาด: E2E water save failure" })).toBeVisible();
    await expect(inputs.nth(1)).toHaveValue("7.4");
    await expect(inputs.nth(2)).toHaveValue("0.6");
    await expect(inputs.nth(3)).toHaveValue("1.5");
    await expect(inputs.nth(4)).toHaveValue("ไม่พบ E2E");

    await save.click();
    await expect(page.getByRole("status").filter({ hasText: "บันทึกสำเร็จ" })).toBeVisible();
    expect(posts).toHaveLength(2);
    const retryPayload = JSON.parse(posts[1]) as Record<string, unknown>;
    expect(retryPayload.ph).toBe(7.4);
    expect(retryPayload.free_chlorine_residual).toBe(0.6);
    expect(retryPayload.turbidity).toBe(1.5);
    expect(retryPayload.total_coliform).toBe("ไม่พบ E2E");
  });
});

test.describe("ENV-MOBILE-003 real touch context", () => {
  const { defaultBrowserType: _browserType, ...pixel7Touch } = devices["Pixel 7"];
  test.use(pixel7Touch);

  test("tap path records representative Water Supply values without changing payload semantics", async ({ authed: page }) => {
    const posts: string[] = [];
    await mockWaterSupplyDependencies(page, { posts });
    await page.goto("/water-supply");

    const inputs = formInputs(page);
    await inputs.nth(1).fill("7.1");
    await inputs.nth(4).fill("ไม่พบ");
    await page.getByRole("button", { name: "บันทึก", exact: true }).tap();
    await expect(page.getByRole("status").filter({ hasText: "บันทึกสำเร็จ" })).toBeVisible();

    expect(posts).toHaveLength(1);
    const payload = JSON.parse(posts[0]) as Record<string, unknown>;
    expect(payload.ph).toBe(7.1);
    expect(payload.total_coliform).toBe("ไม่พบ");
    expect(await documentHasNoHorizontalOverflow(page)).toBe(true);
  });
});
