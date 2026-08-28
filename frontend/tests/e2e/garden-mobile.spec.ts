import { test, expect } from "./fixtures";
import { devices, type Page } from "@playwright/test";
import type { GardenInput } from "../../src/lib/garden";

/**
 * ENV-MOBILE-005 - Garden mobile convergence.
 * Synthetic rows/values are deterministic layout and interaction evidence only.
 */
const PHONE = { width: 360, height: 800 };
const PHONE_320 = { width: 320, height: 800 };
const PHONE_390 = { width: 390, height: 844 };
const PHONE_430 = { width: 430, height: 900 };
const TABLET = { width: 768, height: 1024 };
const DESKTOP = { width: 1024, height: 900 };
const VISUAL_DIR = "test-results";

const GARDEN_FIELDS = [
  ["\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48", "garden-round-date"],
  ["\u0e1b\u0e23\u0e30\u0e40\u0e20\u0e17\u0e07\u0e32\u0e19", "garden-work-type"],
  ["\u0e1e\u0e37\u0e49\u0e19\u0e17\u0e35\u0e48 (\u0e15\u0e23.\u0e21)", "garden-area-sqm"],
  ["\u0e08\u0e33\u0e19\u0e27\u0e19\u0e04\u0e19", "garden-worker-count"],
  ["\u0e19\u0e49\u0e33\u0e21\u0e31\u0e19\u0e17\u0e35\u0e48\u0e43\u0e0a\u0e49 (L)", "garden-fuel-used-l"],
  ["\u0e0a\u0e31\u0e48\u0e27\u0e42\u0e21\u0e07\u0e17\u0e33\u0e07\u0e32\u0e19", "garden-duration-hours"],
  ["\u0e2d\u0e38\u0e1b\u0e01\u0e23\u0e13\u0e4c", "garden-equipment-used"],
  ["\u0e02\u0e22\u0e30\u0e17\u0e35\u0e48\u0e40\u0e01\u0e47\u0e1a (kg)", "garden-waste-collected-kg"],
  ["\u0e2b\u0e21\u0e32\u0e22\u0e40\u0e2b\u0e15\u0e38", "garden-note"],
] as const;

const SAVE = "\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01";
const DELETE = "\u0e25\u0e1a";
const SAVE_OK = "\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08";
const HISTORY_REGION = "ประวัติการดูแลสวน";
const DATE_ERROR_ID = "garden-round-date-error";
const DATE_REQUIRED_ERROR = "กรุณาระบุวันที่ก่อนบันทึก";

const GARDEN_ROW = {
  id: "50000000-0000-0000-0000-000000000001",
  round_date: "2026-08-28",
  location_id: null,
  work_type: "E2E synthetic garden round",
  area_sqm: 120,
  worker_count: 2,
  fuel_used_l: 1.5,
  duration_hours: 3,
  equipment_used: "E2E mower",
  waste_collected_kg: 8,
  photo_path: null,
  recorded_by: null,
  note: "synthetic layout evidence",
  created_at: "2026-08-28T00:00:00Z",
};

interface GardenMockOptions {
  failPostOnce?: boolean;
  posts?: string[];
}

async function mockGardenDependencies(page: Page, options: GardenMockOptions = {}) {
  let postCount = 0;
  await page.route("**/rest/v1/role_module_visibility**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.route("**/rest/v1/threshold_alert**", async (route) => {
    const headers: Record<string, string> = {};
    if ((route.request().headers()["prefer"] ?? "").includes("count=")) headers["content-range"] = "*/0";
    await route.fulfill({ status: 200, contentType: "application/json", headers, body: "[]" });
  });
  await page.route("**/rest/v1/work_round**", async (route) => {
    const method = route.request().method();
    if (method === "POST") {
      postCount += 1;
      options.posts?.push(route.request().postData() ?? "");
      if (options.failPostOnce && postCount === 1) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ message: "E2E garden save failure", code: "E2E" }),
        });
        return;
      }
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(GARDEN_ROW) });
      return;
    }
    if (method === "DELETE") {
      await route.fulfill({ status: 204, body: "" });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([GARDEN_ROW]) });
  });
}

function content(page: Page) {
  return page.locator("main");
}

function gardenField(page: Page, label: string) {
  return content(page).getByLabel(label, { exact: true });
}

async function documentHasNoHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
}

async function historyLayout(page: Page) {
  return content(page).locator("table").evaluate((table) => {
    const tableElement = table as HTMLElement;
    const region = tableElement.closest<HTMLElement>('[role="region"]');
    const boundary = region ?? tableElement;
    const card = boundary.parentElement;
    if (!card) throw new Error("Garden history containment card is missing");
    const boundaryBox = boundary.getBoundingClientRect();
    const cardBox = card.getBoundingClientRect();
    return {
      hasRegion: region !== null,
      regionName: region?.getAttribute("aria-label") ?? null,
      boundaryLeft: boundaryBox.left,
      boundaryRight: boundaryBox.right,
      cardLeft: cardBox.left,
      cardRight: cardBox.right,
      viewportWidth: window.innerWidth,
      clientWidth: boundary.clientWidth,
      scrollWidth: boundary.scrollWidth,
      overflowX: getComputedStyle(boundary).overflowX,
      documentScrollWidth: document.documentElement.scrollWidth,
    };
  });
}

test.describe("ENV-MOBILE-005 Garden mobile regression", () => {
  test.beforeEach(async ({ authed: page }) => {
    await mockGardenDependencies(page);
  });

  test("360 px controls form one phone column with no document overflow", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/garden");
    const first = await gardenField(page, GARDEN_FIELDS[0][0]).boundingBox();
    const second = await gardenField(page, GARDEN_FIELDS[1][0]).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(Math.abs(first!.x - second!.x)).toBeLessThan(8);
    expect(await documentHasNoHorizontalOverflow(page)).toBe(true);
    await page.screenshot({ path: `${VISUAL_DIR}/garden-360.png`, fullPage: true });
  });

  test("phone save and delete actions meet the 44 px touch minimum", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/garden");
    for (const target of [content(page).getByRole("button", { name: SAVE, exact: true }), content(page).getByRole("button", { name: DELETE, exact: true })]) {
      const box = await target.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("history has a named local containment region at 320, 360, and 390 px", async ({ authed: page }) => {
    for (const viewport of [PHONE_320, PHONE, PHONE_390]) {
      await page.setViewportSize(viewport);
      await page.goto("/garden");
      await expect(content(page).locator("table")).toHaveCount(1);
      const layout = await historyLayout(page);
      const evidence = `${viewport.width}px history layout: ${JSON.stringify(layout)}`;

      // These bounds catch the old false green where AppShell hid document
      // overflow while the table and Delete action escaped the Garden card.
      expect.soft(layout.hasRegion, evidence).toBe(true);
      expect.soft(layout.regionName, evidence).toBe(HISTORY_REGION);
      expect.soft(layout.boundaryLeft, evidence).toBeGreaterThanOrEqual(layout.cardLeft - 1);
      expect.soft(layout.boundaryRight, evidence).toBeLessThanOrEqual(layout.cardRight + 1);
      expect.soft(layout.boundaryLeft, evidence).toBeGreaterThanOrEqual(-1);
      expect.soft(layout.boundaryRight, evidence).toBeLessThanOrEqual(layout.viewportWidth + 1);
      expect.soft(layout.scrollWidth, evidence).toBeGreaterThan(layout.clientWidth);
      expect.soft(["auto", "scroll"], evidence).toContain(layout.overflowX);
      expect.soft(layout.documentScrollWidth, evidence).toBeLessThanOrEqual(layout.viewportWidth);
    }
  });

  test("keyboard ArrowRight scroll makes the full Delete action reachable locally", async ({ authed: page }) => {
    await page.setViewportSize(PHONE_320);
    await page.goto("/garden");
    const region = content(page).getByRole("region", { name: HISTORY_REGION, exact: true });
    await expect(region).toHaveCount(1);
    await region.focus();
    await expect(region).toBeFocused();
    await expect(region).toHaveAttribute("tabindex", "0");

    const initial = await region.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      scrollLeft: element.scrollLeft,
    }));
    expect(initial.scrollWidth).toBeGreaterThan(initial.clientWidth);
    expect(initial.scrollLeft).toBe(0);

    for (let step = 0; step < 8; step += 1) await page.keyboard.press("ArrowRight");
    await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);

    const regionBox = await region.boundingBox();
    const deleteBox = await content(page).getByRole("button", { name: DELETE, exact: true }).boundingBox();
    expect(regionBox).not.toBeNull();
    expect(deleteBox).not.toBeNull();
    expect(deleteBox!.x).toBeGreaterThanOrEqual(regionBox!.x - 1);
    expect(deleteBox!.x + deleteBox!.width).toBeLessThanOrEqual(regionBox!.x + regionBox!.width + 1);
    expect(deleteBox!.x + deleteBox!.width).toBeLessThanOrEqual(PHONE_320.width + 1);
  });

  test("desktop history keeps full density without unnecessary local clipping", async ({ authed: page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/garden");
    const region = content(page).getByRole("region", { name: HISTORY_REGION, exact: true });
    await expect(region).toHaveCount(1);
    const layout = await region.evaluate((element) => {
      const tableBox = element.querySelector("table")!.getBoundingClientRect();
      const regionBox = element.getBoundingClientRect();
      return {
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        scrollLeft: element.scrollLeft,
        tableLeft: tableBox.left,
        tableRight: tableBox.right,
        regionLeft: regionBox.left,
        regionRight: regionBox.right,
      };
    });
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
    expect(layout.scrollLeft).toBe(0);
    expect(layout.tableLeft).toBeGreaterThanOrEqual(layout.regionLeft - 1);
    expect(layout.tableRight).toBeLessThanOrEqual(layout.regionRight + 1);
    await expect(content(page).getByRole("button", { name: DELETE, exact: true })).toBeInViewport();
  });

  test("390 and 430 px keep one-column phone composition", async ({ authed: page }) => {
    for (const [label, viewport] of [["390", { width: 390, height: 844 }], ["430", PHONE_430]] as const) {
      await page.setViewportSize(viewport);
      await page.goto("/garden");
      const first = await gardenField(page, GARDEN_FIELDS[0][0]).boundingBox();
      const second = await gardenField(page, GARDEN_FIELDS[1][0]).boundingBox();
      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      expect(Math.abs(first!.x - second!.x)).toBeLessThan(8);
      expect(await documentHasNoHorizontalOverflow(page)).toBe(true);
      await page.screenshot({ path: `${VISUAL_DIR}/garden-${label}.png`, fullPage: true });
    }
  });

  test("tablet and desktop preserve useful multi-column density", async ({ authed: page }) => {
    for (const [label, viewport] of [["768", TABLET], ["1024", DESKTOP]] as const) {
      await page.setViewportSize(viewport);
      await page.goto("/garden");
      const first = await gardenField(page, GARDEN_FIELDS[0][0]).boundingBox();
      const second = await gardenField(page, GARDEN_FIELDS[1][0]).boundingBox();
      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      expect(Math.abs(first!.x - second!.x)).toBeGreaterThan(80);
      await page.screenshot({ path: `${VISUAL_DIR}/garden-${label}.png`, fullPage: true });
    }
  });

  test("save error preserves values and retry sends unchanged complete Garden payload", async ({ authed: page }) => {
    const posts: string[] = [];
    await page.unroute("**/rest/v1/work_round**");
    await mockGardenDependencies(page, { failPostOnce: true, posts });
    await page.setViewportSize(PHONE_430);
    await page.goto("/garden");

    await gardenField(page, GARDEN_FIELDS[0][0]).fill("2026-08-28");
    await gardenField(page, GARDEN_FIELDS[1][0]).fill("E2E retry work");
    await gardenField(page, GARDEN_FIELDS[2][0]).fill("120");
    await gardenField(page, GARDEN_FIELDS[3][0]).fill("2");
    await gardenField(page, GARDEN_FIELDS[4][0]).fill("1.5");
    await gardenField(page, GARDEN_FIELDS[5][0]).fill("3");
    await gardenField(page, GARDEN_FIELDS[6][0]).fill("E2E mower");
    await gardenField(page, GARDEN_FIELDS[7][0]).fill("8");
    await gardenField(page, GARDEN_FIELDS[8][0]).fill("synthetic retry evidence");

    const expectedGardenInput = {
      round_date: "2026-08-28",
      location_id: null,
      work_type: "E2E retry work",
      area_sqm: 120,
      worker_count: 2,
      fuel_used_l: 1.5,
      duration_hours: 3,
      equipment_used: "E2E mower",
      waste_collected_kg: 8,
      photo_path: null,
      note: "synthetic retry evidence",
    } satisfies GardenInput;

    const save = content(page).getByRole("button", { name: SAVE, exact: true });
    await save.click();
    await expect(page.getByRole("status").filter({ hasText: "E2E garden save failure" })).toBeVisible();
    await expect(gardenField(page, GARDEN_FIELDS[2][0])).toHaveValue("120");
    await expect(gardenField(page, GARDEN_FIELDS[6][0])).toHaveValue("E2E mower");
    await expect(gardenField(page, GARDEN_FIELDS[8][0])).toHaveValue("synthetic retry evidence");
    expect(posts).toHaveLength(1);
    const failedPayload = JSON.parse(posts[0]) as Record<string, unknown>;
    expect(failedPayload).toEqual(expectedGardenInput);

    await save.click();
    await expect(page.getByRole("status").filter({ hasText: SAVE_OK })).toBeVisible();
    expect(posts).toHaveLength(2);
    const retryPayload = JSON.parse(posts[1]) as Record<string, unknown>;
    expect(retryPayload).toEqual(expectedGardenInput);
    expect(retryPayload).toEqual(failedPayload);
  });

  test("blank required date blocks POST, preserves values, and focuses an associated persistent error", async ({ authed: page }) => {
    const posts: string[] = [];
    await page.unroute("**/rest/v1/work_round**");
    await mockGardenDependencies(page, { posts });
    await page.setViewportSize(PHONE_390);
    await page.goto("/garden");

    const date = gardenField(page, GARDEN_FIELDS[0][0]);
    const equipment = gardenField(page, GARDEN_FIELDS[6][0]);
    const dateLabel = content(page).locator(`label[for="${GARDEN_FIELDS[0][1]}"]`);
    await expect.soft(dateLabel.locator("..").getByText("*", { exact: true })).toBeVisible();
    await expect.soft(date).toHaveAttribute("required", "");
    await expect.soft(date).toHaveAttribute("aria-required", "true");

    await equipment.fill("E2E mower preserved after date validation");
    await date.fill("");
    await content(page).getByRole("button", { name: SAVE, exact: true }).click();

    const error = content(page).locator(`#${DATE_ERROR_ID}`);
    expect.soft(posts).toHaveLength(0);
    await expect.soft(equipment).toHaveValue("E2E mower preserved after date validation");
    await expect.soft(error).toBeVisible();
    await expect.soft(error).toHaveAttribute("role", "alert");
    await expect.soft(error).toHaveText(DATE_REQUIRED_ERROR);
    await expect.soft(date).toHaveAttribute("aria-invalid", "true");
    await expect.soft(date).toHaveAttribute("aria-describedby", DATE_ERROR_ID);
    await expect.soft(date).toBeFocused();

    // The message persists while invalid, even after focus moves elsewhere.
    await equipment.focus();
    await expect.soft(error).toBeVisible();
    await expect.soft(equipment).toHaveValue("E2E mower preserved after date validation");

    await date.fill("2026-08-28");
    await expect(error).toHaveCount(0);
    await content(page).getByRole("button", { name: SAVE, exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: SAVE_OK })).toBeVisible();
    expect(posts).toHaveLength(1);
    const payload = JSON.parse(posts[0]) as Record<string, unknown>;
    expect(payload.round_date).toBe("2026-08-28");
    expect(payload.equipment_used).toBe("E2E mower preserved after date validation");
  });

  test("all Garden controls have semantic labels with stable page-local IDs", async ({ authed: page }) => {
    await page.setViewportSize(PHONE_430);
    await page.goto("/garden");
    for (const [label, id] of GARDEN_FIELDS) {
      const control = gardenField(page, label);
      await expect(control).toHaveCount(1);
      await expect(control).toBeVisible();
      await expect(control).toHaveAttribute("id", id);
      await expect(control).toHaveAccessibleName(label);
    }
  });

  test("keyboard tab order reaches every Garden control and Enter activates save", async ({ authed: page }) => {
    const posts: string[] = [];
    await page.unroute("**/rest/v1/work_round**");
    await mockGardenDependencies(page, { posts });
    await page.setViewportSize(PHONE_430);
    await page.goto("/garden");
    await gardenField(page, GARDEN_FIELDS[0][0]).fill("2026-08-28");

    const save = content(page).getByRole("button", { name: SAVE, exact: true });
    const focusOrder = [...GARDEN_FIELDS.map(([label]) => gardenField(page, label)), save];
    await focusOrder[0].focus();
    await expect(focusOrder[0]).toBeFocused();

    // Chromium date controls can traverse internal segments while host focus remains.
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
    await expect(page.getByRole("status").filter({ hasText: SAVE_OK })).toBeVisible();
    expect(posts).toHaveLength(1);
  });
});

test.describe("ENV-MOBILE-005 real touch context", () => {
  const { defaultBrowserType: _browserType, ...pixel7Touch } = devices["Pixel 7"];
  test.use(pixel7Touch);

  test("tap path records a valid synthetic Garden row without changing payload semantics", async ({ authed: page }) => {
    const posts: string[] = [];
    await mockGardenDependencies(page, { posts });
    await page.goto("/garden");
    await gardenField(page, GARDEN_FIELDS[2][0]).fill("50");
    await gardenField(page, GARDEN_FIELDS[3][0]).fill("1");
    await gardenField(page, GARDEN_FIELDS[4][0]).fill("0.75");
    await gardenField(page, GARDEN_FIELDS[6][0]).fill("E2E trimmer");
    await content(page).getByRole("button", { name: SAVE, exact: true }).tap();
    await expect(page.getByRole("status").filter({ hasText: SAVE_OK })).toBeVisible();
    expect(posts).toHaveLength(1);
    const payload = JSON.parse(posts[0]) as Record<string, unknown>;
    expect(payload.area_sqm).toBe(50);
    expect(payload.worker_count).toBe(1);
    expect(payload.fuel_used_l).toBe(0.75);
    expect(payload.equipment_used).toBe("E2E trimmer");
    expect(payload.location_id).toBeNull();
    expect(payload.photo_path).toBeNull();
    expect(await documentHasNoHorizontalOverflow(page)).toBe(true);
  });
});
