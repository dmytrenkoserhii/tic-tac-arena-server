create or replace function public.make_move(
  game_id_input uuid,
  cell_index_input integer
)
returns table (
  id uuid,
  game_id uuid,
  player_id uuid,
  mark text,
  cell_index integer,
  move_number integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  active_game public.games%rowtype;
  current_player_id uuid := (select auth.uid());
  next_move_number integer;
  expected_mark text;
  expected_player_id uuid;
begin
  if current_player_id is null then
    raise exception 'You must be signed in to make a move.';
  end if;

  if cell_index_input < 0 or cell_index_input > 8 then
    raise exception 'Cell index must be between 0 and 8.';
  end if;

  select *
  into active_game
  from public.games
  where games.id = game_id_input
  for update;

  if not found then
    raise exception 'Game was not found.';
  end if;

  if active_game.status <> 'in_progress' then
    raise exception 'This game is already finished.';
  end if;

  if current_player_id <> active_game.x_player_id
    and current_player_id <> active_game.o_player_id then
    raise exception 'You are not a player in this game.';
  end if;

  select count(*)::integer + 1
  into next_move_number
  from public.moves
  where moves.game_id = game_id_input;

  expected_mark := case when next_move_number % 2 = 1 then 'x' else 'o' end;
  expected_player_id := case
    when expected_mark = 'x' then active_game.x_player_id
    else active_game.o_player_id
  end;

  if current_player_id <> expected_player_id then
    raise exception 'It is not your turn.';
  end if;

  if exists (
    select 1
    from public.moves
    where moves.game_id = game_id_input
      and moves.cell_index = cell_index_input
  ) then
    raise exception 'This cell is already occupied.';
  end if;

  return query
  insert into public.moves (
    game_id,
    player_id,
    mark,
    cell_index,
    move_number
  )
  values (
    game_id_input,
    current_player_id,
    expected_mark,
    cell_index_input,
    next_move_number
  )
  returning
    moves.id,
    moves.game_id,
    moves.player_id,
    moves.mark,
    moves.cell_index,
    moves.move_number;
end;
$$;

revoke all on function public.make_move(uuid, integer) from public;
grant execute on function public.make_move(uuid, integer) to authenticated;
