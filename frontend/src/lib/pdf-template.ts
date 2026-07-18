/**
 * PDF-1 — PDF template data layer.
 *
 * Reads/writes core.pdf_template (RLS authenticated-rw). Layout stored
 * as JSONB describing field placements for the print engine.
 *
 * Layout schema (jsonb):
 *   {
 *     title: string,
 *     fields: [
 *       { key: "reading_date", label: "วันที่", x: 20, y: 30, w: 60, h: 8 },
 *       ...
 *     ],
 *     table?: { columns: ["col1","col2"], rowsKey: "items" }
 *   }
 *
 * Track Z scope (lib only).
 */
import { supabase } from "./supabase";

export interface PdfField {
  key: string;
  label: string;
  x: number;  // mm from left
  y: number;  // mm from top
  w: number;  // width mm
  h: number;  // height mm
}

export interface PdfTableSpec {
  columns: string[];
  rowsKey: string;  // key in data object containing array of row objects
}

export interface PdfLayout {
  title: string;
  subtitle?: string;
  fields: PdfField[];
  table?: PdfTableSpec;
}

export interface PdfTemplate {
  id: string;
  name: string;
  data_source: string;       // table or view name the template prints from
  paper_size: "a4" | "a5";
  orientation: "portrait" | "landscape";
  layout: PdfLayout;
  created_by: string | null;
  created_at: string;
}

const COLS = "id, name, data_source, paper_size, orientation, layout, created_by, created_at";

export async function fetchTemplates(): Promise<PdfTemplate[]> {
  const { data, error } = await supabase.from("pdf_template").select(COLS).order("name");
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown[]) as PdfTemplate[];
}

export async function fetchTemplate(id: string): Promise<PdfTemplate> {
  const { data, error } = await supabase.from("pdf_template").select(COLS).eq("id", id).single();
  if (error) throw new Error(error.message);
  return data as unknown as PdfTemplate;
}

export async function saveTemplate(input: Omit<PdfTemplate, "id" | "created_by" | "created_at"> & { id?: string }): Promise<PdfTemplate> {
  const payload = {
    name: input.name,
    data_source: input.data_source,
    paper_size: input.paper_size,
    orientation: input.orientation,
    layout: input.layout,
  };
  if (input.id) {
    const { data, error } = await supabase.from("pdf_template").update(payload).eq("id", input.id).select(COLS).single();
    if (error) throw new Error(error.message);
    return data as unknown as PdfTemplate;
  }
  const { data, error } = await supabase.from("pdf_template").insert(payload).select(COLS).single();
  if (error) throw new Error(error.message);
  return data as unknown as PdfTemplate;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from("pdf_template").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
