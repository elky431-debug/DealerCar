-- ============================================================
-- migration-v9.sql — Recherche client (CRM sourcing)
-- Tables : contacts professionnels, recherches client, liaisons,
-- véhicules shortlist, journal d'événements.
-- ============================================================

-- ---------- Contacts professionnels (carnet marchand) ----------
create table if not exists public.sourcing_contacts (
  id            uuid primary key default gen_random_uuid(),
  dealer_id     uuid not null references public.profiles(id) on delete cascade,
  garage_name   text not null,
  contact_name  text,
  phone         text,
  city          text,
  specialty     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_sourcing_contacts_dealer
  on public.sourcing_contacts(dealer_id, updated_at desc);

drop trigger if exists trg_sourcing_contacts_touch on public.sourcing_contacts;
create trigger trg_sourcing_contacts_touch
  before update on public.sourcing_contacts
  for each row execute function public.touch_updated_at();

-- ---------- Recherches client ----------
create table if not exists public.client_searches (
  id                 uuid primary key default gen_random_uuid(),
  dealer_id          uuid not null references public.profiles(id) on delete cascade,

  client_name        text not null,
  client_phone       text,
  client_notes       text,

  brand              text not null,
  model              text not null,
  version            text,
  fuel               text,
  gearbox            text check (gearbox is null or gearbox in ('automatic', 'manual')),

  budget_min         numeric(12,2) check (budget_min is null or budget_min >= 0),
  budget_max         numeric(12,2) check (budget_max is null or budget_max >= 0),
  mileage_max        int check (mileage_max is null or mileage_max >= 0),
  year_min           int check (year_min is null or year_min between 1900 and extract(year from now())::int + 1),
  geo_zone           text,
  distance_max_km    int check (distance_max_km is null or distance_max_km >= 0),

  priority           text not null default 'normal'
    check (priority in ('normal', 'urgent', 'premium')),
  status             text not null default 'active'
    check (status in ('active', 'vehicle_found', 'negotiating', 'completed', 'abandoned')),

  internal_notes     text,
  sourcing_progress  int not null default 0 check (sourcing_progress between 0 and 100),

  is_rare            boolean not null default false,
  difficulty_score   int check (difficulty_score is null or difficulty_score between 1 and 10),
  eta_days_min       int check (eta_days_min is null or eta_days_min >= 0),
  eta_days_max       int check (eta_days_max is null or eta_days_max >= 0),

  last_opened_at     timestamptz,

  cached_match_count int not null default 0,
  cached_match_at    timestamptz,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_client_searches_dealer
  on public.client_searches(dealer_id, updated_at desc);

create index if not exists idx_client_searches_status
  on public.client_searches(dealer_id, status);

drop trigger if exists trg_client_searches_touch on public.client_searches;
create trigger trg_client_searches_touch
  before update on public.client_searches
  for each row execute function public.touch_updated_at();

-- ---------- Sources attachées à une recherche ----------
create table if not exists public.client_search_source_assignments (
  id                   uuid primary key default gen_random_uuid(),
  search_id            uuid not null references public.client_searches(id) on delete cascade,
  contact_id           uuid not null references public.sourcing_contacts(id) on delete cascade,

  follow_up_status     text not null default 'no_response'
    check (follow_up_status in ('no_response', 'pending', 'vehicle_found', 'declined')),
  last_contacted_at    timestamptz,
  response_received    text,
  vehicle_available    boolean,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  unique (search_id, contact_id)
);

create index if not exists idx_cssa_search on public.client_search_source_assignments(search_id);
create index if not exists idx_cssa_contact on public.client_search_source_assignments(contact_id);

drop trigger if exists trg_cssa_touch on public.client_search_source_assignments;
create trigger trg_cssa_touch
  before update on public.client_search_source_assignments
  for each row execute function public.touch_updated_at();

-- ---------- Shortlist / véhicules liés à une recherche ----------
create table if not exists public.client_search_vehicles (
  id                   uuid primary key default gen_random_uuid(),
  search_id            uuid not null references public.client_searches(id) on delete cascade,
  vehicle_id           uuid not null references public.vehicles(id) on delete cascade,

  slot                 text not null default 'saved'
    check (slot in ('saved', 'proposed', 'seller_contacted')),
  notes                text,
  compatibility_score  numeric(5,2),

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  unique (search_id, vehicle_id)
);

create index if not exists idx_csv_search on public.client_search_vehicles(search_id);
create index if not exists idx_csv_vehicle on public.client_search_vehicles(vehicle_id);

drop trigger if exists trg_csv_touch on public.client_search_vehicles;
create trigger trg_csv_touch
  before update on public.client_search_vehicles
  for each row execute function public.touch_updated_at();

-- ---------- Historique ----------
create table if not exists public.client_search_events (
  id          uuid primary key default gen_random_uuid(),
  search_id   uuid not null references public.client_searches(id) on delete cascade,
  event_type  text not null,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_cse_search on public.client_search_events(search_id, created_at desc);

-- ---------- RLS ----------
alter table public.sourcing_contacts enable row level security;
alter table public.client_searches enable row level security;
alter table public.client_search_source_assignments enable row level security;
alter table public.client_search_vehicles enable row level security;
alter table public.client_search_events enable row level security;

-- sourcing_contacts
drop policy if exists "sc_select_own" on public.sourcing_contacts;
drop policy if exists "sc_insert_own" on public.sourcing_contacts;
drop policy if exists "sc_update_own" on public.sourcing_contacts;
drop policy if exists "sc_delete_own" on public.sourcing_contacts;

create policy "sc_select_own" on public.sourcing_contacts
  for select using (dealer_id = auth.uid());
create policy "sc_insert_own" on public.sourcing_contacts
  for insert with check (dealer_id = auth.uid());
create policy "sc_update_own" on public.sourcing_contacts
  for update using (dealer_id = auth.uid()) with check (dealer_id = auth.uid());
create policy "sc_delete_own" on public.sourcing_contacts
  for delete using (dealer_id = auth.uid());

-- client_searches
drop policy if exists "cs_select_own" on public.client_searches;
drop policy if exists "cs_insert_own" on public.client_searches;
drop policy if exists "cs_update_own" on public.client_searches;
drop policy if exists "cs_delete_own" on public.client_searches;

create policy "cs_select_own" on public.client_searches
  for select using (dealer_id = auth.uid());
create policy "cs_insert_own" on public.client_searches
  for insert with check (dealer_id = auth.uid());
create policy "cs_update_own" on public.client_searches
  for update using (dealer_id = auth.uid()) with check (dealer_id = auth.uid());
create policy "cs_delete_own" on public.client_searches
  for delete using (dealer_id = auth.uid());

-- client_search_source_assignments (via recherche)
drop policy if exists "cssa_select" on public.client_search_source_assignments;
drop policy if exists "cssa_insert" on public.client_search_source_assignments;
drop policy if exists "cssa_update" on public.client_search_source_assignments;
drop policy if exists "cssa_delete" on public.client_search_source_assignments;

create policy "cssa_select" on public.client_search_source_assignments
  for select using (
    exists (
      select 1 from public.client_searches cs
      where cs.id = search_id and cs.dealer_id = auth.uid()
    )
  );
create policy "cssa_insert" on public.client_search_source_assignments
  for insert with check (
    exists (
      select 1 from public.client_searches cs
      where cs.id = search_id and cs.dealer_id = auth.uid()
    )
    and exists (
      select 1 from public.sourcing_contacts sc
      where sc.id = contact_id and sc.dealer_id = auth.uid()
    )
  );
create policy "cssa_update" on public.client_search_source_assignments
  for update using (
    exists (
      select 1 from public.client_searches cs
      where cs.id = search_id and cs.dealer_id = auth.uid()
    )
  );
create policy "cssa_delete" on public.client_search_source_assignments
  for delete using (
    exists (
      select 1 from public.client_searches cs
      where cs.id = search_id and cs.dealer_id = auth.uid()
    )
  );

-- client_search_vehicles
drop policy if exists "csv_select" on public.client_search_vehicles;
drop policy if exists "csv_insert" on public.client_search_vehicles;
drop policy if exists "csv_update" on public.client_search_vehicles;
drop policy if exists "csv_delete" on public.client_search_vehicles;

create policy "csv_select" on public.client_search_vehicles
  for select using (
    exists (
      select 1 from public.client_searches cs
      where cs.id = search_id and cs.dealer_id = auth.uid()
    )
  );
create policy "csv_insert" on public.client_search_vehicles
  for insert with check (
    exists (
      select 1 from public.client_searches cs
      where cs.id = search_id and cs.dealer_id = auth.uid()
    )
  );
create policy "csv_update" on public.client_search_vehicles
  for update using (
    exists (
      select 1 from public.client_searches cs
      where cs.id = search_id and cs.dealer_id = auth.uid()
    )
  );
create policy "csv_delete" on public.client_search_vehicles
  for delete using (
    exists (
      select 1 from public.client_searches cs
      where cs.id = search_id and cs.dealer_id = auth.uid()
    )
  );

-- client_search_events
drop policy if exists "cse_select" on public.client_search_events;
drop policy if exists "cse_insert" on public.client_search_events;
drop policy if exists "cse_delete" on public.client_search_events;

create policy "cse_select" on public.client_search_events
  for select using (
    exists (
      select 1 from public.client_searches cs
      where cs.id = search_id and cs.dealer_id = auth.uid()
    )
  );
create policy "cse_insert" on public.client_search_events
  for insert with check (
    exists (
      select 1 from public.client_searches cs
      where cs.id = search_id and cs.dealer_id = auth.uid()
    )
  );
create policy "cse_delete" on public.client_search_events
  for delete using (
    exists (
      select 1 from public.client_searches cs
      where cs.id = search_id and cs.dealer_id = auth.uid()
    )
  );
