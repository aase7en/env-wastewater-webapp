import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const STAFF_UID = "00000000-0000-0000-0000-0000000000aa";

async function installStaffSession(page: Page) {
  const session = {
    access_token: "fake-staff-access-token",
    refresh_token: "fake-staff-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: STAFF_UID,
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: { email: "staff@example.test", full_name: "E2E Staff" },
      aud: "authenticated",
      email: "staff@example.test",
    },
  };
  await page.addInitScript((value) => {
    localStorage.setItem("sb-gllqtbyofrcjzmbnfoeh-auth-token", JSON.stringify(value));
  }, session);
  await page.route("**/rest/v1/app_user**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { id: STAFF_UID, role: "staff", display_name: "E2E Staff", is_active: true },
      ]),
    });
  });
}

async function mockLatestReading(
  page: Page,
  row: Record<string, unknown> | null = {
    id: "11111111-1111-1111-1111-111111111111",
    reading_date: "2026-09-01",
    water_used_total: 120.5,
    wastewater_in: 82.25,
    excess_sludge_removed: 1.75,
    wastewater_discharged: true,
  },
) {
  await page.route("**/rest/v1/v_dashboard_14day**", async (route) => {
    const url = new URL(route.request().url());
    if ((url.searchParams.get("select") ?? "").includes("id")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "content-range": row ? "0-0/1" : "*/0" },
        body: JSON.stringify(row ? [{ id: row.id, reading_date: row.reading_date }] : []),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });

  await page.route("**/rest/v1/v_reading_with_computed**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(row),
    });
  });
}

for (const width of [360, 390, 430]) {
  test(`phone ${width}px renders truthful flow without document overflow`, async ({ page }) => {
    await installStaffSession(page);
    await mockLatestReading(page);
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/flow");

    await expect(page.getByRole("heading", { name: /Environmental Flow|การไหลเชิงสิ่งแวดล้อม/ })).toBeVisible();
    await expect(page.getByTestId("flow-quantity-evidence")).toBeVisible();
    await expect(page.getByTestId("flow-structural-story")).toBeVisible();
    await expect(page.getByText(/ไม่ใช่สถานะ Live|ไม่ใช่ Live/)).toBeVisible();

    const geometry = await page.evaluate(() => ({
      viewport: window.innerWidth,
      doc: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));
    expect(geometry.doc).toBeLessThanOrEqual(geometry.viewport);
    expect(geometry.body).toBeLessThanOrEqual(geometry.viewport);

    const actions = page.locator('[data-flow-action="true"]');
    expect(await actions.count()).toBeGreaterThan(0);
    for (let i = 0; i < (await actions.count()); i += 1) {
      const box = await actions.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
}

test("shows exact latest evidence without inventing mass balance or discharge volume", async ({ page }) => {
  await installStaffSession(page);
  await mockLatestReading(page);
  await page.goto("/flow");

  const evidence = page.getByTestId("flow-quantity-evidence");
  await expect(evidence).toContainText("120.5");
  await expect(evidence).toContainText("82.25");
  await expect(evidence).toContainText("1.75");
  await expect(page.getByText(/1 ก.ย. 2569/)).toBeVisible();

  const discharge = page.getByTestId("flow-discharge-evidence");
  await expect(discharge).toContainText(/มีบันทึกการระบาย|บันทึกว่า.*ระบาย/);
  await expect(discharge).toContainText(/ปริมาณ.*ไม่มีข้อมูล/);
  await expect(discharge).not.toContainText(/82\.25.*ปริมาณระบาย/);
  await expect(page.getByText(/สมดุลน้ำ|mass balance/i)).toContainText(/ไม่|ไม่ได้|ห้าม|ไม่ใช่/);
  await expect(page.getByText(/dummy|ข้อมูลตัวอย่าง/i)).toHaveCount(0);
});

test("keeps missing quantities unavailable instead of zero", async ({ page }) => {
  await installStaffSession(page);
  await mockLatestReading(page, {
    id: "11111111-1111-1111-1111-111111111111",
    reading_date: "2026-09-01",
    water_used_total: null,
    wastewater_in: null,
    excess_sludge_removed: null,
    wastewater_discharged: null,
  });
  await page.goto("/flow");

  const evidence = page.getByTestId("flow-quantity-evidence");
  await expect(evidence.getByText("—")).toHaveCount(3);
  await expect(page.getByTestId("flow-discharge-evidence")).toContainText(/ไม่ทราบ|ยังไม่ได้บันทึก/);
});

test("renders RAS, WAS, filtrate, bypass and emergency truthfully without fabricated quantities", async ({ page }) => {
  await installStaffSession(page);
  await mockLatestReading(page);
  await page.goto("/flow");

  const structural = page.getByTestId("flow-structural-story");
  await expect(structural).toContainText("RAS");
  await expect(structural).toContainText("WAS");
  await expect(structural).toContainText(/filtrate|น้ำกรอง|น้ำที่เหลือจากการกรอง/i);
  await expect(structural).toContainText(/Bypass|บายพาส/i);
  await expect(structural).toContainText(/ฉุกเฉิน|Emergency/i);
  await expect(structural).toContainText(/ไม่มีข้อมูลปริมาณ|ปริมาณ.*ไม่พร้อม/);
});

test("empty source stays an explicit empty state", async ({ page }) => {
  await installStaffSession(page);
  await mockLatestReading(page, null);
  await page.goto("/flow");

  await expect(page.getByText(/ยังไม่มีบันทึก|ไม่มีข้อมูลการไหล/)).toBeVisible();
  await expect(page.getByTestId("flow-quantity-evidence")).toContainText("—");
});

test("source failure stays local and never fabricates quantity", async ({ page }) => {
  await installStaffSession(page);
  await page.route("**/rest/v1/v_dashboard_14day**", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "synthetic source failure" }),
    });
  });
  await page.goto("/flow");

  await expect(page.getByText("โหลดหลักฐานล่าสุดไม่สำเร็จ")).toBeVisible();
  await expect(page.getByTestId("flow-quantity-evidence").getByText("—")).toHaveCount(3);
  await expect(page.getByTestId("flow-structural-story")).toContainText("Activated Sludge");
  await expect(page.getByText(/dummy|ข้อมูลตัวอย่าง/i)).toHaveCount(0);
});

test("command center exposes the flow surface and all flow drill-down links are keyboard reachable", async ({ page }) => {
  await installStaffSession(page);
  await mockLatestReading(page);
  await page.goto("/");

  const flowLink = page.locator('a[href$="/flow"]').first();
  await expect(flowLink).toBeVisible();
  await flowLink.focus();
  await expect(flowLink).toBeFocused();

  await page.goto("/flow");
  for (const href of ["/dashboard", "/readings", "/form"]) {
    const link = page.locator(`a[href$="${href}"]`).first();
    await expect(link).toBeVisible();
    await link.focus();
    await expect(link).toBeFocused();
  }
});
