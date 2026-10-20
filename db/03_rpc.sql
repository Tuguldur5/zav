-- 03_rpc.sql — atomic job, availability and assignment RPCs.
-- Every function re-checks role, ownership and aal2 (via is_staff/is_super).
-- Error messages are stable machine codes; the UI maps them to Mongolian.

-- ------------------------------------------------------------- helpers

create or replace function public.write_audit(
  p_actor uuid, p_action text, p_entity text, p_entity_id uuid,
  p_meta jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into audit_logs (actor_id, action, entity, entity_id, meta)
  values (p_actor, p_action, p_entity, p_entity_id, coalesce(p_meta, '{}'::jsonb));
$$;

create or replace function public.push_notification(
  p_user uuid, p_title text, p_body text, p_link text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into notifications (user_id, title, body, link)
  values (p_user, p_title, p_body, p_link);
$$;

create or replace function public.today_ub()
returns date
language sql
stable
as $$
  select (now() at time zone 'Asia/Ulaanbaatar')::date;
$$;

-- Frees a reserved day unless another active assignment still uses it.
create or replace function public.release_day(p_worker uuid, p_day date)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_day < public.today_ub() then
    return;
  end if;
  if exists (
    select 1
      from assignments a
      join jobs j on j.id = a.job_id
     where a.worker_id = p_worker
       and j.job_date = p_day
       and a.status in ('offered', 'accepted', 'confirmed')
  ) then
    return;
  end if;
  update availability
     set status = 'open', confirmed_by = null, confirmed_at = null,
         confirmed_by_phone = false
   where worker_id = p_worker and day = p_day and status = 'booked';
end;
$$;

-- ------------------------------------------------------------- jobs

create or replace function public.claim_job(p_job uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job jobs;
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;

  update jobs
     set status = 'claimed', claimed_by = auth.uid()
   where id = p_job and status = 'new' and claimed_by is null
  returning * into v_job;

  if v_job.id is null then
    if exists (select 1 from jobs where id = p_job) then
      raise exception 'job_taken';
    end if;
    raise exception 'not_found';
  end if;

  perform public.push_notification(
    v_job.customer_id,
    'Таны зарыг хүлээж авлаа',
    'Манай админ таны зарыг хүлээж авч, ажилтан хайж эхэллээ.',
    '/c/jobs/' || v_job.id
  );
  perform public.write_audit(auth.uid(), 'job.claim', 'job', p_job,
    jsonb_build_object('customer', v_job.customer_id));
  return p_job;
end;
$$;

create or replace function public.release_job(p_job uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job jobs;
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;

  select * into v_job from jobs where id = p_job for update;
  if v_job.id is null then
    raise exception 'not_found';
  end if;
  if v_job.claimed_by is distinct from auth.uid() and not public.is_super() then
    raise exception 'forbidden';
  end if;
  if v_job.status <> 'claimed' then
    raise exception 'invalid_status';
  end if;
  if exists (
    select 1 from assignments
     where job_id = p_job and status in ('accepted', 'confirmed', 'completed')
  ) then
    raise exception 'has_assignments';
  end if;

  update jobs set status = 'new', claimed_by = null where id = p_job;
  perform public.write_audit(auth.uid(), 'job.release', 'job', p_job, '{}'::jsonb);
end;
$$;

-- ------------------------------------------------------- availability

create or replace function public.confirm_availability(
  p_worker uuid, p_day date, p_by_phone boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_av availability;
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;
  if not public.manages_worker(p_worker) then
    raise exception 'forbidden';
  end if;
  if p_day < public.today_ub() then
    raise exception 'past_day';
  end if;

  select * into v_av from availability
   where worker_id = p_worker and day = p_day for update;

  if v_av.id is not null and v_av.status = 'booked' then
    raise exception 'booked';
  end if;

  if v_av.id is null then
    insert into availability
      (worker_id, day, slot, status, confirmed_by, confirmed_at, confirmed_by_phone, created_by_staff)
    values
      (p_worker, p_day, 'full', 'confirmed', auth.uid(), now(), p_by_phone, true);
  else
    update availability
       set status = 'confirmed', confirmed_by = auth.uid(), confirmed_at = now(),
           confirmed_by_phone = p_by_phone, created_by_staff = true
     where id = v_av.id;
  end if;

  perform public.push_notification(
    p_worker, 'Чөлөөт өдөр баталгаажлаа',
    'Таны өдөр админаар баталгаажлаа.', '/w/calendar'
  );
  perform public.write_audit(auth.uid(), 'availability.confirm', 'availability', v_av.id,
    jsonb_build_object('worker', p_worker, 'day', p_day, 'by_phone', p_by_phone));
end;
$$;

create or replace function public.set_availability_for_worker(
  p_worker uuid, p_day date, p_slot text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_av availability;
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;
  if not public.manages_worker(p_worker) then
    raise exception 'forbidden';
  end if;
  if p_day < public.today_ub() then
    raise exception 'past_day';
  end if;
  if p_slot is not null and p_slot not in ('full', 'am', 'pm') then
    raise exception 'invalid_slot';
  end if;

  select * into v_av from availability
   where worker_id = p_worker and day = p_day for update;

  if v_av.id is not null and v_av.status = 'booked' then
    raise exception 'booked';
  end if;

  if p_slot is null then
    delete from availability where worker_id = p_worker and day = p_day;
  elsif v_av.id is null then
    insert into availability (worker_id, day, slot, status, created_by_staff)
    values (p_worker, p_day, p_slot, 'open', true);
  else
    update availability
       set slot = p_slot, status = 'open', confirmed_by = null,
           confirmed_at = null, confirmed_by_phone = false, created_by_staff = true
     where id = v_av.id;
  end if;

  perform public.write_audit(auth.uid(), 'availability.set_by_staff', 'availability', v_av.id,
    jsonb_build_object('worker', p_worker, 'day', p_day, 'slot', p_slot));
end;
$$;

create or replace function public.set_my_availability(p_day date, p_slot text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_av availability;
begin
  if public.app_role() <> 'worker' then
    raise exception 'forbidden';
  end if;
  if p_day < public.today_ub() then
    raise exception 'past_day';
  end if;
  if p_slot is not null and p_slot not in ('full', 'am', 'pm') then
    raise exception 'invalid_slot';
  end if;

  select * into v_av from availability
   where worker_id = auth.uid() and day = p_day for update;

  if v_av.id is not null and v_av.status = 'booked' then
    raise exception 'booked';
  end if;
  if v_av.id is not null and v_av.status = 'confirmed' then
    raise exception 'confirmed_day';
  end if;

  if p_slot is null then
    delete from availability where worker_id = auth.uid() and day = p_day;
  elsif v_av.id is null then
    insert into availability (worker_id, day, slot, status, created_by_staff)
    values (auth.uid(), p_day, p_slot, 'open', false);
  else
    update availability set slot = p_slot, status = 'open', created_by_staff = false
     where id = v_av.id;
  end if;
end;
$$;

-- ------------------------------------------------------- assignments

create or replace function public.offer_assignment(p_job uuid, p_worker uuid, p_day date)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job jobs;
  v_av availability;
  v_assignment uuid;
  v_count int;
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;

  select * into v_job from jobs where id = p_job for update;
  if v_job.id is null then
    raise exception 'not_found';
  end if;
  if v_job.claimed_by is distinct from auth.uid() and not public.is_super() then
    raise exception 'forbidden';
  end if;
  if v_job.status not in ('claimed', 'matched') then
    raise exception 'invalid_status';
  end if;
  if v_job.job_date < public.today_ub() then
    raise exception 'past_day';
  end if;
  if p_day <> v_job.job_date then
    raise exception 'invalid_day';
  end if;
  if not public.manages_worker(p_worker) then
    raise exception 'forbidden';
  end if;
  if not exists (
    select 1 from worker_skills ws
     where ws.worker_id = p_worker and ws.skill_id = v_job.skill_id
  ) then
    raise exception 'skill_mismatch';
  end if;

  select * into v_av from availability
   where worker_id = p_worker and day = p_day for update;

  if v_av.id is null or v_av.status = 'booked' then
    raise exception 'not_free';
  end if;
  if v_job.job_slot = 'full' and v_av.slot <> 'full' then
    raise exception 'not_free';
  end if;
  if v_job.job_slot <> 'full' and v_av.slot not in (v_job.job_slot, 'full') then
    raise exception 'not_free';
  end if;

  if exists (
    select 1 from assignments
     where job_id = p_job and worker_id = p_worker
       and status in ('offered', 'accepted', 'confirmed', 'completed')
  ) then
    raise exception 'already_offered';
  end if;

  if exists (
    select 1
      from assignments a
      join jobs j2 on j2.id = a.job_id
     where a.worker_id = p_worker
       and j2.job_date = p_day
       and a.status in ('offered', 'accepted', 'confirmed', 'completed')
  ) then
    raise exception 'double_booked';
  end if;

  select count(*) into v_count from assignments
   where job_id = p_job
     and status in ('offered', 'accepted', 'confirmed', 'completed');
  if v_count >= v_job.workers_needed then
    raise exception 'full';
  end if;

  insert into assignments (job_id, worker_id, availability_id, offered_by, status)
  values (p_job, p_worker, v_av.id, auth.uid(), 'offered')
  returning id into v_assignment;

  update availability set status = 'booked' where id = v_av.id;
  update jobs set status = 'matched' where id = p_job and status = 'claimed';

  perform public.push_notification(
    p_worker, 'Шинэ ажлын санал',
    v_job.title || ' — ' || to_char(p_day, 'YYYY-MM-DD') || '. Хариу өгнө үү.',
    '/w/offers'
  );
  perform public.write_audit(auth.uid(), 'assignment.offer', 'assignment', v_assignment,
    jsonb_build_object('job', p_job, 'worker', p_worker, 'day', p_day));
  return v_assignment;
end;
$$;

create or replace function public.respond_assignment(p_assignment uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assignment assignments;
  v_job jobs;
  v_worker_name text;
begin
  if public.app_role() <> 'worker' then
    raise exception 'forbidden';
  end if;

  select * into v_assignment from assignments where id = p_assignment for update;
  if v_assignment.id is null then
    raise exception 'not_found';
  end if;
  if v_assignment.worker_id <> auth.uid() then
    raise exception 'forbidden';
  end if;
  if v_assignment.status <> 'offered' then
    raise exception 'invalid_status';
  end if;

  select * into v_job from jobs where id = v_assignment.job_id;

  update assignments
     set status = case when p_accept then 'accepted' else 'declined' end,
         answered_via = 'app'
   where id = p_assignment;

  if not p_accept then
    perform public.release_day(v_assignment.worker_id, v_job.job_date);
  end if;

  if v_job.claimed_by is not null then
    select full_name into v_worker_name from profiles where id = auth.uid();
    perform public.push_notification(
      v_job.claimed_by,
      case when p_accept then 'Ажилтан зөвшөөрлөө' else 'Ажилтан татгалзлаа' end,
      coalesce(v_worker_name, 'Ажилтан') || ' — ' || v_job.title,
      '/jobs/' || v_job.id
    );
  end if;

  perform public.write_audit(auth.uid(), 'assignment.respond', 'assignment', p_assignment,
    jsonb_build_object('accept', p_accept, 'via', 'app'));
end;
$$;

create or replace function public.record_phone_answer(p_assignment uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assignment assignments;
  v_job jobs;
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;

  select * into v_assignment from assignments where id = p_assignment for update;
  if v_assignment.id is null then
    raise exception 'not_found';
  end if;
  if not public.manages_job(v_assignment.job_id) then
    raise exception 'forbidden';
  end if;
  if v_assignment.status <> 'offered' then
    raise exception 'invalid_status';
  end if;

  select * into v_job from jobs where id = v_assignment.job_id;

  update assignments
     set status = case when p_accept then 'accepted' else 'declined' end,
         answered_via = 'admin_phone'
   where id = p_assignment;

  if not p_accept then
    perform public.release_day(v_assignment.worker_id, v_job.job_date);
  end if;

  perform public.push_notification(
    v_assignment.worker_id,
    'Утсаар хариу бүртгэгдлээ',
    v_job.title || ' — ' || case when p_accept then 'зөвшөөрсөн' else 'татгалзсан' end,
    '/w/offers'
  );
  perform public.write_audit(auth.uid(), 'assignment.phone_answer', 'assignment', p_assignment,
    jsonb_build_object('accept', p_accept));
end;
$$;

create or replace function public.confirm_assignment(p_assignment uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assignment assignments;
  v_job jobs;
  v_worker_name text;
  v_confirmed int;
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;

  select * into v_assignment from assignments where id = p_assignment for update;
  if v_assignment.id is null then
    raise exception 'not_found';
  end if;
  if not public.manages_job(v_assignment.job_id) then
    raise exception 'forbidden';
  end if;
  if v_assignment.status <> 'accepted' then
    raise exception 'invalid_status';
  end if;

  select * into v_job from jobs where id = v_assignment.job_id;
  select full_name into v_worker_name from profiles where id = v_assignment.worker_id;

  update assignments set status = 'confirmed' where id = p_assignment;

  update availability
     set status = 'booked', confirmed_by = auth.uid(), confirmed_at = now()
   where worker_id = v_assignment.worker_id and day = v_job.job_date;

  select count(*) into v_confirmed from assignments
   where job_id = v_job.id and status = 'confirmed';

  if v_confirmed >= v_job.workers_needed then
    update jobs set status = 'confirmed' where id = v_job.id
      and status in ('claimed', 'matched');
  end if;

  perform public.push_notification(
    v_assignment.worker_id, 'Ажил баталгаажлаа',
    v_job.title || '. Хаяг: ' || v_job.address_note, '/w'
  );
  perform public.push_notification(
    v_job.customer_id, 'Ажилтан баталгаажлаа',
    split_part(coalesce(v_worker_name, 'Ажилтан'), ' ', 1) || ' таны ажилд томилогдлоо.',
    '/c/jobs/' || v_job.id
  );
  perform public.write_audit(auth.uid(), 'assignment.confirm', 'assignment', p_assignment,
    jsonb_build_object('job', v_job.id, 'worker', v_assignment.worker_id));
end;
$$;

create or replace function public.complete_assignment(p_assignment uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assignment assignments;
  v_job jobs;
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;

  select * into v_assignment from assignments where id = p_assignment for update;
  if v_assignment.id is null then
    raise exception 'not_found';
  end if;
  if not public.manages_job(v_assignment.job_id) then
    raise exception 'forbidden';
  end if;
  if v_assignment.status <> 'confirmed' then
    raise exception 'invalid_status';
  end if;

  update assignments set status = 'completed' where id = p_assignment;

  select * into v_job from jobs where id = v_assignment.job_id;
  if not exists (
    select 1 from assignments
     where job_id = v_job.id and status in ('offered', 'accepted', 'confirmed')
  ) then
    update jobs set status = 'done' where id = v_job.id and status <> 'cancelled';
    perform public.push_notification(
      v_job.customer_id, 'Ажил дууссан',
      'Таны зар амжилттай дууслаа. Баярлалаа.', '/c/jobs/' || v_job.id
    );
  end if;

  perform public.write_audit(auth.uid(), 'assignment.complete', 'assignment', p_assignment,
    jsonb_build_object('job', v_job.id));
end;
$$;

create or replace function public.cancel_assignment(p_assignment uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assignment assignments;
  v_job jobs;
  v_confirmed int;
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;

  select * into v_assignment from assignments where id = p_assignment for update;
  if v_assignment.id is null then
    raise exception 'not_found';
  end if;
  if not public.manages_job(v_assignment.job_id) then
    raise exception 'forbidden';
  end if;
  if v_assignment.status not in ('offered', 'accepted', 'confirmed') then
    raise exception 'invalid_status';
  end if;

  select * into v_job from jobs where id = v_assignment.job_id;

  update assignments set status = 'cancelled' where id = p_assignment;
  perform public.release_day(v_assignment.worker_id, v_job.job_date);

  select count(*) into v_confirmed from assignments
   where job_id = v_job.id and status = 'confirmed';
  if v_job.status = 'confirmed' and v_confirmed < v_job.workers_needed then
    update jobs set status = 'matched' where id = v_job.id;
  end if;

  perform public.push_notification(
    v_assignment.worker_id, 'Ажил цуцлагдлаа',
    v_job.title || ' ажил цуцлагдлаа.', '/w'
  );
  perform public.write_audit(auth.uid(), 'assignment.cancel', 'assignment', p_assignment,
    jsonb_build_object('job', v_job.id));
end;
$$;

-- ---------------------------------------------------------------- grants

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'claim_job(uuid)', 'release_job(uuid)',
    'confirm_availability(uuid,date,boolean)',
    'set_availability_for_worker(uuid,date,text)',
    'set_my_availability(date,text)',
    'offer_assignment(uuid,uuid,date)',
    'respond_assignment(uuid,boolean)',
    'record_phone_answer(uuid,boolean)',
    'confirm_assignment(uuid)', 'complete_assignment(uuid)',
    'cancel_assignment(uuid)'
  ] loop
    execute format('revoke all on function public.%s from public', fn);
    execute format('grant execute on function public.%s to authenticated', fn);
  end loop;

  foreach fn in array array[
    'write_audit(uuid,text,text,uuid,jsonb)',
    'push_notification(uuid,text,text,text)',
    'release_day(uuid,date)', 'today_ub()'
  ] loop
    execute format('revoke all on function public.%s from public, authenticated, anon', fn);
  end loop;
end;
$$;
