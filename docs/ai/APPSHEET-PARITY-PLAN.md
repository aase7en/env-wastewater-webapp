# แผนย้ายระบบ AppSheet → ENV แบบ Full-Parity (AppSheet→ENV Full-Parity Migration Plan)

> **สถานะ: แผนเสนอ (proposal)** — docs-only, ไม่มีการเปลี่ยน code/registry · สร้าง 14 พฤศจิกายน พ.ศ. 2569
> ต้นทางความจริง: นิยามแอป AppSheet `ActivatedSludge-29279640` ของเจ้าของ (snapshot 14 พ.ย. 2569) จาก
> `docs/ai/digital-twin/12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md` (SSoT สรุป verbatim) + raw snapshot JSON
> (parse ด้วย python3 — emails/IDs ถูก redact แล้ว) เทียบกับ ENV ปัจจุบันจาก
> `reports/schema-snapshot-live.md` (Supabase, introspected 3 ส.ค. 2569), `frontend/src/App.tsx` (routes),
> `frontend/src/lib/supabase-queries.ts` และหน้า `frontend/src/pages/*`
> **บริบทสำคัญ:** เจ้าของยังใช้ AppSheet บันทึกงานสิ่งแวดล้อมประจำวันจนกว่า ENV จะแทนที่ได้ครบทุกฟีเจอร์ —
> เป้าหมายของแผนนี้คือ parity จริง ไม่ใช่ครอบคลุมแบบผิวเผิน

## 1. วัตถุประสงค์ (Purpose)

1. สร้าง **Parity Matrix** ครบ 37 ตารางของ AppSheet โดยจำแนกสถานะ ENV ปัจจุบันเป็น ✅ ครอบคลุม / 🟡 บางส่วน / ❌ ยังไม่มี / ⏭️ ไม่ต้องทำ (menu/system)
2. ระบุ **ข้อกำหนด computation parity** ทุกคอลัมน์คำนวณที่ใช้ประจำวัน พร้อมข้อเสนอ ทำซ้ำตามเดิม / ทำซ้ำแบบเบี่ยงเบน / **ไม่ทำซ้ำ** (ยึดหลัก unknown ≠ zero)
3. ประเมิน **automation parity** ของ bots 22 ตัว (PDF + Telegram/Line) และระบุการตัดสินใจของเจ้าของที่ยังเปิดอยู่
4. จัด **แผน 5 เฟส** แบ่งเป็น lane ขนาด claim ตาม governance พร้อมเกณฑ์ "เปลี่ยนผ่านแล้ว" ของแต่ละเฟส
5. กำหนดโปรโตคอล dual-run + การย้ายประวัติที่เหลือ สำหรับวันคัทโอเวอร์

## 2. สรุปผู้บริหาร (Executive Summary)

AppSheet มี 37 ตาราง (514 คอลัมน์, 402 สูตร, 130 views, 161 actions, 22 bots, 12 format rules) — ENV ปัจจุบันครอบคลุมจริงเพียง 3 ตาราง ✅, บางส่วน 13 ตาราง 🟡, ยังไม่มี 12 ตาราง ❌, และ 9 ตารางเป็น menu/system ที่ไม่ต้องทำ ⏭️ ช่องว่างใหญ่สุด 5 จุดคือ (1) สูตรสายมิเตอร์ไฟฟ้า/น้ำย้อนหลังของตาราง ข้อมูลคุณภาพน้ำ (80 คอลัมน์) ที่ ENV ยังไม่มี, (2) การลงข้อมูลใช้น้ำ/คลอรีนประจำวันของ น้ำประปา (22 คอลัมน์) ที่ `water_supply.daily_check` มีรูปทรงต่างออกไป, (3) ระบบตรวจสอบถังดับเพลิง+ไฟฉุกเฉินแบบสแกน QR รายถัง ❌ ทั้งก้อน, (4) coliform 3 รายการที่ `food.lab_test` รองรับแบบ generic แต่ขาด flow เก็บ→ผลสองจังหวะ, (5) ระบบ PDF รายงาน (ทส.1/ทส.2/รายเดือน) + แจ้งเตือน Telegram ซึ่งเป็น **การตัดสินใจเปิดของเจ้าของ ไม่ใช่งานที่วางแผนไว้แล้ว** (การตัดสินใจ 001C "not-planned" เมื่อ 12 พ.ย. 2569 ใน epic #110 ครอบคลุมเฉพาะ /flow story export ไม่ใช่รายงานปฏิบัติงาน) แผนแบ่ง 5 เฟส ~25 lanes โดย Phase 1–3 ทำได้ทันทีตาม governance, Phase 4 ต้องรอ owner decision, Phase 5 คือคัทโอเวอร์แบบ dual-run

---

## 3. Parity Matrix (37 ตาราง)

วิธีทำ: parse snapshot JSON ด้วย python3 (ตาราง/คอลัมน์/สูตร verbatim) เทียบกับ `reports/schema-snapshot-live.md`
(33 ตาราง Supabase) + routes ใน `frontend/src/App.tsx` (28 routes) + หน้าจอ 9 domains
(wastewater/chemical/water-supply/fuel/garden/garbage/safety/food/building)
การตัดสิน ✅/🟡 ใช้ทั้ง schema และ "ฟอร์ม/โดเมนที่ implement จริงในหน้าเว็บ"

### 3.1 ตารางกลุ่มบ่อบำบัดน้ำเสีย (รายวัน)

| ตาราง AppSheet (คอลัมน์/สูตร) | ENV ปัจจุบัน | สถานะ | หมายเหตุ schema diff |
|---|---|---|---|
| **ข้อมูลคุณภาพน้ำ** (80 cols, 65 สูตร — ตารางหัวใจของงานรายวัน) | `wastewater.reading` (40 cols) + `v_reading_with_computed` + `/form` `DailyFormPage` + `/readings` | 🟡 | ครอบคลุม: TDS-1/2, Temp, pH, DO-1/2/3, SV30, Free Chlorine, สี/กลิ่น, สถานะเครื่องจักร 10 ช่อง (boolean), มิเตอร์สูบ 1/2, น้ำเข้า/ใช้, ระบาย, คลอรีนใช้, ตะกอนเกิน, หมายเหตุ **ขาด:** `คลอรีนน้ำที่ใช้จริง` (แบ่งตามอัตราส่วน), `อัตราส่วนผสม` เป็น input, สูตรสายมิเตอร์ไฟ (`เลขมิเตอร์วันนี้`/`เมื่อวาน`/delta), `คำนวณสูบ 1/2` (×34/×12), Critical-* 8 คอลัมน์, `AVG_Westwater`, `Chlorine_StreakCount`, ภาพประกอบ (Show/GDrive thumbnails), ช่อง enum `ตะกอนส่วนเกินที่นำไปกำจัด` เป็นตัวเลขใน ENV แล้ว |
| **Filter_Water** (69 cols, 55 สูตร — ตัวสร้างรายงาน ทส.1/ทส.2 + BI) | `/reports` `ReportsPage` + `/trends` + `/carbon` + `v_monthly_summary`/`v_overview_carbon` | 🟡 | ยอดรวมช่วงวัน (sum_energy/water/wastewater/chlorine/sludge) = SQL views ครอบแล้ว; กราฟ 12 เดือน (VC_CY_01..12 + QuickChart URL) = Recharts ในเครื่องแทน; CO2 ×0.4999 = `carbon.v_overview_carbon` (factor เดียวกัน); **ขาด:** PDF ทส.1/ทส.2 + ลิงก์ไฟล์ (→ Phase 4 owner gate) |
| **last meter** (4 cols, 1 Spreadsheet formula INDEX/MATCH 143^143) | `carbon.reading` ORDER BY reading_date DESC | ✅ | เทคนิคสเปรดชีตไม่ต้องย้ายมา — คิวรีล่าสุดตามวันที่แทน |
| **คู่มือ** (5 cols — PDF คู่มืองานบ่อบำบัด) | `core.attachment` (generic) / `RegulationsPage` ไม่ใช่คู่มือ | ❌ | ขาด "ชั้นหนังสือคู่มือ" ในแอป (รายการ+รูป+ไฟล์) — Phase 3 |
| **menu ระบบบ่อบำบัด** (5 cols, 1 สูตร) | AppShell nav | ⏭️ | ตารางเมนู (gallery) ไม่มีข้อมูลปฏิบัติงาน |
| **หน้าหลัก** (7 cols — หน้า home รูปภาพ+actions นำทาง) | `/` `OverviewPage` + AppShell | ⏭️ | ตารางเมนู/หน้า home ไม่มีข้อมูล (มีเพียง `uniqueid()`) |

### 3.2 ตารางกลุ่มน้ำประปา (รายวัน)

| ตาราง | ENV | สถานะ | diff |
|---|---|---|---|
| **น้ำประปา** (22 cols, 21 สูตร — ใช้น้ำ/ไฟ/คลอรีนโรงจ่ายรายวัน) | `water_supply.daily_check` (15 cols) + `/water-supply` | 🟡 | ENV มีแต่ **คุณภาพน้ำ** (pH, Residual Cl, Turbidity, Coliform, Fe/Mn, ความกระด้าง, TDS) — ตรงกับคอลัมน์ `Residual Free Chlorine`/`TDS` ของ AppSheet **ขาดทั้งก้อนใช้งานประจำวัน:** `activity` (ลงข้อมูลการใช้น้ำประจำวัน / ฟรีคลอรีน-TDS), `Hour_meter`+`last_Hour_meter`+`Hour_Work`, `Energy_use` (×3.7), `Water_In` (fallback Hour_Work×8), `Chlorine usage`/`Chlorine_usage_realy` (÷10), `สถานที่`, `ชนิดเครื่องมือตรวจ`→Items |
| **tap water_Filter** (21 cols, 19 สูตร — สรุปช่วงวันน้ำประปา + PDF) | `/water-supply` + `/reports` | 🟡 | ยอดรวม (Sum_water_in/Chlorine/Energy, Kg_chlorine ×1.2) คำนวณได้จาก SQL เมื่อมีข้อมูลรายวัน (ผุดจากตารางน้ำประปา) **ขาด:** PDF น้ำประปา (Phase 4) |
| **Menu ประปา** (6 cols) | AppShell nav | ⏭️ | เมนู gallery |
| **คู่มือน้ำประปา** (5 cols) | — | ❌ | เช่นเดียวกับ คู่มือ — Phase 3 |

### 3.3 ตารางกลุ่ม coliform / สุขาภิบาลอาหาร (รายคาบ)

| ตาราง | ENV | สถานะ | diff |
|---|---|---|---|
| **coliform bac.** (8 cols — เก็บตัวอย่างทั่วไป + ผู้รายงาน) | `food.lab_test` (15 cols) + `/food` | 🟡 | `food.lab_test` มี sample_date/result_date/sample_type/test_type/result/mpn_value/sample_point/technician/reported_by_lab_tech/follow_up_action — รองรับ generic แต่ **ขาด:** flow สองจังหวะ (result_date + Result แสดงเมื่อ TODAY()>Collect_date + Suggested values +1/+2 วัน), enum จุดเก็บตัวอย่าง (`สานถานที่เก็บตัวอย่าง`), ภาพผลตรวจต่อรายการ, อุปกรณ์→Items |
| **coliform bac._Water** (8 cols — น้ำแหล่งต่างๆ) | `food.lab_test` (sample_point) | 🟡 | เช่นเดียวกัน; `อุปกรณ์` default `aca317bf` → ต้องมี Items master ก่อน |
| **coliform bac. Food.** (11 cols — อาหาร/ภาชนะ) | `food.lab_test` | 🟡 | มี mpn/result/reagent; **ขาด** `ผู้เก็บตัวอย่าง`+`ผู้รายงาน` แยกกัน (มี technician ตัวเดียว), flow สองจังหวะ, `อุปกรณ์ (List)` เลือกตามจุดเก็บ |
| **coliform bac. Employee** (10 cols — ป้ายมือพนักงาน) | `food.lab_test` (sample_type='employee swab') | 🟡 | **ขาด** `sample`→Ref ข้อมูลผู้ปฏิบัติงาน (ต้อง FK ไป personnel), flow สองจังหวะ |
| **Filter_ColiformBac** (8 cols — รายงานช่วงวัน coliform) | `/food` + `/reports` | 🟡 | รายงานช่วงวันทำได้ด้วย query; PDF = Phase 4 |
| **menu_สุขาภิบาลอาหาร** (5 cols) | AppShell nav | ⏭️ | เมนู |

### 3.4 ตารางกลุ่มถังดับเพลิง (รายเดือน)

| ตาราง | ENV | สถานะ | diff |
|---|---|---|---|
| **ข้อมูลถังดับเพลิง** (9 cols — master ถัง: Location, ประเภท, รูป, QR (api.qrserver), วันบรรจุ, วันหมดอายุ, ขนาดบรรจุ) | `core.equipment` (code/name/location ล้วน) | ❌ | ไม่มีตารางสินทรัพย์ถังดับเพลิง (ครบชุด QR/วันหมดอายุ/ขนาด) — ต้องสร้างใหม่ Phase 2 |
| **ตรวจสอบถัง** (27 cols, 25 สูตร — ตรวจรายถังด้วยสแกน QR: auto-fill จาก master, pipe/handle/tank/pressure_gauge/barrier, breakdown auto หมดอายุ, รูปชำรุด, re_check) | `safety.monthly_check` (นับรวมรายเดือน ไม่ใช่รายถัง) + `building.inspection_round` (generic) | ❌ | ไม่มี flow สแกน QR รายถัง, auto-fill, auto expiry check (`breakdown_details`), bot `Update_ExpDate` — Phase 2 หัวใจ |
| **Filter_Firer** (24 cols, 19 สูตร — สรุปผลตรวจถังช่วงวัน + นับปกติ/ผิดปกติ + PDF) | query จากตารางใหม่ Phase 2 | 🟡 | นับสรุปทำได้เมื่อมีข้อมูลรายถัง; PDF+Telegram = Phase 4 |
| **Menu_Firer** (5 cols) | AppShell nav | ⏭️ | เมนู |

### 3.5 ตารางกลุ่มไฟฉุกเฉิน (รายเดือน)

| ตาราง | ENV | สถานะ | diff |
|---|---|---|---|
| **Emergency light** (8 cols — master ไฟฉุกเฉิน: ERL_ID, QR, location, ชั้น, ผู้ให้บริการ) | — | ❌ | ไม่มี master ไฟฉุกเฉิน — Phase 2 |
| **Check** (14 cols, 13 สูตร — ตรวจรายจุดสแกน QR: Persistency/Position/test_result/Broken_detail/Pic/Status + Auditor) | `safety.monthly_check` (boolean รวม) | ❌ | ไม่มี flow สแกน QR รายจุด — Phase 2 |
| **Filter_Light** (26 cols, 19 สูตร — สรุปนับ + PDF ไฟฉุกเฉิน) | query จากตารางใหม่ | 🟡 | เช่นเดียวกับ Filter_Firer |
| **ER_light_Menu** (5 cols) | AppShell nav | ⏭️ | เมนู |

### 3.6 ตารางกลุ่มงานสนับสนุน / อื่นๆ

| ตาราง | ENV | สถานะ | diff |
|---|---|---|---|
| **ข้อมูลผู้ปฏิบัติงาน** (21 cols, 14 สูตร — บุคลากร + 12 REF_ROWS) | `core.personnel` (9 แถว) + `core.app_user` (email→role) | ✅ | ครบชื่อ/เล่น/ตำแหน่ง/เบอร์/รูป/สถานะ + ความสัมพันธ์ทำด้วย FK ต่างจาก REF_ROWS; **ต่าง:** enum ตำแหน่ง/สถานะยังเป็น free text, สูตร avatar-จากคำนำหน้าชื่อ → ไม่ทำซ้ำ (§4.2) |
| **location_area** (5 cols — จุดงานพร้อม QR id) | `core.location` (code/qr_code/area_name/พิกัด) + `core.location_category` | ✅ | โครงสร้างครอบ; ยังต้อง seed ข้อมูลจุดงานจริงตอนทำ job |
| **job** (19 cols, 18 สูตร — บันทึกงานสแกน QR + geofence ≤0.7 กม. + ภาพ + issue) | `building.inspection_round` (round_type/checklist/photos/severity/assigned_to) | 🟡 | โครงใกล้กันแต่ **ขาด:** สแกน QR→location_name, geofence `distance()` 2 ชั้น, `working` EnumList, ผู้ปฏิบัติ→practician Ref, End_date — Phase 3 |
| **Inventory** (13 cols, 5 สูตร — คลังวัสดุ/คลอรีน + Lot/EXP) | `chemical.master`+`chemical.movement` (balance_after) + `/chemical` | 🟡 | ENV ดีกว่า (ledger มี balance) แต่ยังไม่ผูก `Item ID`/`LotNo`/`MFG/EXP` ครบ + ขาดคอลัมน์ lookup คลอรีนล่าสุด (ทำด้วย query) |
| **Items** (20 cols, 5 สูตร — master เครื่องมือ/วัสดุ + Vendor + คู่มือไฟล์ + min/max) | `core.equipment` (เครื่องจักร 10) + `chemical.master` (สาร) | ❌ | ไม่มี master "อุปกรณ์ทดสอบ/วัสดุสิ้นเปลือง" (เช่น เครื่องวัดคลอรีน `aca317bf`/`2fe4aa7c`/`cf9a417e`/`6aa9cc77`) — Phase 3 |
| **Categories** (4 cols — หมวดสินค้า + ไอคอน) | `core.location_category` (ทำที่ตั้งเท่านั้น) | ❌ | หมวดของ Items — มาพร้อมกัน Phase 3 |
| **Vendors** (9 cols — ผู้ขาย + Related Items) | supplier เป็น free text ใน `chemical.movement`/`fuel.dispense_log` | ❌ | ไม่มี master ผู้ขาย — Phase 3 |
| **distributor** (8 cols — ตัวแทนจำหน่าย: email/address/tel/line) | — | ❌ | รวมกับ Vendors lane ได้ — Phase 3 |
| **maintenance** (7 cols — สอบเทียบ: InventoryID, Cal_date/method/result) | `core.repair_request` (ซ่อม ไม่ใช่สอบเทียบ) | ❌ | ตารางสอบเทียบเครื่องมือ — Phase 3 |
| **address** (8 cols — ที่อยู่ ตำบล/อำเภอ/จังหวัด สำหรับหัวรายงาน ทส.) | — | ❌ | ข้อมูลอ้างอิงคงที่ ~1 แถว; ENV hardcode ในเทมเพลตได้ — ตัดสินใจตอนทำ PDF (Phase 4) ว่าจะ seed ตารางหรือ config |
| **รูปหน้าซักประวัติ / เก็บรูป** (3 cols ตารางละ) | `core.attachment` + `/attachments` | ⏭️ | ที่เก็บรูปทั่วไป — ENV มี attachment ครอบอยู่แล้ว |
| **Numbers** (2 cols — ว่าง, ไม่มีสูตร) | — | ⏭️ | ตารางระบบว่างไม่มีบทบาท |

### 3.7 สรุปนับ (per กลุ่มโดเมน)

| กลุ่ม | ✅ | 🟡 | ❌ | ⏭️ |
|---|---|---|---|---|
| บ่อบำบัดน้ำเสีย (6 ตาราง) | 1 (last meter) | 2 (ข้อมูลคุณภาพน้ำ, Filter_Water) | 1 (คู่มือ) | 2 |
| น้ำประปา (4) | 0 | 2 (น้ำประปา, tap water_Filter) | 1 (คู่มือน้ำประปา) | 1 |
| Coliform/สุขาภิบาลอาหาร (6) | 0 | 5 (coliform ×4, Filter_ColiformBac) | 0 | 1 |
| ถังดับเพลิง (4) | 0 | 1 (Filter_Firer) | 2 (ข้อมูลถัง, ตรวจสอบถัง) | 1 |
| ไฟฉุกเฉิน (4) | 0 | 1 (Filter_Light) | 2 (Emergency light, Check) | 1 |
| งานสนับสนุน (6) | 2 (ข้อมูลผู้ปฏิบัติงาน, location_area) | 1 (job) | 1 (Items) | 2 |
| คลัง/จัดซื้อ (5) | 0 | 1 (Inventory) | 4 (Categories, Vendors, distributor, maintenance) | 0 |
| อื่นๆ (2) | 0 | 0 | 1 (address) | 1 (Numbers) |
| **รวม 37** | **3** | **13** | **12** | **9** |

---

## 4. Computation Parity Spec (คอลัมน์คำนวณที่ใช้ประจำวัน)

รหัสสถานะ: **AS-IS** = ทำซ้ำตรงความหมาย · **DIVERGE** = ทำซ้ำแบบเบี่ยงเบน (ใส่เหตุผล) · **NO-REPLICATE** = ไม่ทำซ้ำ (ใส่เหตุผล + ทางเลือกตรงสัจจะ)

### 4.1 ตาราง `ข้อมูลคุณภาพน้ำ` (อ้างอิง §3.3 ของ reference doc, snapshot `tables.ข้อมูลคุณภาพน้ำ`)

| คอลัมน์ AppSheet | สูตร verbatim (ย่อ) | สถานะ | ข้อกำหนด ENV |
|---|---|---|---|
| `เลขมิเตอร์เมื่อวาน` | `MAX(SELECT(…[เลขมิเตอร์วันนี้], TRUE))` | **DIVERGE** | AppSheet ใช้ MAX ทั้งตาราง (แถวย้อนหลังแก้วันได้ → อาจดึงค่าอนาคต) ENV ใช้ `LAG(meter) OVER (ORDER BY reading_date)` ต่อมิเตอร์ — deterministic ตามวันที่จริง |
| `test_ดึงข้อมูลมิเตอร์วันก่อนหน้า` | `MAX(SELECT(…, [วันที่ บันทึก] < [_THISROW]))` | **AS-IS** | SQL `LAG` แบบมีเงื่อนไขวันที่น้อยกว่าแถวปัจจุบัน (กันวันซ้ำ) — ใน `v_reading_with_computed` |
| `ปริมาณการใช้ไฟฟ้าขอระบบ` (delta) | `มิเตอร์วันนี้ − เมื่อวาน` เป็นค่าว่างถ้า ≤0 + Valid If >0 | **AS-IS** | พฤติกรรม "delta ≤0 → ค่าว่าง" ตรงหลัก unknown ≠ zero — คำนวณใน view, ENV มี `carbon.reading.consumption` คู่ขนานผ่าน `carbon_reading_id`; ต้องระบุว่ามิเตอร์ไฟฝึกบ่อบำบัด = `carbon.meter` ตัวไหน (seed) |
| `last_meter_สูบ1/2` + `คำนวณสูบ 1` (×34) + `คำนวณสูบ 2` (×12) | `(มิเตอร์สูบ − last) × 34 / × 12` | **AS-IS** | ENV มี `pump1_consumption`/`pump2_consumption` ใน `v_reading_detail` แล้ว — **ต้องตรวจ factor 34/12 ให้ตรง** (ค่าคงที่โดเมน: ลิตร/รอบ → m³) เก็บเป็น config มีชื่อ ไม่ฝังเลขมั่วใน SQL |
| `ปริมาณน้ำเสียที่เข้าระบบบำบัด` | `คำนวณสูบ1+คำนวณสูบ2` ไม่งั้นใส่ข้อความ "อย่าลืมใส่เลขมิเตอร์บ่อสูบนะจ๊ะ" | **DIVERGE** | คอลัมน์ตัวเลขห้ามใส่ข้อความ — ENV: คำนวณจากสองมิเตอร์สูบ, กรณีไม่มีมิเตอร์ → **ค่าว่าง + validation ในฟอร์มเตือนผู้บันทึก** (ไม่ coerce) |
| `ปริมาณน้ำที่ใช้ในทุกกิจกรรม` | `if(ISBLANK(LOOKUP(วันที่→น้ำประปา.Water_In)), 60, LOOKUP(...))` | **NO-REPLICATE** | **fallback 60 m³ ละเมิดหลัก unknown ≠ zero** (ค่าขึ้นดุลย์) ทางเลือกตรงสัจจะ: join `น้ำประปา.Water_In` ตามวันที่ ถ้าไม่มีแถว → ค่าว่าง + ธง "วันนี้ยังไม่มีบันทึกน้ำประปา" ในฟอร์ม/UI — ห้ามเติม 60 |
| `คลอรีนน้ำที่ใช้จริง` | Spreadsheet `ArrayFormula` = `คลอรีนน้ำ ที่ใช้ / ratio (1:2→2, 1:4→4, 1:9→9)` | **AS-IS** | ย้ายเป็นคอลัมน์คำนวณใน view (ห้ามคงเป็นสูตรสเปรดชีต); ใช้ `อัตราส่วนผสม` (Enum 1:2/1:4/1:9 — เพิ่มคอลัมน์ input นี้ใน ENV) — สอดคล้องการตัดสินใจเดิมของ MIGRATION.md ที่ `chlorine_used` มาจากค่าจริง |
| `Critical-DO-1/2/3`, `Critical-FreeChlorine-Lowerlow/HigherHigh`, `TDS2 critical`, `pH Critical` | นับค่าเกินเกณฑ์ (DO<1/<1/<1.5, Cl<0.5/>1, TDS>1000, pH>9/<4) ต่อเนื่องใน 2 วันก่อนหน้า | **DIVERGE** | ทำเป็น SQL window/LAG 2 วันก่อนหน้า → ป้อน `wastewater.threshold` + `threshold_alert` (มีตารางแล้ว 0 แถว) — แทนได้ทั้ง format rule และครึ่งหนึ่งของ bots แจ้งเตือน |
| `Chlorine_StreakCount` | นับวันต่อเนื่อง Cl<0.5 นับจากวันผ่านล่าสุด | **DIVERGE** | gaps-and-islands SQL (หรือคิวรีฝั่งแอป) — ไม่เก็บเป็นคอลัมน์รายแถว |
| `AVG_Westwater` | `AVERAGE(… วันที่ −3..วันนี้)` | **AS-IS** | window average 4 วันล่าสุดใน view |
| `sum_energy/water/wastewater/chlorine` | `SUM(ทั้งตาราง)` ฝังทุกแถว | **DIVERGE** | อย่าทำ "คอลัมน์ sum ทั้งตาราง" ทุกแถว — ย้ายไป `/reports` คิวรีตอนต้องใช้ |
| `ชื่อเล่น/ชื่อ-สกุล ผู้บันทึก`, `mount_thai/Year_thai/Date_thai` | `[Ref].[field]`, `SWITCH(MONTH)+543` | **AS-IS** | join personnel + util แสดงวันที่ พ.ศ. (มี `date_thai_be` ใน view แล้ว) — ที่ UI เท่านั้น |
| `ผู้บันทึก` Initial value | `SWITCH(USEREMAIL(), email→Employee_id…, "READ_ONLY")` | **AS-IS** | ENV มีสถาปัตยกรรมแล้ว: `auth.users` → `core.app_user` (employee_id) → `reported_by`; READ_ONLY ≈ role `pending` |
| 8 × `*_Photo/Show` (thumbnail จาก Drive ID คงที่) | URL รูปช่วยสอนในฟอร์ม | **DIVERGE** | เปลี่ยนเป็นรูป static ใน repo/Supabase Storage (อ้างแบบ internal) — ไม่พึ่ง GDrive file id ภายนอก |
| `C_location/uthai_location/distacne` | `here()`, `LATLONG(14.361183,100.645474)`, `distance()` | **DIVERGE** | ENV ยังไม่จำเป็นต้อง geofence งานบ่อบำบัด — ตัดสินใจตอนทำ job (Phase 3) ใช้ระยะแบบ haversine ฝั่ง server |

### 4.2 อื่นๆ ที่ต้องตัดสินชัดเจน

| รายการ | ตาราง | สถานะ | เหตุผล/ข้อกำหนด |
|---|---|---|---|
| **สูตร avatar ตามคำนำหน้าชื่อ** (`IF(CONTAINS([ชื่อ-สกุล],"นาย")…→ URL Drive)` | ข้อมูลผู้ปฏิบัติงาน.รูปภาพ | **NO-REPLICATE** | อนุมานเพศจากคำนำหน้า = เปราะ + ฝัง Drive id ภายนอก; ENV ใช้ `core.personnel.photo_path` upload จริงต่อคน |
| **Water_In fallback** `IF(ISBLANK(ชนิดเครื่องมือตรวจ), Hour_Work×8, "")` | น้ำประปา | **DIVERGE** | ประมาณจากชั่วโมงปั๊ม ×8 m³/h — ใช้ได้แต่ต้อง **ติดธง input_source='estimate'** บนแถว/ค่า (แสดง "ประมาณจากชั่วโมงปั๊ม") ไม่แอบอ้างเป็นค่าวัด |
| **Energy_use** `(Hour_meter−last)×3.7` clamp <0→0 | น้ำประปา | **DIVERGE** | เก็บ factor 3.7 kW เป็น config; clamp-to-0 กลืนกรณีมิเตอร์รีเซ็ต → ค่าว่าง+ธง ดีกว่า 0 |
| **Chlorine_usage_realy** = `Chlorine usage ÷10` | น้ำประปา | **AS-IS** | ตัวหารเจือจาง — เก็บ config มีชื่อ |
| **QR image** `https://api.qrserver.com/…` (ถังดับเพลิง, Emergency light) | 2 ตาราง | **DIVERGE** | สร้าง QR ฝั่ง server ตอนสร้าง record เก็บใน Storage — ไม่พึ่งบริการภายนอกต่อการ render |
| **ตรวจสอบถัง auto-fill** (`SELECT(ข้อมูลถังดับเพลิง…QR_CODE)`) + `breakdown_details` = `IF(chem_exp<=Date,"หมดอายุ","ไม่หมดอายุ")` | ตรวจสอบถัง | **AS-IS** | RPC/trigger ฝั่ง DB: สแกน → auto-fill master fields; สถานะหมดอายุคำนวณตอนบันทึก (เก็บเป็น snapshot ของวันตรวจ) |
| **Bot Update_ExpDate** (อัปเดตวันหมดอายุ master ถ้าวันหมดอายุใหม่มากกว่า) | ตรวจสอบถัง | **AS-IS** | trigger UPDATE master เมื่อตรวจเติมเคมใหม่ |
| **job geofence** `distance([uthai_locate],[location])<=0.7` + Valid If 2 ชั้น | job | **DIVERGE** | haversine/PostGIS ฝั่ง server (≤0.7 กม. ตรวจงาน, ≤2 กม. รับค่า) — จดบันทึกว่า GPS spoof เป็นความเสี่ยงคงเหลือ |
| **End_date** = `Date_time+"000:05:00"` | job | **NO-REPLICATE** | สมมติ "งานจบใน 5 ชั่วโมง" ขึ้นดุลย์ — ทางเลือก: ให้ผู้ปฏิบัติปิดงานจริง (end timestamp) หรือไม่เก็บ |
| **Inventory Chlorine_realyDiv10/Div4** | Inventory | **AS-IS** | คิวรี "ค่าใช้คลอรีนล่าสุดของวัน" — ไม่ต้องเก็บซ้ำ |
| **Filter_Water VC_CY_01..12 + QuickChart + Total_CO2 ×0.4999** | Filter_Water | **DIVERGE** | กราฟในเครื่อง (Recharts `/trends`) + `carbon.v_monthly_co2e` ด้วย `carbon.emission_factor` (factor 0.4999 ตรง `v_overview_carbon` อยู่แล้ว) — ตัด QuickChart URL ทิ้ง |
| **Valid If role-filter** (`SELECT(ข้อมูลผู้ปฏิบัติงาน… ตำแหน่ง/สถานะ)`) | หลายตาราง | **AS-IS** | RLS + dropdown กรองจาก personnel (ตำแหน่ง/สถานะ enum ต้องเป็น enum จริงก่อน — เก็บเป็น CHECK/enum type) |

---

## 5. Automation Parity (bots 22 ตัว) และการตัดสินใจเปิดของเจ้าของ

อ้างอิง reference doc §9 (verbatim) + snapshot `bots` — ENV ปัจจุบัน: `wastewater.threshold_alert`/`v_pending_threshold_alerts` (0 แถว) ออกแบบไว้แทน bots แจ้งเตือนค่าผิดปกติ แต่ยังไม่มี dispatcher และไม่มีช่องทางแจ้ง (Telegram/LINE/Email) · `core.pdf_template` + `/pdf-designer` (admin-only) วางโครง PDF ไว้แล้ว ยังไม่มีเทมเพลต ทส.1/ทส.2

### 5.1 สรุป bots ตามหน้าที่

| กลุ่ม | Bots | สิ่งที่ทำ | ENV gap |
|---|---|---|---|
| **สร้าง PDF + Telegram** (6) | `กดสร้าง PDF` (Filter_Firer→PDFถังดับเพลิง), `สร้าง PDF ไฟฉุกเฉิน` (Filter_Light), `PDF 2` ทส.2, `PDF` ทส.1 (+Telegram Chart), `(disabled) PDF1.1`, `กดสร้าง PDF 2` (PDFน้ำประปา) | trigger จากคอลัมน์ Trigger_PDF/Export PDF → สร้าง PDF A4 ลง Drive + ยิง Telegram webhook | ไม่มีทั้งระบบ — **OPEN OWNER DECISION** (§5.3) ก่อน Phase 4 |
| **แจ้งเตือนค่าผิดปกติ Telegram/LINE** (10) | `Telegram_noti` (ทุกบันทึก), `water_overload` (>70 m³), `Signal_notice` (หมายเหตุ≠"") , `Do1_Notice`/`Do3_Notice`, `SV30_Notice` (>450/<150), `chlorine_Notice`, `TDS_Notice`, `pH_Notice` (2 ตัวนี้ event ว่าง = เสีย/ไม่ได้ตั้ง) | webhook → Telegram | ครึ่งหนึ่งครอบด้วย threshold/threshold_alert (เกณฑ์ DO/Cl/SV30/TDS/pH + >70) — **ขาดช่องทางส่งออก** = owner decision; เกณฑ์ SV30 >450/<150 ยังไม่อยู่ใน `wastewater.threshold` (seed ได้ทันที Phase 1) |
| **Alert แบบ script (ปิดใช้งาน)** (2) | `(disabled) Line AS record`, `(disabled) Line AS record 3` (รวมเงื่อนไขผิดปกติหลายค่า) | Apps Script | เสียอยู่แล้วใน AppSheet — ไม่ย้าย ยกเว้นเจ้าของขอ (รวมใน owner decision เรื่องช่องทางแจ้ง) |
| **Data-action** (3) | `Update_ExpDate` (ตรวจถัง→อัปเดต master), `(disabled) Auto Deduct Chlorine Stock`, + action `Deduct Chlorine Stock` (Inventory) | อัปเดตวันหมดอายุ / หัคลอรีนจากสต๊อก | Update_ExpDate = trigger ทำได้ Phase 2; หัสต๊อก = `chemical.movement` direction='out' อัตโนมัติเมื่อบันทึกวัน (ทำได้, จะระบุใน Phase 1 lane) |
| **Script งานสวน** (1) | `งานสวน` (job → Garden_Step script) | Apps Script | ขาดบทบาทชัด — จัดอยู่ owner decision เรื่อง script เอง (ผลงานยังไม่เห็นจาก snapshot) |

### 5.2 Format rules (12) — ไม่ใช่ bot แต่ผูกกับ UI

- `free chlorine`: **ค่าคลอรีนอิสระ >2.5 → แดง + ไอคอนเตือน** — ENV: `flag_free_chlorine` มีใน `v_reading_detail` (เกณฑ์ต้องเทียบ >2.5 ให้ตรง) + สีในหน้า list/reading — Phase 1
- `fire Rule/2` (Filter_Firer ตัวเลือก ปกติ/ผิดปกติ + ไอคอน), `re_check 1–9` (สี/ไอคอนลำดับรายการตรวจถัง) — Phase 2 (UI แสดงผล)

### 5.3 ⚠️ OPEN OWNER DECISIONS (ต้องตัดสินใจก่อนเข้า Phase 4)

1. **รายงาน PDF ปฏิบัติงาน (ทส.1 / ทส.2 / รายงานถังดับเพลิง / รายงานไฟฉุกเฉิน / รายงานน้ำประปา)** — การตัดสินใจ 001C "not-planned" (epic #110, ปิด 12 พ.ย. 2569 ผ่าน D5 joint decision 2026-11-08) ครอบคลุม **เฉพาะ /flow story export** — ไม่เคยตัดสินเรื่องรายงานปฏิบัติงาน → **ห้ามวางแผนล่วงหน้าว่าจะทำแน่นอน** ต้องขอคำตัดสินใจ: ทำ/ไม่ทำ/ทำแบบไหน (จาก `core.pdf_template` ที่วางไว้ หรือ export เอกสารราชการภายนอก)
2. **ช่องทางแจ้งเตือน (Telegram/LINE/Email)** — bots เดิมยิง webhook ส่วนตัว; ENV ต้องตัดสินว่าจะแจ้งผ่านช่องทางใด ใครเป็นผู้รับ และเก็บ secret อย่างไร (ห้ามฝัง webhook token ใน repo)
3. **หักสต๊อกคลอรีนอัตโนมัติ** — ปิดอยู่ใน AppSheet เอง; ยืนยันว่าจะเปิดหรือปล่อย manual ผ่าน `/chemical`
4. **ตาราง address** (หัวรายงาน ทส.) — seed เป็นตาราง/config หรือ hardcode ในเทมเพลต

---

## 6. แผน 5 เฟส (แบ่ง lane ขนาด claim ตาม governance)

> กติกาทุก lane: WO เฉพาะ + claim transition ใน CURRENT-WORK.md + RED-first + รีวิวอิสระ exact-SHA + implementer ไม่ merge งานตัวเอง (Track Z = GLM lane สำหรับ lib/SQL/RLS/tests, Track F = Codex lane สำหรับ visual) · วันที่ทั้งหมดเป็น พ.ศ.

### Phase 1 — วิถีบันทึกประจำวัน (บ่อบำบัด + น้ำประปา ให้ parity เต็ม)

| Lane | เนื้อหา | ตาราง |
|---|---|---|
| P1.1 | Schema: เพิ่มคอลัมน์ ENV ฝั่งบ่อบำบัด (`อัตราส่วนผสม` enum, `คลอรีนน้ำที่ใช้จริง` derived, enum ล้างตะแกรง/สถานะเครื่องจักร map กับ boolean เดิม) + enum ตำแหน่ง/สถานะบุคลากร | `wastewater.reading`, `core.personnel` |
| P1.2 | SQL views สายมิเตอร์ (LAG เมื่อวาน/สูบ1-2, delta ไฟ, คำนวณสูบ ×34/×12 เป็น config, AVG 4 วัน, chlorine streak) — กฎ delta≤0→ค่าว่าง | `wastewater.v_reading_*` |
| P1.3 | Critical flags 2 วัน (DO/Cl/TDS/pH) → seed `wastewater.threshold` (รวม SV30 >450/<150, น้ำเข้า >70) + ยิง `threshold_alert` | `wastewater.threshold(+_alert)` |
| P1.4 | ฟอร์มบ่อบำบัด parity (ช่องที่ขาด + validation ทดแทน Valid If + เตือน "ยังไม่มีมิเตอร์สูบ/ยังไม่มีบันทึกน้ำประปา" — ห้าม fallback 60) + format rule Cl>2.5 | `/form` |
| P1.5 | Schema+ฟอร์ม น้ำประปา: activity enum, Hour_meter chain, Energy_use ×3.7 (ธง estimate), Water_In, Chlorine usage ÷10, คุณภาพน้ำตามเดิม | `water_supply.daily_check` |
| P1.6 | รายงานสรุปช่วงวัน (ทดแทน Filter_Water/tap water_Filter ฝั่งตัวเลข — PDF อยู่ Phase 4) | `/reports` |
| P1.7 | Tests + parity fixtures เทียบสูตร AppSheet (ตารางค่าคาดหวังจากสูตร verbatim) | tests |

- **ตารางที่แตะ:** 4 (wastewater.reading, water_supply.daily_check, wastewater.threshold(+alert), core.personnel) · **lane: 7** · **ความเสี่ยง: สูง** (โต๊ะทำงานหลักรายวัน + กฎ unknown ≠ zero ต้องไม่พลาด)
- **เปลี่ยนผ่านแล้ว (DoD เฟส):** ทุกช่องรายวันของ AppSheet มีทางเข้าใน ENV; สูตร delta/คลอรีน/Critical ได้ผลตรงตาม fixture ≥98% บนชุดทดสอบ; เจ้าของลองบันทึกจริง 1 สัปดาห์คู่ขนานได้

### Phase 2 — งานประจำเดือน/คาบ (ถังดับเพลิง, ไฟฉุกเฉิน, coliform)

| Lane | เนื้อหา |
|---|---|
| P2.1 | Schema สินทรัพย์: `safety.fire_extinguisher` (QR/วันบรรจุ/หมดอายุ/ขนาด/ประเภท) + `safety.emergency_light` (QR/ชั้น/ผู้ให้บริการ) — seed จาก Sheets |
| P2.2 | ตรวจรายถัง: `safety.extinguisher_inspection` — flow สแกน QR → auto-fill (RPC) + pipe/handle/tank/pressure/barrier + หมดอายุ auto + รูปชำรุด (attachment) + trigger Update_ExpDate |
| P2.3 | ตรวจไฟฉุกเฉิน: `safety.emergency_light_check` — Persistency/Position/test_result/Broken_detail/Pic/Status + สแกน QR |
| P2.4 | Coliform ×3 (น้ำ/อาหาร/พนักงาน): ขยาย `food.lab_test` (จุดเก็บ enum, ผู้เก็บ/ผู้รายงานแยก, FK อุปกรณ์→Items master เตรียม Phase 3, flow สองจังหวะ collect→result + suggested +1/+2 วัน) |
| P2.5 | รายงานสรุปรายเดือน/ช่วงวัน (นับปกติ/ผิดปกติถัง, ผ่าน/ไม่ผ่านไฟ, สรุป coliform) — ตัวเลขอย่างเดียว (PDF = Phase 4) |
| P2.6 | Tests + seed ข้อมูล master จาก Sheets + เชื่อม QR |

- **ตารางที่แตะ:** 6 ใหม่ + food.lab_test + core.attachment · **lane: 6** · **ความเสี่ยง: กลาง** (ไม่กระทบรายวัน แต่ QR/สแกน flow ใหม่ทั้งก้อน)
- **DoD เฟส:** ตรวจถัง/ไฟด้วยสแกน QR ได้ครบจุดที่ AppSheet ทำ; coliform เก็บ→กรอกผลสองจังหวะได้; สรุปรายเดือนตรงนิยาม Filter_Firer/Filter_Light

### Phase 3 — งานสนับสนุน (job, คลัง/จัดซื้อ, คู่มือ)

| Lane | เนื้อหา |
|---|---|
| P3.1 | Items/Vendors/distributor/Categories masters (`core.item`+`core.vendor`+category) + ผูก `ชนิดเครื่องมือตรวจ`/`อุปกรณ์` ที่ว่างจาก Phase 2 |
| P3.2 | Inventory: ผูก Lot/MFG/EXP + หักสต๊อกผ่าน `chemical.movement` (ทางเลือก auto ตาม owner decision §5.3-3) |
| P3.3 | maintenance/สอบเทียบ (`core.item_calibration` หรือตารางย่อย) |
| P3.4 | job: QR-scan + geofence ≤0.7 กม. (server haversine) + working EnumList + ภาพ — อาจขยาย `building.inspection_round` หรือแยก `core.job_log` (ตัดสินที่ WO) |
| P3.5 | คู่มือ ×2 (หมวดเอกสารในแอป: รายการ+ไฟล์+รูป) + address (config/seed ตาม owner decision §5.3-4) |
| P3.6 | Tests |

- **ตารางที่แตะ:** ~6 ใหม่/ขยาย · **lane: 6** · **ความเสี่ยง: ต่ำ–กลาง**
- **DoD เฟส:** ลง job ที่จุดงานด้วย QR+GPS ได้, master อุปกรณ์/ผู้ขาย/สอบเทียบ/คู่มือใช้งานจริงได้

### Phase 4 — ระบบอัตโนมัติ + BI (**ประตู owner decision — อย่าเริ่มก่อนได้คำตอบ §5.3**)

| Lane | เนื้อหา |
|---|---|
| P4.1 | (ถ้าเจ้าของอนุมัติ PDF) เทมเพลต ทส.1/ทส.2/ถังดับเพลิง/ไฟฉุกเฉิน/น้ำประปา บน `core.pdf_template` + ตัวสร้างฝั่ง server (header จาก address) |
| P4.2 | (ถ้าเจ้าของอนุมัติช่องทาง) dispatcher `threshold_alert` → Telegram/LINE/Email + นายหน้ารับ secret (env/secret store, ห้าม commit) |
| P4.3 | BI ในเครื่อง: กราฟ 12 เดือน (แทน QuickChart) + CO2 ปีนี้/ปีก่อน (มีอยู่บางส่วน — ต่อยอด) |
| P4.4 | งานตามเวลา (รายงานรายเดือนอัตโนมัติ) — เฉพาะเมื่อ P4.1/P4.2 อนุมัติ |

- **ตารางที่แตะ:** core.pdf_template + ระบบ dispatcher ใหม่ · **lane: 4 (มีเงื่อนไข)** · **ความเสี่ยง: สูง/ไม่แน่นอน** (ขึ้นกับ owner decision; ห้ามขยายขอบเขตเงียบ ๆ)
- **DoD เฟส:** เฉพาะชิ้นที่เจ้าของอนุมัติ — สร้าง PDF ตรงแบบที่ AppSheet เคยออก + แจ้งเตือนถึงมือผู้รับจริง

### Phase 5 — คัทโอเวอร์ (dual-run → เลิกใช้ AppSheet)

| Lane | เนื้อหา |
|---|---|
| P5.1 | โปรโตคอล dual-run: บันทึกสองระบบคู่ขนาน ≥14 วัน — คิวรีตรวจ parity รายวัน (จำนวนแถว/วัน, วันที่ตรงกัน, สุ่มตรวจรายการ ≥98% ค่าตรงกันทุกช่องที่ ENV ครอบ) — เขียนเป็น SQL สำเร็จรูป (count/date parity) |
| P5.2 | Backfill ประวัติที่เหลือจาก Sheets ก่อนตัดสลับ (§7) + ตรวจซ้ำหลังย้าย |
| P5.3 | พิธีเลิกใช้: checklist ปิดฟีเจอร์ AppSheet (ปิดการเขียน คงอ่านอย่างเดียว ≥90 วัน) + เกณฑ์ rollback + บันทึกการตัดสินใจของเจ้าของ |

- **ตารางที่แตะ:** ไม่เพิ่ม schema (ย้ายข้อมูล) · **lane: 3** · **ความเสี่ยง: กลาง**
- **DoD เฟส (นิยาม "เปลี่ยนผ่านสำเร็จ"):** (1) จำนวนบันทึก/วันของ ENV = AppSheet ทุกวันในช่วง dual-run, (2) สุ่มตรวจรายวัน ≥98% ตรง, (3) ประวัติที่ย้ายตรวจนับผ่าน, (4) เจ้าของยืนยันเป็นลายลักษณ์อักษรว่าเลิกบันทึกใน AppSheet, (5) AppSheet คงสิทธิ์อ่าน ≥90 วันเป็น rollback

---

## 7. ข้อสังเกตข้อมูลประวัติศาสตร์ (Cutover Data Note)

- **บ่อบำบัด: ย้ายแล้ว** — 907/907 แถว (5 ก.ค. 2569, MIGRATION.md) ใน `wastewater.reading`+`carbon.reading` (ผูก `carbon_reading_id`, legacy_id ครบ) — **ไม่ต้อง backfill ซ้ำ**
- **ต้อง backfill จาก Sheets ก่อนตัดสลับ** (เรียงตามเฟส): Phase 1 → ประวัติ `น้ำประปา` (Hour_meter/Water_In/Chlorine usage — มิฉะนั้นสาย delta ขาด), Phase 2 → master+ประวัติ `ข้อมูลถังดับเพลิง`/`ตรวจสอบถัง`/`Emergency light`/`Check`, coliform ×4, Phase 3 → `Items`/`Inventory`/`Vendors`/`distributor`/`maintenance`/`job`/`location_area` (จุดงาน), และเติม `core.personnel` ให้ครบชุดเดียวกับ `ข้อมูลผู้ปฏิบัติงาน` (ปัจจุบัน 9 คนเฉพาะผู้บันทึกน้ำเสีย)
- กฎการย้ายซ้ำเช่นเดิม: อ่านอย่างเดียวจาก export, อนุมานไม่ได้ → ค่าว่างคงค่าว่าง, ทุกรอบต้องมีรายงานนับเทียบก่อน/หลัง (ตามรอย MIGRATION Phase 2)

## 8. ความเสี่ยงหลัก (Key Risks)

| # | ความเสี่ยง | การรับมือ |
|---|---|---|
| 1 | **สูตร fallback ของ AppSheet ไม่ตรงสัจจะข้อมูล** (60 m³, clamp-to-0, End_date+5h, avatar-จากชื่อ) — ทำซ้ำตามจะทำให้ ENV โกหกข้อมูล | ใช้ตาราง §4 ผูกชัด: NO-REPLICATE ต้องมีทางเลือกตรงสัจจะ + ธง/ค่าว่าง; รีวิวทุก lane มี checklist unknown ≠ zero |
| 2 | **เจ้าของยังใช้ AppSheet จริงระหว่างพัฒนา** — ENV ช้ากว่า/ต่างพฤติกรรมเล็กน้อย = กลับไปใช้เก่าทันที | Phase 1 ต้อง parity เต็มก่อนขอให้เปลี่ยน; dual-run ให้เห็นความต่างอย่างเป็นระบบ |
| 3 | **ค่าคงที่โดเมนยังตรวจไม่ได้จาก snapshot** (×34/×12, ×3.7, ÷10, 0.4999) | ยืนยันกับเจ้าของ/เอกสารหน้างานก่อน merge (fixture ต้องมีตัวเลขจริงประกอบ) |
| 4 | **Phase 4 ล่อลวงขอบเขต** — อาจถูกเข้าใจว่า "วางแผนแล้วต้องทำ" ทั้งที่ 001C ครอบไม่ถึง | §5.3 ทำเป็นประตูชัดเจน; ไม่มี claim ใดเริ่ม P4 ได้ก่อนคำตัดสินเป็นลายลักษณ์ |
| 5 | **สแกน QR + geofence บนเว็บ (PWA)** ต่างจากมือถือ AppSheet | ทดสอบกับอุปกรณ์เจ้าของจริงใน Phase 2/3 (ตามแนว "ทดสอบเหมือนผู้ใช้จริง") |
| 6 | **ข้อมูลสองระบบเหลื่อมช่วง dual-run** (บันทึกลับ/ลืมฝั่งใด) | คิวรี parity รายวันใน P5.1 + ผู้รับผิดชอบตรวจทุกเช้าช่วง dual-run |
| 7 | **schema ชนกับ lane อื่น** (หลายตารางใหม่ใน safety/food) | หนึ่ง writer ต่อไฟล์/ตาราง ตาม claim; migration SQL ต้องผ่านรีวิว DB ก่อนรัน ( Supabase ENV_DB) |

---

## แหล่งอ้างอิง (Sources)

- `docs/ai/digital-twin/12-UTHAI-APPSHEET-DEFINITION-REFERENCE.md` — §2 สารบัญตาราง, §3 นิยามคอลัมน์/สูตร verbatim ต่อตาราง, §4 ความสัมพันธ์, §5 ข้อค้นพบ, §6 Slices, §7 Views (130), §8 Actions (161), §9 Bots (22), §10 Format Rules (12), §11 Sanitize
- Raw snapshot JSON `ActivatedSludge-29279640_AppSnapshot_2026-11-14_031004_998.json` (สำเนาอ่านอย่างเดียว, redact แล้ว) — แยกวิเคราะห์ด้วย python3: `tables` (37), `bots` (22), `formatRules` (12), `actions` (161), `slices` (10), `views` (130)
- `reports/schema-snapshot-live.md` — schema Supabase จริง (11 schemas, 33 ตาราง, RLS ทั้งหมด, introspected 3 ส.ค. 2569)
- `frontend/src/App.tsx` — routes 28 เส้น (9 โดเมน v2: /water-supply /garbage /fuel /garden /building /safety /food /chemical + /regulations /pdf-designer /attachments …)
- `frontend/src/lib/supabase-queries.ts` + `frontend/src/pages/*` — โดเมนที่ implement จริง
- `MIGRATION.md` — ประวัติย้าย 907/907 แถว (5 ก.ค. 2569) + การตัดสินใจ `chlorine_used`→`คลอรีนน้ำที่ใช้จริง`
- `docs/ai/CURRENT-WORK.md` — สถานะ 001C (epic #110): D5 joint decision 2026-11-08 + closeout 12 พ.ย. 2569 — 001C export เป็น "not-planned, needs substantive owner decision" (ครอบเฉพาะ /flow story export)
- `docs/ai/digital-twin/11-UTHAI-ACTIVATED-SLUDGE-PROCESS-KNOWLEDGE.md` — อ้างอิง topology กระบวนการเติมอากาศ (ใช้ตรวจความถูกค่าคงที่ ×34/×12 ใน Phase 1)
