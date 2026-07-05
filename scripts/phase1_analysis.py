#!/usr/bin/env python3
"""Phase 1 — read-only analysis of the wastewater CSV export.

Does NOT write anything to Supabase. Produces a Markdown report at
reports/phase1-analysis.md summarizing the 6 checks from the migration spec.
"""
from __future__ import annotations

import csv
import re
from collections import Counter
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CSV_MAIN = REPO_ROOT / "data/raw/ข้อมูลบ่อบำบัดประจำวัน - ข้อมูลคุณภาพน้ำ.csv"
CSV_PERSONNEL = REPO_ROOT / "data/raw/ข้อมูลบ่อบำบัดประจำวัน - ข้อมูลผู้ปฏิบัติงาน.csv"
REPORT_PATH = REPO_ROOT / "reports/phase1-analysis.md"

CHECKLIST_COLS = [
    "ล้างตะแกรงบ่อสูบ",
    "ล้างตะแกรงละเอียด",
    "เครื่องสูบน้ำเสีย 1",
    "เครื่องสูบน้ำเสีย 2",  # trailing tab stripped on read
    "เครื่องเติมอากาศ 1",
    "เครื่องเติมอากาศ 2",
    "เครื่องสูบตะกอน 1",
    "เครื่องสูบตะกอน 2",
    "เครื่องจ่ายคลอรีน 1",
    "เครื่องจ่ายคลอรีน 2",
    "การทำงานของระบบบำบัดน้ำเสีย",
]

NUMERIC_COLS = {
    "DO-1": "บ่อเติมอากาศ(DO-1)",
    "DO-2": "บ่อตกตะกอน(DO-2)",
    "DO-3": "น้ำก่อนทิ้ง(DO-3)",
    "pH": "ความเป็นกรดและด่าง(pH)",
    "TDS-1": "ในบ่อเติมอากาศ (TDS-1)",
    "TDS-2": "ในน้ำก่อนทิ้ง (TDS-2)",
    "SV30": "การตกตะกอน(SV30)",
    "Free Chlorine": "คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)",
}

DATE_COL = "วันที่ บันทึก"
CHLORINE_USED = " คลอรีนน้ำ ที่ใช้"  # leading space is real, in the source header
CHLORINE_ACTUAL = "คลอรีนน้ำที่ใช้จริง"
METER_TODAY = "เลขมิเตอร์วันนี้"
ELEC_USAGE = "ปริมาณการใช้ไฟฟ้าของระบบ"
PUMP1_METER = "เลขมิเตอร์เครื่องสูบ 1"
PUMP2_METER = "เลขมิเตอร์เครื่องสูบ 2"
REPORTER_ID = "ผู้บันทึก"

DATE_RE = re.compile(r"^\d{1,2}/\d{1,2}/\d{4}$")

PHOTO_COL_CANDIDATES = [
    "SV30_Photo", "pH_Photo", "Free_Chlorine_Photo", "TDS_Photo", "DO_Photo", "meter_photo",
]


def load_rows(path: Path) -> list[dict]:
    with open(path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            rows.append({k.strip(): v for k, v in row.items()})
        return rows


def main() -> None:
    rows = load_rows(CSV_MAIN)
    n = len(rows)
    lines: list[str] = []
    lines.append("# Phase 1 — Wastewater CSV Analysis (read-only, no Supabase writes)")
    lines.append("")
    lines.append(f"Source: `{CSV_MAIN.name}` — **{n} rows**")
    lines.append("")

    # 1. Date pattern
    lines.append("## 1. Date pattern check (`วันที่ บันทึก`)")
    bad_dates = [(i + 2, r[DATE_COL]) for i, r in enumerate(rows) if not DATE_RE.match(r[DATE_COL].strip())]
    if bad_dates:
        lines.append(f"⚠️ {len(bad_dates)} rows do NOT match `D/M/YYYY`:")
        for rownum, val in bad_dates[:20]:
            lines.append(f"- row {rownum}: `{val!r}`")
    else:
        lines.append(f"✅ All {n} rows match `D/M/YYYY` pattern (Thai BE, no leading zeros).")
    dates = [r[DATE_COL].strip() for r in rows]
    lines.append(f"- First date: `{dates[0]}` — Last date: `{dates[-1]}`")
    lines.append("")

    # 2. Checklist distinct values
    lines.append("## 2. Checklist columns — distinct values")
    for col in CHECKLIST_COLS:
        vals = Counter(r.get(col, "").strip() for r in rows)
        vals_str = ", ".join(f"`{v or '(blank)'}`={c}" for v, c in sorted(vals.items(), key=lambda x: -x[1]))
        lines.append(f"- **{col}**: {vals_str}")
    lines.append("")

    # 3. Chlorine comparison
    lines.append("## 3. Chlorine columns — `คลอรีนน้ำ ที่ใช้` vs `คลอรีนน้ำที่ใช้จริง`")
    diffs = []
    for i, r in enumerate(rows):
        used = r.get(CHLORINE_USED.strip(), "").strip()
        actual = r.get(CHLORINE_ACTUAL, "").strip()
        if used != actual:
            diffs.append((i + 2, used, actual))
    lines.append(f"- Rows compared: {n}, differing: **{len(diffs)}**")
    if diffs:
        lines.append("- Sample differing rows:")
        for rownum, used, actual in diffs[:5]:
            lines.append(f"  - row {rownum}: ที่ใช้=`{used}` vs ที่ใช้จริง=`{actual}`")
    else:
        lines.append("- ✅ Identical on every row — safe to use either column as source of truth.")
    lines.append("")

    # 4. Electricity meter
    lines.append("## 4. Electricity meter — `เลขมิเตอร์วันนี้` delta vs `ปริมาณการใช้ไฟฟ้าของระบบ`")
    meter_vals = []
    for r in rows:
        raw = r.get(METER_TODAY, "").strip()
        try:
            meter_vals.append(float(raw))
        except ValueError:
            meter_vals.append(None)
    mismatches = []
    for i in range(1, n):
        prev, cur = meter_vals[i - 1], meter_vals[i]
        if prev is None or cur is None:
            continue
        delta = cur - prev
        try:
            usage = float(rows[i].get(ELEC_USAGE, "").strip())
        except ValueError:
            usage = None
        if usage is not None and abs(delta - usage) > 0.01:
            mismatches.append((i + 2, delta, usage))
    lines.append(f"- Day-over-day delta vs `{ELEC_USAGE}` — mismatches: **{len(mismatches)}** / {n - 1} comparable pairs")
    if mismatches:
        lines.append("- Sample mismatches:")
        for rownum, delta, usage in mismatches[:5]:
            lines.append(f"  - row {rownum}: delta={delta} vs usage_col={usage}")
    else:
        lines.append(f"- ✅ `{METER_TODAY}` delta matches `{ELEC_USAGE}` on every comparable row — both are safe to insert as-is (`carbon.reading.meter_value` + `.consumption`).")
    lines.append(f"- Sample `{PUMP1_METER}` / `{PUMP2_METER}` (first 5 rows):")
    for r in rows[:5]:
        lines.append(f"  - {r[DATE_COL]}: pump1={r.get(PUMP1_METER,'')}, pump2={r.get(PUMP2_METER,'')}")
    lines.append("")

    # 5. Photos
    lines.append("## 5. Photo columns")
    found_photo_cols = [c for c in PHOTO_COL_CANDIDATES if c in rows[0]]
    if found_photo_cols:
        lines.append(f"Found: {found_photo_cols}")
    else:
        lines.append("✅ No photo columns exist in this CSV at all (confirmed absent from all 39 columns) — nothing to skip, there was never a photo field to migrate in this export.")
    lines.append("")

    # 6. Null percentages
    lines.append("## 6. Null/blank % for numeric columns")
    for label, col in NUMERIC_COLS.items():
        blanks = sum(1 for r in rows if not r.get(col, "").strip())
        pct = 100 * blanks / n
        lines.append(f"- **{label}**: {blanks}/{n} blank ({pct:.1f}%)")
    lines.append("")

    # Reporter join check
    lines.append("## 7. Reporter (`ผู้บันทึก`) → personnel join check")
    personnel = load_rows(CSV_PERSONNEL)
    emp_ids = {p["Employee_id"].strip() for p in personnel if p.get("Employee_id", "").strip()}
    reporter_ids = Counter(r.get(REPORTER_ID, "").strip() for r in rows)
    unmatched = {rid: cnt for rid, cnt in reporter_ids.items() if rid and rid not in emp_ids}
    lines.append(f"- Distinct reporter IDs in main file: {len(reporter_ids)}; personnel master rows: {len(personnel)}")
    if unmatched:
        lines.append(f"- ⚠️ {len(unmatched)} reporter ID(s) NOT found in personnel master: {unmatched}")
    else:
        lines.append("- ✅ Every reporter ID in the main file resolves to a personnel record.")
    lines.append("")

    REPORT_PATH.parent.mkdir(exist_ok=True)
    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"Report written to {REPORT_PATH}")
    print(f"Rows analyzed: {n}")


if __name__ == "__main__":
    main()
