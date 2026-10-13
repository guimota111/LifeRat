-- LifeRats — schema inicial (Fase 1)
-- Convenções: nomes em inglês, timestamps em UTC, datas locais em `local_date`.

create extension if not exists "pgcrypto";

-- ───────────────────────────── enums ─────────────────────────────

create type visibility as enum ('private', 'friends', 'public');
create type plan as enum ('free', 'pro');
create type friendship_status as enum ('pending', 'accepted', 'blocked');
create type habit_kind as enum ('bool', 'counter', 'duration', 'quantity', 'catalog', 'integration');
create type goal_window as enum ('day', 'week', 'month');
create type frequency_kind as enum ('daily', 'times_per_week', 'weekdays', 'every_n_days');
create type entry_source as enum ('manual', 'healthkit', 'health_connect', 'strava', 'shortcut');
create type club_role as enum ('owner', 'admin', 'member');
create type challenge_state as enum ('draft', 'active', 'finished');
create type proof_kind as enum ('none', 'photo_optional', 'photo_required');
create type feed_kind as enum ('entry', 'item_completed', 'record', 'challenge_joined', 'challenge_won');

-- ───────────────────────────── helpers ─────────────────────────────

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ───────────────────────────── profiles ─────────────────────────────

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  handle        text unique check (handle ~ '^[a-z0-9_]{3,24}$'),
  display_name  text not null default '',
  avatar_url    text,
  timezone      text not null default 'UTC',
  locale        text not null default 'pt-BR',
  visibility    visibility not null default 'friends',
  plan          plan not null default 'free',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger profiles_updated_at before update on profiles for each row execute function set_updated_at();

-- Cria o perfil junto com o usuário do Auth.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, locale, timezone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'locale', 'pt-BR'),
    coalesce(new.raw_user_meta_data ->> 'timezone', 'UTC')
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ───────────────────────────── friendships ─────────────────────────────

create table friendships (
  requester_id  uuid not null references profiles(id) on delete cascade,
  addressee_id  uuid not null references profiles(id) on delete cascade,
  status        friendship_status not null default 'pending',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);
create index friendships_addressee_idx on friendships(addressee_id);
create trigger friendships_updated_at before update on friendships for each row execute function set_updated_at();

create or replace function is_friend(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from friendships
    where status = 'accepted'
      and ((requester_id = a and addressee_id = b) or (requester_id = b and addressee_id = a))
  );
$$;

-- ───────────────────────────── habits ─────────────────────────────

create table habits (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references profiles(id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 60),
  icon            text not null default 'circle',
  color           text not null default '#6366f1',
  kind            habit_kind not null,
  unit            text,                       -- 'ml', 'min', 'pages', 'km'...; null para bool
  goal_value      numeric,                    -- null para bool (meta = fazer)
  goal_window     goal_window not null default 'day',
  frequency_kind  frequency_kind not null default 'daily',
  frequency_n     int,                        -- times_per_week:n | every_n_days:n
  frequency_days  int[],                      -- weekdays: 0=dom .. 6=sáb
  step_value      numeric not null default 1, -- incremento do quick log (+250 ml, +5 páginas)
  negative        boolean not null default false,
  visibility      visibility not null default 'friends',
  integration_metric text,                    -- 'steps', 'distance_km'... quando kind = integration
  sort_order      int not null default 0,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (frequency_kind <> 'times_per_week' or frequency_n between 1 and 7),
  check (frequency_kind <> 'every_n_days' or frequency_n >= 2),
  check (frequency_kind <> 'weekdays' or frequency_days is not null)
);
create index habits_owner_idx on habits(owner_id) where archived_at is null;
create trigger habits_updated_at before update on habits for each row execute function set_updated_at();

create table habit_entries (
  id            uuid primary key default gen_random_uuid(),
  habit_id      uuid not null references habits(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  occurred_at   timestamptz not null default now(),
  local_date    date not null,
  value         numeric not null default 1,
  source        entry_source not null default 'manual',
  external_id   text,
  note          text,
  photo_path    text,
  created_at    timestamptz not null default now(),
  unique (habit_id, source, external_id)
);
create index habit_entries_habit_date_idx on habit_entries(habit_id, local_date);
create index habit_entries_user_date_idx on habit_entries(user_id, local_date);

-- ───────────────────────────── métricas de integração ─────────────────────────────

create table daily_metrics (
  user_id         uuid not null references profiles(id) on delete cascade,
  local_date      date not null,
  source          entry_source not null,
  steps           int,
  distance_km     numeric,
  active_minutes  int,
  sleep_minutes   int,
  updated_at      timestamptz not null default now(),
  primary key (user_id, local_date, source)
);

-- Uma linha por dia: o maior valor entre as fontes (relógio e telefone não se somam).
create view daily_metrics_resolved as
  select user_id, local_date,
         max(steps) as steps,
         max(distance_km) as distance_km,
         max(active_minutes) as active_minutes,
         max(sleep_minutes) as sleep_minutes
  from daily_metrics
  group by user_id, local_date;

create table activities (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  type          text not null,                -- run, ride, walk, swim, workout...
  started_at    timestamptz not null,
  local_date    date not null,
  duration_s    int not null,
  distance_km   numeric,
  avg_speed_kmh numeric,
  avg_hr        int,
  calories      int,
  source        entry_source not null,
  external_id   text,
  created_at    timestamptz not null default now(),
  unique (user_id, source, external_id)
);
create index activities_user_date_idx on activities(user_id, local_date);

-- ───────────────────────────── clubes ─────────────────────────────

create or replace function gen_invite_code() returns text
language sql volatile as $$
  select upper(substr(encode(gen_random_bytes(6), 'base64'), 1, 8));
$$;

create table clubs (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references profiles(id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 60),
  description   text not null default '',
  cover_path    text,
  is_public     boolean not null default false,
  invite_code   text not null unique default gen_invite_code(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger clubs_updated_at before update on clubs for each row execute function set_updated_at();

create table club_members (
  club_id     uuid not null references clubs(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  role        club_role not null default 'member',
  joined_at   timestamptz not null default now(),
  primary key (club_id, user_id)
);
create index club_members_user_idx on club_members(user_id);

create or replace function is_club_member(club uuid, who uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from club_members where club_id = club and user_id = who);
$$;

create or replace function is_club_admin(club uuid, who uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from club_members where club_id = club and user_id = who and role in ('owner', 'admin'));
$$;

-- O dono entra como owner automaticamente.
create or replace function handle_new_club() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into club_members (club_id, user_id, role) values (new.id, new.owner_id, 'owner');
  return new;
end $$;
create trigger on_club_created after insert on clubs for each row execute function handle_new_club();

-- Entrar por código de convite (o código não é legível via RLS para não-membros).
create or replace function join_club(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  target uuid;
begin
  select id into target from clubs where invite_code = upper(trim(code));
  if target is null then
    raise exception 'invalid_invite_code';
  end if;
  insert into club_members (club_id, user_id) values (target, auth.uid())
    on conflict do nothing;
  return target;
end $$;

-- ───────────────────────────── desafios ─────────────────────────────
-- Fase 1: spec = { "metric": "steps" | "distance_km" | "habit", "unit": "min", "aggregate": "sum", "win": "highest" }
-- Quando metric = 'habit', cada participante aponta qual hábito seu conta (challenge_participants.habit_id).

create table challenges (
  id              uuid primary key default gen_random_uuid(),
  club_id         uuid not null references clubs(id) on delete cascade,
  creator_id      uuid not null references profiles(id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 80),
  description     text not null default '',
  starts_on       date not null,
  ends_on         date not null,
  spec            jsonb not null,
  proof           proof_kind not null default 'none',
  verified_only   boolean not null default false,
  teams           boolean not null default false,
  bet             text,
  state           challenge_state not null default 'active',
  winner_id       uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (ends_on >= starts_on),
  check (spec ? 'metric' and spec ->> 'metric' in ('steps', 'distance_km', 'habit'))
);
create index challenges_club_idx on challenges(club_id);
create trigger challenges_updated_at before update on challenges for each row execute function set_updated_at();

create table challenge_participants (
  challenge_id  uuid not null references challenges(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  habit_id      uuid references habits(id) on delete set null,
  team          text,
  handicap_mult numeric not null default 1,
  handicap_add  numeric not null default 0,
  joined_at     timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

-- Ranking calculado na hora. Security definer: membros veem a pontuação sem ler os registros brutos.
create or replace function challenge_leaderboard(challenge uuid)
returns table (
  user_id uuid, display_name text, avatar_url text, team text,
  raw_score numeric, score numeric, reached_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare
  c challenges%rowtype;
  metric text;
begin
  select * into c from challenges where id = challenge;
  if c.id is null or not is_club_member(c.club_id, auth.uid()) then
    return;
  end if;
  metric := c.spec ->> 'metric';

  return query
  with totals as (
    select p.user_id,
           case metric
             when 'steps' then (
               select coalesce(sum(m.steps), 0) from daily_metrics_resolved m
               where m.user_id = p.user_id and m.local_date between c.starts_on and c.ends_on)
             when 'distance_km' then (
               select coalesce(sum(m.distance_km), 0) from daily_metrics_resolved m
               where m.user_id = p.user_id and m.local_date between c.starts_on and c.ends_on)
             else (
               select coalesce(sum(e.value), 0) from habit_entries e
               where e.habit_id = p.habit_id and e.local_date between c.starts_on and c.ends_on
                 and (not c.verified_only or e.source <> 'manual'))
           end as raw_score,
           case metric
             when 'habit' then (
               select max(e.occurred_at) from habit_entries e
               where e.habit_id = p.habit_id and e.local_date between c.starts_on and c.ends_on)
             else null
           end as reached_at
    from challenge_participants p
    where p.challenge_id = challenge
  )
  select t.user_id, pr.display_name, pr.avatar_url, p.team,
         t.raw_score,
         t.raw_score * p.handicap_mult + p.handicap_add as score,
         t.reached_at
  from totals t
  join challenge_participants p on p.challenge_id = challenge and p.user_id = t.user_id
  join profiles pr on pr.id = t.user_id
  order by score desc, reached_at asc nulls last;
end $$;

-- ───────────────────────────── feed ─────────────────────────────

create table feed_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  kind        feed_kind not null,
  visibility  visibility not null default 'friends',
  habit_id    uuid references habits(id) on delete cascade,
  club_id     uuid references clubs(id) on delete cascade,
  payload     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index feed_events_user_idx on feed_events(user_id, created_at desc);
create index feed_events_created_idx on feed_events(created_at desc);

create table reactions (
  event_id    uuid not null references feed_events(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  emoji       text not null check (char_length(emoji) <= 8),
  created_at  timestamptz not null default now(),
  primary key (event_id, user_id, emoji)
);

create or replace function can_see_event(author uuid, vis visibility, club uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select author = auth.uid()
      or vis = 'public'
      or (vis = 'friends' and is_friend(auth.uid(), author))
      or (club is not null and is_club_member(club, auth.uid()));
$$;

-- ───────────────────────────── RLS ─────────────────────────────

alter table profiles enable row level security;
alter table friendships enable row level security;
alter table habits enable row level security;
alter table habit_entries enable row level security;
alter table daily_metrics enable row level security;
alter table activities enable row level security;
alter table clubs enable row level security;
alter table club_members enable row level security;
alter table challenges enable row level security;
alter table challenge_participants enable row level security;
alter table feed_events enable row level security;
alter table reactions enable row level security;

-- profiles: todo mundo autenticado vê o básico; só o dono edita.
create policy profiles_select on profiles for select to authenticated using (true);
create policy profiles_update on profiles for update to authenticated using (id = auth.uid());

-- friendships
create policy friendships_select on friendships for select to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());
create policy friendships_insert on friendships for insert to authenticated
  with check (requester_id = auth.uid() and status = 'pending');
create policy friendships_update on friendships for update to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());
create policy friendships_delete on friendships for delete to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- habits: visibilidade do hábito é a fonte da verdade.
create policy habits_select on habits for select to authenticated
  using (owner_id = auth.uid()
      or visibility = 'public'
      or (visibility = 'friends' and is_friend(auth.uid(), owner_id)));
create policy habits_write on habits for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- habit_entries: herdam a visibilidade do hábito.
create policy habit_entries_select on habit_entries for select to authenticated
  using (user_id = auth.uid()
      or exists (select 1 from habits h where h.id = habit_id
                 and (h.visibility = 'public' or (h.visibility = 'friends' and is_friend(auth.uid(), h.owner_id)))));
create policy habit_entries_write on habit_entries for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from habits h where h.id = habit_id and h.owner_id = auth.uid()));

-- métricas e treinos: só o dono (desafios leem via função security definer).
create policy daily_metrics_own on daily_metrics for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy activities_own on activities for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- clubs
create policy clubs_select on clubs for select to authenticated
  using (is_public or is_club_member(id, auth.uid()));
create policy clubs_insert on clubs for insert to authenticated with check (owner_id = auth.uid());
create policy clubs_update on clubs for update to authenticated using (is_club_admin(id, auth.uid()));
create policy clubs_delete on clubs for delete to authenticated using (owner_id = auth.uid());

-- club_members: membros veem uns aos outros; entrada só via join_club(); saída própria ou por admin.
create policy club_members_select on club_members for select to authenticated
  using (is_club_member(club_id, auth.uid()));
create policy club_members_delete on club_members for delete to authenticated
  using (user_id = auth.uid() or is_club_admin(club_id, auth.uid()));
create policy club_members_update on club_members for update to authenticated
  using (is_club_admin(club_id, auth.uid()));

-- challenges
create policy challenges_select on challenges for select to authenticated
  using (is_club_member(club_id, auth.uid()));
create policy challenges_insert on challenges for insert to authenticated
  with check (creator_id = auth.uid() and is_club_admin(club_id, auth.uid()));
create policy challenges_update on challenges for update to authenticated
  using (is_club_admin(club_id, auth.uid()));
create policy challenges_delete on challenges for delete to authenticated
  using (is_club_admin(club_id, auth.uid()));

-- challenge_participants
create policy challenge_participants_select on challenge_participants for select to authenticated
  using (exists (select 1 from challenges c where c.id = challenge_id and is_club_member(c.club_id, auth.uid())));
create policy challenge_participants_insert on challenge_participants for insert to authenticated
  with check (user_id = auth.uid()
    and exists (select 1 from challenges c where c.id = challenge_id and c.state = 'active' and is_club_member(c.club_id, auth.uid()))
    and (habit_id is null or exists (select 1 from habits h where h.id = habit_id and h.owner_id = auth.uid())));
create policy challenge_participants_update on challenge_participants for update to authenticated
  using (user_id = auth.uid()
      or exists (select 1 from challenges c where c.id = challenge_id and is_club_admin(c.club_id, auth.uid())));
create policy challenge_participants_delete on challenge_participants for delete to authenticated
  using (user_id = auth.uid());

-- feed
create policy feed_events_select on feed_events for select to authenticated using (can_see_event(user_id, visibility, club_id));
create policy feed_events_insert on feed_events for insert to authenticated with check (user_id = auth.uid());
create policy feed_events_delete on feed_events for delete to authenticated using (user_id = auth.uid());

create policy reactions_select on reactions for select to authenticated
  using (exists (select 1 from feed_events e where e.id = event_id and can_see_event(e.user_id, e.visibility, e.club_id)));
create policy reactions_insert on reactions for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from feed_events e where e.id = event_id and can_see_event(e.user_id, e.visibility, e.club_id)));
create policy reactions_delete on reactions for delete to authenticated using (user_id = auth.uid());

-- ───────────────────────────── storage ─────────────────────────────

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true), ('proofs', 'proofs', false)
  on conflict do nothing;

create policy avatars_read on storage.objects for select using (bucket_id = 'avatars');
create policy avatars_write on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy proofs_own on storage.objects for all to authenticated
  using (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);
