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
  board text[];
  current_player_id uuid := (select auth.uid());
  expected_mark text;
  expected_player_id uuid;
  inserted_move public.moves%rowtype;
  next_move_number integer;
  winning_lines integer[][] := array[
    array[0, 1, 2],
    array[3, 4, 5],
    array[6, 7, 8],
    array[0, 3, 6],
    array[1, 4, 7],
    array[2, 5, 8],
    array[0, 4, 8],
    array[2, 4, 6]
  ];
  winning_line integer[];
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
  returning *
  into inserted_move;

  select array_agg(board_cells.mark order by board_cells.cell_index)
  into board
  from (
    select
      cells.cell_index,
      moves.mark
    from generate_series(0, 8) as cells(cell_index)
    left join public.moves
      on moves.game_id = game_id_input
      and moves.cell_index = cells.cell_index
  ) as board_cells;

  foreach winning_line slice 1 in array winning_lines
  loop
    if board[winning_line[1] + 1] = expected_mark
      and board[winning_line[2] + 1] = expected_mark
      and board[winning_line[3] + 1] = expected_mark then
      update public.games
      set
        status = case when expected_mark = 'x' then 'x_won' else 'o_won' end,
        winner_id = current_player_id
      where games.id = game_id_input;

      return query
      select
        inserted_move.id,
        inserted_move.game_id,
        inserted_move.player_id,
        inserted_move.mark,
        inserted_move.cell_index,
        inserted_move.move_number;
      return;
    end if;
  end loop;

  if next_move_number = 9 then
    update public.games
    set
      status = 'draw',
      winner_id = null
    where games.id = game_id_input;
  end if;

  return query
  select
    inserted_move.id,
    inserted_move.game_id,
    inserted_move.player_id,
    inserted_move.mark,
    inserted_move.cell_index,
    inserted_move.move_number;
end;
$$;

revoke all on function public.make_move(uuid, integer) from public;
grant execute on function public.make_move(uuid, integer) to authenticated;
