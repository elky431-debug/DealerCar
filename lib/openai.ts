import OpenAI from "openai";

let client: OpenAI | null = null;

/**
 * Singleton du client OpenAI, lazy-instancié pour ne pas planter
 * au build si la clé n'est pas encore configurée.
 */
export function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY manquant. Ajoutez votre clé dans .env.local pour activer les fonctionnalités IA.",
    );
  }
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

/** Modèle utilisé pour vision (estimation, OCR) et chat (assistant). */
export const OPENAI_MODEL = "gpt-4o";

/**
 * Extrait un objet JSON d'une réponse qui pourrait contenir
 * du markdown (```json ... ```) ou du texte autour.
 */
export function parseJsonFromText<T = unknown>(raw: string): T {
  const stripped = raw
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  const payload = start >= 0 && end > start ? stripped.slice(start, end + 1) : stripped;
  return JSON.parse(payload) as T;
}
