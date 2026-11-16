/**
 * ENV-PARITY-P2-002 — e2e for the extinguisher per-unit inspection flow
 * (staff) + the minimal admin master entry (WO §6/§7).
 *
 * Mock model (page.route only — NO real writes anywhere): every Supabase
 * REST/storage call is intercepted, so nothing here touches ENV_DB.
 *
 * Camera-mocked QR e2e (D1-4/WO §8 D2): window.BarcodeDetector is stubbed
 * in-page to emit the fixture PackedUUID payload — the native-decode path
 * is exercised end-to-end without a camera; the unsupported/denied camera
 * states surface the honest Thai messages; the manual-pick path is always
 * available.
 *
 * RED-first: at the RED commit none of these surfaces exist (routes,
 * testids, lib) — the failures are the evidence.
 */
import { test, expect, type Page } from "./fixtures";

const FIXTURE_QR = "vtiHJw6wpw4c6f4553dms5";

const MASTER_ROWS = [
  {
    legacy_row_id: FIXTURE_QR,
    location: "ห้องเคาะปอด",
    extinguisher_type: "เคมีแห้ง (Dry Chemical Extinguishers)",
    packed_date: "2025-09-13",
    expiry_date: "2027-09-13",
    size_label: "15 ปอนด์",
    source_provenance: "manual admin entry (P2.2)",
    legacy_id: FIXTURE_QR,
  },
  {
    legacy_row_id: "expiredpackuuid22ch",
    location: "ห้องยา",
    extinguisher_type: "น้ำยาโฟม (Foam Extinguishers)",
    packed_date: "2024-01-01",
    expiry_date: "2026-01-01",
    size_label: "10 ปอนด์",
    source_provenance: "manual admin entry (P2.2)",
    legacy_id: "expiredpackuuid22ch",
  },
];

const PERSONNEL_ROWS = [
  { id: "p1", full_name: "สมศรี นักวิชาการ", position: "นักวิชาการสาธารณสุข", status: "active" },
  { id: "p2", full_name: "สมชาย บริการ", position: "พนักงานบริการ", status: "ทำงาน" },
  { id: "p3", full_name: "แพทย์ใหญ่", position: "นายแพทย์", status: "active" },
  { id: "p4", full_name: "ลาออกแล้ว", position: "พนักงานบริการ", status: "ลาออก" },
];

const RESOLVE_OK = {
  master: MASTER_ROWS[0],
  latest_inspection: null,
  expiry_status: "ไม่หมดอายุ",
};

function installSession(page: Page, role: "staff" | "admin") {
  const session = {
    access_token: `fake-${role}-access-token`,
    refresh_token: `fake-${role}-refresh-token`,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: "00000000-0000-0000-0000-0000000000aa",
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: { email: `${role}@example.test`, full_name: `E2E ${role}` },
      aud: "authenticated",
      email: `${role}@example.test`,
    },
  };
  return page.addInitScript((sess) => {
    localStorage.setItem("sb-gllqtbyofrcjzmbnfoeh-auth-token", JSON.stringify(sess));
  }, session);
}

async function mockRefs(page: Page, opts?: { resolveError?: boolean; resolvePayload?: unknown }) {
  await page.route("**/rest/v1/app_user**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { id: "00000000-0000-0000-0000-0000000000aa", role: "staff", display_name: "E2E Staff", is_active: true },
      ]),
    }));
  await page.route("**/rest/v1/fire_extinguisher**", (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MASTER_ROWS) });
    }
    // admin create path — echo the posted row (PostgREST .single() shape)
    const body = route.request().postDataJSON();
    return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.route("**/rest/v1/extinguisher_inspection**", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    const body = route.request().postDataJSON();
    return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify([{ ...body, id: "aa11bb22" }]) });
  });
  await page.route("**/rest/v1/personnel**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PERSONNEL_ROWS) }));
  await page.route("**/rest/v1/rpc/fn_resolve_extinguisher_qr**", (route) => {
    if (opts?.resolveError) {
      return route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ message: "ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ", code: "P0001" }) });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(opts?.resolvePayload ?? RESOLVE_OK),
    });
  });
  await page.route("**/rest/v1/attachment**", (route) =>
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify([{ id: "att1", entity_type: "extinguisher_inspection", entity_id: "aa11bb22", file_path: "x.jpg", kind: "defect_photo", uploaded_by: null, created_at: "2026-11-16T00:00:00Z" }]),
    }));
  await page.route("**/storage/v1/object/attachments/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ Key: "x.jpg" }) }));
}

/** Stub the native BarcodeDetector so the scan loop decodes the fixture QR
 * payload — no camera hardware involved (camera-mocked e2e, D1-4). */
async function stubBarcodeDetector(page: Page, payload: string) {
  await page.addInitScript((p) => {
    class FakeBarcodeDetector {
      async detect(): Promise<Array<{ rawValue: string }>> {
        // emit exactly once, then keep returning nothing (loop ends)
        (window as unknown as { __qrEmitted?: boolean }).__qrEmitted = true;
        if ((window as unknown as { __qrDone?: boolean }).__qrDone) return [];
        (window as unknown as { __qrDone?: boolean }).__qrDone = true;
        return [{ rawValue: p }];
      }
    }
    (window as unknown as Record<string, unknown>).BarcodeDetector = FakeBarcodeDetector;
    // fake camera stream so getUserMedia succeeds headlessly
    const track = { stop() {}, kind: "video" };
    (navigator.mediaDevices as unknown as { getUserMedia: () => Promise<unknown> }).getUserMedia = async () => ({
      getTracks: () => [track],
      getVideoTracks: () => [track],
    });
  }, payload);
}

test.describe("inspection flow (staff, /safety/extinguisher-inspections)", () => {
  test("camera-mocked QR scan resolves the master and auto-fills the read-only snapshots", async ({ page }) => {
    await installSession(page, "staff");
    await stubBarcodeDetector(page, FIXTURE_QR);
    await mockRefs(page);
    await page.goto("/safety/extinguisher-inspections");
    await page.getByTestId("ext-qr-scan-btn").click();
    // auto-filled after the RPC resolve — snapshot fields are READ-ONLY copies
    await expect(page.getByTestId("ext-snap-location")).toHaveText("ห้องเคาะปอด");
    await expect(page.getByTestId("ext-snap-type")).toHaveText("เคมีแห้ง (Dry Chemical Extinguishers)");
    await expect(page.getByTestId("ext-snap-size")).toHaveText("15 ปอนด์");
    await expect(page.getByTestId("ext-expiry-status")).toHaveText("ไม่หมดอายุ");
    // item enums render with verbatim values + AppSheet init values
    await expect(page.getByTestId("ext-item-pipe").locator('option[value="ปกติ"]')).toHaveCount(1);
    await expect(page.getByTestId("ext-item-pipe").locator('option[value="ชำรุด"]')).toHaveCount(1);
    await expect(page.getByTestId("ext-item-pipe")).toHaveValue("ปกติ");
    await expect(page.getByTestId("ext-item-pressure").locator('option[value="ไม่ปกติ"]')).toHaveCount(1);
    await expect(page.getByTestId("ext-item-pressure")).toHaveValue("ปกติ");
    await expect(page.getByTestId("ext-item-barrier")).toHaveValue("ไม่มี");
    // cause_of_damaged hidden while everything is ปกติ/ไม่มี (Show If ref 3351)
    await expect(page.getByTestId("ext-cause-of-damaged")).toBeHidden();
    // inspector picker filters to eligible personnel only (ผู้ตรวจสอบ Valid If)
    const inspector = page.getByTestId("ext-inspector-select");
    await expect(inspector.locator("option")).toHaveCount(3); // placeholder + 2 eligible
    await expect(inspector.locator('option[value="p3"]')).toHaveCount(0);
    await expect(inspector.locator('option[value="p4"]')).toHaveCount(0);
    // submit → POST lands on the façade (intercepted, no real write)
    await page.getByTestId("ext-save-btn").click();
    await expect(page.getByTestId("ext-save-ok")).toBeVisible();
  });

  test("manual pick is always available and drives the same resolve + gates", async ({ page }) => {
    await installSession(page, "staff");
    await mockRefs(page);
    await page.goto("/safety/extinguisher-inspections");
    // before a resolve the snapshot section is hidden (the [QR_CODE]<>placeholder gate)
    await expect(page.getByTestId("ext-snap-location")).toBeHidden();
    await page.getByTestId("ext-manual-pick").selectOption(FIXTURE_QR);
    await expect(page.getByTestId("ext-snap-location")).toHaveText("ห้องเคาะปอด");
  });

  test("abnormal item reveals cause_of_damaged + defect photo + breakdown auto-label หมดอายุ (expired master)", async ({ page }) => {
    await installSession(page, "staff");
    await mockRefs(page, {
      resolvePayload: {
        master: MASTER_ROWS[1], // expiry 2026-01-01 → expired
        latest_inspection: null,
        expiry_status: "หมดอายุ",
      },
    });
    await page.goto("/safety/extinguisher-inspections");
    await page.getByTestId("ext-manual-pick").selectOption("expiredpackuuid22ch");
    await expect(page.getByTestId("ext-expiry-status")).toHaveText("หมดอายุ");
    // expired OR resolved → breakdown_details visible with the verbatim auto label
    await expect(page.getByTestId("ext-breakdown-details")).toBeVisible();
    await expect(page.getByTestId("ext-breakdown-details")).toHaveValue("หมดอายุ");
    // normal items → cause/photo still hidden; flip handle → visible
    await expect(page.getByTestId("ext-cause-of-damaged")).toBeHidden();
    await page.getByTestId("ext-item-handle").selectOption("ชำรุด");
    await expect(page.getByTestId("ext-cause-of-damaged")).toBeVisible();
    await expect(page.getByTestId("ext-cause-of-damaged").locator('option[value="เกิดจากการใช้งาน"]')).toHaveCount(1);
    await expect(page.getByTestId("ext-cause-of-damaged").locator('option[value="หมดอายุ"]')).toHaveCount(1);
    await expect(page.getByTestId("ext-defect-photo")).toBeVisible();
  });

  test("unknown QR id fails closed with the verbatim Thai error (no auto-fill)", async ({ page }) => {
    await installSession(page, "staff");
    await mockRefs(page, { resolveError: true });
    await page.goto("/safety/extinguisher-inspections");
    await page.getByTestId("ext-qr-input").fill("zzzzunknownzzzzzzzzzzzzz");
    await page.getByTestId("ext-qr-resolve-btn").click();
    await expect(page.getByTestId("ext-qr-error")).toContainText("ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ");
    await expect(page.getByTestId("ext-snap-location")).toBeHidden();
  });

  test("mobile 360 keeps the flow usable (house mobile contract)", async ({ page }) => {
    await installSession(page, "staff");
    await mockRefs(page);
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/safety/extinguisher-inspections");
    await page.getByTestId("ext-manual-pick").selectOption(FIXTURE_QR);
    await expect(page.getByTestId("ext-snap-location")).toBeVisible();
    await expect(page.getByTestId("ext-save-btn")).toBeVisible();
    const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= 361);
    expect(noHScroll).toBe(true);
  });
});

test.describe("admin master entry (/admin/extinguishers)", () => {
  /** Route order matters: Playwright fulfills with the LAST matching
   * route, so the admin app_user mock must register AFTER mockRefs'. */
  async function installAdminSession(page: Page) {
    await installSession(page, "admin");
    await page.route("**/rest/v1/app_user**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "00000000-0000-0000-0000-0000000000aa", role: "admin", display_name: "E2E Admin", is_active: true },
        ]),
      }));
  }

  test("non-admin (staff) sees the in-place ไม่มีสิทธิ์เข้าถึง gate (house RequireAuth behavior)", async ({ page }) => {
    await installSession(page, "staff");
    await mockRefs(page);
    await page.goto("/admin/extinguishers");
    await expect(page.getByText("ไม่มีสิทธิ์เข้าถึง")).toBeVisible();
    await expect(page.getByTestId("ext-master-form")).toHaveCount(0);
  });

  test("admin sees the list and can add a row; QR preview derives from the id (never stored)", async ({ page }) => {
    await mockRefs(page);
    await installAdminSession(page);
    // master list shows both mock rows with พ.ศ. dates
    await page.goto("/admin/extinguishers");
    await expect(page.getByTestId("ext-master-list")).toContainText("ห้องเคาะปอด");
    await expect(page.getByTestId("ext-master-list")).toContainText("2569"); // พ.ศ. 2026+543 (expiry 2026-01-01)
    // add form (P2.1 fields; 5-value master enum verbatim)
    const type = page.getByTestId("ext-master-type");
    for (const v of MASTER_TYPE_VALUES) {
      await expect(type.locator(`option[value="${v}"]`)).toHaveCount(1);
    }
    await page.getByTestId("ext-master-location").fill("ห้องประชุมใหม่");
    await type.selectOption(MASTER_TYPE_VALUES[0]);
    await page.getByTestId("ext-master-packed-date").fill("2026-01-01");
    await page.getByTestId("ext-master-expiry-date").fill("2031-01-01");
    await page.getByTestId("ext-master-size").fill("15 ปอนด์");
    await page.getByTestId("ext-master-submit").click();
    await expect(page.getByTestId("ext-master-ok")).toBeVisible();
    // QR preview: derived from the generated id — display only, nothing QR-related stored
    const preview = page.getByTestId("ext-master-qr-preview");
    await expect(preview).toBeVisible();
    const payload = (await preview.textContent()) ?? "";
    expect(payload.trim()).toMatch(/^[A-Za-z0-9]{22}$/);
  });
});

const MASTER_TYPE_VALUES = [
  "เคมีแห้ง (Dry Chemical Extinguishers)",
  "สารเหลวระเหย BF2000",
  "น้ำยาโฟม (Foam Extinguishers)",
  "คาร์บอนไดออกไซด์ (Carbon Dioxide (CO2) Extinguishers)",
  "น้ำ (Best Drop)",
];
