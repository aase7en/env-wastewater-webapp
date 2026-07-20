import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — smoke tests for the SPA.
 *
 * Two test profiles:
 * - **dev**: against local Vite (http://localhost:5173) — run manually
 *   during development (npm run e2e:dev).
 * - **prod**: against the deployed GitHub Pages site
 *   (https://aase7en.github.io/env-wastewater-webapp/) — runs in CI.
 *
 * Authenticated routes (/form, /readings) are skipped in smoke tests —
 * they bounce to /login, which itself is the smoke we test.
 */
// E2E-2: ensure baseURL ends with "/" so "./x" in fixtures.ts resolves
// relative to the directory (not as origin-relative). Without this, an
// E2E_BASE_URL without a trailing slash would break relative goto rewrites.
const rawBaseURL = process.env.E2E_BASE_URL || "http://localhost:5173";
const baseURL = rawBaseURL.endsWith("/") ? rawBaseURL : rawBaseURL + "/";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Only start a local server for the dev profile. CI hits prod URL directly.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --port 5173",
        url: "http://localhost:5173",
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
});
