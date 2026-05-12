import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

const FILENAME = "CLAUDE-CONTEXTE-PROJET-DEALERLINK.md";

/**
 * Téléchargement du dossier de contexte projet (pour Claude, etc.).
 * Fichier source à la racine du dépôt.
 */
export async function GET() {
  try {
    const path = join(process.cwd(), FILENAME);
    const body = readFileSync(path, "utf-8");
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${FILENAME}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Fichier de documentation introuvable sur ce déploiement.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
