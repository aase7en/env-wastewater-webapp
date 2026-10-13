import type { RefObject } from "react";
import { thaiDate } from "../../../lib/utils";
import type {
  TwinMetricAcquisition,
  TwinMetricFreshness,
  TwinMetricSource,
  WastewaterTwinState,
} from "../../../lib/twin/types";
import { Button } from "../../ui/Button";
import {
  SEMANTIC_BADGE_LABELS_TH,
  type CalloutModel,
} from "./callout-model";

const SOURCE_LABELS_TH: Readonly<Record<TwinMetricSource, string>> = {
  "manual-snapshot": "บันทึกประจำวัน",
  "sensor-telemetry": "ข้อมูลจากเซนเซอร์",
  simulation: "ข้อมูลจำลอง",
  unavailable: "ไม่มีแหล่งข้อมูลสำหรับค่านี้",
};

const FRESHNESS_LABELS_TH: Readonly<Record<TwinMetricFreshness, string>> = {
  fresh: "ระบุว่าสดจากแหล่งข้อมูล",
  stale: "ระบุว่าข้อมูลเก่า",
  unknown: "ยังไม่ประเมินความสด",
};

const ACQUISITION_LABELS_TH: Readonly<Record<TwinMetricAcquisition, string>> = {
  "manual-daily-snapshot": "บันทึกประจำวันโดยเจ้าหน้าที่",
  sensor: "เซนเซอร์",
  simulation: "การจำลอง",
  unknown: "ไม่ทราบวิธีได้มา",
};

function observedAtLabel(observedAt: string | null): string {
  if (!observedAt) return "ไม่ระบุเวลาสังเกตของค่านี้";
  const date = new Date(observedAt);
  if (Number.isNaN(date.getTime())) return "ไม่ระบุเวลาสังเกตของค่านี้";
  return `${new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(date)} (เวลาไทย)`;
}

function attentionText(source: TwinMetricSource, freshness: TwinMetricFreshness): string {
  if (freshness === "stale") return "ตรวจสอบเวลาและแหล่งข้อมูลก่อนนำค่านี้ไปใช้ตัดสินใจ";
  if (source === "unavailable") return "ยังไม่มีค่าของสินทรัพย์นี้ให้ใช้ตัดสินใจ ตรวจสอบบันทึกต้นทาง";
  if (source === "simulation") return "ใช้ดูสถานการณ์จำลองเท่านั้น ไม่ใช้แทนค่าที่วัดจริง";
  return "ตรวจสอบแหล่งข้อมูลและวันที่ของค่านี้ก่อนใช้ประกอบการตัดสินใจ";
}

export function EvidencePanel({
  callout,
  state,
  panelRef,
  onClose,
}: {
  callout: CalloutModel;
  state: WastewaterTwinState;
  panelRef: RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  const metric = state.assets[callout.assetId]?.[callout.metricKey];
  if (!metric) return null;

  const badgeLabel = `${callout.semanticBadge} · ${SEMANTIC_BADGE_LABELS_TH[callout.semanticBadge]}`;
  const metricSnapshotDate =
    metric.source === "manual-snapshot" && metric.value !== null
      ? state.snapshotDate
      : null;

  return (
    <section
      id={callout.detailDestination}
      ref={panelRef}
      tabIndex={-1}
      aria-labelledby="p003-evidence-title"
      data-testid="p003-evidence-panel"
      className="mt-4 rounded-2xl border border-aura-cyan/40 bg-aura-surfaceHigh/65 p-4 font-thai shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-aura-cyan"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-aura-cyan">
            หลักฐานเฉพาะสินทรัพย์
          </p>
          <h3 id="p003-evidence-title" className="mt-1 text-base font-semibold text-aura-textMain">
            {callout.assetLabel} · {callout.metricLabel}
          </h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="ปิดรายละเอียดหลักฐาน">
          ปิด
        </Button>
      </div>

      <div className="mt-4 space-y-4 text-sm">
        <div>
          <h4 className="text-xs font-semibold text-aura-textMuted">01 / สถานการณ์</h4>
          <p className="mt-1 text-xl font-semibold text-aura-textMain">{callout.valueLabel}</p>
          <p className="mt-1 font-semibold text-aura-textMain">{badgeLabel}</p>
          {metric.source === "simulation" && (
            <p className="mt-1 text-aura-textMuted">ค่านี้เป็นข้อมูลจำลอง ไม่ใช่ค่าที่วัดจริง</p>
          )}
        </div>

        <div className="border-t border-aura-borderSubtle pt-3">
          <h4 className="text-xs font-semibold text-aura-textMuted">02 / การดำเนินการและข้อควรระวัง</h4>
          <p className="mt-1 text-aura-textMain">{attentionText(metric.source, metric.freshness)}</p>
        </div>

        <div className="border-t border-aura-borderSubtle pt-3">
          <h4 className="text-xs font-semibold text-aura-textMuted">03 / แหล่งข้อมูล · ความสด · ที่มา</h4>
          <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2">
            <dt className="text-aura-textMuted">แหล่งข้อมูล</dt>
            <dd className="text-aura-textMain">{SOURCE_LABELS_TH[metric.source]} ({metric.source})</dd>
            <dt className="text-aura-textMuted">ความสด</dt>
            <dd className="text-aura-textMain">{FRESHNESS_LABELS_TH[metric.freshness]} ({metric.freshness})</dd>
            <dt className="text-aura-textMuted">วิธีได้มา</dt>
            <dd className="text-aura-textMain">{ACQUISITION_LABELS_TH[metric.provenance.acquisition]}</dd>
            <dt className="text-aura-textMuted">เวลาสังเกต</dt>
            <dd className="text-aura-textMain">{observedAtLabel(metric.observedAt)}</dd>
            <dt className="text-aura-textMuted">วันที่บันทึก</dt>
            <dd className="text-aura-textMain">
              {metricSnapshotDate ? thaiDate(metricSnapshotDate) : "ไม่มีวันที่บันทึกของค่านี้"}
            </dd>
          </dl>
        </div>

        <div className="border-t border-aura-borderSubtle pt-3">
          <h4 className="text-xs font-semibold text-aura-textMuted">04 / แนวโน้มและประวัติ</h4>
          <p className="mt-1 text-aura-textMain">
            ยังไม่มีอนุกรมเวลาที่ยืนยันสำหรับ {callout.metricLabel} ของ {callout.assetLabel}
          </p>
          <a
            href="#dashboard-history-14day"
            className="mt-2 inline-flex min-h-[44px] items-center text-aura-cyan underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aura-cyan"
          >
            ดูตารางภาพรวม 14 วัน
          </a>
          <p className="text-xs text-aura-textMuted">
            ตารางนี้เป็นข้อมูลภาพรวม DO เฉลี่ย, pH และ Cl อิสระ ไม่ใช่ประวัติของค่านี้
          </p>
        </div>
      </div>
    </section>
  );
}
