#!/usr/bin/env node
/**
 * DEV GUARD — exécuté automatiquement avant `npm run dev`.
 *
 * Empêche les bugs récurrents de cache .next corrompu / multiples dev servers
 * qui causent des pages non-stylées (Tailwind cassé) ou des erreurs aléatoires.
 *
 * Actions :
 *   1. Tue TOUS les `next dev` / `next-server` / `next build` en cours.
 *   2. Libère les ports 3000-3005 si encore occupés.
 *   3. Détecte les caches .next incohérents (pas de manifests, mtime ancien…)
 *      et propose / force un reset.
 *
 * Lancement manuel : node scripts/dev-guard.mjs [--clean] [--silent]
 *   --clean   : supprime aussi .next inconditionnellement
 *   --silent  : pas de logs si tout est OK
 */

import { execSync } from "node:child_process";
import { existsSync, rmSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const nextDir = join(root, ".next");

const args = new Set(process.argv.slice(2));
const FORCE_CLEAN = args.has("--clean");
const SILENT = args.has("--silent");

const log = (...a) => !SILENT && console.log(...a);
const warn = (...a) => console.warn(...a);

/* ────────── 1. Kill rogue Next processes ────────── */

function killNextProcesses() {
  // patterns à killer : `next dev`, `next-server`, `next build`, `next start`
  // On ne tue PAS le `dev-guard` lui-même.
  const myPid = process.pid;
  let killed = 0;
  try {
    const out = execSync(
      "ps -axo pid=,command= | grep -E '(/\\.bin/next|next dev|next-server|next build)' | grep -v grep | grep -v dev-guard",
      { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] },
    );
    const lines = out.trim().split("\n").filter(Boolean);
    for (const line of lines) {
      const pid = parseInt(line.trim().split(/\s+/)[0], 10);
      if (!pid || pid === myPid) continue;
      try {
        process.kill(pid, "SIGKILL");
        killed++;
      } catch {
        /* déjà mort */
      }
    }
  } catch {
    /* pas de match = rien à tuer */
  }
  if (killed > 0) log(`✓ ${killed} process Next.js tué(s)`);
}

/* ────────── 2. Free ports 3000-3005 ────────── */

function freePorts() {
  let freed = 0;
  for (const port of [3000, 3001, 3002, 3003, 3004, 3005]) {
    try {
      const out = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`, {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      if (out) {
        for (const pid of out.split("\n")) {
          try {
            process.kill(parseInt(pid, 10), "SIGKILL");
            freed++;
          } catch {}
        }
      }
    } catch {
      /* port libre */
    }
  }
  if (freed > 0) log(`✓ ${freed} port(s) libéré(s)`);
}

/* ────────── 3. Detect corrupt .next and clean if needed ────────── */

function isCacheSuspect() {
  if (!existsSync(nextDir)) return false; // pas de cache du tout = OK

  // Cas 1 : pas de routes-manifest = build/dev interrompu en cours
  const manifests = ["routes-manifest.json", "build-manifest.json"];
  const hasAny = manifests.some((m) => existsSync(join(nextDir, m)));
  if (!hasAny) {
    // S'il y a des chunks mais pas de manifest → corruption
    try {
      const subdirs = readdirSync(nextDir);
      if (subdirs.includes("static") || subdirs.includes("server")) {
        return "Cache .next sans manifest (build/dev interrompu)";
      }
    } catch {}
  }

  // Cas 2 : trace files très anciens (>72h) = potentiellement obsolète
  // (informatif uniquement, on ne nettoie pas pour ça)

  return false;
}

function cleanNext() {
  if (!existsSync(nextDir)) return;
  try {
    rmSync(nextDir, { recursive: true, force: true });
    log("✓ Cache .next supprimé");
  } catch (e) {
    warn("⚠ Impossible de supprimer .next :", e.message);
  }
}

/* ────────── 4. Supabase env ────────── */

function isPlaceholder(value) {
  const v = value?.trim() ?? "";
  if (!v) return true;
  return (
    /^https:\/\/x+\.supabase\.co$/i.test(v) ||
    /^eyJhbGciOi\.\.\.$/i.test(v) ||
    /^your[-_]/i.test(v) ||
    /^xxx/i.test(v)
  );
}

function assertSupabaseEnv() {
  const envLocal = join(root, ".env.local");
  if (existsSync(envLocal)) {
    loadEnv({ path: envLocal, quiet: true });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!existsSync(envLocal)) {
    console.error("\n❌ Fichier .env.local introuvable.\n");
    console.error("   cp .env.example .env.local");
    console.error("   Puis renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY");
    console.error("   (Supabase → Project Settings → API)\n");
    process.exit(1);
  }

  if (isPlaceholder(url) || isPlaceholder(key)) {
    console.error("\n❌ Variables Supabase manquantes ou encore aux valeurs d'exemple dans .env.local.\n");
    console.error("   NEXT_PUBLIC_SUPABASE_URL");
    console.error("   NEXT_PUBLIC_SUPABASE_ANON_KEY");
    console.error("\n   https://supabase.com/dashboard/project/_/settings/api\n");
    process.exit(1);
  }
}

/* ────────── Run ────────── */

log("→ Dev guard…");

assertSupabaseEnv();

killNextProcesses();
freePorts();

const reason = isCacheSuspect();
if (FORCE_CLEAN || reason) {
  if (reason) log(`⚠ ${reason} → reset`);
  cleanNext();
}

log("✓ Prêt pour next dev\n");
