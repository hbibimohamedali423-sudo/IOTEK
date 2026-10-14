-- MADO optional operational modules
-- Run this script in Supabase SQL Editor before using the new modules.
create table if not exists public.app_module_records (
  id uuid primary key default gen_random_uuid(),
  module_key text not null check (module_key in ('maintenance','stock','sites','planning','vehicles','documents','notifications')),
  title text not null,
  details text not null default '',
  status text not null default 'Nouveau',
  event_date date,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists app_module_records_key_date_idx
  on public.app_module_records(module_key, event_date desc, created_at desc);
create index if not exists app_module_records_owner_idx
  on public.app_module_records(owner_id);
alter table public.app_module_records enable row level security;
drop policy if exists "module records read own or manager" on public.app_module_records;
create policy "module records read own or manager"
  on public.app_module_records for select to authenticated
  using (
    owner_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'manager')
  );
drop policy if exists "module records insert own or manager" on public.app_module_records;
create policy "module records insert own or manager"
  on public.app_module_records for insert to authenticated
  with check (
    created_by = auth.uid()
    and (
      owner_id = auth.uid()
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'manager')
    )
  );
drop policy if exists "module records update own or manager" on public.app_module_records;
create policy "module records update own or manager"
  on public.app_module_records for update to authenticated
  using (
    owner_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'manager')
  )
  with check (
    owner_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'manager')
  );
drop policy if exists "module records delete own or manager" on public.app_module_records;
create policy "module records delete own or manager"
  on public.app_module_records for delete to authenticated
  using (
    owner_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'manager')
  );
