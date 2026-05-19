#!/usr/bin/env node
/**
 * Exécute un fichier SQL sur Supabase.
 * Usage : npm run db:sql -- supabase/migration-v11.sql
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

loadEnv({ path: join(root, ".env.local") });

const fileArg = process.argv[2];
if (!fileArg) {
  console.error("Usage: npm run db:sql -- supabase/migration-v11.sql");
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL manquant dans .env.local");
  process.exit(1);
}

const path = join(root, fileArg);
if (!existsSync(path)) {
  console.error(`❌ Fichier introuvable: ${fileArg}`);
  process.exit(1);
}

const sql = readFileSync(path, "utf-8");
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log(`→ Exécution de ${fileArg}…`);
  await client.query(sql);
  console.log(`✓ ${fileArg} appliqué`);
} catch (e) {
  console.error("❌ Erreur:", e.message);
  process.exit(1);
} finally {
  await client.end();
}
