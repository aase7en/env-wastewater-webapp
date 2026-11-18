/**
 * ENV-PARITY-P3-004 — the staff-gated job log page (lane P3.4): the
 * grounds-work history + the QR-scan entry flow. Route /safety/job-log
 * (RequireAuth staff — the /safety + P2.2/P2.3 scan-flow precedent; the
 * §3.24 practician Valid If = the P1.4 ผู้บันทึก gate verbatim, which is
 * a STAFF flow, not admin).
 *
 * Seed reality: the guarded 1102-row history ships with the migration;
 * an empty state stays honest ("ยังไม่มีรายการงาน"). The 9 §3.24 virtual
 * columns render display-time only (พ.ศ. dates, the practitioner name
 * join, no stored Distance) — L.Image (the AppSheet gettablefileurl
 * builder) is NOT replicated (legacy refs carried verbatim).
 */
import { JobListSection } from "../components/job/JobListSection";
import { JobFormSection } from "../components/job/JobFormSection";

export function JobLogPage() {
  return (
    <div data-testid="job-log-page" className="max-w-5xl mx-auto space-y-4 pb-24">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">
          <span className="text-aura-textMain">บันทึกการทำงาน (งานสวน)</span>
          <span className="aura-text-gradient"> (job)</span>
        </h1>
        <p className="text-sm text-aura-textMuted font-thai mt-1">
          สแกน QR จุดงาน ตรวจรัศมี 0.7 กม. จากโรงพยาบาล เลือกงานที่ทำ แนบภาพ และบันทึก —
          ตามระบบเดิม; รายการเก่าก่อนย้ายระบบถูกเก็บไว้ตามความจริง (วันที่ พ.ศ.)
        </p>
      </header>
      <JobListSection />
      <JobFormSection />
    </div>
  );
}
