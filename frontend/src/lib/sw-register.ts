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
 */
export async function registerServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;

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
          // New version staged; surface a toast from the UI by dispatching
          // a CustomEvent. App.tsx can listen and show "รีเฟรชเพื่ออัปเดต".
          window.dispatchEvent(new CustomEvent("sw-update-available"));
        }
      });
    });
  } catch (e) {
    // SW registration failure is non-fatal — the app still works online.
    console.warn("SW registration failed:", e);
  }
}
