import { useRepairRequests } from "../lib/repair";
import { useThresholdAlerts } from "../lib/alerts";

/**
 * ENV-OPS-001A — Operations Attention Board (read-only).
 *
 * Two independent source families share the page but are never normalized
 * into one incident object: unresolved repair requests (open/in_progress)
 * and wastewater threshold events (read_at = presentation acknowledgement
 * only). Data honesty: empty ≠ normal, polling ≠ live, no fabricated
 * severity, partial-source failure stays visible.
 */

const REPAIR_STATUS_LABELS: Record<string, string> = {
  open: "รอดำเนินการ",
  in_progress: "กำลังซ่อม",
};

function thaiDateTime(iso: string) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortId(id: string) {
  return id.slice(0, 8);
}

export function OperationsPage() {
  const repairs = useRepairRequests(50, true);
  const alerts = useThresholdAlerts();

  const unresolved = repairs.data.filter(
    (r) => r.status === "open" || r.status === "in_progress",
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-aura-textMain md:text-3xl">
          งานที่ต้องติดตาม
        </h1>
        <p className="text-sm text-aura-textMuted font-thai">
          สรุปงานซ่อมที่ยังไม่เสร็จ และเหตุการณ์ค่าเกินเกณฑ์จากระบบบำบัดน้ำเสีย
          เพื่อพิจารณาดำเนินการ
        </p>
        <p
          data-freshness="on-load"
          className="text-xs text-aura-textMuted font-thai"
        >
          ข้อมูลจากการโหลดหน้า (ไม่ใช่ข้อมูลเซนเซอร์ทันที)
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Source 1: unresolved repair requests */}
        <section
          data-source="repair_request"
          aria-labelledby="ops-repairs-title"
          className="min-w-0 space-y-3 rounded-xl border border-aura-borderSubtle bg-aura-surfaceLow p-4"
        >
          <div className="space-y-0.5">
            <h2
              id="ops-repairs-title"
              className="font-display text-base font-semibold text-aura-textMain font-thai"
            >
              งานซ่อมที่ยังไม่เสร็จ
            </h2>
            <p className="text-xs text-aura-textMuted font-thai">
              แหล่งข้อมูล: คำขอซ่อม (repair_request) — เฉพาะงานที่ยังไม่เสร็จหรือกำลังดำเนินการอยู่
            </p>
          </div>

          {repairs.loading && (
            <p className="text-sm text-aura-textMuted font-thai" role="status">
              กำลังโหลดรายการซ่อม…
            </p>
          )}

          {!repairs.loading && repairs.error && (
            <p className="text-sm text-alert-red font-thai" role="alert">
              โหลดรายการซ่อมไม่สำเร็จ แหล่งข้อมูลนี้ใช้การไม่ได้ชั่วคราว
              (รายการอื่นยังแสดงตามที่ได้มา)
            </p>
          )}

          {!repairs.loading && !repairs.error && unresolved.length === 0 && (
            <p className="text-sm text-aura-textMuted font-thai">
              ไม่มีรายการซ่อมที่ยังไม่เสร็จจากการสอบถามครั้งนี้
              (ไม่ใช่การยืนยันว่าทุกระบบพร้อมใช้งาน)
            </p>
          )}

          <ul className="space-y-2">
            {unresolved.map((r) => (
              <li key={r.id}>
                <article
                  tabIndex={0}
                  aria-label={`งานซ่อม: ${r.cause}`}
                  className="space-y-1 rounded-lg border border-aura-borderSubtle bg-aura-surfaceHigh/40 p-3"
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-alert-amber/40 bg-alert-amber/10 px-2 py-0.5 text-xs font-medium text-alert-amber font-thai">
                      {REPAIR_STATUS_LABELS[r.status] ?? r.status}
                    </span>
                    <time
                      dateTime={r.created_at}
                      className="text-xs text-aura-textMuted font-thai"
                    >
                      {thaiDateTime(r.created_at)}
                    </time>
                  </div>
                  <p className="break-words text-sm font-medium text-aura-textMain font-thai">
                    {r.cause}
                  </p>
                  <p className="text-xs text-aura-textMuted font-thai">
                    อุปกรณ์:{" "}
                    {r.equipment_id
                      ? `หมายเลข ${shortId(r.equipment_id)}`
                      : "ไม่ระบุอุปกรณ์"}
                    {" · "}
                    จุดวัด:{" "}
                    {r.reading_id
                      ? `จากการอ่านค่า ${shortId(r.reading_id)}`
                      : "ไม่ระบุจุดวัด"}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </section>

        {/* Source 2: threshold events (read state is presentation-only) */}
        <section
          data-source="threshold_alert"
          aria-labelledby="ops-alerts-title"
          className="min-w-0 space-y-3 rounded-xl border border-aura-borderSubtle bg-aura-surfaceLow p-4"
        >
          <div className="space-y-0.5">
            <h2
              id="ops-alerts-title"
              className="font-display text-base font-semibold text-aura-textMain font-thai"
            >
              เหตุการณ์ค่าเกินเกณฑ์
            </h2>
            <p className="text-xs text-aura-textMuted font-thai">
              แหล่งข้อมูล: การแจ้งเตือนค่าเกินเกณฑ์ (threshold_alert) —
              สถานะการอ่านเป็นเพียงการรับทราบในหน้าจอ ไม่ใช่การแก้ไขปัญหา
            </p>
          </div>

          {alerts.loading && (
            <p className="text-sm text-aura-textMuted font-thai" role="status">
              กำลังโหลดเหตุการณ์…
            </p>
          )}

          {!alerts.loading && alerts.error && (
            <p className="text-sm text-alert-red font-thai" role="alert">
              โหลดเหตุการณ์ค่าเกินเกณฑ์ไม่สำเร็จ แหล่งข้อมูลนี้ใช้การไม่ได้ชั่วคราว
            </p>
          )}

          {!alerts.loading && !alerts.error && alerts.alerts.length === 0 && (
            <p className="text-sm text-aura-textMuted font-thai">
              ไม่มีเหตุการณ์ค่าเกินเกณฑ์จากการสอบถามครั้งนี้
              (ไม่ใช่การยืนยันว่าค่าทุกตัวอยู่ในเกณฑ์)
            </p>
          )}

          <ul className="space-y-2">
            {alerts.alerts.map((a) => (
              <li key={a.id}>
                <article
                  tabIndex={0}
                  aria-label={`เหตุการณ์ค่าเกินเกณฑ์: ${a.message}`}
                  className="space-y-1 rounded-lg border border-aura-borderSubtle bg-aura-surfaceHigh/40 p-3"
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-aura-borderSubtle bg-aura-surfaceHigh px-2 py-0.5 text-xs text-aura-textMuted font-thai">
                      {a.read_at ? "อ่านแล้ว" : "ยังไม่อ่าน"}
                    </span>
                    <span className="text-xs text-aura-textMuted">{a.field}</span>
                    <time
                      dateTime={a.created_at}
                      className="text-xs text-aura-textMuted font-thai"
                    >
                      {thaiDateTime(a.created_at)}
                    </time>
                  </div>
                  <p className="break-words text-sm font-medium text-aura-textMain font-thai">
                    {a.message}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
