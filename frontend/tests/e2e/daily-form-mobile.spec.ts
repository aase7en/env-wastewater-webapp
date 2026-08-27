import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

const PHONE = { width: 360, height: 800 };

async function mockDailyFormDependencies(page: Page) {
  await page.route("**/rest/v1/equipment**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });

  await page.route("**/rest/v1/threshold_alert**", async (route) => {
    const headers: Record<string, string> = {};
    if ((route.request().headers()["prefer"] ?? "").includes("count=")) {
      headers["content-range"] = "*/0";
    }
    await route.fulfill({ status: 200, contentType: "application/json", headers, body: "[]" });
  });

  await page.route("**/rest/v1/repair_request**", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ id: "22222222-3333-4444-5555-666666666666", status: "open" }),
    });
  });
}

test.describe("ENV-MOBILE-001 daily form on phone", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(PHONE);
  });

  test("dense water-quality fields recompose into one column with no page overflow", async ({ authed: page }) => {
    await mockDailyFormDependencies(page);
    await page.goto("/form");

    await page.getByRole("button", { name: /คุณภาพน้ำ/ }).click();
    const section = page.getByRole("button", { name: /คุณภาพน้ำ/ }).locator("..");
    const numericInputs = section.locator('input[type="number"]');
    await expect(numericInputs).toHaveCount(9);

    const first = await numericInputs.nth(0).boundingBox();
    const second = await numericInputs.nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();

    // Phone contract: dense measurement controls stack rather than being
    // squeezed into half-width desktop columns.
    expect(Math.abs(first!.x - second!.x)).toBeLessThanOrEqual(2);
    expect(second!.y).toBeGreaterThan(first!.y + first!.height);

    const noOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(noOverflow).toBe(true);
  });

  test("desktop keeps the useful two-column measurement density", async ({ authed: page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await mockDailyFormDependencies(page);
    await page.goto("/form");

    await page.getByRole("button", { name: /คุณภาพน้ำ/ }).click();
    const section = page.getByRole("button", { name: /คุณภาพน้ำ/ }).locator("..");
    const numericInputs = section.locator('input[type="number"]');
    const first = await numericInputs.nth(0).boundingBox();
    const second = await numericInputs.nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(Math.abs(first!.y - second!.y)).toBeLessThanOrEqual(2);
    expect(second!.x).toBeGreaterThan(first!.x + first!.width);
  });

  test("phone workflow preserves values, validates abnormal cause, and can save", async ({ authed: page }) => {
    await mockDailyFormDependencies(page);

    let postedBody = "";
    await page.route("**/rest/v1/reading**", async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      postedBody = route.request().postData() ?? "";
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "11111111-2222-3333-4444-555555555555",
          reading_date: "2026-08-27",
          system_operating: false,
          do_aeration: 2.5,
          free_chlorine: 1.0,
        }),
      });
    });

    await page.goto("/form");

    // Mark the system abnormal and prove the required-cause validation stays
    // visible on the phone before any network write.
    await page.locator('label:has-text("ระบบทำงานปกติ")').click();
    await page.getByRole("button", { name: "บันทึก", exact: true }).click();
    await expect(page.getByText("กรุณาระบุสาเหตุที่ระบบผิดปกติ")).toBeVisible();
    expect(postedBody).toBe("");

    await page.locator("#abnormal_cause").fill("ทดสอบปั๊มหยุดทำงาน");

    await page.getByRole("button", { name: /คุณภาพน้ำ/ }).click();
    const quality = page.getByRole("button", { name: /คุณภาพน้ำ/ }).locator("..");
    const measurements = quality.locator('input[type="number"]');
    await measurements.nth(0).fill("2.5");
    await measurements.nth(8).fill("1.0");

    // Accordion/scroll interaction must not discard entered data.
    await page.getByRole("button", { name: /คลอรีนและสารเคมี/ }).click();
    await expect(measurements.nth(0)).toHaveValue("2.5");
    await expect(page.locator("#abnormal_cause")).toHaveValue("ทดสอบปั๊มหยุดทำงาน");

    await page.getByRole("button", { name: /หมายเหตุ/ }).click();
    const finalNote = page.getByRole("textbox").last();
    await finalNote.scrollIntoViewIfNeeded();

    const submit = page.getByRole("button", { name: "บันทึก", exact: true });
    await expect(submit).toBeVisible();
    const submitBox = await submit.boundingBox();
    const noteBox = await finalNote.boundingBox();
    expect(submitBox).not.toBeNull();
    expect(noteBox).not.toBeNull();
    expect(submitBox!.x).toBeGreaterThanOrEqual(0);
    expect(submitBox!.x + submitBox!.width).toBeLessThanOrEqual(PHONE.width);
    expect(noteBox!.y + noteBox!.height).toBeLessThanOrEqual(submitBox!.y);

    await submit.click();
    await expect(page.getByText("บันทึกรายการสำเร็จ")).toBeVisible();
    const posted = JSON.parse(postedBody) as Record<string, unknown>;
    expect(posted.do_aeration).toBe("2.5");
    expect(posted.free_chlorine).toBe("1.0");
    expect(posted.system_operating).toBe(false);
  });
});
