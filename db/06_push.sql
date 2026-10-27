-- 06_push.sql — Web Push subscriptions, the outbox queue and worker push status.
-- Idempotent: safe to run repeatedly. The sender role is created by
-- scripts/create-push-role.mjs (it needs the DB owner to create a login role).

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_success_at timestamptz,
  failure_count int not null default 0 check (failure_count >= 0)
);

create index if not exists push_subscriptions_user_idx on push_subscriptions (user_id);

create table if not exists push_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  url text not null default '/home',
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  attempts int not null default 0 check (attempts >= 0),
  last_error text
);

create index if not exists push_outbox_pending_idx
  on push_outbox (created_at) where sent_at is null;

alter table push_subscriptions enable row level security;
alter table push_outbox enable row level security;

-- A user manages only their own devices; staff (admins included) cannot read
-- anybody's endpoint or keys. The sender role gets its own policies in
-- scripts/create-push-role.mjs.
revoke all on table push_subscriptions from anon, authenticated;
revoke all on table push_outbox from anon, authenticated;
grant select, insert, delete on push_subscriptions to authenticated;

drop policy if exists push_subscriptions_select_own on push_subscriptions;
create policy push_subscriptions_select_own on push_subscriptions for select to authenticated
  using (user_id = auth.uid());

drop policy if exists push_subscriptions_insert_own on push_subscriptions;
create policy push_subscriptions_insert_own on push_subscriptions for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists push_subscriptions_delete_own on push_subscriptions;
create policy push_subscriptions_delete_own on push_subscriptions for delete to authenticated
  using (user_id = auth.uid());

-- push_outbox has RLS on and NO user policies: no user or staff member can read
-- or write it through the API. Only SECURITY DEFINER code and the restricted
-- push_sender role touch it.

-- One outbox row per notification, but only for a user who has a subscription.
create or replace function public.enqueue_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from push_subscriptions s where s.user_id = new.user_id) then
    insert into push_outbox (user_id, title, body, url)
    values (new.user_id, new.title, coalesce(new.body, ''), coalesce(new.link, '/home'));
  end if;
  return new;
end;
$$;

drop trigger if exists notifications_enqueue_push on notifications;
create trigger notifications_enqueue_push after insert on notifications
  for each row execute function public.enqueue_push();

-- A boolean for the staff who manages this worker: never endpoints or keys.
create or replace function public.worker_push_status(p_worker_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from push_subscriptions s
     where s.user_id = p_worker_id
       and s.failure_count < 5
  )
  and public.manages_worker(p_worker_id);
$$;

revoke all on function public.worker_push_status(uuid) from public;
grant execute on function public.worker_push_status(uuid) to authenticated;
