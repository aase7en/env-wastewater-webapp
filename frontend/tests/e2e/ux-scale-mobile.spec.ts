import { test, expect } from "./fixtures";
import type { Locator, Page } from "@playwright/test";

const MOBILE = { width: 360, height: 800 };

async function mockMobileHeaderData(page: Page) {
  // Keep the authenticated admin identity while serving an empty pending queue.
  await page.unroute("**/rest/v1/app_user**");
  await page.route("**/rest/v1/app_user**", async (route) => {
    const req = route.request();
    const url = req.url();
    if (!url.includes("role=eq.pending")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "00000000-0000-0000-0000-0000000000aa",
            role: "admin",
            display_name: "E2E Admin",
            is_active: true,
          },
        ]),
      });
      return;
    }

    const headers: Record<string, string> = {};
    const requestHeaders = req.headers();
    const isCount =
      (requestHeaders["prefer"] ?? "").includes("count=") ||
      (requestHeaders["range"] ?? "") === "0-0";
    if (isCount) headers["content-range"] = "*/0";
    await route.fulfill({
      status: isCount ? 206 : 200,
      contentType: "application/json",
      headers,
      body: "[]",
    });
  });

  // NotificationBell only needs deterministic empty alert responses here;
  // this spec verifies placement, not alert-data behavior.
  await page.route("**/rest/v1/threshold_alert**", async (route) => {
    const req = route.request();
    const headers: Record<string, string> = {};
    const requestHeaders = req.headers();
    const isCount = (requestHeaders["prefer"] ?? "").includes("count=");
    if (isCount) headers["content-range"] = "*/0";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers,
      body: "[]",
    });
  });
}

async function expectInsideViewport(locator: Locator, page: Page) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);
}

async function captureEvidence(page: Page, name: string) {
  const phase = process.env.PR15_EVIDENCE;
  if (!phase) return;
  await page.screenshot({
    path: `../docs/review-evidence/pr-15/${phase}-${name}.png`,
    fullPage: false,
  });
}

test.describe("WO-UX-SCALE-001 mobile header remediation", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE);
  });

  test("brand target is at least 44x44 and header does not overflow at 360px", async ({ authedAdmin: page }) => {
    await mockMobileHeaderData(page);
    await page.goto("/dashboard");

    const brand = page.getByRole("link", { name: /UTH\[AI\]-ENV/ });
    await captureEvidence(page, "mobile-header");
    const box = await brand.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);

    const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(noOverflow).toBe(true);

    await page.getByRole("button", { name: /สลับเป็นโหมด/ }).click();
    const noOverflowOtherTheme = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(noOverflowOtherTheme).toBe(true);
  });

  test("both bell panels stay fully inside the 360px viewport", async ({ authedAdmin: page }) => {
    await mockMobileHeaderData(page);
    await page.goto("/dashboard");

    const notificationButton = page.locator('button[aria-label^="การแจ้งเตือน"]').first();
    await notificationButton.click();
    const notificationPanel = page
      .locator(".aura-card")
      .filter({ hasText: "การแจ้งเตือนค่าเกินเกณฑ์" })
      .first();
    await captureEvidence(page, "notification-panel");
    await expectInsideViewport(notificationPanel, page);
    await page.keyboard.press("Escape");
    await expect(notificationPanel).toBeHidden();

    const pendingButton = page.locator('button[aria-label^="ผู้ใช้รออนุมัติ"]').first();
    await pendingButton.click();
    const pendingPanel = page.locator(".aura-card").filter({ hasText: "ผู้ใช้รออนุมัติ" }).first();
    await captureEvidence(page, "pending-panel");
    await expectInsideViewport(pendingPanel, page);
  });
});
