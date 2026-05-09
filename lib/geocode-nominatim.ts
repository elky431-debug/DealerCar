/**
 * Géocodage Nominatim (serveur). Cache mémoire par requête pour les libellés dupliqués.
 * Respecter la politique d’usage : petit délai entre appels si beaucoup d’adresses.
 */
const requestCache = new Map<string, { latitude: number; longitude: number } | null>();

export async function geocodeLocationNominatim(
  location: string,
  options?: { throttleMs?: number },
): Promise<{ latitude: number; longitude: number } | null> {
  const q = location?.trim();
  if (!q) return null;

  const key = q.toLowerCase();
  if (requestCache.has(key)) {
    const hit = requestCache.get(key);
    return hit ? { ...hit } : null;
  }

  if (options?.throttleMs && options.throttleMs > 0) {
    await new Promise((r) => setTimeout(r, options.throttleMs));
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  try {
    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "dealerlink-map-geocoder/1.0" },
    });
    if (!response.ok) {
      requestCache.set(key, null);
      return null;
    }
    const results = (await response.json()) as Array<{ lat: string; lon: string }>;
    const first = results[0];
    if (!first) {
      requestCache.set(key, null);
      return null;
    }
    const coords = { latitude: Number(first.lat), longitude: Number(first.lon) };
    requestCache.set(key, coords);
    return coords;
  } catch {
    requestCache.set(key, null);
    return null;
  }
}

export function inBoundingBox(
  lat: number,
  lng: number,
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
): boolean {
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}
