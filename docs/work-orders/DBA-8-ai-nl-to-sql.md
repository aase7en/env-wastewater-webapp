# WO-DBA-8: AiQueryBox (NL→SQL) — uses existing AI chat plumbing + PHI filter
Status: done (2026-07-17, zcode) — commit `ec4bc0d`
Lane/files: `frontend/src/components/admin/AiQueryBox.tsx` (new), `frontend/src/lib/admin/ai-sql.ts` (new)
Branch: main
Depends on: AI-1, AI-2 (provider config + chat panel from Wave 4), DBA-5

## Goal + Acceptance
- `lib/admin/ai-sql.ts`:
  - `nlToSql(question: string, schemaContext: SchemaSnapshot): Promise<{ sql: string, explanation: string, warnings: string[] }>`
    - Reads provider config from `core.ai_provider` (Wave 4 AI-1)
    - System prompt: "You are a SQL generator for ENV_DB Postgres. Schema: {tables}. Rules: return only SELECT/INSERT/UPDATE/DELETE; never return DROP/TRUNCATE/ALTER; quote identifiers; use Thai comments"
    - **PHI filter**: schema introspection filters out tables flagged `patient_safe=false` in `core.ai_scope` BEFORE sending to AI
    - Calls provider via existing `lib/ai-chat.ts` callProvider() (Wave 4 AI-2)
    - Parses response: extract SQL block + explanation + warnings
  - `useAiSql()` hook with loading/error state
- **AiQueryBox UI**:
  - Textarea "ถามภาษาไทย เช่น 'แสดงค่า DO ที่ต่ำกว่า 2 ล่าสุด 30 วัน'"
  - Submit → loading spinner → returns SQL + explanation in modal
  - Modal shows: SQL preview (syntax highlighted), explanation in Thai, warnings (if any)
  - Buttons: [รันเลย] [แก้ไขใน Editor] [ปฏิเสธ]
  - "รันเลย" → calls DBA-2 `runQuery` after whitelist re-check (defense)
  - "แก้ไขใน Editor" → loads SQL into SqlEditor (DBA-6) for admin review
- All NL→SQL requests log to `core.ai_query_log` (existing table)
- ⚠️ PHI hard rule: if any filtered table appears in user question keywords → block with "คำถามอ้างถึงข้อมูลที่จำกัด กรุณาปรับคำถาม"

## Verify
- NL "แสดงค่า DO ที่ต่ำกว่า 2" → AI returns `SELECT ... FROM wastewater.reading WHERE do_aeration < 2`
- Modal shows SQL + explanation → รันเลย → results in ResultTable
- NL "ลบทั้งหมด" → AI refuses or returns safe variant + warning
- ai_query_log row present with question + answer
- PHI question blocked before AI send

## Checkpoint log
