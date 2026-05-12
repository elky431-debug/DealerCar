/**
 * Fragments `select()` Supabase pour éviter `*` (moins de données, parse JSON plus léger).
 */

/** Liste / cartes (VehicleCard, filtres garage & réseau). */
export const VEHICLE_CARD_LIST_SELECT = [
  "id",
  "dealer_id",
  "brand",
  "model",
  "year",
  "mileage",
  "price",
  "location",
  "status",
  "type",
  "visibility",
  "vehicle_images(id, storage_path, position)",
].join(",");

/** Lignes tableau dépôts-vente. */
export const VEHICLE_DEPOT_TABLE_SELECT = [
  "id",
  "brand",
  "model",
  "year",
  "mileage",
  "location",
  "price",
  "status",
  "client_price",
  "commission_type",
  "commission_value",
  "deposit_client_name",
  "deposit_client_phone",
  "deposit_client_email",
].join(",");

/** Fiche véhicule complète (owner ou réseau) + images. */
export const VEHICLE_DETAIL_SELECT = [
  "id",
  "dealer_id",
  "brand",
  "model",
  "year",
  "mileage",
  "price",
  "location",
  "description",
  "type",
  "visibility",
  "status",
  "client_price",
  "commission_type",
  "commission_value",
  "deposit_client_name",
  "deposit_client_phone",
  "deposit_client_email",
  "deposit_client_address",
  "deposit_notes",
  "purchase_price",
  "sold_at",
  "listing_title",
  "photos_ok",
  "clean_ok",
  "ct_ok",
  "video_ok",
  "created_at",
  "updated_at",
  "vehicle_images(id, vehicle_id, storage_path, position, created_at)",
].join(",");
