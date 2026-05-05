create or replace function public.leave_room(room_id_input uuid)
returns table (
  id uuid,
  code text,
  host_id uuid,
  guest_id uuid,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_player_id uuid := (select auth.uid());
  active_room public.rooms%rowtype;
  has_active_game boolean;
begin
  if current_player_id is null then
    raise exception 'You must be signed in to leave a room.';
  end if;

  select *
  into active_room
  from public.rooms
  where rooms.id = room_id_input
  for update;

  if not found then
    raise exception 'Room was not found.';
  end if;

  if current_player_id <> active_room.host_id
    and current_player_id <> active_room.guest_id then
    raise exception 'You are not a player in this room.';
  end if;

  select exists (
    select 1
    from public.games
    where games.room_id = room_id_input
      and games.status = 'in_progress'
  )
  into has_active_game;

  if current_player_id = active_room.host_id or has_active_game then
    return query
    update public.rooms
    set status = 'closed'
    where rooms.id = room_id_input
    returning
      rooms.id,
      rooms.code,
      rooms.host_id,
      rooms.guest_id,
      rooms.status;

    return;
  end if;

  return query
  update public.rooms
  set
    guest_id = null,
    status = 'waiting'
  where rooms.id = room_id_input
  returning
    rooms.id,
    rooms.code,
    rooms.host_id,
    rooms.guest_id,
    rooms.status;
end;
$$;

revoke all on function public.leave_room(uuid) from public;
grant execute on function public.leave_room(uuid) to authenticated;
