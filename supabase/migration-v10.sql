-- ============================================================
-- migration-v10.sql — Index composites pour filtres fréquents
--
-- Applique : SQL Editor, npm run db:setup, ou
--   npm run db:sql -- supabase/migration-v10.sql
-- ============================================================

create index if not exists idx_vehicles_dealer_status
  on public.vehicles (dealer_id, status);

create index if not exists idx_vehicles_dealer_created
  on public.vehicles (dealer_id, created_at desc);

create index if not exists idx_vehicles_network_available
  on public.vehicles (visibility, status, created_at desc)
  where visibility = 'network' and status = 'available';

create index if not exists idx_vehicle_costs_dealer_date
  on public.vehicle_costs (dealer_id, date desc);

create index if not exists idx_vehicle_documents_dealer_created
  on public.vehicle_documents (dealer_id, created_at desc);
