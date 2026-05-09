#!/usr/bin/env node
/**
 * Diagnostic quand le navigateur refuse la connexion au serveur local.
 * Usage : npm run doctor
 */

import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DEV_PORT } from "./dev-port.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

console.log("\n=== DealerLink — diagnostic local ===\n");
console.log("Dossier du script :", root);
console.log("process.cwd()      :", process.cwd());
console.log("Node.js            :", process.version);
console.log("Plateforme         :", process.platform);
console.log("Port dev attendu   :", DEV_PORT, "(npm run dev / dev:quick)");

if (!existsSync(join(root, "package.json"))) {
  console.error("\n[ERREUR] Pas de package.json ici. Lancez depuis la racine du projet DealerLink.\n");
  process.exit(1);
}

if (process.cwd() !== root) {
  console.warn(
    "\n[ATTENTION] Vous n'êtes peut‑être pas dans le dossier du projet.\n" +
      "  Faites : cd vers le dossier qui contient package.json puis npm run dev:quick\n",
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

const rDev = await tryListen(DEV_PORT, "0.0.0.0");
if (rDev.ok) {
  console.log(`\nPort ${DEV_PORT} : OK (Next peut écouter ici).`);
} else {
  console.error(`\nPort ${DEV_PORT} : BLOQUÉ ou déjà utilisé —`, rDev.err);
  console.error(`  → Fermez l’autre programme ou lancez : npm run dev:3000 (port 3000)\n`);
}

console.log(`
Étapes si ERR_CONNECTION_REFUSED :

1) Utilisez le VRAI dossier du projet (celui qui contient package.json).

2) Dans ce dossier :
     npm install
     npm run dev:quick

   (dev:quick = sans étape predev, plus fiable sous Windows)

3) Attendez "Ready" puis ouvrez :
     http://127.0.0.1:${DEV_PORT}

4) Gardez le terminal OUVERT.

5) Double-clic : demarrer-serveur-local.bat

6) Si le port ${DEV_PORT} pose problème : npm run dev:3000 puis http://127.0.0.1:3000
`);
