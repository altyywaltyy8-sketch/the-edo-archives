-- THE EDO ARCHIVE — SHARED GUESTBOOK
-- Run this ONCE in Supabase Dashboard > SQL Editor > New query > Run.
-- Does not modify existing investigators, evidence, assignments, or progress.

create table if not exists public.guestbook_entries (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  codename text not null check (char_length(codename) between 2 and 30),
  message text not null check (char_length(btrim(message)) between 1 and 280),
  created_at timestamptz not null default now()
);

create index if not exists guestbook_entries_created_idx on public.guestbook_entries(created_at desc);
create index if not exists guestbook_entries_user_idx on public.guestbook_entries(user_id,created_at desc);

alter table public.guestbook_entries enable row level security;

-- Authenticated investigators can read the shared messages. No client-side
-- direct INSERT/UPDATE/DELETE is permitted: posting goes through an RPC.
revoke all on public.guestbook_entries from anon;
revoke all on public.guestbook_entries from authenticated;
grant select on public.guestbook_entries to authenticated;

drop policy if exists "Investigators read shared guestbook" on public.guestbook_entries;
create policy "Investigators read shared guestbook"
  on public.guestbook_entries for select to authenticated
  using (auth.uid() is not null);

create or replace function public.post_guestbook_message(p_message text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_name text;
  v_message text := btrim(p_message);
begin
  if v_user is null then
    raise exception 'Sign in to post a message.';
  end if;
  if v_message is null or char_length(v_message) < 1 or char_length(v_message) > 280 then
    raise exception 'Messages must be between 1 and 280 characters.';
  end if;
  select i.codename into v_name from public.investigators i where i.user_id = v_user;
  if v_name is null then
    raise exception 'Investigator profile is not ready. Refresh your investigator desk.';
  end if;
  -- Serializes posts from the same account to enforce the one-minute limit.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_user::text));
  if exists (
    select 1 from public.guestbook_entries g
    where g.user_id = v_user and g.created_at > now() - interval '60 seconds'
  ) then
    raise exception 'Please wait one minute between guestbook messages.';
  end if;
  insert into public.guestbook_entries (user_id, codename, message)
  values (v_user, v_name, v_message);
end;
$$;

revoke all on function public.post_guestbook_message(text) from public;
revoke all on function public.post_guestbook_message(text) from anon;
grant execute on function public.post_guestbook_message(text) to authenticated;
