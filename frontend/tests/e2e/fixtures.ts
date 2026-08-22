import { test as base, expect, type Page } from "@playwright/test";

/**
 * E2E-2: baseURL-aware navigation. Playwright resolves goto("/x") against
 * the ORIGIN, dropping any subpath in baseURL (GitHub Pages serves the app
 * under /env-wastewater-webapp/). Rewriting "/x" -> "./x" resolves relative
 * to the baseURL directory instead, so specs keep writing app-root paths.
 *
 * AUTH-5 (2026-07-30): added `authed` fixture. / and /dashboard became
 * RequireAuth-gated, so specs that need to SEE dashboard content (skeleton,
 * pfd, sidebar-nav) must run behind the gate. We (a) seed localStorage with
 * a fake Supabase session and (b) intercept the app_user REST lookup so the
 * AuthProvider sees an authenticated staff user — RequireAuth then lets the
 * page render. No real JWT signing; the stub is enough for the client gate.
 *
 * Specs that assert admin-only or anon-bounce behaviour keep using the plain
 * `test` (anon) fixture.
 */

const STAFF_UID = "00000000-0000-0000-0000-0000000000aa";

function baseURLAwareGoto(page: Page) {
  const goto = page.goto.bind(page);
  page.goto = (url: string | URL, options?: Parameters<typeof goto>[1]) =>
    goto(typeof url === "string" && url.startsWith("/") ? "." + url : url, options);
}

/** Seed a fake authenticated Supabase session + intercept the app_user
 *  lookup so the client-side auth gate resolves to a staff user. */
async function installStaffSession(page: Page) {
  const session = {
    access_token: "fake-staff-access-token",
    refresh_token: "fake-staff-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: STAFF_UID,
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: { email: "staff@example.test", full_name: "E2E Staff" },
      aud: "authenticated",
      email: "staff@example.test",
    },
  };
  await page.addInitScript((sess) => {
    // Supabase v2 persists under "<project-ref>-auth-token". Pre-create so
    // getSession() finds it on boot.
    localStorage.setItem("sb-gllqtbyofrcjzmbnfoeh-auth-token", JSON.stringify(sess));
  }, session);

  // Intercept the app_user lookup the AuthProvider fires on session boot —
  // return a staff row so RequireAuth resolves isAuthenticated + not pending.
  await page.route("**/rest/v1/app_user**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { id: STAFF_UID, role: "staff", display_name: "E2E Staff", is_active: true },
      ]),
    });
  });
}

export const test = base.extend({
  page: async ({ page }, use) => {
    baseURLAwareGoto(page);
    // Playwright's fixture continuation is named `use`; it is not a React hook.
    // oxlint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },

  /** Authenticated page — installs a fake staff session before navigation.
   *  Use for specs that need to see behind RequireAuth (dashboard content,
   *  sidebar nav, etc.). Other REST calls should be mocked per-spec. */
  authed: async ({ page }, use) => {
    await installStaffSession(page);
    baseURLAwareGoto(page);
    // Playwright's fixture continuation is named `use`; it is not a React hook.
    // oxlint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },

  /** Authenticated ADMIN page — installs a fake admin session before
   *  navigation. Use for specs that need admin-only UI (PendingUsersBell,
   *  /admin/* routes). The app_user lookup returns role='admin'. */
  authedAdmin: async ({ page }, use) => {
    const session = {
      access_token: "fake-admin-access-token",
      refresh_token: "fake-admin-refresh-token",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: STAFF_UID,
        app_metadata: { provider: "email", providers: ["email"] },
        user_metadata: { email: "admin@example.test", full_name: "E2E Admin" },
        aud: "authenticated",
        email: "admin@example.test",
      },
    };
    await page.addInitScript((sess) => {
      localStorage.setItem("sb-gllqtbyofrcjzmbnfoeh-auth-token", JSON.stringify(sess));
    }, session);
    await page.route("**/rest/v1/app_user**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: STAFF_UID, role: "admin", display_name: "E2E Admin", is_active: true },
        ]),
      });
    });
    baseURLAwareGoto(page);
    // Playwright's fixture continuation is named `use`; it is not a React hook.
    // oxlint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },
});
export { expect };
