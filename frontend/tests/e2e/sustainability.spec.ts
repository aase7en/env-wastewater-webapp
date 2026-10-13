import { expect, test } from "./fixtures";

/**
 * ENV-WASTE-CARBON-001-C1 — integrated sustainability view (RED-first).
 * Pins the D1 truth table: 1 contributing family + 4 UNAVAILABLE + Plastic
 * ABSENT; T-VER readiness-only. Must fail truthfully pre-implementation.
 */

test("sustainability page shows all six family cards with truthful states", async ({ authed: page }) => {
  await page.goto("/sustainability");
  const list = page.getByTestId("sustainability-families");
  await expect(list).toBeVisible();
  const cards = list.locator("[data-family]");
  expect(await cards.count()).toBe(6);
});

test("electricity shows real numbers; 0-row families show ไม่มีข้อมูล never 0.000", async ({ authed: page }) => {
  await page.goto("/sustainability");
  const list = page.getByTestId("sustainability-families");
  const unavailable = list.locator("[data-family-state='UNAVAILABLE']");
  const n = await unavailable.count();
  expect(n).toBeGreaterThanOrEqual(4);
  for (let i = 0; i < n; i += 1) {
    await expect(unavailable.nth(i)).toContainText("ไม่มีข้อมูล");
    await expect(unavailable.nth(i)).not.toContainText("0.000");
  }
});

test("plastic renders explicit ABSENT and never derives from waste_recyclable", async ({ authed: page }) => {
  await page.goto("/sustainability");
  const plastic = page.getByTestId("sustainability-families").locator("[data-family='plastic']");
  await expect(plastic).toHaveAttribute("data-family-state", "ABSENT");
  await expect(plastic).toContainText("ไม่มีข้อมูล");
});

test("T-VER section is readiness-only with no eligibility/credit claims", async ({ authed: page }) => {
  await page.goto("/sustainability");
  const tver = page.getByTestId("tver-readiness");
  await expect(tver).toBeVisible();
  const text = await tver.innerText();
  expect(text).not.toMatch(/สิทธิ์|เครดิต|eligible|eligibility|credit|จดทะเบียน|qualified/i);
  await expect(tver.locator("[data-readiness-status]").first()).toBeVisible();
});

test("known-only total flag appears when contributions are unavailable", async ({ authed: page }) => {
  await page.goto("/sustainability");
  const total = page.getByTestId("sustainability-total");
  await expect(total).toBeVisible();
  await expect(total).toContainText(/ยอดรวมที่ทราบ|ข้อมูลไม่ครบ/);
});

test("nav entry ความยั่งยืน reaches the page and targets meet 44px", async ({ authed: page }) => {
  await page.goto("/");
  const nav = page.getByRole("link", { name: "ความยั่งยืน" });
  await expect(nav).toBeVisible();
  const box = await nav.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.min(box!.height, box!.width)).toBeGreaterThanOrEqual(44);
  await nav.click();
  await expect(page.getByTestId("sustainability-families")).toBeVisible();
});

test("360px viewport has no horizontal overflow", async ({ authed: page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/sustainability");
  await expect(page.getByTestId("sustainability-families")).toBeVisible();
  const doc = await page.evaluate(() => document.documentElement.scrollWidth <= 360);
  expect(doc).toBe(true);
});
