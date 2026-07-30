import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import { usePendingUsers } from "../../lib/admin/users";
import { MSymbol } from "./MSymbol";
import { Skeleton } from "./Skeleton";
import { cn } from "../../lib/utils";
import { thaiDate } from "../../lib/utils";

/**
 * Pending-users bell (AUTH-7.5, 2026-07-30) — admin-only companion to
 * NotificationBell. Shows a count badge for OAuth users awaiting admin
 * approval (role='pending') + a dropdown preview of the queue, with a
 * "ไปหน้าอนุมัติ" action to /admin/users.
 *
 * Rendered only when `isAdmin` (mirrors NotificationBell's isAuthenticated
 * gate). Uses the same poll/focus/visibility pattern (usePendingUsers,
 * 60s) — NOT realtime, consistent with the app's free-tier discipline.
 * No badge/pulse when count = 0 (no-fake-attention rule).
 *
 * Visual template: NotificationBell.tsx verbatim — brand tokens, count
 * bubble classes, dropdown shell, outside-click/Escape, Skeleton rows.
 * Track F polish (micro-animations, hero emphasis) deferred to Fable5.
 */
export function PendingUsersBell({ className }: { className?: string }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;
  return <BellInner className={className} />;
}

function BellInner({ className }: { className?: string }) {
  const { users, count, loading } = usePendingUsers();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on outside click / Escape (mirror NotificationBell:29-43).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={count > 0 ? `ผู้ใช้รออนุมัติ ${count} ราย` : "ผู้ใช้รออนุมัติ"}
        aria-expanded={open}
        className={cn(
          "relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all",
          "border-aura-borderSubtle text-aura-textMuted hover:text-aura-cyan hover:border-aura-cyan/40",
          open && "text-aura-cyan border-aura-cyan/40"
        )}
      >
        <MSymbol name="person_add" fill={count > 0} className="text-[20px]" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-alert-red text-white text-[10px] font-bold flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 max-w-[calc(100vw-1.5rem)] z-50 aura-card aura-card--static p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-aura-borderSubtle flex items-center justify-between">
            <span className="text-sm font-semibold text-aura-textMain font-thai">ผู้ใช้รออนุมัติ</span>
            {count > 0 && (
              <span className="text-[10px] uppercase tracking-widest text-aura-textMuted">{count} ราย</span>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && users.length === 0 ? (
              <div className="p-2 space-y-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-2.5 px-2 py-3">
                    <Skeleton className="h-[18px] w-[18px] rounded-md mt-0.5" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-2.5 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="px-4 py-6 text-sm text-aura-textMuted font-thai text-center">
                ไม่มีคำขอรออนุมัติ
              </div>
            ) : (
              users.map((u) => (
                <div
                  key={u.id}
                  className="w-full text-left px-4 py-3 border-b border-aura-borderSubtle/50 last:border-b-0"
                >
                  <div className="flex items-start gap-2.5">
                    <MSymbol name="person_add" className="text-[18px] mt-0.5 text-aura-cyan" />
                    <div className="min-w-0">
                      <div className="text-sm font-thai text-aura-textMain truncate">
                        {u.display_name || u.email || "ผู้ใช้ใหม่"}
                      </div>
                      {u.email && u.display_name && (
                        <div className="text-[11px] text-aura-textMuted font-thai mt-0.5 truncate">
                          {u.email}
                        </div>
                      )}
                      <div className="text-[11px] text-aura-textMuted font-thai mt-0.5">
                        สมัคร {thaiDate(u.created_at.slice(0, 10))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/admin/users");
            }}
            className="w-full px-4 py-2.5 text-sm text-aura-cyan hover:bg-aura-cyan/10 font-thai border-t border-aura-borderSubtle transition-colors"
          >
            ไปหน้าอนุมัติ
          </button>
        </div>
      )}
    </div>
  );
}
