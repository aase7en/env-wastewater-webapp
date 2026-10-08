import { test, expect } from "./fixtures";

/**
 * ENV-BUILDING-REPAIR-001 C1 — D7 focused E2E.
 *
 * Truthful Building UI contract (packet clauses 2/5/11): the wrench
 * renders ONLY from the durable linked repair; explicit cause +
 * location required for repair-needed submissions (client-side, plus
 * the server enforces again); submission goes through the RPC (not a
 * direct table insert); legacy flag-only rows stay honest; linked
 * rows are undeletable; 360/390/430 have no document overflow. All
 * REST/RPC traffic intercepted — no real writes (A16-style guard).
 */

const ROUND_ROUTE = "**/rest/v1/inspection_round**";
const RPC_ROUTE = "**/rest/v1/rpc/create_building_repair**";
const LOC_ROUTE = "**/rest/v1/location**";

const LOCATIONS = [
  { id: "aaaaaaaa-0000-4000-8000-000000000001", code: "BLD-A", area_name: "อาคาร A", category_id: null, lat: null, lng: null },
];

const rounds = (over: Partial<Record<string, unknown>>[] = []) => [
  {
    id: "bbbbbbbb-0000-4000-8000-000000000001",
    round_date: "2026-10-07",
    location_id: LOCATIONS[0].id,
    inspector: "คุณสมชาย",
    findings: "ก๊อกน้ำชั้น 2 หยด",
    issues_found: true,
    repair_needed: true,
    round_type: "monthly",
    checklist: null, photos: null, severity: null, assigned_to: null,
    recorded_by: null, note: null, created_at: "2026-10-07T03:00:00Z",
    repair_request: [
      { id: "cccccccc-0000-4000-8000-000000000001", status: "open", cause: "ก๊อกน้ำชั้น 2 ชำรุด" },
    ],
    ...over[0],
  },
  {
    // Legacy flag-only row: repair_needed=true but NO linked repair.
    id: "bbbbbbbb-0000-4000-8000-000000000002",
    round_date: "2026-09-01",
    location_id: LOCATIONS[0].id,
    inspector: "คุณสมใจ",
    findings: "หลอดไฟห้องเครื่องขาด",
    issues_found: true,
    repair_needed: true,
    round_type: "monthly",
    checklist: null, photos: null, severity: null, assigned_to: null,
    recorded_by: null, note: null, created_at: "2026-09-01T03:00:00Z",
    repair_request: [],
  },
  {
    id: "bbbbbbbb-0000-4000-8000-000000000003",
    round_date: "2026-10-08",
    location_id: null,
    inspector: null,
    findings: null,
    issues_found: false,
    repair_needed: false,
    round_type: "monthly",
    checklist: null, photos: null, severity: null, assigned_to: null,
    recorded_by: null, note: null, created_at: "2026-10-08T01:00:00Z",
    repair_request: [],
  },
];

async function mockBuilding(page: import("@playwright/test").Page, roundRows = rounds()) {
  await page.route(ROUND_ROUTE, (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(roundRows) }));
  await page.route(LOC_ROUTE, (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(LOCATIONS) }));
  let rpcCalls = 0;
  const directWrites: string[] = [];
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/rest/v1/inspection_round") && req.method() !== "GET") {
      directWrites.push(`${req.method()} ${url}`);
    }
  });
  await page.route(RPC_ROUTE, (r) => {
    rpcCalls += 1;
    return r.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({
        inspection_round_id: "dddddddd-0000-4000-8000-000000000001",
        repair_request_id: "cccccccc-0000-4000-8000-000000000009",
        already_exists: rpcCalls > 1,
      }),
    });
  });
  return { rpcCalls: () => rpcCalls, directWrites };
}

test.describe("Building C1 — truthful linked-repair UI", () => {
  test("wrench/status render ONLY from the durable link; legacy flag-only stays honest", async ({ authed }) => {
    await mockBuilding(authed);
    await authed.goto("/building");

    // Linked row: wrench chip + exact status text from the repair row.
    await expect(authed.getByText("🔧 แจ้งซ่อมแล้ว · รอดำเนินการ")).toBeVisible();

    // Legacy flag-only row: honest absence, never a fabricated wrench.
    await expect(authed.getByText("ยังไม่มีใบแจ้งซ่อม (รายการเดิม)")).toBeVisible();

    // Unlinked no-repair row shows the plain dash.
    await expect(authed.getByLabel("ไม่ต้องซ่อม")).toBeVisible();
  });

  test("linked rows are undeletable; plain/legacy rows keep delete", async ({ authed }) => {
    await mockBuilding(authed);
    await authed.goto("/building");
    // Only the row with a durable linked repair is protected.
    await expect(authed.getByText("คงประวัติ")).toHaveCount(1);
    await expect(authed.getByRole("button", { name: "ลบ" })).toHaveCount(2);
  });

  test("repair-needed submit goes through the RPC — never a direct table write", async ({ authed }) => {
    const h = await mockBuilding(authed);
    await authed.goto("/building");

    await authed.getByText("ต้องแจ้งซ่อม", { exact: true }).click();
    await expect(authed.getByLabel("สถานที่ตรวจ")).toBeVisible();
    await authed.getByLabel("สถานที่ตรวจ").selectOption(LOCATIONS[0].id);
    await authed.getByLabel("สาเหตุที่ต้องซ่อม (แยกจากสิ่งที่พบ)").fill("ก๊อกน้ำชั้น 2 ชำรุด น้ำไหลไม่หยุด");
    await authed.getByRole("button", { name: "บันทึก" }).click();

    await expect(authed.getByText("บันทึกสำเร็จ")).toBeVisible({ timeout: 8000 });
    expect(h.rpcCalls()).toBe(1);
    expect(h.directWrites).toEqual([]);
  });

  test("clause-2 client gate: missing cause or location blocks submit with visible errors", async ({ authed }) => {
    const h = await mockBuilding(authed);
    await authed.goto("/building");

    await authed.getByText("ต้องแจ้งซ่อม", { exact: true }).click();
    await authed.getByRole("button", { name: "บันทึก" }).click();

    await expect(authed.getByText("กรุณาระบุสาเหตุที่ต้องซ่อม")).toBeVisible();
    await expect(authed.getByText("การแจ้งซ่อมต้องระบุสถานที่")).toBeVisible();
    expect(h.rpcCalls()).toBe(0);
  });

  test("retry after RPC failure reuses the same client key (no duplicate)", async ({ authed }) => {
    await authed.route(ROUND_ROUTE, (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(rounds()) }));
    await authed.route(LOC_ROUTE, (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(LOCATIONS) }));

    const keys: string[] = [];
    let fail = true;
    await authed.route(RPC_ROUTE, async (route) => {
      const body = route.request().postDataJSON();
      keys.push(body.p_client_key);
      if (fail) {
        fail = false;
        return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "network blip" }) });
      }
      return route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({ inspection_round_id: "d1", repair_request_id: "r9", already_exists: true }),
      });
    });

    await authed.goto("/building");
    await authed.getByText("ต้องแจ้งซ่อม", { exact: true }).click();
    await authed.getByLabel("สถานที่ตรวจ").selectOption(LOCATIONS[0].id);
    await authed.getByLabel("สาเหตุที่ต้องซ่อม (แยกจากสิ่งที่พบ)").fill("หลอดไฟขาด");
    await authed.getByRole("button", { name: "บันทึก" }).click();
    // First attempt fails; the toast must say retrying will not duplicate.
    await expect(authed.getByText(/จะไม่ซ้ำ/)).toBeVisible({ timeout: 8000 });

    await authed.getByRole("button", { name: "บันทึก" }).click();
    await expect(authed.getByText("บันทึกสำเร็จ")).toBeVisible({ timeout: 8000 });

    expect(keys).toHaveLength(2);
    expect(keys[0]).toBe(keys[1]); // same stable client key across the retry
  });

  test("A13-style: 360/390/430 have no horizontal document overflow", async ({ authed }) => {
    await mockBuilding(authed);
    for (const width of [360, 390, 430]) {
      await authed.setViewportSize({ width, height: 844 });
      await authed.goto("/building");
      await expect(authed.getByText("ตรวจอาคารสถานที่").first()).toBeVisible();
      const ok = await authed.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      expect(ok, `no horizontal overflow at ${width}px`).toBeTruthy();
    }
  });
});
