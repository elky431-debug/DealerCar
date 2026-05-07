-- =====================================================================
--  DealerLink — Schéma de base de données + RLS + Storage
--  À exécuter dans Supabase → SQL Editor sur un projet vierge.
-- =====================================================================

-- ---------- Extensions ----------
create extension if not exists "uuid-ossp";

-- ---------- Profils marchands ----------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  company_name  text not null,
  phone         text not null,
  location      text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, company_name, phone, location)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'company_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'location', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Véhicules ----------
create table if not exists public.vehicles (
  id                uuid primary key default uuid_generate_v4(),
  dealer_id         uuid not null references public.profiles(id) on delete cascade,

  -- Caractéristiques
  brand             text not null,
  model             text not null,
  year              int  not null check (year between 1900 and extract(year from now())::int + 1),
  mileage           int  not null check (mileage >= 0),
  price             numeric(12,2) not null check (price >= 0),
  location          text not null,
  description       text,

  -- Logique métier (cf. cahier des charges §5)
  type              text not null default 'stock'   check (type in ('stock', 'depot')),
  visibility        text not null default 'private' check (visibility in ('private', 'network')),
  status            text not null default 'available' check (status in ('available', 'reserved', 'sold')),

  -- Spécifique dépôt-vente
  client_price      numeric(12,2) check (client_price is null or client_price >= 0),
  commission_type   text check (commission_type in ('fixed', 'percent')),
  commission_value  numeric(12,2) check (commission_value is null or commission_value >= 0),

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_vehicles_dealer on public.vehicles(dealer_id);
create index if not exists idx_vehicles_visible on public.vehicles(visibility, status);
create index if not exists idx_vehicles_search on public.vehicles(brand, model, price, location);
create index if not exists idx_vehicles_created on public.vehicles(created_at desc);

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_vehicles_touch on public.vehicles;
create trigger trg_vehicles_touch before update on public.vehicles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------- Images véhicule ----------
create table if not exists public.vehicle_images (
  id            uuid primary key default uuid_generate_v4(),
  vehicle_id    uuid not null references public.vehicles(id) on delete cascade,
  storage_path  text not null,
  position      int  not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_vehicle_images_vehicle on public.vehicle_images(vehicle_id, position);

-- ---------- Row Level Security ----------
alter table public.profiles       enable row level security;
alter table public.vehicles       enable row level security;
alter table public.vehicle_images enable row level security;

-- profiles : lisibles par tout user authentifié, modifiables par le propriétaire
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- vehicles : on voit ses propres véhicules + ceux du réseau (visibility=network) dispos
drop policy if exists "vehicles_select" on public.vehicles;
create policy "vehicles_select"
  on public.vehicles for select
  to authenticated
  using (
    dealer_id = auth.uid()
    or (visibility = 'network' and status = 'available')
  );

drop policy if exists "vehicles_insert_own" on public.vehicles;
create policy "vehicles_insert_own"
  on public.vehicles for insert
  to authenticated
  with check (dealer_id = auth.uid());

drop policy if exists "vehicles_update_own" on public.vehicles;
create policy "vehicles_update_own"
  on public.vehicles for update
  to authenticated
  using (dealer_id = auth.uid())
  with check (dealer_id = auth.uid());

drop policy if exists "vehicles_delete_own" on public.vehicles;
create policy "vehicles_delete_own"
  on public.vehicles for delete
  to authenticated
  using (dealer_id = auth.uid());

-- vehicle_images : suivent la visibilité du véhicule parent
drop policy if exists "images_select" on public.vehicle_images;
create policy "images_select"
  on public.vehicle_images for select
  to authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id
        and (v.dealer_id = auth.uid() or (v.visibility = 'network' and v.status = 'available'))
    )
  );

drop policy if exists "images_insert_own" on public.vehicle_images;
create policy "images_insert_own"
  on public.vehicle_images for insert
  to authenticated
  with check (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and v.dealer_id = auth.uid()
    )
  );

drop policy if exists "images_update_own" on public.vehicle_images;
create policy "images_update_own"
  on public.vehicle_images for update
  to authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and v.dealer_id = auth.uid()
    )
  );

drop policy if exists "images_delete_own" on public.vehicle_images;
create policy "images_delete_own"
  on public.vehicle_images for delete
  to authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and v.dealer_id = auth.uid()
    )
  );

-- ---------- Infos client déposant (pour vehicles type='depot') ----------
alter table public.vehicles
  add column if not exists deposit_client_name    text,
  add column if not exists deposit_client_phone   text,
  add column if not exists deposit_client_email   text,
  add column if not exists deposit_client_address text,
  add column if not exists deposit_notes          text;

-- ---------- Documents véhicule (privés, par marchand) ----------
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
create policy "documents_select_own" on public.vehicle_documents for select to authenticated using (dealer_id = auth.uid());
drop policy if exists "documents_insert_own" on public.vehicle_documents;
create policy "documents_insert_own" on public.vehicle_documents for insert to authenticated
  with check (dealer_id = auth.uid() and exists (select 1 from public.vehicles v where v.id = vehicle_id and v.dealer_id = auth.uid()));
drop policy if exists "documents_delete_own" on public.vehicle_documents;
create policy "documents_delete_own" on public.vehicle_documents for delete to authenticated using (dealer_id = auth.uid());

-- ---------- Clients intéressés (leads) ----------
create table if not exists public.vehicle_leads (
  id          uuid primary key default uuid_generate_v4(),
  dealer_id   uuid not null references public.profiles(id) on delete cascade,
  vehicle_id  uuid references public.vehicles(id) on delete set null,
  name        text not null,
  phone       text,
  email       text,
  message     text,
  status      text not null default 'new' check (status in ('new','contacted','hot','cold','won','lost')),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_leads_dealer on public.vehicle_leads(dealer_id, created_at desc);
create index if not exists idx_leads_vehicle on public.vehicle_leads(vehicle_id);
drop trigger if exists trg_leads_touch on public.vehicle_leads;
create trigger trg_leads_touch before update on public.vehicle_leads for each row execute function public.touch_updated_at();
alter table public.vehicle_leads enable row level security;

drop policy if exists "leads_select_own" on public.vehicle_leads;
create policy "leads_select_own" on public.vehicle_leads for select to authenticated using (dealer_id = auth.uid());
drop policy if exists "leads_insert_own" on public.vehicle_leads;
create policy "leads_insert_own" on public.vehicle_leads for insert to authenticated with check (dealer_id = auth.uid());
drop policy if exists "leads_update_own" on public.vehicle_leads;
create policy "leads_update_own" on public.vehicle_leads for update to authenticated using (dealer_id = auth.uid()) with check (dealer_id = auth.uid());
drop policy if exists "leads_delete_own" on public.vehicle_leads;
create policy "leads_delete_own" on public.vehicle_leads for delete to authenticated using (dealer_id = auth.uid());

-- ---------- Favoris ----------
create table if not exists public.favorites (
  dealer_id   uuid not null references public.profiles(id) on delete cascade,
  vehicle_id  uuid not null references public.vehicles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (dealer_id, vehicle_id)
);
create index if not exists idx_favorites_dealer on public.favorites(dealer_id, created_at desc);
alter table public.favorites enable row level security;
drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own" on public.favorites for select to authenticated using (dealer_id = auth.uid());
drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own" on public.favorites for insert to authenticated with check (dealer_id = auth.uid());
drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own" on public.favorites for delete to authenticated using (dealer_id = auth.uid());

-- ---------- Storage : bucket pour images ----------
insert into storage.buckets (id, name, public)
values ('vehicle-images', 'vehicle-images', true)
on conflict (id) do nothing;

-- Lecture publique
drop policy if exists "vehicle_images_public_read" on storage.objects;
create policy "vehicle_images_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'vehicle-images');

-- Upload restreint au dossier <auth.uid()>/...
drop policy if exists "vehicle_images_authenticated_insert" on storage.objects;
create policy "vehicle_images_authenticated_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'vehicle-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "vehicle_images_authenticated_delete" on storage.objects;
create policy "vehicle_images_authenticated_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'vehicle-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "vehicle_images_authenticated_update" on storage.objects;
create policy "vehicle_images_authenticated_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'vehicle-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------- Storage : bucket privé pour documents ----------
insert into storage.buckets (id, name, public)
values ('vehicle-documents', 'vehicle-documents', false)
on conflict (id) do nothing;

drop policy if exists "vehicle_documents_owner_select" on storage.objects;
create policy "vehicle_documents_owner_select" on storage.objects for select to authenticated
  using (bucket_id = 'vehicle-documents' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "vehicle_documents_owner_insert" on storage.objects;
create policy "vehicle_documents_owner_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'vehicle-documents' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "vehicle_documents_owner_update" on storage.objects;
create policy "vehicle_documents_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'vehicle-documents' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "vehicle_documents_owner_delete" on storage.objects;
create policy "vehicle_documents_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'vehicle-documents' and (storage.foldername(name))[1] = auth.uid()::text);
