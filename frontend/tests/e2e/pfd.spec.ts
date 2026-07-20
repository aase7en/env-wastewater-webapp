import { test, expect } from "./fixtures";

/**
 * PFD interactive (F5 logic-half) smoke tests.
 *
 * Scope: verify the click + keyboard handlers and panel render without
 * crashing. The dashboard pulls its "today" row from v_dashboard_14day
 * filtered to the last 14 days — when the latest data is older than that
 * (which happens whenever no one has logged a reading in 2 weeks), the
 * PFD falls back to "ไม่มีข้อมูลวันนี้" and no stage <g> nodes render.
 *
 * So we cannot hard-assert "5 nodes present" — we have to assert on the
 * *behaviour*: either the 5 interactive nodes (when today row exists) or
 * the empty-state card (when it doesn't). A test that needs the nodes
 * MUST mock the dashboard response.
 */

const STAGE_DESCRIPTION = "ถังเติมอากาศ — จุลินทรีย์ย่อยสารอินทรีย์";

test.describe("PFD interactive drill-down", () => {
  test("dashboard renders either the PFD nodes or the empty-state fallback", async ({ page }) => {
    await page.goto("/dashboard");
    // Two valid states — both must render one of these, not neither.
    const nodes = page.locator("svg g[role='button']");
    const empty = page.getByText("ไม่มีข้อมูลวันนี้");
    await expect.poll(async () => {
      const n = await nodes.count();
      const e = await empty.count();
      return n + e;
    }, { timeout: 10_000 }).toBeGreaterThan(0);
  });

  test("with mocked today row: 5 stage nodes render with Thai aria-labels", async ({ page }) => {
    // Mock v_dashboard_14day to return one recent row so the PFD mounts.
    await page.route("**/rest/v1/v_dashboard_14day**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            reading_date: new Date().toISOString().slice(0, 10),
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
          },
        ]),
      });
    });
    await page.goto("/dashboard");
    const nodes = page.locator("svg g[role='button']");
    await expect(nodes).toHaveCount(5);
    const labels = await nodes.evaluateAll((els) =>
      els.map((e) => e.getAttribute("aria-label") ?? ""),
    );
    expect(labels.some((l) => l.startsWith("ตะแกรง"))).toBeTruthy();
    expect(labels.some((l) => l.startsWith("เติมอากาศ"))).toBeTruthy();
    expect(labels.some((l) => l.startsWith("ตกตะกอน"))).toBeTruthy();
    expect(labels.some((l) => l.startsWith("คลอรีน"))).toBeTruthy();
    expect(labels.some((l) => l.startsWith("ระบาย"))).toBeTruthy();
  });

  test("with mocked today row: clicking a stage node toggles the panel", async ({ page }) => {
    await page.route("**/rest/v1/v_dashboard_14day**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            reading_date: new Date().toISOString().slice(0, 10),
            do_average: 4.5, ph: 7.2, free_chlorine: 0.8, tds_aeration: 420,
            water_used_total: 100, wastewater_in: 80,
            system_operating: true, wastewater_discharged: true,
            do_alert: false, chlorine_alert: false, ph_alert: false,
          },
        ]),
      });
    });
    await page.goto("/dashboard");
    const aeration = page
      .locator("svg g[role='button']")
      .filter({ hasText: "เติมอากาศ" });
    await expect(page.getByText(STAGE_DESCRIPTION)).toHaveCount(0);
    await aeration.click();
    await expect(page.getByText(STAGE_DESCRIPTION)).toBeVisible();
    await aeration.click();
    await expect(page.getByText(STAGE_DESCRIPTION)).toHaveCount(0);
  });

  test("with mocked today row: keyboard Enter on focused stage node selects it", async ({ page }) => {
    await page.route("**/rest/v1/v_dashboard_14day**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            reading_date: new Date().toISOString().slice(0, 10),
            do_average: 4.5, ph: 7.2, free_chlorine: 0.8, tds_aeration: 420,
            water_used_total: 100, wastewater_in: 80,
            system_operating: true, wastewater_discharged: true,
            do_alert: false, chlorine_alert: false, ph_alert: false,
          },
        ]),
      });
    });
    await page.goto("/dashboard");
    const aeration = page
      .locator("svg g[role='button']")
      .filter({ hasText: "เติมอากาศ" });
    await aeration.focus();
    await expect(aeration).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByText(STAGE_DESCRIPTION)).toBeVisible();
    await page.keyboard.press("Space");
    await expect(page.getByText(STAGE_DESCRIPTION)).toHaveCount(0);
  });
});
