-- ============================================================
-- migration-v9.sql — Profil concession (logo, bannière, réseaux)
--
-- Applique sur ton projet Supabase :
--   • SQL Editor : coller ce fichier → Run
--   • Ou en local : npm run db:setup  (inclut ce fichier si DATABASE_URL est dans .env.local)
--   • Ou seulement ce fichier : npm run db:sql -- supabase/migration-v9.sql
-- ============================================================

alter table public.profiles
  add column if not exists logo_storage_path   text,
  add column if not exists banner_storage_path text,
  add column if not exists tagline             text,
  add column if not exists website_url          text,
  add column if not exists social_facebook_url  text,
  add column if not exists social_instagram_url text,
  add column if not exists social_linkedin_url  text,
  add column if not exists social_x_url         text;

-- Bucket public pour logos / bannières (chemin : {user_id}/...)
insert into storage.buckets (id, name, public)
values ('dealer-branding', 'dealer-branding', true)
on conflict (id) do nothing;

drop policy if exists "dealer_branding_public_read" on storage.objects;
create policy "dealer_branding_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'dealer-branding');

drop policy if exists "dealer_branding_owner_insert" on storage.objects;
create policy "dealer_branding_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'dealer-branding'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "dealer_branding_owner_update" on storage.objects;
create policy "dealer_branding_owner_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'dealer-branding'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "dealer_branding_owner_delete" on storage.objects;
create policy "dealer_branding_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'dealer-branding'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
