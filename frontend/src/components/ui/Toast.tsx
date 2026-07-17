import { type ReactNode, createContext, useCallback, useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "../../lib/utils";

type ToastKind = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  toast: (kind: ToastKind, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ICONS: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS: Record<ToastKind, string> = {
  success: "border-alert-green/50 bg-alert-green/15 text-alert-green",
  error: "border-alert-red/50 bg-alert-red/15 text-alert-red",
  warning: "border-alert-amber/50 bg-alert-amber/15 text-alert-amber",
  info: "border-aura-cyan/50 bg-aura-cyan/15 text-aura-cyan",
};

/** Toast provider — wraps the app. Renders a fixed bottom-right stack via portal. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, kind, message }]);
    // Auto-dismiss after 4s (success) or 6s (others).
    setTimeout(() => dismiss(id), kind === "success" ? 4000 : 6000);
  }, [dismiss]);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (m) => toast("success", m),
      error: (m) => toast("error", m),
      warning: (m) => toast("warning", m),
      info: (m) => toast("info", m),
    }),
    [toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
          {toasts.map((t) => {
            const Icon = ICONS[t.kind];
            return (
              <div
                key={t.id}
                className={cn(
                  "pointer-events-auto flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-thai shadow-lg backdrop-blur-md animate-[aura-pulse-dot_0.4s_ease-out]",
                  COLORS[t.kind]
                )}
                role="status"
              >
                <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="flex-1">{t.message}</span>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="opacity-60 hover:opacity-100 shrink-0"
                  aria-label="ปิด"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

/** Hook — throws if used outside ToastProvider. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
