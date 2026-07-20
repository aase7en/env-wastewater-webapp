/**
 * OAUTH-2 (2026-07-21) — landing page for OAuth users with role='pending'.
 *
 * RequireAuth bounces pending users here from every protected route. They
 * can authenticate (Supabase session is valid) but cannot reach any data
 * page until an admin promotes them via /admin/users.
 *
 * The page explains the wait state, shows the email we have on file, and
 * offers a sign-out button. There is intentionally no link to /dashboard
 * — pending users must be approved first.
 *
 * UI is minimal (Track Z logic): Track F polish (animations, AuraCard
 * emphasis, hero icon) is deferred to Fable5.
 */
import { useAuth } from "../components/AuthProvider";
import { AuraCard } from "../components/ui/AuraCard";
import { Button } from "../components/ui/Button";
import { MSymbol } from "../components/ui/MSymbol";

export function PendingApprovalPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="font-display font-bold tracking-tight text-3xl">
            <span className="text-aura-textMain">UTH</span>
            <span className="aura-text-gradient">[AI]</span>
            <span className="text-aura-textMain">-ENV</span>
          </h1>
          <p className="text-sm text-aura-textMuted font-thai mt-1">
            ระบบบำบัดน้ำเสีย · โรงพยาบาลอุทัย
          </p>
        </div>

        <AuraCard className="p-6 space-y-4 text-center font-thai">
          <MSymbol name="hourglass_top" className="text-[48px] text-aura-cyan mx-auto" />
          <h2 className="text-xl font-semibold text-aura-textMain">
            บัญชีรอการอนุมัติ
          </h2>
          <p className="text-sm text-aura-textMuted">
            บัญชี{" "}
            <span className="text-aura-textMain font-medium">
              {user?.email ?? "ของคุณ"}
            </span>{" "}
            ลงทะเบียนสำเร็จ แต่ยังรอผู้ดูแลระบบอนุมัติ กรุณาติดต่อผู้ดูแล
            หรือรอการอนุมัติแล้วเข้าสู่ระบบอีกครั้ง
          </p>
          <Button
            onClick={() => void signOut()}
            variant="secondary"
            size="lg"
            className="w-full"
          >
            <MSymbol name="logout" className="text-[16px]" />
            ออกจากระบบ
          </Button>
        </AuraCard>
      </div>
    </div>
  );
}
