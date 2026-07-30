/**
 * OAuth redirect URL builder — pure helper, extracted from AuthProvider so it
 * is unit-testable.
 *
 * Two cases:
 *  - Vite dev (base "/")          → `${origin}/auth/callback`
 *  - GitHub Pages (base "/<repo>/") → `${origin}/<repo>/auth/callback`
 *
 * a-debug AUTH-3 (2026-07-25): the previous inline impl in AuthProvider did
 *   `${origin}${path === "/" ? "" : path}/auth/callback`
 * which on GitHub Pages (path = "/env-wastewater-webapp/") produced a DOUBLE
 * slash: "...webapp//auth/callback" → GitHub Pages 404 (the SPA 404.html
 * fallback only fires for paths without the stray slash; the double slash is
 * a malformed path). Fix: strip the trailing slash from `path` before join.
 *
 * Verified end-to-end: a Google OAuth callback that landed at //auth/callback
 * returned 404; the fixed path /auth/callback resolves correctly.
 */

/** Build the OAuth redirect URL from an origin + a Vite base path.
 *
 * @param origin e.g. "https://aase7en.github.io" or "http://localhost:5173"
 * @param basePath Vite's import.meta.env.BASE_URL ("/" for dev,
 *                 "/env-wastewater-webapp/" for GitHub Pages)
 */
export function buildRedirectURL(origin: string, basePath: string): string {
  // Normalize: strip exactly one trailing slash (unless the path is just "/").
  // "/env-wastewater-webapp/" → "/env-wastewater-webapp"
  // "/" → "" (dev: no subpath)
  const stripped =
    basePath === "/" ? "" : basePath.replace(/\/$/, "");
  return `${origin}${stripped}/auth/callback`;
}
