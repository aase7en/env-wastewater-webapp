# Phase 1 — Wastewater CSV Analysis (read-only, no Supabase writes)

Source: `ข้อมูลบ่อบำบัดประจำวัน - ข้อมูลคุณภาพน้ำ.csv` — **908 rows**

## 1. Date pattern check (`วันที่ บันทึก`)
⚠️ 1 rows do NOT match `D/M/YYYY`:
- row 452: `''`
- First date: `9/1/2567` — Last date: `4/7/2569`

## 2. Checklist columns — distinct values
- **ล้างตะแกรงบ่อสูบ**: `ไม่ล้าง`=804, `ล้าง`=103, `(blank)`=1
- **ล้างตะแกรงละเอียด**: `ล้าง`=900, `ไม่ล้าง`=7, `(blank)`=1
- **เครื่องสูบน้ำเสีย 1**: `ปกติ`=907, `(blank)`=1
- **เครื่องสูบน้ำเสีย 2**: `ปกติ`=907, `(blank)`=1
- **เครื่องเติมอากาศ 1**: `ปกติ`=907, `(blank)`=1
- **เครื่องเติมอากาศ 2**: `ปกติ`=907, `(blank)`=1
- **เครื่องสูบตะกอน 1**: `ปกติ`=903, `เสีย`=4, `(blank)`=1
- **เครื่องสูบตะกอน 2**: `ปกติ`=907, `(blank)`=1
- **เครื่องจ่ายคลอรีน 1**: `ปกติ`=907, `(blank)`=1
- **เครื่องจ่ายคลอรีน 2**: `ปกติ`=907, `(blank)`=1
- **การทำงานของระบบบำบัดน้ำเสีย**: `ปกติ`=906, `ผิดปกติ`=1, `(blank)`=1

## 3. Chlorine columns — `คลอรีนน้ำ ที่ใช้` vs `คลอรีนน้ำที่ใช้จริง`
- Rows compared: 908, differing: **897**
- Sample differing rows:
  - row 2: ที่ใช้=`25` vs ที่ใช้จริง=`6.25`
  - row 3: ที่ใช้=`25` vs ที่ใช้จริง=`6.25`
  - row 4: ที่ใช้=`21` vs ที่ใช้จริง=`5.25`
  - row 5: ที่ใช้=`19` vs ที่ใช้จริง=`4.75`
  - row 6: ที่ใช้=`21` vs ที่ใช้จริง=`5.25`

**⚠️ These are NOT duplicate/redundant fields — they differ by design.** Checked
against `อัตราส่วนผสม(คลอรีน/น้ำ)` (mix ratio, e.g. `1:4`) on the same rows:
`คลอรีนน้ำที่ใช้จริง` = `คลอรีนน้ำ ที่ใช้` ÷ 4 exactly, every sampled row (25÷4=6.25,
21÷4=5.25, 19÷4=4.75...). `ที่ใช้` = gross diluted-mixture volume; `ที่ใช้จริง` =
actual concentrated chlorine after applying the mix ratio. **Needs an explicit
user decision on which maps to `wastewater.reading.chlorine_used`** — not a
"pick either, they're equal" situation as the original mapping assumed.

**DECIDED (2026-07-05): `chlorine_used` ← `คลอรีนน้ำที่ใช้จริง`.** Per the user:
the chlorine dosing tank holds 100L; operators top it back up every 1-2 days
with water + chlorine mixed at a ratio (1:2, 1:4, 1:9...) chosen day-to-day
based on the measured Free Chlorine reading (weaker reading → richer ratio
like 1:2; stronger reading → diluted further, 1:4 or 1:9). `ที่ใช้` is the
gross top-up volume (water+chlorine combined); `ที่ใช้จริง` is the actual pure
chlorine chemical quantity within that top-up, which is what feeds monthly
chemical-usage and carbon-footprint accounting. `ที่ใช้` is intermediate
working data, not part of the target schema — leave it unmapped (SKIP).

## 4. Electricity meter — `เลขมิเตอร์วันนี้` delta vs `ปริมาณการใช้ไฟฟ้าของระบบ`
- Day-over-day delta vs `ปริมาณการใช้ไฟฟ้าของระบบ` — mismatches: **71** / 907 comparable pairs
- Sample mismatches:
  - row 26: delta=-111.0 vs usage_col=5.0
  - row 28: delta=69.0 vs usage_col=1.0
  - row 29: delta=43.0 vs usage_col=5.0
  - row 49: delta=-9.0 vs usage_col=5.0
  - row 51: delta=9.0 vs usage_col=5.0
- Sample `เลขมิเตอร์เครื่องสูบ 1` / `เลขมิเตอร์เครื่องสูบ 2` (first 5 rows):
  - 9/1/2567: pump1=3432.8, pump2=6634.4
  - 10/1/2567: pump1=3433.8, pump2=6635.2
  - 11/1/2567: pump1=3434.8, pump2=6636.1
  - 12/1/2567: pump1=3435.8, pump2=6636.9
  - 15/1/2567: pump1=3438, pump2=6638.8

## 5. Photo columns
✅ No photo columns exist in this CSV at all (confirmed absent from all 39 columns) — nothing to skip, there was never a photo field to migrate in this export.

## 6. Null/blank % for numeric columns
- **DO-1**: 41/908 blank (4.5%)
- **DO-2**: 40/908 blank (4.4%)
- **DO-3**: 7/908 blank (0.8%)
- **pH**: 2/908 blank (0.2%)
- **TDS-1**: 1/908 blank (0.1%)
- **TDS-2**: 1/908 blank (0.1%)
- **SV30**: 1/908 blank (0.1%)
- **Free Chlorine**: 7/908 blank (0.8%)

## 7. Reporter (`ผู้บันทึก`) → personnel join check
- Distinct reporter IDs in main file: 13; personnel master rows: 33
- ⚠️ 2 reporter ID(s) NOT found in personnel master: {'1234567890678': 67, '2122222222029292': 176}
