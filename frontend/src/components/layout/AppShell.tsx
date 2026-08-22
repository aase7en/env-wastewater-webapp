import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthProvider";
import { MSymbol } from "../ui/MSymbol";
import { NotificationBell } from "../ui/NotificationBell";
import { PendingUsersBell } from "../ui/PendingUsersBell";
import { ThemeToggle } from "../ui/ThemeToggle";
import { ModuleDock } from "./ModuleDock";
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
  { to: "/sensors", label: "เซนเซอร์ Live", icon: "sensors" },
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
  { to: "/admin/users", label: "รออนุมัติ", icon: "person_add", adminOnly: true },
  { to: "/admin/audit", label: "บันทึกตรวจสอบ", icon: "history_edu", adminOnly: true },
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
        className="flex min-h-[var(--touch-min)] items-center gap-3 px-2 py-2 rounded-xl text-sm font-thai text-aura-textMuted hover:text-aura-cyan transition-colors"
      >
        <MSymbol name="login" />
        เข้าสู่ระบบ
      </Link>
    );
  }
  const name = appUser?.display_name || user.email || "ผู้ใช้";
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-2 md:gap-3">
      <div
        title={name}
        aria-label={name}
        className="w-9 h-9 rounded-full bg-aura-surfaceHighest border border-aura-borderSubtle flex items-center justify-center text-sm font-semibold text-aura-cyan shrink-0"
      >
        {initial}
      </div>
      {/* DOCK-1: name/role hidden below lg — this block now lives in the top
          bar rather than a 288px sidebar footer, so it has to yield space to
          the bells on narrow screens. The avatar and logout stay at all
          widths, and the avatar carries the name via title/aria. */}
      <div className="hidden lg:block min-w-0 max-w-[12rem]">
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
        className="grid w-[var(--touch-min)] h-[var(--touch-min)] place-items-center rounded-xl text-aura-textMuted hover:text-alert-red hover:bg-alert-red/10 transition-colors"
      >
        <MSymbol name="logout" />
      </button>
    </div>
  );
}

/**
 * UTH[AI]-ENV app shell.
 *
 * DOCK-1 (2026-08-02): one sticky top bar (brand · context · bells · theme ·
 * user) plus a floating <ModuleDock/> for navigation, at every breakpoint.
 * Replaces the w-72 desktop sidebar and the separate mobile icon strip.
 * Wordmark uses -ENV (water_management_dark_mode_fix corrected the EVN typo).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { isAdmin, appUser } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* DOCK-1 (2026-08-02): the w-72 sidebar and the mobile icon strip were
          both replaced by <ModuleDock/>, a floating macOS-style dock. One nav
          for both breakpoints. Brand, user chip and theme toggle moved up into
          the top bar, which the sidebar footer used to hold.
          The bells KEEP their slot — top-bar right-hand action area, same
          order (NotificationBell then PendingUsersBell) as before. */}
      {/* ── Top bar — one bar for every breakpoint now that the dock is the
             nav. Holds what the sidebar footer used to: brand, user, theme. ── */}
      <header className="sticky top-0 z-30 min-h-16 shrink-0 flex items-center justify-between gap-2 px-3 sm:px-4 md:px-8 bg-aura-bgDeep/80 backdrop-blur-md border-b border-aura-borderSubtle">
        <Link
          to="/dashboard"
          aria-label="UTH[AI]-ENV — ระบบติดตามบ่อบำบัดน้ำเสีย"
          className="flex min-w-[var(--touch-min)] min-h-[var(--touch-min)] items-center justify-center gap-2.5 shrink-0 sm:justify-start"
        >
          <img
            src={`${import.meta.env.BASE_URL}logo-aura.png`}
            alt=""
            className="w-9 h-9 rounded-lg shrink-0"
          />
          <BrandWordmark className="hidden sm:inline text-lg md:text-xl" />
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
          <span className="hidden xl:inline text-xs text-aura-textMuted font-thai">
            ระบบติดตามบ่อบำบัดน้ำเสีย
          </span>
          {/* Bell slot — unchanged position and order (AUTH constraint). */}
          <NotificationBell />
          <PendingUsersBell />
          <ThemeToggle />
          <UserFooter />
        </div>
      </header>

      {/* pb-28: the dock floats over the page, so the last row of content
          needs clearance or it sits underneath and cannot be read. */}
      <main className="flex-1 p-4 md:p-8 pb-28 max-w-full overflow-x-hidden">
        {children}
      </main>

      <ModuleDock nav={NAV} isAdmin={isAdmin} role={appUser?.role ?? null} />
    </div>
  );
}
