import { Component, type ErrorInfo, type ReactNode } from "react";
import { AuraCard } from "../ui/AuraCard";
import { Button } from "../ui/Button";

interface TwinRendererFallbackProps {
  onShowProcess: () => void;
}

export function TwinRendererFallback({ onShowProcess }: TwinRendererFallbackProps) {
  return (
    <AuraCard>
      <div className="py-12 text-center font-thai">
        <div role="status" aria-live="polite">
          <h2 className="font-display text-lg font-semibold text-aura-textMain">
            ไม่สามารถเปิดมุมมอง 3D ได้
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-aura-textMuted">
            อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับการแสดงผล 3D ในขณะนี้
            คุณยังเปิดแผนผังกระบวนการเดิมได้ตามปกติ
          </p>
        </div>
        <Button
          className="mt-4 min-h-[var(--touch-min)]"
          variant="secondary"
          onClick={onShowProcess}
        >
          เปิดแผนผังกระบวนการ
        </Button>
      </div>
    </AuraCard>
  );
}

interface TwinRendererBoundaryProps extends TwinRendererFallbackProps {
  children: ReactNode;
  onUnavailable?: () => void;
}

interface TwinRendererBoundaryState {
  failed: boolean;
}

/** Catches lazy-module and render-time failures so a broken renderer cannot
 * take down the Dashboard or its Process view. */
export class TwinRendererBoundary extends Component<
  TwinRendererBoundaryProps,
  TwinRendererBoundaryState
> {
  state: TwinRendererBoundaryState = { failed: false };

  static getDerivedStateFromError(): TwinRendererBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Digital Twin renderer failed", error, info.componentStack);
    this.props.onUnavailable?.();
  }

  render() {
    if (this.state.failed) {
      return <TwinRendererFallback onShowProcess={this.props.onShowProcess} />;
    }
    return this.props.children;
  }
}
