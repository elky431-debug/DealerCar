import type { ClientSearch, Vehicle } from "@/lib/types";

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

function includesLoose(hay: string, needle: string): boolean {
  if (!needle.trim()) return true;
  return norm(hay).includes(norm(needle));
}

/** Score 0–100 : budget, km, année, marque/modèle, zone, carburant/boîte (via description). */
export function compatibilityScore(search: ClientSearch, vehicle: Vehicle): number {
  let score = 0;
  const weights = { brandModel: 28, budget: 28, km: 18, year: 14, zone: 6, extras: 6 };
  const desc = vehicle.description ?? "";

  if (includesLoose(vehicle.brand, search.brand) && includesLoose(vehicle.model, search.model)) {
    score += weights.brandModel;
  } else if (
    includesLoose(`${vehicle.brand} ${vehicle.model}`, search.brand) ||
    includesLoose(`${vehicle.brand} ${vehicle.model}`, search.model)
  ) {
    score += weights.brandModel * 0.65;
  }

  const price = Number(vehicle.price);
  const min = search.budget_min != null ? Number(search.budget_min) : null;
  const max = search.budget_max != null ? Number(search.budget_max) : null;
  if (min != null && max != null && min <= max) {
    if (price >= min && price <= max) score += weights.budget;
    else {
      const mid = (min + max) / 2;
      const span = Math.max(max - min, 1);
      const dist = Math.min(Math.abs(price - min), Math.abs(price - max), Math.abs(price - mid));
      score += weights.budget * Math.max(0, 1 - dist / (span * 1.5));
    }
  } else if (max != null) {
    if (price <= max) score += weights.budget;
    else score += weights.budget * Math.max(0, 1 - (price - max) / Math.max(max, 1));
  } else if (min != null) {
    if (price >= min) score += weights.budget;
    else score += weights.budget * Math.max(0, 1 - (min - price) / Math.max(min, 1));
  } else {
    score += weights.budget * 0.85;
  }

  if (search.mileage_max != null) {
    if (vehicle.mileage <= search.mileage_max) score += weights.km;
    else {
      const over = vehicle.mileage - search.mileage_max;
      score += weights.km * Math.max(0, 1 - over / Math.max(search.mileage_max, 1));
    }
  } else {
    score += weights.km * 0.85;
  }

  if (search.year_min != null) {
    if (vehicle.year >= search.year_min) score += weights.year;
    else {
      const under = search.year_min - vehicle.year;
      score += weights.year * Math.max(0, 1 - under / 8);
    }
  } else {
    score += weights.year * 0.85;
  }

  if (search.geo_zone?.trim()) {
    if (includesLoose(vehicle.location, search.geo_zone)) score += weights.zone;
    else score += weights.zone * 0.35;
  } else {
    score += weights.zone * 0.85;
  }

  let extra = 0;
  if (search.fuel?.trim()) {
    if (includesLoose(desc, search.fuel)) extra += 0.5;
    else extra += 0.15;
  } else {
    extra += 0.5;
  }
  if (search.gearbox === "automatic") {
    if (/\bauto(matic|matique)?\b/i.test(desc)) extra += 0.5;
    else extra += 0.2;
  } else if (search.gearbox === "manual") {
    if (/\bmanu(elle)?\b|\bmt\b|\bméca\b/i.test(desc)) extra += 0.5;
    else extra += 0.2;
  } else {
    extra += 0.5;
  }
  score += weights.extras * extra;

  return Math.round(Math.min(100, Math.max(0, score)) * 10) / 10;
}

export type MatchBand = "strong" | "close" | "stretch";

export function matchBand(score: number): MatchBand {
  if (score >= 72) return "strong";
  if (score >= 52) return "close";
  return "stretch";
}

export interface SourcingHint {
  title: string;
  lines: string[];
}

export function buildSourcingHints(search: ClientSearch, strongCount: number): SourcingHint[] {
  const hints: SourcingHint[] = [];

  if (strongCount === 0) {
    const lines: string[] = [];
    if (search.budget_max != null) {
      lines.push(`Augmenter le budget d'environ 2 000 € pour élargir le marché.`);
    }
    if (search.mileage_max != null) {
      lines.push(`Relâcher le kilométrage max (+20 000 à 40 000 km) pour débloquer plus d'offres.`);
    }
    if (search.year_min != null) {
      lines.push(`Descendre l'année minimum d'un an ou deux.`);
    }
    if (lines.length === 0) {
      lines.push(`Élargir la zone géographique ou contacter vos sources sur des modèles proches.`);
    }
    hints.push({
      title: "Aucune offre très alignée pour l'instant",
      lines,
    });
  }

  if (search.budget_max != null && search.mileage_max != null) {
    hints.push({
      title: "Compromis terrain (estimation)",
      lines: [
        `+20 000 km sur le max autorise souvent 10 à 25 % d'annonces en plus sur ce budget.`,
        `+2 000 € sur le plafond déplace souvent la médiane de prix suffisamment pour capter des fins de stock.`,
      ],
    });
  }

  return hints;
}

/** Heuristique 1–10 + estimation jours + flag rare */
export function sourcingDifficultyMeta(search: ClientSearch): {
  difficulty: number;
  etaMin: number;
  etaMax: number;
  isRare: boolean;
} {
  let difficulty = 3;
  const brand = norm(search.brand);
  const premium = ["bmw", "mercedes", "audi", "porsche", "land rover", "lexus"].some((p) =>
    brand.includes(p),
  );
  if (premium) difficulty += 1;

  if (search.budget_max != null && search.budget_max < 8000) difficulty += 2;
  if (search.year_min != null && search.year_min >= new Date().getFullYear() - 2) difficulty += 1;
  if (search.mileage_max != null && search.mileage_max < 80000) difficulty += 1;
  if (search.geo_zone?.trim() && search.distance_max_km != null && search.distance_max_km < 80) {
    difficulty += 1;
  }
  if (search.priority === "urgent") difficulty += 1;

  difficulty = Math.min(10, Math.max(1, difficulty));
  const isRare = difficulty >= 8 || premium;

  const etaMin = Math.max(1, difficulty - 2);
  const etaMax = Math.min(21, difficulty * 2 + 3);

  return { difficulty, etaMin, etaMax, isRare };
}
