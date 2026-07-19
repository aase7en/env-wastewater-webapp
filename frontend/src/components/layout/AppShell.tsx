import { Fragment, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import { MSymbol } from "../ui/MSymbol";
import { NotificationBell } from "../ui/NotificationBell";
import { ThemeToggle } from "../ui/ThemeToggle";
import { cn } from "../../lib/utils";

// Nav per the design/ suite sidebar (Material Symbols names taken from the
// suite exports). Only routes that actually exist are listed — no dead links.
// adminOnly entries render only for admin users (route is admin-guarded too).
// `section` renders a small group header above the item (desktop sidebar
// only — the mobile icon strip stays flat).
type NavItem = {
  to: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
  section?: string;
};

const NAV: NavItem[] = [
  { to: "/", label: "ภาพรวม", icon: "dashboard" },
  { to: "/dashboard", label: "บ่อบำบัด", icon: "water_drop" },
  { to: "/form", label: "บันทึกประจำวัน", icon: "edit_note" },
  { to: "/readings", label: "ประวัติ", icon: "history" },
  { to: "/trends", label: "แนวโน้ม", icon: "monitoring" },
  { to: "/carbon", label: "คาร์บอน", icon: "co2" },
  { to: "/carbon-rollup", label: "คาร์บอนรวม", icon: "insights" },
  { to: "/equipment", label: "อุปกรณ์", icon: "medical_services" },
  { to: "/reports", label: "เอกสาร", icon: "description" },
  { to: "/attachments", label: "ไฟล์แนบ", icon: "attach_file" },
  // F8: 8 module pages + regulations — were reachable only by typing the
  // URL (flagged in tests/e2e/modules.spec.ts).
  { section: "โมดูล ENV", to: "/water-supply", label: "น้ำประปาบาดาล", icon: "water_full" },
  { to: "/garbage", label: "จัดการขยะ", icon: "recycling" },
  { to: "/fuel", label: "เชื้อเพลิง", icon: "local_gas_station" },
  { to: "/garden", label: "สวนภูมิทัศน์", icon: "park" },
  { to: "/building", label: "อาคารสถานที่", icon: "apartment" },
  { to: "/safety", label: "ความปลอดภัย", icon: "health_and_safety" },
  { to: "/food", label: "ครัวอาหาร", icon: "restaurant" },
  { to: "/chemical", label: "คลังเคมี", icon: "science" },
  { to: "/regulations", label: "กฎหมาย ENV", icon: "gavel" },
  { section: "ผู้ดูแล", to: "/import", label: "นำเข้าข้อมูล", icon: "upload_file", adminOnly: true },
  { to: "/pdf-designer", label: "ออกแบบ PDF", icon: "picture_as_pdf", adminOnly: true },
  { to: "/admin/db", label: "DBA Console", icon: "database", adminOnly: true },
  { to: "/admin/ai", label: "AI Admin", icon: "smart_toy", adminOnly: true },
];

/** Brand lockup — UTH[AI]-ENV with the [AI] neon highlight (suite §1). */
function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display font-bold tracking-tight", className)}>
      <span className="text-aura-textMain">UTH</span>
      <span className="aura-text-gradient">[AI]</span>
      <span className="text-aura-textMain">-ENV</span>
    </span>
  );
}

/** Signed-in user chip (sidebar footer per suite). Display-only + logout. */
function UserFooter() {
  const { user, appUser, isAuthenticated, signOut } = useAuth();
  if (!isAuthenticated || !user) {
    return (
      <Link
        to="/login"
        className="flex items-center gap-3 px-2 py-2 rounded-xl text-sm font-thai text-aura-textMuted hover:text-aura-cyan transition-colors"
      >
        <MSymbol name="login" className="text-[20px]" />
        เข้าสู่ระบบ
      </Link>
    );
  }
  const name = appUser?.display_name || user.email || "ผู้ใช้";
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-3 px-2">
      <div className="w-9 h-9 rounded-full bg-aura-surfaceHighest border border-aura-borderSubtle flex items-center justify-center text-sm font-semibold text-aura-cyan shrink-0">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-aura-textMain font-thai truncate">{name}</div>
        <div className="text-[10px] uppercase tracking-widest text-aura-textMuted">
          {appUser?.role === "admin" ? "ADMIN" : "STAFF"}
        </div>
      </div>
      <button
        type="button"
        onClick={() => void signOut()}
        aria-label="ออกจากระบบ"
        title="ออกจากระบบ"
        className="text-aura-textMuted hover:text-alert-red transition-colors"
      >
        <MSymbol name="logout" className="text-[20px]" />
      </button>
    </div>
  );
}

/**
 * UTH[AI]-ENV app shell per the design/ suite (F2):
 * desktop = fixed w-72 sidebar (brand + nav + user footer) + sticky top bar;
 * mobile = sticky top row with brand, icon nav, and theme toggle.
 * Wordmark uses -ENV (water_management_dark_mode_fix corrected the EVN typo).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const { isAdmin } = useAuth();
  const items = NAV.filter((n) => !n.adminOnly || isAdmin);
  const active = (to: string) => loc.pathname === to || loc.pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen flex">
      {/* ── Desktop sidebar (suite: fixed w-72, brand, nav, user footer) ── */}
      <aside className="hidden md:flex w-72 h-screen sticky top-0 shrink-0 flex-col bg-aura-bg/80 backdrop-blur-2xl border-r border-aura-borderSubtle">
        <div className="px-6 py-8">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}logo-aura.png`}
              alt=""
              className="w-9 h-9 rounded-xl shrink-0"
            />
            <BrandWordmark className="text-xl" />
          </Link>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-aura-textMuted">
            Environmental Department
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto flex flex-col gap-1">
          {items.map(({ to, label, icon, section }) => (
            <Fragment key={to}>
              {section && (
                <div className="px-6 pt-5 pb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-aura-textMuted/70 font-thai">
                  {section}
                </div>
              )}
              <Link
                to={to}
                className={cn(
                  "flex items-center gap-4 px-6 py-3.5 font-thai text-sm transition-all duration-200 active:scale-[0.98]",
                  active(to)
                    ? "bg-aura-surfaceHighest/50 text-aura-cyan border-l-4 border-aura-cyan font-semibold"
                    : "text-aura-textMuted border-l-4 border-transparent hover:bg-aura-surfaceHigh/50 hover:text-aura-textMain"
                )}
              >
                <MSymbol name={icon} fill={active(to)} />
                {label}
              </Link>
            </Fragment>
          ))}
        </nav>

        <div className="p-4 border-t border-aura-borderSubtle flex flex-col gap-3">
          <UserFooter />
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-aura-textMuted font-thai">โรงพยาบาลอุทัย · 2569</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop top bar (suite: sticky, brand gradient, context right) */}
        <header className="hidden md:flex sticky top-0 z-30 h-14 items-center justify-between px-8 bg-aura-bgDeep/80 backdrop-blur-md border-b border-aura-borderSubtle">
          <span className="font-display font-extrabold text-sm aura-text-gradient tracking-tight">
            UTH[AI]-ENV
          </span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-aura-textMuted font-thai">
              ระบบติดตามบ่อบำบัดน้ำเสีย
            </span>
            <NotificationBell />
          </div>
        </header>

        {/* Mobile top bar: brand + icon nav + toggle */}
        <header className="md:hidden sticky top-0 z-30 bg-aura-bg/85 backdrop-blur-xl border-b border-aura-borderSubtle px-3 py-2 flex items-center gap-2">
          <Link to="/dashboard" className="shrink-0">
            <BrandWordmark className="text-base" />
          </Link>
          <nav className="flex-1 flex gap-1 overflow-x-auto">
            {items.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                aria-label={label}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-all",
                  active(to)
                    ? "bg-aura-surfaceHighest/60 text-aura-cyan shadow-aura-glow-cyan"
                    : "text-aura-textMuted hover:text-aura-textMain"
                )}
              >
                <MSymbol name={icon} fill={active(to)} />
              </Link>
            ))}
          </nav>
          <NotificationBell className="shrink-0" />
          <ThemeToggle className="shrink-0" />
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-full overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
