import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { decideAuthCallbackTarget } from "../lib/auth-callback-target";

/**
 * OAuth redirect target. After Google/LINE complete their flow, Supabase
 * bounces back to /auth/callback with the session in the URL hash.
 * getSession() picks it up, then we redirect based on the user's role:
 *
 *  - pending  → /pending-approval  (OAuth user awaiting admin approval)
 *  - staff/admin → the stashed `auth-next` path, or /dashboard
 *
 * OAUTH-2 (2026-07-21): added pending handling so a freshly-signed-up
 * OAuth user lands on the explanation page instead of being bounced
 * from /dashboard back to /login in a confusing loop.
 *
 * AUTH-4 (2026-07-30): the original `if (!loading)` gate had a one-render
 * gap — a freshly-arrived session is set while appUserLoading is still
 * false (it flips inside loadAppUser). In that gap, isPending read from a
 * null appUser → false → a pending user was misrouted to /dashboard,
 * RequireAuth bounced them later → "เข้า dashboard ได้แต่คลิกแล้วเด้ง login".
 * Fix: also wait for `appUserResolved` (a dedicated flag that flips true
 * only inside loadAppUser's finally). Decision logic is a pure fn for tests.
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const { session, loading, appUserResolved, isPending } = useAuth();

  useEffect(() => {
    const stash = sessionStorage.getItem("auth-next");
    const target = decideAuthCallbackTarget(loading, appUserResolved, isPending);
    if (target === "wait") return; // not ready yet — stay on spinner
    sessionStorage.removeItem("auth-next");
    if (target === "pending-approval") {
      navigate("/pending-approval", { replace: true });
    } else {
      // "dashboard" — consume the stashed next path if any.
      navigate(stash || "/dashboard", { replace: true });
    }
  }, [loading, appUserResolved, isPending, session, navigate]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex items-center gap-3 text-aura-textMuted font-thai">
        <span className="w-5 h-5 border-2 border-aura-cyan border-t-transparent rounded-full animate-spin" />
        กำลังเข้าสู่ระบบ…
      </div>
    </div>
  );
}
