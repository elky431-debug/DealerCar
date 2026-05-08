-- ============================================================
-- migration-v7.sql — Coordonnées GPS véhicules (vue carte)
-- ============================================================

alter table public.vehicles
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

create index if not exists idx_vehicles_map on public.vehicles(latitude, longitude);
