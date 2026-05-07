import { NextResponse } from "next/server";
import type { ChatCompletionContentPart } from "openai/resources/index.mjs";
import { OPENAI_MODEL, getOpenAIClient, parseJsonFromText } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 60;

type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

interface ImagePayload {
  base64: string;
  type: ImageMediaType;
}

export interface CtAnalysisResult {
  /** Date du contrôle technique extraite (ISO ou null). */
  date_controle: string | null;
  /** Date d'expiration / prochain CT. */
  date_validite: string | null;
  /** Kilométrage relevé sur le CT. */
  kilometrage: number | null;
  /** Verdict global. */
  verdict: "favorable" | "favorable_avec_defauts" | "defavorable" | "indetermine";
  /** Défauts détectés. */
  defauts_majeurs: string[];
  defauts_mineurs: string[];
  defauts_critiques: string[];
  /** Recommandation pratique. */
  recommandation: string;
  /** Niveau de confiance dans l'extraction. */
  niveau_confiance: "faible" | "moyen" | "élevé";
  /** Erreurs / image illisible. */
  avertissement: string | null;
}

const ALLOWED_TYPES = new Set<ImageMediaType>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/**
 * POST /api/inspections/ai/analyze-ct
 * Body : { images: [{ base64, type }] }
 *
 * Analyse une (ou plusieurs) photos d'un contrôle technique français
 * et retourne un verdict structuré.
 */
export async function POST(req: Request) {
  let body: { images?: ImagePayload[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const images = (body.images ?? []).filter(
    (i) => i?.base64 && ALLOWED_TYPES.has(i.type),
  );
  if (images.length === 0) {
    return NextResponse.json(
      { error: "Au moins une photo du contrôle technique est requise." },
      { status: 400 },
    );
  }
  if (images.length > 3) {
    return NextResponse.json({ error: "3 photos maximum." }, { status: 400 });
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

  const userContent: ChatCompletionContentPart[] = images.map((img) => ({
    type: "image_url",
    image_url: {
      url: `data:${img.type};base64,${img.base64}`,
      detail: "high",
    },
  }));

  userContent.push({
    type: "text",
    text: `Analyse ce(s) contrôle(s) technique(s) automobile français (modèle Sécurité Routière).

Retourne UNIQUEMENT ce JSON valide :
{
  "date_controle": string | null,            // ISO YYYY-MM-DD si lisible
  "date_validite": string | null,            // ISO YYYY-MM-DD si lisible
  "kilometrage": number | null,              // km relevés
  "verdict": "favorable" | "favorable_avec_defauts" | "defavorable" | "indetermine",
  "defauts_majeurs": string[],               // libellés courts (ex: "Plaquettes avant usées")
  "defauts_mineurs": string[],
  "defauts_critiques": string[],             // contre-visite obligatoire
  "recommandation": string,                  // 1-2 phrases pour l'acheteur
  "niveau_confiance": "faible" | "moyen" | "élevé",
  "avertissement": string | null             // si image floue, illisible, etc.
}

Règles :
- N'invente RIEN. Si une info n'est pas lisible, mets null et baisse niveau_confiance.
- Si la photo n'est PAS un contrôle technique, mets verdict="indetermine" et explique dans avertissement.
- Recommandation orientée acheteur : "OK pour acheter", "À renégocier", "À éviter sans réparations".`,
  });

  try {
    const response = await client.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: 1200,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Tu es expert en lecture de procès-verbaux de contrôle technique automobile français. " +
            "Tu retournes UNIQUEMENT du JSON valide, sans texte autour.",
        },
        { role: "user", content: userContent },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim();
    if (!text) {
      return NextResponse.json({ error: "Réponse IA vide." }, { status: 502 });
    }

    const result = parseJsonFromText<CtAnalysisResult>(text);
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
