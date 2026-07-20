import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";

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
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const { session, loading, isPending } = useAuth();

  useEffect(() => {
    // Wait for the session to settle — onAuthStateChange will populate it.
    if (!loading) {
      const stash = sessionStorage.getItem("auth-next");
      sessionStorage.removeItem("auth-next");
      if (isPending) {
        navigate("/pending-approval", { replace: true });
      } else {
        navigate(stash || "/dashboard", { replace: true });
      }
    }
  }, [loading, isPending, session, navigate]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex items-center gap-3 text-aura-textMuted font-thai">
        <span className="w-5 h-5 border-2 border-aura-cyan border-t-transparent rounded-full animate-spin" />
        กำลังเข้าสู่ระบบ…
      </div>
    </div>
  );
}
