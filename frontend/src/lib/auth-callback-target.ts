/**
 * OAuth callback navigation target — pure helper, extracted from AuthCallback.
 *
 * AUTH-4 (2026-07-30, a-debug): the previous inline impl navigated as soon as
 * `loading` flipped false — but `loading` has a one-render gap where a freshly
 * arrived session is set while `appUserLoading` is still false (it gets set
 * true only inside the loadAppUser() call, which runs after setSession). In
 * that gap, AuthCallback saw loading=false, read isPending from a still-null
 * appUser (→ false), and navigated a pending user to /dashboard. RequireAuth
 * then caught the resolved-isPending later and bounced → "เข้า dashboard ได้
 * แต่คลิกแล้วเด้ง login".
 *
 * Fix: the gate is "loading false AND appUser resolved" — i.e. navigation must
 * wait until we actually KNOW the role, not just until the session arrived.
 * Callers pass `appUserResolved` (distinct from `loading`) so the gap is closed
 * structurally.
 */

export type AuthCallbackTarget = "pending-approval" | "dashboard" | "wait";

/** Decide where AuthCallback should navigate.
 *
 * @param loading    AuthProvider's combined loading flag
 * @param appUserResolved  true once the app_user lookup has settled
 *                         (regardless of whether it found a row). This is the
 *                         key addition vs the old `!loading`-only gate.
 * @param isPending  true iff appUser.role === 'pending' (only meaningful once
 *                   appUserResolved is true)
 * @returns "wait" | "/pending-approval" | "/dashboard"
 *
 * Note: the stashed `auth-next` path (if any) is consumed by the caller when
 * it decides to navigate — this fn only picks the target class, so the stash
 * is not a parameter here.
 */
export function decideAuthCallbackTarget(
  loading: boolean,
  appUserResolved: boolean,
  isPending: boolean,
): AuthCallbackTarget {
  // Must wait for BOTH the session check AND the appUser lookup — otherwise
  // isPending is read from a null appUser (→ false) and a pending user is
  // misrouted to /dashboard. (The original bug.)
  if (loading || !appUserResolved) {
    return "wait";
  }
  return isPending ? "pending-approval" : "dashboard";
}
