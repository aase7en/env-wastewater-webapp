-- SCHEMA-5 fixup: meter view was skipped by splitter bug on first run
create view public.meter with (security_invoker=on) as select * from carbon.meter;
grant select, insert, update, delete on public.meter to authenticated;
notify pgrst, 'reload schema';
