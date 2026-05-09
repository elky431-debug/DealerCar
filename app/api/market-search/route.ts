import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/supabase/server";
import {
  searchMarket,
  CarapisError,
  type MarketSearchInput,
  type MarketSource,
} from "@/lib/carapis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOURCES: MarketSource[] = ["autoscout24", "mobile.de"];

export async function POST(req: Request) {
  // Auth check — uniquement les marchands connectés
  const { user } = await getServerAuth();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: Partial<MarketSearchInput>;
  try {
    body = (await req.json()) as Partial<MarketSearchInput>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const source = (body.source ?? "autoscout24") as MarketSource;
  if (!SOURCES.includes(source)) {
    return NextResponse.json(
      { error: `Source non supportée. Valeurs : ${SOURCES.join(", ")}` },
      { status: 400 },
    );
  }

  const input: MarketSearchInput = {
    source,
    query: body.query,
    brand: body.brand,
    model: body.model,
    country: body.country ?? (source === "mobile.de" ? "DE" : "FR"),
    yearFrom: numOrUndef(body.yearFrom),
    yearTo: numOrUndef(body.yearTo),
    priceMin: numOrUndef(body.priceMin),
    priceMax: numOrUndef(body.priceMax),
    mileageMax: numOrUndef(body.mileageMax),
    fuelType: body.fuelType,
    transmission: body.transmission,
    location: body.location,
    limit: numOrUndef(body.limit) ?? 30,
    page: numOrUndef(body.page) ?? 1,
  };

  try {
    const result = await searchMarket(input);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof CarapisError) {
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: e.status },
      );
    }
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function numOrUndef(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
