/**
 * EQ-1 (2026-08-11) — global ErrorBoundary.
 *
 * Before this: any uncaught exception in render would crash the entire
 * SPA (white screen). React 19 still requires a class component for the
 * `getDerivedStateFromError` + `componentDidCatch` lifecycle (no hook
 * equivalent yet). This boundary wraps the whole app via App.tsx so a
 * render-time crash anywhere shows a recovery screen instead.
 *
 * Recovery path: the inner <ResetOnRouteChange> watches `useLocation()`
 * and resets the error state when the user navigates away — that lets
 * them escape a broken route by clicking another dock link. Without it,
 * a re-render of the boundary would rethrow and the recovery screen
 * would itself crash.
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
}
interface State {
  error: Error | null;
}

class ErrorBoundaryInner extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
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
 * Wraps the inner class boundary with a route-change watcher so the
 * recovery screen resets itself when the user navigates away from the
 * broken route. (Class component can't use hooks directly.)
 */
export function ErrorBoundary({ children }: Props): ReactNode {
  return (
    <ErrorRouteWatcher>
      <ErrorBoundaryInner>{children}</ErrorBoundaryInner>
    </ErrorRouteWatcher>
  );
}

function ErrorRouteWatcher({ children }: Props): ReactNode {
  const location = useLocation();
  // Re-mount the inner boundary on every route change so its error state
  // is discarded. The key trick: a new key = React treats it as a fresh
  // subtree, dropping the prior error state.
  return <div key={location.pathname}>{children}</div>;
}
