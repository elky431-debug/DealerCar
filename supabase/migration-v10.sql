-- ============================================================
-- migration-v10.sql — Personnalisation des étapes de consultation
-- ============================================================
-- steps_config : ordre des étapes, étapes par défaut désactivées,
-- étapes personnalisées créées par le dealer.

alter table public.vehicle_inspections
  add column if not exists steps_config jsonb;

-- Autoriser plus d'étapes si l'utilisateur en ajoute (défaut + custom)
alter table public.vehicle_inspections
  drop constraint if exists vehicle_inspections_current_step_check;

alter table public.vehicle_inspections
  add constraint vehicle_inspections_current_step_check
  check (current_step between 1 and 50);
