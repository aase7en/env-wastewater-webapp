#!/usr/bin/env python3
"""Phase 2 — generate batched SQL scripts that migrate the wastewater CSV
into Supabase (carbon.reading + wastewater.reading).

Does NOT connect to any database itself — just emits SQL text, one file per
batch, to reports/phase2-batch-NN.sql. Each batch is wrapped in its own
BEGIN/COMMIT (atomic per batch — a failure in one batch does not touch rows
already committed by prior batches, but does not silently continue past a
failure either; the caller stops and reports on the first failing batch).
Batched because a single 907-row script is ~365KB, too large to read back
into an LLM context economically in one shot.
"""
from __future__ import annotations

import csv
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CSV_MAIN = REPO_ROOT / "data/raw/ข้อมูลบ่อบำบัดประจำวัน - ข้อมูลคุณภาพน้ำ.csv"
CSV_PERSONNEL = REPO_ROOT / "data/raw/ข้อมูลบ่อบำบัดประจำวัน - ข้อมูลผู้ปฏิบัติงาน.csv"
OUT_DIR = REPO_ROOT / "reports"
BATCH_SIZE = 90

METER_ID = "b6be4c99-c83a-43f7-b765-72286cc78bd0"

DATE_COL = "วันที่ บันทึก"
COLS = {
    "tds_aeration": "ในบ่อเติมอากาศ (TDS-1)",
    "temp_aeration": "อุณหภูมิ บ่อเติมอากาศ(Temperature)",
    "tds_before_discharge": "ในน้ำก่อนทิ้ง (TDS-2)",
    "ph": "ความเป็นกรดและด่าง(pH)",
    "do_aeration": "บ่อเติมอากาศ(DO-1)",
    "do_sedimentation": "บ่อตกตะกอน(DO-2)",
    "do_before_discharge": "น้ำก่อนทิ้ง(DO-3)",
    "sv30": "การตกตะกอน(SV30)",
    "free_chlorine": "คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)",
    "pump1_meter": "เลขมิเตอร์เครื่องสูบ 1",
    "pump2_meter": "เลขมิเตอร์เครื่องสูบ 2",
    "water_used_total": "ปริมาณน้ำที่ใช้ในทุกกิจกรรม",
    "wastewater_in": "ปริมาณน้ำเสียที่เข้าระบบบำบัด",
    "chlorine_used": "คลอรีนน้ำที่ใช้จริง",
    "chlorine_mix_ratio": "อัตราส่วนผสม(คลอรีน/น้ำ)",
    "excess_sludge_removed": "ตะกอนส่วนเกินที่นำไปกำจัด",
    "color_desc": "ลักษณะสี",
    "smell_desc": "ลักษณะกลิ่น",
    "note": "หมายเหตุ",
    "legacy_id": "id",
}
BOOL_YESNO = {"screen_cleaned_coarse": "ล้างตะแกรงบ่อสูบ", "screen_cleaned_fine": "ล้างตะแกรงละเอียด"}
BOOL_NORMAL = {
    "pump1_running": "เครื่องสูบน้ำเสีย 1", "pump2_running": "เครื่องสูบน้ำเสีย 2",
    "aerator1_running": "เครื่องเติมอากาศ 1", "aerator2_running": "เครื่องเติมอากาศ 2",
    "sludge_pump1_running": "เครื่องสูบตะกอน 1", "sludge_pump2_running": "เครื่องสูบตะกอน 2",
    "chlorine_pump1_running": "เครื่องจ่ายคลอรีน 1", "chlorine_pump2_running": "เครื่องจ่ายคลอรีน 2",
    "system_operating": "การทำงานของระบบบำบัดน้ำเสีย",
}
METER_TODAY = "เลขมิเตอร์วันนี้"
ELEC_USAGE = "ปริมาณการใช้ไฟฟ้าของระบบ"
DISCHARGE_STATUS = "การระบายน้ำทิ้งออกจากระบบ"
REPORTER_ID = "ผู้บันทึก"

WR_COLS = [
    "reading_date", "tds_aeration", "temp_aeration", "tds_before_discharge", "ph",
    "do_aeration", "do_sedimentation", "do_before_discharge", "sv30", "free_chlorine",
    "screen_cleaned_coarse", "screen_cleaned_fine",
    "pump1_running", "pump2_running", "aerator1_running", "aerator2_running",
    "sludge_pump1_running", "sludge_pump2_running",
    "chlorine_pump1_running", "chlorine_pump2_running", "system_operating",
    "pump1_meter", "pump2_meter", "water_used_total", "wastewater_in",
    "wastewater_discharged", "chlorine_used", "chlorine_mix_ratio",
    "excess_sludge_removed", "color_desc", "smell_desc", "note", "legacy_id",
    "reported_by_name_legacy", "meter_value", "consumption",
]


def esc(s: str) -> str:
    return "NULL::text" if not s.strip() else "'" + s.strip().replace("'", "''") + "'"


def num(s: str) -> str:
    s = s.strip()
    return "NULL::numeric" if not s else s


def boolean(s: str, true_val: str, false_vals: set[str]) -> str:
    s = s.strip()
    if not s:
        return "NULL::boolean"
    if s == true_val:
        return "true"
    if s in false_vals:
        return "false"
    return "NULL::boolean"


def load_rows(path: Path) -> list[dict]:
    with open(path, encoding="utf-8-sig") as f:
        return [{k.strip(): v for k, v in row.items()} for row in csv.DictReader(f)]


def row_to_tuple(r: dict, name_by_id: dict) -> str:
    vals = [f"core.thai_be_to_date({esc(r[DATE_COL])})"]
    for field in ["tds_aeration", "temp_aeration", "tds_before_discharge", "ph",
                  "do_aeration", "do_sedimentation", "do_before_discharge", "sv30", "free_chlorine"]:
        vals.append(num(r.get(COLS[field], "")))
    for _, col in BOOL_YESNO.items():
        vals.append(boolean(r.get(col, ""), "ล้าง", {"ไม่ล้าง"}))
    for _, col in BOOL_NORMAL.items():
        vals.append(boolean(r.get(col, ""), "ปกติ", {"เสีย", "ผิดปกติ"}))
    for field in ["pump1_meter", "pump2_meter", "water_used_total", "wastewater_in"]:
        vals.append(num(r.get(COLS[field], "")))
    vals.append("NULL::numeric")  # wastewater_discharged: text status, not numeric (user-approved NULL)
    for field in ["chlorine_used", "chlorine_mix_ratio", "excess_sludge_removed", "color_desc", "smell_desc"]:
        v = r.get(COLS[field], "")
        vals.append(num(v) if field in ("chlorine_used", "excess_sludge_removed") else esc(v))
    note_val = r.get(COLS["note"], "").strip()
    discharge_val = r.get(DISCHARGE_STATUS, "").strip()
    if discharge_val:
        note_val = f"{note_val} | discharge: {discharge_val}" if note_val else f"discharge: {discharge_val}"
    vals.append(esc(note_val))
    vals.append(esc(r.get(COLS["legacy_id"], "")))
    reporter_id = r.get(REPORTER_ID, "").strip()
    vals.append(esc(name_by_id.get(reporter_id, reporter_id)))
    vals.append(num(r.get(METER_TODAY, "")))
    vals.append(num(r.get(ELEC_USAGE, "")))
    return "(" + ", ".join(vals) + ")"


def build_batch_sql(value_tuples: list[str]) -> str:
    sql = ["begin;", "", f"with input_data({', '.join(WR_COLS)}) as (", "  values"]
    sql.append(",\n".join(f"    {t}" for t in value_tuples))
    sql.append("),")
    sql.append("ins_carbon as (")
    sql.append("  insert into carbon.reading (meter_id, reading_date, meter_value, consumption, input_source)")
    sql.append(f"  select '{METER_ID}'::uuid, reading_date, meter_value, consumption, 'manual' from input_data")
    sql.append("  returning id, reading_date")
    sql.append(")")
    sql.append("insert into wastewater.reading (")
    sql.append("  " + ", ".join(c for c in WR_COLS if c not in ("meter_value", "consumption")) + ", carbon_reading_id, input_source")
    sql.append(") select")
    sql.append("  " + ", ".join(f"d.{c}" for c in WR_COLS if c not in ("meter_value", "consumption")) + ", c.id, 'manual'")
    sql.append("from input_data d join ins_carbon c on c.reading_date = d.reading_date;")
    sql.append("")
    sql.append(
        "select (select count(*) from wastewater.reading) as inserted_wastewater_rows, "
        "(select count(*) from carbon.reading) as inserted_carbon_rows;"
    )
    sql.append("")
    sql.append("commit;")
    return "\n".join(sql)


def main() -> None:
    rows = load_rows(CSV_MAIN)
    personnel = load_rows(CSV_PERSONNEL)
    name_by_id = {p["Employee_id"].strip(): p["ชื่อ-สกุล"].strip() for p in personnel if p.get("Employee_id", "").strip()}

    usable = [r for r in rows if r[DATE_COL].strip()]
    skipped = len(rows) - len(usable)

    OUT_DIR.mkdir(exist_ok=True)
    batches = [usable[i:i + BATCH_SIZE] for i in range(0, len(usable), BATCH_SIZE)]
    for i, batch in enumerate(batches, start=1):
        tuples = [row_to_tuple(r, name_by_id) for r in batch]
        sql = build_batch_sql(tuples)
        out = OUT_DIR / f"phase2-batch-{i:02d}.sql"
        out.write_text(sql, encoding="utf-8")
        print(f"{out.name}: {len(batch)} rows, {len(sql)} bytes, dates {batch[0][DATE_COL]}..{batch[-1][DATE_COL]}")

    print(f"\nTotal usable rows: {len(usable)}, skipped (blank date): {skipped}, batches: {len(batches)}")


if __name__ == "__main__":
    main()
