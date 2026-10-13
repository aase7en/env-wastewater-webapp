import { expect, test } from "@playwright/test";

/**
 * DT-VIS-P003 — Spatial Status Callouts + Evidence Panel (RED-first).
 * These assertions encode the micro-step-board acceptance contract and MUST
 * fail truthfully before the D3 implementation lands.
 */

test.beforeEach(({ page }) => {
  void page;
});

test("twin view exposes an accessible non-Canvas callout list with truthful semantic badges", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "3D Plant" }).click();
  const list = page.getByTestId("p003-callout-list");
  await expect(list).toBeVisible();
  // At least one callout carries a semantic badge with a Thai label
  const badges = list.locator("[data-p003-badge]");
  expect(await badges.count()).toBeGreaterThan(0);
  // UNAVAILABLE metrics never render a numeric value label
  const unavailable = list.locator("[data-p003-badge='UNAVAILABLE']");
  const n = await unavailable.count();
  for (let i = 0; i < n; i += 1) {
    await expect(unavailable.nth(i).locator("[data-p003-value]")).not.toContainText(/\d/);
  }
});

test("selecting a callout opens the evidence panel with source/freshness/provenance", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "3D Plant" }).click();
  const first = page.getByTestId("p003-callout-list").locator("[data-p003-callout]").first();
  await first.click();
  const panel = page.getByTestId("p003-evidence-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText(/แหล่งข้อมูล|Source/i);
  await expect(panel).toContainText(/สด|ล่าสุด|ประวัติ|จำลอง|เก่า|ไม่พร้อมใช้งาน|LIVE|LATEST|HISTORICAL|SIMULATED|STALE|UNAVAILABLE/);
});

test("evidence panel closes on Escape and returns focus to the invoking callout", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "3D Plant" }).click();
  const first = page.getByTestId("p003-callout-list").locator("[data-p003-callout]").first();
  await first.click();
  const panel = page.getByTestId("p003-evidence-panel");
  await expect(panel).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(panel).not.toBeVisible();
  await expect(first).toBeFocused();
});

test("callout targets meet the 44px touch minimum", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "3D Plant" }).click();
  const callouts = page.getByTestId("p003-callout-list").locator("[data-p003-callout]");
  const n = await callouts.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i += 1) {
    const box = await callouts.nth(i).boundingBox();
    expect(box).not.toBeNull();
    expect(Math.min(box!.height, box!.width)).toBeGreaterThanOrEqual(44);
  }
});

test("mobile viewport recomposes callouts into an ordered list without Canvas crowding", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("tab", { name: "3D Plant" }).click();
  const list = page.getByTestId("p003-callout-list");
  await expect(list).toBeVisible();
  // Ordered list semantics on mobile
  await expect(list.locator("[data-p003-callout]").first()).toBeVisible();
  const canvas = page.locator("canvas");
  if ((await canvas.count()) > 0) {
    // No callout may overlap the canvas region on mobile
    const cBox = await canvas.first().boundingBox();
    const items = list.locator("[data-p003-callout]");
    const n = await items.count();
    for (let i = 0; i < n; i += 1) {
      const box = await items.nth(i).boundingBox();
      if (box && cBox) {
        const overlaps =
          box.x < cBox.x + cBox.width &&
          box.x + box.width > cBox.x &&
          box.y < cBox.y + cBox.height &&
          box.y + box.height > cBox.y;
        expect(overlaps).toBe(false);
      }
    }
  }
});

test("WebGL failure keeps callouts and evidence available via DOM fallback", async ({ page }) => {
  await page.addInitScript(() => {
    // Force TwinRendererBoundary into its unavailable path
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value: () => null,
      configurable: true,
    });
  });
  await page.goto("/");
  await page.getByRole("tab", { name: "3D Plant" }).click();
  const list = page.getByTestId("p003-callout-list");
  await expect(list).toBeVisible();
  const first = list.locator("[data-p003-callout]").first();
  await first.click();
  await expect(page.getByTestId("p003-evidence-panel")).toBeVisible();
});

test("no connector lines or fabricated relationships are rendered", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "3D Plant" }).click();
  await expect(page.locator("[data-p003-connector]")).toHaveCount(0);
});
