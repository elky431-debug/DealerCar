-- =====================================================================
--  DealerLink v2 — Migration additive
--  À exécuter UNE FOIS dans Supabase → SQL Editor après schema.sql
--  Idempotente (ré-exécutable sans danger)
-- =====================================================================

-- ---------- 1. Infos client déposant (vehicles) ----------
alter table public.vehicles
  add column if not exists deposit_client_name    text,
  add column if not exists deposit_client_phone   text,
  add column if not exists deposit_client_email   text,
  add column if not exists deposit_client_address text,
  add column if not exists deposit_notes          text;

-- ---------- 2. Documents véhicule (privés) ----------
create table if not exists public.vehicle_documents (
  id            uuid primary key default uuid_generate_v4(),
  vehicle_id    uuid not null references public.vehicles(id) on delete cascade,
  dealer_id     uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  storage_path  text not null,
  mime_type     text not null,
  size_bytes    bigint not null default 0,
  category      text not null default 'other'
                check (category in ('photo_before','photo_after','video_before','video_after','admin','other')),
  created_at    timestamptz not null default now()
);

create index if not exists idx_documents_vehicle on public.vehicle_documents(vehicle_id, created_at desc);

alter table public.vehicle_documents enable row level security;

drop policy if exists "documents_select_own" on public.vehicle_documents;
create policy "documents_select_own"
  on public.vehicle_documents for select
  to authenticated
  using (dealer_id = auth.uid());

drop policy if exists "documents_insert_own" on public.vehicle_documents;
create policy "documents_insert_own"
  on public.vehicle_documents for insert
  to authenticated
  with check (
    dealer_id = auth.uid()
    and exists (select 1 from public.vehicles v where v.id = vehicle_id and v.dealer_id = auth.uid())
  );

drop policy if exists "documents_delete_own" on public.vehicle_documents;
create policy "documents_delete_own"
  on public.vehicle_documents for delete
  to authenticated
  using (dealer_id = auth.uid());

-- ---------- 3. Clients intéressés (leads) ----------
create table if not exists public.vehicle_leads (
  id          uuid primary key default uuid_generate_v4(),
  dealer_id   uuid not null references public.profiles(id) on delete cascade,
  vehicle_id  uuid references public.vehicles(id) on delete set null,
  name        text not null,
  phone       text,
  email       text,
  message     text,
  status      text not null default 'new'
              check (status in ('new','contacted','hot','cold','won','lost')),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_leads_dealer on public.vehicle_leads(dealer_id, created_at desc);
create index if not exists idx_leads_vehicle on public.vehicle_leads(vehicle_id);

drop trigger if exists trg_leads_touch on public.vehicle_leads;
create trigger trg_leads_touch before update on public.vehicle_leads
  for each row execute function public.touch_updated_at();

alter table public.vehicle_leads enable row level security;

drop policy if exists "leads_select_own" on public.vehicle_leads;
create policy "leads_select_own"
  on public.vehicle_leads for select to authenticated
  using (dealer_id = auth.uid());

drop policy if exists "leads_insert_own" on public.vehicle_leads;
create policy "leads_insert_own"
  on public.vehicle_leads for insert to authenticated
  with check (dealer_id = auth.uid());

drop policy if exists "leads_update_own" on public.vehicle_leads;
create policy "leads_update_own"
  on public.vehicle_leads for update to authenticated
  using (dealer_id = auth.uid()) with check (dealer_id = auth.uid());

drop policy if exists "leads_delete_own" on public.vehicle_leads;
create policy "leads_delete_own"
  on public.vehicle_leads for delete to authenticated
  using (dealer_id = auth.uid());

-- ---------- 4. Favoris (recherche réseau) ----------
create table if not exists public.favorites (
  dealer_id   uuid not null references public.profiles(id) on delete cascade,
  vehicle_id  uuid not null references public.vehicles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (dealer_id, vehicle_id)
);

create index if not exists idx_favorites_dealer on public.favorites(dealer_id, created_at desc);

alter table public.favorites enable row level security;

drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own"
  on public.favorites for select to authenticated
  using (dealer_id = auth.uid());

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own"
  on public.favorites for insert to authenticated
  with check (dealer_id = auth.uid());

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
  on public.favorites for delete to authenticated
  using (dealer_id = auth.uid());

-- ---------- 5. Bucket privé pour documents ----------
insert into storage.buckets (id, name, public)
values ('vehicle-documents', 'vehicle-documents', false)
on conflict (id) do nothing;

drop policy if exists "vehicle_documents_owner_select" on storage.objects;
create policy "vehicle_documents_owner_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'vehicle-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "vehicle_documents_owner_insert" on storage.objects;
create policy "vehicle_documents_owner_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'vehicle-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "vehicle_documents_owner_update" on storage.objects;
create policy "vehicle_documents_owner_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'vehicle-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "vehicle_documents_owner_delete" on storage.objects;
create policy "vehicle_documents_owner_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'vehicle-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
