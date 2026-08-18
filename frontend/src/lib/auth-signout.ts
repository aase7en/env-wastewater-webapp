/**
 * WO-STAB-003 (2026-08-15) / remediation (WO-STAB-INTEGRATE-001 finding 1):
 * the full sign-out sequence as a unit-testable seam. Previously the
 * context's signOut only called supabase.auth.signOut + setAppUser(null) —
 * the React Query cache kept the previous user's rows, so on a shared ward
 * device the next user briefly saw them until RLS-gated refetches resolved.
 *
 * The cache is cleared BEFORE the error path can return: even when
 * supabase signOut throws (network), the local cache must not survive.
 * RLS remains the authoritative gate server-side; this is the client-side
 * leg of the shared-device hygiene.
 *
 * Lives in lib/ (not AuthProvider.tsx) so exporting it does not trip
 * react(only-export-components) — same non-component-module pattern as
 * lib/auth-redirect.ts.
 */
import { supabase } from "./supabase";
import { queryClient } from "./query-client";

export async function signOutAll(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } finally {
    queryClient.clear();
  }
}
