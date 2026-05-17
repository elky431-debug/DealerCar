#!/usr/bin/env node
/**
 * DEV GUARD — exécuté automatiquement avant `npm run dev`.
 *
 * Empêche les bugs récurrents de cache .next corrompu / multiples dev servers
 * qui causent des pages non-stylées (Tailwind cassé) ou des erreurs aléatoires.
 *
 * Actions :
 *   1. Tue TOUS les `next dev` / `next-server` / `next build` en cours.
 *   2. Libère le port dev (3000) + 3001-3005 si encore occupés.
 *   3. Détecte les caches .next incohérents (pas de manifests, mtime ancien…)
 *      et propose / force un reset.
 *
 * Lancement manuel : node scripts/dev-guard.mjs [--clean] [--silent]
 *   --clean   : supprime aussi .next inconditionnellement
 *   --silent  : pas de logs si tout est OK
 */

import { execSync } from "node:child_process";
import { existsSync, rmSync, statSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DEV_PORT } from "./dev-port.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const nextDir = join(root, ".next");

const args = new Set(process.argv.slice(2));
const FORCE_CLEAN = args.has("--clean");
const SILENT = args.has("--silent");

const log = (...a) => !SILENT && console.log(...a);
const warn = (...a) => console.warn(...a);
const isWin = process.platform === "win32";

/* ────────── 1. Kill rogue Next processes ────────── */

function killNextProcesses() {
  if (isWin) {
    /* Windows : pas de `ps`/`grep` fiables en shell par défaut — on s’appuie sur freePorts() */
    return;
  }
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

/* ────────── 2. Free dev port + 3000-3005 ────────── */

function pidsListeningOnPortWindows(port) {
  const pids = new Set();
  try {
    const out = execSync("netstat -ano", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const needle = `:${port}`;
    for (const line of out.split("\n")) {
      if (!line.includes("LISTENING") || !line.includes(needle)) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parseInt(parts[parts.length - 1], 10);
      if (pid > 0) pids.add(pid);
    }
  } catch {
    /* netstat indisponible */
  }
  return [...pids];
}

function freePorts() {
  let freed = 0;
  const ports = [DEV_PORT, 3000, 3001, 3002, 3003, 3004, 3005];

  if (isWin) {
    for (const port of ports) {
      for (const pid of pidsListeningOnPortWindows(port)) {
        try {
          execSync(`taskkill /F /PID ${pid}`, {
            stdio: ["ignore", "ignore", "ignore"],
            windowsHide: true,
          });
          freed++;
        } catch {
          /* process déjà mort ou accès refusé */
        }
      }
    }
    if (freed > 0) log(`✓ ${freed} processus Windows libérant le(s) port(s) dev + 3000-3005`);
    return;
  }

  for (const port of ports) {
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

/* ────────── Run ────────── */

log("→ Dev guard…");

try {
  killNextProcesses();
  freePorts();

  const reason = isCacheSuspect();
  if (FORCE_CLEAN || reason) {
    if (reason) log(`⚠ ${reason} → reset`);
    cleanNext();
  }
} catch (e) {
  warn("⚠ dev-guard (ignoré, le serveur peut quand même démarrer) :", e?.message ?? e);
}

log("✓ Prêt pour next dev\n");
