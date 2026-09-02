import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

const WATER_ROW = {
  reading_date: "2026-08-30",
  do_average: 2.4,
  ph: 7.2,
  free_chlorine: 0.8,
  tds_aeration: 510,
  water_used_total: 100,
  wastewater_in: 92,
  system_operating: true,
  wastewater_discharged: false,
  do_alert: false,
  chlorine_alert: false,
  ph_alert: false,
};

const CARBON_ROWS = [
  { month: "2026-08", days: 5, kwh_total: 1234.5, tco2e: 0.617 },
  { month: "2026-07", days: 4, kwh_total: 1100, tco2e: 0.55 },
];

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

  await page.addInitScript((sess) => {
    localStorage.setItem("sb-gllqtbyofrcjzmbnfoeh-auth-token", JSON.stringify(sess));
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

async function mockOverview(
  page: Page,
  opts: {
    water?: Partial<typeof WATER_ROW>;
    waterStatus?: number;
    carbonStatus?: number;
  } = {},
) {
  await page.route("**/rest/v1/v_dashboard_14day**", async (route) => {
    const status = opts.waterStatus ?? 200;
    await route.fulfill({
      status,
      contentType: "application/json",
      body: status === 200 ? JSON.stringify([{ ...WATER_ROW, ...opts.water }]) : JSON.stringify({ message: "water failed" }),
    });
  });

  await page.route("**/rest/v1/v_overview_carbon**", async (route) => {
    const status = opts.carbonStatus ?? 200;
    await route.fulfill({
      status,
      contentType: "application/json",
      body: status === 200 ? JSON.stringify(CARBON_ROWS) : JSON.stringify({ message: "carbon failed" }),
    });
  });
}

for (const width of [360, 390, 430]) {
  test(`phone ${width}px recomposes command-center hierarchy without document overflow`, async ({ page }) => {
    await installStaffSession(page);
    await page.setViewportSize({ width, height: 844 });
    await mockOverview(page);
    await page.goto("/");

    const situation = page.getByTestId("overview-situation-grid");
    const attention = page.getByTestId("overview-attention");
    const spatial = page.getByTestId("overview-spatial-entry");
    const domains = page.getByTestId("overview-domain-links");
    const actions = page.getByTestId("overview-supporting-actions");

    await expect(situation).toBeVisible();
    await expect(attention).toBeVisible();
    await expect(spatial).toBeVisible();
    await expect(domains).toBeVisible();
    await expect(actions).toBeVisible();

    const boxes = await Promise.all([situation, attention, spatial, domains, actions].map((locator) => locator.boundingBox()));
    expect(boxes.every(Boolean)).toBe(true);
    for (let i = 1; i < boxes.length; i += 1) {
      expect(boxes[i]!.y).toBeGreaterThanOrEqual(boxes[i - 1]!.y + boxes[i - 1]!.height - 1);
    }

    const geometry = await page.evaluate(() => ({
      viewport: window.innerWidth,
      doc: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));
    expect(geometry.doc).toBeLessThanOrEqual(geometry.viewport);
    expect(geometry.body).toBeLessThanOrEqual(geometry.viewport);

    const important = page.locator('[data-command-action="true"]');
    expect(await important.count()).toBeGreaterThan(0);
    for (let i = 0; i < (await important.count()); i += 1) {
      const box = await important.nth(i).boundingBox();
      expect(box, `action ${i}`).not.toBeNull();
      expect(box!.height, `action ${i} height`).toBeGreaterThanOrEqual(44);
    }
  });
}

test("scopes wastewater condition to the latest record and preserves its date", async ({ page }) => {
    await installStaffSession(page);
  await mockOverview(page);
  await page.goto("/");

  const water = page.getByTestId("overview-water-card");
  await expect(water).toContainText("DO เฉลี่ยล่าสุด");
  await expect(water).toContainText("บันทึกล่าสุด: ปกติ");
  await expect(water).toContainText("30 ส.ค. 2569");
  await expect(water).not.toContainText(/^ปกติ$/);
});

test("labels monthly energy count as records, not unique recorded days, and exposes month periods", async ({ page }) => {
    await installStaffSession(page);
  await mockOverview(page);
  await page.goto("/");

  const energy = page.getByTestId("overview-energy-card");
  const carbon = page.getByTestId("overview-carbon-card");

  await expect(energy).toContainText("5 รายการ");
  await expect(energy).not.toContainText("5 วันที่บันทึก");
  await expect(energy).toContainText("ส.ค. 2569");
  await expect(carbon).toContainText("ส.ค. 2569");
  await expect(carbon).toContainText(/MoM/);
});

test("attention lane appears from existing abnormal/alert state without inventing a global all-normal claim", async ({ page }) => {
    await installStaffSession(page);
  await mockOverview(page, { water: { system_operating: false } });
  await page.goto("/");

  const attention = page.getByTestId("overview-attention");
  await expect(attention).toContainText(/ต้องตรวจสอบ|ผิดปกติ/);
  await expect(attention.getByRole("link", { name: /เปิดแดชบอร์ดน้ำเสีย|ตรวจสอบระบบบำบัด/ })).toHaveAttribute("href", /dashboard$/);
  await expect(page.getByText(/ทุกระบบปกติ|all systems normal/i)).toHaveCount(0);
});

test("provides lightweight Twin/Process and real domain drill-downs without mounting Canvas", async ({ page }) => {
    await installStaffSession(page);
  await mockOverview(page);
  await page.goto("/");

  const spatial = page.getByTestId("overview-spatial-entry");
  await expect(spatial).toContainText(/Digital Twin|Process/);
  await expect(spatial.getByRole("link", { name: /Digital Twin|Process|เปิดมุมมอง/ })).toHaveAttribute("href", /dashboard$/);
  await expect(page.locator("canvas")).toHaveCount(0);

  const domains = page.getByTestId("overview-domain-links");
  for (const href of ["/garbage", "/fuel", "/water-supply", "/safety"]) {
    await expect(domains.locator(`a[href$="${href}"]`)).toHaveCount(1);
  }
  await expect(domains).not.toContainText(/ปกติ|optimal|stable|flowing/i);
});

test("keeps unrelated carbon situation visible when wastewater source errors", async ({ page }) => {
    await installStaffSession(page);
  await mockOverview(page, { waterStatus: 500 });
  await page.goto("/");

  await expect(page.getByTestId("overview-water-card")).toContainText(/โหลด.*ไม่สำเร็จ/);
  await expect(page.getByTestId("overview-carbon-card")).toContainText("0.6170");
});

test("keyboard reaches command-center drill-down and supporting actions", async ({ page }) => {
    await installStaffSession(page);
  await mockOverview(page);
  await page.goto("/");

  const expectedHrefs = ["/dashboard", "/garbage", "/fuel", "/water-supply", "/safety", "/form", "/readings", "/trends", "/reports"];
  for (const href of expectedHrefs) {
    const link = page.locator(`a[href$="${href}"]`).first();
    await expect(link).toBeVisible();
    await link.focus();
    await expect(link).toBeFocused();
  }
});
