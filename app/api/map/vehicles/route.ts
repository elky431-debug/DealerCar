import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { VehicleImage } from "@/lib/types";

function toNumber(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const minLat = toNumber(searchParams.get("minLat"), -90);
  const maxLat = toNumber(searchParams.get("maxLat"), 90);
  const minLng = toNumber(searchParams.get("minLng"), -180);
  const maxLng = toNumber(searchParams.get("maxLng"), 180);
  const priceMin = toNumber(searchParams.get("priceMin"), 0);
  const priceMax = toNumber(searchParams.get("priceMax"), Number.MAX_SAFE_INTEGER);
  const query = searchParams.get("q")?.trim();
  const type = searchParams.get("type");
  const radiusKm = toNumber(searchParams.get("radiusKm"), 0);
  const centerLat = toNumber(searchParams.get("centerLat"), 0);
  const centerLng = toNumber(searchParams.get("centerLng"), 0);

  const page = Math.max(1, toNumber(searchParams.get("page"), 1));
  const limit = Math.min(300, Math.max(20, toNumber(searchParams.get("limit"), 200)));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let req = supabase
    .from("vehicles")
    .select(
      "id,brand,model,year,mileage,price,location,type,status,visibility,latitude,longitude,vehicle_images(storage_path,position)",
      { count: "exact" },
    )
    .eq("visibility", "network")
    .eq("status", "available")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .gte("latitude", minLat)
    .lte("latitude", maxLat)
    .gte("longitude", minLng)
    .lte("longitude", maxLng)
    .gte("price", priceMin)
    .lte("price", priceMax)
    .range(from, to)
    .order("created_at", { ascending: false });

  if (query) {
    const escaped = query.replace(/[%_]/g, "");
    req = req.or(`brand.ilike.%${escaped}%,model.ilike.%${escaped}%`);
  }

  if (type === "stock" || type === "depot") {
    req = req.eq("type", type);
  }

  const { data, error, count } = await req;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const rows = (data ?? []).map((v) => {
    const cover = ((v.vehicle_images ?? []) as VehicleImage[])
      .slice()
      .sort((a, b) => a.position - b.position)[0];
    return {
      ...v,
      image: cover?.storage_path ?? null,
    };
  });

  const filtered =
    radiusKm > 0
      ? rows.filter((v) =>
          haversineKm(centerLat, centerLng, Number(v.latitude), Number(v.longitude)) <= radiusKm,
        )
      : rows;

  return NextResponse.json({
    items: filtered,
    page,
    limit,
    total: count ?? filtered.length,
  });
}
