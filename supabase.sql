-- Run once in Supabase SQL Editor. No service-role keys in the browser.
create table if not exists public.investigators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  codename text not null check (char_length(codename) between 2 and 30),
  created_at timestamptz not null default now()
);
create table if not exists public.evidence (
  id text primary key,
  title text not null,
  category text not null,
  content text not null,
  published boolean not null default false
);
create table if not exists public.assignments (
  user_id uuid not null references auth.users(id) on delete cascade,
  evidence_id text not null references public.evidence(id),
  assigned_at timestamptz not null default now(),
  primary key (user_id,evidence_id)
);
create table if not exists public.progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  puzzle_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id,puzzle_id)
);
create index if not exists assignments_user_idx on public.assignments(user_id);
alter table public.investigators enable row level security;
alter table public.evidence enable row level security;
alter table public.assignments enable row level security;
alter table public.progress enable row level security;
create policy "Read own investigator" on public.investigators for select to authenticated using (user_id=auth.uid());
create policy "Create own investigator" on public.investigators for insert to authenticated with check (user_id=auth.uid());
create policy "Edit own investigator" on public.investigators for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
-- Evidence contents are accessible only through the authenticated RPC below.
create policy "Read own assignments" on public.assignments for select to authenticated using (user_id=auth.uid());
create policy "Read own progress" on public.progress for select to authenticated using (user_id=auth.uid());
-- Initial exclusive evidence variants. Fictional teasers; no later-story spoilers.
insert into public.evidence (id,title,category,content,published) values
 ('E-A','Undelivered correspondence','CORRESPONDENCE','The envelope bears Eloise Rosso’s name. Its return address has been deliberately removed. K.R. note: Why keep the envelope and discard the letter?',true),
 ('E-B','Unidentified facility mark','FACILITY','The photocopy shows a corridor sign with the final two characters missing. K.R. note: I have seen this emblem before, but not in a research directory.',true),
 ('E-C','Conflicting time entry','CHRONOLOGY','Two copies of the same access log record different arrival times for A.Z.E. K.R. note: The signatures match. The timestamps do not.',true)
on conflict (id) do nothing;
-- RPC: server assigns exactly one of the published initial variants per account.
create or replace function public.claim_initial_evidence()
returns table(id text,title text,category text,content text)
language plpgsql security definer set search_path = '' as $$
declare chosen text;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if not exists (select 1 from public.investigators where user_id=auth.uid()) then
    raise exception 'Create investigator profile first';
  end if;
  -- Serialize concurrent claims by this user; prevents double-claim rerolls.
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  select a.evidence_id into chosen from public.assignments a
    where a.user_id=auth.uid() and a.evidence_id in ('E-A','E-B','E-C') limit 1;
  if chosen is null then
    select e.id into chosen from public.evidence e
    where e.id in ('E-A','E-B','E-C') and e.published=true order by random() limit 1;
    if chosen is null then raise exception 'No published evidence available'; end if;
    insert into public.assignments(user_id,evidence_id) values(auth.uid(),chosen);
  end if;
  return query select e.id,e.title,e.category,e.content from public.evidence e
    where e.id=chosen and e.published=true;
end $$;
-- RPC for future manually assigned evidence; only returns a user's own published items.
create or replace function public.my_evidence()
returns table(id text,title text,category text,content text)
language sql security definer set search_path = '' stable as $$
  select e.id,e.title,e.category,e.content from public.evidence e
  join public.assignments a on a.evidence_id=e.id
  where a.user_id=auth.uid() and e.published=true order by e.id;
$$;
-- Record a puzzle completion without trusting client-provided 'solved' flags.
-- For now the introductory puzzle is checked server-side.
create or replace function public.submit_intro_key(candidate text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if upper(regexp_replace(coalesce(candidate,''),'[^a-zA-Z0-9]','','g')) <> 'AZE' then return false; end if;
  insert into public.progress(user_id,puzzle_id) values(auth.uid(),'INTRO-004') on conflict do nothing;
  return true;
end $$;
revoke all on function public.claim_initial_evidence() from public;
revoke all on function public.my_evidence() from public;
revoke all on function public.submit_intro_key(text) from public;
grant execute on function public.claim_initial_evidence() to authenticated;
grant execute on function public.my_evidence() to authenticated;
grant execute on function public.submit_intro_key(text) to authenticated;

grant execute on function public.my_evidence() to authenticated;
grant execute on function public.submit_intro_key(text) to authenticated;
