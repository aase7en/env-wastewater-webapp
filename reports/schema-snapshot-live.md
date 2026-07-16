# Schema Snapshot — LIVE (P5b.2-live)

> Introspected from ENV_DB on 2026-07-16 via Supabase Management API.
> Schemas: core, carbon, wastewater. GENERATED — re-run `scripts/introspect_schema_api.py`.

## Tables

| Schema | Table | Rows |
|---|---|---|
| `carbon` | `emission_factor` | 0 |
| `carbon` | `meter` | 1 |
| `carbon` | `reading` | 907 |
| `core` | `ai_provider` | 0 |
| `core` | `ai_query_log` | 0 |
| `core` | `ai_scope` | 2 |
| `core` | `app_user` | 1 |
| `core` | `attachment` | 0 |
| `core` | `audit_log` | 0 |
| `core` | `equipment` | 10 |
| `core` | `location` | 1 |
| `core` | `location_category` | 8 |
| `core` | `pdf_template` | 0 |
| `core` | `personnel` | 9 |
| `core` | `repair_request` | 0 |
| `wastewater` | `reading` | 907 |
| `wastewater` | `threshold` | 0 |

## Columns

### `carbon.emission_factor`

| # | column | type | nullable | default |
|---|---|---|---|---|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `source` | `source_type` | NO | `` |
| 3 | `unit` | `text` | NO | `` |
| 4 | `kg_co2e` | `numeric(10,4)` | NO | `` |
| 5 | `effective_from` | `date` | NO | `` |
| 6 | `note` | `text` | YES | `` |

### `carbon.meter`

| # | column | type | nullable | default |
|---|---|---|---|---|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `location_id` | `uuid` | YES | `` |
| 3 | `source` | `source_type` | NO | `` |
| 4 | `meter_name` | `text` | NO | `` |
| 5 | `unit` | `text` | NO | `'kWh'::text` |
| 6 | `sensor_id` | `text` | YES | `` |
| 7 | `is_active` | `boolean` | NO | `true` |
| 8 | `created_at` | `timestamp with time zone` | NO | `now()` |

### `carbon.reading`

| # | column | type | nullable | default |
|---|---|---|---|---|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `meter_id` | `uuid` | NO | `` |
| 3 | `reading_date` | `date` | NO | `` |
| 4 | `meter_value` | `numeric(14,2)` | YES | `` |
| 5 | `consumption` | `numeric(14,2)` | YES | `` |
| 6 | `input_source` | `input_source` | NO | `'manual'::carbon.input_source` |
| 7 | `raw_payload` | `jsonb` | YES | `` |
| 8 | `recorded_by` | `uuid` | YES | `` |
| 9 | `created_at` | `timestamp with time zone` | NO | `now()` |

### `carbon.v_monthly_co2e`

| # | column | type | nullable | default |
|---|---|---|---|---|
| 1 | `month` | `date` | YES | `` |
| 2 | `source` | `source_type` | YES | `` |
| 3 | `total_consumption` | `numeric` | YES | `` |
| 4 | `total_kg_co2e` | `numeric` | YES | `` |

### `carbon.v_reading_co2e`

| # | column | type | nullable | default |
|---|---|---|---|---|
| 1 | `id` | `uuid` | YES | `` |
| 2 | `meter_id` | `uuid` | YES | `` |
| 3 | `location_id` | `uuid` | YES | `` |
| 4 | `source` | `source_type` | YES | `` |
| 5 | `reading_date` | `date` | YES | `` |
| 6 | `consumption` | `numeric(14,2)` | YES | `` |
| 7 | `kg_co2e` | `numeric(10,4)` | YES | `` |
| 8 | `kg_co2e_total` | `numeric` | YES | `` |

### `core.ai_provider`

| # | column | type | nullable | default |
|---|---|---|---|---|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `name` | `text` | NO | `` |
| 3 | `base_url` | `text` | NO | `` |
| 4 | `model` | `text` | NO | `` |
| 5 | `key_env_var` | `text` | NO | `` |
| 6 | `priority` | `integer` | NO | `100` |
| 7 | `is_enabled` | `boolean` | NO | `true` |
| 8 | `created_at` | `timestamp with time zone` | NO | `now()` |

### `core.ai_query_log`

| # | column | type | nullable | default |
|---|---|---|---|---|
| 1 | `id` | `bigint` | NO | `` |
| 2 | `actor` | `uuid` | YES | `` |
| 3 | `question` | `text` | NO | `` |
| 4 | `provider_id` | `uuid` | YES | `` |
| 5 | `scope_used` | `text` | YES | `` |
| 6 | `answer` | `text` | YES | `` |
| 7 | `token_usage` | `integer` | YES | `` |
| 8 | `asked_at` | `timestamp with time zone` | NO | `now()` |

### `core.ai_scope`

| # | column | type | nullable | default |
|---|---|---|---|---|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `view_name` | `text` | NO | `` |
| 3 | `description` | `text` | YES | `` |
| 4 | `patient_safe` | `boolean` | NO | `true` |
| 5 | `is_enabled` | `boolean` | NO | `true` |
| 6 | `created_at` | `timestamp with time zone` | NO | `now()` |

### `core.app_user`

| # | column | type | nullable | default |
|---|---|---|---|---|
| 1 | `id` | `uuid` | NO | `` |
| 2 | `role` | `user_role` | NO | `'staff'::core.user_role` |
| 3 | `employee_id` | `text` | YES | `` |
| 4 | `is_active` | `boolean` | NO | `true` |
| 5 | `created_at` | `timestamp with time zone` | NO | `now()` |

### `core.attachment`

| # | column | type | nullable | default |
|---|---|---|---|---|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `entity_type` | `text` | NO | `` |
| 3 | `entity_id` | `uuid` | NO | `` |
| 4 | `file_path` | `text` | NO | `` |
| 5 | `kind` | `text` | YES | `'image'::text` |
| 6 | `uploaded_by` | `uuid` | YES | `` |
| 7 | `created_at` | `timestamp with time zone` | NO | `now()` |

### `core.audit_log`

| # | column | type | nullable | default |
|---|---|---|---|---|
| 1 | `id` | `bigint` | NO | `` |
| 2 | `actor` | `uuid` | YES | `` |
| 3 | `action` | `text` | NO | `` |
| 4 | `table_name` | `text` | NO | `` |
| 5 | `row_id` | `text` | YES | `` |
| 6 | `changed_at` | `timestamp with time zone` | NO | `now()` |
| 7 | `old_data` | `jsonb` | YES | `` |
| 8 | `new_data` | `jsonb` | YES | `` |

### `core.equipment`

| # | column | type | nullable | default |
|---|---|---|---|---|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `code` | `text` | NO | `` |
| 3 | `name` | `text` | NO | `` |
| 4 | `location_id` | `uuid` | YES | `` |
| 5 | `is_active` | `boolean` | NO | `true` |
| 6 | `created_at` | `timestamp with time zone` | NO | `now()` |

### `core.location`

| # | column | type | nullable | default |
|---|---|---|---|---|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `code` | `text` | YES | `` |
| 3 | `qr_code` | `text` | YES | `` |
| 4 | `area_name` | `text` | NO | `` |
| 5 | `image_path` | `text` | YES | `` |
| 6 | `created_at` | `timestamp with time zone` | NO | `now()` |
| 7 | `category_id` | `uuid` | YES | `` |
| 8 | `lat` | `numeric` | YES | `` |
| 9 | `lng` | `numeric` | YES | `` |

### `core.location_category`

| # | column | type | nullable | default |
|---|---|---|---|---|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `name` | `text` | NO | `` |
| 3 | `created_at` | `timestamp with time zone` | NO | `now()` |

### `core.pdf_template`

| # | column | type | nullable | default |
|---|---|---|---|---|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `name` | `text` | NO | `` |
| 3 | `data_source` | `text` | NO | `` |
| 4 | `paper_size` | `paper_size` | NO | `'a4'::core.paper_size` |
| 5 | `orientation` | `orientation` | NO | `'portrait'::core.orientation` |
| 6 | `layout` | `jsonb` | NO | `` |
| 7 | `is_builtin` | `boolean` | NO | `false` |
| 8 | `created_by` | `uuid` | YES | `` |
| 9 | `created_at` | `timestamp with time zone` | NO | `now()` |
| 10 | `updated_at` | `timestamp with time zone` | NO | `now()` |

### `core.personnel`

| # | column | type | nullable | default |
|---|---|---|---|---|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `employee_code` | `text` | NO | `` |
| 3 | `full_name` | `text` | NO | `` |
| 4 | `nickname` | `text` | YES | `` |
| 5 | `position` | `text` | YES | `` |
| 6 | `phone` | `text` | YES | `` |
| 7 | `photo_path` | `text` | YES | `` |
| 8 | `status` | `text` | YES | `` |
| 9 | `created_at` | `timestamp with time zone` | NO | `now()` |

### `core.repair_request`

| # | column | type | nullable | default |
|---|---|---|---|---|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `equipment_id` | `uuid` | YES | `` |
| 3 | `reading_id` | `uuid` | YES | `` |
| 4 | `reported_by` | `uuid` | YES | `` |
| 5 | `cause` | `text` | NO | `` |
| 6 | `status` | `repair_status` | NO | `'open'::core.repair_status` |
| 7 | `created_at` | `timestamp with time zone` | NO | `now()` |
| 8 | `resolved_at` | `timestamp with time zone` | YES | `` |

### `wastewater.reading`

| # | column | type | nullable | default |
|---|---|---|---|---|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `location_id` | `uuid` | YES | `` |
| 3 | `reading_date` | `date` | NO | `` |
| 4 | `reported_by` | `uuid` | YES | `` |
| 5 | `tds_aeration` | `numeric(10,2)` | YES | `` |
| 6 | `temp_aeration` | `numeric(5,2)` | YES | `` |
| 7 | `tds_before_discharge` | `numeric(10,2)` | YES | `` |
| 8 | `ph` | `numeric(4,2)` | YES | `` |
| 9 | `do_aeration` | `numeric(6,2)` | YES | `` |
| 10 | `do_sedimentation` | `numeric(6,2)` | YES | `` |
| 11 | `do_before_discharge` | `numeric(6,2)` | YES | `` |
| 12 | `sv30` | `numeric(6,2)` | YES | `` |
| 13 | `free_chlorine` | `numeric(6,3)` | YES | `` |
| 14 | `color_desc` | `text` | YES | `` |
| 15 | `smell_desc` | `text` | YES | `` |
| 16 | `screen_cleaned_coarse` | `boolean` | YES | `` |
| 17 | `screen_cleaned_fine` | `boolean` | YES | `` |
| 18 | `pump1_running` | `boolean` | YES | `` |
| 19 | `pump2_running` | `boolean` | YES | `` |
| 20 | `aerator1_running` | `boolean` | YES | `` |
| 21 | `aerator2_running` | `boolean` | YES | `` |
| 22 | `sludge_pump1_running` | `boolean` | YES | `` |
| 23 | `sludge_pump2_running` | `boolean` | YES | `` |
| 24 | `chlorine_pump1_running` | `boolean` | YES | `` |
| 25 | `chlorine_pump2_running` | `boolean` | YES | `` |
| 26 | `system_operating` | `boolean` | YES | `` |
| 27 | `pump1_meter` | `numeric(12,2)` | YES | `` |
| 28 | `pump2_meter` | `numeric(12,2)` | YES | `` |
| 29 | `water_used_total` | `numeric(12,2)` | YES | `` |
| 30 | `wastewater_in` | `numeric(12,2)` | YES | `` |
| 31 | `wastewater_discharged` | `boolean` | YES | `` |
| 32 | `chlorine_used` | `numeric(10,3)` | YES | `` |
| 33 | `chlorine_mix_ratio` | `text` | YES | `` |
| 34 | `excess_sludge_removed` | `numeric(10,2)` | YES | `` |
| 35 | `carbon_reading_id` | `uuid` | YES | `` |
| 36 | `input_source` | `input_source` | NO | `'manual'::carbon.input_source` |
| 37 | `note` | `text` | YES | `` |
| 38 | `created_at` | `timestamp with time zone` | NO | `now()` |
| 39 | `legacy_id` | `text` | YES | `` |
| 40 | `reported_by_name_legacy` | `text` | YES | `` |

### `wastewater.threshold`

| # | column | type | nullable | default |
|---|---|---|---|---|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `parameter_code` | `text` | NO | `` |
| 3 | `min_value` | `numeric(10,3)` | YES | `` |
| 4 | `max_value` | `numeric(10,3)` | YES | `` |
| 5 | `effective_from` | `date` | NO | `CURRENT_DATE` |
| 6 | `note` | `text` | YES | `` |

### `wastewater.v_monthly_summary`

| # | column | type | nullable | default |
|---|---|---|---|---|
| 1 | `location_id` | `uuid` | YES | `` |
| 2 | `month` | `date` | YES | `` |
| 3 | `avg_do1` | `numeric` | YES | `` |
| 4 | `avg_do2` | `numeric` | YES | `` |
| 5 | `avg_do3` | `numeric` | YES | `` |
| 6 | `avg_ph` | `numeric` | YES | `` |
| 7 | `avg_free_chlorine` | `numeric` | YES | `` |
| 8 | `total_wastewater_in` | `numeric` | YES | `` |
| 9 | `days_discharged` | `bigint` | YES | `` |
| 10 | `total_chlorine_used` | `numeric` | YES | `` |
| 11 | `total_excess_sludge` | `numeric` | YES | `` |
| 12 | `total_kg_co2e` | `numeric` | YES | `` |

### `wastewater.v_reading_detail`

| # | column | type | nullable | default |
|---|---|---|---|---|
| 1 | `id` | `uuid` | YES | `` |
| 2 | `location_id` | `uuid` | YES | `` |
| 3 | `reading_date` | `date` | YES | `` |
| 4 | `reported_by` | `uuid` | YES | `` |
| 5 | `tds_aeration` | `numeric(10,2)` | YES | `` |
| 6 | `temp_aeration` | `numeric(5,2)` | YES | `` |
| 7 | `tds_before_discharge` | `numeric(10,2)` | YES | `` |
| 8 | `ph` | `numeric(4,2)` | YES | `` |
| 9 | `do_aeration` | `numeric(6,2)` | YES | `` |
| 10 | `do_sedimentation` | `numeric(6,2)` | YES | `` |
| 11 | `do_before_discharge` | `numeric(6,2)` | YES | `` |
| 12 | `sv30` | `numeric(6,2)` | YES | `` |
| 13 | `free_chlorine` | `numeric(6,3)` | YES | `` |
| 14 | `color_desc` | `text` | YES | `` |
| 15 | `smell_desc` | `text` | YES | `` |
| 16 | `screen_cleaned_coarse` | `boolean` | YES | `` |
| 17 | `screen_cleaned_fine` | `boolean` | YES | `` |
| 18 | `pump1_running` | `boolean` | YES | `` |
| 19 | `pump2_running` | `boolean` | YES | `` |
| 20 | `aerator1_running` | `boolean` | YES | `` |
| 21 | `aerator2_running` | `boolean` | YES | `` |
| 22 | `sludge_pump1_running` | `boolean` | YES | `` |
| 23 | `sludge_pump2_running` | `boolean` | YES | `` |
| 24 | `chlorine_pump1_running` | `boolean` | YES | `` |
| 25 | `chlorine_pump2_running` | `boolean` | YES | `` |
| 26 | `system_operating` | `boolean` | YES | `` |
| 27 | `pump1_meter` | `numeric(12,2)` | YES | `` |
| 28 | `pump2_meter` | `numeric(12,2)` | YES | `` |
| 29 | `water_used_total` | `numeric(12,2)` | YES | `` |
| 30 | `wastewater_in` | `numeric(12,2)` | YES | `` |
| 31 | `wastewater_discharged` | `boolean` | YES | `` |
| 32 | `chlorine_used` | `numeric(10,3)` | YES | `` |
| 33 | `chlorine_mix_ratio` | `text` | YES | `` |
| 34 | `excess_sludge_removed` | `numeric(10,2)` | YES | `` |
| 35 | `carbon_reading_id` | `uuid` | YES | `` |
| 36 | `input_source` | `input_source` | YES | `` |
| 37 | `note` | `text` | YES | `` |
| 38 | `created_at` | `timestamp with time zone` | YES | `` |
| 39 | `pump1_consumption` | `numeric` | YES | `` |
| 40 | `pump2_consumption` | `numeric` | YES | `` |
| 41 | `electricity_kg_co2e` | `numeric` | YES | `` |
| 42 | `flag_do1` | `boolean` | YES | `` |
| 43 | `flag_do2` | `boolean` | YES | `` |
| 44 | `flag_do3` | `boolean` | YES | `` |
| 45 | `flag_free_chlorine` | `boolean` | YES | `` |
| 46 | `flag_ph` | `boolean` | YES | `` |

## Enum types

| Schema | Enum | Values |
|---|---|---|
| `carbon` | `input_source` | manual, ocr, iot |
| `carbon` | `source_type` | electricity, diesel, gasoline, lpg, other |
| `core` | `orientation` | portrait, landscape |
| `core` | `paper_size` | a4, a5 |
| `core` | `repair_status` | open, in_progress, resolved, cancelled |
| `core` | `user_role` | admin, staff |

## Constraints

| Schema | Table | Name | Kind | Definition |
|---|---|---|---|---|
| `carbon` | `emission_factor` | `emission_factor_pkey` | PK | `PRIMARY KEY (id)` |
| `carbon` | `emission_factor` | `emission_factor_source_effective_from_key` | UNIQUE | `UNIQUE (source, effective_from)` |
| `carbon` | `meter` | `meter_location_id_fkey` | FK | `FOREIGN KEY (location_id) REFERENCES core.location(id)` |
| `carbon` | `meter` | `meter_pkey` | PK | `PRIMARY KEY (id)` |
| `carbon` | `reading` | `reading_meter_id_fkey` | FK | `FOREIGN KEY (meter_id) REFERENCES carbon.meter(id)` |
| `carbon` | `reading` | `reading_meter_id_reading_date_key` | UNIQUE | `UNIQUE (meter_id, reading_date)` |
| `carbon` | `reading` | `reading_pkey` | PK | `PRIMARY KEY (id)` |
| `carbon` | `reading` | `reading_recorded_by_fkey` | FK | `FOREIGN KEY (recorded_by) REFERENCES core.app_user(id)` |
| `core` | `ai_provider` | `ai_provider_name_key` | UNIQUE | `UNIQUE (name)` |
| `core` | `ai_provider` | `ai_provider_pkey` | PK | `PRIMARY KEY (id)` |
| `core` | `ai_query_log` | `ai_query_log_actor_fkey` | FK | `FOREIGN KEY (actor) REFERENCES core.app_user(id)` |
| `core` | `ai_query_log` | `ai_query_log_pkey` | PK | `PRIMARY KEY (id)` |
| `core` | `ai_query_log` | `ai_query_log_provider_id_fkey` | FK | `FOREIGN KEY (provider_id) REFERENCES core.ai_provider(id)` |
| `core` | `ai_scope` | `ai_scope_pkey` | PK | `PRIMARY KEY (id)` |
| `core` | `ai_scope` | `ai_scope_view_name_key` | UNIQUE | `UNIQUE (view_name)` |
| `core` | `app_user` | `app_user_employee_id_key` | UNIQUE | `UNIQUE (employee_id)` |
| `core` | `app_user` | `app_user_id_fkey` | FK | `FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE` |
| `core` | `app_user` | `app_user_pkey` | PK | `PRIMARY KEY (id)` |
| `core` | `attachment` | `attachment_pkey` | PK | `PRIMARY KEY (id)` |
| `core` | `attachment` | `attachment_uploaded_by_fkey` | FK | `FOREIGN KEY (uploaded_by) REFERENCES core.app_user(id)` |
| `core` | `audit_log` | `audit_log_pkey` | PK | `PRIMARY KEY (id)` |
| `core` | `equipment` | `equipment_code_key` | UNIQUE | `UNIQUE (code)` |
| `core` | `equipment` | `equipment_location_id_fkey` | FK | `FOREIGN KEY (location_id) REFERENCES core.location(id)` |
| `core` | `equipment` | `equipment_pkey` | PK | `PRIMARY KEY (id)` |
| `core` | `location` | `location_category_id_fkey` | FK | `FOREIGN KEY (category_id) REFERENCES core.location_category(id)` |
| `core` | `location` | `location_code_key` | UNIQUE | `UNIQUE (code)` |
| `core` | `location` | `location_pkey` | PK | `PRIMARY KEY (id)` |
| `core` | `location` | `location_qr_code_key` | UNIQUE | `UNIQUE (qr_code)` |
| `core` | `location_category` | `location_category_name_key` | UNIQUE | `UNIQUE (name)` |
| `core` | `location_category` | `location_category_pkey` | PK | `PRIMARY KEY (id)` |
| `core` | `pdf_template` | `pdf_template_created_by_fkey` | FK | `FOREIGN KEY (created_by) REFERENCES core.app_user(id)` |
| `core` | `pdf_template` | `pdf_template_pkey` | PK | `PRIMARY KEY (id)` |
| `core` | `personnel` | `personnel_employee_code_key` | UNIQUE | `UNIQUE (employee_code)` |
| `core` | `personnel` | `personnel_pkey` | PK | `PRIMARY KEY (id)` |
| `core` | `repair_request` | `repair_request_equipment_id_fkey` | FK | `FOREIGN KEY (equipment_id) REFERENCES core.equipment(id)` |
| `core` | `repair_request` | `repair_request_pkey` | PK | `PRIMARY KEY (id)` |
| `core` | `repair_request` | `repair_request_reading_id_fkey` | FK | `FOREIGN KEY (reading_id) REFERENCES wastewater.reading(id)` |
| `core` | `repair_request` | `repair_request_reported_by_fkey` | FK | `FOREIGN KEY (reported_by) REFERENCES core.app_user(id)` |
| `wastewater` | `reading` | `reading_carbon_reading_id_fkey` | FK | `FOREIGN KEY (carbon_reading_id) REFERENCES carbon.reading(id)` |
| `wastewater` | `reading` | `reading_location_id_fkey` | FK | `FOREIGN KEY (location_id) REFERENCES core.location(id)` |
| `wastewater` | `reading` | `reading_location_id_reading_date_key` | UNIQUE | `UNIQUE (location_id, reading_date)` |
| `wastewater` | `reading` | `reading_pkey` | PK | `PRIMARY KEY (id)` |
| `wastewater` | `reading` | `reading_reported_by_fkey` | FK | `FOREIGN KEY (reported_by) REFERENCES core.app_user(id)` |
| `wastewater` | `threshold` | `threshold_parameter_code_effective_from_key` | UNIQUE | `UNIQUE (parameter_code, effective_from)` |
| `wastewater` | `threshold` | `threshold_pkey` | PK | `PRIMARY KEY (id)` |

## Indexes

- `carbon.emission_factor` **emission_factor_pkey**: `CREATE UNIQUE INDEX emission_factor_pkey ON carbon.emission_factor USING btree (id)`
- `carbon.emission_factor` **emission_factor_source_effective_from_key**: `CREATE UNIQUE INDEX emission_factor_source_effective_from_key ON carbon.emission_factor USING btree (source, effective_from)`
- `carbon.meter` **meter_pkey**: `CREATE UNIQUE INDEX meter_pkey ON carbon.meter USING btree (id)`
- `carbon.reading` **reading_meter_id_reading_date_idx**: `CREATE INDEX reading_meter_id_reading_date_idx ON carbon.reading USING btree (meter_id, reading_date DESC)`
- `carbon.reading` **reading_meter_id_reading_date_key**: `CREATE UNIQUE INDEX reading_meter_id_reading_date_key ON carbon.reading USING btree (meter_id, reading_date)`
- `carbon.reading` **reading_pkey**: `CREATE UNIQUE INDEX reading_pkey ON carbon.reading USING btree (id)`
- `core.ai_provider` **ai_provider_name_key**: `CREATE UNIQUE INDEX ai_provider_name_key ON core.ai_provider USING btree (name)`
- `core.ai_provider` **ai_provider_pkey**: `CREATE UNIQUE INDEX ai_provider_pkey ON core.ai_provider USING btree (id)`
- `core.ai_query_log` **ai_query_log_actor_asked_at_idx**: `CREATE INDEX ai_query_log_actor_asked_at_idx ON core.ai_query_log USING btree (actor, asked_at DESC)`
- `core.ai_query_log` **ai_query_log_pkey**: `CREATE UNIQUE INDEX ai_query_log_pkey ON core.ai_query_log USING btree (id)`
- `core.ai_scope` **ai_scope_pkey**: `CREATE UNIQUE INDEX ai_scope_pkey ON core.ai_scope USING btree (id)`
- `core.ai_scope` **ai_scope_view_name_key**: `CREATE UNIQUE INDEX ai_scope_view_name_key ON core.ai_scope USING btree (view_name)`
- `core.app_user` **app_user_employee_id_key**: `CREATE UNIQUE INDEX app_user_employee_id_key ON core.app_user USING btree (employee_id)`
- `core.app_user` **app_user_pkey**: `CREATE UNIQUE INDEX app_user_pkey ON core.app_user USING btree (id)`
- `core.attachment` **attachment_entity_type_entity_id_idx**: `CREATE INDEX attachment_entity_type_entity_id_idx ON core.attachment USING btree (entity_type, entity_id)`
- `core.attachment` **attachment_pkey**: `CREATE UNIQUE INDEX attachment_pkey ON core.attachment USING btree (id)`
- `core.audit_log` **audit_log_pkey**: `CREATE UNIQUE INDEX audit_log_pkey ON core.audit_log USING btree (id)`
- `core.audit_log` **audit_log_table_name_changed_at_idx**: `CREATE INDEX audit_log_table_name_changed_at_idx ON core.audit_log USING btree (table_name, changed_at DESC)`
- `core.equipment` **equipment_code_key**: `CREATE UNIQUE INDEX equipment_code_key ON core.equipment USING btree (code)`
- `core.equipment` **equipment_pkey**: `CREATE UNIQUE INDEX equipment_pkey ON core.equipment USING btree (id)`
- `core.location` **location_code_key**: `CREATE UNIQUE INDEX location_code_key ON core.location USING btree (code)`
- `core.location` **location_pkey**: `CREATE UNIQUE INDEX location_pkey ON core.location USING btree (id)`
- `core.location` **location_qr_code_key**: `CREATE UNIQUE INDEX location_qr_code_key ON core.location USING btree (qr_code)`
- `core.location_category` **location_category_name_key**: `CREATE UNIQUE INDEX location_category_name_key ON core.location_category USING btree (name)`
- `core.location_category` **location_category_pkey**: `CREATE UNIQUE INDEX location_category_pkey ON core.location_category USING btree (id)`
- `core.pdf_template` **pdf_template_pkey**: `CREATE UNIQUE INDEX pdf_template_pkey ON core.pdf_template USING btree (id)`
- `core.personnel` **personnel_employee_code_key**: `CREATE UNIQUE INDEX personnel_employee_code_key ON core.personnel USING btree (employee_code)`
- `core.personnel` **personnel_pkey**: `CREATE UNIQUE INDEX personnel_pkey ON core.personnel USING btree (id)`
- `core.repair_request` **repair_request_pkey**: `CREATE UNIQUE INDEX repair_request_pkey ON core.repair_request USING btree (id)`
- `wastewater.reading` **reading_location_id_reading_date_key**: `CREATE UNIQUE INDEX reading_location_id_reading_date_key ON wastewater.reading USING btree (location_id, reading_date)`
- `wastewater.reading` **reading_pkey**: `CREATE UNIQUE INDEX reading_pkey ON wastewater.reading USING btree (id)`
- `wastewater.reading` **reading_reading_date_idx**: `CREATE INDEX reading_reading_date_idx ON wastewater.reading USING btree (reading_date DESC)`
- `wastewater.threshold` **threshold_parameter_code_effective_from_key**: `CREATE UNIQUE INDEX threshold_parameter_code_effective_from_key ON wastewater.threshold USING btree (parameter_code, effective_from)`
- `wastewater.threshold` **threshold_pkey**: `CREATE UNIQUE INDEX threshold_pkey ON wastewater.threshold USING btree (id)`

## Row-level security

| Schema | Table | RLS enabled |
|---|---|---|
| `carbon` | `emission_factor` | ✅ |
| `carbon` | `meter` | ✅ |
| `carbon` | `reading` | ✅ |
| `core` | `ai_provider` | ✅ |
| `core` | `ai_query_log` | ✅ |
| `core` | `ai_scope` | ✅ |
| `core` | `app_user` | ✅ |
| `core` | `attachment` | ✅ |
| `core` | `audit_log` | ✅ |
| `core` | `equipment` | ✅ |
| `core` | `location` | ✅ |
| `core` | `location_category` | ✅ |
| `core` | `pdf_template` | ✅ |
| `core` | `personnel` | ✅ |
| `core` | `repair_request` | ✅ |
| `wastewater` | `reading` | ✅ |
| `wastewater` | `threshold` | ✅ |

## Views

### `carbon.v_monthly_co2e`
```sql
SELECT (date_trunc('month'::text, (reading_date)::timestamp with time zone))::date AS month,
    source,
    sum(consumption) AS total_consumption,
    sum(kg_co2e_total) AS total_kg_co2e
   FROM carbon.v_reading_co2e
  GROUP BY ((date_trunc('month'::text, (reading_date)::timestamp with time zone))::date), source;
```

### `carbon.v_reading_co2e`
```sql
SELECT r.id,
    r.meter_id,
    m.location_id,
    m.source,
    r.reading_date,
    r.consumption,
    f.kg_co2e,
    round((r.consumption * f.kg_co2e), 2) AS kg_co2e_total
   FROM ((carbon.reading r
     JOIN carbon.meter m ON ((m.id = r.meter_id)))
     JOIN LATERAL ( SELECT f_1.kg_co2e
           FROM carbon.emission_factor f_1
          WHERE ((f_1.source = m.source) AND (f_1.effective_from <= r.reading_date))
          ORDER BY f_1.effective_from DESC
         LIMIT 1) f ON (true));
```

### `wastewater.v_monthly_summary`
```sql
SELECT location_id,
    (date_trunc('month'::text, (reading_date)::timestamp with time zone))::date AS month,
    avg(do_aeration) AS avg_do1,
    avg(do_sedimentation) AS avg_do2,
    avg(do_before_discharge) AS avg_do3,
    avg(ph) AS avg_ph,
    avg(free_chlorine) AS avg_free_chlorine,
    sum(wastewater_in) AS total_wastewater_in,
    count(*) FILTER (WHERE wastewater_discharged) AS days_discharged,
    sum(chlorine_used) AS total_chlorine_used,
    sum(excess_sludge_removed) AS total_excess_sludge,
    sum(electricity_kg_co2e) AS total_kg_co2e
   FROM wastewater.v_reading_detail
  GROUP BY location_id, ((date_trunc('month'::text, (reading_date)::timestamp with time zone))::date);
```

### `wastewater.v_reading_detail`
```sql
SELECT r.id,
    r.location_id,
    r.reading_date,
    r.reported_by,
    r.tds_aeration,
    r.temp_aeration,
    r.tds_before_discharge,
    r.ph,
    r.do_aeration,
    r.do_sedimentation,
    r.do_before_discharge,
    r.sv30,
    r.free_chlorine,
    r.color_desc,
    r.smell_desc,
    r.screen_cleaned_coarse,
    r.screen_cleaned_fine,
    r.pump1_running,
    r.pump2_running,
    r.aerator1_running,
    r.aerator2_running,
    r.sludge_pump1_running,
    r.sludge_pump2_running,
    r.chlorine_pump1_running,
    r.chlorine_pump2_running,
    r.system_operating,
    r.pump1_meter,
    r.pump2_meter,
    r.water_used_total,
    r.wastewater_in,
    r.wastewater_discharged,
    r.chlorine_used,
    r.chlorine_mix_ratio,
    r.excess_sludge_removed,
    r.carbon_reading_id,
    r.input_source,
    r.note,
    r.created_at,
    (r.pump1_meter - lag(r.pump1_meter) OVER (PARTITION BY r.location_id ORDER BY r.reading_date)) AS pump1_consumption,
    (r.pump2_meter - lag(r.pump2_meter) OVER (PARTITION BY r.location_id ORDER BY r.reading_date)) AS pump2_consumption,
    ce.kg_co2e_total AS electricity_kg_co2e,
    (((t_do1.max_value IS NOT NULL) AND (r.do_aeration > t_do1.max_value)) OR ((t_do1.min_value IS NOT NULL) AND (r.do_aeration < t_do1.min_value))) AS flag_do1,
    (((t_do2.max_value IS NOT NULL) AND (r.do_sedimentation > t_do2.max_value)) OR ((t_do2.min_value IS NOT NULL) AND (r.do_sedimentation < t_do2.min_value))) AS flag_do2,
    (((t_do3.max_value IS NOT NULL) AND (r.do_before_discharge > t_do3.max_value)) OR ((t_do3.min_value IS NOT NULL) AND (r.do_before_discharge < t_do3.min_value))) AS flag_do3,
    (((t_cl.max_value IS NOT NULL) AND (r.free_chlorine > t_cl.max_value)) OR ((t_cl.min_value IS NOT NULL) AND (r.free_chlorine < t_cl.min_value))) AS flag_free_chlorine,
    (((t_ph.max_value IS NOT NULL) AND (r.ph > t_ph.max_value)) OR ((t_ph.min_value IS NOT NULL) AND (r.ph < t_ph.min_value))) AS flag_ph
   FROM ((((((wastewater.reading r
     LEFT JOIN carbon.v_reading_co2e ce ON ((ce.id = r.carbon_reading_id)))
     LEFT JOIN LATERAL ( SELECT threshold.min_value,
            threshold.max_value
           FROM wastewater.threshold
          WHERE ((threshold.parameter_code = 'do1'::text) AND (threshold.effective_from <= r.reading_date))
          ORDER BY threshold.effective_from DESC
         LIMIT 1) t_do1 ON (true))
     LEFT JOIN LATERAL ( SELECT threshold.min_value,
            threshold.max_value
           FROM wastewater.threshold
          WHERE ((threshold.parameter_code = 'do2'::text) AND (threshold.effective_from <= r.reading_date))
          ORDER BY threshold.effective_from DESC
         LIMIT 1) t_do2 ON (true))
     LEFT JOIN LATERAL ( SELECT threshold.min_value,
            threshold.max_value
           FROM wastewater.threshold
          WHERE ((threshold.parameter_code = 'do3'::text) AND (threshold.effective_from <= r.reading_date))
          ORDER BY threshold.effective_from DESC
         LIMIT 1) t_do3 ON (true))
     LEFT JOIN LATERAL ( SELECT threshold.min_value,
            threshold.max_value
           FROM wastewater.threshold
          WHERE ((threshold.parameter_code = 'free_chlorine'::text) AND (threshold.effective_from <= r.reading_date))
          ORDER BY threshold.effective_from DESC
         LIMIT 1) t_cl ON (true))
     LEFT JOIN LATERAL ( SELECT threshold.min_value,
            threshold.max_value
           FROM wastewater.threshold
          WHERE ((threshold.parameter_code = 'ph'::text) AND (threshold.effective_from <= r.reading_date))
          ORDER BY threshold.effective_from DESC
         LIMIT 1) t_ph ON (true));
```
