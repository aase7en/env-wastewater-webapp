/**
 * DOC-3 — SOP/Manual attachment library.
 *
 * Wraps core.attachment table (RLS authenticated-rw). Uploads to Supabase
 * Storage 'attachments' bucket (admin must create in dashboard first).
 * Files are linked to an entity (e.g. regulation, equipment) via
 * entity_type + entity_id.
 *
 * Track Z scope (lib only).
 */
import { supabase } from "./supabase";

export interface Attachment {
  id: string;
  entity_type: string;
  entity_id: string;
  file_path: string;
  kind: string;
  uploaded_by: string | null;
  created_at: string;
}

const COLS = "id, entity_type, entity_id, file_path, kind, uploaded_by, created_at";

export async function fetchAttachments(entityType?: string, entityId?: string): Promise<Attachment[]> {
  let q = supabase.from("attachment").select(COLS).order("created_at", { ascending: false });
  if (entityType) q = q.eq("entity_type", entityType);
  if (entityId) q = q.eq("entity_id", entityId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown[]) as Attachment[];
}

/**
 * Upload file to Supabase Storage 'attachments' bucket + insert row in
 * core.attachment. Bucket must exist (admin creates via dashboard).
 *
 * Returns the created attachment row.
 */
export async function uploadAttachment(
  file: File,
  entityType: string,
  entityId: string,
  kind = "manual",
): Promise<Attachment> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${entityType}/${entityId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // 1. Upload to Storage.
  const { error: upErr } = await supabase.storage
    .from("attachments")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (upErr) {
    throw new Error(
      `Storage upload failed (bucket "attachments" ต้องสร้างก่อนใน Supabase dashboard): ${upErr.message}`,
    );
  }

  // 2. Insert attachment row.
  const { data, error: dbErr } = await supabase
    .from("attachment")
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      file_path: path,
      kind,
    })
    .select(COLS)
    .single();
  if (dbErr) {
    // Best-effort rollback the upload.
    await supabase.storage.from("attachments").remove([path]).catch(() => {});
    throw new Error(dbErr.message);
  }
  return data as unknown as Attachment;
}

export async function deleteAttachment(id: string, filePath: string): Promise<void> {
  // 1. Remove from Storage.
  const { error: stErr } = await supabase.storage.from("attachments").remove([filePath]);
  if (stErr) console.warn("storage remove failed:", stErr.message);
  // 2. Delete row.
  const { error } = await supabase.from("attachment").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Build a public/signable URL for display. */
export function attachmentUrl(filePath: string): string {
  const { data } = supabase.storage.from("attachments").getPublicUrl(filePath);
  return data.publicUrl;
}
