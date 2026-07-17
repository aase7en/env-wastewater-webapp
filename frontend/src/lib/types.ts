/** Types matching the FastAPI Pydantic schemas (from app/schemas/).
 * Manual for now; will be auto-generated from /openapi.json later. */

export interface DashboardRow {
  reading_date: string;
  do_average?: number | string | null;
  ph?: number | string | null;
  free_chlorine?: number | string | null;
  tds_aeration?: number | string | null;
  water_used_total?: number | string | null;
  wastewater_in?: number | string | null;
  system_operating?: boolean | null;
  wastewater_discharged?: boolean | null;
  do_alert?: boolean | null;
  chlorine_alert?: boolean | null;
  ph_alert?: boolean | null;
}

export interface ReadingListItem {
  id: string;
  reading_date: string;
  do_average?: number | null;
  ph?: number | string | null;
  free_chlorine?: number | string | null;
  system_operating?: boolean | null;
  date_thai_be?: number | null;
}

export interface ReadingList {
  items: ReadingListItem[];
  total: number;
}

export interface EquipmentOut {
  id: string;
  code: string;
  name_th: string;
  name_en?: string | null;
  location_id?: string | null;
  is_active: boolean;
}

export interface HealthStatus {
  status: string;
  version: string;
  env: string;
  auth_mode: string;
}
