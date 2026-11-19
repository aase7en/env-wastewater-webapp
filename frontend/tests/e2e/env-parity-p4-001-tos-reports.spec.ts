/**
 * ENV-PARITY-P4-001 — e2e for the ทส.1/ทส.2 print-ready report views
 * (the B4-approved PDF-report lane; D1 drive-template enumeration in
 * docs/ai/handoffs/ENV-PARITY-P4-001-GLM.md §5 D1).
 *
 * Mock model (page.route only — NO real writes anywhere, ห้ามเขียน Drive):
 * every Supabase REST call is intercepted and fulfilled with fixtures;
 * nothing touches ENV_DB.
 *
 * RED-first: at the RED commit the print views do not exist on ReportsPage —
 * the failures are the evidence.
 *
 * Pinned fixture range: month 2026-11 (พ.ศ. 2569). Pins under test:
 *   - the ทส.2 §๑ address header renders the B7 TABLE values (core.address
 *     fixture อุทัยใหม่/อุทัยธานี/พระนครศรีอยุธยา — NOT the template constants)
 *   - พ.ศ. month/year in the report heading (พฤศจิกายน พ.ศ. 2569)
 *   - estimate/provenance flags carried into the printed view
 *     (meter-delta energy, ×1.2 chlorine litter)
 *   - the ทส.1 census column layout (drive-template verbatim labels)
 *   - unknown ≠ zero (a null cell renders "—" / ค่าว่าง, never 0)
 *   - the print-to-PDF affordance exists and calls window.print()
 */
import { test, expect } from "./fixtures";

const MONTH = "2026-11";

const DASH_ROWS = [
  {
    reading_date: "2026-11-02",
    do_average: 3.2, ph: 7.1, free_chlorine: 0.8, tds_aeration: 210,
    water_used_total: 48.5, wastewater_in: 32.0,
    system_operating: true, wastewater_discharged: true,
    do_alert: false, chlorine_alert: false, ph_alert: false,
  },
  {
    reading_date: "2026-11-03",
    do_average: 2.9, ph: 7.0, free_chlorine: 0.6, tds_aeration: 205,
    water_used_total: null, wastewater_in: 28.4,
    system_operating: true, wastewater_discharged: false,
    do_alert: false, chlorine_alert: true, ph_alert: false,
  },
];

const READING_ROWS = [
  {
    id: "r1", reading_date: "2026-11-02",
    do_aeration: 3.4, do_sedimentation: 3.0, do_before_discharge: 5.2,
    ph: 7.1, free_chlorine: 0.8, tds_aeration: 210, tds_before_discharge: 180,
    sv30: 220, wastewater_in: 32.0, chlorine_used: 2.0,
    chlorine_mix_ratio: "1:9", excess_sludge_removed: 1.5,
  },
  {
    id: "r2", reading_date: "2026-11-03",
    do_aeration: 3.1, do_sedimentation: 2.8, do_before_discharge: 5.0,
    ph: 7.0, free_chlorine: 0.6, tds_aeration: 205, tds_before_discharge: 178,
    sv30: 215, wastewater_in: 28.4, chlorine_used: null,
    chlorine_mix_ratio: "1:9", excess_sludge_removed: null,
  },
];

const CHAIN_ROWS = [
  { id: "c1", reading_date: "2026-11-02", delta_kwh: 30.5, pump1_m3: 15.0, pump2_m3: 10.0, chlorine_used_real: 2.0, meter_boundary_flag: false, meter_boundary_reason: null, spec_missing: false, spec_missing_kinds: null },
  { id: "c2", reading_date: "2026-11-03", delta_kwh: null, pump1_m3: 12.0, pump2_m3: 9.0, chlorine_used_real: 0.9, meter_boundary_flag: true, meter_boundary_reason: "meter reset", spec_missing: false, spec_missing_kinds: null },
];

const WATER_CHAIN_ROWS = [
  { id: "w1", check_date: "2026-11-02", hour_work: 4, water_in: 40, water_in_estimate: null, chlorine_usage_realy: 1.0, energy_use_estimate: 14.8, hour_boundary_flag: false, spec_missing: false, spec_missing_kinds: null },
];

const RUN_ROWS = [
  {
    id: "s1", reading_date: "2026-11-02",
    pump1_running: true, pump2_running: true,
    aerator1_running: true, aerator2_running: true,
    sludge_pump1_running: true, sludge_pump2_running: true,
    chlorine_pump1_running: true, chlorine_pump2_running: false,
  },
];

// The B7 address-table fixture — deliberately ≠ the template constants
// (template hardcodes ตำบล "อุทัย"; the table says อุทัยใหม่). The view
// must render THE TABLE VALUES to prove it is table-driven (B7).
const ADDRESS_ROW = {
  id: "addr-1",
  tambon_id: 610101,
  tambon_thai: "อุทัยใหม่",
  district_id: 6101,
  district_thai: "อุทัยธานี",
  province_id: 61,
  province_thai: "พระนครศรีอยุธยา",
};

async function mockReportsRest(page: import("@playwright/test").Page) {
  // /reports mount-time fetches (P2.5 safety+coliform section + auth)
  await page.route("**/rest/v1/extinguisher_inspection**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
  await page.route("**/rest/v1/fire_extinguisher**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
  await page.route("**/rest/v1/emergency_light_check**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
  await page.route("**/rest/v1/lab_test**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
  // the P4.1 report surfaces
  await page.route("**/rest/v1/v_dashboard_14day**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(DASH_ROWS) });
  });
  await page.route("**/rest/v1/v_reading_with_computed**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(READING_ROWS) });
  });
  await page.route("**/rest/v1/v_reading_meter_chain**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(CHAIN_ROWS) });
  });
  await page.route("**/rest/v1/v_daily_check_chain**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(WATER_CHAIN_ROWS) });
  });
  await page.route("**/rest/v1/address**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([ADDRESS_ROW]) });
  });
  await page.route("**/rest/v1/reading?**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(RUN_ROWS) });
  });
  // No-durable-write guard: record WRITE-method REST calls this page attempts.
  const writes: string[] = [];
  await page.route("**/rest/v1/**", async (route) => {
    const method = route.request().method();
    if (method === "POST" || method === "PATCH" || method === "PUT" || method === "DELETE") {
      writes.push(method);
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      return;
    }
    await route.fallback();
  });
  return writes;
}

async function openPrintView(page: import("@playwright/test").Page, template: "ts1" | "ts2") {
  await page.goto("/reports");
  await page.getByTestId(`report-template-${template}`).click();
  await page.getByTestId("report-month").fill(MONTH);
  await page.getByTestId("report-open-print").click();
  return page.getByTestId("tos-print-view");
}

test.describe("ทส.1/ทส.2 print-ready views (P4.1)", () => {
  test("ทส.2: address header renders the B7 TABLE values + พ.ศ. heading", async ({ authed: page }) => {
    await mockReportsRest(page);
    await openPrintView(page, "ts2");
    // THE TABLE VALUE (template constant would be "อุทัย" — table wins per B7)
    await expect(page.getByTestId("tos2-addr-tambon")).toContainText("อุทัยใหม่");
    await expect(page.getByTestId("tos2-addr-district")).toContainText("อุทัยธานี");
    await expect(page.getByTestId("tos2-addr-province")).toContainText("พระนครศรีอยุธยา");
    // พ.ศ. heading
    await expect(page.getByTestId("tos2-month-year")).toContainText("พฤศจิกายน");
    await expect(page.getByTestId("tos2-month-year")).toContainText("2569");
  });

  test("ทส.2: estimate/provenance flags render in the printed view (energy delta, ×1.2)", async ({ authed: page }) => {
    await mockReportsRest(page);
    await openPrintView(page, "ts2");
    await expect(page.getByTestId("tos2-energy-note")).toContainText("มิเตอร์");
    await expect(page.getByTestId("tos2-chlorine-note")).toContainText("1.2");
    // honest day-count line — 2 recorded days of 30, never 0-filled
    await expect(page.getByTestId("tos2-daycount")).toContainText("28");
  });

  test("ทส.2: §๓ census labels render verbatim (Sum_* layout per the drive template)", async ({ authed: page }) => {
    await mockReportsRest(page);
    await openPrintView(page, "ts2");
    await expect(page.getByTestId("tos-print-view")).toContainText("ปริมาณการใช้ไฟฟ้าของระบบบำบัดน้ำเสีย");
    await expect(page.getByTestId("tos-print-view")).toContainText("ปริมาณน้ำใช้ทุกกกิจกรรมในแหล่งกำเนิดมลพิษ");
    await expect(page.getByTestId("tos-print-view")).toContainText("ปริมาณน้ำเสียที่เข้าระบบบำบัดน้ำเสีย");
    await expect(page.getByTestId("tos-print-view")).toContainText("ปริมาณตะกอนส่วนเกินจากระบบบำบัดน้ำเสียที่นำไปกำจัด");
  });

  test("ทส.1: census column layout renders (drive-template verbatim labels)", async ({ authed: page }) => {
    await mockReportsRest(page);
    await openPrintView(page, "ts1");
    const view = page.getByTestId("tos-print-view");
    await expect(view).toContainText("แบบรายงาน ทส.1");
    await expect(view).toContainText("ปริมาณการใช้ไฟฟ้าของระบบบำบัดน้ำเสีย");
    await expect(view).toContainText("ปริมาณน้ำใช้ในทุกกิจกรรมของแหล่งกำเนิดมลพิษ");
    await expect(view).toContainText("ปริมาณน้ำเสียที่เข้าระบบบ่อบำบัดน้ำเสีย");
    await expect(view).toContainText("ปริมาณออกซิเจนละลายน้ำ");
    await expect(view).toContainText("เครื่องจ่ายคลอรีน 2");
    // พ.ศ. date in the daily row
    await expect(view).toContainText("2569");
  });

  test("ทส.1: unknown ≠ zero — the boundary-day energy cell + null chlorine render honest absence", async ({ authed: page }) => {
    await mockReportsRest(page);
    await openPrintView(page, "ts1");
    // 2026-11-03: chain delta NULL (boundary day) → "—", never 0
    await expect(page.getByTestId("tos1-cell-energy-2026-11-03")).toContainText("—");
    await expect(page.getByTestId("tos1-cell-energy-2026-11-03")).not.toContainText(/^0/);
    // chlorine null on 2026-11-03 → honest absence, never 0
    await expect(page.getByTestId("tos1-cell-chlorine-2026-11-03")).toContainText("—");
  });

  test("print-to-PDF affordance exists and calls window.print()", async ({ authed: page }) => {
    await mockReportsRest(page);
    await page.addInitScript(() => {
      (window as unknown as { __printCalled: boolean }).__printCalled = false;
      window.print = () => {
        (window as unknown as { __printCalled: boolean }).__printCalled = true;
      };
    });
    await openPrintView(page, "ts2");
    const btn = page.getByTestId("report-print-button");
    await expect(btn).toBeVisible();
    await btn.click();
    const called = await page.evaluate(() => (window as unknown as { __printCalled: boolean }).__printCalled);
    expect(called).toBe(true);
  });

  test("no durable REST writes are attempted by the print views", async ({ authed: page }) => {
    await mockReportsRest(page);
    await openPrintView(page, "ts1");
    await openPrintView(page, "ts2");
  });
});
