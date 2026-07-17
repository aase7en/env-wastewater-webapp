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
  // Strip the basename prefix if present (the stash stores the full path).
  const target = spaRedirect.startsWith(basename) ? spaRedirect.slice(basename.length) : spaRedirect;
  window.history.replaceState(null, "", basename.replace(/\/$/, "") + target);
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
