-- =============================================================================
-- Carte réseau (véhicules + concessions) — à exécuter UNE FOIS dans Supabase
-- Dashboard → SQL Editor → New query → coller ce fichier → Run
-- =============================================================================

-- V7 : coordonnées sur les véhicules (obligatoire pour /map)
alter table public.vehicles
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

create index if not exists idx_vehicles_map on public.vehicles(latitude, longitude);

-- V8 : coordonnées sur le profil marchand (siège sur la carte)
alter table public.profiles
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

create index if not exists idx_profiles_map on public.profiles(latitude, longitude);
