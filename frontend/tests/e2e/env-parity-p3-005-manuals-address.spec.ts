import { test, expect, type Page } from "./fixtures";

/**
 * ENV-PARITY-P3-005 — e2e for the two additive admin management surfaces
 * (lane P3.5, WO §5): /admin/manuals (คู่มือ ×2 — domain tabs บ่อบำบัด |
 * น้ำประปา, list/link display per the D1-4 semantics) and /admin/address
 * (the B7 report-header reference — search + pagination over the census,
 * the Address_Key rendered display-time, the Phase-4 dependency noted).
 *
 * Mock model (page.route only — NO real writes anywhere): every Supabase
 * REST call is intercepted; fixtures are SYNTHETIC test values (the real
 * 10-row/7,436-row census is asserted only by the live SQL contract suite
 * scripts/test_parity_p3_005_manuals_address.py, never mocked here).
 *
 * Honesty pins (WO §4/§5): absolute http(s) file refs render new-tab
 * anchors; legacy relative Drive refs render plain text + the verbatim
 * note (never a fake link); the น้ำประปา tab shows the verbatim honest
 * empty state — never a fabricated row; the address census renders
 * paginated (never unpaginated); anonymous users bounce to /login.
 *
 * D2 RED: the routes/surfaces do not exist yet — the authenticated
 * assertions fail truthfully over the NotFound catch-all.
 */

const MANUAL_WW_ROW = {
  id: "00000000-0000-4000-8000-00000000m001",
  legacy_id: "c845e81a",
  title: "คู่มือทดสอบ (สังเคราะห์)",
  image_ref: "คู่มือ_Images/c845e81a.รูป.010101.jpg",
  file_ref: "คู่มือ_Files_/c845e81a.link.010101.pdf",
  source_provenance: "test fixture",
  created_at: "2026-11-19T00:00:00Z",
};

const MANUAL_WW_ROW_EXTERNAL = {
  ...MANUAL_WW_ROW,
  id: "00000000-0000-4000-8000-00000000m002",
  legacy_id: "aaaabbbb",
  title: "คู่มือลิงก์ภายนอก (สังเคราะห์)",
  image_ref: null,
  file_ref: "https://example.test/manual-synthetic.pdf",
};

const ADDRESS_ROWS = [
  {
    id: "00000000-0000-4000-8000-00000000a001",
    tambon_id: 610101,
    tambon_thai: "อุทัยใหม่ (สังเคราะห์)",
    district_id: 6101,
    district_thai: "อำเภอเมืองอุทัยธานี (สังเคราะห์)",
    province_id: 61,
    province_thai: "อุทัยธานี (สังเคราะห์)",
    source_provenance: "test fixture",
    created_at: "2026-11-19T00:00:00Z",
  },
];

async function mockAppShellRest(page: Page) {
  await page.route("**/rest/v1/role_module_visibility**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  await page.route("**/rest/v1/threshold_alert**", async (route) => {
    const headers: Record<string, string> = {};
    if ((route.request().headers()["prefer"] ?? "").includes("count=")) headers["content-range"] = "*/0";
    await route.fulfill({ status: 200, contentType: "application/json", headers, body: "[]" });
  });
  await page.route("**/rest/v1/reading**", async (route) => {
    const headers: Record<string, string> = {};
    if ((route.request().headers()["prefer"] ?? "").includes("count=")) headers["content-range"] = "*/0";
    await route.fulfill({ status: 200, contentType: "application/json", headers, body: "[]" });
  });
}

function mockManualsRest(page: Page, opts?: { wastewater?: unknown[]; watersupply?: unknown[] }) {
  mockAppShellRest(page);
  page.on("route", () => {});
  void page.route("**/rest/v1/manual_wastewater**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(opts?.wastewater ?? []) });
      return;
    }
    await route.fulfill({ status: 201, contentType: "application/json", body: "[]" });
  });
  void page.route("**/rest/v1/manual_water_supply**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(opts?.watersupply ?? []) });
      return;
    }
    await route.fulfill({ status: 201, contentType: "application/json", body: "[]" });
  });
}

function mockAddressRest(page: Page, opts?: { rows?: unknown[] }) {
  mockAppShellRest(page);
  void page.route("**/rest/v1/address**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(opts?.rows ?? []) });
      return;
    }
    await route.fulfill({ status: 201, contentType: "application/json", body: "[]" });
  });
}

test.describe("ENV-PARITY-P3-005 manuals admin surface (/admin/manuals)", () => {
  test("anonymous /admin/manuals bounces to /login (admin-gated route)", async ({ page }) => {
    await page.goto("/admin/manuals");
    await expect(page).toHaveURL(/\/login/);
  });

  test("admin sees the two domain tabs (คู่มือ ×2 verbatim)", async ({ authedAdmin: page }) => {
    mockManualsRest(page);
    await page.goto("/admin/manuals");
    await expect(page.getByTestId("manuals-page")).toBeVisible();
    await expect(page.getByTestId("manuals-tab-wastewater")).toBeVisible();
    await expect(page.getByTestId("manuals-tab-watersupply")).toBeVisible();
    await expect(page.getByTestId("manuals-tab-wastewater")).toContainText("บ่อบำบัด");
    await expect(page.getByTestId("manuals-tab-watersupply")).toContainText("น้ำประปา");
  });

  test("legacy relative file refs render as text + the honest note — never a fake link", async ({ authedAdmin: page }) => {
    mockManualsRest(page, { wastewater: [MANUAL_WW_ROW] });
    await page.goto("/admin/manuals");
    const row = page.getByTestId(`manual-row-${MANUAL_WW_ROW.legacy_id}`);
    await expect(row).toBeVisible();
    await expect(row).toContainText("คู่มือ_Files_/c845e81a.link.010101.pdf");
    await expect(row).toContainText("คำเตือน: ไฟล์อยู่ในไดรฟ์ของระบบเดิม");
    await expect(row.locator("a[href]")).toHaveCount(0);
  });

  test("absolute http(s) file refs render a new-tab anchor (rel noopener noreferrer)", async ({ authedAdmin: page }) => {
    mockManualsRest(page, { wastewater: [MANUAL_WW_ROW_EXTERNAL] });
    await page.goto("/admin/manuals");
    const row = page.getByTestId(`manual-row-${MANUAL_WW_ROW_EXTERNAL.legacy_id}`);
    await expect(row).toBeVisible();
    const link = row.locator('a[href="https://example.test/manual-synthetic.pdf"]');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
    await expect(link).toHaveAttribute("rel", /noreferrer/);
  });

  test("the น้ำประปา tab renders the honest empty state — never a fabricated row", async ({ authedAdmin: page }) => {
    mockManualsRest(page, { wastewater: [MANUAL_WW_ROW], watersupply: [] });
    await page.goto("/admin/manuals");
    await page.getByTestId("manuals-tab-watersupply").click();
    await expect(page.getByTestId("manual-empty-watersupply")).toBeVisible();
    await expect(page.getByTestId("manual-empty-watersupply")).toContainText(
      "ยังไม่มีข้อมูล — รอแหล่งข้อมูลจากเจ้าของระบบเดิม",
    );
  });

  test("the add form carries the admin entry surfaces (รายการ/รูป/link)", async ({ authedAdmin: page }) => {
    mockManualsRest(page);
    await page.goto("/admin/manuals");
    await expect(page.getByTestId("manual-form")).toBeVisible();
    await expect(page.getByTestId("manual-title-input")).toBeVisible();
    await expect(page.getByTestId("manual-image-input")).toBeVisible();
    await expect(page.getByTestId("manual-file-input")).toBeVisible();
  });
});

test.describe("ENV-PARITY-P3-005 address admin surface (/admin/address)", () => {
  test("anonymous /admin/address bounces to /login (admin-gated route)", async ({ page }) => {
    await page.goto("/admin/address");
    await expect(page).toHaveURL(/\/login/);
  });

  test("admin sees the search + paginated census list (never unpaginated)", async ({ authedAdmin: page }) => {
    mockAddressRest(page, { rows: ADDRESS_ROWS });
    await page.goto("/admin/address");
    await expect(page.getByTestId("address-page")).toBeVisible();
    await expect(page.getByTestId("address-search")).toBeVisible();
    const row = page.getByTestId("address-row-610101");
    await expect(row).toBeVisible();
    await expect(page.getByTestId("address-pagination")).toBeVisible();
  });

  test("Address_Key renders display-time from the live names — the virtual is never stored", async ({ authedAdmin: page }) => {
    mockAddressRest(page, { rows: ADDRESS_ROWS });
    await page.goto("/admin/address");
    const row = page.getByTestId("address-row-610101");
    await expect(row).toBeVisible();
    await expect(page.getByTestId("address-key-610101")).toContainText(
      "อุทัยใหม่ (สังเคราะห์)-อำเภอเมืองอุทัยธานี (สังเคราะห์)-อุทัยธานี (สังเคราะห์)",
    );
  });

  test("search narrows the census by tambon/district/province", async ({ authedAdmin: page }) => {
    mockAddressRest(page, { rows: ADDRESS_ROWS });
    await page.goto("/admin/address");
    await expect(page.getByTestId("address-row-610101")).toBeVisible();
    await page.getByTestId("address-search").fill("สตูล");
    await expect(page.getByTestId("address-row-610101")).toHaveCount(0);
  });

  test("the Phase-4 report-header dependency is noted on-screen (never built in this lane)", async ({ authedAdmin: page }) => {
    mockAddressRest(page, { rows: ADDRESS_ROWS });
    await page.goto("/admin/address");
    await expect(page.getByTestId("address-phase4-note")).toBeVisible();
    await expect(page.getByTestId("address-phase4-note")).toContainText("Phase 4");
  });

  test("the add/edit admin surfaces exist (B7 ตารางแก้ไขได้)", async ({ authedAdmin: page }) => {
    mockAddressRest(page, { rows: ADDRESS_ROWS });
    await page.goto("/admin/address");
    await expect(page.getByTestId("address-form")).toBeVisible();
    await expect(page.getByTestId("address-row-610101").getByTestId("address-edit-610101")).toBeVisible();
  });
});
