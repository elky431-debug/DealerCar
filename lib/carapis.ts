/**
 * Carapis API wrapper (server-side only).
 *
 * Doc : https://docs.carapis.com/api/intro
 *
 * Sources supportées :
 *  - autoscout24 : 20+ pays européens (FR, DE, IT, ES, BE…)
 *  - mobile.de   : Allemagne (sourcing populaire pour les marchands FR)
 *
 * Réponse renvoyée toujours normalisée → MarketListing[]
 */

const BASE_URL = "https://api.carapis.com/v1/parsers";

export type MarketSource = "autoscout24" | "mobile.de";

export interface MarketSearchInput {
  source: MarketSource;
  query?: string;
  brand?: string;
  model?: string;
  country?: string; // ISO 3166-1 alpha-2 ("FR", "DE"...)
  yearFrom?: number;
  yearTo?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  fuelType?: string; // diesel, gasoline, electric, hybrid...
  transmission?: string; // automatic, manual
  location?: string;
  limit?: number; // default 30
  page?: number; // default 1
}

export interface MarketListing {
  id: string;
  source: MarketSource;
  title: string;
  brand?: string;
  model?: string;
  year?: number;
  priceEur?: number;
  mileageKm?: number;
  fuelType?: string;
  transmission?: string;
  power?: string;
  city?: string;
  country?: string;
  imageUrl?: string;
  dealerName?: string;
  url?: string;
}

export interface MarketSearchResult {
  source: MarketSource;
  total: number;
  listings: MarketListing[];
}

export class CarapisError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

function getApiKey(): string {
  const key = process.env.CARAPIS_API_KEY;
  if (!key) throw new CarapisError("CARAPIS_API_KEY manquante", 500);
  return key;
}

/* ---------- Public API ---------- */

export async function searchMarket(
  input: MarketSearchInput,
): Promise<MarketSearchResult> {
  const apiKey = getApiKey();
  const limit = Math.min(Math.max(input.limit ?? 30, 1), 100);
  const page = Math.max(input.page ?? 1, 1);

  const url = `${BASE_URL}/${input.source}/search`;
  const body = buildSearchBody(input, limit, page);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const json = await res.json().catch(() => ({}) as Record<string, unknown>);

  if (!res.ok) {
    const errObj = (json as { error?: { code?: string; message?: string } })
      .error;
    throw new CarapisError(
      errObj?.message ?? `Erreur Carapis (HTTP ${res.status})`,
      res.status,
      errObj?.code,
    );
  }

  return normalizeResponse(input.source, json);
}

/* ---------- Internals ---------- */

function buildSearchBody(
  input: MarketSearchInput,
  limit: number,
  page: number,
): Record<string, unknown> {
  const q =
    input.query?.trim() ||
    [input.brand, input.model].filter(Boolean).join(" ").trim();

  // Mobile.de : champ price min/max + year_from/year_to
  if (input.source === "mobile.de") {
    return strip({
      query: q || undefined,
      min_price: input.priceMin,
      max_price: input.priceMax,
      year_from: input.yearFrom,
      year_to: input.yearTo,
      mileage_max: input.mileageMax,
      fuel_type: input.fuelType,
      transmission: input.transmission,
      location: input.location,
      limit,
      offset: (page - 1) * limit,
    });
  }

  // AutoScout24 : country + price_min/max + page
  return strip({
    query: q || undefined,
    country: input.country,
    year_from: input.yearFrom,
    year_to: input.yearTo,
    price_min: input.priceMin,
    price_max: input.priceMax,
    mileage_max: input.mileageMax,
    fuel_type: input.fuelType,
    transmission: input.transmission,
    location: input.location,
    limit,
    page,
  });
}

function strip<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out as Partial<T>;
}

function normalizeResponse(
  source: MarketSource,
  raw: unknown,
): MarketSearchResult {
  // Carapis renvoie toujours { success, data: { listings, total_count } }
  // mais la clé exacte varie un peu selon la source → on prend large.
  const r = raw as Record<string, unknown>;
  const data = (r.data ?? r) as Record<string, unknown>;
  const rawListings =
    (data.listings as unknown[]) ?? (data.data as unknown[]) ?? [];

  const total =
    Number((data.total_count as number) ?? (data.total as number) ?? rawListings.length) || 0;

  const listings = rawListings
    .map((item) => normalizeListing(source, item as Record<string, unknown>))
    .filter((l): l is MarketListing => l !== null);

  return { source, total, listings };
}

function normalizeListing(
  source: MarketSource,
  raw: Record<string, unknown>,
): MarketListing | null {
  if (!raw || typeof raw !== "object") return null;

  const id = String(raw.id ?? raw._id ?? "");
  if (!id) return null;

  const specs =
    (raw.specifications as Record<string, unknown>) ??
    (raw.specs as Record<string, unknown>) ??
    {};

  const priceObj = raw.price as Record<string, unknown> | number | undefined;
  const priceEur =
    typeof priceObj === "number"
      ? priceObj
      : typeof priceObj?.amount === "number"
        ? (priceObj.amount as number)
        : undefined;

  const mileageRaw = raw.mileage ?? specs.mileage;
  const mileageKm =
    typeof mileageRaw === "number"
      ? mileageRaw
      : typeof (mileageRaw as Record<string, unknown>)?.value === "number"
        ? ((mileageRaw as Record<string, unknown>).value as number)
        : undefined;

  const location = (raw.location as Record<string, unknown>) ?? {};
  const dealer =
    (raw.dealer as Record<string, unknown>) ??
    (raw.seller as Record<string, unknown>) ??
    {};

  const images = (raw.images as unknown[]) ?? [];
  const firstImage = images[0];
  const imageUrl =
    typeof firstImage === "string"
      ? firstImage
      : typeof (firstImage as Record<string, unknown>)?.url === "string"
        ? ((firstImage as Record<string, unknown>).url as string)
        : undefined;

  return {
    id,
    source,
    title: String(raw.title ?? raw.name ?? `${specs.make ?? ""} ${specs.model ?? ""}`.trim()),
    brand: (specs.make as string) ?? (raw.brand as string) ?? (raw.make as string),
    model: (specs.model as string) ?? (raw.model as string),
    year: numOrUndef(specs.year ?? raw.year),
    priceEur,
    mileageKm,
    fuelType: (specs.fuel_type as string) ?? (raw.fuel_type as string),
    transmission: (specs.transmission as string) ?? (raw.transmission as string),
    power: (specs.power as string) ?? (raw.power as string),
    city: (location.city as string) ?? (raw.city as string),
    country: (location.country as string) ?? (raw.country as string),
    imageUrl,
    dealerName:
      (dealer.name as string) ??
      (typeof raw.seller === "string" ? raw.seller : undefined),
    url: (raw.url as string) ?? (raw.link as string),
  };
}

function numOrUndef(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
