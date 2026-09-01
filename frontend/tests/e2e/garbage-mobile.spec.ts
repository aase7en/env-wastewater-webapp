import { test, expect } from "./fixtures";
import { devices, type Page } from "@playwright/test";
import type { GarbageInput } from "../../src/lib/garbage";

/** ENV-MOBILE-006 — Garbage mobile convergence. Synthetic evidence only. */
const PHONE = { width: 360, height: 800 };
const PHONE_390 = { width: 390, height: 844 };
const PHONE_430 = { width: 430, height: 900 };
const TABLET = { width: 768, height: 1024 };
const DESKTOP = { width: 1024, height: 900 };

const FIELDS = [
  ["วันที่", "garbage-log-date"],
  ["ประเภท", "garbage-segregation-type"],
  ["น้ำหนัก (kg)", "garbage-weight-kg"],
  ["เส้นทางกำจัด", "garbage-disposal-route"],
  ["ผู้รับเก็บ", "garbage-contractor"],
  ["ทะเบียนรถ", "garbage-vehicle-plate"],
  ["เลข manifest", "garbage-manifest-no"],
  ["ปลายทาง", "garbage-destination"],
  ["หมายเหตุ", "garbage-note"],
] as const;

const SAVE = "บันทึก";
const SAVE_OK = "บันทึกสำเร็จ";
const DELETE = "ลบ";
const DATE_ERROR_ID = "garbage-log-date-error";
const DATE_REQUIRED_ERROR = "กรุณาระบุวันที่ก่อนบันทึก";
const HISTORY_REGION = "ประวัติการจัดการขยะ";

const ROW = {
  id: "60000000-0000-0000-0000-000000000001",
  log_date: "2026-08-31",
  location_id: null,
  waste_type: null,
  weight_kg: 12.5,
  disposal_route: "E2E disposal route",
  segregation_type: "infectious",
  contractor: "E2E contractor",
  vehicle_plate: "E2E-001",
  manifest_no: "E2E-MANIFEST-001",
  destination: "E2E destination",
  recorded_by: null,
  note: "synthetic layout evidence",
  created_at: "2026-08-31T00:00:00Z",
};

interface MockOptions {
  failPostOnce?: boolean;
  posts?: string[];
}

async function mockDependencies(page: Page, options: MockOptions = {}) {
  let postCount = 0;
  await page.route("**/rest/v1/role_module_visibility**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.route("**/rest/v1/threshold_alert**", async (route) => {
    const headers: Record<string, string> = {};
    if ((route.request().headers()["prefer"] ?? "").includes("count=")) headers["content-range"] = "*/0";
    await route.fulfill({ status: 200, contentType: "application/json", headers, body: "[]" });
  });
  await page.route("**/rest/v1/collection_log**", async (route) => {
    const method = route.request().method();
    if (method === "POST") {
      postCount += 1;
      options.posts?.push(route.request().postData() ?? "");
      if (options.failPostOnce && postCount === 1) {
        await route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ message: "E2E garbage save failure", code: "E2E" }) });
        return;
      }
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(ROW) });
      return;
    }
    if (method === "DELETE") {
      await route.fulfill({ status: 204, body: "" });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([ROW]) });
  });
}

function content(page: Page) { return page.locator("main"); }
function field(page: Page, label: string) { return content(page).getByLabel(label, { exact: true }); }

async function documentHasNoHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
}

async function historyLayout(page: Page) {
  return content(page).locator("table").evaluate((table) => {
    const tableElement = table as HTMLElement;
    const region = tableElement.closest<HTMLElement>('[role="region"]');
    const boundary = region ?? tableElement;
    const card = boundary.parentElement;
    if (!card) throw new Error("Garbage history containment card is missing");
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

test.describe("ENV-MOBILE-006 Garbage mobile regression", () => {
  test.beforeEach(async ({ authed: page }) => { await mockDependencies(page); });

  test("360 px controls form one phone column with no document overflow", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/garbage");
    const first = await field(page, FIELDS[0][0]).boundingBox();
    const second = await field(page, FIELDS[1][0]).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(Math.abs(first!.x - second!.x)).toBeLessThan(8);
    expect(await documentHasNoHorizontalOverflow(page)).toBe(true);
  });

  test("all nine visible controls have programmatic labels and stable ids", async ({ authed: page }) => {
    await page.setViewportSize(PHONE_390);
    await page.goto("/garbage");
    for (const [label, id] of FIELDS) {
      const control = field(page, label);
      await expect(control).toHaveCount(1);
      await expect(control).toHaveAttribute("id", id);
      await expect(content(page).locator(`label[for="${id}"]`)).toHaveCount(1);
    }
  });

  test("phone save and delete actions meet the 44 px touch minimum", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/garbage");
    for (const target of [content(page).getByRole("button", { name: SAVE, exact: true }), content(page).getByRole("button", { name: DELETE, exact: true })]) {
      const box = await target.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("history remains inside its card and document at phone width", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/garbage");
    const layout = await historyLayout(page);
    const evidence = JSON.stringify(layout);
    expect.soft(layout.hasRegion, evidence).toBe(true);
    expect.soft(layout.regionName, evidence).toBe(HISTORY_REGION);
    expect.soft(layout.boundaryLeft, evidence).toBeGreaterThanOrEqual(layout.cardLeft - 1);
    expect.soft(layout.boundaryRight, evidence).toBeLessThanOrEqual(layout.cardRight + 1);
    expect.soft(layout.boundaryLeft, evidence).toBeGreaterThanOrEqual(-1);
    expect.soft(layout.boundaryRight, evidence).toBeLessThanOrEqual(layout.viewportWidth + 1);
    expect.soft(layout.documentScrollWidth, evidence).toBeLessThanOrEqual(layout.viewportWidth);

    const region = content(page).getByRole("region", { name: HISTORY_REGION, exact: true });
    await region.focus();
    await expect(region).toBeFocused();
    if (layout.scrollWidth > layout.clientWidth) {
      const before = await region.evaluate((element) => element.scrollLeft);
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(before);
    }
  });

  test("tablet and desktop preserve useful multi-column density", async ({ authed: page }) => {
    for (const viewport of [TABLET, DESKTOP]) {
      await page.setViewportSize(viewport);
      await page.goto("/garbage");
      const first = await field(page, FIELDS[0][0]).boundingBox();
      const second = await field(page, FIELDS[1][0]).boundingBox();
      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      expect(Math.abs(first!.x - second!.x)).toBeGreaterThan(80);
    }
  });

  test("save error preserves values and retry sends unchanged canonical GarbageInput", async ({ authed: page }) => {
    const posts: string[] = [];
    await page.unroute("**/rest/v1/collection_log**");
    await mockDependencies(page, { failPostOnce: true, posts });
    await page.setViewportSize(PHONE_430);
    await page.goto("/garbage");

    await field(page, FIELDS[0][0]).fill("2026-08-31");
    await field(page, FIELDS[1][0]).selectOption("infectious");
    await field(page, FIELDS[2][0]).fill("12.5");
    await field(page, FIELDS[3][0]).fill("E2E disposal route");
    await field(page, FIELDS[4][0]).fill("E2E contractor");
    await field(page, FIELDS[5][0]).fill("E2E-001");
    await field(page, FIELDS[6][0]).fill("E2E-MANIFEST-001");
    await field(page, FIELDS[7][0]).fill("E2E destination");
    await field(page, FIELDS[8][0]).fill("synthetic retry evidence");

    const expected = {
      log_date: "2026-08-31",
      location_id: null,
      weight_kg: 12.5,
      disposal_route: "E2E disposal route",
      segregation_type: "infectious",
      contractor: "E2E contractor",
      vehicle_plate: "E2E-001",
      manifest_no: "E2E-MANIFEST-001",
      destination: "E2E destination",
      note: "synthetic retry evidence",
    } satisfies GarbageInput;

    const save = content(page).getByRole("button", { name: SAVE, exact: true });
    await save.click();
    await expect(page.getByRole("status").filter({ hasText: "E2E garbage save failure" })).toBeVisible();
    await expect(field(page, FIELDS[2][0])).toHaveValue("12.5");
    await expect(field(page, FIELDS[8][0])).toHaveValue("synthetic retry evidence");
    expect(posts).toHaveLength(1);
    const failed = JSON.parse(posts[0]) as Record<string, unknown>;
    expect(failed).toEqual(expected);
    expect(failed).not.toHaveProperty("waste_type");

    await save.click();
    expect(posts).toHaveLength(2);
    const retried = JSON.parse(posts[1]) as Record<string, unknown>;
    expect(retried).toEqual(expected);
    expect(retried).toEqual(failed);
  });

  test("blank required date blocks POST and focuses an associated persistent error", async ({ authed: page }) => {
    const posts: string[] = [];
    await page.unroute("**/rest/v1/collection_log**");
    await mockDependencies(page, { posts });
    await page.setViewportSize(PHONE_390);
    await page.goto("/garbage");

    const date = field(page, FIELDS[0][0]);
    const note = field(page, FIELDS[8][0]);
    await note.fill("preserve me");
    await date.fill("");
    await content(page).getByRole("button", { name: SAVE, exact: true }).click();

    const error = content(page).locator(`#${DATE_ERROR_ID}`);
    expect(posts).toHaveLength(0);
    await expect(note).toHaveValue("preserve me");
    await expect(error).toBeVisible();
    await expect(error).toHaveAttribute("role", "alert");
    await expect(error).toHaveText(DATE_REQUIRED_ERROR);
    await expect(date).toHaveAttribute("required", "");
    await expect(date).toHaveAttribute("aria-required", "true");
    await expect(date).toHaveAttribute("aria-invalid", "true");
    await expect(date).toHaveAttribute("aria-describedby", DATE_ERROR_ID);
    await expect(date).toBeFocused();
  });

  test("keyboard tab order reaches every Garbage control and Enter activates save", async ({ authed: page }) => {
    const posts: string[] = [];
    await page.unroute("**/rest/v1/collection_log**");
    await mockDependencies(page, { posts });
    await page.setViewportSize(PHONE_430);
    await page.goto("/garbage");

    const save = content(page).getByRole("button", { name: SAVE, exact: true });
    const focusOrder = [...FIELDS.map(([label]) => field(page, label)), save];
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
    const payload = JSON.parse(posts[0]) as Record<string, unknown>;
    expect(payload.segregation_type).toBe("general");
    expect(payload).not.toHaveProperty("waste_type");
  });
});

test.describe("ENV-MOBILE-006 real touch context", () => {
  const { defaultBrowserType: _browserType, ...pixel7Touch } = devices["Pixel 7"];
  test.use(pixel7Touch);

  test("tap path submits canonical classification without legacy field", async ({ authed: page }) => {
    const posts: string[] = [];
    await mockDependencies(page, { posts });
    await page.goto("/garbage");
    await field(page, FIELDS[1][0]).selectOption("recyclable");
    await field(page, FIELDS[2][0]).fill("5");
    await content(page).getByRole("button", { name: SAVE, exact: true }).tap();
    await expect(page.getByRole("status").filter({ hasText: SAVE_OK })).toBeVisible();
    expect(posts).toHaveLength(1);
    const payload = JSON.parse(posts[0]) as Record<string, unknown>;
    expect(payload.segregation_type).toBe("recyclable");
    expect(payload).not.toHaveProperty("waste_type");
    expect(await documentHasNoHorizontalOverflow(page)).toBe(true);
  });
});
