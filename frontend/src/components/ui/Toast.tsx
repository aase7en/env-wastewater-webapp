import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "../../lib/utils";

type ToastKind = "success" | "error" | "warning" | "info";

/** ENV-UNDO-001: optional action affordance carried by a toast. */
export interface ToastAction {
  label: string;
  onAction: () => void;
}

/**
 * ENV-UNDO-001: per-toast options — purely additive. Omitting them keeps
 * the legacy contract byte-compatible (same API, same 4s/6s auto-dismiss).
 */
export interface ToastOptions {
  action?: ToastAction;
  /** Override the house auto-dismiss duration for this toast. */
  durationMs?: number;
  /** Show a visible seconds countdown next to the action. */
  countdown?: boolean;
}

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  action?: ToastAction;
  durationMs: number;
  countdown?: boolean;
}

export interface ToastContextValue {
  toast: (kind: ToastKind, message: string, options?: ToastOptions) => void;
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

/**
 * Legacy auto-dismiss contract: 4s for success, 6s for every other kind.
 * An explicit options.durationMs wins. Exported so the timing contract is
 * unit-testable under the house node-environment vitest config.
 */
export function resolveToastDurationMs(kind: ToastKind, options?: ToastOptions): number {
  return options?.durationMs ?? (kind === "success" ? 4000 : 6000);
}

/**
 * Action-click contract: run the callback, then dismiss the toast that
 * carried it. Exported + pure so the sequencing is unit-testable; the
 * in-browser click-through is covered by env-undo-001.spec.ts.
 */
export function runToastAction(action: ToastAction | undefined, dismiss: () => void): void {
  action?.onAction();
  dismiss();
}

/**
 * Presentational toast card (no portal, no document access — SSR-safe so
 * the markup contract is testable via renderToStaticMarkup). The provider
 * renders one card per toast entry; stacking is 1:1 and stateless across
 * instances, so rapid toasts queue without cross-talk.
 */
export function ToastCard({
  kind,
  message,
  action,
  durationMs,
  countdown,
  onDismiss,
}: {
  kind: ToastKind;
  message: string;
  action?: ToastAction;
  durationMs: number;
  countdown?: boolean;
  onDismiss?: () => void;
}) {
  const dismiss = onDismiss ?? (() => {});
  const [remaining, setRemaining] = useState(Math.ceil(durationMs / 1000));

  useEffect(() => {
    if (!countdown) return;
    const iv = setInterval(() => setRemaining((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(iv);
  }, [countdown]);

  const Icon = ICONS[kind];
  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-thai shadow-lg backdrop-blur-md toast-in",
        COLORS[kind]
      )}
      role="status"
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <span className="flex-1">{message}</span>
      {action && (
        <button
          type="button"
          onClick={() => runToastAction(action, dismiss)}
          className={cn(
            "shrink-0 self-center rounded-lg border border-current px-2 font-semibold font-thai",
            "min-h-[var(--touch-min)] min-w-[var(--touch-min)]",
            "hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
          )}
        >
          {action.label}
        </button>
      )}
      {action && countdown && (
        <span
          aria-hidden="true"
          className="shrink-0 self-center text-xs opacity-70 tabular-nums w-10 text-right"
        >
          {remaining} วิ
        </span>
      )}
      <button
        type="button"
        onClick={dismiss}
        className="opacity-60 hover:opacity-100 shrink-0"
        aria-label="ปิด"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/** Toast provider — wraps the app. Renders a fixed bottom-right stack via portal. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (kind: ToastKind, message: string, options?: ToastOptions) => {
      const id = Date.now() + Math.random();
      setToasts((ts) => [
        ...ts,
        {
          id,
          kind,
          message,
          action: options?.action,
          durationMs: resolveToastDurationMs(kind, options),
          countdown: options?.countdown,
        },
      ]);
      // Auto-dismiss after 4s (success) / 6s (others) unless overridden.
      setTimeout(() => dismiss(id), resolveToastDurationMs(kind, options));
    },
    [dismiss]
  );

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
          {toasts.map((t) => (
            <ToastCard
              key={t.id}
              kind={t.kind}
              message={t.message}
              action={t.action}
              durationMs={t.durationMs}
              countdown={t.countdown}
              onDismiss={() => dismiss(t.id)}
            />
          ))}
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
