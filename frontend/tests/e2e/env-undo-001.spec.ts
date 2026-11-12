import { test, expect, type Page } from "./fixtures";

/**
 * ENV-UNDO-001 — deferred-delete undo window (10 s), D2 RED-first.
 *
 * Binding design (WO + handoff D0):
 *  - confirm ลบ → optimistic removal from the React Query cache + toast
 *    "ลบแล้ว" with a "ย้อนกลับ" action for 10 seconds;
 *  - the server DELETE is DEFERRED until the window expires (undo = cancel
 *    the pending timer + restore the cache snapshot — NO server round-trip);
 *  - expiry fires DELETE exactly once; deferred-DELETE failure → error toast
 *    + refetch so the record visibly returns (never silent loss);
 *  - rapid deletes queue independent toasts/timers (no cross-talk).
 *
 * Clock control: Playwright fake clock (house pattern, env-perf-001) —
 * installed up front, left in real-time flow, then fastForward across the
 * 10 s window to fire (or prove the cancellation of) the deferred timer.
 *
 * Mock model (page.route only — no real data touched): the mocked "server"
 * keeps its own row list; a DELETE request removes the row server-side and
 * subsequent list fetches reflect it. (d) makes the DELETE fail so the
 * server truth (row still present) is what the refetch restores.
 */

const ID_A = "11111111-2222-3333-4444-aaaaaaaaaaaa";
const ID_B = "22222222-2222-3333-4444-bbbbbbbbbbbb";

function detailRow(id: string, date: string) {
  return {
    id,
    reading_date: date,
    do_aeration: 2.4, do_sedimentation: 1.6, do_before_discharge: 4.1,
    tds_aeration: 520, tds_before_discharge: 540,
    ph: 7.2, temp_aeration: 27.5, sv30: 280, free_chlorine: 1.2,
    system_operating: true,
    wastewater_in: 40, water_used_total: 45,
    input_source: "e2e-test",
  };
}

function listRow(id: string, date: string, doAverage: number) {
  return {
    id,
    reading_date: date,
    do_average: doAverage,
    ph: 7.2,
    free_chlorine: 1.1,
    system_operating: true,
    date_thai_be: date,
  };
}

/** Install the ENV-UNDO-001 mock server + counters on a page. */
async function installUndoMocks(page: Page) {
  const state = {
    serverRows: [
      listRow(ID_A, "2026-11-10", 5.55),
      listRow(ID_B, "2026-11-09", 6.66),
    ],
    deleteCalls: [] as string[],
    listFetches: 0,
    restGets: 0,
    deleteShouldFail: false,
  };

  await page.route("**/rest/v1/v_dashboard_14day**", async (route) => {
    if (route.request().method() === "GET") {
      state.listFetches += 1;
      state.restGets += 1;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(state.serverRows),
    });
  });

  await page.route("**/rest/v1/v_reading_with_computed**", async (route) => {
    state.restGets += 1;
    const url = new URL(route.request().url());
    const id = (url.searchParams.get("id") ?? "eq.").replace(/^eq\./, "");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(detailRow(id, id === ID_A ? "2026-11-10" : "2026-11-09")),
    });
  });

  await page.route("**/rest/v1/equipment**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });

  await page.route("**/rest/v1/reading**", async (route) => {
    const req = route.request();
    if (req.method() === "DELETE") {
      const url = new URL(req.url());
      const id = (url.searchParams.get("id") ?? "eq.").replace(/^eq\./, "");
      state.deleteCalls.push(id);
      if (state.deleteShouldFail) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ message: "mock delete failure", code: "P0001" }),
        });
        return;
      }
      state.serverRows = state.serverRows.filter((r) => r.id !== id);
      await route.fulfill({ status: 204, contentType: "application/json", body: "" });
      return;
    }
    state.restGets += 1;
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });

  return state;
}

/** Realistic entry path: warm the list cache (as every real user does),
 *  open the edit form from the row, confirm the delete dialog. */
async function deleteFromEditPage(page: Page, rowText: string, id: RegExp) {
  await page.goto("/readings");
  const row = page.locator("tr").filter({ hasText: rowText });
  await expect(row).toBeVisible();
  await row.click();
  await expect(page).toHaveURL(id);
  await expect(page.locator("#reading_date")).toBeVisible();

  await page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "ลบ" }).click();

  await expect(page).toHaveURL(/\/readings/);
}

test.describe("ENV-UNDO-001 deferred delete + undo", () => {
  test("(a) confirm deletes defer the server DELETE inside the 10s window", async ({ page, authed }) => {
    await page.clock.install();
    const state = await installUndoMocks(page);

    await deleteFromEditPage(page, "5.55", new RegExp(ID_A));
    await expect(page.getByText("ลบแล้ว")).toBeVisible();
    expect(state.deleteCalls).toHaveLength(0);

    // Still nothing on the wire at +9s of the window.
    await page.clock.fastForward(9_000);
    expect(state.deleteCalls).toHaveLength(0);
  });

  test("(b) undo restores the row from cache with no restore-attributable fetch", async ({ page, authed }) => {
    await page.clock.install();
    const state = await installUndoMocks(page);

    await deleteFromEditPage(page, "5.55", new RegExp(ID_A));
    await expect(page.getByText("ลบแล้ว")).toBeVisible();
    const rowA = page.locator("tr").filter({ hasText: "5.55" });
    await expect(rowA).toBeHidden();

    const getsBeforeUndo = state.restGets;
    await page.getByRole("button", { name: "ย้อนกลับ" }).click();

    // The record comes back — the full row, not a placeholder.
    await expect(rowA).toBeVisible();
    expect(state.restGets).toBe(getsBeforeUndo);
    expect(state.deleteCalls).toHaveLength(0);

    // Undo cancelled the pending timer: expiry time passes, no DELETE.
    await page.clock.fastForward(10_000);
    expect(state.deleteCalls).toHaveLength(0);
    await expect(rowA).toBeVisible();
  });

  test("(c) window expiry fires the DELETE exactly once and reconciles the list", async ({ page, authed }) => {
    await page.clock.install();
    const state = await installUndoMocks(page);

    await deleteFromEditPage(page, "5.55", new RegExp(ID_A));
    await expect(page.getByText("ลบแล้ว")).toBeVisible();
    expect(state.deleteCalls).toHaveLength(0);

    await page.clock.fastForward(10_000);
    await expect.poll(() => state.deleteCalls.length).toBe(1);
    expect(state.deleteCalls[0]).toBe(ID_A);
    // Cache reconcile: the list refetches server truth (row stays gone).
    const rowA = page.locator("tr").filter({ hasText: "5.55" });
    await expect(rowA).toBeHidden();
  });

  test("(d) failing deferred DELETE shows an error toast and the record returns", async ({ page, authed }) => {
    await page.clock.install();
    const state = await installUndoMocks(page);
    state.deleteShouldFail = true;

    await deleteFromEditPage(page, "5.55", new RegExp(ID_A));
    const rowA = page.locator("tr").filter({ hasText: "5.55" });
    await expect(rowA).toBeHidden(); // optimistic removal happened
    expect(state.deleteCalls).toHaveLength(0);

    await page.clock.fastForward(10_000);
    await expect.poll(() => state.deleteCalls.length).toBe(1);
    // Honest failure: error toast + refetch — the record visibly returns.
    await expect(page.getByText("ลบไม่สำเร็จ")).toBeVisible();
    await expect(rowA).toBeVisible();
  });

  test("(e) toast carries Thai labels and a ≥44px undo tap target", async ({ page, authed }) => {
    await page.clock.install();
    await installUndoMocks(page);

    await deleteFromEditPage(page, "5.55", new RegExp(ID_A));
    await expect(page.getByText("ลบแล้ว")).toBeVisible();
    const undo = page.getByRole("button", { name: "ย้อนกลับ" });
    await expect(undo).toBeVisible();
    const box = await undo.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  });

  test("(f) rapid double delete keeps independent toasts + timers (no cross-talk)", async ({ page, authed }) => {
    await page.clock.install();
    const state = await installUndoMocks(page);

    await deleteFromEditPage(page, "5.55", new RegExp(ID_A));
    await expect(page.getByText("ลบแล้ว").first()).toBeVisible();

    // Immediately delete the second record too.
    const rowB = page.locator("tr").filter({ hasText: "6.66" });
    await rowB.click();
    await expect(page).toHaveURL(new RegExp(ID_B));
    await expect(page.locator("#reading_date")).toBeVisible();
    await page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "ลบ" }).click();
    await expect(page).toHaveURL(/\/readings/);

    // Two independent undo affordances queued.
    const undoButtons = page.getByRole("button", { name: "ย้อนกลับ" });
    await expect(undoButtons).toHaveCount(2);
    const rowA = page.locator("tr").filter({ hasText: "5.55" });
    const rowBAfter = page.locator("tr").filter({ hasText: "6.66" });
    await expect(rowA).toBeHidden();
    await expect(rowBAfter).toBeHidden();

    // Undo the FIRST delete only.
    await page.locator('div[role="status"]').first().getByRole("button", { name: "ย้อนกลับ" }).click();
    await expect(rowA).toBeVisible();
    await expect(rowBAfter).toBeHidden();
    await expect(undoButtons).toHaveCount(1);

    // Expiry: only the second (still-pending) delete fires.
    await page.clock.fastForward(10_000);
    await expect.poll(() => state.deleteCalls.length).toBe(1);
    expect(state.deleteCalls[0]).toBe(ID_B);
    await expect(rowA).toBeVisible();
  });
});
