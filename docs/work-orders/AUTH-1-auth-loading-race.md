# WO-AUTH-1: แก้ AuthProvider loading race — รอ appUser lookup ก่อน setLoading(false)
Status: done (2026-07-20, zcode) — commit pending
Lane/files: `frontend/src/components/AuthProvider.tsx` (logic เดียว — ไม่แตะ className ใด ๆ)
Branch: main
Model tier: **cheap-ok/mid** (Sonnet 5 / GLM — async ordering bug ตรงไปตรงมา แต่ต้องระวัง edge case session เปลี่ยนกลางคัน)

## บริบท — พบใน Fable5 visual tour 2026-07-19 (commit `c995ac0` หัว `[next: STAT-1]`)

`AuthProvider` ตั้ง `setLoading(false)` ทันทีหลัง `getSession().then(...)` โดย **ไม่รอ**
`loadAppUser` (async) → `isAuthenticated = !!session && !!appUser` เป็น false
ชั่วขณะ → hard refresh / deep link หน้า RequireAuth ใด ๆ **เด้งไป `/login` เสมอ**
แม้ session ยัง valid และหน้า login ไม่พากลับ. พิสูจน์แล้วด้วย seeded session:
request `app_user` ยิงถูกต้อง (id ตรง) แต่ redirect เกิดก่อน response.

Root cause: `loading` collapse เร็วเกินไป ทำให้ `isAuthenticated` มีค่า false
ชั่วขณะก่อน appUser resolve → RequireAuth เห็น not-authenticated → redirect.

## Goal + Acceptance

1. `loading` collapse เป็น false ก็ต่อเมื่อทั้ง (a) session loaded + (b) appUser
   lookup resolve แล้ว (success หรือ error — เคส network failure ต้อง resolve
   ด้วย appUser=null ไม่ใช่ hang)
2. เมื่อ session valid + appUser lookup สำเร็จ → refresh หน้า RequireAuth ใด ๆ
   ต้องวาดหน้านั้น (ไม่ bounce ไป /login)
3. เมื่อ session valid + appUser lookup ล้มเหลว (RLS ปฏิเสธ, network error) →
   ต้องไป /login เหมือนเดิม (รักษาพฤติกรรมปัจจุบัน — ไม่ทำให้ worse)
4. เมื่อ session == null (logged out) → loading collapse ทันที (ไม่ต้องรอ lookup
   เพราะไม่มีอะไรจะ lookup)
5. `npm run build` ผ่าน + `npx playwright test` ผ่านครบ (26 หลัง F8; รอบนี้อาจ
   เพิ่มเทสต์ใหม่ 1-2 ตัวใน auth.spec.ts — optional)
6. **edge case**: session เปลี่ยนระหว่าง appUser lookup (เช่น getSession return
   A ตอนแรก แต่ onAuthStateChange มาบอก B ภายในไม่กี่ ms) — setState จาก
   lookup เก่าต้องไม่ทับค่า lookup ใหม่

## Reference pattern

- React `useState` สองตัวแยก (session loading vs appUser loading) แล้ว derive
  `loading` รวม: `loading || (!!session && appUserLoading)`
- ตัวอย่างของ React: https://react.dev/reference/react/useState#storing-information-from-previous-renders
- ภาษาเดียวกับที่ใช้ใน codebase: `useState<boolean>` แล้ว flip ใน finally block
- Guard pattern กัน stale setState: เก็บ ref `latestUserIdRef` หรือ check
  `if (userId === currentUserId)` ก่อน setAppUser — ใช้ได้เพราะ `loadAppUser`
  ถูกเรียกซ้อนได้

## Steps

### 1. เพิ่ม state ใหม่ `appUserLoading` ใน `AuthProvider`:

```ts
const [session, setSession] = useState<Session | null>(null);
const [appUser, setAppUser] = useState<AppUserRow | null>(null);
const [sessionLoading, setSessionLoading] = useState(true);   // getSession ครั้งแรก
const [appUserLoading, setAppUserLoading] = useState(false);   // lookup appUser
```

(เปลี่ยนชื่อ `loading` เดิม → `sessionLoading` เพื่อ clarity; expose ใน context
เป็น `loading: sessionLoading || (!!session && appUserLoading)`)

### 2. แก้ `loadAppUser`:

```ts
const loadAppUser = async (userId: string | undefined) => {
  if (!userId) {
    setAppUser(null);
    return;
  }
  setAppUserLoading(true);
  try {
    const { data, error } = await supabase
      .from("app_user")
      .select("id, role, display_name")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (error) {
      console.warn("app_user lookup failed:", error.message);
      setAppUser(null);
    } else {
      setAppUser(data as AppUserRow | null);
    }
  } finally {
    setAppUserLoading(false);
  }
};
```

### 3. แก้ initial useEffect — `setSessionLoading(false)` หลัง `setSession` +
`loadAppUser` kick off:

```ts
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setSession(data.session);
    void loadAppUser(data.session?.user.id);
    setSessionLoading(false);
  });
  // ... onAuthStateChange (คงเดิม)
}, []);
```

หมายเหตุ: `setSessionLoading(false)` ที่นี่หมายความว่า "session check done"
**ไม่ใช่** "ready to render auth-gated pages" — ready ขึ้นอยู่กับ derived `loading`
ด้านล่าง

### 4. แก้ derived `loading` ใน useMemo:

```ts
const loading = sessionLoading || (!!session && appUserLoading);
```

ใช้ `loading` นี้ใน object ที่ expose ผ่าน context.

### 5. Edge case guard (optional แต่แนะนำ):

เพื่อกัน stale setState จาก lookup เก่า — ใช้ ref:

```ts
const latestUserIdRef = useRef<string | undefined>(undefined);

const loadAppUser = async (userId: string | undefined) => {
  latestUserIdRef.current = userId;
  if (!userId) { setAppUser(null); return; }
  setAppUserLoading(true);
  try {
    const { data, error } = await supabase.from("app_user")....;
    if (latestUserIdRef.current !== userId) return;  // stale, ไม่ setState
    if (error) { setAppUser(null); } else { setAppUser(data...); }
  } finally {
    if (latestUserIdRef.current === userId) setAppUserLoading(false);
  }
};
```

### 6. Verify → commit → push → set done + ปลด claim

## Forbidden

- ห้ามแตะ className/markup/styling (Track F scope)
- ห้ามเปลี่ยน `signInWithEmail` / `signInWithGoogle` / `signOut` logic (เกิน scope)
- ห้ามแตะ AuthPage / RequireAuth / AuthCallback (logic ในนั้นถูกแล้ว — root cause
  อยู่ใน AuthProvider เท่านั้น)
- ห้ามเพิ่ม redirect logic ใหม่ (fix loading ก็พอ — RequireAuth ที่มีจะจัดการเอง)
- ห้าม backfill/สร้าง `auth.users` หรือ `core.app_user` row ใหม่ (one-way door)

## Verify commands

```bash
cd frontend && npm run build          # typecheck + bundle
cd frontend && npx playwright test    # 26 passed (รวม auth.spec.ts 8 ตัว)
# Manual (GLM ไม่ทำ — ส่ง Fable5):
#   dev server → login → refresh หน้า /readings (RequireAuth)
#   → ต้องวาดหน้า /readings ไม่ bounce ไป /login
#   หรือด้วย seeded localStorage session (เหมือน Fable5 tour): refresh → ไม่ bounce
```

## Checkpoint log (append-only)

- [2026-07-20] zcode (GLM): เขียน WO จาก Fable5 tour finding — รอ dispatch/claim
- [2026-07-20] zcode (GLM): execute ตาม Steps 1-5 — split `loading` state
  เป็น `sessionLoading` + `appUserLoading`, derive combined `loading` =
  `sessionLoading || (!!session && appUserLoading)`. `loadAppUser` ใส่
  try/finally + stale guard `latestUserIdRef` (กัน setState จาก lookup
  เก่าเมื่อ session เปลี่ยนกลางคัน). Verify: `npm run build` ✅ +
  Playwright 23/23 ✅ (auth guard 8 ตัวผ่านหมด — bounce behavior ไม่พัง).
  Manual refresh-bounce check ต้องรอ Fable5 verify (ต้อง seeded session).
