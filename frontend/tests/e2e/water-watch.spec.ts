import { test, expect, type Page } from "./fixtures";

const STATION_IDS = [
  "demo-upstream",
  "demo-ayutthaya",
  "demo-uthai",
  "demo-bang-pa-in",
  "demo-bang-sai",
] as const;

/**
 * Prove the rendered station cards themselves stay visible, pairwise
 * non-overlapping, and fully contained in the river section. The old test
 * only compared document scrollWidth, which `overflow-hidden` could satisfy
 * while station content was actually clipped.
 */
async function expectStationGeometry(page: Page, testidPrefix: string) {
  const section = page.locator('section[aria-labelledby="water-watch-river-title"]');
  const sectionBox = await section.boundingBox();
  expect(sectionBox).toBeTruthy();

  const boxes = [];
  for (const id of STATION_IDS) {
    const station = page.getByTestId(`${testidPrefix}${id}`);
    await expect(station).toBeVisible();
    const box = await station.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.x).toBeGreaterThanOrEqual(sectionBox!.x - 0.5);
    expect(box!.x + box!.width).toBeLessThanOrEqual(sectionBox!.x + sectionBox!.width + 0.5);
    expect(box!.y).toBeGreaterThanOrEqual(sectionBox!.y - 0.5);
    expect(box!.y + box!.height).toBeLessThanOrEqual(sectionBox!.y + sectionBox!.height + 0.5);
    boxes.push(box!);
  }

  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i];
      const b = boxes[j];
      const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      expect(overlapX > 0 && overlapY > 0).toBe(false);
    }
  }
}

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

test("Water Watch mobile station cards stay visible, non-overlapping and unclipped", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/water-watch");

  await expect(page.getByTestId("water-watch-simulated-banner")).toBeVisible();
  await expectStationGeometry(page, "water-watch-station-row-");

  // Ordered-list labels are readable, not clipped by the section.
  await expect(page.getByText("1. บางบาล")).toBeVisible();
  await expect(page.getByText("3. อุทัย")).toBeVisible();
  await expect(page.getByText("5. บางไทร")).toBeVisible();

  // No horizontal overflow remains.
  const geometry = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewport);
  expect(geometry.bodyWidth).toBeLessThanOrEqual(geometry.viewport);
});

test("Water Watch tablet-width station cards stay visible, non-overlapping and unclipped", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/water-watch");
  await expectStationGeometry(page, "water-watch-station-row-");
});

test("Water Watch laptop-width (1024-1279) stacked stations stay visible, non-overlapping and unclipped", async ({ page }) => {
  // 1024-1279px keeps the stacked variant while the desktop grids apply; the
  // enclosing layout must stay content-sized/scrollable here, not fixed-height.
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/water-watch");
  await expectStationGeometry(page, "water-watch-station-row-");

  const geometry = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }));
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewport);
});

test("Water Watch desktop river markers stay non-overlapping and unclipped at their tightest width", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/water-watch");
  await expectStationGeometry(page, "water-watch-station-");
});
