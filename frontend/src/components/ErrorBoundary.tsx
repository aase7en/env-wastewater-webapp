/**
 * EQ-1 (2026-08-11) — global ErrorBoundary.
 *
 * Before this: any uncaught exception in render would crash the entire
 * SPA (white screen). React 19 still requires a class component for the
 * `getDerivedStateFromError` + `componentDidCatch` lifecycle (no hook
 * equivalent yet). This boundary wraps the whole app via App.tsx so a
 * render-time crash anywhere shows a recovery screen instead.
 *
 * Recovery path (WO-STAB-005): the function wrapper reads `useLocation()`
 * and passes the pathname down as a prop; `getDerivedStateFromProps`
 * clears the error state when the route changes WHILE an error is active.
 * The previous implementation remounted the entire subtree via
 * `key={pathname}` on every navigation — unmounting AuthProvider on every
 * dock click (skeleton flicker + repeated app_user lookups) for a reset
 * that is only needed after a crash.
 *
 * Track Z scope (logic + minimal fallback UI — visual polish is a
 * separate Track F pass). The fallback uses inline styles rather than
 * className to stay under the Track F/Z lane split.
 *
 * Companion: main.tsx also installs a `window.unhandledrejection`
 * listener so promise rejections from React Query / supabase-js that
 * escape React's tree still hit the console (and, once analytics policy
 * is decided, can be forwarded).
 */
import { Component, type ErrorInfo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface Props {
  children: ReactNode;
  /** Current route pathname — a change while an error is active clears
   *  the recovery screen (see getDerivedStateFromProps). */
  routeKey?: string;
}
interface State {
  error: Error | null;
  /** Route the current error state (or pristine state) was rendered on. */
  lastRouteKey?: string;
}

class ErrorBoundaryInner extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  /**
   * WO-STAB-005: route-change reset, derived instead of remounting.
   * When the route changes: remember it, and if an error is active,
   * clear it so the new route renders (escape from the recovery screen
   * via browser back / any external navigation). Healthy navigations
   * only update the remembered key — the subtree below stays mounted
   * (AuthProvider survives, no skeleton flicker, no repeated app_user
   * lookups — the bug the old key={pathname} wrapper had).
   */
  static getDerivedStateFromProps(props: Props, state: State): State | null {
    if (props.routeKey === state.lastRouteKey) return null;
    // Route changed: clear any active error (escape hatch) and remember
    // the new route. When no error was active this is a no-op value-wise
    // (error stays null) — the subtree below is untouched either way.
    return { error: null, lastRouteKey: props.routeKey };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Same channel as the existing AuthProvider / ai-chat warnings —
    // browser devtools visible, no SaaS routing yet (analytics policy
    // pending user decision, see reports/infra-audit-2026-08.md #16).
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  reset = (): void => this.setState({ error: null });

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div
          role="alert"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "1.5rem",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            เกิดข้อผิดพลาด
          </h1>
          <p style={{ color: "#666", marginBottom: "1.5rem", maxWidth: "32rem" }}>
            หน้านี้พังขณะแสดงผล — ลองโหลดใหม่ หรือเลือกเมนูอื่น. หากยังเกิดซ้ำ
            แจ้งผู้ดูแลพร้อมข้อความด้านล่าง.
          </p>
          <pre
            style={{
              background: "#f3f4f6",
              padding: "0.75rem",
              borderRadius: "0.375rem",
              fontSize: "0.75rem",
              maxWidth: "32rem",
              overflow: "auto",
              marginBottom: "1.5rem",
              textAlign: "left",
            }}
          >
            {this.state.error.message}
          </pre>
          <button
            type="button"
            onClick={this.reset}
            style={{
              padding: "0.5rem 1rem",
              background: "#0f766e",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
            }}
          >
            ลองใหม่
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Wraps the inner class boundary: reads the router location (class
 * components can't use hooks) and passes the pathname down as `routeKey`
 * so the boundary can clear an active error on route change WITHOUT
 * remounting the subtree on healthy navigations.
 */
export function ErrorBoundary({ children }: Props): ReactNode {
  const location = useLocation();
  return <ErrorBoundaryInner routeKey={location.pathname}>{children}</ErrorBoundaryInner>;
}
