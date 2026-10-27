-- 05_admin_loads.sql — ONE canonical admin-load query + staff-role hardening.
-- Idempotent: safe to run repeatedly.

-- Repair: accounts created by scripts/verify.mjs must never keep a staff role.
-- The fixture pattern is the one verify.mjs writes: verify-<id>-<code>@example.test
-- and the display name "Verify …". A real super admin never matches it.
update profiles p
   set role = 'customer',
       status = 'active'
  from auth.users u
 where u.id = p.id
   and p.role in ('admin', 'super_admin')
   and (u.email like 'verify-%@example.test' or p.full_name like 'Verify %');

-- A staff role may only be granted to a non-staff profile by a super admin
-- (or by a direct database/owner connection, which runs the fixture scripts).
create or replace function public.guard_staff_role_grant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role in ('admin', 'super_admin')
     and old.role not in ('admin', 'super_admin')
     and current_user not in ('postgres', 'supabase_admin', 'service_role')
     and not public.is_super() then
    raise exception 'staff_role_forbidden' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_staff_role_guard on profiles;
create trigger profiles_staff_role_guard before update on profiles
  for each row execute function public.guard_staff_role_grant();

/**
 * One row per active admin, grouped by profile id (no join duplicates), with
 * the worker load and last login. Super-admin only. Every staff screen that
 * shows load reads this function instead of ad-hoc joins.
 */
create or replace function public.admin_loads()
returns table (id uuid, full_name text, worker_count int, last_login timestamptz)
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
    select p.id,
           p.full_name,
           count(wd.worker_id)::int as worker_count,
           u.last_sign_in_at as last_login
      from profiles p
      join auth.users u on u.id = p.id
      left join worker_details wd on wd.admin_id = p.id
     where p.role = 'admin'
       and p.status = 'active'
     group by p.id, p.full_name, u.last_sign_in_at
     order by count(wd.worker_id) desc, p.full_name;
end;
$$;

revoke all on function public.admin_loads() from public;
grant execute on function public.admin_loads() to authenticated;
