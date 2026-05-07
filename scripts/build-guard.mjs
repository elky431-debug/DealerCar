#!/usr/bin/env node
/**
 * BUILD GUARD — exécuté avant `npm run build`.
 *
 * Refuse de lancer un `next build` si un `next dev` est en cours sur le projet.
 * Cause connue de cache .next corrompu + Tailwind cassé après coup.
 *
 * Pour forcer quand même : variable d'env ALLOW_PARALLEL=1
 */

import { execSync } from "node:child_process";

if (process.env.ALLOW_PARALLEL === "1") process.exit(0);

let devRunning = false;
try {
  const out = execSync(
    "ps -axo pid=,command= | grep -E '(/\\.bin/next dev|next-server)' | grep -v grep | grep -v build-guard",
    { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] },
  );
  if (out.trim().length > 0) devRunning = true;
} catch {
  /* aucun process trouvé = OK */
}

if (devRunning) {
  console.error("\n❌ BUILD BLOQUÉ : un `next dev` tourne déjà.");
  console.error("");
  console.error("   Lancer `next build` en parallèle d'un `next dev` corrompt");
  console.error("   le cache .next (Tailwind ne charge plus, pages cassées).");
  console.error("");
  console.error("   Solutions :");
  console.error("   • Arrête le dev (Ctrl+C dans son terminal)");
  console.error("   • Ou : npm run dev:stop && npm run build");
  console.error("   • Ou (à tes risques) : ALLOW_PARALLEL=1 npm run build");
  console.error("");
  process.exit(1);
}
