import { test, expect } from "./fixtures";
import { devices, type Page } from "@playwright/test";
import type { FuelInput } from "../../src/lib/fuel";

/**
 * ENV-MOBILE-004 — Fuel mobile convergence.
 *
 * Synthetic rows/values are deterministic layout and interaction evidence only,
 * never production fuel data. Fuel data/import/carbon/schema semantics are
 * intentionally read-only for this work order.
 */

const PHONE = { width: 360, height: 800 };
const PHONE_430 = { width: 430, height: 900 };
const TABLET = { width: 768, height: 1024 };
const DESKTOP = { width: 1024, height: 900 };
const VISUAL_DIR = "test-results";

const FUEL_FIELDS = [
  ["วันที่", "fuel-log-date"],
  ["ประเภท", "fuel-type"],
  ["ปริมาณ (L)", "fuel-litres"],
  ["มิเตอร์ก่อน", "fuel-meter-before"],
  ["มิเตอร์หลัง", "fuel-meter-after"],
  ["ทะเบียนรถ", "fuel-vehicle-id"],
  ["ไมล์", "fuel-odometer"],
  ["วัตถุประสงค์", "fuel-purpose"],
  ["ราคา (บาท)", "fuel-cost-baht"],
  ["Supplier", "fuel-supplier"],
  ["หมายเหตุ", "fuel-note"],
] as const;

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

interface FuelMockOptions {
  failPostOnce?: boolean;
  posts?: string[];
}

async function mockFuelDependencies(page: Page, options: FuelMockOptions = {}) {
  let postCount = 0;

  await page.route("**/rest/v1/role_module_visibility**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.route("**/rest/v1/threshold_alert**", async (route) => {
    const headers: Record<string, string> = {};
    if ((route.request().headers()["prefer"] ?? "").includes("count=")) headers["content-range"] = "*/0";
    await route.fulfill({ status: 200, contentType: "application/json", headers, body: "[]" });
  });
  await page.route("**/rest/v1/dispense_log**", async (route) => {
    if (route.request().method() === "POST") {
      postCount += 1;
      options.posts?.push(route.request().postData() ?? "");
      if (options.failPostOnce && postCount === 1) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ message: "E2E fuel save failure", code: "E2E" }),
        });
        return;
      }
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(FUEL_ROWS[0]) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(FUEL_ROWS) });
  });
}

async function documentHasNoHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
}

test.describe("ENV-MOBILE-004 Fuel mobile regression", () => {
  test.beforeEach(async ({ authed: page }) => {
    await mockFuelDependencies(page);
  });

  test("360 px form controls stack into one phone column and page stays contained", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/fuel");
    await expect(page.getByRole("heading", { name: "การใช้เชื้อเพลิง" })).toBeVisible();

    const first = await page.getByLabel("วันที่", { exact: true }).boundingBox();
    const second = await page.getByLabel("ประเภท", { exact: true }).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    const xDelta = Math.abs(first!.x - second!.x);

    expect.soft(xDelta, `Fuel form x delta=${xDelta}px; expected one phone column`).toBeLessThan(8);
    expect.soft(await documentHasNoHorizontalOverflow(page)).toBe(true);
    await page.screenshot({ path: `${VISUAL_DIR}/fuel-360.png`, fullPage: true });
  });

  test("phone save and delete actions meet the 44 px touch minimum", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/fuel");

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

  test("history table remains contained without document-level horizontal overflow", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/fuel");
    await expect(page.locator("table")).toHaveCount(1);
    expect(await documentHasNoHorizontalOverflow(page)).toBe(true);
  });

  test("390 and 430 px keep one-column phone composition", async ({ authed: page }) => {
    for (const [label, viewport] of [["390", { width: 390, height: 844 }], ["430", PHONE_430]] as const) {
      await page.setViewportSize(viewport);
      await page.goto("/fuel");
      const first = await page.getByLabel("วันที่", { exact: true }).boundingBox();
      const second = await page.getByLabel("ประเภท", { exact: true }).boundingBox();
      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      expect(Math.abs(first!.x - second!.x), `${label}px should remain one column`).toBeLessThan(8);
      expect(await documentHasNoHorizontalOverflow(page)).toBe(true);
      await page.screenshot({ path: `${VISUAL_DIR}/fuel-${label}.png`, fullPage: true });
    }
  });

  test("tablet and desktop preserve useful multi-column form density", async ({ authed: page }) => {
    for (const [label, viewport] of [["768", TABLET], ["1024", DESKTOP]] as const) {
      await page.setViewportSize(viewport);
      await page.goto("/fuel");
      const first = await page.getByLabel("วันที่", { exact: true }).boundingBox();
      const second = await page.getByLabel("ประเภท", { exact: true }).boundingBox();
      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      expect(Math.abs(first!.x - second!.x), `${label}px should preserve multi-column density`).toBeGreaterThan(80);
      await page.screenshot({ path: `${VISUAL_DIR}/fuel-${label}.png`, fullPage: true });
    }
  });

  test("save error preserves values and retry sends unchanged Fuel payload semantics", async ({ authed: page }) => {
    const posts: string[] = [];
    await page.unroute("**/rest/v1/dispense_log**");
    await mockFuelDependencies(page, { failPostOnce: true, posts });

    await page.setViewportSize(PHONE_430);
    await page.goto("/fuel");
    await page.getByLabel("วันที่", { exact: true }).fill("2026-08-28");
    await page.getByLabel("ปริมาณ (L)", { exact: true }).fill("10");
    await page.getByLabel("มิเตอร์ก่อน", { exact: true }).fill("100");
    await page.getByLabel("มิเตอร์หลัง", { exact: true }).fill("110");
    await page.getByLabel("ทะเบียนรถ", { exact: true }).fill("E2E-RETRY-01");
    await page.getByLabel("วัตถุประสงค์", { exact: true }).fill("งานทดสอบ E2E");
    const note = page.getByLabel("หมายเหตุ", { exact: true });
    await note.fill("synthetic retry evidence");

    const expectedFuelInput = {
      log_date: "2026-08-28",
      fuel_type: "diesel",
      litres: 10,
      meter_before: 100,
      meter_after: 110,
      vehicle_or_use: null,
      vehicle_id: "E2E-RETRY-01",
      odometer: null,
      purpose: "งานทดสอบ E2E",
      cost_baht: null,
      supplier: null,
      note: "synthetic retry evidence",
    } satisfies FuelInput;

    const save = page.getByRole("button", { name: "บันทึก", exact: true });
    await save.click();
    await expect(page.getByRole("status").filter({ hasText: "ผิดพลาด: E2E fuel save failure" })).toBeVisible();
    await expect(page.getByLabel("ปริมาณ (L)", { exact: true })).toHaveValue("10");
    await expect(page.getByLabel("มิเตอร์ก่อน", { exact: true })).toHaveValue("100");
    await expect(page.getByLabel("มิเตอร์หลัง", { exact: true })).toHaveValue("110");
    await expect(page.getByLabel("ทะเบียนรถ", { exact: true })).toHaveValue("E2E-RETRY-01");
    await expect(page.getByLabel("วัตถุประสงค์", { exact: true })).toHaveValue("งานทดสอบ E2E");
    await expect(note).toHaveValue("synthetic retry evidence");
    expect(posts).toHaveLength(1);
    const failedPayload = JSON.parse(posts[0]) as Record<string, unknown>;
    expect(failedPayload).toEqual(expectedFuelInput);

    await save.click();
    await expect(page.getByRole("status").filter({ hasText: "บันทึกสำเร็จ" })).toBeVisible();
    expect(posts).toHaveLength(2);
    const retryPayload = JSON.parse(posts[1]) as Record<string, unknown>;
    expect(retryPayload).toEqual(expectedFuelInput);
    expect(retryPayload).toEqual(failedPayload);
  });

  test("meter delta mismatch remains visible and confirm controls whether save proceeds", async ({ authed: page }) => {
    const posts: string[] = [];
    await page.unroute("**/rest/v1/dispense_log**");
    await mockFuelDependencies(page, { posts });

    await page.setViewportSize(PHONE_430);
    await page.goto("/fuel");
    await page.getByLabel("ปริมาณ (L)", { exact: true }).fill("8");
    await page.getByLabel("มิเตอร์ก่อน", { exact: true }).fill("100");
    await page.getByLabel("มิเตอร์หลัง", { exact: true }).fill("110");

    await expect(page.getByText(/meter delta \(10\).*litres \(8\).*diff=2/)).toBeVisible();

    page.once("dialog", async (dialog) => {
      expect(dialog.type()).toBe("confirm");
      expect(dialog.message()).toContain("meter delta (10) ≠ litres (8)");
      await dialog.dismiss();
    });
    await page.getByRole("button", { name: "บันทึก", exact: true }).click();
    expect(posts).toHaveLength(0);

    page.once("dialog", async (dialog) => {
      expect(dialog.type()).toBe("confirm");
      await dialog.accept();
    });
    await page.getByRole("button", { name: "บันทึก", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "บันทึกสำเร็จ" })).toBeVisible();
    expect(posts).toHaveLength(1);
  });

  test("all Fuel controls have semantic labels with stable page-local IDs", async ({ authed: page }) => {
    await page.setViewportSize(PHONE_430);
    await page.goto("/fuel");

    for (const [label, id] of FUEL_FIELDS) {
      const control = page.getByLabel(label, { exact: true });
      await expect(control).toHaveCount(1);
      await expect(control).toBeVisible();
      await expect(control).toHaveAttribute("id", id);
      await expect(control).toHaveAccessibleName(label);
    }
  });

  test("keyboard tab order reaches every Fuel control and Enter activates save", async ({ authed: page }) => {
    const posts: string[] = [];
    await page.unroute("**/rest/v1/dispense_log**");
    await mockFuelDependencies(page, { posts });

    await page.setViewportSize(PHONE_430);
    await page.goto("/fuel");
    await page.getByLabel("วันที่", { exact: true }).fill("2026-08-28");
    await page.getByLabel("ปริมาณ (L)", { exact: true }).fill("5");
    await page.getByLabel("มิเตอร์ก่อน", { exact: true }).fill("300");
    await page.getByLabel("มิเตอร์หลัง", { exact: true }).fill("305");

    const save = page.getByRole("button", { name: "บันทึก", exact: true });
    const focusOrder = [
      ...FUEL_FIELDS.map(([label]) => page.getByLabel(label, { exact: true })),
      save,
    ];
    await focusOrder[0].focus();
    await expect(focusOrder[0]).toBeFocused();

    // Chromium's native date control can retain host focus while Tab moves
    // through its internal segments. Before advancing, focus may remain only
    // on that date host; all remaining Fuel controls require one exact Tab.
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await page.keyboard.press("Tab");
      if (await focusOrder[1].evaluate((element) => element === document.activeElement)) break;
      await expect(focusOrder[0]).toBeFocused();
    }
    await expect(focusOrder[1]).toBeFocused();

    for (let index = 1; index < focusOrder.length - 1; index += 1) {
      await expect(focusOrder[index]).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(focusOrder[index + 1]).toBeFocused();
    }

    await expect(save).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "บันทึกสำเร็จ" })).toBeVisible();
    expect(posts).toHaveLength(1);
  });
});

test.describe("ENV-MOBILE-004 real touch context", () => {
  const { defaultBrowserType: _browserType, ...pixel7Touch } = devices["Pixel 7"];
  test.use(pixel7Touch);

  test("tap path records a valid synthetic Fuel row without changing payload semantics", async ({ authed: page }) => {
    const posts: string[] = [];
    await mockFuelDependencies(page, { posts });
    await page.goto("/fuel");

    await page.getByLabel("ปริมาณ (L)", { exact: true }).fill("5");
    await page.getByLabel("มิเตอร์ก่อน", { exact: true }).fill("200");
    await page.getByLabel("มิเตอร์หลัง", { exact: true }).fill("205");
    await page.getByLabel("ทะเบียนรถ", { exact: true }).fill("E2E-TOUCH-01");
    await page.getByRole("button", { name: "บันทึก", exact: true }).tap();
    await expect(page.getByRole("status").filter({ hasText: "บันทึกสำเร็จ" })).toBeVisible();

    expect(posts).toHaveLength(1);
    const payload = JSON.parse(posts[0]) as Record<string, unknown>;
    expect(payload.fuel_type).toBe("diesel");
    expect(payload.litres).toBe(5);
    expect(payload.meter_before).toBe(200);
    expect(payload.meter_after).toBe(205);
    expect(payload.vehicle_id).toBe("E2E-TOUCH-01");
    expect(await documentHasNoHorizontalOverflow(page)).toBe(true);
  });
});
