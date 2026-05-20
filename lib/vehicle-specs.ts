/**
 * Référentiel ADEME — matching et helpers d'enrichissement.
 *
 * Stratégie de matching (cascade) :
 *   1. Match exact insensible à la casse sur (brand, model_label)
 *      → si plusieurs résultats : préférer fuel_type si fourni, puis le plus récent.
 *   2. Match fuzzy via ILIKE %brand% + %model% en fallback.
 *   3. Aucun match : retourne null avec confidence "none".
 *
 * Les normalisations (uppercase, trim, ponctuation type "B.M.W.") permettent de
 * matcher quel que soit ce que le marchand a saisi dans son inventaire.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Vehicle,
  VehicleSpec,
  SpecMatchResult,
  SpecMatchConfidence,
} from "@/lib/types";

/* ────────── Normalisation ────────── */

/**
 * Normalise une chaîne pour le matching : majuscules, sans accents,
 * sans ponctuation, espaces simples. Conserve les chiffres.
 */
export function normalizeForMatch(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Variantes courantes pour gérer les saisies utilisateur. */
function brandAliases(input: string): string[] {
  const norm = normalizeForMatch(input);
  const variants = new Set<string>([norm]);

  // BMW ↔ B.M.W. ↔ BMW (pas d'accent dans le CSV ADEME mais ils ont des points)
  if (norm === "BMW") variants.add("B M W");
  if (norm === "B M W") variants.add("BMW");

  // Mercedes / Mercedes-Benz
  if (norm.startsWith("MERCEDES")) {
    variants.add("MERCEDES");
    variants.add("MERCEDES BENZ");
  }

  // VW ↔ Volkswagen
  if (norm === "VW") variants.add("VOLKSWAGEN");
  if (norm === "VOLKSWAGEN") variants.add("VW");

  return [...variants];
}

/* ────────── Matching ────────── */

interface FindOptions {
  brand: string;
  model: string;
  fuelType?: string | null; // ESSENCE, GAZOLE, ELECTRIC, HYBRID...
  /** Limite de candidats à comparer (par défaut 50, suffisant pour 99% des cas). */
  limit?: number;
}

/**
 * Trouve la meilleure fiche ADEME pour un véhicule.
 * Compatible avec n'importe quel SupabaseClient (server ou route handler).
 */
export async function findVehicleSpecs(
  supabase: SupabaseClient,
  opts: FindOptions,
): Promise<SpecMatchResult> {
  const brand = opts.brand?.trim();
  const model = opts.model?.trim();
  if (!brand || !model) {
    return { spec: null, confidence: "none", alternatives: 0 };
  }

  const limit = opts.limit ?? 50;
  const aliases = brandAliases(brand);
  const modelNorm = normalizeForMatch(model);

  // 1) Match exact (brand IN (...) AND lower(model_label) = lower(model))
  //    On utilise filter() chaîné car .in() avec lower() n'est pas direct.
  const orBrand = aliases
    .map((b) => `brand.ilike.${escapeIlike(b)}`)
    .join(",");

  const exactQuery = await supabase
    .from("vehicle_specs")
    .select("*")
    .or(orBrand)
    .ilike("model_label", model)
    .limit(limit);

  if (exactQuery.data && exactQuery.data.length > 0) {
    const best = pickBest(exactQuery.data as VehicleSpec[], opts.fuelType);
    return { spec: best, confidence: "exact", alternatives: exactQuery.data.length };
  }

  // 2) Match fuzzy via ILIKE %model% sur la marque normalisée
  //    On essaie d'abord brand+model, puis brand seul si rien.
  const fuzzyQuery = await supabase
    .from("vehicle_specs")
    .select("*")
    .or(orBrand)
    .ilike("model_label", `%${escapeIlike(modelNorm)}%`)
    .limit(limit);

  if (fuzzyQuery.data && fuzzyQuery.data.length > 0) {
    const best = pickBest(fuzzyQuery.data as VehicleSpec[], opts.fuelType);
    return { spec: best, confidence: "fuzzy", alternatives: fuzzyQuery.data.length };
  }

  return { spec: null, confidence: "none", alternatives: 0 };
}

/** Échappe les wildcards SQL dans une valeur ILIKE. */
function escapeIlike(s: string): string {
  return s.replace(/[%_\\]/g, (m) => `\\${m}`);
}

/** Sélectionne la meilleure fiche dans un set de candidats. */
function pickBest(
  candidates: VehicleSpec[],
  fuelType?: string | null,
): VehicleSpec {
  let pool = candidates;

  // Filtre par carburant si fourni
  if (fuelType) {
    const fNorm = fuelType.toUpperCase();
    const matching = pool.filter((s) => s.fuel_type === fNorm);
    if (matching.length > 0) pool = matching;
  }

  // Trie par : source_year desc, puis power_max_kw desc (la version la plus complète/recente)
  pool.sort((a, b) => {
    const ya = a.source_year ?? 0;
    const yb = b.source_year ?? 0;
    if (yb !== ya) return yb - ya;
    return (b.power_max_kw ?? 0) - (a.power_max_kw ?? 0);
  });

  return pool[0];
}

/** Helper pratique : matching à partir d'un objet Vehicle complet. */
export function findVehicleSpecsForVehicle(
  supabase: SupabaseClient,
  vehicle: Pick<Vehicle, "brand" | "model">,
  opts?: { fuelType?: string | null },
): Promise<SpecMatchResult> {
  return findVehicleSpecs(supabase, {
    brand: vehicle.brand,
    model: vehicle.model,
    fuelType: opts?.fuelType ?? null,
  });
}

/* ────────── Helpers d'affichage ────────── */

/**
 * Classe énergie A→G en fonction des g CO2/km (barème historique français,
 * encore largement utilisé dans les annonces).
 */
export type EnergyClass = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export function getEnergyClass(co2: number | null | undefined): EnergyClass | null {
  if (co2 === null || co2 === undefined || !Number.isFinite(co2)) return null;
  if (co2 <= 100) return "A";
  if (co2 <= 120) return "B";
  if (co2 <= 140) return "C";
  if (co2 <= 160) return "D";
  if (co2 <= 200) return "E";
  if (co2 <= 250) return "F";
  return "G";
}

export const ENERGY_CLASS_COLORS: Record<EnergyClass, string> = {
  A: "bg-emerald-500",
  B: "bg-lime-500",
  C: "bg-yellow-400",
  D: "bg-amber-500",
  E: "bg-brand",
  F: "bg-red-500",
  G: "bg-rose-700",
};

/* ────────── Estimation coût annuel ────────── */

/**
 * Hypothèses moyennes France (2025).
 * Volontairement conservatrices et calibrables via params.
 */
export interface AnnualCostInput {
  fuelType: string;
  consoMixedAvg?: number | null; // L/100km thermique
  consoElecAvg?: number | null; // kWh/100km électrique
  kmPerYear?: number; // défaut 13 000
  pricePetrol?: number; // €/L défaut 1.85
  priceDiesel?: number; // €/L défaut 1.75
  priceElec?: number; // €/kWh défaut 0.22
}

export interface AnnualCostResult {
  euroPerYear: number;
  euroPer100km: number;
  details: string;
}

export function estimateAnnualFuelCost(
  input: AnnualCostInput,
): AnnualCostResult | null {
  const km = input.kmPerYear ?? 13_000;
  const f = input.fuelType.toUpperCase();

  const isElec = f.includes("ELECTRIC") || f === "EL";
  const isDiesel = f.includes("GAZOLE") || f === "DIESEL";
  const isHybridPetrol = f.includes("HYBRID") && !isDiesel;

  if (isElec) {
    const conso = input.consoElecAvg;
    if (!conso) return null;
    const price = input.priceElec ?? 0.22;
    const eur100 = (conso / 100) * 100 * price; // €/100km
    return {
      euroPerYear: Math.round((conso / 100) * km * price),
      euroPer100km: Math.round(eur100 * 10) / 10,
      details: `${conso.toFixed(1)} kWh/100km × ${km.toLocaleString("fr-FR")} km × ${price.toFixed(2)} €/kWh`,
    };
  }

  // Thermique / hybride
  const conso = input.consoMixedAvg;
  if (!conso) return null;
  const price = isDiesel
    ? (input.priceDiesel ?? 1.75)
    : (input.pricePetrol ?? 1.85);
  const eur100 = (conso / 100) * 100 * price;
  return {
    euroPerYear: Math.round((conso / 100) * km * price),
    euroPer100km: Math.round(eur100 * 10) / 10,
    details: `${conso.toFixed(1)} L/100km × ${km.toLocaleString("fr-FR")} km × ${price.toFixed(2)} €/L`,
  };
}

/** Moyenne min/max si dispo, sinon le seul présent, sinon null. */
export function avg(min: number | null, max: number | null): number | null {
  if (min !== null && max !== null) return (min + max) / 2;
  return min ?? max ?? null;
}
