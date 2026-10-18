-- MADO technician invoices
-- Run this migration in Supabase SQL Editor before using the invoice module.
create table if not exists public.technician_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null,
  mission_title text not null default '',
  site text not null default '',
  task_title text not null default '',
  amount numeric(12,3) not null check (amount > 0),
  currency text not null default 'TND' check (currency in ('TND','EUR','USD')),
  details text not null default '',
  invoice_date date not null default current_date,
  status text not null default 'Envoyée' check (status in ('Envoyée','Payée','Annulée')),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index if not exists technician_invoices_owner_date_idx
  on public.technician_invoices(owner_id, created_at desc);
alter table public.technician_invoices enable row level security;
drop policy if exists "technician invoices read own or manager" on public.technician_invoices;
create policy "technician invoices read own or manager"
  on public.technician_invoices for select to authenticated
  using (
    owner_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'manager')
  );
drop policy if exists "technician invoices insert manager only" on public.technician_invoices;
create policy "technician invoices insert manager only"
  on public.technician_invoices for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'manager')
  );
drop policy if exists "technician invoices update manager only" on public.technician_invoices;
create policy "technician invoices update manager only"
  on public.technician_invoices for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'manager'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'manager'));
drop policy if exists "technician invoices delete manager only" on public.technician_invoices;
create policy "technician invoices delete manager only"
  on public.technician_invoices for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'manager'));
