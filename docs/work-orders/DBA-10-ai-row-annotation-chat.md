# WO-DBA-10: AI row annotation + chat on result set
Status: open
Lane/files: `frontend/src/components/admin/AiResultChat.tsx` (new), `frontend/src/components/admin/RowAnnotation.tsx` (new), extends `frontend/src/lib/admin/ai-sql.ts`
Branch: main
Depends on: DBA-8

## Goal + Acceptance
- **RowAnnotation** (when admin clicks a row in ResultTable):
  - Inline panel under the row (or drawer) shows AI-generated annotation:
    - Anomaly detection: "ค่านี้สูงผิดปกติเทียบ trend รายเดือน (z-score > 2)"
    - Context: "เป็นแถวที่บันทึกโดย [reported_by_name_legacy] เมื่อ [date]"
    - Suggested action: "ตรวจสอบสาเหตุ / แจ้งซ่อม / ปกติ"
  - `annotateRow(row, tableName, schemaSnapshot)` — sends row JSON + table stats to AI
  - **PHI filter**: columns flagged sensitive are excluded from prompt context
- **AiResultChat** (chat panel bound to current query result set):
  - Persistent chat at right side of ResultTable
  - Admin asks follow-up on results: "มีกี่แถวที่ผิดปกติ", "เทียบเดือนก่อนยังไง"
  - AI sees the SQL that produced results + summary stats (count, min/max/avg per numeric column) — NOT the raw rows (avoids large token cost + PHI exposure)
  - If user asks for raw row data → AI suggests running a refined query instead
  - Reuses `lib/ai-chat.ts` callProvider with system prompt that includes the result-set summary
- All AI calls log to `core.ai_query_log`

## Verify
- Click row with anomalous DO value → annotation shows "ผิดปกติ vs trend"
- Chat "มีกี่แถวที่ pH > 8" → AI answers based on summary or suggests refined SQL
- Chat "แสดงข้อมูลคนไข้ทั้งหมด" → AI refuses + suggests legal alternative
- ai_query_log captures every chat exchange

## Checkpoint log
