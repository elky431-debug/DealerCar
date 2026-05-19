import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PRICE_FORMATTER = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const NUMBER_FORMATTER = new Intl.NumberFormat("fr-FR");

export function formatPrice(value: number | null | undefined): string {
  if (value == null) return "—";
  return PRICE_FORMATTER.format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  return NUMBER_FORMATTER.format(value);
}

export function formatMileage(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${NUMBER_FORMATTER.format(value)} km`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Met en forme un texte type "marque" / "modèle" en Title Case propre.
 * Préserve les abréviations courantes (BMW, GTI, AMG, RS…) et les chiffres.
 *
 *  formatTitle("renault clio")  -> "Renault Clio"
 *  formatTitle("BMW X5 m sport")-> "BMW X5 M Sport"
 *  formatTitle("e-tron gt")     -> "E-Tron GT"
 */
const KEEP_UPPER = new Set([
  "BMW", "AMG", "GTI", "GTD", "GT", "RS", "SUV", "DCT", "ABS", "TDI", "TSI",
  "FSI", "CDI", "CDTI", "MPV", "AWD", "FWD", "RWD", "4WD", "4X4", "VTEC",
  "DSG", "PHEV", "BEV", "HEV", "EV", "CC", "VW", "GLI", "ST", "M3", "M5",
  "M2", "Q3", "Q5", "Q7", "Q8", "X1", "X2", "X3", "X4", "X5", "X6", "X7",
]);

export function formatTitle(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .split(/(\s+|-)/) // garde séparateurs (espaces, tirets)
    .map((part) => {
      if (/^\s+$/.test(part) || part === "-") return part;
      const upper = part.toUpperCase();
      if (KEEP_UPPER.has(upper)) return upper;
      // motifs alphanumériques courts (ex: "x5", "a3", "v8") -> upper
      if (/^[a-z]\d+$/.test(part)) return upper;
      if (part.length === 0) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  const now = Date.now();
  const diff = now - d.getTime();
  const sec = Math.round(diff / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (sec < 60) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  if (hr < 24) return `il y a ${hr} h`;
  if (day < 30) return `il y a ${day} j`;
  return formatDate(d);
}

export function publicImageUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return storagePath;
  return `${base}/storage/v1/object/public/vehicle-images/${storagePath}`;
}

export function publicBrandingUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return storagePath;
  return `${base}/storage/v1/object/public/dealer-branding/${storagePath}`;
}

/**
 * Convertit un fichier image en base64 (sans le préfixe data:).
 * Compresse l'image à 1600px max pour rester sous la limite payload.
 */
export async function fileToCompressedBase64(
  file: File,
  maxDim = 1600,
  quality = 0.85,
): Promise<{ base64: string; type: "image/jpeg" | "image/png" | "image/webp" | "image/gif" }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Impossible de compresser l'image");
  ctx.drawImage(img, 0, 0, w, h);

  const out = canvas.toDataURL("image/jpeg", quality);
  const base64 = out.split(",")[1] ?? "";
  return { base64, type: "image/jpeg" };
}
