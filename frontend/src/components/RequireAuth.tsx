import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { PageSkeleton } from "./ui/Skeleton";

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
      <div aria-busy="true">
        <span className="sr-only">กำลังตรวจสอบสิทธิ์…</span>
        <PageSkeleton />
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
