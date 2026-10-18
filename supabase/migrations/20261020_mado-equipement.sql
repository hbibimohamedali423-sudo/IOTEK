-- MADO equipment register (materiel.html)
-- Run this migration in Supabase SQL Editor after 20261019_invoice_attachment.sql.
-- Creates the tables the "Équipements" page reads and writes:
--   equipment      : one row per installed device / piece of equipment
--   equipment_log  : append-only history shown in the equipment dialog
-- Access is manager-only, matching the page ("Réservé au responsable").

create table if not exists public.equipment (
  id              uuid primary key default gen_random_uuid(),
  internal_code   text not null default ('EQ-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6)),
  category        text not null default 'other'
                    check (category in ('cctv','network','access','fire_intrusion','it','domotique','other')),
  status          text not null default 'in_stock'
                    check (status in ('in_stock','installed','faulty','removed','replaced')),
  name            text not null,
  manufacturer    text,
  model           text,
  serial_number   text,
  site_name       text,
  location        text,
  ip_address      inet,
  mac_address     macaddr,
  subnet_mask     inet,
  gateway         inet,
  vlan            integer check (vlan is null or vlan between 1 and 4094),
  mission_ref     text,
  installed_at    date,
  warranty_until  date,
  notes           text,
  -- category-specific properties (channel, port, loop, hostname, ...)
  details         jsonb not null default '{}'::jsonb,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (manufacturer, serial_number)
);
create index if not exists equipment_created_idx on public.equipment (created_at desc);
create index if not exists equipment_site_idx    on public.equipment (site_name, location);
create index if not exists equipment_serial_idx  on public.equipment (serial_number);

alter table public.equipment enable row level security;
drop policy if exists "equipment read manager only" on public.equipment;
create policy "equipment read manager only"
  on public.equipment for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'manager'));
drop policy if exists "equipment insert manager only" on public.equipment;
create policy "equipment insert manager only"
  on public.equipment for insert to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'manager')
    and created_by = auth.uid()
  );
drop policy if exists "equipment update manager only" on public.equipment;
create policy "equipment update manager only"
  on public.equipment for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'manager'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'manager'));
drop policy if exists "equipment delete manager only" on public.equipment;
create policy "equipment delete manager only"
  on public.equipment for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'manager'));

create table if not exists public.equipment_log (
  id            uuid primary key default gen_random_uuid(),
  equipment_id  uuid not null references public.equipment(id) on delete cascade,
  action        text not null,
  note          text not null default '',
  actor         uuid references auth.users(id) on delete set null,
  at            timestamptz not null default now()
);
create index if not exists equipment_log_equipment_idx
  on public.equipment_log (equipment_id, at desc);

alter table public.equipment_log enable row level security;
drop policy if exists "equipment log read manager only" on public.equipment_log;
create policy "equipment log read manager only"
  on public.equipment_log for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'manager'));
-- No insert/update/delete policy: rows are written only by the trigger below.

-- Keep updated_at fresh (BEFORE) and append one history row per change (AFTER),
-- so the "Historique" panel in materiel.html has data to show.
-- The log write must be AFTER: the equipment row has to exist before the
-- equipment_log foreign key can point at it.
create or replace function public.equipment_stamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.equipment_log_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.equipment_log (equipment_id, action, note, actor)
      values (new.id, 'Création', coalesce(new.name, ''), auth.uid());
  else
    insert into public.equipment_log (equipment_id, action, note, actor)
      values (new.id, 'Modification', coalesce(new.status, ''), auth.uid());
  end if;
  return null;
end;
$$;

drop trigger if exists equipment_stamp on public.equipment;
create trigger equipment_stamp
  before insert or update on public.equipment
  for each row execute function public.equipment_stamp();

drop trigger if exists equipment_log_write on public.equipment;
create trigger equipment_log_write
  after insert or update on public.equipment
  for each row execute function public.equipment_log_write();
