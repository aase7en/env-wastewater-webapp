# ENV Current-State Inventory — 2026-08-27

Status: SOURCE-REALITY BASELINE
Base: `origin/main@9abf1b02d09a14f5328fd03fac32c837c3d89bc2`
Goal: map current production structure against the user-confirmed dashboard north star and mobile-first operational-entry goal before new production work.

## 1. Route inventory

Source: `frontend/src/App.tsx`.

### Core wastewater / platform

| Route | Page | Current role |
|---|---|---|
| `/` | OverviewPage | unified summary |
| `/dashboard` | DashboardPage | wastewater dashboard + Process/Digital Twin |
| `/form`, `/form/:id` | DailyFormPage | wastewater create/edit |
| `/readings` | ReadingsListPage | history |
| `/trends` | TrendsPage | trends |
| `/reports` | ReportsPage | reports/docs |
| `/equipment` | EquipmentPage | equipment |
| `/sensors` | SensorsPage | sensor/live-oriented surface |
| `/attachments` | AttachmentsPage | evidence/files |

### Carbon / environmental modules

`/carbon`, `/carbon-rollup`, `/water-supply`, `/garbage`, `/fuel`, `/garden`, `/building`, `/safety`, `/food`, `/chemical`, `/regulations`.

### Admin

`/import`, `/pdf-designer`, `/admin/db`, `/admin/ai`, `/admin/users`, `/admin/audit`.

All application-data routes are under the authenticated shell; admin routes additionally use admin guards.

## 2. Existing reusable visual/product foundation

- Aura theme/UI primitives exist and should be reused rather than replaced.
- `AppShell` + `ModuleDock` provides one responsive navigation system.
- Situation/Trend component kit exists in `components/analytics/`.
- Digital Twin R3F foundation and site-authentic Aeration P001 are merged.
- wastewater flow/PFD components exist.
- existing mobile header regression coverage exists at 360×800.
- current visual direction already supports dark/light themes.

Conclusion: the prototype north star should be reached by incremental composition and extension, not by a greenfield dashboard rewrite.

## 3. Operational-entry density baseline

Static source scan of page files found the highest number of direct form controls in:

| Page | Approx direct controls found | Unconditional `grid-cols-2` occurrences | Significance |
|---|---:|---:|---|
| DailyFormPage | 23 | 4 | primary wastewater daily field flow; highest priority |
| ChemicalPage | 14 | 2 | complex secondary module |
| WaterSupplyPage | 10 | 1 | field module |
| FuelPage | 10 | 1 | field module |
| GardenPage | 9 | 1 | field module |
| GarbagePage | 8 | 1 | field module |
| FoodPage | 7 | 1 | field module |
| SafetyPage | 7 | 1 | field module |
| BuildingPage | 4 | 1 | field module |

This is a source-code inventory, not measured user research. It is enough to prioritize inspection; it does not prove every control is visible simultaneously.

## 4. Daily wastewater form source-reality findings

`DailyFormPage.tsx` already has strong correctness features:

- edit hydration gate prevents background refetch from wiping dirty user edits;
- missing measured values use empty string on the form side and become `null`, not zero;
- abnormal system state requires a cause;
- threshold feedback is computed pre-submit;
- equipment checklist is integrated;
- common color/smell values have quick chips;
- sticky submit action exists;
- loading, success/error banners and delete confirmation exist.

Mobile-first gaps visible directly from source:

1. water-quality section uses unconditional `grid grid-cols-2 gap-3` at phone widths;
2. chlorine/chemical section uses unconditional two columns;
3. meter/water/electricity section uses unconditional two columns;
4. phone layout therefore compresses dense numeric labels/units into half-width controls rather than recomposing by priority;
5. current E2E has dirty-hydration coverage and global mobile-header coverage, but no dedicated real-user phone completion test for the full daily form.

This makes the daily form the highest-confidence first production vertical slice after architecture/roadmap consolidation.

## 5. Dashboard north-star gap inventory

### Already present

- unified overview route;
- wastewater dashboard;
- Digital Twin + Process relationship;
- analytics component kit;
- carbon views;
- sensor/equipment/history/report surfaces;
- flow/PFD visualization primitives;
- alert/pending-user notification surfaces;
- multi-domain ENV route coverage.

### Not yet a unified production experience at prototype level

- one cohesive hospital environmental command-center composition across domains;
- Waste + Plastics + Carbon + T-VER command-center slice matching the prototype intent;
- Hazard Map with normalized PM2.5/heat/river/flood source contracts;
- unified Operations board across incidents/actions/repairs;
- Resource Explorer hierarchical contribution view;
- System/Data Network lineage surface;
- cross-surface deep links across all these intelligence surfaces.

The correct strategy is to add bounded signature vertical slices around the existing Twin and current routes, then converge shared composition patterns.

## 6. Test baseline

Current browser E2E files cover authentication, daily-form dirty preservation, Digital Twin behavior/visuals, error-boundary recovery, modules, pending approval/users, PFD, skeletons, smoke, and desktop/mobile UX-scale cases.

Unit coverage includes analytics components, auth, AI boundary/chat/SQL, alert idempotency, carbon, CSV import, form hydration, overview, Twin adapter and utilities.

Gap for next mobile work: dedicated field-form phone workflow evidence (360–430 px) including input reachability, no horizontal overflow, validation, save/error behavior and sticky action interaction.

## 7. Architecture / ownership constraints

- `App.tsx`, AppShell/ModuleDock, shared UI/styles and `DashboardPage.tsx` are high-collision surfaces.
- data contract / Supabase/RLS changes belong to Core Engineering.
- visual/responsive layout changes belong to the visual lane once semantics are fixed.
- coordinator owns shared SSoT during parallel execution.
- external hazard production work requires source/provenance contract first.

## 8. Recommended next sequence

1. Merge unified architecture + graph + roadmap SSoT.
2. `ENV-MOBILE-001`: mobile-first wastewater DailyForm responsive completion slice.
3. Audit other operational forms using the pattern learned in Mobile-001; split into small domain WOs rather than one mega-form rewrite.
4. Establish command-center shell/composition contract using existing Aura + analytics + Twin foundations.
5. Add bounded dashboard signature slices in dependency order.
6. Integrate external environmental intelligence only after normalized provenance/freshness contract.
7. Full-system real-user E2E, security/privacy/data-honesty, accessibility/responsive and repo-health/graph audit before declaring product milestone complete.
