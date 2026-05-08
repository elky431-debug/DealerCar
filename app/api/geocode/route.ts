import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location")?.trim();

  if (!location) {
    return NextResponse.json({ error: "location manquante" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", location);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        // Required by Nominatim usage policy.
        "User-Agent": "dealerlink-map-geocoder/1.0",
      },
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "geocoding indisponible" }, { status: 502 });
    }

    const results = (await response.json()) as Array<{ lat: string; lon: string }>;
    const first = results[0];
    if (!first) return NextResponse.json({ latitude: null, longitude: null });

    return NextResponse.json({
      latitude: Number(first.lat),
      longitude: Number(first.lon),
    });
  } catch {
    return NextResponse.json({ error: "geocoding échoué" }, { status: 500 });
  }
}
