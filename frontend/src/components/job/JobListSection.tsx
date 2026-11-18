/**
 * ENV-PARITY-P3-004 — the job log history list (lane P3.4). Honest
 * rendering of the guarded 1102-row history: พ.ศ. dates (CE + 543, the
 * M.THAI/Y.THAI/D.THAI virtual columns are already the house rendering),
 * the verbatim joined working text, the practitioner display-time join
 * (unknown ⇒ ยังไม่ทราบ — never a fabricated name), and the honest empty
 * state — no rows ⇒ "ยังไม่มีรายการงาน", never a fabricated entry.
 *
 * Track Z minimal markup; Track F owns polish.
 */
import { useQuery } from "@tanstack/react-query";
import { AuraCard } from "../ui/AuraCard";
import { MSymbol } from "../ui/MSymbol";
import { supabase } from "../../lib/supabase";
import { thaiDate } from "../../lib/utils";
import { EMPTY_JOBS_LABEL, useJobLogs, useJobAreas, type JobRow } from "../../lib/job";

function scannedAtLabel(row: JobRow): string {
  if (!row.scanned_at) return "ยังไม่ทราบ";
  const d = new Date(row.scanned_at);
  if (Number.isNaN(d.getTime())) return "ยังไม่ทราบ";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${thaiDate(d)} ${hh}:${mm} น.`;
}

/** Display-time practitioner name join (the N.NAME virtual column is a
 * display concern — never stored). Unknown/absent ⇒ ยังไม่ทราบ (never a
 * fabricated name). */
function usePractitionerName(practitionerId: string) {
  const q = useQuery({
    queryKey: ["personnel-name", practitionerId] as const,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        .from("personnel")
        .select("full_name")
        .eq("id", practitionerId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as { full_name: string } | null)?.full_name ?? null;
    },
    staleTime: 60_000,
  });
  return { name: q.data ?? null, loading: q.isLoading };
}

function JobPractitionerName({ practitionerId }: { practitionerId: string }) {
  const q = usePractitionerName(practitionerId);
  if (q.loading) return <span className="text-aura-textMuted/70">…</span>;
  return <span>{q.name ?? "ยังไม่ทราบ"}</span>;
}

export function JobListSection() {
  const { data: jobs, loading, error } = useJobLogs();
  const { data: areas } = useJobAreas();
  const areaById = new Map(areas.map((a) => [a.id, a]));

  return (
    <div data-testid="job-list">
      <AuraCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-aura-borderSubtle/60 flex items-center gap-2">
          <MSymbol name="history" className="text-[20px] text-aura-cyan" />
          <h2 className="font-bold font-thai text-aura-textMain">ประวัติการทำงาน (งานสวน)</h2>
        </div>
        {loading ? (
          <p className="p-4 text-sm text-aura-textMuted font-thai" data-testid="job-list-loading">
            กำลังโหลดรายการ…
          </p>
        ) : error ? (
          <p className="p-4 text-sm text-alert-red font-thai" role="alert">
            {error}
          </p>
        ) : jobs.length === 0 ? (
          <p className="p-4 text-sm text-aura-textMuted font-thai" data-testid="job-list-empty">
            {EMPTY_JOBS_LABEL}
          </p>
        ) : (
          <ul className="divide-y divide-aura-borderSubtle/50">
            {jobs.map((row) => {
              const area = row.location_area_id ? areaById.get(row.location_area_id) : null;
              const name =
                row.location_name ?? (area ? area.area_name : null) ?? row.qr_legacy_id ?? "ยังไม่ทราบ";
              return (
                <li
                  key={row.id}
                  data-testid={`job-row-${row.legacy_id ?? row.id}`}
                  className="px-4 py-3 flex flex-col gap-1"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <span className="text-sm font-medium text-aura-textMain font-thai">{name}</span>
                    <span className="text-xs text-aura-textMuted font-thai">{scannedAtLabel(row)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-aura-textMuted font-thai">
                    <span>
                      งาน: {row.working ?? <span className="text-aura-textMuted/70">ยังไม่ทราบ</span>}
                    </span>
                    <span>
                      ผู้ปฏิบัติงาน:{" "}
                      {row.practitioner_id ? (
                        <JobPractitionerName practitionerId={row.practitioner_id} />
                      ) : (
                        <span className="text-aura-textMuted/70">ยังไม่ทราบ</span>
                      )}
                    </span>
                    {row.image_ref ? <span>มีภาพ</span> : null}
                    {row.issue ? <span className="line-clamp-1">หมายเหตุ: {row.issue}</span> : null}
                    {row.qr_legacy_id === "สแกน QR CODE" || row.qr_legacy_id === null ? (
                      <span className="text-alert-red/80" data-testid="job-honest-invalid">
                        (ข้อมูลเดิม: ไม่มีรหัส QR ที่ใช้ได้ — เก็บตามความจริง)
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AuraCard>
    </div>
  );
}
