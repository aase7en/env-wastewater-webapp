/**
 * ENV-PARITY-P3-001 — e2e for the admin master-management surface
 * (/admin/masters: Items / Vendors / Categories / distributor — the four
 * AppSheet master tables of lane P3.1) + the two honest equipment pickers
 * wired into the delivered surfaces (lab coliform อุปกรณ์; water
 * ชนิดเครื่องมือตรวจ per D1-3).
 *
 * Mock model (page.route only — NO real writes anywhere): every Supabase
 * REST call is intercepted; distributor fixtures are SYNTHETIC test values
 * (D1-7 — the real 6-row master is asserted only by the live SQL contract
 * suite scripts/test_parity_p3_001_masters.py, never mocked here).
 *
 * RED-first: at the RED commit none of these surfaces exist (no
 * /admin/masters route, no masters testids, no pickers) — the failures are
 * the evidence.
 */
import { test, expect, type Page } from "./fixtures";

const SYNTHETIC_DISTRIBUTORS = [
  {
    id: "00000000-0000-4000-8000-00000000d001",
    legacy_id: "aaaa1111",
    dealer: "บริษัท ทดสอบ จำกัด (สังเคราะห์)",
    dealer_email: "test@example.test",
    dealer_address: "ที่อยู่ทดสอบ (สังเคราะห์)",
    dealer_tel: "0 5555 0000",
    salesname: "ผู้ทดสอบ (สังเคราะห์)",
    line_id: "@test-synthetic",
    source_provenance: "ENV UI manual entry",
  },
  {
    id: "00000000-0000-4000-8000-00000000d002",
    legacy_id: "bbbb2222",
    dealer: "บริษัท สังเคราะห์ สอง",
    dealer_email: null,
    dealer_address: null,
    dealer_tel: null,
    salesname: null,
    line_id: null,
    source_provenance: "ENV UI manual entry",
  },
];

async function mockMastersRest(page: Page, opts?: { items?: unknown[] }) {
  // app-shell reads (food-mobile precedent)
  await page.route("**/rest/v1/role_module_visibility**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  await page.route("**/rest/v1/threshold_alert**", async (route) => {
    const headers: Record<string, string> = {};
    if ((route.request().headers()["prefer"] ?? "").includes("count=")) headers["content-range"] = "*/0";
    await route.fulfill({ status: 200, contentType: "application/json", headers, body: "[]" });
  });
  // NOTE route precedence: "item" is registered BEFORE "item_category"
  // (Playwright gives the LATER matching registration priority), otherwise
  // the item pattern would swallow item_category requests.
  await page.route("**/rest/v1/item?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(opts?.items ?? []),
    });
  });
  await page.route("**/rest/v1/item_category?**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  await page.route("**/rest/v1/vendor?**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  await page.route("**/rest/v1/distributor?**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SYNTHETIC_DISTRIBUTORS) }));
}

test.describe("admin masters page (/admin/masters)", () => {
  test("non-admin (staff) bounces off the route", async ({ authed: page }) => {
    await mockMastersRest(page);
    await page.goto("/admin/masters");
    await expect(page.getByText("ไม่มีสิทธิ์เข้าถึง")).toBeVisible();
    await expect(page.getByTestId("masters-section-distributor")).toHaveCount(0);
  });

  test("admin sees all four master sections", async ({ authedAdmin: page }) => {
    await mockMastersRest(page);
    await page.goto("/admin/masters");
    await expect(page.getByTestId("masters-section-items")).toBeVisible();
    await expect(page.getByTestId("masters-section-vendors")).toBeVisible();
    await expect(page.getByTestId("masters-section-categories")).toBeVisible();
    await expect(page.getByTestId("masters-section-distributor")).toBeVisible();
  });

  test("distributor rows list with editable affordances (แก้ไข/ลบ — editable master, unlike append-only equipment_spec)", async ({ authedAdmin: page }) => {
    await mockMastersRest(page);
    await page.goto("/admin/masters");
    await expect(page.getByTestId("distributor-row-aaaa1111")).toBeVisible();
    await expect(page.getByTestId("distributor-row-bbbb2222")).toBeVisible();
    // blanks stay blank — the NULL contact fields render "—" (unknown ≠ '')
    const row2 = page.getByTestId("distributor-row-bbbb2222");
    await expect(row2).toContainText("—");
    // editable-master semantics: both affordances exist per row
    await expect(page.getByTestId("distributor-edit-aaaa1111")).toBeVisible();
    await expect(page.getByTestId("distributor-delete-aaaa1111")).toBeVisible();
  });

  test("distributor create POST carries verbatim fields with blanks ⇒ null (mocked — no real write)", async ({ authedAdmin: page }) => {
    await mockMastersRest(page);
    let posted: Record<string, unknown> | null = null;
    await page.route("**/rest/v1/distributor?**", async (route) => {
      if (route.request().method() === "POST") {
        posted = route.request().postDataJSON() as Record<string, unknown>;
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify([{ id: "00000000-0000-4000-8000-00000000d099", ...posted }]),
        });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SYNTHETIC_DISTRIBUTORS) });
    });
    await page.goto("/admin/masters");
    await page.getByTestId("distributor-dealer-input").fill("บริษัท ใหม่ จำกัด (ทดสอบ)");
    await page.getByTestId("distributor-email-input").fill("new@example.test");
    await page.getByTestId("distributor-address-input").fill("");
    await page.getByTestId("distributor-tel-input").fill("0 5555 1111");
    await page.getByTestId("distributor-salesname-input").fill("   ");
    await page.getByTestId("distributor-lineid-input").fill("");
    await page.getByTestId("distributor-save").click();
    await expect.poll(() => posted, { timeout: 5000 }).not.toBe(null);
    expect(posted!["dealer"]).toBe("บริษัท ใหม่ จำกัด (ทดสอบ)");
    expect(posted!["dealer_email"]).toBe("new@example.test");
    expect(posted!["dealer_address"]).toBeNull();
    expect(posted!["dealer_tel"]).toBe("0 5555 1111");
    expect(posted!["salesname"]).toBeNull();
    expect(posted!["line_id"]).toBeNull();
  });

  test("Items/Vendors/Categories sections show honest empty states (SOURCE_UNAVAILABLE — never fabricated rows)", async ({ authedAdmin: page }) => {
    await mockMastersRest(page, { items: [] });
    await page.goto("/admin/masters");
    await expect(page.getByTestId("items-empty")).toContainText("ยังไม่มีข้อมูลอุปกรณ์");
    await expect(page.getByTestId("vendors-empty")).toContainText("ยังไม่มีข้อมูลผู้ขาย");
    await expect(page.getByTestId("categories-empty")).toContainText("ยังไม่มีข้อมูลหมวดหมู่");
  });
});

test.describe("lab อุปกรณ์ picker (coliform flow, /food)", () => {
  test("empty core.item ⇒ honest empty chip, never a fabricated option", async ({ authed: page }) => {
    const PERSONNEL = [
      { id: "p1", full_name: "สมศรี สาธารณสุข", position: "นักวิชาการสาธารณสุข", status: "ทำงาน" },
    ];
    await page.route("**/rest/v1/role_module_visibility**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
    await page.route("**/rest/v1/threshold_alert**", async (route) => {
      const headers: Record<string, string> = {};
      if ((route.request().headers()["prefer"] ?? "").includes("count=")) headers["content-range"] = "*/0";
      await route.fulfill({ status: 200, contentType: "application/json", headers, body: "[]" });
    });
    await page.route("**/rest/v1/personnel**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PERSONNEL) }));
    await page.route("**/rest/v1/lab_test**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
    await mockMastersRest(page, { items: [] });
    await page.goto("/food");
    await expect(page.getByTestId("coliform-equipment-empty")).toContainText("ยังไม่มีข้อมูลอุปกรณ์");
    await expect(page.getByTestId("coliform-equipment-select")).toHaveCount(0);
  });

  test("non-empty core.item ⇒ picker renders; selected item reaches the lab_test POST as equipment_id", async ({ authed: page }) => {
    const PERSONNEL = [
      { id: "p1", full_name: "สมศรี สาธารณสุข", position: "นักวิชาการสาธารณสุข", status: "ทำงาน" },
    ];
    await page.route("**/rest/v1/role_module_visibility**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
    await page.route("**/rest/v1/threshold_alert**", async (route) => {
      const headers: Record<string, string> = {};
      if ((route.request().headers()["prefer"] ?? "").includes("count=")) headers["content-range"] = "*/0";
      await route.fulfill({ status: 200, contentType: "application/json", headers, body: "[]" });
    });
    await page.route("**/rest/v1/personnel**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PERSONNEL) }));
    let posted: Record<string, unknown> | null = null;
    await page.route("**/rest/v1/lab_test**", async (route) => {
      if (route.request().method() === "POST") {
        posted = route.request().postDataJSON() as Record<string, unknown>;
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify([{ id: "new", result: null, ...posted }]),
        });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });
    await mockMastersRest(page, {
      items: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          legacy_id: "itemaaa",
          name: "ชุดตรวจ (สังเคราะห์)",
          description: null,
          image_path: null,
          category_legacy: null,
          category_id: null,
          vendor_id: null,
          purchase_cost: null,
          unit_count_num: null,
          unit_count: null,
          unit_formula: null,
          unit_use_num: null,
          unit_calculate: null,
          user_manual_path: null,
          min_qty: null,
          max_qty: null,
          source_provenance: "ENV UI manual entry",
        },
      ],
    });
    await page.goto("/food");
    await expect(page.getByTestId("coliform-equipment-select")).toBeVisible();
    // placeholder + the real item only — never fabricated options
    await expect(page.getByTestId("coliform-equipment-select").locator("option")).toHaveCount(2);
    await page.getByTestId("coliform-equipment-select").selectOption("11111111-1111-4111-8111-111111111111");
    // น้ำ source requires a collect point (the existing verbatim gate)
    await page.getByTestId("coliform-collect-point").selectOption("โรงครัว");
    await page.getByTestId("coliform-collect-save").click();
    await expect.poll(() => posted, { timeout: 5000 }).not.toBe(null);
    expect(posted!["equipment_id"]).toBe("11111111-1111-4111-8111-111111111111");
    // the verbatim AppSheet default legacy id stays on the legacy column
    expect(posted!["equipment_legacy"]).toBe("aca317bf");
  });
});

test.describe("water-side ชนิดเครื่องมือตรวจ picker (/water-supply, D1-3)", () => {
  async function mockWaterRefs(page: Page, opts?: { items?: unknown[] }) {
    await page.route("**/rest/v1/role_module_visibility**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
    await page.route("**/rest/v1/threshold_alert**", async (route) => {
      const headers: Record<string, string> = {};
      if ((route.request().headers()["prefer"] ?? "").includes("count=")) headers["content-range"] = "*/0";
      await route.fulfill({ status: 200, contentType: "application/json", headers, body: "[]" });
    });
    await page.route("**/rest/v1/daily_check?**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
    await page.route("**/rest/v1/v_daily_check_chain?**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
    await mockMastersRest(page, opts);
  }

  test("empty core.item ⇒ honest empty chip, never a fabricated option", async ({ authed: page }) => {
    await mockWaterRefs(page, { items: [] });
    await page.goto("/water-supply");
    await expect(page.getByTestId("instrument-empty")).toContainText("ยังไม่มีข้อมูลอุปกรณ์");
    await expect(page.getByTestId("instrument-select")).toHaveCount(0);
  });

  test("non-empty core.item ⇒ picker renders and the selected id reaches the daily_check POST as instrument_id", async ({ authed: page }) => {
    await mockWaterRefs(page, {
      items: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          legacy_id: "itembbb",
          name: "เครื่องวัดคลอรีน (สังเคราะห์)",
          description: null,
          image_path: null,
          category_legacy: null,
          category_id: null,
          vendor_id: null,
          purchase_cost: null,
          unit_count_num: null,
          unit_count: null,
          unit_formula: null,
          unit_use_num: null,
          unit_calculate: null,
          user_manual_path: null,
          min_qty: null,
          max_qty: null,
          source_provenance: "ENV UI manual entry",
        },
      ],
    });
    let posted: Record<string, unknown> | null = null;
    await page.route("**/rest/v1/daily_check?**", async (route) => {
      if (route.request().method() === "POST") {
        posted = route.request().postDataJSON() as Record<string, unknown>;
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify([{ id: "newrow", ...posted }]),
        });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });
    await page.goto("/water-supply");
    await expect(page.getByTestId("instrument-select")).toBeVisible();
    await page.getByTestId("instrument-select").selectOption("22222222-2222-4222-8222-222222222222");
    await page.getByRole("button", { name: "บันทึก", exact: true }).click();
    await expect.poll(() => posted, { timeout: 5000 }).not.toBe(null);
    expect(posted!["instrument_id"]).toBe("22222222-2222-4222-8222-222222222222");
  });
});
