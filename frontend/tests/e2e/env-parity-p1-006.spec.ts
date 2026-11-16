/**
 * ENV-PARITY-P1-006 — e2e for the /reports date-range numeric summary
 * (reference doc 12 §3.7 Filter_Water ref 1544–2383 + §3.10 tap water_Filter
 * ref 2708–2960, pinned per WO §2).
 *
 * Mock model (page.route only — NO real writes anywhere): every Supabase
 * REST call is intercepted and fulfilled with fixtures; nothing touches
 * ENV_DB (house truth constraint: no durable writes in tests — recorded
 * honestly per WO §3.4).
 *
 * RED-first: at the RED commit the date-range summary section does not exist
 * on ReportsPage (PDF-template chooser only) — the failures are the evidence.
 *
 * Fixed test range: 2026-11-01..2026-11-07 (7 calendar days) with rows on
 * 11-02 (fully recorded), 11-04 (partial + boundary chain row), 11-06
 * (spec-missing chain row) — pinned expectations:
 *   บ่อบำบัด: มีบันทึก 2 / ไม่มีบันทึก 5 · ไฟฟ้า 120+80=200 (boundary NULL
 *   excluded + counted) · น้ำเข้า 40+50=90 (เฉลี่ย 45 จาก 2 วัน) · คลอรีนที่ใช้ 5 ·
 *   คลอรีนใช้จริง 2.5 · W/V ลิตร = 2.5×1.2 = 3 (ref 1949) · ตะกอนรวม 30 ·
 *   ปริมาณสูบ 20+22=42 (ค่าประมาณจากสเปก)
 *   น้ำประปา: มีบันทึก 1 / ไม่มีบันทึก 6 · น้ำเข้า 45 · คลอรีนจริง 0.5 ·
 *   Kg คลอรีน = 0.5×1.2 = 0.6 (ref 2849) · ไฟฟ้า 14.8 (ค่าประมาณจากสเปก) ·
 *   น้ำเข้าประมาณ 32 (ประมาณจากชั่วโมงปั๊ม)
 */
import { test, expect } from "./fixtures";

const RANGE_START = "2026-11-01";
const RANGE_END = "2026-11-07";

const READING_ROWS = [
  {
    id: "r1",
    reading_date: "2026-11-02",
    do_aeration: 3,
    do_sedimentation: 4,
    do_before_discharge: 5,
    ph: 7,
    free_chlorine: 0.8,
    tds_aeration: 210,
    tds_before_discharge: 300,
    sv30: 250,
    wastewater_in: 40,
    chlorine_used: 5,
    chlorine_mix_ratio: "1:2",
    excess_sludge_removed: 30,
  },
  {
    id: "r2",
    reading_date: "2026-11-04",
    do_aeration: 5,
    do_sedimentation: null,
    do_before_discharge: null,
    ph: null,
    free_chlorine: null,
    tds_aeration: null,
    tds_before_discharge: null,
    sv30: null,
    wastewater_in: 50,
    chlorine_used: null,
    chlorine_mix_ratio: null,
    excess_sludge_removed: null,
  },
];

const CHAIN_ROWS = [
  {
    id: "c1",
    reading_date: "2026-11-02",
    delta_kwh: 120,
    pump1_m3: 20,
    pump2_m3: 22,
    chlorine_used_real: 2.5,
    meter_boundary_flag: false,
    meter_boundary_reason: null,
    spec_missing: false,
    spec_missing_kinds: null,
  },
  {
    id: "c2",
    reading_date: "2026-11-04",
    delta_kwh: null,
    pump1_m3: null,
    pump2_m3: null,
    chlorine_used_real: null,
    meter_boundary_flag: true,
    meter_boundary_reason: "delta <= 0 (meter reset/swap suspected)",
    spec_missing: false,
    spec_missing_kinds: null,
  },
  {
    id: "c3",
    reading_date: "2026-11-06",
    delta_kwh: 80,
    pump1_m3: null,
    pump2_m3: null,
    chlorine_used_real: null,
    meter_boundary_flag: false,
    meter_boundary_reason: null,
    spec_missing: true,
    spec_missing_kinds: "pump_wastewater_1,pump_wastewater_2",
  },
];

const WATER_CHAIN_ROWS = [
  {
    id: "w1",
    check_date: "2026-11-02",
    hour_work: 4,
    water_in: 45,
    water_in_estimate: 32,
    chlorine_usage_realy: 0.5,
    energy_use_estimate: 14.8,
    hour_boundary_flag: false,
    spec_missing: false,
    spec_missing_kinds: null,
  },
];

const FLAG_ROWS = [
  {
    id: "f1",
    reading_date: "2026-11-02",
    critical_do1: true,
    critical_do2: false,
    critical_do3: false,
    critical_free_chlorine_low: false,
    critical_free_chlorine_high: false,
    critical_tds2: false,
    critical_ph: true,
    immediate_sv30: false,
    immediate_wastewater_in: false,
  },
  {
    id: "f2",
    reading_date: "2026-11-04",
    critical_do1: true,
    critical_do2: false,
    critical_do3: false,
    critical_free_chlorine_low: false,
    critical_free_chlorine_high: false,
    critical_tds2: false,
    critical_ph: false,
    immediate_sv30: false,
    immediate_wastewater_in: false,
  },
];

const CARBON_ROWS = [
  { month: "2026-01", days: 31, kwh_total: 100, tco2e: 1.5 },
  { month: "2025-12", days: 31, kwh_total: 90, tco2e: 2 },
];

async function mockReportRest(page: import("@playwright/test").Page) {
  const writes: string[] = [];
  await page.route("**/rest/v1/v_reading_with_computed**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(READING_ROWS) });
  });
  await page.route("**/rest/v1/v_reading_meter_chain**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(CHAIN_ROWS) });
  });
  await page.route("**/rest/v1/v_reading_critical_flags**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(FLAG_ROWS) });
  });
  await page.route("**/rest/v1/v_daily_check_chain**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(WATER_CHAIN_ROWS) });
  });
  await page.route("**/rest/v1/v_overview_carbon**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(CARBON_ROWS) });
  });
  // No-durable-write guard: record WRITE-method REST calls this page
  // attempts (POST/PATCH/PUT/DELETE mutate; HEAD/GET are read-only).
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

/** Open /reports and generate the summary for the fixed 7-day range. */
async function generateRange(page: import("@playwright/test").Page) {
  await page.goto("/reports");
  await page.getByTestId("report-range-start").fill(RANGE_START);
  await page.getByTestId("report-range-end").fill(RANGE_END);
  await page.getByTestId("report-generate").click();
}

test.describe("date-range summary generation", () => {
  test("renders the summary section for a selected range with a พ.ศ. range label", async ({ authed: page }) => {
    await mockReportRest(page);
    await generateRange(page);
    const section = page.getByTestId("report-summary-section");
    await expect(section).toBeVisible();
    await expect(section).toContainText("2569"); // พ.ศ. range label (2026 + 543)
  });

  test("wastewater aggregates render from the view rows (ref 1685–1779 sums)", async ({ authed: page }) => {
    await mockReportRest(page);
    await generateRange(page);
    await expect(page.getByTestId("report-energy-total")).toContainText("200"); // Σ delta_kwh
    await expect(page.getByTestId("report-wastewater-in-total")).toContainText("90"); // 40+50
    await expect(page.getByTestId("report-wastewater-in-avg")).toContainText("45"); // 90/2
    await expect(page.getByTestId("report-wastewater-in-avg")).toContainText("2"); // real denominator
    await expect(page.getByTestId("report-chlorine-total")).toContainText("5"); // คลอรีนน้ำ ที่ใช้
    await expect(page.getByTestId("report-chlorine-real-total")).toContainText("2.5"); // useage_Chlorine
    await expect(page.getByTestId("report-chlorine-litter")).toContainText("3"); // ×1.2 (ref 1949)
    await expect(page.getByTestId("report-sludge-total")).toContainText("30"); // recorded sludge (r1)
    await expect(page.getByTestId("report-pump-volume")).toContainText("42"); // spec-driven
    await expect(page.getByTestId("report-pump-volume")).toContainText("ค่าประมาณจากสเปก");
  });

  test("missing-days honesty row: มีบันทึก X วัน / ไม่มีบันทึก Y วัน — both sides", async ({ authed: page }) => {
    await mockReportRest(page);
    await generateRange(page);
    await expect(page.getByTestId("report-recorded-days-w")).toContainText("2");
    await expect(page.getByTestId("report-missing-days-w")).toContainText("5");
    await expect(page.getByTestId("report-recorded-days-ws")).toContainText("1");
    await expect(page.getByTestId("report-missing-days-ws")).toContainText("6");
  });

  test("boundary/spec-missing rows excluded + counted (never 0-filled)", async ({ authed: page }) => {
    await mockReportRest(page);
    await generateRange(page);
    await expect(page.getByTestId("report-energy-total")).toContainText("200"); // boundary NULL day adds nothing
    await expect(page.getByTestId("report-boundary-days")).toContainText("1");
    await expect(page.getByTestId("report-spec-missing-days")).toContainText("1");
  });

  test("water-supply aggregates render (ref 2796–2850) with the ×1.2 Kg_chlorine line", async ({ authed: page }) => {
    await mockReportRest(page);
    await generateRange(page);
    await expect(page.getByTestId("report-water-in-total")).toContainText("45");
    await expect(page.getByTestId("report-water-in-estimate")).toContainText("32");
    await expect(page.getByTestId("report-ws-chlorine-real")).toContainText("0.5");
    await expect(page.getByTestId("report-ws-kg-chlorine")).toContainText("0.6"); // ×1.2 (ref 2849)
    await expect(page.getByTestId("report-ws-energy-estimate")).toContainText("14.8");
  });

  test("derived aggregates carry the P1.5 verbatim estimate flags; recorded totals unflagged", async ({ authed: page }) => {
    await mockReportRest(page);
    const section = page.getByTestId("report-summary-section");
    await generateRange(page);
    await expect(section).toBeVisible();
    await expect(page.getByTestId("report-pump-volume")).toContainText("ค่าประมาณจากสเปก");
    await expect(page.getByTestId("report-ws-energy-estimate-card")).toContainText("ค่าประมาณจากสเปก");
    await expect(page.getByTestId("report-water-in-estimate-card")).toContainText("ประมาณจากชั่วโมงปั๊ม");
    // Recorded values carry NO estimate flag (WO §2.4-2)
    await expect(page.getByTestId("report-water-in-total-card")).not.toContainText("ประมาณจากชั่วโมงปั๊ม");
    await expect(page.getByTestId("report-wastewater-in-total-card")).not.toContainText("ค่าประมาณจากสเปก");
  });

  test("quality averages show real denominators (days-with-value only)", async ({ authed: page }) => {
    await mockReportRest(page);
    await generateRange(page);
    await expect(page.getByTestId("report-quality-do1")).toContainText("4"); // (3+5)/2
    await expect(page.getByTestId("report-quality-do1")).toContainText("2"); // denominator
    await expect(page.getByTestId("report-quality-freecl")).toContainText("0.8");
    await expect(page.getByTestId("report-quality-freecl")).toContainText("1"); // one day with value
  });

  test("monthly breakdown: no-record months shown as — (never 0) + พ.ศ. chart labels", async ({ authed: page }) => {
    await mockReportRest(page);
    await generateRange(page);
    // พฤศจิกายน has the 200 kWh; an empty month (มิถุนายน = month 6) is "—"
    await expect(page.getByTestId("report-month-cell-11")).toContainText("200");
    await expect(page.getByTestId("report-month-cell-6")).toContainText("—");
    await expect(page.getByTestId("report-month-cell-6")).not.toContainText("0");
    await expect(page.getByTestId("report-monthly-energy-chart")).toBeVisible();
    await expect(page.getByTestId("report-monthly-energy-chart")).toContainText("2569");
  });

  test("threshold-hit counts render from v_reading_critical_flags", async ({ authed: page }) => {
    await mockReportRest(page);
    await generateRange(page);
    await expect(page.getByTestId("report-threshold-critical-do1")).toContainText("2");
    await expect(page.getByTestId("report-threshold-critical-ph")).toContainText("1");
  });

  test("CO2 CY/LY surfaced from carbon.v_overview_carbon (display only, พ.ศ. years)", async ({ authed: page }) => {
    await mockReportRest(page);
    await generateRange(page);
    await expect(page.getByTestId("report-co2-cy")).toContainText("1.5");
    await expect(page.getByTestId("report-co2-cy")).toContainText("2569");
    await expect(page.getByTestId("report-co2-ly")).toContainText("2");
    await expect(page.getByTestId("report-co2-ly")).toContainText("2568");
  });
});

test.describe("regression + no-durable-write", () => {
  test("the existing PDF-template chooser stays intact (byte-untouched flow)", async ({ authed: page }) => {
    await mockReportRest(page);
    await page.goto("/reports");
    await expect(page.getByText("ทส.1", { exact: true })).toBeVisible();
    await expect(page.getByText("ทส.2", { exact: true })).toBeVisible();
    await expect(page.getByText("ใบแจ้งซ่อม", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "ดาวน์โหลด PDF", exact: true })).toBeVisible();
  });

  test("generating the summary performs NO durable writes (GET-only REST)", async ({ authed: page }) => {
    const writes = await mockReportRest(page);
    await generateRange(page);
    await expect(page.getByTestId("report-summary-section")).toBeVisible();
    expect(writes).toEqual([]);
  });
});
