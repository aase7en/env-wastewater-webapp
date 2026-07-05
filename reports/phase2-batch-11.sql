begin;

with input_data(reading_date, tds_aeration, temp_aeration, tds_before_discharge, ph, do_aeration, do_sedimentation, do_before_discharge, sv30, free_chlorine, screen_cleaned_coarse, screen_cleaned_fine, pump1_running, pump2_running, aerator1_running, aerator2_running, sludge_pump1_running, sludge_pump2_running, chlorine_pump1_running, chlorine_pump2_running, system_operating, pump1_meter, pump2_meter, water_used_total, wastewater_in, wastewater_discharged, chlorine_used, chlorine_mix_ratio, excess_sludge_removed, color_desc, smell_desc, note, legacy_id, reported_by_name_legacy, meter_value, consumption) as (
  values
    (core.thai_be_to_date('28/6/2569'), 445, 31.8, 494, 7.1, 1.5, 1.28, 3.51, 250, 0.14, false, true, true, true, true, true, true, true, true, true, true, 4275.4, 7328.1, 0, 83.8, NULL::numeric, 1.111111111, '1:9', NULL::numeric, 'น้ำตาลเข้ม', 'กลิ่นดินปกติ', 'discharge: ระบาย', '52c40ccd', 'นายวิลาส รื่นวิชา', 9177, 6),
    (core.thai_be_to_date('29/6/2569'), 456, 31.1, 515, 7.3, 1.63, 1.31, 3.75, 250, 1, false, true, true, true, true, true, true, true, true, true, true, 4276.4, 7329.1, 0, 46, NULL::numeric, 0.5555555556, '1:9', NULL::numeric, 'น้ำตาลเข้ม', 'กลิ่นดินปกติ', 'discharge: ระบาย', 'e1870d76', 'นายวิลาส รื่นวิชา', 9181, 4),
    (core.thai_be_to_date('30/6/2569'), 474, 31.3, 529, 7.3, 1.69, 1.45, 3.93, 300, 0.51, false, true, true, true, true, true, true, true, true, true, true, 4277.5, 7330.2, 0, 50.6, NULL::numeric, 1.666666667, '1:9', 5.4, 'น้ำตาลเข้ม', 'กลิ่นดินปกติ', 'discharge: ระบาย', '75e5b6bf', 'นายวิลาส รื่นวิชา', 9186, 5),
    (core.thai_be_to_date('1/7/2569'), 479, 31.2, 535, 7.1, 1.75, 1.49, 4.14, 150, 0.34, false, true, true, true, true, true, true, true, true, true, true, 4278.7, 7331.4, 41.12, 55.2, NULL::numeric, 0.5555555556, '1:9', NULL::numeric, 'น้ำตาลเข้ม', 'กลิ่นดินปกติ', 'discharge: ระบาย', 'dca74c63', 'นายวิลาส รื่นวิชา', 9190, 4),
    (core.thai_be_to_date('2/7/2569'), 414, 30.5, 447, 6.8, 1.52, 1.1, 3.85, 150, 0.28, true, true, true, true, true, true, true, true, true, true, true, 4279.8, 7332.5, 22.4, 50.6, NULL::numeric, 2.222222222, '1:9', NULL::numeric, 'น้ำตาลเข้ม', 'กลิ่นดินปกติ', 'discharge: ระบาย', '8d6f5363', 'นายวิลาส รื่นวิชา', 9195, 5),
    (core.thai_be_to_date('3/7/2569'), 437, 30.7, 479, 7, 1.65, 1.29, 3.99, 150, 1.53, false, true, true, true, true, true, true, true, true, true, true, 4280.8, 7333.5, 33.6, 46, NULL::numeric, 2.777777778, '1:9', NULL::numeric, 'น้ำตาลเข้ม', 'กลิ่นดินปกติ', 'discharge: ระบาย', 'c18e29c4', 'นายวิลาส รื่นวิชา', 9199, 4),
    (core.thai_be_to_date('4/7/2569'), 443, 30.1, 485, 7, 1.77, 1.36, 4.18, 200, 0.5, false, true, true, true, true, true, true, true, true, true, true, 4282.1, 7334.8, 38.48, 59.8, NULL::numeric, 4.444444444, '1:9', NULL::numeric, 'น้ำตาลเข้ม', 'กลิ่นดินปกติ', 'discharge: ระบาย', '5a3dad45', 'นายวิลาส รื่นวิชา', 9205, 6)
),
ins_carbon as (
  insert into carbon.reading (meter_id, reading_date, meter_value, consumption, input_source)
  select 'b6be4c99-c83a-43f7-b765-72286cc78bd0'::uuid, reading_date, meter_value, consumption, 'manual' from input_data
  returning id, reading_date
)
insert into wastewater.reading (
  reading_date, tds_aeration, temp_aeration, tds_before_discharge, ph, do_aeration, do_sedimentation, do_before_discharge, sv30, free_chlorine, screen_cleaned_coarse, screen_cleaned_fine, pump1_running, pump2_running, aerator1_running, aerator2_running, sludge_pump1_running, sludge_pump2_running, chlorine_pump1_running, chlorine_pump2_running, system_operating, pump1_meter, pump2_meter, water_used_total, wastewater_in, wastewater_discharged, chlorine_used, chlorine_mix_ratio, excess_sludge_removed, color_desc, smell_desc, note, legacy_id, reported_by_name_legacy, carbon_reading_id, input_source
) select
  d.reading_date, d.tds_aeration, d.temp_aeration, d.tds_before_discharge, d.ph, d.do_aeration, d.do_sedimentation, d.do_before_discharge, d.sv30, d.free_chlorine, d.screen_cleaned_coarse, d.screen_cleaned_fine, d.pump1_running, d.pump2_running, d.aerator1_running, d.aerator2_running, d.sludge_pump1_running, d.sludge_pump2_running, d.chlorine_pump1_running, d.chlorine_pump2_running, d.system_operating, d.pump1_meter, d.pump2_meter, d.water_used_total, d.wastewater_in, d.wastewater_discharged, d.chlorine_used, d.chlorine_mix_ratio, d.excess_sludge_removed, d.color_desc, d.smell_desc, d.note, d.legacy_id, d.reported_by_name_legacy, c.id, 'manual'
from input_data d join ins_carbon c on c.reading_date = d.reading_date;

select (select count(*) from wastewater.reading) as inserted_wastewater_rows, (select count(*) from carbon.reading) as inserted_carbon_rows;

commit;