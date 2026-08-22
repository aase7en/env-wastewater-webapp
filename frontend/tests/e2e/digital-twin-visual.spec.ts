import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

const DASHBOARD_ROW = {
  reading_date: "2026-08-14",
  do_average: 4.5,
  ph: 7.2,
  free_chlorine: 0.8,
  tds_aeration: 420,
  water_used_total: 100,
  wastewater_in: 80,
  system_operating: true,
  wastewater_discharged: true,
  do_alert: false,
  chlorine_alert: false,
  ph_alert: false,
};

async function mockDashboard(page: Page) {
  await page.route("**/rest/v1/v_dashboard_14day**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([DASHBOARD_ROW]),
    });
  });
}

async function waitForTwinReady(page: Page) {
  await expect(page.getByTestId("dashboard-twin-panel")).toHaveAttribute(
    "data-twin-status",
    "ready",
    { timeout: 30_000 },
  );
}

async function captureEvidence(page: Page, name: string) {
  if (!process.env.DT_VIS_EVIDENCE) return;
  await page.screenshot({
    path: `../docs/review-evidence/dt-vis-p001/${name}.png`,
    fullPage: false,
    animations: "disabled",
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
}

test.describe("DT-VIS-P001 visual acceptance", () => {
  test("desktop latest/unknown, dark theme, and simulation stay readable", async ({ authed: page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await mockDashboard(page);
    await page.goto("/dashboard");
    await waitForTwinReady(page);

    await expect(page.getByText("บันทึกล่าสุด", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("ระดับน้ำ: ไม่มีข้อมูล")).toBeVisible();
    await expect(page.getByTestId("twin-canvas-shell")).toHaveAttribute(
      "data-aerator-running",
      "unknown",
    );
    await expectNoHorizontalOverflow(page);
    await captureEvidence(page, "after-desktop-light");

    await page.getByRole("button", { name: /สลับเป็นโหมด/ }).click();
    await expectNoHorizontalOverflow(page);
    await captureEvidence(page, "after-desktop-dark");

    await page.getByRole("button", { name: "เปิดข้อมูลจำลอง" }).click();
    await expect(page.getByText("SIMULATION — ข้อมูลจำลอง")).toBeVisible();
    await expect(page.getByTestId("twin-canvas-shell")).toHaveAttribute(
      "data-aerator-running",
      "true",
    );
    await captureEvidence(page, "after-simulation");
  });

  test("mobile 360px keeps the twin shell inside the viewport", async ({ authed: page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await mockDashboard(page);
    await page.goto("/dashboard");
    await waitForTwinReady(page);

    await expectNoHorizontalOverflow(page);
    const shell = page.getByTestId("twin-canvas-shell");
    await expect(shell).toBeVisible();
    const box = await shell.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(360);
    await captureEvidence(page, "after-mobile-360");
  });

  test("reduced motion remains a still usable composition", async ({ authed: page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1024, height: 900 });
    await mockDashboard(page);
    await page.goto("/dashboard");
    await waitForTwinReady(page);

    await expect(page.getByTestId("twin-canvas-shell")).toHaveAttribute(
      "data-reduced-motion",
      "true",
    );
    await page.getByTestId("twin-asset-button").click();
    await expect(page.getByTestId("twin-data-panel")).toBeVisible();
    await captureEvidence(page, "after-reduced-motion");
  });

  test("context loss preserves fallback and Process recovery", async ({ authed: page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await mockDashboard(page);
    await page.goto("/dashboard");
    await waitForTwinReady(page);

    await page.locator("canvas").evaluate((canvas) => {
      canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
    });
    await expect(page.getByRole("heading", { name: "ไม่สามารถเปิดมุมมอง 3D ได้" })).toBeVisible();
    await captureEvidence(page, "after-context-loss-fallback");

    await page.getByRole("button", { name: "เปิดแผนผังกระบวนการ" }).click();
    await expect(page.getByRole("tab", { name: "Process" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await captureEvidence(page, "after-process");
  });
});
