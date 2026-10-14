import { useEffect, useRef, useState } from "react";
import { AuraCard } from "../ui/AuraCard";
import { MSymbol } from "../ui/MSymbol";
import { PROCESS_EXPLANATION } from "../../lib/environmental-flow";
import type { EnvironmentalFlowModel, EnvironmentalFlowQuantity } from "../../lib/environmental-flow";

function quantityValue(quantity: EnvironmentalFlowQuantity) {
  return quantity.value === null ? "—" : String(quantity.value);
}

function QuantityEvidenceCard({
  title,
  description,
  quantity,
}: {
  title: string;
  description: string;
  quantity: EnvironmentalFlowQuantity;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-aura-borderSubtle bg-aura-surfaceHigh/55 p-4">
      <p className="text-xs font-medium text-aura-textMuted font-thai">{description}</p>
      <div className="mt-2 flex min-w-0 items-baseline gap-2">
        <span className="font-display text-2xl font-bold text-aura-textMain">{quantityValue(quantity)}</span>
        <span className="text-sm text-aura-textMuted">m³/วัน</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-aura-textMain font-thai">{title}</p>
      <p className="mt-1 break-all text-[11px] text-aura-textMuted">field: {quantity.field}</p>
    </div>
  );
}

function ProcessStage({ label, code, index, active }: { label: string; code: string; index: number; active: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      {index > 0 ? <MSymbol name="arrow_forward" className="text-[20px] text-aura-textMuted" aria-hidden="true" /> : null}
      <div
        className="env-flow-story-step w-36 rounded-2xl border border-aura-borderSubtle bg-aura-surfaceHigh/60 px-3 py-3 text-center"
        data-testid="process-explanation-step"
        data-step-index={index}
        data-active={active ? "true" : "false"}
        aria-current={active ? "step" : undefined}
      >
        <p className="text-sm font-semibold text-aura-textMain font-thai">{label}</p>
        <p className="mt-1 text-[10px] text-aura-textMuted">{code}</p>
      </div>
    </div>
  );
}

function BranchCard({
  title,
  route,
  detail,
  stepIndex,
  active,
  exception,
  exceptionNote,
}: {
  title: string;
  route: string;
  detail: string;
  stepIndex?: number;
  active: boolean;
  exception: boolean;
  exceptionNote?: string;
}) {
  return (
    <div
      className={`${exception ? "env-flow-story-exception" : "env-flow-story-step"} min-w-0 rounded-2xl border border-aura-borderSubtle bg-aura-surfaceHigh/45 p-4`}
      data-testid={stepIndex === undefined ? undefined : "process-explanation-step"}
      data-step-index={stepIndex}
      data-active={stepIndex === undefined ? undefined : active ? "true" : "false"}
      data-exception={exception ? "true" : undefined}
      aria-current={active ? "step" : undefined}
    >
      <div className="flex items-start gap-2">
        <span className="env-flow-story-branch-marker mt-0.5" aria-hidden="true">↳</span>
        <div className="min-w-0">
          <p className="font-semibold text-aura-textMain">{title}</p>
          <p className="mt-1 text-sm text-aura-textMuted font-thai">{route}</p>
          <p className="mt-2 text-xs text-aura-textMuted font-thai">{detail}</p>
        </div>
      </div>
      {exceptionNote ? <p className="env-flow-story-exception-note text-xs font-thai">{exceptionNote}</p> : null}
    </div>
  );
}

export function EnvironmentalFlowStory({ model }: { model: EnvironmentalFlowModel }) {
  const [activeStep, setActiveStep] = useState(0);
  const stageViewportRef = useRef<HTMLDivElement>(null);
  const branchCards = [
    {
      edgeId: "ras-return",
      title: "RAS — Return Activated Sludge",
      route: "บ่อตกตะกอน → บ่อเติมอากาศ",
      detail: "มีเส้นทางตามระบบจริง แต่ไม่มีข้อมูลปริมาณ RAS และไม่ทราบสถานะการไหลปัจจุบัน",
    },
    {
      edgeId: "was-to-drying-beds",
      title: "WAS — Waste / Excess Activated Sludge",
      route: "บ่อตกตะกอน → ลานตากตะกอน",
      detail: model.quantities.excessSludge.value === null ? "ไม่มีข้อมูลปริมาณ" : `มีหลักฐานตะกอนส่วนเกิน ${model.quantities.excessSludge.value} m³/วัน เฉพาะรายการบันทึกล่าสุด`,
    },
    {
      edgeId: "filtrate-return",
      title: "Filtrate return / น้ำกรองกลับ",
      route: "ลานตากตะกอน → ฝั่งต้นทาง / บ่อพัก",
      detail: "เป็น recycle/return edge; ไม่มีข้อมูลปริมาณ filtrate",
    },
    {
      edgeId: "pump-sump-bypass",
      title: "Bypass",
      route: "ฝั่งบ่อพัก → ฝั่ง final-treatment",
      detail: "เส้นทาง exception มีอยู่จริง แต่ activity ไม่ทราบและไม่มีข้อมูลปริมาณ",
    },
    {
      edgeId: "emergency-overflow",
      title: "Emergency / ทางฉุกเฉิน",
      route: "ฝั่งบ่อพัก → ฝั่งบ่อวัดอัตราการไหล",
      detail: "เส้นทาง exception; ไม่ถือว่ากำลังใช้งาน และไม่มีข้อมูลปริมาณ",
    },
    {
      edgeId: "chlorine-dosing",
      title: "Chlorine dosing",
      route: "ถังสารละลายคลอรีน → ขั้น final-treatment/contact",
      detail: model.edges.some(
        (edge) => edge.id === "chlorine-dosing" && edge.medium === "chemical" && edge.quantity === null,
      )
        ? "ยืนยันการเชื่อมต่อจาก structural model; ไม่มีข้อมูลปริมาณ/อัตราจ่าย และไม่อนุมานสถานะปั๊ม"
        : "โครงสร้าง chlorine dosing ไม่พร้อม — ไม่อนุมานสถานะหรือปริมาณ",
    },
  ];
  const teachingBranches = branchCards.filter(({ edgeId }) =>
    PROCESS_EXPLANATION.edges.some(
      (edge) => edge.id === edgeId && edge.tieIn === "confirmed" && edge.activity === "structural" && edge.kind !== "exception",
    ),
  );
  const stepLabels = [
    ...PROCESS_EXPLANATION.stages.map((stage) => stage.label),
    ...teachingBranches.map((branch) => branch.title),
  ];

  useEffect(() => {
    if (activeStep >= PROCESS_EXPLANATION.stages.length) return;
    const viewport = stageViewportRef.current;
    const stage = viewport?.querySelector<HTMLElement>(`[data-step-index="${activeStep}"]`);
    if (!viewport || !stage) return;
    const viewportBounds = viewport.getBoundingClientRect();
    const stageBounds = stage.getBoundingClientRect();
    viewport.scrollLeft += stageBounds.left - viewportBounds.left - (viewportBounds.width - stageBounds.width) / 2;
  }, [activeStep]);

  const dischargeText =
    model.discharge.recorded === true
      ? "มีบันทึกการระบาย: ใช่"
      : model.discharge.recorded === false
        ? "บันทึกว่าไม่ระบาย"
        : "ยังไม่ได้บันทึก / ไม่ทราบสถานะการระบาย";

  return (
    <div className="min-w-0 space-y-5">
      <section data-testid="flow-quantity-evidence" aria-labelledby="flow-quantity-title" className="space-y-3">
        <div>
          <h2 id="flow-quantity-title" className="font-display text-lg font-semibold text-aura-textMain font-thai">
            หลักฐานปริมาณที่มีจริง
          </h2>
          <p className="mt-1 text-xs text-aura-textMuted font-thai">
            ปริมาณแต่ละรายการมีความหมายต่างกัน แม้ใช้หน่วย m³ เหมือนกัน จึงไม่สร้างสมดุลน้ำจากตัวเลขเหล่านี้
          </p>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3">
          <QuantityEvidenceCard
            title="น้ำใช้รวมของโรงพยาบาล"
            description="หลักฐานรายวัน · medium: water"
            quantity={model.quantities.waterUse}
          />
          <QuantityEvidenceCard
            title="น้ำเสียเข้าระบบบำบัด"
            description="หลักฐานรายวัน · medium: water"
            quantity={model.quantities.influent}
          />
          <QuantityEvidenceCard
            title="ตะกอนส่วนเกินที่นำออก"
            description="หลักฐานรายวัน · medium: sludge"
            quantity={model.quantities.excessSludge}
          />
        </div>
      </section>

      <div data-testid="flow-discharge-evidence">
        <AuraCard className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
          <MSymbol name="water_drop" className="mt-0.5 text-[22px] text-aura-cyan" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-aura-textMain font-thai">หลักฐานการระบาย</h2>
            <p className="mt-1 text-sm text-aura-textMain font-thai">{dischargeText}</p>
            <p className="mt-1 text-sm text-aura-textMuted font-thai">ปริมาณระบาย: ไม่มีข้อมูล</p>
            <p className="mt-2 text-xs text-aura-textMuted font-thai">
              ค่า wastewater_discharged เป็นสถานะบันทึกแบบใช่/ไม่ใช่ ไม่ใช่ปริมาตร และไม่ใช้ wastewater_in แทนปริมาณระบาย
            </p>
          </div>
        </div>
        </AuraCard>
      </div>

      <section data-testid="flow-structural-story" aria-labelledby="flow-structure-title" className="min-w-0 space-y-3">
        <div>
          <h2 id="flow-structure-title" className="font-display text-lg font-semibold text-aura-textMain font-thai">
            โครงสร้าง Activated Sludge ที่ยืนยันแล้ว
          </h2>
          <p className="mt-1 text-xs text-aura-textMuted font-thai">
            เส้นทางนี้ยืนยันการเชื่อมต่อของกระบวนการ ไม่ได้ยืนยันว่ากำลังไหลหรืออุปกรณ์กำลังทำงานในขณะนี้
          </p>
        </div>

        <div
          className="env-flow-story-controls font-thai"
          data-testid="process-explanation-controls"
          role="group"
          tabIndex={0}
          aria-label="ควบคุมการอธิบายกระบวนการทีละขั้น"
          aria-keyshortcuts="ArrowLeft ArrowRight"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              setActiveStep((current) =>
                event.key === "ArrowRight"
                  ? Math.min(current + 1, stepLabels.length - 1)
                  : Math.max(current - 1, 0),
              );
            }
          }}
        >
          <p className="env-flow-story-notice" data-testid="process-explanation-notice">
            ภาพอธิบายกระบวนการ ไม่ใช่สถานะปัจจุบัน
          </p>
          <div className="env-flow-story-control-row">
            <button
              type="button"
              className="env-flow-story-button"
              aria-label="ขั้นก่อนหน้า"
              disabled={activeStep === 0}
              onClick={() => setActiveStep((current) => Math.max(current - 1, 0))}
            >
              <MSymbol name="arrow_forward" className="env-flow-story-back-icon text-[18px]" aria-hidden="true" />
              ขั้นก่อนหน้า
            </button>
            <div className="env-flow-story-progress" aria-live="polite" aria-atomic="true">
              <p className="env-flow-story-counter">ขั้นที่ {activeStep + 1} / {stepLabels.length}</p>
              <p className="env-flow-story-current-label">{stepLabels[activeStep]}</p>
            </div>
            <button
              type="button"
              className="env-flow-story-button"
              aria-label="ขั้นถัดไป"
              disabled={activeStep === stepLabels.length - 1}
              onClick={() => setActiveStep((current) => Math.min(current + 1, stepLabels.length - 1))}
            >
              ขั้นถัดไป
              <MSymbol name="arrow_forward" className="text-[18px]" aria-hidden="true" />
            </button>
          </div>
          <p className="env-flow-story-hint">ใช้ปุ่มหรือลูกศรซ้าย–ขวาเมื่อแถบควบคุมมีโฟกัส</p>
        </div>

        <AuraCard className="min-w-0 overflow-hidden p-0">
          <div
            className="max-w-full overflow-x-auto p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-cyan/70"
            ref={stageViewportRef}
            tabIndex={0}
            role="region"
            aria-label="เส้นทางหลักของกระบวนการบำบัดน้ำเสีย เลื่อนแนวนอนได้"
          >
            <div className="flex w-max min-w-full items-center gap-2">
              {PROCESS_EXPLANATION.stages.map((stage, index) => (
                <ProcessStage key={stage.id} label={stage.label} code={stage.id} index={index} active={activeStep === index} />
              ))}
            </div>
          </div>
          <div className="border-t border-aura-borderSubtle px-4 py-3 text-xs text-aura-textMuted font-thai">
            ปริมาณน้ำเสีย {model.quantities.influent.value === null ? "ไม่มีข้อมูล" : `${model.quantities.influent.value} m³/วัน`} ผูกเฉพาะจุดเข้า influent-entry; ขั้นตอนถัดไปไม่มีข้อมูลปริมาณ จึงไม่ใช้ความหนาเส้นแทนค่า
          </div>
        </AuraCard>

        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {branchCards.map((branch) => {
            const edge = PROCESS_EXPLANATION.edges.find((candidate) => candidate.id === branch.edgeId);
            const teachingIndex = teachingBranches.findIndex((candidate) => candidate.edgeId === branch.edgeId);
            const stepIndex = teachingIndex === -1 ? undefined : PROCESS_EXPLANATION.stages.length + teachingIndex;
            return (
              <BranchCard
                key={branch.edgeId}
                title={branch.title}
                route={branch.route}
                detail={branch.detail}
                stepIndex={stepIndex}
                active={stepIndex === activeStep}
                exception={edge?.kind === "exception"}
                exceptionNote={edge?.kind === "exception" ? edge.note : undefined}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
