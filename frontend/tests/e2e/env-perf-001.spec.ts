import { test, expect } from "./fixtures";

/**
 * ENV-PERF-001 — D2 RED-first behavioral pins.
 *
 * 1. Form save navigates IMMEDIATELY on success (the 900 ms setTimeout
 *    before navigate() is frozen under Playwright's fake clock, so the
 *    legacy code can never satisfy the URL assertion; the fixed code
 *    navigates synchronously after the awaited mutation).
 *    Also pins the immediate disabled/pending state on the submit button
 *    during the in-flight save (await semantics kept — no optimistic
 *    insert).
 * 2. EquipmentPage serves a remount from the shared React Query cache
 *    (single equipment fetch across SPA navigations within staleTime).
 * 3. First navigation to /form lazy-loads its page chunk (was: eager
 *    import in App.tsx — the module is already loaded before any click).
 * 4. AIAdmin smoke pin — providers + scopes still render (port safety
 *    guard for the React Query port of the manual useState/useEffect
 *    fetch; already green before the port, kept as a regression pin).
 */
test.describe("ENV-PERF-001", () => {
  test("form save navigates immediately on success (no 900ms delay)", async ({
    page,
    authed,
  }) => {
    // Fake clock installed up front, but PAUSED only after the lazy page has
    // fully rendered — pausing during initial load would freeze React's
    // commit of the lazy-resolved route (the Suspense skeleton never
    // resolves). Once paused, the legacy 900ms setTimeout (scheduled by the
    // submit itself) can never fire, so only an immediate navigate()
    // satisfies the URL assertion.
    // React Query's own notification batching also runs on setTimeout, so
    // this test deliberately asserts ONLY the direct setState → toast →
    // navigate path, not the RQ-driven pending render (covered by the
    // dedicated pending-state test below without a fake clock).
    await page.clock.install();

    const READING_ROW = {
      id: "11111111-2222-3333-4444-555555555555",
      reading_date: "2026-11-12",
      input_source: "manual",
    };

    // Legacy 3-insert path (pre-RPC code under test at RED) + atomic RPC
    // path (post-implementation) — both respond immediately.
    await page.route("**/rest/v1/reading**", (route) =>
      route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(READING_ROW) }),
    );
    await page.route("**/rest/v1/carbon_reading**", (route) =>
      route.fulfill({ status: 201, contentType: "application/json", body: "[]" }),
    );
    await page.route("**/rest/v1/repair_request**", (route) =>
      route.fulfill({ status: 201, contentType: "application/json", body: "[]" }),
    );
    await page.route("**/rest/v1/rpc/fn_create_reading**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(READING_ROW) }),
    );
    await page.route("**/rest/v1/equipment**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
    );

    await page.goto("/form");
    const saveButton = page.getByRole("button", { name: "บันทึก", exact: true });
    await expect(saveButton).toBeVisible();

    // Freeze time only from here on — the submit's 900ms legacy timer would
    // be scheduled while paused and never fire.
    await page.clock.pauseAt(new Date());

    await saveButton.click();
    await expect(page.getByText("บันทึกรายการสำเร็จ")).toBeVisible();
    // The critical RED pin: navigation happens without any artificial
    // delay. Under the frozen clock the legacy 900ms timer never fires.
    await expect(page).toHaveURL(/\/readings/, { timeout: 2000 });
  });

  test("form save shows the pending state immediately while in flight", async ({
    page,
    authed,
  }) => {
    // No fake clock here — React Query's pending→disabled render piggybacks
    // on its setTimeout-based notification batching, which a paused clock
    // would freeze. A real 800ms network delay gives the pending window.
    const READING_ROW = { id: "…", reading_date: "2026-11-12" };
    const slowFulfill = (body: string, status = 200) => async (route: import("@playwright/test").Route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.fulfill({ status, contentType: "application/json", body });
    };
    await page.route("**/rest/v1/reading**", slowFulfill(JSON.stringify(READING_ROW), 201));
    await page.route("**/rest/v1/rpc/fn_create_reading**", slowFulfill(JSON.stringify(READING_ROW)));
    await page.route("**/rest/v1/equipment**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
    );

    await page.goto("/form");
    const saveButton = page.getByRole("button", { name: "บันทึก", exact: true });
    await expect(saveButton).toBeVisible();

    await saveButton.click();
    // Pending feedback must be visible immediately while the save is
    // in-flight (Button loading={submitting} → disabled + spinner). No
    // optimistic insert happens — the navigation only follows the awaited
    // response.
    await expect(saveButton).toBeDisabled();
  });

  test("equipment page serves remount from the shared React Query cache", async ({
    page,
    authed,
  }) => {
    let equipmentFetches = 0;
    await page.route("**/rest/v1/equipment**", async (route) => {
      equipmentFetches += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "e1", code: "PUMP-1", name: "ปั้มหอยทางเข้า", location_id: null, is_active: true },
        ]),
      });
    });
    await page.route("**/rest/v1/repair_request**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
    );

    await page.goto("/equipment");
    await expect(page.getByText("รายการอุปกรณ์ 1 รายการ")).toBeVisible();

    // SPA navigation only — a full page.goto would drop the in-memory cache
    // and prove nothing. /readings + /equipment are dock-pinned by default;
    // dispatch the click on the router Link (dock icon layers can intercept
    // real pointer events after a route change, but the Link handler is what
    // performs the client-side navigation).
    await page.locator('nav a[href$="/readings"]').first().dispatchEvent("click");
    await expect(page).toHaveURL(/\/readings/);
    await page.locator('nav a[href$="/equipment"]').first().dispatchEvent("click");
    await expect(page.getByText("รายการอุปกรณ์ 1 รายการ")).toBeVisible();

    // The remount must be a cache hit: still exactly ONE equipment fetch.
    expect(equipmentFetches).toBe(1);
  });

  test("first navigation to /form lazy-loads its page chunk", async ({
    page,
    authed,
  }) => {
    const formModuleRequests: string[] = [];
    page.on("request", (req) => {
      if (/DailyFormPage/.test(req.url())) formModuleRequests.push(req.url());
    });

    await page.route("**/rest/v1/equipment**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
    );

    await page.goto("/dashboard");
    await expect(page.locator("nav").first()).toBeVisible();
    // Nothing on the landing view may have pulled the form page module —
    // RED: the eager import in App.tsx loads it during boot.
    expect(formModuleRequests).toHaveLength(0);

    // /form is dock-pinned by default → dispatch the click on its router Link.
    await page.locator('nav a[href$="/form"]').first().dispatchEvent("click");
    await expect(page).toHaveURL(/\/form$/);
    await expect(
      page.getByRole("button", { name: "บันทึก", exact: true }),
    ).toBeVisible();
    // GREEN: the page chunk loads on first navigation to the route.
    expect(formModuleRequests.length).toBeGreaterThan(0);
  });

  test("AI admin page renders providers + scopes (port safety pin)", async ({
    page,
    authedAdmin,
  }) => {
    await page.route("**/rest/v1/ai_provider**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "p1",
            name: "Test Provider",
            base_url: "https://example.test/api",
            model: "test-model",
            model_id: null,
            api_url: null,
            priority: 100,
            is_enabled: true,
            key_env_var: "TEST_KEY",
            key_value: null,
          },
        ]),
      }),
    );
    await page.route("**/rest/v1/ai_scope**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "s1",
            view_name: "v_test",
            description: null,
            patient_safe: true,
            is_enabled: true,
          },
        ]),
      }),
    );

    await page.goto("/admin/ai");
    await expect(page.getByText("Providers (1)")).toBeVisible();
    await expect(page.getByText("AI Scope (1)")).toBeVisible();
  });
});
