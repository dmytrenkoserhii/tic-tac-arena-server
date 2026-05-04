drop policy if exists "Users can join waiting rooms" on public.rooms;

create policy "Users can join waiting rooms"
on public.rooms
for update
to authenticated
using (
  guest_id is null
  and (select auth.uid()) <> host_id
)
with check (
  status = 'ready'
  and guest_id = (select auth.uid())
  and host_id <> (select auth.uid())
);
