/**
 * ENV-PARITY-P2-005 — e2e for the /reports safety+coliform summary section
 * (AppSheet parity lane P2.5 — reference doc 12 §3.20 Filter_Firer
 * ref 3954–4293 + §3.35 Filter_Light ref 5183–5510 + §3.37
 * Filter_ColiformBac ref 5523–5574 + per-table semantics
 * §3.11/§3.16/§3.17/§3.19, pinned per WO ENV-PARITY-P2-005 §4).
 *
 * Mock model (page.route only — NO real writes anywhere): every Supabase
 * REST call is intercepted and fulfilled with fixtures; nothing touches
 * ENV_DB (house truth constraint: no durable writes in tests).
 *
 * RED-first: at the RED commit the safety+coliform summary section does not
 * exist on ReportsPage — the failures are the evidence.
 *
 * Fixed test range: 2026-11-01..2026-12-31. Pinned fixture expectations:
 *   ถัง: ตรวจ 5 รายการ / ถังที่ตรวจ (distinct) 3 · ปกติ 1 (barrier ชำรุด excluded
 *       — D1-4) · ผิดปกติ 2 (ชำรุด ∨ หมดอายุ) · ค่าไม่ครบ 1 · ทะเบียนถัง 0 →
 *       SOURCE_UNAVAILABLE honest label
 *   ไฟ: ตรวจ 5 · ผ่าน 4 / ไม่ผ่าน 1 · มี 4 / ไม่มี 1 · เหมาะสม 4 / ไม่เหมาะสม 1 ·
 *       แจ้งซ่อม 1 / แจ้งย้ายตำแหน่ง 1 / ขอติดตั้ง 1 / ไม่ระบุ 2 (D1-5)
 *   coliform: เก็บ 7 · รอผล 1 · มีผล 6 · ผ่าน(Negative) 2 / ไม่ผ่าน 2 ·
 *       Positive ++ 1 แยก · invalid 1 แยก · ค่าอื่น 1 · พ.ศ. monthly
 *       (พฤศจิกายน 2569 = 7, ธันวาคม = — never 0)
 */
import { test, expect } from "./fixtures";

const RANGE_START = "2026-11-01";
const RANGE_END = "2026-12-31";

const EXT_ROWS = [
  {
    id: "e1",
    inspection_date: "2026-11-02",
    extinguisher_id: "ext-A",
    pipe: "ปกติ",
    handle: "ปกติ",
    tank: "ปกติ",
    pressure_gauge: "ปกติ",
    barrier: "ชำรุด",
    breakdown_details: null,
  },
  {
    id: "e2",
    inspection_date: "2026-11-03",
    extinguisher_id: "ext-A",
    pipe: "ชำรุด",
    handle: "ปกติ",
    tank: "ปกติ",
    pressure_gauge: "ปกติ",
    barrier: "ปกติ",
    breakdown_details: null,
  },
  {
    id: "e3",
    inspection_date: "2026-11-04",
    extinguisher_id: "ext-B",
    pipe: null,
    handle: null,
    tank: null,
    pressure_gauge: null,
    barrier: null,
    breakdown_details: "หมดอายุ",
  },
  {
    id: "e4",
    inspection_date: "2026-11-05",
    extinguisher_id: "ext-C",
    pipe: null,
    handle: "ปกติ",
    tank: null,
    pressure_gauge: null,
    barrier: null,
    breakdown_details: null,
  },
];

const LIGHT_ROWS = [
  { id: "l1", check_date: "2026-11-02", persistency: "มี", position: "เหมาะสม", test_result: "ผ่าน", status: "แจ้งซ่อม" },
  { id: "l2", check_date: "2026-11-03", persistency: "ไม่มี", position: "ไม่เหมาะสม", test_result: "ไม่ผ่าน", status: "ขอติดตั้ง" },
  { id: "l3", check_date: "2026-11-04", persistency: "มี", position: "เหมาะสม", test_result: "ผ่าน", status: "แจ้งย้ายตำแหน่ง" },
  { id: "l4", check_date: "2026-11-05", persistency: "มี", position: "เหมาะสม", test_result: "ผ่าน", status: null },
  { id: "l5", check_date: "2026-11-06", persistency: "มี", position: "เหมาะสม", test_result: "ผ่าน", status: "" },
];

const COLIFORM_ROWS = [
  { id: "w1", sample_date: "2026-11-02", sample_source: "น้ำ", collect_point: "โรงครัว", result: "Negative", reported_date: "2026-11-04" },
  { id: "w2", sample_date: "2026-11-03", sample_source: "น้ำ", collect_point: "ตู้กดน้ำ OPD", result: null, reported_date: null },
  { id: "w3", sample_date: "2026-11-04", sample_source: "น้ำ", collect_point: "ตู้กดน้ำ IPD", result: "Positive ++", reported_date: "2026-11-06" },
  { id: "f1", sample_date: "2026-11-02", sample_source: "อาหาร", collect_point: "ช้อนสั้น", result: "invalid", reported_date: "2026-11-04" },
  { id: "f2", sample_date: "2026-11-05", sample_source: "อาหาร", collect_point: "ถาด", result: "Positive", reported_date: "2026-11-07" },
  { id: "p1", sample_date: "2026-11-03", sample_source: "พนักงาน", collect_point: null, result: "Negative", reported_date: "2026-11-05" },
  { id: "g1", sample_date: "2026-11-06", sample_source: "ทั่วไป", collect_point: "บ่อบำบัด", result: "ค่ากำกวม", reported_date: "2026-11-08" },
];

async function mockSummaryRest(page: import("@playwright/test").Page) {
  const writes: string[] = [];
  // ── the four P2.5 surfaces ──
  await page.route("**/rest/v1/extinguisher_inspection**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(EXT_ROWS) });
  });
  await page.route("**/rest/v1/fire_extinguisher**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
  await page.route("**/rest/v1/emergency_light_check**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(LIGHT_ROWS) });
  });
  await page.route("**/rest/v1/lab_test**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(COLIFORM_ROWS) });
  });
  // ── the P1.6 views (regression — the existing summary must keep working) ──
  await page.route("**/rest/v1/v_reading_with_computed**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
  await page.route("**/rest/v1/v_reading_meter_chain**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
  await page.route("**/rest/v1/v_reading_critical_flags**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
  await page.route("**/rest/v1/v_daily_check_chain**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
  await page.route("**/rest/v1/v_overview_carbon**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
  // No-durable-write guard: record WRITE-method REST calls this page attempts.
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

async function generateSafetyRange(page: import("@playwright/test").Page) {
  await page.goto("/reports");
  await page.getByTestId("safety-range-start").fill(RANGE_START);
  await page.getByTestId("safety-range-end").fill(RANGE_END);
  await page.getByTestId("safety-generate").click();
}

test.describe("safety+coliform summary section (P2.5)", () => {
  test("renders the section with a พ.ศ. range label after generate", async ({ authed: page }) => {
    await mockSummaryRest(page);
    await generateSafetyRange(page);
    const section = page.getByTestId("safety-summary-section");
    await expect(section).toBeVisible();
    await expect(page.getByTestId("safety-range-label")).toContainText("2569");
    await expect(page.getByTestId("safety-range-label")).toContainText("พฤศจิกายน");
  });

  test("ถัง domain: distinct-inspected / verbatim ปกติ∧4 (barrier excluded) / ผิดปกติ∨5 / honesty line", async ({ authed: page }) => {
    await mockSummaryRest(page);
    await generateSafetyRange(page);
    await expect(page.getByTestId("safety-ext-inspected")).toContainText("3"); // distinct ext-A/B/C (ext-A ×2)
    await expect(page.getByTestId("safety-ext-normal")).toContainText("1"); // ∧4 — barrier ชำรุด excluded (D1-4)
    await expect(page.getByTestId("safety-ext-abnormal")).toContainText("2"); // pipe ชำรุด + หมดอายุ
    await expect(page.getByTestId("safety-ext-incomplete")).toContainText("1"); // blank components disclosed
  });

  test("ถัง master denominator 0 → the honest SOURCE_UNAVAILABLE label (never a fake denominator)", async ({ authed: page }) => {
    await mockSummaryRest(page);
    await generateSafetyRange(page);
    await expect(page.getByTestId("safety-ext-master-unavailable")).toContainText("ยังไม่มีข้อมูลทะเบียนถัง");
  });

  test("ไฟ domain: headline pair + both-value displays + the ไม่ระบุ Status bucket (D1-5)", async ({ authed: page }) => {
    await mockSummaryRest(page);
    await generateSafetyRange(page);
    await expect(page.getByTestId("safety-light-total")).toContainText("5");
    await expect(page.getByTestId("safety-light-pass")).toContainText("4");
    await expect(page.getByTestId("safety-light-fail")).toContainText("1");
    await expect(page.getByTestId("safety-light-persistency-has")).toContainText("4");
    await expect(page.getByTestId("safety-light-persistency-not")).toContainText("1");
    await expect(page.getByTestId("safety-light-position-ok")).toContainText("4");
    await expect(page.getByTestId("safety-light-position-not")).toContainText("1");
    await expect(page.getByTestId("safety-light-status-repair")).toContainText("1");
    await expect(page.getByTestId("safety-light-status-relocate")).toContainText("1");
    await expect(page.getByTestId("safety-light-status-install")).toContainText("1");
    await expect(page.getByTestId("safety-light-status-unspecified")).toContainText("2");
  });

  test("coliform domain: เก็บ/รอผล/มีผล per source with รอผล as its own number", async ({ authed: page }) => {
    await mockSummaryRest(page);
    await generateSafetyRange(page);
    await expect(page.getByTestId("coliform-total-collected")).toContainText("7");
    await expect(page.getByTestId("coliform-total-pending")).toContainText("1");
    await expect(page.getByTestId("coliform-total-resulted")).toContainText("6");
    const water = page.getByTestId("coliform-source-water");
    await expect(water).toBeVisible();
    await expect(water).toContainText("3"); // เก็บ
    const employee = page.getByTestId("coliform-source-employee");
    await expect(employee).toContainText("ตัวอย่างจากบุคลากร"); // counts only, no identity
  });

  test("coliform results: ผ่าน/ไม่ผ่าน over the REAL มีผล denominator + ++ / invalid / ค่าอื่น separate", async ({ authed: page }) => {
    await mockSummaryRest(page);
    await generateSafetyRange(page);
    await expect(page.getByTestId("coliform-total-pass")).toContainText("2");
    await expect(page.getByTestId("coliform-total-fail")).toContainText("2");
    await expect(page.getByTestId("coliform-total-plusplus")).toContainText("1");
    await expect(page.getByTestId("coliform-total-invalid")).toContainText("1");
    await expect(page.getByTestId("coliform-total-other")).toContainText("1");
  });

  test("coliform monthly: พ.ศ. headers; empty future month renders — (never 0)", async ({ authed: page }) => {
    await mockSummaryRest(page);
    await generateSafetyRange(page);
    await expect(page.getByTestId("coliform-month-cell-2026-11")).toContainText("7");
    await expect(page.getByTestId("coliform-month-cell-2026-12")).toContainText("—");
    await expect(page.getByTestId("coliform-month-cell-2026-12")).not.toContainText("0");
  });
});

test.describe("regression + no-durable-write + mobile", () => {
  test("the P1.6 date-range summary controls stay intact (byte-untouched flow)", async ({ authed: page }) => {
    await mockSummaryRest(page);
    await page.goto("/reports");
    await expect(page.getByTestId("report-range-start")).toBeVisible();
    await expect(page.getByTestId("report-generate")).toBeVisible();
    await expect(page.getByText("ทส.1", { exact: true })).toBeVisible();
    await expect(page.getByText("ใบแจ้งซ่อม", { exact: true })).toBeVisible();
  });

  test("generating the safety+coliform summary performs NO durable writes (GET-only REST)", async ({ authed: page }) => {
    const writes = await mockSummaryRest(page);
    await generateSafetyRange(page);
    await expect(page.getByTestId("safety-summary-section")).toBeVisible();
    expect(writes).toEqual([]);
  });

  for (const width of [360, 390, 430]) {
    test(`mobile ${width}: the section fits without horizontal overflow`, async ({ authed: page }) => {
      await mockSummaryRest(page);
      await page.setViewportSize({ width, height: 800 });
      await generateSafetyRange(page);
      await expect(page.getByTestId("safety-summary-section")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(overflow).toBe(false);
    });
  }
});
