export type VehicleType = "stock" | "depot";
export type VehicleVisibility = "private" | "network";
export type VehicleStatus = "available" | "reserved" | "sold";
export type CommissionType = "fixed" | "percent";

export interface Profile {
  id: string;
  email: string;
  company_name: string;
  phone: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  siret: string | null;
  specialties: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  dealer_id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  location: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  type: VehicleType;
  visibility: VehicleVisibility;
  status: VehicleStatus;
  client_price: number | null;
  commission_type: CommissionType | null;
  commission_value: number | null;
  deposit_client_name: string | null;
  deposit_client_phone: string | null;
  deposit_client_email: string | null;
  deposit_client_address: string | null;
  deposit_notes: string | null;
  // Sales & listing
  purchase_price: number | null;
  sold_at: string | null;
  listing_title: string | null;
  photos_ok: boolean;
  clean_ok: boolean;
  ct_ok: boolean;
  video_ok: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleImage {
  id: string;
  vehicle_id: string;
  storage_path: string;
  position: number;
  created_at: string;
}

export interface VehicleWithRelations extends Vehicle {
  vehicle_images: VehicleImage[];
  profiles?: Profile | null;
}

export const STATUS_LABELS: Record<VehicleStatus, string> = {
  available: "Disponible",
  reserved: "Réservé",
  sold: "Vendu",
};

export const TYPE_LABELS: Record<VehicleType, string> = {
  stock: "Stock",
  depot: "Dépôt-vente",
};

export const VISIBILITY_LABELS: Record<VehicleVisibility, string> = {
  private: "Privé",
  network: "Réseau",
};

// ---------- Documents ----------
export type DocumentCategory =
  | "photo_before"
  | "photo_after"
  | "video_before"
  | "video_after"
  | "admin"
  | "other"
  | "carte_grise"
  | "controle_technique"
  | "declaration_cession"
  | "facture";

export interface VehicleDocument {
  id: string;
  vehicle_id: string;
  dealer_id: string;
  name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  category: DocumentCategory;
  created_at: string;
}

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  carte_grise: "Carte grise",
  controle_technique: "Contrôle technique",
  declaration_cession: "Déclaration de cession",
  facture: "Facture",
  photo_before: "Photo avant réparation",
  photo_after: "Photo après réparation",
  video_before: "Vidéo avant réparation",
  video_after: "Vidéo après réparation",
  admin: "Administratif",
  other: "Autre",
};

export const ADMIN_DOCUMENT_CATEGORIES: DocumentCategory[] = [
  "carte_grise",
  "controle_technique",
  "declaration_cession",
  "facture",
  "admin",
  "other",
];

// ---------- Leads (clients intéressés) ----------
export type LeadStatus = "new" | "contacted" | "hot" | "cold" | "won" | "lost";

export interface Lead {
  id: string;
  dealer_id: string;
  vehicle_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  message: string | null;
  status: LeadStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadWithVehicle extends Lead {
  vehicles?: Pick<Vehicle, "id" | "brand" | "model" | "year"> | null;
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  hot: "Chaud",
  cold: "Froid",
  won: "Gagné",
  lost: "Perdu",
};

// ---------- Favoris ----------
export interface Favorite {
  dealer_id: string;
  vehicle_id: string;
  created_at: string;
}

// ---------- Frais véhicule ----------
export type CostCategory =
  | "reparation"
  | "controle_technique"
  | "nettoyage"
  | "administratif"
  | "autre";

export type CostSource = "manuel" | "ia_estimation";

export interface VehicleCost {
  id: string;
  vehicle_id: string;
  dealer_id: string;
  label: string;
  amount: number;
  category: CostCategory;
  date: string;
  source: CostSource;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const COST_CATEGORY_LABELS: Record<CostCategory, string> = {
  reparation: "Réparation",
  controle_technique: "Contrôle technique",
  nettoyage: "Nettoyage / Préparation",
  administratif: "Administratif",
  autre: "Autre",
};

// ---------- Specs véhicule (référentiel ADEME) ----------
export interface VehicleSpec {
  id: string;
  brand: string;
  model_label: string;
  model_code: string | null;
  commercial_desc: string;
  group_name: string | null;
  fuel_type: string;
  body_type: string | null;
  range_segment: string | null;
  cylinder_cc: number | null;
  fiscal_power: number | null;
  power_max_kw: number | null;
  power_elec_kw: number | null;
  weight_empty_kg: number | null;
  gearbox_type: string | null;
  gear_count: number | null;
  conso_mixed_min: number | null;
  conso_mixed_max: number | null;
  conso_elec_min: number | null;
  conso_elec_max: number | null;
  autonomy_min_km: number | null;
  autonomy_max_km: number | null;
  co2_mixed_min: number | null;
  co2_mixed_max: number | null;
  bonus_malus_label: string | null;
  bonus_malus_amount: number | null;
  vehicle_price_eur: number | null;
  source: string;
  source_year: number | null;
  imported_at: string;
  updated_at: string;
}

export type SpecMatchConfidence = "exact" | "fuzzy" | "none";

export interface SpecMatchResult {
  spec: VehicleSpec | null;
  confidence: SpecMatchConfidence;
  /** Nb total de fiches ADEME compatibles avec cette marque+modèle (avant tri). */
  alternatives: number;
}

// ---------- Inspection pré-achat ("Consultation complète") ----------

export type InspectionDecision = "go" | "no_go" | "uncertain";

/**
 * État sauvegardé par étape.
 * - `done` : étape validée par l'utilisateur (cliquée "Valider l'étape")
 * - `checks` : map id_check -> bool (toggles d'une checklist)
 * - `notes` : texte libre
 * - `data` : champs structurés spécifiques à l'étape (ex: noms Histovec)
 * - `attachments` : liens stockage Supabase (photos uploadées)
 * - `aiResult` : JSON brut renvoyé par les endpoints IA (chassis, CT)
 */
export interface InspectionStepState {
  done?: boolean;
  checks?: Record<string, boolean>;
  notes?: string;
  data?: Record<string, string | number | boolean | null>;
  attachments?: { url: string; path: string; mime: string }[];
  aiResult?: unknown;
  updatedAt?: string;
}

export interface VehicleInspection {
  id: string;
  dealer_id: string;
  title: string;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_plate: string | null;
  vehicle_vin: string | null;
  buyer_first_name: string | null;
  buyer_last_name: string | null;
  current_step: number;
  steps_state: Record<string, InspectionStepState>;
  decision: InspectionDecision | null;
  decision_notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export const INSPECTION_DECISION_LABELS: Record<InspectionDecision, string> = {
  go: "À acheter",
  no_go: "À éviter",
  uncertain: "Incertain",
};
