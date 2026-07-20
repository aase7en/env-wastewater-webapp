import { type FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuraCard } from "../components/ui/AuraCard";
import { Button } from "../components/ui/Button";
import { Field, Input } from "../components/ui/Input";
import { MSymbol } from "../components/ui/MSymbol";
import { useAuth } from "../components/AuthProvider";
import { cn } from "../lib/utils";

type Mode = "login" | "register" | "reset";

/** Brand lockup — UTH[AI]-ENV with the [AI] neon highlight (suite §1).
 * Copied from AppShell.tsx's BrandWordmark (F4.5: kept file-local on
 * purpose, not exported, to avoid widening this page's scope). */
function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display font-bold tracking-tight", className)}>
      <span className="text-aura-textMain">UTH</span>
      <span className="aura-text-gradient">[AI]</span>
      <span className="text-aura-textMain">-ENV</span>
    </span>
  );
}

export function AuthPage() {
  const { signInWithEmail, signUpWithEmail, resetPassword, signInWithGoogle, signInWithLine } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // ?next=/form lets route guards bounce back to the page the user wanted.
  const next = params.get("next") || "/dashboard";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await signInWithEmail(email, password);
        if (error) setError(error);
        else navigate(next);
      } else if (mode === "register") {
        const { error } = await signUpWithEmail(email, password);
        if (error) setError(error);
        else setInfo("สมัครสำเร็จ — ตรวจสอบอีเมลเพื่อยืนยันตัวตน แล้วกลับมาเข้าสู่ระบบ");
      } else {
        const { error } = await resetPassword(email);
        if (error) setError(error);
        else setInfo("ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Brand */}
        <div className="text-center">
          <h1><BrandWordmark className="text-3xl" /></h1>
          <p className="text-sm text-aura-textMuted font-thai mt-1">ระบบบำบัดน้ำเสีย · โรงพยาบาลอุทัย</p>
        </div>

        <AuraCard className="p-6 space-y-4">
          {/* Mode tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-aura-surfaceHigh/40 border border-aura-borderSubtle">
            {(["login", "register", "reset"] as const).map((m) => (
              <Button
                key={m}
                type="button"
                variant={mode === m ? "primary" : "ghost"}
                size="sm"
                className="flex-1 font-thai"
                onClick={() => { setMode(m); setError(null); setInfo(null); }}
              >
                {m === "login" ? "เข้าสู่ระบบ" : m === "register" ? "สมัครใหม่" : "ลืมรหัส"}
              </Button>
            ))}
          </div>

          {/* Email/password form */}
          <form onSubmit={onSubmit} className="space-y-3">
            <Field label="อีเมล" required htmlFor="email">
              <div className="relative">
                <MSymbol name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-aura-textMuted pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@uthai.go.th"
                  className="pl-10"
                  autoComplete="email"
                />
              </div>
            </Field>

            {mode !== "reset" && (
              <Field label="รหัสผ่าน" required htmlFor="password">
                <div className="relative">
                  <MSymbol name="key" className="absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-aura-textMuted pointer-events-none" />
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                </div>
              </Field>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-lg p-3 text-sm font-thai bg-alert-red/10 border border-alert-red/40 text-alert-red">
                <MSymbol name="error" className="text-[16px] shrink-0 mt-0.5" /> <span>{error}</span>
              </div>
            )}
            {info && (
              <div className="flex items-start gap-2 rounded-lg p-3 text-sm font-thai bg-alert-green/10 border border-alert-green/40 text-alert-green">
                <MSymbol name="check_circle" className="text-[16px] shrink-0 mt-0.5" /> <span>{info}</span>
              </div>
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full">
              {mode === "login" ? "เข้าสู่ระบบ" : mode === "register" ? "สมัครสมาชิก" : "ส่งลิงก์รีเซ็ต"}
              <MSymbol name="arrow_forward" className="text-[16px]" />
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 text-xs text-aura-textMuted">
            <div className="flex-1 h-px bg-aura-borderSubtle" />
            <span className="font-thai">หรือ</span>
            <div className="flex-1 h-px bg-aura-borderSubtle" />
          </div>

          {/* OAuth providers */}
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="secondary" onClick={() => signInWithGoogle()}>
              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/>
              </svg>
              Google
            </Button>
            <Button type="button" variant="secondary" onClick={() => signInWithLine()}>
              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
                <path fill="#06C755" d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.078.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
              </svg>
              LINE
            </Button>
          </div>

          {/* OAUTH-2: notice so users don't get stuck if a provider is not
              yet configured in the Supabase dashboard. One line, no
              styling decisions — Track F can polish later. */}
          <p className="text-xs text-aura-textMuted text-center font-thai">
            หากเข้าสู่ระบบด้วย Google/LINE ไม่ได้ อาจยังไม่ได้เปิดใช้งาน — โปรดแจ้งผู้ดูแล
          </p>
        </AuraCard>
      </div>
    </div>
  );
}
