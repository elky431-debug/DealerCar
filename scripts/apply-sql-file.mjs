#!/usr/bin/env node
/**
 * Exécute un fichier SQL sur Supabase (DATABASE_URL dans .env.local).
 * Ex. : node scripts/apply-sql-file.mjs supabase/migration-v9.sql
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { config as loadEnv } from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
loadEnv({ path: join(root, ".env.local") });

const rel = process.argv[2];
if (!rel) {
  console.error("Usage: node scripts/apply-sql-file.mjs <chemin-sql-depuis-racine>");
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL manquant dans .env.local");
  process.exit(1);
}

const path = join(root, rel);
if (!existsSync(path)) {
  console.error(`❌ Fichier introuvable : ${rel}`);
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  const sql = readFileSync(path, "utf-8");
  console.log(`→ ${rel}…`);
  await client.query(sql);
  console.log("✓ OK\n");
} catch (e) {
  console.error("❌", e.message);
  process.exit(1);
} finally {
  await client.end();
}
