/**
 * IMP-1 — Generic file import engine.
 *
 * File-type sniff + parser registry. Each parser returns a uniform
 * { columns, rows } shape so adapters (IMP-2) can map any source to
 * any module's table.
 *
 * Supported inputs (added incrementally, all lazy-loaded):
 *   - .csv         → papaparse (RFC 4180)
 *   - .xlsx/.xls   → exceljs (CVE-safe alternative to xlsx)
 *   - .pdf         → pdfjs-dist text-extract → heuristic table detect
 *   - image (jpg/png) → AI OCR via existing lib/admin/ai-chat.ts
 *                       sendChatTurn (multi-modal prompt)
 *
 * Track Z scope (lib only — UI lives in BulkImportPage refactor IMP-3).
 */

export type FileKind = "csv" | "xlsx" | "pdf" | "image" | "unknown";

export interface ParsedTable {
  columns: string[];
  rows: Record<string, unknown>[];  // each row keyed by column name
  source: FileKind;
  warnings: string[];
}

/**
 * Sniff a File's type. Uses file extension first (cheap), then MIME
 * type. Returns 'unknown' if no match — caller shows "ไม่รองรับไฟล์นี้".
 */
export function sniffFileKind(file: File): FileKind {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return "csv";
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "xlsx";
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".webp")) return "image";
  // Fall back to MIME.
  const t = file.type.toLowerCase();
  if (t.includes("csv")) return "csv";
  if (t.includes("spreadsheet") || t.includes("excel")) return "xlsx";
  if (t === "application/pdf") return "pdf";
  if (t.startsWith("image/")) return "image";
  return "unknown";
}

/**
 * Dispatch entry point. Picks the right parser based on sniffed kind.
 * Throws on 'unknown' or parser errors.
 */
export async function parseFile(file: File): Promise<ParsedTable> {
  const kind = sniffFileKind(file);
  switch (kind) {
    case "csv":   return parseCsv(file);
    case "xlsx":  return parseXlsx(file);
    case "pdf":   return parsePdf(file);
    case "image": return parseImageOcr(file);
    default:
      throw new Error(`ไม่รองรับไฟล์ประเภทนี้ (${file.name}). รองรับ .csv .xlsx .pdf .jpg/.png`);
  }
}

// ─── CSV ─────────────────────────────────────────────────────────────────

async function parseCsv(file: File): Promise<ParsedTable> {
  const Papa = (await import("papaparse")).default;
  const text = await file.text();
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const columns = results.meta.fields ?? [];
        resolve({
          columns,
          rows: results.data,
          source: "csv",
          warnings: results.errors.map((e) => `row ${e.row}: ${e.message}`),
        });
      },
      error: (err: Error) => reject(new Error(`CSV parse failed: ${err.message}`)),
    });
  });
}

// ─── XLSX / XLS ─────────────────────────────────────────────────────────

async function parseXlsx(file: File): Promise<ParsedTable> {
  const ExcelJS = (await import("exceljs")).default;
  const buf = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);

  const ws = wb.worksheets[0];
  if (!ws) throw new Error("Excel: ไม่มี sheet");

  // Read header row (row 1) + data rows.
  const columns: string[] = [];
  const headerRow = ws.getRow(1);
  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    columns[col - 1] = String(cell.value ?? "").trim();
  });

  const rows: Record<string, unknown>[] = [];
  const warnings: string[] = [];
  ws.eachRow((row, rowNum) => {
    if (rowNum === 1) return; // skip header
    const obj: Record<string, unknown> = {};
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      const key = columns[col - 1];
      if (!key) return;
      // ExcelJS returns rich-text objects for typed cells; coerce.
      const v = cell.value;
      if (v === null || v === undefined) obj[key] = null;
      else if (typeof v === "object" && "text" in v) obj[key] = (v as { text: string }).text;
      else if (typeof v === "object" && "result" in v) obj[key] = (v as { result: unknown }).result;
      else obj[key] = v;
    });
    if (Object.keys(obj).length > 0) rows.push(obj);
  });

  if (rows.length > 10_000) {
    warnings.push(`Truncated to 10000 rows (got ${rows.length})`);
    rows.length = 10_000;
  }

  return { columns: columns.filter(Boolean), rows, source: "xlsx", warnings };
}

// ─── PDF table extraction ────────────────────────────────────────────────

/**
 * Best-effort PDF table extraction. Uses pdfjs-dist to dump text items,
 * groups them by Y coordinate (heuristic row detection), then splits
 * columns by X gaps. NOT as accurate as dedicated tools (camelot,
 * tabula) — caller should show "ตรวจสอบคอลัมน์ก่อน import" warning.
 */
async function parsePdf(file: File): Promise<ParsedTable> {
  const pdfjs = await import("pdfjs-dist");
  // Worker setup — pdfjs v4 ships a worker entry; set the URL from the
  // bundle so we don't need a CDN.
  // @ts-expect-error — build-time worker path
  await import("pdfjs-dist/build/pdf.worker.min.mjs");
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;

  type Item = { str: string; x: number; y: number };
  const pageItems: Item[] = [];
  for (let i = 1; i <= Math.min(doc.numPages, 5); i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    for (const item of content.items as Array<{ str?: string; transform?: number[] }>) {
      if (typeof item.str !== "string" || !item.str.trim()) continue;
      const x = item.transform?.[4] ?? 0;
      const y = item.transform?.[5] ?? 0;
      pageItems.push({ str: item.str.trim(), x, y });
    }
  }

  if (pageItems.length === 0) {
    return {
      columns: [],
      rows: [],
      source: "pdf",
      warnings: ["PDF ไม่มี text layer — อาจเป็นสแกนภาพ ลอง OCR ผ่าน image mode"],
    };
  }

  // Group items into rows by Y (within 3px tolerance).
  pageItems.sort((a, b) => b.y - a.y); // top-to-bottom in PDF coords is descending Y
  const rows: Item[][] = [];
  let currentRow: Item[] = [];
  let lastY = pageItems[0]!.y;
  for (const item of pageItems) {
    if (Math.abs(item.y - lastY) > 3) {
      if (currentRow.length) rows.push(currentRow);
      currentRow = [];
    }
    currentRow.push(item);
    lastY = item.y;
  }
  if (currentRow.length) rows.push(currentRow);

  // Heuristic: first row = header.
  const headerRow = rows.shift() ?? [];
  const columns = headerRow.map((i) => i.str);
  const dataRows = rows.map((row) => {
    const obj: Record<string, unknown> = {};
    row.forEach((item, idx) => {
      const col = columns[idx] ?? `col_${idx}`;
      obj[col] = (obj[col] ? String(obj[col]) + " " : "") + item.str;
    });
    return obj;
  });

  return {
    columns,
    rows: dataRows,
    source: "pdf",
    warnings: ["PDF table extraction เป็น heuristic — กรุณาตรวจสอบคอลัมน์ก่อน import"],
  };
}

// ─── Image OCR via AI ────────────────────────────────────────────────────

/**
 * Send image to AI provider with a structured prompt to extract a table.
 * Returns ParsedTable with best-effort columns/rows.
 *
 * NOTE: requires a multi-modal-capable provider configured in
 * core.ai_provider. If the active provider only supports text, this
 * will fail with a clear error.
 */
async function parseImageOcr(file: File): Promise<ParsedTable> {
  const { sendChatTurn } = await import("./admin/ai-chat");
  const dataUrl = await fileToDataUrl(file);

  // sendChatTurn doesn't support multi-modal yet (text-only) — wrap
  // directly with fetch on the configured provider for now.
  const { fetchAdminProviders } = await import("./admin/ai-providers");
  const providers = await fetchAdminProviders();
  const provider = providers.find((p) => p.is_enabled);
  if (!provider) {
    throw new Error("Image OCR ต้องมี AI provider ที่เปิดใช้งาน — ตั้งค่าใน Admin → AI");
  }

  const url = provider.api_url ?? `${provider.base_url}/v1/chat/completions`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (provider.key_value) headers.Authorization = `Bearer ${provider.key_value}`;

  const body = {
    model: provider.model_id ?? provider.model,
    messages: [
      {
        role: "system",
        content: "You are an OCR-for-tables assistant. Extract the table from the image. Return JSON {columns: string[], rows: object[]}. No prose.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Extract the table from this image as JSON." },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    max_tokens: 4000,
  };

  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`OCR provider ตอบ ${resp.status}: ${t.slice(0, 200)}`);
  }
  const data = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content ?? "{}";
  // Extract first {...} block.
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) {
    return { columns: [], rows: [], source: "image", warnings: ["AI ไม่สามารถ extract ตารางจากภาพได้"] };
  }
  try {
    const parsed = JSON.parse(match[0]) as { columns?: string[]; rows?: Record<string, unknown>[] };
    return {
      columns: parsed.columns ?? [],
      rows: parsed.rows ?? [],
      source: "image",
      warnings: [],
    };
  } catch (e) {
    return {
      columns: [],
      rows: [],
      source: "image",
      warnings: [`AI response parse failed: ${(e as Error).message}`],
    };
  }

  // best-effort log via sendChatTurn (no-op call for audit trail)
  void sendChatTurn;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(file);
  });
}
