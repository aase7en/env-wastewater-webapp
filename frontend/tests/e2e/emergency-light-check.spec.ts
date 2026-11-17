/**
 * ENV-PARITY-P2-003 — e2e for the emergency-light check flow (staff,
 * /safety/emergency-light-checks).
 *
 * Mock model (page.route only — NO real writes anywhere): every Supabase
 * REST call is intercepted, so nothing here touches ENV_DB.
 *
 * Camera-mocked QR e2e (WO §7 D2): window.BarcodeDetector is stubbed
 * in-page to emit the fixture erl_id payload — the native-decode path is
 * exercised end-to-end without a camera; the manual-pick + typed-code
 * paths stay always-available; the unknown-code fail-closed error and the
 * historical unresolved-'31' honest state are pinned.
 *
 * RED-first: at the RED commit none of these surfaces exist (route, lib,
 * testids) — the failures are the evidence.
 */
import { test, expect, type Page } from "./fixtures";

const FIXTURE_QR = "001";

const MASTER_ROWS = [
  {
    erl_id: "001",
    location: "ในห้องควบคุมโรค เบอร์1",
    pic_path: null,
    receive_date: "2025-06-05",
    location_floor: 2,
    providers: null,
    source_provenance: "AppSheet Sheets export 2026-11-16",
    legacy_id: "001",
  },
  {
    erl_id: "002",
    location: "หน้าห้องควบคุมโรค เบอร์1",
    pic_path: "Emergency light_Images/002.Pic.063439.jpg",
    receive_date: "2025-06-05",
    location_floor: 2,
    providers: "MAX BRIGHT by C.E.E",
    source_provenance: "AppSheet Sheets export 2026-11-16",
    legacy_id: "002",
  },
];

const PERSONNEL_ROWS = [
  { id: "p1", full_name: "สมศรี นักวิชาการ", position: "นักวิชาการสาธารณสุข", status: "active" },
  { id: "p2", full_name: "สมชาย บริการ", position: "พนักงานบริการ", status: "ทำงาน" },
];

const RESOLVE_OK = {
  master: MASTER_ROWS[0],
  prior: { check_count: 2, latest_check_date: "2025-08-19", latest_test_result: "ผ่าน" },
};

const HISTORY_ROWS = [
  {
    id: "305cd644",
    legacy_id: "305cd644",
    check_date: "2025-08-19",
    erl_payload: "31",
    light_id: null,
    location_snapshot: null,
    persistency: "มี",
    position: "เหมาะสม",
    test_result: "ไม่ผ่าน",
    broken_detail: "น๊อตหลุด",
    status: "แจ้งซ่อม",
  },
  {
    id: "c33588cf",
    legacy_id: "c33588cf",
    check_date: "2025-06-06",
    erl_payload: "001",
    light_id: "001",
    location_snapshot: "ในห้องควบคุมโรค เบอร์1",
    persistency: "มี",
    position: "ไม่เหมาะสม",
    test_result: "ผ่าน",
    broken_detail: "ไม่มีหัตถการ , มีแสงสว่างจากธรรมชาติ , ไม่มีเวรดึก",
    status: "แจ้งย้ายตำแหน่ง",
  },
];

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
  await page.route("**/rest/v1/emergency_light**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MASTER_ROWS) }));
  await page.route("**/rest/v1/emergency_light_check**", async (route) => {
    const url = route.request().url();
    if (route.request().method() === "GET") {
      if (url.includes("or=")) {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(HISTORY_ROWS) });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    }
    const body = route.request().postDataJSON();
    return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify([{ ...body, id: "aa11bb22" }]) });
  });
  await page.route("**/rest/v1/personnel**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PERSONNEL_ROWS) }));
  await page.route("**/rest/v1/rpc/fn_resolve_emergency_light_qr**", (route) => {
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
      body: JSON.stringify([{ id: "att1", entity_type: "emergency_light_check", entity_id: "aa11bb22", file_path: "x.jpg", kind: "check_pic", uploaded_by: null, created_at: "2026-11-17T00:00:00Z" }]),
    }));
  await page.route("**/storage/v1/object/attachments/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ Key: "x.jpg" }) }));
}

/** Stub the native BarcodeDetector so the scan loop decodes the fixture QR
 * payload — no camera hardware involved (camera-mocked e2e). */
async function stubBarcodeDetector(page: Page, payload: string) {
  await page.addInitScript((p) => {
    class FakeBarcodeDetector {
      async detect(): Promise<Array<{ rawValue: string }>> {
        (window as unknown as { __qrDone?: boolean }).__qrDone = true;
        return [{ rawValue: p }];
      }
    }
    (window as unknown as Record<string, unknown>).BarcodeDetector = FakeBarcodeDetector;
    const track = { stop() {}, kind: "video" };
    (navigator.mediaDevices as unknown as { getUserMedia: () => Promise<unknown> }).getUserMedia = async () => ({
      getTracks: () => [track],
      getVideoTracks: () => [track],
    });
  }, payload);
}

test.describe("emergency-light check flow (staff, /safety/emergency-light-checks)", () => {
  test("camera-mocked QR scan resolves the master and shows the prior-check summary", async ({ page }) => {
    await installSession(page, "staff");
    await stubBarcodeDetector(page, FIXTURE_QR);
    await mockRefs(page);
    await page.goto("/safety/emergency-light-checks");
    await page.getByTestId("light-qr-scan-btn").click();
    // auto-filled after the RPC resolve — snapshot fields are READ-ONLY copies
    await expect(page.getByTestId("light-snap-location")).toHaveText("ในห้องควบคุมโรค เบอร์1");
    await expect(page.getByTestId("light-snap-floor")).toHaveText("2");
    await expect(page.getByTestId("light-prior-summary")).toContainText("2");
    // enum selects render verbatim values + AppSheet init values
    await expect(page.getByTestId("light-persistency")).toHaveValue("มี");
    await expect(page.getByTestId("light-position")).toHaveValue("เหมาะสม");
    await expect(page.getByTestId("light-test-result")).toHaveValue("ผ่าน");
    await expect(page.getByTestId("light-test-result").locator('option[value="ไม่ผ่าน"]')).toHaveCount(1);
    // gates: normal state → broken/status/pic hidden (Show If ref 5112-5134)
    await expect(page.getByTestId("light-broken-group")).toBeHidden();
    await expect(page.getByTestId("light-status")).toBeHidden();
    // submit → POST lands on the façade (intercepted, no real write)
    await page.getByTestId("light-save-btn").click();
    await expect(page.getByTestId("light-save-ok")).toBeVisible();
  });

  test("manual pick is always available and drives the same resolve", async ({ page }) => {
    await installSession(page, "staff");
    await mockRefs(page);
    await page.goto("/safety/emergency-light-checks");
    // before a resolve the snapshot section is hidden (the Show If ref 5038-5043)
    await expect(page.getByTestId("light-snap-location")).toBeHidden();
    await page.getByTestId("light-manual-pick").selectOption("002");
    await expect(page.getByTestId("light-snap-location")).toHaveText("หน้าห้องควบคุมโรค เบอร์1");
  });

  test("ไม่ผ่าน reveals broken_detail + pic + status with verbatim enum values", async ({ page }) => {
    await installSession(page, "staff");
    await mockRefs(page);
    await page.goto("/safety/emergency-light-checks");
    await page.getByTestId("light-manual-pick").selectOption("001");
    await expect(page.getByTestId("light-snap-location")).toBeVisible();
    await page.getByTestId("light-test-result").selectOption("ไม่ผ่าน");
    await expect(page.getByTestId("light-broken-group")).toBeVisible();
    // broken_detail enum: 5 verbatim values, multi-capable + free text
    for (const v of ["ไม่มีหัตถการ", "มีแสงสว่างจากธรรมชาติ", "ไม่มีเวรดึก", "ไฟไม่สว่าง", "ไม่เก็บไฟ"]) {
      await expect(page.getByTestId("light-broken-group").locator(`input[value="${v}"]`)).toHaveCount(1);
    }
    await expect(page.getByTestId("light-pic")).toBeVisible();
    const status = page.getByTestId("light-status");
    await expect(status).toBeVisible();
    for (const v of ["แจ้งซ่อม", "แจ้งย้ายตำแหน่ง", "ขอติดตั้ง"]) {
      await expect(status.locator(`option[value="${v}"]`)).toHaveCount(1);
    }
  });

  test("persistency ไม่มี hides test_result but reveals pic + status (Show If ref 5079-5134)", async ({ page }) => {
    await installSession(page, "staff");
    await mockRefs(page);
    await page.goto("/safety/emergency-light-checks");
    await page.getByTestId("light-manual-pick").selectOption("001");
    await expect(page.getByTestId("light-test-result")).toBeVisible();
    await page.getByTestId("light-persistency").selectOption("ไม่มี");
    await expect(page.getByTestId("light-test-result")).toBeHidden();
    await expect(page.getByTestId("light-pic")).toBeVisible();
    await expect(page.getByTestId("light-status")).toBeVisible();
  });

  test("unknown QR id fails closed with the honest Thai error (no auto-fill)", async ({ page }) => {
    await installSession(page, "staff");
    await mockRefs(page, { resolveError: true });
    await page.goto("/safety/emergency-light-checks");
    await page.getByTestId("light-qr-input").fill("zzz-unknown-erl");
    await page.getByTestId("light-qr-resolve-btn").click();
    await expect(page.getByTestId("light-qr-error")).toContainText("ไม่พบข้อมูล!!");
    await expect(page.getByTestId("light-snap-location")).toBeHidden();
  });

  test("per-light history renders the unresolved '31' row honestly (verbatim payload + ไม่พบอ้างอิง)", async ({ page }) => {
    await installSession(page, "staff");
    await mockRefs(page);
    await page.goto("/safety/emergency-light-checks");
    await page.getByTestId("light-manual-pick").selectOption("001");
    const history = page.getByTestId("light-history-list");
    await expect(history).toBeVisible();
    // newest first (check_date DESC): the 2025-08-19 '31' row on top —
    // verbatim payload, never silently matched to 031
    await expect(history).toContainText("31");
    await expect(history).toContainText("ไม่พบอ้างอิง");
    await expect(history).toContainText("น๊อตหลุด");
    await expect(history).toContainText("2568"); // พ.ศ. rendering of 2025
    await expect(history).toContainText("ไม่มีหัตถการ , มีแสงสว่างจากธรรมชาติ , ไม่มีเวรดึก");
  });

  test("mobile 360 keeps the flow usable (house mobile contract)", async ({ page }) => {
    await installSession(page, "staff");
    await mockRefs(page);
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/safety/emergency-light-checks");
    await page.getByTestId("light-manual-pick").selectOption("001");
    await expect(page.getByTestId("light-snap-location")).toBeVisible();
    await expect(page.getByTestId("light-save-btn")).toBeVisible();
    const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= 361);
    expect(noHScroll).toBe(true);
  });

  test("mobile 390/430 render without horizontal scroll", async ({ page }) => {
    await installSession(page, "staff");
    await mockRefs(page);
    for (const width of [390, 430]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/safety/emergency-light-checks");
      await page.getByTestId("light-manual-pick").selectOption("001");
      const noHScroll = await page.evaluate((w) => document.documentElement.scrollWidth <= w + 1, width);
      expect(noHScroll).toBe(true);
    }
  });
});
