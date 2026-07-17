import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, ListChecks, Settings } from "lucide-react";
import { cn } from "../../lib/utils";

const NAV = [
  { to: "/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
  { to: "/form", label: "บันทึกประจำวัน", icon: FileText },
  { to: "/readings", label: "ประวัติ", icon: ListChecks },
  { to: "/settings", label: "ตั้งค่า", icon: Settings },
];

/**
 * UTH[AI]-EVN Aura Edition shell — deep-teal sidebar with neon brand lockup.
 * The [AI] segment is highlighted cyan/lime per the Aura spec
 * (design/uth_ai_evn_system_design_aura_edition.md §1).
 *
 * Mobile: top bar with icon-only nav. Desktop: fixed 14rem sidebar.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-56 md:min-h-screen bg-aura-bg/80 backdrop-blur-xl border-b md:border-b-0 md:border-r border-aura-borderSubtle flex md:flex-col flex-row items-center md:items-stretch md:py-6 px-4 py-3 gap-2 md:gap-1 shrink-0 sticky top-0 z-20">
        {/* Brand: UTH[AI]-EVN with neon [AI] */}
        <Link to="/dashboard" className="flex items-center gap-2 md:mb-8 md:px-2 font-display font-bold">
          <span className="text-lg tracking-tight">
            <span className="text-aura-textMain">UTH</span>
            <span className="aura-text-gradient">[AI]</span>
            <span className="text-aura-textMain">-EVN</span>
          </span>
          <span className="hidden md:inline text-[10px] uppercase tracking-widest text-aura-textMuted self-end mb-1">
            OS
          </span>
        </Link>

        <nav className="flex md:flex-col flex-row gap-1 flex-1 md:px-2 overflow-x-auto">
          {NAV.map(({ to, label, icon: Icon }) => {
            // /form/:id should still highlight the บันทึก nav item.
            const active = loc.pathname === to || loc.pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium font-thai transition-all whitespace-nowrap",
                  active
                    ? "bg-gradient-to-r from-aura-cyan/20 to-aura-lime/10 text-aura-cyan shadow-aura-glow-cyan border border-aura-cyan/40"
                    : "text-aura-textMuted hover:bg-white/5 hover:text-aura-textMain border border-transparent"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:block md:px-2 md:mt-auto text-xs text-aura-textMuted font-thai">
          โรงพยาบาลอุทัย · 2569
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 max-w-full overflow-x-hidden">{children}</main>
    </div>
  );
}
