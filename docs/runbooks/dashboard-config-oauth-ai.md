# Runbook — Supabase Dashboard Config (OAuth + AI Provider)

> **ผู้ทำ**: user (บน PC, ไม่ใช่มือถือ — Google Cloud Console + LINE Console ต้องใช้คีย์บอร์ดเต็ม)
> **วัตถุปัจจุบัน**: unlock production OAuth flow จริง + AI provider smoke test
> **เมื่อเสร็จ**: แจ้ง GLM ว่า "config แล้ว" → GLM ทดสอบ end-to-end (Google login → /pending-approval → admin approve → /dashboard, + NL→SQL)

คู่มือนี้รวบ 4 console ให้เป็นไฟล์เดียว — ทำตามลำดับ A → B → C → D ครบแล้ว OAuth + AI smoke จะ unlock ทั้งคู่

---

## ค่าตายตัว (copy-paste ได้)

| สิ่งที่ | ค่า |
|---|---|
| Supabase project ref | `gllqtbyofrcjzmbnfoeh` |
| Prod URL | `https://aase7en.github.io/env-wastewater-webapp` |
| Dev URL | `http://localhost:5173` |
| OAuth callback (Supabase) | `https://gllqtbyofrcjzmbnfoeh.supabase.co/auth/v1/callback` |
| Dev callback (frontend) | `http://localhost:5173/auth/callback` |
| Prod callback (frontend) | `https://aase7en.github.io/env-wastewater-webapp/auth/callback` |
| LINE OIDC issuer | `https://access.line.me/oauth2/v2.1` |
| Admin email (ทดสอบ) | `a.richbusinessman@gmail.com` |

---

## Part A — Google OAuth

1. เปิด <https://console.cloud.google.com> → สร้างหรือเลือก project (เช่น `uthai-env-oauth`)
2. **APIs & Services → OAuth consent screen**:
   - User type: **External**
   - App name: `UTH[AI]-ENV`
   - Support email: อีเมล รพ.
   - Authorized domains: `aase7en.github.io`
   - Save → **Add scope**: `email`, `profile`, `openid`
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs: `https://gllqtbyofrcjzmbnfoeh.supabase.co/auth/v1/callback`
   - คัดลอก **Client ID** + **Client Secret**
4. <https://supabase.com/dashboard/project/gllqtbyofrcjzmbnfoeh/auth/providers>:
   - เลือก **Google** → enable
   - วาง Client ID + Client Secret
   - Save

> หากเมนู dashboard เปลี่ยน — ค้นหาคำว่า "Providers" ในแถบค้นหาของ dashboard

---

## Part B — LINE Login (custom OIDC)

> Supabase ไม่มี built-in LINE provider → ลงทะเบียนเป็น **Custom OIDC** ชื่อ `line`

5. เปิด <https://developers.line.biz/console/>:
   - สร้าง Provider (เช่น `UTHAI`)
   - สร้าง Channel: **LINE Login** (ห้ามใช้ Messaging API)
   - Channel type: Web
   - Callback URL: `https://gllqtbyofrcjzmbnfoeh.supabase.co/auth/v1/callback`
   - **OpenID Connect → Apply for email permission** (LINE เปิด email scope ต้องขอ)
   - คัดลอก **Channel ID** + **Channel Secret**
6. Supabase dashboard → **Configuration → Custom OIDC Providers** (หรือ Auth → Providers → Custom):
   - Add provider, name: `line`
   - Client ID = Channel ID, Client Secret = Channel Secret
   - Issuer URL: `https://access.line.me/oauth2/v2.1`
   - Scopes: `openid profile email`

> รหัส `custom:line` ฝั่ง frontend อยู่ใน `frontend/src/components/AuthProvider.tsx:179` — ชื่อ provider ต้องตรง `line` เป๊ะ

---

## Part C — Redirect URL whitelist

7. Supabase → **Auth → URL Configuration**:
   - Site URL: `https://aase7en.github.io/env-wastewater-webapp`
   - Redirect URLs (เพิ่มทั้งสอง):
     - `https://aase7en.github.io/env-wastewater-webapp/auth/callback`
     - `http://localhost:5173/auth/callback`

---

## Part D — AI Provider (สำหรับ NL→SQL + suggestion chip smoke)

> P4 features (AiQueryBox / AiSuggestions) ต้องการ provider ที่ enabled ใน `core.ai_provider` + edge function ที่ใช้ key

8. Login เข้าแอป (email/password ของ `a.richbusinessman@gmail.com` — หลัง Part A/B ทำเสร็จ หรือใช้ password login ที่มีอยู่)
9. ไปที่ **/admin/ai** → ยืนยันว่ามี provider ที่ enabled:
   - หากยังไม่มี → เพิ่ม (เช่น OpenRouter free tier): name / base_url / model / model_id / key_env_var (เช่น `OPENROUTER_API_KEY`) / key_value (วาง key จริง)
   - หากมีอยู่ → ยืนยัน `is_enabled = ✓` และ priority ต่ำสุด = default
10. ยืนยัน `ai_scope` rows: ทุก view ที่จะให้ AI เห็น = `is_enabled = on`; PHI-adjacent (`core.app_user`, `core.personnel`) = `patient_safe = จำกัด` (AISQL-phi-filter จะ filter ออกอัตโนมัติ)

---

## Smoke checklist (หลัง A+B+C+D ครบ)

ทำตามลำดับ — หากข้อไหน fail ให้หยุดแล้วแจ้ง GLM:

- [ ] **A** logout ทั้งหมด → คลิก "เข้าสู่ระบบด้วย Google" → Google consent → redirect กลับ
- [ ] หากบัญชีใหม่ → ต้อง bounce ไป `/pending-approval` (role=pending)
- [ ] admin (`a.richbusinessman@gmail.com`) login ผ่าน Google ได้ตรงเข้า `/dashboard`
- [ ] **B** logout → "เข้าสู่ระบบด้วย LINE" → LINE consent → redirect กลับ
- [ ] **D** /admin/db → AiQueryBox → พิมพ์ `แสดงค่า DO ที่ต่ำกว่า 2 ล่าสุด 30 วัน` → เห็น SQL + explanation
- [ ] คลิก "ส่ง SQL ไปที่ Editor" → editor flip เป็น raw mode พร้อม SQL
- [ ] AiSuggestions panel — 3-5 chips แสดง (กด "รีเฟรช" หากยังไม่โหลด)
- [ ] /admin/audit — แถว audit ล่าสุดแสดง (filter action=UPDATE, expand row → JSON render)

---

## เมื่อเสร็จทั้งหมด — แจ้ง GLM

บอก GLM ว่า **"config แล้ว"** (หรือ "Part A/B/C/D เสร็จ") GLM จะ:

1. ทดสอบ end-to-end จริงผ่าน browser (ถ้ามี access) หรือ inspect Supabase dashboard state ผ่าน Management API
2. ยืนยัน provisioning trigger ทำงาน (Google user ใหม่ → `core.app_user` role=pending auto-create)
3. ตรวจ `app_user_admin_all` ไม่มี recursion (P0 fix `1394d2a` ยัง hold)
4. รายงานผลกลับ + flag สิ่งที่ต้องแก้ถ้ามี

---

## อ้างอิง

- Handoff: `docs/handoff/2026-07-19-track-z-complete.md` §"GLM OAUTH-1" (Part A/B/C verbatim) + §"GLM OAUTH-2+OAUTH-3" (P0 fixes + smoke)
- Work-orders: `docs/work-orders/OAUTH-{1,2,3}-*.md`
- ADR: `docs/adr/0007-oauth-pending-approval.md`
- Auth flow code: `frontend/src/components/AuthProvider.tsx` (provider prefix `custom:line` ที่บรรทัด 179)
- AI provider code: `frontend/src/pages/admin/AIAdminPage.tsx` + `frontend/src/lib/admin/ai-providers.ts`
- AISQL-phi-filter: `frontend/src/lib/admin/ai-sql.ts` (`loadPhiDenySet` + `filterPhiTables`)
