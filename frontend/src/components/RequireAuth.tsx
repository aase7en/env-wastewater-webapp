import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

/**
 * Route guard — wraps protected routes. If not authenticated, bounce to
 * /login with ?next=<intended path> so the user lands back where they
 * wanted after a successful login.
 *
 * `requireAdmin` further gates admin-only routes (delete reading, etc.).
 */
export function RequireAuth({
  children,
  requireAdmin = false,
}: {
  children: ReactNode;
  requireAdmin?: boolean;
}) {
  const { loading, isAuthenticated, isAdmin } = useAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-aura-textMuted font-thai">
          <span className="w-5 h-5 border-2 border-aura-cyan border-t-transparent rounded-full animate-spin" />
          กำลังตรวจสอบสิทธิ์…
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 text-center font-thai text-aura-textMuted">
        <p className="text-lg text-aura-textMain mb-2">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-sm">หน้านี้สำหรับผู้ดูแลระบบ (admin) เท่านั้น</p>
      </div>
    );
  }

  return <>{children}</>;
}
