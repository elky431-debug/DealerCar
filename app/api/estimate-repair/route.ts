import { NextResponse } from "next/server";
import type { ChatCompletionContentPart } from "openai/resources/index.mjs";
import { OPENAI_MODEL, getOpenAIClient, parseJsonFromText, openAiCompletionAbort } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 60;

type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

type ImagePayload = {
  base64: string;
  type: ImageMediaType;
};

interface EstimateZone {
  zone: string;
  type_dommage: string;
  gravite: "légère" | "modérée" | "grave";
  reparation_recommandee: string;
  cout_min: number;
  cout_max: number;
}

export interface RepairEstimate {
  zones_detectees: EstimateZone[];
  cout_total_min: number;
  cout_total_max: number;
  recommandation: "reparer_avant_vente" | "vendre_en_etat" | "declarer_annonce";
  justification: string;
  niveau_confiance: "faible" | "moyen" | "élevé";
  avertissement: string | null;
}

const ALLOWED_TYPES = new Set<ImageMediaType>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(req: Request) {
  let body: { images?: ImagePayload[]; comment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const images = (body.images ?? []).filter(
    (i) => i?.base64 && ALLOWED_TYPES.has(i.type),
  );
  if (images.length === 0) {
    return NextResponse.json(
      { error: "Au moins une photo est requise." },
      { status: 400 },
    );
  }
  if (images.length > 5) {
    return NextResponse.json({ error: "5 photos maximum." }, { status: 400 });
  }

  const comment = (body.comment ?? "").trim().slice(0, 500);

  let client;
  try {
    client = getOpenAIClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Configuration IA manquante." },
      { status: 500 },
    );
  }

  const userContent: ChatCompletionContentPart[] = images.map((img) => ({
    type: "image_url",
    image_url: {
      url: `data:${img.type};base64,${img.base64}`,
      detail: "high",
    },
  }));

  userContent.push({
    type: "text",
    text: `Analyse ces photos de dommages sur un véhicule${
      comment ? `. Contexte du marchand : ${comment}` : ""
    }.

Retourne UNIQUEMENT cet objet JSON valide (réponse en json) :
{
  "zones_detectees": [
    {
      "zone": string,                       // ex. "Aile avant droite", "Pare-choc arrière"
      "type_dommage": string,               // ex. "Rayure profonde", "Enfoncement", "Fissure"
      "gravite": "légère" | "modérée" | "grave",
      "reparation_recommandee": string,     // ex. "Débosselage + peinture"
      "cout_min": number,                   // €, marché français carrosserie indé
      "cout_max": number
    }
  ],
  "cout_total_min": number,
  "cout_total_max": number,
  "recommandation": "reparer_avant_vente" | "vendre_en_etat" | "declarer_annonce",
  "justification": string,                  // 1-2 phrases concises
  "niveau_confiance": "faible" | "moyen" | "élevé",
  "avertissement": string | null            // si photos floues, mauvais angle, etc.
}

Règles :
- Si aucun dommage visible, retourne zones_detectees: [], cout_total_min: 0, cout_total_max: 0, recommandation: "vendre_en_etat", justification expliquant l'absence de dommage.
- Sois conservateur sur les coûts : fourchette réaliste pour un marchand pro français.
- Si le doute est important, mets niveau_confiance: "faible" et explique dans avertissement.`,
  });

  try {
    const { signal, clear } = openAiCompletionAbort();
    let response;
    try {
      response = await client.chat.completions.create(
        {
          model: OPENAI_MODEL,
          max_tokens: 1500,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "Tu es un expert français en estimation de réparation automobile (carrosserie, mécanique, peinture). " +
                "Tu travailles pour un marchand auto pro. " +
                "Tu es précis, conservateur et tu ne retournes JAMAIS rien d'autre qu'un JSON valide.",
            },
            { role: "user", content: userContent },
          ],
        },
        { signal },
      );
    } finally {
      clear();
    }

    const text = response.choices[0]?.message?.content?.trim();
    if (!text) {
      return NextResponse.json({ error: "Réponse IA vide." }, { status: 502 });
    }

    const estimate = parseJsonFromText<RepairEstimate>(text);
    return NextResponse.json({ success: true, estimate });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur d'analyse";
    if (msg === "The user aborted a request." || msg.includes("abort")) {
      return NextResponse.json(
        { error: "Analyse trop longue, réessayez avec moins de photos." },
        { status: 408 },
      );
    }
    const status =
      msg.includes("rate") || msg.includes("quota") || msg.includes("429")
        ? 429
        : 502;
    return NextResponse.json({ error: msg }, { status });
  }
}
