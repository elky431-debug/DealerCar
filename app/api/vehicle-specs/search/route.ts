import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/supabase/server";
import { findVehicleSpecs } from "@/lib/vehicle-specs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/vehicle-specs/search?marque=...&modele=...[&fuel=...]
 *
 * Recherche la meilleure fiche ADEME pour un couple (marque, modèle).
 * Réponse :
 *   - spec : VehicleSpec | null
 *   - confidence : "exact" | "fuzzy" | "none"
 *   - alternatives : nb total de fiches compatibles avant tri
 */
export async function GET(req: Request) {
  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const url = new URL(req.url);
  const brand = url.searchParams.get("marque")?.trim() ?? "";
  const model = url.searchParams.get("modele")?.trim() ?? "";
  const fuel = url.searchParams.get("fuel")?.trim() ?? null;

  if (!brand || !model) {
    return NextResponse.json(
      { error: "Paramètres requis : marque, modele" },
      { status: 400 },
    );
  }

  try {
    const result = await findVehicleSpecs(supabase, {
      brand,
      model,
      fuelType: fuel,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
