/** Documents véhicule (liste fiche). */
export const VEHICLE_DOCUMENT_LIST_SELECT = [
  "id",
  "vehicle_id",
  "dealer_id",
  "name",
  "storage_path",
  "mime_type",
  "size_bytes",
  "category",
  "created_at",
].join(",");

/** Frais véhicule (liste fiche). */
export const VEHICLE_COST_LIST_SELECT = [
  "id",
  "vehicle_id",
  "dealer_id",
  "label",
  "amount",
  "category",
  "date",
  "source",
  "notes",
  "created_at",
  "updated_at",
].join(",");
