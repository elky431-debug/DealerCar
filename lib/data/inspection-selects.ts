/** Liste inspections (page sourcing). */
export const INSPECTION_LIST_SELECT = [
  "id",
  "dealer_id",
  "title",
  "vehicle_brand",
  "vehicle_model",
  "vehicle_year",
  "vehicle_plate",
  "current_step",
  "steps_state",
  "decision",
  "created_at",
  "updated_at",
  "completed_at",
].join(",");

/** Fiche inspection wizard (jsonb steps_state requis). */
export const INSPECTION_DETAIL_SELECT = [
  "id",
  "dealer_id",
  "title",
  "vehicle_brand",
  "vehicle_model",
  "vehicle_year",
  "vehicle_plate",
  "vehicle_vin",
  "buyer_first_name",
  "buyer_last_name",
  "current_step",
  "steps_state",
  "decision",
  "decision_notes",
  "created_at",
  "updated_at",
  "completed_at",
].join(",");
