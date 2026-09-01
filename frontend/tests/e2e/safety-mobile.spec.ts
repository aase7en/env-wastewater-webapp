import { test, expect } from "./fixtures";
import { devices, type Page } from "@playwright/test";
import type { SafetyInput } from "../../src/lib/safety";

/** ENV-MOBILE-007 — Safety mobile convergence. Synthetic evidence only. */
const PHONE = { width: 360, height: 800 };
const PHONE_390 = { width: 390, height: 844 };
const PHONE_430 = { width: 430, height: 900 };
const TABLET = { width: 768, height: 1024 };
const DESKTOP = { width: 1024, height: 900 };

const FIELDS = [
  ["วันที่ตรวจ", "safety-check-date"],
  ["รอบตรวจถัดไป", "safety-next-check-due"],
  ["ถังดับเพลิง (จำนวน)", "safety-extinguisher-count"],
  ["ถังหมดอายุ", "safety-extinguisher-expired-count"],
  ["ไฟฉุกเฉิน (จำนวน)", "safety-exit-light-count"],
  ["ไฟฉุกเฉินพัง", "safety-exit-light-broken-count"],
  ["ปัญหาที่พบ", "safety-issues-found"],
] as const;

const TOGGLES = [
  "ตรวจถังดับเพลิง",
  "ไฟฉุกเฉินใช้ได้",
  "ทดสอบสัญญาณเตือนอัคคี",
  "ทดสอบสปริงเกอร์",
  "ตรวจ AED",
] as const;

const SAVE = "บันทึก";
const SAVE_OK = "บันทึกสำเร็จ";
const DELETE = "ลบ";
const DATE_ERROR_ID = "safety-check-date-error";
const DATE_REQUIRED_ERROR = "กรุณาระบุวันที่ตรวจก่อนบันทึก";
const HISTORY_REGION = "ประวัติการตรวจความปลอดภัย";

const ROW = {
  id: "70000000-0000-0000-0000-000000000001",
  check_date: "2026-09-01",
  location_id: null,
  extinguisher_inspected: true,
  exit_light_functional: true,
  issues_found: "synthetic safety evidence",
  extinguisher_count: 12,
  extinguisher_expired_count: 1,
  exit_light_count: 8,
  exit_light_broken_count: 1,
  fire_alarm_tested: true,
  sprinkler_tested: false,
  apd_aed_checked: true,
  next_check_due: "2026-10-01",
  recorded_by: null,
  note: null,
  created_at: "2026-09-01T00:00:00Z",
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
  await page.route("**/rest/v1/monthly_check**", async (route) => {
    const method = route.request().method();
    if (method === "POST") {
      postCount += 1;
      options.posts?.push(route.request().postData() ?? "");
      if (options.failPostOnce && postCount === 1) {
        await route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ message: "E2E safety save failure", code: "E2E" }) });
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
function toggle(page: Page, label: string) { return content(page).getByRole("switch", { name: label, exact: true }); }

async function documentHasNoHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
}

async function historyLayout(page: Page) {
  return content(page).locator("table").evaluate((table) => {
    const tableElement = table as HTMLElement;
    const region = tableElement.closest<HTMLElement>('[role="region"]');
    const boundary = region ?? tableElement;
    const card = boundary.parentElement;
    if (!card) throw new Error("Safety history containment card is missing");
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

async function focusNext(page: Page, current: ReturnType<typeof field>, next: ReturnType<typeof field>, attempts = 4) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await page.keyboard.press("Tab");
    if (await next.evaluate((element) => element === document.activeElement)) return;
    await expect(current).toBeFocused();
  }
  await expect(next).toBeFocused();
}

test.describe("ENV-MOBILE-007 Safety mobile regression", () => {
  test.beforeEach(async ({ authed: page }) => { await mockDependencies(page); });

  test("360/390/430 px primary fields form one phone column with no settled document overflow", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/safety");
    for (const viewport of [PHONE, PHONE_390, PHONE_430]) {
      await page.setViewportSize(viewport);
      const dates = content(page).locator('input[type="date"]');
      const first = await dates.nth(0).boundingBox();
      const second = await dates.nth(1).boundingBox();
      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      expect(Math.abs(first!.x - second!.x)).toBeLessThan(8);
      expect(await documentHasNoHorizontalOverflow(page)).toBe(true);
    }
  });

  test("all seven non-Toggle controls have stable ids and programmatic labels", async ({ authed: page }) => {
    await page.setViewportSize(PHONE_390);
    await page.goto("/safety");
    for (const [label, id] of FIELDS) {
      const control = field(page, label);
      await expect(control).toHaveCount(1);
      await expect(control).toHaveAttribute("id", id);
      await expect(content(page).locator(`label[for="${id}"]`)).toHaveCount(1);
    }
  });

  test("all five existing Toggles remain named, keyboard-operable, and 44 px touch rows", async ({ authed: page }) => {
    await page.setViewportSize(PHONE_390);
    await page.goto("/safety");
    for (const label of TOGGLES) {
      const control = toggle(page, label);
      await expect(control).toHaveCount(1);
      await control.focus();
      await expect(control).toBeFocused();
      const wrapper = control.locator("xpath=ancestor::label[1]");
      const box = await wrapper.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("phone save and delete actions meet the 44 px touch minimum", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/safety");
    for (const target of [content(page).getByRole("button", { name: SAVE, exact: true }), content(page).getByRole("button", { name: DELETE, exact: true })]) {
      const box = await target.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("history remains locally contained; any required horizontal scroll is named and keyboard reachable", async ({ authed: page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/safety");
    const layout = await historyLayout(page);
    const evidence = JSON.stringify(layout);
    expect.soft(layout.boundaryLeft, evidence).toBeGreaterThanOrEqual(layout.cardLeft - 1);
    expect.soft(layout.boundaryRight, evidence).toBeLessThanOrEqual(layout.cardRight + 1);
    expect.soft(layout.boundaryLeft, evidence).toBeGreaterThanOrEqual(-1);
    expect.soft(layout.boundaryRight, evidence).toBeLessThanOrEqual(layout.viewportWidth + 1);
    expect.soft(layout.documentScrollWidth, evidence).toBeLessThanOrEqual(layout.viewportWidth);

    if (layout.scrollWidth > layout.clientWidth) {
      expect(layout.hasRegion, evidence).toBe(true);
      expect(layout.regionName, evidence).toBe(HISTORY_REGION);
      expect(layout.overflowX, evidence).toMatch(/auto|scroll/);
      const region = content(page).getByRole("region", { name: HISTORY_REGION, exact: true });
      await region.focus();
      await expect(region).toBeFocused();
      const before = await region.evaluate((element) => element.scrollLeft);
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(before);
    }
  });

  test("tablet and desktop preserve useful multi-column density", async ({ authed: page }) => {
    await page.setViewportSize(TABLET);
    await page.goto("/safety");
    for (const viewport of [TABLET, DESKTOP]) {
      await page.setViewportSize(viewport);
      const dates = content(page).locator('input[type="date"]');
      const first = await dates.nth(0).boundingBox();
      const second = await dates.nth(1).boundingBox();
      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      expect(Math.abs(first!.x - second!.x)).toBeGreaterThan(80);
    }
  });

  test("save error preserves all values and retry sends the same complete SafetyInput body", async ({ authed: page }) => {
    const posts: string[] = [];
    await page.unroute("**/rest/v1/monthly_check**");
    await mockDependencies(page, { failPostOnce: true, posts });
    await page.setViewportSize(PHONE_430);
    await page.goto("/safety");

    const controls = content(page).locator('input:not([type="checkbox"]), textarea');
    await controls.nth(0).fill("2026-09-15");
    await controls.nth(1).fill("2026-10-15");
    await controls.nth(2).fill("12");
    await controls.nth(3).fill("1");
    await controls.nth(4).fill("8");
    await controls.nth(5).fill("1");
    for (const label of TOGGLES) {
      const control = toggle(page, label);
      await control.focus();
      await page.keyboard.press("Space");
      await expect(control).toBeChecked();
    }
    await controls.nth(6).fill("synthetic retry evidence");

    const expected = {
      check_date: "2026-09-15",
      location_id: null,
      extinguisher_inspected: true,
      exit_light_functional: true,
      issues_found: "synthetic retry evidence",
      extinguisher_count: 12,
      extinguisher_expired_count: 1,
      exit_light_count: 8,
      exit_light_broken_count: 1,
      fire_alarm_tested: true,
      sprinkler_tested: true,
      apd_aed_checked: true,
      next_check_due: "2026-10-15",
      note: null,
    } satisfies SafetyInput;

    const save = content(page).getByRole("button", { name: SAVE, exact: true });
    await save.click();
    await expect(page.getByRole("status").filter({ hasText: "E2E safety save failure" })).toBeVisible();
    await expect(controls.nth(2)).toHaveValue("12");
    await expect(controls.nth(6)).toHaveValue("synthetic retry evidence");
    expect(posts).toHaveLength(1);
    const failed = JSON.parse(posts[0]) as SafetyInput;
    expect(failed).toEqual(expected);

    await save.click();
    expect(posts).toHaveLength(2);
    const retried = JSON.parse(posts[1]) as SafetyInput;
    expect(retried).toEqual(expected);
    expect(retried).toEqual(failed);
  });

  test("blank required check date blocks POST and focuses an associated persistent error", async ({ authed: page }) => {
    const posts: string[] = [];
    await page.unroute("**/rest/v1/monthly_check**");
    await mockDependencies(page, { posts });
    await page.setViewportSize(PHONE_390);
    await page.goto("/safety");

    const controls = content(page).locator('input:not([type="checkbox"]), textarea');
    const date = controls.nth(0);
    const issues = controls.nth(6);
    await issues.fill("preserve me");
    await date.fill("");
    await content(page).getByRole("button", { name: SAVE, exact: true }).click();

    const error = content(page).locator(`#${DATE_ERROR_ID}`);
    expect(posts).toHaveLength(0);
    await expect(issues).toHaveValue("preserve me");
    await expect(error).toBeVisible();
    await expect(error).toHaveAttribute("role", "alert");
    await expect(error).toHaveText(DATE_REQUIRED_ERROR);
    await expect(date).toHaveAttribute("required", "");
    await expect(date).toHaveAttribute("aria-required", "true");
    await expect(date).toHaveAttribute("aria-invalid", "true");
    await expect(date).toHaveAttribute("aria-describedby", DATE_ERROR_ID);
    await expect(date).toBeFocused();
  });

  test("keyboard traversal reaches fields, all Toggles, issues, and Enter Save", async ({ authed: page }) => {
    const posts: string[] = [];
    await page.unroute("**/rest/v1/monthly_check**");
    await mockDependencies(page, { posts });
    await page.setViewportSize(PHONE_430);
    await page.goto("/safety");

    const fieldControls = FIELDS.slice(0, 6).map(([label]) => field(page, label));
    const toggleControls = TOGGLES.map((label) => toggle(page, label));
    const issues = field(page, FIELDS[6][0]);
    const save = content(page).getByRole("button", { name: SAVE, exact: true });
    const focusOrder = [...fieldControls, ...toggleControls, issues, save];

    await focusOrder[0].focus();
    await expect(focusOrder[0]).toBeFocused();
    for (let index = 0; index < focusOrder.length - 1; index += 1) {
      await focusNext(page, focusOrder[index], focusOrder[index + 1]);
    }
    await expect(save).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status").filter({ hasText: SAVE_OK })).toBeVisible();
    expect(posts).toHaveLength(1);
  });
});

test.describe("ENV-MOBILE-007 real touch context", () => {
  const { defaultBrowserType: _browserType, ...pixel7Touch } = devices["Pixel 7"];
  test.use(pixel7Touch);

  test("tap path preserves due-date/count/boolean semantics and avoids document overflow", async ({ authed: page }) => {
    const posts: string[] = [];
    await mockDependencies(page, { posts });
    await page.goto("/safety");
    const controls = content(page).locator('input:not([type="checkbox"]), textarea');
    const originalNextDue = await controls.nth(1).inputValue();
    await controls.nth(2).fill("3");
    await toggle(page, TOGGLES[0]).locator("xpath=ancestor::label[1]").tap();
    await toggle(page, TOGGLES[3]).locator("xpath=ancestor::label[1]").tap();
    await content(page).getByRole("button", { name: SAVE, exact: true }).tap();
    await expect(page.getByRole("status").filter({ hasText: SAVE_OK })).toBeVisible();
    expect(posts).toHaveLength(1);
    const payload = JSON.parse(posts[0]) as SafetyInput;
    expect(payload.next_check_due).toBe(originalNextDue || null);
    expect(payload.extinguisher_count).toBe(3);
    expect(payload.extinguisher_inspected).toBe(true);
    expect(payload.sprinkler_tested).toBe(true);
    expect(await documentHasNoHorizontalOverflow(page)).toBe(true);
  });
});
