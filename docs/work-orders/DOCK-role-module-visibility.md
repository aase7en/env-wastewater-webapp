# WO — Dock: role → module visibility (admin-configurable)

> **Tier**: Track Z (logic/SQL/RLS) — the UI hook is already in place from Track F
> **Status**: open
> **Requested**: 2026-08-03, alongside DOCK-9 (folders + edit toolbar)
> **Blocked on**: nothing; needs a schema decision

## What the user asked for

> "กำหนดสิทธิ์ การมองเห็นตามสิทธิ์ของ user (admin จะใช้ชั้นนี้ได้)"

An admin should be able to decide which modules each role can see.

## Why Track F did not build it

Two reasons, and the first one matters more than the schema question.

**1. Hiding a dock icon is not a permission.** The dock is presentation. Anyone
who knows the URL can still type `/admin/db`. What actually stops them is
`RequireAuth requireAdmin` on the route and RLS on the tables. If this shipped
as a client-side toggle it would *look* like an access control and enforce
nothing — worse than not having it, because someone would trust it.

**2. It has to reach other people.** Dock prefs live in `localStorage`
(`components/layout/dock-prefs.ts`), which is per-device. An admin setting a
policy in their own browser changes nothing for staff. This needs a row
everyone reads.

So the visible-modules rule belongs in the database, next to the rules that
already exist, not in a preferences blob.

## Suggested shape

A row per (role, module), defaulting to visible so adding a route does not
silently hide it:

```sql
create table core.role_module_visibility (
  role        text not null check (role in ('admin','staff','pending')),
  module_key  text not null,          -- the NAV `to` path, e.g. '/carbon'
  visible     boolean not null default true,
  updated_by  uuid references core.app_user(id),
  updated_at  timestamptz not null default now(),
  primary key (role, module_key)
);
```

RLS to mirror the existing pattern (see ADR-0008 for the recursion trap, and
ADR-0012 / OAUTH-4 for the pending-deny helper):

- `select` — any authenticated user, for their own role only. Staff need to read
  it to render their dock; they must not read other roles' rows.
- `insert/update/delete` — `core.fn_is_admin()` only.

`module_key` is deliberately the route path rather than a FK to a modules
table: the nav list lives in `AppShell.tsx` and has no DB counterpart today.
Adding one is a bigger change and is not required for this.

## Where the UI plugs in

Already built, so this should be a small frontend change once the table exists:

- `components/layout/ModuleDock.tsx` filters through `allowed`, which is
  currently just `nav.filter(n => !n.adminOnly || isAdmin)`. Extend that filter
  with the fetched visibility set and everything downstream (picker, folders,
  sanitize) follows for free.
- The edit-mode toolbar already renders a disabled `admin_panel_settings`
  button labelled "สิทธิ์การมองเห็น (รอ Track Z)" for admins. Wire it to a
  sheet listing roles × modules with toggles, and drop the `disabled`.
- `dock-prefs.ts:sanitize()` already drops any pinned path that is no longer in
  the valid set, so a module hidden by an admin disappears from a user's dock on
  their next load without any migration.

## Do not

- Do not treat this as the security boundary. Every module route that matters
  must keep its `RequireAuth requireAdmin` guard and its RLS policy regardless
  of what this table says. This controls what is *offered*, not what is
  *permitted*.
- Do not hide `/` or `/dashboard` behind it — losing the landing page leaves a
  user with an empty dock and no way back.

## Verify

- An admin toggling a module off makes it vanish from a staff user's dock and
  from their "ทุกโมดูล" sheet, after reload.
- The same staff user typing the URL directly still gets the *existing*
  behaviour — allowed if the route guard allows it. Nothing about access
  changed.
- A brand-new route with no row in the table is visible to everyone (default
  true), not hidden.
