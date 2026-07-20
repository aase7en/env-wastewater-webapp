# WO-AUTH-2: แก้ AuthProvider query ผิด schema — login block ทั้งแอป

Status: open → in-progress (2026-07-19, zcode)
Lane/files:
- `frontend/src/components/AuthProvider.tsx` (query + interface)
- `frontend/src/components/layout/AppShell.tsx` (display_name fallback)
- `frontend/src/components/repair/RepairRequestModal.tsx` (display_name fallback)
- `supabase/migrations/20260719000013_auth2_app_user_display_name.sql` (NEW — add `display_name` column)
- `reports/schema-snapshot-live.md` (regenerate)
Branch: main
Model tier: **cheap-ok** (pure Track Z — ไม่แตะ className ใด ๆ; SQL migration + query fix + interface rename)

## บริบท — พบระหว่าง user smoke test (login ไม่ได้)

User: "ฉัน login เข้าไปเล่นจริงไม่ได้ ทั้งที่ email, password มีใน supabase แล้ว"

Root cause: `AuthProvider.loadAppUser()` query `core.app_user` ผิด schema 2 จุด:

```ts
// AuthProvider.tsx:82-86 (current — BROKEN)
const { data, error } = await supabase
  .from("app_user")
  .select("id, role, display_name")   // ❌ display_name ไม่มีใน schema
  .eq("auth_user_id", userId)          // ❌ auth_user_id ไม่มี — id คือ FK ตรงไป auth.users.id
  .maybeSingle();
```

เทียบกับ schema จริง (`reports/schema-snapshot-live.md:218`):

| # | column | type | nullable | default |
|---|---|---|---|---|
| 1 | `id` | uuid (FK→auth.users.id, ON DELETE CASCADE) | NO | — |
| 2 | `role` | user_role | NO | 'staff' |
| 3 | `employee_id` | text | YES | — |
| 4 | `is_active` | boolean | NO | true |
| 5 | `created_at` | timestamptz | NO | now() |

→ PostgREST คืน `PGRST204` (column does not exist) ทุกครั้ง → catch → `setAppUser(null)` →
`isAuthenticated = !!session && !!appUser = false` → RequireAuth bounce ไป `/login` ตลอดกาล

## ทำไม AUTH-1 ไม่เจอ

AUTH-1 (`1e9be0c`) แก้ race condition ของ `loading` แต่ **ไม่ได้แตะ query**. Handoff #3
บันทึกว่า "request `app_user` ยิงถูกต้อง (id ตรง)" — จริง ๆ แล้ว query ผิดอยู่ก่อน AUTH-1
เลย แต่ Fable5 verify ด้วย seeded mock `app_user` ใน localStorage (ไม่ได้ผ่าน REST จริง)
จึงไม่เห็น.

User เจอเพราะ login จริงใน browser = REST จริง = PGRST204 = bounce.

## Goal + Acceptance

1. **Schema**: เพิ่ม `core.app_user.display_name text` column (user-approved — ต้องการ
   ชื่อจริงแสดงใน sidebar + PDF reporter ไม่ใช่แค่ email)
2. **Query ถูก**: `.eq("id", userId)` + `.select("id, role, display_name, is_active")`
3. **Login success**: user กรอก email/password ที่ถูกต้อง → navigate ไป `/dashboard`
   (หรือ `next` param) โดยไม่ bounce กลับ `/login`
4. **Edge case — app_user row missing**: มี auth.users row แต่ยังไม่มี core.app_user
   row → `appUser=null` → RequireAuth bounce /login (preserve behavior — ไม่ทำให้ worse).
   พิเศษ: log warn เพื่อให้ debug ง่าย
5. **Edge case — is_active=false**: account disabled → ต้องจัดการเป็น explicit rejection
   (เพิ่มใน acceptance ข้อ 6)
6. **`is_active=false` handling**: ถ้า row exists แต่ `is_active=false` → ถือว่า
   not-authenticated, แสดง error "บัญชีถูกปิดใช้งาน" (ไม่ใช่ silent bounce)
7. **Display name fallback**: `appUser?.display_name || user.email || "ผู้ใช้"` ใน
   AppShell + RepairRequestModal (เดิมใช้แล้ว ไม่ต้องแก้ logic — แค่ schema มี column แล้ว)
8. **Backfill**: seed `display_name` สำหรับ admin row ที่มีอยู่ (1 row — ใช้ email localpart
   หรือข้อมูลที่มี ถ้าจริง ๆ ไม่รู้ชื่อ → NULL ได้)
9. **`npm run build` ผ่าน + `npx playwright test` ผ่าน + `split_sql` 8/8 + migration apply OK**

## Forbidden

- ห้ามแตะ className/colors/fonts/index.css (Track F)
- ห้ามลบ `auth_user_id` จาก codebase อื่นโดยไม่ตรวจ — มีแค่ใน AuthProvider.tsx เท่านั้น
- ห้ามแก้ password verification logic ของ Supabase Auth (เป็น auth.* API ไม่ใช่ของเรา)
- ห้าม commit `.env` หรือ `data/raw/`

## Verify commands

```bash
# 1. SQL migration apply (ใช้ apply_migration_api.py)
uv run python scripts/apply_migration_api.py supabase/migrations/20260719000013_auth2_app_user_display_name.sql

# 2. Verify schema (column ปรากฏ)
uv run python scripts/introspect_schema_api.py  # snapshot refresh

# 3. Build + tests
cd frontend && npm run build && npx playwright test

# 4. Manual smoke (user)
# - เปิด browser → login ด้วย email/password จริง → ต้องเข้า /dashboard ได้
# - Sidebar ต้องแสดง display_name (หรือ email fallback)
```

## Checkpoint / ปิดท้าย

(none yet — execute in progress)
