# Location categories live in a lookup table, not an enum

`core.location` needs to distinguish location types (โรงครัว, ซักฟอก, OPD,
IPD, ห้องฟัน, ห้องยา, การเงิน, สิ่งแวดล้อม, and more added later — scope
confirmed 2026-07-06/07 to cover the whole hospital, not just the wastewater
pond). The obvious choice is a Postgres enum, but enums require an `ALTER
TYPE ... ADD VALUE` migration every time a new department needs tracking,
and this list is explicitly open-ended ("อื่นๆ อีกในอนาคต"). Instead,
categories live in `core.location_category` (id, name) and `core.location`
references it by FK — adding a new category is a plain `INSERT`, no
migration, while still getting referential integrity (no free-text typos)
that a bare `text` column wouldn't have. Reversing this later means
migrating every `core.location` row's FK back to an enum value, which is
real work, not a config flip — hence recording it here.
