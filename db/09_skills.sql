-- 09_skills.sql — idempotent.
--
-- 1. skills.sensitive marks work where the worker must be vetted by hand.
-- 2. Two care skills become sensitive and inactive: they are never offered in
--    the public catalog, the order wizard or the worker registration until a
--    super admin enables them on /super/catalog.
-- 3. The everyday service list is upserted BY NAME, so existing ids (and the
--    jobs that reference them) keep working.

alter table skills
  add column if not exists sensitive boolean not null default false;

-- Sensitive by nature: a worker needs a closer background check.
update skills
   set sensitive = true,
       active = false
 where name in ('Хүүхэд харах', 'Өвчтөн өтөгчид асрах');

-- Old tender-style names stay in the table for existing jobs, but new orders
-- use the everyday list below.
update skills
   set active = false
 where name in (
   'Засвар үйлчилгээ',
   'Барилга засал чимэглэл',
   'Ачаа тээвэр нүүлгэлт',
   'Гэр ахуйн туслах',
   'Хашаа цэцэрлэг',
   'Зөөгч үйлчилгээ'
 )
   and sensitive = false;

insert into skills (name, icon, sort_order, active, sensitive) values
  ('Цэвэрлэгээ', 'Sparkles', 10, true, false),
  ('Цонх угаалга', 'AppWindow', 20, true, false),
  ('Хивс ба зөөлөн эдлэл угаалга', 'Layers', 30, true, false),
  ('Нүүлгэлт, ачаа зөөлт', 'Truck', 40, true, false),
  ('Тавилга угсралт', 'Hammer', 50, true, false),
  ('Жижиг засвар', 'Wrench', 60, true, false),
  ('Будалт, засал', 'PaintRoller', 70, true, false),
  ('Хашаа, цэцэрлэг', 'Trees', 80, true, false),
  ('Цас цэвэрлэх, нүүрс, түлээ ажил', 'Snowflake', 90, true, false),
  ('Арга хэмжээний туслах (зөөгч)', 'Utensils', 100, true, false),
  ('Бусад', 'MoreHorizontal', 110, true, false)
on conflict (name) do update
  set icon = excluded.icon,
      sort_order = excluded.sort_order,
      active = excluded.active,
      sensitive = excluded.sensitive;

-- Readable ordering for the marketing catalog.
create index if not exists skills_public_idx
  on skills (sort_order)
  where active and not sensitive;
