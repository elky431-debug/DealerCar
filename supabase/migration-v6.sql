-- ============================================================
-- migration-v6.sql — Inspections pré-achat (Consultation complète)
-- ============================================================
-- Une "inspection" = une consultation guidée d'un véhicule potentiel
-- avant achat. 10 étapes obligatoires (+ une étape pneus 6bis), avec
-- état persisté par étape, ouverte/fermée, décision finale (go/no-go).
--
-- Le contenu détaillé de chaque étape (checks, notes, photos) est
-- stocké dans `steps_state` (jsonb) pour rester scalable et permettre
-- d'ajouter / modifier des étapes sans migration.

create table if not exists public.vehicle_inspections (
  id                 uuid primary key default gen_random_uuid(),
  dealer_id          uuid not null references auth.users(id) on delete cascade,

  -- Identification du véhicule consulté
  title              text not null,
  vehicle_brand      text,
  vehicle_model      text,
  vehicle_year       int,
  vehicle_plate      text,
  vehicle_vin        text,

  -- Acheteur (utile pour Histovec)
  buyer_first_name   text,
  buyer_last_name    text,

  -- Progression
  current_step       int not null default 1 check (current_step between 1 and 20),
  steps_state        jsonb not null default '{}'::jsonb,

  -- Décision finale
  decision           text check (decision in ('go','no_go','uncertain')),
  decision_notes     text,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  completed_at       timestamptz
);

create index if not exists idx_vehicle_inspections_dealer
  on public.vehicle_inspections(dealer_id, updated_at desc);

create or replace function public.touch_vehicle_inspections_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_vehicle_inspections_updated_at on public.vehicle_inspections;
create trigger trg_vehicle_inspections_updated_at
  before update on public.vehicle_inspections
  for each row execute function public.touch_vehicle_inspections_updated_at();

-- RLS : un dealer ne voit que ses inspections
alter table public.vehicle_inspections enable row level security;

drop policy if exists "vi_select_owner"  on public.vehicle_inspections;
drop policy if exists "vi_insert_owner"  on public.vehicle_inspections;
drop policy if exists "vi_update_owner"  on public.vehicle_inspections;
drop policy if exists "vi_delete_owner"  on public.vehicle_inspections;

create policy "vi_select_owner" on public.vehicle_inspections
  for select using (dealer_id = auth.uid());

create policy "vi_insert_owner" on public.vehicle_inspections
  for insert with check (dealer_id = auth.uid());

create policy "vi_update_owner" on public.vehicle_inspections
  for update using (dealer_id = auth.uid())
  with check (dealer_id = auth.uid());

create policy "vi_delete_owner" on public.vehicle_inspections
  for delete using (dealer_id = auth.uid());
