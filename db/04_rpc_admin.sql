-- 04_rpc_admin.sql — super admin operations, staff invites, catalog, settings, stats.

create or replace function public.assign_worker(p_worker uuid, p_admin uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_worker profiles;
  v_admin profiles;
begin
  if not public.is_super() then
    raise exception 'forbidden';
  end if;

  select * into v_admin from profiles
   where id = p_admin and role = 'admin' and status = 'active';
  if v_admin.id is null then
    raise exception 'invalid_admin';
  end if;

  select * into v_worker from profiles
   where id = p_worker and role = 'worker';
  if v_worker.id is null then
    raise exception 'not_found';
  end if;

  update worker_details
     set admin_id = p_admin, intake_status = 'assigned', assigned_at = now()
   where worker_id = p_worker;
  if not found then
    raise exception 'not_found';
  end if;

  update profiles set status = 'active' where id = p_worker and status = 'pending';

  perform public.push_notification(
    p_worker, 'Танд админ томилогдлоо',
    v_admin.full_name || ' таны админ боллоо.', '/w'
  );
  perform public.push_notification(
    p_admin, 'Шинэ ажилтан',
    v_worker.full_name || ' танд хуваарилагдлаа.', '/workers/' || p_worker
  );
  perform public.write_audit(auth.uid(), 'worker.assign', 'worker', p_worker,
    jsonb_build_object('admin', p_admin));
end;
$$;

create or replace function public.bulk_assign_workers(p_workers uuid[], p_admin uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_worker uuid;
  v_count int := 0;
begin
  if not public.is_super() then
    raise exception 'forbidden';
  end if;
  if not exists (
    select 1 from profiles where id = p_admin and role = 'admin' and status = 'active'
  ) then
    raise exception 'invalid_admin';
  end if;

  foreach v_worker in array coalesce(p_workers, array[]::uuid[]) loop
    perform public.assign_worker(v_worker, p_admin);
    v_count := v_count + 1;
  end loop;

  perform public.write_audit(auth.uid(), 'worker.bulk_assign', 'admin', p_admin,
    jsonb_build_object('count', v_count));
  return v_count;
end;
$$;

create or replace function public.suggest_admin(p_worker uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_skills uuid[];
  v_district uuid;
  v_admin uuid;
begin
  if not public.is_super() then
    raise exception 'forbidden';
  end if;

  select district_id into v_district from profiles
   where id = p_worker and role = 'worker';
  if not found then
    raise exception 'not_found';
  end if;

  select coalesce(array_agg(skill_id), array[]::uuid[]) into v_skills
    from worker_skills where worker_id = p_worker;

  select p.id into v_admin
    from profiles p
    left join worker_details wd on wd.admin_id = p.id
   where p.role = 'admin' and p.status = 'active'
   group by p.id, p.created_at
   order by
     (exists (
       select 1 from admin_scopes sc
        where sc.admin_id = p.id
          and (sc.skill_id = any(v_skills) or sc.district_id = v_district)
     )) desc,
     count(wd.worker_id) asc,
     p.created_at asc
   limit 1;

  return v_admin;
end;
$$;

create or replace function public.transfer_workers(p_from uuid, p_to uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_worker uuid;
  v_count int := 0;
begin
  if not public.is_super() then
    raise exception 'forbidden';
  end if;
  if not exists (
    select 1 from profiles where id = p_to and role = 'admin' and status = 'active'
  ) then
    raise exception 'invalid_admin';
  end if;
  if p_from = p_to then
    raise exception 'invalid_admin';
  end if;

  for v_worker in
    update worker_details
       set admin_id = p_to, intake_status = 'assigned', assigned_at = now()
     where admin_id = p_from or (p_from is null and admin_id is null)
    returning worker_id
  loop
    perform public.push_notification(
      v_worker, 'Танд шинэ админ томилогдлоо',
      'Таны ажлыг өөр админ хариуцах боллоо.', '/w'
    );
    v_count := v_count + 1;
  end loop;

  perform public.write_audit(auth.uid(), 'worker.transfer', 'admin', p_to,
    jsonb_build_object('from', p_from, 'count', v_count));
  return v_count;
end;
$$;

create or replace function public.reassign_job(p_job uuid, p_admin uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job jobs;
begin
  if not public.is_super() then
    raise exception 'forbidden';
  end if;
  if not exists (
    select 1 from profiles where id = p_admin and role = 'admin' and status = 'active'
  ) then
    raise exception 'invalid_admin';
  end if;

  select * into v_job from jobs where id = p_job for update;
  if v_job.id is null then
    raise exception 'not_found';
  end if;
  if v_job.status in ('done', 'cancelled') then
    raise exception 'invalid_status';
  end if;

  update jobs
     set claimed_by = p_admin,
         status = case when status = 'new' then 'claimed' else status end
   where id = p_job;

  perform public.push_notification(
    p_admin, 'Зар шилжүүлэгдлээ',
    v_job.title || ' зарыг та хариуцах боллоо.', '/jobs/' || p_job
  );
  perform public.write_audit(auth.uid(), 'job.reassign', 'job', p_job,
    jsonb_build_object('admin', p_admin));
end;
$$;

create or replace function public.create_staff_invite()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_hash text;
  v_expires timestamptz;
begin
  if not public.is_super() then
    raise exception 'forbidden';
  end if;

  v_code := upper(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 12));
  v_hash := encode(extensions.digest(v_code, 'sha256'), 'hex');
  v_expires := now() + interval '48 hours';

  insert into staff_invites (code_hash, created_by, expires_at)
  values (v_hash, auth.uid(), v_expires);

  perform public.write_audit(auth.uid(), 'staff.invite_create', 'staff_invite', null,
    jsonb_build_object('expires_at', v_expires));

  return jsonb_build_object('code', v_code, 'expires_at', v_expires);
end;
$$;

create or replace function public.redeem_staff_invite(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile profiles;
  v_invite staff_invites;
  v_hash text;
begin
  if auth.uid() is null then
    raise exception 'forbidden';
  end if;

  select * into v_profile from profiles where id = auth.uid() for update;
  if v_profile.id is null then
    raise exception 'forbidden';
  end if;
  if v_profile.role <> 'customer' then
    raise exception 'not_eligible';
  end if;
  if exists (select 1 from jobs where customer_id = auth.uid()) then
    raise exception 'not_eligible';
  end if;

  v_hash := encode(extensions.digest(upper(trim(p_code)), 'sha256'), 'hex');
  select * into v_invite from staff_invites where code_hash = v_hash for update;

  if v_invite.id is null then
    raise exception 'invalid_code';
  end if;
  if v_invite.used_at is not null then
    raise exception 'used_code';
  end if;
  if v_invite.expires_at < now() then
    raise exception 'expired_code';
  end if;

  update profiles set role = 'admin', status = 'active' where id = auth.uid();
  update staff_invites
     set used_by = auth.uid(), used_at = now()
   where id = v_invite.id;

  perform public.write_audit(auth.uid(), 'staff.redeem_invite', 'staff_invite', v_invite.id,
    '{}'::jsonb);
end;
$$;

create or replace function public.set_staff_status(p_user uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target profiles;
  v_supers int;
begin
  if not public.is_super() then
    raise exception 'forbidden';
  end if;
  if p_status not in ('active', 'suspended') then
    raise exception 'invalid_status';
  end if;
  if p_user = auth.uid() then
    raise exception 'self_forbidden';
  end if;

  select * into v_target from profiles
   where id = p_user and role in ('admin', 'super_admin');
  if v_target.id is null then
    raise exception 'not_found';
  end if;

  if p_status = 'suspended' and v_target.role = 'super_admin' then
    select count(*) into v_supers from profiles
     where role = 'super_admin' and status = 'active';
    if v_supers <= 1 then
      raise exception 'last_super';
    end if;
  end if;

  update profiles set status = p_status where id = p_user;

  perform public.push_notification(
    p_user,
    case when p_status = 'active' then 'Эрх сэргэлээ' else 'Эрх түр хаагдлаа' end,
    'Супер админ таны эрхийн төлөвийг өөрчиллөө.', null
  );
  perform public.write_audit(auth.uid(), 'staff.set_status', 'profile', p_user,
    jsonb_build_object('status', p_status));
end;
$$;

create or replace function public.force_cancel_job(p_job uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job jobs;
  v_worker uuid;
begin
  if not public.is_super() then
    raise exception 'forbidden';
  end if;

  select * into v_job from jobs where id = p_job for update;
  if v_job.id is null then
    raise exception 'not_found';
  end if;
  if v_job.status in ('done', 'cancelled') then
    raise exception 'invalid_status';
  end if;

  update jobs set status = 'cancelled' where id = p_job;

  for v_worker in
    update assignments set status = 'cancelled'
     where job_id = p_job and status in ('offered', 'accepted', 'confirmed')
    returning worker_id
  loop
    perform public.push_notification(
      v_worker, 'Ажил цуцлагдлаа', v_job.title || ' ажил цуцлагдлаа.', '/w'
    );
  end loop;

  perform public.push_notification(
    v_job.customer_id, 'Зар цуцлагдлаа',
    'Таны зар админаар цуцлагдлаа. Тусламж хэрэгтэй бол холбогдоно уу.',
    '/c/jobs/' || p_job
  );
  perform public.write_audit(auth.uid(), 'job.force_cancel', 'job', p_job, '{}'::jsonb);
end;
$$;

create or replace function public.set_worker_catalog(
  p_worker uuid, p_skill_ids uuid[], p_district uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;
  if not public.manages_worker(p_worker) then
    raise exception 'forbidden';
  end if;
  if not exists (select 1 from profiles where id = p_worker and role = 'worker') then
    raise exception 'not_found';
  end if;

  delete from worker_skills where worker_id = p_worker;
  insert into worker_skills (worker_id, skill_id)
  select distinct p_worker, s.id
    from skills s
   where s.id = any(coalesce(p_skill_ids, array[]::uuid[]));

  if p_district is not null then
    if not exists (select 1 from districts where id = p_district) then
      raise exception 'invalid_district';
    end if;
    update profiles set district_id = p_district where id = p_worker;
  end if;

  perform public.write_audit(auth.uid(), 'worker.catalog', 'worker', p_worker,
    jsonb_build_object('skills', coalesce(p_skill_ids, array[]::uuid[]), 'district', p_district));
end;
$$;

create or replace function public.set_worker_note(p_worker uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;
  if not public.manages_worker(p_worker) then
    raise exception 'forbidden';
  end if;

  update worker_details set staff_note = left(p_note, 1000) where worker_id = p_worker;
  perform public.write_audit(auth.uid(), 'worker.note', 'worker', p_worker, '{}'::jsonb);
end;
$$;

create or replace function public.set_admin_scopes(
  p_admin uuid, p_skill_ids uuid[], p_district_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super() then
    raise exception 'forbidden';
  end if;
  if not exists (select 1 from profiles where id = p_admin and role in ('admin', 'super_admin')) then
    raise exception 'not_found';
  end if;

  delete from admin_scopes where admin_id = p_admin;
  insert into admin_scopes (admin_id, skill_id)
  select distinct p_admin, s.id from skills s
   where s.id = any(coalesce(p_skill_ids, array[]::uuid[]));
  insert into admin_scopes (admin_id, district_id)
  select distinct p_admin, d.id from districts d
   where d.id = any(coalesce(p_district_ids, array[]::uuid[]));

  perform public.write_audit(auth.uid(), 'staff.scopes', 'profile', p_admin, '{}'::jsonb);
end;
$$;

create or replace function public.set_setting(p_key text, p_value jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super() then
    raise exception 'forbidden';
  end if;
  if p_key not in ('support_phone', 'support_text') then
    raise exception 'invalid_key';
  end if;

  insert into settings (key, value) values (p_key, p_value)
  on conflict (key) do update set value = excluded.value;

  perform public.write_audit(auth.uid(), 'settings.update', 'setting', null,
    jsonb_build_object('key', p_key));
end;
$$;

create or replace function public.stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_super boolean := public.is_super();
  v_uid uuid := auth.uid();
  v_today date := public.today_ub();
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;

  return jsonb_build_object(
    'pool_new', (select count(*) from jobs where status = 'new' and claimed_by is null),
    'pending_availability', (
      select count(*) from availability a
        join worker_details wd on wd.worker_id = a.worker_id
       where a.day >= v_today and a.status = 'open'
         and (v_super or wd.admin_id = v_uid)
    ),
    'offers_waiting', (
      select count(*) from assignments a
        join jobs j on j.id = a.job_id
       where a.status = 'offered' and (v_super or j.claimed_by = v_uid)
    ),
    'today_jobs', (
      select count(*) from jobs
       where job_date = v_today and status in ('matched', 'confirmed')
         and (v_super or claimed_by = v_uid)
    ),
    'my_workers', (
      select count(*) from worker_details wd where v_super or wd.admin_id = v_uid
    ),
    'unclaimed_24h', (
      select count(*) from jobs
       where status = 'new' and claimed_by is null
         and created_at < now() - interval '24 hours'
    ),
    'unassigned_workers', (
      select count(*) from worker_details where intake_status = 'new'
    ),
    'workers_pending', (
      select count(*) from profiles where role = 'worker' and status = 'pending'
    ),
    'workers_active', (
      select count(*) from profiles where role = 'worker' and status = 'active'
    ),
    'workers_suspended', (
      select count(*) from profiles where role = 'worker' and status = 'suspended'
    ),
    'admins_load', (
      select coalesce(jsonb_agg(
               jsonb_build_object(
                 'id', p.id, 'name', p.full_name, 'status', p.status,
                 'load', (select count(*) from worker_details wd where wd.admin_id = p.id)
               ) order by p.full_name
             ), '[]'::jsonb)
        from profiles p
       where p.role = 'admin'
    )
  );
end;
$$;

-- Staff directory (emails, last login, load) — super admin only.
create or replace function public.staff_directory()
returns table (
  id uuid, email text, full_name text, phone text, role text,
  status text, created_at timestamptz, last_sign_in_at timestamptz, load int
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_super() then
    raise exception 'forbidden';
  end if;

  return query
    select p.id, u.email, p.full_name, p.phone, p.role, p.status, p.created_at,
           u.last_sign_in_at,
           (select count(*) from worker_details wd where wd.admin_id = p.id)::int
      from profiles p
      join auth.users u on u.id = p.id
     where p.role in ('admin', 'super_admin')
     order by p.role, p.full_name;
end;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'assign_worker(uuid,uuid)', 'bulk_assign_workers(uuid[],uuid)',
    'suggest_admin(uuid)', 'transfer_workers(uuid,uuid)',
    'reassign_job(uuid,uuid)', 'create_staff_invite()',
    'redeem_staff_invite(text)', 'set_staff_status(uuid,text)',
    'force_cancel_job(uuid)', 'set_worker_catalog(uuid,uuid[],uuid)',
    'set_worker_note(uuid,text)', 'set_admin_scopes(uuid,uuid[],uuid[])',
    'set_setting(text,jsonb)', 'stats()',
    'staff_directory()'
  ] loop
    execute format('revoke all on function public.%s from public', fn);
    execute format('grant execute on function public.%s to authenticated', fn);
  end loop;
end;
$$;
