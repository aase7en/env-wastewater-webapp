import { test, expect } from "./fixtures";

/**
 * ENV-PARITY-P3-003 — the admin maintenance/calibration surface (lane P3.3,
 * v1.11.0): per-tool calibration history list + entry form at
 * /admin/calibration (RequireAuth requireAdmin — the /admin/inventory +
 * /admin/masters pattern; route-only, no dock entry — admin nav lives in
 * AppShell, outside this lane's scope).
 *
 * Honesty pins (WO §4/§5 + D1-5 D2 ruling): no rows ⇒ the verbatim honest
 * empty state "ยังไม่มีรายการสอบเทียบ" — never a fabricated entry; NO
 * next-due is computed or rendered (the AppSheet table has no next-due
 * column or formula; the sheet cycle fields are measured values, not
 * intervals — the page states this honestly); calibration_date defaults to
 * today (the §3.30 Cal_date Init TODAY() translation — the ONLY verbatim
 * AppSheet validation); anonymous users bounce to /login.
 *
 * D2 RED: the route/surface does not exist yet — the authenticated
 * assertions fail truthfully over the NotFound catch-all.
 */

const emptyList = async (route: { fulfill: (opts: { status: number; contentType: string; body: string }) => Promise<void> }) => {
  await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
};

test.describe("ENV-PARITY-P3-003 calibration surface", () => {
  test("anonymous /admin/calibration bounces to /login (admin-gated route)", async ({ page }) => {
    await page.goto("/admin/calibration");
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Fcalibration/);
  });

  test("admin sees the calibration page with the history list + entry form sections", async ({
    authedAdmin: page,
  }) => {
    await page.route("**/rest/v1/item**", emptyList);
    await page.route("**/rest/v1/item_calibration**", emptyList);

    await page.goto("/admin/calibration");
    await expect(page.getByTestId("calibration-page")).toBeVisible();
    await expect(page.getByTestId("calibration-list")).toBeVisible();
    await expect(page.getByTestId("calibration-form")).toBeVisible();
  });

  test("honest empty state — never a fabricated calibration entry", async ({ authedAdmin: page }) => {
    await page.route("**/rest/v1/item**", emptyList);
    await page.route("**/rest/v1/item_calibration**", emptyList);

    await page.goto("/admin/calibration");
    await expect(page.getByTestId("calibration-list-empty")).toBeVisible();
    await expect(page.getByText("ยังไม่มีรายการสอบเทียบ")).toBeVisible();
  });

  test("D1-5: NO next-due is rendered — the honest absence note replaces it", async ({
    authedAdmin: page,
  }) => {
    await page.route("**/rest/v1/item**", emptyList);
    await page.route("**/rest/v1/item_calibration**", emptyList);

    await page.goto("/admin/calibration");
    await expect(page.getByTestId("next-due-absent-note")).toBeVisible();
    await expect(page.getByText("ระบบเดิมไม่มีข้อมูล 'ครั้งถัดไป'")).toBeVisible();
    await expect(page.getByTestId("next-due-value")).toHaveCount(0);
  });

  test("form carries the §3.30 verbatim-named fields; calibration_date defaults to today (Cal_date Init TODAY())", async ({
    authedAdmin: page,
  }) => {
    await page.route("**/rest/v1/item**", emptyList);
    await page.route("**/rest/v1/item_calibration**", emptyList);

    await page.goto("/admin/calibration");
    await expect(page.getByLabel(/วิธีสอบเทียบ|Cal_method/i).first()).toBeVisible();
    await expect(page.getByLabel(/ผลสอบเทียบ|Cal_result/i).first()).toBeVisible();
    const dateInput = page.getByLabel(/วันที่สอบเทียบ|Cal_date/i).first();
    await expect(dateInput).toBeVisible();
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    await expect(dateInput).toHaveValue(iso);
  });

  test("seeded history renders พ.ศ. dates (CE + 543) with the per-tool ครั้งล่าสุด grouping", async ({
    authedAdmin: page,
  }) => {
    await page.route("**/rest/v1/item**", emptyList);
    await page.route("**/rest/v1/item_calibration**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "00000000-0000-0000-0000-00000000a001",
            item_id: null,
            tool_legacy_id: "af420125",
            item_name: null,
            calibration_date: "2023-08-09",
            cal_method: null,
            cal_result: "InControl",
            calibrate_range: null,
            calibrate_unit: "mg/L",
            legacy_id: "18211fa1",
            created_at: "2026-11-18T00:00:00Z",
          },
          {
            id: "00000000-0000-0000-0000-00000000a002",
            item_id: null,
            tool_legacy_id: "af420125",
            item_name: null,
            calibration_date: "2024-05-16",
            cal_method: null,
            cal_result: "Higher Ref.",
            calibrate_range: "12.7",
            calibrate_unit: "%",
            legacy_id: "1d5ce050",
            created_at: "2026-11-18T00:00:00Z",
          },
        ]),
      });
    });

    await page.goto("/admin/calibration");
    // พ.ศ. render (thaiDate): 2024-05-16 → 16 พ.ค. 2567 (CE + 543)
    await expect(page.getByText("16 พ.ค. 2567").first()).toBeVisible();
    // per-tool grouping: af420125 has 2 records, ครั้งล่าสุด 2024-05-16
    await expect(page.getByText("ครั้งล่าสุด").first()).toBeVisible();
    await expect(page.getByText(/จำนวน 2 ครั้ง/).first()).toBeVisible();
    // missing values stay honest — ยังไม่ทราบ, never ผ่าน
    await expect(page.getByText("ยังไม่ทราบ").first()).toBeVisible();
  });
});
