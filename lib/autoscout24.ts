export interface AutoScout24Params {
  make?: string;
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  priceFrom?: number;
  priceTo?: number;
  mileageTo?: number;
  fuel?: "essence" | "diesel" | "hybride" | "electrique";
  zip?: string;
  radius?: number;
}

const FUEL_MAP: Record<string, string> = {
  essence: "B",
  diesel: "D",
  hybride: "H",
  electrique: "E",
};

const MAKE_SLUGS: Record<string, string> = {
  BMW: "bmw",
  Peugeot: "peugeot",
  Renault: "renault",
  "Citroën": "citroen",
  Volkswagen: "volkswagen",
  Mercedes: "mercedes-benz",
  Audi: "audi",
  Ford: "ford",
  Toyota: "toyota",
  Opel: "opel",
  Dacia: "dacia",
  Fiat: "fiat",
  Seat: "seat",
  Skoda: "skoda",
  Nissan: "nissan",
  Hyundai: "hyundai",
  Kia: "kia",
  Volvo: "volvo",
  Porsche: "porsche",
  "Land Rover": "land-rover",
};

export function buildAutoScout24SearchUrl(params: AutoScout24Params): string {
  const base = "https://www.autoscout24.fr/lst";

  const makeSlug = params.make ? MAKE_SLUGS[params.make] || params.make.toLowerCase() : null;
  const makePath = makeSlug ? `/${makeSlug}` : "";

  const modelPath =
    makeSlug && params.model ? `/${params.model.toLowerCase().replace(/\s+/g, "-")}` : "";

  const url = new URL(`${base}${makePath}${modelPath}`);

  if (params.yearFrom) url.searchParams.set("fregfrom", params.yearFrom.toString());
  if (params.yearTo) url.searchParams.set("fregto", params.yearTo.toString());
  if (params.priceFrom) url.searchParams.set("pricefrom", params.priceFrom.toString());
  if (params.priceTo) url.searchParams.set("priceto", params.priceTo.toString());
  if (params.mileageTo) url.searchParams.set("kmto", params.mileageTo.toString());
  if (params.fuel) url.searchParams.set("fuel", FUEL_MAP[params.fuel] || "");
  if (params.zip) url.searchParams.set("zip", params.zip);
  if (params.radius != null) url.searchParams.set("zipr", params.radius.toString());

  url.searchParams.set("cy", "F");
  url.searchParams.set("sort", "age");
  url.searchParams.set("desc", "0");
  url.searchParams.set("ustate", "U,N");

  return url.toString();
}

export function buildAutoScout24IframeUrl(params: AutoScout24Params): string {
  return buildAutoScout24SearchUrl(params);
}
