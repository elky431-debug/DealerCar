import { NextResponse } from "next/server";
import { OPENAI_MODEL, getOpenAIClient, parseJsonFromText } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 60;

type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

type ImagePayload = {
  base64: string;
  type: ImageMediaType;
};

export type FuelType = "Essence" | "Diesel" | "Hybride" | "Électrique" | "GPL";

export interface CarteGriseData {
  plate_number: string | null;
  first_registration_date: string | null; // YYYY-MM-DD
  make: string | null;
  model: string | null;
  version: string | null;
  fuel_type: FuelType | null;
  power_kw: number | null;
  engine_displacement: number | null;
  seats: number | null;
  ptac: number | null;
  confidence: "faible" | "moyen" | "élevé";
  unreadable_fields: string[];
  is_carte_grise: boolean;
}

const ALLOWED_TYPES = new Set<ImageMediaType>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(req: Request) {
  let body: { image?: ImagePayload };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const image = body.image;
  if (!image?.base64 || !ALLOWED_TYPES.has(image.type)) {
    return NextResponse.json(
      { error: "Une photo est requise (JPG, PNG ou WEBP)." },
      { status: 400 },
    );
  }

  let client;
  try {
    client = getOpenAIClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Configuration IA manquante." },
      { status: 500 },
    );
  }

  try {
    const response = await client.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: 1000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Tu es un expert français en lecture de cartes grises (certificats d'immatriculation). " +
            "Tu lis avec précision les champs A, B, D.1, D.2, D.3, F.1, P.1, P.3, P.6, S.1. " +
            "Tu retournes UNIQUEMENT un objet JSON valide.",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${image.type};base64,${image.base64}`,
                detail: "high",
              },
            },
            {
              type: "text",
              text: `Lis cette image (réponse en json) et retourne ce JSON exact :
{
  "is_carte_grise": boolean,                  // true si c'est bien une carte grise française, sinon false
  "plate_number": string | null,              // champ A, format AB-123-CD ou ancien
  "first_registration_date": "YYYY-MM-DD" | null,  // champ B
  "make": string | null,                      // champ D.1, ex. "RENAULT", "BMW"
  "model": string | null,                     // champ D.2, ex. "CLIO IV"
  "version": string | null,                   // champ D.3 (dénomination commerciale)
  "fuel_type": "Essence" | "Diesel" | "Hybride" | "Électrique" | "GPL" | null,  // champ P.6
  "power_kw": number | null,                  // champ P.3 en kW
  "engine_displacement": number | null,       // champ P.1 en cm³
  "seats": number | null,                     // champ S.1
  "ptac": number | null,                      // champ F.1 en kg
  "confidence": "faible" | "moyen" | "élevé",
  "unreadable_fields": [string]               // libellés des champs illisibles
}

Règles strictes :
- Si l'image n'est pas une carte grise française, mets is_carte_grise: false et tous les autres champs à null.
- Pour le carburant, normalise vers les 5 valeurs autorisées (ES → "Essence", GO → "Diesel", EH/EE → "Hybride", EL → "Électrique", GP → "GPL").
- Si un champ est partiellement lisible mais douteux, mets-le à null et ajoute son nom dans unreadable_fields.
- Ne devine jamais. Mieux vaut null qu'une erreur.`,
            },
          ],
        },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim();
    if (!text) {
      return NextResponse.json({ error: "Réponse IA vide." }, { status: 502 });
    }

    const data = parseJsonFromText<CarteGriseData>(text);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur d'analyse";
    const status =
      msg.includes("rate") || msg.includes("quota") || msg.includes("429")
        ? 429
        : 502;
    return NextResponse.json({ error: msg }, { status });
  }
}
