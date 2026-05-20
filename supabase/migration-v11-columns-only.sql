-- Colonnes minimales garage public (à coller dans Supabase SQL Editor si db:sql échoue)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS latitude float,
  ADD COLUMN IF NOT EXISTS longitude float,
  ADD COLUMN IF NOT EXISTS is_network_visible boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS vehicles_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS banner_storage_path text,
  ADD COLUMN IF NOT EXISTS logo_storage_path text;
