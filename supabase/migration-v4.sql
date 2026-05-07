-- ============================================================
-- migration-v4.sql — Frais véhicules (manuels & estimations IA)
-- ============================================================

create table if not exists public.vehicle_costs (
  id          uuid primary key default gen_random_uuid(),
  vehicle_id  uuid not null references public.vehicles(id) on delete cascade,
  dealer_id   uuid not null references auth.users(id) on delete cascade,
  label       text not null,
  amount      numeric(12,2) not null check (amount >= 0),
  category    text not null default 'reparation'
    check (category in ('reparation','controle_technique','nettoyage','administratif','autre')),
  date        date not null default current_date,
  source      text not null default 'manuel'
    check (source in ('manuel','ia_estimation')),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_vehicle_costs_vehicle on public.vehicle_costs(vehicle_id, date desc);
create index if not exists idx_vehicle_costs_dealer  on public.vehicle_costs(dealer_id,  date desc);

create or replace function public.touch_vehicle_costs_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_vehicle_costs_updated_at on public.vehicle_costs;
create trigger trg_vehicle_costs_updated_at
  before update on public.vehicle_costs
  for each row execute function public.touch_vehicle_costs_updated_at();

-- RLS
alter table public.vehicle_costs enable row level security;

drop policy if exists "vc_select_owner"  on public.vehicle_costs;
drop policy if exists "vc_insert_owner"  on public.vehicle_costs;
drop policy if exists "vc_update_owner"  on public.vehicle_costs;
drop policy if exists "vc_delete_owner"  on public.vehicle_costs;

create policy "vc_select_owner" on public.vehicle_costs
  for select using (dealer_id = auth.uid());

create policy "vc_insert_owner" on public.vehicle_costs
  for insert with check (
    dealer_id = auth.uid()
    and exists (select 1 from public.vehicles v
                where v.id = vehicle_id and v.dealer_id = auth.uid())
  );

create policy "vc_update_owner" on public.vehicle_costs
  for update using (dealer_id = auth.uid())
  with check (dealer_id = auth.uid());

create policy "vc_delete_owner" on public.vehicle_costs
  for delete using (dealer_id = auth.uid());
