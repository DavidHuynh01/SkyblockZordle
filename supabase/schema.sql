-- SkyblockZordle — Supabase schema.
-- Paste this into the Supabase dashboard → SQL Editor → Run.
-- (Safe to re-run; uses IF NOT EXISTS / OR REPLACE where possible.)

-- ─────────────────────────── Tables ───────────────────────────

-- One row per logged-in Discord user.
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  username   text,
  avatar_url text,
  updated_at timestamptz default now()
);

-- Per-user cumulative stats (mirrors src/utils/stats.js shape).
create table if not exists public.user_stats (
  user_id             uuid primary key references public.profiles(id) on delete cascade,
  played              int  not null default 0,
  wins                int  not null default 0,
  current_streak      int  not null default 0,
  max_streak          int  not null default 0,
  last_won_puzzle     int,
  last_recorded_puzzle int,
  dist                jsonb not null default '{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0}',
  updated_at          timestamptz default now()
);

-- One score per user per day (the daily leaderboard).
create table if not exists public.scores (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  date          date not null,
  puzzle_number int  not null,
  guesses       int  not null check (guesses between 1 and 8),
  won           boolean not null,
  time_ms       int  not null default 0,
  created_at    timestamptz default now(),
  unique (user_id, date)
);

-- ─────────────────────── Row Level Security ───────────────────────

alter table public.profiles   enable row level security;
alter table public.user_stats enable row level security;
alter table public.scores     enable row level security;

-- profiles: anyone can read (needed for leaderboard names); only you edit yours.
drop policy if exists "profiles read"   on public.profiles;
drop policy if exists "profiles insert" on public.profiles;
drop policy if exists "profiles update" on public.profiles;
create policy "profiles read"   on public.profiles for select using (true);
create policy "profiles insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update" on public.profiles for update using (auth.uid() = id);

-- user_stats: only you can read/write your own.
drop policy if exists "stats read"   on public.user_stats;
drop policy if exists "stats insert" on public.user_stats;
drop policy if exists "stats update" on public.user_stats;
create policy "stats read"   on public.user_stats for select using (auth.uid() = user_id);
create policy "stats insert" on public.user_stats for insert with check (auth.uid() = user_id);
create policy "stats update" on public.user_stats for update using (auth.uid() = user_id);

-- scores: anyone can read (leaderboard); only you write your own.
drop policy if exists "scores read"   on public.scores;
drop policy if exists "scores insert" on public.scores;
drop policy if exists "scores update" on public.scores;
create policy "scores read"   on public.scores for select using (true);
create policy "scores insert" on public.scores for insert with check (auth.uid() = user_id);
create policy "scores update" on public.scores for update using (auth.uid() = user_id);

-- ──────────── Auto-create a profile on Discord signup ────────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'user_name',
      'Player'
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────── Global stats RPC ───────────────────────

create or replace function public.global_stats()
returns json language sql stable as $$
  select json_build_object(
    'played',      (select count(*) from public.scores),
    'wins',        (select count(*) from public.scores where won),
    'winPercent',  coalesce(round(100.0 * (select count(*) from public.scores where won)
                     / nullif((select count(*) from public.scores), 0)), 0),
    'todayPlayers',(select count(*) from public.scores where date = (now() at time zone 'utc')::date),
    'todaySolved', (select count(*) from public.scores where won and date = (now() at time zone 'utc')::date),
    'dist',        (select coalesce(json_object_agg(g, c), '{}'::json)
                     from (select guesses g, count(*) c from public.scores where won group by guesses) t)
  );
$$;
