import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/sw-register";

// basename = repo subpath on GitHub Pages, "/" in dev.
// Vite injects import.meta.env.BASE_URL from vite.config.ts.
const basename = import.meta.env.BASE_URL || "/";

// GitHub Pages SPA fallback: 404.html (see .github/workflows/deploy-
// frontend.yml + scripts/github-pages-spa-redirect.html) stashes the
// intended path here, then bounces to the SPA root. We pick it up and
// replace the URL client-side so BrowserRouter sees the original path.
const spaRedirect = sessionStorage.getItem("gh-pages-spa-redirect");
if (spaRedirect) {
  sessionStorage.removeItem("gh-pages-spa-redirect");
  // SPA-1: restore the stash verbatim. It is window.location.pathname
  // (+search+hash) captured on the SAME site, so it already carries the
  // basename — no strip-and-rejoin. (The old rejoin sliced off the "/"
  // after the basename and produced "/env-wastewater-webappform", which
  // BrowserRouter cannot match → blank app on every prod deep link.)
  window.history.replaceState(null, "", spaRedirect);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Register the service worker for offline-capable PWA (P20c). Skipped in
// dev (HMR proxy conflicts) — only runs in production builds.
void registerServiceWorker();
