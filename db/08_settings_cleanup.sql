-- 08_settings_cleanup.sql — idempotent.
--
-- The first schema seed shipped a placeholder support phone ("+976 7000 1234")
-- that was never a real number. Clear it so no page can show a fake contact
-- detail, then leave the setting empty until the owner fills it in
-- /super/settings. Safe to run many times: only the placeholder is touched.

update settings
   set value = '""'::jsonb
 where key = 'support_phone'
   and jsonb_typeof(value) = 'string'
   and value #>> '{}' like '%7000 1234%';

-- Make sure the row exists (empty is a valid, meaningful value).
insert into settings (key, value)
values ('support_phone', '""'::jsonb)
on conflict (key) do nothing;
