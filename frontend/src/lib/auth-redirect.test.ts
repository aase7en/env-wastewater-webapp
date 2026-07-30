/**
 * AUTH-3 (2026-07-25) — unit tests for buildRedirectURL.
 *
 * Pins the OAuth redirect URL contract: NEVER produce a double slash, which
 * broke Google OAuth on GitHub Pages (404 on the callback).
 */
import { describe, it, expect } from "vitest";
import { buildRedirectURL } from "./auth-redirect";

describe("buildRedirectURL", () => {
  it("GitHub Pages base with trailing slash — no double slash", () => {
    // The bug case: Vite base "/env-wastewater-webapp/" + "/auth/callback"
    // used to produce "...webapp//auth/callback" → 404.
    const url = buildRedirectURL(
      "https://aase7en.github.io",
      "/env-wastewater-webapp/"
    );
    expect(url).toBe(
      "https://aase7en.github.io/env-wastewater-webapp/auth/callback"
    );
    // Explicit guard: NEVER a double slash.
    expect(url).not.toContain("//auth/callback");
    expect(url).not.toMatch(/[^:]\/\//); // no // except after scheme
  });

  it("dev base '/' — no subpath, single slash before auth", () => {
    const url = buildRedirectURL("http://localhost:5173", "/");
    expect(url).toBe("http://localhost:5173/auth/callback");
  });

  it("base without trailing slash — already-clean path passes through", () => {
    // Defensive: if a future config drops the trailing slash, still correct.
    const url = buildRedirectURL(
      "https://aase7en.github.io",
      "/env-wastewater-webapp"
    );
    expect(url).toBe(
      "https://aase7en.github.io/env-wastewater-webapp/auth/callback"
    );
  });

  it("never contains a double slash outside the scheme", () => {
    // Property test across the realistic bases.
    for (const base of ["/", "/env-wastewater-webapp/", "/env-wastewater-webapp"]) {
      const url = buildRedirectURL("https://example.com", base);
      // Strip the scheme, then no // should remain.
      const afterScheme = url.replace(/^https?:\/\//, "");
      expect(afterScheme).not.toContain("//");
    }
  });
});
