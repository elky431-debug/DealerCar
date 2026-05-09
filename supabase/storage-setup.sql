-- =====================================================================
--  DealerLink — Setup Storage (buckets + policies)
--  Idempotent : peut être ré-exécuté sans danger.
-- =====================================================================

-- ---------- Buckets ----------
insert into storage.buckets (id, name, public)
values ('vehicle-images', 'vehicle-images', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('vehicle-documents', 'vehicle-documents', false)
on conflict (id) do nothing;

-- ---------- Policies : vehicle-images ----------
drop policy if exists "vehicle_images_public_read" on storage.objects;
create policy "vehicle_images_public_read"
  on storage.objects for select to public
  using (bucket_id = 'vehicle-images');

drop policy if exists "vehicle_images_authenticated_insert" on storage.objects;
create policy "vehicle_images_authenticated_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'vehicle-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "vehicle_images_authenticated_update" on storage.objects;
create policy "vehicle_images_authenticated_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'vehicle-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "vehicle_images_authenticated_delete" on storage.objects;
create policy "vehicle_images_authenticated_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'vehicle-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------- Policies : vehicle-documents ----------
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

-- ---------- dealer-branding ----------
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
