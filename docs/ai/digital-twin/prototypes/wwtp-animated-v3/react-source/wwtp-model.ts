/**
 * UTH[AI]-ENV wastewater visual contract — isolated presentation prototype.
 * Not a replacement for src/lib/twin/types.ts. The Core Engineering lane must
 * map approved app-domain selectors to this read-only view model.
 * All dimensions are metres. Equipment specification and telemetry remain unknown
 * until supported by verified records. This is a schematic, NOT an as-built BIM.
 */
export type AssetId =
  | 'T001' | 'T008' | 'T003' | 'T004' | 'T005' | 'T006' | 'CTRL'
  | 'P001A' | 'P001B' | 'AER1' | 'AER2' | 'SP001' | 'CL001';

export type DataMode = 'latest' | 'live' | 'historical' | 'simulation' | 'unavailable';
export type MetricSource = 'manual-snapshot' | 'sensor-telemetry' | 'derived' | 'simulation' | 'unavailable';

export interface ViewMetric {
  value: number | string | boolean | null;
  unit?: string;
  source: MetricSource;
  /** Never synthesize a timestamp from a date-only manual form. */
  observedAt: string | null;
  /** Optional date-only ISO yyyy-mm-dd, when source captures only a calendar date. */
  observedDate?: string | null;
  freshness: 'fresh' | 'stale' | 'unknown';
}
export type MetricKey =
  | 'ph' | 'sv30' | 'do' | 'tds' | 'freeChlorine' | 'temperature'
  | 'runtimeMin' | 'idleMin' | 'energyKwh' | 'chlorineLiters'
  | 'flowM3' | 'waterLevel' | 'pumpStatus' | 'sludgeLevel' | 'returnSludge';

export interface WWTPViewSnapshot {
  mode: DataMode;
  /** Date-only for daily manual readings; no unverified time-of-day inferred. */
  date: string | null;
  assets: Partial<Record<AssetId, Partial<Record<MetricKey, ViewMetric>>>>;
  system?: Partial<Record<'energyKwh' | 'chlorineLiters' | 'flowM3', ViewMetric>>;
}

export interface PlantAsset {
  id: AssetId;
  code: string;
  name: string;
  short: string;
  purpose: string;
  details: readonly string[];
  future: readonly string[];
  metrics: readonly { key: MetricKey; label: string }[];
  center: readonly [number, number, number];
  labelY: number;
}

export interface TankFootprint {
  x: number;
  z: number;
  w: number;
  d: number;
  depth: number;
}

/**
 * Conceptual placement informed by supplied 2026 engineering-photo layouts.
 * Coordinate origin is the schematic site center (NOT georeferenced).
 * The 60 m³ system descriptor is source context; its time basis is not verified.
 */
export const SITE = { width: 24.05, depth: 17.25, nominalCapacityM3: 60 } as const;
export const LAYOUT: Record<'T001'|'T008'|'T003'|'T004'|'T005'|'T006', TankFootprint> = {
  T001: { x: -10.0, z: -5.45, w: 1.5, d: 1.5, depth: 3.5 },
  T008: { x: -8.10, z: -5.25, w: 1.2, d: 2.2, depth: 1.6 },
  T003: { x: 7.20, z: -5.10, w: 5.0, d: 5.0, depth: 2.3 },
  T004: { x: 7.20, z: 0.45, w: 3.6, d: 3.6, depth: 3.7 },
  T005: { x: 8.10, z: 5.95, w: 1.5, d: 3.0, depth: 1.25 },
  T006: { x: 2.40, z: 5.6, w: 4.5, d: 3.2, depth: 1.25 },
};

export const ASSETS: Record<AssetId, PlantAsset> = {
  T001: { id:'T001',code:'T-001',name:'บ่อสูบน้ำเสีย',short:'รับน้ำเสียและสูบเข้าสู่ระบบ',purpose:'รับน้ำเสียจากท่อรวบรวมผ่านตะแกรงดักขยะ แล้วใช้ปั๊มจุ่มส่งไปบ่อเติมอากาศ',details:['ตะแกรงดักขยะก่อนเข้าปั๊ม','ปั๊มน้ำเสีย 2 ตัว สลับ/สำรองตามการควบคุมที่ตรวจสอบได้'],future:['ระดับน้ำ','รอบทำงานปั๊ม','อัตราการสูบ','รุ่นและกำลังมอเตอร์'],metrics:[{key:'waterLevel',label:'ระดับน้ำ'},{key:'pumpStatus',label:'สถานะปั๊ม'}],center:[-10.0,0,-5.45],labelY:1.55 },
  T008: { id:'T008',code:'T-008',name:'บ่อทิ้งรก',short:'บ่อแยกจากสายบำบัดหลัก',purpose:'บ่อแยกสำหรับการจัดการของเสียเฉพาะ ไม่ใช่หน่วยที่น้ำเสียไหลผ่านในสาย Activated Sludge หลัก',details:['ตรวจรายละเอียด SOP และตำแหน่งหน้างานก่อนใช้เป็น As-built'],future:['SOP การจัดการ','รอบตรวจสอบ'],metrics:[],center:[-8.10,0,-5.25],labelY:1.50 },
  T003: { id:'T003',code:'T-003',name:'บ่อเติมอากาศ',short:'ระบบชีวภาพ Activated Sludge',purpose:'เติมออกซิเจนและกวนผสมเพื่อให้จุลินทรีย์ย่อยสลายสารอินทรีย์ในน้ำเสีย',details:['มีเครื่องเติมอากาศ 2 ชุด','ค่าคุณภาพน้ำต้องผูกกับตำแหน่งวัดและวันบันทึกจริง'],future:['สถานะและรอบเครื่องเติมอากาศ','MLSS','อุณหภูมิ','DO แยกจุดวัด'],metrics:[{key:'ph',label:'pH'},{key:'sv30',label:'SV30'},{key:'do',label:'DO'},{key:'tds',label:'TDS'}],center:[7.20,0,-5.10],labelY:1.65 },
  T004: { id:'T004',code:'T-004',name:'บ่อตกตะกอน',short:'แยกน้ำใสและตะกอน',purpose:'ตะกอนจมสู่ก้นกรวยเพื่อสูบกลับ/ระบายส่วนเกิน ส่วนน้ำใสไหลล้นไปบ่อสัมผัสคลอรีน',details:['บ่อล่างเป็นทรงกรวยเหลี่ยมรับตะกอน','Feed Well กลางและ V-notch Weir รอบบ่อ'],future:['ระดับตะกอน','อัตรา RAS / WAS','DO ก่อนคลอรีน'],metrics:[{key:'sludgeLevel',label:'ระดับตะกอน'},{key:'returnSludge',label:'ตะกอนกลับ'},{key:'do',label:'DO'}],center:[7.20,0,0.45],labelY:1.65 },
  T005: { id:'T005',code:'T-005',name:'บ่อสัมผัสคลอรีน',short:'ฆ่าเชื้อก่อนระบายน้ำทิ้ง',purpose:'รับน้ำใสแล้วสัมผัสสารคลอรีนตามกระบวนการที่ได้รับอนุมัติ',details:['ตรวจ Free Chlorine ที่จุดเก็บตัวอย่างจริง','ค่าปริมาณใช้คลอรีนรายวันแสดงจากฟอร์ม ไม่ใช่อัตราโดสที่อนุมาน'],future:['Contact Time','ปริมาณสารคงเหลือ','TDS และ DO จุดน้ำทิ้ง'],metrics:[{key:'freeChlorine',label:'Free Cl'},{key:'tds',label:'TDS'},{key:'do',label:'DO'}],center:[8.10,0,5.95],labelY:1.65 },
  T006: { id:'T006',code:'T-006',name:'ลานทรายตากตะกอน',short:'ลดความชื้นตะกอนส่วนเกิน',purpose:'รับตะกอนส่วนเกินให้ระบายน้ำผ่านชั้นทราย/กรวด แล้วรวบรวมน้ำกรองกลับเข้าสู่ระบบ',details:['โมเดลแสดงสองช่องตามผังแนวคิด','ต้องตรวจสอบจำนวนช่องจริงกับแบบที่มีมาตราส่วน'],future:['วันลงตะกอน','ความชื้นและปริมาณตะกอน','สถานะลานทรายแต่ละช่อง'],metrics:[],center:[2.40,0,5.6],labelY:1.65 },
  CTRL: { id:'CTRL',code:'B-001',name:'อาคารควบคุม',short:'ศูนย์ควบคุมไฟฟ้า/เครื่องจักร',purpose:'ใช้ติดตั้งชุดควบคุมการเดินระบบและงานไฟฟ้าสนับสนุน',details:['ไม่อนุมานสถานะ ON/OFF จากสถานะระบบรวม','ค่าสรุปใช้ไฟฟ้าต้องมีแหล่งและช่วงการวัด'],future:['พลังงานรายวัน','Alarm','อุปกรณ์ MCC / PLC'],metrics:[{key:'energyKwh',label:'พลังงาน'}],center:[-2.75,3.8,-5.3],labelY:1.0 },
  P001A: { id:'P001A',code:'P-001A',name:'ปั๊มน้ำเสีย A',short:'Submersible Pump ตัวที่ 1',purpose:'สูบน้ำเสียจากบ่อพักเข้าสู่ระบบ',details:['รอป้าย Nameplate และตารางควบคุมที่ยืนยันแล้ว'],future:['Spec','Run/Stop นาที','ชั่วโมงทำงานสะสม'],metrics:[{key:'runtimeMin',label:'ทำงาน'},{key:'pumpStatus',label:'สถานะ'}],center:[-10.28,-2.6,-5.45],labelY:0.3 },
  P001B: { id:'P001B',code:'P-001B',name:'ปั๊มน้ำเสีย B',short:'Submersible Pump ตัวที่ 2',purpose:'สูบน้ำเสียสลับหรือสำรองตาม logic หน้างาน',details:['ไม่แสดงสถานะ OFF หากยังไม่รับข้อมูล'],future:['Spec','Run/Stop นาที','ชั่วโมงทำงานสะสม'],metrics:[{key:'runtimeMin',label:'ทำงาน'},{key:'pumpStatus',label:'สถานะ'}],center:[-9.72,-2.6,-5.45],labelY:0.3 },
  AER1: { id:'AER1',code:'AE-001',name:'เครื่องเติมอากาศ 1',short:'Aspirator Aerator',purpose:'เติมอากาศเพื่อเพิ่ม DO และกวนผสมในบ่อเติมอากาศ',details:['แอนิเมชันฟองอากาศเป็นภาพประกอบ ไม่ได้ยืนยันว่าเครื่องเปิดอยู่'],future:['รุ่นและกำลัง','Run/Stop นาที','กระแสไฟฟ้า'],metrics:[{key:'runtimeMin',label:'ทำงาน'},{key:'pumpStatus',label:'สถานะ'}],center:[5.85,.55,-6.25],labelY:.75 },
  AER2: { id:'AER2',code:'AE-002',name:'เครื่องเติมอากาศ 2',short:'Aspirator Aerator',purpose:'เครื่องเติมอากาศอีกชุดในบ่อเดียวกัน',details:['แสดงสถานะจริงก็ต่อเมื่อมีข้อมูลที่ระบุอุปกรณ์แต่ละตัว'],future:['รุ่นและกำลัง','Run/Stop นาที','กระแสไฟฟ้า'],metrics:[{key:'runtimeMin',label:'ทำงาน'},{key:'pumpStatus',label:'สถานะ'}],center:[8.40,.55,-3.95],labelY:.75 },
  SP001: { id:'SP001',code:'P-004A/B',name:'ชุดปั๊มสูบตะกอน',short:'Sludge Pump Station',purpose:'สูบตะกอนกลับบ่อเติมอากาศ (RAS) และส่งตะกอนส่วนเกิน (WAS) ไปยังลานทราย',details:['ต้องแยกทิศทางท่อ RAS และ WAS'],future:['Spec ปั๊ม','อัตราการสูบ','รอบเวลาการสูบ'],metrics:[{key:'runtimeMin',label:'ทำงาน'}],center:[4.22,-.75,1.46],labelY:.75 },
  CL001: { id:'CL001',code:'CL-001',name:'ชุดจ่ายคลอรีน',short:'Chlorine Dosing',purpose:'จ่ายคลอรีนเข้าบ่อสัมผัสตามค่าควบคุมของระบบจริง',details:['ปริมาณโดสไม่สามารถคำนวณจากปริมาณน้ำอย่างเดียวโดยไม่ทราบความเข้มข้น'],future:['รุ่นปั๊ม','อัตราจ่าย','ปริมาณใช้รายวัน'],metrics:[{key:'chlorineLiters',label:'ใช้คลอรีน'}],center:[8.10,1.25,4.73],labelY:.50 },
};

export const EMPTY_SNAPSHOT: WWTPViewSnapshot = { mode:'unavailable',date:null,assets:{} };

export const VIEW_METRIC_LABELS: Record<MetricKey, string> = {
 ph:'pH',sv30:'SV30',do:'DO',tds:'TDS',freeChlorine:'Free Cl',temperature:'Temp',runtimeMin:'ทำงาน',idleMin:'หยุด',energyKwh:'ไฟฟ้า',chlorineLiters:'คลอรีน',flowM3:'ปริมาณน้ำ',waterLevel:'ระดับน้ำ',pumpStatus:'สถานะ',sludgeLevel:'ชั้นตะกอน',returnSludge:'ตะกอนกลับ'
};

export function readableMetric(metric: ViewMetric | undefined): string {
 if (!metric || metric.value === null || metric.value === undefined || metric.value === '') return 'ไม่มีข้อมูล';
 if (typeof metric.value === 'boolean') return metric.value ? 'ใช่' : 'ไม่ใช่';
 const n = typeof metric.value === 'number' ? new Intl.NumberFormat('th-TH',{maximumFractionDigits:2}).format(metric.value) : String(metric.value);
 return `${n}${metric.unit ? ` ${metric.unit}` : ''}`;
}

export function readableMode(mode: DataMode): string {
 return { latest:'บันทึกล่าสุด',live:'เซนเซอร์เรียลไทม์',historical:'ข้อมูลย้อนหลัง',simulation:'สมมติสถานการณ์',unavailable:'ไม่มีข้อมูล' }[mode];
}
