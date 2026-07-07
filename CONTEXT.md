# CONTEXT — Glossary

Domain vocabulary for env-wastewater-webapp. This file is a glossary only —
no implementation details. See `SPEC.md` for scope/requirements and
`docs/adr/` for decisions with trade-offs.

## Terms

**ระบบทำงานปกติ / ผิดปกติ (`system_operating`)**
Overall daily operating status of the treatment system — a distinct manual
entry in `wastewater.reading`, not something computed on the fly. It is
**seeded** from the 10 equipment checkboxes (any one "เสีย"/"ไม่ล้าง" →
defaults to "ผิดปกติ") but the recording staff can **override** it in either
direction, because equipment can all read normal while something else is
wrong (bad smell, discoloration), or a broken screen-cleaning item might not
by itself mean the treatment system is malfunctioning. When "ผิดปกติ" is set,
a **cause field is mandatory** — this cause is the seed input for a future
repair-request document.

**ใบแจ้งซ่อม (Repair Request)**
A printable/PDF document raised when `system_operating` = ผิดปกติ (or an
equipment item is flagged), naming the broken equipment and the recorded
cause. Distinct from ใบขอซื้อ (purchase request), which is out of v1 scope.

**ทส.1**
Daily wastewater-treatment operating log report — a standard form under the
Enhancement and Conservation of National Environmental Quality Act
(พรบ.ส่งเสริมและรักษาคุณภาพสิ่งแวดล้อม พ.ศ. 2535, มาตรา 80) that hospitals
must keep on file. Populated entirely from existing `wastewater.reading` /
`carbon.reading` columns — no new data capture needed, just a print layout.

**ทส.2**
Monthly summary report derived from ทส.1 entries, submitted to the local
environmental/pollution-control authority (เจ้าพนักงานท้องถิ่น). Same data
source as ทส.1, aggregated monthly.

**PDF Template-Builder**
A v1 module: a UI where the user composes a printable report layout by
picking a data source (which table/view) and placing fields on a page,
choosing paper size (A4/A5) and orientation (portrait/landscape), saving the
layout for reuse, and generating PDFs on demand from live data. ทส.1, ทส.2,
and the repair request each ship as a built-in starter template — the user is
not required to build those from scratch, but the underlying engine is
generic, not three hardcoded templates.

**Location (`core.location`)**
Physical treatment-pond site. As of this writing the hospital's exact site
count/naming is still an open decision (see roadmap task 2 in the session
plan) — this repo has one row's worth of data (`carbon.meter` → one meter)
in production, but the schema supports multiple.

**Input source (`input_source`)**
Enum on `wastewater.reading` distinguishing how a row was captured. All 907
migrated rows are `manual` (i.e., transcribed from the legacy AppSheet/Sheets
export). New rows entered through the v1 daily form will also be `manual` —
this enum exists for future IoT-sensor ingestion, not to distinguish
migrated-vs-webapp rows.
