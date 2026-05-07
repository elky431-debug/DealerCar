import { NextResponse } from "next/server";
import { OPENAI_MODEL, getOpenAIClient, parseJsonFromText } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 30;

export interface ChassisLocationResult {
  /** 2-5 emplacements probables, du plus probable au moins probable. */
  locations: {
    label: string; // ex: "Bas du pare-brise côté conducteur"
    detail: string; // ex: "Visible derrière une fenêtre dans le tableau de bord"
    confidence: "élevée" | "moyenne" | "faible";
  }[];
  /** Conseils complémentaires (ex: "regardez aussi votre carte grise case E"). */
  notes: string;
  /** Avertissement si la marque/modèle/année est trop incertain. */
  warning: string | null;
}

/**
 * POST /api/inspections/ai/chassis-location
 * Body : { brand, model, year? }
 *
 * Retourne les emplacements probables de la frappe à froid (VIN gravé)
 * pour ce véhicule, par ordre de probabilité.
 */
export async function POST(req: Request) {
  let body: { brand?: string; model?: string; year?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const brand = (body.brand ?? "").trim();
  const model = (body.model ?? "").trim();
  if (!brand || !model) {
    return NextResponse.json(
      { error: "Marque et modèle requis." },
      { status: 400 },
    );
  }

  let client;
  try {
    client = getOpenAIClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "IA indisponible" },
      { status: 500 },
    );
  }

  const yearStr = body.year ? ` ${body.year}` : "";

  try {
    const response = await client.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Tu es expert en mécanique automobile française. Tu connais l'emplacement de la frappe à froid (VIN gravé sur le châssis) pour les principaux constructeurs européens, asiatiques et américains. " +
            "Tu retournes UNIQUEMENT un JSON valide sans texte autour.",
        },
        {
          role: "user",
          content: `Pour un ${brand} ${model}${yearStr}, où se trouve la frappe à froid (VIN) sur le véhicule ?

Réponds UNIQUEMENT avec ce JSON valide :
{
  "locations": [
    {
      "label": string,             // emplacement court (ex: "Bas du pare-brise côté conducteur")
      "detail": string,            // précision pratique (ex: "Visible à travers le pare-brise, dans une petite fenêtre noire dans le tableau de bord")
      "confidence": "élevée" | "moyenne" | "faible"
    }
  ],
  "notes": string,                 // 1-2 phrases : conseils, ex. "vérifier aussi la case E de la carte grise"
  "warning": string | null         // si modèle peu connu / multiples générations possibles
}

Donne 2 à 4 emplacements, classés du plus probable au moins probable. Sois précis (pas "sous le capot" mais "sur la traverse avant droite, à proximité du serrage de capot").`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim();
    if (!text) {
      return NextResponse.json({ error: "Réponse IA vide." }, { status: 502 });
    }

    const result = parseJsonFromText<ChassisLocationResult>(text);
    return NextResponse.json({ success: true, result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur d'analyse";
    const status =
      msg.includes("rate") || msg.includes("quota") || msg.includes("429")
        ? 429
        : 502;
    return NextResponse.json({ error: msg }, { status });
  }
}
