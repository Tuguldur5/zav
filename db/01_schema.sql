-- 01_schema.sql — base schema, seeds, signup trigger, audit append-only guard.
-- Idempotent: safe to run repeatedly.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists districts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text not null default 'Sparkles',
  sort_order int not null default 0,
  active boolean not null default true
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer'
    check (role in ('customer', 'worker', 'admin', 'super_admin')),
  full_name text not null default '',
  phone text,
  district_id uuid references districts(id),
  status text not null default 'active'
    check (status in ('active', 'pending', 'suspended')),
  created_at timestamptz not null default now()
);

create table if not exists worker_details (
  worker_id uuid primary key references profiles(id) on delete cascade,
  admin_id uuid references profiles(id) on delete set null,
  experience_note text,
  has_transport boolean not null default false,
  intake_status text not null default 'new'
    check (intake_status in ('new', 'assigned')),
  assigned_at timestamptz,
  staff_note text
);

create table if not exists worker_skills (
  worker_id uuid not null references profiles(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  primary key (worker_id, skill_id)
);

create table if not exists admin_scopes (
  admin_id uuid not null references profiles(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  district_id uuid references districts(id) on delete cascade
);

create table if not exists availability (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references profiles(id) on delete cascade,
  day date not null,
  slot text not null default 'full' check (slot in ('full', 'am', 'pm')),
  status text not null default 'open' check (status in ('open', 'confirmed', 'booked')),
  confirmed_by uuid references profiles(id) on delete set null,
  confirmed_at timestamptz,
  confirmed_by_phone boolean not null default false,
  created_by_staff boolean not null default false,
  unique (worker_id, day)
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  skill_id uuid not null references skills(id),
  title text not null check (char_length(title) between 1 and 80),
  description text not null default '' check (char_length(description) <= 500),
  district_id uuid not null references districts(id),
  job_date date not null,
  job_slot text not null default 'full' check (job_slot in ('full', 'am', 'pm')),
  workers_needed int not null default 1 check (workers_needed between 1 and 10),
  pay_offer numeric check (pay_offer is null or pay_offer >= 0),
  address_note text not null default '' check (char_length(address_note) <= 300),
  status text not null default 'new'
    check (status in ('new', 'claimed', 'matched', 'confirmed', 'done', 'cancelled')),
  claimed_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  worker_id uuid not null references profiles(id) on delete cascade,
  availability_id uuid references availability(id) on delete set null,
  offered_by uuid references profiles(id) on delete set null,
  status text not null default 'offered'
    check (status in ('offered', 'accepted', 'declined', 'confirmed', 'completed', 'cancelled')),
  answered_via text check (answered_via in ('app', 'admin_phone')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists staff_invites (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  created_by uuid references profiles(id) on delete set null,
  expires_at timestamptz not null,
  used_by uuid references profiles(id) on delete set null,
  used_at timestamptz
);

create table if not exists settings (
  key text primary key,
  value jsonb not null
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes required by the product and by common query paths.
create index if not exists availability_worker_day_idx on availability (worker_id, day);
create index if not exists jobs_status_date_idx on jobs (status, job_date);
create index if not exists jobs_claimed_by_idx on jobs (claimed_by);
create index if not exists assignments_job_idx on assignments (job_id);
create index if not exists assignments_worker_idx on assignments (worker_id);
create index if not exists worker_details_admin_idx on worker_details (admin_id);
create index if not exists notifications_user_idx on notifications (user_id, read, created_at desc);
create index if not exists audit_logs_created_idx on audit_logs (created_at desc);
create index if not exists audit_logs_entity_idx on audit_logs (entity, entity_id);

-- Seeds (idempotent, fixed names).
insert into districts (name) values
  ('Багануур'), ('Багахангай'), ('Баянгол'), ('Баянзүрх'), ('Налайх'),
  ('Сонгинохайрхан'), ('Сүхбаатар'), ('Хан-Уул'), ('Чингэлтэй'), ('Бусад')
on conflict (name) do nothing;

insert into skills (name, icon, sort_order) values
  ('Цэвэрлэгээ', 'Sparkles', 10),
  ('Засвар үйлчилгээ', 'Wrench', 20),
  ('Тавилга угсралт', 'Hammer', 30),
  ('Барилга засал чимэглэл', 'PaintRoller', 40),
  ('Ачаа тээвэр нүүлгэлт', 'Truck', 50),
  ('Хүүхэд харах', 'Baby', 60),
  ('Өвчтөн өтөгчид асрах', 'HeartPulse', 70),
  ('Гэр ахуйн туслах', 'Home', 80),
  ('Хашаа цэцэрлэг', 'Trees', 90),
  ('Зөөгч үйлчилгээ', 'Utensils', 100),
  ('Бусад', 'MoreHorizontal', 110)
on conflict (name) do nothing;

insert into settings (key, value) values
  ('support_phone', '"+976 7000 1234"'::jsonb),
  ('support_text', '"Ажлын өдөр 09:00-18:00"'::jsonb)
on conflict (key) do nothing;

-- Profile rows are created only by this trigger. Metadata is user-controlled,
-- so the role is whitelisted to customer/worker and defaults to customer.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  new_role text;
  new_district uuid;
begin
  new_role := case when meta->>'role' = 'worker' then 'worker' else 'customer' end;

  begin
    new_district := nullif(meta->>'district_id', '')::uuid;
  exception when others then
    new_district := null;
  end;
  if new_district is not null
     and not exists (select 1 from districts d where d.id = new_district) then
    new_district := null;
  end if;

  insert into profiles (id, role, full_name, phone, district_id, status)
  values (
    new.id,
    new_role,
    left(coalesce(meta->>'full_name', ''), 120),
    left(nullif(meta->>'phone', ''), 32),
    new_district,
    case when new_role = 'worker' then 'pending' else 'active' end
  )
  on conflict (id) do nothing;

  if new_role = 'worker' then
    insert into worker_details (worker_id, experience_note)
    values (new.id, left(nullif(meta->>'experience_note', ''), 500))
    on conflict (worker_id) do nothing;

    if jsonb_typeof(meta->'skills') = 'array' then
      insert into worker_skills (worker_id, skill_id)
      select new.id, s.id
      from skills s
      where s.id::text in (select jsonb_array_elements_text(meta->'skills'))
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at maintenance for mutable tables.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists jobs_touch on jobs;
create trigger jobs_touch before update on jobs
  for each row execute function public.touch_updated_at();

drop trigger if exists assignments_touch on assignments;
create trigger assignments_touch before update on assignments
  for each row execute function public.touch_updated_at();

-- Roles and statuses cannot be changed through direct table access. Only a
-- SECURITY DEFINER RPC (running as the owner) may do it.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;

  if new.role is distinct from old.role or new.status is distinct from old.status then
    raise exception 'profile_role_or_status_forbidden' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard on profiles;
create trigger profiles_guard before update on profiles
  for each row execute function public.guard_profile_privileges();

-- Audit log is append-only.
create or replace function public.audit_logs_immutable()
returns trigger
language plpgsql
as $$
begin
  -- The audit trail is append-only for every API role. Only a direct database
  -- connection (the owner, e.g. scripts applying this file or the fixture
  -- cleanup in scripts/verify.mjs) may purge rows; the app never connects as
  -- the owner.
  if current_user in ('postgres', 'supabase_admin') then
    return null;
  end if;
  raise exception 'audit_logs_append_only' using errcode = 'P0001';
end;
$$;

drop trigger if exists audit_logs_guard on audit_logs;
create trigger audit_logs_guard before update or delete on audit_logs
  for each row execute function public.audit_logs_immutable();
