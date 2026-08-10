import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/sw-register";
import { queryClient } from "./lib/query-client";

// basename = repo subpath on GitHub Pages, "/" in dev.
// Vite injects import.meta.env.BASE_URL from vite.config.ts.
const basename = import.meta.env.BASE_URL || "/";

// GitHub Pages SPA fallback: 404.html (see .github/workflows/deploy-
// frontend.yml + scripts/github-pages-spa-redirect.html) stashes the
// intended path here, then bounces to the SPA root.
// AUTH-6 (2026-07-30): the PRIMARY restore now lives in an inline <script>
// in index.html <head>, which runs BEFORE module imports — critical because
// `import { supabase }` triggers createClient() with detectSessionInUrl at
// import time. If the URL still shows the post-404-fallback root then,
// Supabase can't see the OAuth ?code= /#access_token= and login loops.
// This block is now a defensive fallback (no-op in the normal path because
// index.html already consumed the stash).
const spaRedirect = sessionStorage.getItem("gh-pages-spa-redirect");
if (spaRedirect) {
  sessionStorage.removeItem("gh-pages-spa-redirect");
  window.history.replaceState(null, "", spaRedirect);
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <StrictMode>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </StrictMode>
  </QueryClientProvider>
);

// EQ-1 (2026-08-11): catch promise rejections that escape React's tree —
// React Query's useQuery/useMutation errors are surfaced via their own
// `error` state, but a stray `.then()` or an unwrapped fetch in an effect
// would otherwise vanish silently in prod. Routes to console.error for
// now; forwarding to an analytics sink waits on the analytics policy
// decision (reports/infra-audit-2026-08.md #16).
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const msg = reason instanceof Error ? reason.message : String(reason);
  console.error("unhandledrejection:", msg, reason);
});

// Register the service worker for offline-capable PWA (P20c). Skipped in
// dev (HMR proxy conflicts) — only runs in production builds.
void registerServiceWorker();
