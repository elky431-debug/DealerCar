-- ============================================================
-- migration-v5.sql — Specs véhicules (référentiel ADEME Car Labelling)
--
-- Référentiel de données ouvertes ADEME sur la consommation/CO2
-- des véhicules neufs en France. Table de lecture publique
-- (pas liée à un dealer), enrichit les fiches véhicule existantes.
-- ============================================================

create table if not exists public.vehicle_specs (
  id                  uuid primary key default gen_random_uuid(),

  -- Identification
  brand               text not null,
  model_label         text not null,            -- ex: "SERIE 2", "KANGOO"
  model_code          text,                     -- ex: "218" (sous-code constructeur)
  commercial_desc     text not null,            -- ex: "218i Active Tourer"
  group_name          text,                     -- ex: "B.M.W.", "RENAULT", "VGF"

  -- Carburant / motorisation
  fuel_type           text not null,            -- ESSENCE, GAZOLE, ELECTRIC, HYBRID, etc.
  body_type           text,                     -- BERLINE, COMBISPACE, SUV, etc.
  range_segment       text,                     -- INFERIEURE, MOYENNE INFERIEURE, etc.

  -- Caractéristiques techniques
  cylinder_cc         int,                      -- cylindrée (cm³)
  fiscal_power        int,                      -- chevaux fiscaux (CV)
  power_max_kw        numeric(7,2),             -- puissance maximale (kW)
  power_elec_kw       numeric(7,2),             -- puissance moteur électrique (kW)
  weight_empty_kg     int,                      -- poids à vide (kg)
  gearbox_type        text,                     -- AUTOMATIQUE, MANUEL, etc.
  gear_count          int,

  -- Consommation thermique mixte WLTP (L/100km)
  conso_mixed_min     numeric(6,3),
  conso_mixed_max     numeric(6,3),

  -- Consommation électrique (kWh/100km)
  conso_elec_min      numeric(6,3),
  conso_elec_max      numeric(6,3),

  -- Autonomie électrique (km, WLTP mixte)
  autonomy_min_km     int,
  autonomy_max_km     int,

  -- Émissions CO2 mixte WLTP (g/km)
  co2_mixed_min       numeric(7,2),
  co2_mixed_max       numeric(7,2),

  -- Bonus / Malus écologique
  bonus_malus_label   text,                     -- "Malus", "Neutre 0", "Bonus 6000"
  bonus_malus_amount  int,                      -- montant € (négatif si bonus, positif si malus)

  -- Prix constructeur
  vehicle_price_eur   int,

  -- Métadonnées
  source              text not null default 'ademe',
  source_year         int,
  imported_at         timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Une fiche unique par (marque, libellé modèle, description, énergie, puissance)
  -- Évite les doublons si on réimporte le CSV
  constraint vehicle_specs_uniq unique (brand, model_label, commercial_desc, fuel_type, power_max_kw)
);

-- Index pour matching rapide depuis les véhicules en stock
create index if not exists idx_vehicle_specs_brand_model
  on public.vehicle_specs (lower(brand), lower(model_label));

create index if not exists idx_vehicle_specs_brand
  on public.vehicle_specs (lower(brand));

create index if not exists idx_vehicle_specs_fuel
  on public.vehicle_specs (fuel_type);

-- Trigger updated_at
create or replace function public.touch_vehicle_specs_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_vehicle_specs_updated_at on public.vehicle_specs;
create trigger trg_vehicle_specs_updated_at
  before update on public.vehicle_specs
  for each row execute function public.touch_vehicle_specs_updated_at();

-- ----------------------------------------------------------------
-- RLS : lecture publique (tout marchand authentifié peut consulter)
-- Aucune écriture autorisée via API → seuls les scripts d'admin
-- (qui passent par le service role) peuvent insérer/modifier.
-- ----------------------------------------------------------------
alter table public.vehicle_specs enable row level security;

drop policy if exists "vs_select_authenticated" on public.vehicle_specs;
create policy "vs_select_authenticated" on public.vehicle_specs
  for select to authenticated using (true);
