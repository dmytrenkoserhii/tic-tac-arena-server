create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  x_player_id uuid not null references public.profiles (id) on delete cascade,
  o_player_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'in_progress',
  winner_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint games_status_check check (status in ('in_progress', 'x_won', 'o_won', 'draw')),
  constraint games_players_are_different check (x_player_id <> o_player_id),
  constraint games_winner_is_player check (
    winner_id is null
    or winner_id = x_player_id
    or winner_id = o_player_id
  )
);

create unique index if not exists games_one_active_game_per_room_idx
on public.games (room_id)
where status = 'in_progress';

alter table public.games enable row level security;

create trigger games_set_updated_at
before update on public.games
for each row
execute function public.set_updated_at();

create policy "Room players can read games"
on public.games
for select
to authenticated
using (
  (select auth.uid()) = x_player_id
  or (select auth.uid()) = o_player_id
);

create policy "Hosts can create games for ready rooms"
on public.games
for insert
to authenticated
with check (
  (select auth.uid()) = x_player_id
  and exists (
    select 1
    from public.rooms
    where rooms.id = games.room_id
      and rooms.status = 'ready'
      and rooms.host_id = games.x_player_id
      and rooms.guest_id = games.o_player_id
  )
);

create table if not exists public.moves (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  player_id uuid not null references public.profiles (id) on delete cascade,
  mark text not null,
  cell_index integer not null,
  move_number integer not null,
  created_at timestamptz not null default now(),
  constraint moves_mark_check check (mark in ('x', 'o')),
  constraint moves_cell_index_check check (cell_index between 0 and 8),
  constraint moves_move_number_check check (move_number between 1 and 9),
  constraint moves_unique_cell_per_game unique (game_id, cell_index),
  constraint moves_unique_number_per_game unique (game_id, move_number)
);

alter table public.moves enable row level security;

create policy "Game players can read moves"
on public.moves
for select
to authenticated
using (
  exists (
    select 1
    from public.games
    where games.id = moves.game_id
      and (
        games.x_player_id = (select auth.uid())
        or games.o_player_id = (select auth.uid())
      )
  )
);

create policy "Game players can create their own moves"
on public.moves
for insert
to authenticated
with check (
  player_id = (select auth.uid())
  and exists (
    select 1
    from public.games
    where games.id = moves.game_id
      and games.status = 'in_progress'
      and (
        games.x_player_id = moves.player_id
        or games.o_player_id = moves.player_id
      )
  )
);

create index if not exists games_room_id_idx on public.games (room_id);
create index if not exists games_x_player_id_idx on public.games (x_player_id);
create index if not exists games_o_player_id_idx on public.games (o_player_id);
create index if not exists moves_game_id_idx on public.moves (game_id);
create index if not exists moves_player_id_idx on public.moves (player_id);
