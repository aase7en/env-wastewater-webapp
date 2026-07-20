# ADR-0006: SPA redirect stash must be restored verbatim

- **Status**: Accepted (2026-07-20, chunk SPA-1)
- **Context**: [SPA-1 commit `fcd2a16`](https://github.com/aase7en/env-wastewater-webapp/commit/fcd2a16) + [Fable5 review #7](../handoff/2026-07-19-track-z-complete.md)
- **Supersedes**: implicit assumption in P13 SPA fallback (commit `fc30a4c`)
- **Related**: ADR-0004 (Supabase-first / GitHub Pages deploy target)

## Context

GitHub Pages serves this SPA at a subpath (`/env-wastewater-webapp/`).
Static hosts don't rewrite client-side routes — a deep link like
`https://aase7en.github.io/env-wastewater-webapp/readings` returns a 404
from GitHub's static file server before the SPA ever boots.

The standard workaround (P13, commit `fc30a4c`) is the **404.html SPA
fallback**: a tiny 404.html (sibling of index.html) stashes the requested
pathname into `sessionStorage`, then redirects to the SPA root so the
bundle can boot. Once React mounts, `main.tsx` reads the stash and replaces
the URL with the intended path so `BrowserRouter` sees it.

The P13 implementation reconstructed the path by **slicing off the basename
and rejoining**:

```ts
const stash = sessionStorage.getItem("gh-pages-spa-redirect");
const stripped = stash.slice(basename.length);  // BUG: drops the leading "/"
window.history.replaceState(null, "", basename + stripped);  // concat
```

This broke for every deep link. Concretely, with `basename =
"/env-wastewater-webapp/"` and `stash = "/env-wastewater-webapp/readings"`:

- `slice(basename.length)` → `"/readings"` loses its leading `/`? No — wait,
  the actual bug is more subtle.
- The real mechanism: `basename + stripped` produces
  `/env-wastewater-webapp` + `readings` = `/env-wastewater-webappreadings`
  (no `/` separator). `BrowserRouter` with `basename="/env-wastewater-webapp/"`
  cannot match this URL → the route table returns nothing → blank page.

This bug was **latent** for 3 days (2026-07-17 → 2026-07-20) because the
`deploy-frontend` GitHub Action was red 40/40 since repo creation (npm ci
lockfile mismatch — fixed by CI-1 `69aa8dd`). Once CI-1 unblocked deploy,
the bug went live and was caught immediately by the first prod e2e.yml run
(Fable5 review #6).

## Decision

**Restore the stash verbatim.** No slicing, no rejoining, no normalization.

```ts
const stash = sessionStorage.getItem("gh-pages-spa-redirect");
if (stash) {
  sessionStorage.removeItem("gh-pages-spa-redirect");
  window.history.replaceState(null, "", stash);  // ← verbatim
}
```

Why this is safe: the stash is captured by **the same site's** 404.html
from `window.location.pathname` (+ search + hash). It already includes the
basename because the user requested it on this site. Reconstructing it is
both unnecessary and error-prone — every reconstruction is an opportunity
to introduce a path-joining bug.

## Alternatives considered

### A. Fix the slice-and-rejoin with a `/` separator

```ts
const stripped = stash.slice(basename.length);
window.history.replaceState(null, "", basename + "/" + stripped);
```

**Rejected.** Fixes the immediate symptom but keeps the reconstruction
logic — next maintainer who changes `basename` length, encoding, or
trailing-slash convention re-introduces a variant of the bug. Verbatim
restore eliminates the entire class.

### B. Use `basename`-aware URL manipulation (e.g. `new URL(stash, origin)`)

**Rejected.** Adds a dependency on `window.location.origin` and `URL`
parsing semantics for no benefit. The stash is already a fully-qualified
same-origin path; `replaceState(null, "", stash)` is the minimum work.

### C. Use HashRouter instead of BrowserRouter

**Rejected.** HashRouter (`/#/readings`) sidesteps the deep-link problem
entirely because the hash is never sent to the server. But:

- URLs are uglier (`/#/readings` vs `/readings`)
- Less SEO-friendly (crawlers treat hash routes as the same page)
- Server logs don't see routes (analytics impact)
- Doesn't fix the underlying latent bug for anyone else using BrowserRouter
  on a subpath

Worth re-visiting only if the SPA grows to a scale where deep-link SEO
becomes irrelevant (e.g. admin-only app behind auth).

### D. Move to a host that supports server-side rewrites (Netlify, Vercel)

**Rejected.** Project constraint (ADR-0004) is 100% free tier forever +
minimal ops surface. GitHub Pages is free + static + zero-config. The
404.html workaround is a known pattern with one sharp edge (this ADR's
topic); fixing the sharp edge is cheaper than switching hosts.

## Consequences

### Positive

- **Deep links work on prod.** `/readings`, `/form`, `/auth/callback`
  (OAuth redirect target!) — all resolve correctly. The OAuth flow was
  broken before SPA-1 because the callback deep link hit the basename-join
  bug.
- **No path-joining logic to maintain.** The 404.html capture + main.tsx
  restore is now 4 lines of trivial code.
- **Bug class eliminated.** Future `basename` changes (different repo name,
  custom domain, etc.) can't re-introduce a slice/rejoin variant.

### Negative

- **Stash format is implicitly tied to 404.html output.** If someone edits
  `scripts/github-pages-spa-redirect.html` to stash something else (e.g.
  full URL, or only pathname without search), the verbatim restore will
  produce wrong URLs. Mitigation: the stash source and consumer are both
  in this repo + both covered by ADR-0006 + the e2e.yml prod smoke now
  catches deep-link regressions (added in CI-1 / E2E-2).

- **No client-side URL normalization.** If the stash contains a malformed
  path (double slashes, encoded chars), it goes straight to
  `BrowserRouter`. Browsers + react-router are generally tolerant, but
  edge cases could surface. Mitigation: 404.html only stashes what the
  browser itself produced (`window.location.pathname` is always
  well-formed for the current page).

### Latent-bug lesson

The 3-day latency between P13 (introducing the bug) and SPA-1 (fixing it)
had two causes worth flagging:

1. **No prod smoke for deep links.** Until CI-1 (`69aa8dd`) unblocked
   `deploy-frontend` + E2E-2 (`0d1f636`) wired basename-aware test
   assertions, prod deep-link behavior was effectively unverified. The
   local dev server (origin-root, no basename) never exercised the code
   path. **Lesson**: prod-CI smoke for deep links is the only regression
   net that catches this class — local dev never sees it.

2. **The bug was in main.tsx, not in P13's WO scope.** P13 was scoped as
   "deploy to Pages" (ops task), and the SPA fallback was a small detail
   that escaped review. **Lesson**: any URL/path manipulation in main.tsx
   should get its own review pass against the deploy target's URL shape.

## Validation

- `npm run e2e:prod` (post-SPA-1) → 25/25 ✅ including deep-link auth routes
- `e2e.yml` GitHub Action → first green prod run in repo history after SPA-1
  (commit `fcd2a16` triggered run `29711714159`, 23 passed — previous runs
  were 40/40 red since repo creation due to CI-1 npm ci lockfile bug)
- OAuth callback (`/auth/callback`) deep link resolves correctly on prod

## References

- Commit: `fcd2a16` (SPA-1 fix) + `fc30a4c` (P13 original — introduced bug)
- WO: `docs/work-orders/E2E-2-prod-profile-basename.md` (related test
  harness fix that made the bug visible)
- Review: Fable5 review #7 in `docs/handoff/2026-07-19-track-z-complete.md`
  (root cause analysis)
- ADR-0004 (Supabase-first / GitHub Pages deploy target — why we're on
  Pages in the first place)
