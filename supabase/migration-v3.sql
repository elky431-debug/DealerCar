-- =====================================================================
--  DealerLink — Migration V3
--  Section "Gestion" : ventes, annonces, profil étendu, catégories docs
-- =====================================================================

-- ---------- Vehicles : ventes + annonce ----------
alter table public.vehicles
  add column if not exists purchase_price numeric(12,2)
    check (purchase_price is null or purchase_price >= 0),
  add column if not exists sold_at        timestamptz,
  add column if not exists listing_title  text,
  add column if not exists photos_ok      boolean not null default false,
  add column if not exists clean_ok       boolean not null default false,
  add column if not exists ct_ok          boolean not null default false,
  add column if not exists video_ok       boolean not null default false;

create index if not exists idx_vehicles_sold_at on public.vehicles(sold_at desc) where status = 'sold';

-- Auto-set sold_at when status flips to 'sold'
create or replace function public.handle_vehicle_sold_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'sold' then
    if (tg_op = 'INSERT') or (old.status is distinct from 'sold') then
      new.sold_at := coalesce(new.sold_at, now());
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_vehicles_sold_at on public.vehicles;
create trigger trg_vehicles_sold_at
  before insert or update on public.vehicles
  for each row execute function public.handle_vehicle_sold_at();

-- ---------- Profiles : SIRET + spécialités ----------
alter table public.profiles
  add column if not exists siret       text,
  add column if not exists specialties text;

-- ---------- Documents : élargir les catégories ----------
alter table public.vehicle_documents
  drop constraint if exists vehicle_documents_category_check;
alter table public.vehicle_documents
  add constraint vehicle_documents_category_check
  check (category in (
    'photo_before','photo_after','video_before','video_after',
    'admin','other',
    'carte_grise','controle_technique','declaration_cession','facture'
  ));
