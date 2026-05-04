create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id uuid not null references public.profiles (id) on delete cascade,
  guest_id uuid references public.profiles (id) on delete set null,
  status text not null default 'waiting',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rooms_code_format check (code ~ '^[A-Z0-9]{6}$'),
  constraint rooms_status_check check (status in ('waiting', 'ready', 'closed')),
  constraint rooms_guest_is_not_host check (guest_id is null or guest_id <> host_id)
);

alter table public.rooms enable row level security;

create trigger rooms_set_updated_at
before update on public.rooms
for each row
execute function public.set_updated_at();

create policy "Users can create rooms as host"
on public.rooms
for insert
to authenticated
with check ((select auth.uid()) = host_id);

create policy "Users can read joinable or own rooms"
on public.rooms
for select
to authenticated
using (
  status = 'waiting'
  or (select auth.uid()) = host_id
  or (select auth.uid()) = guest_id
);

create policy "Users can join waiting rooms"
on public.rooms
for update
to authenticated
using (
  status = 'waiting'
  and guest_id is null
  and (select auth.uid()) <> host_id
)
with check (
  status = 'ready'
  and guest_id = (select auth.uid())
);

create index if not exists rooms_code_idx on public.rooms (code);
create index if not exists rooms_host_id_idx on public.rooms (host_id);
create index if not exists rooms_guest_id_idx on public.rooms (guest_id);
