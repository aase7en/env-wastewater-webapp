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

test.describe("Operational Digital Twin Phase 1", () => {
  test("defaults to 3D, preserves unknown telemetry, and switches to Process", async ({ authed: page }) => {
    await mockDashboard(page);
    await page.goto("/dashboard");

    await expect(page.getByRole("tab", { name: "3D Plant" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("heading", { name: /Digital Twin/ })).toBeVisible();
    await expect(page.getByText("บันทึกล่าสุด", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("LIVE", { exact: true })).toHaveCount(0);

    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error("Digital Twin canvas has no layout box");
    await canvas.click({ position: { x: canvasBox.width / 2, y: canvasBox.height / 2 } });
    const panel = page.getByTestId("twin-data-panel");
    await expect(panel).toBeVisible();
    await expect(panel.getByText("4.50 mg/L")).toBeVisible();
    await expect(panel.getByText("ไม่มีข้อมูล", { exact: true })).toHaveCount(3);

    await page.getByRole("tab", { name: "3D Plant" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Process" })).toBeFocused();
    await expect(page.locator("svg g[role='button']")).toHaveCount(5);
  });

  test("labels demo values as simulation and exposes the aerator-running state", async ({ authed: page }) => {
    await mockDashboard(page);
    await page.goto("/dashboard");

    await page.getByRole("button", { name: "เปิดข้อมูลจำลอง" }).click();
    await expect(page.getByText("SIMULATION — ข้อมูลจำลอง")).toBeVisible();
    await expect(page.getByText("สถานการณ์สาธิต ไม่ใช่ข้อมูลจากระบบจริง")).toBeVisible();
    await expect(page.getByTestId("twin-canvas-shell")).toHaveAttribute("data-aerator-running", "true");
    const firstBubbleFrame = await page.locator("canvas").screenshot();
    await page.waitForTimeout(300);
    const secondBubbleFrame = await page.locator("canvas").screenshot();
    expect(firstBubbleFrame.equals(secondBubbleFrame)).toBe(false);

    await page.getByTestId("twin-asset-button").click();
    const panel = page.getByTestId("twin-data-panel");
    await expect(panel.getByText("68 %")).toBeVisible();
    await expect(panel.getByText("ทำงาน")).toBeVisible();
    await expect(panel.getByText("ข้อมูลจำลอง", { exact: true })).toHaveCount(5);

    await page.getByRole("button", { name: "กลับสู่ข้อมูลล่าสุด" }).click();
    await expect(page.getByText("SIMULATION — ข้อมูลจำลอง")).toHaveCount(0);
    await expect(page.getByTestId("twin-canvas-shell")).toHaveAttribute("data-aerator-running", "unknown");
  });

  test("honors reduced motion without removing interaction", async ({ authed: page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mockDashboard(page);
    await page.goto("/dashboard");

    await expect(page.getByTestId("twin-canvas-shell")).toHaveAttribute("data-reduced-motion", "true");
    await page.getByTestId("twin-asset-button").click();
    await expect(page.getByTestId("twin-data-panel")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("twin-data-panel")).toHaveCount(0);
    await expect(page.getByTestId("twin-asset-button")).toBeFocused();
  });
});
