import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { WebGLRenderer } from "three";
import type { DashboardRow } from "../../lib/types";
import { cssVar } from "../../lib/theme";
import { thaiDate } from "../../lib/utils";
import { useAuraTheme } from "../../lib/useAuraTheme";
import { AERATION_DEMO_OVERRIDES } from "../../lib/twin/demo-state";
import { deriveWastewaterTwinState } from "../../lib/twin/selectors";
import { useTwinStore } from "../../lib/twin/store";
import {
  supportsWebGL,
  type TwinRendererStatus,
} from "../../lib/twin/webgl";
import {
  AERATION_TANK_ID,
  type AerationTankTwinAsset,
  type TwinMetricSource,
  type TwinMode,
} from "../../lib/twin/types";
import { AuraCard } from "../ui/AuraCard";
import { Button } from "../ui/Button";
import { WastewaterTwin } from "./WastewaterTwin";
import { TwinRendererFallback } from "./TwinRendererBoundary";

function SceneReadySignal({ onReady }: { onReady: () => void }) {
  const signaled = useRef(false);
  useFrame(() => {
    if (signaled.current) return;
    signaled.current = true;
    onReady();
  });
  return null;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function metricText(value: number | null, digits: number, unit: string): string {
  return value === null ? "—" : `${value.toFixed(digits)} ${unit}`.trim();
}

function threeColorFromRgbToken(name: string): string {
  return `rgb(${cssVar(name).split(/\s+/).join(",")})`;
}

function sourceText(source: TwinMetricSource, mode: TwinMode): string {
  if (source === "simulation") return "ข้อมูลจำลอง";
  if (source === "sensor-telemetry") return "ข้อมูลจากเซนเซอร์";
  if (source === "manual-snapshot") {
    return mode === "historical" ? "บันทึกย้อนหลัง" : "บันทึกล่าสุด";
  }
  return "ไม่มีข้อมูล";
}

export function TwinCanvas({
  row,
  historicalRow,
  latestDate,
  onRendererStatusChange,
  onShowProcess,
}: {
  row: DashboardRow | undefined;
  historicalRow?: DashboardRow;
  latestDate?: string | null;
  onRendererStatusChange?: (status: TwinRendererStatus) => void;
  onShowProcess: () => void;
}) {
  const theme = useAuraTheme();
  const reducedMotion = usePrefersReducedMotion();
  const panelRef = useRef<HTMLElement>(null);
  const assetButtonRef = useRef<HTMLButtonElement>(null);
  const [rendererCanvas, setRendererCanvas] = useState<HTMLCanvasElement | null>(null);
  const [rendererStatus, setRendererStatus] = useState<TwinRendererStatus>(() =>
    supportsWebGL() ? "loading" : "unavailable",
  );
  const mode = useTwinStore((state) => state.mode);
  const selectedAssetId = useTwinStore((state) => state.selectedAssetId);
  const simulationOverrides = useTwinStore((state) => state.simulationOverrides);
  const selectAsset = useTwinStore((state) => state.selectAsset);
  const closeAssetPanel = useTwinStore((state) => state.closeAssetPanel);
  const startSimulation = useTwinStore((state) => state.startSimulation);
  const returnToLatest = useTwinStore((state) => state.returnToLatest);
  const sourceRow = mode === "historical" ? historicalRow : row;
  const twinState = useMemo(
    () => deriveWastewaterTwinState(sourceRow, mode, simulationOverrides),
    [mode, simulationOverrides, sourceRow],
  );
  const tank: AerationTankTwinAsset = twinState.assets[AERATION_TANK_ID];
  const selected = selectedAssetId === AERATION_TANK_ID;
  const selectionColor = threeColorFromRgbToken("--aura-cyan");

  const markRendererReady = useCallback(() => setRendererStatus("ready"), []);
  const markRendererUnavailable = useCallback(() => setRendererStatus("unavailable"), []);

  useEffect(() => {
    onRendererStatusChange?.(rendererStatus);
  }, [onRendererStatusChange, rendererStatus]);

  useEffect(() => {
    if (!rendererCanvas) return;
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      markRendererUnavailable();
    };
    rendererCanvas.addEventListener("webglcontextlost", handleContextLost);
    return () => rendererCanvas.removeEventListener("webglcontextlost", handleContextLost);
  }, [markRendererUnavailable, rendererCanvas]);

  useEffect(() => {
    if (selected) panelRef.current?.focus();
  }, [selected]);

  const closePanelAndRestoreFocus = () => {
    closeAssetPanel();
    requestAnimationFrame(() => assetButtonRef.current?.focus());
  };

  if (rendererStatus === "unavailable") {
    return <TwinRendererFallback onShowProcess={onShowProcess} />;
  }

  return (
    <AuraCard className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display font-semibold text-aura-textMain font-thai">
              Digital Twin — ถังเติมอากาศ
            </h2>
            {mode === "simulation" ? (
              <span className="rounded-full border border-alert-amber/60 bg-alert-amber/10 px-2 py-1 text-[11px] font-bold tracking-wide text-alert-amber font-thai">
                SIMULATION — ข้อมูลจำลอง
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-aura-textMuted font-thai">
            {mode === "simulation"
              ? "สถานการณ์สาธิต ไม่ใช่ข้อมูลจากระบบจริง"
              : twinState.snapshotDate
                ? `${mode === "historical" ? "บันทึกย้อนหลัง" : "บันทึกล่าสุด"} ${thaiDate(twinState.snapshotDate)}`
                : mode === "historical"
                  ? "ยังไม่ได้เลือก snapshot ย้อนหลัง"
                  : latestDate
                    ? `ไม่มี snapshot ในช่วง 14 วัน · บันทึกล่าสุด ${thaiDate(latestDate)}`
                    : "ยังไม่มี snapshot สำหรับแสดงผล"}
          </p>
        </div>
        {mode === "simulation" ? (
          <Button className="min-h-[var(--touch-min)]" variant="secondary" size="sm" onClick={returnToLatest}>
            กลับสู่ข้อมูลล่าสุด
          </Button>
        ) : (
          <Button className="min-h-[var(--touch-min)]" variant="secondary" size="sm" onClick={() => startSimulation(AERATION_DEMO_OVERRIDES)}>
            เปิดข้อมูลจำลอง
          </Button>
        )}
      </div>

      <div
        className="relative h-[340px] sm:h-[420px] overflow-hidden rounded-2xl border border-aura-borderSubtle bg-aura-bg/40"
        data-testid="twin-canvas-shell"
        data-reduced-motion={reducedMotion}
        data-aerator-running={tank.aeratorRunning.value ?? "unknown"}
      >
        <Canvas
          aria-hidden="true"
          fallback={<span>ไม่สามารถแสดงมุมมอง 3D ได้</span>}
          frameloop={reducedMotion ? "demand" : "always"}
          camera={{ position: [6.6, 5.1, 7.2], fov: 38 }}
          dpr={[1, 1.5]}
          gl={async (defaultProps) => {
            try {
              return new WebGLRenderer(defaultProps);
            } catch {
              markRendererUnavailable();
              // R3F awaits this factory outside its React error boundary.
              // The state change unmounts Canvas; keeping the failed init
              // pending avoids an unhandled rejection during that handoff.
              return new Promise<WebGLRenderer>(() => undefined);
            }
          }}
          onCreated={({ gl }) => setRendererCanvas(gl.domElement)}
        >
          <SceneReadySignal onReady={markRendererReady} />
          <color attach="background" args={[theme === "dark" ? "#03181c" : "#eef8f3"]} />
          <ambientLight intensity={theme === "dark" ? 1.25 : 1.8} />
          <directionalLight position={[4, 7, 5]} intensity={2.2} />
          <WastewaterTwin
            asset={tank}
            selected={selected}
            reducedMotion={reducedMotion}
            theme={theme}
            selectionColor={selectionColor}
            onSelectAsset={selectAsset}
          />
          <gridHelper args={[12, 12, theme === "dark" ? "#17434a" : "#9fc8bd", theme === "dark" ? "#0b2a30" : "#d1e5de"]} position={[0, -0.02, 0]} />
          <OrbitControls
            makeDefault
            enablePan={false}
            enableDamping={!reducedMotion}
            minDistance={7}
            maxDistance={12}
            minPolarAngle={0.55}
            maxPolarAngle={1.35}
            target={[0, 0.9, 0]}
          />
        </Canvas>

        <Button
          ref={assetButtonRef}
          variant="secondary"
          size="sm"
          className="absolute left-3 bottom-3 min-h-[var(--touch-min)] bg-aura-bg/80 backdrop-blur"
          aria-pressed={selected}
          data-testid="twin-asset-button"
          onClick={() => selectAsset(AERATION_TANK_ID)}
        >
          {selected ? "ซ่อนข้อมูลถังเติมอากาศ" : "ดูข้อมูลถังเติมอากาศ"}
        </Button>
        {tank.waterLevelPercent.value === null ? (
          <span className="absolute right-3 bottom-3 rounded-lg bg-aura-bg/80 px-2 py-1 text-xs text-aura-textMuted font-thai backdrop-blur">
            ระดับน้ำ: ไม่มีข้อมูล
          </span>
        ) : null}
      </div>

      {selected ? (
        <section
          ref={panelRef}
          tabIndex={-1}
          aria-label="ข้อมูลถังเติมอากาศ"
          data-testid="twin-data-panel"
          className="mt-4 rounded-xl border border-aura-borderSubtle bg-aura-surfaceHigh/40 p-4 outline-none focus-visible:ring-2 focus-visible:ring-aura-cyan"
          onKeyDown={(event) => {
            if (event.key === "Escape") closePanelAndRestoreFocus();
          }}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-display font-semibold text-aura-textMain font-thai">{tank.label}</h3>
            <Button className="min-h-[var(--touch-min)]" variant="ghost" size="sm" onClick={closePanelAndRestoreFocus} aria-label="ปิดข้อมูลถังเติมอากาศ">
              ปิด
            </Button>
          </div>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <TwinMetric label="ระดับน้ำ" value={metricText(tank.waterLevelPercent.value, 0, "%")} source={tank.waterLevelPercent.source} mode={mode} />
            <TwinMetric label="เครื่องเติมอากาศ" value={tank.aeratorRunning.value === null ? "—" : tank.aeratorRunning.value ? "ทำงาน" : "หยุด"} source={tank.aeratorRunning.source} mode={mode} />
            <TwinMetric label="DO" value={metricText(tank.dissolvedOxygenMgL.value, 2, "mg/L")} source={tank.dissolvedOxygenMgL.source} mode={mode} />
            <TwinMetric label="TDS" value={metricText(tank.tdsMgL.value, 0, "mg/L")} source={tank.tdsMgL.source} mode={mode} />
            <TwinMetric label="อุณหภูมิ" value={metricText(tank.temperatureC.value, 1, "°C")} source={tank.temperatureC.source} mode={mode} />
          </dl>
        </section>
      ) : null}
    </AuraCard>
  );
}

function TwinMetric({
  label,
  value,
  source,
  mode,
}: {
  label: string;
  value: string;
  source: TwinMetricSource;
  mode: TwinMode;
}) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wide text-aura-textMuted font-thai">{label}</dt>
      <dd className="mt-1 text-lg font-display font-bold tabular-nums text-aura-textMain">{value}</dd>
      <dd className="mt-0.5 text-[10px] text-aura-textMuted font-thai">{sourceText(source, mode)}</dd>
    </div>
  );
}

export default TwinCanvas;
