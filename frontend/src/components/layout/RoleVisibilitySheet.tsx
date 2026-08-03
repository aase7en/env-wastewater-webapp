/**
 * DOCK (2026-08-03) — admin visibility sheet (roles × modules toggles).
 *
 * Opens from the dock edit toolbar's "สิทธิ์การมองเห็น" button (admin only).
 * Renders the full NAV list with a per-role (staff/admin) toggle each, plus
 * a read-only "pending" indicator. Writes go through useAllVisibility →
 * setModuleVisibility (RLS admin-only at the DB layer).
 *
 * Presentation only — NOT a security boundary. Route guards + RLS remain
 * authoritative regardless of these toggles. See DOCK WO "Do not".
 *
 * Track Z scope: the logic + structural markup reuse Aura classes already
 * defined by Track F (aura-card, text-aura-* tokens). No new tokens/styles.
 */
import { useAllVisibility, type AppRole } from "../../lib/role-module-visibility";
import type { DockItem } from "./ModuleDock";
import { MSymbol } from "../ui/MSymbol";

const ROLES: { key: AppRole; label: string }[] = [
  { key: "staff", label: "เจ้าหน้าที่" },
  { key: "admin", label: "ผู้ดูแล" },
  { key: "pending", label: "รออนุมัติ" },
];

/**
 * Resolve the visible state for a (role, module) cell from the matrix.
 * Absent row = visible (default true, per WO). pending is read-only here:
 * a pending user can't reach the dock until promoted, so toggling pending
 * has no effect today — shown as a static indicator to avoid implying it
 * is a live control.
 */
function isVisible(
  rows: Array<{ role: AppRole; module_key: string; visible: boolean }>,
  role: AppRole,
  moduleKey: string,
): boolean {
  const r = rows.find((x) => x.role === role && x.module_key === moduleKey);
  return r ? r.visible : true;
}

export function RoleVisibilitySheet({
  nav,
  onClose,
}: {
  nav: DockItem[];
  onClose: () => void;
}) {
  const { rows, loading, error, setVisibility } = useAllVisibility();

  return (
    <div className="aura-card p-5 rounded-3xl w-[min(92vw,640px)] max-h-[80vh] flex flex-col">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h2 className="text-base font-semibold font-thai text-aura-textMain">
            สิทธิ์การมองเห็นโมดูล
          </h2>
          <p className="text-xs text-aura-textMuted font-thai mt-0.5">
            ควบคุมว่าแต่ละ role เห็นไอคอนไหนใน Dock (ไม่ใช่ระบบสิทธิ์ —
            ผู้ที่รู้ URL ยังเข้าได้ตาม route guard)
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิด"
          className="text-aura-textMuted hover:text-aura-textMain shrink-0"
        >
          <MSymbol name="close" className="text-[18px]" />
        </button>
      </div>

      {/* DOCK-18: covers writes too, not just the initial load. A failed
          toggle used to revert with no explanation at all. */}
      {error && (
        <p className="text-xs text-alert-red font-thai mb-2 shrink-0">
          บันทึกไม่สำเร็จ: {error}
        </p>
      )}

      {/* Header row: module label | staff | admin | pending */}
      <div
        className="grid items-center gap-2 pb-2 mb-1 border-b border-aura-borderSubtle shrink-0 text-xs font-thai text-aura-textMuted"
        style={{ gridTemplateColumns: `1fr repeat(${ROLES.length}, 64px)` }}
      >
        <span>โมดูล</span>
        {ROLES.map((r) => (
          <span key={r.key} className="text-center">
            {r.label}
          </span>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-aura-textMuted font-thai py-4 text-center">
          กำลังโหลด…
        </p>
      ) : (
        <div className="overflow-y-auto -mx-1 px-1">
          {nav.map((item) => {
            const locked = item.to === "/" || item.to === "/dashboard";
            return (
              <div
                key={item.to}
                className="grid items-center gap-2 py-2 border-b border-aura-borderSubtle/50 last:border-0"
                style={{ gridTemplateColumns: `1fr repeat(${ROLES.length}, 64px)` }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MSymbol name={item.icon} className="text-[16px] text-aura-textMuted shrink-0" />
                  <span className="text-sm font-thai text-aura-textMain truncate">
                    {item.label}
                  </span>
                  {locked && (
                    <span className="text-[10px] text-aura-textMuted font-thai shrink-0">
                      (ล็อก)
                    </span>
                  )}
                </div>
                {ROLES.map((r) => {
                  const checked = isVisible(rows, r.key, item.to);
                  // '/' and '/dashboard' are locked visible (WO "Do not"
                  // strand rule) — render a fixed-on indicator, no toggle.
                  if (locked) {
                    return (
                      <div key={r.key} className="flex justify-center">
                        <span className="text-aura-cyan text-sm">✓</span>
                      </div>
                    );
                  }
                  // pending is read-only here (see isVisible doc).
                  if (r.key === "pending") {
                    return (
                      <div key={r.key} className="flex justify-center">
                        <span className="text-aura-textMuted text-xs">—</span>
                      </div>
                    );
                  }
                  return (
                    <div key={r.key} className="flex justify-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={checked}
                        aria-label={`${item.label} ${r.label}`}
                        onClick={() => setVisibility(r.key, item.to, !checked)}
                        className={
                          "w-9 h-5 rounded-full border transition-colors " +
                          (checked
                            ? "bg-aura-cyan/30 border-aura-cyan/60"
                            : "bg-aura-bgDeep border-aura-borderSubtle")
                        }
                      >
                        <span
                          className={
                            "block w-4 h-4 rounded-full transition-transform " +
                            (checked
                              ? "translate-x-4 bg-aura-cyan"
                              : "translate-x-0.5 bg-aura-textMuted")
                          }
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-aura-textMuted font-thai mt-3 shrink-0">
        การเปลี่ยนแปลงมีผลกับผู้ใช้อื่นเมื่อรีเฟรชหน้า โมดูลใหม่ที่ยังไม่มีในตาราง
        = มองเห็นได้ทุก role โดยค่าเริ่มต้น
      </p>
    </div>
  );
}
