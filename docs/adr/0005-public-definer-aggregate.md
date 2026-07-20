# ADR-0005: Public definer-style aggregate views (anon-safe, 2-layer)

- **Status**: Accepted (2026-07-20, chunk SCHEMA-6)
- **Context**: [SCHEMA-6 WO](../work-orders/SCHEMA-6-overview-public-aggregate.md) + [Fable5 visual tour review #6](../handoff/2026-07-19-track-z-complete.md)
- **Related**: ADR-0004 (Supabase-first), SCHEMA-5 REST exposure pattern

## Context

The landing page `/` (OverviewPage) is **public** — no `RequireAuth` wrapper.
It renders three KPI cards: Water (from `v_dashboard_14day`), Energy (kWh
aggregate from `carbon.reading`), and Carbon (tCO₂e aggregate from
`carbon.reading`).

SCHEMA-5 (`4c60805`) exposed domain tables via `public.*` façade views using
`security_invoker=on` — the right design for **CRUD surfaces** (caller =
authenticated user, RLS gates every row). But that choice locked
`carbon.reading` and `carbon.meter` behind authenticated-only access,
because:

- `security_invoker=on` makes the view run with caller privileges.
- Base tables `carbon.reading` + `carbon.meter` have RLS policies for
  `authenticated` only — no `anon` policy.
- `grant select on public.carbon_reading to anon` is meaningless: with
  `security_invoker=on`, anon's request hits base-table RLS → 401.

Result on prod: OverviewPage's Energy + Carbon cards showed "โหลดไม่สำเร็จ:
permission denied for table meter" for anonymous visitors.

The Water card worked because `public.v_dashboard_14day` (a SCHEMA-5 report
view) deliberately omits `security_invoker=on` — it's a thin wrapper around
`wastewater.v_dashboard_14day` that inherits the owner's privileges.

## Decision

**Adopt the 2-layer definer-style pattern for any public-aggregate need.**
SCHEMA-6 (`073a65f`) introduces this for carbon/energy aggregates; future
public aggregates should follow the same shape.

### 2-layer structure

```sql
-- Layer 1: domain view — the actual aggregate logic. Lives in the domain
-- schema alongside the base table. Owner = the role that created it.
create view carbon.v_overview_carbon as
  select to_char(date_trunc('month', reading_date), 'YYYY-MM') as month,
         count(*)::int as days,
         sum(consumption) as kwh_total,
         round((sum(consumption) * 0.4999 / 1000)::numeric, 3) as tco2e
  from carbon.reading
  where reading_date >= date_trunc('month', now()) - interval '11 months'
  group by 1;

-- Layer 2: public façade — NO with(security_invoker=on) clause. Default
-- PostgreSQL view behavior = run as the view owner (postgres superuser),
-- which bypasses base-table RLS.
create view public.v_overview_carbon as
  select * from carbon.v_overview_carbon;

grant select on public.v_overview_carbon to anon, authenticated;
```

### Why it works

| Property | Effect |
|---|---|
| No `security_invoker=on` | View runs as owner (postgres), not as caller |
| Owner bypasses RLS | Base-table RLS policies don't fire when the view reads |
| `grant select to anon` | Anon can SELECT the public view |
| Aggregate only (no per-row) | Anon sees monthly totals — not individual readings |

This is exactly how `public.v_dashboard_14day` already works. SCHEMA-6 just
extends the pattern from "14-day wastewater readings" to "12-month carbon
aggregates."

## Alternatives considered

### A. `grant select on carbon.reading to anon` directly

**Rejected.** Would leak every individual daily reading (date + kWh +
meter_id) to anonymous visitors. Domain privacy requires that anon only
sees aggregated totals, never per-day rows.

### B. Add `anon` RLS policy on `carbon.reading` allowing `select using(true)`

**Rejected.** Two problems:

1. Same privacy leak as A — every reading row becomes readable.
2. Carbon data has no per-row ownership concept that would let us write a
   sensible `using(...)` clause. Either anon sees all rows or none.

### C. `security_invoker=on` on `public.v_overview_carbon` + anon policy on base table

**Rejected.** Re-introduces the same anon-policy requirement as B with the
same privacy problem. `security_invoker` is the wrong tool for public
aggregate views — it's for pass-through caller-privilege views (the CRUD
façade case), not for owner-trusts-the-aggregate views.

### D. Compute aggregates in the frontend

**Rejected.** Would require shipping every `carbon.reading` row to the
browser (907+ rows today, growing daily) just to sum them. Bandwidth +
latency + privacy (per-row data in the browser bundle).

### E. Edge Function that does the aggregate

**Rejected for this case.** Overkill — Postgres already aggregates well,
and the SCHEMA-5 pattern (definer-style report view) is proven and
operationally simple. Edge Functions are reserved for cases that genuinely
need procedural code (DBA-3 SQL parsing, AI NL→SQL).

## Consequences

### Positive

- **Anonymous visitors see live carbon/energy KPIs** on `/` without login.
  Fixed the Fable5-flagged 🔴 "permission denied" regression.
- **Pattern documented + extensible.** Future public-aggregate needs (e.g.
  annual report totals, public dashboard widgets) follow the same shape:
  domain view + public façade + `grant to anon, authenticated`.
- **Zero per-row data leaks.** Anon gets monthly totals only. Per-reading
  detail stays behind `security_invoker=on` CRUD façade + authenticated
  RLS.
- **No new infra.** Uses existing Postgres view mechanism — no Edge
  Function, no new RLS policies, no new auth flows.

### Negative

- **Aggregate SQL lives in code, not policy.** The "what does anon see"
  question is answered by the SELECT in `carbon.v_overview_carbon`, not by
  an RLS policy. Reviewers must check the view definition to verify the
  privacy boundary. Mitigation: domain comment on the view + this ADR.
- **Owner-trust propagation.** Any future column added to `carbon.reading`
  with PHI-adjacent data would silently be includable in the aggregate if
  someone edits the view. Mitigation: PR review + the fact that the current
  aggregate only sums `consumption` (kWh, not PHI).
- **Emission factor baked into view.** The 0.4999 kgCO₂e/kWh constant is a
  literal in the view body. TGO publishes a new factor annually; updating
  requires re-applying the migration + updating `carbon.ts:48` (frontend
  constant). Mitigation: documented in the view comment + WO Checkpoint.

### Security boundary summary

| Role | Can read | Cannot read |
|---|---|---|
| anon | `public.v_overview_carbon` (12-month aggregates) | `carbon.reading`, `carbon.meter`, `public.carbon_reading`, per-day rows |
| authenticated | All of the above + per-reading detail via `public.carbon_reading` (security_invoker façade + RLS) | (whatever RLS denies) |
| service_role | Everything | — |

## Validation

- `curl -H "apikey:$ANON" /rest/v1/v_overview_carbon?order=month.desc&limit=3`
  → HTTP 200 + 3 rows (latest month partial + 2 full months)
- `curl -H "apikey:$ANON" /rest/v1/carbon_reading?limit=1` → HTTP 401
  (per-reading detail still locked)
- Frontend OverviewPage `/` (public) renders Energy + Carbon cards with
  real numbers, no red error
- CarbonPage (authenticated) still uses `useCarbonMonthly` (per-meter
  detail from `carbon.reading` directly) — unaffected

## References

- Commit: `073a65f` (SCHEMA-6)
- WO: `docs/work-orders/SCHEMA-6-overview-public-aggregate.md`
- Pattern precedent: SCHEMA-5 `public.v_dashboard_14day` (commit `4c60805`)
- Review: Fable5 review #6 in `docs/handoff/2026-07-19-track-z-complete.md`
