// UTH[AI]-EVN service worker (P20c).
//
// Two-tier caching:
// - Navigation requests (HTML): network-first, falls back to cached index
//   when offline. This makes the SPA usable offline once visited.
// - Static assets (/assets/*, favicon, manifest): cache-first, stale-
//   while-revalidate. Vite's hashed filenames let us cache them forever.
//
// Important for GitHub Pages SPA: navigation fallback returns the cached
// /env-wastewater-webapp/ root HTML (which IS the SPA bootstrap), so
// client-side routing still works offline via BrowserRouter.
//
// Scope is set via the registering script's location; Vite copies this
// file as-is from public/ to dist/, and it's served at the repo subpath.

const VERSION = "uth-env-v1";
const BASE = "/env-wastewater-webapp";
const CACHE_HTML = `${VERSION}-html`;
const CACHE_ASSET = `${VERSION}-asset`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_HTML).then((c) => c.addAll([`${BASE}/`, `${BASE}/index.html`, `${BASE}/404.html`]))
      // activate immediately even if an old SW is controlling the page.
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(VERSION))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Only handle GET — let the browser handle POST/PUT/DELETE etc. (these
  // are Supabase API calls that need a live network anyway).
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Same-origin only — never intercept Supabase / OAuth / external.
  if (url.origin !== self.location.origin) return;

  // Path-prefix gate: only the SPA subpath.
  if (!url.pathname.startsWith(BASE)) return;

  // 1) Navigation (HTML) → network-first.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_HTML).then((c) => c.put(req, copy)).catch(() => {});
          return resp;
        })
        .catch(() =>
          // Offline → cached root, which is the SPA bootstrap.
          caches.match(req).then((r) => r || caches.match(`${BASE}/`) || caches.match(`${BASE}/index.html`))
        )
    );
    return;
  }

  // 2) Static asset (/assets/*, *.svg, *.webmanifest, *.js, *.css) →
  //    stale-while-revalidate.
  const isAsset = /\/assets\/|\.svg$|\.webmanifest$|\.js$|\.css$|\.woff2?$/.test(url.pathname);
  if (isAsset) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((resp) => {
            if (resp.ok) {
              const copy = resp.clone();
              caches.open(CACHE_ASSET).then((c) => c.put(req, copy)).catch(() => {});
            }
            return resp;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
