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
  await expect(structural).toContainText(/Chlorine dosing/i);
  await expect(structural).toContainText(/ถังสารละลายคลอรีน/);
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

// ── ENV-VIS-STORY-001A: process-explanation step-through (Stage 1) ──

test("process explanation notice and step controls are visible with 12 teaching steps", async ({ page }) => {
  await installStaffSession(page);
  await mockLatestReading(page);
  await page.goto("/flow");

  await expect(page.getByTestId("process-explanation-notice")).toBeVisible();
  await expect(page.getByTestId("process-explanation-notice")).toContainText(
    "ภาพอธิบายกระบวนการ ไม่ใช่สถานะปัจจุบัน",
  );

  const controls = page.getByTestId("process-explanation-controls");
  await expect(controls).toBeVisible();
  await expect(controls.getByRole("button", { name: "ขั้นถัดไป" })).toBeVisible();
  await expect(controls.getByRole("button", { name: "ขั้นก่อนหน้า" })).toBeVisible();

  const steps = page.locator('[data-testid="process-explanation-step"]');
  await expect(steps).toHaveCount(12); // 8 SSoT stages + 4 confirmed branch cards
});

test("step-through advances one step at a time by button and keyboard", async ({ page }) => {
  await installStaffSession(page);
  await mockLatestReading(page);
  await page.goto("/flow");

  const steps = page.locator('[data-testid="process-explanation-step"]');
  await expect(steps).toHaveCount(12);
  await expect(steps.nth(0)).toHaveAttribute("data-active", "true");
  await expect(steps.nth(1)).toHaveAttribute("data-active", "false");

  await page.getByTestId("process-explanation-controls").getByRole("button", { name: "ขั้นถัดไป" }).click();
  await expect(steps.nth(0)).toHaveAttribute("data-active", "false");
  await expect(steps.nth(1)).toHaveAttribute("data-active", "true");

  await page.getByTestId("process-explanation-controls").getByRole("button", { name: "ขั้นก่อนหน้า" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(steps.nth(2)).toHaveAttribute("data-active", "true");
  await page.keyboard.press("ArrowLeft");
  await expect(steps.nth(1)).toHaveAttribute("data-active", "true");
});

test("bypass and emergency stay static dashed exceptions, never teaching steps", async ({ page }) => {
  await installStaffSession(page);
  await mockLatestReading(page);
  await page.goto("/flow");

  const exceptions = page.locator('[data-exception="true"]');
  await expect(exceptions).toHaveCount(2);
  for (let i = 0; i < 2; i += 1) {
    await expect(exceptions.nth(i)).not.toHaveAttribute("data-testid", "process-explanation-step");
    const styles = await exceptions.nth(i).evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return { animationName: computed.animationName, borderStyle: computed.borderStyle };
    });
    expect(styles.animationName).toBe("none");
    expect(styles.borderStyle).toBe("dashed");
  }
  // The exception cards carry the Thai uncertainty note from the topology contract.
  const exceptionText = await exceptions.allInnerTexts();
  const joined = exceptionText.join("\n");
  expect(joined).toContain("ยังไม่ยืนยันการเชื่อมต่อจริง");
});

// ── ENV-VIS-STORY-001B-VIEW: SIMULATED scenario view (Stage 2 consumer) ──

test("scenario picker lists all six hypothetical scenarios; select alone changes nothing", async ({ page }) => {
  await installStaffSession(page);
  await mockLatestReading(page);
  await page.goto("/flow");

  const picker = page.getByTestId("process-scenario-picker");
  await expect(picker).toBeVisible();
  const options = picker.locator("option");
  await expect(options).toHaveCount(6);
  for (const label of [
    "เปิดเส้นทางรองบ่อพัก (สมมุติ)",
    "เปิดเส้นทางล้นฉุกเฉิน (สมมุติ)",
    "หยุดการเติมอากาศ (บ่อเติมอากาศ)",
    "หยุดส่งตะกอนไหลกลับ (RAS)",
    "การทิ้งตะกอนส่วนเกิน (WAS)",
    "หยุดจ่ายคลอรีน (สมมุติ)",
  ]) {
    await expect(options.filter({ hasText: label })).toHaveCount(1);
  }
  // Selecting alone changes nothing: no banner, no markers before ใช้สถานการณ์สมมุติ.
  await picker.selectOption({ label: "เปิดเส้นทางรองบ่อพัก (สมมุติ)" });
  await expect(page.getByTestId("process-scenario-banner")).toHaveCount(0);
  await expect(page.getByTestId("process-scenario-marker")).toHaveCount(0);
});

test("applying a scenario shows the SIMULATED banner, markers, and assumptions; clear removes them", async ({ page }) => {
  await installStaffSession(page);
  await mockLatestReading(page);
  await page.goto("/flow");

  await page.getByTestId("process-scenario-picker").selectOption({ label: "เปิดเส้นทางรองบ่อพัก (สมมุติ)" });
  await page.getByTestId("process-scenario-apply").click();

  const banner = page.getByTestId("process-scenario-banner");
  await expect(banner).toBeVisible();
  await expect(banner).toContainText("โหมดจำลอง (SIMULATED) — ไม่ใช่ข้อมูลจริง");
  await expect(banner).toContainText("pump-sump-bypass-active");
  await expect(banner).toContainText("สมมุติ");

  const marker = page.getByTestId("process-scenario-marker");
  await expect(marker).toHaveCount(1);
  await expect(marker.first()).toHaveAttribute("data-scenario-edge-id", "pump-sump-bypass");
  await expect(marker.first()).toHaveAttribute("data-scenario-state", "active-path");
  await expect(marker.first()).toContainText("สมมุติ: เปิดใช้เส้นทาง");

  // The activated exception card RETAINS its as-built uncertainty.
  const exceptionCard = page.locator('[data-exception="true"]').first();
  await expect(exceptionCard).toContainText("ยังไม่ยืนยันการเชื่อมต่อจริง");

  await page.getByTestId("process-scenario-clear").click();
  await expect(page.getByTestId("process-scenario-banner")).toHaveCount(0);
  await expect(page.getByTestId("process-scenario-marker")).toHaveCount(0);
});

test("banner stays visible with the picker collapsed; loss-of-aeration marks only the stage", async ({ page }) => {
  await installStaffSession(page);
  await mockLatestReading(page);
  await page.goto("/flow");

  await page.getByTestId("process-scenario-picker").selectOption({ label: "หยุดการเติมอากาศ (บ่อเติมอากาศ)" });
  await page.getByTestId("process-scenario-apply").click();
  await expect(page.getByTestId("process-scenario-banner")).toBeVisible();

  // Collapse the picker section; the banner must persist.
  await page.getByTestId("process-scenario-picker").click({ position: { x: 8, y: 8 } }).catch(() => {});
  const summary = page.getByTestId("process-scenario-picker");
  await summary.evaluate((el) => (el as HTMLElement).blur()).catch(() => {});
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(150);
  await expect(page.getByTestId("process-scenario-banner")).toBeVisible();

  const marker = page.getByTestId("process-scenario-marker");
  await expect(marker).toHaveCount(1);
  await expect(marker.first()).toHaveAttribute("data-scenario-stage-id", "aeration_tank");
  await expect(marker.first()).toHaveAttribute("data-scenario-state", "process-interrupted");
  await expect(marker.first()).toContainText("สมมุติ: หยุดเติมอากาศ");
});

test("observed evidence stays unchanged and scenario UI carries no operational vocabulary", async ({ page }) => {
  await installStaffSession(page);
  await mockLatestReading(page);
  await page.goto("/flow");

  const evidence = page.getByTestId("flow-quantity-evidence");
  await expect(evidence).toBeVisible();
  const before = await evidence.innerText();

  await page.getByTestId("process-scenario-picker").selectOption({ label: "หยุดจ่ายคลอรีน (สมมุติ)" });
  await page.getByTestId("process-scenario-apply").click();
  await expect(page.getByTestId("process-scenario-banner")).toBeVisible();

  const after = await evidence.innerText();
  expect(after).toBe(before);

  const scenarioRegionText = await page
    .getByTestId("process-scenario-banner")
    .innerText()
    .catch(() => "");
  expect(scenarioRegionText).not.toMatch(/LIVE|LATEST|HISTORICAL/i);
  const markerText = await page.getByTestId("process-scenario-marker").first().innerText();
  expect(markerText).not.toMatch(/LIVE|LATEST|HISTORICAL|\d+\.\d+/);
});
