import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn-style classname merge: conditional + de-dup Tailwind classes. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a Decimal/string number to a fixed decimal place, "-" for null. */
export function fmt(v: number | string | null | undefined, digits = 1): string {
  if (v === null || v === undefined || v === "") return "—";
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

/** Thai Buddhist Era date label (YYYY-MM-DD → DD MMM BE). */
export function thaiDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const be = date.getFullYear() + 543;
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
                  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return `${date.getDate()} ${months[date.getMonth()]} ${be}`;
}

/** Whole days between today (local, midnight) and a YYYY-MM-DD string.
 * 0 when the date is today; positive for past dates.
 * Used by F7 stale-data fallback ("N วันก่อน"). */
export function daysSince(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(isoDate);
  d.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - d.getTime()) / 86_400_000);
}
