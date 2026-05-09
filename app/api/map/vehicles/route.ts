import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { geocodeLocationNominatim, inBoundingBox } from "@/lib/geocode-nominatim";
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

/** Message lisible quand la base n’a pas été migrée pour la carte. */
function mapApiUserMessage(technical: string): string {
  const t = technical.toLowerCase();
  const missingCol = t.includes("does not exist") || t.includes("schema cache");
  if (missingCol && t.includes("vehicles") && (t.includes("latitude") || t.includes("longitude"))) {
    return "La base Supabase n’a pas encore les colonnes GPS sur les véhicules. Dans Supabase → SQL Editor, exécutez le fichier supabase/migration-map.sql (ou migration-v7.sql), puis ré-enregistrez vos véhicules ou « Mon garage » pour remplir les coordonnées.";
  }
  if (missingCol && t.includes("profiles") && (t.includes("latitude") || t.includes("longitude"))) {
    return "La base n’a pas les colonnes GPS sur les profils marchands. Exécutez supabase/migration-map.sql (partie profiles) ou migration-v8.sql.";
  }
  return technical;
}

type ProfileRow = {
  id: string;
  company_name: string;
  phone: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
};

type VRow = {
  id: string;
  dealer_id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  location: string;
  type: string;
  status: string;
  visibility: string;
  latitude: number | string | null;
  longitude: number | string | null;
  vehicle_images: Pick<VehicleImage, "storage_path" | "position">[] | null;
};

const GEOCODE_THROTTLE_MS = 450;
const LOOSE_FETCH_LIMIT = 72;

function rowToVehicleCore(v: VRow) {
  const cover = (v.vehicle_images ?? []).slice().sort((a, b) => a.position - b.position)[0];
  const lat = v.latitude != null && v.latitude !== "" ? Number(v.latitude) : null;
  const lng = v.longitude != null && v.longitude !== "" ? Number(v.longitude) : null;
  return {
    id: v.id,
    dealer_id: v.dealer_id,
    brand: v.brand,
    model: v.model,
    year: v.year,
    mileage: v.mileage,
    price: Number(v.price),
    location: v.location,
    type: v.type,
    status: v.status,
    visibility: v.visibility,
    latitude: lat != null && Number.isFinite(lat) ? lat : null,
    longitude: lng != null && Number.isFinite(lng) ? lng : null,
    image: cover?.storage_path ?? null,
  };
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
  const city = searchParams.get("city")?.trim();
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
      "id,dealer_id,brand,model,year,mileage,price,location,type,status,visibility,latitude,longitude,vehicle_images(storage_path,position)",
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

  if (city) {
    const escaped = city.replace(/[%_]/g, "");
    if (escaped) req = req.ilike("location", `%${escaped}%`);
  }

  const { data, error, count } = await req;
  if (error) {
    return NextResponse.json({ error: mapApiUserMessage(error.message) }, { status: 400 });
  }

  const vehicleRows: ReturnType<typeof rowToVehicleCore>[] = (data ?? []).map((raw) =>
    rowToVehicleCore(raw as unknown as VRow),
  );

  const seenIds = new Set(vehicleRows.map((r) => r.id));

  /** Véhicules réseau sans GPS en base : géocodage à la volée si la carte serait vide ou trop légère. */
  let looseErr: { message: string } | null = null;
  const maxGeocode =
    vehicleRows.length === 0 ? 22 : vehicleRows.length < 12 ? 10 : 0;

  if (maxGeocode > 0 && vehicleRows.length < limit) {
    let looseReq = supabase
      .from("vehicles")
      .select(
        "id,dealer_id,brand,model,year,mileage,price,location,type,status,visibility,latitude,longitude,vehicle_images(storage_path,position)",
      )
      .eq("visibility", "network")
      .eq("status", "available")
      .or("latitude.is.null,longitude.is.null")
      .gte("price", priceMin)
      .lte("price", priceMax)
      .order("created_at", { ascending: false })
      .limit(LOOSE_FETCH_LIMIT);

    if (type === "stock" || type === "depot") {
      looseReq = looseReq.eq("type", type);
    }
    if (city) {
      const escaped = city.replace(/[%_]/g, "");
      if (escaped) looseReq = looseReq.ilike("location", `%${escaped}%`);
    }

    const { data: looseData, error: looseError } = await looseReq;
    if (looseError) {
      looseErr = looseError;
    } else {
      let geocoded = 0;
      const qNorm = query?.toLowerCase().replace(/[%_]/g, "") ?? "";
      const cityNorm = city?.toLowerCase().replace(/[%_]/g, "") ?? "";
      for (const raw of looseData ?? []) {
        if (geocoded >= maxGeocode) break;
        const v = rowToVehicleCore(raw as unknown as VRow);
        if (seenIds.has(v.id)) continue;
        if (v.latitude != null && v.longitude != null) continue;
        if (cityNorm && !v.location.toLowerCase().includes(cityNorm)) continue;
        if (qNorm) {
          const b = v.brand.toLowerCase();
          const m = v.model.toLowerCase();
          if (!b.includes(qNorm) && !m.includes(qNorm)) continue;
        }

        const coords = await geocodeLocationNominatim(v.location, { throttleMs: GEOCODE_THROTTLE_MS });
        geocoded++;
        if (!coords) continue;

        if (
          !inBoundingBox(coords.latitude, coords.longitude, minLat, maxLat, minLng, maxLng)
        ) {
          continue;
        }

        void supabase
          .from("vehicles")
          .update({ latitude: coords.latitude, longitude: coords.longitude })
          .eq("id", v.id);

        vehicleRows.push({
          ...v,
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        seenIds.add(v.id);
        if (vehicleRows.length >= limit) break;
      }
    }
  }

  const dealerIds = [...new Set(vehicleRows.map((r) => r.dealer_id))];
  const profileById = new Map<string, ProfileRow>();

  if (dealerIds.length > 0) {
    const profFull = await supabase
      .from("profiles")
      .select("id, company_name, phone, location, latitude, longitude")
      .in("id", dealerIds);
    const profRows =
      profFull.error || !profFull.data
        ? (await supabase.from("profiles").select("id, company_name, phone, location").in("id", dealerIds)).data
        : profFull.data;
    if (profRows) {
      for (const p of profRows as ProfileRow[]) {
        profileById.set(p.id, p);
      }
    }
  }

  let profileGeocodes = 0;
  const MAX_PROFILE_GEOCODE = 6;
  for (const id of dealerIds) {
    if (profileGeocodes >= MAX_PROFILE_GEOCODE) break;
    const p = profileById.get(id);
    if (!p?.location?.trim()) continue;
    if (p.latitude != null && p.longitude != null) continue;
    const c = await geocodeLocationNominatim(p.location, { throttleMs: GEOCODE_THROTTLE_MS });
    profileGeocodes++;
    if (!c) continue;
    profileById.set(id, {
      ...p,
      latitude: c.latitude,
      longitude: c.longitude,
    });
    void supabase
      .from("profiles")
      .update({ latitude: c.latitude, longitude: c.longitude })
      .eq("id", id);
  }

  let items = vehicleRows
    .filter((r) => r.latitude != null && r.longitude != null)
    .map((r) => {
      const p = profileById.get(r.dealer_id);
      return {
        ...r,
        latitude: r.latitude as number,
        longitude: r.longitude as number,
        dealer: {
          company_name: p?.company_name ?? "—",
          phone: p?.phone ?? "",
          location: p?.location ?? "",
          latitude: p?.latitude != null ? Number(p.latitude) : null,
          longitude: p?.longitude != null ? Number(p.longitude) : null,
        },
      };
    });

  const filtered =
    radiusKm > 0
      ? items.filter((v) =>
          haversineKm(centerLat, centerLng, Number(v.latitude), Number(v.longitude)) <= radiusKm,
        )
      : items;

  const payload: Record<string, unknown> = {
    items: filtered,
    page,
    limit,
    total: count ?? filtered.length,
  };

  if (vehicleRows.length === 0 && looseErr) {
    payload.warning = `Aucun véhicule avec coordonnées ; complément sans GPS impossible : ${mapApiUserMessage(looseErr.message)}`;
  }

  return NextResponse.json(payload);
}
