create table if not exists public.price_snapshots (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.price_snapshots enable row level security;

drop policy if exists "price snapshots are publicly readable" on public.price_snapshots;
create policy "price snapshots are publicly readable"
  on public.price_snapshots
  for select
  using (true);
