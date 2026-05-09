-- ============================================================
-- migration-v8.sql — Position des concessions (profils marchands)
-- ============================================================

alter table public.profiles
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

create index if not exists idx_profiles_map on public.profiles(latitude, longitude);
