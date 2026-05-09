#!/usr/bin/env node
/**
 * Diagnostic rapide quand localhost:3000 refuse la connexion (Windows / Mac / Linux).
 * Usage : npm run doctor
 */

import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

console.log("\n=== DealerLink — diagnostic local ===\n");
console.log("Dossier du script :", root);
console.log("process.cwd()      :", process.cwd());
console.log("Node.js            :", process.version);
console.log("Plateforme         :", process.platform);

if (!existsSync(join(root, "package.json"))) {
  console.error("\n[ERREUR] Pas de package.json ici. Lancez depuis la racine du projet DealerLink.\n");
  process.exit(1);
}

if (process.cwd() !== root) {
  console.warn(
    "\n[ATTENTION] Vous n'êtes peut‑être pas dans le dossier du projet.\n" +
      "  Faites : cd vers le dossier qui contient package.json puis npm run dev\n",
  );
}

function tryListen(port, host) {
  return new Promise((resolve) => {
    const s = createServer();
    s.once("error", (err) => resolve({ ok: false, err: err.message }));
    s.listen(port, host, () => {
      s.close(() => resolve({ ok: true }));
    });
  });
}

const r3000 = await tryListen(3000, "0.0.0.0");
if (r3000.ok) {
  console.log("\nPort 3000 : OK (un serveur peut écouter ici).");
} else {
  console.error("\nPort 3000 : BLOQUÉ ou déjà utilisé —", r3000.err);
  console.error("  → Fermez l’autre programme ou lancez : npm run dev:3001\n");
}

console.log(`
Étapes si le navigateur affiche ERR_CONNECTION_REFUSED :

1) Ne pas copier "C:\\\\chemin\\\\vers\\\\DealerCar" — c’est un EXEMPLE.
   Utilisez le VRAI chemin du dossier cloné (celui qui contient package.json).

2) Dans CE dossier, dans un terminal :
     npm install
     npm run dev:quick

   ^ dev:quick demarre Next SANS l'etape "predev" ^(moins de blocages sous Windows^).
   Alternative : npm run dev ^(avec nettoyage des ports avant^).

3) Attendez "Ready" puis ouvrez :
     http://127.0.0.1:3000
   (ou http://localhost:3000)

4) Laissez le terminal OUVERT tant que vous testez le site.

5) Double-clic possible : demarrer-serveur-local.bat (dans le dossier du projet).
`);
