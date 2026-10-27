-- 05_consent.sql — declarations, consent ledger and the only way to create a job.
-- Idempotent: safe to run repeatedly.

-- ------------------------------------------------------------- profile fields
alter table profiles add column if not exists terms_version text;
alter table profiles add column if not exists terms_accepted_at timestamptz;

insert into settings (key, value) values ('terms_version', '"2026-10"'::jsonb)
on conflict (key) do nothing;

-- A job always records the customer's declaration time. Old rows are backfilled
-- with their creation time (they were created before the declaration existed).
alter table jobs add column if not exists declaration_accepted_at timestamptz;
update jobs set declaration_accepted_at = created_at where declaration_accepted_at is null;

-- ------------------------------------------------------------------- consents
create table if not exists consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (
    kind in ('terms', 'privacy', 'customer_declaration', 'worker_declaration', 'phone_check')
  ),
  version text not null check (char_length(version) between 1 and 40),
  job_id uuid references jobs(id) on delete set null,
  accepted_at timestamptz not null default now()
);

create index if not exists consents_user_idx on consents (user_id, accepted_at desc);
create index if not exists consents_job_idx on consents (job_id);

alter table consents enable row level security;

revoke all on table consents from anon, authenticated;
grant select on consents to authenticated;

drop policy if exists consents_select on consents;
create policy consents_select on consents for select to authenticated
  using (user_id = auth.uid() or is_super());

-- No insert/update/delete policies: rows are written only by SECURITY DEFINER
-- functions below. The ledger is append-only.
create or replace function public.consents_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user in ('postgres', 'supabase_admin') then
    return case when tg_op = 'DELETE' then old else old end;
  end if;
  raise exception 'consents_append_only' using errcode = 'P0001';
end;
$$;

drop trigger if exists consents_guard on consents;
create trigger consents_guard before update or delete on consents
  for each row execute function public.consents_immutable();

-- --------------------------------------------------------------- accept_consents
create or replace function public.accept_consents(p_kinds text[], p_version text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := public.app_role();
  v_kind text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if v_role not in ('customer', 'worker') then
    raise exception 'consent_role_forbidden';
  end if;
  if p_version is null or char_length(p_version) = 0 then
    raise exception 'version_required';
  end if;

  foreach v_kind in array coalesce(p_kinds, array[]::text[]) loop
    if v_kind not in ('terms', 'privacy', 'customer_declaration', 'worker_declaration', 'phone_check') then
      raise exception 'consent_kind_invalid';
    end if;
    if v_kind = 'customer_declaration' and v_role <> 'customer' then
      raise exception 'consent_kind_forbidden';
    end if;
    if v_kind in ('worker_declaration', 'phone_check') and v_role <> 'worker' then
      raise exception 'consent_kind_forbidden';
    end if;

    insert into consents (user_id, kind, version)
    values (auth.uid(), v_kind, p_version);
  end loop;

  update profiles
     set terms_version = p_version,
         terms_accepted_at = now()
   where id = auth.uid();
end;
$$;

revoke all on function public.accept_consents(text[], text) from public;
grant execute on function public.accept_consents(text[], text) to authenticated;

-- ------------------------------------------------------------------- create_job
-- Direct INSERT on jobs is revoked from customers; this RPC is the only path and
-- it requires the declaration. Existing staff RPCs are unaffected.
create or replace function public.create_job(
  p_skill uuid,
  p_title text,
  p_description text,
  p_district uuid,
  p_job_date date,
  p_job_slot text,
  p_workers_needed int,
  p_pay_offer numeric,
  p_address_note text,
  p_declaration boolean,
  p_version text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null or public.app_role() <> 'customer' then
    raise exception 'forbidden';
  end if;
  if p_declaration is not true then
    raise exception 'declaration_required';
  end if;
  if p_version is null or char_length(p_version) = 0 then
    raise exception 'version_required';
  end if;
  if p_title is null or char_length(trim(p_title)) not between 1 and 80 then
    raise exception 'invalid_title';
  end if;
  if p_description is not null and char_length(p_description) > 500 then
    raise exception 'invalid_description';
  end if;
  if p_address_note is null or char_length(trim(p_address_note)) not between 3 and 300 then
    raise exception 'invalid_address';
  end if;
  if p_job_slot not in ('full', 'am', 'pm') then
    raise exception 'invalid_slot';
  end if;
  if p_workers_needed is null or p_workers_needed not between 1 and 10 then
    raise exception 'invalid_workers';
  end if;
  if p_pay_offer is not null and p_pay_offer < 0 then
    raise exception 'invalid_pay';
  end if;
  if p_job_date is null or p_job_date < public.today_ub() then
    raise exception 'invalid_date';
  end if;
  if not exists (select 1 from skills s where s.id = p_skill and s.active) then
    raise exception 'invalid_skill';
  end if;
  if not exists (select 1 from districts d where d.id = p_district) then
    raise exception 'invalid_district';
  end if;

  insert into jobs (
    customer_id, skill_id, title, description, district_id, job_date, job_slot,
    workers_needed, pay_offer, address_note, status, declaration_accepted_at
  ) values (
    auth.uid(), p_skill, trim(p_title), coalesce(p_description, ''), p_district, p_job_date,
    p_job_slot, p_workers_needed, p_pay_offer, trim(p_address_note), 'new', now()
  ) returning id into v_id;

  insert into consents (user_id, kind, version, job_id)
  values (auth.uid(), 'customer_declaration', p_version, v_id);

  return v_id;
end;
$$;

revoke all on function public.create_job(
  uuid, text, text, uuid, date, text, int, numeric, text, boolean, text
) from public;
grant execute on function public.create_job(
  uuid, text, text, uuid, date, text, int, numeric, text, boolean, text
) to authenticated;

-- Customers can no longer insert jobs directly.
drop policy if exists jobs_customer_insert on jobs;
revoke insert on table jobs from anon, authenticated;
