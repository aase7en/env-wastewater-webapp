# ENV-PREVIEW-001 — synthetic-data preview

Status: REVIEW_REQUESTED; automatic Sites publishing BLOCKED_CAPABILITY

## User authorization
User requests an ENV preview before production, accepts updates after GitHub
push/build, and explicitly selected editable synthetic data. This work uses
an isolated checkout from main 7d4e6b52c616ff15f86e399a085ef16477d38ef8.
No existing implementation claim is touched. Scope is additive preview/*,
vite.preview.config.ts, preview-sandbox.yml, and this work order. Production
src, normal Vite config, deployment workflow, and shared SSoT are unchanged.

## Goal / acceptance
- Render the existing ENV application, not a replacement dashboard.
- Synthetic wastewater sample records, editable browser-local CRUD, reset.
- No real hospital credential, network write, AI call, auth or sensor service.
- Visible source SHA/branch/build time and simulation label.
- Build CI artifact from exact PR head; production deployment unchanged.
- Separate owner-private Sites snapshot. Automatic push-to-Sites publication
  is NOT implemented: exposed tooling provides per-session owner publication,
  not a supported permanent GitHub Actions credential/webhook contract.

## Implementation
Vite preview-only resolver replaces the shared data client and SW registration;
normal builds use unchanged production modules. A local PostgREST subset serves
Supabase SDK requests without network fallback. CSP also limits connect-src to
self. Synthetic auth uses an invalid host, fake session, isolated storage key.
Data edits persist in localStorage per browser; no sharing between devices.
Only 14-day wastewater example records and reference rows are prepopulated.
Other table CRUD starts empty. Unsupported joins, aggregate views, RPC, AI,
storage and live sensors report errors rather than fabricate production data.
This is not a simulator of SQL triggers/RLS or a full database emulator.

## Verification / release
Node tests cover CRUD/reopen/reset, isolation, unsupported paths, filter/count,
null DO, single responses and storage-quota failure. Vite preview build required.
Independent reviewer found no blocker for the single-browser wastewater sandbox; installed SDK session/role/CRUD smoke also passed. Multiple simultaneous tabs are not an atomic collaborative database; use one tab for editing. Browser visual/E2E validation has not been performed. Implementation PR must
remain REVIEW_REQUESTED; implementer must not merge its own PR.
The Sites source repository mirrors this isolated source for a private snapshot;
the GitHub repository remains canonical for future development.

## Rollback
Remove the additive preview workflow/config/folder or stop opening the separate
Site. No production database or existing deployment change requires rollback.

## Next
After review, integrate preview support via authorized reviewer. CI produces
artifacts on PR updates. To obtain truly automatic hosted updates, establish a
supported hosting CI integration; do not claim this Sites snapshot auto-updates.
