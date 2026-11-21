/**
 * ENV-PARITY-P4-005 — e2e for the three family print-ready report views
 * (ถังดับเพลิง / ไฟฉุกเฉิน / น้ำประปา — the AppSheet P4 FINAL lane).
 *
 * Mock model (page.route only — NO real writes anywhere, ห้ามเขียน Drive):
 * every Supabase REST call is intercepted and fulfilled with synthetic
 * fixtures; nothing touches ENV_DB. Fixtures are SYNTHETIC — the live
 * 332-row light history is never copied into tests.
 *
 * RED-first: at the RED commit the family views do not exist on
 * ReportsPage — the failures are the evidence.
 *
 * Pinned fixture range: month 2026-11 (พ.ศ. 2569). Pins under test:
 *   - ถัดดับเพลิง: the 9-column gdoc layout + the COMPUTED ☑/☐ pair +
 *     the SOURCE_UNAVAILABLE master note (fire_extinguisher empty)
 *   - ไฟฉุกเฉิน: the 6-column gdoc layout + the computed pair + the
 *     NULL light_id row rendered as-is (unknown ≠ 0)
 *   - น้ำประปา: the sample-PDF 5-column layout + the two monthly totals
 *     from the P1.5 surfaces + the estimate/layout-authority honesty notes
 *   - personnel columns render via the core.personnel display path
 *   - the print-to-PDF affordance exists and calls window.print()
 */
import { test, expect } from "./fixtures";

const MONTH = "2026-11";

const PERSONNEL_ROWS = [
  { id: "11111111-1111-1111-1111-111111111111", full_name: "พี่ทดสอบ หนึ่งเดียว", position: "นักวิชาการสาธารณสุข", status: "ปฏิบัติงาน" },
  { id: "22222222-2222-2222-2222-222222222222", full_name: "พี่สอบ สองสาม", position: "พนักงานบริการ", status: "ปฏิบัติงาน" },
];

const EXT_ROWS = [
  {
    id: "ext-ins-1", legacy_id: null, inspection_date: "2026-11-05",
    extinguisher_id: "EXT-001", location_snapshot: "ห้องเครื่อง ชั้น 1",
    type_snapshot: null, packed_date_snapshot: null, chem_exp_snapshot: null, size_snapshot: null,
    pipe: "ปกติ", handle: "ปกติ", tank: "ปกติ", pressure_gauge: "ปกติ", barrier: "ไม่มี",
    breakdown_details: null, cause_of_damaged: null,
    inspector_id: "11111111-1111-1111-1111-111111111111",
  },
  {
    id: "ext-ins-2", legacy_id: null, inspection_date: "2026-11-09",
    extinguisher_id: "EXT-002", location_snapshot: null,
    type_snapshot: null, packed_date_snapshot: null, chem_exp_snapshot: null, size_snapshot: null,
    pipe: "ปกติ", handle: "ปกติ", tank: "ปกติ", pressure_gauge: "ปกติ", barrier: "ไม่มี",
    breakdown_details: null, cause_of_damaged: null, inspector_id: null,
  },
];

const LIGHT_ROWS = [
  {
    id: "light-chk-1", legacy_id: null, check_date: "2026-11-04",
    erl_payload: "L-1", light_id: "L-1", location_snapshot: "อาคารผู้ป่วยนอก ชั้น 1",
    persistency: "มี", position: "เหมาะสม", test_result: "ผ่าน",
    auditor_id: "22222222-2222-2222-2222-222222222222", auditor_legacy_id: null,
    broken_detail: null, pic_path: null, status: null,
  },
  {
    id: "light-chk-2", legacy_id: null, check_date: "2026-11-18",
    erl_payload: "UNRESOLVED-9", light_id: null, location_snapshot: null,
    persistency: "มี", position: "เหมาะสม", test_result: "ไม่ผ่าน",
    auditor_id: null, auditor_legacy_id: null,
    broken_detail: null, pic_path: null, status: null,
  },
];

const WATER_ROWS = [
  {
    id: "ws-1", check_date: "2026-11-02", hour_meter: 1200, hour_work: 4,
    water_in: 40, water_in_estimate: null, chlorine_usage: 100, chlorine_usage_realy: 10,
    energy_use_estimate: 14.8, hour_boundary_flag: false, spec_missing: false, spec_missing_kinds: null,
    recorded_by: "11111111-1111-1111-1111-111111111111",
  },
  {
    id: "ws-2", check_date: "2026-11-03", hour_meter: 1204, hour_work: 4,
    water_in: null, water_in_estimate: 14.8, chlorine_usage: null, chlorine_usage_realy: null,
    energy_use_estimate: 14.8, hour_boundary_flag: false, spec_missing: true, spec_missing_kinds: "water_in",
    recorded_by: null,
  },
];

async function mockFamilyReportsRest(page: import("@playwright/test").Page) {
  // /reports mount-time fetches (P2.5 safety+coliform section + auth)
  await page.route("**/rest/v1/extinguisher_inspection**", async (route) => {
    const url = route.request().url();
    if (url.includes("inspection_date=")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(EXT_ROWS) });
    } else {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    }
  });
  await page.route("**/rest/v1/fire_extinguisher**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
  await page.route("**/rest/v1/emergency_light_check**", async (route) => {
    const url = route.request().url();
    if (url.includes("check_date=")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(LIGHT_ROWS) });
    } else {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    }
  });
  await page.route("**/rest/v1/lab_test**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
  await page.route("**/rest/v1/personnel**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PERSONNEL_ROWS) });
  });
  // the P1.6 surfaces (mounted section fetches only on click — mocked anyway)
  await page.route("**/rest/v1/v_dashboard_14day**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
  await page.route("**/rest/v1/v_reading_with_computed**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
  await page.route("**/rest/v1/v_reading_meter_chain**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
  await page.route("**/rest/v1/v_daily_check_chain**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(WATER_ROWS) });
  });
  await page.route("**/rest/v1/address**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
  await page.route("**/rest/v1/reading?**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
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

async function openFamilyPrint(page: import("@playwright/test").Page, family: "ext" | "light" | "water") {
  await page.goto("/reports");
  await page.getByTestId(`report-family-${family}`).click();
  await page.getByTestId("report-family-month").fill(MONTH);
  await page.getByTestId("report-family-open-print").click();
  return page.getByTestId("family-print-view");
}

test.describe("family print-ready views (P4.005: ถังดับเพลิง/ไฟฉุกเฉิน/น้ำประปา)", () => {
  test("ถังดับเพลิง: 9-column gdoc layout + computed ☑ pair + the SOURCE_UNAVAILABLE master note", async ({ authed: page }) => {
    await mockFamilyReportsRest(page);
    const view = await openFamilyPrint(page, "ext");
    await expect(view).toContainText("แบบฟอร์มรายงานผลการตรวจสอบถังดับเพลิงโรงพยาบาลอุทัย");
    await expect(view).toContainText("พฤศจิกายน พ.ศ. 2569");
    // the 9 gdoc columns verbatim
    for (const c of ["ลำดับ", "สถานที่ติดตั้ง", "สายฉีด", "คันบีบ", "ตัวถัง", "มาตรวัดแรงดัน", "สิ่งกีดขวาง", "รายละเอียดการชำรุด", "ผู้ตรวจสอบ"]) {
      await expect(page.getByTestId("family-print-columns")).toContainText(c);
    }
    // personnel display path — the mocked full_name, never a hardcoded template name
    await expect(page.getByTestId("ext-row-1-inspector")).toContainText("พี่ทดสอบ หนึ่งเดียว");
    // unknown inspector → the prescribed fallback, never a fabricated name
    await expect(page.getByTestId("ext-row-2-inspector")).toContainText("— ไม่ระบุ —");
    // computed summary — both fixture rows normal ⇒ ☑ ready + ☐ action-0
    await expect(page.getByTestId("family-summary-ready")).toContainText("☑ ถังดับเพลิงทุกจุดอยู่ในสภาพพร้อมใช้งาน");
    await expect(page.getByTestId("family-summary-action")).toContainText("จำนวน 0 ถัง");
    // master register empty (mocked) → the honest SOURCE_UNAVAILABLE note
    await expect(page.getByTestId("family-ext-master-note")).toContainText("ยังไม่มีข้อมูลทะเบียนถังดับเพลิง (master)");
  });

  test("ถังดับเพลิง: the ☑/☐ pair flips on a ชำรุด record — computed, never static", async ({ authed: page }) => {
    await mockFamilyReportsRest(page);
    await page.route("**/rest/v1/extinguisher_inspection**", async (route) => {
      const url = route.request().url();
      if (url.includes("inspection_date=")) {
        const abnormal = [...EXT_ROWS];
        abnormal[1] = { ...abnormal[1], pipe: "ชำรุด" };
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(abnormal) });
      } else {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
      }
    });
    await openFamilyPrint(page, "ext");
    await expect(page.getByTestId("family-summary-ready")).toContainText("☐ ถังดับเพลิงทุกจุดอยู่ในสภาพพร้อมใช้งาน");
    await expect(page.getByTestId("family-summary-action")).toContainText("☑ มีถังดับเพลิงที่ต้องดำเนินการแก้ไข/ซ่อมบำรุง จำนวน 1 ถัง");
  });

  test("ไฟฉุกเฉิน: 6-column gdoc layout + computed pair + the NULL light_id row rendered as-is", async ({ authed: page }) => {
    await mockFamilyReportsRest(page);
    const view = await openFamilyPrint(page, "light");
    await expect(view).toContainText("แบบฟอร์มรายงานผลการตรวจโคมไฟฉุกเฉินโรงพยาบาลอุทัย");
    for (const c of ["ลำดับ", "สถานที่ติดตั้ง", "ผลการทดสอบ", "จุดติดตั้ง", "สถานะร้องขอ", "ผู้ตรวจสอบ"]) {
      await expect(page.getByTestId("family-print-columns")).toContainText(c);
    }
    // 2 fixture rows render (the delivered history class) — none dropped
    await expect(page.getByTestId("light-row-1")).toBeVisible();
    await expect(page.getByTestId("light-row-2")).toBeVisible();
    // unknown ≠ 0: the NULL light_id row's location/status render honest absence
    await expect(page.getByTestId("light-cell-location-light-chk-2")).toContainText("—");
    await expect(page.getByTestId("light-cell-status-light-chk-2")).toContainText("—");
    await expect(page.getByTestId("light-cell-status-light-chk-2")).not.toContainText("ผ่าน");
    // computed pair: 1 ไม่ผ่าน of 2 ⇒ ☐ ready + ☑ action-1
    await expect(page.getByTestId("family-summary-ready")).toContainText("☐ โคมไฟฉุกเฉินทุกจุดอยู่ในสภาพพร้อมใช้งาน");
    await expect(page.getByTestId("family-summary-action")).toContainText("☑ มี โคมไฟฉุกเฉินที่ต้องดำเนินการแก้ไข/ซ่อมบำรุง จำนวน 1 เครื่อง");
    // personnel display path
    await expect(page.getByTestId("light-row-1")).toContainText("พี่สอบ สองสาม");
  });

  test("น้ำประปา: sample-PDF 5-column layout + monthly totals from the P1.5 surfaces + the honesty notes", async ({ authed: page }) => {
    await mockFamilyReportsRest(page);
    const view = await openFamilyPrint(page, "water");
    await expect(view).toContainText("แบบรายงานการใช้น้ำประปาบาดาลโรงพยาบาลอุทัย");
    for (const c of ["วัน/เดือน/ปี", "Hour_meter", "ใช้น้ำ(ลบ.ม.)", "คลอรีนที่ใช้(ลิตร)", "ผู้บันทึก"]) {
      await expect(page.getByTestId("family-print-columns")).toContainText(c);
    }
    // the two monthly totals (Σ water_in = 40; Σ chlorine_usage_realy = 10)
    await expect(page.getByTestId("family-water-total-water")).toContainText("40");
    await expect(page.getByTestId("family-water-total-water")).toContainText("ลบ.ม.");
    await expect(page.getByTestId("family-water-total-chlorine")).toContainText("10");
    await expect(page.getByTestId("family-water-total-chlorine")).toContainText("ลิตร");
    // P1.5 estimate flags carried into the print
    await expect(view).toContainText("ค่าประมาณจากสเปก");
    await expect(view).toContainText("ประมาณจากชั่วโมงปั๊ม");
    // honest layout authority — the generated sample, never claimed as a template file
    await expect(page.getByTestId("family-water-layout-note")).toContainText("รายงานน้ำประปา-1.pdf");
    // unknown ≠ 0: ws-2 water_in null → "—", never 0
    await expect(page.getByTestId("water-cell-water-ws-2")).toContainText("—");
    await expect(page.getByTestId("water-cell-water-ws-2")).not.toContainText(/^0/);
    // personnel display path + the — ไม่ระบุ — fallback
    await expect(page.getByTestId("water-cell-recorder-ws-1")).toContainText("พี่ทดสอบ หนึ่งเดียว");
    await expect(page.getByTestId("water-cell-recorder-ws-2")).toContainText("— ไม่ระบุ —");
  });

  test("print-to-PDF affordance exists and calls window.print()", async ({ authed: page }) => {
    await mockFamilyReportsRest(page);
    await page.addInitScript(() => {
      (window as unknown as { __printCalled: boolean }).__printCalled = false;
      window.print = () => {
        (window as unknown as { __printCalled: boolean }).__printCalled = true;
      };
    });
    await openFamilyPrint(page, "ext");
    const btn = page.getByTestId("report-family-print-button");
    await expect(btn).toBeVisible();
    await btn.click();
    const called = await page.evaluate(() => (window as unknown as { __printCalled: boolean }).__printCalled);
    expect(called).toBe(true);
  });

  test("no durable REST writes are attempted by the family print views", async ({ authed: page }) => {
    const writes = await mockFamilyReportsRest(page);
    await openFamilyPrint(page, "ext");
    await openFamilyPrint(page, "light");
    await openFamilyPrint(page, "water");
    expect(writes).toHaveLength(0);
  });

  test("ENV-REPAIR-REPORT-HONESTY-001 — one print area at a time: opening one print mode clears the other (ทส.1 ↔ family), exactly one .tos-print-area per open", async ({ authed: page }) => {
    await mockFamilyReportsRest(page);
    // give ทส.1 a recorded day so the print view opens (rows > 0)
    await page.route("**/rest/v1/v_reading_with_computed**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "rd-1", reading_date: "2026-11-05", wastewater_in: 12,
            chlorine_used: null, excess_sludge_removed: null,
            tds_aeration: null, do_before_discharge: null,
          },
        ]),
      });
    });

    await page.goto("/reports");
    await page.getByTestId("report-open-print").click();
    await expect(page.getByTestId("tos-print-view")).toBeVisible();
    await expect(page.locator(".tos-print-area")).toHaveCount(1);

    // open a family print view WITHOUT leaving the page — the ทส.1 area must unmount
    await page.getByTestId("report-family-ext").click();
    await page.getByTestId("report-family-month").fill(MONTH);
    await page.getByTestId("report-family-open-print").click();
    await expect(page.getByTestId("family-print-view")).toBeVisible();
    await expect(page.getByTestId("tos-print-view")).toHaveCount(0);
    await expect(page.locator(".tos-print-area")).toHaveCount(1);

    // under print emulation the single surviving area is the ONLY visible region
    await page.emulateMedia({ media: "print" });
    await expect(page.locator(".tos-print-area")).toHaveCount(1);
    const visibility = await page
      .locator(".tos-print-area")
      .first()
      .evaluate((el) => getComputedStyle(el).visibility);
    expect(visibility).toBe("visible");
    await page.emulateMedia({ media: null });

    // and the reverse transition: ทส.1 again clears the family area
    await page.getByTestId("report-open-print").click();
    await expect(page.getByTestId("tos-print-view")).toBeVisible();
    await expect(page.getByTestId("family-print-view")).toHaveCount(0);
    await expect(page.locator(".tos-print-area")).toHaveCount(1);
  });
});
