create table if not exists public.cozy_life_states (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  device_id text,
  client_updated_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.cozy_life_states enable row level security;

drop policy if exists "Users can read own state" on public.cozy_life_states;
create policy "Users can read own state"
on public.cozy_life_states
for select
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Users can insert own state" on public.cozy_life_states;
create policy "Users can insert own state"
on public.cozy_life_states
for insert
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Users can update own state" on public.cozy_life_states;
create policy "Users can update own state"
on public.cozy_life_states
for update
using (auth.uid() is not null and auth.uid() = user_id)
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Users can delete own state" on public.cozy_life_states;
create policy "Users can delete own state"
on public.cozy_life_states
for delete
using (auth.uid() is not null and auth.uid() = user_id);

create or replace function public.set_cozy_life_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists cozy_life_states_set_updated_at on public.cozy_life_states;
create trigger cozy_life_states_set_updated_at
before update on public.cozy_life_states
for each row
execute function public.set_cozy_life_updated_at();
