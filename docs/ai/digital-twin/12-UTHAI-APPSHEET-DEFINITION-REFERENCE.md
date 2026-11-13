# 12 · อ้างอิงนิยามแอป AppSheet ต้นทาง — ActivatedSludge (โรงพยาบาลอุทัย)

> **สถานะ: SSoT สำหรับ "นิยามแอป AppSheet ต้นทาง"** ของระบบบำบัดน้ำเสีย/สาธารณสุขสิ่งแวดล้อม
> โรงพยาบาลอุทัย (แอป AppSheet `ActivatedSludge-29279640`) เอกสารนี้สร้างขึ้นจากไฟล์ snapshot
> ของเจ้าของแอปโดยตรง ทุกสูตรในเอกสารนี้คัดลอก **verbatim** โดยสคริปต์ Python (ไม่มีการถอดพิมพ์ด้วยมือ)

## 1. ที่มาและวิธีการ

| รายการ | ค่า |
|---|---|
| ไฟล์ snapshot | `ActivatedSludge-29279640_AppSnapshot_2026-11-14_031004_998.json` (Complete App Snapshot) |
| ผู้ส่งออก | เจ้าของแอป export ผ่าน AppSheet Toolkit (Chrome extension) วันที่ 14 พฤศจิกายน พ.ศ. 2569 |
| แอป | `ActivatedSludge-29279640` (title: `—`) เวอร์ชัน `3.001472` |
| schemaVersion | `appsheet-network-metadata/2` |
| adapterVersion | `0.7.0` |
| toolVersion | `2.1.0` |
| capturedAt | `2026-11-13T20:07:41.043Z` (14 พฤศจิกายน พ.ศ. 2569 เวลาไทย) |
| exportedAt | `2026-11-13T20:10:04.998Z` |
| captureSource | `hybrid` |

**วิธีการ (read-only):** ดึงไฟล์แบบอ่านอย่างเดียวจากโฟลเดอร์ Google Drive ที่เจ้าของแอปเปิดสิทธิ์สาธารณะไว้
(`fetched read-only from the owner's publicly-shared Drive folder`) — **ไม่มีการแก้ไขแอปต้นทางทุกกรณี**
และไม่มีการเขียนกลับไปยังโฟลเดอร์ Drive สคริปต์อ่าน JSON ด้วยโมดูล `json` ของ Python แล้วพิมพ์ Markdown
ออกมาทั้งหมดโดยโปรแกรม เพื่อรับประกันว่าสูตรทุกตัวตรงกับ snapshot ต้นฉบับแบบ verbatim

**ข้อควรรู้เรื่องข้อมูลในสูตร:** snapshot ต้นฉบับถูก adapter กรองข้อมูลส่วนบุคคลบางส่วนมาก่อนแล้ว
(placeholder `[REDACTED_EMAIL]` / `[REDACTED_SECRET]` คงอยู่ในสูตร verbatim) เอกสารนี้ sanitize ซ้ำเป็นชั้นที่สอง
ตามรายละเอียดในหมวด [11. บันทึกการ Sanitize](#11-บันทึกการ-sanitize) — ไม่มีข้อมูลผู้ป่วยในนิยามแอปชุดนี้

## 2. สารบัญตาราง (37 ตาราง)

จำนวนคอลัมน์ต่อตาราง, คอลัมน์ key, และจำนวนคอลัมน์ที่มีสูตรแยกตามชนิดหลัก
(App formula / Initial value / Valid If / Show If / Editable If / Required If / Spreadsheet formula).
ชนิดอื่นที่พบ (Invalid value error, Suggested values, Reset If, Max/Min, Content) แสดงในหมวดต่อตาราง

| ตาราง | คอลัมน์ | Key | App | Init | ValidIf | ShowIf | EditIf | ReqIf | Sheet | คอลัมน์มีสูตร |
|---|---|---|---|---|---|---|---|---|---|---|
| หน้าหลัก | 7 | id | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| ข้อมูลผู้ปฏิบัติงาน | 21 | Employee_id | 13 | 1 | 0 | 0 | 0 | 0 | 0 | 14 |
| ข้อมูลคุณภาพน้ำ | 80 | วันที่ บันทึก | 44 | 18 | 2 | 0 | 0 | 0 | 1 | 65 |
| menu ระบบบ่อบำบัด | 5 | name | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| last meter | 4 | _RowNumber | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| address | 8 | TambonID | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| Filter_Water | 69 | ID | 51 | 4 | 0 | 0 | 0 | 0 | 0 | 55 |
| น้ำประปา | 22 | Row ID | 11 | 7 | 3 | 7 | 0 | 0 | 0 | 21 |
| Menu ประปา | 6 | Row ID | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 2 |
| tap water_Filter | 21 | _ComputedKey | 13 | 6 | 0 | 0 | 0 | 0 | 0 | 19 |
| coliform bac. | 8 | Row ID | 1 | 3 | 1 | 0 | 0 | 0 | 0 | 5 |
| ข้อมูลถังดับเพลิง | 9 | Row ID | 1 | 3 | 0 | 0 | 0 | 0 | 0 | 4 |
| ตรวจสอบถัง | 27 | row_ID | 8 | 14 | 2 | 13 | 0 | 0 | 0 | 25 |
| รูปหน้าซักประวัติ | 3 | id | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| distributor | 8 | id | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| coliform bac._Water | 8 | Collect_Location | 0 | 4 | 1 | 0 | 0 | 0 | 0 | 5 |
| coliform bac. Food. | 11 | Row ID | 1 | 6 | 3 | 4 | 0 | 0 | 0 | 9 |
| menu_สุขาภิบาลอาหาร | 5 | name | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| coliform bac. Employee | 10 | Row ID | 0 | 6 | 4 | 4 | 0 | 0 | 0 | 9 |
| Filter_Firer | 24 | ID | 15 | 4 | 0 | 0 | 0 | 0 | 0 | 19 |
| Menu_Firer | 5 | name | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| คู่มือ | 5 | id | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| location_area | 5 | id | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 2 |
| job | 19 | ID | 11 | 5 | 4 | 3 | 0 | 1 | 0 | 18 |
| เก็บรูป | 3 | id | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| คู่มือน้ำประปา | 5 | Row ID | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| Categories | 4 | ID | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| Inventory | 13 | Inventory ID | 2 | 3 | 0 | 0 | 0 | 0 | 0 | 5 |
| Items | 20 | Item ID | 4 | 1 | 0 | 0 | 0 | 0 | 0 | 5 |
| maintenance | 7 | maintenanceID | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| Vendors | 9 | ID | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 2 |
| Emergency light | 8 | ERL_ID | 1 | 3 | 0 | 0 | 0 | 0 | 0 | 4 |
| Check | 14 | row_ID | 2 | 8 | 0 | 5 | 0 | 0 | 0 | 13 |
| ER_light_Menu | 5 | name | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| Filter_Light | 26 | ID | 15 | 4 | 0 | 0 | 0 | 0 | 0 | 19 |
| Numbers | 2 | Number | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Filter_ColiformBac | 8 | Row ID | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 4 |
| **รวม** | 514 | — | 201 | 115 | 20 | 36 | 0 | 1 | 2 | 338 |

## 3. นิยามคอลัมน์และสูตร verbatim ต่อตาราง

ทุกบล็อกโค้ดด้านล่างคือค่าจาก snapshot **verbatim** (ผ่านการ sanitize PII ตามหมวด 11 เท่านั้น)
ธงคอลัมน์: `Key` = primary key, `Label` = label column, `Virtual` = virtual column,
`System` = system column, `hidden` = Show? = false

### 3.1 ตาราง `หน้าหลัก` — 7 คอลัมน์ (key: id)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `0`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `id` | Number | Key hidden |
| `immage1` | Image | Label |
| `immage2` | Image | ReadOnly hidden |
| `immage3` | Text | ReadOnly hidden |
| `immage4` | Text | ReadOnly hidden |
| `immage5` | Text | ReadOnly hidden |

#### คอลัมน์ `id`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=uniqueid()
```

### 3.2 ตาราง `ข้อมูลผู้ปฏิบัติงาน` — 21 คอลัมน์ (key: Employee_id)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `Employee_id` | Text | Key |
| `ชื่อ-สกุล` | Text | Label |
| `ชื่อเล่น` | Text | — |
| `ตำแหน่ง` | Enum | — |
| `รูปภาพ` | Image | Label |
| `เบอร์โทรศัพท์` | Phone | — |
| `สถานะ` | Enum | — |
| `Related ข้อมูลคุณภาพน้ำs` | List | Virtual System |
| `Related น้ำประปาs` | List | Virtual System |
| `Related coliform bac.s` | List | Virtual System |
| `Related coliform bac._Waters` | List | Virtual System |
| `Related ตรวจสอบถังs` | List | Virtual System |
| `Related coliform bac. Food.s` | List | Virtual System |
| `Related coliform bac. Employees By sample` | List | Virtual System |
| `Related coliform bac. Employees By ผู้รายงาน` | List | Virtual System |
| `Related jobs` | List | Virtual System |
| `Related coliform bac. Food.s By ผู้เก็บตัวอย่าง` | List | Virtual System |
| `Related coliform bac. Employees By ผู้เก็บตัวอย่าง` | List | Virtual System |
| `Related Checks` | List | Virtual System |
| `Related Filter_Firers` | List | Virtual System |

#### คอลัมน์ `ตำแหน่ง`

**Enum Values (ตัวเลือก)**

`นายแพทย์` / `พนักงานบริการ` / `นักวิชาการสาธารณสุข` / `นักโภชนาการ` / `พนักงานประกอบอาหาร`

#### คอลัมน์ `รูปภาพ`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=IF(OR(CONTAINS([ชื่อ-สกุล], "นาย"), CONTAINS([ชื่อ-สกุล], "เด็กชาย"), CONTAINS([ชื่อ-สกุล], "ด.ช."),CONTAINS([ชื่อ-สกุล],"ดช.")),"https://drive.google.com/uc?id=1OwNal5ItBmxHuPxNxnsOvPQJEEKYMGNR",IF(OR(CONTAINS([ชื่อ-สกุล], "นาง"), CONTAINS([ชื่อ-สกุล], "นางสาว"), CONTAINS([ชื่อ-สกุล], "นส."),CONTAINS([ชื่อ-สกุล], "น.ส."),CONTAINS([ชื่อ-สกุล], "เด็กหญิง"),CONTAINS([ชื่อ-สกุล], "ด.ญ."),CONTAINS([ชื่อ-สกุล], "ดญ.")),"หญิง", "https://drive.google.com/uc?id=1mUf27yZbq5AWxigx_3__wPcREnthfsVQ"))
```

#### คอลัมน์ `สถานะ`

**Enum Values (ตัวเลือก)**

`ทำงาน` / `ย้ายกลุ่มงาน` / `ลาออก` / `ลาศึกษาต่อ`

#### คอลัมน์ `Related ข้อมูลคุณภาพน้ำs`

**App formula (สูตรคำนวณ)**

```appsheet
REF_ROWS("ข้อมูลคุณภาพน้ำ", "ผู้บันทึก")
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `ข้อมูลคุณภาพน้ำ`)
Description (verbatim): "ข้อมูลคุณภาพน้ำ entries that reference this entry in the ผู้บันทึก column"
App formula: REF_ROWS("ข้อมูลคุณภาพน้ำ", "ผู้บันทึก")
```

#### คอลัมน์ `Related น้ำประปาs`

**App formula (สูตรคำนวณ)**

```appsheet
REF_ROWS("น้ำประปา", "ผู้บันทึก")
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `น้ำประปา`)
Description (verbatim): "น้ำประปา entries that reference this entry in the ผู้บันทึก column"
App formula: REF_ROWS("น้ำประปา", "ผู้บันทึก")
```

#### คอลัมน์ `Related coliform bac.s`

**App formula (สูตรคำนวณ)**

```appsheet
REF_ROWS("coliform bac.", "ผู้รายงาน")
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `coliform bac.`)
Description (verbatim): "coliform bac. entries that reference this entry in the ผู้รายงาน column"
App formula: REF_ROWS("coliform bac.", "ผู้รายงาน")
```

#### คอลัมน์ `Related coliform bac._Waters`

**App formula (สูตรคำนวณ)**

```appsheet
REF_ROWS("coliform bac._Water", "ผู้รายงาน")
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `coliform bac._Water`)
Description (verbatim): "coliform bac._Water entries that reference this entry in the ผู้รายงาน column"
App formula: REF_ROWS("coliform bac._Water", "ผู้รายงาน")
```

#### คอลัมน์ `Related ตรวจสอบถังs`

**App formula (สูตรคำนวณ)**

```appsheet
REF_ROWS("ตรวจสอบถัง", "ผู้ตรวจสอบ")
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `ตรวจสอบถัง`)
Description (verbatim): "ตรวจสอบถัง entries that reference this entry in the ผู้ตรวจสอบ column"
App formula: REF_ROWS("ตรวจสอบถัง", "ผู้ตรวจสอบ")
```

#### คอลัมน์ `Related coliform bac. Food.s`

**App formula (สูตรคำนวณ)**

```appsheet
REF_ROWS("coliform bac. Food.", "ผู้รายงาน")
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `coliform bac. Food.`)
Description (verbatim): "coliform bac. Food. entries that reference this entry in the ผู้รายงาน column"
App formula: REF_ROWS("coliform bac. Food.", "ผู้รายงาน")
```

#### คอลัมน์ `Related coliform bac. Employees By sample`

**App formula (สูตรคำนวณ)**

```appsheet
REF_ROWS("coliform bac. Employee", "sample")
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `coliform bac. Employee`)
Description (verbatim): "coliform bac. Employee entries that reference this entry in the sample column"
App formula: REF_ROWS("coliform bac. Employee", "sample")
```

#### คอลัมน์ `Related coliform bac. Employees By ผู้รายงาน`

**App formula (สูตรคำนวณ)**

```appsheet
REF_ROWS("coliform bac. Employee", "ผู้รายงาน")
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `coliform bac. Employee`)
Description (verbatim): "coliform bac. Employee entries that reference this entry in the ผู้รายงาน column"
App formula: REF_ROWS("coliform bac. Employee", "ผู้รายงาน")
```

#### คอลัมน์ `Related jobs`

**App formula (สูตรคำนวณ)**

```appsheet
REF_ROWS("job", "practician")
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `job`)
Description (verbatim): "job entries that reference this entry in the practician column"
App formula: REF_ROWS("job", "practician")
```

#### คอลัมน์ `Related coliform bac. Food.s By ผู้เก็บตัวอย่าง`

**App formula (สูตรคำนวณ)**

```appsheet
REF_ROWS("coliform bac. Food.", "ผู้เก็บตัวอย่าง")
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `coliform bac. Food.`)
Description (verbatim): "coliform bac. Food. entries that reference this entry in the ผู้เก็บตัวอย่าง column"
App formula: REF_ROWS("coliform bac. Food.", "ผู้เก็บตัวอย่าง")
```

#### คอลัมน์ `Related coliform bac. Employees By ผู้เก็บตัวอย่าง`

**App formula (สูตรคำนวณ)**

```appsheet
REF_ROWS("coliform bac. Employee", "ผู้เก็บตัวอย่าง")
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `coliform bac. Employee`)
Description (verbatim): "coliform bac. Employee entries that reference this entry in the ผู้เก็บตัวอย่าง column"
App formula: REF_ROWS("coliform bac. Employee", "ผู้เก็บตัวอย่าง")
```

#### คอลัมน์ `Related Checks`

**App formula (สูตรคำนวณ)**

```appsheet
REF_ROWS("Check", "Auditor")
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `Check`)
Description (verbatim): "Check entries that reference this entry in the Auditor column"
App formula: REF_ROWS("Check", "Auditor")
```

#### คอลัมน์ `Related Filter_Firers`

**App formula (สูตรคำนวณ)**

```appsheet
REF_ROWS("Filter_Firer", "ผู้ตรวจสอบ")
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `Filter_Firer`)
Description (verbatim): "Filter_Firer entries that reference this entry in the ผู้ตรวจสอบ column"
App formula: REF_ROWS("Filter_Firer", "ผู้ตรวจสอบ")
```

### 3.3 ตาราง `ข้อมูลคุณภาพน้ำ` — 80 คอลัมน์ (key: วันที่ บันทึก)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `วันที่ บันทึก` | Date | Key Label |
| `ในบ่อเติมอากาศ (TDS-1)` | Number | — |
| `อุณหภูมิ บ่อเติมอากาศ(Temperature)` | Decimal | — |
| `ในน้ำก่อนทิ้ง (TDS-2)` | Number | — |
| `ความเป็นกรดและด่าง(pH)` | Decimal | — |
| `บ่อเติมอากาศ(DO-1)` | Decimal | — |
| `บ่อตกตะกอน(DO-2)` | Decimal | — |
| `น้ำก่อนทิ้ง(DO-3)` | Decimal | — |
| `การตกตะกอน(SV30)` | Number | — |
| `คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)` | Decimal | — |
| `ล้างตะแกรงบ่อสูบ` | Enum | — |
| `ล้างตะแกรงละเอียด` | Enum | — |
| `เครื่องสูบน้ำเสีย 1` | Enum | — |
| `เครื่องสูบน้ำเสีย 2` | Enum | — |
| `เครื่องเติมอากาศ 1` | Enum | — |
| `เครื่องเติมอากาศ 2` | Enum | — |
| `เครื่องสูบตะกอน 1` | Enum | — |
| `เครื่องสูบตะกอน 2` | Enum | — |
| `เครื่องจ่ายคลอรีน 1` | Enum | — |
| `เครื่องจ่ายคลอรีน 2` | Enum | — |
| `เลขมิเตอร์วันนี้` | Decimal | — |
| `ปริมาณการใช้ไฟฟ้าของระบบ` | Decimal | — |
| `ปริมาณน้ำที่ใช้ในทุกกิจกรรม` | Decimal | — |
| `ปริมาณน้ำเสียที่เข้าระบบบำบัด` | Decimal | — |
| `การระบายน้ำทิ้งออกจากระบบ` | Enum | — |
| `คลอรีนน้ำ ที่ใช้` | Decimal | — |
| `การทำงานของระบบบำบัดน้ำเสีย` | Enum | — |
| `ตะกอนส่วนเกินที่นำไปกำจัด` | Enum | — |
| `ลักษณะสี` | Enum | — |
| `ลักษณะกลิ่น` | Enum | — |
| `ผู้บันทึก` | Ref | — |
| `เลขมิเตอร์เครื่องสูบ 1` | Decimal | — |
| `เลขมิเตอร์เครื่องสูบ 2` | Decimal | — |
| `หมายเหตุ` | LongText | — |
| `id` | Text | — |
| `คู่มือ DO` | Show | ReadOnly |
| `C_location` | LatLong | hidden |
| `อัตราส่วนผสม(คลอรีน/น้ำ)` | Enum | — |
| `คลอรีนน้ำที่ใช้จริง` | Decimal | ReadOnly hidden |
| `ดึงข้อมูลก่อนหน้า` | Decimal | Virtual ReadOnly hidden |
| `เลขมิเตอร์เมื่อวาน` | Decimal | Virtual ReadOnly hidden |
| `last_meter_สูบ1` | Decimal | Virtual ReadOnly hidden |
| `last_meter_สูบ2` | Decimal | Virtual ReadOnly hidden |
| `คำนวณสูบ 1` | Decimal | Virtual ReadOnly hidden |
| `คำนวณสูบ 2` | Decimal | Virtual ReadOnly hidden |
| `sum_energy` | Decimal | Virtual ReadOnly |
| `sum_water_usage` | Decimal | Virtual ReadOnly |
| `sum_wastewater` | Decimal | Virtual ReadOnly |
| `sum_chlorine` | Decimal | Virtual ReadOnly |
| `Related Filter_Waters` | List | Virtual System hidden |
| `ชื่อเล่นผู้บันทึก` | Text | Virtual ReadOnly |
| `ชื่อนาม-สกุล ผู้บันทึก` | Text | Virtual ReadOnly |
| `mount_thai` | Text | Virtual ReadOnly |
| `Year_thai` | Text | Virtual ReadOnly |
| `Date_thai` | Number | Virtual ReadOnly |
| `test_ดึงข้อมูลมิเตอร์วันก่อนหน้า` | Decimal | Virtual ReadOnly hidden |
| `SV30_Photo` | Show | Virtual ReadOnly |
| `ค่าการตกตะกอน SV 30` | Show | Virtual ReadOnly |
| `pH_Photo` | Show | Virtual ReadOnly |
| `ค่าความเป็นกรดด่าง` | Show | Virtual ReadOnly |
| `Free_Chlorine_Photo` | Show | Virtual ReadOnly |
| `Free_Chlorine_Header` | Show | Virtual ReadOnly |
| `TDS_Header` | Show | Virtual ReadOnly |
| `TDS_Photo` | Show | Virtual ReadOnly |
| `DO_Photo` | Show | Virtual ReadOnly |
| `meter_photo` | Show | Virtual ReadOnly |
| `current_location` | LatLong | Virtual ReadOnly |
| `uthai_location` | LatLong | Virtual ReadOnly |
| `distacne` | Decimal | Virtual ReadOnly |
| `Critical-DO-3` | Yes/No | Virtual ReadOnly |
| `Critical-DO-2` | Yes/No | Virtual ReadOnly |
| `Critical-DO-1` | Yes/No | Virtual ReadOnly |
| `Critical-FreeChlorine-Lowerlow` | Yes/No | Virtual ReadOnly |
| `Critical-FreeChlorine-HigherHigh` | Yes/No | Virtual ReadOnly |
| `AVG_Westwater` | Decimal | Virtual ReadOnly |
| `TDS2 critical` | Yes/No | Virtual ReadOnly |
| `pH Critical` | Yes/No | Virtual ReadOnly |
| `Chlorine_StreakCount` | Number | Virtual ReadOnly |
| `ชุดข้อมูลค่าไฟฟ้า 12 เดือนย้อนหลัง` | List | Virtual ReadOnly |

#### คอลัมน์ `วันที่ บันทึก`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=NOW()
```

#### คอลัมน์ `คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)`

**Invalid value error (ข้อความเมื่อค่าไม่ผ่าน)**

```appsheet
=แน่ใจหรือที่จะลงข้อมูลนี้
```

**Maximum value**

```appsheet
100
```

**Minimum value**

```appsheet
0
```

#### คอลัมน์ `ล้างตะแกรงบ่อสูบ`

**Initial value (ค่าเริ่มต้น)**

```appsheet
="ไม่ล้าง"
```

**Enum Values (ตัวเลือก)**

`ไม่ล้าง` / `ล้าง`

#### คอลัมน์ `ล้างตะแกรงละเอียด`

**Initial value (ค่าเริ่มต้น)**

```appsheet
="ล้าง"
```

**Enum Values (ตัวเลือก)**

`ไม่ล้าง` / `ล้าง`

#### คอลัมน์ `เครื่องสูบน้ำเสีย 1`

**Initial value (ค่าเริ่มต้น)**

```appsheet
="ปกติ"
```

**Enum Values (ตัวเลือก)**

`ปกติ` / `เสีย`

#### คอลัมน์ `เครื่องสูบน้ำเสีย 2`

**Initial value (ค่าเริ่มต้น)**

```appsheet
="ปกติ"
```

**Enum Values (ตัวเลือก)**

`ปกติ` / `เสีย`

#### คอลัมน์ `เครื่องเติมอากาศ 1`

**Initial value (ค่าเริ่มต้น)**

```appsheet
="ปกติ"
```

**Enum Values (ตัวเลือก)**

`ปกติ` / `เสีย`

#### คอลัมน์ `เครื่องเติมอากาศ 2`

**Initial value (ค่าเริ่มต้น)**

```appsheet
="ปกติ"
```

**Enum Values (ตัวเลือก)**

`ปกติ` / `เสีย`

#### คอลัมน์ `เครื่องสูบตะกอน 1`

**Initial value (ค่าเริ่มต้น)**

```appsheet
="ปกติ"
```

**Enum Values (ตัวเลือก)**

`ปกติ` / `เสีย`

#### คอลัมน์ `เครื่องสูบตะกอน 2`

**Initial value (ค่าเริ่มต้น)**

```appsheet
="ปกติ"
```

**Enum Values (ตัวเลือก)**

`ปกติ` / `เสีย`

#### คอลัมน์ `เครื่องจ่ายคลอรีน 1`

**Initial value (ค่าเริ่มต้น)**

```appsheet
="ปกติ"
```

**Enum Values (ตัวเลือก)**

`ปกติ` / `เสีย`

#### คอลัมน์ `เครื่องจ่ายคลอรีน 2`

**Initial value (ค่าเริ่มต้น)**

```appsheet
="ปกติ"
```

**Enum Values (ตัวเลือก)**

`ปกติ` / `เสีย`

#### คอลัมน์ `ปริมาณการใช้ไฟฟ้าของระบบ`

**App formula (สูตรคำนวณ)**

```appsheet
=IF([เลขมิเตอร์วันนี้]-[test_ดึงข้อมูลมิเตอร์วันก่อนหน้า]<= 0,"",[เลขมิเตอร์วันนี้]-[test_ดึงข้อมูลมิเตอร์วันก่อนหน้า])
```

**Valid If (เงื่อนไขค่าที่ยอมรับ)**

```appsheet
=[ปริมาณการใช้ไฟฟ้าของระบบ]>0
```

**Invalid value error (ข้อความเมื่อค่าไม่ผ่าน)**

```appsheet
=ตรวจสอบข้อมูลดีๆนะจ๊ะ
```

#### คอลัมน์ `ปริมาณน้ำที่ใช้ในทุกกิจกรรม`

**App formula (สูตรคำนวณ)**

```appsheet
=if(ISBLANK(LOOKUP([วันที่ บันทึก], "น้ำประปา", "Date", "Water_In")),60,LOOKUP([วันที่ บันทึก], "น้ำประปา", "Date", "Water_In"),)
```

#### คอลัมน์ `ปริมาณน้ำเสียที่เข้าระบบบำบัด`

**App formula (สูตรคำนวณ)**

```appsheet
=if(SUM
(LIST
([คำนวณสูบ 1], [คำนวณสูบ 2])
)<=0,"อย่าลืมใส่เลข มิเตอร์บ่อสูบนะจ๊ะ",
(SUM
(LIST([คำนวณสูบ 1], [คำนวณสูบ 2])
)
)
)
```

**Invalid value error (ข้อความเมื่อค่าไม่ผ่าน)**

```appsheet
=ข้อมูลผิดพลาด
```

#### คอลัมน์ `การระบายน้ำทิ้งออกจากระบบ`

**Initial value (ค่าเริ่มต้น)**

```appsheet
="ระบาย"
```

**Enum Values (ตัวเลือก)**

`ระบาย` / `ไม่ระบาย`

#### คอลัมน์ `การทำงานของระบบบำบัดน้ำเสีย`

**Initial value (ค่าเริ่มต้น)**

```appsheet
="ปกติ"
```

**Enum Values (ตัวเลือก)**

`ปกติ` / `ผิดปกติ`

#### คอลัมน์ `ตะกอนส่วนเกินที่นำไปกำจัด`

**Enum Values (ตัวเลือก)**

`1.35` / `2.7` / `5.4` / `8.1`

#### คอลัมน์ `ลักษณะสี`

**Initial value (ค่าเริ่มต้น)**

```appsheet
="น้ำตาลเข้ม"
```

**Enum Values (ตัวเลือก)**

`น้ำตาลอ่อน` / `น้ำตาลเข้ม` / `ดำ`

#### คอลัมน์ `ลักษณะกลิ่น`

**Initial value (ค่าเริ่มต้น)**

```appsheet
="กลิ่นดินปกติ"
```

**Enum Values (ตัวเลือก)**

`กลิ่นดินปกติ` / `กลิ่นเหม็นแก๊สไข้เน่า` / `อื่นๆ`

#### คอลัมน์ `ผู้บันทึก`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=SWITCH(USEREMAIL(), 
  "[REDACTED_EMAIL]", "⟨thai-id ID1⟩", 
  "[REDACTED_EMAIL]", "⟨thai-id ID1⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID2⟩",
  "[REDACTED_EMAIL]","⟨id-like ID5⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID3⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID4⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID4⟩",
  "READ_ONLY")
```

**Valid If (เงื่อนไขค่าที่ยอมรับ)**

```appsheet
=SELECT(ข้อมูลผู้ปฏิบัติงาน[Employee_id],AND([ตำแหน่ง]<>"นายแพทย์",[สถานะ]="ทำงาน",OR([ตำแหน่ง]="นักวิชาการสาธารณสุข",[ตำแหน่ง]="พนักงานบริการ")))
```

**Ref → ตารางอ้างอิง**

`ข้อมูลผู้ปฏิบัติงาน` (key: `Employee_id`)

#### คอลัมน์ `id`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=UNIQUEID()
```

#### คอลัมน์ `คู่มือ DO`

**Content (เนื้อหาคอลัมน์ Show)**

```appsheet
="https://www.appsheet.com/template/gettablefileurl?appName=ActivatedSludge-29279640&tableName=Tool_Machine&fileName=Tool_Machine_Files_%2F34d97b35.User%20manual.062852.22%29.pdf&appVersion=3.000321&signature=[REDACTED_SECRET]"
```

#### คอลัมน์ `C_location`

**App formula (สูตรคำนวณ)**

```appsheet
=here()
```

#### คอลัมน์ `อัตราส่วนผสม(คลอรีน/น้ำ)`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=1:4
```

**Enum Values (ตัวเลือก)**

`1:2` / `1:4` / `1:9`

#### คอลัมน์ `คลอรีนน้ำที่ใช้จริง`

**Spreadsheet formula (สูตรฝั่ง Google Sheets)**

```appsheet
=ArrayFormula("คลอรีนน้ำที่ใช้จริง"{;IF(    R2C38:R[763]C38="",    "",    R2C26:R[763]C26 / SWITCH(      R2C38:R[763]C38,      "1:2", 2,      "1:4", 4,      "1:9", 9,      ""    )  )})
```

#### คอลัมน์ `ดึงข้อมูลก่อนหน้า`

**App formula (สูตรคำนวณ)**

```appsheet
=Any(Select(ข้อมูลคุณภาพน้ำ[เลขมิเตอร์วันนี้],[วันที่ บันทึก]= MAXROW("ข้อมูลคุณภาพน้ำ","เลขมิเตอร์วันนี้")))
```

#### คอลัมน์ `เลขมิเตอร์เมื่อวาน`

**App formula (สูตรคำนวณ)**

```appsheet
=MAX(SELECT(ข้อมูลคุณภาพน้ำ[เลขมิเตอร์วันนี้], TRUE))
```

#### คอลัมน์ `last_meter_สูบ1`

**App formula (สูตรคำนวณ)**

```appsheet
=MAX(SELECT(ข้อมูลคุณภาพน้ำ[เลขมิเตอร์เครื่องสูบ 1], [วันที่ บันทึก] < [_THISROW].[วันที่ บันทึก]))
```

#### คอลัมน์ `last_meter_สูบ2`

**App formula (สูตรคำนวณ)**

```appsheet
=MAX(SELECT(ข้อมูลคุณภาพน้ำ[เลขมิเตอร์เครื่องสูบ 2], [วันที่ บันทึก] < [_THISROW].[วันที่ บันทึก]))
```

#### คอลัมน์ `คำนวณสูบ 1`

**App formula (สูตรคำนวณ)**

```appsheet
=([เลขมิเตอร์เครื่องสูบ 1]-[last_meter_สูบ1])*34
```

#### คอลัมน์ `คำนวณสูบ 2`

**App formula (สูตรคำนวณ)**

```appsheet
=([เลขมิเตอร์เครื่องสูบ 2]-[last_meter_สูบ2])*12
```

#### คอลัมน์ `sum_energy`

**App formula (สูตรคำนวณ)**

```appsheet
=SUM(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ])
```

#### คอลัมน์ `sum_water_usage`

**App formula (สูตรคำนวณ)**

```appsheet
=sum(ข้อมูลคุณภาพน้ำ[ปริมาณน้ำที่ใช้ในทุกกิจกรรม])
```

#### คอลัมน์ `sum_wastewater`

**App formula (สูตรคำนวณ)**

```appsheet
=sum(ข้อมูลคุณภาพน้ำ[ปริมาณน้ำเสียที่เข้าระบบบำบัด])
```

#### คอลัมน์ `sum_chlorine`

**App formula (สูตรคำนวณ)**

```appsheet
=sum(ข้อมูลคุณภาพน้ำ[คลอรีนน้ำ ที่ใช้])
```

#### คอลัมน์ `Related Filter_Waters`

**App formula (สูตรคำนวณ)**

```appsheet
REF_ROWS("Filter_Water", "ID")
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `Filter_Water`)
Description (verbatim): "Filter_Water entries that reference this entry in the ID column"
App formula: REF_ROWS("Filter_Water", "ID")
```

#### คอลัมน์ `ชื่อเล่นผู้บันทึก`

**App formula (สูตรคำนวณ)**

```appsheet
=[ผู้บันทึก].[ชื่อเล่น]
```

#### คอลัมน์ `ชื่อนาม-สกุล ผู้บันทึก`

**App formula (สูตรคำนวณ)**

```appsheet
=[ผู้บันทึก].[ชื่อ-สกุล]
```

#### คอลัมน์ `mount_thai`

**App formula (สูตรคำนวณ)**

```appsheet
=SWITCH(MONTH([วันที่ บันทึก]), 
  1, "มกราคม", 
  2, "กุมภาพันธ์", 
  3, "มีนาคม", 
  4, "เมษายน", 
  5, "พฤษภาคม", 
  6, "มิถุนายน", 
  7, "กรกฎาคม", 
  8, "สิงหาคม", 
  9, "กันยายน", 
  10, "ตุลาคม", 
  11, "พฤศจิกายน", 
  12, "ธันวาคม", 
  "ไม่มีข้อมูล")
```

#### คอลัมน์ `Year_thai`

**App formula (สูตรคำนวณ)**

```appsheet
=year([วันที่ บันทึก])+543
```

#### คอลัมน์ `Date_thai`

**App formula (สูตรคำนวณ)**

```appsheet
=day([วันที่ บันทึก])
```

#### คอลัมน์ `test_ดึงข้อมูลมิเตอร์วันก่อนหน้า`

**App formula (สูตรคำนวณ)**

```appsheet
=MAX(SELECT(ข้อมูลคุณภาพน้ำ[เลขมิเตอร์วันนี้], [วันที่ บันทึก] < [_THISROW].[วันที่ บันทึก]))
```

#### คอลัมน์ `SV30_Photo`

**App formula (สูตรคำนวณ)**

```appsheet
="https://drive.google.com/thumbnail?id=1IA6iZmUrVpR9ikXmex8eVN8aR7N6rJHJ&sz=w1000"
```

**Content (เนื้อหาคอลัมน์ Show)**

```appsheet
="https://drive.google.com/thumbnail?id=1IA6iZmUrVpR9ikXmex8eVN8aR7N6rJHJ&sz=w1000"
```

#### คอลัมน์ `ค่าการตกตะกอน SV 30`

**App formula (สูตรคำนวณ)**

```appsheet
="ค่าการตกตะกอน"
```

**Content (เนื้อหาคอลัมน์ Show)**

```appsheet
=ค่าการตกตะกอน SV30
```

#### คอลัมน์ `pH_Photo`

**App formula (สูตรคำนวณ)**

```appsheet
="https://drive.google.com/thumbnail?id=1ax3wJnRk03waj6-6FeXWwrelM5MyBL3e&sz=w1000"
```

**Content (เนื้อหาคอลัมน์ Show)**

```appsheet
="https://drive.google.com/thumbnail?id=1ax3wJnRk03waj6-6FeXWwrelM5MyBL3e&sz=w1000"
```

#### คอลัมน์ `ค่าความเป็นกรดด่าง`

**App formula (สูตรคำนวณ)**

```appsheet
=ค่าความเป็นกรดด่าง
```

**Content (เนื้อหาคอลัมน์ Show)**

```appsheet
=ค่าความเป็นกรดด่าง
```

#### คอลัมน์ `Free_Chlorine_Photo`

**App formula (สูตรคำนวณ)**

```appsheet
="https://drive.google.com/thumbnail?id=1cdYmuCd-l46xJOnqSMBF3zakUmuRnYSf&sz=w1000"
```

**Content (เนื้อหาคอลัมน์ Show)**

```appsheet
="https://drive.google.com/thumbnail?id=1cdYmuCd-l46xJOnqSMBF3zakUmuRnYSf&sz=w1000"
```

#### คอลัมน์ `Free_Chlorine_Header`

**App formula (สูตรคำนวณ)**

```appsheet
=ตรวจวัดค่าคลอรีนอิสระในน้ำก่อนทิ้ง
```

**Content (เนื้อหาคอลัมน์ Show)**

```appsheet
=ตรวจวัดค่าคลอรีนอิสระในน้ำก่อนทิ้ง
```

#### คอลัมน์ `TDS_Header`

**App formula (สูตรคำนวณ)**

```appsheet
=การวัดปริมาณของแข็ง สารอนินทรีย์และอินทรีย์ทั้งหมดที่ละลายอยู่ในน้ำ
```

**Content (เนื้อหาคอลัมน์ Show)**

```appsheet
=การวัดปริมาณของแข็ง สารอนินทรีย์และอินทรีย์ทั้งหมดที่ละลายอยู่ในน้ำ
```

#### คอลัมน์ `TDS_Photo`

**App formula (สูตรคำนวณ)**

```appsheet
="https://drive.google.com/thumbnail?id=1OlYYZ7MpuRlYYtwbP8KJeLvdVvneGcx5&sz=w1000"
```

**Content (เนื้อหาคอลัมน์ Show)**

```appsheet
="https://drive.google.com/thumbnail?id=1OlYYZ7MpuRlYYtwbP8KJeLvdVvneGcx5&sz=w1000"
```

#### คอลัมน์ `DO_Photo`

**App formula (สูตรคำนวณ)**

```appsheet
="https://drive.google.com/thumbnail?id=10J1XzKtZDhoxuChh2VsPlQ3Zn1OTd_uB&sz=w1000"
```

**Content (เนื้อหาคอลัมน์ Show)**

```appsheet
="https://drive.google.com/thumbnail?id=10J1XzKtZDhoxuChh2VsPlQ3Zn1OTd_uB&sz=w1000"
```

#### คอลัมน์ `meter_photo`

**App formula (สูตรคำนวณ)**

```appsheet
="https://drive.google.com/thumbnail?id=16IyoFHxhvqmSZsM7W5vR1EkPnuwb8hb5&sz=w1000"
```

**Content (เนื้อหาคอลัมน์ Show)**

```appsheet
="https://drive.google.com/thumbnail?id=16IyoFHxhvqmSZsM7W5vR1EkPnuwb8hb5&sz=w1000"
```

#### คอลัมน์ `current_location`

**App formula (สูตรคำนวณ)**

```appsheet
=here()
```

#### คอลัมน์ `uthai_location`

**App formula (สูตรคำนวณ)**

```appsheet
=LATLONG(14.361183, 100.645474)
```

#### คอลัมน์ `distacne`

**App formula (สูตรคำนวณ)**

```appsheet
=distance([uthai_location],[C_location])
```

#### คอลัมน์ `Critical-DO-3`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(
  AND(
    COUNT(
      SELECT(
        ข้อมูลคุณภาพน้ำ[น้ำก่อนทิ้ง(DO-3)],
        AND(
          [น้ำก่อนทิ้ง(DO-3)] < 1.5,
          [วันที่ บันทึก] = ([_THISROW].[วันที่ บันทึก] - 2)
        )
      )
    ) > 0,
    COUNT(
      SELECT(
        ข้อมูลคุณภาพน้ำ[น้ำก่อนทิ้ง(DO-3)],
        AND(
         [น้ำก่อนทิ้ง(DO-3)] < 1.5,
          [วันที่ บันทึก] = ([_THISROW].[วันที่ บันทึก] - 1)
        )
      )
    ) > 0,
    COUNT(
      SELECT(
        ข้อมูลคุณภาพน้ำ[น้ำก่อนทิ้ง(DO-3)],
        AND(
         [น้ำก่อนทิ้ง(DO-3)] < 1.5,
          [วันที่ บันทึก] = [_THISROW].[วันที่ บันทึก]
        )
      )
    ) > 0
  ),
  TRUE,
  FALSE
)
```

#### คอลัมน์ `Critical-DO-2`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(
  AND(
    COUNT(
      SELECT(
        ข้อมูลคุณภาพน้ำ[บ่อตกตะกอน(DO-2)],
        AND(
          [บ่อตกตะกอน(DO-2)] < 1,
          [วันที่ บันทึก] = ([_THISROW].[วันที่ บันทึก] - 2)
        )
      )
    ) > 0,
    COUNT(
      SELECT(
        ข้อมูลคุณภาพน้ำ[บ่อตกตะกอน(DO-2)],
        AND(
         [บ่อตกตะกอน(DO-2)] < 1,
          [วันที่ บันทึก] = ([_THISROW].[วันที่ บันทึก] - 1)
        )
      )
    ) > 0,
    COUNT(
      SELECT(
       ข้อมูลคุณภาพน้ำ[บ่อตกตะกอน(DO-2)],
        AND(
         [บ่อตกตะกอน(DO-2)] < 1,
          [วันที่ บันทึก] = [_THISROW].[วันที่ บันทึก]
        )
      )
    ) > 0
  ),
  TRUE,
  FALSE
)
```

#### คอลัมน์ `Critical-DO-1`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(
  AND(
    COUNT(
      SELECT(
          ข้อมูลคุณภาพน้ำ[บ่อเติมอากาศ(DO-1)],
        AND(
          [บ่อเติมอากาศ(DO-1)] < 1,
          [วันที่ บันทึก] = ([_THISROW].[วันที่ บันทึก] - 2)
        )
      )
    ) > 0,
    COUNT(
      SELECT(
          ข้อมูลคุณภาพน้ำ[บ่อเติมอากาศ(DO-1)],
        AND(
         [บ่อเติมอากาศ(DO-1)] < 1,
          [วันที่ บันทึก] = ([_THISROW].[วันที่ บันทึก] - 1)
        )
      )
    ) > 0,
    COUNT(
      SELECT(
       ข้อมูลคุณภาพน้ำ[บ่อเติมอากาศ(DO-1)],
        AND(
         [บ่อเติมอากาศ(DO-1)] < 1,
          [วันที่ บันทึก] = [_THISROW].[วันที่ บันทึก]
        )
      )
    ) > 0
  ),
  TRUE,
  FALSE
)
```

#### คอลัมน์ `Critical-FreeChlorine-Lowerlow`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(
  AND(
    COUNT(
      SELECT(
        ข้อมูลคุณภาพน้ำ[คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)],
        AND(
          [คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)] < 0.5,
          [วันที่ บันทึก] = ([_THISROW].[วันที่ บันทึก] - 2)
        )
      )
    ) > 0,
    COUNT(
      SELECT(
        ข้อมูลคุณภาพน้ำ[คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)],
        AND(
          [คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)] < 0.5,
          [วันที่ บันทึก] = ([_THISROW].[วันที่ บันทึก] - 1)
        )
      )
    ) > 0,
    COUNT(
      SELECT(
        ข้อมูลคุณภาพน้ำ[คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)],
        AND(
          [คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)] < 0.5,
          [วันที่ บันทึก] = [_THISROW].[วันที่ บันทึก]
        )
      )
    ) > 0
  ),
  TRUE,
  FALSE
)
```

#### คอลัมน์ `Critical-FreeChlorine-HigherHigh`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(
  AND(
    COUNT(
      SELECT(
        ข้อมูลคุณภาพน้ำ[คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)],
        AND(
          [คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)] > 1,
          [วันที่ บันทึก] = ([_THISROW].[วันที่ บันทึก] - 2)
        )
      )
    ) > 0,
    COUNT(
      SELECT(
        ข้อมูลคุณภาพน้ำ[คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)],
        AND(
           [คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)] > 1,
          [วันที่ บันทึก] = ([_THISROW].[วันที่ บันทึก] - 1)
        )
      )
    ) > 0,
    COUNT(
      SELECT(
        ข้อมูลคุณภาพน้ำ[คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)],
        AND(
           [คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)] > 1,
          [วันที่ บันทึก] = [_THISROW].[วันที่ บันทึก]
        )
      )
    ) > 0
  ),
  TRUE,
  FALSE
)
```

#### คอลัมน์ `AVG_Westwater`

**App formula (สูตรคำนวณ)**

```appsheet
=AVERAGE(
  SELECT(
    ข้อมูลคุณภาพน้ำ[ปริมาณน้ำเสียที่เข้าระบบบำบัด],
    AND(
      [วันที่ บันทึก] >= ([_THISROW].[วันที่ บันทึก] - 3),
      [วันที่ บันทึก] <= ([_THISROW].[วันที่ บันทึก])
    )
  )
)
```

#### คอลัมน์ `TDS2 critical`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(
  AND(
    COUNT(
      SELECT(
        ข้อมูลคุณภาพน้ำ[ในน้ำก่อนทิ้ง (TDS-2)],
        AND(
          [ในน้ำก่อนทิ้ง (TDS-2)] > 1000,
          [วันที่ บันทึก] = ([_THISROW].[วันที่ บันทึก] - 2)
        )
      )
    ) > 0,
    COUNT(
      SELECT(
        ข้อมูลคุณภาพน้ำ[ในน้ำก่อนทิ้ง (TDS-2)],
        AND(
          [ในน้ำก่อนทิ้ง (TDS-2)] > 1000,
          [วันที่ บันทึก] = ([_THISROW].[วันที่ บันทึก] - 1)
        )
      )
    ) > 0,
    COUNT(
      SELECT(
       ข้อมูลคุณภาพน้ำ[ในน้ำก่อนทิ้ง (TDS-2)],
        AND(
         [ในน้ำก่อนทิ้ง (TDS-2)] > 1000,
         [วันที่ บันทึก] = [_THISROW].[วันที่ บันทึก]
        )
      )
    ) > 0
  ),
  TRUE,
  FALSE
)
```

#### คอลัมน์ `pH Critical`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(
  AND(
    COUNT(
      SELECT(
        ข้อมูลคุณภาพน้ำ[ความเป็นกรดและด่าง(pH)],
        OR(
          AND(
            [ความเป็นกรดและด่าง(pH)] > 9,
            [วันที่ บันทึก] = (
            [_THISROW].[วันที่ บันทึก]
              - 2
            )
          ),
          AND(
            [ความเป็นกรดและด่าง(pH)] < 5,
            [วันที่ บันทึก] = (
            [_THISROW].[วันที่ บันทึก]
              - 2
            )
          )
        )
      )
    ) > 0,
    COUNT(
      SELECT(
        ข้อมูลคุณภาพน้ำ[ความเป็นกรดและด่าง(pH)],
        OR(
          AND(
            [ความเป็นกรดและด่าง(pH)] > 9,
            [วันที่ บันทึก] = (
            [_THISROW].[วันที่ บันทึก]
              - 1
            )
          ),
          AND(
            [ความเป็นกรดและด่าง(pH)] < 5,
            [วันที่ บันทึก] = (
            [_THISROW].[วันที่ บันทึก]
              - 1
            )
          )
        )
      )
    ) > 0,
    COUNT(
      SELECT(
        ข้อมูลคุณภาพน้ำ[ความเป็นกรดและด่าง(pH)],
        OR(
          AND(
            [ความเป็นกรดและด่าง(pH)] > 9,
            [วันที่ บันทึก] = (
            [_THISROW].[วันที่ บันทึก]
            )
          ),
          AND(
            [ความเป็นกรดและด่าง(pH)] < 5,
            [วันที่ บันทึก] = (
            [_THISROW].[วันที่ บันทึก]
            )
          )
        )
      )
    ) > 0
  ),
  TRUE,
  FALSE
)
```

#### คอลัมน์ `Chlorine_StreakCount`

**App formula (สูตรคำนวณ)**

```appsheet
=COUNT(
  SELECT(
    ข้อมูลคุณภาพน้ำ[วันที่ บันทึก],
    AND(
      [คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)] < 0.5,
      [วันที่ บันทึก] <= [_THISROW].[วันที่ บันทึก],
      [วันที่ บันทึก] > 
      IF(
        ISBLANK(
          MAX(
            SELECT(
              ข้อมูลคุณภาพน้ำ[วันที่ บันทึก],
              AND(
                [วันที่ บันทึก] < [_THISROW].[วันที่ บันทึก],
                [คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)] >= 0.5
              )
            )
          )
        ),
        "1/1/1900",
        MAX(
          SELECT(
            ข้อมูลคุณภาพน้ำ[วันที่ บันทึก],
            AND(
              [วันที่ บันทึก] < [_THISROW].[วันที่ บันทึก],
              [คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)] >= 0.5
            )
          )
        )
      )
    )
  )
)
```

#### คอลัมน์ `ชุดข้อมูลค่าไฟฟ้า 12 เดือนย้อนหลัง`

**App formula (สูตรคำนวณ)**

```appsheet
=LIST(
  SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ], [วันที่ บันทึก] = TEXT(EOMONTH(TODAY(), -11), "YYYY-MM"))),
  SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ], [วันที่ บันทึก] = TEXT(EOMONTH(TODAY(), -10), "YYYY-MM"))),
  SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ], [วันที่ บันทึก] = TEXT(EOMONTH(TODAY(), -9), "YYYY-MM"))),
  SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ], [วันที่ บันทึก] = TEXT(EOMONTH(TODAY(), -8), "YYYY-MM"))),
  SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ], [วันที่ บันทึก] = TEXT(EOMONTH(TODAY(), -7), "YYYY-MM"))),
  SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ], [วันที่ บันทึก] = TEXT(EOMONTH(TODAY(), -6), "YYYY-MM"))),
  SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ], [วันที่ บันทึก] = TEXT(EOMONTH(TODAY(), -5), "YYYY-MM"))),
  SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ], [วันที่ บันทึก] = TEXT(EOMONTH(TODAY(), -4), "YYYY-MM"))),
  SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ], [วันที่ บันทึก] = TEXT(EOMONTH(TODAY(), -3), "YYYY-MM"))),
  SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ], [วันที่ บันทึก] = TEXT(EOMONTH(TODAY(), -2), "YYYY-MM"))),
  SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ], [วันที่ บันทึก] = TEXT(EOMONTH(TODAY(), -1), "YYYY-MM"))),
  SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ], [วันที่ บันทึก] = TEXT(TODAY(), "YYYY-MM")))
)
```

### 3.4 ตาราง `menu ระบบบ่อบำบัด` — 5 คอลัมน์ (key: name)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `1`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `name` | Text | Key Label |
| `icon` | Image | Label |
| `link` | Text | hidden |
| `link view menu AS` | App | Virtual ReadOnly |

#### คอลัมน์ `link view menu AS`

**App formula (สูตรคำนวณ)**

```appsheet
=LINKTOVIEW([link], "ActivatedSludge-29279640")
```

### 3.5 ตาราง `last meter` — 4 คอลัมน์ (key: _RowNumber)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `0`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | Key System hidden |
| `meter ไฟ` | Number | Label ReadOnly |
| `meter เครื่องสูบ 1` | Text | — |
| `meter เครื่องสูบ 2` | Text | — |

#### คอลัมน์ `meter ไฟ`

**Spreadsheet formula (สูตรฝั่ง Google Sheets)**

```appsheet
INDEX('ข้อมูลคุณภาพน้ำ'!C22:C22,MATCH(143^143,'ข้อมูลคุณภาพน้ำ'!C22:C22))
```

### 3.6 ตาราง `address` — 8 คอลัมน์ (key: TambonID)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `TambonID` | Number | Key Label |
| `TambonThai` | Text | — |
| `DistrictID` | Number | — |
| `DistrictThai` | Text | — |
| `ProvinceID` | Number | — |
| `ProvinceThai` | Text | — |
| `Address_Key` | Text | Virtual ReadOnly |

#### คอลัมน์ `Address_Key`

**App formula (สูตรคำนวณ)**

```appsheet
=[TambonThai]&"-"&[DistrictThai]&"-"&[ProvinceThai]
```

### 3.7 ตาราง `Filter_Water` — 69 คอลัมน์ (key: ID)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `ID` | Ref | Key Label |
| `Start Date` | Date | — |
| `End Date` | Date | — |
| `TDS บ่อเติม` | Text | hidden |
| `อุณหภูมิ บ่อเติมอากาศ` | Text | hidden |
| `TDS น้ำก่อนทิ้ง` | Text | hidden |
| `pH` | Text | hidden |
| `DO บ่อเติม` | Text | hidden |
| `DO บ่อตก` | Text | hidden |
| `DO ก่อนทิ้ง` | Text | hidden |
| `SV30` | Text | hidden |
| `Free Chlorine` | Text | hidden |
| `ปริมาณการใช้ไฟฟ้าของระบบ` | Decimal | hidden |
| `ปริมาณน้ำเสียเข้าระบบบำบัด` | Text | hidden |
| `คลอรีนน้ำ ที่ใช้` | Text | hidden |
| `Export PDF` | EnumList | — |
| `Count` | ChangeCounter | — |
| `PDF` | File | hidden |
| `temporary_data` | EnumList | Virtual ReadOnly |
| `PDF 2` | File | Virtual ReadOnly |
| `Sum_Energy` | Decimal | Virtual ReadOnly |
| `Sum_Water` | Decimal | Virtual ReadOnly |
| `Sum_waste_water` | Decimal | Virtual ReadOnly |
| `Sum_Chlorine` | Decimal | Virtual ReadOnly |
| `Sum_excess sludge` | Decimal | Virtual ReadOnly |
| `useage_Chlorine` | Decimal | Virtual ReadOnly |
| `Filter` | List | Virtual ReadOnly |
| `Temp` | List | Virtual ReadOnly |
| `month_thai` | Text | Virtual ReadOnly |
| `year_thai` | Text | Virtual ReadOnly |
| `St.M.thai` | Text | Virtual ReadOnly |
| `St.D.thai` | Number | Virtual ReadOnly |
| `St.Y.thai` | Text | Virtual ReadOnly |
| `End.M.thai` | Text | Virtual ReadOnly |
| `End.D.thai` | Number | Virtual ReadOnly |
| `End.Y.thai` | Text | Virtual ReadOnly |
| `Link.PDF1` | Text | Virtual ReadOnly |
| `Link.PDF2` | Text | Virtual ReadOnly |
| `W/V_Chlorine Litter` | Decimal | Virtual ReadOnly |
| `VC_Chart_URL` | Text | Virtual ReadOnly |
| `VC_CY_01` | Decimal | Virtual ReadOnly |
| `VC_CY_02` | Decimal | Virtual ReadOnly |
| `VC_CY_03` | Decimal | Virtual ReadOnly |
| `VC_CY_04` | Decimal | Virtual ReadOnly |
| `VC_CY_05` | Decimal | Virtual ReadOnly |
| `VC_CY_06` | Decimal | Virtual ReadOnly |
| `VC_CY_07` | Decimal | Virtual ReadOnly |
| `VC_CY_08` | Decimal | Virtual ReadOnly |
| `VC_CY_09` | Decimal | Virtual ReadOnly |
| `VC_CY_10` | Decimal | Virtual ReadOnly |
| `VC_CY_11` | Decimal | Virtual ReadOnly |
| `VC_CY_12` | Decimal | Virtual ReadOnly |
| `VC_Elec_CY` | Text | Virtual ReadOnly |
| `VC_LY_01` | Decimal | Virtual ReadOnly |
| `VC_LY_02` | Decimal | Virtual ReadOnly |
| `VC_LY_03` | Decimal | Virtual ReadOnly |
| `VC_LY_04` | Decimal | Virtual ReadOnly |
| `VC_LY_05` | Decimal | Virtual ReadOnly |
| `VC_LY_06` | Decimal | Virtual ReadOnly |
| `VC_LY_07` | Decimal | Virtual ReadOnly |
| `VC_LY_08` | Decimal | Virtual ReadOnly |
| `VC_LY_09` | Decimal | Virtual ReadOnly |
| `VC_LY_10` | Decimal | Virtual ReadOnly |
| `VC_LY_11` | Decimal | Virtual ReadOnly |
| `VC_LY_12` | Decimal | Virtual ReadOnly |
| `VC_Elec_LY` | Text | Virtual ReadOnly |
| `Total_CO2_CY` | Decimal | Virtual ReadOnly |
| `Total_CO2_LY` | Decimal | Virtual ReadOnly |

#### คอลัมน์ `ID`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID()
```

**Ref → ตารางอ้างอิง**

`ข้อมูลคุณภาพน้ำ` (key: `วันที่ บันทึก`)

#### คอลัมน์ `Start Date`

**Initial value (ค่าเริ่มต้น)**

```appsheet
TODAY()
```

#### คอลัมน์ `End Date`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=TODAY()
```

#### คอลัมน์ `Export PDF`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=ไม่สร้างรายงาน
```

**Enum Values (ตัวเลือก)**

`สร้าง ทส.1` / `สร้าง ทส.2`

#### คอลัมน์ `PDF`

**App formula (สูตรคำนวณ)**

```appsheet
=CONCATENATE("Mydrive/appsheet/data/ActivatedSludge-29279640/PDFv2/",[Count],".pdf")
```

#### คอลัมน์ `temporary_data`

**App formula (สูตรคำนวณ)**

```appsheet
=select(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ],AND(IF(
ISNOTBLANK([Start Date]),[วันที่ บันทึก]>=[_THISROW].[Start Date],true),IF(ISNOTBLANK([End Date]),[วันที่ บันทึก]<=[_THISROW].[End Date],true)))
```

#### คอลัมน์ `PDF 2`

**App formula (สูตรคำนวณ)**

```appsheet
=CONCATENATE("Mydrive/appsheet/data/ActivatedSludge-29279640/PDF_ทส2/","ทส.2",[Count],".pdf")
```

#### คอลัมน์ `Sum_Energy`

**App formula (สูตรคำนวณ)**

```appsheet
=SUM(
  SELECT(
    ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ],
    AND(
      [วันที่ บันทึก] >= [_THISROW].[Start Date],
      [วันที่ บันทึก] <= [_THISROW].[End Date]
    )
  )
)
```

#### คอลัมน์ `Sum_Water`

**App formula (สูตรคำนวณ)**

```appsheet
=SUM(
  SELECT(
    น้ำประปา[Water_In],
    AND(
      [Date] >= [_THISROW].[Start Date],
      [Date] <= [_THISROW].[End Date]
    )
  )
)
```

#### คอลัมน์ `Sum_waste_water`

**App formula (สูตรคำนวณ)**

```appsheet
=SUM(
  SELECT(
    ข้อมูลคุณภาพน้ำ[ปริมาณน้ำเสียที่เข้าระบบบำบัด],
    AND(
      [วันที่ บันทึก] >= [_THISROW].[Start Date],
      [วันที่ บันทึก] <= [_THISROW].[End Date]
    )
  )
)
```

#### คอลัมน์ `Sum_Chlorine`

**App formula (สูตรคำนวณ)**

```appsheet
=SUM(
  SELECT(
    ข้อมูลคุณภาพน้ำ[คลอรีนน้ำ ที่ใช้],
    AND(
      [วันที่ บันทึก] >= [_THISROW].[Start Date],
      [วันที่ บันทึก] <= [_THISROW].[End Date]
    )
  )
)
```

#### คอลัมน์ `Sum_excess sludge`

**App formula (สูตรคำนวณ)**

```appsheet
=SUM(
  SELECT(
    ข้อมูลคุณภาพน้ำ[ตะกอนส่วนเกินที่นำไปกำจัด],
    AND(
     [วันที่ บันทึก] >= [_THISROW].[Start Date],
     [วันที่ บันทึก] <= [_THISROW].[End Date]
    )
  )
)
```

#### คอลัมน์ `useage_Chlorine`

**App formula (สูตรคำนวณ)**

```appsheet
=SUM(
  SELECT(
    ข้อมูลคุณภาพน้ำ[คลอรีนน้ำที่ใช้จริง],
    AND(
      [วันที่ บันทึก] >= [_THISROW].[Start Date],
      [วันที่ บันทึก] <= [_THISROW].[End Date]
    )
  )
)
```

#### คอลัมน์ `Filter`

**App formula (สูตรคำนวณ)**

```appsheet
=FILTER(
  "ข้อมูลคุณภาพน้ำ",
   (AND
       ( 
        [วันที่ บันทึก] >= [_THISROW].[Start Date],
        [วันที่ บันทึก] <= [_THISROW].[End Date]
        )))
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `ข้อมูลคุณภาพน้ำ`)
App formula: =FILTER(
  "ข้อมูลคุณภาพน้ำ",
   (AND
       ( 
        [วันที่ บันทึก] >= [_THISROW].[Start Date],
        [วันที่ บันทึก] <= [_THISROW].[End Date]
        )))
```

#### คอลัมน์ `Temp`

**App formula (สูตรคำนวณ)**

```appsheet
=select(ข้อมูลคุณภาพน้ำ[อุณหภูมิ บ่อเติมอากาศ(Temperature)],AND(IF(
ISNOTBLANK([Start Date]),[วันที่ บันทึก]>=[_THISROW].[Start Date],true),IF(ISNOTBLANK([End Date]),[วันที่ บันทึก]<=[_THISROW].[End Date],true)))
```

#### คอลัมน์ `month_thai`

**App formula (สูตรคำนวณ)**

```appsheet
=SWITCH(MONTH([Start Date]), 
  1, "มกราคม", 
  2, "กุมภาพันธ์", 
  3, "มีนาคม", 
  4, "เมษายน", 
  5, "พฤษภาคม", 
  6, "มิถุนายน", 
  7, "กรกฎาคม", 
  8, "สิงหาคม", 
  9, "กันยายน", 
  10, "ตุลาคม", 
  11, "พฤศจิกายน", 
  12, "ธันวาคม", 
  "ไม่มีข้อมูล")
```

#### คอลัมน์ `year_thai`

**App formula (สูตรคำนวณ)**

```appsheet
=year([Start Date])+543
```

#### คอลัมน์ `St.M.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=SWITCH(MONTH([Start Date]), 
  1, "มกราคม", 
  2, "กุมภาพันธ์", 
  3, "มีนาคม", 
  4, "เมษายน", 
  5, "พฤษภาคม", 
  6, "มิถุนายน", 
  7, "กรกฎาคม", 
  8, "สิงหาคม", 
  9, "กันยายน", 
  10, "ตุลาคม", 
  11, "พฤศจิกายน", 
  12, "ธันวาคม", 
  "ไม่มีข้อมูล")
```

#### คอลัมน์ `St.D.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=day([Start Date])
```

#### คอลัมน์ `St.Y.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=year([Start Date])+543
```

#### คอลัมน์ `End.M.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=SWITCH(MONTH([End Date]), 
  1, "มกราคม", 
  2, "กุมภาพันธ์", 
  3, "มีนาคม", 
  4, "เมษายน", 
  5, "พฤษภาคม", 
  6, "มิถุนายน", 
  7, "กรกฎาคม", 
  8, "สิงหาคม", 
  9, "กันยายน", 
  10, "ตุลาคม", 
  11, "พฤศจิกายน", 
  12, "ธันวาคม", 
  "ไม่มีข้อมูล")
```

#### คอลัมน์ `End.D.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=day([End Date])
```

#### คอลัมน์ `End.Y.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=year([End Date])+543
```

#### คอลัมน์ `Link.PDF1`

**App formula (สูตรคำนวณ)**

```appsheet
=CONCATENATE(
"https://www.appsheet.com/template/gettablefileurl?",
"appName=",ENCODEURL("ActivatedSludge-29279640"),
"&tableName=",ENCODEURL("FILTER_WATER"),
"&fileName=",ENCODEURL([PDF]))
```

#### คอลัมน์ `Link.PDF2`

**App formula (สูตรคำนวณ)**

```appsheet
=CONCATENATE(
"https://www.appsheet.com/template/gettablefileurl?",
"appName=",ENCODEURL("ActivatedSludge-29279640"),
"&tableName=",ENCODEURL("FILTER_WATER"),
"&fileName=",ENCODEURL([PDF 2]))
```

#### คอลัมน์ `W/V_Chlorine Litter`

**App formula (สูตรคำนวณ)**

```appsheet
=[useage_Chlorine]*1.2
```

#### คอลัมน์ `VC_Chart_URL`

**App formula (สูตรคำนวณ)**

```appsheet
="https://quickchart.io/chart?c=%7B%22type%22%3A%22line%22%2C%22data%22%3A%7B%22labels%22%3A%5B%22Jan%22%2C%22Feb%22%2C%22Mar%22%2C%22Apr%22%2C%22May%22%2C%22Jun%22%2C%22Jul%22%2C%22Aug%22%2C%22Sep%22%2C%22Oct%22%2C%22Nov%22%2C%22Dec%22%5D%2C%22datasets%22%3A%5B%7B%22label%22%3A%22" 
& (YEAR(TODAY())-1) & 
"%22%2C%22data%22%3A%5B" & [VC_Elec_LY] & "%5D%2C%22borderColor%22%3A%22%2305ca75%22%2C%22backgroundColor%22%3A%22rgba(120%2C243%2C139%2C0.2)%22%2C%22fill%22%3Atrue%2C%22lineTension%22%3A0.4%2C%22borderWidth%22%3A1%2C%22pointStyle%22%3A%22circle%22%2C%22pointRadius%22%3A2%7D%2C%7B%22label%22%3A%22" 
& YEAR(TODAY()) & 
"%22%2C%22data%22%3A%5B" & [VC_Elec_CY] & "%5D%2C%22borderColor%22%3A%22%23db2bf2%22%2C%22backgroundColor%22%3A%22rgba(249%2C157%2C241%2C0.2)%22%2C%22fill%22%3Atrue%2C%22lineTension%22%3A0.4%2C%22borderWidth%22%3A1%2C%22pointStyle%22%3A%22circle%22%2C%22pointRadius%22%3A2%7D%5D%7D%2C%22options%22%3A%7B%22title%22%3A%7B%22display%22%3Atrue%2C%22text%22%3A%22%E0%B9%80%E0%B8%9B%E0%B8%A3%E0%B8%B5%E0%B8%A2%E0%B8%9A%E0%B9%80%E0%B8%97%E0%B8%B5%E0%B8%A2%E0%B8%9A%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B9%83%E0%B8%8A%E0%B9%89%E0%B9%84%E0%B8%9F%E0%B8%A3%E0%B8%B0%E0%B8%9A%E0%B8%9A%E0%B8%9A%E0%B8%B3%E0%B8%9A%E0%B8%B1%E0%B8%94%E0%B8%99%E0%B9%89%E0%B8%B3%E0%B9%80%E0%B8%AA%E0%B8%B5%E0%B8%A2%E0%B8%95%E0%B9%88%E0%B8%AD%E0%B8%9B%E0%B8%B5%22%2C%22fontSize%22%3A15%2C%22fontColor%22%3A%22%23000000%22%2C%22fontStyle%22%3A%22bold%22%7D%2C%22legend%22%3A%7B%22display%22%3Atrue%2C%22position%22%3A%22top%22%2C%22align%22%3A%22center%22%2C%22labels%22%3A%7B%22fontSize%22%3A12%2C%22fontColor%22%3A%22%23666666%22%7D%7D%7D%7D"
```

#### คอลัมน์ `VC_CY_01`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(
  MONTH(TODAY()) > 1,
  SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ], 
    AND(YEAR([วันที่ บันทึก]) = YEAR(TODAY()), MONTH([วันที่ บันทึก]) = 1))),
  "null"
)
```

#### คอลัมน์ `VC_CY_02`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(
  MONTH(TODAY()) > 2,
  SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ], 
    AND(YEAR([วันที่ บันทึก]) = YEAR(TODAY()), MONTH([วันที่ บันทึก]) = 2))),
  "null"
)
```

#### คอลัมน์ `VC_CY_03`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(
  MONTH(TODAY()) > 3,
  SUM(
    SELECT(
      ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ],
      AND(YEAR([วันที่ บันทึก]) = YEAR(TODAY()), MONTH([วันที่ บันทึก]) = 3)
    )
  ),
  "null"
)
```

#### คอลัมน์ `VC_CY_04`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(
  MONTH(TODAY()) > 4,
  SUM(
    SELECT(
      ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ],
      AND(YEAR([วันที่ บันทึก]) = YEAR(TODAY()), MONTH([วันที่ บันทึก]) = 4)
    )
  ),
  "null"
)
```

#### คอลัมน์ `VC_CY_05`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(
  MONTH(TODAY()) > 5,
  SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ], 
    AND(YEAR([วันที่ บันทึก]) = YEAR(TODAY()), MONTH([วันที่ บันทึก]) = 5))),
  "null"
)
```

#### คอลัมน์ `VC_CY_06`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(
  MONTH(TODAY()) > 6,
  SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ], 
    AND(YEAR([วันที่ บันทึก]) = YEAR(TODAY()), MONTH([วันที่ บันทึก]) = 6))),
  "null"
)
```

#### คอลัมน์ `VC_CY_07`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(
  MONTH(TODAY()) > 7,
  SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ], 
    AND(YEAR([วันที่ บันทึก]) = YEAR(TODAY()), MONTH([วันที่ บันทึก]) = 7))),
  "null"
)
```

#### คอลัมน์ `VC_CY_08`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(
  MONTH(TODAY()) > 8,
  SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ], 
    AND(YEAR([วันที่ บันทึก]) = YEAR(TODAY()), MONTH([วันที่ บันทึก]) = 8))),
  "null"
)
```

#### คอลัมน์ `VC_CY_09`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(
  MONTH(TODAY()) > 9,
  SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ], 
    AND(YEAR([วันที่ บันทึก]) = YEAR(TODAY()), MONTH([วันที่ บันทึก]) = 9))),
  "null"
)
```

#### คอลัมน์ `VC_CY_10`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(
  MONTH(TODAY()) > 10,
  SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ], 
    AND(YEAR([วันที่ บันทึก]) = YEAR(TODAY()), MONTH([วันที่ บันทึก]) = 10))),
  "null"
)
```

#### คอลัมน์ `VC_CY_11`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(
  MONTH(TODAY()) > 11,
  SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ], 
    AND(YEAR([วันที่ บันทึก]) = YEAR(TODAY()), MONTH([วันที่ บันทึก]) = 11))),
  "null"
)
```

#### คอลัมน์ `VC_CY_12`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(
  MONTH(TODAY()) > 12,
  SUM(SELECT(ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ], 
    AND(YEAR([วันที่ บันทึก]) = YEAR(TODAY()), MONTH([วันที่ บันทึก]) = 12))),
  "null"
)
```

#### คอลัมน์ `VC_Elec_CY`

**App formula (สูตรคำนวณ)**

```appsheet
=[VC_CY_01] & "%2C" &
[VC_CY_02] & "%2C" &
[VC_CY_03] & "%2C" &
[VC_CY_04] & "%2C" &
[VC_CY_05] & "%2C" &
[VC_CY_06] & "%2C" &
[VC_CY_07] & "%2C" &
[VC_CY_08] & "%2C" &
[VC_CY_09] & "%2C" &
[VC_CY_10] & "%2C" &
[VC_CY_11] & "%2C" &
[VC_CY_12]
```

#### คอลัมน์ `VC_LY_01`

**App formula (สูตรคำนวณ)**

```appsheet
=SUM(
  SELECT(
    ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ],
    AND(
      YEAR([วันที่ บันทึก]) = YEAR(TODAY()) - 1,
      MONTH([วันที่ บันทึก]) = 1
    )
  )
)
```

#### คอลัมน์ `VC_LY_02`

**App formula (สูตรคำนวณ)**

```appsheet
=SUM(
  SELECT(
    ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ],
    AND(
      YEAR([วันที่ บันทึก]) = YEAR(TODAY())-1,
      MONTH([วันที่ บันทึก]) = 2
    )
  )
)
```

#### คอลัมน์ `VC_LY_03`

**App formula (สูตรคำนวณ)**

```appsheet
=SUM(
  SELECT(
    ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ],
    AND(
      YEAR([วันที่ บันทึก]) = YEAR(TODAY()) - 1,
      MONTH([วันที่ บันทึก]) = 3
    )
  )
)
```

#### คอลัมน์ `VC_LY_04`

**App formula (สูตรคำนวณ)**

```appsheet
=SUM(
  SELECT(
    ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ],
    AND(
      YEAR([วันที่ บันทึก]) = YEAR(TODAY()) - 1,
      MONTH([วันที่ บันทึก]) = 4
    )
  )
)
```

#### คอลัมน์ `VC_LY_05`

**App formula (สูตรคำนวณ)**

```appsheet
=SUM(
  SELECT(
    ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ],
    AND(
      YEAR([วันที่ บันทึก]) = YEAR(TODAY()) - 1,
      MONTH([วันที่ บันทึก]) = 5
    )
  )
)
```

#### คอลัมน์ `VC_LY_06`

**App formula (สูตรคำนวณ)**

```appsheet
=SUM(
  SELECT(
    ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ],
    AND(
      YEAR([วันที่ บันทึก]) = YEAR(TODAY()) - 1,
      MONTH([วันที่ บันทึก]) = 6
    )
  )
)
```

#### คอลัมน์ `VC_LY_07`

**App formula (สูตรคำนวณ)**

```appsheet
=SUM(
  SELECT(
    ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ],
    AND(
      YEAR([วันที่ บันทึก]) = YEAR(TODAY()) - 1,
      MONTH([วันที่ บันทึก]) = 7
    )
  )
)
```

#### คอลัมน์ `VC_LY_08`

**App formula (สูตรคำนวณ)**

```appsheet
=SUM(
  SELECT(
    ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ],
    AND(
      YEAR([วันที่ บันทึก]) = YEAR(TODAY()) - 1,
      MONTH([วันที่ บันทึก]) = 8
    )
  )
)
```

#### คอลัมน์ `VC_LY_09`

**App formula (สูตรคำนวณ)**

```appsheet
=SUM(
  SELECT(
    ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ],
    AND(
      YEAR([วันที่ บันทึก]) = YEAR(TODAY()) - 1,
      MONTH([วันที่ บันทึก]) = 9
    )
  )
)
```

#### คอลัมน์ `VC_LY_10`

**App formula (สูตรคำนวณ)**

```appsheet
=SUM(
  SELECT(
    ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ],
    AND(
      YEAR([วันที่ บันทึก]) = YEAR(TODAY()) - 1,
      MONTH([วันที่ บันทึก]) = 10
    )
  )
)
```

#### คอลัมน์ `VC_LY_11`

**App formula (สูตรคำนวณ)**

```appsheet
=SUM(
  SELECT(
    ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ],
    AND(
      YEAR([วันที่ บันทึก]) = YEAR(TODAY()) - 1,
      MONTH([วันที่ บันทึก]) = 11
    )
  )
)
```

#### คอลัมน์ `VC_LY_12`

**App formula (สูตรคำนวณ)**

```appsheet
=SUM(
  SELECT(
    ข้อมูลคุณภาพน้ำ[ปริมาณการใช้ไฟฟ้าของระบบ],
    AND(
      YEAR([วันที่ บันทึก]) = YEAR(TODAY()) - 1,
      MONTH([วันที่ บันทึก]) = 12
    )
  )
)
```

#### คอลัมน์ `VC_Elec_LY`

**App formula (สูตรคำนวณ)**

```appsheet
=[VC_LY_01] & "%2C" &
[VC_LY_02] & "%2C" &
[VC_LY_03] & "%2C" &
[VC_LY_04] & "%2C" &
[VC_LY_05] & "%2C" &
[VC_LY_06] & "%2C" &
[VC_LY_07] & "%2C" &
[VC_LY_08] & "%2C" &
[VC_LY_09] & "%2C" &
[VC_LY_10] & "%2C" &
[VC_LY_11] & "%2C" &
[VC_LY_12]
```

#### คอลัมน์ `Total_CO2_CY`

**App formula (สูตรคำนวณ)**

```appsheet
=(
  NUMBER([VC_CY_01]) + NUMBER([VC_CY_02]) + NUMBER([VC_CY_03]) + 
  NUMBER([VC_CY_04]) + NUMBER([VC_CY_05]) + NUMBER([VC_CY_06]) + 
  NUMBER([VC_CY_07]) + NUMBER([VC_CY_08]) + NUMBER([VC_CY_09]) + 
  NUMBER([VC_CY_10]) + NUMBER([VC_CY_11]) + NUMBER([VC_CY_12])
) * 0.4999
```

#### คอลัมน์ `Total_CO2_LY`

**App formula (สูตรคำนวณ)**

```appsheet
=(
  NUMBER([VC_LY_01]) + NUMBER([VC_LY_02]) + NUMBER([VC_LY_03]) + 
  NUMBER([VC_LY_04]) + NUMBER([VC_LY_05]) + NUMBER([VC_LY_06]) + 
  NUMBER([VC_LY_07]) + NUMBER([VC_LY_08]) + NUMBER([VC_LY_09]) + 
  NUMBER([VC_LY_10]) + NUMBER([VC_LY_11]) + NUMBER([VC_LY_12])
) * 0.4999
```

### 3.8 ตาราง `น้ำประปา` — 22 คอลัมน์ (key: Row ID)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `Row ID` | Text | Key ReadOnly hidden |
| `ผู้บันทึก` | Ref | Label |
| `Date` | Date | — |
| `สถานที่` | Enum | — |
| `Residual Free Chlorine` | Decimal | — |
| `TDS` | Decimal | — |
| `ชนิดเครื่องมือตรวจ` | Ref | — |
| `Chlorine usage` | Decimal | — |
| `activity` | Enum | — |
| `Hour_meter` | Decimal | — |
| `Energy_use` | Decimal | hidden |
| `Water_In` | Decimal | — |
| `real_Chlorine` | Decimal | hidden |
| `Related tap water_Filters` | List | Virtual System |
| `chlorine_concentrated` | Decimal | Virtual ReadOnly |
| `M_thai` | Text | Virtual ReadOnly |
| `D_thai` | Number | Virtual ReadOnly |
| `Y_thai` | Number | Virtual ReadOnly |
| `last_Hour_meter` | Decimal | Virtual ReadOnly hidden |
| `Hour_Work` | Decimal | Virtual ReadOnly hidden |
| `Chlorine_usage_realy` | Decimal | Virtual ReadOnly |

#### คอลัมน์ `Row ID`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID("PackedUUID")
```

#### คอลัมน์ `ผู้บันทึก`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=SWITCH(USEREMAIL(), 
  "[REDACTED_EMAIL]", "⟨thai-id ID1⟩", 
  "[REDACTED_EMAIL]", "⟨thai-id ID1⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID2⟩",
  "[REDACTED_EMAIL]","⟨id-like ID5⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID3⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID4⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID4⟩",
  "READ_ONLY")
```

**Valid If (เงื่อนไขค่าที่ยอมรับ)**

```appsheet
=SELECT(ข้อมูลผู้ปฏิบัติงาน[Employee_id],AND([ตำแหน่ง]<>"นายแพทย์",[สถานะ]="ทำงาน",OR([ตำแหน่ง]="นักวิชาการสาธารณสุข",[ตำแหน่ง]="พนักงานบริการ")))
```

**Ref → ตารางอ้างอิง**

`ข้อมูลผู้ปฏิบัติงาน` (key: `Employee_id`)

#### คอลัมน์ `Date`

**Initial value (ค่าเริ่มต้น)**

```appsheet
NOW()
```

#### คอลัมน์ `สถานที่`

**Initial value (ค่าเริ่มต้น)**

```appsheet
="โรงจ่ายคลอรีน"
```

**Enum Values (ตัวเลือก)**

`WARD` / `ER` / `สวนโรจนะ` / `โรงช่าง` / `โรงจ่ายคลอรีน` / `โรงครัว` / `โรงขยะ` / `แพทย์แผนไทย` / `บ่อบำบัดน้ำเสีย` / `ซักฟอก` / `ร้านกาแฟ พี่หนึ่ง(ประปา อบต.)` / `ซักฟอก(ประปาภูมิภาค)`

#### คอลัมน์ `Residual Free Chlorine`

**Show If (เงื่อนไขการแสดง)**

```appsheet
=AND([ชนิดเครื่องมือตรวจ]="cf9a417e",[activity]<>"ลงข้อมูลการใช้น้ำประจำวัน")
```

#### คอลัมน์ `TDS`

**Show If (เงื่อนไขการแสดง)**

```appsheet
=AND([ชนิดเครื่องมือตรวจ]="6aa9cc77",[activity]<>"ลงข้อมูลการใช้น้ำประจำวัน")
```

#### คอลัมน์ `ชนิดเครื่องมือตรวจ`

**Valid If (เงื่อนไขค่าที่ยอมรับ)**

```appsheet
=select(ITEMS[Item ID],(OR([Item ID]="cf9a417e",[Item ID]="6aa9cc77")))
```

**Show If (เงื่อนไขการแสดง)**

```appsheet
=[activity]<>"ลงข้อมูลการใช้น้ำประจำวัน"
```

**Ref → ตารางอ้างอิง**

`Items` (key: `Item ID`)

#### คอลัมน์ `Chlorine usage`

**Show If (เงื่อนไขการแสดง)**

```appsheet
=And([สถานที่]="โรงจ่ายคลอรีน",[activity]="ลงข้อมูลการใช้น้ำประจำวัน")
```

#### คอลัมน์ `activity`

**Initial value (ค่าเริ่มต้น)**

```appsheet
="ลงข้อมูลการใช้น้ำประจำวัน"
```

**Enum Values (ตัวเลือก)**

`ลงข้อมูลการใช้น้ำประจำวัน` / `ฟรีคลอรีน / TDS`

#### คอลัมน์ `Hour_meter`

**Show If (เงื่อนไขการแสดง)**

```appsheet
=And([สถานที่]="โรงจ่ายคลอรีน",[activity]="ลงข้อมูลการใช้น้ำประจำวัน")
```

#### คอลัมน์ `Energy_use`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(
    ([Hour_meter] - [last_Hour_meter]) * 3.7 < 0,
    0,
    ([Hour_meter] - [last_Hour_meter]) * 3.7
  )
```

**Initial value (ค่าเริ่มต้น)**

```appsheet
=ไฟฟ้าที่ใช้
```

#### คอลัมน์ `Water_In`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(ISBLANK([ชนิดเครื่องมือตรวจ]), [Hour_Work] * 8, "")
```

**Initial value (ค่าเริ่มต้น)**

```appsheet
=บริมาณน้ำเข้า
```

**Valid If (เงื่อนไขค่าที่ยอมรับ)**

```appsheet
=[Water_In]>0
```

**Invalid value error (ข้อความเมื่อค่าไม่ผ่าน)**

```appsheet
="ตรวจสอบข้อมูลดีๆก่อน"
```

**Show If (เงื่อนไขการแสดง)**

```appsheet
=[activity]<>"ฟรีคลอรีน / TDS"
```

#### คอลัมน์ `real_Chlorine`

**App formula (สูตรคำนวณ)**

```appsheet
=[Chlorine_usage_realy]
```

#### คอลัมน์ `Related tap water_Filters`

**App formula (สูตรคำนวณ)**

```appsheet
REF_ROWS("tap water_Filter", "id")
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `tap water_Filter`)
Description (verbatim): "tap water_Filter entries that reference this entry in the id column"
App formula: REF_ROWS("tap water_Filter", "id")
```

#### คอลัมน์ `chlorine_concentrated`

**App formula (สูตรคำนวณ)**

```appsheet
=[Chlorine usage]/10
```

#### คอลัมน์ `M_thai`

**App formula (สูตรคำนวณ)**

```appsheet
=SWITCH(MONTH([Date]), 
  1, "มกราคม", 
  2, "กุมภาพันธ์", 
  3, "มีนาคม", 
  4, "เมษายน", 
  5, "พฤษภาคม", 
  6, "มิถุนายน", 
  7, "กรกฎาคม", 
  8, "สิงหาคม", 
  9, "กันยายน", 
  10, "ตุลาคม", 
  11, "พฤศจิกายน", 
  12, "ธันวาคม", 
  "ไม่มีข้อมูล")
```

#### คอลัมน์ `D_thai`

**App formula (สูตรคำนวณ)**

```appsheet
=day([Date])
```

#### คอลัมน์ `Y_thai`

**App formula (สูตรคำนวณ)**

```appsheet
=year([Date])+543
```

#### คอลัมน์ `last_Hour_meter`

**App formula (สูตรคำนวณ)**

```appsheet
=MAX(SELECT(น้ำประปา[Hour_meter], [Date] < [_THISROW].[Date]))
```

#### คอลัมน์ `Hour_Work`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(
ISNOTBLANK([Hour_meter]),[Hour_meter]-[last_Hour_meter],"")
```

#### คอลัมน์ `Chlorine_usage_realy`

**App formula (สูตรคำนวณ)**

```appsheet
=[Chlorine usage]/10
```

**Show If (เงื่อนไขการแสดง)**

```appsheet
=And([สถานที่]="โรงจ่ายคลอรีน",[activity]="ลงข้อมูลการใช้น้ำประจำวัน")
```

### 3.9 ตาราง `Menu ประปา` — 6 คอลัมน์ (key: Row ID)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `2`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `Row ID` | Text | Key ReadOnly hidden |
| `name` | Text | Label |
| `icon` | Image | — |
| `Link` | Text | — |
| `Link view` | App | Virtual ReadOnly |

#### คอลัมน์ `Row ID`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID("PackedUUID")
```

#### คอลัมน์ `Link view`

**App formula (สูตรคำนวณ)**

```appsheet
=LINKTOVIEW([Link], "ActivatedSludge-29279640")
```

### 3.10 ตาราง `tap water_Filter` — 21 คอลัมน์ (key: _ComputedKey)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `Row ID` | Text | ReadOnly hidden |
| `id` | Ref | hidden |
| `Start date` | Date | Label |
| `End date` | Date | — |
| `PDF` | File | — |
| `Trigger_PDF` | DateTime | — |
| `pdfCount` | ChangeCounter | — |
| `_ComputedKey` | Text | Key Virtual System hidden |
| `Sum_water_in` | Number | Virtual ReadOnly |
| `Sum_Chlorine_use` | Decimal | Virtual ReadOnly |
| `Energy usage` | Decimal | Virtual ReadOnly |
| `Kg_chlorine` | Decimal | Virtual ReadOnly |
| `รายการตรวจสอบที่เรียงแล้ว` | List | Virtual ReadOnly |
| `linkPDF` | Text | Virtual ReadOnly |
| `Start.D.thai` | Text | Virtual ReadOnly |
| `Start.M.thai` | Text | Virtual ReadOnly |
| `Start.Y.thai` | Text | Virtual ReadOnly |
| `END.D.thai` | Text | Virtual ReadOnly |
| `END.M.thai` | Text | Virtual ReadOnly |
| `END.Y.thai` | Number | Virtual ReadOnly |

#### คอลัมน์ `Row ID`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID("PackedUUID")
```

#### คอลัมน์ `id`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=UNIQUEID()
```

**Ref → ตารางอ้างอิง**

`น้ำประปา` (key: `Row ID`)

#### คอลัมน์ `Start date`

**Initial value (ค่าเริ่มต้น)**

```appsheet
TODAY()
```

#### คอลัมน์ `End date`

**Initial value (ค่าเริ่มต้น)**

```appsheet
TODAY()
```

#### คอลัมน์ `Trigger_PDF`

**Initial value (ค่าเริ่มต้น)**

```appsheet
NOW()
```

#### คอลัมน์ `pdfCount`

**Initial value (ค่าเริ่มต้น)**

```appsheet
1
```

#### คอลัมน์ `_ComputedKey`

**App formula (สูตรคำนวณ)**

```appsheet
CONCATENATE([Row ID],": ",[id])
```

#### คอลัมน์ `Sum_water_in`

**App formula (สูตรคำนวณ)**

```appsheet
=SUM(
  SELECT(
    น้ำประปา[Water_In],
    AND(
      [Date] >= [_THISROW].[Start Date],
     [Date] <= [_THISROW].[End Date]
    )
  )
)
```

#### คอลัมน์ `Sum_Chlorine_use`

**App formula (สูตรคำนวณ)**

```appsheet
=SUM(
  SELECT(
    น้ำประปา[Chlorine_usage_realy],
    AND(
      [Date] >= [_THISROW].[Start Date],
     [Date] <= [_THISROW].[End Date]
    )
  )
)
```

#### คอลัมน์ `Energy usage`

**App formula (สูตรคำนวณ)**

```appsheet
=SUM(
  SELECT(
    น้ำประปา[Energy_use],
    AND(
      [Date] >= [_THISROW].[Start Date],
     [Date] <= [_THISROW].[End Date]
    )
  )
)
```

#### คอลัมน์ `Kg_chlorine`

**App formula (สูตรคำนวณ)**

```appsheet
=[Sum_Chlorine_use]*1.2
```

#### คอลัมน์ `รายการตรวจสอบที่เรียงแล้ว`

**App formula (สูตรคำนวณ)**

```appsheet
=ORDERBY(
  FILTER(
    "น้ำประปา", 
    AND(
      [Date] >= [_THISROW].[Start Date], 
      [Date] <= [_THISROW].[End Date]
    )
  ), 
  [Date], 
  FALSE
)
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `น้ำประปา`)
App formula: =ORDERBY(
  FILTER(
    "น้ำประปา", 
    AND(
      [Date] >= [_THISROW].[Start Date], 
      [Date] <= [_THISROW].[End Date]
    )
  ), 
  [Date], 
  FALSE
)
```

#### คอลัมน์ `linkPDF`

**App formula (สูตรคำนวณ)**

```appsheet
=CONCATENATE(
"https://www.appsheet.com/template/gettablefileurl?",
"appName=",ENCODEURL("ActivatedSludge-29279640"),
"&tableName=",ENCODEURL("TAP WATER_FILTER"),
"&fileName=",ENCODEURL([PDF]))
```

#### คอลัมน์ `Start.D.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=day([Start Date])
```

#### คอลัมน์ `Start.M.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=SWITCH(MONTH([Start Date]), 
  1, "มกราคม", 
  2, "กุมภาพันธ์", 
  3, "มีนาคม", 
  4, "เมษายน", 
  5, "พฤษภาคม", 
  6, "มิถุนายน", 
  7, "กรกฎาคม", 
  8, "สิงหาคม", 
  9, "กันยายน", 
  10, "ตุลาคม", 
  11, "พฤศจิกายน", 
  12, "ธันวาคม", 
  "ไม่มีข้อมูล")
```

#### คอลัมน์ `Start.Y.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=year([Start Date])+543
```

#### คอลัมน์ `END.D.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=day([End Date])
```

#### คอลัมน์ `END.M.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=SWITCH(MONTH([End Date]), 
  1, "มกราคม", 
  2, "กุมภาพันธ์", 
  3, "มีนาคม", 
  4, "เมษายน", 
  5, "พฤษภาคม", 
  6, "มิถุนายน", 
  7, "กรกฎาคม", 
  8, "สิงหาคม", 
  9, "กันยายน", 
  10, "ตุลาคม", 
  11, "พฤศจิกายน", 
  12, "ธันวาคม", 
  "ไม่มีข้อมูล")
```

#### คอลัมน์ `END.Y.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=year([End Date])+543
```

### 3.11 ตาราง `coliform bac.` — 8 คอลัมน์ (key: Row ID)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `Row ID` | Text | Key ReadOnly hidden |
| `collect_date` | Date | Label |
| `สานถานที่เก็บตัวอย่าง` | Enum | — |
| `result_date` | Date | — |
| `Result` | Enum | — |
| `ผู้รายงาน` | Ref | — |
| `อ11` | Image | Virtual ReadOnly |

#### คอลัมน์ `Row ID`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID("PackedUUID")
```

#### คอลัมน์ `collect_date`

**Initial value (ค่าเริ่มต้น)**

```appsheet
TODAY()
```

#### คอลัมน์ `สานถานที่เก็บตัวอย่าง`

**Enum Values (ตัวเลือก)**

`โรงครัว` / `บ่อบำบัด`

#### คอลัมน์ `result_date`

**Initial value (ค่าเริ่มต้น)**

```appsheet
TODAY()
```

#### คอลัมน์ `Result`

**Enum Values (ตัวเลือก)**

`Positive` / `Negative`

#### คอลัมน์ `ผู้รายงาน`

**Valid If (เงื่อนไขค่าที่ยอมรับ)**

```appsheet
=select(ข้อมูลผู้ปฏิบัติงาน[Employee_id],([ตำแหน่ง]<>"นายแพทย์"))
```

**Ref → ตารางอ้างอิง**

`ข้อมูลผู้ปฏิบัติงาน` (key: `Employee_id`)

#### คอลัมน์ `อ11`

**App formula (สูตรคำนวณ)**

```appsheet
="https://drive.google.com/uc?id=1L6zwTU0jW8iEolBXVtp6zdSNeLyvSHaR"
```

### 3.12 ตาราง `ข้อมูลถังดับเพลิง` — 9 คอลัมน์ (key: Row ID)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `Row ID` | Text | Key ReadOnly hidden |
| `Location` | Text | Label |
| `ประเภทถังดับเพลิง` | Enum | — |
| `รูปถ่ายถังดับเพลิง` | Image | Label |
| `QR CODE` | Image | — |
| `วันที่บรรจุ` | Date | — |
| `วันที่หมดอายุ` | Date | — |
| `ขนาดบรรจุ` | Text | — |

#### คอลัมน์ `Row ID`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID("PackedUUID")
```

#### คอลัมน์ `ประเภทถังดับเพลิง`

**Enum Values (ตัวเลือก)**

`เคมีแห้ง (Dry Chemical Extinguishers)` / `สารเหลวระเหย BF2000` / `น้ำยาโฟม (Foam Extinguishers)` / `คาร์บอนไดออกไซด์ (Carbon Dioxide (CO2) Extinguishers)` / `น้ำ (Best Drop)`

#### คอลัมน์ `QR CODE`

**App formula (สูตรคำนวณ)**

```appsheet
="https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=" & [Row ID]
```

#### คอลัมน์ `วันที่บรรจุ`

**Initial value (ค่าเริ่มต้น)**

```appsheet
TODAY()
```

#### คอลัมน์ `วันที่หมดอายุ`

**Initial value (ค่าเริ่มต้น)**

```appsheet
TODAY()
```

### 3.13 ตาราง `ตรวจสอบถัง` — 27 คอลัมน์ (key: row_ID)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `row_ID` | Text | Key hidden |
| `Date_time` | Date | Label |
| `QR_CODE` | Text | — |
| `location` | Text | — |
| `type` | Enum | — |
| `packing_date` | Date | — |
| `chem_exp` | Date | — |
| `packing_weight` | Text | — |
| `pipe` | Enum | — |
| `handle` | Enum | — |
| `tank` | Enum | — |
| `pressure_gauge` | Enum | — |
| `barrier` | Enum | — |
| `breakdown_details` | Text | — |
| `cause_of_damaged` | Enum | — |
| `ผู้ตรวจสอบ` | Ref | — |
| `รูปชำรุด` | Thumbnail | — |
| `Filter_Firer_ID` | Ref | hidden |
| `tank_photo` | Image | Virtual ReadOnly |
| `re_check` | List | Virtual ReadOnly |
| `M.THAI` | Text | Virtual ReadOnly hidden |
| `Y.THAI` | Text | Virtual ReadOnly hidden |
| `D.THAI` | Text | Virtual ReadOnly hidden |
| `Nickname` | Text | Virtual ReadOnly hidden |
| `Link.image` | Text | Virtual ReadOnly |
| `SortKey` | Text | Virtual ReadOnly |

#### คอลัมน์ `row_ID`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID()
```

#### คอลัมน์ `Date_time`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=now()
```

#### คอลัมน์ `QR_CODE`

**Initial value (ค่าเริ่มต้น)**

```appsheet
="สแกน QR CODE"
```

**Valid If (เงื่อนไขค่าที่ยอมรับ)**

```appsheet
=AND([QR_CODE]<>"สแกน QR CODE",[QR_CODE]<>"",IN([QR_CODE],ข้อมูลถังดับเพลิง[Row ID]))
```

**Invalid value error (ข้อความเมื่อค่าไม่ผ่าน)**

```appsheet
="ไม่พบข้อมูล!!  ให้ถามเอ นะจ๊ะ"
```

#### คอลัมน์ `location`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=select(ข้อมูลถังดับเพลิง[Location],[_THISROW].[QR_CODE]=[Row ID])
```

**Show If (เงื่อนไขการแสดง)**

```appsheet
=AND([QR_CODE]<>"สแกน QR CODE",[QR_CODE]<>"",IN([QR_CODE],ข้อมูลถังดับเพลิง[Row ID]))
```

#### คอลัมน์ `type`

**Invalid value error (ข้อความเมื่อค่าไม่ผ่าน)**

```appsheet
=กรุณาใส่ข้อมูล
```

**Show If (เงื่อนไขการแสดง)**

```appsheet
=AND([QR_CODE]<>"สแกน QR CODE",[QR_CODE]<>"",IN([QR_CODE],ข้อมูลถังดับเพลิง[Row ID]))
```

**Enum Values (ตัวเลือก)**

`เคมีแห้ง (Dry Chemical Extinguishers)` / `สารเหลวระเหย BF2000` / `น้ำยาโฟม (Foam Extinguishers)` / `คาร์บอนไดออกไซด์ (Carbon Dioxide (CO2) Extinguishers)` / `น้ำ (Water Extinguishers)` / `น้ำ (Best Drop แบบ Low Pressure Water Mist)`

#### คอลัมน์ `packing_date`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=date(select(ข้อมูลถังดับเพลิง[วันที่บรรจุ],[_THISROW].[QR_CODE]=[Row ID]))
```

**Show If (เงื่อนไขการแสดง)**

```appsheet
=AND([QR_CODE]<>"สแกน QR CODE",[QR_CODE]<>"",IN([QR_CODE],ข้อมูลถังดับเพลิง[Row ID]))
```

#### คอลัมน์ `chem_exp`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=date(select(ข้อมูลถังดับเพลิง[วันที่หมดอายุ],[_THISROW].[QR_CODE]=[Row ID]))
```

**Show If (เงื่อนไขการแสดง)**

```appsheet
=AND([QR_CODE]<>"สแกน QR CODE",[QR_CODE]<>"",IN([QR_CODE],ข้อมูลถังดับเพลิง[Row ID]))
```

#### คอลัมน์ `packing_weight`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=select(ข้อมูลถังดับเพลิง[ขนาดบรรจุ],[_THISROW].[QR_CODE]=[Row ID])
```

**Show If (เงื่อนไขการแสดง)**

```appsheet
=AND([QR_CODE]<>"สแกน QR CODE",[QR_CODE]<>"",IN([QR_CODE],ข้อมูลถังดับเพลิง[Row ID]))
```

#### คอลัมน์ `pipe`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=ปกติ
```

**Show If (เงื่อนไขการแสดง)**

```appsheet
=AND([QR_CODE]<>"สแกน QR CODE",[QR_CODE]<>"",IN([QR_CODE],ข้อมูลถังดับเพลิง[Row ID]))
```

**Enum Values (ตัวเลือก)**

`ปกติ` / `ชำรุด`

#### คอลัมน์ `handle`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=ปกติ
```

**Show If (เงื่อนไขการแสดง)**

```appsheet
=AND([QR_CODE]<>"สแกน QR CODE",[QR_CODE]<>"",IN([QR_CODE],ข้อมูลถังดับเพลิง[Row ID]))
```

**Enum Values (ตัวเลือก)**

`ปกติ` / `ชำรุด`

#### คอลัมน์ `tank`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=ปกติ
```

**Show If (เงื่อนไขการแสดง)**

```appsheet
=AND([QR_CODE]<>"สแกน QR CODE",[QR_CODE]<>"",IN([QR_CODE],ข้อมูลถังดับเพลิง[Row ID]))
```

**Enum Values (ตัวเลือก)**

`ปกติ` / `ชำรุด`

#### คอลัมน์ `pressure_gauge`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=ปกติ
```

**Show If (เงื่อนไขการแสดง)**

```appsheet
=AND([QR_CODE]<>"สแกน QR CODE",[QR_CODE]<>"",IN([QR_CODE],ข้อมูลถังดับเพลิง[Row ID]))
```

**Enum Values (ตัวเลือก)**

`ปกติ` / `ไม่ปกติ`

#### คอลัมน์ `barrier`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=ไม่มี
```

**Show If (เงื่อนไขการแสดง)**

```appsheet
=AND([QR_CODE]<>"สแกน QR CODE",[QR_CODE]<>"",IN([QR_CODE],ข้อมูลถังดับเพลิง[Row ID]))
```

**Enum Values (ตัวเลือก)**

`มี` / `ไม่มี`

#### คอลัมน์ `breakdown_details`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=IF([chem_exp]<=[Date_time],"หมดอายุ","ไม่หมดอายุ")
```

**Show If (เงื่อนไขการแสดง)**

```appsheet
=OR([pipe]<>"ปกติ",[handle]<>"ปกติ",[tank]<>"ปกติ",[pressure_gauge]<>"ปกติ",[barrier]<>"ไม่มี",[chem_exp]<=[Date_time],[QR_CODE]<>"สแกน QR CODE")
```

#### คอลัมน์ `cause_of_damaged`

**Show If (เงื่อนไขการแสดง)**

```appsheet
=OR([pipe]<>"ปกติ",[handle]<>"ปกติ",[tank]<>"ปกติ",[pressure_gauge]<>"ปกติ",[barrier]<>"ไม่มี")
```

**Enum Values (ตัวเลือก)**

`เกิดจากการใช้งาน` / `หมดอายุ`

#### คอลัมน์ `ผู้ตรวจสอบ`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=SWITCH(USEREMAIL(), 
  "[REDACTED_EMAIL]", "⟨thai-id ID1⟩", 
  "[REDACTED_EMAIL]", "⟨thai-id ID1⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID2⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID6⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID3⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID4⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID4⟩",
  "READ_ONLY")
```

**Valid If (เงื่อนไขค่าที่ยอมรับ)**

```appsheet
=SELECT(ข้อมูลผู้ปฏิบัติงาน[Employee_id],AND([ตำแหน่ง]<>"นายแพทย์",[สถานะ]<>"ลาออก",OR([ตำแหน่ง]="นักวิชาการสาธารณสุข",[ตำแหน่ง]="พนักงานบริการ")))
```

**Ref → ตารางอ้างอิง**

`ข้อมูลผู้ปฏิบัติงาน` (key: `Employee_id`)

#### คอลัมน์ `รูปชำรุด`

**Show If (เงื่อนไขการแสดง)**

```appsheet
=OR([pipe]<>"ปกติ",[handle]<>"ปกติ",[tank]<>"ปกติ",[pressure_gauge]<>"ปกติ",[barrier]<>"ไม่มี")
```

#### คอลัมน์ `Filter_Firer_ID`

**Ref → ตารางอ้างอิง**

`Filter_Firer` (key: `ID`)

#### คอลัมน์ `tank_photo`

**App formula (สูตรคำนวณ)**

```appsheet
="https://www.appsheet.com/image/getimageurl?appName=ActivatedSludge-29279640&tableName=%E0%B9%80%E0%B8%81%E0%B9%87%E0%B8%9A%E0%B8%A3%E0%B8%B9%E0%B8%9B&fileName=%E0%B9%80%E0%B8%81%E0%B9%87%E0%B8%9A%E0%B8%A3%E0%B8%B9%E0%B8%9B_Images%2F1589d4ac.im1.093812.png&appVersion=3.000662&signature=[REDACTED_SECRET] , https://www.appsheet.com/image/getimageurl?appName=ActivatedSludge-29279640&tableName=%E0%B9%80%E0%B8%81%E0%B9%87%E0%B8%9A%E0%B8%A3%E0%B8%B9%E0%B8%9B&fileName=%E0%B9%80%E0%B8%81%E0%B9%87%E0%B8%9A%E0%B8%A3%E0%B8%B9%E0%B8%9B_Images%2F2288bf26.im1.093920.png&appVersion=3.000662&signature=[REDACTED_SECRET] , https://www.appsheet.com/image/getimageurl?appName=ActivatedSludge-29279640&tableName=%E0%B9%80%E0%B8%81%E0%B9%87%E0%B8%9A%E0%B8%A3%E0%B8%B9%E0%B8%9B&fileName=%E0%B9%80%E0%B8%81%E0%B9%87%E0%B8%9A%E0%B8%A3%E0%B8%B9%E0%B8%9B_Images%2F9902af1e.im1.094614.png&appVersion=3.000662&signature=[REDACTED_SECRET]"
```

#### คอลัมน์ `re_check`

**App formula (สูตรคำนวณ)**

```appsheet
=select(ข้อมูลถังดับเพลิง[Row ID],[_THISROW].[QR_CODE]=[Row ID])
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `ข้อมูลถังดับเพลิง`)
Description (verbatim): "=ตรวจเช็คความถูกต้อง"
App formula: =select(ข้อมูลถังดับเพลิง[Row ID],[_THISROW].[QR_CODE]=[Row ID])
```

#### คอลัมน์ `M.THAI`

**App formula (สูตรคำนวณ)**

```appsheet
=SWITCH(MONTH([Date_time]), 
  1, "มกราคม", 
  2, "กุมภาพันธ์", 
  3, "มีนาคม", 
  4, "เมษายน", 
  5, "พฤษภาคม", 
  6, "มิถุนายน", 
  7, "กรกฎาคม", 
  8, "สิงหาคม", 
  9, "กันยายน", 
  10, "ตุลาคม", 
  11, "พฤศจิกายน", 
  12, "ธันวาคม", 
  "ไม่มีข้อมูล")
```

#### คอลัมน์ `Y.THAI`

**App formula (สูตรคำนวณ)**

```appsheet
=year([Date_time])+543
```

#### คอลัมน์ `D.THAI`

**App formula (สูตรคำนวณ)**

```appsheet
=day([Date_time])
```

#### คอลัมน์ `Nickname`

**App formula (สูตรคำนวณ)**

```appsheet
=[ผู้ตรวจสอบ].[ชื่อเล่น]
```

#### คอลัมน์ `Link.image`

**App formula (สูตรคำนวณ)**

```appsheet
=CONCATENATE(
"https://www.appsheet.com/template/gettablefileurl?",
"appName=",ENCODEURL("ActivatedSludge-29279640"),
"&tableName=",ENCODEURL("ตรวจสอบถัง"),
"&fileName=",ENCODEURL([รูปชำรุด]))
```

#### คอลัมน์ `SortKey`

**App formula (สูตรคำนวณ)**

```appsheet
=CONCATENATE([Date_time], "-", [_ROWNUMBER])
```

### 3.14 ตาราง `รูปหน้าซักประวัติ` — 3 คอลัมน์ (key: id)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `0`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `id` | Text | Key hidden |
| `รูป` | Image | Label |

#### คอลัมน์ `id`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID()
```

### 3.15 ตาราง `distributor` — 8 คอลัมน์ (key: id)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `id` | Text | Key hidden |
| `dealer` | Text | Label |
| `dealer_email` | Email | — |
| `dealer_address` | Address | — |
| `dealer_tel` | Phone | — |
| `salesname` | Text | — |
| `lineID` | Text | — |

#### คอลัมน์ `id`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID()
```

### 3.16 ตาราง `coliform bac._Water` — 8 คอลัมน์ (key: Collect_Location)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `Row ID` | Text | ReadOnly hidden |
| `Collect_date` | Date | — |
| `Collect_Location` | Enum | Key Label |
| `Result_date` | Date | — |
| `Result_bac.` | Enum | — |
| `อุปกรณ์` | Ref | — |
| `ผู้รายงาน` | Ref | — |

#### คอลัมน์ `Row ID`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID("PackedUUID")
```

#### คอลัมน์ `Collect_date`

**Initial value (ค่าเริ่มต้น)**

```appsheet
TODAY()
```

#### คอลัมน์ `Collect_Location`

**Enum Values (ตัวเลือก)**

`โรงครัว` / `ตู้กดน้ำ OPD` / `ตู้กดน้ำ IPD` / `ตู้กดน้ำปฐมภูมิ (ห้องฟัน)`

#### คอลัมน์ `Result_date`

**Initial value (ค่าเริ่มต้น)**

```appsheet
TODAY()
```

#### คอลัมน์ `Result_bac.`

**Enum Values (ตัวเลือก)**

`Positive` / `Negative`

#### คอลัมน์ `อุปกรณ์`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=aca317bf
```

**Ref → ตารางอ้างอิง**

`Items` (key: `Item ID`)

#### คอลัมน์ `ผู้รายงาน`

**Valid If (เงื่อนไขค่าที่ยอมรับ)**

```appsheet
=SELECT(ข้อมูลผู้ปฏิบัติงาน[Employee_id],AND([ตำแหน่ง]<>"นายแพทย์",[รูปภาพ]=[รูปภาพ],[ชื่อ-สกุล]=[ชื่อ-สกุล]))
```

**Ref → ตารางอ้างอิง**

`ข้อมูลผู้ปฏิบัติงาน` (key: `Employee_id`)

### 3.17 ตาราง `coliform bac. Food.` — 11 คอลัมน์ (key: Row ID)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `Row ID` | Text | Key ReadOnly hidden |
| `Collect_date` | Date | Label |
| `sample` | Enum | — |
| `Result_date` | Date | — |
| `Result_bac.` | Enum | — |
| `ภาพผลการตรวจ` | Image | — |
| `อุปกรณ์` | Ref | — |
| `ผู้เก็บตัวอย่าง` | Ref | — |
| `ผู้รายงาน` | Ref | — |
| `อุปกรณ์ (List)` | List | Virtual ReadOnly hidden |

#### คอลัมน์ `Row ID`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID("PackedUUID")
```

#### คอลัมน์ `Collect_date`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=NOW()
```

#### คอลัมน์ `sample`

**Enum Values (ตัวเลือก)**

`ช้อนสั้น` / `ถาด` / `มือพี่กุ้ง` / `มือป้าอ้อ` / `มือแก๊ป`

#### คอลัมน์ `Result_date`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=IF([Collect_date]>=NOW(),"",TODAY())
```

**Suggested values (ค่าแนะนำ)**

```appsheet
=LIST(date([Collect_date]+1),date([Collect_date]+2) )
```

**Show If (เงื่อนไขการแสดง)**

```appsheet
=TODAY()>[Collect_date]
```

#### คอลัมน์ `Result_bac.`

**Show If (เงื่อนไขการแสดง)**

```appsheet
=TODAY()>[Collect_date]
```

**Enum Values (ตัวเลือก)**

`Positive` / `Negative` / `Positive ++` / `invalid`

#### คอลัมน์ `ภาพผลการตรวจ`

**Show If (เงื่อนไขการแสดง)**

```appsheet
=TODAY()>[Collect_date]
```

#### คอลัมน์ `อุปกรณ์`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=aca317bf
```

**Valid If (เงื่อนไขค่าที่ยอมรับ)**

```appsheet
=select(ITEMS[Item ID],(OR([Item ID]="aca317bf",[Item ID]="2fe4aa7c")))
```

**Ref → ตารางอ้างอิง**

`Items` (key: `Item ID`)

#### คอลัมน์ `ผู้เก็บตัวอย่าง`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=SWITCH(USEREMAIL(), 
  "[REDACTED_EMAIL]", "⟨thai-id ID1⟩", 
  "[REDACTED_EMAIL]", "⟨thai-id ID1⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID2⟩",
  "[REDACTED_EMAIL]","⟨id-like ID5⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID3⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID4⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID4⟩",
  "READ_ONLY")
```

**Valid If (เงื่อนไขค่าที่ยอมรับ)**

```appsheet
=SELECT(ข้อมูลผู้ปฏิบัติงาน[Employee_id],AND([ตำแหน่ง]<>"นายแพทย์",[สถานะ]<>"ลาออก",[ตำแหน่ง]="นักวิชาการสาธารณสุข"))
```

**Ref → ตารางอ้างอิง**

`ข้อมูลผู้ปฏิบัติงาน` (key: `Employee_id`)

#### คอลัมน์ `ผู้รายงาน`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=IF(TODAY()>[Collect_date],(
SWITCH(USEREMAIL(), 
  "[REDACTED_EMAIL]", "⟨thai-id ID1⟩", 
  "[REDACTED_EMAIL]", "⟨thai-id ID1⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID2⟩",
  "[REDACTED_EMAIL]","⟨id-like ID5⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID3⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID4⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID4⟩",
  "READ_ONLY")),"")
```

**Valid If (เงื่อนไขค่าที่ยอมรับ)**

```appsheet
=SELECT(ข้อมูลผู้ปฏิบัติงาน[Employee_id],[ตำแหน่ง]="นักวิชาการสาธารณสุข")
```

**Show If (เงื่อนไขการแสดง)**

```appsheet
=TODAY()>[Collect_date]
```

**Ref → ตารางอ้างอิง**

`ข้อมูลผู้ปฏิบัติงาน` (key: `Employee_id`)

#### คอลัมน์ `อุปกรณ์ (List)`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(
  IN([sample], LIST("ตู้กดน้ำ OPD","ตู้กดน้ำ WARD","ตู้กดน้ำปฐมภูมิ (ห้องฟัน)","น้ำโรงครัว")),
  SELECT(ITEMS[Item ID], [Item ID] = "aca317bf"),
  SELECT(ITEMS[Item ID], [Item ID] = "2fe4aa7c")
)
```

### 3.18 ตาราง `menu_สุขาภิบาลอาหาร` — 5 คอลัมน์ (key: name)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `0`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `name` | Name | Key Label |
| `icon` | Image | Label |
| `link` | Text | hidden |
| `Link view` | App | Virtual ReadOnly |

#### คอลัมน์ `Link view`

**App formula (สูตรคำนวณ)**

```appsheet
=LINKTOVIEW([link],"ActivatedSludge-29279640")
```

### 3.19 ตาราง `coliform bac. Employee` — 10 คอลัมน์ (key: Row ID)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `Row ID` | Text | Key ReadOnly hidden |
| `Collect_date` | Date | Label |
| `sample` | Ref | — |
| `Result_date` | Date | — |
| `Result_bac.` | Enum | — |
| `ภาพผลการตรวจ` | Image | — |
| `อุปกรณ์` | Ref | — |
| `ผู้รายงาน` | Ref | — |
| `ผู้เก็บตัวอย่าง` | Ref | — |

#### คอลัมน์ `Row ID`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID("PackedUUID")
```

#### คอลัมน์ `Collect_date`

**Initial value (ค่าเริ่มต้น)**

```appsheet
TODAY()
```

#### คอลัมน์ `sample`

**Valid If (เงื่อนไขค่าที่ยอมรับ)**

```appsheet
=SELECT(ข้อมูลผู้ปฏิบัติงาน[Employee_id],OR([ตำแหน่ง]="นักโภชนาการ",[ตำแหน่ง]="พนักงานประกอบอาหาร"))
```

**Ref → ตารางอ้างอิง**

`ข้อมูลผู้ปฏิบัติงาน` (key: `Employee_id`)

#### คอลัมน์ `Result_date`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=IF([Collect_date]<=TODAY(),TODAY(),"")
```

**Suggested values (ค่าแนะนำ)**

```appsheet
=LIST(date([Collect_date]+1),date([Collect_date]+2) )
```

**Show If (เงื่อนไขการแสดง)**

```appsheet
=TODAY()>[Collect_date]
```

#### คอลัมน์ `Result_bac.`

**Show If (เงื่อนไขการแสดง)**

```appsheet
=TODAY()>[Collect_date]
```

**Enum Values (ตัวเลือก)**

`Positive` / `Negative` / `Positive ++` / `invalid`

#### คอลัมน์ `ภาพผลการตรวจ`

**Show If (เงื่อนไขการแสดง)**

```appsheet
=TODAY()>[Collect_date]
```

#### คอลัมน์ `อุปกรณ์`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=2fe4aa7c
```

**Valid If (เงื่อนไขค่าที่ยอมรับ)**

```appsheet
=select(ITEMS[Item ID],(OR([Item ID]="aca317bf",[Item ID]="2fe4aa7c")))
```

**Ref → ตารางอ้างอิง**

`Items` (key: `Item ID`)

#### คอลัมน์ `ผู้รายงาน`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=IF(TODAY()>[Collect_date],(
SWITCH(USEREMAIL(), 
  "[REDACTED_EMAIL]", "⟨thai-id ID1⟩", 
  "[REDACTED_EMAIL]", "⟨thai-id ID1⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID2⟩",
  "[REDACTED_EMAIL]","⟨id-like ID5⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID3⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID4⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID4⟩",
  "READ_ONLY")),"")
```

**Valid If (เงื่อนไขค่าที่ยอมรับ)**

```appsheet
=SELECT(ข้อมูลผู้ปฏิบัติงาน[Employee_id],([ตำแหน่ง]="นักวิชาการสาธารณสุข"))
```

**Show If (เงื่อนไขการแสดง)**

```appsheet
=TODAY()>[Collect_date]
```

**Ref → ตารางอ้างอิง**

`ข้อมูลผู้ปฏิบัติงาน` (key: `Employee_id`)

#### คอลัมน์ `ผู้เก็บตัวอย่าง`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=SWITCH(USEREMAIL(), 
  "[REDACTED_EMAIL]", "⟨thai-id ID1⟩", 
  "[REDACTED_EMAIL]", "⟨thai-id ID1⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID2⟩",
  "[REDACTED_EMAIL]","⟨id-like ID5⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID3⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID4⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID4⟩",
  "READ_ONLY")
```

**Valid If (เงื่อนไขค่าที่ยอมรับ)**

```appsheet
=SELECT(ข้อมูลผู้ปฏิบัติงาน[Employee_id],[ตำแหน่ง]="นักวิชาการสาธารณสุข")
```

**Ref → ตารางอ้างอิง**

`ข้อมูลผู้ปฏิบัติงาน` (key: `Employee_id`)

### 3.20 ตาราง `Filter_Firer` — 24 คอลัมน์ (key: ID)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `ID` | Text | Key Label |
| `Start Date` | Date | — |
| `End Date` | Date | — |
| `ตัวเลือก` | EnumList | — |
| `PDF` | File | hidden |
| `Trigger_PDF` | DateTime | hidden |
| `pdfCount` | ChangeCounter | — |
| `ผู้ตรวจสอบ` | Ref | — |
| `Filter_fire` | List | Virtual ReadOnly |
| `จำนวนถังทั้งที่ตรวจ` | Number | Virtual ReadOnly |
| `จำนวนถังที่มี` | Number | Virtual ReadOnly |
| `จำนวนถัง` | Number | Virtual ReadOnly |
| `ReportSequence` | Number | Virtual ReadOnly |
| `จำนวนถังผิดปกติ` | Number | Virtual ReadOnly |
| `รายการตรวจสอบที่เรียงแล้ว` | List | Virtual ReadOnly |
| `Related ตรวจสอบถัง` | List | Virtual System |
| `linkPDF_Fire` | Text | Virtual ReadOnly |
| `St.D.thai` | Text | Virtual ReadOnly hidden |
| `St.M.thai` | Text | Virtual ReadOnly |
| `St.Y.thai` | Number | Virtual ReadOnly |
| `n.D.thai` | Text | Virtual ReadOnly |
| `n.M.thai` | Text | Virtual ReadOnly |
| `n.Y.thai` | Number | Virtual ReadOnly |

#### คอลัมน์ `ID`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID()
```

#### คอลัมน์ `Start Date`

**Initial value (ค่าเริ่มต้น)**

```appsheet
TODAY()
```

#### คอลัมน์ `End Date`

**Initial value (ค่าเริ่มต้น)**

```appsheet
TODAY()
```

#### คอลัมน์ `ตัวเลือก`

**Enum Values (ตัวเลือก)**

`ปกติ` / `ผิดปกติ`

#### คอลัมน์ `PDF`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=""
```

#### คอลัมน์ `ผู้ตรวจสอบ`

**Ref → ตารางอ้างอิง**

`ข้อมูลผู้ปฏิบัติงาน` (key: `Employee_id`)

#### คอลัมน์ `Filter_fire`

**App formula (สูตรคำนวณ)**

```appsheet
=FILTER(
  "ตรวจสอบถัง",
   (AND
       ( 
        [Date_time] >= [_THISROW].[Start Date],
        [Date_time] <= [_THISROW].[End Date]
        )))
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `ตรวจสอบถัง`)
App formula: =FILTER(
  "ตรวจสอบถัง",
   (AND
       ( 
        [Date_time] >= [_THISROW].[Start Date],
        [Date_time] <= [_THISROW].[End Date]
        )))
```

#### คอลัมน์ `จำนวนถังทั้งที่ตรวจ`

**App formula (สูตรคำนวณ)**

```appsheet
=COUNT(
  UNIQUE(
    SELECT(
      ตรวจสอบถัง[QR_CODE],
      AND(
        [Date_time] >= [_THISROW].[Start Date],
        [Date_time] <= [_THISROW].[End Date]
      )
    )
  )
)
```

#### คอลัมน์ `จำนวนถังที่มี`

**App formula (สูตรคำนวณ)**

```appsheet
=COUNT(UNIQUE(ข้อมูลถังดับเพลิง[Row ID]))
```

#### คอลัมน์ `จำนวนถัง`

**App formula (สูตรคำนวณ)**

```appsheet
=IF(
  IN("ปกติ", [_THISROW].[ตัวเลือก]),
  COUNT(
    SELECT(
      ตรวจสอบถัง[row_ID],
      AND(
        [Date_time] >= [_THISROW].[Start Date],
        [Date_time] <= [_THISROW].[End Date],
        [pipe] = "ปกติ",
        [handle] = "ปกติ",
        [tank] = "ปกติ",
        [pressure_gauge] = "ปกติ"
      )
    )
  ),
  0
)
+
IF(
  IN("ผิดปกติ", [_THISROW].[ตัวเลือก]),
  COUNT(
    SELECT(
      ตรวจสอบถัง[row_ID],
      AND(
        [Date_time] >= [_THISROW].[Start Date],
        [Date_time] <= [_THISROW].[End Date],
        OR(
          [pipe] = "ชำรุด",
          [handle] = "ชำรุด",
          [tank] = "ชำรุด",
          [pressure_gauge] = "ไม่ปกติ",
          [breakdown_details] = "หมดอายุ"
        )
      )
    )
  ),
  0
)
```

#### คอลัมน์ `ReportSequence`

**App formula (สูตรคำนวณ)**

```appsheet
=COUNT(SELECT(FILTER_FIRER[Filter_fire], [_ROWNUMBER] <= [_THISROW].[_ROWNUMBER]))
```

#### คอลัมน์ `จำนวนถังผิดปกติ`

**App formula (สูตรคำนวณ)**

```appsheet
=COUNT(
  FILTER(
    "ตรวจสอบถัง",
    AND(
      [Date_time] >= [_THISROW].[Start Date],
      [Date_time] <= [_THISROW].[End Date],
      OR(
        [pipe] = "ชำรุด",
        [handle] = "ชำรุด",
        [tank] = "ชำรุด",
        [pressure_gauge] = "ไม่ปกติ",
        [breakdown_details] = "หมดอายุ"
      )
    )
  )
)
```

#### คอลัมน์ `รายการตรวจสอบที่เรียงแล้ว`

**App formula (สูตรคำนวณ)**

```appsheet
=ORDERBY(
  FILTER(
    "ตรวจสอบถัง",
    AND(
      [Date_time] >= [_THISROW].[Start Date],
      [Date_time] <= [_THISROW].[End Date]
    )
  ),
  "SortKey",
  FALSE
)
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `ตรวจสอบถัง`)
App formula: =ORDERBY(
  FILTER(
    "ตรวจสอบถัง",
    AND(
      [Date_time] >= [_THISROW].[Start Date],
      [Date_time] <= [_THISROW].[End Date]
    )
  ),
  "SortKey",
  FALSE
)
```

#### คอลัมน์ `Related ตรวจสอบถัง`

**App formula (สูตรคำนวณ)**

```appsheet
REF_ROWS("ตรวจสอบถัง", "Filter_Firer_ID")
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `ตรวจสอบถัง`)
Description (verbatim): "ตรวจสอบถัง entries that reference this entry in the Filter_Firer_ID column"
App formula: REF_ROWS("ตรวจสอบถัง", "Filter_Firer_ID")
```

#### คอลัมน์ `linkPDF_Fire`

**App formula (สูตรคำนวณ)**

```appsheet
=CONCATENATE(
"https://www.appsheet.com/template/gettablefileurl?",
"appName=",ENCODEURL("ActivatedSludge-29279640"),
"&tableName=",ENCODEURL("FILTER_FIRER"),
"&fileName=",ENCODEURL([PDF]))
```

#### คอลัมน์ `St.D.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=day([Start Date])
```

#### คอลัมน์ `St.M.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=SWITCH(MONTH([Start Date]), 
  1, "มกราคม", 
  2, "กุมภาพันธ์", 
  3, "มีนาคม", 
  4, "เมษายน", 
  5, "พฤษภาคม", 
  6, "มิถุนายน", 
  7, "กรกฎาคม", 
  8, "สิงหาคม", 
  9, "กันยายน", 
  10, "ตุลาคม", 
  11, "พฤศจิกายน", 
  12, "ธันวาคม", 
  "ไม่มีข้อมูล")
```

#### คอลัมน์ `St.Y.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=YEAR([Start Date])+543
```

#### คอลัมน์ `n.D.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=DAY([End Date])
```

#### คอลัมน์ `n.M.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=SWITCH(MONTH([End Date]), 
  1, "มกราคม", 
  2, "กุมภาพันธ์", 
  3, "มีนาคม", 
  4, "เมษายน", 
  5, "พฤษภาคม", 
  6, "มิถุนายน", 
  7, "กรกฎาคม", 
  8, "สิงหาคม", 
  9, "กันยายน", 
  10, "ตุลาคม", 
  11, "พฤศจิกายน", 
  12, "ธันวาคม", 
  "ไม่มีข้อมูล")
```

#### คอลัมน์ `n.Y.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=YEAR([End Date])+543
```

### 3.21 ตาราง `Menu_Firer` — 5 คอลัมน์ (key: name)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `0`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `name` | Name | Key Label |
| `icon` | Image | Label |
| `link` | Text | hidden |
| `LINKVIEW` | App | Virtual ReadOnly |

#### คอลัมน์ `LINKVIEW`

**App formula (สูตรคำนวณ)**

```appsheet
=LINKTOVIEW([link], "ActivatedSludge-29279640")
```

### 3.22 ตาราง `คู่มือ` — 5 คอลัมน์ (key: id)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `2`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `id` | Text | Key hidden |
| `รายการ` | Text | Label |
| `รูป` | Image | Label |
| `link` | File | — |

#### คอลัมน์ `id`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID()
```

### 3.23 ตาราง `location_area` — 5 คอลัมน์ (key: id)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `3`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `id` | Text | Key Label |
| `qr_code` | Image | — |
| `area_name` | Name | — |
| `image` | Image | Label |

#### คอลัมน์ `id`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID()
```

#### คอลัมน์ `qr_code`

**App formula (สูตรคำนวณ)**

```appsheet
="https://zxing.org/w/chart?cht=qr&chs=350x350&chld=L&choe=UTF-8&chl="&[id]
```

### 3.24 ตาราง `job` — 19 คอลัมน์ (key: ID)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `ID` | Text | Key hidden |
| `Date_time` | DateTime | hidden |
| `QR_CODE` | Text | — |
| `location` | LatLong | — |
| `location_name` | Text | — |
| `practician` | Ref | — |
| `working` | EnumList | — |
| `image` | Thumbnail | Label |
| `issue` | Text | — |
| `Distance` | Decimal | Virtual ReadOnly hidden |
| `uthai_locate` | LatLong | Virtual ReadOnly hidden |
| `M.THAI` | Text | Virtual ReadOnly hidden |
| `Y.THAI` | Number | Virtual ReadOnly hidden |
| `D.THAI` | Number | Virtual ReadOnly hidden |
| `N.NAME` | Text | Virtual ReadOnly hidden |
| `L.Image` | Text | Virtual ReadOnly hidden |
| `Shows_Location_PIC1` | Show | Virtual ReadOnly |
| `End_date` | DateTime | Virtual ReadOnly |

#### คอลัมน์ `ID`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID()
```

#### คอลัมน์ `Date_time`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=now()
```

#### คอลัมน์ `QR_CODE`

**Initial value (ค่าเริ่มต้น)**

```appsheet
="สแกน QR CODE"
```

**Valid If (เงื่อนไขค่าที่ยอมรับ)**

```appsheet
=AND([QR_CODE]<>"สแกน QR CODE",[QR_CODE]<>"",[Distance]<=0.7,IN([QR_CODE],location_area[id]))
```

**Invalid value error (ข้อความเมื่อค่าไม่ผ่าน)**

```appsheet
="*ต้องมีอะไรผิดพลาดตรงไหน
ไม่เข้าใจเลยสักครั้ง
ไอ้ที่เขาทำฉันนั้นก็ทำ
แต่ทำและไม่เคยสมหวัง
หรืออาจเป็นเพราะพื้นดวงหรือเปล่าหรือเป็นที่ราศีของดวงดาว*"
```

**Required If (เงื่อนไขบังคับกรอก)**

```appsheet
=ISBLANK([QR_CODE])
```

#### คอลัมน์ `location`

**App formula (สูตรคำนวณ)**

```appsheet
=here()
```

#### คอลัมน์ `location_name`

**App formula (สูตรคำนวณ)**

```appsheet
=select(LOCATION_AREA[area_name],[_THISROW].[QR_CODE]=[id])
```

**Initial value (ค่าเริ่มต้น)**

```appsheet
=select(LOCATION_AREA[area_name],[_THISROW].[QR_CODE]=[id])
```

**Valid If (เงื่อนไขค่าที่ยอมรับ)**

```appsheet
=distance([uthai_locate],[location])<=0.7
```

**Invalid value error (ข้อความเมื่อค่าไม่ผ่าน)**

```appsheet
="ฮั่นแน่...เข้ามาทำงานก่อน"
```

#### คอลัมน์ `practician`

**Initial value (ค่าเริ่มต้น)**

```appsheet
="⟨thai-id ID7⟩"
```

**Valid If (เงื่อนไขค่าที่ยอมรับ)**

```appsheet
=SELECT(ข้อมูลผู้ปฏิบัติงาน[Employee_id],AND([ตำแหน่ง]<>"นายแพทย์",[สถานะ]="ทำงาน",OR([ตำแหน่ง]="นักวิชาการสาธารณสุข",[ตำแหน่ง]="พนักงานบริการ")))
```

**Ref → ตารางอ้างอิง**

`ข้อมูลผู้ปฏิบัติงาน` (key: `Employee_id`)

#### คอลัมน์ `working`

**Show If (เงื่อนไขการแสดง)**

```appsheet
=AND([QR_CODE]<>"สแกน QR CODE",[QR_CODE]<>"",[Distance]<=0.7,IN([QR_CODE],location_area[id]))
```

**Enum Values (ตัวเลือก)**

`รดน้ำ` / `ตัดหญ้า` / `กวาด` / `เก็บขยะ`

#### คอลัมน์ `image`

**Show If (เงื่อนไขการแสดง)**

```appsheet
=AND([QR_CODE]<>"สแกน QR CODE",[QR_CODE]<>"",[Distance]<=0.7,IN([QR_CODE],location_area[id]))
```

#### คอลัมน์ `issue`

**Show If (เงื่อนไขการแสดง)**

```appsheet
=AND([QR_CODE]<>"สแกน QR CODE",[QR_CODE]<>"",[Distance]<=0.7,IN([QR_CODE],location_area[id]))
```

#### คอลัมน์ `Distance`

**App formula (สูตรคำนวณ)**

```appsheet
=distance([uthai_locate],[location])
```

**Valid If (เงื่อนไขค่าที่ยอมรับ)**

```appsheet
=distance([uthai_locate],[location])<=2
```

**Invalid value error (ข้อความเมื่อค่าไม่ผ่าน)**

```appsheet
="ฮั่นแน่...เข้ามาทำงานก่อน"
```

#### คอลัมน์ `uthai_locate`

**App formula (สูตรคำนวณ)**

```appsheet
=LATLONG(14.361183, 100.645474)
```

#### คอลัมน์ `M.THAI`

**App formula (สูตรคำนวณ)**

```appsheet
=SWITCH(MONTH([Date_time]), 
  1, "มกราคม", 
  2, "กุมภาพันธ์", 
  3, "มีนาคม", 
  4, "เมษายน", 
  5, "พฤษภาคม", 
  6, "มิถุนายน", 
  7, "กรกฎาคม", 
  8, "สิงหาคม", 
  9, "กันยายน", 
  10, "ตุลาคม", 
  11, "พฤศจิกายน", 
  12, "ธันวาคม", 
  "ไม่มีข้อมูล")
```

#### คอลัมน์ `Y.THAI`

**App formula (สูตรคำนวณ)**

```appsheet
=year([Date_time])+543
```

#### คอลัมน์ `D.THAI`

**App formula (สูตรคำนวณ)**

```appsheet
=day([Date_time])
```

#### คอลัมน์ `N.NAME`

**App formula (สูตรคำนวณ)**

```appsheet
=[practician].[ชื่อเล่น]
```

#### คอลัมน์ `L.Image`

**App formula (สูตรคำนวณ)**

```appsheet
=CONCATENATE(
"https://www.appsheet.com/template/gettablefileurl?",
"appName=",ENCODEURL("ActivatedSludge-29279640"),
"&tableName=",ENCODEURL("JOB"),
"&fileName=",ENCODEURL([image]))
```

#### คอลัมน์ `Shows_Location_PIC1`

**App formula (สูตรคำนวณ)**

```appsheet
=""
```

**Content (เนื้อหาคอลัมน์ Show)**

```appsheet
=select(location_area[image],[_THISROW].[QR_CODE]=[id])
```

#### คอลัมน์ `End_date`

**App formula (สูตรคำนวณ)**

```appsheet
=[Date_time]+"000:05:00"
```

### 3.25 ตาราง `เก็บรูป` — 3 คอลัมน์ (key: id)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `id` | Text | Key Label |
| `im1` | Image | — |

#### คอลัมน์ `id`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID()
```

### 3.26 ตาราง `คู่มือน้ำประปา` — 5 คอลัมน์ (key: Row ID)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `3`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `Row ID` | Text | Key ReadOnly hidden |
| `รายการ` | Text | Label |
| `รูป` | Image | — |
| `link` | File | — |

#### คอลัมน์ `Row ID`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID("PackedUUID")
```

### 3.27 ตาราง `Categories` — 4 คอลัมน์ (key: ID)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `ID` | Text | Key Label |
| `Category` | Text | — |
| `Icon` | Image | Label |

#### คอลัมน์ `ID`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID()
```

### 3.28 ตาราง `Inventory` — 13 คอลัมน์ (key: Inventory ID)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `Inventory ID` | Text | Key Label |
| `Item ID` | Text | — |
| `DateTime` | DateTime | — |
| `Amount` | Number | — |
| `Amount_unit_deduct` | Number | — |
| `Total_deduct` | Number | — |
| `LotNo` | Text | — |
| `MFG` | Text | — |
| `EXP` | Text | — |
| `LifeTime` | Time | — |
| `Chlorine_realyDiv10` | Decimal | Virtual ReadOnly |
| `Chlorine_realyDiv4` | Decimal | Virtual ReadOnly |

#### คอลัมน์ `Inventory ID`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID()
```

#### คอลัมน์ `DateTime`

**Initial value (ค่าเริ่มต้น)**

```appsheet
NOW()
```

#### คอลัมน์ `LifeTime`

**Initial value (ค่าเริ่มต้น)**

```appsheet
TIMENOW()
```

#### คอลัมน์ `Chlorine_realyDiv10`

**App formula (สูตรคำนวณ)**

```appsheet
=(
  MAX(
    SELECT(
      น้ำประปา[real_Chlorine],
      [Date] = MAXROW("น้ำประปา", "Date", TRUE)
    )
  )
)
```

#### คอลัมน์ `Chlorine_realyDiv4`

**App formula (สูตรคำนวณ)**

```appsheet
=(
  MAX(
    SELECT(
      ข้อมูลคุณภาพน้ำ[คลอรีนน้ำที่ใช้จริง],
      [วันที่ บันทึก] = MAXROW("ข้อมูลคุณภาพน้ำ", "วันที่ บันทึก", TRUE)
    )
  )
)
```

### 3.29 ตาราง `Items` — 20 คอลัมน์ (key: Item ID)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `Item ID` | Text | Key |
| `Name` | Name | Label |
| `Description` | Text | — |
| `Image` | Image | Label |
| `Category` | Enum | — |
| `Vendor` | Ref | — |
| `Purchase Cost` | Price | — |
| `unit_count_num` | Number | — |
| `unit_count` | Text | — |
| `unit_formula` | Text | — |
| `unit_use_num` | Number | — |
| `unit_calculate` | Text | — |
| `User manual` | File | — |
| `min` | Number | — |
| `max` | Number | — |
| `Related น้ำประปาs` | List | Virtual System |
| `Related coliform bac. Employees` | List | Virtual System |
| `Related coliform bac. Food.s` | List | Virtual System |
| `Related coliform bac._Waters` | List | Virtual System |

#### คอลัมน์ `Item ID`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID()
```

#### คอลัมน์ `Category`

**Enum Values (ตัวเลือก)**

`w6hwsyj` / `72b68b19` / `9a7ebdaf`

#### คอลัมน์ `Vendor`

**Ref → ตารางอ้างอิง**

`Vendors` (key: `ID`)

#### คอลัมน์ `Related น้ำประปาs`

**App formula (สูตรคำนวณ)**

```appsheet
REF_ROWS("น้ำประปา", "ชนิดเครื่องมือตรวจ")
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `น้ำประปา`)
Description (verbatim): "น้ำประปา entries that reference this entry in the ชนิดเครื่องมือตรวจ column"
App formula: REF_ROWS("น้ำประปา", "ชนิดเครื่องมือตรวจ")
```

#### คอลัมน์ `Related coliform bac. Employees`

**App formula (สูตรคำนวณ)**

```appsheet
REF_ROWS("coliform bac. Employee", "อุปกรณ์")
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `coliform bac. Employee`)
Description (verbatim): "coliform bac. Employee entries that reference this entry in the อุปกรณ์ column"
App formula: REF_ROWS("coliform bac. Employee", "อุปกรณ์")
```

#### คอลัมน์ `Related coliform bac. Food.s`

**App formula (สูตรคำนวณ)**

```appsheet
REF_ROWS("coliform bac. Food.", "อุปกรณ์")
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `coliform bac. Food.`)
Description (verbatim): "coliform bac. Food. entries that reference this entry in the อุปกรณ์ column"
App formula: REF_ROWS("coliform bac. Food.", "อุปกรณ์")
```

#### คอลัมน์ `Related coliform bac._Waters`

**App formula (สูตรคำนวณ)**

```appsheet
REF_ROWS("coliform bac._Water", "อุปกรณ์")
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `coliform bac._Water`)
Description (verbatim): "coliform bac._Water entries that reference this entry in the อุปกรณ์ column"
App formula: REF_ROWS("coliform bac._Water", "อุปกรณ์")
```

### 3.30 ตาราง `maintenance` — 7 คอลัมน์ (key: maintenanceID)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `InventoryID` | Text | — |
| `maintenanceID` | Text | Key |
| `item_Name` | Name | Label |
| `Cal_date` | Date | — |
| `Cal_method` | Text | — |
| `Cal_result` | Text | — |

#### คอลัมน์ `Cal_date`

**Initial value (ค่าเริ่มต้น)**

```appsheet
TODAY()
```

### 3.31 ตาราง `Vendors` — 9 คอลัมน์ (key: ID)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `ID` | Text | Key |
| `Name` | Name | Label |
| `Logo` | Thumbnail | Label |
| `URL` | Text | — |
| `Phone` | Phone | — |
| `Email` | Email | — |
| `Address` | Address | — |
| `Related Items` | List | Virtual System |

#### คอลัมน์ `ID`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID()
```

#### คอลัมน์ `Related Items`

**App formula (สูตรคำนวณ)**

```appsheet
REF_ROWS("Items", "Vendor")
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `Items`)
Description (verbatim): "Items entries that reference this entry in the Vendor column"
App formula: REF_ROWS("Items", "Vendor")
```

### 3.32 ตาราง `Emergency light` — 8 คอลัมน์ (key: ERL_ID)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `ERL_ID` | Text | Key |
| `location` | Text | Label |
| `Pic` | Image | Label |
| `QR` | Image | — |
| `Receive_date` | Date | — |
| `location_floor` | Number | — |
| `Providers` | Text | — |

#### คอลัมน์ `ERL_ID`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=UNIQUEID()
```

#### คอลัมน์ `QR`

**App formula (สูตรคำนวณ)**

```appsheet
="https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=" & [ERL_ID]
```

#### คอลัมน์ `Receive_date`

**Initial value (ค่าเริ่มต้น)**

```appsheet
TODAY()
```

#### คอลัมน์ `location_floor`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=1
```

**Maximum value**

```appsheet
3
```

**Minimum value**

```appsheet
1
```

### 3.33 ตาราง `Check` — 14 คอลัมน์ (key: row_ID)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `row_ID` | Text | Key hidden |
| `Date_time` | Date | Label ReadOnly |
| `QR_CODE` | Text | — |
| `location` | Text | — |
| `Persistency` | Enum | — |
| `Position` | Enum | — |
| `test_result` | Enum | — |
| `Auditor` | Ref | — |
| `Broken_detail` | EnumList | — |
| `Pic` | Image | — |
| `Status` | Enum | — |
| `re_check` | List | Virtual ReadOnly |
| `SortKey` | Text | Virtual ReadOnly |

#### คอลัมน์ `row_ID`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID()
```

#### คอลัมน์ `Date_time`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=now()
```

#### คอลัมน์ `QR_CODE`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=สแกน QR CODE
```

#### คอลัมน์ `location`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=select(Emergency light[location],[_THISROW].[QR_CODE]=[ERL_ID])
```

**Show If (เงื่อนไขการแสดง)**

```appsheet
=AND([QR_CODE]<>"สแกน QR CODE",[QR_CODE]<>"",IN([QR_CODE],EMERGENCY LIGHT
[ERL_ID]))
```

#### คอลัมน์ `Persistency`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=มี
```

**Enum Values (ตัวเลือก)**

`มี` / `ไม่มี`

#### คอลัมน์ `Position`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=เหมาะสม
```

**Enum Values (ตัวเลือก)**

`เหมาะสม` / `ไม่เหมาะสม`

#### คอลัมน์ `test_result`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=ผ่าน
```

**Show If (เงื่อนไขการแสดง)**

```appsheet
=[Persistency]="มี"
```

**Enum Values (ตัวเลือก)**

`ผ่าน` / `ไม่ผ่าน`

#### คอลัมน์ `Auditor`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=SWITCH(USEREMAIL(), 
  "[REDACTED_EMAIL]", "⟨thai-id ID1⟩", 
  "[REDACTED_EMAIL]", "⟨thai-id ID1⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID2⟩",
  "[REDACTED_EMAIL]","⟨id-like ID5⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID3⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID4⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID4⟩",
  "[REDACTED_EMAIL]","⟨thai-id ID1⟩",
  "READ_ONLY")
```

**Ref → ตารางอ้างอิง**

`ข้อมูลผู้ปฏิบัติงาน` (key: `Employee_id`)

#### คอลัมน์ `Broken_detail`

**Show If (เงื่อนไขการแสดง)**

```appsheet
=OR([test_result]="ไม่ผ่าน",[Position]="ไม่เหมาะสม")
```

**Enum Values (ตัวเลือก)**

`ไม่มีหัตถการ` / `มีแสงสว่างจากธรรมชาติ` / `ไม่มีเวรดึก` / `ไฟไม่สว่าง` / `ไม่เก็บไฟ`

#### คอลัมน์ `Pic`

**Show If (เงื่อนไขการแสดง)**

```appsheet
=OR([test_result]="ไม่ผ่าน",[Position]="ไม่เหมาะสม",[Persistency]="ไม่มี")
```

#### คอลัมน์ `Status`

**Show If (เงื่อนไขการแสดง)**

```appsheet
=OR([test_result]="ไม่ผ่าน",[Position]="ไม่เหมาะสม",[Persistency]="ไม่มี")
```

**Enum Values (ตัวเลือก)**

`แจ้งซ่อม` / `แจ้งย้ายตำแหน่ง` / `ขอติดตั้ง`

#### คอลัมน์ `re_check`

**App formula (สูตรคำนวณ)**

```appsheet
=select(EMERGENCY LIGHT[ERL_ID],[_THISROW].[QR_CODE]=[ERL_ID])
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `Emergency light`)
App formula: =select(EMERGENCY LIGHT[ERL_ID],[_THISROW].[QR_CODE]=[ERL_ID])
```

#### คอลัมน์ `SortKey`

**App formula (สูตรคำนวณ)**

```appsheet
=CONCATENATE([Date_time], "-", [_ROWNUMBER])
```

### 3.34 ตาราง `ER_light_Menu` — 5 คอลัมน์ (key: name)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `name` | Name | Key Label |
| `icon` | Image | Label |
| `link` | Text | — |
| `link_view` | App | Virtual ReadOnly |

#### คอลัมน์ `link_view`

**App formula (สูตรคำนวณ)**

```appsheet
=LINKTOVIEW([link], "ActivatedSludge-29279640")
```

### 3.35 ตาราง `Filter_Light` — 26 คอลัมน์ (key: ID)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `ID` | Text | Key Label |
| `Start Date` | Date | — |
| `End Date` | Date | — |
| `choice1` | Enum | — |
| `choice2` | Enum | — |
| `choice3` | Enum | — |
| `choice4` | EnumList | — |
| `pdfFile` | File | hidden |
| `pdfTrigger` | DateTime | hidden |
| `pdfCount` | ChangeCounter | — |
| `จำนวนการคงอยู่` | Number | Virtual ReadOnly |
| `จำนวนผลการทดสอบ` | Number | Virtual ReadOnly |
| `จำนวนตำแหน่ง` | Number | Virtual ReadOnly |
| `จำนวนความต้องการ` | Number | Virtual ReadOnly |
| `รายการตรวจสอบที่เรียงแล้ว` | List | Virtual ReadOnly hidden |
| `จำนวนที่ตรวจสอบ` | Number | Virtual ReadOnly hidden |
| `จำนวนการทดสอบผ่าน` | Number | Virtual ReadOnly |
| `จำนวนการทดสอบไม่ผ่าน` | Number | Virtual ReadOnly |
| `linkPDF_light` | Text | Virtual ReadOnly hidden |
| `Start.D.thai` | Text | Virtual ReadOnly hidden |
| `Start.M.thai` | Text | Virtual ReadOnly hidden |
| `Start.Y.thai` | Text | Virtual ReadOnly hidden |
| `END.D.thai` | Text | Virtual ReadOnly hidden |
| `END.M.thai` | Text | Virtual ReadOnly hidden |
| `End.Y.thai` | Text | Virtual ReadOnly hidden |

#### คอลัมน์ `ID`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID()
```

#### คอลัมน์ `Start Date`

**Initial value (ค่าเริ่มต้น)**

```appsheet
TODAY()
```

#### คอลัมน์ `End Date`

**Initial value (ค่าเริ่มต้น)**

```appsheet
TODAY()
```

#### คอลัมน์ `choice1`

**Enum Values (ตัวเลือก)**

`มี` / `ไม่มี`

#### คอลัมน์ `choice2`

**Enum Values (ตัวเลือก)**

`ผ่าน` / `ไม่ผ่าน`

#### คอลัมน์ `choice3`

**Enum Values (ตัวเลือก)**

`เหมาะสม` / `ไม่เหมาะสม`

#### คอลัมน์ `choice4`

**Enum Values (ตัวเลือก)**

`แจ้งซ่อม` / `แจ้งย้ายตำแหน่ง` / `ขอติดตั้ง`

#### คอลัมน์ `pdfFile`

**Initial value (ค่าเริ่มต้น)**

```appsheet
=""
```

#### คอลัมน์ `จำนวนการคงอยู่`

**App formula (สูตรคำนวณ)**

```appsheet
=COUNT(
  SELECT(
    CHECK[Persistency],
    AND(
      [Date_time] >= [_THISROW].[Start Date],
      [Date_time] <= [_THISROW].[End Date],
      [Persistency] = [_THISROW].[choice1]
    )
  )
)
```

#### คอลัมน์ `จำนวนผลการทดสอบ`

**App formula (สูตรคำนวณ)**

```appsheet
=COUNT(
  SELECT(
    CHECK[test_result],
    AND(
      [Date_time] >= [_THISROW].[Start Date],
      [Date_time] <= [_THISROW].[End Date],
      [test_result] = [_THISROW].[choice2]
    )
  )
)
```

#### คอลัมน์ `จำนวนตำแหน่ง`

**App formula (สูตรคำนวณ)**

```appsheet
=COUNT(
  SELECT(
    CHECK[Position],
    AND(
      [Date_time] >= [_THISROW].[Start Date],
      [Date_time] <= [_THISROW].[End Date],
      [Position] = [_THISROW].[choice3]
    )
  )
)
```

#### คอลัมน์ `จำนวนความต้องการ`

**App formula (สูตรคำนวณ)**

```appsheet
=COUNT(
  SELECT(
    CHECK[Status],
    AND(
      [Date_time] >= [_THISROW].[Start Date],
      [Date_time] <= [_THISROW].[End Date],
      in([Status],[_THISROW].[choice4])
    )
  )
)
```

#### คอลัมน์ `รายการตรวจสอบที่เรียงแล้ว`

**App formula (สูตรคำนวณ)**

```appsheet
=ORDERBY(
  FILTER(
    "CHECK",
    AND(
      [Date_time] >= [_THISROW].[Start Date],
      [Date_time] <= [_THISROW].[End Date]
    )
  ),
  "SortKey",
  FALSE
)
```

**Related (REF_ROWS)**

```text
REF_ROWS (virtual, List ย้อนกลับจาก `Check`)
App formula: =ORDERBY(
  FILTER(
    "CHECK",
    AND(
      [Date_time] >= [_THISROW].[Start Date],
      [Date_time] <= [_THISROW].[End Date]
    )
  ),
  "SortKey",
  FALSE
)
```

#### คอลัมน์ `จำนวนที่ตรวจสอบ`

**App formula (สูตรคำนวณ)**

```appsheet
=COUNT(
  SELECT(
    CHECK[Persistency],
    AND(
      [Date_time] >= [_THISROW].[Start Date],
      [Date_time] <= [_THISROW].[End Date],
      [Persistency] = "มี"
    )
  )
)
```

#### คอลัมน์ `จำนวนการทดสอบผ่าน`

**App formula (สูตรคำนวณ)**

```appsheet
=COUNT(
  SELECT(
    CHECK[test_result],
    AND(
      [Date_time] >= [_THISROW].[Start Date],
      [Date_time] <= [_THISROW].[End Date],
      [test_result] = "ผ่าน"
    )
  )
)
```

#### คอลัมน์ `จำนวนการทดสอบไม่ผ่าน`

**App formula (สูตรคำนวณ)**

```appsheet
=COUNT(
  SELECT(
    CHECK[Status],
    AND(
      [Date_time] >= [_THISROW].[Start Date],
      [Date_time] <= [_THISROW].[End Date],
      ISNOTBLANK([Status])
    )
  )
)
```

#### คอลัมน์ `linkPDF_light`

**App formula (สูตรคำนวณ)**

```appsheet
=CONCATENATE(
"https://www.appsheet.com/template/gettablefileurl?",
"appName=",ENCODEURL("ActivatedSludge-29279640"),
"&tableName=",ENCODEURL("FILTER_LIGHT"),
"&fileName=",ENCODEURL([pdfFile]))
```

#### คอลัมน์ `Start.D.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=day([Start Date])
```

#### คอลัมน์ `Start.M.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=SWITCH(MONTH([Start Date]), 
  1, "มกราคม", 
  2, "กุมภาพันธ์", 
  3, "มีนาคม", 
  4, "เมษายน", 
  5, "พฤษภาคม", 
  6, "มิถุนายน", 
  7, "กรกฎาคม", 
  8, "สิงหาคม", 
  9, "กันยายน", 
  10, "ตุลาคม", 
  11, "พฤศจิกายน", 
  12, "ธันวาคม", 
  "ไม่มีข้อมูล")
```

#### คอลัมน์ `Start.Y.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=year([Start Date])+543
```

#### คอลัมน์ `END.D.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=day([End Date])
```

#### คอลัมน์ `END.M.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=SWITCH(MONTH([End Date]), 
  1, "มกราคม", 
  2, "กุมภาพันธ์", 
  3, "มีนาคม", 
  4, "เมษายน", 
  5, "พฤษภาคม", 
  6, "มิถุนายน", 
  7, "กรกฎาคม", 
  8, "สิงหาคม", 
  9, "กันยายน", 
  10, "ตุลาคม", 
  11, "พฤศจิกายน", 
  12, "ธันวาคม", 
  "ไม่มีข้อมูล")
```

#### คอลัมน์ `End.Y.thai`

**App formula (สูตรคำนวณ)**

```appsheet
=year([End Date])+543
```

### 3.36 ตาราง `Numbers` — 2 คอลัมน์ (key: Number)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `7`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `Number` | Number | Key Label |

*ไม่มีคอลัมน์ใดมีสูตร/ค่าคำนวณในตารางนี้*

### 3.37 ตาราง `Filter_ColiformBac` — 8 คอลัมน์ (key: Row ID)

การตั้งค่าตาราง: Data access mode = `as app creator` · Update mode = `1`

| คอลัมน์ | Type | ธง |
|---|---|---|
| `_RowNumber` | Number | System hidden |
| `Row ID` | Text | Key ReadOnly hidden |
| `ID` | Text | Label |
| `Start Date` | Date | — |
| `End Date` | Date | — |
| `PDF` | File | — |
| `Count` | ChangeCounter | — |
| `Export PDF` | Enum | — |

#### คอลัมน์ `Row ID`

**Initial value (ค่าเริ่มต้น)**

```appsheet
UNIQUEID("PackedUUID")
```

#### คอลัมน์ `Start Date`

**Initial value (ค่าเริ่มต้น)**

```appsheet
TODAY()
```

#### คอลัมน์ `End Date`

**Initial value (ค่าเริ่มต้น)**

```appsheet
TODAY()
```

#### คอลัมน์ `Count`

**Initial value (ค่าเริ่มต้น)**

```appsheet
1
```

#### คอลัมน์ `Export PDF`

**Enum Values (ตัวเลือก)**

`อ.13 (SI-2)` / `อ.11`

## 4. แผนผังความสัมพันธ์ (Ref / REF_ROWS)

สรุป: **Ref ไปข้างหน้า 21 เส้น**, **คอลัมน์ Related ย้อนกลับ (REF_ROWS virtual) 28 เส้น**
รวม 49 ขอบความสัมพันธ์ — สูตร `REFROWS()` แบบเขียนเองใน App formula: 0 ตัว
(AppSheet สร้างคอลัมน์ "Related …" อัตโนมัติจากคอลัมน์ Ref พร้อมคำอธิบายอัตโนมัติ)

### 4.1 Ref ไปข้างหน้า (table X column Y → table Z)

| จากตาราง X | คอลัมน์ Y | อ้างถึงตาราง Z |
|---|---|---|
| `Check` | `Auditor` | `ข้อมูลผู้ปฏิบัติงาน` |
| `Filter_Firer` | `ผู้ตรวจสอบ` | `ข้อมูลผู้ปฏิบัติงาน` |
| `Filter_Water` | `ID` | `ข้อมูลคุณภาพน้ำ` |
| `Items` | `Vendor` | `Vendors` |
| `coliform bac.` | `ผู้รายงาน` | `ข้อมูลผู้ปฏิบัติงาน` |
| `coliform bac. Employee` | `sample` | `ข้อมูลผู้ปฏิบัติงาน` |
| `coliform bac. Employee` | `ผู้รายงาน` | `ข้อมูลผู้ปฏิบัติงาน` |
| `coliform bac. Employee` | `ผู้เก็บตัวอย่าง` | `ข้อมูลผู้ปฏิบัติงาน` |
| `coliform bac. Employee` | `อุปกรณ์` | `Items` |
| `coliform bac. Food.` | `ผู้รายงาน` | `ข้อมูลผู้ปฏิบัติงาน` |
| `coliform bac. Food.` | `ผู้เก็บตัวอย่าง` | `ข้อมูลผู้ปฏิบัติงาน` |
| `coliform bac. Food.` | `อุปกรณ์` | `Items` |
| `coliform bac._Water` | `ผู้รายงาน` | `ข้อมูลผู้ปฏิบัติงาน` |
| `coliform bac._Water` | `อุปกรณ์` | `Items` |
| `job` | `practician` | `ข้อมูลผู้ปฏิบัติงาน` |
| `tap water_Filter` | `id` | `น้ำประปา` |
| `ข้อมูลคุณภาพน้ำ` | `ผู้บันทึก` | `ข้อมูลผู้ปฏิบัติงาน` |
| `ตรวจสอบถัง` | `Filter_Firer_ID` | `Filter_Firer` |
| `ตรวจสอบถัง` | `ผู้ตรวจสอบ` | `ข้อมูลผู้ปฏิบัติงาน` |
| `น้ำประปา` | `ชนิดเครื่องมือตรวจ` | `Items` |
| `น้ำประปา` | `ผู้บันทึก` | `ข้อมูลผู้ปฏิบัติงาน` |

### 4.2 Related (REF_ROWS virtual) ย้อนกลับ

| ตารางที่มีคอลัมน์ | คอลัมน์ Related | รายการจากตาราง |
|---|---|---|
| `Check` | `re_check` | `Emergency light` |
| `Filter_Firer` | `Filter_fire` | `ตรวจสอบถัง` |
| `Filter_Firer` | `Related ตรวจสอบถัง` | `ตรวจสอบถัง` |
| `Filter_Firer` | `รายการตรวจสอบที่เรียงแล้ว` | `ตรวจสอบถัง` |
| `Filter_Light` | `รายการตรวจสอบที่เรียงแล้ว` | `Check` |
| `Filter_Water` | `Filter` | `ข้อมูลคุณภาพน้ำ` |
| `Items` | `Related coliform bac. Employees` | `coliform bac. Employee` |
| `Items` | `Related coliform bac. Food.s` | `coliform bac. Food.` |
| `Items` | `Related coliform bac._Waters` | `coliform bac._Water` |
| `Items` | `Related น้ำประปาs` | `น้ำประปา` |
| `Vendors` | `Related Items` | `Items` |
| `tap water_Filter` | `รายการตรวจสอบที่เรียงแล้ว` | `น้ำประปา` |
| `ข้อมูลคุณภาพน้ำ` | `Related Filter_Waters` | `Filter_Water` |
| `ข้อมูลผู้ปฏิบัติงาน` | `Related Checks` | `Check` |
| `ข้อมูลผู้ปฏิบัติงาน` | `Related Filter_Firers` | `Filter_Firer` |
| `ข้อมูลผู้ปฏิบัติงาน` | `Related coliform bac. Employees By sample` | `coliform bac. Employee` |
| `ข้อมูลผู้ปฏิบัติงาน` | `Related coliform bac. Employees By ผู้รายงาน` | `coliform bac. Employee` |
| `ข้อมูลผู้ปฏิบัติงาน` | `Related coliform bac. Employees By ผู้เก็บตัวอย่าง` | `coliform bac. Employee` |
| `ข้อมูลผู้ปฏิบัติงาน` | `Related coliform bac. Food.s` | `coliform bac. Food.` |
| `ข้อมูลผู้ปฏิบัติงาน` | `Related coliform bac. Food.s By ผู้เก็บตัวอย่าง` | `coliform bac. Food.` |
| `ข้อมูลผู้ปฏิบัติงาน` | `Related coliform bac._Waters` | `coliform bac._Water` |
| `ข้อมูลผู้ปฏิบัติงาน` | `Related coliform bac.s` | `coliform bac.` |
| `ข้อมูลผู้ปฏิบัติงาน` | `Related jobs` | `job` |
| `ข้อมูลผู้ปฏิบัติงาน` | `Related ข้อมูลคุณภาพน้ำs` | `ข้อมูลคุณภาพน้ำ` |
| `ข้อมูลผู้ปฏิบัติงาน` | `Related ตรวจสอบถังs` | `ตรวจสอบถัง` |
| `ข้อมูลผู้ปฏิบัติงาน` | `Related น้ำประปาs` | `น้ำประปา` |
| `ตรวจสอบถัง` | `re_check` | `ข้อมูลถังดับเพลิง` |
| `น้ำประปา` | `Related tap water_Filters` | `tap water_Filter` |

## 5. สรุปข้อค้นพบสำคัญ

### 5.1 รูปแบบการคำนวณที่พบทั่วแอป

- **สร้าง key ด้วย `uniqueid()`**: 29 คอลัมน์ (Initial value) เช่น `หน้าหลัก`.`id`, `ข้อมูลคุณภาพน้ำ`.`id`, `Filter_Water`.`ID`, `น้ำประปา`.`Row ID`, `Menu ประปา`.`Row ID` … — เกือบทุกตารางธุรกรรมใช้ GUID เป็น key แทนการพึ่งลำดับแถว
- **ประทับเวลา `NOW()`** (Initial value): 9 คอลัมน์ (`ข้อมูลคุณภาพน้ำ`.`วันที่ บันทึก`, `น้ำประปา`.`Date`, `tap water_Filter`.`Trigger_PDF`, `ตรวจสอบถัง`.`Date_time`, `coliform bac. Food.`.`Collect_date`, `coliform bac. Food.`.`Result_date`, `job`.`Date_time`, `Inventory`.`DateTime`, `Check`.`Date_time`) — คอลัมน์ key `วันที่ บันทึก` ของตาราง `ข้อมูลคุณภาพน้ำ` เองก็เริ่มที่ `NOW()` แล้วผู้ใช้แก้วันย้อนหลังได้
- **`TODAY()`**: ใช้ราว 57 จุด ส่วนใหญ่เป็น default ช่วงวันที่ในตาราง Filter_* และเงื่อนไขซ่อน/เตือน
- **`SELECT()`**: 88 จุด — เป็นเครื่องมือหลักในการดึงค่าย้อนหลัง (เลขมิเตอร์เมื่อวาน, ค่า DO/TDS ของวันก่อน) และการรวมยอด
- **`LOOKUP()`**: 1 จุด (`ข้อมูลคุณภาพน้ำ`.`ปริมาณน้ำที่ใช้ในทุกกิจกรรม`)
- **`MAXROW()`**: 3 จุด (`ข้อมูลคุณภาพน้ำ`.`ดึงข้อมูลก่อนหน้า`, `Inventory`.`Chlorine_realyDiv10`, `Inventory`.`Chlorine_realyDiv4`) — ดึงแถวล่าสุดของชุดข้อมูล
- **ระบุผู้ใช้ด้วย `SWITCH(USEREMAIL(), …)`**: 8 คอลัมน์ (`ข้อมูลคุณภาพน้ำ`.`ผู้บันทึก`, `น้ำประปา`.`ผู้บันทึก`, `ตรวจสอบถัง`.`ผู้ตรวจสอบ`, `coliform bac. Food.`.`ผู้เก็บตัวอย่าง`, `coliform bac. Food.`.`ผู้รายงาน`, `coliform bac. Employee`.`ผู้รายงาน`, `coliform bac. Employee`.`ผู้เก็บตัวอย่าง`, `Check`.`Auditor`) — แปลงอีเมลผู้ใช้เป็นรหัสประจำตัวเจ้าหน้าที่ (รหัสตรง checksum บัตรประชาชนไทย → **ถูก redact เป็น pseudonym ID1…IDn แล้ว** ดูหมวด 11) ค่าที่ไม่ตรงใครได้ `"READ_ONLY"`
- **ไม่มีสูตร `REFROWS()` แบบเขียนเอง** — ความสัมพันธ์ย้อนกลับทั้ง 28 เส้นเป็นคอลัมน์ Related ที่ AppSheet สร้างอัตโนมัติ

### 5.2 สูตรเลือกอวตารตามคำนำหน้าชื่อ (ตาราง `ข้อมูลผู้ปฏิบัติงาน`.รูปภาพ)

คอลัมน์ Image คำนวณจากคำนำหน้าชื่อใน `[ชื่อ-สกุล]` — ผู้ชายได้รูปจาก Drive URL, ผู้หญิงได้ข้อความ `"หญิง"`
ซึ่งแมปไปรูปผู้หญิงด้วย URL ท้ายสูตร (verbatim, URL ไฟล์รูป avatar สาธารณะ 2 ไฟล์):

```appsheet
=IF(OR(CONTAINS([ชื่อ-สกุล], "นาย"), CONTAINS([ชื่อ-สกุล], "เด็กชาย"), CONTAINS([ชื่อ-สกุล], "ด.ช."),CONTAINS([ชื่อ-สกุล],"ดช.")),"https://drive.google.com/uc?id=1OwNal5ItBmxHuPxNxnsOvPQJEEKYMGNR",IF(OR(CONTAINS([ชื่อ-สกุล], "นาง"), CONTAINS([ชื่อ-สกุล], "นางสาว"), CONTAINS([ชื่อ-สกุล], "นส."),CONTAINS([ชื่อ-สกุล], "น.ส."),CONTAINS([ชื่อ-สกุล], "เด็กหญิง"),CONTAINS([ชื่อ-สกุล], "ด.ญ."),CONTAINS([ชื่อ-สกุล], "ดญ.")),"หญิง", "https://drive.google.com/uc?id=1mUf27yZbq5AWxigx_3__wPcREnthfsVQ"))
```

### 5.3 ตัวเลขบ่อบำบัดส่วนใหญ่เป็น "ค่าใส่เข้าตรง ๆ" — ไม่ใช่ค่าคำนวณ

ในตาราง `ข้อมูลคุณภาพน้ำ` (ตารางหลักของบ่อบำบัดน้ำเสีย) คอลัมน์ตัวเลขวัดผลเหล่านี้ **ไม่มีสูตรใด ๆ**
(ไม่มี App formula / Initial value / Valid If / Max-Min) — เป็น input ตรงจากการพิมพ์ค่าที่วัด/อ่านเซนเซอร์ลงฟอร์ม:

- `_RowNumber`, `ในบ่อเติมอากาศ (TDS-1)`, `อุณหภูมิ บ่อเติมอากาศ(Temperature)`, `ในน้ำก่อนทิ้ง (TDS-2)`, `ความเป็นกรดและด่าง(pH)`, `บ่อเติมอากาศ(DO-1)`, `บ่อตกตะกอน(DO-2)`, `น้ำก่อนทิ้ง(DO-3)`, `การตกตะกอน(SV30)`, `เลขมิเตอร์วันนี้`, `คลอรีนน้ำ ที่ใช้`, `เลขมิเตอร์เครื่องสูบ 1`, `เลขมิเตอร์เครื่องสูบ 2`

ตัวเลข **TDS ในบ่อเติมอากาศ (TDS-1), อุณหภูมิบ่อเติมอากาศ, TDS น้ำก่อนทิ้ง (TDS-2), pH,
DO-1/DO-2/DO-3 (บ่อเติมอากาศ/บ่อตกตะกอน/น้ำก่อนทิ้ง), SV30, เลขมิเตอร์วันนี้, เลขมิเตอร์เครื่องสูบ 1/2,
คลอรีนน้ำที่ใช้** จึงไม่มีการคำนวณใด ๆ ฝั่งนิยามแอป — ความถูกต้องขึ้นกับผู้บันทึก/เครื่องมือวัดโดยตรง
(ตามหลัก data honesty: snapshot นี้คือ schema+สูตร ไม่มีข้อมูลแถวจริง และไม่พบ logic บังคับช่วงค่า)

### 5.4 ตัวเลขที่ "ถูกคำนวณ" มีอยู่ — แต่เป็นยอดรวม/อ้างอิงย้อนหลัง

- `เลขมิเตอร์เมื่อวาน`, `last_meter_สูบ1/2`, `sum_energy`, `sum_water_usage`, `sum_wastewater`
  — ดึง/รวมจากแถวก่อนหน้าด้วย `SELECT()`/`MAXROW()` + `SUM()`
- `ปริมาณน้ำที่ใช้ในทุกกิจกรรม` — คำนวณจาก LOOKUP ตารางอื่น (ดูสูตร verbatim ในหมวด 3)
- ตาราง `Filter_Water` มีคอลัมน์ virtual `VC_CY_01…VC_CY_12` และ `VC_Chart_URL` รวมยอดรายปี
  (กราฟพลังงานรายปี) ด้วยสูตร `SUM(SELECT(…))` + ประกอบ URL รูปกราฟจาก `ENCODEURL()`
- ตาราง `last meter` มี **Spreadsheet formula** (สูตร `INDEX/MATCH` ฝั่ง Google Sheets) เทียบค่า `143^143`
  เพื่อดึงแถวล่าสุด — เป็นสูตรชั้นสเปรดชีต ไม่ใช่สูตร AppSheet

## 6. Slices (10)

| Slice | ตารางต้นทาง | เงื่อนไขแถว (verbatim) | คอลัมน์ |
|---|---|---|---|
| `test meter` | `last meter` | ```appsheet ⏎ ISNOTBLANK([meter ไฟ]) ⏎ ``` | 4 |
| `Filter Data` | `ข้อมูลคุณภาพน้ำ` | ```appsheet ⏎ =ISNOTBLANK(ANY(SELECT(Filter_Water[ID],AND([_THISROW].[วันที่ บันทึก]>=[Start Date],[_THISROW].[วันที่ บันทึก]<=[End Date])))) ⏎ ``` | 23 |
| `Calculate Filter_Data` | `ข้อมูลคุณภาพน้ำ` | ```appsheet ⏎ =ISNOTBLANK(ANY(SELECT(Filter_Water[ID],AND([_THISROW].[วันที่ บันทึก]>=[Start Date],[_THISROW].[วันที่ บันทึก]<=[End Date])))) ⏎ ``` | 12 |
| `Filter_sum` | `ข้อมูลคุณภาพน้ำ` | ```appsheet ⏎ =ISNOTBLANK(ANY(SELECT(Filter_Water[ID],AND([_THISROW].[วันที่ บันทึก]>=[Start Date],[_THISROW].[วันที่ บันทึก]<=[End Date])))) ⏎ ``` | 10 |
| `Filter Data 2` | `น้ำประปา` | ```appsheet ⏎ =ISNOTBLANK(ANY(SELECT(tap water_Filter[id],AND([_THISROW].[Date]>=[Start date],[_THISROW].[Date]<=[End date])))) ⏎ ``` | 11 |
| `New Slice` | `รูปหน้าซักประวัติ` | ```appsheet ⏎ (ทั้งหมด) ⏎ ``` | 3 |
| `Filter Data 3` | `ตรวจสอบถัง` | ```appsheet ⏎ =ISNOTBLANK( ⏎   ANY( ⏎     SELECT( ⏎       Filter_Firer[ID], ⏎       AND( ⏎         [_THISROW].[Date_time] >= [Start Date], ⏎         [_THISROW].[Date_time] <= [End Date], ⏎         OR( ⏎           AND( ⏎             IN("ปกติ", [ตัวเลือก]), ⏎             [pipe] = "ปกติ", ⏎             [handle] = "ปกติ", ⏎             [tank] = "ปกติ", ⏎             [pressure_gauge] = "ปกติ" ⏎           ), ⏎           AND( ⏎             IN("ผิดปกติ", [ตัวเลือก]), ⏎             OR( ⏎               [pipe] = "ชำรุด", ⏎               [handle] = "ชำรุด", ⏎               [tank] = "ชำรุด", ⏎               [pressure_gauge] = "ไม่ปกติ" ⏎             ) ⏎           ) ⏎         ) ⏎       ) ⏎     ) ⏎   ) ⏎ ) ⏎ ``` | 27 |
| `Coliform.Em_Slice1` | `coliform bac. Employee` | ```appsheet ⏎ =isblank([Result_bac.]) ⏎ ``` | 10 |
| `Coliform.Food_Slice1` | `coliform bac. Food.` | ```appsheet ⏎ =ISblank([Result_bac.]) ⏎ ``` | 11 |
| `FilterLight_Data` | `Check` | ```appsheet ⏎ =ISNOTBLANK( ⏎     SELECT( ⏎       Filter_Light[ID], ⏎       AND( ⏎         ⏎         [_THISROW].[Date_time] >= [Start Date], ⏎         [_THISROW].[Date_time] <= [End Date], ⏎  ⏎         ⏎         OR( ⏎           ISBLANK([choice1]), ⏎           [_THISROW].[Persistency] = [choice1] ⏎         ), ⏎         OR( ⏎           ISBLANK([choice3]), ⏎           [_THISROW].[Position] = [choice3] ⏎         ), ⏎         OR( ⏎           ISBLANK([choice2]), ⏎           [_THISROW].[test_result] = [choice2] ⏎         ), ⏎         OR( ⏎           ISBLANK([choice4]), ⏎           IN([_THISROW].[Status], [choice4]) ⏎         ) ⏎       ) ⏎     ) ⏎   ) ⏎ ``` | 11 |

สูตรเงื่อนไขแบบเต็ม:

- **`test meter`**

```appsheet
ISNOTBLANK([meter ไฟ])
```

- **`Filter Data`**

```appsheet
=ISNOTBLANK(ANY(SELECT(Filter_Water[ID],AND([_THISROW].[วันที่ บันทึก]>=[Start Date],[_THISROW].[วันที่ บันทึก]<=[End Date]))))
```

- **`Calculate Filter_Data`**

```appsheet
=ISNOTBLANK(ANY(SELECT(Filter_Water[ID],AND([_THISROW].[วันที่ บันทึก]>=[Start Date],[_THISROW].[วันที่ บันทึก]<=[End Date]))))
```

- **`Filter_sum`**

```appsheet
=ISNOTBLANK(ANY(SELECT(Filter_Water[ID],AND([_THISROW].[วันที่ บันทึก]>=[Start Date],[_THISROW].[วันที่ บันทึก]<=[End Date]))))
```

- **`Filter Data 2`**

```appsheet
=ISNOTBLANK(ANY(SELECT(tap water_Filter[id],AND([_THISROW].[Date]>=[Start date],[_THISROW].[Date]<=[End date]))))
```

- **`Filter Data 3`**

```appsheet
=ISNOTBLANK(
  ANY(
    SELECT(
      Filter_Firer[ID],
      AND(
        [_THISROW].[Date_time] >= [Start Date],
        [_THISROW].[Date_time] <= [End Date],
        OR(
          AND(
            IN("ปกติ", [ตัวเลือก]),
            [pipe] = "ปกติ",
            [handle] = "ปกติ",
            [tank] = "ปกติ",
            [pressure_gauge] = "ปกติ"
          ),
          AND(
            IN("ผิดปกติ", [ตัวเลือก]),
            OR(
              [pipe] = "ชำรุด",
              [handle] = "ชำรุด",
              [tank] = "ชำรุด",
              [pressure_gauge] = "ไม่ปกติ"
            )
          )
        )
      )
    )
  )
)
```

- **`Coliform.Em_Slice1`**

```appsheet
=isblank([Result_bac.])
```

- **`Coliform.Food_Slice1`**

```appsheet
=ISblank([Result_bac.])
```

- **`FilterLight_Data`**

```appsheet
=ISNOTBLANK(
    SELECT(
      Filter_Light[ID],
      AND(
       
        [_THISROW].[Date_time] >= [Start Date],
        [_THISROW].[Date_time] <= [End Date],

       
        OR(
          ISBLANK([choice1]),
          [_THISROW].[Persistency] = [choice1]
        ),
        OR(
          ISBLANK([choice3]),
          [_THISROW].[Position] = [choice3]
        ),
        OR(
          ISBLANK([choice2]),
          [_THISROW].[test_result] = [choice2]
        ),
        OR(
          ISBLANK([choice4]),
          IN([_THISROW].[Status], [choice4])
        )
      )
    )
  )
```

## 7. Views (130)

ประเภท: detail × 48, form × 40, table × 16, card × 7, gallery × 6, dashboard × 6, deck × 5, calendar × 1, chart × 1
(ส่วนใหญ่เป็น detail/form/table ที่ AppSheet สร้างให้อัตโนมัติต่อตาราง — ไม่มีสูตรซับซ้อนในระดับ view;
การกรองข้อมูลเกิดที่ระดับ slice ในหมวด 6)

| View | ตาราง | ประเภท | ตำแหน่ง | Group by | Sort |
|---|---|---|---|---|---|
| `ข้อมูลผู้ปฏิบัติงาน` | `ข้อมูลผู้ปฏิบัติงาน` | deck | left | — | — |
| `หน้าหลัก` | `หน้าหลัก` | detail | left most | — | — |
| `job` | `job` | calendar | right most | — | — |
| `address_Detail` | `address` | detail | ref | — | — |
| `address_Form` | `address` | form | ref | — | — |
| `Calculate Filter_Data_Detail` | `Calculate Filter_Data` | detail | ref | — | — |
| `Calculate Filter_Data_Form` | `Calculate Filter_Data` | form | ref | — | — |
| `Categories_Detail` | `Categories` | detail | ref | — | — |
| `Categories_Form` | `Categories` | form | ref | — | — |
| `Check` | `Check` | form | ref | — | — |
| `Check_Detail` | `Check` | detail | ref | — | — |
| `Check_Form` | `Check` | form | ref | — | — |
| `Check_Inline` | `Check` | deck | ref | — | — |
| `coliform bac. Employee_Detail` | `coliform bac. Employee` | detail | ref | — | — |
| `coliform bac. Employee_Form` | `coliform bac. Employee` | form | ref | — | — |
| `coliform bac. Employee_Inline` | `coliform bac. Employee` | table | ref | — | — |
| `coliform bac. Food._Detail` | `coliform bac. Food.` | detail | ref | — | — |
| `coliform bac. Food._Form` | `coliform bac. Food.` | form | ref | — | — |
| `coliform bac. Food._Inline` | `coliform bac. Food.` | table | ref | — | — |
| `coliform bac._Detail` | `coliform bac.` | detail | ref | — | — |
| `coliform bac._Form` | `coliform bac.` | form | ref | — | — |
| `coliform bac._Inline` | `coliform bac.` | table | ref | — | — |
| `coliform bac._Water_Detail` | `coliform bac._Water` | detail | ref | — | — |
| `coliform bac._Water_Form` | `coliform bac._Water` | form | ref | — | — |
| `coliform bac._Water_Inline` | `coliform bac._Water` | table | ref | — | — |
| `coliform_ยังไม่เสร็จ` | `coliform bac. Food.` | detail | ref | — | — |
| `distributor_Detail` | `distributor` | detail | ref | — | — |
| `distributor_Form` | `distributor` | form | ref | — | — |
| `em.SI2` | `coliform bac. Employee` | form | ref | — | — |
| `Emergency light_Detail` | `Emergency light` | detail | ref | — | — |
| `Emergency light_Form` | `Emergency light` | form | ref | — | — |
| `er_light_list` | `Emergency light` | gallery | ref | — | — |
| `ER_light_Menu_Detail` | `ER_light_Menu` | detail | ref | — | — |
| `ER_light_Menu_Form` | `ER_light_Menu` | form | ref | — | — |
| `Filter` | `Filter_Water` | detail | ref | — | — |
| `Filter Data_Detail` | `Filter Data` | detail | ref | — | — |
| `Filter_ColiformBac_Detail` | `Filter_ColiformBac` | detail | ref | — | — |
| `Filter_ColiformBac_Form` | `Filter_ColiformBac` | form | ref | — | — |
| `Filter_fire` | `Filter_Firer` | detail | ref | — | — |
| `Filter_Firer_Detail` | `Filter_Firer` | detail | ref | — | — |
| `Filter_Firer_Form` | `Filter_Firer` | form | ref | — | — |
| `Filter_Firer_Inline` | `Filter_Firer` | table | ref | — | — |
| `filter_Light` | `Filter_Light` | detail | ref | — | — |
| `Filter_Light_Detail` | `Filter_Light` | detail | ref | — | — |
| `Filter_Light_Form` | `Filter_Light` | form | ref | — | — |
| `Filter_tapwater` | `tap water_Filter` | detail | ref | — | — |
| `Filter_Water_Detail` | `Filter_Water` | detail | ref | — | — |
| `Filter_Water_Form` | `Filter_Water` | form | ref | — | — |
| `Filter_Water_Inline` | `Filter_Water` | table | ref | — | — |
| `Filtered dashboard` | `หน้าหลัก` | dashboard | ref | — | — |
| `Filtered Data` | `Filter Data` | table | ref | — | วันที่ บันทึก Ascending |
| `Filtered Data 2` | `Filter Data 2` | table | ref | — | — |
| `Filtered Data 3` | `Filter Data 3` | table | ref | — | — |
| `Filtered Graph` | `Filter Data` | chart | ref | — | วันที่ บันทึก Ascending |
| `Filtered tap water dashboard` | `น้ำประปา` | dashboard | ref | — | — |
| `Filtered_Tapwater Data` | `Filter Data 2` | table | ref | — | — |
| `Fire_Dashbord` | `หน้าหลัก` | dashboard | ref | — | — |
| `Inventory_Detail` | `Inventory` | detail | ref | — | — |
| `Inventory_Form` | `Inventory` | form | ref | — | — |
| `Items_Detail` | `Items` | detail | ref | — | — |
| `Items_Form` | `Items` | form | ref | — | — |
| `Items_Inline` | `Items` | deck | ref | — | — |
| `job_Detail` | `job` | detail | ref | — | — |
| `job_Form` | `job` | form | ref | — | — |
| `job_Inline` | `job` | deck | ref | — | — |
| `last meter_Detail` | `last meter` | detail | ref | — | — |
| `Light_Dashbord` | `Emergency light` | dashboard | ref | — | — |
| `Light_Filtered_data` | `FilterLight_Data` | table | ref | — | Date_time Ascending |
| `location_area_Detail` | `location_area` | detail | ref | — | — |
| `location_area_Form` | `location_area` | form | ref | — | — |
| `maintenance_Detail` | `maintenance` | detail | ref | — | — |
| `maintenance_Form` | `maintenance` | form | ref | — | — |
| `Menu น้ำประปา` | `Menu ประปา` | card | ref | — | — |
| `Menu ประปา_Detail` | `Menu ประปา` | detail | ref | — | — |
| `Menu ประปา_Form` | `Menu ประปา` | form | ref | — | — |
| `menu ระบบบ่อบำบัด_Detail` | `menu ระบบบ่อบำบัด` | detail | ref | — | — |
| `menu ระบบบ่อบำบัด_Form` | `menu ระบบบ่อบำบัด` | form | ref | — | — |
| `Menu_Emergency Light` | `ER_light_Menu` | gallery | ref | — | — |
| `Menu_fire` | `Menu_Firer` | gallery | ref | — | — |
| `Menu_Firer_Detail` | `Menu_Firer` | detail | ref | — | — |
| `Menu_สุขาภิบาลอาหาร` | `menu_สุขาภิบาลอาหาร` | card | ref | — | name Descending |
| `menu_สุขาภิบาลอาหาร_Detail` | `menu_สุขาภิบาลอาหาร` | detail | ref | — | — |
| `Numbers_Detail` | `Numbers` | detail | ref | — | — |
| `Numbers_Form` | `Numbers` | form | ref | — | — |
| `Place of work` | `location_area` | card | ref | — | — |
| `search` | `หน้าหลัก` | dashboard | ref | — | — |
| `search.emSI2` | `Coliform.Em_Slice1` | card | ref | Collect_date Descending | Collect_date Descending |
| `search.Food.SI2` | `Coliform.Food_Slice1` | card | ref | Collect_date Descending | Collect_date Descending |
| `SI2` | `coliform bac. Food.` | form | ref | — | — |
| `Sum Filtered Data` | `Filter_Water` | detail | ref | — | — |
| `sumER-Light` | `Filter_Light` | detail | ref | — | — |
| `tap water_Filter_Detail` | `tap water_Filter` | detail | ref | — | — |
| `tap water_Filter_Form` | `tap water_Filter` | form | ref | — | — |
| `tap water_Filter_Inline` | `tap water_Filter` | table | ref | — | — |
| `Vendors_Detail` | `Vendors` | detail | ref | — | — |
| `Vendors_Form` | `Vendors` | form | ref | — | — |
| `View_ข้อมูลถังดับเพลิง` | `ข้อมูลถังดับเพลิง` | gallery | ref | — | — |
| `เก็บรูป` | `เก็บรูป` | dashboard | ref | — | — |
| `เก็บรูป_Detail` | `เก็บรูป` | detail | ref | — | — |
| `เก็บรูป_Form` | `เก็บรูป` | form | ref | — | — |
| `ข้อมูลคุณภาพน้ำ_Detail` | `ข้อมูลคุณภาพน้ำ` | detail | ref | — | — |
| `ข้อมูลคุณภาพน้ำ_Form` | `ข้อมูลคุณภาพน้ำ` | form | ref | — | — |
| `ข้อมูลคุณภาพน้ำ_Inline` | `ข้อมูลคุณภาพน้ำ` | table | ref | — | — |
| `ข้อมูลถังดับเพลิง` | `ข้อมูลถังดับเพลิง` | table | ref | — | — |
| `ข้อมูลถังดับเพลิง_Detail` | `ข้อมูลถังดับเพลิง` | detail | ref | — | — |
| `ข้อมูลถังดับเพลิง_Form` | `ข้อมูลถังดับเพลิง` | form | ref | — | — |
| `ข้อมูลผู้ปฏิบัติงาน_Detail` | `ข้อมูลผู้ปฏิบัติงาน` | detail | ref | — | — |
| `ข้อมูลผู้ปฏิบัติงาน_Form` | `ข้อมูลผู้ปฏิบัติงาน` | form | ref | — | — |
| `คู่มือ_Detail` | `คู่มือ` | detail | ref | — | — |
| `คู่มือ_Form` | `คู่มือ` | form | ref | — | — |
| `คู่มืองานบ่อบำบัด` | `คู่มือ` | card | ref | — | — |
| `คู่มือน้ำประปา` | `คู่มือน้ำประปา` | card | ref | — | — |
| `คู่มือน้ำประปา_Detail` | `คู่มือน้ำประปา` | detail | ref | — | — |
| `คู่มือน้ำประปา_Form` | `คู่มือน้ำประปา` | form | ref | — | — |
| `ดูข้อมูล` | `น้ำประปา` | table | ref | — | — |
| `ตรวจสอบถัง_Detail` | `ตรวจสอบถัง` | detail | ref | — | — |
| `ตรวจสอบถัง_Form` | `ตรวจสอบถัง` | form | ref | — | — |
| `ตรวจสอบถัง_Inline` | `ตรวจสอบถัง` | deck | ref | — | — |
| `ตรวจสอบถังดับเพลิง` | `ตรวจสอบถัง` | form | ref | — | — |
| `น้ำประปา_Detail` | `น้ำประปา` | detail | ref | — | — |
| `น้ำประปา_Form` | `น้ำประปา` | form | ref | — | — |
| `น้ำประปา_Inline` | `น้ำประปา` | table | ref | — | — |
| `ไฟฟ้าทั้งหมด` | `Filter_Water` | detail | ref | — | temporary_data Ascending |
| `ระบบน้ำประปา` | `Menu ประปา` | gallery | ref | — | icon Ascending |
| `ระบบบ่อบำบัด` | `menu ระบบบ่อบำบัด` | gallery | ref | — | — |
| `รูปหน้าซักประวัติ_Detail` | `รูปหน้าซักประวัติ` | detail | ref | — | — |
| `ลงข้อมูลน้ำ` | `น้ำประปา` | form | ref | — | — |
| `ลงข้อมูลบำบัดน้ำเสีย` | `ข้อมูลคุณภาพน้ำ` | form | ref | — | — |
| `หน้าหลัก_Detail` | `หน้าหลัก` | detail | ref | — | — |
| `อ11` | `coliform bac._Water` | form | ref | — | — |

## 8. Actions (161)

ประเภทพฤติกรรม: `NAVIGATE_APP` × 36, `EDIT_RECORD` × 30, `ADD_RECORD` × 30, `DELETE_RECORD` × 26, `SET_COLUMN_VALUE` × 13, `OPEN_FILE` × 12, `CALL` × 3, `SMS` × 3, `NAVIGATE_DIFFERENT_APP` × 3, `EMAIL` × 2, `REF_ACTION` × 2, `EXPORT_VIEW` × 1
จากทั้งหมด 161 รายการ: 134 เป็น system-generated (AppSheet สร้างอัตโนมัติ: Call/SMS/ตัดแถว/นำทาง)
และ 27 รายการสร้างโดยเจ้าของแอป

### 8.1 Actions ของเจ้าของแอปที่มีเงื่อนไข/สูตร (verbatim)

- **`ระบบบ่อบำบัด`** (ตาราง `หน้าหลัก`, Do this: `NAVIGATE_DIFFERENT_APP`, column: `—`)
  - เงื่อนไข (Only if): 
  ```appsheet
  true
  ```
- **`ระบบประปาบาดาล`** (ตาราง `หน้าหลัก`, Do this: `NAVIGATE_DIFFERENT_APP`, column: `—`)
  - เงื่อนไข (Only if): 
  ```appsheet
  true
  ```
- **`ถังดับเพลิง`** (ตาราง `หน้าหลัก`, Do this: `NAVIGATE_APP`, column: `—`)
  - เงื่อนไข (Only if): 
  ```appsheet
  =true
  ```
- **`View PDF ทส.1`** (ตาราง `Filter_Water`, Do this: `OPEN_FILE`, column: `—`)
  - เงื่อนไข (Only if): 
  ```appsheet
  =IN("สร้าง ทส.1",[Export PDF])
  ```
- **`clear`** (ตาราง `Filter_Water`, Do this: `SET_COLUMN_VALUE`, column: `Export PDF`)
  - เงื่อนไข (Only if): 
  ```appsheet
  true
  ```
  - Value: 
  ```appsheet
  =""
  ```
  - SET `Export PDF` ←
  ```appsheet
  =""
  ```
- **`View PDF ทส.2`** (ตาราง `Filter_Water`, Do this: `OPEN_FILE`, column: `—`)
  - เงื่อนไข (Only if): 
  ```appsheet
  =IN("สร้าง ทส.2",[Export PDF])
  ```
- **`สุขาภิบาลอาหารและน้ำ`** (ตาราง `หน้าหลัก`, Do this: `NAVIGATE_APP`, column: `—`)
  - เงื่อนไข (Only if): 
  ```appsheet
  true
  ```
- **`Add Place of Work`** (ตาราง `job`, Do this: `NAVIGATE_APP`, column: `—`)
  - เงื่อนไข (Only if): 
  ```appsheet
  true
  ```
- **`Instrument`** (ตาราง `หน้าหลัก`, Do this: `NAVIGATE_DIFFERENT_APP`, column: `—`)
  - เงื่อนไข (Only if): 
  ```appsheet
  true
  ```
- **`Deduct Chlorine Stock`** (ตาราง `Inventory`, Do this: `SET_COLUMN_VALUE`, column: `Amount_unit_deduct`)
  - เงื่อนไข (Only if): 
  ```appsheet
  =[Item ID] = "0c0e6a47"
  ```
  - Value: 
  ```appsheet
  =IF(
    [Amount_unit_deduct] >= ANY(SELECT(ข้อมูลคุณภาพน้ำ[คลอรีนน้ำที่ใช้จริง], AND([วันที่ บันทึก] = TODAY(), [Item ID] = "0c0e6a47"))),
    [Amount_unit_deduct] - ANY(SELECT(ข้อมูลคุณภาพน้ำ[คลอรีนน้ำที่ใช้จริง], AND([วันที่ บันทึก] = TODAY(), [Item ID] = "0c0e6a47"))),
    0
  )
  ```
  - SET `Amount_unit_deduct` ←
  ```appsheet
  =IF(
    [Amount_unit_deduct] >= ANY(SELECT(ข้อมูลคุณภาพน้ำ[คลอรีนน้ำที่ใช้จริง], AND([วันที่ บันทึก] = TODAY(), [Item ID] = "0c0e6a47"))),
    [Amount_unit_deduct] - ANY(SELECT(ข้อมูลคุณภาพน้ำ[คลอรีนน้ำที่ใช้จริง], AND([วันที่ บันทึก] = TODAY(), [Item ID] = "0c0e6a47"))),
    0
  )
  ```
- **`Process Deduct Chlorine Stock Action - 1`** (ตาราง `ข้อมูลคุณภาพน้ำ`, Do this: `SET_COLUMN_VALUE`, column: `วันที่ บันทึก`)
  - เงื่อนไข (Only if): 
  ```appsheet
  true
  ```
- **`Invoke Deduct Chlorine Stock`** (ตาราง `ข้อมูลคุณภาพน้ำ`, Do this: `REF_ACTION`, column: `—`)
  - เงื่อนไข (Only if): 
  ```appsheet
  true
  ```
- **`export`** (ตาราง `Filter_Water`, Do this: `EXPORT_VIEW`, column: `Export PDF`)
  - เงื่อนไข (Only if): 
  ```appsheet
  true
  ```
  - Value: 
  ```appsheet
  =""
  ```
- **`ไฟฉุกเฉิน`** (ตาราง `หน้าหลัก`, Do this: `NAVIGATE_APP`, column: `—`)
  - เงื่อนไข (Only if): 
  ```appsheet
  =true
  ```
- **`กดสร้าง PDF`** (ตาราง `Filter_Firer`, Do this: `SET_COLUMN_VALUE`, column: `Trigger_PDF`)
  - เงื่อนไข (Only if): 
  ```appsheet
  =ISBLANK([PDF])
  ```
  - Value: 
  ```appsheet
  =now()
  ```
  - SET `Trigger_PDF` ←
  ```appsheet
  =now()
  ```
  - SET `PDF` ←
  ```appsheet
  =CONCATENATE("Mydrive/appsheet/data/ActivatedSludge-29279640/PDFถังดับเพลิง/","รายงานถังดับเพลิง-",[pdfCount],".pdf")
  ```
- **`เปิดไฟล์ PDF`** (ตาราง `Filter_Firer`, Do this: `OPEN_FILE`, column: `—`)
  - เงื่อนไข (Only if): 
  ```appsheet
  =ISNOTBLANK([PDF])
  ```
- **`Action for Path PDF`** (ตาราง `Filter_Firer`, Do this: `SET_COLUMN_VALUE`, column: `PDF`)
  - เงื่อนไข (Only if): 
  ```appsheet
  true
  ```
  - Value: 
  ```appsheet
  =CONCATENATE("Mydrive/appsheet/data/ActivatedSludge-29279640/PDFถังดับเพลิง/","รายงานถังดับเพลิง-",[pdfCount],".pdf")
  ```
  - SET `PDF` ←
  ```appsheet
  =CONCATENATE("Mydrive/appsheet/data/ActivatedSludge-29279640/PDFถังดับเพลิง/","รายงานถังดับเพลิง-",[pdfCount],".pdf")
  ```
- **`clear PDF`** (ตาราง `Filter_Firer`, Do this: `SET_COLUMN_VALUE`, column: `PDF`)
  - เงื่อนไข (Only if): 
  ```appsheet
  =ISNOTBLANK([PDF])
  ```
  - Value: 
  ```appsheet
  =""
  ```
  - SET `PDF` ←
  ```appsheet
  =""
  ```
- **`สร้างรายงาน PDF`** (ตาราง `Filter_Light`, Do this: `SET_COLUMN_VALUE`, column: `id`)
  - เงื่อนไข (Only if): 
  ```appsheet
  =ISBLANK([pdfFile])
  ```
  - Value: 
  ```appsheet
  =NOW()
  ```
  - SET `pdfTrigger` ←
  ```appsheet
  =NOW()
  ```
  - SET `pdfFile` ←
  ```appsheet
  =CONCATENATE("Mydrive/appsheet/data/ActivatedSludge-29279640/PDFไฟฉุกเฉิน/","รายงานไฟฉุกเฉิน-",[pdfCount],".pdf")
  ```
- **`ดูรายงาน PDF`** (ตาราง `Filter_Light`, Do this: `OPEN_FILE`, column: `—`)
  - เงื่อนไข (Only if): 
  ```appsheet
  =ISNOTBLANK([pdfFile])
  ```
- **`รีเซ็ทรายงาน PDF`** (ตาราง `Filter_Light`, Do this: `SET_COLUMN_VALUE`, column: `pdfFile`)
  - เงื่อนไข (Only if): 
  ```appsheet
  =ISNOTBLANK([pdfFile])
  ```
  - Value: 
  ```appsheet
  =""
  ```
  - SET `pdfFile` ←
  ```appsheet
  =""
  ```
- **`Action for Action pdfFile`** (ตาราง `Filter_Light`, Do this: `SET_COLUMN_VALUE`, column: `pdfFile`)
  - เงื่อนไข (Only if): 
  ```appsheet
  true
  ```
  - Value: 
  ```appsheet
  =CONCATENATE("Mydrive/appsheet/data/ActivatedSludge-29279640/PDFไฟฉุกเฉิน/","รายงานไฟฉุกเฉิน-",[pdfCount],".pdf")
  ```
  - SET `pdfFile` ←
  ```appsheet
  =CONCATENATE("Mydrive/appsheet/data/ActivatedSludge-29279640/PDFไฟฉุกเฉิน/","รายงานไฟฉุกเฉิน-",[pdfCount],".pdf")
  ```
- **`_Bot_Update_EXP`** (ตาราง `ข้อมูลถังดับเพลิง`, Do this: `SET_COLUMN_VALUE`, column: `วันที่หมดอายุ`)
  - เงื่อนไข (Only if): 
  ```appsheet
  true
  ```
  - Value: 
  ```appsheet
  =ANY(
    SELECT(
      ตรวจสอบถัง[chem_exp],
      AND(
        [_THISROW].[Row ID] = [QR_CODE],
        [Date_time] = MAX(
          SELECT(
            ตรวจสอบถัง[Date_time],
            [_THISROW].[Row ID] = [QR_CODE]
          )
        )
      )
    )
  )
  ```
  - SET `วันที่หมดอายุ` ←
  ```appsheet
  =ANY(
    SELECT(
      ตรวจสอบถัง[chem_exp],
      AND(
        [_THISROW].[Row ID] = [QR_CODE],
        [Date_time] = MAX(
          SELECT(
            ตรวจสอบถัง[Date_time],
            [_THISROW].[Row ID] = [QR_CODE]
          )
        )
      )
    )
  )
  ```
- **`Run Action อัปเดต Action - 1`** (ตาราง `ตรวจสอบถัง`, Do this: `REF_ACTION`, column: `—`)
  - เงื่อนไข (Only if): 
  ```appsheet
  true
  ```
- **`Create PDF File`** (ตาราง `tap water_Filter`, Do this: `SET_COLUMN_VALUE`, column: `Trigger_PDF`)
  - เงื่อนไข (Only if): 
  ```appsheet
  =ISBLANK([PDF])
  ```
  - Value: 
  ```appsheet
  =now()
  ```
  - SET `Trigger_PDF` ←
  ```appsheet
  =now()
  ```
  - SET `PDF` ←
  ```appsheet
  =CONCATENATE("Mydrive/appsheet/data/ActivatedSludge-29279640/PDFน้ำประปา/","รายงานน้ำประปา-",[pdfCount],".pdf")
  ```
- **`Crear PDF File`** (ตาราง `tap water_Filter`, Do this: `SET_COLUMN_VALUE`, column: `PDF`)
  - เงื่อนไข (Only if): 
  ```appsheet
  =ISNOTBLANK([PDF])
  ```
  - Value: 
  ```appsheet
  =""
  ```
  - SET `PDF` ←
  ```appsheet
  =""
  ```
- **`Action for Path PDF 2`** (ตาราง `Filter_Firer`, Do this: `SET_COLUMN_VALUE`, column: `PDF`)
  - เงื่อนไข (Only if): 
  ```appsheet
  true
  ```
  - Value: 
  ```appsheet
  =CONCATENATE("Mydrive/appsheet/data/ActivatedSludge-29279640/PDFถังดับเพลิง/","รายงานถังดับเพลิง-",[pdfCount],".pdf")
  ```
  - SET `PDF` ←
  ```appsheet
  =CONCATENATE("Mydrive/appsheet/data/ActivatedSludge-29279640/PDFถังดับเพลิง/","รายงานถังดับเพลิง-",[pdfCount],".pdf")
  ```

รวม 27 action ของเจ้าของแอปที่มีเงื่อนไข/สูตร (ระบุ verbatim ข้างบน)

### 8.2 System-generated actions (สรุปรายชื่อ)

- `Categories`: `Delete`, `Edit`, `Add`
- `Check`: `Delete`, `Edit`, `Add`, `View Ref (Auditor)`
- `ER_light_Menu`: `Go to App Link (link_view)`, `Edit`, `Delete`, `Add`
- `Emergency light`: `Delete`, `Edit`, `Add`
- `Filter_ColiformBac`: `Edit`, `Open File (PDF)`
- `Filter_Firer`: `Delete`, `Edit`, `Add`, `View Ref (ผู้ตรวจสอบ)`
- `Filter_Light`: `Delete`, `Edit`, `Add`, `Open File (pdfFile)`
- `Filter_Water`: `Edit`, `Delete`, `Add`, `View Ref (ID)`, `Open File (PDF)`, `Open File (PDF 2)`
- `Inventory`: `Delete`, `Edit`, `Add`
- `Items`: `Delete`, `Edit`, `Open File (User manual)`, `Add`, `View Ref (Vendor)`
- `Menu ประปา`: `Go to App Link (Link view)`, `Add`
- `Menu_Firer`: `Go to App Link (LINKVIEW)`
- `Numbers`: `Delete`, `Edit`, `Add`
- `Vendors`: `Delete`, `Edit`, `Call Phone (Phone)`, `Send SMS (Phone)`, `Compose Email (Email)`, `View Map (Address)`, `Add`
- `address`: `Delete`, `Edit`, `Add`
- `coliform bac.`: `Delete`, `Edit`, `Add`, `View Ref (ผู้รายงาน)`
- `coliform bac. Employee`: `Delete`, `Edit`, `Add`, `View Ref (sample)`, `View Ref (อุปกรณ์)`, `View Ref (ผู้รายงาน)`, `View Ref (ผู้เก็บตัวอย่าง)`
- `coliform bac. Food.`: `Delete`, `Edit`, `Add`, `View Ref (ผู้รายงาน)`, `View Ref (อุปกรณ์)`, `View Ref (ผู้เก็บตัวอย่าง)`
- `coliform bac._Water`: `Delete`, `Edit`, `Add`, `View Ref (ผู้รายงาน)`, `View Ref (อุปกรณ์)`
- `distributor`: `Delete`, `Edit`, `Compose Email (dealer_email)`, `View Map (dealer_address)`, `Call Phone (dealer_tel)`, `Send SMS (dealer_tel)`, `Add`
- `job`: `Delete`, `Edit`, `Add`, `View Map (location)`, `View Ref (practician)`, `View Map (uthai_locate)`
- `location_area`: `Edit`, `Add`
- `maintenance`: `Delete`, `Edit`, `Add`
- `menu ระบบบ่อบำบัด`: `Go to App Link (link view menu AS)`, `Edit`
- `menu_สุขาภิบาลอาหาร`: `Go to App Link (Link view)`
- `tap water_Filter`: `View Ref (id)`, `Delete`, `Edit`, `Add`, `Open File (PDF)`
- `ข้อมูลคุณภาพน้ำ`: `View Ref (ผู้บันทึก)`, `Delete`, `Edit`, `Add`, `View Map (uthai_location)`, `View Map (current_location)`, `Chart Data for Filtered Graph`
- `ข้อมูลถังดับเพลิง`: `Delete`, `Edit`, `Add`
- `ข้อมูลผู้ปฏิบัติงาน`: `Call Phone (เบอร์โทรศัพท์)`, `Send SMS (เบอร์โทรศัพท์)`, `Edit`, `Add`, `Delete`
- `คู่มือ`: `Add`, `Open File (link)`
- `คู่มือน้ำประปา`: `Open File (link)`, `Add`, `Edit`
- `ตรวจสอบถัง`: `Delete`, `Edit`, `Add`, `View Ref (ผู้ตรวจสอบ)`
- `น้ำประปา`: `Delete`, `Edit`, `Add`, `View Ref (ผู้บันทึก)`, `View Ref (ชนิดเครื่องมือตรวจ)`
- `เก็บรูป`: `Delete`, `Edit`, `Add`

## 9. Bots / Automation (22)

- **`กดสร้าง PDF`** (tableGroup: `Filter_Firer`)
  - Event: `App` on `Filter_Firer` · triggers: `Updates`
  - เงื่อนไข (verbatim):
  ```appsheet
  [_THISROW_BEFORE].[Trigger_PDF] <> [_THISROW_AFTER].[Trigger_PDF]
  ```
  - Step: `Generate PDF File` (kind: `task`, type: `Create a new file`)
    - File Folder Path = `PDFถังดับเพลิง` · Disable Timestamp? = `True` · Attachment Page Size = `A4`
  - Step: `Path PDF` (kind: `dataAction`, type: `Set row values`)
  - Step: `Send Telegram` (kind: `task`, type: `Call a webhook`)
- **`สร้าง PDF ไฟฉุกเฉิน`** (tableGroup: `Filter_Light`)
  - Event: `App` on `Filter_Light` · triggers: `Updates`
  - เงื่อนไข (verbatim):
  ```appsheet
  [_THISROW_BEFORE].[pdfTrigger] <> [_THISROW_AFTER].[pdfTrigger]
  ```
  - Step: `Generate PDF File` (kind: `task`, type: `Create a new file`)
    - File Folder Path = `PDFไฟฉุกเฉิน` · Disable Timestamp? = `True` · Attachment Page Size = `A4`
  - Step: `Action pdfFile` (kind: `dataAction`, type: `Set row values`)
  - Step: `Send Telegram` (kind: `task`, type: `Call a webhook`)
- **`(disabled) PDF1.1`** (tableGroup: `Filter_Water`)
  - Event: `App` on `Filter_Water` · triggers: `Adds`, `Updates`
  - เงื่อนไข (verbatim):
  ```appsheet
  and(CONTAINS([Export PDF], "สร้าง ทส.1"),not(CONTAINS([Export PDF],"สร้าง ทส.2")))
  ```
  - Step: `Createทส.1` (kind: `task`, type: `Create a new file`)
    - File Folder Path = `PDFv2` · Disable Timestamp? = `True` · Attachment Page Size = `A4`
- **`PDF 2`** (tableGroup: `Filter_Water`)
  - Event: `App` on `Filter_Water` · triggers: `Adds`, `Updates`
  - เงื่อนไข (verbatim):
  ```appsheet
  CONTAINS([Export PDF], "สร้าง ทส.2")
  ```
  - Step: `Createทส.2` (kind: `task`, type: `Create a new file`)
    - File Folder Path = `PDF_ทส2` · Disable Timestamp? = `True` · Attachment Page Size = `A4`
  - Step: `Telegram ทส.2` (kind: `task`, type: `Call a webhook`)
- **`PDF`** (tableGroup: `Filter_Water`)
  - Event: `App` on `Filter_Water` · triggers: `Adds`, `Updates`
  - เงื่อนไข (verbatim):
  ```appsheet
  and(CONTAINS([Export PDF], "สร้าง ทส.1"),not(CONTAINS([Export PDF],"สร้าง ทส.2")))
  ```
  - Step: `Createทส.1` (kind: `task`, type: `Create a new file`)
    - File Folder Path = `PDFv2` · Disable Timestamp? = `True` · Attachment Page Size = `A4`
  - Step: `Telegram>ทส.1` (kind: `task`, type: `Call a webhook`)
  - Step: `Telegram Chart` (kind: `task`, type: `Call a webhook`)
- **`งานสวน`** (tableGroup: `job`)
  - Event: `App` on `job` · triggers: `Adds`, `Updates`
  - Step: `Garden_Step` (kind: `task`, type: `Call a script`)
- **`กดสร้าง PDF 2`** (tableGroup: `tap water_Filter`)
  - Event: `App` on `tap water_Filter` · triggers: `Updates`
  - เงื่อนไข (verbatim):
  ```appsheet
  [_THISROW_BEFORE].[Trigger_PDF] <> [_THISROW_AFTER].[Trigger_PDF]
  ```
  - Step: `Generate PDF File` (kind: `task`, type: `Create a new file`)
    - File Folder Path = `PDFน้ำประปา` · Disable Timestamp? = `True` · Attachment Page Size = `A4`
  - Step: `Send Telegram` (kind: `task`, type: `Call a webhook`)
- **`(disabled) Line AS record`** (tableGroup: `ข้อมูลคุณภาพน้ำ`)
  - Event: `App` on `ข้อมูลคุณภาพน้ำ` · triggers: `Adds`
  - Step: `AS_STEP` (kind: `task`, type: `Call a script`)
- **`(disabled) Line AS record 3`** (tableGroup: `ข้อมูลคุณภาพน้ำ`)
  - Event: `App` on `ข้อมูลคุณภาพน้ำ` · triggers: `Adds`
  - เงื่อนไข (verbatim):
  ```appsheet
  OR( [ในน้ำก่อนทิ้ง (TDS-2)]>900, [ในน้ำก่อนทิ้ง (TDS-2)]>900, [อุณหภูมิ บ่อเติมอากาศ(Temperature)]>40, [ความเป็นกรดและด่าง(pH)]>8.3, [การตกตะกอน(SV30)]>650, [Critical-DO-1]=Y, [Critical-DO-2]=Y, [Critical-DO-3]=Y, [ปริมาณน้ำเสียที่เข้าระบบบำบัด]>62, [Critical-FreeChlorine-Lowerlow]=Y, [Critical-FreeChlorine-HigherHigh]=Y)
  ```
  - Step: `alert` (kind: `task`, type: `Call a script`)
- **`(disabled) Auto Deduct Chlorine Stock`** (tableGroup: `ข้อมูลคุณภาพน้ำ`)
  - Event: `App` on `ข้อมูลคุณภาพน้ำ` · triggers: `Adds`
  - Step: `Process Deduct Chlorine Stock` (kind: `dataAction`, type: `Run action on rows`)
- **`Telegram_noti`** (tableGroup: `ข้อมูลคุณภาพน้ำ`)
  - Event: `App` on `ข้อมูลคุณภาพน้ำ` · triggers: `Adds`, `Updates`
  - Step: `AS_STEP1` (kind: `task`, type: `Call a webhook`)
- **`water_overload`** (tableGroup: `ข้อมูลคุณภาพน้ำ`)
  - Event: `App` on `ข้อมูลคุณภาพน้ำ` · triggers: `Adds`, `Updates`
  - เงื่อนไข (verbatim):
  ```appsheet
  [ปริมาณน้ำเสียที่เข้าระบบบำบัด] > 70
  ```
  - Step: `AS_STEP1` (kind: `task`, type: `Call a webhook`)
  - Step: `AS_STEP2` (kind: `task`, type: `Call a webhook`)
- **`Signal_notice`** (tableGroup: `ข้อมูลคุณภาพน้ำ`)
  - Event: `App` on `ข้อมูลคุณภาพน้ำ` · triggers: `Adds`, `Updates`
  - เงื่อนไข (verbatim):
  ```appsheet
  [หมายเหตุ]<>""
  ```
  - Step: `AS_STEP1` (kind: `task`, type: `Call a webhook`)
- **`TDS_Notice`** (tableGroup: `ข้อมูลคุณภาพน้ำ`)
  - Event: `` on `` · triggers: —
  - Step: `AS_STEP1` (kind: `task`, type: `Call a webhook`)
  - Step: `AS_STEP2` (kind: `task`, type: `Call a webhook`)
- **`pH_Notice`** (tableGroup: `ข้อมูลคุณภาพน้ำ`)
  - Event: `` on `` · triggers: —
  - Step: `AS_Step1` (kind: `task`, type: `Call a webhook`)
  - Step: `AS_Step2` (kind: `task`, type: `Call a webhook`)
- **`Do1_Notice`** (tableGroup: `ข้อมูลคุณภาพน้ำ`)
  - Event: `App` on `ข้อมูลคุณภาพน้ำ` · triggers: `Adds`, `Updates`
  - เงื่อนไข (verbatim):
  ```appsheet
  [Critical-DO-1] = TRUE
  ```
  - Step: `AS_Step1` (kind: `task`, type: `Call a webhook`)
  - Step: `AS_Step2` (kind: `task`, type: `Call a webhook`)
- **`Do3_Notice`** (tableGroup: `ข้อมูลคุณภาพน้ำ`)
  - Event: `App` on `ข้อมูลคุณภาพน้ำ` · triggers: `Adds`, `Updates`
  - เงื่อนไข (verbatim):
  ```appsheet
  [Critical-DO-3] = TRUE
  ```
  - Step: `AS_STEP1` (kind: `task`, type: `Call a webhook`)
  - Step: `AS_Step2` (kind: `task`, type: `Call a webhook`)
- **`SV30_Notice`** (tableGroup: `ข้อมูลคุณภาพน้ำ`)
  - Event: `App` on `ข้อมูลคุณภาพน้ำ` · triggers: `Adds`, `Updates`
  - เงื่อนไข (verbatim):
  ```appsheet
  OR([การตกตะกอน(SV30)]>450,[การตกตะกอน(SV30)]<150)
  ```
  - Step: `AS_STEP1` (kind: `task`, type: `Call a webhook`)
  - Step: `AS_Step2` (kind: `task`, type: `Call a webhook`)
- **`chlorine_Notice`** (tableGroup: `ข้อมูลคุณภาพน้ำ`)
  - Event: `App` on `ข้อมูลคุณภาพน้ำ` · triggers: `Adds`, `Updates`
  - เงื่อนไข (verbatim):
  ```appsheet
  OR([Critical-FreeChlorine-Lowerlow] = TRUE,[Critical-FreeChlorine-HigherHigh]= TRUE)
  ```
  - Step: `AS_STEP1` (kind: `task`, type: `Call a webhook`)
  - Step: `AS_Step2` (kind: `task`, type: `Call a webhook`)
- **`LineNoti`** (tableGroup: `ตรวจสอบถัง`)
  - Event: `App` on `ตรวจสอบถัง` · triggers: `Adds`
  - Step: `send` (kind: `task`, type: `Call a script`)
- **`Update_ExpDate`** (tableGroup: `ตรวจสอบถัง`)
  - Event: `App` on `ตรวจสอบถัง` · triggers: `Adds`
  - เงื่อนไข (verbatim):
  ```appsheet
  [_THISROW].[chem_exp] > ANY( SELECT( ข้อมูลถังดับเพลิง[วันที่หมดอายุ], [_THISROW].[QR_CODE] = [Row ID] ))
  ```
  - Step: `Run Action อัปเดต` (kind: `dataAction`, type: `Run action on rows`)
- **`Line AS record 2`** (tableGroup: `น้ำประปา`)
  - Event: `App` on `น้ำประปา` · triggers: `Adds`
  - Step: `AS_STEP` (kind: `task`, type: `Call a script`)

## 10. Format Rules (12)

| Rule | ตาราง | เงื่อนไข (verbatim) | คอลัมน์ที่จัดรูป | ผลลัพธ์ |
|---|---|---|---|---|
| `free chlorine` | `ข้อมูลคุณภาพน้ำ` | ```appsheet ⏎ =[คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)]>2.5 ⏎ ``` | `คลอรีนอิสระในน้ำก่อนทิ้ง (Free Chlorine)` | text red, highlight red, icon `fas fa-exclamation-triangle`, size 3 |
| `re_check` | `ตรวจสอบถัง` | ```appsheet ⏎  ⏎ ``` | `re_check` | text pink, highlight red, icon `far fa-check-circle`, size 1 |
| `re_check 2` | `ตรวจสอบถัง` | ```appsheet ⏎  ⏎ ``` | `re_check` | text purple, highlight green, icon `far fa-thumbs-up`, size 1 |
| `re_check 3` | `ตรวจสอบถัง` | ```appsheet ⏎  ⏎ ``` | `re_check` | text cyan, highlight orange, icon `fal fa-vote-yea`, size 1 |
| `re_check 4` | `ตรวจสอบถัง` | ```appsheet ⏎  ⏎ ``` | `re_check` | text green, highlight cyan, icon `far fa-clipboard-check`, size 1 |
| `re_check 5` | `ตรวจสอบถัง` | ```appsheet ⏎  ⏎ ``` | `re_check` | text purple, highlight yellow, icon `far fa-check-square`, size 1 |
| `re_check 6` | `ตรวจสอบถัง` | ```appsheet ⏎  ⏎ ``` | `re_check` | text primaryText, highlight purple, icon `far fa-check-circle`, size 1 |
| `re_check 7` | `ตรวจสอบถัง` | ```appsheet ⏎  ⏎ ``` | `re_check` | text orange, highlight blue, icon `far fa-badge-check`, size 1 |
| `re_check 8` | `ตรวจสอบถัง` | ```appsheet ⏎  ⏎ ``` | `re_check` | text secondaryText, highlight themeMainColor, icon `fas fa-badge-check`, size 1 |
| `re_check 9` | `ตรวจสอบถัง` | ```appsheet ⏎  ⏎ ``` | `re_check` | text themeMainColor, highlight pink, icon `fas fa-check-circle`, size 1 |
| `fire Rule` | `Filter_Firer` | ```appsheet ⏎ =IN([ตัวเลือก], LIST("ปกติ")) ⏎ ``` | `ตัวเลือก` | icon `fas fa-fire-extinguisher`, size 1.1 |
| `fire Rule 2` | `Filter_Firer` | ```appsheet ⏎ =IN("ผิดปกติ", [ตัวเลือก]) ⏎ ``` | `ตัวเลือก` | highlight red, icon `fas fa-fire-extinguisher`, size 1.1 |

## 11. บันทึกการ Sanitize

เอกสารนี้ผ่านการกรองข้อมูลส่วนบุคคล 2 ชั้น:

**ชั้นที่ 1 — โดย adapter ของ AppSheet Toolkit ก่อน snapshot ถูกเก็บ (คง placeholder verbatim ไว้):**
- `[REDACTED_EMAIL]` — อีเมลผู้ใช้ในสูตร `SWITCH(USEREMAIL(), …)` ถูกแทนด้วย placeholder มาแล้ว (placeholder ปรากฏในสูตรของ 8 คอลัมน์)
- `[REDACTED_SECRET]` — ลายเซ็น URL รูปภาพ AppSheet ในสูตร `tank_photo` ถูกแทนด้วย placeholder มาแล้ว

**ชั้นที่ 2 — โดยสคริปต์สร้างเอกสารนี้ (sanitize ซ้ำก่อนพิมพ์):**
- ที่อยู่อีเมลรูปแบบจริง: พบ 0 ตัว → แทนด้วย `⟨email redacted⟩` (ทั้งหมดเป็น placeholder ชั้นที่ 1 ที่ regex ยึดเพิ่มเป็นความปลอดภัย)
- **เลข 13 หลักตรง checksum บัตรประชาชนไทย: พบและ redact เป็น pseudonym `⟨thai-id IDn⟩`** — พบใน Initial value ของคอลัมน์ Ref ผู้บันทึก/ผู้ตรวจสอบ/ผู้เก็บตัวอย่าง/ผู้รายงาน/Auditor (8 คอลัมน์ ใน 7 ตาราง) และคอลัมน์ `job.ประจำจุด` ซึ่ง map อีเมล→`Employee_id` ของตาราง `ข้อมูลผู้ปฏิบัติงาน` — **รหัสประจำตัวพนักงานในแอปนี้คือเลขบัตรประชาชน**
- เลขยาว 14–16 หลักที่ไม่ตรง checksum: 7 จุด (1 ค่า) → `⟨id-like IDn⟩` — เป็นรหัสยาวที่ปรากฏในสูตร SWITCH ชุดเดียวกับรหัสบัตร น่าจะเป็นรหัสรูปแบบเก่า/ค่าทดสอบ แต่ redact ตามหลักไตร่ตรองเช่นเดียวกัน
- เบอร์โทรศัพท์รูปแบบจริง: พบ 0 ตัว → `⟨phone⟩` (ตรวจแล้วไม่มีเบอร์จริงใน config — สิ่งที่ regex เบอร์โทรจับได้ครั้งแรกคือ substring ของเลขรหัส 13 หลัก ซึ่งถูก redact ไปก่อนแล้ว คอลัมน์ `เบอร์โทรศัพท์` ของตาราง `ข้อมูลผู้ปฏิบัติงาน` เป็นชนิด `Phone` **ไม่มีค่า literal เก็บในนิยามแอป**)
- pattern HN/เลขที่บัตรผู้ป่วย: **ไม่พบ** — นิยามแอป (schema+สูตร) ไม่มีข้อมูลแถวจริงและไม่มีข้อมูลผู้ป่วย

### ตาราง pseudonym ที่ใช้ (เรียงตามลำดับที่พบ — **ไม่แสดงเลขจริง**)

| Pseudonym | ลักษณะ |
|---|---|
| `⟨thai-id ID1⟩` | 13 หลัก ตรง checksum บัตรประชาชนไทย |
| `⟨thai-id ID2⟩` | 13 หลัก ตรง checksum บัตรประชาชนไทย |
| `⟨thai-id ID3⟩` | 13 หลัก ตรง checksum บัตรประชาชนไทย |
| `⟨thai-id ID4⟩` | 13 หลัก ตรง checksum บัตรประชาชนไทย |
| `⟨id-like ID5⟩` | เลขยาว 14–16 หลัก ไม่ตรง checksum |
| `⟨thai-id ID6⟩` | 13 หลัก ตรง checksum บัตรประชาชนไทย |
| `⟨thai-id ID7⟩` | 13 หลัก ตรง checksum บัตรประชาชนไทย |

---

*สร้างโดยสคริปต์ Python (json module) จากไฟล์ snapshot ต้นฉบับ — สูตรทุกบล็อกเป็น verbatim ผ่าน sanitize ตามหมวด 11 · เอกสารนี้เป็นส่วนของ docs/ai/digital-twin/*
