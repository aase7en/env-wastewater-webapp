/**
 * EQ-1 (2026-08-11) — React Query foundation.
 *
 * Singleton QueryClient with project-wide defaults. Imported once by
 * main.tsx and wrapped around the whole app via <QueryClientProvider>.
 * Tests can construct their own client via createTestQueryClient() below
 * (or use QueryClientProvider with a fresh client per test).
 *
 * Defaults rationale:
 *   - staleTime: 30s — most data here changes at most once a day (water
 *     readings, monthly carbon rollups); 30s is a safety floor that lets
 *     tab switches reuse cached data without hammering Supabase, while
 *     still picking up admin edits reasonably fast. Tuned per-query if a
 *     hook needs tighter/looser freshness.
 *   - retry: 1 — one retry on transient failure, no exponential backoff
 *     (Supabase free tier is the failure surface; hammering makes it
 *     worse).
 *   - refetchOnWindowFocus: true — replaces the manual focus/visibility
 *     listeners that useThresholdAlerts and usePendingUsers were running
 *     (chunk EQ-3 will delete those).
 *   - refetchOnReconnect: true (default) — relevant for the hospital's
 *     flaky wifi + PWA-on-phone use case.
 *
 * Track Z scope (lib + provider wiring, no UI).
 */
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      // Mutations are user-triggered (form submit, delete, toggle) — do
      // NOT auto-retry. A duplicate write on a flaky network is worse
      // than a surfaced error.
      retry: false,
    },
  },
});

/**
 * Test-only factory: a fresh QueryClient with no staleTime cache (so
 * tests can assert fetch behavior synchronously) and no retries (so
 * failure assertions don't flap). Imported by *.test.ts files that need
 * to wrap a hook in <QueryClientProvider>.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 0, retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}
