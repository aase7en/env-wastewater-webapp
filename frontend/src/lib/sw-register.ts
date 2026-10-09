/**
 * Service worker registration (P20c).
 *
 * Registered from a tiny module so the SPA can opt in on first load.
 * Vite's `import.meta.env.PROD` gate keeps the SW out of dev (Vite's HMR
 * proxy + module graph conflict with SW caching).
 *
 * The SW itself lives at /public/sw.js and is copied verbatim into dist/.
 * Scope is the repo subpath (BASE_URL) — see vite.config.ts base +
 * sw.js BASE constant.
 *
 * ENV-BUILDING-REPAIR-001 C1 (2026-10-08) — stale-client mitigation:
 * the old bundle shipped this module dispatching `sw-update-available`
 * with NO listener, so tabs kept running old JS against the cache-
 * forever SW indefinitely. Now this module also CONSUMES its own
 * event and reloads on `controllerchange` (guarded once per page
 * load), so any tab that reloads or navigates picks up the new worker
 * and bundle promptly. Acknowledged limit: a tab that never navigates
 * still runs old JS — nothing shipped later can reach it; the residual
 * risk is handled by the owner decision at Gate 2, not assumed away.
 */

let reloadGuard = false;

function installStaleClientReload(): void {
  window.addEventListener("sw-update-available", () => {
    // A new worker is staged. On takeover, reload once so this tab
    // stops executing the superseded bundle.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloadGuard) return;
      reloadGuard = true;
      window.location.reload();
    });
  });
}

export async function registerServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;

  installStaleClientReload();

  const base = import.meta.env.BASE_URL || "/";
  const swUrl = `${base.replace(/\/$/, "")}/sw.js`;

  try {
    const reg = await navigator.serviceWorker.register(swUrl, {
      scope: base,
      updateViaCache: "none",
    });
    // Listen for a new SW taking over (user reloads to activate).
    reg.addEventListener("updatefound", () => {
      const installing = reg.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (
          installing.state === "installed" &&
          navigator.serviceWorker.controller // there's already one active
        ) {
          // New version staged; dispatch for the reload wiring above and
          // any UI listener that wants to surface "รีเฟรชเพื่ออัปเดต".
          window.dispatchEvent(new CustomEvent("sw-update-available"));
        }
      });
    });
  } catch (e) {
    // SW registration failure is non-fatal — the app still works online.
    console.warn("SW registration failed:", e);
  }
}
