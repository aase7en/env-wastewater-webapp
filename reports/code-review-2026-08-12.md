# Code Review — Hidden Bugs + Prevention Patterns (2026-08-12)

> **Trigger**: user challenge "ตรวจหาข้อผิดพลาด testing ดูว่าเจออะไรต้องแก้
> จริงไม่หลอก" + a-loop "ตรวจสอบอย่างละเอียด รีวิว code หาบั๊คที่แอบซ่อน
> ทั้งหมด". 3 parallel subagents inspected source directly (not assertions).
> **Method**: read every EQ-touched lib file + every caller page + security
> surface. Bug classes searched: setState-in-render, stale closure, queryKey
> identity, race condition, enabled toggle, missing error handling, type
> narrowing, cache invalidation gaps, PHI leak, auth cache leak.
> **HEAD at review**: `193d6d3` (EQ-5.2 fix applied).

---

## P0 — must fix before any production use

### 1. `DailyFormPage.tsx:182` — delete succeeds but UI shows "ลบไม่สำเร็จ" + no redirect

`deleteReading` returns `Promise<void>` → mutate tuple is always
`{ data: null, error: null }` on success. Caller checks
`if (data !== null)` which is always false → banner shows error + user
stays on form page. The row IS deleted in DB. Confusion on next visit.

**Fix**: `const { error } = await deleteMut.mutate(id); if (!error) navigate(...)`.

### 2. `ai-chat.ts:190` — PHI leak via chat history

`sendChatTurn` calls `applyPhiFilter(question)` on the current turn but
forwards `opts.history` (last 6 turns) to the provider **unfiltered**. A
prior blocked question stays in local `messages` state (`ChatPanel.tsx:38`)
and ships verbatim on the next innocent question. The entire
`ai_scope`/`STATIC_PHI_DENY` machinery is bypassed for history.

**Fix**: `const cleanedHistory = await Promise.all((opts.history ?? []).map(async m => ({ ...m, content: (await applyPhiFilter(m.content)).cleanedQuestion })))` before building `messages`.

### 3. `AuthProvider.tsx:233` — auth cache not cleared on signOut

`signOut()` calls `supabase.auth.signOut()` + `setAppUser(null)` but
never touches the `queryClient` cache. On a shared ward device, the next
user's first render shows cached rows from the previous user (readings,
audit log, pending users) until RLS-gated refetches resolve.

**Fix**: `import { queryClient } from "../lib/query-client"; ... signOut() { await supabase.auth.signOut(); setAppUser(null); queryClient.clear(); }`.

### 4. `DailyFormPage.tsx:109` — form data loss on refetch

`useEffect([existing])` repopulates the entire form whenever the
`useReading(id)` query refetches. RQ default `refetchOnWindowFocus: true`
(`query-client.ts:33`) refetches on every alt-tab return → any in-progress
edit is silently overwritten by the server snapshot.

**Fix**: snapshot `existing` once on first load (track a "hydrated" ref),
or disable `refetchOnWindowFocus` for `useReading` while the form is dirty.

### 5. `ErrorBoundary.tsx:122` — ErrorRouteWatcher remounts AuthProvider on every navigation

`<div key={location.pathname}>{children}</div>` forces unmount/remount of
the entire subtree (`ErrorBoundaryInner > AuthProvider > Routes`) on every
route change. `AuthProvider` re-runs `getSession()` + `loadAppUser()` →
`RequireAuth` renders `PageSkeleton` → visible skeleton flicker on every
dock click + wasted auth round-trip.

**Fix**: pass `location.pathname` as a prop to the class component; in
`componentDidUpdate`, reset `state.error` to null only when
`prevPath !== path AND state.error !== null`. Preserve "escape broken
route" without nuking auth state on healthy navigation.

---

## P1 — functional bugs (degraded UX, not crash)

### 6. `alerts.ts:139` — markRead double-decrements unread count

Optimistic `n: Math.max(0, prev.n - 1)` runs unconditionally even when
the row was already read (the row-flip IS guarded by
`a.read_at === null`, but the count decrement is not). Double-clicking
dismiss in `NotificationBell` (no debounce) under-counts the badge until
the next 60s poll.

**Fix**: `n: Math.max(0, prev.n - (prev.rows.some(a => a.id === id && a.read_at === null) ? 1 : 0))`.

### 7. `overview.ts:63` — MoM-gap regression (reintroduces carbon.ts C3 bug)

`toCarbonMonths` computes `prev = rows[i + 1].tco2e` (index-previous).
This is the exact MoM-gap bug that `carbon.ts:178-189` fixed via
`prevCalendarMonth` (calendar-previous). Any month gap in
`v_overview_carbon` silently mislabels the delta.

**Fix**: import + reuse `prevCalendarMonth` from `carbon.ts`.

### 8. `RoleVisibilitySheet.tsx:152` + `role-module-visibility.ts:168` — DOCK-18 regression

`setVisibility` catch calls `qc.invalidateQueries` → refetch succeeds
(read is allowed, write was denied) → `q.error` returns to null → error
never surfaces. The `onClick` catch comment claims "already surfaced
via hook error + toast" but (a) hook error is null after invalidate,
(b) no `useToast()` exists in the sheet. This regresses the exact
DOCK-18 fix ("toggle that fails silently with no clue why").

**Fix**: use `useToast()` in the sheet and show the error in the
`onClick` catch, OR write the mutation error to a separate
`useState` in the hook (not via RQ query error).

### 9. `ai-sql.ts:106` — annotateRow sends raw row to AI provider without PHI filter

`annotateRow(tableName, row)` does `JSON.stringify(row)` and ships it
to the provider via `nlToSql`-style fetch. No `applyPhiFilter` applied.
If `tableName` is a PHI-adjacent table, the row data (which may contain
emails, phone numbers) leaks.

**Fix**: refuse if `tableName ∈ STATIC_PHI_DENY`, or scrub the row
through a PHI redactor keyed on `tableName`.

---

## P2 — minor / latent

### 10. `admin/users.ts` — bell/page disagreement after approve/reject

`approveUser`/`rejectUser` don't invalidate `["pending-users"]`.
`PendingUsersPage` has its own refresh; the bell (`usePendingUsers`)
only updates on the 60s poll. Badge and page disagree for up to 60s.

**Fix**: `onSettled → qc.invalidateQueries({ queryKey: ["pending-users"] })`.

### 11. `import-engine.ts:214` — image OCR bypasses PHI filter

`parseImageOcr` calls `fetch()` on the provider directly, skipping
`applyPhiFilter`. Today no patient-adjacent upload path exists, but
latent if OCR is wired to a personnel document.

### 12. `ai-chat.ts:66` + `ai-sql.ts:197` — fail-open on ai_scope outage (partial)

Comments claim "fail-closed" but the code returns `{blocked: false}` for
any question that doesn't name a `STATIC_PHI_DENY` table. New PHI tables
added later to `ai_scope` are unprotected during an outage window.

### 13. `alerts.ts:124` + `role-module-visibility.ts:152` — `useCallback([q])` false stability

`q` (useQuery result) is a new reference every render → the `useCallback`
provides zero stability. Functionally fine (callers invoke from onClick,
not useEffect deps) but misleading. Fix: depend on `q.refetch` (RQ
guarantees stable) or drop the wrap.

### 14. `hooks.ts:117` — `onSettled` invalidates on error too

`onSettled` fires on both success and error. A failed create (RLS
rejection) still triggers 3 refetches of unchanged data. Should be
`onSuccess` or gated on `!m.isError`.

### 15. `chemical.ts:133` — `useLowStockChemicals` returns new array every render

`data.filter(...)` in render body → new array identity every render.
Consumers that put `lowStock` in a dep array will re-run every render.

### 16. `carbon-rollup.ts:133` — out-of-order fetch overwrite (dead code path)

3 concurrent `fetchRollup` callers (initial + realtime + 10s interval)
can resolve in any order. Older response can overwrite newer. Dead path
today (no page uses `useCarbonRollupRealtime`) but latent if wired.

### 17. `use-sensor-feed.ts:92` — hardcoded channel name

`"sensor-reading-live"` not parameterized by `limit`. Two components
mounting with different limits share one channel; first unmount tears
it down for both. Single-mount usage is fine.

### 18. `utils.ts:18` — `thaiDate` parses date-only strings as UTC

`new Date("2026-08-12")` is UTC midnight per ES spec. In negative-offset
timezones `getDate()` returns the 11th. Bangkok (UTC+7) unaffected, but
inconsistent with `toLocalISODate`/`daysSince` (which use local parsing).

### 19. `public/sw.js:16` — `VERSION = "uth-env-v1"` literal never bumped

Not a stale-cache bug in practice (HTML is network-first, assets are
hash-keyed) but obsolete cache entries from prior deploys linger forever
(no LRU purge). Add a build-stamp to `VERSION`.

---

## Patterns that caused the EQ bugs (prevention)

These 4 patterns are what the EQ series got wrong. Codex must internalize
them before touching the data layer:

### Pattern 1: setState-in-render → infinite loop

```ts
// ❌ BAD — never converges if RQ data identity flips every snapshot
if (m.data !== localData) setLocalData(m.data);

// ✅ GOOD — committed phase, converges
useEffect(() => { setLocalData(m.data ?? null); }, [m.data]);
```

**Detection**: `oxlint react-hooks/exhaustive-deps` flags deps that change
every render, but NOT setState-in-render directly. Manual review: any
`if (...) setState(...)` outside `useEffect`/`useCallback`/event handler
is suspect.

### Pattern 2: stale closure on mutation error

```ts
// ❌ BAD — caller reads mut.error after await, but closure captured pre-await
const res = await mut.mutate(args);
if (!res) showError(mut.error);  // stale null

// ✅ GOOD — return the error from mutate itself
const { data, error } = await mut.mutate(args);
if (error) showError(error);
```

**Detection**: grep for `await.*\.mutate(` followed by `\.error` within
5 lines.

### Pattern 3: `useCallback([q])` where `q` is a useQuery result

```ts
// ❌ BAD — q is a new object every render, useCallback is pointless
const refresh = useCallback(() => q.refetch(), [q]);

// ✅ GOOD — q.refetch is stable (RQ guarantee)
const refresh = useCallback(() => q.refetch(), [q.refetch]);
// or just: const refresh = () => q.refetch();
```

**Detection**: `oxlint react-hooks/exhaustive-deps` flags it.

### Pattern 4: `key={pathname}` on a wrapper that holds auth/providers

```tsx
// ❌ BAD — remounts AuthProvider on every route change
<div key={location.pathname}><AuthProvider>...</AuthProvider></div>

// ✅ GOOD — reset only the error boundary's state, not the subtree
componentDidUpdate(prev) {
  if (prev.path !== this.props.path && this.state.error) {
    this.setState({ error: null });
  }
}
```

**Detection**: any `key={...}` on a wrapper around context providers or
auth-gating components.

---

## Verification status at time of report

- Build: ✅
- Vitest: 138/138 ✅
- E2E: 31/31 ✅ (after EQ-5.2 fix)
- Lint: 12 warnings + 3 errors (none in EQ-edited files; all pre-existing
  in non-EQ files — see commit `14fea77` for triage)

The 19 findings above are **not yet fixed**. This report documents them
for the next agent (Codex) to fix in priority order.
