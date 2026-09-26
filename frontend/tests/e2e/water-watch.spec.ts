import { test, expect } from "./fixtures";

test("public Water Watch hospital display fits one 1920x1080 viewport and stays explicitly simulated", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/water-watch");

  const dashboard = page.getByTestId("water-watch-dashboard");
  const disclosure = page.getByTestId("water-watch-simulated-banner");

  await expect(dashboard).toBeVisible();
  await expect(disclosure).toContainText("SIMULATED");
  await expect(disclosure).toContainText("ไม่ใช่สถานการณ์น้ำจริง");
  await expect(page.getByRole("heading", { name: "สถานการณ์น้ำ พื้นที่อำเภออุทัย" })).toBeVisible();

  const geometry = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    documentWidth: document.documentElement.scrollWidth,
    documentHeight: document.documentElement.scrollHeight,
    bodyWidth: document.body.scrollWidth,
    bodyHeight: document.body.scrollHeight,
  }));

  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.bodyWidth).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.documentHeight).toBeLessThanOrEqual(geometry.viewportHeight);
  expect(geometry.bodyHeight).toBeLessThanOrEqual(geometry.viewportHeight);
});

test("Water Watch mobile puts situation first and has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/water-watch");

  await expect(page.getByTestId("water-watch-simulated-banner")).toBeVisible();
  await expect(page.getByText("สถานการณ์จำลอง (อุทัย)")).toBeVisible();
  await expect(page.getByText("สรุปสำหรับประชาชน")).toBeVisible();

  const geometry = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));

  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewport);
  expect(geometry.bodyWidth).toBeLessThanOrEqual(geometry.viewport);
});

test("Water Watch does not require an authenticated app route", async ({ page }) => {
  await page.goto("/water-watch");
  await expect(page).not.toHaveURL(/\/login(?:$|[?#])/);
  await expect(page.getByTestId("water-watch-dashboard")).toBeVisible();
});
