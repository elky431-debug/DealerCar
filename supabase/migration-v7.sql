-- ============================================================
-- migration-v7.sql — Coordonnées GPS véhicules (vue carte)
-- Obligatoire si l’erreur « column vehicles.latitude does not exist » apparaît.
-- Alternative : exécuter migration-map.sql (V7 + V8 en un seul fichier).
-- ============================================================

alter table public.vehicles
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

create index if not exists idx_vehicles_map on public.vehicles(latitude, longitude);
