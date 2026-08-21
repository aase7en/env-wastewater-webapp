import { test, expect } from "./fixtures";

/**
 * WO-STAB-004 — regression: unsaved edits must survive a background /
 * window-focus refetch on the daily edit form.
 *
 * Bug (P0 #4, reports/code-review-2026-08-12.md): the edit form hydrated
 * from `useReading(id)` inside useEffect([existing]). React Query's global
 * refetchOnWindowFocus (staleTime 30s) produces a fresh snapshot on tab
 * refocus; the effect then repopulated the whole form, silently wiping
 * whatever the user had typed.
 *
 * Test strategy (no app-code hooks added for testing): load the edit page
 * with a reading whose reading_date=2026-08-20, change the date input,
 * wait past the 30s staleTime, fire window-focus events (React Query's
 * focus trigger) with the mock now returning a CHANGED row (date
 * 2026-08-01 — any server refresh would do), and assert the user's value
 * is still in the input. On the ungated code the input flips to the
 * server value (RED); with the dirty gate it stays as typed.
 *
 * test.slow(): the 30s staleTime wait is required for a true end-to-end
 * refetch (no time-mocking hooks are exposed to the page on purpose).
 */
test.describe("WO-STAB-004 daily edit form dirty gate", () => {
  test.slow();

  test("unsaved edit survives window-focus refetch with changed server row", async ({ page, authed: _authed }) => {
    const READING_ID = "11111111-2222-3333-4444-555555555555";

    // Response counter: first fetch hydrates reading_date=2026-08-20; the
    // post-focus refetch returns a CHANGED row (2026-08-01) so the
    // overwrite path is actually exercised — a same-data refetch would
    // prove nothing (structural sharing would keep the object identical).
    let fetchCount = 0;
    const rowFor = (readingDate: string) => ({
      id: READING_ID,
      reading_date: readingDate,
      do_aeration: 2.4, do_sedimentation: 1.6, do_before_discharge: 4.1,
      tds_aeration: 520, tds_before_discharge: 540,
      ph: 7.2, temp_aeration: 27.5, sv30: 280, free_chlorine: 1.2,
      system_operating: true,
      wastewater_in: 40, water_used_total: 45,
      input_source: "e2e-test",
    });

    await page.route(`**/rest/v1/v_reading_with_computed**`, async (route) => {
      fetchCount += 1;
      const body = rowFor(fetchCount === 1 ? "2026-08-20" : "2026-08-01");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    });
    await page.route("**/rest/v1/equipment**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });

    await page.goto(`/form/${READING_ID}`);

    // 1) Initial hydration: the date input shows the server value.
    const dateInput = page.locator("#reading_date");
    await expect(dateInput).toBeVisible();
    await expect(dateInput).toHaveValue("2026-08-20");

    // 2) User edits the field (this is the unsaved state to protect).
    await dateInput.fill("2026-08-15");
    await expect(dateInput).toHaveValue("2026-08-15");

    // 3) Wait past the global staleTime (30s) so the query is stale, then
    //    trigger a React Query BACKGROUND refetch via a real offline→online
    //    transition (refetchOnReconnect, trusted CDP network events —
    //    deterministic, unlike synthetic focus events in headless). The
    //    overwrite path under test is the same one window-focus uses: a
    //    fresh `existing` snapshot hits the hydration effect.
    await page.waitForTimeout(31_000);
    const ctx = page.context();
    await ctx.setOffline(true);
    await page.waitForTimeout(300);
    await ctx.setOffline(false); // online -> RQ refetchOnReconnect fires
    // Allow the refetch + any (buggy) rehydration to land.
    await page.waitForTimeout(1_500);
    expect(fetchCount).toBeGreaterThanOrEqual(2); // the refetch really fired

    // 4) The user's unsaved edit must still be intact.
    await expect(dateInput).toHaveValue("2026-08-15");
  });
});
