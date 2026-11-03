-- Pixel Ancients avatars: run this once in Supabase > SQL Editor.
-- Anyone can see avatars; a logged-in player can only create or change the row for their own Discord account.

create table if not exists public.avatars (
  discord_id text primary key,
  loadout    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint loadout_is_small_object check (jsonb_typeof(loadout) = 'object' and pg_column_size(loadout) < 2000)
);

-- The Discord ID of whoever is logged in, read from Supabase's own identity records
-- (players can't edit these, unlike their profile metadata).
create or replace function public.my_discord_id()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select i.provider_id
  from auth.identities i
  where i.user_id = auth.uid() and i.provider = 'discord'
  limit 1
$$;

revoke all on function public.my_discord_id() from public;
grant execute on function public.my_discord_id() to authenticated;

alter table public.avatars enable row level security;

drop policy if exists "Avatars are public" on public.avatars;
create policy "Avatars are public"
  on public.avatars for select
  using (true);

drop policy if exists "Players create their own avatar" on public.avatars;
create policy "Players create their own avatar"
  on public.avatars for insert to authenticated
  with check (discord_id = public.my_discord_id());

drop policy if exists "Players update their own avatar" on public.avatars;
create policy "Players update their own avatar"
  on public.avatars for update to authenticated
  using (discord_id = public.my_discord_id())
  with check (discord_id = public.my_discord_id());

-- Taunts: at most 40 characters. The website also checks every taunt for slurs before showing it.
do $$ begin
  alter table public.avatars add constraint taunt_is_short
    check (char_length(coalesce(loadout ->> 'taunt', '')) <= 40);
exception when duplicate_object then null; end $$;


-- =====================================================================
-- Guilds and Fight Night. Run this part too (safe to run again).
-- Players change guilds only through the functions below, which check every rule.
-- =====================================================================

create extension if not exists pgcrypto;

create table if not exists public.guilds (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 3 and 24),
  tag         text not null check (tag ~ '^[A-Za-z0-9]{2,4}$'),
  crest       jsonb not null default '{}'::jsonb check (jsonb_typeof(crest) = 'object' and pg_column_size(crest) < 300),
  captain     text not null,
  recruiting  boolean not null default true,
  created_at  timestamptz not null default now()
);
create unique index if not exists guilds_name_key on public.guilds (lower(name));
create unique index if not exists guilds_tag_key on public.guilds (lower(tag));

create table if not exists public.guild_members (
  discord_id   text primary key,                         -- one guild per player
  guild_id     uuid not null references public.guilds(id) on delete cascade,
  position     int check (position between 1 and 5),     -- 1-2 front line, 3-5 back line
  joined_at    timestamptz not null default now(),
  prev_left_at timestamptz                                -- when they last left another guild (switch cooldown)
);

create table if not exists public.guild_invites (          -- secret join codes, visible to captains only
  guild_id uuid primary key references public.guilds(id) on delete cascade,
  code     text not null unique
);

create table if not exists public.guild_requests (
  guild_id   uuid not null references public.guilds(id) on delete cascade,
  discord_id text not null,
  created_at timestamptz not null default now(),
  primary key (guild_id, discord_id)
);

create table if not exists public.guild_log (                -- who left which guild when
  discord_id text not null,
  guild_id   uuid,
  left_at    timestamptz not null default now()
);

create table if not exists public.fight_snapshots (          -- rosters + gear frozen at each Fight Night
  id   text primary key,                                     -- local date, e.g. 2026-11-07
  at   timestamptz not null,
  data jsonb not null
);

alter table public.guilds          enable row level security;
alter table public.guild_members   enable row level security;
alter table public.guild_invites   enable row level security;
alter table public.guild_requests  enable row level security;
alter table public.guild_log       enable row level security;
alter table public.fight_snapshots enable row level security;

drop policy if exists "Guilds are public" on public.guilds;
create policy "Guilds are public" on public.guilds for select using (true);
drop policy if exists "Rosters are public" on public.guild_members;
create policy "Rosters are public" on public.guild_members for select using (true);
drop policy if exists "Fight Nights are public" on public.fight_snapshots;
create policy "Fight Nights are public" on public.fight_snapshots for select using (true);
drop policy if exists "Requests seen by requester and captain" on public.guild_requests;
create policy "Requests seen by requester and captain" on public.guild_requests for select to authenticated
  using (discord_id = public.my_discord_id()
         or exists (select 1 from public.guilds g where g.id = guild_id and g.captain = public.my_discord_id()));
-- guild_invites and guild_log: no direct access at all; only the functions below read them.

create or replace function public._me() returns text language plpgsql stable security definer set search_path = public as $$
declare d text := public.my_discord_id();
begin
  if d is null then raise exception 'Log in with Discord first.'; end if;
  return d;
end $$;

create or replace function public._my_guild() returns uuid language sql stable security definer set search_path = public as $$
  select guild_id from public.guild_members where discord_id = public.my_discord_id()
$$;

create or replace function public._add_member(p_guild uuid, p_discord text) returns void language plpgsql security definer set search_path = public as $$
declare n int; free int;
begin
  perform 1 from public.guilds where id = p_guild for update;          -- one join at a time per guild
  select count(*) into n from public.guild_members where guild_id = p_guild;
  if n >= 5 then raise exception 'That guild is full (5 members).'; end if;
  select min(p) into free from generate_series(1, 5) p where p not in (select coalesce(position, 0) from public.guild_members where guild_id = p_guild);
  insert into public.guild_members (discord_id, guild_id, position, prev_left_at)
    values (p_discord, p_guild, free, (select max(left_at) from public.guild_log where discord_id = p_discord));
  delete from public.guild_requests where discord_id = p_discord;
end $$;

create or replace function public._remove_member(p_discord text) returns void language plpgsql security definer set search_path = public as $$
declare g uuid; cap text; heir text;
begin
  select guild_id into g from public.guild_members where discord_id = p_discord;
  if g is null then return; end if;
  insert into public.guild_log (discord_id, guild_id) values (p_discord, g);
  delete from public.guild_members where discord_id = p_discord;
  select captain into cap from public.guilds where id = g;
  if cap = p_discord then
    select discord_id into heir from public.guild_members where guild_id = g order by joined_at limit 1;
    if heir is null then delete from public.guilds where id = g;        -- last one out disbands the guild
    else update public.guilds set captain = heir where id = g; end if;
  end if;
end $$;

create or replace function public.create_guild(p_name text, p_tag text, p_crest jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare me text := public._me(); g uuid;
begin
  if public._my_guild() is not null then raise exception 'Leave your current guild first.'; end if;
  insert into public.guilds (name, tag, crest, captain) values (trim(p_name), upper(trim(p_tag)), coalesce(p_crest, '{}'::jsonb), me) returning id into g;
  insert into public.guild_invites (guild_id, code) values (g, encode(gen_random_bytes(6), 'hex'));
  perform public._add_member(g, me);
  return g;
end $$;

create or replace function public.update_guild(p_name text, p_tag text, p_crest jsonb, p_recruiting boolean) returns void
language plpgsql security definer set search_path = public as $$
declare me text := public._me(); g uuid := public._my_guild();
begin
  if g is null or not exists (select 1 from public.guilds where id = g and captain = me) then raise exception 'Only the captain can do that.'; end if;
  update public.guilds set name = trim(p_name), tag = upper(trim(p_tag)), crest = coalesce(p_crest, crest), recruiting = coalesce(p_recruiting, recruiting) where id = g;
end $$;

create or replace function public.my_invite_code(p_new boolean default false) returns text
language plpgsql security definer set search_path = public as $$
declare me text := public._me(); g uuid := public._my_guild(); c text;
begin
  if g is null or not exists (select 1 from public.guilds where id = g and captain = me) then raise exception 'Only the captain can do that.'; end if;
  if p_new then update public.guild_invites set code = encode(gen_random_bytes(6), 'hex') where guild_id = g; end if;
  select code into c from public.guild_invites where guild_id = g;
  return c;
end $$;

create or replace function public.join_guild(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare me text := public._me(); g uuid;
begin
  if public._my_guild() is not null then raise exception 'Leave your current guild first.'; end if;
  select guild_id into g from public.guild_invites where code = lower(trim(p_code));
  if g is null then raise exception 'That invite link is out of date. Ask the captain for a new one.'; end if;
  perform public._add_member(g, me);
  return g;
end $$;

create or replace function public.request_join(p_guild uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me text := public._me();
begin
  if public._my_guild() is not null then raise exception 'Leave your current guild first.'; end if;
  if not exists (select 1 from public.guilds where id = p_guild and recruiting) then raise exception 'That guild isn''t recruiting.'; end if;
  if (select count(*) from public.guild_requests where discord_id = me) >= 3 then raise exception 'You can have 3 requests open at a time.'; end if;
  insert into public.guild_requests (guild_id, discord_id) values (p_guild, me) on conflict do nothing;
end $$;

create or replace function public.cancel_request(p_guild uuid) returns void
language plpgsql security definer set search_path = public as $$
begin delete from public.guild_requests where guild_id = p_guild and discord_id = public._me(); end $$;

create or replace function public.answer_request(p_discord text, p_accept boolean) returns void
language plpgsql security definer set search_path = public as $$
declare me text := public._me(); g uuid := public._my_guild();
begin
  if g is null or not exists (select 1 from public.guilds where id = g and captain = me) then raise exception 'Only the captain can do that.'; end if;
  if not exists (select 1 from public.guild_requests where guild_id = g and discord_id = p_discord) then raise exception 'That request is gone.'; end if;
  if p_accept then
    if exists (select 1 from public.guild_members where discord_id = p_discord) then
      delete from public.guild_requests where discord_id = p_discord;
      raise exception 'They already joined another guild.';
    end if;
    perform public._add_member(g, p_discord);
  else
    delete from public.guild_requests where guild_id = g and discord_id = p_discord;
  end if;
end $$;

create or replace function public.leave_guild() returns void
language plpgsql security definer set search_path = public as $$
begin perform public._remove_member(public._me()); end $$;

create or replace function public.kick_member(p_discord text) returns void
language plpgsql security definer set search_path = public as $$
declare me text := public._me(); g uuid := public._my_guild();
begin
  if g is null or not exists (select 1 from public.guilds where id = g and captain = me) then raise exception 'Only the captain can do that.'; end if;
  if p_discord = me or not exists (select 1 from public.guild_members where discord_id = p_discord and guild_id = g) then raise exception 'They aren''t in your guild.'; end if;
  perform public._remove_member(p_discord);
end $$;

create or replace function public.make_captain(p_discord text) returns void
language plpgsql security definer set search_path = public as $$
declare me text := public._me(); g uuid := public._my_guild();
begin
  if g is null or not exists (select 1 from public.guilds where id = g and captain = me) then raise exception 'Only the captain can do that.'; end if;
  if not exists (select 1 from public.guild_members where discord_id = p_discord and guild_id = g) then raise exception 'They aren''t in your guild.'; end if;
  update public.guilds set captain = p_discord where id = g;
end $$;

-- p_positions: {"<discord id>": 1-5, ...} for every member, no two the same
create or replace function public.set_positions(p_positions jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare me text := public._me(); g uuid := public._my_guild(); k text; v int; used int[] := '{}';
begin
  if g is null or not exists (select 1 from public.guilds where id = g and captain = me) then raise exception 'Only the captain can do that.'; end if;
  for k, v in select key, value::int from jsonb_each_text(p_positions) loop
    if v < 1 or v > 5 or v = any(used) then raise exception 'Each position 1-5 can be used once.'; end if;
    used := used || v;
    if not exists (select 1 from public.guild_members where discord_id = k and guild_id = g) then raise exception 'They aren''t in your guild.'; end if;
  end loop;
  update public.guild_members m set position = (p_positions ->> m.discord_id)::int where m.guild_id = g and p_positions ? m.discord_id;
end $$;

-- Fight Night: freeze every roster and every saved avatar. Runs on a schedule (below), not callable by players.
create or replace function public.snapshot_fight(p_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.fight_snapshots (id, at, data)
  select p_id, now(), jsonb_build_object(
    'guilds', coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'tag', g.tag, 'crest', g.crest, 'captain', g.captain,
                 'members', coalesce((select jsonb_agg(jsonb_build_object('discord_id', m.discord_id, 'position', m.position, 'joined_at', m.joined_at, 'prev_left_at', m.prev_left_at))
                                      from public.guild_members m where m.guild_id = g.id), '[]'::jsonb)))
               from public.guilds g), '[]'::jsonb),
    'loadouts', coalesce((select jsonb_object_agg(a.discord_id, a.loadout) from public.avatars a
                          where a.discord_id in (select discord_id from public.guild_members)), '{}'::jsonb))
  on conflict (id) do nothing;
end $$;

revoke all on function public._me(), public._my_guild(), public._add_member(uuid, text), public._remove_member(text), public.snapshot_fight(text) from public, anon, authenticated;
revoke all on function public.create_guild(text, text, jsonb), public.update_guild(text, text, jsonb, boolean), public.my_invite_code(boolean),
  public.join_guild(text), public.request_join(uuid), public.cancel_request(uuid), public.answer_request(text, boolean),
  public.leave_guild(), public.kick_member(text), public.make_captain(text), public.set_positions(jsonb) from public, anon;
grant execute on function public.create_guild(text, text, jsonb), public.update_guild(text, text, jsonb, boolean), public.my_invite_code(boolean),
  public.join_guild(text), public.request_join(uuid), public.cancel_request(uuid), public.answer_request(text, boolean),
  public.leave_guild(), public.kick_member(text), public.make_captain(text), public.set_positions(jsonb) to authenticated;

-- Schedule: Saturday and Sunday 9pm Malaysia time = 13:00 UTC.
-- Needs the pg_cron extension: Database > Extensions > pg_cron > Enable. Then run:
-- select cron.schedule('fight-night', '0 13 * * 6,0',
--   $$select public.snapshot_fight(to_char(now() at time zone 'Asia/Kuala_Lumpur', 'YYYY-MM-DD'))$$);


-- =====================================================================
-- Players link their own Dota account (safe to run again).
-- After logging in with Discord, a player enters their Dota Friend ID once.
-- Each Dota account and each Discord account can only be linked once.
-- Admins (listed in league_admins) can unlink a wrong claim from the site's Admin page.
-- =====================================================================

create table if not exists public.players (
  discord_id text primary key,
  account_id bigint not null unique check (account_id > 0 and account_id < 4294967296),
  name       text not null check (char_length(name) between 1 and 24),
  linked_at  timestamptz not null default now()
);
alter table public.players enable row level security;
drop policy if exists "Players are public" on public.players;
create policy "Players are public" on public.players for select using (true);
-- No insert/update/delete policies: changes only go through the functions below.

create table if not exists public.league_admins (discord_id text primary key);
alter table public.league_admins enable row level security;     -- no policies: only the functions below read it
-- Make yourself an admin (your Discord ID is shown on the site's Admin page once you log in):
--   insert into public.league_admins values ('YOUR_DISCORD_ID');

create or replace function public.is_league_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.league_admins where discord_id = public.my_discord_id())
$$;

create or replace function public.link_player(p_account bigint, p_name text) returns void
language plpgsql security definer set search_path = public as $$
declare me text := public._me(); n text := trim(coalesce(p_name, ''));
begin
  if p_account is null or p_account <= 0 or p_account >= 4294967296 then raise exception 'That isn''t a Dota Friend ID.'; end if;
  if char_length(n) < 1 or char_length(n) > 24 then raise exception 'Pick a display name of 1 to 24 characters.'; end if;
  if exists (select 1 from public.players where discord_id = me) then
    raise exception 'Your Discord is already linked to a Dota account. Typed the wrong one? Ask an admin to unlink it.';
  end if;
  if exists (select 1 from public.players where account_id = p_account) then
    raise exception 'That Dota account is already linked to someone else. If it''s yours, ask an admin.';
  end if;
  insert into public.players (discord_id, account_id, name) values (me, p_account, n);
exception when unique_violation then
  raise exception 'That Dota account is already linked to someone else. If it''s yours, ask an admin.';
end $$;

create or replace function public.admin_unlink(p_discord text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public._me();
  if not public.is_league_admin() then raise exception 'Only league admins can unlink players.'; end if;
  delete from public.players where discord_id = p_discord;
  if not found then raise exception 'That player isn''t linked.'; end if;
end $$;

revoke all on function public.is_league_admin(), public.link_player(bigint, text), public.admin_unlink(text) from public, anon;
grant execute on function public.is_league_admin() to authenticated;
grant execute on function public.link_player(bigint, text) to authenticated;
grant execute on function public.admin_unlink(text) to authenticated;
