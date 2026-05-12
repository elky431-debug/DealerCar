#!/usr/bin/env node
/**
 * Setup Storage (buckets + policies) sur Supabase, migrations SQL utiles (dont dealer-branding v9).
 *
 * Prérequis : DATABASE_URL dans .env.local
 * Récupère-la dans Supabase → Project Settings → Database → Connection String → URI
 *
 * Utilisation : npm run db:setup
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { config as loadEnv } from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

loadEnv({ path: join(root, ".env.local") });

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("\n❌ Manque DATABASE_URL dans .env.local\n");
  console.error("Comment l'obtenir :");
  console.error("  1. Supabase → Project Settings → Database");
  console.error("  2. Section « Connection string »");
  console.error("  3. Onglet « URI » + mode « Direct connection » ou « Session pooler »");
  console.error("  4. Copier la chaîne (de la forme postgresql://postgres:...@...supabase.co:5432/postgres)");
  console.error("  5. Ajouter dans .env.local :\n");
  console.error("     DATABASE_URL=postgresql://...\n");
  process.exit(1);
}

const sqlFiles = [
  "supabase/storage-setup.sql",
  "supabase/migration-v2.sql",
  "supabase/migration-v3.sql",
  "supabase/migration-v4.sql",
  "supabase/migration-v5.sql",
  "supabase/migration-v6.sql",
  "supabase/migration-v9.sql",
  "supabase/migration-v10.sql",
];

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  console.log("→ Connexion à la base Supabase…");
  await client.connect();
  console.log("✓ Connecté\n");

  for (const file of sqlFiles) {
    const path = join(root, file);
    if (!existsSync(path)) {
      console.log(`⊘ ${file} introuvable, ignoré`);
      continue;
    }
    const sql = readFileSync(path, "utf-8");
    console.log(`→ Exécution de ${file}…`);
    await client.query(sql);
    console.log(`✓ ${file} appliqué\n`);
  }

  // Vérification finale
  const { rows } = await client.query(
    `select id, public from storage.buckets where id in ('vehicle-images','vehicle-documents','dealer-branding') order by id`,
  );
  console.log("Buckets en place :");
  for (const row of rows) {
    console.log(`  • ${row.id} (public: ${row.public})`);
  }

  console.log("\n✅ Setup terminé. Tu peux uploader des images / documents.\n");
} catch (e) {
  console.error("\n❌ Erreur :", e.message);
  if (e.message?.includes("password authentication failed")) {
    console.error("→ DATABASE_URL incorrect (mauvais mot de passe)");
  } else if (e.message?.includes("ENOTFOUND") || e.message?.includes("ETIMEDOUT")) {
    console.error("→ Hôte introuvable. Vérifie ta DATABASE_URL.");
  }
  process.exit(1);
} finally {
  await client.end();
}
