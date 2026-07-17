import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Droplets, LayoutDashboard, FileText, Settings } from "lucide-react";
import { cn } from "../../lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/form", label: "บันทึก", icon: FileText },
  { to: "/settings", label: "ตั้งค่า", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-navy-50">
      {/* Sidebar (desktop) / top bar (mobile) */}
      <aside className="md:w-56 md:min-h-screen bg-navy-900 text-navy-100 flex md:flex-col flex-row items-center md:items-stretch md:py-6 px-4 py-3 gap-2 md:gap-1 shrink-0 sticky top-0 z-10">
        <Link to="/dashboard" className="flex items-center gap-2 md:mb-8 md:px-2">
          <Droplets className="w-7 h-7 text-teal-400" />
          <span className="font-display font-semibold text-lg hidden md:inline">ENV</span>
        </Link>
        <nav className="flex md:flex-col flex-row gap-1 md:gap-1 flex-1 md:px-2">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = loc.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-teal-600 text-white"
                    : "text-navy-300 hover:bg-navy-800 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="hidden md:block md:px-2 md:mt-auto text-xs text-navy-400">
          โรงพยาบาลอุทัย · 2569
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-4 md:p-8 max-w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
