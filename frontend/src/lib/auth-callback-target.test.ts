/**
 * AUTH-4 (2026-07-30) — unit tests for decideAuthCallbackTarget.
 *
 * Pins the OAuth callback navigation contract: a pending user MUST NOT be
 * routed to /dashboard. The original inline AuthCallback bug let this happen
 * during the one-render gap between session arrival and appUser resolution.
 */
import { describe, it, expect } from "vitest";
import { decideAuthCallbackTarget } from "./auth-callback-target";

describe("decideAuthCallbackTarget", () => {
  it("RED reproduces the original bug: pending user routed to dashboard when appUser not yet resolved", () => {
    // The bug: during the gap, loading=false (session set, appUserLoading not
    // yet true), isPending=false (appUser still null). Old code returned
    // /dashboard. The fix must return "wait" until appUserResolved is true.
    const target = decideAuthCallbackTarget(
      /* loading */ false,
      /* appUserResolved */ false, // ← still resolving (the gap)
      /* isPending */ false, // ← meaningless until resolved
    );
    // The fixed fn must NOT route to dashboard here — must wait.
    expect(target).toBe("wait");
    expect(target).not.toBe("dashboard");
  });

  it("pending user (role resolved) → pending-approval", () => {
    expect(decideAuthCallbackTarget(false, true, true)).toBe("pending-approval");
  });

  it("staff/admin (role resolved, not pending) → dashboard", () => {
    // Stash consumption is the caller's job; fn just picks the target class.
    expect(decideAuthCallbackTarget(false, true, false)).toBe("dashboard");
  });

  it("still loading → wait", () => {
    expect(decideAuthCallbackTarget(true, false, false)).toBe("wait");
    expect(decideAuthCallbackTarget(true, true, false)).toBe("wait");
  });

  it("resolved but no session (logged out) → dashboard-class; caller's RequireAuth bounce handles it", () => {
    // If appUserResolved is true but there's no session, isPending is false.
    // We can't distinguish "staff" from "logged-out" from the role alone;
    // routing to dashboard lets RequireAuth's !isAuthenticated check bounce
    // cleanly to /login. The structural fix (first test) ensures we never
    // navigate on a null appUser.
    expect(decideAuthCallbackTarget(false, true, false)).toBe("dashboard");
  });
});
