/**
 * WO-STAB-003 — signOut must clear the React Query cache.
 *
 * Bug (verified on main @ bac0517, code-review-2026-08-12 #3):
 * AuthProvider.signOut called supabase.auth.signOut() + setAppUser(null)
 * but never touched the queryClient — the singleton cache kept the
 * previous user's rows (readings, audit log, pending users…) and the next
 * user on a shared ward device briefly saw them until RLS-gated refetches
 * resolved.
 *
 * Test approach: the sign-out sequence lives in an exported pure-ish seam
 * `signOutAll()` (supabase signOut + queryClient.clear) so it is unit
 * testable in node env without DOM rendering — the context's signOut
 * delegates to it, so the production path is the tested path.
 *
 * Remediation (WO-STAB-INTEGRATE-001 finding 1): the seam moved to
 * lib/auth-signout.ts (non-component module) so AuthProvider.tsx no
 * longer trips react(only-export-components). Import updated; behavior
 * under test unchanged.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { queryClient } from "../lib/query-client";

const signOutMock = vi.fn(async () => ({ error: null }));

vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      signOut: () => signOutMock(),
    },
  },
}));

import { signOutAll } from "../lib/auth-signout";

beforeEach(() => {
  signOutMock.mockClear();
});

describe("signOutAll — clears React Query cache (WO-STAB-003)", () => {
  it("RED→GREEN: signOutAll calls both supabase signOut and queryClient.clear", async () => {
    const clearSpy = vi.spyOn(queryClient, "clear");
    await signOutAll();
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(clearSpy).toHaveBeenCalledTimes(1);
    clearSpy.mockRestore();
  });

  it("cache clear runs even if supabase signOut throws (defense)", async () => {
    const clearSpy = vi.spyOn(queryClient, "clear");
    signOutMock.mockRejectedValueOnce(new Error("network down"));
    await expect(signOutAll()).rejects.toThrow("network down");
    // The cache is still cleared before the error propagates — a later
    // retry must start from an empty cache, not the previous user's rows.
    expect(clearSpy).toHaveBeenCalledTimes(1);
    clearSpy.mockRestore();
  });
});
