#!/usr/bin/env node
/**
 * Import du dataset ADEME Car Labelling dans la table vehicle_specs.
 *
 * Usage :
 *   npm run import:ademe -- /chemin/vers/ADEME-CarLabelling.csv
 *
 * Ou avec le chemin par défaut (~/Downloads/ADEME-CarLabelling.csv) :
 *   npm run import:ademe
 *
 * Idempotent : la contrainte UNIQUE (brand, model_label, commercial_desc, fuel_type, power_max_kw)
 * fait qu'un réimport met juste à jour les champs (UPSERT).
 *
 * Prérequis : DATABASE_URL dans .env.local
 *             Migration v5 appliquée (npm run db:setup)
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { config as loadEnv } from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

loadEnv({ path: join(root, ".env.local") });

/* ────────── Args ────────── */

const argPath = process.argv[2];
const defaultPath = join(homedir(), "Downloads", "ADEME-CarLabelling.csv");
const csvPath = argPath ? resolve(argPath) : defaultPath;

const SOURCE_YEAR = Number(process.env.ADEME_SOURCE_YEAR) || new Date().getFullYear();
const BATCH_SIZE = 500;

/* ────────── Validation env ────────── */

if (!process.env.DATABASE_URL) {
  console.error("\n❌ Manque DATABASE_URL dans .env.local\n");
  process.exit(1);
}

if (!existsSync(csvPath)) {
  console.error(`\n❌ Fichier introuvable : ${csvPath}\n`);
  console.error("Usage : npm run import:ademe -- /chemin/vers/ADEME-CarLabelling.csv\n");
  process.exit(1);
}

/* ────────── Parser CSV (séparateur ; + decimal ,) ────────── */

/** Parse une ligne CSV en respectant les guillemets. */
function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      // double quote escape "" → "
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ";" && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

/** "9,020" → 9.02   ""→ null   "abc" → null */
function num(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function int(v) {
  const n = num(v);
  return n === null ? null : Math.round(n);
}

function str(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s || null;
}

/** Nettoyage / normalisation marque (uppercase, accents conservés). */
function normalizeBrand(v) {
  if (!v) return null;
  return v.trim().toUpperCase().replace(/\s+/g, " ");
}

/* ────────── Lecture du CSV ────────── */

console.log(`→ Lecture de ${csvPath}…`);

let raw = readFileSync(csvPath, "utf-8");
// strip BOM si présent
if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);

const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
if (lines.length < 2) {
  console.error("❌ CSV vide ou invalide");
  process.exit(1);
}

const header = parseCsvLine(lines[0]);
console.log(`✓ ${lines.length - 1} lignes, ${header.length} colonnes\n`);

// Mappage des colonnes ADEME → champs DB
const COLS = {
  brand: header.indexOf("Marque"),
  model_label: header.indexOf("Libellé modèle"),
  model_code: header.indexOf("Modèle"),
  group_name: header.indexOf("Groupe"),
  commercial_desc: header.indexOf("Description Commerciale"),
  fuel_type: header.indexOf("Energie"),
  body_type: header.indexOf("Carrosserie"),
  cylinder_cc: header.indexOf("Cylindrée"),
  range_segment: header.indexOf("Gamme"),
  fiscal_power: header.indexOf("Puissance fiscale"),
  power_max_kw: header.indexOf("Puissance maximale"),
  power_elec_kw: header.indexOf("Puissance nominale électrique"),
  weight_empty_kg: header.indexOf("Poids à vide"),
  gearbox_type: header.indexOf("Type de boite"),
  gear_count: header.indexOf("Nombre rapports"),
  conso_mixed_min: header.indexOf("Conso vitesse mixte Min"),
  conso_mixed_max: header.indexOf("Conso vitesse mixte Max"),
  conso_elec_min: header.indexOf("Conso elec Min"),
  conso_elec_max: header.indexOf("Conso elec Max"),
  autonomy_min_km: header.indexOf("Autonomie elec Min"),
  autonomy_max_km: header.indexOf("Autonomie elec Max"),
  co2_mixed_min: header.indexOf("CO2 vitesse mixte Min"),
  co2_mixed_max: header.indexOf("CO2 vitesse mixte Max"),
  bonus_malus_label: header.indexOf("Bonus-Malus"),
  bonus_malus_amount: header.indexOf("Barème Bonus-Malus"),
  vehicle_price_eur: header.indexOf("Prix véhicule"),
};

// Vérification que toutes les colonnes requises existent
const missing = Object.entries(COLS)
  .filter(([, idx]) => idx === -1)
  .map(([k]) => k);
if (missing.length > 0) {
  console.error(`❌ Colonnes manquantes dans le CSV : ${missing.join(", ")}`);
  process.exit(1);
}

/* ────────── Transformation des lignes ────────── */

const rows = [];
const errors = [];

for (let i = 1; i < lines.length; i++) {
  const cells = parseCsvLine(lines[i]);
  try {
    const brand = normalizeBrand(cells[COLS.brand]);
    const model_label = str(cells[COLS.model_label]);
    const commercial_desc = str(cells[COLS.commercial_desc]);
    const fuel_type = str(cells[COLS.fuel_type])?.toUpperCase() ?? null;

    // Filtre : on a besoin d'au moins ces 4 champs pour matcher
    if (!brand || !model_label || !commercial_desc || !fuel_type) {
      errors.push({ line: i + 1, reason: "champs requis manquants" });
      continue;
    }

    rows.push({
      brand,
      model_label: model_label.toUpperCase(),
      model_code: str(cells[COLS.model_code]),
      commercial_desc,
      group_name: str(cells[COLS.group_name]),
      fuel_type,
      body_type: str(cells[COLS.body_type]),
      range_segment: str(cells[COLS.range_segment]),
      cylinder_cc: int(cells[COLS.cylinder_cc]),
      fiscal_power: int(cells[COLS.fiscal_power]),
      power_max_kw: num(cells[COLS.power_max_kw]),
      power_elec_kw: num(cells[COLS.power_elec_kw]),
      weight_empty_kg: int(cells[COLS.weight_empty_kg]),
      gearbox_type: str(cells[COLS.gearbox_type]),
      gear_count: int(cells[COLS.gear_count]),
      conso_mixed_min: num(cells[COLS.conso_mixed_min]),
      conso_mixed_max: num(cells[COLS.conso_mixed_max]),
      conso_elec_min: num(cells[COLS.conso_elec_min]),
      conso_elec_max: num(cells[COLS.conso_elec_max]),
      autonomy_min_km: int(cells[COLS.autonomy_min_km]),
      autonomy_max_km: int(cells[COLS.autonomy_max_km]),
      co2_mixed_min: num(cells[COLS.co2_mixed_min]),
      co2_mixed_max: num(cells[COLS.co2_mixed_max]),
      bonus_malus_label: str(cells[COLS.bonus_malus_label]),
      bonus_malus_amount: int(cells[COLS.bonus_malus_amount]),
      vehicle_price_eur: int(cells[COLS.vehicle_price_eur]),
      source_year: SOURCE_YEAR,
    });
  } catch (e) {
    errors.push({ line: i + 1, reason: e.message });
  }
}

console.log(`✓ ${rows.length} lignes valides`);
if (errors.length > 0) console.log(`⚠ ${errors.length} lignes ignorées (champs manquants)`);

/* ────────── Dédoublonnage sur la clé UNIQUE ────────── */
// Postgres refuse "ON CONFLICT DO UPDATE" si 2 lignes du même batch ont la même clé.
// On garde la dernière occurrence (souvent la plus complète).

const seen = new Map();
for (const row of rows) {
  const key = [
    row.brand,
    row.model_label,
    row.commercial_desc,
    row.fuel_type,
    row.power_max_kw ?? "",
  ].join("|");
  seen.set(key, row);
}
const dedupCount = rows.length - seen.size;
const uniqueRows = [...seen.values()];
if (dedupCount > 0) console.log(`⚠ ${dedupCount} doublons fusionnés (même marque+modèle+desc+énergie+puissance)`);
console.log(`→ ${uniqueRows.length} lignes uniques à importer\n`);

/* ────────── Bulk UPSERT par batchs ────────── */

const FIELDS = [
  "brand",
  "model_label",
  "model_code",
  "commercial_desc",
  "group_name",
  "fuel_type",
  "body_type",
  "range_segment",
  "cylinder_cc",
  "fiscal_power",
  "power_max_kw",
  "power_elec_kw",
  "weight_empty_kg",
  "gearbox_type",
  "gear_count",
  "conso_mixed_min",
  "conso_mixed_max",
  "conso_elec_min",
  "conso_elec_max",
  "autonomy_min_km",
  "autonomy_max_km",
  "co2_mixed_min",
  "co2_mixed_max",
  "bonus_malus_label",
  "bonus_malus_amount",
  "vehicle_price_eur",
  "source_year",
];

// Champs à mettre à jour en cas de conflit (tout sauf les colonnes de la contrainte unique)
const UPDATE_FIELDS = FIELDS.filter(
  (f) =>
    !["brand", "model_label", "commercial_desc", "fuel_type", "power_max_kw"].includes(f),
);

function buildBatchInsertQuery(batch) {
  const cols = FIELDS.join(", ");
  const placeholders = [];
  const params = [];
  let p = 1;
  for (const row of batch) {
    const slots = [];
    for (const f of FIELDS) {
      slots.push(`$${p++}`);
      params.push(row[f] ?? null);
    }
    placeholders.push(`(${slots.join(", ")})`);
  }
  const setClause = UPDATE_FIELDS.map((f) => `${f} = EXCLUDED.${f}`).join(", ");
  const sql = `
    INSERT INTO public.vehicle_specs (${cols})
    VALUES ${placeholders.join(", ")}
    ON CONFLICT (brand, model_label, commercial_desc, fuel_type, power_max_kw)
    DO UPDATE SET ${setClause}
  `;
  return { sql, params };
}

/* ────────── Connexion + import ────────── */

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  console.log("\n→ Connexion à la base…");
  await client.connect();
  console.log("✓ Connecté\n");

  // Vérifie que la table existe
  const check = await client.query(
    "select to_regclass('public.vehicle_specs') as t",
  );
  if (!check.rows[0].t) {
    console.error("❌ Table vehicle_specs introuvable. Lance d'abord : npm run db:setup\n");
    process.exit(1);
  }

  let inserted = 0;
  const t0 = Date.now();
  for (let i = 0; i < uniqueRows.length; i += BATCH_SIZE) {
    const batch = uniqueRows.slice(i, i + BATCH_SIZE);
    const { sql, params } = buildBatchInsertQuery(batch);
    await client.query(sql, params);
    inserted += batch.length;
    process.stdout.write(`\r→ Import : ${inserted}/${uniqueRows.length}`);
  }
  process.stdout.write("\n");

  const { rows: stats } = await client.query(
    "select count(*)::int as total from public.vehicle_specs",
  );

  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n✅ ${inserted} lignes importées en ${dt}s`);
  console.log(`   Total dans la table : ${stats[0].total} fiches\n`);
} catch (e) {
  console.error("\n❌ Erreur :", e.message);
  if (e.detail) console.error("   Détail :", e.detail);
  process.exit(1);
} finally {
  await client.end();
}
