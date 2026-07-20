import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import { useThresholdAlerts } from "../../lib/alerts";
import { MSymbol } from "./MSymbol";
import { Skeleton } from "./Skeleton";
import { cn } from "../../lib/utils";
import { thaiDate } from "../../lib/utils";

/**
 * Threshold-alert bell (WO-V3b) — real data from wastewater.threshold_alert
 * via useThresholdAlerts (V3a). Rendered only when authenticated (RLS gates
 * the table anyway). No pulse/badge when unread = 0 — per the
 * no-fake-telemetry rule, attention cues appear only for real alerts.
 */
export function NotificationBell({ className }: { className?: string }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return <BellInner className={className} />;
}

function BellInner({ className }: { className?: string }) {
  const { alerts, unread, loading, markRead } = useThresholdAlerts();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on outside click / Escape.
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

  const onPick = async (id: string, readingId: string) => {
    setOpen(false);
    await markRead(id);
    navigate(`/form/${readingId}`);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `การแจ้งเตือน ${unread} รายการยังไม่อ่าน` : "การแจ้งเตือน"}
        aria-expanded={open}
        className={cn(
          "relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all",
          "border-aura-borderSubtle text-aura-textMuted hover:text-aura-cyan hover:border-aura-cyan/40",
          open && "text-aura-cyan border-aura-cyan/40"
        )}
      >
        <MSymbol name="notifications" fill={unread > 0} className="text-[20px]" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-alert-red text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 max-w-[calc(100vw-1.5rem)] z-50 aura-card aura-card--static p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-aura-borderSubtle flex items-center justify-between">
            <span className="text-sm font-semibold text-aura-textMain font-thai">การแจ้งเตือนค่าเกินเกณฑ์</span>
            {unread > 0 && (
              <span className="text-[10px] uppercase tracking-widest text-aura-textMuted">{unread} ยังไม่อ่าน</span>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && alerts.length === 0 ? (
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
            ) : alerts.length === 0 ? (
              <div className="px-4 py-6 text-sm text-aura-textMuted font-thai text-center">ไม่มีการแจ้งเตือน</div>
            ) : (
              alerts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => void onPick(a.id, a.reading_id)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-aura-borderSubtle/50 last:border-b-0 transition-colors hover:bg-aura-cyan/5",
                    !a.read_at && "bg-aura-surfaceHigh/30"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <MSymbol
                      name="warning"
                      fill={!a.read_at}
                      className={cn("text-[18px] mt-0.5", a.read_at ? "text-aura-textMuted" : "text-alert-amber")}
                    />
                    <div className="min-w-0">
                      <div className={cn("text-sm font-thai", a.read_at ? "text-aura-textMuted" : "text-aura-textMain")}>
                        {a.message}
                      </div>
                      <div className="text-[11px] text-aura-textMuted font-thai mt-0.5">
                        {thaiDate(a.created_at.slice(0, 10))}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
