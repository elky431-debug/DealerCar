/** Leads sur la fiche d'un véhicule (pas de join vehicles). */
export const VEHICLE_LEAD_DETAIL_SELECT = [
  "id",
  "dealer_id",
  "vehicle_id",
  "name",
  "phone",
  "email",
  "message",
  "status",
  "notes",
  "created_at",
  "updated_at",
].join(",");

/** Liste leads (clients) sans `*`. */
export const VEHICLE_LEAD_LIST_SELECT = [
  "id",
  "dealer_id",
  "vehicle_id",
  "name",
  "phone",
  "email",
  "message",
  "status",
  "notes",
  "created_at",
  "updated_at",
  "vehicles(id, brand, model, year)",
].join(",");
