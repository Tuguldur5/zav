-- 02_rls.sql — helper functions, column grants, RLS policies, privacy functions.
-- Idempotent: safe to run repeatedly.

-- ---------------------------------------------------------------- helpers

create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from profiles where id = auth.uid()), 'anon');
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles p
     where p.id = auth.uid()
       and p.role in ('admin', 'super_admin')
       and p.status = 'active'
  )
  and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

create or replace function public.is_super()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles p
     where p.id = auth.uid()
       and p.role = 'super_admin'
       and p.status = 'active'
  )
  and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

create or replace function public.manages_worker(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super() or (
    public.is_staff() and exists (
      select 1 from worker_details wd
       where wd.worker_id = target and wd.admin_id = auth.uid()
    )
  );
$$;

create or replace function public.manages_job(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super() or (
    public.is_staff() and exists (
      select 1 from jobs j where j.id = target and j.claimed_by = auth.uid()
    )
  );
$$;

create or replace function public.sees_customer(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_staff() and exists (
    select 1 from jobs j where j.customer_id = target and j.claimed_by = auth.uid()
  );
$$;

-- Supabase adds default privileges that grant ALL on every new table in the public
-- schema to anon/authenticated. Start from a clean slate so only the privileges
-- listed in this file exist (and helper functions open exactly what is needed).
revoke all on all tables in schema public from anon, authenticated;

-- --------------------------------------------------------- column privacy

revoke all on table worker_details from anon, authenticated;
grant select (worker_id, admin_id, experience_note, has_transport, intake_status, assigned_at)
  on worker_details to authenticated;

revoke update on table notifications from anon, authenticated;
grant update (read) on notifications to authenticated;

-- ---------------------------------------------------------------- grants

grant select on districts, skills to anon, authenticated;
grant insert, update, delete on districts, skills to authenticated;

grant select on profiles to authenticated;
grant update (full_name, phone, district_id) on profiles to authenticated;

grant select on worker_skills, availability, assignments, audit_logs to authenticated;
grant select, insert, update on jobs to authenticated;
grant select, insert, update, delete on admin_scopes to authenticated;
grant select on notifications to authenticated;
grant select on settings to anon, authenticated;
grant insert, update, delete on settings to authenticated;

-- ---------------------------------------------------------------- RLS on

alter table districts enable row level security;
alter table skills enable row level security;
alter table profiles enable row level security;
alter table worker_details enable row level security;
alter table worker_skills enable row level security;
alter table admin_scopes enable row level security;
alter table availability enable row level security;
alter table jobs enable row level security;
alter table assignments enable row level security;
alter table notifications enable row level security;
alter table staff_invites enable row level security;
alter table settings enable row level security;
alter table audit_logs enable row level security;

-- -------------------------------------------------------------- policies

drop policy if exists districts_read on districts;
create policy districts_read on districts for select to anon, authenticated using (true);
drop policy if exists districts_super_write on districts;
create policy districts_super_write on districts for all to authenticated
  using (is_super()) with check (is_super());

drop policy if exists skills_read on skills;
create policy skills_read on skills for select to anon, authenticated using (true);
drop policy if exists skills_super_write on skills;
create policy skills_super_write on skills for all to authenticated
  using (is_super()) with check (is_super());

drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select to authenticated
  using (id = auth.uid() or is_super() or manages_worker(id) or sees_customer(id));

drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists worker_details_select on worker_details;
create policy worker_details_select on worker_details for select to authenticated
  using (worker_id = auth.uid() or manages_worker(worker_id) or is_super());

drop policy if exists worker_skills_select on worker_skills;
create policy worker_skills_select on worker_skills for select to authenticated
  using (worker_id = auth.uid() or manages_worker(worker_id) or is_super());

drop policy if exists admin_scopes_select on admin_scopes;
create policy admin_scopes_select on admin_scopes for select to authenticated
  using (admin_id = auth.uid() or is_super());
drop policy if exists admin_scopes_super_write on admin_scopes;
create policy admin_scopes_super_write on admin_scopes for all to authenticated
  using (is_super()) with check (is_super());

drop policy if exists availability_select on availability;
create policy availability_select on availability for select to authenticated
  using (worker_id = auth.uid() or manages_worker(worker_id) or is_super());

drop policy if exists jobs_select on jobs;
create policy jobs_select on jobs for select to authenticated
  using (customer_id = auth.uid() or is_super() or (is_staff() and claimed_by = auth.uid()));

drop policy if exists jobs_customer_insert on jobs;
create policy jobs_customer_insert on jobs for insert to authenticated
  with check (
    customer_id = auth.uid()
    and app_role() = 'customer'
    and status = 'new'
    and claimed_by is null
  );

drop policy if exists jobs_customer_cancel on jobs;
create policy jobs_customer_cancel on jobs for update to authenticated
  using (customer_id = auth.uid() and status in ('new', 'claimed', 'matched'))
  with check (customer_id = auth.uid() and status = 'cancelled');

drop policy if exists assignments_select on assignments;
create policy assignments_select on assignments for select to authenticated
  using (worker_id = auth.uid() or is_super() or manages_job(job_id));

drop policy if exists notifications_select on notifications;
create policy notifications_select on notifications for select to authenticated
  using (user_id = auth.uid());

drop policy if exists notifications_mark_read on notifications;
create policy notifications_mark_read on notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists settings_read on settings;
create policy settings_read on settings for select to anon, authenticated using (true);
drop policy if exists settings_super_write on settings;
create policy settings_super_write on settings for all to authenticated
  using (is_super()) with check (is_super());

drop policy if exists audit_logs_super_read on audit_logs;
create policy audit_logs_super_read on audit_logs for select to authenticated
  using (is_super());

-- staff_invites: intentionally no policies. Only SECURITY DEFINER RPCs use it.

-- ------------------------------------------------------- privacy functions

-- Admin pool: unclaimed jobs without address note or customer contact.
create or replace function public.pool_jobs()
returns table (
  id uuid, skill_id uuid, title text, description text, district_id uuid,
  job_date date, job_slot text, workers_needed int, pay_offer numeric,
  status text, created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select j.id, j.skill_id, j.title, j.description, j.district_id,
         j.job_date, j.job_slot, j.workers_needed, j.pay_offer,
         j.status, j.created_at
    from jobs j
   where public.is_staff() and j.status = 'new' and j.claimed_by is null
   order by j.created_at asc;
$$;

-- Worker jobs: address_note only after the assignment is confirmed/completed.
create or replace function public.worker_jobs()
returns table (
  assignment_id uuid, job_id uuid, title text, description text, skill_id uuid,
  district_id uuid, job_date date, job_slot text, pay_offer numeric,
  address_note text, job_status text, assignment_status text,
  workers_needed int, created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select a.id, j.id, j.title, j.description, j.skill_id, j.district_id,
         j.job_date, j.job_slot, j.pay_offer,
         case when a.status in ('confirmed', 'completed') then j.address_note else null end,
         j.status, a.status, j.workers_needed, j.created_at
    from assignments a
    join jobs j on j.id = a.job_id
   where a.worker_id = auth.uid()
     and a.status <> 'cancelled'
   order by j.job_date asc;
$$;

-- Customer view of confirmed helpers: first name, skill, admin name and phone.
create or replace function public.customer_job_assignments(p_job uuid)
returns table (
  assignment_id uuid, worker_first_name text, skill text,
  admin_name text, admin_phone text, status text
)
language sql
stable
security definer
set search_path = public
as $$
  select a.id,
         split_part(w.full_name, ' ', 1),
         s.name,
         adm.full_name,
         adm.phone,
         a.status
    from assignments a
    join jobs j on j.id = a.job_id
    join profiles w on w.id = a.worker_id
    join skills s on s.id = j.skill_id
    left join profiles adm on adm.id = j.claimed_by
   where a.job_id = p_job
     and j.customer_id = auth.uid()
     and a.status in ('confirmed', 'completed')
   order by a.created_at asc;
$$;

-- Private staff note: only the worker's admin or super admin.
create or replace function public.worker_staff_note(p_worker uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select wd.staff_note
    from worker_details wd
   where wd.worker_id = p_worker
     and (public.manages_worker(p_worker) or public.is_super());
$$;

-- Customer contact for the admin who claimed their job (always allowed).
create or replace function public.customer_job_admin(p_job uuid)
returns table (admin_name text, admin_phone text)
language sql
stable
security definer
set search_path = public
as $$
  select adm.full_name, adm.phone
    from jobs j
    left join profiles adm on adm.id = j.claimed_by
   where j.id = p_job and j.customer_id = auth.uid();
$$;

-- The worker's own admin contact.
create or replace function public.worker_admin_contact()
returns table (admin_id uuid, admin_name text, admin_phone text)
language sql
stable
security definer
set search_path = public
as $$
  select wd.admin_id, p.full_name, p.phone
    from worker_details wd
    left join profiles p on p.id = wd.admin_id
   where wd.worker_id = auth.uid() and public.app_role() = 'worker';
$$;

revoke all on function public.pool_jobs() from public;
revoke all on function public.worker_jobs() from public;
revoke all on function public.customer_job_assignments(uuid) from public;
revoke all on function public.worker_staff_note(uuid) from public;
grant execute on function public.pool_jobs() to authenticated;
grant execute on function public.worker_jobs() to authenticated;
grant execute on function public.customer_job_assignments(uuid) to authenticated;
grant execute on function public.worker_staff_note(uuid) to authenticated;
revoke all on function public.customer_job_admin(uuid) from public;
revoke all on function public.worker_admin_contact() from public;
grant execute on function public.customer_job_admin(uuid) to authenticated;
grant execute on function public.worker_admin_contact() to authenticated;
