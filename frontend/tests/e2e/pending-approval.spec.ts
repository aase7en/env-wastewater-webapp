import { test, expect } from "./fixtures";

/**
 * OAUTH-2 (2026-07-21) — /pending-approval page render.
 *
 * Scope: verify the public-facing render of the pending-approval page
 * (no RequireAuth wrapper — the page itself is reachable by anyone).
 * Does NOT exercise the full OAuth round-trip (that needs a real
 * OAuth provider config + a freshly-signed-up pending user; deferred
 * to E2E authenticated profile per P11 follow-up).
 *
 * What this guards against regression:
 * - the /pending-approval route disappearing from App.tsx
 * - the Thai copy "บัญชีรอการอนุมัติ" getting lost in a refactor
 * - the page failing to render at all (which would surface as 404 from
 *   the SPA fallback)
 */
test.describe("OAUTH-2 /pending-approval page", () => {
  test("renders the Thai copy + sign-out button when visited directly", async ({ page }) => {
    await page.goto("/pending-approval");
    // Page is intentionally reachable (no RequireAuth) so a signed-in
    // pending user lands here without any guard.
    await expect(page).toHaveURL(/\/pending-approval$/);
    await expect(page.getByText("บัญชีรอการอนุมัติ")).toBeVisible();
    await expect(page.getByText("ออกจากระบบ")).toBeVisible();
    await expect(page.getByText("UTH[AI]-ENV")).toBeVisible();
  });

  // Note: the RequireAuth-bounces-unauthenticated case is already covered
  // by auth.spec.ts > "protected route /dashboard bounces to /login"
  // — adding a duplicate here would re-run the same scenario, and the
  // Playwright page context (localStorage etc.) is not reset between
  // this spec's tests. We don't duplicate it.
});
