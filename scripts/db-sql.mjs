#!/usr/bin/env node
/**
 * Exécute un fichier SQL sur Supabase.
 * Usage : npm run db:sql -- supabase/migration-v11.sql
 *
 * Essaie d'abord DATABASE_URL, puis le pooler Supabase (IPv4) si la connexion directe échoue.
 */

import dns from "node:dns";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import pg from "pg";

dns.setDefaultResultOrder("ipv4first");

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

loadEnv({ path: join(root, ".env.local") });

const fileArg = process.argv[2];
if (!fileArg) {
  console.error("Usage: npm run db:sql -- supabase/migration-v11.sql");
  process.exit(1);
}

const path = join(root, fileArg);
if (!existsSync(path)) {
  console.error(`❌ Fichier introuvable: ${fileArg}`);
  process.exit(1);
}

const sql = readFileSync(path, "utf-8");

function poolerUrls(baseUrl) {
  const u = new URL(baseUrl);
  const password = decodeURIComponent(u.password);
  const user = u.username;
  const database = u.pathname.replace(/^\//, "") || "postgres";

  // project ref depuis postgres user ou host db.<ref>.supabase.co
  let ref = user;
  if (user === "postgres") {
    const m = u.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
    if (m) ref = m[1];
  } else if (user.startsWith("postgres.")) {
    ref = user.slice("postgres.".length);
  }

  const regions = [
    "eu-west-1",
    "eu-west-2",
    "eu-west-3",
    "eu-central-1",
    "eu-central-2",
    "eu-north-1",
    "us-east-1",
  ];

  const urls = [baseUrl];
  for (const region of regions) {
    for (const port of [6543, 5432]) {
      urls.push(
        `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:${port}/${database}`,
      );
    }
  }
  return [...new Set(urls)];
}

async function runOn(connectionString, label) {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
  await client.connect();
  console.log(`→ Connexion OK (${label})`);
  console.log(`→ Exécution de ${fileArg}…`);
  await client.query(sql);
  await client.end();
  console.log(`✓ ${fileArg} appliqué`);
}

const base = process.env.DATABASE_URL;
if (!base) {
  console.error("❌ DATABASE_URL manquant dans .env.local");
  process.exit(1);
}

let lastError = null;
for (const url of poolerUrls(base)) {
  const label = url.includes("pooler") ? "pooler" : "direct";
  try {
    await runOn(url, label);
    process.exit(0);
  } catch (e) {
    lastError = e;
    const short = e.message?.split("\n")[0] ?? String(e);
    if (!short.includes("password authentication failed")) {
      console.warn(`⊘ ${label}: ${short}`);
    }
  }
}

console.error("❌ Impossible d'appliquer la migration.");
console.error(lastError?.message ?? "Erreur inconnue");
console.error("\nAppliquez manuellement supabase/migration-v11-columns-only.sql dans Supabase → SQL Editor");
process.exit(1);
