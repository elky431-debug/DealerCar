# DealerLink — Dossier de contexte complet pour assistant IA

> Document généré pour décrire l’intégralité du dépôt **tel qu’il apparaît dans l’environnement de travail** (structure, stack, données, APIs, scripts).  
> **Ne pas y coller de secrets** : les clés réelles restent dans `.env.local` (non versionné).

---

## 1. Qu’est-ce que DealerLink ?

**DealerLink** est une application **SaaS B2B** pour **marchands automobiles** (concessionnaires / négociants). Elle couvre :

1. **Gestion interne** — inventaire stock et dépôt-vente, coûts, documents, clients / leads.  
2. **Réseau** — partage de véhicules entre marchands (`visibility: network`).  
3. **Recherche** — moteur de recherche (véhicules réseau, marché web via API externe, favoris).  
4. **Sourcing** — **consultation pré-achat** : wizard d’inspection guidée (10+ étapes) avec appels **IA** (OpenAI) sur photos / CT / châssis.  
5. **Gestion** — annonces, ventes, profil « Mon garage », fournisseurs (placeholder), documents admin.

Langue UI : principalement **français**.

---

## 2. Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | **Next.js 14** (App Router), **React 18** |
| Langage | **TypeScript** |
| Styles | **Tailwind CSS** + utilitaires (`clsx`, `tailwind-merge`) |
| Auth + BDD + fichiers | **Supabase** (Auth email, Postgres, Row Level Security, Storage) |
| Client Supabase | `@supabase/supabase-js`, `@supabase/ssr` (cookies serveur) |
| Formulaires | **react-hook-form** + **zod** (`@hookform/resolvers`) |
| IA | **OpenAI** (SDK `openai`) — estimation réparations, OCR carte grise, analyse CT/châssis, assistant chat |
| Marché web | **Carapis** (clé `CARAPIS_API_KEY`) — annonces externes |
| Données référentielles CO₂ | **ADEME** — import possible via script `import:ademe` |

---

## 3. Arborescence utile du dépôt

```
/workspace (racine du repo)
├── app/
│   ├── layout.tsx                 # Layout racine
│   ├── page.tsx                   # Landing ou redirection si connecté
│   ├── not-found.tsx
│   ├── (auth)/                    # Pages publiques auth
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (app)/                     # Zone authentifiée (sidebar AppShell)
│       ├── layout.tsx             # createClient + getUser + profil → AppShell
│       ├── account/page.tsx
│       ├── dashboard/page.tsx
│       ├── garage/                # Stock & clients
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── vehicules/...
│       │   ├── depots/page.tsx
│       │   └── clients/page.tsx
│       ├── gestion/               # Back-office
│       │   ├── layout.tsx, gestion-tabs.tsx, page.tsx
│       │   ├── annonces/, documents/, frais/, garage/, sourcing/, ventes/
│       ├── recherche/             # Réseau, marché, favoris
│       │   ├── layout.tsx, page.tsx
│       │   ├── reseau/, marche/, favoris/
│       └── sourcing/inspections/  # Pré-achat
│           ├── page.tsx
│           └── [id]/ + wizard, steps, modales IA
├── app/api/                       # Routes API (voir section 8)
├── components/                    # UI réutilisable (voir section 9)
├── lib/
│   ├── supabase/client.ts, server.ts, middleware.ts
│   ├── types.ts                   # Modèles TS + labels FR
│   ├── validators.ts              # Schémas zod (véhicule, lead, profil…)
│   ├── nav.ts                     # NAV + isItemActive
│   ├── utils.ts                   # cn, formatPrice, publicImageUrl, dealerBrandingPublicUrl…
│   ├── openai.ts, carapis.ts, vehicle-specs.ts, inspection-steps.ts
│   └── use-theme.ts, use-debounced.ts
├── supabase/
│   ├── schema.sql                 # Schéma « from scratch » + RLS + buckets de base
│   ├── storage-setup.sql          # Buckets + policies (idempotent)
│   ├── migration-v2.sql … v6.sql, migration-v9.sql
├── scripts/
│   ├── dev-guard.mjs              # predev : tue next parasites, libère ports 3000–3005
│   ├── build-guard.mjs            # évite build en parallèle de next dev
│   ├── db-setup.mjs               # Exécute SQL sur DATABASE_URL (setup + migrations)
│   ├── apply-sql-file.mjs         # npm run db:sql -- <fichier.sql>
│   └── import-ademe.mjs
├── middleware.ts                  # updateSession Supabase
├── next.config.js                 # images.remotePatterns Supabase (*.supabase.co + host env)
├── tailwind.config.ts, postcss.config.js, tsconfig.json
├── package.json
├── .env.example                   # Modèle variables (sans secrets)
├── README.md
└── demarrer-serveur-local.bat     # Windows : npm install + npm run dev
```

**Fichiers TypeScript/React** : environ **130+** fichiers `.ts` / `.tsx` / `.js` / `.mjs` sous `app/`, `components/`, `lib/`, `scripts/`.

---

## 4. Variables d’environnement

Fichier modèle : **`.env.example`**.

| Variable | Rôle |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL projet Supabase (sans slash final de préférence ; le code normalise) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon (client + middleware) |
| `SUPABASE_SERVICE_ROLE_KEY` | Optionnel — scripts admin **uniquement serveur**, jamais exposée |
| `OPENAI_API_KEY` | GPT — réparations, OCR, assistant, analyses inspection |
| `CARAPIS_API_KEY` | Recherche annonces web (marché) |
| `DATABASE_URL` | URI Postgres Supabase — **requis pour** `npm run db:setup` et `npm run db:sql` (pas obligatoire pour `next dev` si schéma déjà appliqué dans le cloud) |

---

## 5. Scripts npm (`package.json`)

| Script | Description |
|--------|-------------|
| `npm run dev` | **`next dev -H 0.0.0.0 -p 3001`** — serveur local sur le **port 3001** |
| `predev` | `dev-guard.mjs` (nettoyage process / ports) |
| `npm run dev:fresh` | Guard + clean optionnel puis dev |
| `npm run dev:stop` | Guard silencieux |
| `npm run build` / `start` | Production |
| `npm run lint` / `typecheck` | Qualité |
| `npm run db:setup` | Enchaîne `storage-setup.sql` + `migration-v2` … `v6` + **`migration-v9`** via `pg` + `DATABASE_URL` |
| `npm run db:sql -- supabase/migration-v9.sql` | Applique un seul fichier SQL |
| `npm run import:ademe` | Import données ADEME (référentiel specs) |

---

## 6. Authentification et middleware

- **`middleware.ts`** : appelle `updateSession` depuis **`lib/supabase/middleware.ts`** (rafraîchissement session, cookies).
- **`app/(app)/layout.tsx`** : si pas d’utilisateur → `redirect("/login")` ; charge **`profiles`** pour la sidebar.
- Pages **`(auth)/`** : login / register avec composants formulaire dédiés.

---

## 7. Base de données Supabase (conceptuel)

### 7.1 Fichiers SQL

- **`supabase/schema.sql`** : création initiale (tables principales, RLS, triggers `updated_at`, trigger `handle_new_user` sur `auth.users`, buckets `vehicle-images` public et `vehicle-documents` privé).
- **`supabase/storage-setup.sql`** : buckets + policies (ré-exécutable).
- **Migrations additives** (à lancer après `schema.sql` sur un projet vierge, ou via `db:setup`) :

| Fichier | Contenu principal |
|---------|-------------------|
| `migration-v2.sql` | Colonnes dépôt client sur `vehicles`, table **`vehicle_documents`**, bucket documents, extensions catégories |
| `migration-v3.sql` | Champs vente / annonce sur `vehicles` (`purchase_price`, `sold_at`, `listing_title`, flags photos_ok…), profil `siret` / `specialties`, catégories documents admin |
| `migration-v4.sql` | Table **`vehicle_costs`** (frais manuels ou estimation IA) |
| `migration-v5.sql` | Table **`vehicle_specs`** (référentiel ADEME Car Labelling) |
| `migration-v6.sql` | Table **`vehicle_inspections`** (pré-achat, `steps_state` jsonb) |
| `migration-v9.sql` | Profil concession : `logo_storage_path`, `banner_storage_path`, `tagline`, URLs web + réseaux ; bucket **`dealer-branding`** + policies RLS |

> Sur un dépôt déjà migré manuellement dans Supabase, **ne pas dupliquer aveuglément** : les scripts utilisent `IF NOT EXISTS` / `on conflict` là où c’est prévu.

### 7.2 Tables (noms logiques)

- **`profiles`** — 1 ligne par utilisateur auth ; entreprise, contact, options branding (v9), etc.  
- **`vehicles`** — véhicules du marchand ; `type` stock/depot, `visibility` private/network, `status` available/reserved/sold.  
- **`vehicle_images`** — chemins storage publics (`vehicle-images/{userId}/...`).  
- **`vehicle_documents`** — fichiers privés (`vehicle-documents`).  
- **`vehicle_leads`** — prospects liés à un véhicule.  
- **`favorites`** — paires dealer / véhicule réseau sauvegardés.  
- **`vehicle_costs`** — frais par véhicule.  
- **`vehicle_specs`** — référentiel technique / CO₂ (ADEME).  
- **`vehicle_inspections`** — consultations pré-achat.

Les détails de colonnes côté TypeScript sont alignés sur **`lib/types.ts`** (`Profile`, `Vehicle`, `Lead`, `VehicleCost`, `VehicleSpec`, `VehicleInspection`, etc.).

### 7.3 Storage (buckets)

| Bucket | Visibilité | Usage typique |
|--------|------------|----------------|
| `vehicle-images` | Public lecture | Photos annonces ; chemins préfixés par `auth.uid()` |
| `vehicle-documents` | Privé (RLS owner) | Carte grise, factures, médias atelier |
| `dealer-branding` | Public lecture (v9) | Logo + bannière profil concession (`{userId}/...`) |

URLs publiques construites dans **`lib/utils.ts`** : `publicImageUrl`, `dealerBrandingPublicUrl` (base URL Supabase **sans double slash**).

---

## 8. Routes API (`app/api/**/route.ts`)

| Route | Rôle court |
|-------|------------|
| `POST/GET` **`/api/assistant`** | Chat assistant marchand (OpenAI) |
| `POST` **`/api/estimate-repair`** | Estimation coût réparations à partir description |
| `POST` **`/api/ocr-carte-grise`** | OCR image carte grise → champs structurés |
| `GET/POST` **`/api/inspections`** | Liste / création inspections pré-achat |
| `GET/PATCH/DELETE` **`/api/inspections/[id]`** | Détail / mise à jour inspection |
| `POST` **`/api/inspections/ai/analyze-ct`** | Analyse photo contrôle technique |
| `POST` **`/api/inspections/ai/chassis-location`** | Localisation gravure châssis sur photo |
| `POST` **`/api/market-search`** | Proxy recherche Carapis (annonces web) |
| `GET` **`/api/vehicle-specs`** | Liste / filtres specs ADEME |
| `GET` **`/api/vehicle-specs/search`** | Recherche rapide pour autocomplete fiche véhicule |
| `GET` **`/api/vehicle-specs/[id]`** | Détail d’une fiche spec |

Les routes consomment **`createClient` serveur** ou accès service selon implémentation ; toujours vérifier les fichiers pour auth exacte.

---

## 9. Pages App Router (chemins utilisateur)

| Chemin | Thème |
|--------|--------|
| `/` | Landing ou redirection |
| `/login`, `/register` | Auth |
| `/dashboard` | Vue d’ensemble |
| `/garage`, `/garage/vehicules`, `/garage/vehicules/nouveau`, `/garage/vehicules/[id]`, `.../modifier` | Stock |
| `/garage/depots` | Dépôts-vente |
| `/garage/clients` | Clients / leads |
| `/recherche`, `/recherche/reseau`, `/recherche/marche`, `/recherche/favoris` | Découverte |
| `/sourcing/inspections`, `/sourcing/inspections/[id]` | Pré-achat |
| `/gestion/garage` | Profil entreprise + thème + branding (formulaire client) |
| `/gestion/frais`, `/gestion/annonces`, `/gestion/ventes`, `/gestion/documents`, `/gestion/sourcing` | Back-office |
| `/account` | Compte utilisateur |

La **navigation latérale** est définie dans **`lib/nav.ts`** (`NAV` : groupes Stock, Sourcing, Ventes, Business).

---

## 10. Composants notables (`components/`)

- **`app-shell.tsx`** — Layout principal, sidebar, header mobile, user menu.  
- **`sidebar-nav.tsx`** — Liens depuis `NAV`.  
- **`page-header.tsx`** — En-têtes de page (`PageHeader`, `PageBody`).  
- **`vehicle-form.tsx`**, **`vehicle-card.tsx`**, **`vehicle-gallery.tsx`**, **`vehicle-hero.tsx`**, **`vehicle-owner-actions.tsx`**, **`vehicle-price-card.tsx`** — Fiches et édition véhicules.  
- **`image-uploader.tsx`** — Upload images Supabase.  
- **`lead-form.tsx`**, **`lead-status-badge.tsx`** — CRM léger.  
- **`document-section.tsx`**, **`ocr-carte-grise-modal.tsx`**, **`repair-estimate-modal.tsx`** — Docs & IA.  
- **`assistant-widget.tsx`** — Assistant.  
- **`eco-specs-card.tsx`** — Affichage données ADEME si match.  
- **`theme-toggle.tsx`** — Thème clair/sombre/système.  
- **`components/ui/*`** — Primitives (Button, Input, Card, Toast, Modal, Tabs, Badge, Field, EmptyState…).

---

## 11. `next.config.js` (images)

- **`images.remotePatterns`** : hostname dérivé de `NEXT_PUBLIC_SUPABASE_URL` + motif **`*.supabase.co`** pour chemins `/storage/v1/object/public/**` et **`/storage/v1/object/sign/**`**.  
- Évite les erreurs **`next/image` unconfigured host** pour les assets Supabase.

---

## 12. Qualité / garde-fous

- **`scripts/build-guard.mjs`** : bloque `next build` si un `next dev` tourne (évite cache `.next` corrompu). Variable **`ALLOW_PARALLEL=1`** pour forcer.  
- **`scripts/dev-guard.mjs`** : avant `dev`, tue les anciens process Next et libère les ports **3000–3005** (le dev cible **3001** mais d’anciens process peuvent bloquer).

---

## 13. Internationalisation & contenu

- UI majoritairement en **français** (libellés, `validators`, `types` avec `*_LABELS`).  
- Pas de lib i18n type `next-intl` dans les dépendances listées : texte en dur ou constantes FR.

---

## 14. Git / branches (indicatif)

Le dépôt peut contenir plusieurs branches feature (`cursor/...`). Le contenu exact dépend du **merge / branche checkout** ; ce document reflète l’état **courant du workspace** au moment de la génération (liste des `page.tsx` / `route.ts` ci-dessus).

---

## 15. Limites de ce document

- **Ne remplace pas** la lecture du code pour le détail d’une fonction (signatures exactes, erreurs HTTP, RLS ligne par ligne).  
- **Secrets** : ne jamais coller `.env.local` dans un chat.  
- D’**autres branches** du même repo peuvent ajouter des routes (ex. carte, géocode, recherche clients) **non listées ici** si elles ne sont pas dans ce checkout.

---

## 16. Résumé en une phrase

**DealerLink** = Next.js 14 + Supabase + Tailwind pour gérer le stock automobile, le réseau entre marchands, la recherche (dont web Carapis), les leads, documents, coûts, annonces/ventes, et des **inspections pré-achat** enrichies par **OpenAI**, avec schéma SQL versionné et stockage fichier sur **Supabase Storage**.

---

*Fin du dossier — tu peux joindre ce fichier à Claude comme contexte projet.*
