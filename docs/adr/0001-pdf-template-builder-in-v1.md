# PDF reporting ships as a generic template-builder, not three hardcoded templates

v1 needs three printable outputs — ทส.1 (daily log), ทส.2 (monthly summary), and
an equipment repair request — each with different data sources, paper sizes
(A4/A5), and orientations. The obvious/cheap path is to hardcode three PDF
layouts in code. Instead we're building a generic template-builder: a UI
where the user picks a data source, places fields on a page, sets paper
size/orientation, and saves the layout for reuse — with ทส.1/ทส.2/repair
request shipped as starter templates on top of that engine. This is a
deliberate scope increase (user decision, 2026-07-06): reversing it later
means throwing away the template-storage schema (`core.pdf_template`) and
rebuilding three regulatory-report layouts as one-off code, which is real
rework, not a config flip — hence recording it here rather than treating it
as an obvious default.

## Consequences

- Requires new tables in v1: `core.pdf_template` (layout JSON), `core.equipment`,
  `core.repair_request` — see `SPEC.md` for scope.
- The template-builder UI itself is a substantial v1 deliverable, not a small
  add-on to the daily-entry form work.
