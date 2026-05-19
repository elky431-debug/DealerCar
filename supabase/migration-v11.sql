-- ============================================================
-- migration-v11.sql — Garages publics DealerLink
-- Profil marchand enrichi + bucket branding + compteur véhicules
-- ============================================================

-- ---------- Profil garage public ----------
alter table public.profiles
  add column if not exists description text,
  add column if not exists logo_storage_path text,
  add column if not exists banner_storage_path text,
  add column if not exists tagline text,
  add column if not exists slug text unique,
  add column if not exists is_network_visible boolean default true,
  add column if not exists vehicles_count int default 0;

create index if not exists idx_profiles_slug on public.profiles(slug);
create index if not exists idx_profiles_network on public.profiles(is_network_visible);

-- Slug URL-friendly (sans extension unaccent pour compatibilité maximale)
create or replace function public.generate_garage_slug(name text, city text)
returns text
language plpgsql
immutable
as $$
begin
  return lower(
    regexp_replace(
      regexp_replace(
        trim(coalesce(name, '') || '-' || coalesce(city, '')),
        '[^a-zA-Z0-9]+',
        '-',
        'g'
      ),
      '(^-|-$)',
      '',
      'g'
    )
  );
end;
$$;

-- Compteur véhicules réseau disponibles par marchand
create or replace function public.refresh_profile_vehicles_count(p_dealer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set vehicles_count = (
    select count(*)::int
    from public.vehicles v
    where v.dealer_id = p_dealer_id
      and v.visibility = 'network'
      and v.status = 'available'
  )
  where id = p_dealer_id;
end;
$$;

create or replace function public.trg_refresh_profile_vehicles_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_profile_vehicles_count(coalesce(new.dealer_id, old.dealer_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_vehicles_refresh_profile_count on public.vehicles;
create trigger trg_vehicles_refresh_profile_count
  after insert or update of visibility, status, dealer_id or delete
  on public.vehicles
  for each row
  execute function public.trg_refresh_profile_vehicles_count();

-- Backfill compteurs
do $$
declare r record;
begin
  for r in select id from public.profiles loop
    perform public.refresh_profile_vehicles_count(r.id);
  end loop;
end;
$$;

-- ---------- Storage : dealer-branding ----------
insert into storage.buckets (id, name, public)
values ('dealer-branding', 'dealer-branding', true)
on conflict (id) do update set public = true;

drop policy if exists "dealer_branding_public_read" on storage.objects;
create policy "dealer_branding_public_read"
  on storage.objects for select to public
  using (bucket_id = 'dealer-branding');

drop policy if exists "dealer_branding_owner_insert" on storage.objects;
create policy "dealer_branding_owner_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'dealer-branding'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "dealer_branding_owner_update" on storage.objects;
create policy "dealer_branding_owner_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'dealer-branding'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "dealer_branding_owner_delete" on storage.objects;
create policy "dealer_branding_owner_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'dealer-branding'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
